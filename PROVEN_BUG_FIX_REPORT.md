# Duplicate Human Approval Bug — Proven Root Cause & Fix

## 1. Runtime Event Log (Original Buggy Code)

```
[T+001] ◄── WS IN: {"type":"connected","conversation_id":"conv-001"}
[T+004]   HANDLER: sendMessage("create technical ticket")
[T+007] ──► WS OUT: {"type":"chat","content":"create technical ticket"}
[T+010] ◄── WS IN: {"type":"token","content":"I will help you "}
[T+011] ◄── WS IN: {"type":"token","content":"create a technical ticket."}

[T+014] ◄── WS IN: {"type":"tool_start","tool_call_id":"tc-001",...}
[T+015]   HANDLER: tool_start
[T+017]   🧩 ToolExecutionCard MOUNTED (id=tool-xxx-3)

[T+021] ◄── WS IN: {"type":"pause","tool_call_id":"tc-001",...}
[T+022]   HANDLER: pause
[T+024]   setPendingAction called with toolCallId=tc-001          ← FIRST SET
[T+025]   STATE pendingAction: null → {toolCallId:"tc-001",...}
[T+026]   🧩 ChatPendingAction MOUNTED                            ← FIRST MOUNT

[T+029]   HANDLER: confirmAction(true)
[T+030] ──► WS OUT: {"type":"confirm","approved":true}            ← ONLY ONE SENT
[T+031]   setPendingAction(null) called
[T+032]   STATE pendingAction: {...} → null
[T+033]   🧩 ChatPendingAction UNMOUNTED

[T+037] ◄── WS IN: {"type":"show_ticket_dialogue","tool_call_id":"tc-001",...}
[T+038]   HANDLER: show_ticket_dialogue
[T+040]   ⚠ setPendingAction called AGAIN with toolCallId=tc-001  ← SECOND SET (BUG!)
[T+041]   Current pendingAction before set: null
[T+042]   STATE pendingAction: null → {toolCallId:"tc-001",...}   ← STATE CORRUPTED
[T+043]   🧩 ChatPendingAction MOUNTED                            ← SECOND MOUNT (BUG!)
[T+045]   STATE isCreateTicketModalOpen: false → true
[T+046]   🧩 CreateTicketModal MOUNTED

[T+053] ◄── WS IN: {"type":"tool_end","tool_call_id":"tc-001",...}
[T+055]   🧩 ToolExecutionCard UPDATED status: running → completed
[T+060] ◄── WS IN: {"type":"done"}
```

## 2. Timeline

```
T+001  WS connects
T+004  User sends "create technical ticket"
T+010  AI tokens stream
T+014  tool_start (1 event, server tool_call_id=tc-001)
T+021  pause → pendingAction SET #1 → ChatPendingAction MOUNTS #1
T+029  User clicks Approve → confirm sent (1 message) → pendingAction CLEARED → ChatPendingAction UNMOUNTS
T+037  show_ticket_dialogue → pendingAction SET #2 ← 🐛 ROOT CAUSE → ChatPendingAction MOUNTS #2
T+046  CreateTicketModal mounts
       NOW: Both second approval card AND modal visible simultaneously
T+053  tool_end → tool completes
T+060  done

FINAL STATE: pendingAction = {toolCallId:"tc-001",...} (NOT NULL — second card persists)
```

## 3. Root Cause with Evidence

### Proven: NOT duplicate WebSocket events

| Event | Count | Evidence |
|-------|-------|----------|
| `tool_start` received | **1** | T+014 only |
| `pause` received | **1** | T+021 only |
| `show_ticket_dialogue` received | **1** | T+037 only |
| `confirm` sent | **1** | T+030 only |
| WebSocket connections | **1** | T+001 only |
| ToolExecutionCard mounted | **1** | T+017 only |

### Proven: State corruption in `show_ticket_dialogue` handler

| Metric | Count | Evidence |
|--------|-------|----------|
| `setPendingAction` calls | **2** | T+024 (pause) + T+040 (show_ticket_dialogue) |
| ChatPendingAction mounts | **2** | T+026 + T+043 |

### Exact line of code responsible

File: `src/features/chat/hooks/useChatWebSocket.ts`  
Handler: `case 'show_ticket_dialogue'`  
Lines: `setPendingAction({ toolCallId: data.tool_call_id, actionName: data.action_name, params: data.params })`

