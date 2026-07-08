# Bug Fix Report: Duplicate Human Approval / Tool Re-execution

## Root Cause

The root cause is in **`src/features/chat/hooks/useChatWebSocket.ts`**, in the `show_ticket_dialogue` WebSocket event handler.

### What happened

The backend event sequence for "create technical ticket" is:

```
tool_start → pause → [user approves] → show_ticket_dialogue → [user fills modal] → tool_end → done
```

The `show_ticket_dialogue` event is sent by the backend **after the user has already approved** the action. It signals: "the tool is approved and executing — show the ticket creation form now."

However, the handler was erroneously calling `setPendingAction()`:

```typescript
// BEFORE (buggy)
case 'show_ticket_dialogue': {
    setIsTyping(false)
    setPendingAction({                    // ← 🐛 BUG: Re-creates the approval card
        toolCallId: data.tool_call_id,
        actionName: data.action_name,
        params: data.params,
    })
    setIsCreateTicketModalOpen(true)
    break
}
```

This caused the `ChatPendingAction` component to remount (it had been unmounted when `confirmAction` set `pendingAction` to `null`), creating a **second Human Approval card** alongside the already-open Create Ticket modal.

### Contributing factors

1. **No tool deduplication in `tool_start`**: Every `tool_start` event created a new `ToolCallInfo` with a random local ID (`tool-${generateId()}`) and unconditionally appended it. The server-provided `tool_call_id` was ignored, so there was no way to detect or deduplicate replayed events.

2. **No double-fire guard on `confirmAction`**: The transport-level `confirmAction` callback had no guard against being invoked twice. Although the UI's `isResponding` state disabled the button, a race between unmount and a rapid second click could still send two `{ type: 'confirm' }` messages to the backend.

3. **`tool_end` used only `currentToolCallRef`**: A single mutable ref tracked "the current tool." If multiple tools ran concurrently or the ref became stale, `tool_end` could update the wrong tool or miss the completion entirely.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/features/chat/hooks/useChatWebSocket.ts` | All 4 fixes applied here |

---

## Code Changes

### Fix 1 (PRIMARY): Remove `setPendingAction` from `show_ticket_dialogue`

```typescript
// AFTER (fixed)
case 'show_ticket_dialogue': {
    setIsTyping(false)
    setIsCreateTicketModalOpen(true)    // Only open the modal — no approval card
    break
}
```

**Why**: The approval phase is complete. `show_ticket_dialogue` is a post-approval event. Setting `pendingAction` here was creating a phantom second approval.

### Fix 2: Server-provided `tool_call_id` deduplication in `tool_start`

Added `serverToolIdMapRef: Map<string, string>` that maps server `tool_call_id` → local tool ID. When `tool_start` arrives with a `tool_call_id` that's already in the map, the existing tool call is updated in-place instead of creating a duplicate.

```typescript
if (serverToolCallId && serverToolIdMapRef.current.has(serverToolCallId)) {
    // Update existing tool call — do NOT append a new one
    setToolCalls((prev) => prev.map((t) =>
        t.id === existingLocalId ? { ...t, status: 'running', ... } : t
    ))
    break
}
```

### Fix 3: `confirmSentRef` guard on `confirmAction`

Added a `confirmSentRef` that prevents the `{ type: 'confirm' }` message from being sent more than once per approval cycle. The ref is reset when a new `pause` event arrives (new approval cycle) or when a new message is sent.

```typescript
const confirmAction = useCallback((approved: boolean) => {
    if (confirmSentRef.current) return    // Already sent — bail out
    confirmSentRef.current = true
    ws.send(JSON.stringify({ type: 'confirm', approved }))
    setPendingAction(null)
    setIsTyping(true)
}, [])
```

### Fix 4: `tool_end` uses `serverToolIdMapRef` for correct tool lookup

Instead of relying solely on `currentToolCallRef` (a single mutable ref), `tool_end` now first checks `serverToolIdMapRef` to find the correct local tool ID from the server's `tool_call_id`. This correctly handles concurrent tools and stale refs.

### Additional: Guard resets

- `sendMessage()`, `sendGenerate()`, and `clearMessages()` reset `confirmSentRef` and `serverToolIdMapRef` for each new conversation turn.
- The `pause` handler resets `confirmSentRef` for each new approval cycle.

---

## Why the Fix Works

After the fix, the flow is:

```
User: "create technical ticket"
  │
  ▼
