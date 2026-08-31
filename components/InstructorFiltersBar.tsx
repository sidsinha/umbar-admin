'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { INSTRUCTOR_TYPE_OPTIONS, type InstructorType } from '@/lib/instructor-type'

export type SignupSourceFilter = '' | 'app' | 'organic' | 'ppc'
export type InstructorTypeFilter = '' | InstructorType

type InstructorFiltersBarProps = {
  name: string
  onNameChange: (value: string) => void
  phone: string
  onPhoneChange: (value: string) => void
  instructorType: InstructorTypeFilter
  onInstructorTypeChange: (value: InstructorTypeFilter) => void
  signupSource: SignupSourceFilter
  onSignupSourceChange: (value: SignupSourceFilter) => void
  signupLocation: string
  onSignupLocationChange: (value: string) => void
  signupCities: string[]
  citiesLoading?: boolean
  limit: number
  onLimitChange: (value: number) => void
  onApply: () => void
  busy?: boolean
}

export default function InstructorFiltersBar({
  name,
  onNameChange,
  phone,
  onPhoneChange,
  instructorType,
  onInstructorTypeChange,
  signupSource,
  onSignupSourceChange,
  signupLocation,
  onSignupLocationChange,
  signupCities,
  citiesLoading = false,
  limit,
  onLimitChange,
  onApply,
  busy = false,
}: InstructorFiltersBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div>
          <Label htmlFor="instructor-name-filter">Filter by name</Label>
          <Input
            id="instructor-name-filter"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="mt-2"
            placeholder="First or last name…"
          />
        </div>
        <div>
          <Label htmlFor="instructor-phone-filter">Filter by phone</Label>
          <Input
            id="instructor-phone-filter"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            className="mt-2"
            placeholder="Phone number…"
          />
        </div>
        <div>
          <Label htmlFor="instructor-type-filter">Type</Label>
          <select
            id="instructor-type-filter"
            value={instructorType}
            onChange={(event) => onInstructorTypeChange(event.target.value as InstructorTypeFilter)}
            className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All types</option>
            {INSTRUCTOR_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="instructor-source-filter">Source</Label>
          <select
            id="instructor-source-filter"
            value={signupSource}
            onChange={(event) => onSignupSourceChange(event.target.value as SignupSourceFilter)}
            className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All sources</option>
            <option value="app">App</option>
            <option value="organic">Web (organic)</option>
            <option value="ppc">Web (PPC)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="instructor-location-filter">Signup location</Label>
          <select
            id="instructor-location-filter"
            value={signupLocation}
            onChange={(event) => onSignupLocationChange(event.target.value)}
            disabled={citiesLoading}
            className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
          >
            <option value="">All cities</option>
            {signupCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="instructor-list-limit">Page size</Label>
          <Input
            id="instructor-list-limit"
            type="number"
            min={1}
            max={200}
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value) || 200)}
            className="mt-2"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={onApply} disabled={busy}>
          {busy ? 'Loading…' : 'Apply / Refresh'}
        </Button>
      </div>
    </div>
  )
}
