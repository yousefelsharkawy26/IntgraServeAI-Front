// ============================================================
// Create Ticket Tool — Definition
// ============================================================
// Lazy-loaded definition with metadata, schema, and validation.
// ============================================================

import { lazy } from 'react'
import { defineTool } from '../plugin'
import type { ToolSchema } from '../types'

const CreateTicketTool = lazy(() =>
  import('./CreateTicketTool').then((m) => ({ default: m.CreateTicketTool }))
)

const schema: ToolSchema = {
  fields: [
    {
      name: 'subject',
      type: 'string',
      label: 'Subject',
      required: true,
      min: 3,
      max: 200,
    },
    {
      name: 'description',
      type: 'string',
      label: 'Description',
      required: true,
      min: 10,
      max: 5000,
    },
    {
      name: 'priority',
      type: 'enum',
      label: 'Priority',
      required: true,
      options: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    {
      name: 'customerName',
      type: 'string',
      label: 'Customer Name',
      required: true,
      min: 2,
      max: 100,
    },
    {
      name: 'customerEmail',
      type: 'string',
      label: 'Customer Email',
      required: true,
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    },
  ],
}

export const createTechnicalTicketDefinition = defineTool({
  type: 'create_technical_ticket',
  label: 'Create Technical Ticket',
  description: 'Create a new technical support ticket with priority and customer details.',
  Component: CreateTicketTool,
  schema,
  permissions: ['tickets:create'],
  capabilities: ['progress', 'logging'],
  supportsResume: true,
  timeoutMs: 5 * 60 * 1000, // 5 minutes
})

export const createSupportTicketDefinition = defineTool({
  type: 'create_support_ticket',
  label: 'Create Support Ticket',
  description: 'Create a new customer support ticket.',
  Component: CreateTicketTool,
  schema,
  permissions: ['tickets:create'],
  capabilities: ['progress', 'logging'],
  supportsResume: true,
  timeoutMs: 5 * 60 * 1000,
})
