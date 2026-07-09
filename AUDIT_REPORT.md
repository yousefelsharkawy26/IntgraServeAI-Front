# Action Engine Audit — Deliverables

## 1. Architecture Summary

The Action Engine spans two distinct subsystems that share no runtime coupling:

### A. Action Management (CRUD)
```
ActionModal → buildCreatePayload → actionService → Backend API
                                   ↕ (mapBackendActionToFrontend only for reads)
ActionsList ← useActions (React Query) ← actionService
```
- **Form ↔ Backend round-trip:** `ActionFormData` (camelCase, separate typed configs) → `buildCreatePayload` → `CreateActionData` (snake_case, single `execution_config`) → API → `mapBackendActionToFrontend` → `Action` (camelCase, separate typed configs)
- **State management:** React Query via `useActions` hook
- **Key files:** `src/features/actions/*`, `src/mappers/action.mapper.ts`, `src/lib/actionTransforms.ts`, `src/services/action.service.ts`

### B. Action Execution (Chat Tool Runtime)
```
Backend → WebSocket → useChatWebSocket → Zustand Store → ChatPage → ToolRenderer
                     ↕                    ↕
                  activeTool          pendingAction
                  toolCalls           ChatPendingAction (approval card)
                  sendToolResult      ToolExecutionCard (inline status)
```
- **Protocol:** Backend is the single source of truth for tool lifecycle
- **Lifecycle:** `pending → running → waiting_for_approval → running → completed`
- **Tool registry:** Module-level Map in `tools/registry.ts`, auto-populated on import
- **Tool SDK:** `useTool()` hook provides `complete()`, `cancel()`, `fail()` to tool components
- **Approval flow:** `pause` event → `ChatPendingAction` → `confirmAction(approved)` → backend → `tool_input_required` or `tool_end`
- **Key files:** `src/features/chat/hooks/useChatWebSocket.ts`, `src/features/chat/tools/*`, `src/features/chat/components/ChatPage.tsx`

---

## 2. Root Causes Found

### Critical Bugs (5)

| # | Root Cause | Impact | Files |
|---|-----------|--------|-------|
| 1 | **Double mapping** in `actionService.createAction/updateAction` — `mapFrontendActionToBackend` expects frontend fields (`apiConfig`, `rpcConfig`) but receives `CreateActionData` which has `execution_config`. All config data was silently lost on create/update. | Every create/update sent empty `execution_config: {}` to backend | `action.service.ts`, `action.mapper.ts` |
| 2 | **Missing `vector_query` branch** in `mapBackendActionToFrontend` — backend vector_query actions returned with no `vectorConfig`. | Vector query actions appeared with no config | `action.mapper.ts` |
| 3 | **Wrong field name** for internal type in `mapBackendActionToFrontend` — reads `exec.handler` but `buildCreatePayload` sends `exec.connector`. | Internal action handler lost on read; always showed `'defaultHandler'` | `action.mapper.ts` |
| 4 | **Hard-coded `active: true`** in `buildCreatePayload` — used for both create and update. Edit form has no status toggle. | Editing an inactive action always reactivated it | `ActionModal.tsx` |
| 5 | **`VectorConfigFields` filter textarea** used `register` with `setValueAs` for JSON parsing but had no reverse transform for display. Objects rendered as `[object Object]`. | Editing vector_query actions with filters was broken | `VectorConfigFields.tsx` |

### Minor Bugs (3)

| # | Root Cause | Impact | Files |
|---|-----------|--------|-------|
| 6 | **Duplicated type state** in `ActionModal` — `useState` + `watch` + `useEffect` sync with one-frame delay. | Config section flickered on type switch | `ActionModal.tsx` |
| 7 | **Stale `toolCalls` closure** in `restore_approval`/`restore_tool_input` WebSocket handlers — `toolCalls.find()` captured initial empty array. | Duplicate tool entries on reconnect | `useChatWebSocket.ts` |
| 8 | **`conversationId` from ref** — returned `conversationIdRef.current` which never triggers re-render. | ToolRenderer gets null `conversationId` for one render cycle | `useChatWebSocket.ts` |

### Code Smells (3)

