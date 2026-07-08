// ============================================================
// Human Tool Runtime — Type Definitions
// ============================================================
// These types define the generic contract between the chat
// infrastructure and individual tool implementations.
// The chat knows NOTHING about specific tools.
// ============================================================

import type { ComponentType } from 'react'

// -------------------------------------------------------
// Tool Result — the ONLY thing a tool sends back
// -------------------------------------------------------

export type ToolResultStatus = 'success' | 'cancelled' | 'failed'

export interface ToolResult {
  toolCallId: string
  status: ToolResultStatus
  payload?: unknown
}

// -------------------------------------------------------
// Active Tool — what the chat knows when a tool UI is open
// -------------------------------------------------------

export interface ActiveTool {
  toolCallId: string
  actionName: string
  params: Record<string, unknown>
}

// -------------------------------------------------------
// Tool Context — provided to every tool component
// -------------------------------------------------------

export interface ToolContextValue {
  /** Server-provided identifier for this tool invocation */
  toolCallId: string
  /** The action name that resolved this tool (e.g. 'create_technical_ticket') */
  actionName: string
  /** Parameters passed by the backend for this tool invocation */
  params: Record<string, unknown>
  /** Current conversation ID (if available) */
  conversationId: string | null
  /** Send a successful result back to the backend */
  sendResult: (payload?: unknown) => void
  /** Cancel this tool invocation */
  cancel: () => void
  /** Report a failure */
  fail: (error: string) => void
}

// -------------------------------------------------------
// Tool Definition — what the registry stores
// -------------------------------------------------------

export interface HumanToolDefinition<TParams = Record<string, unknown>> {
  /** Unique type identifier (must match backend action_name) */
  type: string
  /** Human-readable label for the tool */
  label: string
  /** The React component that renders the tool UI */
  Component: ComponentType
  /** Optional validation function for the tool parameters */
  validate?: (params: TParams) => { valid: boolean; error?: string }
}

// -------------------------------------------------------
// Tool Registry — maps action names to definitions
// -------------------------------------------------------

export type ToolRegistry = Record<string, HumanToolDefinition>
