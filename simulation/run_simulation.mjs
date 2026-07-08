// ============================================================
// Runtime Simulation: Chat Tool Execution Lifecycle
// ============================================================
// This script faithfully reproduces the EXACT state machine
// from useChatWebSocket.ts (the ORIGINAL buggy code, unmodified).
//
// It simulates:
//   - React useState / useRef semantics
//   - The WebSocket onmessage event handler (every case branch)
//   - The confirmAction callback
//   - The sendMessage callback
//   - Component mount/unmount (ChatPendingAction, ToolExecutionCard, CreateTicketModal)
//
// Then feeds it the backend event sequence for "create technical ticket"
// and captures the COMPLETE runtime log.
// ============================================================

const LOG = []
let stepCounter = 0

function log(msg) {
  const line = `[T+${String(stepCounter).padStart(3, '0')}] ${msg}`
  LOG.push(line)
  console.log(line)
  stepCounter++
}

function logState(label, prev, next) {
  const prevStr = typeof prev === 'object' ? JSON.stringify(prev) : String(prev)
  const nextStr = typeof next === 'object' ? JSON.stringify(next) : String(next)
  log(`  STATE ${label}: ${prevStr} → ${nextStr}`)
}

function logEvent(direction, data) {
  const dir = direction === 'IN' ? '◄── WS IN' : '──► WS OUT'
  log(`${dir}: ${JSON.stringify(data)}`)
}

function logComponent(name, action) {
  log(`  🧩 ${name} ${action}`)
}

// ============================================================
// Minimal React-like state simulation
// ============================================================
class StateSlot {
  constructor(initial) {
    this.value = initial
    this.listeners = []
  }
  set(newVal) {
    const prev = this.value
    if (typeof newVal === 'function') {
      this.value = newVal(this.value)
    } else {
      this.value = newVal
    }
    // Notify listeners (simulates React re-render effect)
    for (const fn of this.listeners) {
      fn(prev, this.value)
    }
  }
  get() { return this.value }
  onChange(fn) { this.listeners.push(fn) }
}

class RefSlot {
  constructor(initial) { this.current = initial }
}

// ============================================================
// Simulated Hook State (mirrors useChatWebSocket.ts exactly)
// ============================================================
const messages = new StateSlot([])
const connectionStatus = new StateSlot('disconnected')
const isTyping = new StateSlot(false)
const pendingAction = new StateSlot(null)
const toolCalls = new StateSlot([])
const isCreateTicketModalOpen = new StateSlot(false)

// Refs
const wsRef = new RefSlot({ readyState: 1 /* OPEN */, sentMessages: [] })
const aiMsgIdRef = new RefSlot(null)
const aiBufferRef = new RefSlot('')
const currentToolCallRef = new RefSlot(null)
const mountedRef = new RefSlot(true)

// ============================================================
// Component Mount/Unmount tracking
// ============================================================
// ChatPendingAction mounts when pendingAction becomes non-null,
// unmounts when it becomes null.
let pendingActionMounted = false
pendingAction.onChange((prev, next) => {
  logState('pendingAction', prev, next)
  if (next !== null && prev === null) {
    pendingActionMounted = true
    logComponent('ChatPendingAction', 'MOUNTED')
  } else if (next === null && prev !== null) {
    pendingActionMounted = false
    logComponent('ChatPendingAction', 'UNMOUNTED')
  } else if (next !== null && prev !== null) {
    // pendingAction changed reference while already mounted → remount
    // (React would re-render, but if the object identity changed and the
    // component uses the new toolCallId as a key, it could remount)
    logComponent('ChatPendingAction', `RE-RENDERED (new action: ${next.actionName}, toolCallId: ${next.toolCallId})`)
  }
})

// CreateTicketModal mounts when isCreateTicketModalOpen becomes true
let ticketModalMounted = false
isCreateTicketModalOpen.onChange((prev, next) => {
  logState('isCreateTicketModalOpen', prev, next)
  if (next && !prev) {
    ticketModalMounted = true
    logComponent('CreateTicketModal', 'MOUNTED')
  } else if (!next && prev) {
    ticketModalMounted = false
    logComponent('CreateTicketModal', 'UNMOUNTED')
  }
})

