export type ActionType = 'api_request' | 'rpc_request' | 'internal' | "vector_query"
export type ActionStatus = 'active' | 'inactive'

export interface ActionHeaders {
  key: string
  value: string
}

export interface ActionParameter {
  key: string
  value: string
  required: boolean
}

export interface ResponseConfig {
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
  responseConfig: ResponseConfig
}

export interface RPCRequestConfig {
  host: string
  service: string
  method: string
  protoFile: string
  timeout: number
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
  internalConfig?: {
    handler: string
  }
  createdAt: string
  updatedAt: string
}

export interface ActionFilters {
  status?: ActionStatus | 'all'
  type?: ActionType | 'all'
  search?: string
}

export interface CreateActionData {
  name: string
  description: string
  type: ActionType
  requiresConfirmation: boolean
  apiConfig?: APIRequestConfig
  rpcConfig?: RPCRequestConfig
  internalConfig?: { handler: string }
}
