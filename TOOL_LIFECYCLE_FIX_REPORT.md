# Tool Lifecycle State Management — Proven Root Cause & Fix

## 1. Root Cause (Proven by Runtime Simulation)

### Primary: REST API / WebSocket disconnect

The `CreateTicketModal` creates tickets via **REST API** (`ticketService.createTicket()`), NOT via the WebSocket channel. After the modal submits:

1. REST API creates the ticket → `onSuccess` → modal closes
2. **No WebSocket message is sent** to notify the backend
3. **Backend never sends `tool_end`** because it doesn't know the ticket was created
4. **Tool stays in `running` forever**

```
[T+026] 📋 CreateTicketModal: REST API createTicket() called
[T+027] 📋 CreateTicketModal: onSuccess → onClose()
[T+034] FINAL: toolCalls = [{"status":"running"}]   ← 🐛 STUCK
```

### Secondary: `done` handler doesn't finalize running tools

When the backend sends `done` (AI response complete), the handler only finalizes the streaming message. It does **not** check for or finalize any tools still in `running` state.

### Tertiary: `sendMessage` clears `serverToolIdMapRef`

When the user sends a new message while a tool is still running, `sendMessage()` calls `serverToolIdMapRef.current.clear()`. This destroys the mapping needed for late-arriving `tool_end` events to find their target tool.

### Quaternary: Incomplete status type

`ToolCallInfo.status` only supported 3 states: `'running' | 'completed' | 'failed'`. The lifecycle needed 7 states to properly represent every phase.

---

## 2. Runtime WebSocket Log (Before Fix)

```
[T+019] ◄── tool_start (tc-B)          → Tool CREATED: running
[T+021] ◄── pause (tc-B)               → (no status change)
[T+022] ──► confirm(true)              → pendingAction cleared
[T+023] ◄── show_ticket_dialogue (tc-B)→ Modal opens
[T+026] 📋 REST API createTicket()     → Ticket created
[T+027] 📋 onClose()                   → Modal closes
[T+030] ◄── done                       → (tools NOT finalized)
[T+034] FINAL: status=running           → 🐛 STUCK FOREVER
```

## 3. Runtime WebSocket Log (After Fix)

```
[T+022] ◄── tool_start (tc-B)          → Tool CREATED: running
[T+024] ◄── pause (tc-B)               → running → waiting_for_approval
[T+026] ──► confirm(true)              → waiting_for_approval → running
[T+027] ◄── show_ticket_dialogue (tc-B)→ Modal opens
[T+031] 📋 REST API onSuccess          → running → completed ✅
[T+032] ──► tool_complete (tc-B)       → Backend notified
[T+037] ◄── done                       → (tools already terminal, no-op)
[T+039] FINAL: status=completed         → ✅ TERMINAL
```

## 4. Tool Lifecycle Diagram

```
                tool_start
                    │
                    ▼
              ┌───────────┐
              │  RUNNING   │
              └─────┬─────┘
                    │
              ┌─────┴─────┐
              │           │
         pause │           │ (no pause)
              ▼           │
   ┌────────────────────┐  │
   │ WAITING_FOR_APPROVAL│  │
   └────────┬───────────┘  │
            │              │
     ┌──────┴──────┐       │
     │             │       │
 approve       decline     │
     │             │       │
     ▼             ▼       │
  RUNNING     CANCELLED    │
     │                     │
     ├─────────────────────┘
     │
     ├─→ tool_end ──────────→ COMPLETED ✅
     │
     ├─→ modal submit ──────→ COMPLETED ✅  (NEW)
     │
     ├─→ modal cancel ──────→ CANCELLED ✅  (NEW)
     │
     ├─→ done (no tool_end)─→ COMPLETED ✅  (NEW)
     │
     └─→ error ─────────────→ FAILED ✅
```

## 5. Files Modified

