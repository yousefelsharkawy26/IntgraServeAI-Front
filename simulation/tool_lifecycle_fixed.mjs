// ============================================================
// Verification Simulation: FIXED Tool Lifecycle
// ============================================================
// Replays the same 4 scenarios against the FIXED state machine
// to prove every tool reaches a terminal state.
// ============================================================

const LOG = []
let step = 0

function log(msg) {
  const line = `[T+${String(step).padStart(3,'0')}] ${msg}`
  LOG.push(line)
  console.log(line)
  step++
}

class State {
  constructor(v) { this.value = v; this.listeners = [] }
  set(v) {
    const prev = this.value
    this.value = typeof v === 'function' ? v(this.value) : v
    this.listeners.forEach(fn => fn(prev, this.value))
  }
  get() { return this.value }
  on(fn) { this.listeners.push(fn) }
}
class Ref { constructor(v) { this.current = v } }

function generateId() { return `tool-${Date.now()}-${Math.random().toString(36).slice(2,9)}` }

function createFixedHookState() {
  const messages = new State([])
  const isTyping = new State(false)
  const pendingAction = new State(null)
  const toolCalls = new State([])
  const isCreateTicketModalOpen = new State(false)

  const currentToolCallRef = new Ref(null)
  const serverToolIdMapRef = new Ref(new Map())
  const confirmSentRef = new Ref(false)
  const activeToolCallIdRef = new Ref(null)
  const aiMsgIdRef = new Ref(null)
  const sentWsMessages = []

  toolCalls.on((prev, next) => {
    for (const t of next) {
      const old = prev.find(p => p.id === t.id)
      if (!old) log(`  Tool ${t.id.slice(0,16)} CREATED: status=${t.status}`)
      else if (old.status !== t.status) log(`  Tool ${t.id.slice(0,16)}: ${old.status} → ${t.status}`)
    }
  })

  function handleWsMessage(data) {
    log(`◄── WS IN: ${data.type}${data.tool_call_id ? ` (tool_call_id=${data.tool_call_id})` : ''}`)

    switch (data.type) {
      case 'connected': break
      case 'token': {
        if (!aiMsgIdRef.current) {
          aiMsgIdRef.current = `ai-${generateId()}`
          messages.set(prev => [...prev, { id: aiMsgIdRef.current, content: '', sender: 'ai', isStreaming: true }])
        }
        break
      }
      case 'tool_start': {
        const serverToolCallId = data.tool_call_id
        if (serverToolCallId && serverToolIdMapRef.current.has(serverToolCallId)) {
          const existingLocalId = serverToolIdMapRef.current.get(serverToolCallId)
          toolCalls.set(prev => prev.map(t => t.id === existingLocalId ? { ...t, status: 'running', name: data.name || t.name } : t))
          break
        }
        const localId = generateId()
        const toolCall = { id: localId, serverToolCallId, name: data.name || 'Tool', status: 'running', input: data.input || {}, startTime: new Date().toISOString() }
        if (serverToolCallId) {
          serverToolIdMapRef.current.set(serverToolCallId, localId)
          activeToolCallIdRef.current = serverToolCallId
        }
        currentToolCallRef.current = toolCall
        toolCalls.set(prev => [...prev, toolCall])
        messages.set(prev => [...prev, { id: toolCall.id, content: `Running ${toolCall.name}...`, sender: 'system', toolCalls: [toolCall] }])
        break
      }
      case 'tool_end': {
        const endServerId = data.tool_call_id
        let targetLocalId = null
        if (endServerId && serverToolIdMapRef.current.has(endServerId)) {
          targetLocalId = serverToolIdMapRef.current.get(endServerId)
        } else if (currentToolCallRef.current) {
          targetLocalId = currentToolCallRef.current.id
        }
        if (targetLocalId) {
          const completedToolRef = currentToolCallRef.current
          toolCalls.set(prev => {
            const target = prev.find(t => t.id === targetLocalId)
            if (!target || target.status !== 'running') return prev
            const updatedTool = { ...target, status: 'completed', output: data.output || 'Completed', endTime: new Date().toISOString() }
            if (completedToolRef?.id === targetLocalId) currentToolCallRef.current = null
            return prev.map(t => t.id === targetLocalId ? updatedTool : t)
          })
        }
        break
      }
      case 'pause': {
        isTyping.set(false)
        confirmSentRef.current = false
        const pauseServerId = data.tool_call_id
        if (pauseServerId) activeToolCallIdRef.current = pauseServerId
        const pauseLocalId = pauseServerId ? serverToolIdMapRef.current.get(pauseServerId) ?? null : currentToolCallRef.current?.id ?? null
        if (pauseLocalId) {
          toolCalls.set(prev => prev.map(t => t.id === pauseLocalId ? { ...t, status: 'waiting_for_approval' } : t))
          messages.set(prev => prev.map(m => m.id !== pauseLocalId || !m.toolCalls?.length ? m : { ...m, toolCalls: [{ ...m.toolCalls[0], status: 'waiting_for_approval' }] }))
        }
        pendingAction.set({ toolCallId: data.tool_call_id || 'unknown', actionName: data.action_name, params: data.params || {} })
        break
      }
      case 'done': {
        isTyping.set(false)
        aiMsgIdRef.current = null
        // FIX: Finalize any running tools when done arrives
        const now = new Date().toISOString()
        toolCalls.set(prev => {
          if (!prev.some(t => t.status === 'running')) return prev
          return prev.map(t => t.status === 'running' ? { ...t, status: 'completed', output: 'Completed', endTime: now } : t)
        })
        currentToolCallRef.current = null
        activeToolCallIdRef.current = null
        break
      }
      case 'show_ticket_dialogue': {
        isTyping.set(false)
        if (data.tool_call_id) activeToolCallIdRef.current = data.tool_call_id
        isCreateTicketModalOpen.set(true)
        break
      }
      case 'error': { isTyping.set(false); break }
    }
  }

  function confirmAction(approved) {
    log(`──► WS OUT: { type: 'confirm', approved: ${approved} }`)
    if (confirmSentRef.current) { log('  🛡 GUARD: blocked'); return }
    confirmSentRef.current = true
    sentWsMessages.push({ type: 'confirm', approved })
    pendingAction.set(null)
    isTyping.set(true)

    if (approved) {
      // FIX: Transition tool back to 'running'
      const approveServerId = activeToolCallIdRef.current
      const approveLocalId = approveServerId ? serverToolIdMapRef.current.get(approveServerId) ?? null : currentToolCallRef.current?.id ?? null
      if (approveLocalId) {
        toolCalls.set(prev => prev.map(t => t.id === approveLocalId ? { ...t, status: 'running' } : t))
      }
    } else {
      // FIX: Mark tool as cancelled
      const declineServerId = activeToolCallIdRef.current
      const declineLocalId = declineServerId ? serverToolIdMapRef.current.get(declineServerId) ?? null : currentToolCallRef.current?.id ?? null
      if (declineLocalId) {
        const now = new Date().toISOString()
        toolCalls.set(prev => prev.map(t => t.id === declineLocalId ? { ...t, status: 'cancelled', output: 'Declined by user', endTime: now } : t))
        currentToolCallRef.current = null
        activeToolCallIdRef.current = null
      }
    }
  }

  // FIX: completeToolCall function
  function completeToolCall(status = 'completed', output) {
    const serverId = activeToolCallIdRef.current
    let targetLocalId = null
    if (serverId && serverToolIdMapRef.current.has(serverId)) {
      targetLocalId = serverToolIdMapRef.current.get(serverId)
    } else if (currentToolCallRef.current) {
      targetLocalId = currentToolCallRef.current.id
    }
    if (!targetLocalId) { log(`  completeToolCall(${status}): no active tool found (no-op)`); return }

    const endTime = new Date().toISOString()
    const outputText = output || (status === 'completed' ? 'Completed' : status)
    const completedToolRef = currentToolCallRef.current

    toolCalls.set(prev => {
      const target = prev.find(t => t.id === targetLocalId)
      if (!target || target.status !== 'running' && target.status !== 'waiting_for_approval') return prev
      const updatedTool = { ...target, status, output: outputText, endTime }
      if (completedToolRef?.id === targetLocalId) currentToolCallRef.current = null
      return prev.map(t => t.id === targetLocalId ? updatedTool : t)
    })

    activeToolCallIdRef.current = null
    log(`──► WS OUT: { type: 'tool_complete', tool_call_id: '${serverId}', status: '${status}' }`)
  }

  function sendMessage(content) {
    log(`──► WS OUT: { type: 'chat', content: '${content}' }`)
    confirmSentRef.current = false
    // FIX: Do NOT clear serverToolIdMapRef here
    pendingAction.set(null)
    isTyping.set(true)
  }

  function submitTicketModal() {
    log('  📋 CreateTicketModal: REST API createTicket() → onSuccess')
    completeToolCall('completed', 'Ticket created successfully')
    log('  📋 CreateTicketModal: onClose()')
    completeToolCall('cancelled', 'Cancelled by user') // no-op since already completed
    isCreateTicketModalOpen.set(false)
  }

  function cancelModal() {
    log('  📋 CreateTicketModal: user clicked Cancel → onClose()')
    completeToolCall('cancelled', 'Cancelled by user')
    isCreateTicketModalOpen.set(false)
  }

  return { messages, isTyping, pendingAction, toolCalls, isCreateTicketModalOpen, sentWsMessages, handleWsMessage, confirmAction, sendMessage, completeToolCall, submitTicketModal, cancelModal }
}


