export function getAuthSecret(): string {
  const raw = process.env.AUTH_SECRET?.trim()
  if (raw && raw.length >= 32) {
    return raw
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set to a string of at least 32 characters in production.')
  }
  return 'opsmate-dev-auth-secret-change-me!!'
}