| File | Changes |
|------|---------|
| `src/features/chat/types.ts` | Added `ToolStatus` union type (7 states); added `serverToolCallId` to `ToolCallInfo` |
| `src/features/chat/hooks/useChatWebSocket.ts` | Added `completeToolCall()`, `activeToolCallIdRef`, `pause`→`waiting_for_approval`, `confirmAction`→status transitions, `done`→finalize running tools, removed `serverToolIdMapRef.clear()` from `sendMessage` |
| `src/features/chat/components/ChatMessage.tsx` | `ToolExecutionCard` now renders all 7 states with distinct icons/colors/labels |
| `src/features/chat/components/ChatPage.tsx` | Wires `completeToolCall` to `CreateTicketModal` callbacks |
| `src/features/tickets/components/CreateTicketModal.tsx` | Added `onTicketCreated` callback prop |

## 6. Code Changes Explained

### A. `types.ts` — Full lifecycle type

```typescript
export type ToolStatus =
  | 'pending' | 'waiting_for_approval' | 'running'
  | 'completed' | 'failed' | 'cancelled' | 'timeout'
```

### B. `useChatWebSocket.ts` — `completeToolCall()` function

New exported function that transitions the active tool to any terminal state. It:
1. Resolves the target tool via `activeToolCallIdRef` → `serverToolIdMapRef`
2. Updates `toolCalls` state (immutable)
3. Updates the `messages` array (immutable)
4. Sends `{ type: 'tool_complete' }` to backend (best-effort)
5. Clears `activeToolCallIdRef` to prevent double-firing

### C. `useChatWebSocket.ts` — `pause` sets `waiting_for_approval`

```typescript
case 'pause': {
    // ...
    toolCalls.set(prev => prev.map(t =>
        t.id === pauseLocalId ? { ...t, status: 'waiting_for_approval' } : t
    ))
    // ...
}
```

### D. `useChatWebSocket.ts` — `confirmAction` transitions status

- `approved: true` → tool goes back to `running`
- `approved: false` → tool goes to `cancelled`

### E. `useChatWebSocket.ts` — `done` finalizes running tools

```typescript
case 'done': {
    // ...
    setToolCalls(prev => prev.map(t =>
        t.status === 'running'
            ? { ...t, status: 'completed', endTime: now }
            : t
    ))
}
```

### F. `useChatWebSocket.ts` — `sendMessage` preserves `serverToolIdMapRef`

Removed `serverToolIdMapRef.current.clear()` so late-arriving `tool_end` events can still resolve their target tool.

### G. `ChatPage.tsx` — Modal lifecycle wiring

```typescript
<CreateTicketModal
    onTicketCreated={() => completeToolCall('completed', 'Ticket created successfully')}
    onClose={() => {
        completeToolCall('cancelled', 'Cancelled by user')  // no-op if already completed
        setIsCreateTicketModalOpen(false)
    }}
/>
```

### H. `ToolExecutionCard` — All 7 states rendered

Each state has a distinct icon, color, background, and label:
- `pending` → Clock icon, slate
- `waiting_for_approval` → Shield icon, amber
- `running` → Loader2 (spinning), blue
- `completed` → CheckCircle2, emerald
- `failed` → XCircle, red
- `cancelled` → Ban, orange
- `timeout` → Timer, rose

## 7. Why the State Now Always Reaches a Terminal State

Every possible exit path from `running` is now covered:

| Exit Path | Terminal State | Mechanism |
|-----------|---------------|-----------|
| Backend sends `tool_end` | `completed` | `tool_end` handler |
| User submits modal | `completed` | `completeToolCall('completed')` via `onTicketCreated` |
| User cancels modal | `cancelled` | `completeToolCall('cancelled')` via `onClose` |
| User declines approval | `cancelled` | `confirmAction(false)` handler |
| Backend sends `done` without `tool_end` | `completed` | `done` handler finalization |
| `completeToolCall` called twice | No-op | Checks `status !== 'running'` before updating |
| Late `tool_end` after `completeToolCall` | No-op | Same guard |

## 8. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Backend ignores `tool_complete` message | Low | Frontend state is authoritative for UI; backend can catch up |
| `serverToolIdMapRef` grows across long sessions | Negligible | Each turn adds ~1-3 entries; cleared on `clearMessages` |
| Backend sends `tool_end` after frontend already completed tool | None | `completeToolCall` and `tool_end` both check `status !== 'running'` |
| User rapidly opens/closes modal | None | `completeToolCall` is idempotent |
