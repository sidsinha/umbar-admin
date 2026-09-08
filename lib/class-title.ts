import type { InstructorType } from '@/lib/instructor-type'

export const CLASS_TITLE_PREFIXES: Record<InstructorType, string> = {
  individual: 'I will teach ',
  academy: 'We will teach ',
}

export type CategoryWithChildren = {
  id: string
  name: string
  children?: { id: string; name: string }[]
}

export function classTitlePrefixForType(instructorType: InstructorType): string {
  return CLASS_TITLE_PREFIXES[instructorType]
}

export function buildClassTitle(suffix: string, instructorType: InstructorType): string {
  return `${classTitlePrefixForType(instructorType)}${suffix.trim()}`
}

export function splitClassTitle(fullTitle: string): { suffix: string; hasPrefix: boolean } {
  for (const prefix of Object.values(CLASS_TITLE_PREFIXES)) {
    if (fullTitle.startsWith(prefix)) {
      return { suffix: fullTitle.slice(prefix.length), hasPrefix: true }
    }
  }
  return { suffix: fullTitle, hasPrefix: false }
}

export function primarySubjectName(
  categories: CategoryWithChildren[],
  subcategoryId: string | null | undefined,
): string | null {
  if (!subcategoryId) return null
  for (const parent of categories) {
    const child = parent.children?.find((item) => item.id === subcategoryId)
    if (child) return child.name
  }
  return null
}

export function normalizeAiTitleSuffix(title: string, instructorType: InstructorType): string {
  const trimmed = title.trim()
  const expectedPrefix = CLASS_TITLE_PREFIXES[instructorType]
  if (trimmed.startsWith(expectedPrefix)) {
    return trimmed.slice(expectedPrefix.length).trim()
  }
  return splitClassTitle(trimmed).suffix.trim()
}

export function normalizeAiTitleTails(
  titles: string[],
  instructorType: InstructorType,
  subjectName: string | null | undefined,
): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const title of titles) {
    const suffix = normalizeAiTitleSuffix(title, instructorType)
    const tail =
      instructorType === 'individual' && subjectName?.trim()
        ? splitSuffixAroundSubject(suffix, subjectName).editableTail
        : suffix
    const key = tail.toLowerCase()
    if (!tail || seen.has(key)) continue
    seen.add(key)
    result.push(tail)
  }
  return result
}

export function buildSuffixFromSubject(subjectName: string, editableTail: string): string {
  const subject = subjectName.trim()
  const tail = editableTail.trim()
  if (!subject) return tail
  if (!tail) return subject
  return `${subject} ${tail}`
}

export function splitSuffixAroundSubject(
  suffix: string,
  subjectName: string,
): { editableTail: string } {
  const normalizedSuffix = suffix.trim()
  const subject = subjectName.trim()
  if (!subject) return { editableTail: normalizedSuffix }
  if (normalizedSuffix.toLowerCase().startsWith(subject.toLowerCase())) {
    return { editableTail: normalizedSuffix.slice(subject.length).trim() }
  }
  return { editableTail: normalizedSuffix }
}
