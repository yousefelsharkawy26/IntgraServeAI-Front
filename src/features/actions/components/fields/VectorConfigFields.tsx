import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ActionFormData } from '@/schemas/actionSchema'

export function VectorConfigFields() {
  const { register, formState: { errors } } = useFormContext<ActionFormData>()

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
          <Textarea
            placeholder='e.g., {"category": "electronics"}'
            className="mt-1 h-9 text-xs min-h-[60px] font-mono"
            {...register('vectorConfig.filter' as any, {
              setValueAs: (raw) => {
                if (typeof raw !== 'string' || !raw.trim()) return undefined
                try {
                  const parsed = JSON.parse(raw)
                  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed as Record<string, string>
                  }
                  return undefined
                } catch {
                  return undefined
                }
              },
            })}
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Optional. Leave blank for no filter.
          </p>
        </div>
      </div>
    </div>
  )
}