import { ACTION_TYPE_CONFIGS, type ActionType } from '@/types/action'

// Legacy-compatible config for the list view (includes color info)
export const ACTION_TYPE_CONFIG: Record<ActionType, { label: string; color: string; bgColor: string; description: string }> = {
  api_request: { label: 'API Request', description: 'HTTP/HTTPS API calls', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  rpc_request: { label: 'RPC Request', description: 'gRPC remote procedure calls', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  vector_query: { label: 'Vector Query', description: 'Vector database queries with embeddings', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  sql_query: { label: 'SQL Query', description: 'SQL database queries', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  knowledge_query: { label: 'Knowledge Query', description: 'Knowledge base queries', color: 'text-teal-700', bgColor: 'bg-teal-50' },
  internal: { label: 'Internal', description: 'Internal system actions (read-only)', color: 'text-slate-700', bgColor: 'bg-slate-100' },
}

export const ACTION_TYPES: ActionType[] = [
  'api_request',
  'rpc_request',
  'vector_query',
  'sql_query',
  'knowledge_query',
  'internal',
]

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const
