'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ListFiltersBarProps = {
  filterLabel: string
  filterValue: string
  onFilterChange: (value: string) => void
  filterPlaceholder?: string
  secondaryFilterLabel?: string
  secondaryFilterValue?: string
  onSecondaryFilterChange?: (value: string) => void
  secondaryFilterPlaceholder?: string
  limit: number
  onLimitChange: (value: number) => void
  onApply: () => void
  busy?: boolean
}

export default function ListFiltersBar({
  filterLabel,
  filterValue,
  onFilterChange,
  filterPlaceholder = 'Search…',
  secondaryFilterLabel,
  secondaryFilterValue,
  onSecondaryFilterChange,
  secondaryFilterPlaceholder = 'Search…',
  limit,
  onLimitChange,
  onApply,
  busy = false,
}: ListFiltersBarProps) {
  const hasSecondaryFilter = Boolean(secondaryFilterLabel && onSecondaryFilterChange)

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div
        className={
          hasSecondaryFilter
            ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-4 sm:flex-row sm:items-end'
        }
      >
        <div className={hasSecondaryFilter ? undefined : 'flex-1'}>
          <Label htmlFor="list-filter">{filterLabel}</Label>
          <Input
            id="list-filter"
            value={filterValue}
            onChange={(event) => onFilterChange(event.target.value)}
            className="mt-2"
            placeholder={filterPlaceholder}
          />
        </div>
        {hasSecondaryFilter ? (
          <div>
            <Label htmlFor="list-secondary-filter">{secondaryFilterLabel}</Label>
            <Input
              id="list-secondary-filter"
              value={secondaryFilterValue ?? ''}
              onChange={(event) => onSecondaryFilterChange?.(event.target.value)}
              className="mt-2"
              placeholder={secondaryFilterPlaceholder}
            />
          </div>
        ) : null}
        <div className={hasSecondaryFilter ? undefined : 'w-full sm:w-28'}>
          <Label htmlFor="list-limit">Page size</Label>
          <Input
            id="list-limit"
            type="number"
            min={1}
            max={200}
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
