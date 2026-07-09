import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionFormData } from '@/schemas/actionSchema'
import { ResponseConfigFields } from './ResponseConfigFields'

export function VectorConfigFields() {
  const { register, formState: { errors } } = useFormContext<ActionFormData>()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Vector Query Configuration
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
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

        <div className="sm:col-span-2">
          <Label className="text-xs">Collection Name</Label>
          <Input
            {...register('vectorConfig.collectionName')}
            placeholder="e.g., products-index"
            className="mt-1 h-9 text-xs"
          />
          {errors.vectorConfig?.collectionName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.vectorConfig.collectionName.message}
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
          <Label className="text-xs">Max Results</Label>
          <Input
            type="number"
            {...register('vectorConfig.maxResults', { valueAsNumber: true })}
            className="mt-1 h-9 text-xs"
          />
        </div>

        <div className="sm:col-span-2">
          <Label className="text-xs">Metadata Filter (JSON)</Label>
          <Controller
            name={'vectorConfig.filter' as any}
            render={({ field }) => <FilterTextarea field={field} />}
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Optional. Leave blank for no filter.
          </p>
        </div>
      </div>

      <ResponseConfigFields basePath="vectorConfig" actionType="vector_query" />
    </div>
  )
}

function filterToString(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    try { return JSON.stringify(value, null, 2) } catch { return '' }
  }
  return ''
}

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

function FilterTextarea({ field }: { field: any }) {
  const [rawValue, setRawValue] = React.useState(() => filterToString(field.value))
  const isEditingRef = React.useRef(false)

  React.useEffect(() => {
    if (!isEditingRef.current) {
      setRawValue(filterToString(field.value))
    }
  }, [field.value])

  return (
    <textarea
      placeholder='{"category": "electronics"}'
      className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      value={rawValue}
      onChange={(e) => {
        setRawValue(e.target.value)
        isEditingRef.current = true
        field.onChange(parseFilter(e.target.value))
      }}
      onBlur={() => {
        isEditingRef.current = false
        setRawValue(filterToString(field.value))
        field.onBlur()
      }}
    />
  )
}
