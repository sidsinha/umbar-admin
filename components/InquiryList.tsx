'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import DataTable from '@/components/DataTable'
import ListFiltersBar from '@/components/ListFiltersBar'
import PaginationControls from '@/components/PaginationControls'
import { fetchAdminCallbackRequests, fetchAdminInquiries } from '@/lib/admin-ops-api-client'
import type { AdminCallbackRequest, AdminInquiry } from '@/lib/admin-types'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import { cn, formatDate } from '@/utils'

type LeadTab = 'inquiries' | 'callbacks'

const TABS: { id: LeadTab; label: string }[] = [
  { id: 'inquiries', label: 'Class enquiries' },
  { id: 'callbacks', label: 'Request a callback' },
]

export default function InquiryList() {
  const [activeTab, setActiveTab] = useState<LeadTab>('inquiries')
  const [classFilter, setClassFilter] = useState('')
  const [appliedClassId, setAppliedClassId] = useState('')
  const { limit, setLimit, currentCursor, resetPaging, goNext, goPrev, hasPrev } =
    useCursorPagination()

  useEffect(() => {
    resetPaging()
  }, [appliedClassId, limit, activeTab, resetPaging])

  const inquiriesQuery = useQuery({
    queryKey: ['admin-inquiries', appliedClassId, limit, currentCursor],
    queryFn: () =>
      fetchAdminInquiries({
        classId: appliedClassId || undefined,
        limit,
        cursor: currentCursor,
      }),
    enabled: activeTab === 'inquiries',
  })

  const callbacksQuery = useQuery({
    queryKey: ['admin-callback-requests', appliedClassId, limit, currentCursor],
    queryFn: () =>
      fetchAdminCallbackRequests({
        classId: appliedClassId || undefined,
        limit,
        cursor: currentCursor,
      }),
    enabled: activeTab === 'callbacks',
  })

  const listQuery = activeTab === 'inquiries' ? inquiriesQuery : callbacksQuery

  function handleApply() {
    setAppliedClassId(classFilter.trim())
    resetPaging()
  }

  function handleTabChange(tab: LeadTab) {
    setActiveTab(tab)
    resetPaging()
  }

  const inquiryItems = (inquiriesQuery.data?.items ?? []) as AdminInquiry[]
  const callbackItems = (callbacksQuery.data?.items ?? []) as AdminCallbackRequest[]
  const subtitle =
    activeTab === 'inquiries'
      ? `${listQuery.data?.totalCount ?? '—'} total class enquiry conversations`
      : `${listQuery.data?.totalCount ?? '—'} total callback requests`

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Inquiries</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
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
          {listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load records.'}
        </p>
      ) : null}

      {activeTab === 'inquiries' ? (
        <DataTable columns={['Lead', 'Class', 'Phone', 'Message', 'Created']}>
          {inquiryItems.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.leadName ?? '—'}</td>
              <td className="px-4 py-3">{item.className ?? item.classId ?? '—'}</td>
              <td className="px-4 py-3">{item.phone ?? '—'}</td>
              <td className="max-w-md truncate px-4 py-3">{item.messagePreview ?? '—'}</td>
              <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <DataTable columns={['Lead', 'Class', 'Phone', 'Message', 'Status', 'Created']}>
          {callbackItems.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.leadName ?? '—'}</td>
              <td className="px-4 py-3">{item.className ?? item.classId ?? '—'}</td>
              <td className="px-4 py-3">{item.phone ?? '—'}</td>
              <td className="max-w-md truncate px-4 py-3">{item.messagePreview ?? '—'}</td>
              <td className="px-4 py-3 capitalize">{item.status ?? '—'}</td>
              <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </DataTable>
      )}

      <PaginationControls
        totalCount={listQuery.data?.totalCount ?? 0}
        pageCount={
          activeTab === 'inquiries' ? inquiryItems.length : callbackItems.length
        }
        hasPrev={hasPrev}
        hasNext={Boolean(listQuery.data?.pagination.hasMore)}
        onPrev={goPrev}
        onNext={() => goNext(listQuery.data?.pagination.nextCursor ?? null)}
      />
    </div>
  )
}
