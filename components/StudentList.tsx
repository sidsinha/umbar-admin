'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import DataTable from '@/components/DataTable'
import ListFiltersBar from '@/components/ListFiltersBar'
import PaginationControls from '@/components/PaginationControls'
import { fetchAdminStudents } from '@/lib/admin-ops-api-client'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import { displayPersonName, formatDate, statusPillClass } from '@/utils'

export default function StudentList() {
  const [emailFilter, setEmailFilter] = useState('')
  const [appliedEmail, setAppliedEmail] = useState('')
  const { limit, setLimit, currentCursor, resetPaging, goNext, goPrev, hasPrev } =
    useCursorPagination()

  useEffect(() => {
    resetPaging()
  }, [appliedEmail, limit, resetPaging])

  const listQuery = useQuery({
    queryKey: ['admin-students', appliedEmail, limit, currentCursor],
    queryFn: () =>
      fetchAdminStudents({
        email: appliedEmail || undefined,
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
        <h2 className="text-2xl font-semibold text-foreground">Students</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {listQuery.data?.totalCount ?? '—'} total students
        </p>
      </div>

      <ListFiltersBar
        filterLabel="Filter by email"
        filterValue={emailFilter}
        onFilterChange={setEmailFilter}
        limit={limit}
        onLimitChange={setLimit}
        onApply={handleApply}
        busy={listQuery.isFetching}
      />

      {listQuery.error ? (
        <p className="mb-4 text-sm text-destructive">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load students.'}
        </p>
      ) : null}

      <DataTable
        columns={['Name', 'Phone', 'Gender', 'Status', 'Enrollments', 'Created']}
      >
        {items.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-3">{displayPersonName(item)}</td>
            <td className="px-4 py-3">{item.phoneNumber ?? '—'}</td>
            <td className="px-4 py-3 capitalize">{item.gender ?? '—'}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusPillClass(item.isActive)}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-4 py-3">{item.currentEnrollments}</td>
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