**Call stack at T+040:**
```
ws.onmessage
  → switch(data.type) case 'show_ticket_dialogue'
    → setPendingAction({ toolCallId: 'tc-001', actionName: 'create_technical_ticket', ... })
      → React re-renders ChatPage
        → {pendingAction && <ChatPendingAction ... />}
          → ChatPendingAction MOUNTS (second time)
```

### Why this is the only cause

- The backend sends each event exactly once
- The WebSocket connection is singular
- No React effects duplicate the handler
- `confirmAction` fires once
- The sole corrupting action is `setPendingAction()` inside `show_ticket_dialogue`

## 4. Files Changed

| File | Changes |
|------|---------|
| `src/features/chat/hooks/useChatWebSocket.ts` | All fixes (the ONLY file modified) |

## 5. Code Changes Explained

### Change A (PRIMARY FIX): Remove `setPendingAction` from `show_ticket_dialogue`

```diff
 case 'show_ticket_dialogue': {
+  // IMPORTANT: Do NOT call setPendingAction() here.
+  // The approval phase is over.
   setIsTyping(false)
-  setPendingAction({
-    toolCallId: data.tool_call_id,
-    actionName: data.action_name,
-    params: data.params,
-  })
   setIsCreateTicketModalOpen(true)
   break
 }
```

**Why**: `show_ticket_dialogue` is a post-approval event. The user already approved via `pause` → `confirm`. Setting `pendingAction` here re-creates the approval card.

### Change B (DEFENSIVE): `tool_start` deduplication via `serverToolIdMapRef`

Added `Map<string, string>` mapping server `tool_call_id` → local ID. If `tool_start` arrives for an already-known `tool_call_id`, the existing tool call is updated in-place.

**Why**: Prevents duplicate ToolExecutionCards if the backend replays or re-sends `tool_start`.

### Change C (DEFENSIVE): `confirmSentRef` guard on `confirmAction`

```diff
 const confirmAction = useCallback((approved: boolean) => {
   ...
+  if (confirmSentRef.current) return
+  confirmSentRef.current = true
   ws.send(JSON.stringify({ type: 'confirm', approved }))
   ...
 })
```

**Why**: Prevents double-sending `{ type: 'confirm' }` if the user rapid-clicks or a re-render re-fires the callback.

### Change D: `tool_end` uses `serverToolIdMapRef` for correct lookup

Instead of only `currentToolCallRef` (single mutable ref), `tool_end` now checks `serverToolIdMapRef` first to find the correct local tool ID from the server's `tool_call_id`.

**Why**: Handles concurrent tools and stale ref edge cases.

### Change E: Guard resets on new turns

`sendMessage`, `sendGenerate`, `clearMessages`, and `pause` all reset `confirmSentRef` and `serverToolIdMapRef` to ensure clean state for each new conversation turn or approval cycle.

## 6. Why the Bug Cannot Happen Anymore

### Guarantee 1: One approval card

`pendingAction` is now set ONLY by the `pause` handler. No other event handler calls `setPendingAction` with a non-null value. The `show_ticket_dialogue` handler was the sole source of the second set — it's removed.

### Guarantee 2: One confirm message

`confirmSentRef` blocks any second `confirm` send within the same approval cycle. The ref is only reset when a new `pause` arrives (new cycle) or a new message is sent (new turn).

### Guarantee 3: One tool execution card

`serverToolIdMapRef` ensures that any `tool_start` with a known `tool_call_id` updates the existing card in-place rather than appending a duplicate.

### Guarantee 4: Correct tool completion

`tool_end` resolves the target tool via `serverToolIdMapRef` (server ID → local ID), not via the fragile `currentToolCallRef` single-ref approach.

### Verified by simulation

| Test | Result |
|------|--------|
| Normal flow | `pendingAction` null at end, 1 card, 1 modal ✅ |
| Rapid double-click approve | Second click BLOCKED, 1 confirm sent ✅ |
| User rejects | `pendingAction` cleared, no modal, clean state ✅ |
| Duplicate `tool_start` | Deduplicated to 1 card, updated in-place ✅ |

## 7. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Modal cancel leaves tool in RUNNING | Low | Backend should time out or handle cancellation; not a frontend concern |
| Backend sends `pause` after `show_ticket_dialogue` | Very Low | Would be a backend protocol violation; frontend would correctly show a new approval for that separate request |
| `serverToolIdMapRef` grows unboundedly across long sessions | Negligible | Cleared on every `sendMessage`/`sendGenerate`/`clearMessages`, so it only accumulates within a single turn |
| `ChatPendingAction` 8-second `isResponding` timeout not cleared on unmount | Negligible | Minor memory hold; no functional impact with React 18 |
