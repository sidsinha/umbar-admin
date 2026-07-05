'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import DataTable from '@/components/DataTable'
import ListFiltersBar from '@/components/ListFiltersBar'
import PaginationControls from '@/components/PaginationControls'
import { fetchAdminInquiries } from '@/lib/admin-ops-api-client'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import { formatDate } from '@/utils'

export default function InquiryList() {
  const [classFilter, setClassFilter] = useState('')
  const [appliedClassId, setAppliedClassId] = useState('')
  const { limit, setLimit, currentCursor, resetPaging, goNext, goPrev, hasPrev } =
    useCursorPagination()

  useEffect(() => {
    resetPaging()
  }, [appliedClassId, limit, resetPaging])

  const listQuery = useQuery({
    queryKey: ['admin-inquiries', appliedClassId, limit, currentCursor],
    queryFn: () =>
      fetchAdminInquiries({
        classId: appliedClassId || undefined,
        limit,
        cursor: currentCursor,
      }),
  })

  function handleApply() {
    setAppliedClassId(classFilter.trim())
    resetPaging()
  }

  const items = listQuery.data?.items ?? []

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Inquiries</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {listQuery.data?.totalCount ?? '—'} total marketplace inquiries
        </p>
      </div>

      <ListFiltersBar
        filterLabel="Filter by class ID"
        filterValue={classFilter}
        onFilterChange={setClassFilter}
        limit={limit}
        onLimitChange={setLimit}
        onApply={handleApply}
        busy={listQuery.isFetching}
      />

      {listQuery.error ? (
        <p className="mb-4 text-sm text-destructive">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load inquiries.'}
        </p>
      ) : null}

      <DataTable columns={['Lead', 'Class', 'Phone', 'Message', 'Created']}>
        {items.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-3">{item.leadName ?? '—'}</td>
            <td className="px-4 py-3">{item.className ?? item.classId ?? '—'}</td>
            <td className="px-4 py-3">{item.phone ?? '—'}</td>
            <td className="max-w-md truncate px-4 py-3">{item.messagePreview ?? '—'}</td>
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
