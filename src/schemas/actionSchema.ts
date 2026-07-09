import { z } from 'zod'
import { ACTION_TYPE_CONFIGS, type ActionType } from '@/types/action'

// ── Shared sub-schemas ──────────────────────────────────────────────────────

const responseValueEntrySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['string', 'integer']),
  path: z.string().min(1, 'Path is required'),
})

const formResponseConfigSchema = z.object({
  mode: z.string(),
  values: z.array(responseValueEntrySchema),
  template: z.string(),
  onError: z.string(),
})

const actionParameterSchema = z.object({
  key: z.string(),
  value: z.string(),
  required: z.boolean(),
  paramType: z.string(),
  description: z.string(),
  enumValues: z.string().optional(),
})

// ── Per-type config BASE shapes (loose — no .min(1)) ────────────────────────

const apiConfigBaseSchema = z.object({
  protocol: z.enum(['http', 'https']),
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  headers: z.array(z.object({ key: z.string(), value: z.string() })),
  parameters: z.array(actionParameterSchema),
  timeout: z.number(),
  responseConfig: formResponseConfigSchema,
})

const rpcConfigBaseSchema = z.object({
  host: z.string(),
  service: z.string(),
  method: z.string(),
  protoFile: z.string(),
  timeout: z.number(),
  parameters: z.array(actionParameterSchema),
  responseConfig: formResponseConfigSchema,
})

const internalConfigBaseSchema = z.object({
  handler: z.string(),
})

const vectorConfigBaseSchema = z.object({
  connector: z.string(),
  connectionString: z.string(),
  collectionName: z.string(),
  maxResults: z.number(),
  embeddingModel: z.string(),
  filter: z.record(z.string(), z.string()).optional(),
  responseConfig: formResponseConfigSchema,
})

const sqlConfigBaseSchema = z.object({
  connector: z.string(),
  connectionString: z.string(),
  maxResults: z.number(),
  parameters: z.array(actionParameterSchema),
  responseConfig: formResponseConfigSchema,
})

const knowledgeConfigBaseSchema = z.object({
  connector: z.string(),
  connectionString: z.string(),
  collectionName: z.string(),
  maxResults: z.number(),
  parameters: z.array(actionParameterSchema),
  responseConfig: formResponseConfigSchema,
})

// ── Strict schemas (with .min(1) etc.) ──────────────────────────────────────

export const apiConfigSchema = apiConfigBaseSchema.extend({
  url: z.string().min(1, 'URL is required'),
})

export const rpcConfigSchema = rpcConfigBaseSchema.extend({
  host: z.string().min(1, 'Host is required'),
  service: z.string().min(1, 'Service is required'),
  method: z.string().min(1, 'Method is required'),
  protoFile: z.string().min(1, 'Proto file is required'),
  timeout: z.number().min(1000).max(60000),
})

export const internalConfigSchema = internalConfigBaseSchema.extend({
  handler: z.string().min(1, 'Handler is required'),
})

export const vectorConfigSchema = vectorConfigBaseSchema.extend({
  connector: z.string().min(1, 'Connector is required'),
  connectionString: z.string().min(1, 'Connection string is required'),
  collectionName: z.string().min(1, 'Collection name is required'),
  maxResults: z.number().min(1).max(1000),
  embeddingModel: z.string().min(1, 'Embedding model is required'),
})

export const sqlConfigSchema = sqlConfigBaseSchema.extend({
  connector: z.string().min(1, 'Connector is required'),
  connectionString: z.string().min(1, 'Connection string is required'),
  maxResults: z.number().min(1).max(1000),
})

export const knowledgeConfigSchema = knowledgeConfigBaseSchema.extend({
  connector: z.string().min(1, 'Connector is required'),
  connectionString: z.string().min(1, 'Connection string is required'),
  collectionName: z.string().min(1, 'Collection name is required'),
  maxResults: z.number().min(1).max(1000),
})

// ── Combined schema with superRefine ─────────────────────────────────────────

