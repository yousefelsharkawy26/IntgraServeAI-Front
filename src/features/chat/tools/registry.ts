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
// ============================================================

import type { HumanToolDefinition } from './types'

/**
 * Internal registry storage.
 * Key format: "type" or "type@version"
 */
const registry = new Map<string, HumanToolDefinition>()

/**
 * Default version to use when none is specified.
 */
const defaultVersions = new Map<string, string>()

// -------------------------------------------------------
// Registration
// -------------------------------------------------------

/**
 * Register a tool definition.
 * @param definition The tool definition to register
 * @param options.isDefault If true, this version becomes the default for the type
 */
export function registerTool(
  definition: HumanToolDefinition,
  options?: { isDefault?: boolean }
): void {
  const key = `${definition.type}@${definition.version}`
  
  if (registry.has(key)) {
    console.warn(
      `[ToolRegistry] Overwriting existing tool: ${key}. ` +
        'If this is intentional, call unregisterTool() first.'
    )
  }
  
  registry.set(key, definition)
  
  // Set as default version if requested or if no default exists
  if (options?.isDefault || !defaultVersions.has(definition.type)) {
    defaultVersions.set(definition.type, definition.version)
  }
}

/**
 * Unregister a tool definition.
 */
export function unregisterTool(type: string, version?: string): boolean {
  if (version) {
    const key = `${type}@${version}`
    const deleted = registry.delete(key)
    
    // If we deleted the default version, pick a new default
    if (deleted && defaultVersions.get(type) === version) {
      const remaining = getAllVersions(type)
      if (remaining.length > 0) {
        defaultVersions.set(type, remaining[0])
      } else {
        defaultVersions.delete(type)
      }
    }
    
    return deleted
  }
  
  // Unregister all versions
  const keys = Array.from(registry.keys()).filter((k) => k.startsWith(`${type}@`))
  keys.forEach((k) => registry.delete(k))
  defaultVersions.delete(type)
  
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
 * 
 * @param type Tool type (e.g., "create_ticket" or "create_ticket@v2")
 * @returns Tool definition or undefined
 */
export function resolveTool(type: string): HumanToolDefinition | undefined {
  // Case 1: Explicit version in type string (e.g., "create_ticket@v2")
  if (type.includes('@')) {
    return registry.get(type)
  }
  
  // Case 2: Use default version
  const defaultVersion = defaultVersions.get(type)
  if (defaultVersion) {
    return registry.get(`${type}@${defaultVersion}`)
  }
  
  // Case 3: Find latest version
  const versions = getAllVersions(type)
  if (versions.length > 0) {
    const latest = versions.sort().reverse()[0]
    return registry.get(`${type}@${latest}`)
  }
  
  // Case 4: Fuzzy match (case-insensitive partial match)
  const lowerType = type.toLowerCase()
  for (const [key, def] of registry.entries()) {
    const [keyType] = key.split('@')
    if (
      keyType.toLowerCase() === lowerType ||
      keyType.toLowerCase().includes(lowerType) ||
      lowerType.includes(keyType.toLowerCase())
    ) {
      return def
    }
  }
  
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

/**
 * Clear the entire registry (for testing).
 */
export function clearRegistry(): void {
  registry.clear()
  defaultVersions.clear()
}

/**
 * Get registry statistics (for debugging).
 */
export function getRegistryStats(): {
  totalTools: number
  totalTypes: number
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
    types,
  }
}