// ============================================================
// SCENARIO A: Normal flow (backend sends tool_end)
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  SCENARIO A: Normal flow — backend sends tool_end')
console.log('═'.repeat(80) + '\n')

let s = createFixedHookState()
s.handleWsMessage({ type: 'connected' })
s.sendMessage('create technical ticket')
s.handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-A', name: 'create_technical_ticket', input: {} })
s.handleWsMessage({ type: 'pause', tool_call_id: 'tc-A', action_name: 'create_technical_ticket', params: {} })
s.confirmAction(true)
s.handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-A', action_name: 'create_technical_ticket', params: {} })
s.submitTicketModal()
s.handleWsMessage({ type: 'tool_end', tool_call_id: 'tc-A', name: 'create_technical_ticket', output: 'Ticket created' })
s.handleWsMessage({ type: 'done' })

log('')
log(`FINAL: ${JSON.stringify(s.toolCalls.get().map(t => ({ id: t.id.slice(0,12), status: t.status })))}`)
log(`VERDICT: ${s.toolCalls.get().every(t => t.status !== 'running' && t.status !== 'waiting_for_approval') ? '✅ All tools in terminal state' : '🐛 Tool stuck'}`)


// ============================================================
// SCENARIO B: Backend NEVER sends tool_end (the real bug)
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  SCENARIO B: Backend never sends tool_end — modal submit completes tool')
console.log('═'.repeat(80) + '\n')

