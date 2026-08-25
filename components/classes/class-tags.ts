export const TAG_CATEGORIES = {
  ageGroups: ['Kids (5-10)', 'Teens (11-17)', 'Adults (18+)', 'All Ages'],
  schoolGrades: [
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
  ],
  levels: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
  formats: ['Group Class', '1-on-1', 'Small Group'],
} as const

export type TagCategoryKey = keyof typeof TAG_CATEGORIES

export const TAG_CATEGORY_LABELS: Record<TagCategoryKey, string> = {
  ageGroups: 'Age Group',
  schoolGrades: 'School Grade',
  levels: 'Level',
  formats: 'Format',
}

export const TAG_COLORS: Record<string, string> = {
  ageGroups: 'bg-emerald-600',
  schoolGrades: 'bg-pink-500',
  levels: 'bg-amber-500',
  formats: 'bg-violet-500',
  custom: 'bg-slate-500',
}

export function getTagDisplayName(tagKey: string): string {
  const [, ...nameParts] = tagKey.split(':')
  return nameParts.join(':')
}

export function getTagCategory(tagKey: string): string {
  return tagKey.split(':')[0] || 'custom'
}
