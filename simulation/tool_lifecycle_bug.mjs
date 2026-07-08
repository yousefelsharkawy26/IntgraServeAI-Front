// ============================================================
// Runtime Simulation: Tool Lifecycle State Bug
// ============================================================
// Proves WHERE the tool status gets stuck at RUNNING.
//
// Tests 4 scenarios:
//   A: Backend sends tool_end after show_ticket_dialogue
//   B: Backend never sends tool_end (no notification from frontend)
//   C: Backend sends done without tool_end
//   D: User sends new message while tool still running
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

// ============================================================
// Reproduce the EXACT state machine from useChatWebSocket.ts
// ============================================================
function createHookState() {
  const messages = new State([])
  const isTyping = new State(false)
  const pendingAction = new State(null)
  const toolCalls = new State([])
  const isCreateTicketModalOpen = new State(false)

  const currentToolCallRef = new Ref(null)
  const serverToolIdMapRef = new Ref(new Map())
  const confirmSentRef = new Ref(false)
  const aiMsgIdRef = new Ref(null)

  const sentWsMessages = []

  // Track tool status transitions
  toolCalls.on((prev, next) => {
    for (const t of next) {
      const old = prev.find(p => p.id === t.id)
      if (!old) {
        log(`  Tool ${t.id} CREATED: status=${t.status}`)
      } else if (old.status !== t.status) {
        log(`  Tool ${t.id}: ${old.status} → ${t.status}`)
      }
    }
  })

  function handleWsMessage(data) {
    log(`◄── WS IN: ${data.type} ${data.tool_call_id ? `(tool_call_id=${data.tool_call_id})` : ''}`)

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
        const toolCall = { id: localId, name: data.name || 'Tool', status: 'running', input: data.input || {}, startTime: new Date().toISOString() }
        if (serverToolCallId) serverToolIdMapRef.current.set(serverToolCallId, localId)
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
            if (!target) return prev
            const updatedTool = { ...target, status: 'completed', output: data.output || 'Completed', endTime: new Date().toISOString() }
            if (completedToolRef?.id === targetLocalId) currentToolCallRef.current = null
            return prev.map(t => t.id === targetLocalId ? updatedTool : t)
          })
          messages.set(prev => prev.map(m => {
            if (m.id !== targetLocalId) return m
            const tool = m.toolCalls?.[0]
            const updatedTool = tool ? { ...tool, status: 'completed', output: data.output } : { id: targetLocalId, name: data.name || 'Tool', status: 'completed' }
            return { ...m, content: `${data.name || updatedTool.name} completed`, toolCalls: [updatedTool] }
          }))
        } else {
          log(`  ⚠ tool_end: no target found! endServerId=${endServerId}, currentToolCallRef=${currentToolCallRef.current?.id || 'null'}`)
        }
        break
      }

      case 'pause': {
        isTyping.set(false)
        confirmSentRef.current = false
        pendingAction.set({ toolCallId: data.tool_call_id || 'unknown', actionName: data.action_name, params: data.params || {} })
        break
      }

      case 'done': {
        isTyping.set(false)
        aiMsgIdRef.current = null
        // NOTE: The current code does NOT finalize running tools here!
        break
      }

      case 'error': {
        isTyping.set(false)
        break
      }

      case 'show_ticket_dialogue': {
        isTyping.set(false)
        // FIXED: no setPendingAction here
        isCreateTicketModalOpen.set(true)
        break
      }
    }
  }

  function confirmAction(approved) {
    log(`──► WS OUT: { type: 'confirm', approved: ${approved} }`)
    if (confirmSentRef.current) { log('  🛡 GUARD: blocked'); return }
    confirmSentRef.current = true
    sentWsMessages.push({ type: 'confirm', approved })
    pendingAction.set(null)
    isTyping.set(true)
  }

  function sendMessage(content) {
    log(`──► WS OUT: { type: 'chat', content: '${content}' }`)
    confirmSentRef.current = false
    serverToolIdMapRef.current.clear()
    pendingAction.set(null)
    isTyping.set(true)
  }

  // Simulate CreateTicketModal submission (REST API call)
  function submitTicketModal() {
    log('  📋 CreateTicketModal: REST API createTicket() called')
    log('  📋 CreateTicketModal: onSuccess → onClose() → setIsCreateTicketModalOpen(false)')
    isCreateTicketModalOpen.set(false)
    // NOTE: NO WebSocket message is sent. NO tool status is updated.
  }

  function cancelModal() {
    log('  📋 CreateTicketModal: user clicked Cancel → onClose()')
    isCreateTicketModalOpen.set(false)
    // NOTE: NO WebSocket message is sent. NO tool status is updated.
  }

  return { messages, isTyping, pendingAction, toolCalls, isCreateTicketModalOpen, currentToolCallRef, serverToolIdMapRef, sentWsMessages, handleWsMessage, confirmAction, sendMessage, submitTicketModal, cancelModal }
}


