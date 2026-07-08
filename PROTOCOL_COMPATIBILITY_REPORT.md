# Protocol Compatibility Report

> **Backend**: [IntegraServeAI-Backend](https://github.com/yousefelsharkawy26/IntgraServeAI-Backend) (`apis/v1/chat.py` + `ai_engine/agent_runner.py`)  
> **Frontend**: [IntegraServeAI-Front](https://github.com/yousefelsharkawy26/IntgraServeAI-Front) (`src/features/chat/hooks/useChatWebSocket.ts`)  

---

## 1. Incompatibilities Found & Fixed

| # | Event | Backend Sends | Frontend Expected | Fix |
|---|-------|--------------|-------------------|-----|
| 1 | `tool_start` | `{ name, args }` | `{ name, input, tool_call_id }` | Changed `data.input` → `data.args`. Removed `tool_call_id` expectation. |
| 2 | `tool_end` | `{ name, result }` | `{ name, output, tool_call_id, status }` | Changed `data.output` → `data.result`. Use `currentToolCallRef` instead of `tool_call_id`. Removed `status` expectation. |
| 3 | `tool_error` | `{ name, error }` | *(not handled)* | Added `tool_error` handler. Maps to `failed` status. |
| 4 | `show_ticket_dialogue` | `{ action_name, params }` | `{ action_name, params, tool_call_id }` | Removed `tool_call_id` expectation. Uses `activeToolCallIdRef` from `pause`. |
| 5 | `tool_result` (frontend→backend) | *(not handled)* | Sends `{ type: "tool_result" }` | Removed WebSocket send. `sendToolResult` now only updates local state. |
| 6 | `confirm` decline | Backend resumes AI with "aborted" message | Sends `tool_result` with `cancelled` | Removed `tool_result` send. Backend handles decline internally. |

---

## 2. Complete Protocol Map

### Client → Server Messages

| Message | Payload | Backend Handler | Status |
|---------|---------|-----------------|--------|
| Handshake | `{ session_id, customer_email, customer_name }` | `receive_json()` | ✅ Compatible |
| `chat` | `{ type: "chat", content }` | `msg_type == "chat"` | ✅ Compatible |
| `generate` | `{ type: "generate", content }` | `msg_type == "generate"` | ✅ Compatible |
| `stop` | `{ type: "stop" }` | `msg_type == "stop"` | ✅ Compatible |
| `edit` | `{ type: "edit", message_id, content }` | `msg_type == "edit"` | ✅ Compatible |
| `confirm` | `{ type: "confirm", approved }` | `msg_type == "confirm"` | ✅ Compatible |
| `end` | `{ type: "end" }` | `msg_type == "end"` | ✅ Compatible |
| ~~`tool_result`~~ | ~~`{ type: "tool_result", ... }`~~ | ~~Returns error~~ | ❌ **Removed** — backend doesn't handle this |

### Server → Client Events

| Event | Payload | Frontend Handler | Status |
|-------|---------|------------------|--------|
| `connected` | `{ type, conversation_id }` | `case 'connected'` | ✅ Compatible |
| `token` | `{ type, content }` | `case 'token'` | ✅ Compatible |
| `tool_start` | `{ type, name, args }` | `case 'tool_start'` | ✅ **Fixed** — uses `args` not `input` |
| `tool_end` | `{ type, name, result }` | `case 'tool_end'` | ✅ **Fixed** — uses `result` not `output` |
| `tool_error` | `{ type, name, error }` | `case 'tool_error'` | ✅ **Added** — new handler |
| `pause` | `{ type, reason, action_name, params, tool_call_id }` | `case 'pause'` | ✅ Compatible |
| `done` | `{ type }` | `case 'done'` | ✅ Compatible |
| `error` | `{ type, message }` | `case 'error'` | ✅ Compatible |
| `stopped` | `{ type }` | `case 'stopped'` | ✅ Compatible |
| `edit_successful` | `{ type }` | `case 'edit_successful'` | ✅ Compatible |
| `ended` | `{ type }` | `case 'ended'` | ✅ Compatible |
| `show_ticket_dialogue` | `{ type, action_name, params }` | `case 'show_ticket_dialogue'` | ✅ **Fixed** — no `tool_call_id` expected |

---

## 3. Backend Event Field Reference

### `tool_start` (from `agent_runner.py` line ~130)
```python
yield {
    "type": "tool_start",
    "name": tool_name,      # ← frontend must read data.name
    "args": tool_args,      # ← frontend must read data.args (NOT data.input)
    "correlation_id": ...,  # ← stripped by chat.py before sending
}
```

### `tool_end` (from `agent_runner.py` line ~155)
```python
yield {
    "type": "tool_end",
    "name": tool_name,      # ← frontend must read data.name
    "result": result_str,   # ← frontend must read data.result (NOT data.output)
    "correlation_id": ...,  # ← stripped by chat.py before sending
}
```

### `tool_error` (from `agent_runner.py` line ~170)
```python
yield {
    "type": "tool_error",
    "name": tool_name,      # ← frontend must read data.name
    "error": error_msg,     # ← frontend must read data.error
    "correlation_id": ...,  # ← stripped by chat.py before sending
}
```

### `pause` (from `agent_runner.py` line ~120)
```python
pending_pause = {
    "type": "pause",
    "reason": "confirmation_required",
    "action_name": tool_name,
    "params": tool_args,
    "tool_call_id": tool_id,  # ← ONLY event with tool_call_id
}
```
Note: `_resume_state` is stripped by `chat.py` before sending to client.

### `show_ticket_dialogue` (from `chat.py` line ~243)
```python
await websocket.send_json({
    "type": "show_ticket_dialogue",
    "action_name": p_data.get("action_name"),
    "params": p_data.get("params", {}),
    # NOTE: NO tool_call_id sent here
})
```

---

## 4. Ticket Creation Flow (Backend Protocol)

```
User: "create technical ticket"
  │
  ▼
Frontend → Backend: { type: "chat", content: "create technical ticket" }
  │
  ▼
Backend → Frontend: { type: "token", content: "..." }
Backend → Frontend: { type: "tool_start", name: "create_technical_ticket", args: {...} }
Backend → Frontend: { type: "pause", action_name: "create_technical_ticket", params: {...}, tool_call_id: "..." }
  │
  ▼
Frontend shows approval card
User clicks Approve
  │
  ▼
Frontend → Backend: { type: "confirm", approved: true }
  │
  ▼
Backend detects action_name in ["create_support_ticket", "create_technical_ticket"]
Backend clears pending state
Backend → Frontend: { type: "show_ticket_dialogue", action_name: "...", params: {...} }
Backend does NOT resume AI stream (uses `continue`)
  │
  ▼
Frontend shows CreateTicketModal
User fills form and submits
  │
  ▼
Frontend → REST API: POST /tickets (NOT WebSocket)
  │
  ▼
Frontend closes modal
Frontend updates tool status locally to 'completed'
  │
  ▼
(No WebSocket message sent to backend — backend doesn't handle tool_result)
(User sends next message to continue conversation)
```

---

## 5. Decline Flow (Backend Protocol)

```
Frontend shows approval card
User clicks Decline
  │
  ▼
Frontend → Backend: { type: "confirm", approved: false }
  │
  ▼
Backend appends ToolMessage: "Action aborted by user..."
Backend resumes AI stream
  │
  ▼
Backend → Frontend: { type: "token", content: "I understand..." }
Backend → Frontend: { type: "done" }
```

---

## 6. Files Modified

| File | Changes |
|------|---------|
| `src/features/chat/hooks/useChatWebSocket.ts` | Complete rewrite for backend protocol compatibility |

---

## 7. Remaining Notes

- `correlation_id` is stripped by `chat.py` before sending to client (line: `ws_event = {k: v for k, v in event.items() if k != "_resume_state"}`). Only `_resume_state` is stripped; `correlation_id` IS sent. Frontend ignores it (harmless).
- The backend's `confirm` handler for ticket tools uses `continue` after sending `show_ticket_dialogue`, meaning the AI stream is NOT resumed. The conversation continues when the user sends a new message.
- The backend does NOT have a `tool_result` message handler. Any `tool_result` message would trigger `{ type: "error", message: "Unknown message type: tool_result" }`.
