'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import ConfirmDialog from '@/components/ConfirmDialog'
import DataTable from '@/components/DataTable'
import ListFiltersBar from '@/components/ListFiltersBar'
import PaginationControls from '@/components/PaginationControls'
import { Button } from '@/components/ui/button'
import {
  deleteAdminStudent,
  fetchAdminStudentDeleteImpact,
  fetchAdminStudents,
} from '@/lib/admin-ops-api-client'
import type { AdminStudent, AdminStudentDeleteImpactResponse } from '@/lib/admin-types'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import { cn, displayPersonName, formatDate, statusPillClass } from '@/utils'

function ImpactRow({
  label,
  value,
  warn,
}: {
  label: string
  value: number
  warn?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span>{label}</span>
      <span
        className={cn(
          'font-medium tabular-nums',
          warn && value > 0 ? 'text-destructive' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}

export default function StudentList() {
  const queryClient = useQueryClient()
  const [emailFilter, setEmailFilter] = useState('')
  const [appliedEmail, setAppliedEmail] = useState('')
  const [pendingDelete, setPendingDelete] = useState<AdminStudent | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
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

  const impactQuery = useQuery({
    queryKey: ['admin-student-delete-impact', pendingDelete?.id],
    queryFn: () => fetchAdminStudentDeleteImpact(pendingDelete!.id),
    enabled: Boolean(pendingDelete?.id),
  })

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => deleteAdminStudent(studentId),
    onSuccess: async () => {
      setPendingDelete(null)
      setActionError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-students'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      ])
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : 'Failed to delete student.')
    },
  })

  function handleApply() {
    setAppliedEmail(emailFilter.trim())
    resetPaging()
  }

  function openDeleteDialog(item: AdminStudent) {
    setActionError(null)
    setPendingDelete(item)
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) return
    setPendingDelete(null)
  }

  const items = listQuery.data?.items ?? []
  const impactPayload = impactQuery.data as AdminStudentDeleteImpactResponse | undefined
  const impact = impactPayload?.impact
  const dialogName =
    impactPayload?.student.name || (pendingDelete ? displayPersonName(pendingDelete) : 'this student')

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

      {listQuery.error || actionError ? (
        <p className="mb-4 text-sm text-destructive">
          {actionError ||
            (listQuery.error instanceof Error
              ? listQuery.error.message
              : 'Failed to load students.')}
        </p>
      ) : null}

      <DataTable
        columns={['Name', 'Phone', 'Gender', 'Status', 'Enrollments', 'Created', 'Actions']}
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
            <td className="px-4 py-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => openDeleteDialog(item)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </td>
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete student?"
        confirming={deleteMutation.isPending}
        confirmDisabled={!impact || impactQuery.isError || impactQuery.isLoading}
        onCancel={closeDeleteDialog}
        onConfirm={() => {
          if (!pendingDelete) return
          setActionError(null)
          deleteMutation.mutate(pendingDelete.id)
        }}
      >
        <p className="text-foreground">
          This permanently deletes <span className="font-medium">{dialogName}</span>
          {impactPayload?.student.email ? (
            <>
              {' '}
              (<span className="font-medium">{impactPayload.student.email}</span>)
            </>
          ) : null}{' '}
          and all related enrollments and activity. This cannot be undone.
        </p>

        <div className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2">
          {impactQuery.isLoading ? (
            <p>Loading related data…</p>
          ) : impactQuery.isError ? (
            <div className="space-y-2">
              <p className="text-destructive">
                {impactQuery.error instanceof Error
                  ? impactQuery.error.message
                  : 'Failed to load delete impact.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void impactQuery.refetch()}
                disabled={impactQuery.isFetching}
              >
                Retry
              </Button>
            </div>
          ) : impact ? (
            <div>
              <p className="mb-1 font-medium text-foreground">What will be deleted</p>
              <ImpactRow label="Active enrollments" value={impact.enrollmentsActive} warn />
              <ImpactRow label="Total enrollments" value={impact.enrollmentsTotal} warn />
              <ImpactRow label="Trial sessions" value={impact.trialSessions} />
              <ImpactRow label="Join requests" value={impact.joinRequests} />
              <ImpactRow label="Cancellation requests" value={impact.cancellationRequests} />
              <ImpactRow label="Class interests" value={impact.classInterests} />
              <ImpactRow label="Conversations" value={impact.conversations} />
              <ImpactRow label="Attendance records" value={impact.attendanceRecords} warn />
              <ImpactRow label="Ratings given" value={impact.ratingsGiven} />
              <ImpactRow label="Pending invitations" value={impact.pendingInvitations} />
            </div>
          ) : null}
        </div>
      </ConfirmDialog>
    </div>
  )
}
