'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import DataTable from '@/components/DataTable'
import ListFiltersBar from '@/components/ListFiltersBar'
import PaginationControls from '@/components/PaginationControls'
import { fetchAdminClasses } from '@/lib/admin-ops-api-client'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import { formatClassLocation, formatDate } from '@/utils'

export default function ClassList() {
  const [emailFilter, setEmailFilter] = useState('')
  const [appliedEmail, setAppliedEmail] = useState('')
  const { limit, setLimit, currentCursor, resetPaging, goNext, goPrev, hasPrev } =
    useCursorPagination()

  useEffect(() => {
    resetPaging()
  }, [appliedEmail, limit, resetPaging])

  const listQuery = useQuery({
    queryKey: ['admin-classes', appliedEmail, limit, currentCursor],
    queryFn: () =>
      fetchAdminClasses({
        instructorEmail: appliedEmail || undefined,
        limit,
        cursor: currentCursor,
      }),
  })

  function handleApply() {
    setAppliedEmail(emailFilter.trim())
    resetPaging()
  }

  const items = listQuery.data?.items ?? []

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Classes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {listQuery.data?.totalCount ?? '—'} total classes
        </p>
      </div>

      <ListFiltersBar
        filterLabel="Filter by instructor email"
        filterValue={emailFilter}
        onFilterChange={setEmailFilter}
        limit={limit}
        onLimitChange={setLimit}
        onApply={handleApply}
        busy={listQuery.isFetching}
      />

      {listQuery.error ? (
        <p className="mb-4 text-sm text-destructive">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load classes.'}
        </p>
      ) : null}

      <DataTable
        columns={['Name', 'Instructor', 'Category', 'Location', 'Enrolled', 'Status', 'Created']}
      >
        {items.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-3">{item.name}</td>
            <td className="px-4 py-3">{item.instructorName ?? item.instructorEmail ?? '—'}</td>
            <td className="px-4 py-3">{item.category ?? '—'}</td>
            <td className="px-4 py-3">{formatClassLocation(item.location)}</td>
            <td className="px-4 py-3">{item.currentEnrollments}</td>
            <td className="px-4 py-3 capitalize">{item.status}</td>
            <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
          </tr>
        ))}
      </DataTable>

      <PaginationControls
        totalCount={listQuery.data?.totalCount ?? 0}
        pageCount={items.length}
        hasPrev={hasPrev}
        hasNext={Boolean(listQuery.data?.pagination.hasMore)}
        onPrev={goPrev}
        onNext={() => goNext(listQuery.data?.pagination.nextCursor ?? null)}
      />
    </div>
  )
}
