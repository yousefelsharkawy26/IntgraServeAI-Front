// ============================================================
// Human Tool Runtime — Tool Registry
// ============================================================
// RESPONSIBILITY: Describe and resolve tools ONLY.
// Does NOT execute, validate, render, or manage state.
//
// Features:
//   - Version-aware resolution (type@version)
//   - Lazy loading support
//   - Metadata storage
//   - Plugin registration
//   - Capability querying
//   - Diagnostic integration
// ============================================================

import type { HumanToolDefinition, ToolCapability, PluginLoader } from './types'
import { diagnostics } from './diagnostics'

/**
 * Internal registry storage.
 * Key format: "type@version"
 */
const registry = new Map<string, HumanToolDefinition>()

/**
 * Default version to use when none is specified.
 */
const defaultVersions = new Map<string, string>()

/**
 * Loaded plugin identifiers (for deduplication).
 */
const loadedPlugins = new Set<string>()

// -------------------------------------------------------
// Registration
// -------------------------------------------------------

/**
 * Register a tool definition.
 */
export function registerTool(
  definition: HumanToolDefinition,
  options?: { isDefault?: boolean; silent?: boolean }
): void {
  const key = `${definition.type}@${definition.version}`

  if (registry.has(key)) {
    diagnostics.warn('registry', `Overwriting existing tool: ${key}`, {
      actionName: definition.type,
      existingVersion: definition.version,
    })
  }

  registry.set(key, definition)

  // Set as default version if requested or if no default exists
  if (options?.isDefault || !defaultVersions.has(definition.type)) {
    defaultVersions.set(definition.type, definition.version)
  }

  if (!options?.silent) {
    diagnostics.info('registry', `Tool registered: ${key}`, {
      actionName: definition.type,
      version: definition.version,
      label: definition.label,
      capabilities: definition.capabilities,
      experimental: definition.experimental,
    })
  }
}

/**
 * Unregister a tool definition.
 */
export function unregisterTool(type: string, version?: string): boolean {
  if (version) {
    const key = `${type}@${version}`
    const deleted = registry.delete(key)

    if (deleted && defaultVersions.get(type) === version) {
      const remaining = getAllVersions(type)
      if (remaining.length > 0) {
        defaultVersions.set(type, remaining[0])
      } else {
        defaultVersions.delete(type)
      }
    }

    if (deleted) {
      diagnostics.info('registry', `Tool unregistered: ${key}`, { actionName: type, version })
    }
    return deleted
  }

  const keys = Array.from(registry.keys()).filter((k) => k.startsWith(`${type}@`))
  keys.forEach((k) => registry.delete(k))
  defaultVersions.delete(type)

  if (keys.length > 0) {
    diagnostics.info('registry', `All versions unregistered: ${type}`, {
      actionName: type,
      versionsRemoved: keys.length,
    })
  }
  return keys.length > 0
}

// -------------------------------------------------------
// Resolution
// -------------------------------------------------------

/**
 * Resolve a tool definition by type and optional version.
 *
 * Resolution order:
 *   1. Exact match: "type@version"
 *   2. Default version: "type" → "type@defaultVersion"
 *   3. Latest version: "type" → highest version
 *   4. Fuzzy match: partial type name
 */
export function resolveTool(type: string): HumanToolDefinition | undefined {
  // Case 1: Explicit version
  if (type.includes('@')) {
    const result = registry.get(type)
    if (result) {
      diagnostics.debug('registry', `Resolved tool (exact): ${type}`, {
        actionName: type,
        version: type.split('@')[1],
      })
    }
    return result
  }

  // Case 2: Default version
  const defaultVersion = defaultVersions.get(type)
  if (defaultVersion) {
    const result = registry.get(`${type}@${defaultVersion}`)
    if (result) {
      diagnostics.debug('registry', `Resolved tool (default): ${type}@${defaultVersion}`, {
        actionName: type,
        version: defaultVersion,
      })
    }
    return result
  }

  // Case 3: Latest version
  const versions = getAllVersions(type)
  if (versions.length > 0) {
    const latest = versions.sort().reverse()[0]
    const result = registry.get(`${type}@${latest}`)
    if (result) {
      diagnostics.debug('registry', `Resolved tool (latest): ${type}@${latest}`, {
        actionName: type,
        version: latest,
      })
    }
    return result
  }

  // Case 4: Fuzzy match
  const lowerType = type.toLowerCase()
  for (const [key, def] of registry.entries()) {
    const [keyType] = key.split('@')
    if (
      keyType.toLowerCase() === lowerType ||
      keyType.toLowerCase().includes(lowerType) ||
      lowerType.includes(keyType.toLowerCase())
    ) {
      diagnostics.debug('registry', `Resolved tool (fuzzy): ${type} → ${key}`, {
        actionName: type,
        matchedKey: key,
      })
      return def
    }
  }

  diagnostics.warn('registry', `Failed to resolve tool: ${type}`, { actionName: type })
  return undefined
}

/**
 * Check if a tool is registered.
 */
export function isRegistered(type: string): boolean {
  return resolveTool(type) !== undefined
}

/**
 * Get all registered versions of a tool type.
 */
