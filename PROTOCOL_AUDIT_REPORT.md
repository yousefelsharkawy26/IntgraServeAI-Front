# IntegraServe AI — Protocol Compatibility Audit Report

## PHASE 1: Complete Protocol Map

### Backend Architecture

| Component | File | Responsibility |
|-----------|------|---------------|
| WebSocket endpoint | `apis/v1/chat.py:130` | Accept connections, dispatch messages |
| Agent runner | `ai_engine/agent_runner.py` | Stream LLM responses, execute tools, emit events |
| Action engine | `ai_engine/action_engine.py` | Build LangChain tools, execute API/internal/vector/RPC actions |
| AI gateway | `services/ai_gateway_service.py` | Bridge between FastAPI and AI engine, manage state |
| State persistence | `services/ai_gateway_service.py` | Save/load/clear pending state in `ChatConversation.pending_state` |

### Client → Server Messages

| # | Message | Payload | Backend Handler | Response |
|---|---------|---------|-----------------|----------|
| 1 | Handshake | `{ session_id, customer_email, customer_name }` | `chat_websocket()` init | `connected` |
| 2 | `chat` | `{ type: "chat", content }` | `msg_type == "chat"` | `token*`, `tool_start`, `tool_end`, `pause`, `done` |
| 3 | `generate` | `{ type: "generate", content }` | `msg_type == "generate"` | Same as `chat` |
| 4 | `stop` | `{ type: "stop" }` | `msg_type == "stop"` | `stopped` |
| 5 | `edit` | `{ type: "edit", message_id, content }` | `msg_type == "edit"` | `edit_successful` + new stream |
| 6 | `confirm` | `{ type: "confirm", approved }` | `msg_type == "confirm"` | `tool_input_required` OR resume stream |
| 7 | `tool_result` | `{ type: "tool_result", tool_call_id, result }` | `msg_type == "tool_result"` | Resume stream → `tool_end` → `done` |
| 8 | `end` | `{ type: "end" }` | `msg_type == "end"` | `ended` + close |

### Server → Client Events

| # | Event | Payload | Emitted By | Consumed By |
|---|-------|---------|-----------|-------------|
| 1 | `connected` | `{ type, conversation_id }` | `chat_websocket()` | `useChatWebSocket` |
| 2 | `token` | `{ type, content, correlation_id }` | `agent_runner.py:130` | `useChatWebSocket` |
| 3 | `tool_start` | `{ type, name, args, correlation_id }` | `agent_runner.py:130` | `useChatWebSocket` |
| 4 | `tool_end` | `{ type, name, result, correlation_id }` | `agent_runner.py:155` | `useChatWebSocket` |
| 5 | `tool_error` | `{ type, name, error, correlation_id }` | `agent_runner.py:170` | `useChatWebSocket` |
| 6 | `pause` | `{ type, reason, action_name, params, tool_call_id, correlation_id }` | `agent_runner.py:120` | `useChatWebSocket` |
| 7 | `done` | `{ type, correlation_id }` | `agent_runner.py:110` | `useChatWebSocket` |
| 8 | `error` | `{ type, message }` | `chat_websocket()`, `run_ai_stream()` | `useChatWebSocket` |
| 9 | `stopped` | `{ type }` | `chat_websocket()` stop handler | `useChatWebSocket` |
| 10 | `edit_successful` | `{ type }` | `chat_websocket()` edit handler | `useChatWebSocket` |
| 11 | `ended` | `{ type }` | `chat_websocket()` end handler | `useChatWebSocket` |
| 12 | `tool_input_required` | `{ type, action_name, tool_call_id, params }` | `chat_websocket()` confirm handler | `useChatWebSocket` |

### Internal Fields (Stripped Before Sending)

| Field | Stripped By | Reason |
|-------|------------|--------|
| `_resume_state` | `chat_websocket()` line: `ws_event = {k: v for k, v in event.items() if k != "_resume_state"}` | Contains serialized LangChain messages for resume |
| `correlation_id` | NOT stripped | Sent to client but ignored (acceptable) |