s = createFixedHookState()
s.handleWsMessage({ type: 'connected' })
s.sendMessage('create technical ticket')
s.handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-B', name: 'create_technical_ticket', input: {} })
s.handleWsMessage({ type: 'pause', tool_call_id: 'tc-B', action_name: 'create_technical_ticket', params: {} })
s.confirmAction(true)
s.handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-B', action_name: 'create_technical_ticket', params: {} })
log('')
log('--- User submits modal (REST API) ---')
s.submitTicketModal()
log('')
log('--- Backend sends done ---')
s.handleWsMessage({ type: 'done' })

log('')
log(`FINAL: ${JSON.stringify(s.toolCalls.get().map(t => ({ id: t.id.slice(0,12), status: t.status })))}`)
log(`VERDICT: ${s.toolCalls.get().every(t => t.status !== 'running' && t.status !== 'waiting_for_approval') ? '✅ All tools in terminal state' : '🐛 Tool stuck'}`)


// ============================================================
// SCENARIO C: User cancels modal
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  SCENARIO C: User cancels modal → tool cancelled')
console.log('═'.repeat(80) + '\n')

s = createFixedHookState()
s.handleWsMessage({ type: 'connected' })
s.sendMessage('create technical ticket')
s.handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-C', name: 'create_technical_ticket', input: {} })
s.handleWsMessage({ type: 'pause', tool_call_id: 'tc-C', action_name: 'create_technical_ticket', params: {} })
s.confirmAction(true)
s.handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-C', action_name: 'create_technical_ticket', params: {} })
log('')
log('--- User clicks Cancel ---')
s.cancelModal()
s.handleWsMessage({ type: 'done' })

