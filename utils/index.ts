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

export function formatSignupSource(signupSource: Record<string, unknown> | null | undefined) {
  if (!signupSource) return '—'
  const channel = typeof signupSource.channel === 'string' ? signupSource.channel : null
  if (channel === 'app') return 'App'
  if (channel === 'organic') return 'Web (organic)'
  if (channel === 'ppc') return 'Web (PPC)'
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
