import type { InstructorType } from '@/lib/instructor-type'
import { isIndividualClassType } from '@/lib/instructor-type'

export const CLASS_TITLE_PREFIXES: Record<InstructorType, string> = {
  individual: 'I teach ',
  academy: 'We teach ',
}

/** Matches API `sanitizeText(body.name, 200)` in umbar-api class writes. */
export const CLASS_NAME_MAX_LENGTH = 200

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

export function maxEditableTitleTailLength(
  instructorType: InstructorType,
  _lockedSubjectName?: string | null,
): number {
  const prefixLength = classTitlePrefixForType(instructorType).length
  return Math.max(0, CLASS_NAME_MAX_LENGTH - prefixLength)
}

export function splitClassTitle(
  fullTitle: string,
  instructorType?: InstructorType,
): { suffix: string; hasPrefix: boolean } {
  if (instructorType) {
    const preferredPrefix = CLASS_TITLE_PREFIXES[instructorType]
    if (fullTitle.startsWith(preferredPrefix)) {
      return { suffix: fullTitle.slice(preferredPrefix.length), hasPrefix: true }
    }
  }

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
  _subjectName?: string | null,
): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const title of titles) {
    const tail = normalizeAiTitleSuffix(title, instructorType)
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

export function buildStoredClassNameFromParts(options: {
  instructorType: InstructorType
  lockedSubjectName?: string | null
  editableTail: string
  academySuffix: string
}): string {
  const { instructorType, editableTail, academySuffix } = options
  if (isIndividualClassType(instructorType)) {
    return buildClassTitle(editableTail, 'individual')
  }
  return buildClassTitle(academySuffix, 'academy')
}

export function classNameLengthError(storedName: string): string | null {
  const length = storedName.trim().length
  if (length > CLASS_NAME_MAX_LENGTH) {
    return `Class name is ${length} characters; maximum is ${CLASS_NAME_MAX_LENGTH}. Shorten the title before saving.`
  }
  return null
}

export function classNameCharCountLabel(storedName: string): string {
  return `${storedName.trim().length}/${CLASS_NAME_MAX_LENGTH} characters`
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