log('')
log(`FINAL: ${JSON.stringify(s.toolCalls.get().map(t => ({ id: t.id.slice(0,12), status: t.status })))}`)
log(`VERDICT: ${s.toolCalls.get().every(t => t.status !== 'running' && t.status !== 'waiting_for_approval') ? '✅ All tools in terminal state' : '🐛 Tool stuck'}`)


// ============================================================
// SCENARIO D: User declines approval
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  SCENARIO D: User declines approval → tool cancelled')
console.log('═'.repeat(80) + '\n')

s = createFixedHookState()
s.handleWsMessage({ type: 'connected' })
s.sendMessage('create technical ticket')
s.handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-D', name: 'create_technical_ticket', input: {} })
s.handleWsMessage({ type: 'pause', tool_call_id: 'tc-D', action_name: 'create_technical_ticket', params: {} })
log('')
log('--- User clicks DECLINE ---')
s.confirmAction(false)
s.handleWsMessage({ type: 'done' })

log('')
log(`FINAL: ${JSON.stringify(s.toolCalls.get().map(t => ({ id: t.id.slice(0,12), status: t.status })))}`)
log(`VERDICT: ${s.toolCalls.get().every(t => t.status !== 'running' && t.status !== 'waiting_for_approval') ? '✅ All tools in terminal state' : '🐛 Tool stuck'}`)


// ============================================================
// SCENARIO E: New message while tool running (serverToolIdMapRef preserved)
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  SCENARIO E: New message sent while tool running')
console.log('═'.repeat(80) + '\n')

s = createFixedHookState()
s.handleWsMessage({ type: 'connected' })
s.sendMessage('create technical ticket')
s.handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-E', name: 'create_technical_ticket', input: {} })
s.handleWsMessage({ type: 'pause', tool_call_id: 'tc-E', action_name: 'create_technical_ticket', params: {} })
s.confirmAction(true)
s.handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-E', action_name: 'create_technical_ticket', params: {} })
log('')
log('--- User sends another message ---')
s.sendMessage('also check my balance')
log('  serverToolIdMapRef NOT cleared (fix applied)')
log('')
log('--- Late tool_end arrives ---')
s.handleWsMessage({ type: 'tool_end', tool_call_id: 'tc-E', name: 'create_technical_ticket', output: 'Ticket created' })

log('')
log(`FINAL: ${JSON.stringify(s.toolCalls.get().map(t => ({ id: t.id.slice(0,12), status: t.status })))}`)
log(`VERDICT: ${s.toolCalls.get().every(t => t.status !== 'running' && t.status !== 'waiting_for_approval') ? '✅ All tools in terminal state' : '🐛 Tool stuck'}`)


// ============================================================
// SUMMARY
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  FULL LIFECYCLE VERIFICATION')
console.log('═'.repeat(80))
console.log('')
console.log('Tool status transitions observed:')
console.log('')
console.log('  Scenario A: running → waiting_for_approval → running → completed → (done: no-op)')
console.log('  Scenario B: running → waiting_for_approval → running → completed (by modal submit)')
console.log('  Scenario C: running → waiting_for_approval → running → cancelled (by modal cancel)')
console.log('  Scenario D: running → waiting_for_approval → cancelled (by decline)')
console.log('  Scenario E: running → waiting_for_approval → running → completed (late tool_end)')
console.log('')
console.log('Every tool reaches a terminal state. No tool stays in RUNNING.')
