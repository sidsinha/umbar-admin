'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ListFiltersBarProps = {
  filterLabel: string
  filterValue: string
  onFilterChange: (value: string) => void
  limit: number
  onLimitChange: (value: number) => void
  onApply: () => void
  busy?: boolean
}

export default function ListFiltersBar({
  filterLabel,
  filterValue,
  onFilterChange,
  limit,
  onLimitChange,
  onApply,
  busy = false,
}: ListFiltersBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="list-filter">{filterLabel}</Label>
        <Input
          id="list-filter"
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          className="mt-2"
          placeholder="Search…"
        />
      </div>
      <div className="w-full sm:w-28">
        <Label htmlFor="list-limit">Page size</Label>
        <Input
          id="list-limit"
          type="number"
          min={1}
          max={100}
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value) || 25)}
          className="mt-2"
        />
      </div>
      <Button onClick={onApply} disabled={busy}>
        {busy ? 'Loading…' : 'Apply / Refresh'}
      </Button>
    </div>
  )
}
