import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionFormData } from '@/schemas/actionSchema'
import { ParameterFields } from './ParameterFields'
import { ResponseConfigFields } from './ResponseConfigFields'

export function KnowledgeConfigFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ActionFormData>()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Knowledge Query Configuration
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Connector</Label>
          <Input
            {...register('knowledgeConfig.connector')}
            placeholder="e.g., elasticsearch"
            className="mt-1 h-9 text-xs"
          />
          {errors.knowledgeConfig?.connector && (
            <p className="mt-1 text-xs text-red-500">
              {errors.knowledgeConfig.connector.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Connection String</Label>
          <Input
            {...register('knowledgeConfig.connectionString')}
            placeholder="e.g., host:9200"
            className="mt-1 h-9 text-xs"
          />
          {errors.knowledgeConfig?.connectionString && (
            <p className="mt-1 text-xs text-red-500">
              {errors.knowledgeConfig.connectionString.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Collection Name</Label>
          <Input
            {...register('knowledgeConfig.collectionName')}
            placeholder="e.g., knowledge-base"
            className="mt-1 h-9 text-xs"
          />
          {errors.knowledgeConfig?.collectionName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.knowledgeConfig.collectionName.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Max Results</Label>
          <Input
            type="number"
            {...register('knowledgeConfig.maxResults', { valueAsNumber: true })}
            className="mt-1 h-9 text-xs"
          />
        </div>
      </div>

      <ParameterFields basePath="knowledgeConfig" actionType="knowledge_query" />
      <ResponseConfigFields basePath="knowledgeConfig" actionType="knowledge_query" />
    </div>
  )
}
