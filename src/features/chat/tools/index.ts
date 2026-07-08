// ============================================================
// Human Tool Runtime — Public API
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
  ToolCapability,
  ToolLifecycleHooks,
  DiagnosticLevel,
  DiagnosticEvent,
  PluginLoader,
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
  // New: Capability querying
  getRegisteredCapabilities,
  getToolsByCapability,
  getCapabilityManifest,
  // New: Dynamic loading
  loadPlugin,
  isPluginLoaded,
  prefetchTool,
} from './registry'

// ---- SDK ----
export { useTool, ToolProvider, createLifecycleController } from './sdk'
export type { ToolSDK, ToolTransport, LifecycleController } from './sdk'

// ---- Runtime ----
export { ToolRenderer, useToolPrefetch } from './runtime'

// ---- Validation ----
export { validatePayload, validateToolResult } from './validation'

// ---- Plugin API ----
export {
  registerPlugin,
  registerToolPlugin,
  defineTool,
  loadDynamicPlugin,
  loadRemotePlugin,
} from './plugin'
export type { ToolPlugin } from './plugin'

// ---- Diagnostics ----
export { diagnostics } from './diagnostics'

// ---- Tool Definitions (auto-register on import) ----
import { createTechnicalTicketDefinition, createSupportTicketDefinition } from './create-ticket/definition'
import { selectProductDefinition } from './select-product/definition'
import { registerTool } from './registry'

// Register all built-in tools
registerTool(createTechnicalTicketDefinition, { isDefault: true })
registerTool(createSupportTicketDefinition, { isDefault: true })
registerTool(selectProductDefinition, { isDefault: true })
