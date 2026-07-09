import { useState, useRef, useEffect } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionFormData } from '@/schemas/actionSchema'

/** Safely stringify a filter value for display in the textarea. */
function filterToString(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return ''
    }
  }
  return ''
}

/** Parse a JSON string into a Record<string, string>, or return undefined. */
function parseFilter(raw: string): Record<string, string> | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>
    }
    return undefined
  } catch {
    return undefined
  }
}

export function VectorConfigFields() {
  const { register, control, formState: { errors } } = useFormContext<ActionFormData>()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Vector Query Configuration
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="text-xs">Index Name</Label>
          <Input
            {...register('vectorConfig.indexName')}
            placeholder="e.g., products-index"
            className="mt-1 h-9 text-xs"
          />
          {errors.vectorConfig?.indexName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.vectorConfig.indexName.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Connector</Label>
          <Input
            {...register('vectorConfig.connector')}
            placeholder="e.g., pinecone"
            className="mt-1 h-9 text-xs"
          />
          {errors.vectorConfig?.connector && (
            <p className="mt-1 text-xs text-red-500">
              {errors.vectorConfig.connector.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Connection String</Label>
          <Input
            {...register('vectorConfig.connectionString')}
            placeholder="e.g., host:port or connection URL"
            className="mt-1 h-9 text-xs"
          />
          {errors.vectorConfig?.connectionString && (
            <p className="mt-1 text-xs text-red-500">
              {errors.vectorConfig.connectionString.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Embedding Model</Label>
          <Input
            {...register('vectorConfig.embeddingModel')}
            placeholder="e.g., text-embedding-3-small"
            className="mt-1 h-9 text-xs"
          />
          {errors.vectorConfig?.embeddingModel && (
            <p className="mt-1 text-xs text-red-500">
              {errors.vectorConfig.embeddingModel.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Top K</Label>
          <Input
            type="number"
            {...register('vectorConfig.topK', { valueAsNumber: true })}
            className="mt-1 h-9 text-xs"
          />
          {errors.vectorConfig?.topK && (
            <p className="mt-1 text-xs text-red-500">
              {errors.vectorConfig.topK.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Threshold</Label>
          <Input
            type="number"
            step="0.01"
            {...register('vectorConfig.threshold', { valueAsNumber: true })}
            className="mt-1 h-9 text-xs"
          />
          {errors.vectorConfig?.threshold && (
            <p className="mt-1 text-xs text-red-500">
              {errors.vectorConfig.threshold.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label className="text-xs">Metadata Filter (JSON)</Label>
          <Controller
            name={'vectorConfig.filter' as any}
            control={control}
            render={({ field }) => (
              <FilterTextarea field={field} />
            )}
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Optional. Leave blank for no filter.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Separates the raw display string from the parsed form value.
 * - The textarea always shows the raw string the user is typing
 * - Invalid JSON preserves the user's in-progress typing
 * - External value changes (form reset) sync the display
 * - During active editing, the display is NOT reformatted
 */
function FilterTextarea({ field }: { field: any }) {
  const [rawValue, setRawValue] = useState(() => filterToString(field.value))
  const isEditingRef = useRef(false)

  // When the form value changes externally (e.g., form reset),
  // sync the display. But skip if the user is actively typing,
  // to avoid reformatting their in-progress JSON.
  useEffect(() => {
    if (!isEditingRef.current) {
      setRawValue(filterToString(field.value))
    }
  }, [field.value])

  return (
    <textarea
      placeholder='e.g., {"category": "electronics"}'
      className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      value={rawValue}
      onChange={(e) => {
        const raw = e.target.value
        setRawValue(raw)
        isEditingRef.current = true
        // Parse and push to form — invalid JSON stores undefined,
        // but the textarea keeps showing the raw string.
        const parsed = parseFilter(raw)
        field.onChange(parsed)
      }}
      onBlur={() => {
        isEditingRef.current = false
        // On blur, re-sync the display from the form value.
        // This reformats valid JSON with pretty-printing.
        setRawValue(filterToString(field.value))
        field.onBlur()
      }}
    />
  )
}