export function getAllVersions(type: string): string[] {
  const versions: string[] = []
  const prefix = `${type}@`
  for (const key of registry.keys()) {
    if (key.startsWith(prefix)) {
      versions.push(key.slice(prefix.length))
    }
  }
  return versions
}

/**
 * Get all registered tool types (without versions).
 */
export function getAllTypes(): string[] {
  const types = new Set<string>()
  for (const key of registry.keys()) {
    const [type] = key.split('@')
    types.add(type)
  }
  return Array.from(types)
}

/**
 * Get all registered tool definitions.
 */
export function getAllTools(): HumanToolDefinition[] {
  return Array.from(registry.values())
}

// -------------------------------------------------------
// Capability Querying
// -------------------------------------------------------

/**
 * Get all capabilities supported by registered tools.
 */
export function getRegisteredCapabilities(): ToolCapability[] {
  const capabilities = new Set<ToolCapability>()
  for (const def of registry.values()) {
    if (def.capabilities) {
      def.capabilities.forEach((c) => capabilities.add(c))
    }
  }
  return Array.from(capabilities)
}

/**
 * Get all tools that require a specific capability.
 */
export function getToolsByCapability(capability: ToolCapability): HumanToolDefinition[] {
  return Array.from(registry.values()).filter(
    (def) => def.capabilities?.includes(capability)
  )
}

/**
 * Build a capability manifest for client negotiation.
 * Sent to backend on WebSocket connect.
 */
export function getCapabilityManifest(): {
  tools: Array<{
    type: string
    version: string
    capabilities: ToolCapability[]
    experimental: boolean
  }>
  totalTools: number
  totalTypes: number
} {
  const tools = Array.from(registry.values()).map((def) => ({
    type: def.type,
    version: def.version,
    capabilities: def.capabilities || [],
    experimental: def.experimental || false,
  }))

  return {
    tools,
    totalTools: tools.length,
    totalTypes: getAllTypes().length,
  }
}

// -------------------------------------------------------
// Dynamic Plugin Loading
// -------------------------------------------------------

/**
 * Load a plugin dynamically using a PluginLoader.
 * Returns the loaded tool definitions.
 */
export async function loadPlugin(
  identifier: string,
  loader: PluginLoader,
  options?: { isDefault?: boolean }
): Promise<HumanToolDefinition[]> {
  if (loadedPlugins.has(identifier)) {
    diagnostics.warn('plugin', `Plugin already loaded: ${identifier}`, { identifier })
    return []
  }

  diagnostics.info('plugin', `Loading plugin: ${identifier}`, { identifier })

  try {
    const definitions = await loader.load(identifier)

    for (const def of definitions) {
      registerTool(def, { ...options, silent: true })
    }

    loadedPlugins.add(identifier)
    diagnostics.info('plugin', `Plugin loaded: ${identifier}`, {
      identifier,
      toolsLoaded: definitions.length,
      toolTypes: definitions.map((d) => d.type),
    })

    return definitions
  } catch (error) {
    diagnostics.error('plugin', `Failed to load plugin: ${identifier}`, {
      identifier,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

/**
 * Check if a plugin has been loaded.
 */
export function isPluginLoaded(identifier: string): boolean {
  return loadedPlugins.has(identifier)
}

/**
 * Prefetch a tool's component (for smart lazy loading).
 * Call this when a 'pause' event arrives to reduce perceived latency.
 */
export function prefetchTool(type: string): void {
  const definition = resolveTool(type)
  if (!definition) {
    diagnostics.debug('registry', `Prefetch skipped: tool not found: ${type}`, { actionName: type })
    return
  }

  // React.lazy components have a _result property when loaded,
  // or we can trigger loading by accessing the component
  const Comp = definition.Component as any
  if (Comp && typeof Comp.preload === 'function') {
    Comp.preload()
    diagnostics.debug('registry', `Prefetch triggered: ${type}`, {
      actionName: type,
      version: definition.version,
    })
  } else if (Comp && Comp._payload) {
    // React.lazy internal — trigger the import
    try {
      Comp._payload._result
    } catch {
      // Expected to throw if not yet loaded
    }
    diagnostics.debug('registry', `Prefetch triggered (lazy): ${type}`, {
      actionName: type,
      version: definition.version,
    })
  }
}

// -------------------------------------------------------
// Utility
// -------------------------------------------------------

/**
 * Clear the entire registry (for testing).
 */
export function clearRegistry(): void {
  registry.clear()
  defaultVersions.clear()
  loadedPlugins.clear()
  diagnostics.info('registry', 'Registry cleared')
}

/**
 * Get registry statistics.
 */
export function getRegistryStats(): {
  totalTools: number
  totalTypes: number
  loadedPlugins: string[]
  types: Record<string, string[]>
} {
  const types: Record<string, string[]> = {}
  for (const key of registry.keys()) {
    const [type, version] = key.split('@')
    if (!types[type]) types[type] = []
    types[type].push(version)
  }

  return {
    totalTools: registry.size,
    totalTypes: Object.keys(types).length,
    loadedPlugins: Array.from(loadedPlugins),
    types,
  }
}