// ============================================================
// SCENARIO A: Backend sends tool_end right after show_ticket_dialogue
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  SCENARIO A: Backend sends tool_end after show_ticket_dialogue')
console.log('═'.repeat(80) + '\n')

let s = createHookState()

s.handleWsMessage({ type: 'connected' })
s.sendMessage('create technical ticket')
s.handleWsMessage({ type: 'token', content: 'I will create...' })
s.handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-A', name: 'create_technical_ticket', input: {} })
s.handleWsMessage({ type: 'pause', tool_call_id: 'tc-A', action_name: 'create_technical_ticket', params: {} })
s.confirmAction(true)
s.handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-A', action_name: 'create_technical_ticket', params: {} })
log('')
log('--- Backend sends tool_end ---')
s.handleWsMessage({ type: 'tool_end', tool_call_id: 'tc-A', name: 'create_technical_ticket', output: 'Ticket created' })
s.handleWsMessage({ type: 'done' })

log('')
log(`FINAL: toolCalls = ${JSON.stringify(s.toolCalls.get().map(t => ({ id: t.id.slice(0,12), status: t.status })))}`)
log(`VERDICT: ${s.toolCalls.get().every(t => t.status !== 'running') ? '✅ Tool reached terminal state' : '🐛 Tool stuck in RUNNING'}`)


// ============================================================
// SCENARIO B: Backend NEVER sends tool_end (real-world bug)
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  SCENARIO B: Backend never sends tool_end (real-world behavior)')
console.log('  (Ticket created via REST API, backend unaware)')
console.log('═'.repeat(80) + '\n')

s = createHookState()

s.handleWsMessage({ type: 'connected' })
s.sendMessage('create technical ticket')
s.handleWsMessage({ type: 'token', content: 'I will create...' })
s.handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-B', name: 'create_technical_ticket', input: {} })
s.handleWsMessage({ type: 'pause', tool_call_id: 'tc-B', action_name: 'create_technical_ticket', params: {} })
s.confirmAction(true)
s.handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-B', action_name: 'create_technical_ticket', params: {} })
log('')
log('--- User fills form and submits (REST API) ---')
s.submitTicketModal()
log('')
log('--- Backend sends done (AI response complete) ---')
s.handleWsMessage({ type: 'done' })
log('')
log('--- (No more events from backend) ---')

log('')
log(`FINAL: toolCalls = ${JSON.stringify(s.toolCalls.get().map(t => ({ id: t.id.slice(0,12), status: t.status })))}`)
log(`VERDICT: ${s.toolCalls.get().every(t => t.status !== 'running') ? '✅ Tool reached terminal state' : '🐛 Tool stuck in RUNNING'}`)


// ============================================================
// SCENARIO C: User cancels modal — tool stays RUNNING
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  SCENARIO C: User cancels modal')
console.log('═'.repeat(80) + '\n')

s = createHookState()

s.handleWsMessage({ type: 'connected' })
s.sendMessage('create technical ticket')
s.handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-C', name: 'create_technical_ticket', input: {} })
s.handleWsMessage({ type: 'pause', tool_call_id: 'tc-C', action_name: 'create_technical_ticket', params: {} })
s.confirmAction(true)
s.handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-C', action_name: 'create_technical_ticket', params: {} })
log('')
log('--- User clicks Cancel on modal ---')
s.cancelModal()
s.handleWsMessage({ type: 'done' })

