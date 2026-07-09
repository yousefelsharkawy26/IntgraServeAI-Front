import { useFormContext, useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActionFormData } from '@/schemas/actionSchema'
import type { ActionType } from '@/types/action'
import { ACTION_TYPE_CONFIGS } from '@/types/action'

interface ResponseConfigFieldsProps {
  /** Form path prefix, e.g. 'apiConfig' or 'rpcConfig' */
  basePath: string
  actionType: ActionType
}

export function ResponseConfigFields({ basePath, actionType }: ResponseConfigFieldsProps) {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<ActionFormData>()

  const config = ACTION_TYPE_CONFIGS[actionType]
  const allowedModes = config?.allowedResponseModes || ['json']

  const {
    fields: valueFields,
    append: appendValue,
    remove: removeValue,
  } = useFieldArray({ control, name: `${basePath}.responseConfig.values` as any })

  const currentMode = watch(`${basePath}.responseConfig.mode` as any) || 'json'
  const nestedErrors = (errors as any)?.[basePath]?.responseConfig

  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-border-light)] p-3">
      <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
        Response Config
      </h4>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Mode</Label>
          <Select
            value={currentMode}
            onValueChange={(v) => setValue(`${basePath}.responseConfig.mode` as any, v)}
          >
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedModes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Error Message</Label>
          <Input
            {...register(`${basePath}.responseConfig.onError` as any)}
            placeholder="Action execution failed"
            className="mt-1 h-8 text-xs"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Response Template</Label>
        <Input
          {...register(`${basePath}.responseConfig.template` as any)}
          placeholder="{{result}}"
          className="mt-1 h-8 text-xs"
        />
        {nestedErrors?.template && (
          <p className="mt-1 text-xs text-red-500">{nestedErrors.template.message}</p>
        )}
      </div>

      {/* Value mappings */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Value Mappings</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-xs"
            onClick={() => appendValue({ name: '', type: 'string', path: '' })}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {valueFields.map((field, i) => (
          <div key={field.id} className="mt-1.5 flex items-center gap-1.5">
            <Input
              {...register(`${basePath}.responseConfig.values.${i}.name` as any)}
              placeholder="Name"
              className="h-7 text-xs flex-1"
            />
            <Select
              value={watch(`${basePath}.responseConfig.values.${i}.type` as any) || 'string'}
              onValueChange={(v) =>
                setValue(`${basePath}.responseConfig.values.${i}.type` as any, v as 'string' | 'integer')
              }
            >
              <SelectTrigger className="h-7 text-xs w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="integer">Integer</SelectItem>
              </SelectContent>
            </Select>
            <Input
              {...register(`${basePath}.responseConfig.values.${i}.path` as any)}
              placeholder="JSON path (e.g., data.result)"
              className="h-7 text-xs flex-[2]"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => removeValue(i)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
