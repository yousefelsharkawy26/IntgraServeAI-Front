// ============================================================
// Human Tool Runtime — Tool Registry
// ============================================================
// Single source of truth mapping action names to tool definitions.
//
// To add a new tool:
//   1. Create the component in tools/<name>/<Name>Tool.tsx
//   2. Import it here
//   3. Add an entry to the registry
//
// That's it. No chat modifications needed.
// ============================================================

import type { ToolRegistry } from './types'
import { CreateTicketTool } from './create-ticket/CreateTicketTool'
import { SelectProductTool } from './select-product/SelectProductTool'

export const toolRegistry: ToolRegistry = {
  // ---- Ticket tools ----
  create_technical_ticket: {
    type: 'create_technical_ticket',
    label: 'Create Technical Ticket',
    Component: CreateTicketTool,
  },
  create_support_ticket: {
    type: 'create_support_ticket',
    label: 'Create Support Ticket',
    Component: CreateTicketTool, // Same component, different action name
  },

  // ---- Product tools ----
  select_product: {
    type: 'select_product',
    label: 'Select Product',
    Component: SelectProductTool,
  },

  // ---- Future tools (just add entries here) ----
  // upload_attachment: {
  //   type: 'upload_attachment',
  //   label: 'Upload Attachment',
  //   Component: UploadAttachmentTool,
  // },
  // select_customer: {
  //   type: 'select_customer',
  //   label: 'Select Customer',
  //   Component: CustomerSelectorTool,
  // },
}

/**
 * Look up a tool definition by its action name.
 * Returns undefined if the tool is not registered.
 */
export function getToolDefinition(actionName: string) {
  // Try exact match first
  if (toolRegistry[actionName]) return toolRegistry[actionName]

  // Try case-insensitive match
  const lowerName = actionName.toLowerCase()
  for (const [key, def] of Object.entries(toolRegistry)) {
    if (key.toLowerCase() === lowerName) return def
  }

  // Try partial match (e.g. 'create_ticket' matches 'create_technical_ticket')
  for (const [key, def] of Object.entries(toolRegistry)) {
    if (key.includes(lowerName) || lowerName.includes(key)) return def
  }

  return undefined
}

/**
 * Check if a tool is registered.
 */
export function isToolRegistered(actionName: string): boolean {
  return getToolDefinition(actionName) !== undefined
}