// ToolExecutionCard tracking
toolCalls.onChange((prev, next) => {
  const prevIds = prev.map(t => t.id)
  const nextIds = next.map(t => t.id)
  // Detect new tool cards
  for (const id of nextIds) {
    if (!prevIds.includes(id)) {
      logComponent('ToolExecutionCard', `MOUNTED (id=${id})`)
    }
  }
  // Detect status changes
  for (const t of next) {
    const oldT = prev.find(p => p.id === t.id)
    if (oldT && oldT.status !== t.status) {
      logComponent('ToolExecutionCard', `UPDATED id=${t.id} status: ${oldT.status} → ${t.status}`)
    }
  }
  logState('toolCalls', prev.map(t => ({ id: t.id, status: t.status })), next.map(t => ({ id: t.id, status: t.status })))
})

isTyping.onChange((prev, next) => {
  logState('isTyping', prev, next)
})

// ============================================================
// generateId (same as source)
// ============================================================
let idCounter = 0
function generateId() {
  idCounter++
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 9)}`
}

// ============================================================
// EXTRACT OF ORIGINAL onmessage handler (from useChatWebSocket.ts)
// This is a LINE-FOR-LINE reproduction of the switch statement.
// ============================================================
function handleWsMessage(data) {
  logEvent('IN', data)

  switch (data.type) {
    case 'connected': {
      connectionStatus.set('connected')
      break
    }

    case 'token': {
      if (!aiMsgIdRef.current) {
        const id = `ai-${generateId()}`
        aiMsgIdRef.current = id
        aiBufferRef.current = ''
        messages.set((prev) => [...prev, {
          id,
          content: '',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          isStreaming: true,
        }])
      }
      aiBufferRef.current += data.content
      // Simulate flush
      messages.set((prev) => {
        const next = prev.slice()
        const idx = next.findIndex((m) => m.id === aiMsgIdRef.current)
        if (idx === -1) return prev
        next[idx] = { ...next[idx], content: aiBufferRef.current, isStreaming: true }
        return next
      })
      break
    }

    case 'tool_start': {
      log('  HANDLER: tool_start')
      const toolCall = {
        id: `tool-${generateId()}`,
        name: data.name || 'Tool',
        status: 'running',
        input: data.input || {},
        startTime: new Date().toISOString(),
      }
      log(`  currentToolCallRef: ${currentToolCallRef.current ? currentToolCallRef.current.id : 'null'} → ${toolCall.id}`)
      currentToolCallRef.current = toolCall
      toolCalls.set((prev) => [...prev, toolCall])
      messages.set((prev) => [...prev, {
        id: toolCall.id,
        content: `Running ${toolCall.name}...`,
        sender: 'system',
        timestamp: new Date().toISOString(),
        toolCalls: [toolCall],
      }])
      break
    }

    case 'tool_end': {
      log('  HANDLER: tool_end')
      const completedTool = currentToolCallRef.current
      if (completedTool) {
        const updatedTool = {
          ...completedTool,
          status: 'completed',
          output: data.output || 'Completed',
          endTime: new Date().toISOString(),
        }
        toolCalls.set((prev) =>
          prev.map((t) => t.id === completedTool.id ? updatedTool : t)
        )
        messages.set((prev) =>
          prev.map((m) =>
            m.id === completedTool.id
              ? { ...m, content: `${data.name} completed`, toolCalls: [updatedTool] }
              : m
          )
        )
        log(`  currentToolCallRef: ${completedTool.id} → null`)
        currentToolCallRef.current = null
      } else {
        log('  ⚠ currentToolCallRef is null — tool_end has no target!')
      }
      break
    }

    case 'pause': {
      log('  HANDLER: pause')
      isTyping.set(false)
      if (aiMsgIdRef.current) {
        messages.set((prev) =>
          prev.map((m) =>
            m.id === aiMsgIdRef.current ? { ...m, isStreaming: false } : m
          )
        )
      }
      const newPendingAction = {
        toolCallId: data.tool_call_id || 'unknown',
        actionName: data.action_name || 'Action',
        params: data.params || {},
      }
      log(`  setPendingAction called with toolCallId=${newPendingAction.toolCallId}, actionName=${newPendingAction.actionName}`)
      pendingAction.set(newPendingAction)
      break
    }

    case 'done': {
      log('  HANDLER: done')
      isTyping.set(false)
      if (aiMsgIdRef.current) {
        messages.set((prev) =>
          prev.map((m) =>
            m.id === aiMsgIdRef.current ? { ...m, isStreaming: false } : m
          )
        )
      }
      aiMsgIdRef.current = null
      aiBufferRef.current = ''
      break
    }

    case 'error': {
      log('  HANDLER: error')
      isTyping.set(false)
      messages.set((prev) => [...prev, {
        id: `err-${generateId()}`,
        content: data.message || 'An error occurred.',
        sender: 'system',
        timestamp: new Date().toISOString(),
        isError: true,
      }])
      break
    }

    case 'ended': {
      connectionStatus.set('disconnected')
      break
    }

    case 'edit_successful': {
      break
    }

    case 'stopped': {
      isTyping.set(false)
      if (aiMsgIdRef.current) {
        messages.set((prev) =>
          prev.map((m) =>
            m.id === aiMsgIdRef.current ? { ...m, isStreaming: false } : m
          )
        )
      }
      break
    }

    case 'show_ticket_dialogue': {
      log('  HANDLER: show_ticket_dialogue')
      isTyping.set(false)
      const newPendingAction = {
        toolCallId: data.tool_call_id,
        actionName: data.action_name,
        params: data.params,
      }
      log(`  ⚠ setPendingAction called AGAIN with toolCallId=${newPendingAction.toolCallId}, actionName=${newPendingAction.actionName}`)
      log(`  Current pendingAction before set: ${JSON.stringify(pendingAction.get())}`)
      pendingAction.set(newPendingAction)
      log(`  setIsCreateTicketModalOpen(true) called`)
      isCreateTicketModalOpen.set(true)
      break
    }
  }
}

// ============================================================
// confirmAction (ORIGINAL, unmodified)
// ============================================================
function confirmAction(approved) {
  log(`  HANDLER: confirmAction(${approved})`)
  const ws = wsRef.current
  if (!ws || ws.readyState !== 1) {
    log('  ⚠ WebSocket not open, skipping')
    return
  }

  const outgoing = { type: 'confirm', approved }
  logEvent('OUT', outgoing)
  ws.sentMessages.push(outgoing)

  log(`  setPendingAction(null) called`)
  pendingAction.set(null)
  isTyping.set(true)
}

// ============================================================
// sendMessage (ORIGINAL, unmodified)
// ============================================================
function sendMessage(content) {
  log(`  HANDLER: sendMessage("${content}")`)
  const userMsg = {
    id: `user-${generateId()}`,
    content: content.trim(),
    sender: 'user',
    timestamp: new Date().toISOString(),
  }
  messages.set((prev) => [...prev, userMsg])
  isTyping.set(true)
  pendingAction.set(null)

  const outgoing = { type: 'chat', content: content.trim() }
  logEvent('OUT', outgoing)
}

// ============================================================
// SIMULATION: "create technical ticket" full lifecycle
// ============================================================
console.log('')
console.log('═'.repeat(80))
console.log('  SIMULATION: ORIGINAL (BUGGY) CODE')
console.log('  Scenario: User sends "create technical ticket"')
console.log('═'.repeat(80))
console.log('')

// Phase 1: Connection
log('─── PHASE 1: WebSocket Connection ───')
handleWsMessage({ type: 'connected', conversation_id: 'conv-001' })

// Phase 2: User sends message
log('')
log('─── PHASE 2: User sends "create technical ticket" ───')
sendMessage('create technical ticket')

// Phase 3: AI starts streaming tokens
log('')
log('─── PHASE 3: AI streams response tokens ───')
handleWsMessage({ type: 'token', content: 'I will help you ' })
handleWsMessage({ type: 'token', content: 'create a technical ticket.' })

// Phase 4: Tool execution starts
log('')
log('─── PHASE 4: Backend sends tool_start ───')
handleWsMessage({
  type: 'tool_start',
  tool_call_id: 'tc-001',
  name: 'create_technical_ticket',
  input: { category: 'technical', priority: 'medium' }
})

// Phase 5: Backend requests human approval
log('')
log('─── PHASE 5: Backend sends pause (approval required) ───')
handleWsMessage({
  type: 'pause',
  tool_call_id: 'tc-001',
  action_name: 'create_technical_ticket',
  params: { category: 'technical', priority: 'medium' }
})

// Phase 6: User clicks Approve
log('')
log('─── PHASE 6: User clicks APPROVE ───')
confirmAction(true)

// Phase 7: Backend resumes and sends show_ticket_dialogue
log('')
log('─── PHASE 7: Backend sends show_ticket_dialogue ───')
handleWsMessage({
  type: 'show_ticket_dialogue',
  tool_call_id: 'tc-001',
  action_name: 'create_technical_ticket',
  params: { category: 'technical', priority: 'medium' }
})

// Phase 8: User submits modal (ticket created)
log('')
log('─── PHASE 8: User submits CreateTicketModal ───')
isCreateTicketModalOpen.set(false)

// Phase 9: Backend sends tool_end
log('')
log('─── PHASE 9: Backend sends tool_end ───')
handleWsMessage({
  type: 'tool_end',
  tool_call_id: 'tc-001',
  name: 'create_technical_ticket',
  output: 'Ticket #1234 created successfully'
})

// Phase 10: Backend sends done
log('')
log('─── PHASE 10: Backend sends done ───')
handleWsMessage({ type: 'done' })

// ============================================================
// ANALYSIS
// ============================================================
console.log('')
console.log('═'.repeat(80))
console.log('  ANALYSIS')
console.log('═'.repeat(80))
console.log('')

const pendingActionSets = LOG.filter(l => l.includes('setPendingAction called'))
const confirmSends = LOG.filter(l => l.includes('OUT') && l.includes('confirm'))
const toolStarts = LOG.filter(l => l.includes('HANDLER: tool_start'))
const pauses = LOG.filter(l => l.includes('HANDLER: pause'))
const showDialogues = LOG.filter(l => l.includes('HANDLER: show_ticket_dialogue'))
const pendingMounts = LOG.filter(l => l.includes('ChatPendingAction') && l.includes('MOUNTED'))
const pendingUnmounts = LOG.filter(l => l.includes('ChatPendingAction') && l.includes('UNMOUNTED'))
const modalMounts = LOG.filter(l => l.includes('CreateTicketModal') && l.includes('MOUNTED'))
const toolCardMounts = LOG.filter(l => l.includes('ToolExecutionCard') && l.includes('MOUNTED'))

console.log(`setPendingAction calls:        ${pendingActionSets.length}`)
pendingActionSets.forEach(l => console.log(`  ${l}`))
console.log(`confirm messages sent:          ${confirmSends.length}`)
confirmSends.forEach(l => console.log(`  ${l}`))
console.log(`tool_start events received:     ${toolStarts.length}`)
console.log(`pause events received:          ${pauses.length}`)
console.log(`show_ticket_dialogue received:   ${showDialogues.length}`)
console.log(`ChatPendingAction MOUNTED:       ${pendingMounts.length}`)
pendingMounts.forEach(l => console.log(`  ${l}`))
console.log(`ChatPendingAction UNMOUNTED:     ${pendingUnmounts.length}`)
pendingUnmounts.forEach(l => console.log(`  ${l}`))
console.log(`CreateTicketModal MOUNTED:       ${modalMounts.length}`)
console.log(`ToolExecutionCard MOUNTED:       ${toolCardMounts.length}`)
toolCardMounts.forEach(l => console.log(`  ${l}`))

console.log('')
console.log('─'.repeat(80))
console.log('  FINAL STATE:')
console.log(`  pendingAction:      ${JSON.stringify(pendingAction.get())}`)
console.log(`  isCreateTicketModalOpen: ${isCreateTicketModalOpen.get()}`)
console.log(`  toolCalls:          ${JSON.stringify(toolCalls.get().map(t => ({ id: t.id, name: t.name, status: t.status })))}`)
console.log(`  messages count:     ${messages.get().length}`)
console.log(`  confirm sent count: ${wsRef.current.sentMessages.filter(m => m.type === 'confirm').length}`)
console.log('─'.repeat(80))

console.log('')
console.log('─'.repeat(80))
console.log('  VERDICT:')
if (pendingAction.get() !== null) {
  console.log('  🐛 BUG CONFIRMED: pendingAction is NOT null at end of flow.')
  console.log(`     Value: ${JSON.stringify(pendingAction.get())}`)
  console.log('     This means a SECOND approval card is visible to the user.')
} else {
  console.log('  ✅ pendingAction is null — no duplicate approval card.')
}

const toolRunning = toolCalls.get().filter(t => t.status === 'running')
if (toolRunning.length > 0) {
  console.log(`  ⚠ ${toolRunning.length} tool(s) still in RUNNING state: ${toolRunning.map(t => t.id).join(', ')}`)
} else {
  console.log('  ✅ All tools are in terminal state.')
}

if (pendingMounts.length > 1) {
  console.log(`  🐛 ChatPendingAction mounted ${pendingMounts.length} times — duplicate approval cards!`)
} else {
  console.log('  ✅ ChatPendingAction mounted exactly once.')
}
console.log('─'.repeat(80))
