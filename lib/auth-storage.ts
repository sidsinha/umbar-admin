import { ADMIN_TOKEN_STORAGE_KEY } from '@/lib/config'

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getAdminToken())
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  const redirect = `${window.location.pathname}${window.location.search}`
  const loginUrl = redirect.startsWith('/login')
    ? '/login/'
    : `/login/?redirect=${encodeURIComponent(redirect)}`
  window.location.href = loginUrl
}
