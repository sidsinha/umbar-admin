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

export type ClassTagGroup = {
  /** Group key/tag-prefix, e.g. "ageGroups", "schoolGrades", "boards". */
  id: string
  label: string
  /** null => shown for every category; else only shown when the class's categoryId is in this list. */
  visibleForCategoryIds: string[] | null
  /** null => no denylist; else hidden when the class's parent category is in this list. */
  hiddenForCategoryIds: string[] | null
  options: string[]
}

type ClassTagsResponse = {
  success: true
  tagGroups: ClassTagGroup[]
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

function parseCategoryIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const ids = value.map((item) => String(item ?? '').trim()).filter(Boolean)
  return ids.length ? ids : null
}

function parseTagGroups(list: unknown): ClassTagGroup[] {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => {
      const row = item as {
        id?: string
        label?: string
        visibleForCategoryIds?: unknown
        hiddenForCategoryIds?: unknown
        options?: unknown[]
      }
      const id = String(row?.id || '').trim()
      const label = String(row?.label || '').trim()
      const options = Array.isArray(row?.options)
        ? row.options.map((value) => String(value ?? '').trim()).filter(Boolean)
        : []
      return {
        id,
        label,
        visibleForCategoryIds: parseCategoryIds(row?.visibleForCategoryIds),
        hiddenForCategoryIds: parseCategoryIds(row?.hiddenForCategoryIds),
        options,
      }
    })
    .filter((item) => item.id && item.label)
}

export async function fetchClassTags(options?: {
  parentCategoryIds?: string[]
}): Promise<ClassTagGroup[]> {
  const params: Record<string, string> = {}
  if (options?.parentCategoryIds !== undefined) {
    params.parentCategoryIds = options.parentCategoryIds
      .map((id) => id.trim())
      .filter(Boolean)
      .join(',')
  }
  const response = await fetch(buildUrl('/api/marketplace/class-tags', Object.keys(params).length ? params : undefined))
  const payload = await parseJson<ClassTagsResponse>(response)
  return parseTagGroups(payload.tagGroups)
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
