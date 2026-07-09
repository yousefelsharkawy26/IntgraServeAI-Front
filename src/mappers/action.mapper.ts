import type { Action, ActionType, ActionStatus } from '@/types/action'
import { parametersFromDict, headersFromDict } from '@/lib/actionTransforms'

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

  // Parse response config (common to most types)
  const responseConfig = {
    mode: resp.mode || 'json',
    values: resp.values
      ? Object.entries(resp.values).map(([name, v]: [string, any]) => ({
          name,
          type: (v.type === 'integer' ? 'integer' : 'string') as 'string' | 'integer',
          path: v.path || '',
        }))
      : [],
    template: resp.template || '',
    onError: resp.on_error || '',
  }

  if (type === 'api_request') {
    mapped.apiConfig = {
      protocol: exec.protocol || 'https',
      url: exec.url || '',
      method: exec.method || 'GET',
      headers: headersFromDict(exec.headers),
      parameters: parametersFromDict(params),
      timeout: exec.timeout || 5000,
      responseConfig,
    }
  } else if (type === 'rpc_request') {
    mapped.rpcConfig = {
      host: exec.host || '',
      service: exec.service || '',
      method: exec.method || '',
      protoFile: exec.proto_file || '',
      timeout: exec.timeout || 3000,
      parameters: parametersFromDict(params),
      responseConfig,
    }
  } else if (type === 'internal') {
    mapped.internalConfig = {
      handler: exec.handler || exec.connector || '',
    }
  } else if (type === 'vector_query') {
    const embeddingConfig = exec.embedding_config || {}
    mapped.vectorConfig = {
      connector: exec.connector || '',
      connectionString: exec.connection_string || '',
      collectionName: exec.collection_name || '',
      maxResults: exec.max_results || 5,
      embeddingModel: embeddingConfig.model || '',
      filter: exec.filter,
      responseConfig,
    }
  } else if (type === 'sql_query') {
    mapped.sqlConfig = {
      connector: exec.connector || '',
      connectionString: exec.connection_string || '',
      maxResults: exec.max_results || 100,
      parameters: parametersFromDict(params),
      responseConfig,
    }
  } else if (type === 'knowledge_query') {
    mapped.knowledgeConfig = {
      connector: exec.connector || '',
      connectionString: exec.connection_string || '',
      collectionName: exec.collection_name || '',
      maxResults: exec.max_results || 10,
      parameters: parametersFromDict(params),
      responseConfig,
    }
  }

  return mapped
}
