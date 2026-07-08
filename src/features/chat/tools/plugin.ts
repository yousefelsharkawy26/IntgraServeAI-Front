// ============================================================
// Human Tool Runtime — Plugin Registration API
// ============================================================
// High-level API for registering tool plugins.
// Provides a clean, declarative way to add tools.
//
// Usage:
//   registerPlugin({
//     tools: [createTicketDefinition, selectProductDefinition],
//   })
//
// Or for a single tool:
//   registerToolPlugin(createTicketDefinition)
// ============================================================

import { registerTool } from './registry'
import type { HumanToolDefinition } from './types'

/**
 * Plugin definition — a collection of tools and optional metadata.
 */
export interface ToolPlugin {
  /** Plugin name (for debugging/logging) */
  name?: string
  /** Plugin version */
  version?: string
  /** Tool definitions to register */
  tools: HumanToolDefinition[]
  /** Optional setup function (called once during registration) */
  setup?: () => void | Promise<void>
  /** Optional teardown function (called during unregistration) */
  teardown?: () => void | Promise<void>
}

/**
 * Register a plugin (one or more tools).
 */
export async function registerPlugin(plugin: ToolPlugin): Promise<void> {
  if (plugin.setup) {
    await plugin.setup()
  }

  for (const tool of plugin.tools) {
    registerTool(tool, { isDefault: true })
  }

  if (plugin.name) {
    console.log(
      `[ToolPlugin] Registered plugin "${plugin.name}" with ${plugin.tools.length} tool(s)`
    )
  }
}

/**
 * Register a single tool as a plugin.
 */
export async function registerToolPlugin(
  definition: HumanToolDefinition,
  options?: { isDefault?: boolean }
): Promise<void> {
  registerTool(definition, options)
  console.log(
    `[ToolPlugin] Registered tool: ${definition.type}@${definition.version}`
  )
}

/**
 * Create a tool definition with sensible defaults.
 * Helper for tool authors.
 */
export function defineTool<TParams = Record<string, unknown>>(
  config: Omit<HumanToolDefinition<TParams>, 'version'> & { version?: string }
): HumanToolDefinition<TParams> {
  return {
    version: 'v1',
    ...config,
  } as HumanToolDefinition<TParams>
}
