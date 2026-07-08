# Full Tool Runtime Refactor — Protocol-Driven Architecture

> **Frontend**: [`IntegraServeAI-Front`](https://github.com/yousefelsharkawy26/IntgraServeAI-Front)  
> **Backend**: [`IntegraServeAI-Backend`](https://github.com/yousefelsharkawy26/IntgraServeAI-Backend)  

---

## 1. Architecture Review Findings

### Problems Found

| # | Problem | Severity | Root Cause |
|---|---------|----------|------------|
| 1 | Tool lifecycle split between frontend and backend | Critical | Frontend called REST API directly, backend never received results |
| 2 | `show_ticket_dialogue` was tool-specific | High | Backend had `if action_name in ["create_support_ticket", ...]` |
| 3 | Backend never received interactive tool results | Critical | Frontend sent `tool_result` but backend didn't handle it |
| 4 | Conversation couldn't continue after tool interaction | Critical | Backend used `continue` after `show_ticket_dialogue`, never resumed AI |
| 5 | Every new tool required custom logic | High | No generic `tool_result` handler |
| 6 | Frontend faked tool completion | High | `sendToolResult` only updated local state, never sent to backend |
| 7 | Protocol was not generic | High | Tool-specific events instead of generic lifecycle |

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| Backend is single source of truth | Frontend never decides tool completion |
| Generic `tool_result` replaces all tool-specific flows | One protocol for all tools |
| Backend executes action after receiving `tool_result` | Backend merges user input into params, calls `execute_paused_action` |
| `tool_input_required` replaces `show_ticket_dialogue` | Generic event for all interactive tools |
| Frontend SDK sends `tool_result` via WebSocket | No REST API calls from tool components |
| Tool components know nothing about infrastructure | Only use `useTool()` SDK |

---

## 2. Files Changed

### Backend (`IntegraServeAI-Backend`)

| File | Changes |
|------|---------|
| `apis/v1/chat.py` | Added `tool_result` handler that executes the action and resumes AI. Changed `confirm` handler to send generic `tool_input_required` instead of `show_ticket_dialogue`. Added `import json`. |

### Frontend (`IntegraServeAI-Front`)

| File | Changes |
|------|---------|
| `src/features/chat/hooks/useChatWebSocket.ts` | Complete rewrite: `sendToolResult` now sends `tool_result` to backend. Added `tool_input_required` handler. Removed local-only completion. |
| `src/features/chat/tools/create-ticket/CreateTicketTool.tsx` | Removed REST API call. Now uses `tool.complete()` to send result to backend. |

---

## 3. Message Matrix

### Client → Server

| Message | Payload | Producer | Lifecycle Stage |
|---------|---------|----------|-----------------|
| Handshake | `{ session_id, customer_email, customer_name }` | `useChatWebSocket` | Connection |
| `chat` | `{ type, content }` | `sendMessage()` | User input |
| `generate` | `{ type, content }` | `sendGenerate()` | User input |
| `confirm` | `{ type, approved }` | `confirmAction()` | Approval |
| **`tool_result`** | **`{ type, tool_call_id, result }`** | **`sendToolResult()`** | **Human input** |
| `stop` | `{ type }` | `stopGeneration()` | Control |
| `edit` | `{ type, message_id, content }` | `editMessage()` | Control |
| `end` | `{ type }` | `disconnect()` | Control |

### Server → Client

| Event | Payload | Consumer | Lifecycle Stage |
|-------|---------|----------|-----------------|
| `connected` | `{ type, conversation_id }` | `useChatWebSocket` | Connection |
| `token` | `{ type, content }` | `useChatWebSocket` | Streaming |
| `tool_start` | `{ type, name, args }` | `useChatWebSocket` | Tool lifecycle |
| `tool_end` | `{ type, name, result }` | `useChatWebSocket` | Tool lifecycle |
| `tool_error` | `{ type, name, error }` | `useChatWebSocket` | Tool lifecycle |
| `pause` | `{ type, action_name, params, tool_call_id }` | `useChatWebSocket` | Approval |
| **`tool_input_required`** | **`{ type, action_name, tool_call_id, params }`** | **`useChatWebSocket`** | **Human input** |
| `done` | `{ type }` | `useChatWebSocket` | Completion |
| `error` | `{ type, message }` | `useChatWebSocket` | Error |
| `stopped` | `{ type }` | `useChatWebSocket` | Control |
| `edit_successful` | `{ type }` | `useChatWebSocket` | Control |
| `ended` | `{ type }` | `useChatWebSocket` | Control |

---

## 4. Tool Lifecycle State Diagram

```
                    ┌──────────────────────────────────────────────────┐
                    │                BACKEND (Source of Truth)          │
                    │                                                  │
  LLM decides       │  tool_start ──► pause ──► [wait confirm]        │
  to use tool       │      │            │            │                 │
                    │      │            │       approved?              │
                    │      │            │        │    │                │
                    │      │            │       yes   no               │
                    │      │            │        │    │                │
                    │      │            │   ┌────┘    │                │
                    │      │            │   │         │                │
                    │      │            │   ▼         ▼                │
                    │      │     tool_input_required  ToolMessage      │
                    │      │            │            "aborted"         │
                    │      │            │              │               │
                    │      │     tool_result           │               │
                    │      │     (from frontend)       │               │
                    │      │            │              │               │
                    │      │     execute_paused_action │               │
                    │      │            │              │               │
                    │      │        ToolMessage        │               │
                    │      │     (execution result)    │               │
                    │      │            │              │               │
                    │      │     resume AI stream ◄────┘               │
                    │      │            │                              │
                    │      │        tool_end                           │
                    │      │            │                              │
                    │      │          done                             │
                    └──────┼────────────┼──────────────────────────────┘
                           │            │
                    ┌──────┼────────────┼──────────────────────────────┐
                    │      ▼            ▼                              │
                    │  FRONTEND (Renderer Only)                        │
                    │                                                  │
                    │  running ──► waiting_for_approval ──► running    │
                    │                                  ──► cancelled   │
                    │                                                  │
                    │  running ──► waiting_for_user_input ──► running  │
                    │                                    (processing)  │
                    │                                         │        │
                    │                                    tool_end      │
                    │                                         │        │
                    │                                     completed    │
                    └──────────────────────────────────────────────────┘
```

### State Transitions (Frontend)

| From | Event | To | Source |
|------|-------|----|--------|
| `running` | `pause` | `waiting_for_approval` | Backend |
| `waiting_for_approval` | `confirm(true)` | `running` | Frontend → Backend |
| `waiting_for_approval` | `confirm(false)` | `cancelled` | Frontend → Backend |
| `running` | `tool_input_required` | `waiting_for_user_input` | Backend |
| `waiting_for_user_input` | `tool_result` sent | `running` (processing) | Frontend → Backend |
| `running` | `tool_end` | `completed` | Backend |
| `running` | `tool_error` | `failed` | Backend |
| `running` | `done` (safety net) | `completed` | Backend |

---

## 5. Generic Tool Flow (All Tools)

```
User: "create a technical ticket"
  │
  ▼
Frontend → Backend: { type: "chat", content: "create a technical ticket" }
  │
  ▼
Backend: LLM decides to call create_technical_ticket
Backend → Frontend: { type: "tool_start", name: "create_technical_ticket", args: {...} }
Backend → Frontend: { type: "pause", action_name: "create_technical_ticket", tool_call_id: "tc-001", params: {...} }
  │
  ▼
Frontend: Shows approval card (ChatPendingAction)
User clicks Approve
  │
  ▼
Frontend → Backend: { type: "confirm", approved: true }
  │
  ▼
Backend: Detects interactive tool → sends tool_input_required
Backend → Frontend: { type: "tool_input_required", action_name: "create_technical_ticket", tool_call_id: "tc-001", params: {...} }
  │
  ▼
Frontend: ToolRenderer resolves CreateTicketTool from registry
Frontend: Renders CreateTicketTool component
User fills form and clicks "Create Ticket"
  │
  ▼
CreateTicketTool calls: tool.complete({ subject, description, priority, ... })
SDK calls: sendToolResult("tc-001", "success", { subject, description, ... })
  │
  ▼
Frontend → Backend: { type: "tool_result", tool_call_id: "tc-001", result: { subject: "...", ... } }
  │
  ▼
Backend: Merges result into params
Backend: Calls execute_paused_action(p_data) → creates ticket #1234
Backend: Appends ToolMessage("Ticket #1234 created successfully")
Backend: Resumes AI stream
  │
  ▼
Backend → Frontend: { type: "tool_end", name: "create_technical_ticket", result: "Ticket #1234 created" }
Backend → Frontend: { type: "token", content: "I've created technical ticket #1234..." }
Backend → Frontend: { type: "done" }
```

---

## 6. Adding a New Tool (Zero Infrastructure Changes)

### Step 1: Create component

```typescript
// src/features/chat/tools/calendar-picker/CalendarPickerTool.tsx
export function CalendarPickerTool() {
  const tool = useTool()
  const [date, setDate] = useState('')

  return (
    <div>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button onClick={() => tool.complete({ selectedDate: date })}>Confirm</button>
      <button onClick={() => tool.cancel()}>Cancel</button>
    </div>
  )
}
```

### Step 2: Create definition

```typescript
// src/features/chat/tools/calendar-picker/definition.ts
import { lazy } from 'react'
import { defineTool } from '../plugin'

const CalendarPickerTool = lazy(() =>
  import('./CalendarPickerTool').then(m => ({ default: m.CalendarPickerTool }))
)

export const calendarPickerDefinition = defineTool({
  type: 'pick_calendar_date',
  label: 'Pick a Date',
  description: 'Select a date from the calendar',
  Component: CalendarPickerTool,
  schema: {
    fields: [
      { name: 'selectedDate', type: 'string', required: true },
    ],
  },
})
```

### Step 3: Register

```typescript
// src/features/chat/tools/index.ts
import { calendarPickerDefinition } from './calendar-picker/definition'
registerTool(calendarPickerDefinition, { isDefault: true })
```

### Step 4: Add to backend's interactive tools list

```python
# apis/v1/chat.py — confirm handler
if p_data.get("action_name") in [
    "create_support_ticket",
    "create_technical_ticket",
    "select_product",
    "pick_calendar_date",  # ← Add here
    ...
]:
```

**That's it.** No changes to:
- `useChatWebSocket.ts`
- `ChatPage.tsx`
- `ToolRenderer.tsx`
- SDK
- Registry
- Runtime

---

## 7. Compatibility Verification

| Check | Status |
|-------|--------|
| Frontend sends `tool_result` | ✅ Backend handles it |
| Backend sends `tool_input_required` | ✅ Frontend handles it |
| Backend sends `tool_start` with `args` | ✅ Frontend reads `data.args` |
| Backend sends `tool_end` with `result` | ✅ Frontend reads `data.result` |
| Backend sends `tool_error` | ✅ Frontend handles it |
| Backend sends `pause` with `tool_call_id` | ✅ Frontend reads it |
| Frontend sends `confirm` | ✅ Backend handles it |
| Backend executes action after `tool_result` | ✅ Merges params, calls `execute_paused_action` |
| Backend resumes AI after `tool_result` | ✅ Creates `run_ai_stream` task |
| No tool-specific events | ✅ `tool_input_required` is generic |
| No tool-specific frontend logic | ✅ All tools use `tool.complete()` |
| Frontend never fakes completion | ✅ Only `tool_end` from backend marks completed |
| TypeScript compiles | ✅ Zero errors |
| Python compiles | ✅ Zero errors |

---

## 8. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Backend `execute_paused_action` fails after `tool_result` | Medium | Wrapped in try/except, appends error ToolMessage, AI continues |
| Frontend sends `tool_result` but WebSocket disconnects | Low | Tool stays in `running` state, `done` safety net finalizes |
| Backend's interactive tools list is hardcoded | Low | Could be moved to action config (`requires_human_input: true`) |
| `show_ticket_dialogue` backward compatibility | Low | Frontend handles both `tool_input_required` and `show_ticket_dialogue` |
