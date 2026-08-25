'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type SignupSourceFilter = '' | 'app' | 'organic' | 'ppc'

type InstructorFiltersBarProps = {
  email: string
  onEmailChange: (value: string) => void
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
  email,
  onEmailChange,
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="instructor-email-filter">Filter by email</Label>
          <Input
            id="instructor-email-filter"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="mt-2"
            placeholder="Search email…"
          />
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
            max={100}
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value) || 25)}
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
