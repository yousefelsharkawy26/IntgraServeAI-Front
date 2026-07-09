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

interface ParameterFieldsProps {
  /** Form path prefix, e.g. 'apiConfig' or 'rpcConfig' */
  basePath: string
  actionType: ActionType
}

export function ParameterFields({ basePath, actionType }: ParameterFieldsProps) {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<ActionFormData>()

  const config = ACTION_TYPE_CONFIGS[actionType]
  const allowedTypes = config?.allowedParamTypes || ['query']
  const defaultParamType = allowedTypes[0] || 'query'

  const {
    fields: paramFields,
    append: appendParam,
    remove: removeParam,
  } = useFieldArray({ control, name: `${basePath}.parameters` as any })

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Parameters</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() =>
            appendParam({
              key: '',
              value: '',
              required: false,
              paramType: defaultParamType,
              description: '',
              enumValues: '',
            })
          }
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      {paramFields.map((field, i) => (
        <div key={field.id} className="mt-2 space-y-1 rounded-md border border-[var(--color-border-light)] p-2">
          <div className="flex items-center gap-1.5">
            <Input
              {...register(`${basePath}.parameters.${i}.key` as any)}
              placeholder="Key"
              className="h-7 text-xs flex-1"
            />
            <Input
              {...register(`${basePath}.parameters.${i}.value` as any)}
              placeholder="Default"
              className="h-7 text-xs flex-1"
            />
            {allowedTypes.length > 1 ? (
              <Select
                value={watch(`${basePath}.parameters.${i}.paramType` as any) || defaultParamType}
                onValueChange={(v) =>
                  setValue(`${basePath}.parameters.${i}.paramType` as any, v)
                }
              >
                <SelectTrigger className="h-7 text-xs w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-[var(--color-text-muted)] w-[90px] text-center">
                {allowedTypes[0]?.replace('_', ' ')}
              </span>
            )}
            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
              <input
                type="checkbox"
                {...register(`${basePath}.parameters.${i}.required` as any)}
                className="rounded"
              />
              Req
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => removeParam(i)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              {...register(`${basePath}.parameters.${i}.description` as any)}
              placeholder="Description"
              className="h-7 text-xs flex-1"
            />
            <Input
              {...register(`${basePath}.parameters.${i}.enumValues` as any)}
              placeholder="Enum (comma-separated)"
              className="h-7 text-xs w-[180px]"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
