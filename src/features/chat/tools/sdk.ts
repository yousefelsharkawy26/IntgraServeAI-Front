// ============================================================
// Human Tool Runtime — Tool SDK
// ============================================================
// The public API that tool components use to interact with
// the runtime. Provides a rich, consistent interface.
//
// Usage:
//   const tool = useTool()
//   tool.complete({ ticketId: 42 })
//   tool.cancel()
//   tool.fail('Something went wrong')
//   tool.progress(50, 'Uploading...')
//   tool.log('Processing started')
//   tool.setBusy()
//
// Lifecycle:
//   tool.onResume(() => { ... })
//   tool.onSuspend(() => { ... })
//   tool.abortSignal  // AbortSignal for cancelling requests
// ============================================================

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react'
import type { ToolMetadata, ValidationResult } from './types'
import { validatePayload } from './validation'
import { diagnostics } from './diagnostics'

// -------------------------------------------------------
// Tool SDK Interface
// -------------------------------------------------------

export interface ToolSDK {
  // ---- Identity ----
  toolCallId: string
  actionName: string
  version: string
  params: Record<string, unknown>
  conversationId: string | null
  submissionStatus: ToolMetadata['submissionStatus']
  submissionError?: string | null
  submissionResult?: unknown

  // ---- Metadata ----
  metadata: ToolMetadata

  // ---- Results ----
  complete: (payload?: unknown) => void
  cancel: () => void
  fail: (error: string | Error, reason?: string) => void

  // ---- Progress & Logging ----
  progress: (percent: number, message?: string) => void
  log: (message: string, level?: 'info' | 'warn' | 'error') => void

  // ---- UI State ----
  isBusy: boolean
  setBusy: () => void
  setIdle: () => void

  // ---- Validation ----
  validate: (payload: unknown) => ValidationResult

  // ---- Lifecycle Hooks ----
  /** Register a callback for when the tool is resumed after reconnect */
  onResume: (callback: () => void | Promise<void>) => void
  /** Register a callback for when the tool is suspended */
  onSuspend: (callback: () => void | Promise<void>) => void
  /** Register a callback for visibility changes */
  onVisibilityChange: (callback: (visible: boolean) => void) => void
  /** Register a callback for cleanup */
  onDestroy: (callback: () => void | Promise<void>) => void

  // ---- AbortSignal ----
  /** AbortSignal that aborts when the tool is cancelled or destroyed */
  abortSignal: AbortSignal
}

// -------------------------------------------------------
// Transport Interface (injected by runtime)
// -------------------------------------------------------

export interface ToolTransport {
  sendResult: (
    toolCallId: string,
    status: 'success' | 'cancelled' | 'failed',
    payload?: unknown,
    reason?: string
  ) => void
  sendProgress?: (toolCallId: string, percent: number, message?: string) => void
  sendLog?: (toolCallId: string, message: string, level: string) => void
}

// -------------------------------------------------------
// Lifecycle Controller (manages hooks externally)
// -------------------------------------------------------

export interface LifecycleController {
  /** Trigger resume hooks */
  triggerResume: () => Promise<void>
  /** Trigger suspend hooks */
  triggerSuspend: () => Promise<void>
  /** Trigger visibility change hooks */
  triggerVisibilityChange: (visible: boolean) => void
  /** Trigger destroy hooks */
  triggerDestroy: () => Promise<void>
  /** Abort the signal */
  abort: () => void
}

// -------------------------------------------------------
// Context
// -------------------------------------------------------

interface ToolContextValue {
  metadata: ToolMetadata
  transport: ToolTransport
  lifecycleController: LifecycleController
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

