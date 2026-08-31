'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import ClassEditDialog from '@/components/classes/ClassEditDialog'
import DataTable from '@/components/DataTable'
import ListFiltersBar from '@/components/ListFiltersBar'
import PaginationControls from '@/components/PaginationControls'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  fetchAdminClasses,
  setAdminClassMarketplaceVisibility,
} from '@/lib/admin-ops-api-client'
import type { AdminClass } from '@/lib/admin-types'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import { cn, formatClassCreatedFrom, formatDate } from '@/utils'

function canToggleMarketplace(status: string): boolean {
  return status === 'active' || status === 'disabled'
}

function formatClassStatus(status: string): string {
  if (status === 'active') return 'Active'
  if (status === 'disabled') return 'Disabled'
  if (status === 'completed') return 'Completed'
  return status
}

export default function ClassList() {
  const queryClient = useQueryClient()
  const [classNameFilter, setClassNameFilter] = useState('')
  const [appliedClassName, setAppliedClassName] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')
  const [appliedPhone, setAppliedPhone] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [togglingClassId, setTogglingClassId] = useState<string | null>(null)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const { limit, setLimit, currentCursor, resetPaging, goNext, goPrev, hasPrev } =
    useCursorPagination()

  useEffect(() => {
    resetPaging()
  }, [appliedClassName, appliedPhone, limit, resetPaging])

  const listQuery = useQuery({
    queryKey: ['admin-classes', appliedClassName, appliedPhone, limit, currentCursor],
    queryFn: () =>
      fetchAdminClasses({
        className: appliedClassName || undefined,
        instructorPhone: appliedPhone || undefined,
        limit,
        cursor: currentCursor,
      }),
  })

  const visibilityMutation = useMutation({
    mutationFn: ({ classId, enabled }: { classId: string; enabled: boolean }) =>
      setAdminClassMarketplaceVisibility(classId, enabled),
    onMutate: ({ classId }) => {
      setTogglingClassId(classId)
      setActionError(null)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-classes'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      ])
    },
    onError: (error) => {
      setActionError(
        error instanceof Error ? error.message : 'Failed to update marketplace visibility.',
      )
    },
    onSettled: () => {
      setTogglingClassId(null)
    },
  })

  function handleApply() {
    setAppliedClassName(classNameFilter.trim())
    setAppliedPhone(phoneFilter.trim())
    resetPaging()
  }

  function handleToggle(item: AdminClass, enabled: boolean) {
    if (!canToggleMarketplace(item.status)) return
    visibilityMutation.mutate({ classId: item.id, enabled })
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
        filterLabel="Filter by class name"
        filterValue={classNameFilter}
        onFilterChange={setClassNameFilter}
        filterPlaceholder="Class name…"
        secondaryFilterLabel="Filter by instructor phone"
        secondaryFilterValue={phoneFilter}
        onSecondaryFilterChange={setPhoneFilter}
        secondaryFilterPlaceholder="Instructor phone…"
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

      {actionError ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <DataTable
        columns={[
          'Name',
          'Instructor',
          'Category',
          'Enrolled',
          'Views',
          'Marketplace',
          'Status',
          'Created from',
          'Created',
          'Actions',
        ]}
      >
        {items.map((item) => {
          const isToggling = togglingClassId === item.id
          const toggleable = canToggleMarketplace(item.status)
          const isEnabled = item.status === 'active'

          return (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.name}</td>
              <td className="px-4 py-3">{item.instructorName ?? '—'}</td>
              <td className="px-4 py-3">{item.category ?? '—'}</td>
              <td className="px-4 py-3">{item.currentEnrollments}</td>
              <td className="px-4 py-3" title="GA4 page views (lifetime)">
                {(item.gaPageViewCount ?? 0).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {isToggling ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                  ) : null}
                  <Switch
                    id={`marketplace-${item.id}`}
                    checked={isEnabled}
                    disabled={!toggleable || isToggling || visibilityMutation.isPending}
                    onCheckedChange={(enabled) => handleToggle(item, enabled)}
                    aria-label={`${isEnabled ? 'Hide' : 'Show'} ${item.name} on marketplace`}
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    item.status === 'active' && 'bg-emerald-100 text-emerald-900',
                    item.status === 'disabled' && 'bg-muted text-muted-foreground',
                    item.status === 'completed' && 'bg-amber-100 text-amber-900',
                  )}
                >
                  {formatClassStatus(item.status)}
                </span>
              </td>
              <td className="px-4 py-3">{formatClassCreatedFrom(item.createdFrom)}</td>
              <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
              <td className="px-4 py-3">
                <Button variant="outline" size="sm" onClick={() => setEditingClassId(item.id)}>
                  Edit
                </Button>
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

      <ClassEditDialog classId={editingClassId} onClose={() => setEditingClassId(null)} />
    </div>
  )
}
