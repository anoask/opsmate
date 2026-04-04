const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? ''

export function getApiBaseUrl() {
  return publicApiBaseUrl.replace(/\/$/, '')
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const apiBaseUrl = getApiBaseUrl()

  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath
}
