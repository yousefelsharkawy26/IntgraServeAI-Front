import type { Action, ActionType, ActionStatus, FormResponseConfig, ResponseValueEntry } from '@/types/action'
import { parametersFromDict, headersFromDict } from '@/lib/actionTransforms'

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseMaybeObject(value: unknown): Record<string, any> {
  if (isRecord(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return isRecord(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

function firstRecord(...values: unknown[]): Record<string, any> {
  for (const value of values) {
    const parsed = parseMaybeObject(value)
    if (Object.keys(parsed).length > 0) return parsed
  }
  return {}
}

function firstValue<T = unknown>(source: Record<string, any>, keys: string[], fallback?: T): T {
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') return value as T
  }
  return fallback as T
}

function toNumber(value: unknown, fallback: number): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function normalizeResponseValues(values: unknown): ResponseValueEntry[] {
  if (!values) return []

  if (Array.isArray(values)) {
    return values
      .filter(isRecord)
      .map((entry) => {
        const valueType = String(firstValue(entry, ['type'], 'string'))
        return {
          name: String(firstValue(entry, ['name', 'key'], '')),
          type: valueType === 'integer' ? 'integer' : 'string',
          path: String(firstValue(entry, ['path', 'json_path', 'jsonPath'], '')),
        }
      })
  }

  const valueObject = parseMaybeObject(values)
  return Object.entries(valueObject).map(([name, value]) => {
    const entry = parseMaybeObject(value)
    const valueType = String(firstValue(entry, ['type'], 'string'))
    return {
      name,
      type: valueType === 'integer' ? 'integer' : 'string',
      path: String(firstValue(entry, ['path', 'json_path', 'jsonPath'], '')),
    }
  })
}

function normalizeResponseConfig(rawResponse: unknown): FormResponseConfig {
  const resp = parseMaybeObject(rawResponse)
  return {
    mode: String(firstValue(resp, ['mode'], 'json')),
    values: normalizeResponseValues(firstValue(resp, ['values', 'value_mappings', 'valueMappings'], undefined)),
    template: String(firstValue(resp, ['template'], '{{result}}')),
    onError: String(firstValue(resp, ['on_error', 'onError', 'error_message', 'errorMessage'], 'Action execution failed')),
  }
}

function getActionType(rawType: unknown): ActionType {
  const type = String(rawType || 'api_request') as ActionType
  return type
}

export const mapBackendActionToFrontend = (a: any): Action => {
  if (!a) return {} as Action

  const type = getActionType(a.type)
  const statusValue = a.status || a.state
  const active = typeof a.active === 'boolean' ? a.active : statusValue === 'active'
  const status = (active ? 'active' : 'inactive') as ActionStatus
  const requiresConfirmation = !!(a.requires_confirmation ?? a.requiresConfirmation)

  const exec = firstRecord(
    a.execution_config,
    a.executionConfig,
    a.config,
    a.api_config,
    a.rpc_config,
    a.vector_config,
    a.sql_config,
    a.knowledge_config,
  )
  const params = firstValue(a, ['parameters', 'params'], firstValue(exec, ['parameters', 'params'], {}))
  const resp = firstValue(a, ['response_config', 'responseConfig'], firstValue(exec, ['response_config', 'responseConfig'], {}))
  const responseConfig = normalizeResponseConfig(resp)

  const mapped: Action = {
    id: String(a.id || ''),
    name: a.name || '',
    description: a.description || '',
    type,
    status,
    requiresConfirmation,
    createdAt: a.created_at || a.createdAt || new Date().toISOString(),
    updatedAt: a.updated_at || a.updatedAt || new Date().toISOString(),
  }

  if (type === 'api_request') {
    const url = String(firstValue(exec, ['url', 'endpoint', 'uri'], firstValue(a, ['url', 'endpoint', 'uri'], '')))
    const derivedProtocol = url.startsWith('http://') ? 'http' : 'https'
    mapped.apiConfig = {
      protocol: firstValue(exec, ['protocol'], derivedProtocol) === 'http' ? 'http' : 'https',
      url,
      method: String(firstValue(exec, ['method'], 'GET')).toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      headers: headersFromDict(firstValue(exec, ['headers'], firstValue(a, ['headers'], {}))),
      parameters: parametersFromDict(params),
      timeout: toNumber(firstValue(exec, ['timeout', 'timeout_ms', 'timeoutMs'], 5000), 5000),
      responseConfig,
    }
  } else if (type === 'rpc_request') {
    mapped.rpcConfig = {
      host: String(firstValue(exec, ['host'], '')),
      service: String(firstValue(exec, ['service'], '')),
      method: String(firstValue(exec, ['method'], '')),
      protoFile: String(firstValue(exec, ['proto_file', 'protoFile'], '')),
      timeout: toNumber(firstValue(exec, ['timeout', 'timeout_ms', 'timeoutMs'], 3000), 3000),
      parameters: parametersFromDict(params),
      responseConfig,
    }
  } else if (type === 'internal') {
    mapped.internalConfig = {
      handler: String(firstValue(exec, ['handler', 'connector'], '')),
    }
  } else if (type === 'vector_query') {
    const embeddingConfig = parseMaybeObject(firstValue(exec, ['embedding_config', 'embeddingConfig'], {}))
    mapped.vectorConfig = {
      connector: String(firstValue(exec, ['connector'], '')),
      connectionString: String(firstValue(exec, ['connection_string', 'connectionString'], '')),
      collectionName: String(firstValue(exec, ['collection_name', 'collectionName'], '')),
      maxResults: toNumber(firstValue(exec, ['max_results', 'maxResults'], 5), 5),
      embeddingModel: String(firstValue(embeddingConfig, ['model'], firstValue(exec, ['embedding_model', 'embeddingModel'], ''))),
      filter: firstValue(exec, ['filter'], undefined),
      responseConfig,
    }
  } else if (type === 'sql_query') {
    mapped.sqlConfig = {
      connector: String(firstValue(exec, ['connector'], '')),
      connectionString: String(firstValue(exec, ['connection_string', 'connectionString'], '')),
      maxResults: toNumber(firstValue(exec, ['max_results', 'maxResults'], 100), 100),
      parameters: parametersFromDict(params),
      responseConfig,
    }
  } else if (type === 'knowledge_query') {
    mapped.knowledgeConfig = {
      connector: String(firstValue(exec, ['connector'], '')),
      connectionString: String(firstValue(exec, ['connection_string', 'connectionString'], '')),
      collectionName: String(firstValue(exec, ['collection_name', 'collectionName'], '')),
      maxResults: toNumber(firstValue(exec, ['max_results', 'maxResults'], 10), 10),
      parameters: parametersFromDict(params),
      responseConfig,
    }
  }

  return mapped
}
