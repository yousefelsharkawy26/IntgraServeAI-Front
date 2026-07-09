import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActionFormData } from '@/schemas/actionSchema'
import type { ActionType } from '@/types/action'
import { CREATABLE_ACTION_TYPES, ACTION_TYPE_CONFIGS } from '@/types/action'

export function BasicInfoFields() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ActionFormData>()
  const type = watch('type')

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label className="text-sm font-medium">Name</Label>
        <Input
          {...register('name')}
          placeholder="e.g., get_product_info"
          className="mt-1.5 h-10"
        />
        {errors.name ? (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        ) : (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Lowercase letters, digits, and underscores only. Must start with a letter.
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          {...register('description')}
          placeholder="What does this action do?"
          className="mt-1.5 min-h-[60px]"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium">Type</Label>
        <Select
          value={type}
          onValueChange={(v) => setValue('type', v as ActionType)}
        >
          <SelectTrigger className="mt-1.5 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CREATABLE_ACTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {ACTION_TYPE_CONFIGS[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {type && ACTION_TYPE_CONFIGS[type as ActionType] && (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {ACTION_TYPE_CONFIGS[type as ActionType].description}
          </p>
        )}
      </div>

      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={watch('requiresConfirmation')}
            onCheckedChange={(v) => setValue('requiresConfirmation', v)}
          />
          Requires Confirmation
        </label>
      </div>
    </div>
  )
}
