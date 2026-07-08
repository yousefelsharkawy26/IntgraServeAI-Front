// ============================================================
// Human Tool Runtime — Runtime Renderer
// ============================================================
// RESPONSIBILITY: Render tools, handle errors, handle unknown tools.
// Does NOT manage state, validate, or transport results.
//
// Components:
//   - ToolRenderer: Main entry point
//   - ToolErrorBoundary: Catches tool crashes
//   - UnknownToolHandler: Auto-fails unknown tools
// ============================================================

import React, { Suspense, useMemo, useCallback, useEffect, Component, useRef } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2, PackageOpen } from 'lucide-react'
import { resolveTool } from './registry'
import { ToolProvider } from './sdk'
import type { ToolTransport } from './sdk'
import type { ActiveTool, ToolMetadata, ToolResultStatus, HumanToolDefinition } from './types'

// -------------------------------------------------------
// Tool Renderer — Main entry point
// -------------------------------------------------------

interface ToolRendererProps {
  activeTool: ActiveTool | null
  conversationId: string | null
  transport: ToolTransport
  /** Optional backend context to pass to tools */
  backendContext?: Record<string, unknown>
  /** Optional execution ID */
  executionId?: string
  /** Optional tenant ID */
  tenantId?: string
}

export function ToolRenderer({
  activeTool,
  conversationId,
  transport,
  backendContext,
  executionId,
  tenantId,
}: ToolRendererProps) {
  // Resolve the tool definition from the registry
  const definition = activeTool
    ? resolveTool(activeTool.version ? `${activeTool.actionName}@${activeTool.version}` : activeTool.actionName)
    : null

  // Build metadata for the tool
  const metadata = useMemo<ToolMetadata | null>(() => {
    if (!activeTool || !definition) return null

    return {
      definition,
      toolCallId: activeTool.toolCallId,
      actionName: activeTool.actionName,
      version: activeTool.version || definition.version,
      conversationId,
      executionId,
      tenantId,
      backendContext,
    }
  }, [activeTool, definition, conversationId, executionId, tenantId, backendContext])

  return (
    <AnimatePresence>
      {activeTool && (
        <motion.div
          key={activeTool.toolCallId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {metadata && definition ? (
            <ToolProvider value={{ metadata, transport }}>
              <ToolErrorBoundary
                toolCallId={activeTool.toolCallId}
                actionName={activeTool.actionName}
                onCrash={(error) => {
                  transport.sendResult(
                    activeTool.toolCallId,
                    'failed',
                    { error: error.message },
                    'tool_crash'
                  )
                }}
              >
                <Suspense fallback={<ToolLoadingFallback definition={definition} />}>
                  <RenderToolComponent definition={definition} />
                </Suspense>
              </ToolErrorBoundary>
            </ToolProvider>
          ) : (
            <UnknownToolHandler
              activeTool={activeTool}
              transport={transport}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// -------------------------------------------------------
// Render Tool Component (handles lazy vs eager)
// -------------------------------------------------------

function RenderToolComponent({ definition }: { definition: HumanToolDefinition }) {
  const Comp = definition.Component as React.ComponentType
  return <Comp />
}

// -------------------------------------------------------
// Tool Error Boundary — Catches crashes
// -------------------------------------------------------

interface ErrorBoundaryProps {
  toolCallId: string
  actionName: string
  onCrash: (error: Error) => void
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ToolErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ToolErrorBoundary] Tool "${this.props.actionName}" (${this.props.toolCallId}) crashed:`,
      error,
      errorInfo
    )
    this.props.onCrash(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed left-1/2 top-[10%] z-50 w-full max-w-sm -translate-x-1/2 rounded-xl border bg-card shadow-2xl p-6">
          <div className="fixed inset-0 z-[-1] bg-black/40" />
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Tool Crashed</h3>
              <p className="text-xs text-muted-foreground mt-1">
                The tool <code className="font-mono bg-muted px-1 rounded">{this.props.actionName}</code>{' '}
                encountered an unexpected error and has been terminated.
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-2 font-mono">
                {this.state.error?.message}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// -------------------------------------------------------
// Unknown Tool Handler — Auto-fails and shows UI
// -------------------------------------------------------

interface UnknownToolHandlerProps {
  activeTool: ActiveTool
  transport: ToolTransport
}

function UnknownToolHandler({ activeTool, transport }: UnknownToolHandlerProps) {
  const hasReported = useRef(false)

  // Auto-send failed result to backend on mount
  useEffect(() => {
    if (!hasReported.current) {
      hasReported.current = true
      console.warn(
        `[ToolRuntime] Unknown tool: "${activeTool.actionName}" (toolCallId: ${activeTool.toolCallId}). ` +
          'Sending failed result to backend.'
      )
      transport.sendResult(
        activeTool.toolCallId,
        'failed',
        {
          error: `Unsupported tool: ${activeTool.actionName}`,
          requestedVersion: activeTool.version || 'latest',
        },
        'unsupported_tool'
      )
    }
  }, [activeTool, transport])

  return (
    <div className="fixed left-1/2 top-[10%] z-50 w-full max-w-sm -translate-x-1/2 rounded-xl border bg-card shadow-2xl p-6">
      <div className="fixed inset-0 z-[-1] bg-black/40" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
          <PackageOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Unsupported Tool</h3>
          <p className="text-xs text-muted-foreground mt-1">
            The tool{' '}
            <code className="font-mono bg-muted px-1 rounded">
              {activeTool.actionName}
              {activeTool.version ? `@${activeTool.version}` : ''}
            </code>{' '}
            is not available in this version of the application.
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-2">
            The backend has been notified. Please try a different action.
          </p>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------
// Loading Fallback (for lazy-loaded tools)
// -------------------------------------------------------

function ToolLoadingFallback({ definition }: { definition: HumanToolDefinition }) {
  return (
    <div className="fixed left-1/2 top-[10%] z-50 w-full max-w-sm -translate-x-1/2 rounded-xl border bg-card shadow-2xl p-6">
      <div className="fixed inset-0 z-[-1] bg-black/40" />
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div>
          <p className="text-sm font-medium">Loading {definition.label}...</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {definition.description || 'Preparing tool interface'}
          </p>
        </div>
      </div>
    </div>
  )
}
