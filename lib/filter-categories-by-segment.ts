import type { MarketplaceCategoryV2Child, MarketplaceCategoryV2Parent } from '@/lib/marketplace-api-client'

export type ProviderSegment = 'individual' | 'academy'

export function sanitizeProviderSegment(value: unknown): ProviderSegment {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  return normalized === 'academy' ? 'academy' : 'individual'
}

export function childMatchesSegment(
  child: MarketplaceCategoryV2Child,
  segment: ProviderSegment,
): boolean {
  return sanitizeProviderSegment(child.providerSegment) === segment
}

export function filterParentCategoriesForBrowse(
  parents: MarketplaceCategoryV2Parent[],
  segment: ProviderSegment,
): MarketplaceCategoryV2Parent[] {
  return parents
    .map((parent) => ({
      ...parent,
      children: (parent.children ?? []).filter((child) => childMatchesSegment(child, segment)),
    }))
    .filter((parent) => parent.children.length > 0)
}