---

## PHASE 2: Protocol Mismatches

| # | Event | Backend Sends | Frontend Reads | Status |
|---|-------|--------------|----------------|--------|
| 1 | `tool_start` | `name`, `args` | `data.name`, `data.args` | ✅ Compatible |
| 2 | `tool_end` | `name`, `result` | `data.name`, `data.result` | ✅ Compatible |
| 3 | `tool_error` | `name`, `error` | `data.name`, `data.error` | ✅ Compatible |
| 4 | `pause` | `action_name`, `params`, `tool_call_id` | `data.action_name`, `data.params`, `data.tool_call_id` | ✅ Compatible |
| 5 | `done` | (no extra fields) | `data.type` | ✅ Compatible |
| 6 | `connected` | `conversation_id` | `data.conversation_id` | ✅ Compatible |
| 7 | `token` | `content` | `data.content` | ✅ Compatible |
| 8 | `error` | `message` | `data.message` | ✅ Compatible |
| 9 | `stopped` | (no extra fields) | `data.type` | ✅ Compatible |
| 10 | `ended` | (no extra fields) | `data.type` | ✅ Compatible |
| 11 | `edit_successful` | (no extra fields) | `data.type` | ✅ Compatible |
| 12 | `tool_input_required` | `action_name`, `tool_call_id`, `params` | `data.action_name`, `data.tool_call_id`, `data.params` | ✅ Compatible |
| 13 | `show_ticket_dialogue` | No longer sent by backend | Handled as backward compat alias | ✅ Compatible |
| 14 | `correlation_id` | Sent in most events | Ignored by frontend | ✅ Acceptable |

**Result: Zero field-name mismatches.** All previous mismatches (`input` vs `args`, `output` vs `result`) were fixed in the protocol alignment commit.

---

## PHASE 3: Tool Lifecycle Audit

### All Possible Paths

| Path | Flow | Terminal State | Status |
|------|------|---------------|--------|
| 1 | `tool_start` → `tool_end` → `done` | `completed` | ✅ |
| 2 | `tool_start` → `pause` → `confirm(true)` → `tool_end` → `done` | `completed` | ✅ |
| 3 | `tool_start` → `pause` → `confirm(false)` → `done` | `cancelled` | ✅ |
| 4 | `tool_start` → `pause` → `confirm(true)` → `tool_input_required` → `tool_result` → `tool_end` → `done` | `completed` | ✅ |
| 5 | `tool_start` → `pause` → `confirm(true)` → `tool_input_required` → `tool_result(cancelled)` → ??? | **BUG** | 🐛 |
| 6 | `tool_start` → `tool_error` → `done` | `failed` | ✅ |
| 7 | `tool_start` → `pause` → `confirm(true)` → `tool_error` → `done` | `failed` | ✅ |
| 8 | Disconnect during `waiting_for_user_input` → reconnect | **Stuck** | 🐛 |
| 9 | Page refresh during `waiting_for_user_input` | **Stuck** | 🐛 |

### Bugs Found

**Bug 1: Backend executes action even when tool_result indicates cancellation**

When the frontend sends `tool_result` with `{ cancelled: true }`, the backend merges this into params and tries to execute the action anyway. The action might succeed (because original params are still present), but the user intended to cancel.

**Bug 2: No state restoration after reconnect/refresh**

When the WebSocket disconnects and reconnects (or the page refreshes), the frontend loses all tool state. The backend still has the pending state saved, but doesn't send it to the frontend on reconnect. Tools in `waiting_for_user_input` become stuck — the user can't interact with them because `activeTool` is null.

---

## PHASE 4: Tool Audit

