'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { fetchAdminInstructorDashboardUsage } from '@/lib/admin-ops-api-client'
import type { AdminInstructor } from '@/lib/admin-types'
import { cn, displayPersonName, formatDate } from '@/utils'

type UsageDays = 7 | 30 | 90

const DAY_OPTIONS: UsageDays[] = [7, 30, 90]

type InstructorDashboardUsagePanelProps = {
  instructor: AdminInstructor | null
  onClose: () => void
}

function UsageTable({
  title,
  headers,
  rows,
  emptyMessage,
}: {
  title: string
  headers: string[]
  rows: React.ReactNode[][]
  emptyMessage: string
}) {
  return (
    <div className="rounded-lg border border-border">
      <p className="border-b border-border px-3 py-2 text-sm font-semibold text-foreground">{title}</p>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells, index) => (
                <tr key={index} className="border-b border-border/60 last:border-0">
                  {cells.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 align-top text-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function InstructorDashboardUsagePanel({
  instructor,
  onClose,
}: InstructorDashboardUsagePanelProps) {
  const [days, setDays] = useState<UsageDays>(30)
  const open = Boolean(instructor)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const usageQuery = useQuery({
    queryKey: ['admin-instructor-dashboard-usage', instructor?.id, days],
    queryFn: () => fetchAdminInstructorDashboardUsage(instructor!.id, days),
    enabled: Boolean(instructor?.id),
  })

  if (!open || !instructor) return null

  const usage = usageQuery.data?.usage
  const maxDaily = Math.max(...(usage?.dailyPageViews.map((point) => point.count) ?? [0]), 1)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-usage-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h3 id="dashboard-usage-title" className="text-lg font-semibold text-foreground">
              Dashboard usage
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {usageQuery.data?.instructor.name || displayPersonName(instructor)}
              {usageQuery.data?.instructor.email ? ` · ${usageQuery.data.instructor.email}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <span className="text-sm text-muted-foreground">Period</span>
          {DAY_OPTIONS.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={days === option ? 'default' : 'outline'}
              onClick={() => setDays(option)}
            >
              {option}d
            </Button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {usageQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : null}

          {usageQuery.error ? (
            <p className="text-sm text-destructive">
              {usageQuery.error instanceof Error
                ? usageQuery.error.message
                : 'Failed to load dashboard usage.'}
            </p>
          ) : null}

          {usage ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Page views
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                    {usage.pageViews.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Last active
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {usage.lastActiveDate ? formatDate(usage.lastActiveDate) : '—'}
                  </p>
                </div>
              </div>

              <UsageTable
                title="Screens visited"
                headers={['Page title', 'Screen', 'Views']}
                emptyMessage="No screen data for this period."
                rows={usage.screens.map((row) => [
                  row.pageTitle || '—',
                  row.screenName,
                  row.count.toLocaleString(),
                ])}
              />

              <UsageTable
                title="Nav clicks"
                headers={['Nav item', 'Clicks']}
                emptyMessage="No nav click data for this period."
                rows={usage.navClicks.map((row) => [row.navItem, row.count.toLocaleString()])}
              />

              <UsageTable
                title="Actions"
                headers={['Action', 'Label', 'Count']}
                emptyMessage="No action data for this period."
                rows={usage.actions.map((row) => [
                  row.action,
                  row.label || '—',
                  row.count.toLocaleString(),
                ])}
              />

              <div className="rounded-lg border border-border">
                <p className="border-b border-border px-3 py-2 text-sm font-semibold text-foreground">
                  Daily page views
                </p>
                {usage.dailyPageViews.every((point) => point.count === 0) ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">No daily activity for this period.</p>
                ) : (
                  <div className="space-y-2 px-3 py-4">
                    {usage.dailyPageViews.map((point) => (
                      <div key={point.date} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{point.date.slice(5)}</span>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className={cn('h-2 rounded-full bg-primary')}
                            style={{ width: `${Math.max((point.count / maxDaily) * 100, point.count > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className="text-right tabular-nums text-foreground">{point.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        <div className="border-t border-border px-5 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
