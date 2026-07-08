// ============================================================
// Select Product Tool (Mock)
// ============================================================
// Demonstrates that adding a new tool requires ONLY:
//   1. Create this component
//   2. Register it in the registry
// No chat modifications needed.
// ============================================================

import { useState } from 'react'
import { useToolContext } from '../ToolContext'
import { Button } from '@/components/ui/button'
import { X, Check, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock product data — in a real app this would come from an API
const MOCK_PRODUCTS = [
  { id: 'prod-1', name: 'Enterprise Plan', price: 299, description: 'Full-featured enterprise solution' },
  { id: 'prod-2', name: 'Professional Plan', price: 149, description: 'Advanced features for growing teams' },
  { id: 'prod-3', name: 'Starter Plan', price: 49, description: 'Essential features for small teams' },
  { id: 'prod-4', name: 'Custom Solution', price: 0, description: 'Tailored to your specific needs' },
]

export function SelectProductTool() {
  const { toolCallId, params, sendResult, cancel } = useToolContext()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleConfirm = () => {
    const product = MOCK_PRODUCTS.find((p) => p.id === selectedId)
    if (!product) return

    // Send the selected product back through the tool runtime.
    // The backend receives this and continues execution.
    sendResult({
      productId: product.id,
      productName: product.name,
      price: product.price,
    })
  }

  return (
    <div className="fixed left-1/2 top-[10%] z-50 w-full max-w-md -translate-x-1/2 rounded-xl border bg-card shadow-2xl">
      {/* Backdrop */}
      <div className="fixed inset-0 z-[-1] bg-black/40" onClick={cancel} />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Select Product</h2>
        </div>
        <button
          onClick={cancel}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Product list */}
      <div className="p-4 space-y-2">
        {MOCK_PRODUCTS.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setSelectedId(product.id)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
              selectedId === product.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border hover:bg-muted/50'
            )}
          >
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              selectedId === product.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              {selectedId === product.id ? (
                <Check className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{product.name}</span>
                {product.price > 0 && (
                  <span className="text-sm font-semibold text-primary">
                    ${product.price}/mo
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-full px-4"
          onClick={cancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="h-9 rounded-full px-6"
          disabled={!selectedId}
          onClick={handleConfirm}
        >
          <Check className="h-4 w-4 mr-1.5" />
          Confirm Selection
        </Button>
      </div>
    </div>
  )
}
