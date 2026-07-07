export type ActionType = 'api_request' | 'rpc_request' | 'internal' | 'vector_query'

export type ActionStatus = 'active' | 'inactive'

// ── Form-friendly types (camelCase, used in form state) ──────────────────────

export interface ActionHeaders {
  key: string
  value: string
}

export interface ActionParameter {
  key: string
  value: string
  required: boolean
}

export interface FormResponseConfig {
  path?: string
  mapping?: Record<string, string>
}

export interface APIRequestConfig {
  protocol: 'http' | 'https'
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers: ActionHeaders[]
  parameters: ActionParameter[]
  timeout: number
  responseConfig: FormResponseConfig
}

export interface RPCRequestConfig {
  host: string
  service: string
  method: string
  protoFile: string
  timeout: number
}

export interface VectorQueryConfig {
  indexName: string
  embeddingModel: string
  topK: number
  threshold: number
  filter?: Record<string, string>
}

export interface Action {
  id: string
  name: string
  description: string
  type: ActionType
  status: ActionStatus
  requiresConfirmation: boolean
  apiConfig?: APIRequestConfig
  rpcConfig?: RPCRequestConfig
  internalConfig?: { handler: string }
  vectorConfig?: VectorQueryConfig
  createdAt: string
  updatedAt: string
}

export interface ActionFilters {
  status?: ActionStatus | 'all'
  type?: ActionType | 'all'
  search?: string
}

// ── Backend-aligned types (snake_case, the API contract) ─────────────────────

/**
 * Backend's `execution_config` — a single flat object whose populated fields
 * depend on `type`. See backend OpenAPI schema for which fields apply to which
 * type. We only populate the relevant subset per submit.
 */
export interface ExecutionConfig {
  // api_request
  protocol?: 'http' | 'https'
  method?: string
  url?: string
  headers?: Record<string, string>
  timeout?: number
  // rpc_request
  host?: string
  service?: string
  proto_file?: string
  // internal
  connector?: string
  connection_string?: string
  // vector_query
  collection_name?: string
  max_results?: number
  embedding_config?: Record<string, unknown>
  // common
  auth?: Record<string, string>
}

export interface ParameterDetail {
  type: string
  required: boolean
  param_type: string
  description?: string
  default?: string
  enum?: (string | number)[]
}

export interface BackendResponseConfig {
  mode?: 'json' | 'raw' | 'template'
  values?: Record<string, { type: string; path: string }>
  template?: string
  on_error?: string
}

/** Payload sent to POST /actions and PUT /actions/:id */
export interface CreateActionData {
  name: string
  description: string
  type: ActionType
  active: boolean
  requires_confirmation: boolean
  execution_config: ExecutionConfig
  parameters?: Record<string, ParameterDetail>
  response_config?: BackendResponseConfig
}