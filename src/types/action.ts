export type ActionType = 'api_request' | 'rpc_request' | 'internal' | 'vector_query' | 'sql_query' | 'knowledge_query'

export type ActionStatus = 'active' | 'inactive'

// ── Action-type metadata (mirrors backend ACTION_TYPE_CONFIG) ──────────────

export interface ActionTypeConfig {
  label: string
  description: string
  requiredExecFields: string[]
  optionalExecFields: string[]
  allowedParamTypes: string[]
  allowedResponseModes: string[]
  readOnly?: boolean
}

export const ACTION_TYPE_CONFIGS: Record<ActionType, ActionTypeConfig> = {
  api_request: {
    label: 'API Request',
    description: 'HTTP/HTTPS API calls',
    requiredExecFields: ['protocol', 'url'],
    optionalExecFields: ['method', 'headers', 'timeout'],
    allowedParamTypes: ['query', 'body', 'path'],
    allowedResponseModes: ['json', 'xml', 'html'],
  },
  rpc_request: {
    label: 'RPC Request',
    description: 'gRPC remote procedure calls',
    requiredExecFields: ['protocol', 'host', 'service', 'method', 'proto_file'],
    optionalExecFields: ['headers', 'timeout'],
    allowedParamTypes: ['message_field'],
    allowedResponseModes: ['json'],
  },
  vector_query: {
    label: 'Vector Query',
    description: 'Vector database queries with embeddings',
    requiredExecFields: ['connector', 'connection_string', 'collection_name'],
    optionalExecFields: ['max_results', 'auth', 'embedding_config'],
    allowedParamTypes: ['vector'],
    allowedResponseModes: ['json', 'raw'],
  },
  sql_query: {
    label: 'SQL Query',
    description: 'SQL database queries',
    requiredExecFields: ['connector', 'connection_string'],
    optionalExecFields: ['max_results', 'auth'],
    allowedParamTypes: ['query'],
    allowedResponseModes: ['raw', 'sql'],
  },
  knowledge_query: {
    label: 'Knowledge Query',
    description: 'Knowledge base queries',
    requiredExecFields: ['connector', 'connection_string'],
    optionalExecFields: ['max_results', 'auth', 'collection_name'],
    allowedParamTypes: ['query'],
    allowedResponseModes: ['raw'],
  },
  internal: {
    label: 'Internal',
    description: 'Internal system actions (read-only)',
    requiredExecFields: [],
    optionalExecFields: [],
    allowedParamTypes: ['internal'],
    allowedResponseModes: ['json'],
    readOnly: true,
  },
}

/** Types the user can select in the Create Action form (excludes internal). */
export const CREATABLE_ACTION_TYPES: ActionType[] = [
  'api_request',
  'rpc_request',
  'vector_query',
  'sql_query',
  'knowledge_query',
]

// ── Form-friendly types (camelCase, used in form state) ──────────────────────

export interface ActionHeaders {
  key: string
  value: string
}

export interface ActionParameter {
  key: string
  value: string
  required: boolean
  paramType: string
  description: string
  enumValues?: string  // comma-separated string in form, converted to array for API
}

export interface ResponseValueEntry {
  name: string
  type: 'string' | 'integer'
  path: string
}

export interface FormResponseConfig {
  mode: string
  values: ResponseValueEntry[]
  template: string
  onError: string
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
  parameters: ActionParameter[]
  responseConfig: FormResponseConfig
}

export interface VectorQueryConfig {
  connector: string
  connectionString: string
  collectionName: string
  maxResults: number
  embeddingModel: string
  filter?: Record<string, string>
  responseConfig: FormResponseConfig
}

export interface SQLQueryConfig {
  connector: string
  connectionString: string
  maxResults: number
  parameters: ActionParameter[]
  responseConfig: FormResponseConfig
}

export interface KnowledgeQueryConfig {
  connector: string
  connectionString: string
  collectionName: string
  maxResults: number
  parameters: ActionParameter[]
  responseConfig: FormResponseConfig
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
  sqlConfig?: SQLQueryConfig
  knowledgeConfig?: KnowledgeQueryConfig
  createdAt: string
  updatedAt: string
}

export interface ActionFilters {
  status?: ActionStatus | 'all'
  type?: ActionType | 'all'
  search?: string
}

// ── Backend-aligned types (snake_case, the API contract) ─────────────────────

export interface ExecutionConfig {
  protocol?: 'http' | 'https' | 'grpc'
  method?: string
  url?: string
  headers?: Record<string, string>
  timeout?: number
  host?: string
  service?: string
  proto_file?: string
  connector?: string
  connection_string?: string
  collection_name?: string
  max_results?: number
  auth?: Record<string, string>
  embedding_config?: Record<string, unknown>
}

export interface ParameterDetail {
  type: string
  required: boolean
  param_type: string
  description: string
  default?: string
  enum?: (string | number)[]
}

export interface BackendResponseConfig {
  mode: 'json' | 'xml' | 'html' | 'raw' | 'sql'
  values?: Record<string, { type: string; path: string }>
  template: string
  on_error: string
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

/** Payload accepted by the backend update schema. The action type is immutable. */
export type UpdateActionData = Omit<CreateActionData, 'type'>
