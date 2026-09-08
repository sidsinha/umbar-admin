export type InstructorType = 'individual' | 'academy'

export type InstructorTypeDefinition = {
  value: InstructorType
  label: string
  description: string
}

/** Canonical instructor-type copy. Update here to change labels/descriptions across admin. */
export const INSTRUCTOR_TYPE_DEFINITIONS: Record<InstructorType, InstructorTypeDefinition> = {
  individual: {
    value: 'individual',
    label: 'Individual',
    description: 'Specializes in one or more subjects and manages their own teaching.',
  },
  academy: {
    value: 'academy',
    label: 'Academy',
    description: 'Offers multiple courses, subjects, batches, or learning programs.',
  },
}

export const INSTRUCTOR_TYPE_OPTIONS: InstructorTypeDefinition[] = [
  INSTRUCTOR_TYPE_DEFINITIONS.individual,
  INSTRUCTOR_TYPE_DEFINITIONS.academy,
]

export function instructorTypeLabel(type: InstructorType): string {
  return INSTRUCTOR_TYPE_DEFINITIONS[type]?.label ?? INSTRUCTOR_TYPE_DEFINITIONS.individual.label
}

export function isIndividualClassType(type: InstructorType): boolean {
  return type === 'individual'
}
