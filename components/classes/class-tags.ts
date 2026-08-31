// Fallback palette for well-known groups, keyed by the group's server-supplied `id`
// (its tag-prefix). Any group not listed here (e.g. a brand-new one added purely in
// the DB) falls back to CUSTOM_TAG_COLOR, so no app code change is needed for it to
// render with a reasonable color.
export const TAG_COLORS: Record<string, string> = {
  ageGroups: 'bg-emerald-600',
  schoolGrades: 'bg-pink-500',
  levels: 'bg-amber-500',
  formats: 'bg-violet-500',
  boards: 'bg-sky-500',
  custom: 'bg-slate-500',
}

export function getTagDisplayName(tagKey: string): string {
  const [, ...nameParts] = tagKey.split(':')
  return nameParts.join(':')
}

export function getTagCategory(tagKey: string): string {
  return tagKey.split(':')[0] || 'custom'
}
