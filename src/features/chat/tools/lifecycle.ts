// ============================================================
// Human Tool Runtime — Lifecycle State Machine
// ============================================================
// Defines valid state transitions for tool execution.
// Prevents invalid states and documents the lifecycle.
// ============================================================

import type { ToolStatus } from './types'

/**
 * Valid state transitions.
 * Key = current state, Value = array of allowed next states.
 */
export const VALID_TRANSITIONS: Record<ToolStatus, ToolStatus[]> = {
  pending: ['running', 'waiting_for_approval', 'cancelled', 'timeout'],
  running: [
    'waiting_for_approval',
    'waiting_for_user_input',
    'submitting',
    'completed',
    'failed',
    'cancelled',
    'timeout',
  ],
  waiting_for_approval: ['running', 'cancelled', 'timeout'],
  waiting_for_user_input: ['submitting', 'running', 'cancelled', 'timeout'],
  submitting: ['completed', 'failed', 'cancelled', 'timeout'],
  completed: [], // Terminal state
  failed: ['retrying'],
  cancelled: [], // Terminal state
  timeout: ['retrying'],
  retrying: ['running', 'cancelled'],
}

/**
 * Check if a state transition is valid.
 */
export function isValidTransition(from: ToolStatus, to: ToolStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Validate and perform a state transition.
 * Throws if the transition is invalid.
 */
export function transition(from: ToolStatus, to: ToolStatus): ToolStatus {
  if (!isValidTransition(from, to)) {
    throw new Error(
      `Invalid tool state transition: ${from} → ${to}. ` +
        `Valid transitions from ${from}: [${VALID_TRANSITIONS[from]?.join(', ') || 'none'}]`
    )
  }
  return to
}

/**
 * Check if a status is terminal (no further transitions allowed).
 */
export function isTerminal(status: ToolStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0
}

/**
 * Get all possible next states from a given state.
 */
export function getNextStates(from: ToolStatus): ToolStatus[] {
  return VALID_TRANSITIONS[from] || []
}

/**
 * Lifecycle event types (for logging/debugging).
 */
export type LifecycleEvent =
  | 'tool_started'
  | 'approval_requested'
  | 'approved'
  | 'rejected'
  | 'user_input_requested'
  | 'user_input_received'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'retrying'

/**
 * Map lifecycle events to state transitions.
 */
export const EVENT_TO_TRANSITION: Record<LifecycleEvent, { from: ToolStatus[]; to: ToolStatus }> = {
  tool_started: { from: ['pending'], to: 'running' },
  approval_requested: { from: ['running'], to: 'waiting_for_approval' },
  approved: { from: ['waiting_for_approval'], to: 'running' },
  rejected: { from: ['waiting_for_approval'], to: 'cancelled' },
  user_input_requested: { from: ['running'], to: 'waiting_for_user_input' },
  user_input_received: { from: ['waiting_for_user_input'], to: 'submitting' },
  completed: { from: ['running', 'submitting', 'waiting_for_user_input'], to: 'completed' },
  failed: { from: ['running', 'submitting', 'waiting_for_user_input'], to: 'failed' },
  cancelled: {
    from: ['pending', 'running', 'submitting', 'waiting_for_approval', 'waiting_for_user_input'],
    to: 'cancelled',
  },
  timeout: {
    from: ['running', 'submitting', 'waiting_for_approval', 'waiting_for_user_input'],
    to: 'timeout',
  },
  retrying: { from: ['failed', 'timeout'], to: 'retrying' },
}
