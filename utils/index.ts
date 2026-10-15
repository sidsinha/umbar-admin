import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function displayPersonName(person: {
  firstName?: string | null
  lastName?: string | null
  name?: string | null
}) {
  if (person.name?.trim()) return person.name.trim()
  return [person.firstName, person.lastName].filter(Boolean).join(' ').trim() || '—'
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function formatClassLocation(location: Record<string, unknown> | null | undefined) {
  if (!location) return '—'
  const city = typeof location.city === 'string' ? location.city : null
  const state = typeof location.state === 'string' ? location.state : null
  const parts = [city, state].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

export function formatSignupGeo(signupGeo: Record<string, unknown> | null | undefined) {
  if (!signupGeo) return '—'
  const city = typeof signupGeo.city === 'string' ? signupGeo.city : null
  const countryCode = typeof signupGeo.countryCode === 'string' ? signupGeo.countryCode : null
  const region = typeof signupGeo.region === 'string' ? signupGeo.region : null
  const parts = [city, region, countryCode].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

export function formatProfileLocation(
  location: Record<string, unknown> | null | undefined,
) {
  if (!location) return '—'
  const text =
    (typeof location.locationText === 'string' && location.locationText.trim()) ||
    (typeof location.formattedAddress === 'string' && location.formattedAddress.trim()) ||
    ''
  if (text) return text
  const parts = [location.city, location.state, location.country].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  )
  return parts.length > 0 ? parts.join(', ') : '—'
}

export function formatInstructorLocation(
  location: Record<string, unknown> | null | undefined,
  signupGeo: Record<string, unknown> | null | undefined,
) {
  const fromProfile = formatProfileLocation(location)
  if (fromProfile !== '—') return fromProfile
  return formatSignupGeo(signupGeo)
}

export function formatClientPlatform(
  platform: string | null | undefined,
): string {
  if (platform === 'mobile') return 'Mobile'
  if (platform === 'desktop') return 'Desktop'
  return '—'
}

export function formatSignupSourcePlatform(
  signupSource: Record<string, unknown> | null | undefined,
): string {
  if (!signupSource) return '—'
  const platform =
    typeof signupSource.platform === 'string' ? signupSource.platform : null
  return formatClientPlatform(platform)
}

export function formatSignupSource(signupSource: Record<string, unknown> | null | undefined) {
  if (!signupSource) return '—'
  const channel = typeof signupSource.channel === 'string' ? signupSource.channel : null
  if (channel === 'app') return 'App'
  if (channel === 'organic') return 'Web (organic)'
  if (channel === 'ppc') return 'Web (PPC)'
  if (channel === 'find-a-teacher') return 'Find a teacher'
  if (channel === 'category-page') return 'Category page'
  if (channel === 'callback') return 'Callback'
  return '—'
}

export function formatClassCreatedFrom(
  createdFrom: 'website' | 'app' | 'admin' | null | undefined,
) {
  if (createdFrom === 'website') return 'Website'
  if (createdFrom === 'app') return 'App'
  if (createdFrom === 'admin') return 'Admin'
  return '—'
}

export function statusPillClass(active: boolean) {
  return active
    ? 'bg-emerald-100 text-emerald-900'
    : 'bg-muted text-muted-foreground'
}

export function formatStudentClaimStatus(value: string | null | undefined): string {
  const key = String(value || '').trim().toLowerCase()
  switch (key) {
    case 'self':
      return 'Self'
    case 'unclaimed':
      return 'Unclaimed'
    case 'claimed':
      return 'Claimed'
    case 'verified':
      return 'Verified'
    default:
      return key ? key.charAt(0).toUpperCase() + key.slice(1) : '—'
  }
}

export function studentClaimStatusPillClass(value: string | null | undefined): string {
  switch (String(value || '').trim().toLowerCase()) {
    case 'unclaimed':
      return 'bg-amber-100 text-amber-900'
    case 'claimed':
    case 'verified':
      return 'bg-emerald-100 text-emerald-900'
    case 'self':
      return 'bg-secondary text-secondary-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}
