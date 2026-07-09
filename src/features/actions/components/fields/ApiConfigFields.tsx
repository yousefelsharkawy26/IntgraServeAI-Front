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
import { ParameterFields } from './ParameterFields'
import { ResponseConfigFields } from './ResponseConfigFields'

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

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        API Configuration
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
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
            placeholder="https://api.example.com/v1/endpoint"
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
          <div key={field.id} className="mt-1.5 flex items-center gap-1.5">
            <Input
              {...register(`apiConfig.headers.${i}.key`)}
              placeholder="Key"
              className="h-7 text-xs flex-1"
            />
            <Input
              {...register(`apiConfig.headers.${i}.value`)}
              placeholder="Value"
              className="h-7 text-xs flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => removeHeader(i)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      <ParameterFields basePath="apiConfig" actionType="api_request" />
      <ResponseConfigFields basePath="apiConfig" actionType="api_request" />
    </div>
  )
}
