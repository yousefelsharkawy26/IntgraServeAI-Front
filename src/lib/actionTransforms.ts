import type {
  Action,
  ActionHeaders,
  ActionParameter,
  BackendResponseConfig,
  CreateActionData,
  ExecutionConfig,
  ParameterDetail,
  ResponseValueEntry,
  FormResponseConfig,
} from '@/types/action'
import {
  defaultApiConfig,
  defaultInternalConfig,
  defaultRpcConfig,
  defaultVectorConfig,
  defaultSqlConfig,
  defaultKnowledgeConfig,
  type ActionFormData,
} from '@/schemas/actionSchema'

// ── Helpers: array ↔ dict (for headers / parameters) ─────────────────────────

export function headersToDict(arr: ActionHeaders[] = []): Record<string, string> {
  const dict: Record<string, string> = {}
  for (const { key, value } of arr) {
    if (key.trim()) dict[key] = value
  }
  return dict
}

export function headersFromDict(dict?: Record<string, string> | ActionHeaders[] | null): ActionHeaders[] {
  if (!dict) return []
  if (Array.isArray(dict)) {
    return dict.map((header) => ({ key: header.key || '', value: header.value || '' }))
  }
  return Object.entries(dict).map(([key, value]) => ({ key, value: String(value ?? '') }))
}

export function parametersToDict(
  arr: ActionParameter[] = [],
): Record<string, ParameterDetail> {
  const dict: Record<string, ParameterDetail> = {}
  for (const { key, value, required, paramType, description, enumValues } of arr) {
    if (key.trim()) {
      const param: ParameterDetail = {
        type: 'string',
        required,
        param_type: paramType || 'query',
        description: description || `Parameter ${key}`,
      }
      if (value) param.default = value
      if (enumValues?.trim()) {
        param.enum = enumValues.split(',').map((v) => v.trim()).filter(Boolean)
      }
      dict[key] = param
    }
  }
  return dict
}

export function parametersFromDict(
  dict?: Record<string, ParameterDetail> | ActionParameter[] | null,
): ActionParameter[] {
  if (!dict) return []
  if (Array.isArray(dict)) {
    return dict.map((parameter) => ({
      key: parameter.key || '',
      value: parameter.value ?? '',
      required: !!parameter.required,
      paramType: parameter.paramType || 'query',
      description: parameter.description || '',
      enumValues: parameter.enumValues || '',
    }))
  }
  return Object.entries(dict).map(([key, detail]) => ({
    key,
    value: detail.default ?? '',
    required: !!detail.required,
    paramType: detail.param_type || 'query',
    description: detail.description || '',
    enumValues: detail.enum ? detail.enum.join(', ') : '',
  }))
}

// ── Helpers: response config ↔ form ──────────────────────────────────────────

function responseValuesToBackend(
  entries: ResponseValueEntry[],
): Record<string, { type: string; path: string }> | undefined {
  if (!entries.length) return undefined
  const dict: Record<string, { type: string; path: string }> = {}
  for (const e of entries) {
    if (e.name.trim() && e.path.trim()) {
      dict[e.name] = { type: e.type, path: e.path }
    }
  }
  return Object.keys(dict).length > 0 ? dict : undefined
}

function buildResponseConfig(rc: FormResponseConfig | undefined): BackendResponseConfig | undefined {
  if (!rc) return undefined
  const values = responseValuesToBackend(rc.values)
  return {
    mode: (rc.mode || 'json') as BackendResponseConfig['mode'],
    ...(values ? { values } : {}),
    template: rc.template || '{{result}}',
    on_error: rc.onError || 'Action execution failed',
  }
}

function defaultResponseConfig(type: string): FormResponseConfig {
  const cfg = {
    mode: 'json',
    values: [] as ResponseValueEntry[],
    template: '{{result}}',
    onError: 'Action execution failed',
  }
  if (type === 'sql_query') cfg.mode = 'raw'
  if (type === 'knowledge_query') cfg.mode = 'raw'
  return cfg
}

// ── Form → API payload ───────────────────────────────────────────────────────

export function buildCreatePayload(formData: ActionFormData): CreateActionData {
  const execution_config: ExecutionConfig = {}
  let parameters: Record<string, ParameterDetail> | undefined
  let response_config: BackendResponseConfig | undefined

  switch (formData.type) {
    case 'api_request': {
      const c = formData.apiConfig
      if (c) {
        execution_config.protocol = c.protocol
        execution_config.method = c.method
        execution_config.url = c.url
        const headers = headersToDict(c.headers)
        execution_config.headers =
          Object.keys(headers).length > 0 ? headers : undefined
        execution_config.timeout = c.timeout
        const params = parametersToDict(c.parameters)
        parameters = Object.keys(params).length > 0 ? params : undefined
        response_config = buildResponseConfig(c.responseConfig)
      }
      break
    }

    case 'rpc_request': {
      const c = formData.rpcConfig
      if (c) {
        execution_config.protocol = 'grpc'
        execution_config.host = c.host
        execution_config.service = c.service
        execution_config.proto_file = c.protoFile
        execution_config.method = c.method
        execution_config.timeout = c.timeout
        const params = parametersToDict(c.parameters)
        parameters = Object.keys(params).length > 0 ? params : undefined
        response_config = buildResponseConfig(c.responseConfig)
      }
      break
    }

    case 'internal': {
      const c = formData.internalConfig
      if (c) {
        execution_config.connector = c.handler
      }
      break
    }

    case 'vector_query': {
      const c = formData.vectorConfig
      if (c) {
        execution_config.connector = c.connector
        execution_config.connection_string = c.connectionString
        execution_config.collection_name = c.collectionName
        execution_config.max_results = c.maxResults
        if (c.embeddingModel) {
          execution_config.embedding_config = { model: c.embeddingModel }
        }
      }
      const rc = c?.responseConfig
      if (rc) response_config = buildResponseConfig(rc)
      break
    }

    case 'sql_query': {
      const c = formData.sqlConfig
      if (c) {
        execution_config.connector = c.connector
        execution_config.connection_string = c.connectionString
        execution_config.max_results = c.maxResults
        const params = parametersToDict(c.parameters)
        parameters = Object.keys(params).length > 0 ? params : undefined
        response_config = buildResponseConfig(c.responseConfig)
      }
      break
    }

    case 'knowledge_query': {
      const c = formData.knowledgeConfig
      if (c) {
        execution_config.connector = c.connector
        execution_config.connection_string = c.connectionString
        execution_config.collection_name = c.collectionName
        execution_config.max_results = c.maxResults
        const params = parametersToDict(c.parameters)
        parameters = Object.keys(params).length > 0 ? params : undefined
        response_config = buildResponseConfig(c.responseConfig)
      }
      break
    }
  }

  return {
    name: formData.name,
    description: formData.description,
    type: formData.type,
    active: true,
    requires_confirmation: formData.requiresConfirmation,
    execution_config,
    parameters,
    response_config,
  }
}

