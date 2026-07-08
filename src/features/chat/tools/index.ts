// ============================================================
// Human Tool Runtime — Public API
// ============================================================
// Single entry point for all tool runtime exports.
// ============================================================

// ---- Core Types ----
export type {
  ToolStatus,
  ToolResult,
  ToolResultStatus,
  ActiveTool,
  ToolSchema,
  SchemaField,
  HumanToolDefinition,
  ToolValidator,
  ValidationResult,
  ValidationError,
  ToolMetadata,
} from './types'
export { TERMINAL_STATUSES } from './types'

// ---- Lifecycle ----
export {
  VALID_TRANSITIONS,
  isValidTransition,
  transition,
  isTerminal,
  getNextStates,
  EVENT_TO_TRANSITION,
} from './lifecycle'
export type { LifecycleEvent } from './lifecycle'

// ---- Registry ----
export {
  registerTool,
  unregisterTool,
  resolveTool,
  isRegistered,
  getAllVersions,
  getAllTypes,
  getAllTools,
  clearRegistry,
  getRegistryStats,
} from './registry'

// ---- SDK ----
export { useTool, ToolProvider } from './sdk'
export type { ToolSDK, ToolTransport } from './sdk'

// ---- Runtime ----
export { ToolRenderer } from './runtime'

// ---- Validation ----
export { validatePayload, validateToolResult } from './validation'

// ---- Plugin API ----
export { registerPlugin, registerToolPlugin, defineTool } from './plugin'
export type { ToolPlugin } from './plugin'

// ---- Tool Definitions (auto-register on import) ----
import { createTechnicalTicketDefinition, createSupportTicketDefinition } from './create-ticket/definition'
import { selectProductDefinition } from './select-product/definition'
import { registerTool } from './registry'

// Register all built-in tools
registerTool(createTechnicalTicketDefinition, { isDefault: true })
registerTool(createSupportTicketDefinition, { isDefault: true })
registerTool(selectProductDefinition, { isDefault: true })
