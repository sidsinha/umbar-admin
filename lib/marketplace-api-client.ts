import { UMBAR_API_BASE_URL } from '@/lib/config'

export type MarketplaceCategoryV1 = {
  id: string
  name: string
}

export type MarketplaceCategoryV2Child = {
  id: string
  name: string
  providerSegment?: 'individual' | 'academy'
}

export type MarketplaceCategoryV2Parent = {
  id: string
  name: string
  children: MarketplaceCategoryV2Child[]
}

export type CategoriesResponse = {
  success: true
  categories: MarketplaceCategoryV1[] | MarketplaceCategoryV2Parent[]
  meta?: { taxonomy?: string }
}

export type SupportedCountry = {
  id: string
  name: string
  placesIso2: string
  marketplaceEnabled: boolean
}

export type LocationAutocompleteItem = {
  placeId: string
  fullText: string
  primaryText: string
  secondaryText: string
}

export type LocationPlaceDetails = {
  placeId: string
  locationText: string
  lat: number
  lng: number
  locality?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  formattedAddress?: string
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const base = `${UMBAR_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!params) return base
  const search = new URLSearchParams(params)
  const query = search.toString()
  return query ? `${base}?${query}` : base
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & {
    success?: boolean
    error?: string
  }
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Request failed (${response.status}).`)
  }
  return payload
}

export function isV2CategoriesResponse(
  response: CategoriesResponse,
): response is CategoriesResponse & { categories: MarketplaceCategoryV2Parent[] } {
  return response.meta?.taxonomy === 'v2'
}

export async function fetchCategories(): Promise<CategoriesResponse> {
  const response = await fetch(
    buildUrl('/api/categories', {
      taxonomy: 'v2',
      populatedOnly: 'false',
    }),
  )
  return parseJson<CategoriesResponse>(response)
}

export async function fetchSupportedCountries(options?: {
  marketplaceOnly?: boolean
}): Promise<SupportedCountry[]> {
  const params: Record<string, string> = {}
  if (options?.marketplaceOnly) {
    params.marketplaceOnly = 'true'
  }
  const response = await fetch(buildUrl('/api/supported-countries', params))
  const payload = await parseJson<{ countries: SupportedCountry[] }>(response)
  return Array.isArray(payload.countries) ? payload.countries : []
}

export function createPlacesSessionToken(): string {
  return `loc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

export async function fetchLocationAutocomplete(params: {
  query: string
  country: string
  limit?: number
  sessionToken?: string
}): Promise<LocationAutocompleteItem[]> {
  const query = params.query.trim()
  if (query.length < 3) return []

  const country = params.country.trim().toUpperCase()
  if (!country) {
    throw new Error('Country is required for location search.')
  }

  const response = await fetch(
    buildUrl('/api/location/autocomplete', {
      q: query,
      country,
      language: 'en',
      limit: String(params.limit ?? 5),
      ...(params.sessionToken ? { sessionToken: params.sessionToken } : {}),
    }),
  )
  const payload = await parseJson<{ items?: LocationAutocompleteItem[] }>(response)
  return Array.isArray(payload.items) ? payload.items : []
}

export async function fetchLocationPlaceDetails(params: {
  placeId: string
  sessionToken?: string
}): Promise<LocationPlaceDetails> {
  const placeId = params.placeId.trim()
  if (!placeId) throw new Error('placeId is required')

  const response = await fetch(
    buildUrl('/api/location/place-details', {
      placeId,
      language: 'en',
      ...(params.sessionToken ? { sessionToken: params.sessionToken } : {}),
    }),
  )
  const payload = await parseJson<{ location?: LocationPlaceDetails }>(response)
  if (!payload.location) throw new Error('Location details not found')
  return payload.location
}
