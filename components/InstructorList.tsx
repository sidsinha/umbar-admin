'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import ConfirmDialog from '@/components/ConfirmDialog'
import DataTable from '@/components/DataTable'
import InstructorDashboardUsagePanel from '@/components/InstructorDashboardUsagePanel'
import InstructorFiltersBar, {
  type InstructorTypeFilter,
  type SignupSourceFilter,
} from '@/components/InstructorFiltersBar'
import InstructorTypeToggle from '@/components/InstructorTypeToggle'
import PaginationControls from '@/components/PaginationControls'
import { Button } from '@/components/ui/button'
import {
  deleteAdminInstructor,
  fetchAdminInstructorDeleteImpact,
  fetchAdminInstructorSignupCities,
  fetchAdminInstructors,
  setAdminInstructorType,
} from '@/lib/admin-ops-api-client'
import type { AdminInstructor, AdminInstructorDeleteImpactResponse } from '@/lib/admin-types'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import {
  cn,
  displayPersonName,
  formatDate,
  formatSignupGeo,
  formatSignupSource,
  statusPillClass,
} from '@/utils'

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

export default function InstructorList() {
  const queryClient = useQueryClient()
  const [nameFilter, setNameFilter] = useState('')
  const [appliedName, setAppliedName] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')
  const [appliedPhone, setAppliedPhone] = useState('')
  const [instructorTypeFilter, setInstructorTypeFilter] = useState<InstructorTypeFilter>('')
  const [appliedInstructorType, setAppliedInstructorType] = useState<InstructorTypeFilter>('')
  const [signupSourceFilter, setSignupSourceFilter] = useState<SignupSourceFilter>('')
  const [appliedSignupSource, setAppliedSignupSource] = useState<SignupSourceFilter>('')
  const [signupLocationFilter, setSignupLocationFilter] = useState('')
  const [appliedSignupLocation, setAppliedSignupLocation] = useState('')
  const [pendingDelete, setPendingDelete] = useState<AdminInstructor | null>(null)
  const [usageInstructor, setUsageInstructor] = useState<AdminInstructor | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [togglingInstructorId, setTogglingInstructorId] = useState<string | null>(null)
  const { limit, setLimit, currentCursor, resetPaging, goNext, goPrev, hasPrev } =
    useCursorPagination(200)

  useEffect(() => {
    resetPaging()
  }, [appliedName, appliedPhone, appliedInstructorType, appliedSignupSource, appliedSignupLocation, limit, resetPaging])

  const listQuery = useQuery({
    queryKey: [
      'admin-instructors',
      appliedName,
      appliedPhone,
      appliedInstructorType,
      appliedSignupSource,
      appliedSignupLocation,
      limit,
      currentCursor,
    ],
    queryFn: () =>
      fetchAdminInstructors({
        name: appliedName || undefined,
        phone: appliedPhone || undefined,
        instructorType: appliedInstructorType || undefined,
        signupSource: appliedSignupSource || undefined,
        signupLocation: appliedSignupLocation || undefined,
        limit,
        cursor: currentCursor,
      }),
  })

  const citiesQuery = useQuery({
    queryKey: ['admin-instructor-signup-cities'],
    queryFn: async () => {
      const result = await fetchAdminInstructorSignupCities()
      return result.cities
    },
  })

  const impactQuery = useQuery({
    queryKey: ['admin-instructor-delete-impact', pendingDelete?.id],
    queryFn: () => fetchAdminInstructorDeleteImpact(pendingDelete!.id),
    enabled: Boolean(pendingDelete?.id),
  })

  const deleteMutation = useMutation({
    mutationFn: (instructorId: string) => deleteAdminInstructor(instructorId),
    onSuccess: async () => {
      setPendingDelete(null)
      setActionError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-instructors'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      ])
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : 'Failed to delete instructor.')
    },
  })

  const instructorTypeMutation = useMutation({
    mutationFn: ({
      instructorId,
      instructorType,
    }: {
      instructorId: string
      instructorType: 'individual' | 'academy'
    }) => setAdminInstructorType(instructorId, instructorType),
    onMutate: ({ instructorId }) => {
      setTogglingInstructorId(instructorId)
      setActionError(null)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-instructors'] })
    },
    onError: (error) => {
      setActionError(
        error instanceof Error ? error.message : 'Failed to update instructor type.',
      )
    },
    onSettled: () => {
      setTogglingInstructorId(null)
    },
  })

  function handleApply() {
    setAppliedName(nameFilter.trim())
    setAppliedPhone(phoneFilter.trim())
    setAppliedInstructorType(instructorTypeFilter)
    setAppliedSignupSource(signupSourceFilter)
    setAppliedSignupLocation(signupLocationFilter.trim())
    resetPaging()
  }

  function openDeleteDialog(item: AdminInstructor) {
    setActionError(null)
    setPendingDelete(item)
  }

  function handleInstructorTypeChange(
    item: AdminInstructor,
    instructorType: 'individual' | 'academy',
  ) {
    const current = item.instructorType === 'academy' ? 'academy' : 'individual'
    if (instructorType === current) return
    instructorTypeMutation.mutate({ instructorId: item.id, instructorType })
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) return
    setPendingDelete(null)
  }

  const items = listQuery.data?.items ?? []
  const impactPayload = impactQuery.data as AdminInstructorDeleteImpactResponse | undefined
  const impact = impactPayload?.impact
  const dialogName =
    impactPayload?.instructor.name ||
    (pendingDelete ? displayPersonName(pendingDelete) : 'this instructor')

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Instructors</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {listQuery.data?.totalCount ?? '—'} total instructors
        </p>
      </div>

      <InstructorFiltersBar
        name={nameFilter}
        onNameChange={setNameFilter}
        phone={phoneFilter}
        onPhoneChange={setPhoneFilter}
        instructorType={instructorTypeFilter}
        onInstructorTypeChange={setInstructorTypeFilter}
        signupSource={signupSourceFilter}
        onSignupSourceChange={setSignupSourceFilter}
        signupLocation={signupLocationFilter}
        onSignupLocationChange={setSignupLocationFilter}
        signupCities={citiesQuery.data ?? []}
        citiesLoading={citiesQuery.isLoading}
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
              : 'Failed to load instructors.')}
        </p>
      ) : null}

      <DataTable
        columns={[
          'Name',
          'Type',
          'Phone',
          'Source',
          'Signup location',
          'Gender',
          'Status',
          'Active classes',
          'Dashboard views',
          'Last active',
          'Subjects',
          'Created',
          'Actions',
        ]}
      >
        {items.map((item) => {
          const isTogglingType = togglingInstructorId === item.id
          const instructorType = item.instructorType === 'academy' ? 'academy' : 'individual'

          return (
          <tr key={item.id}>
            <td className="px-4 py-3">
              <div className="flex flex-col gap-1">
                <span>{displayPersonName(item)}</span>
                <Link
                  href={`/classes/create/?instructorId=${encodeURIComponent(item.id)}`}
                  className="text-xs text-primary hover:underline"
                >
                  Create class
                </Link>
              </div>
            </td>
            <td className="px-4 py-3">
              <InstructorTypeToggle
                value={instructorType}
                disabled={isTogglingType}
                onChange={(next) => handleInstructorTypeChange(item, next)}
              />
            </td>
            <td className="px-4 py-3">{item.phoneNumber ?? '—'}</td>
            <td className="px-4 py-3">{formatSignupSource(item.signupSource)}</td>
            <td className="px-4 py-3">{formatSignupGeo(item.signupGeo)}</td>
            <td className="px-4 py-3 capitalize">{item.gender ?? '—'}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusPillClass(item.isActive)}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-4 py-3">{item.activeClasses}</td>
            <td className="px-4 py-3" title="GA4 dashboard_page_view events (last 30 days)">
              {(item.dashboardPageViews30d ?? 0).toLocaleString()}
            </td>
            <td className="px-4 py-3">
              {item.lastDashboardVisitAt ? formatDate(item.lastDashboardVisitAt) : '—'}
            </td>
            <td className="px-4 py-3">
              {item.activeClassSubjects?.length ? item.activeClassSubjects.join(', ') : '—'}
            </td>
            <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUsageInstructor(item)}
                >
                  Stats
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog(item)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
          )
        })}
      </DataTable>

      <PaginationControls
        totalCount={listQuery.data?.totalCount ?? 0}
        pageCount={items.length}
        hasPrev={hasPrev}
        hasNext={Boolean(listQuery.data?.pagination.hasMore)}
        onPrev={goPrev}
        onNext={() => goNext(listQuery.data?.pagination.nextCursor ?? null)}
      />

      <InstructorDashboardUsagePanel
        instructor={usageInstructor}
        onClose={() => setUsageInstructor(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete instructor?"
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
          {impactPayload?.instructor.email ? (
            <>
              {' '}
              (<span className="font-medium">{impactPayload.instructor.email}</span>)
            </>
          ) : null}{' '}
          and all related data. This cannot be undone.
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
              <ImpactRow label="Active classes" value={impact.classesActive} warn />
              <ImpactRow label="Completed classes" value={impact.classesCompleted} />
              <ImpactRow label="Archived classes" value={impact.classesArchived} />
              <ImpactRow label="Total classes" value={impact.classesTotal} warn />
              <ImpactRow label="Enrollments" value={impact.enrollments} warn />
              <ImpactRow label="Attendance records" value={impact.attendanceRecords} warn />
              <ImpactRow label="Conversations" value={impact.conversations} />
              <ImpactRow label="Ratings" value={impact.ratings} />
            </div>
          ) : null}
        </div>
      </ConfirmDialog>
    </div>
  )
}
