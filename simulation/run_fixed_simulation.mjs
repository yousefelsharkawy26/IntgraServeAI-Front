// ============================================================
// Runtime Simulation: FIXED CODE
// ============================================================
// Same exact simulation, but with the show_ticket_dialogue
// handler corrected (setPendingAction removed).
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

const messages = new StateSlot([])
const connectionStatus = new StateSlot('disconnected')
const isTyping = new StateSlot(false)
const pendingAction = new StateSlot(null)
const toolCalls = new StateSlot([])
const isCreateTicketModalOpen = new StateSlot(false)

const wsRef = new RefSlot({ readyState: 1, sentMessages: [] })
const aiMsgIdRef = new RefSlot(null)
const aiBufferRef = new RefSlot('')
const currentToolCallRef = new RefSlot(null)
const mountedRef = new RefSlot(true)
// NEW: Deduplication map and confirm guard (from fix)
const serverToolIdMapRef = new RefSlot(new Map())
const confirmSentRef = new RefSlot(false)

let pendingActionMounted = false
pendingAction.onChange((prev, next) => {
  logState('pendingAction', prev, next)
  if (next !== null && prev === null) {
    pendingActionMounted = true
    logComponent('ChatPendingAction', 'MOUNTED')
  } else if (next === null && prev !== null) {
    pendingActionMounted = false
    logComponent('ChatPendingAction', 'UNMOUNTED')
  }
})

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

toolCalls.onChange((prev, next) => {
  const prevIds = prev.map(t => t.id)
  for (const t of next) {
    if (!prevIds.includes(t.id)) {
      logComponent('ToolExecutionCard', `MOUNTED (id=${t.id})`)
    }
  }
  for (const t of next) {
    const oldT = prev.find(p => p.id === t.id)
    if (oldT && oldT.status !== t.status) {
      logComponent('ToolExecutionCard', `UPDATED id=${t.id} status: ${oldT.status} → ${t.status}`)
    }
  }
  logState('toolCalls', prev.map(t => ({ id: t.id, status: t.status })), next.map(t => ({ id: t.id, status: t.status })))
})

isTyping.onChange((prev, next) => logState('isTyping', prev, next))

