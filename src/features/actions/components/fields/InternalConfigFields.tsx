import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionFormData } from '@/schemas/actionSchema'

export function InternalConfigFields() {
  const { register, formState: { errors } } = useFormContext<ActionFormData>()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Internal Configuration
      </h3>

      <div>
        <Label className="text-xs">Handler Function</Label>
        <Input
          {...register('internalConfig.handler')}
          placeholder="e.g., productSearchHandler"
          className="mt-1 h-9 text-xs"
        />
        {errors.internalConfig?.handler && (
          <p className="mt-1 text-xs text-red-500">
            {errors.internalConfig.handler.message}
          </p>
        )}
      </div>
    </div>
  )
}