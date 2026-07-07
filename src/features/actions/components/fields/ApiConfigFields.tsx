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
import { HTTP_METHODS } from '@/constants/actions'
import type { ActionFormData } from '@/schemas/actionSchema'

export function ApiConfigFields() {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<ActionFormData>()

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({ control, name: 'apiConfig.headers' as const })

  const {
    fields: paramFields,
    append: appendParam,
    remove: removeParam,
  } = useFieldArray({ control, name: 'apiConfig.parameters' as const })

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        API Configuration
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Protocol</Label>
          <Select
            value={watch('apiConfig.protocol')}
            onValueChange={(v) =>
              setValue('apiConfig.protocol', v as 'http' | 'https')
            }
          >
            <SelectTrigger className="mt-1 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="https">HTTPS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Method</Label>
          <Select
            value={watch('apiConfig.method')}
            onValueChange={(v) =>
              setValue('apiConfig.method', v as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')
            }
          >
            <SelectTrigger className="mt-1 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label className="text-xs">URL</Label>
          <Input
            {...register('apiConfig.url')}
            placeholder="https://api.example.com/endpoint"
            className="mt-1 h-9 text-xs"
          />
          {errors.apiConfig?.url && (
            <p className="mt-1 text-xs text-red-500">
              {errors.apiConfig.url.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Timeout (ms)</Label>
          <Input
            type="number"
            {...register('apiConfig.timeout', { valueAsNumber: true })}
            className="mt-1 h-9 text-xs"
          />
        </div>

        <div>
          <Label className="text-xs">Response Path</Label>
          <Input
            {...register('apiConfig.responseConfig.path')}
            placeholder="data.result"
            className="mt-1 h-9 text-xs"
          />
        </div>
      </div>

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Headers</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => appendHeader({ key: '', value: '' })}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {headerFields.map((field, i) => (
          <div key={field.id} className="mt-2 flex items-center gap-2">
            <Input
              {...register(`apiConfig.headers.${i}.key`)}
              placeholder="Key"
              className="h-8 text-xs flex-1"
            />
            <Input
              {...register(`apiConfig.headers.${i}.value`)}
              placeholder="Value"
              className="h-8 text-xs flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => removeHeader(i)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      {/* Parameters */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Parameters</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => appendParam({ key: '', value: '', required: false })}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {paramFields.map((field, i) => (
          <div key={field.id} className="mt-2 flex items-center gap-2">
            <Input
              {...register(`apiConfig.parameters.${i}.key`)}
              placeholder="Key"
              className="h-8 text-xs flex-1"
            />
            <Input
              {...register(`apiConfig.parameters.${i}.value`)}
              placeholder="Value"
              className="h-8 text-xs flex-1"
            />
            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
              <input
                type="checkbox"
                {...register(`apiConfig.parameters.${i}.required`)}
                className="rounded"
              />
              Req
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => removeParam(i)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}