tool_start → ToolExecutionCard (RUNNING)
  │            Uses server tool_call_id for identity
  ▼
pause → ChatPendingAction (approval card appears)
  │       confirmSentRef reset to false
  ▼
User clicks Approve
  │
  ▼
confirmAction(true)
  │  confirmSentRef = true (guards against double-send)
  │  sends { type: 'confirm', approved: true }
  │  setPendingAction(null) → ChatPendingAction unmounts
  ▼
show_ticket_dialogue
  │  Does NOT set pendingAction (Fix #1)
  │  Opens CreateTicketModal only
  ▼
CreateTicketModal visible (no second approval card)
  │
  ▼
User submits modal
  │
  ▼
tool_end → ToolExecutionCard updates to COMPLETED
  │          Uses serverToolIdMapRef for correct lookup
  ▼
done → Stream complete
```

**Guarantees:**
- **One approval**: `pendingAction` is set only by `pause`, never by `show_ticket_dialogue`
- **One execution**: `tool_start` deduplicates by server `tool_call_id`
- **One confirm message**: `confirmSentRef` prevents double-sending at the transport layer
- **One modal**: `setIsCreateTicketModalOpen(true)` is called exactly once per `show_ticket_dialogue` event
- **One tool lifecycle**: `tool_start` → `pause` → `confirm` → `show_ticket_dialogue` → `tool_end` with consistent identity

---

## Edge Cases Tested (Theoretical Analysis)

| Edge Case | Behavior After Fix |
|-----------|-------------------|
| **Approve once** | `confirmAction` sends one confirm, `confirmSentRef` prevents re-send, modal opens, no second approval |
| **Approve rapidly** | First click sends confirm and sets `confirmSentRef=true`; subsequent clicks are no-ops |
| **Reject** | `confirmAction(false)` sends `{ approved: false }`, `pendingAction` cleared, no modal opens |
| **Modal cancel** | Modal closes, tool stays RUNNING until backend sends `tool_end` (backend responsibility) |
| **Modal submit** | Ticket created, modal closes, backend sends `tool_end` → card shows COMPLETED |
| **Multiple tools in same conversation** | Each tool gets unique local ID, `serverToolIdMapRef` tracks all of them, `tool_end` finds correct one |
| **Stream reconnect** | `onclose` handler flushes tokens and schedules reconnect; `mountedRef` guard prevents stale callbacks |
| **React StrictMode** | `mountedRef` guard in `useEffect` + `onclose` handler prevents double WebSocket connections |
| **Page rerender** | All guards are refs (not state), so they persist across re-renders without triggering unnecessary updates |
| **Conversation refresh** | `clearMessages()` resets all guards and refs to clean state |
| **Duplicate `tool_start` from server** | `serverToolIdMapRef` detects existing `tool_call_id` and updates in-place instead of appending |
| **`tool_end` arrives for non-current tool** | `serverToolIdMapRef` lookup finds correct local ID regardless of `currentToolCallRef` state |

---

## Summary

| Aspect | Detail |
|--------|--------|
| **Root cause** | `show_ticket_dialogue` handler called `setPendingAction()`, re-creating the approval card after it had already been approved and dismissed |
| **Contributing causes** | No deduplication in `tool_start`; no double-fire guard in `confirmAction`; fragile tool identity in `tool_end` |
| **Fix strategy** | Remove erroneous `setPendingAction` + add server-ID deduplication + add confirm guard + improve tool lookup |
| **Lines changed** | ~60 lines modified/added in one file |
| **TypeScript** | Compiles cleanly (`tsc --noEmit` passes with zero errors) |
| **Breaking changes** | None — all changes are internal to the WebSocket hook |
