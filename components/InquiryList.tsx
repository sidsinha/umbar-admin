'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import ConfirmDialog from '@/components/ConfirmDialog'
import DataTable from '@/components/DataTable'
import ListFiltersBar from '@/components/ListFiltersBar'
import PaginationControls from '@/components/PaginationControls'
import { Button } from '@/components/ui/button'
import {
  deleteAdminCallbackRequest,
  deleteAdminInquiry,
  fetchAdminCallbackRequests,
  fetchAdminInquiries,
} from '@/lib/admin-ops-api-client'
import { umbarClassPublicUrl } from '@/lib/config'
import type { AdminCallbackRequest, AdminInquiry } from '@/lib/admin-types'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import { cn, formatDate } from '@/utils'

type LeadTab = 'inquiries' | 'callbacks'

type PendingLeadDelete =
  | { kind: 'inquiries'; item: AdminInquiry }
  | { kind: 'callbacks'; item: AdminCallbackRequest }

const TABS: { id: LeadTab; label: string }[] = [
  { id: 'callbacks', label: 'Request a callback' },
  { id: 'inquiries', label: 'Class enquiries' },
]

function leadDisplayName(item: AdminInquiry | AdminCallbackRequest): string {
  return item.leadName?.trim() || 'this lead'
}

export default function InquiryList() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<LeadTab>('callbacks')
  const [classFilter, setClassFilter] = useState('')
  const [appliedClassId, setAppliedClassId] = useState('')
  const [pendingDelete, setPendingDelete] = useState<PendingLeadDelete | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
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

  const deleteMutation = useMutation({
    mutationFn: async (target: PendingLeadDelete) => {
      if (target.kind === 'inquiries') {
        return deleteAdminInquiry(target.item.id)
      }
      return deleteAdminCallbackRequest(target.item.id)
    },
    onSuccess: async () => {
      setPendingDelete(null)
      setActionError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-callback-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      ])
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : 'Failed to delete record.')
    },
  })

  function handleApply() {
    setAppliedClassId(classFilter.trim())
    resetPaging()
  }

  function handleTabChange(tab: LeadTab) {
    setActiveTab(tab)
    resetPaging()
  }

  function openDeleteDialog(target: PendingLeadDelete) {
    setActionError(null)
    setPendingDelete(target)
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) return
    setPendingDelete(null)
  }

  const inquiryItems = (inquiriesQuery.data?.items ?? []) as AdminInquiry[]
  const callbackItems = (callbacksQuery.data?.items ?? []) as AdminCallbackRequest[]
  const subtitle =
    activeTab === 'inquiries'
      ? `${listQuery.data?.totalCount ?? '—'} total class enquiry conversations`
      : `${listQuery.data?.totalCount ?? '—'} total callback requests`

  const deleteTitle =
    pendingDelete?.kind === 'callbacks' ? 'Delete callback request?' : 'Delete class enquiry?'

  const deleteDescription =
    pendingDelete?.kind === 'callbacks' ? (
      <>
        This permanently removes the callback request from{' '}
        <span className="font-medium">{leadDisplayName(pendingDelete.item)}</span>
        {pendingDelete.item.className ? (
          <>
            {' '}
            for class <span className="font-medium">{pendingDelete.item.className}</span>
          </>
        ) : null}
        . This cannot be undone.
      </>
    ) : pendingDelete?.kind === 'inquiries' ? (
      <>
        This permanently deletes the enquiry conversation with{' '}
        <span className="font-medium">{leadDisplayName(pendingDelete.item)}</span>
        {pendingDelete.item.className ? (
          <>
            {' '}
            for class <span className="font-medium">{pendingDelete.item.className}</span>
          </>
        ) : null}{' '}
        including all messages. This cannot be undone.
      </>
    ) : null

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

      {listQuery.error || actionError ? (
        <p className="mb-4 text-sm text-destructive">
          {actionError ||
            (listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load records.')}
        </p>
      ) : null}

      {activeTab === 'inquiries' ? (
        <DataTable columns={['Lead', 'Class', 'Phone', 'Message', 'Created', 'Actions']}>
          {inquiryItems.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.leadName ?? '—'}</td>
              <td className="px-4 py-3">
                {item.classId ? (
                  <a
                    href={umbarClassPublicUrl(item.classId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {item.className ?? item.classId}
                  </a>
                ) : (
                  (item.className ?? '—')
                )}
              </td>
              <td className="px-4 py-3">{item.phone ?? '—'}</td>
              <td className="max-w-md px-4 py-3">
                {item.id ? (
                  <Link
                    href={`/inquiries/conversation/?id=${encodeURIComponent(item.id)}`}
                    className="block truncate text-primary hover:underline"
                    title={item.messagePreview ?? 'View conversation'}
                  >
                    {item.messagePreview?.trim() ? item.messagePreview : 'View conversation'}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
              <td className="px-4 py-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog({ kind: 'inquiries', item })}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <DataTable columns={['Lead', 'Class', 'Instructor', 'Phone', 'Status', 'Created', 'Actions']}>
          {callbackItems.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.leadName ?? '—'}</td>
              <td className="px-4 py-3">
                {item.classId ? (
                  <a
                    href={umbarClassPublicUrl(item.classId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {item.className ?? item.classId}
                  </a>
                ) : (
                  (item.className ?? '—')
                )}
              </td>
              <td className="px-4 py-3">{item.instructorName ?? '—'}</td>
              <td className="px-4 py-3">{item.phone ?? '—'}</td>
              <td className="px-4 py-3 capitalize">{item.status ?? '—'}</td>
              <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
              <td className="px-4 py-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog({ kind: 'callbacks', item })}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </td>
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={deleteTitle}
        confirming={deleteMutation.isPending}
        onCancel={closeDeleteDialog}
        onConfirm={() => {
          if (!pendingDelete) return
          setActionError(null)
          deleteMutation.mutate(pendingDelete)
        }}
      >
        <p className="text-foreground">{deleteDescription}</p>
      </ConfirmDialog>
    </div>
  )
}