// ── Action → Form (for editing existing actions) ────────────────────────────

export function actionToFormData(action: Action): ActionFormData {
  const base = {
    name: action.name,
    description: action.description,
    type: action.type,
    requiresConfirmation: action.requiresConfirmation,
  }

  switch (action.type) {
    case 'api_request': {
      const c = action.apiConfig
      return {
        ...base,
        apiConfig: {
          protocol: c?.protocol ?? 'https',
          url: c?.url ?? '',
          method: c?.method ?? 'POST',
          headers: c?.headers ?? [],
          parameters: c?.parameters ?? [],
          timeout: c?.timeout ?? 5000,
          responseConfig: c?.responseConfig ?? defaultResponseConfig('api_request'),
        },
        rpcConfig: defaultRpcConfig,
        internalConfig: defaultInternalConfig,
        vectorConfig: defaultVectorConfig,
        sqlConfig: defaultSqlConfig,
        knowledgeConfig: defaultKnowledgeConfig,
      }
    }

    case 'rpc_request': {
      const c = action.rpcConfig
      return {
        ...base,
        apiConfig: defaultApiConfig,
        rpcConfig: {
          host: c?.host ?? '',
          service: c?.service ?? '',
          method: c?.method ?? '',
          protoFile: c?.protoFile ?? '',
          timeout: c?.timeout ?? 3000,
          parameters: c?.parameters ?? [],
          responseConfig: c?.responseConfig ?? defaultResponseConfig('rpc_request'),
        },
        internalConfig: defaultInternalConfig,
        vectorConfig: defaultVectorConfig,
        sqlConfig: defaultSqlConfig,
        knowledgeConfig: defaultKnowledgeConfig,
      }
    }

    case 'internal': {
      const c = action.internalConfig
      return {
        ...base,
        apiConfig: defaultApiConfig,
        rpcConfig: defaultRpcConfig,
        internalConfig: { handler: c?.handler ?? '' },
        vectorConfig: defaultVectorConfig,
        sqlConfig: defaultSqlConfig,
        knowledgeConfig: defaultKnowledgeConfig,
      }
    }

    case 'vector_query': {
      const c = action.vectorConfig
      return {
        ...base,
        apiConfig: defaultApiConfig,
        rpcConfig: defaultRpcConfig,
        internalConfig: defaultInternalConfig,
        vectorConfig: {
          connector: c?.connector ?? '',
          connectionString: c?.connectionString ?? '',
          collectionName: c?.collectionName ?? '',
          maxResults: c?.maxResults ?? 5,
          embeddingModel: c?.embeddingModel ?? '',
          filter: c?.filter,
          responseConfig: c?.responseConfig ?? defaultResponseConfig('vector_query'),
        },
        sqlConfig: defaultSqlConfig,
        knowledgeConfig: defaultKnowledgeConfig,
      }
    }

    case 'sql_query': {
      const c = action.sqlConfig
      return {
        ...base,
        apiConfig: defaultApiConfig,
        rpcConfig: defaultRpcConfig,
        internalConfig: defaultInternalConfig,
        vectorConfig: defaultVectorConfig,
        sqlConfig: {
          connector: c?.connector ?? '',
          connectionString: c?.connectionString ?? '',
          maxResults: c?.maxResults ?? 100,
          parameters: c?.parameters ?? [],
          responseConfig: c?.responseConfig ?? defaultResponseConfig('sql_query'),
        },
        knowledgeConfig: defaultKnowledgeConfig,
      }
    }

    case 'knowledge_query': {
      const c = action.knowledgeConfig
      return {
        ...base,
        apiConfig: defaultApiConfig,
        rpcConfig: defaultRpcConfig,
        internalConfig: defaultInternalConfig,
        vectorConfig: defaultVectorConfig,
        sqlConfig: defaultSqlConfig,
        knowledgeConfig: {
          connector: c?.connector ?? '',
          connectionString: c?.connectionString ?? '',
          collectionName: c?.collectionName ?? '',
          maxResults: c?.maxResults ?? 10,
          parameters: c?.parameters ?? [],
          responseConfig: c?.responseConfig ?? defaultResponseConfig('knowledge_query'),
        },
      }
    }
  }
}
