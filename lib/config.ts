export const UMBAR_API_BASE_URL = (
  process.env.NEXT_PUBLIC_UMBAR_API_BASE_URL?.trim() ||
  'https://umbar-api-staging-gz7hsuer7q-el.a.run.app'
).replace(/\/$/, '')

/** Root path for all ops-admin routes on umbar-api. */
export const ADMIN_OPS_ROOT = '/admin/ops'

export const ADMIN_TOKEN_STORAGE_KEY = 'umbar_ops_admin_token'

export const UMBAR_LOGO_URL = '/umbar-logo.png'
