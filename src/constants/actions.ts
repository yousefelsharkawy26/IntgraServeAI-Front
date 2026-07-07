import type { ActionType } from '@/types/action'

export const ACTION_TYPE_CONFIG: Record<ActionType, { label: string; color: string; bgColor: string }> = {
  api_request: { label: 'API Request', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  rpc_request: { label: 'RPC Request', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  internal: { label: 'Internal', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  vector_query: { label: 'Vector Query', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
}

export const ACTION_TYPES: ActionType[] = ['api_request', 'rpc_request', 'internal', 'vector_query']

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const