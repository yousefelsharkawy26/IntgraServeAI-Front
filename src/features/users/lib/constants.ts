import type { User } from '@/types/auth'

export const ROLE_BADGE_CLASS: Record<string, string> = {
  Administrator: 'bg-purple-50 text-purple-700 border-purple-200',
  Manager: 'bg-blue-50 text-blue-700 border-blue-200',
  'Support Agent': 'bg-green-50 text-green-700 border-green-200',
  Viewer: 'bg-gray-50 text-gray-700 border-gray-200',
}

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const

export type StatusFilter = (typeof STATUS_OPTIONS)[number]['value']

export const PAGE_SIZE = 5

export function getUserInitials(user: Pick<User, 'name'>): string {
  return user.name.charAt(0).toUpperCase()
}