  const { metadata, transport, lifecycleController } = ctx
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    if (metadata.submissionStatus === 'failed') {
      setIsBusy(false)
    }
  }, [metadata.submissionStatus])

  // AbortController for cancelling long-running requests
  const abortControllerRef = useRef<AbortController>(new AbortController())

  // Lifecycle hook registries
  const resumeHooksRef = useRef<Array<() => void | Promise<void>>>([])
  const suspendHooksRef = useRef<Array<() => void | Promise<void>>>([])
  const visibilityHooksRef = useRef<Array<(visible: boolean) => void>>([])
  const destroyHooksRef = useRef<Array<() => void | Promise<void>>>([])

  // Register lifecycle hooks with the controller
  useEffect(() => {
    // The controller's trigger functions will call these hooks
    const controller = lifecycleController

    // Wire up the controller to call our registered hooks
    const originalResume = controller.triggerResume
    const originalSuspend = controller.triggerSuspend
    const originalVisibility = controller.triggerVisibilityChange
    const originalDestroy = controller.triggerDestroy

    controller.triggerResume = async () => {
      await originalResume()
      for (const hook of resumeHooksRef.current) {
        try {
          await hook()
        } catch (err) {
          diagnostics.error('lifecycle', `onResume hook failed`, {
            toolCallId: metadata.toolCallId,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    controller.triggerSuspend = async () => {
      await originalSuspend()
      for (const hook of suspendHooksRef.current) {
        try {
          await hook()
        } catch (err) {
          diagnostics.error('lifecycle', `onSuspend hook failed`, {
            toolCallId: metadata.toolCallId,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    controller.triggerVisibilityChange = (visible: boolean) => {
      originalVisibility(visible)
      for (const hook of visibilityHooksRef.current) {
        try {
          hook(visible)
        } catch (err) {
          diagnostics.error('lifecycle', `onVisibilityChange hook failed`, {
            toolCallId: metadata.toolCallId,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    controller.triggerDestroy = async () => {
      await originalDestroy()
      for (const hook of destroyHooksRef.current) {
        try {
          await hook()
        } catch (err) {
          diagnostics.error('lifecycle', `onDestroy hook failed`, {
            toolCallId: metadata.toolCallId,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
      // Abort all pending requests on destroy
      abortControllerRef.current.abort()
    }

    // Restore original functions on unmount
    return () => {
      controller.triggerResume = originalResume
      controller.triggerSuspend = originalSuspend
      controller.triggerVisibilityChange = originalVisibility
      controller.triggerDestroy = originalDestroy
    }
  }, [metadata.toolCallId, lifecycleController])

  // ---- Results ----

  const complete = useCallback(
    (payload?: unknown) => {
      // Validate payload if schema exists
      if (metadata.definition.schema) {
        const result = validatePayload(payload, metadata.definition.schema)
        if (!result.valid) {
          diagnostics.error('validation', 'Payload validation failed', {
            toolCallId: metadata.toolCallId,
            errors: result.errors,
          })
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
          diagnostics.error('validation', 'Custom validation failed', {
            toolCallId: metadata.toolCallId,
            errors: result.errors,
          })
          transport.sendResult(
            metadata.toolCallId,
            'failed',
            { errors: result.errors },
            'validation_failed'
          )
          return
        }
      }

      diagnostics.info('lifecycle', 'Tool completing', {
        toolCallId: metadata.toolCallId,
        actionName: metadata.actionName,
      })
      setIsBusy(true)
      transport.sendResult(metadata.toolCallId, 'success', payload)
    },
    [metadata, transport]
  )

  const cancel = useCallback(() => {
    diagnostics.info('lifecycle', 'Tool cancelled', {
      toolCallId: metadata.toolCallId,
      actionName: metadata.actionName,
    })
    abortControllerRef.current.abort()
    transport.sendResult(metadata.toolCallId, 'cancelled')
  }, [metadata.toolCallId, metadata.actionName, transport])

  const fail = useCallback(
    (error: string | Error, reason?: string) => {
      const message = error instanceof Error ? error.message : error
      diagnostics.error('lifecycle', 'Tool failed', {
        toolCallId: metadata.toolCallId,
        actionName: metadata.actionName,
        error: message,
        reason,
      })
      transport.sendResult(
        metadata.toolCallId,
        'failed',
        { error: message },
        reason || 'tool_error'
      )
    },
    [metadata.toolCallId, metadata.actionName, transport]
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
      // Also log to diagnostics
      if (level === 'error') {
        diagnostics.error('lifecycle', message, { toolCallId: metadata.toolCallId })
      } else if (level === 'warn') {
        diagnostics.warn('lifecycle', message, { toolCallId: metadata.toolCallId })
      } else {
        diagnostics.debug('lifecycle', message, { toolCallId: metadata.toolCallId })
      }
    },
    [metadata.toolCallId, transport]
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

  // ---- Lifecycle Hooks ----

  const onResume = useCallback((callback: () => void | Promise<void>) => {
    resumeHooksRef.current.push(callback)
  }, [])

  const onSuspend = useCallback((callback: () => void | Promise<void>) => {
    suspendHooksRef.current.push(callback)
  }, [])

  const onVisibilityChange = useCallback((callback: (visible: boolean) => void) => {
    visibilityHooksRef.current.push(callback)
  }, [])

  const onDestroy = useCallback((callback: () => void | Promise<void>) => {
    destroyHooksRef.current.push(callback)
  }, [])

  // ---- Build SDK ----

  return useMemo(
    () => ({
      // Identity
      toolCallId: metadata.toolCallId,
      actionName: metadata.actionName,
      version: metadata.version,
      params: metadata.params,
      conversationId: metadata.conversationId,
      submissionStatus: metadata.submissionStatus,
      submissionError: metadata.submissionError,
      submissionResult: metadata.submissionResult,

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

      // Lifecycle Hooks
      onResume,
      onSuspend,
      onVisibilityChange,
      onDestroy,

      // AbortSignal
      abortSignal: abortControllerRef.current.signal,
    }),
    [
      metadata,
      complete,
      cancel,
      fail,
      progress,
      log,
      isBusy,
      setBusy,
      setIdle,
      validate,
      onResume,
      onSuspend,
      onVisibilityChange,
      onDestroy,
    ]
  )
}

/**
 * Create a lifecycle controller for a tool invocation.
 * Used by the runtime to manage lifecycle hooks externally.
 */
export function createLifecycleController(): LifecycleController {
  return {
    triggerResume: async () => {},
    triggerSuspend: async () => {},
    triggerVisibilityChange: () => {},
    triggerDestroy: async () => {},
    abort: () => {},
  }
}
