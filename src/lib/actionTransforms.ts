import type {
  Action,
  ActionHeaders,
  ActionParameter,
  BackendResponseConfig,
  CreateActionData,
  ExecutionConfig,
  ParameterDetail,
} from '@/types/action'
import {
  defaultApiConfig,
  defaultFormValues,
  defaultInternalConfig,
  defaultRpcConfig,
  defaultVectorConfig,
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

export function headersFromDict(dict?: Record<string, string>): ActionHeaders[] {
  if (!dict) return []
  return Object.entries(dict).map(([key, value]) => ({ key, value }))
}

export function parametersToDict(
  arr: ActionParameter[] = [],
): Record<string, ParameterDetail> {
  const dict: Record<string, ParameterDetail> = {}
  for (const { key, value, required, paramType, description } of arr) {
    if (key.trim()) {
      dict[key] = {
        type: 'string',
        required,
        param_type: paramType || 'query',
        description: description || `Parameter ${key}`,
        default: value,
      }
    }
  }
  return dict
}

export function parametersFromDict(
  dict?: Record<string, ParameterDetail>,
): ActionParameter[] {
  if (!dict) return []
  return Object.entries(dict).map(([key, detail]) => ({
    key,
    value: detail.default ?? '',
    required: detail.required,
    paramType: detail.param_type || 'query',
    description: detail.description || '',
  }))
}

// ── Form → API payload ───────────────────────────────────────────────────────

/**
 * Convert the form's camelCase shape into the backend's snake_case payload.
 * Only the fields relevant to the selected `type` get populated — others
 * are left undefined so the backend ignores them.
 */
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
        parameters =
          Object.keys(params).length > 0 ? params : undefined

        if (c.responseConfig?.path) {
          response_config = {
            mode: 'json',
            values: {
              default: { type: 'string', path: c.responseConfig.path },
            },
            template: c.responseConfig.template || '{{result}}',
            on_error: c.responseConfig.onError || 'Action execution failed',
          }
        }
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
      }
      break
    }

    case 'internal': {
      const c = formData.internalConfig
      if (c) {
        // TODO: confirm with backend what "internal" should map to. For now
        // sending as `connector` since that's the closest semantic match.
        execution_config.connector = c.handler
      }
      break
    }

    case 'vector_query': {
      const c = formData.vectorConfig
      if (c) {
        execution_config.connector = c.connector
        execution_config.connection_string = c.connectionString
        execution_config.collection_name = c.indexName
        execution_config.max_results = c.topK
        execution_config.embedding_config = { model: c.embeddingModel }
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

/**
 * Convert an `Action` (frontend shape) into form values. Unused configs get
 * their defaults so the form stays internally consistent across type switches.
 *
 * NOTE: This expects the frontend `Action` shape. Your `actionService` is
 * responsible for converting the backend response (with `execution_config`,
 * snake_case, etc.) into the frontend `Action` shape before calling this.
 */
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
          responseConfig: c?.responseConfig ?? {},
        },
        rpcConfig: defaultRpcConfig,
        internalConfig: defaultInternalConfig,
        vectorConfig: defaultVectorConfig,
      }
    }

    // NOTE: The api_request parameters mapping now includes paramType and description,
    // which are handled by parametersFromDict used in the mapper.

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
        },
        internalConfig: defaultInternalConfig,
        vectorConfig: defaultVectorConfig,
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
          indexName: c?.indexName ?? '',
          embeddingModel: c?.embeddingModel ?? '',
          topK: c?.topK ?? 5,
          threshold: c?.threshold ?? 0.7,
          connector: c?.connector ?? '',
          connectionString: c?.connectionString ?? '',
          filter: c?.filter,
        },
      }
    }
  }
}