let idCounter = 0
function generateId() {
  idCounter++
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 9)}`
}

// ============================================================
// FIXED onmessage handler
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
        messages.set((prev) => [...prev, { id, content: '', sender: 'ai', timestamp: new Date().toISOString(), isStreaming: true }])
      }
      aiBufferRef.current += data.content
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
      const serverToolCallId = data.tool_call_id

      // FIX: Deduplication by server tool_call_id
      if (serverToolCallId && serverToolIdMapRef.current.has(serverToolCallId)) {
        const existingLocalId = serverToolIdMapRef.current.get(serverToolCallId)
        log(`  DEDUP: tool_call_id=${serverToolCallId} already exists as ${existingLocalId}, updating in-place`)
        toolCalls.set((prev) => {
          const updated = prev.map((t) =>
            t.id === existingLocalId
              ? { ...t, status: 'running', name: data.name || t.name, input: data.input || t.input }
              : t
          )
          const found = updated.find((t) => t.id === existingLocalId)
          if (found) currentToolCallRef.current = found
          return updated
        })
        break
      }

      const localId = `tool-${generateId()}`
      const toolCall = {
        id: localId,
        name: data.name || 'Tool',
        status: 'running',
        input: data.input || {},
        startTime: new Date().toISOString(),
      }

      if (serverToolCallId) {
        serverToolIdMapRef.current.set(serverToolCallId, localId)
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
      const endServerId = data.tool_call_id
      let targetLocalId = null

      if (endServerId && serverToolIdMapRef.current.has(endServerId)) {
        targetLocalId = serverToolIdMapRef.current.get(endServerId)
      } else if (currentToolCallRef.current) {
        targetLocalId = currentToolCallRef.current.id
      }

      if (targetLocalId) {
        const completedToolRef = currentToolCallRef.current
        const outputText = data.output || 'Completed'
        const endTime = new Date().toISOString()
        const displayName = data.name

        toolCalls.set((prev) => {
          const target = prev.find((t) => t.id === targetLocalId)
          if (!target) return prev
          const updatedTool = { ...target, status: 'completed', output: outputText, endTime }
          if (completedToolRef?.id === targetLocalId) currentToolCallRef.current = null
          return prev.map((t) => t.id === targetLocalId ? updatedTool : t)
        })
        messages.set((prev) =>
          prev.map((m) => {
            if (m.id !== targetLocalId) return m
            const tool = m.toolCalls?.[0]
            const updatedTool = tool
              ? { ...tool, status: 'completed', output: outputText, endTime }
              : { id: targetLocalId, name: displayName || 'Tool', status: 'completed', output: outputText, endTime }
            return { ...m, content: `${displayName || updatedTool.name} completed`, toolCalls: [updatedTool] }
          })
        )
      }
      break
    }

    case 'pause': {
      log('  HANDLER: pause')
      isTyping.set(false)
      if (aiMsgIdRef.current) {
        messages.set((prev) =>
          prev.map((m) => m.id === aiMsgIdRef.current ? { ...m, isStreaming: false } : m)
        )
      }
      // FIX: Reset confirm guard for new approval cycle
      confirmSentRef.current = false
      const newPendingAction = {
        toolCallId: data.tool_call_id || 'unknown',
        actionName: data.action_name || 'Action',
        params: data.params || {},
      }
      log(`  setPendingAction called with toolCallId=${newPendingAction.toolCallId}`)
      pendingAction.set(newPendingAction)
      break
    }

    case 'done': {
      log('  HANDLER: done')
      isTyping.set(false)
      if (aiMsgIdRef.current) {
        messages.set((prev) =>
          prev.map((m) => m.id === aiMsgIdRef.current ? { ...m, isStreaming: false } : m)
        )
      }
      aiMsgIdRef.current = null
      aiBufferRef.current = ''
      break
    }

    case 'error': {
      log('  HANDLER: error')
      isTyping.set(false)
      break
    }

    case 'show_ticket_dialogue': {
      // FIX: Do NOT call setPendingAction. The approval phase is over.
      log('  HANDLER: show_ticket_dialogue')
      log('  FIX: NOT calling setPendingAction — approval already completed')
      isTyping.set(false)
      log(`  setIsCreateTicketModalOpen(true) called`)
      isCreateTicketModalOpen.set(true)
      break
    }
  }
}

// FIXED confirmAction with guard
function confirmAction(approved) {
  log(`  HANDLER: confirmAction(${approved})`)
  const ws = wsRef.current
  if (!ws || ws.readyState !== 1) {
    log('  ⚠ WebSocket not open, skipping')
    return
  }

  // FIX: Guard against double-fire
  if (confirmSentRef.current) {
    log('  🛡 GUARD: confirm already sent this cycle — BLOCKED')
    return
  }
  confirmSentRef.current = true

  const outgoing = { type: 'confirm', approved }
  logEvent('OUT', outgoing)
  ws.sentMessages.push(outgoing)

  log(`  setPendingAction(null) called`)
  pendingAction.set(null)
  isTyping.set(true)
}

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
  // FIX: Reset guards for new turn
  confirmSentRef.current = false
  serverToolIdMapRef.current.clear()

  const outgoing = { type: 'chat', content: content.trim() }
  logEvent('OUT', outgoing)
}

// ============================================================
// TEST 1: Normal "create technical ticket" flow
// ============================================================
console.log('')
console.log('═'.repeat(80))
console.log('  SIMULATION: FIXED CODE — Test 1: Normal Flow')
console.log('═'.repeat(80))
console.log('')

log('─── Phase 1: Connection ───')
handleWsMessage({ type: 'connected', conversation_id: 'conv-001' })

log('')
log('─── Phase 2: User sends message ───')
sendMessage('create technical ticket')

log('')
log('─── Phase 3: AI streams ───')
handleWsMessage({ type: 'token', content: 'I will help you create a technical ticket.' })

log('')
log('─── Phase 4: tool_start ───')
handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-001', name: 'create_technical_ticket', input: { category: 'technical' } })

log('')
log('─── Phase 5: pause ───')
handleWsMessage({ type: 'pause', tool_call_id: 'tc-001', action_name: 'create_technical_ticket', params: { category: 'technical' } })

log('')
log('─── Phase 6: User clicks Approve ───')
confirmAction(true)

log('')
log('─── Phase 7: show_ticket_dialogue ───')
handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-001', action_name: 'create_technical_ticket', params: { category: 'technical' } })

log('')
log('─── Phase 8: User submits modal ───')
isCreateTicketModalOpen.set(false)

log('')
log('─── Phase 9: tool_end ───')
handleWsMessage({ type: 'tool_end', tool_call_id: 'tc-001', name: 'create_technical_ticket', output: 'Ticket created' })

log('')
log('─── Phase 10: done ───')
handleWsMessage({ type: 'done' })

// ============================================================
// TEST 2: Rapid approve (double-click)
// ============================================================
console.log('')
console.log('═'.repeat(80))
console.log('  SIMULATION: FIXED CODE — Test 2: Rapid Double-Click Approve')
console.log('═'.repeat(80))
console.log('')

// Reset state
stepCounter = 0
LOG.length = 0
messages.set([])
pendingAction.set(null)
toolCalls.set([])
isCreateTicketModalOpen.set(false)
isTyping.set(false)
aiMsgIdRef.current = null
currentToolCallRef.current = null
confirmSentRef.current = false
serverToolIdMapRef.current.clear()
wsRef.current.sentMessages = []

log('─── Setup ───')
handleWsMessage({ type: 'connected', conversation_id: 'conv-002' })
sendMessage('create technical ticket')
handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-002', name: 'create_technical_ticket', input: {} })
handleWsMessage({ type: 'pause', tool_call_id: 'tc-002', action_name: 'create_technical_ticket', params: {} })

log('')
log('─── User rapid-clicks Approve TWICE ───')
confirmAction(true)
confirmAction(true)  // Second click should be BLOCKED

log('')
log('─── show_ticket_dialogue arrives ───')
handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-002', action_name: 'create_technical_ticket', params: {} })

// ============================================================
// TEST 3: Reject
// ============================================================
console.log('')
console.log('═'.repeat(80))
console.log('  SIMULATION: FIXED CODE — Test 3: User Rejects')
console.log('═'.repeat(80))
console.log('')

stepCounter = 0
LOG.length = 0
messages.set([])
pendingAction.set(null)
toolCalls.set([])
isCreateTicketModalOpen.set(false)
isTyping.set(false)
aiMsgIdRef.current = null
currentToolCallRef.current = null
confirmSentRef.current = false
serverToolIdMapRef.current.clear()
wsRef.current.sentMessages = []

log('─── Setup ───')
handleWsMessage({ type: 'connected', conversation_id: 'conv-003' })
sendMessage('create technical ticket')
handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-003', name: 'create_technical_ticket', input: {} })
handleWsMessage({ type: 'pause', tool_call_id: 'tc-003', action_name: 'create_technical_ticket', params: {} })

log('')
log('─── User clicks DECLINE ───')
confirmAction(false)

log('')
log('─── Backend sends error ───')
handleWsMessage({ type: 'error', message: 'Action declined by user' })
handleWsMessage({ type: 'done' })

// ============================================================
// TEST 4: Duplicate tool_start from backend
// ============================================================
console.log('')
console.log('═'.repeat(80))
console.log('  SIMULATION: FIXED CODE — Test 4: Duplicate tool_start')
console.log('═'.repeat(80))
console.log('')

stepCounter = 0
LOG.length = 0
messages.set([])
pendingAction.set(null)
toolCalls.set([])
isCreateTicketModalOpen.set(false)
isTyping.set(false)
aiMsgIdRef.current = null
currentToolCallRef.current = null
confirmSentRef.current = false
serverToolIdMapRef.current.clear()
wsRef.current.sentMessages = []

log('─── Setup ───')
handleWsMessage({ type: 'connected', conversation_id: 'conv-004' })
sendMessage('create technical ticket')

log('')
log('─── First tool_start ───')
handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-004', name: 'create_technical_ticket', input: {} })

log('')
log('─── DUPLICATE tool_start (same tool_call_id) ───')
handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-004', name: 'create_technical_ticket', input: {} })

log('')
log('─── Verify: only 1 ToolExecutionCard should exist ───')
log(`toolCalls count: ${toolCalls.get().length}`)

// ============================================================
// COMPREHENSIVE VERDICT
// ============================================================
console.log('')
console.log('═'.repeat(80))
console.log('  FINAL VERDICT — ALL TESTS')
console.log('═'.repeat(80))
console.log('')

// Check test 1 final state
console.log('Test 1 (Normal flow):')
console.log(`  pendingAction: ${JSON.stringify(pendingAction.get())}`)
console.log(`  toolCalls: ${toolCalls.get().length} (should be 1)`)
console.log(`  All tools completed: ${toolCalls.get().every(t => t.status === 'completed')}`)
