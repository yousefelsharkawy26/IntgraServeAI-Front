import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionFormData } from '@/schemas/actionSchema'
import { ParameterFields } from './ParameterFields'
import { ResponseConfigFields } from './ResponseConfigFields'

export function SqlConfigFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ActionFormData>()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        SQL Query Configuration
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Connector</Label>
          <Input
            {...register('sqlConfig.connector')}
            placeholder="e.g., postgresql"
            className="mt-1 h-9 text-xs"
          />
          {errors.sqlConfig?.connector && (
            <p className="mt-1 text-xs text-red-500">
              {errors.sqlConfig.connector.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Connection String</Label>
          <Input
            {...register('sqlConfig.connectionString')}
            placeholder="e.g., host:5432/dbname"
            className="mt-1 h-9 text-xs"
          />
          {errors.sqlConfig?.connectionString && (
            <p className="mt-1 text-xs text-red-500">
              {errors.sqlConfig.connectionString.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Max Results</Label>
          <Input
            type="number"
            {...register('sqlConfig.maxResults', { valueAsNumber: true })}
            className="mt-1 h-9 text-xs"
          />
        </div>
      </div>

      <ParameterFields basePath="sqlConfig" actionType="sql_query" />
      <ResponseConfigFields basePath="sqlConfig" actionType="sql_query" />
    </div>
  )
}
