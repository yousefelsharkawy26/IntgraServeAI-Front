export function getApiErrorMessage(error: unknown, fallback = 'Please try again.'): string {
  const value = error as any
  const data = value?.response?.data
  if (!data) return value?.message || fallback
  if (typeof data.message === 'string') return data.message
  if (typeof data.detail === 'string') return data.detail
  if (data.detail?.message) return data.detail.message
  if (data.errors && typeof data.errors === 'object') {
    return Object.entries(data.errors)
      .map(([field, message]) => `${field}: ${String(message)}`)
      .join('; ')
  }
  return fallback
}
