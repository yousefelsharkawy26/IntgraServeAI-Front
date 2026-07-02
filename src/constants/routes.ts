export const ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  tickets: '/tickets',
  ticketDetail: (id: string) => `/tickets/${id}`,
  actions: '/actions',
  backups: '/backups',
  users: '/users',
  roles: '/roles',
  profile: '/profile',
  chat: '/chat',
} as const