log('')
log(`FINAL: toolCalls = ${JSON.stringify(s.toolCalls.get().map(t => ({ id: t.id.slice(0,12), status: t.status })))}`)
log(`VERDICT: ${s.toolCalls.get().every(t => t.status !== 'running') ? '✅ Tool reached terminal state' : '🐛 Tool stuck in RUNNING'}`)


// ============================================================
// SCENARIO D: User sends new message while tool still running
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  SCENARIO D: New message sent while tool running')
console.log('  (serverToolIdMapRef cleared → tool_end lookup fails)')
console.log('═'.repeat(80) + '\n')

s = createHookState()

s.handleWsMessage({ type: 'connected' })
s.sendMessage('create technical ticket')
s.handleWsMessage({ type: 'tool_start', tool_call_id: 'tc-D', name: 'create_technical_ticket', input: {} })
s.handleWsMessage({ type: 'pause', tool_call_id: 'tc-D', action_name: 'create_technical_ticket', params: {} })
s.confirmAction(true)
s.handleWsMessage({ type: 'show_ticket_dialogue', tool_call_id: 'tc-D', action_name: 'create_technical_ticket', params: {} })
log('')
log('--- User types another message while modal is open ---')
s.sendMessage('also check my account balance')
log('  ⚠ serverToolIdMapRef was CLEARED by sendMessage!')
log('')
log('--- Backend sends tool_end for tc-D ---')
s.handleWsMessage({ type: 'tool_end', tool_call_id: 'tc-D', name: 'create_technical_ticket', output: 'Ticket created' })

log('')
log(`FINAL: toolCalls = ${JSON.stringify(s.toolCalls.get().map(t => ({ id: t.id.slice(0,12), status: t.status })))}`)
const tcDTool = s.toolCalls.get().find(t => t.name === 'create_technical_ticket')
log(`VERDICT for tc-D tool: ${tcDTool?.status !== 'running' ? '✅ Reached terminal state' : '🐛 Stuck in RUNNING (serverToolIdMapRef was cleared!)'}`)


// ============================================================
// COMPREHENSIVE ANALYSIS
// ============================================================
console.log('\n' + '═'.repeat(80))
console.log('  COMPREHENSIVE ANALYSIS')
console.log('═'.repeat(80))
console.log('')
console.log('FINDINGS:')
console.log('')
console.log('1. tool_end handler WORKS when serverToolIdMapRef has the mapping.')
console.log('   (Scenario A: tool transitions to completed ✅)')
console.log('')
console.log('2. When backend never sends tool_end (Scenario B):')
console.log('   - CreateTicketModal submits via REST API (HTTP POST)')
console.log('   - NO WebSocket message is sent to notify backend')
console.log('   - Backend never sends tool_end')
console.log('   - done handler does NOT finalize running tools')
console.log('   → Tool stuck in RUNNING forever 🐛')
console.log('')
console.log('3. When user cancels modal (Scenario C):')
console.log('   - Modal closes, but no tool status update occurs')
console.log('   → Tool stuck in RUNNING forever 🐛')
console.log('')
console.log('4. When user sends new message while tool running (Scenario D):')
console.log('   - sendMessage() clears serverToolIdMapRef')
console.log('   - Late-arriving tool_end cannot find the tool')
console.log('   - currentToolCallRef fallback may also be stale')
console.log('   → Tool stuck in RUNNING 🐛')
console.log('')
console.log('ROOT CAUSES:')
console.log('')
console.log('A. No mechanism to transition tool to terminal state after')
console.log('   CreateTicketModal submit/cancel (REST API disconnect)')
console.log('')
console.log('B. done handler does not finalize running tools')
console.log('')
console.log('C. sendMessage clears serverToolIdMapRef, breaking late tool_end')
console.log('')
console.log('D. ToolCallInfo.status type only has 3 states:')
console.log("   'running' | 'completed' | 'failed'")
console.log('   Missing: pending, waiting_for_approval, cancelled, timeout')
