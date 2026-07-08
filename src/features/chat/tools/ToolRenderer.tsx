// ============================================================
// Human Tool Runtime — Tool Renderer
// ============================================================
// Generic component that renders any registered tool.
// The chat infrastructure uses this as the single entry point
// for all human-interactive tools.
//
// Responsibilities:
//   1. Look up the tool component from the registry
//   2. Provide the ToolContext
//   3. Render the component
//   4. Handle unknown tools gracefully
//
// The chat knows NOTHING about individual tools.
// ============================================================

import { useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { ToolContext } from './ToolContext'
import { getToolDefinition } from './registry'
import type { ActiveTool, ToolContextValue, ToolResultStatus } from './types'

interface ToolRendererProps {
  /** The currently active tool (null when no tool UI is open) */
  activeTool: ActiveTool | null
  /** Current conversation ID (passed through to tool context) */
  conversationId: string | null
  /**
   * Called when the tool produces a result.
   * This sends `tool_result` to the backend.
   */
  onResult: (toolCallId: string, status: ToolResultStatus, payload?: unknown) => void
}

export function ToolRenderer({ activeTool, conversationId, onResult }: ToolRendererProps) {
  // Build the context value for the active tool.
  // Memoized so the tool component doesn't re-render unnecessarily.
  const contextValue = useMemo<ToolContextValue | null>(() => {
    if (!activeTool) return null

    return {
      toolCallId: activeTool.toolCallId,
      actionName: activeTool.actionName,
      params: activeTool.params,
      conversationId,
      sendResult: (payload?: unknown) => {
        onResult(activeTool.toolCallId, 'success', payload)
      },
      cancel: () => {
        onResult(activeTool.toolCallId, 'cancelled')
      },
      fail: (error: string) => {
        onResult(activeTool.toolCallId, 'failed', { error })
      },
    }
  }, [activeTool, conversationId, onResult])

  // Look up the tool definition from the registry.
  const definition = activeTool ? getToolDefinition(activeTool.actionName) : null

  // Callback for unknown tools — send a 'failed' result so the backend
  // can handle it (e.g. fall back to a different approach).
  const handleUnknownToolResult = useCallback(() => {
    if (activeTool) {
      onResult(activeTool.toolCallId, 'failed', {
        error: `Unknown tool: ${activeTool.actionName}`,
      })
    }
  }, [activeTool, onResult])

  return (
    <AnimatePresence>
      {activeTool && contextValue && (
        <ToolContext.Provider value={contextValue}>
          {definition ? (
            <motion.div
              key={activeTool.toolCallId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <definition.Component />
            </motion.div>
          ) : (
            // Unknown tool — show a graceful fallback
            <motion.div
              key={`unknown-${activeTool.toolCallId}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed left-1/2 top-[10%] z-50 w-full max-w-sm -translate-x-1/2 rounded-xl border bg-card shadow-2xl p-6"
            >
              <div className="fixed inset-0 z-[-1] bg-black/40" onClick={handleUnknownToolResult} />
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Unknown Tool</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    The tool <code className="font-mono bg-muted px-1 rounded">{activeTool.actionName}</code> is
                    not registered in the frontend tool registry.
                  </p>
                  <button
                    onClick={handleUnknownToolResult}
                    className="mt-3 text-xs font-medium text-primary hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </ToolContext.Provider>
      )}
    </AnimatePresence>
  )
}
