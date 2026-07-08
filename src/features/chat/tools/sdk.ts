// ============================================================
// Human Tool Runtime — Tool SDK
// ============================================================
// The public API that tool components use to interact with
// the runtime. Provides a rich, consistent interface for all tools.
//
// Usage:
//   const tool = useTool()
//   tool.complete({ ticketId: 42 })
//   tool.cancel()
//   tool.fail('Something went wrong')
//   tool.progress(50, 'Uploading...')
//   tool.log('Processing started')
//   tool.setBusy()
// ============================================================

import { createContext, useContext, useCallback, useState, useMemo } from 'react'
import type { ToolMetadata, ValidationResult } from './types'
import { validatePayload } from './validation'

// -------------------------------------------------------
// Tool SDK Interface
// -------------------------------------------------------

export interface ToolSDK {
  // ---- Identity ----
  /** Server-provided tool call identifier */
  toolCallId: string
  /** The action name (e.g., 'create_ticket') */
  actionName: string
  /** Tool version (e.g., 'v1') */
  version: string
  /** Parameters passed by the backend */
  params: Record<string, unknown>
  /** Current conversation ID */
  conversationId: string | null
  
  // ---- Metadata ----
  /** Full tool metadata (definition, execution context, etc.) */
  metadata: ToolMetadata
  
  // ---- Results ----
  /** Send a successful result to the backend */
  complete: (payload?: unknown) => void
  /** Cancel this tool invocation */
  cancel: () => void
  /** Report a failure */
  fail: (error: string | Error, reason?: string) => void
  
  // ---- Progress & Logging ----
  /** Report progress (0-100) with optional message */
  progress: (percent: number, message?: string) => void
  /** Log a message (for debugging/audit) */
  log: (message: string, level?: 'info' | 'warn' | 'error') => void
  
  // ---- UI State ----
  /** Whether the tool is currently busy (e.g., submitting) */
  isBusy: boolean
  /** Set the tool to busy state (disables UI) */
  setBusy: () => void
  /** Set the tool to idle state (enables UI) */
  setIdle: () => void
  
  // ---- Validation ----
  /** Validate a payload against the tool's schema */
  validate: (payload: unknown) => ValidationResult
}

// -------------------------------------------------------
// Transport Interface (injected by runtime)
// -------------------------------------------------------

export interface ToolTransport {
  sendResult: (toolCallId: string, status: 'success' | 'cancelled' | 'failed', payload?: unknown, reason?: string) => void
  sendProgress?: (toolCallId: string, percent: number, message?: string) => void
  sendLog?: (toolCallId: string, message: string, level: string) => void
}

// -------------------------------------------------------
// Context
// -------------------------------------------------------

interface ToolContextValue {
  metadata: ToolMetadata
  transport: ToolTransport
}

const ToolContext = createContext<ToolContextValue | null>(null)

export const ToolProvider = ToolContext.Provider

// -------------------------------------------------------
// useTool Hook — The SDK
// -------------------------------------------------------

export function useTool(): ToolSDK {
  const ctx = useContext(ToolContext)
  
  if (!ctx) {
    throw new Error(
      'useTool() must be used inside a <ToolRenderer>. ' +
        'Tool components cannot access the runtime outside the renderer.'
    )
  }
  
  const { metadata, transport } = ctx
  const [isBusy, setIsBusy] = useState(false)
  
  // ---- Results ----
  
  const complete = useCallback(
    (payload?: unknown) => {
      // Validate payload if schema exists
      if (metadata.definition.schema) {
        const result = validatePayload(payload, metadata.definition.schema)
        if (!result.valid) {
          console.error('[ToolSDK] Payload validation failed:', result.errors)
          transport.sendResult(
            metadata.toolCallId,
            'failed',
            { errors: result.errors },
            'validation_failed'
          )
          return
        }
      }
      
      // Run custom validator if provided
      if (metadata.definition.validator) {
        const result = metadata.definition.validator(metadata.params as any, payload)
        if (!result.valid) {
          console.error('[ToolSDK] Custom validation failed:', result.errors)
          transport.sendResult(
            metadata.toolCallId,
            'failed',
            { errors: result.errors },
            'validation_failed'
          )
          return
        }
      }
      
      setIsBusy(true)
      transport.sendResult(metadata.toolCallId, 'success', payload)
    },
    [metadata, transport]
  )
  
  const cancel = useCallback(() => {
    transport.sendResult(metadata.toolCallId, 'cancelled')
  }, [metadata.toolCallId, transport])
  
  const fail = useCallback(
    (error: string | Error, reason?: string) => {
      const message = error instanceof Error ? error.message : error
      transport.sendResult(
        metadata.toolCallId,
        'failed',
        { error: message },
        reason || 'tool_error'
      )
    },
    [metadata.toolCallId, transport]
  )
  
  // ---- Progress & Logging ----
  
  const progress = useCallback(
    (percent: number, message?: string) => {
      if (transport.sendProgress) {
        transport.sendProgress(metadata.toolCallId, percent, message)
      }
    },
    [metadata.toolCallId, transport]
  )
  
  const log = useCallback(
    (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
      if (transport.sendLog) {
        transport.sendLog(metadata.toolCallId, message, level)
      }
      // Also log to console for debugging
      const prefix = `[Tool:${metadata.actionName}@${metadata.version}:${metadata.toolCallId}]`
      if (level === 'error') console.error(prefix, message)
      else if (level === 'warn') console.warn(prefix, message)
      else console.log(prefix, message)
    },
    [metadata, transport]
  )
  
  // ---- UI State ----
  
  const setBusy = useCallback(() => setIsBusy(true), [])
  const setIdle = useCallback(() => setIsBusy(false), [])
  
  // ---- Validation ----
  
  const validate = useCallback(
    (payload: unknown): ValidationResult => {
      if (metadata.definition.validator) {
        return metadata.definition.validator(metadata.params as any, payload)
      }
      if (metadata.definition.schema) {
        return validatePayload(payload, metadata.definition.schema)
      }
      return { valid: true }
    },
    [metadata]
  )
  
  // ---- Build SDK ----
  
  return useMemo(
    () => ({
      // Identity
      toolCallId: metadata.toolCallId,
      actionName: metadata.actionName,
      version: metadata.version,
      params: metadata.params,
      conversationId: metadata.conversationId,
      
      // Metadata
      metadata,
      
      // Results
      complete,
      cancel,
      fail,
      
      // Progress & Logging
      progress,
      log,
      
      // UI State
      isBusy,
      setBusy,
      setIdle,
      
      // Validation
      validate,
    }),
    [metadata, complete, cancel, fail, progress, log, isBusy, setBusy, setIdle, validate]
  )
}
