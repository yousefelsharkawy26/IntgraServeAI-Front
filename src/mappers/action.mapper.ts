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
    const headers = exec.headers 
      ? Object.entries(exec.headers).map(([key, value]) => ({ key, value: String(value) }))
      : []

    const parameters = Object.entries(params).map(([key, paramVal]: [string, any]) => ({
      key,
      value: paramVal.default ? String(paramVal.default) : '',
      required: !!paramVal.required,
    }))

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
      handler: exec.handler || exec.connector || '',
    }
  } else if (type === 'vector_query') {
    const embeddingConfig = exec.embedding_config || {}
    mapped.vectorConfig = {
      indexName: exec.collection_name || '',
      embeddingModel: embeddingConfig.model || '',
      topK: exec.max_results || 5,
      threshold: exec.threshold || 0.7,
      filter: exec.filter,
    }
  }

  return mapped
}