| # | Issue | Resolution |
|---|-------|-----------|
| 9 | Duplicate `ToolStatus` type in `chat/types.ts` vs `tools/types.ts` (tools has `'retrying'`, chat didn't) | Added `'retrying'` to chat `ToolStatus` and `TOOL_STATUS_CONFIG` |
| 10 | Dead code: `emptyFormValues()` in `actionTransforms.ts` | Removed |
| 11 | `'defaultHandler'` fallback in mapper masked Issue 3 | Changed to `exec.handler || exec.connector || ''` |

---

## 3. Files Modified

| File | Changes |
|------|---------|
| `src/services/action.service.ts` | Removed `mapFrontendActionToBackend` import and all calls; send `CreateActionData` directly |
| `src/mappers/action.mapper.ts` | Added `vector_query` branch; fixed internal type to read `exec.connector`; removed dead `mapFrontendActionToBackend` function |
| `src/features/actions/components/ActionModal.tsx` | Removed redundant `useState` + `useEffect` for type; use `watchedType` directly; preserve `active` status on update |
| `src/features/actions/components/fields/VectorConfigFields.tsx` | Replaced `register` with `Controller` for bidirectional JSON ↔ string conversion on filter field |
| `src/features/chat/hooks/useChatWebSocket.ts` | Added `conversationId` state; fixed stale `toolCalls` closure with functional updates in restore handlers; added `'retrying'` to `nonTerminal` array |
| `src/features/chat/types.ts` | Added `'retrying'` to `ToolStatus` type |
| `src/features/chat/components/ChatMessage.tsx` | Added `retrying` entry to `TOOL_STATUS_CONFIG` |
| `src/lib/actionTransforms.ts` | Removed dead `emptyFormValues()` function |

---

## 4. Explanation of Every Fix

### Fix 1: Remove double mapping in `action.service.ts`
**Root cause:** `buildCreatePayload()` already transforms `ActionFormData` → `CreateActionData` (backend-aligned snake_case with `execution_config`). Then `mapFrontendActionToBackend()` tried to read `a.apiConfig` / `a.rpcConfig` — which don't exist on `CreateActionData` — producing `execution_config: {}`.  
**Fix:** Removed the `mapFrontendActionToBackend` call entirely; send `CreateActionData` directly. The reverse mapper `mapBackendActionToFrontend` is still used for reading responses.  
**No regression:** The write path now correctly sends the full payload. Read path unchanged.

### Fix 2: Add `vector_query` branch to `mapBackendActionToFrontend`
**Root cause:** The function only handled `api_request`, `rpc_request`, and `internal`.  
**Fix:** Added `else if (type === 'vector_query')` that maps `collection_name` → `indexName`, `embedding_config.model` → `embeddingModel`, `max_results` → `topK`, and `threshold`/`filter`.  
**No regression:** Only adds handling for a previously-ignored type.

### Fix 3: Fix internal type field name in `mapBackendActionToFrontend`
**Root cause:** `buildCreatePayload` sends `execution_config.connector` (matching the `ExecutionConfig` type). The mapper read `exec.handler` (not in `ExecutionConfig`).  
**Fix:** Changed to `exec.handler || exec.connector || ''`. This reads both field names for backward compatibility, with empty-string fallback instead of misleading `'defaultHandler'`.  
**No regression:** Handles both backend shapes.

### Fix 4: Preserve active status on update
**Root cause:** `buildCreatePayload` hard-coded `active: true`. The edit form has no status toggle (that's the list's switch).  
**Fix:** In `ActionModal.onSubmit`, when editing, set `payload.active = action.status === 'active'` after calling `buildCreatePayload`.  
**No regression:** Create still sends `active: true` (default). Update now preserves current status.

### Fix 5: VectorConfigFields filter Controller
**Root cause:** `register`'s `setValueAs` only transforms user input (string → object), not programmatic values (object → display string). Editing an action with a filter object showed `[object Object]`.  
**Fix:** Replaced `register` with `Controller` that handles both directions: `filterToString()` for display, `parseFilter()` for input.  
**No regression:** All existing behavior preserved for the input direction; display direction now works.

### Fix 6: Remove duplicated type state in ActionModal
**Root cause:** `useState` + `watch` + `useEffect` sync created a one-frame delay on type changes.  
**Fix:** Removed `useState` and `useEffect`; use `methods.watch('type')` directly as `watchedType`.  
**No regression:** Same rendering logic, just no delay.

### Fix 7: Fix stale toolCalls closure in restore handlers
**Root cause:** `toolCalls.find()` inside `ws.onmessage` captured the `toolCalls` value from when `connect()` was called. On reconnect with existing toolCalls, the stale empty array caused duplicate entries.  
**Fix:** Wrapped the find + conditional logic inside `setToolCalls((currentToolCalls) => ...)` functional update, which always reads the latest state.  
**No regression:** Same deduplication logic, just uses current state instead of stale closure.

### Fix 8: Add conversationId state
**Root cause:** `conversationIdRef.current` never triggers re-render, so `ToolRenderer` got null until something else caused a render.  
**Fix:** Added `const [conversationId, setConversationId] = useState<string | null>(null)`, set it in the `connected` handler, return it from the hook.  
**No regression:** `conversationIdRef` still kept for internal use; new state provides reactivity.

### Fix 9: Add `'retrying'` to ToolStatus and TOOL_STATUS_CONFIG
**Root cause:** `chat/types.ts` `ToolStatus` was missing `'retrying'` that `tools/types.ts` has. If backend ever sends `'retrying'`, the UI would fall back to misleading `'Running'` display.  
**Fix:** Added `'retrying'` to chat `ToolStatus`, `TOOL_STATUS_CONFIG`, and `nonTerminal` array in `finalizeRunningTools`.  
**No regression:** Defensive addition; current protocol doesn't use `'retrying'` yet.

### Fix 10: Remove dead `emptyFormValues()`
**Root cause:** Never imported anywhere.  
**Fix:** Deleted.  
**No regression:** No callers existed.

---

## 5. Remaining Technical Debt

| Item | Severity | Description |
|------|----------|-------------|
| Duplicate state sync | Performance | `ChatPage` syncs WS hook state to Zustand store via `useEffect`, causing double renders. Could be resolved by making the WS hook write directly to the store, or by removing the store and passing WS state via context. |
| `toggleAction` extra GET | Performance | `toggleAction` POSTs then GETs the updated action. Could be fixed if the POST returns the updated action. |
| Single `resultSentRef` | Design | The boolean guard works for sequential tool interactions but would break if multiple tools needed results simultaneously. A `Set<string>` would be more robust. |
| `activeTool` stale closure | Minor | The `tool_input_required` handler reads `activeTool` (stale) for duplicate guard. Impact is minimal since re-setting the same `activeTool` is idempotent. |
| `mapBackendActionToFrontend` uses `any` | Code quality | The backend response type is untyped. A proper backend response type would catch mapping errors at compile time. |
| `buildCreatePayload` hard-codes `active: true` | Design | Rather than overriding in the caller, the function could accept an optional `active` parameter. |

---

## 6. Action Engine Lifecycle Confirmation

### Action CRUD Lifecycle ✓
```
Create: Form → buildCreatePayload → actionService.createAction → API POST → mapBackendActionToFrontend → Action
Read:   API GET → mapBackendActionToFrontend → Action → useActions query
Update: Form → buildCreatePayload (preserve active) → actionService.updateAction → API PATCH → mapBackendActionToFrontend → Action
Delete: actionService.deleteAction → API DELETE
Toggle: actionService.toggleAction → API POST toggle → GET updated action
```
- ✅ One source of truth: `mapBackendActionToFrontend` for reads, direct `CreateActionData` for writes
- ✅ No double mapping
- ✅ All four action types handled (api_request, rpc_request, internal, vector_query)
- ✅ Active status preserved on edit

### Tool Execution Lifecycle ✓
```
Backend → tool_start → running (ToolExecutionCard)
Backend → pause → waiting_for_approval (ChatPendingAction)
User → approve → confirmAction(true) → backend
  → tool_input_required → waiting_for_user_input → ToolRenderer
  → tool_end → completed
User → decline → confirmAction(false) → cancelled
User → tool result → sendToolResult → running → backend → tool_end → completed
Backend → tool_error → failed
Backend → done → finalizeRunningTools (safety net)
Reconnect → restore_approval / restore_tool_input (no stale closures)
```
- ✅ Backend is single source of truth for lifecycle
- ✅ No duplicate dialogs (confirmSentRef guard)
- ✅ No duplicate tool entries on reconnect (functional state updates)
- ✅ Terminal states handled: completed, failed, cancelled, timeout
- ✅ Retrying state now supported
- ✅ conversationId reactive for ToolRenderer

**The Action Engine lifecycle is internally consistent and stable.**
