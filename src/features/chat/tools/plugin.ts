// ============================================================
// Human Tool Runtime — Plugin Registration API
// ============================================================
// High-level API for registering tool plugins.
// Supports static and dynamic (lazy/remote) loading.
//
// Static:
//   registerPlugin({ tools: [definition] })
//
// Dynamic:
//   loadDynamicPlugin(() => import('./my-plugin'))
//   loadRemotePlugin('https://cdn.example.com/plugins/crm.js')
// ============================================================

import { registerTool, loadPlugin } from './registry'
import type { HumanToolDefinition, PluginLoader } from './types'
import { diagnostics } from './diagnostics'

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
  /** Plugin dependencies (e.g., ['customer-plugin@>=2.0']) */
  dependencies?: string[]
}

/**
 * Register a plugin (one or more tools) statically.
 */
export async function registerPlugin(plugin: ToolPlugin): Promise<void> {
  if (plugin.setup) {
    await plugin.setup()
  }

  for (const tool of plugin.tools) {
    registerTool(tool, { isDefault: true })
  }

  diagnostics.info('plugin', `Plugin registered: ${plugin.name || 'unnamed'}`, {
    pluginName: plugin.name,
    pluginVersion: plugin.version,
    toolsCount: plugin.tools.length,
    toolTypes: plugin.tools.map((t) => t.type),
    dependencies: plugin.dependencies,
  })
}

/**
 * Register a single tool as a plugin.
 */
export async function registerToolPlugin(
  definition: HumanToolDefinition,
  options?: { isDefault?: boolean }
): Promise<void> {
  registerTool(definition, options)
}

/**
 * Load a plugin dynamically from a module import.
 * The module should export a `default` ToolPlugin or an array of HumanToolDefinition.
 *
 * Example:
 *   await loadDynamicPlugin(() => import('./plugins/crm-plugin'))
 */
export async function loadDynamicPlugin(
  importFn: () => Promise<{
    default: ToolPlugin | HumanToolDefinition | HumanToolDefinition[]
  }>,
  options?: { isDefault?: boolean }
): Promise<HumanToolDefinition[]> {
  try {
    const module = await importFn()
    const exported = module.default

    if (Array.isArray(exported)) {
      // Array of definitions
      for (const def of exported) {
        registerTool(def, { ...options, silent: true })
      }
      diagnostics.info('plugin', `Dynamic plugin loaded (array)`, {
        toolsCount: exported.length,
      })
      return exported
    }

    if ('tools' in exported && Array.isArray((exported as ToolPlugin).tools)) {
      // ToolPlugin object
      const plugin = exported as ToolPlugin
      await registerPlugin(plugin)
      return plugin.tools
    }

    if ('type' in exported && 'version' in exported) {
      // Single definition
      const def = exported as HumanToolDefinition
      registerTool(def, { ...options, silent: true })
      diagnostics.info('plugin', `Dynamic plugin loaded (single)`, {
        toolType: def.type,
      })
      return [def]
    }

    throw new Error('Dynamic plugin module must export a ToolPlugin, HumanToolDefinition, or array of definitions')
  } catch (error) {
    diagnostics.error('plugin', `Failed to load dynamic plugin`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

/**
 * Load a plugin from a remote URL using a custom PluginLoader.
 *
 * Example:
 *   const loader: PluginLoader = {
 *     load: async (url) => { ... fetch and parse ... },
 *     isAvailable: async (url) => { ... check availability ... },
 *   }
 *   await loadRemotePlugin('https://cdn.example.com/plugins/crm.js', loader)
 */
export async function loadRemotePlugin(
  url: string,
  loader: PluginLoader,
  options?: { isDefault?: boolean }
): Promise<HumanToolDefinition[]> {
  return loadPlugin(url, loader, options)
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