| Tool | Backend Executes? | Frontend Executes? | Requires UI? | Requires REST? | Requires WS? | Human Interaction? |
|------|-------------------|-------------------|-------------|---------------|-------------|-------------------|
| `create_support_ticket` | Yes (via `tool_result`) | No | Yes (form) | No | Yes (`tool_result`) | Yes (approval + form) |
| `create_technical_ticket` | Yes (via `tool_result`) | No | Yes (form) | No | Yes (`tool_result`) | Yes (approval + form) |
| `check_ticket_status` | Yes (auto) | No | No | No | Yes | No |
| `search_tickets` | Yes (auto) | No | No | No | Yes | No |
| `escalate_to_human` | Yes (after approval) | No | No | No | Yes | Yes (approval only) |
| `request_confirmation` | Yes (after approval) | No | No | No | Yes | Yes (approval only) |
| `select_product` | Yes (via `tool_result`) | No | Yes (picker) | No | Yes (`tool_result`) | Yes (approval + picker) |
| `pick_calendar_date` | Yes (via `tool_result`) | No | Yes (calendar) | No | Yes (`tool_result`) | Yes (approval + picker) |
| `upload_attachment` | Yes (via `tool_result`) | No | Yes (file picker) | No | Yes (`tool_result`) | Yes (approval + upload) |
| `confirm_payment` | Yes (via `tool_result`) | No | Yes (confirmation) | No | Yes (`tool_result`) | Yes (approval + confirm) |
| `verify_otp` | Yes (via `tool_result`) | No | Yes (OTP input) | No | Yes (`tool_result`) | Yes (approval + OTP) |

**Result: All tools follow the same generic protocol. No tool-specific REST calls.**

---

## PHASE 5: Tool Runtime Verification

| Component | Status | Notes |
|-----------|--------|-------|
| `registry.ts` | ✅ | Versioning, lazy loading, capability querying, diagnostics |
| `runtime.tsx` | ✅ | ErrorBoundary, UnknownToolHandler, Suspense, lifecycle controllers |
| `sdk.ts` | ✅ | `useTool()` with complete/cancel/fail/progress/log/setBusy/setIdle/abortSignal/lifecycle hooks |
| `types.ts` | ✅ | Full type system with 9 states, capabilities, schema, diagnostics |
| `diagnostics.ts` | ✅ | Structured logging, event tracing, export |
| `plugin.ts` | ✅ | Static + dynamic + remote loading |
| `validation.ts` | ✅ | Schema-based payload validation |
| Registration | ✅ | `registerTool()` with deduplication warnings |
| Resolution | ✅ | Exact → default → latest → fuzzy |
| Lazy loading | ✅ | `React.lazy()` + `Suspense` |
| Versioning | ✅ | `type@version` format |
| Unknown tools | ✅ | Auto-fail with `unsupported_tool` reason |
| Error boundaries | ✅ | Catch crashes, send `tool_crash` result |
| Cleanup | ✅ | `onDestroy` hooks, `abortSignal` |

---

## PHASE 6: Backend Resume Model

| Question | Answer |
|----------|--------|
| After confirmation (non-interactive) | Backend executes action, appends ToolMessage, resumes AI via `asyncio.create_task(run_ai_stream(msgs))` |
| After confirmation (interactive) | Backend sends `tool_input_required`, does NOT resume (uses `continue`) |
| After confirmation (declined) | Backend appends "Action aborted" ToolMessage, resumes AI |
| After `tool_result` | Backend merges result into params, executes action, appends ToolMessage, resumes AI |
| Does backend wait for WebSocket response? | Only for `tool_result` (interactive tools). For non-interactive, it resumes immediately. |
| Does backend wait for REST completion? | No. REST is not used in the tool flow. |
| How is state restored? | `ChatConversation.pending_state` JSON column. Messages serialized via `message_to_dict`/`messages_from_dict`. `_resume_state` contains assistant message + completed tool results. |
| Is conversation blocked? | Only during `tool_input_required` (waiting for `tool_result`). Otherwise, the user can send new messages. |

---

## PHASE 7: REST vs WebSocket

| Action | Transport | Interrupts AI? | Continuation Strategy |
|--------|-----------|---------------|----------------------|
| Create ticket | WebSocket (`tool_result`) | No | Backend resumes AI after receiving `tool_result` |
| Select product | WebSocket (`tool_result`) | No | Same |
| Calendar picker | WebSocket (`tool_result`) | No | Same |
| File upload | WebSocket (`tool_result`) | No | Same |
| List conversations | REST | No | Independent of AI flow |
| Rate conversation | REST | No | Independent of AI flow |

