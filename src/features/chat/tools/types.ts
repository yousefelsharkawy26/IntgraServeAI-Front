// ============================================================
// Human Tool Runtime — Core Type Definitions
// ============================================================

import type { ComponentType, LazyExoticComponent } from 'react'

// -------------------------------------------------------
// Tool Status — Complete lifecycle state machine
// -------------------------------------------------------

export type ToolStatus =
  | 'pending'
  | 'running'
  | 'waiting_for_approval'
  | 'waiting_for_user_input'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'retrying'

export const TERMINAL_STATUSES: ToolStatus[] = ['completed', 'failed', 'cancelled', 'timeout']

// -------------------------------------------------------
// Tool Result — What tools send back to backend
// -------------------------------------------------------

export type ToolResultStatus = 'success' | 'cancelled' | 'failed'

export interface ToolResult {
  toolCallId: string
  status: ToolResultStatus
  payload?: unknown
  reason?: string // e.g., 'unsupported_tool', 'validation_failed'
}

// -------------------------------------------------------
// Active Tool — What the runtime tracks
// -------------------------------------------------------

export interface ActiveTool {
  toolCallId: string
  actionName: string
  version?: string // e.g., 'v1', 'v2'
  params: Record<string, unknown>
  schema?: ToolSchema // Optional schema from backend
  startedAt: number // Timestamp for timeout tracking
}

// -------------------------------------------------------
// Tool Schema — For dynamic forms and validation
// -------------------------------------------------------

export interface ToolSchema {
  fields: SchemaField[]
}

export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object'
  label?: string
  description?: string
  required?: boolean
  default?: unknown
  options?: string[] // For enum type
  min?: number
  max?: number
  pattern?: string
  items?: SchemaField // For array type
  properties?: Record<string, SchemaField> // For object type
}

// -------------------------------------------------------
// Tool Definition — What the registry stores
// -------------------------------------------------------

export interface HumanToolDefinition<TParams = Record<string, unknown>> {
  /** Unique type identifier (must match backend action_name) */
  type: string
  
  /** Semantic version (e.g., 'v1', 'v2', '1.0.0') */
  version: string
  
  /** Human-readable label */
  label: string
  
  /** Optional description for documentation */
  description?: string
  
  /** The React component (can be lazy-loaded) */
  Component: ComponentType | LazyExoticComponent<ComponentType>
  
  /** Optional JSON schema for validation */
  schema?: ToolSchema
  
  /** Optional custom validator (overrides schema) */
  validator?: ToolValidator<TParams>
  
  /** Required permissions (e.g., ['tickets:create']) */
  permissions?: string[]
  
  /** Tool capabilities (e.g., ['progress', 'logging']) */
  capabilities?: string[]
  
  /** Whether this tool supports resume after disconnect */
  supportsResume?: boolean
  
  /** Experimental flag */
  experimental?: boolean
  
  /** Default timeout in milliseconds */
  timeoutMs?: number
}

// -------------------------------------------------------
// Tool Validator — Custom validation logic
// -------------------------------------------------------

export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export type ToolValidator<TParams = Record<string, unknown>> = (
  params: TParams,
  payload?: unknown
) => ValidationResult

// -------------------------------------------------------
// Tool Metadata — Runtime context for tools
// -------------------------------------------------------

export interface ToolMetadata {
  definition: HumanToolDefinition
  toolCallId: string
  actionName: string
  version: string
  conversationId: string | null
  executionId?: string
  tenantId?: string
  backendContext?: Record<string, unknown>
}
