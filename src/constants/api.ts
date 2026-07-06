export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'

export const WS_BASE_URL = SERVER_URL.replace(/^http/, 'ws')
export const WS_API_BASE_URL = API_BASE_URL.replace(/^http/, 'ws')

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  users: {
    me: '/users/me',
    mePassword: '/users/me/password',
    meLogs: '/users/me/logs',
    list: '/users',
    detail: (id: string) => `/users/${id}`,
  },
  roles: {
    me: '/roles/me',
    list: '/roles',
    detail: (id: string) => `/roles/${id}`,
  },
  tickets: {
    list: '/tickets',
    detail: (id: string) => `/tickets/${id}`,
    messages: (id: string) => `/tickets/${id}/messages`,
    notes: (id: string) => `/tickets/${id}/notes`,
    assign: (id: string) => `/tickets/${id}/assign`,
    status: (id: string) => `/tickets/${id}/status`,
  },
  actions: {
    list: '/actions',
    detail: (id: string) => `/actions/${id}`,
    toggle: (id: string) => `/actions/${id}/toggle`,
    validate: (id: string) => `/actions/${id}/validate`,
  },
  backups: {
    list: '/actions/backups',
    detail: (id: string) => `/actions/backups/${id}`,
    restore: (id: string) => `/actions/backups/${id}/restore`,
    compare: (id: string) => `/actions/backups/${id}/compare`,
  },
  dashboard: {
    overview: '/dashboard/overview',
  },
  chat: {
    ws: '/chat/ws',
    messages: '/chat/messages',
    messageDetail: (id: string) => `/chat/messages/${id}`,
    upload: '/chat/upload',
    attachments: (id: string) => `/chat/messages/${id}/attachments`,
  },
  health: {
    check: `${SERVER_URL}/health`,
  },
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const

export const SOCKET_EVENTS = {
  connect: 'connect',
  disconnect: 'disconnect',
  ticketUpdated: 'ticket:updated',
  ticketNew: 'ticket:new',
  ticketMessage: 'ticket:message',
  notificationNew: 'notification:new',
  dashboardMetrics: 'dashboard:metrics',
  userOnline: 'user:online',
  userOffline: 'user:offline',
} as const