**Result: No REST calls interrupt the AI workflow.**

---

## PHASE 8: Unknown Tool Support

| Scenario | Registry Loads? | Renderer Resolves? | Runtime Creates? | Fails Gracefully? | Diagnostics Explains? |
|----------|----------------|-------------------|-----------------|-------------------|----------------------|
| `select_product` (not registered) | N/A | No → `UnknownToolHandler` | N/A | ✅ Auto-sends `failed` with `unsupported_tool` | ✅ `diagnostics.warn('lifecycle', 'Unknown tool')` |
| `calendar_picker` (not registered) | N/A | No → `UnknownToolHandler` | N/A | ✅ Same | ✅ Same |
| `customer_selector` (not registered) | N/A | No → `UnknownToolHandler` | N/A | ✅ Same | ✅ Same |

**Result: Unknown tools fail gracefully. Backend receives `failed` result, resumes AI with error ToolMessage.**

---

## PHASE 9: Error Recovery

| Scenario | Current Behavior | Status |
|----------|-----------------|--------|
| Disconnect | Reconnect after 3s. State lost. Tools stuck. | 🐛 Bug |
| Reconnect | Same as disconnect. | 🐛 Bug |
| Duplicate `tool_start` | Creates new ToolExecutionCard. Old one stays running. | ⚠️ Unlikely (backend sends one per tool) |
| Duplicate `pause` | Replaces pending action. | ✅ OK |
| Late `tool_end` | Updates tool status. No-op if already terminal. | ✅ OK |
| Late `tool_error` | Same as late `tool_end`. | ✅ OK |
| Component crash | `ToolErrorBoundary` catches, sends `tool_crash`. | ✅ OK |
| Page refresh | State lost. Tools stuck. | 🐛 Bug |
| Tab hidden | `visibilitychange` triggers `onSuspend` hooks. | ✅ OK |
| Network loss | WebSocket disconnects. Reconnect after 3s. | 🐛 Bug (same as disconnect) |

---

## PHASE 10: Authentication

| Endpoint | Auth Method | Notes |
|----------|------------|-------|
| WebSocket `/ws` | Session-based (handshake) | No JWT. `session_id` + `customer_email` identify the user. |
| REST endpoints | JWT (staff) or session (customers) | Handled by `get_chat_access` dependency. |
| JWT refresh | Handled by `api.ts` interceptor | Presumably refreshes on 401. |

**No authentication bugs found.** WebSocket uses session-based auth which doesn't expire. REST uses JWT which is refreshed automatically.

---

## PHASE 11: Console Errors

| Potential Error | Status |
|----------------|--------|
| `Cannot read property of undefined` | ✅ All optional fields use `?.` or `|| {}` |
| Unknown websocket event | ✅ Unhandled events are silently ignored (no crash) |
| Unknown message type | ✅ Backend sends `{ type: "error", message: "Unknown message type: ..." }` |
| Unhandled promise | ✅ All async operations are in try/catch |
| React render errors | ✅ `ToolErrorBoundary` catches all |
| Missing payload fields | ✅ All fields have fallbacks (`|| 'unknown'`, `|| {}`) |

**No console errors expected.**

---

## Fixes Required

### Fix 1: Backend `tool_result` handler must check for cancellation/failure

**Problem**: When frontend sends `tool_result` with `{ cancelled: true }`, backend executes the action anyway.

**Fix**: Check if result indicates cancellation or failure. If so, append appropriate ToolMessage and resume AI without executing.

### Fix 2: Backend sends pending state on reconnect

**Problem**: After disconnect/reconnect/refresh, frontend loses tool state. Backend doesn't send pending state.

**Fix**: After `connected` event, if there's a pending state, send a `restore_state` event with the pending action info. Frontend handles this by restoring the approval card or tool UI.
