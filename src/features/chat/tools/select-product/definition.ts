// ============================================================
// Select Product Tool — Definition
// ============================================================
// Lazy-loaded definition with metadata and schema.
// ============================================================

import { lazy } from 'react'
import { defineTool } from '../plugin'
import type { ToolSchema } from '../types'

const SelectProductTool = lazy(() =>
  import('./SelectProductTool').then((m) => ({ default: m.SelectProductTool }))
)

const schema: ToolSchema = {
  fields: [
    {
      name: 'productId',
      type: 'string',
      label: 'Product ID',
      required: true,
    },
    {
      name: 'productName',
      type: 'string',
      label: 'Product Name',
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      label: 'Price',
      required: false,
      min: 0,
    },
  ],
}

export const selectProductDefinition = defineTool({
  type: 'select_product',
  label: 'Select Product',
  description: 'Choose a product from the available options.',
  Component: SelectProductTool,
  schema,
  permissions: ['products:read'],
  capabilities: ['progress'],
  supportsResume: false,
  timeoutMs: 3 * 60 * 1000, // 3 minutes
})
