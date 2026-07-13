export interface SystemContext {
  title: string
  description: string
  tone: string
  version: string
}

export interface AgentConfiguration {
  system_context: SystemContext
  global_defaults: Record<string, unknown>
  llm_config_id: string
  metadata: {
    last_updated?: string | null
    updated_by?: string | null
  }
}

export interface AgentConfigurationUpdate {
  system_context: SystemContext
  global_defaults: Record<string, unknown>
  llm_config_id: string
}

export interface ProviderInfo {
  id: string
  name: string
}

export interface LLMConfiguration {
  id: string
  name: string
  provider: string
  location: 'local' | 'remote'
  model_name: string
  api_key_reference?: string | null
  has_api_key: boolean
  temperature: number
  max_tokens: number
  system_prompt_template: string
  active: boolean
  config_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface LLMConfigurationPayload {
  name: string
  provider: string
  location: 'local' | 'remote'
  model_name: string
  api_key?: string
  api_key_reference?: string | null
  temperature: number
  max_tokens: number
  system_prompt_template: string
  active: boolean
  config_json: Record<string, unknown>
}

export interface AgentConfigBackupSummary {
  id: string
  agent_config_id: string
  name: string
  created_at: string
  created_by_id?: string | null
}

export interface AgentConfigBackupDetail extends AgentConfigBackupSummary {
  snapshot: {
    schema_version: number
    agent_config: Record<string, unknown>
    active_prompt: Record<string, unknown> | null
    llm_config: Record<string, unknown>
    action_defaults: Record<string, unknown>
  }
}