const configMap: Record<string, { schema: z.ZodTypeAny; field: string }> = {
  api_request: { schema: apiConfigSchema, field: 'apiConfig' },
  rpc_request: { schema: rpcConfigSchema, field: 'rpcConfig' },
  internal: { schema: internalConfigSchema, field: 'internalConfig' },
  vector_query: { schema: vectorConfigSchema, field: 'vectorConfig' },
  sql_query: { schema: sqlConfigSchema, field: 'sqlConfig' },
  knowledge_query: { schema: knowledgeConfigSchema, field: 'knowledgeConfig' },
}

export const actionSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .regex(
        /^[a-z][a-z0-9_]*$/,
        'Must be lowercase letters, digits, underscores (e.g., get_product_info)',
      ),
    description: z.string().min(1, 'Description is required'),
    type: z.enum([
      'api_request',
      'rpc_request',
      'internal',
      'vector_query',
      'sql_query',
      'knowledge_query',
    ] as const),
    requiresConfirmation: z.boolean(),
    apiConfig: apiConfigBaseSchema.optional(),
    rpcConfig: rpcConfigBaseSchema.optional(),
    internalConfig: internalConfigBaseSchema.optional(),
    vectorConfig: vectorConfigBaseSchema.optional(),
    sqlConfig: sqlConfigBaseSchema.optional(),
    knowledgeConfig: knowledgeConfigBaseSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const entry = configMap[data.type as string]
    if (!entry) return
    const configData = (data as any)[entry.field]
    if (!configData) return
    const result = entry.schema.safeParse(configData)
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: [entry.field, ...(issue.path ?? [])],
        })
      }
    }
  })

export type ActionFormData = z.infer<typeof actionSchema>

// ── Helper: default response config ──────────────────────────────────────────

const defaultResponseConfig: FormResponseConfig = {
  mode: 'json',
  values: [],
  template: '{{result}}',
  onError: 'Action execution failed',
}

// ── Defaults ─────────────────────────────────────────────────────────────────

export const defaultApiConfig = {
  protocol: 'https' as const,
  url: '',
  method: 'POST' as const,
  headers: [] as { key: string; value: string }[],
  parameters: [] as { key: string; value: string; required: boolean; paramType: string; description: string; enumValues?: string }[],
  timeout: 5000,
  responseConfig: { ...defaultResponseConfig },
}

export const defaultRpcConfig = {
  host: '',
  service: '',
  method: '',
  protoFile: '',
  timeout: 3000,
  parameters: [] as { key: string; value: string; required: boolean; paramType: string; description: string; enumValues?: string }[],
  responseConfig: { ...defaultResponseConfig },
}

export const defaultInternalConfig = { handler: '' }

export const defaultVectorConfig = {
  connector: '',
  connectionString: '',
  collectionName: '',
  maxResults: 5,
  embeddingModel: '',
  filter: undefined as Record<string, string> | undefined,
  responseConfig: { ...defaultResponseConfig, mode: 'json' },
}

export const defaultSqlConfig = {
  connector: '',
  connectionString: '',
  maxResults: 100,
  parameters: [] as { key: string; value: string; required: boolean; paramType: string; description: string; enumValues?: string }[],
  responseConfig: { ...defaultResponseConfig, mode: 'raw' },
}

export const defaultKnowledgeConfig = {
  connector: '',
  connectionString: '',
  collectionName: '',
  maxResults: 10,
  parameters: [] as { key: string; value: string; required: boolean; paramType: string; description: string; enumValues?: string }[],
  responseConfig: { ...defaultResponseConfig, mode: 'raw' },
}

export const defaultFormValues: ActionFormData = {
  name: '',
  description: '',
  type: 'api_request',
  requiresConfirmation: false,
  apiConfig: defaultApiConfig,
  rpcConfig: defaultRpcConfig,
  internalConfig: defaultInternalConfig,
  vectorConfig: defaultVectorConfig,
  sqlConfig: defaultSqlConfig,
  knowledgeConfig: defaultKnowledgeConfig,
}

// Re-export for convenience
export type { FormResponseConfig } from '@/types/action'
