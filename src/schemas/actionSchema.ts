import { z } from 'zod'

// ── Per-type config BASE shapes (no required-field constraints) ──────────────
// These describe the SHAPE only — no `.min(1)` etc. They're used in the main
// actionSchema below so the form can hold defaults for ALL four configs
// simultaneously (so users can switch types without losing their work) without
// triggering validation errors on the inactive ones.

const apiConfigBaseSchema = z.object({
  protocol: z.enum(['http', 'https']),
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  headers: z.array(z.object({ key: z.string(), value: z.string() })),
  parameters: z.array(z.object({
    key: z.string(),
    value: z.string(),
    required: z.boolean(),
    paramType: z.enum(['query', 'body', 'path']),
    description: z.string(),
  })),
  timeout: z.number(),
  responseConfig: z.object({
    path: z.string().optional(),
    mapping: z.record(z.string(), z.any()).optional(),
    template: z.string().optional(),
    onError: z.string().optional(),
  }),
})

const rpcConfigBaseSchema = z.object({
  host: z.string(),
  service: z.string(),
  method: z.string(),
  protoFile: z.string(),
  timeout: z.number(),
})

const internalConfigBaseSchema = z.object({
  handler: z.string(),
})

const vectorConfigBaseSchema = z.object({
  indexName: z.string(),
  embeddingModel: z.string(),
  topK: z.number(),
  threshold: z.number(),
  connector: z.string(),
  connectionString: z.string(),
  filter: z.record(z.string(), z.string()).optional(),
})

// ── Strict schemas (exported, used in superRefine) ───────────────────────────
// These are the "real" schemas with `.min(1)` etc. applied via `.extend()`.

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
  indexName: z.string().min(1, 'Index name is required'),
  embeddingModel: z.string().min(1, 'Embedding model is required'),
  topK: z.number().min(1).max(1000),
  threshold: z.number().min(0).max(1),
  connector: z.string().min(1, 'Connector is required'),
  connectionString: z.string().min(1, 'Connection string is required'),
})

// ── Combined schema ──────────────────────────────────────────────────────────
// Base object uses the LOOSE shapes (.optional) — so unused configs don't
// trigger validation errors on empty defaults. superRefine then enforces the
// STRICT schema on ONLY the config matching the selected `type`.

export const actionSchema = z
  .object({
    name: z.string().min(1, 'Name is required').regex(
      /^[a-z][a-z0-9_]*$/,
      'Name must be lowercase letters, digits, and underscores only (e.g., get_product_info)',
    ),
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['api_request', 'rpc_request', 'internal', 'vector_query']),
    requiresConfirmation: z.boolean(),
    apiConfig: apiConfigBaseSchema.optional(),
    rpcConfig: rpcConfigBaseSchema.optional(),
    internalConfig: internalConfigBaseSchema.optional(),
    vectorConfig: vectorConfigBaseSchema.optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.type) {
      case 'api_request': {
        const result = apiConfigSchema.safeParse(data.apiConfig)
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({
              ...issue,
              path: ['apiConfig', ...(issue.path ?? [])],
            })
          }
        }
        break
      }
      case 'rpc_request': {
        const result = rpcConfigSchema.safeParse(data.rpcConfig)
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({
              ...issue,
              path: ['rpcConfig', ...(issue.path ?? [])],
            })
          }
        }
        break
      }
      case 'internal': {
        const result = internalConfigSchema.safeParse(data.internalConfig)
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({
              ...issue,
              path: ['internalConfig', ...(issue.path ?? [])],
            })
          }
        }
        break
      }
      case 'vector_query': {
        const result = vectorConfigSchema.safeParse(data.vectorConfig)
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({
              ...issue,
              path: ['vectorConfig', ...(issue.path ?? [])],
            })
          }
        }
        break
      }
    }
  })

export type ActionFormData = z.infer<typeof actionSchema>

// ── Defaults ─────────────────────────────────────────────────────────────────

export const defaultApiConfig = {
  protocol: 'https' as const,
  url: '',
  method: 'POST' as const,
  headers: [] as { key: string; value: string }[],
  parameters: [] as { key: string; value: string; required: boolean; paramType: 'query' | 'body' | 'path'; description: string }[],
  timeout: 5000,
  responseConfig: {},
}

export const defaultRpcConfig = {
  host: '',
  service: '',
  method: '',
  protoFile: '',
  timeout: 3000,
}

export const defaultInternalConfig = { handler: '' }

export const defaultVectorConfig = {
  indexName: '',
  embeddingModel: '',
  topK: 5,
  threshold: 0.7,
  connector: '',
  connectionString: '',
  filter: undefined as Record<string, string> | undefined,
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
}