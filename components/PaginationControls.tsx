'use client'

import { Button } from '@/components/ui/button'

type PaginationControlsProps = {
  totalCount: number
  pageCount: number
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}

export default function PaginationControls({
  totalCount,
  pageCount,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {pageCount} of {totalCount} records
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPrev} disabled={!hasPrev}>
          Previous
        </Button>
        <Button variant="outline" onClick={onNext} disabled={!hasNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
