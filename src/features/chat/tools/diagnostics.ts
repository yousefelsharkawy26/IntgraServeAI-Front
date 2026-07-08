// ============================================================
// Human Tool Runtime — Diagnostics
// ============================================================
// Structured observability for production debugging.
// Tracks lifecycle events, registry operations, transport issues,
// validation failures, and plugin loading.
//
// Usage:
//   import { diagnostics } from './diagnostics'
//   diagnostics.info('lifecycle', 'Tool started', { toolCallId })
//   diagnostics.warn('validation', 'Payload invalid', { errors })
// ============================================================

import type { DiagnosticEvent, DiagnosticLevel } from './types'

class RuntimeDiagnostics {
  private events: DiagnosticEvent[] = []
  private maxEvents = 1000 // Circular buffer
  private debugMode = false
  private listeners: Array<(event: DiagnosticEvent) => void> = []

  /**
   * Enable debug mode (logs all events to console).
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Subscribe to diagnostic events.
   */
  subscribe(listener: (event: DiagnosticEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const idx = this.listeners.indexOf(listener)
      if (idx !== -1) this.listeners.splice(idx, 1)
    }
  }

  /**
   * Log a diagnostic event.
   */
  private log(
    level: DiagnosticLevel,
    category: DiagnosticEvent['category'],
    message: string,
    details?: {
      toolCallId?: string
      actionName?: string
      [key: string]: unknown
    }
  ): void {
    const event: DiagnosticEvent = {
      timestamp: Date.now(),
      level,
      category,
      message,
      toolCallId: details?.toolCallId,
      actionName: details?.actionName,
      details: details ? Object.fromEntries(
        Object.entries(details).filter(([k]) => k !== 'toolCallId' && k !== 'actionName')
      ) : undefined,
    }

    // Circular buffer
    this.events.push(event)
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        // Don't let listener errors break diagnostics
      }
    }

    // Console output in debug mode
    if (this.debugMode) {
      const prefix = `[ToolRuntime:${category}]`
      const ctx = event.toolCallId ? ` (${event.actionName}:${event.toolCallId})` : ''
      if (level === 'error') console.error(prefix + ctx, message, event.details)
      else if (level === 'warn') console.warn(prefix + ctx, message, event.details)
      else if (level === 'debug') console.debug(prefix + ctx, message, event.details)
      else console.log(prefix + ctx, message, event.details)
    }
  }

  // ---- Convenience methods ----

  debug(category: DiagnosticEvent['category'], message: string, details?: Record<string, unknown>): void {
    this.log('debug', category, message, details)
  }

  info(category: DiagnosticEvent['category'], message: string, details?: Record<string, unknown>): void {
    this.log('info', category, message, details)
  }

  warn(category: DiagnosticEvent['category'], message: string, details?: Record<string, unknown>): void {
    this.log('warn', category, message, details)
  }

  error(category: DiagnosticEvent['category'], message: string, details?: Record<string, unknown>): void {
    this.log('error', category, message, details)
  }

  // ---- Query methods ----

  /**
   * Get all diagnostic events (most recent first).
   */
  getEvents(filter?: {
    level?: DiagnosticLevel
    category?: DiagnosticEvent['category']
    toolCallId?: string
    since?: number
  }): DiagnosticEvent[] {
    let result = [...this.events]

    if (filter?.level) result = result.filter((e) => e.level === filter.level)
    if (filter?.category) result = result.filter((e) => e.category === filter.category)
    if (filter?.toolCallId) result = result.filter((e) => e.toolCallId === filter.toolCallId)
    if (filter?.since) result = result.filter((e) => e.timestamp >= filter.since!)

    return result.reverse()
  }

  /**
   * Get a summary of recent activity for a specific tool invocation.
   */
  getToolTrace(toolCallId: string): DiagnosticEvent[] {
    return this.events
      .filter((e) => e.toolCallId === toolCallId)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Get registry statistics from diagnostic events.
   */
  getRegistryStats(): {
    registrations: number
    resolutions: number
    failures: number
  } {
    const registryEvents = this.events.filter((e) => e.category === 'registry')
    return {
      registrations: registryEvents.filter((e) => e.message.includes('registered')).length,
      resolutions: registryEvents.filter((e) => e.message.includes('resolved')).length,
      failures: registryEvents.filter((e) => e.level === 'error' || e.level === 'warn').length,
    }
  }

  /**
   * Clear all diagnostic events.
   */
  clear(): void {
    this.events = []
  }

  /**
   * Export all events as JSON (for bug reports).
   */
  export(): string {
    return JSON.stringify(this.events, null, 2)
  }
}

/**
 * Singleton diagnostics instance for the entire runtime.
 */
export const diagnostics = new RuntimeDiagnostics()
