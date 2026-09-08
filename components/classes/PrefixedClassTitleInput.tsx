'use client'

import type { InstructorType } from '@/lib/instructor-type'
import { isIndividualClassType } from '@/lib/instructor-type'
import { classTitlePrefixForType } from '@/lib/class-title'
import { cn } from '@/utils'

const segmentClassName =
  'flex shrink-0 items-center whitespace-nowrap border-r border-input bg-muted px-3 text-sm font-medium text-muted-foreground'

const inputClassName =
  'w-full min-w-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50'

type PrefixedClassTitleInputProps = {
  id: string
  instructorType: InstructorType
  lockedSubjectName?: string | null
  editableTail: string
  onEditableTailChange: (value: string) => void
  academySuffix?: string
  onAcademySuffixChange?: (value: string) => void
  disabled?: boolean
  maxLength?: number
}

export default function PrefixedClassTitleInput({
  id,
  instructorType,
  lockedSubjectName,
  editableTail,
  onEditableTailChange,
  academySuffix = '',
  onAcademySuffixChange,
  disabled = false,
  maxLength = 70,
}: PrefixedClassTitleInputProps) {
  const prefix = classTitlePrefixForType(instructorType).trim()
  const isIndividual = isIndividualClassType(instructorType)
  const subject = lockedSubjectName?.trim() ?? ''

  return (
    <div
      className={cn(
        'border-input flex w-full items-stretch overflow-hidden rounded-md border bg-background shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
      )}
    >
      <span className={segmentClassName}>{prefix}</span>

      {isIndividual ? (
        <>
          {subject ? (
            <span className={segmentClassName} aria-hidden>
              {subject}
            </span>
          ) : null}
          <input
            id={id}
            value={editableTail}
            disabled={disabled || !subject}
            onChange={(event) => onEditableTailChange(event.target.value)}
            placeholder={subject ? 'for Beginners' : 'Select a subcategory first'}
            maxLength={maxLength}
            className={inputClassName}
          />
        </>
      ) : (
        <input
          id={id}
          value={academySuffix}
          disabled={disabled}
          onChange={(event) => onAcademySuffixChange?.(event.target.value)}
          placeholder="Your Subject for Beginners"
          maxLength={maxLength}
          className={inputClassName}
        />
      )}
    </div>
  )
}
