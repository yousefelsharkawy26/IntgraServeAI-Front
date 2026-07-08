// ============================================================
// Human Tool Runtime — Tool Context
// ============================================================
// Every tool component consumes this context to interact with
// the chat infrastructure. No props drilling. No custom callbacks.
// ============================================================

import { createContext, useContext } from 'react'
import type { ToolContextValue } from './types'

export const ToolContext = createContext<ToolContextValue | null>(null)

/**
 * Hook for tool components to access the runtime context.
 * Must be called inside a <ToolRenderer> (which provides the context).
 *
 * @example
 * function MyTool() {
 *   const { toolCallId, params, sendResult, cancel } = useToolContext()
 *   return <button onClick={() => sendResult({ answer: 42 })}>Submit</button>
 * }
 */
export function useToolContext(): ToolContextValue {
  const ctx = useContext(ToolContext)
  if (!ctx) {
    throw new Error(
      'useToolContext() must be used inside a <ToolRenderer>. ' +
      'Tool components cannot access the runtime context outside the renderer.'
    )
  }
  return ctx
}
