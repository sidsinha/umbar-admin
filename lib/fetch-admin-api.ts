import { clearAdminToken, getAdminToken, redirectToLogin } from '@/lib/auth-storage'
import { ADMIN_OPS_ROOT, UMBAR_API_BASE_URL } from '@/lib/config'

export type AdminApiResult = Record<string, unknown> & {
  success?: boolean
  error?: string
}

function buildUrl(path: string): string {
  return `${UMBAR_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function authHeaders(): HeadersInit {
  const token = getAdminToken()
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

async function parseAdminApiResponse(response: Response, text: string): Promise<AdminApiResult> {
  let payload: AdminApiResult = {}

  try {
    payload = text ? (JSON.parse(text) as AdminApiResult) : {}
  } catch {
    throw new Error(`Invalid API response (${response.status}).`)
  }

  if (response.status === 401) {
    clearAdminToken()
    redirectToLogin()
    throw new Error(payload.error || 'Unauthorized.')
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Request failed (${response.status}).`)
  }

  return payload
}

export async function fetchAdminApiGet(path: string): Promise<AdminApiResult> {
  const response = await fetch(buildUrl(path), {
    method: 'GET',
    headers: authHeaders(),
  })
  const text = await response.text()
  return parseAdminApiResponse(response, text)
}

export async function fetchAdminApiDelete(path: string): Promise<AdminApiResult> {
  const response = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: authHeaders(),
  })
  const text = await response.text()
  return parseAdminApiResponse(response, text)
}

export async function fetchAdminApiPost(
  path: string,
  body: Record<string, unknown>,
): Promise<AdminApiResult> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  const text = await response.text()
  return parseAdminApiResponse(response, text)
}

export async function fetchAdminLogin(password: string): Promise<{ token: string; expiresAt: number }> {
  const response = await fetch(buildUrl(`${ADMIN_OPS_ROOT}/auth/login`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const payload = (await response.json()) as {
    success?: boolean
    error?: string
    token?: string
    expiresAt?: number
  }

  if (!response.ok || !payload.success || !payload.token) {
    throw new Error(payload.error || 'Login failed.')
  }

  return { token: payload.token, expiresAt: payload.expiresAt ?? 0 }
}
