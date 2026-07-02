import type { Action, ActionType, ActionStatus } from '@/types/action'

export const mapBackendActionToFrontend = (a: any): Action => {
  if (!a) return {} as Action

  const type = a.type as ActionType
  const status = (a.active ? 'active' : 'inactive') as ActionStatus
  const requiresConfirmation = !!a.requires_confirmation

  const mapped: Action = {
    id: String(a.id || ''),
    name: a.name || '',
    description: a.description || '',
    type,
    status,
    requiresConfirmation,
    createdAt: a.created_at || new Date().toISOString(),
    updatedAt: a.updated_at || new Date().toISOString(),
  }

  const exec = a.execution_config || {}
  const params = a.parameters || {}
  const resp = a.response_config || {}

  if (type === 'api_request') {
    // Map headers: Dict[string, string] -> Array<{key, value}>
    const headers = exec.headers 
      ? Object.entries(exec.headers).map(([key, value]) => ({ key, value: String(value) }))
      : []

    // Map parameters: Dict[string, ActionParameter] -> Array<{key, value, required}>
    const parameters = Object.entries(params).map(([key, paramVal]: [string, any]) => ({
      key,
      value: paramVal.default ? String(paramVal.default) : '',
      required: !!paramVal.required,
    }))

    // Map response mapping: Dict[string, ResponseValue] -> Record[string, string]
    const mapping: Record<string, string> = {}
    if (resp.values) {
      Object.entries(resp.values).forEach(([k, valObj]: [string, any]) => {
        mapping[k] = valObj.path || ''
      })
    }

    mapped.apiConfig = {
      protocol: exec.protocol || 'https',
      url: exec.url || '',
      method: exec.method || 'GET',
      headers,
      parameters,
      timeout: exec.timeout || 5000,
      responseConfig: {
        path: resp.values ? (Object.values(resp.values)[0] as any)?.path || '' : '',
        mapping,
      },
    }
  } else if (type === 'rpc_request') {
    mapped.rpcConfig = {
      host: exec.host || '',
      service: exec.service || '',
      method: exec.method || '',
      protoFile: exec.proto_file || '',
      timeout: exec.timeout || 3000,
    }
  } else if (type === 'internal') {
    mapped.internalConfig = {
      handler: exec.handler || 'defaultHandler',
    }
  }

  return mapped
}

// Maps frontend CreateActionData to backend ActionCreate schema format
export const mapFrontendActionToBackend = (a: any): any => {
  const execution_config: any = {}
  let parameters: Record<string, any> = {}
  let response_config: any = null

  if (a.type === 'api_request' && a.apiConfig) {
    const api = a.apiConfig
    
    // Map headers array to dictionary
    const headersDict: Record<string, string> = {}
    if (api.headers) {
      api.headers.forEach((h: any) => {
        if (h.key) headersDict[h.key] = h.value || ''
      })
    }

    execution_config.protocol = api.protocol
    execution_config.url = api.url
    execution_config.method = api.method
    execution_config.headers = headersDict
    execution_config.timeout = api.timeout

    // Map parameters array to dictionary
    if (api.parameters) {
      api.parameters.forEach((p: any) => {
        if (p.key) {
          parameters[p.key] = {
            type: 'string',
            required: !!p.required,
            param_type: 'query', // default query param
            description: `Parameter ${p.key}`,
            default: p.value || null,
          }
        }
      })
    }

    // Map response config
    const valuesDict: Record<string, any> = {}
    if (api.responseConfig?.mapping) {
      Object.entries(api.responseConfig.mapping).forEach(([key, pathVal]) => {
        valuesDict[key] = {
          type: 'string',
          path: String(pathVal),
        }
      })
    }

    response_config = {
      mode: 'json',
      values: valuesDict,
      template: 'Action executed successfully.',
      on_error: 'Failed to execute action.',
    }
  } else if (a.type === 'rpc_request' && a.rpcConfig) {
    const rpc = a.rpcConfig
    execution_config.host = rpc.host
    execution_config.service = rpc.service
    execution_config.method = rpc.method
    execution_config.proto_file = rpc.protoFile
    execution_config.timeout = rpc.timeout
    execution_config.protocol = 'grpc'
  }

  return {
    name: a.name,
    description: a.description,
    type: a.type,
    active: a.status === 'active' || a.active !== false,
    requires_confirmation: !!a.requiresConfirmation,
    execution_config,
    parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
    response_config: response_config || undefined,
  }
}
