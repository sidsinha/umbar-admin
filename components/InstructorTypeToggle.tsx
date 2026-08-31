'use client'

import { instructorTypeLabel, INSTRUCTOR_TYPE_OPTIONS, type InstructorType } from '@/lib/instructor-type'
import { cn } from '@/utils'

type InstructorTypeToggleProps = {
  value: InstructorType
  onChange: (value: InstructorType) => void
  disabled?: boolean
}

export default function InstructorTypeToggle({
  value,
  onChange,
  disabled = false,
}: InstructorTypeToggleProps) {
  const resolvedValue = value === 'academy' ? 'academy' : 'individual'

  return (
    <div
      role="radiogroup"
      aria-label="Instructor type"
      className={cn(
        'inline-flex rounded-full bg-muted p-0.5',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      {INSTRUCTOR_TYPE_OPTIONS.map((option) => {
        const selected = resolvedValue === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.description}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold transition',
              selected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {instructorTypeLabel(option.value)}
          </button>
        )
      })}
    </div>
  )
}

export type { InstructorType }
