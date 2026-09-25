'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Users,
} from 'lucide-react'

import DashboardRegistrationChart from '@/components/DashboardRegistrationChart'
import { Button } from '@/components/ui/button'
import { fetchAdminStats } from '@/lib/admin-ops-api-client'
import type { AdminStats } from '@/lib/admin-types'
import { cn, formatDate } from '@/utils'

type CardMetric = {
  label: string
  value: string | number
}

type StatsCard = {
  key: string
  title: string
  href: string
  icon: typeof Users
  iconClassName: string
  total: (stats: AdminStats) => number
  metrics: (stats: AdminStats) => CardMetric[]
}

const CARDS: StatsCard[] = [
  {
    key: 'instructors',
    title: 'Instructors',
    href: '/instructors/',
    icon: Users,
    iconClassName: 'bg-secondary text-secondary-foreground',
    total: (stats) => stats.instructors.total,
    metrics: (stats) => [
      { label: 'active', value: stats.instructors.active },
      { label: 'inactive', value: stats.instructors.inactive },
      {
        label: 'used dashboard (7d)',
        value: stats.dashboardUsage?.activeInstructors7d ?? 0,
      },
    ],
  },
  {
    key: 'classes',
    title: 'Classes',
    href: '/classes/',
    icon: BookOpen,
    iconClassName: 'bg-accent/15 text-accent',
    total: (stats) => stats.classes.total,
    metrics: (stats) => [
      { label: 'active', value: stats.classes.active },
      { label: 'completed', value: stats.classes.completed },
      { label: 'archived', value: stats.classes.archived },
    ],
  },
  {
    key: 'students',
    title: 'Students',
    href: '/students/',
    icon: GraduationCap,
    iconClassName: 'bg-muted text-foreground',
    total: (stats) => stats.students.total,
    metrics: (stats) => [
      { label: 'active', value: stats.students.active },
      { label: 'inactive', value: stats.students.inactive },
    ],
  },
  {
    key: 'inquiries',
    title: 'Inquiries',
    href: '/inquiries/',
    icon: MessageSquare,
    iconClassName: 'bg-primary/8 text-primary',
    total: (stats) =>
      (stats.callbackRequests?.total ?? 0) + stats.inquiries.total,
    metrics: (stats) => [
      { label: 'callbacks (7d)', value: stats.callbackRequests?.last7Days ?? 0 },
      { label: 'class enquiries (7d)', value: stats.inquiries.last7Days },
    ],
  },
  {
    key: 'instructor-dashboard',
    title: 'Instructor dashboard',
    href: '/instructors/',
    icon: LayoutDashboard,
    iconClassName: 'bg-accent/25 text-accent-foreground',
    total: (stats) => stats.dashboardUsage?.activeInstructors7d ?? 0,
    metrics: (stats) => [
      {
        label: 'page views (7d)',
        value: (stats.dashboardUsage?.pageViews7d ?? 0).toLocaleString(),
      },
    ],
  },
]

const CARD_GRID_CLASS = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'

function StatCard({
  title,
  href,
  icon: Icon,
  iconClassName,
  total,
  metrics,
}: {
  title: string
  href: string
  icon: typeof Users
  iconClassName: string
  total: number
  metrics: CardMetric[]
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex min-h-[11.5rem] flex-col rounded-xl border border-border bg-card p-5 shadow-sm',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-snug text-muted-foreground">{title}</p>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
            iconClassName,
          )}
        >
          <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums text-foreground">
        {total.toLocaleString()}
      </p>

      <ul className="mt-3 space-y-1">
        {metrics.map((metric) => (
          <li key={metric.label} className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
            </span>{' '}
            {metric.label}
          </li>
        ))}
      </ul>

      <p className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-accent transition-colors group-hover:text-accent/80">
        View all
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        />
      </p>
    </Link>
  )
}

const TREND_DAY_OPTIONS = [7, 30, 90] as const

function RegistrationTrendsSection({
  stats,
  trendDays,
  onTrendDaysChange,
  isFetching,
}: {
  stats: AdminStats
  trendDays: number
  onTrendDaysChange: (days: number) => void
  isFetching: boolean
}) {
  const trends = stats.registrationTrends

  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Registrations</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            New sign-ups per day (UTC)
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Period</span>
          <select
            value={trendDays}
            onChange={(event) => onTrendDaysChange(Number(event.target.value))}
            disabled={isFetching}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {TREND_DAY_OPTIONS.map((days) => (
              <option key={days} value={days}>
                Last {days} days
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardRegistrationChart
          title="Instructors"
          data={trends?.instructors ?? []}
          color="#2d3748"
        />
        <DashboardRegistrationChart
          title="Classes"
          data={trends?.classes ?? []}
          color="#d4a853"
        />
        <DashboardRegistrationChart
          title="Students"
          data={trends?.students ?? []}
          color="#64748b"
        />
      </div>
    </section>
  )
}

function formatAdoption(stats: AdminStats): string {
  const active = stats.dashboardUsage?.activeInstructors7d ?? 0
  const activeInstructors = stats.instructors.active
  if (activeInstructors <= 0) return '—'
  const percent = Math.round((active / activeInstructors) * 100)
  return `${active} of ${activeInstructors} active instructors (${percent}%)`
}

function formatScreenLabel(screenName: string): string {
  return screenName.replace(/_/g, ' ')
}

function DashboardUsageSummary({ stats }: { stats: AdminStats }) {
  const active = stats.dashboardUsage?.activeInstructors7d ?? 0
  const pageViews = stats.dashboardUsage?.pageViews7d ?? 0
  const navClicks = stats.dashboardUsage?.navClicks7d ?? 0
  const actions = stats.dashboardUsage?.actions7d ?? 0
  const aiGenerateClicks = stats.dashboardUsage?.aiGenerateClicks7d ?? 0
  const instructors = stats.dashboardUsage?.instructors ?? []
  const instructorIdentitiesAvailable =
    stats.dashboardUsage?.instructorIdentitiesAvailable ?? false
  const screens = (stats.dashboardUsage?.screens ?? []).slice(0, 10)
  const navItems = stats.dashboardUsage?.navItems ?? []
  const actionItems = stats.dashboardUsage?.actionItems ?? []
  const maxScreenViews = Math.max(...screens.map((row) => row.count), 1)
  const maxNavClicks = Math.max(...navItems.map((row) => row.count), 1)
  const maxActions = Math.max(...actionItems.map((row) => row.count), 1)

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">
        Instructor dashboard usage (last 7 days)
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active instructors
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {active.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Page views
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {pageViews.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nav clicks
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {navClicks.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Button / actions
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {actions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            AI generate clicks
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {aiGenerateClicks.toLocaleString()}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-foreground">
        Adoption: <span className="font-medium">{formatAdoption(stats)}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Source: GA4 instructor dashboard events · cached ~1h
      </p>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-foreground">Active instructors</h4>
        {instructors.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {!instructorIdentitiesAvailable && pageViews > 0
              ? 'Page views are tracked, but instructor names need GA4 User-ID reporting enabled (Admin → Data display → Reporting identity). After enabling, instructors must sign in again so events include their user ID.'
              : active > 0
                ? 'Instructor names are not available yet. Enable User-ID reporting in GA4 Admin if this persists.'
                : 'No instructors used the dashboard in this period.'}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium text-right">Views (7d)</th>
                  <th className="px-3 py-2 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((row) => (
                  <tr key={row.instructorId} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href="/instructors/"
                        className="font-medium text-foreground hover:text-accent hover:underline"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {row.pageViews.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.lastActiveDate ? formatDate(row.lastActiveDate) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-foreground">Nav clicks</h4>
        {navItems.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No nav clicks in this period yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Nav item</th>
                  <th className="px-3 py-2 font-medium text-right">Clicks</th>
                  <th className="hidden w-40 px-3 py-2 font-medium sm:table-cell">Share</th>
                </tr>
              </thead>
              <tbody>
                {navItems.map((row) => (
                  <tr key={row.navItem} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 text-foreground">{row.navItem}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {row.count.toLocaleString()}
                    </td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={cn('h-2 rounded-full bg-primary')}
                          style={{
                            width: `${Math.max((row.count / maxNavClicks) * 100, row.count > 0 ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-foreground">Button &amp; actions</h4>
        {actionItems.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No action events in this period yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium text-right">Count</th>
                  <th className="hidden w-40 px-3 py-2 font-medium sm:table-cell">Share</th>
                </tr>
              </thead>
              <tbody>
                {actionItems.map((row) => (
                  <tr key={row.action} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 capitalize text-foreground">{row.action}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {row.count.toLocaleString()}
                    </td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={cn('h-2 rounded-full bg-primary')}
                          style={{
                            width: `${Math.max((row.count / maxActions) * 100, row.count > 0 ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-foreground">Views by page</h4>
        {screens.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No page views in this period yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Page title</th>
                  <th className="px-3 py-2 font-medium">Screen</th>
                  <th className="px-3 py-2 font-medium text-right">Views</th>
                  <th className="hidden w-40 px-3 py-2 font-medium sm:table-cell">Share</th>
                </tr>
              </thead>
              <tbody>
                {screens.map((row) => {
                  const title = row.pageTitle || formatScreenLabel(row.screenName)
                  return (
                    <tr key={`${row.screenName}-${row.pageTitle}`} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 text-foreground">{title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.screenName}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">
                        {row.count.toLocaleString()}
                      </td>
                      <td className="hidden px-3 py-2 sm:table-cell">
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className={cn('h-2 rounded-full bg-primary')}
                            style={{
                              width: `${Math.max((row.count / maxScreenViews) * 100, row.count > 0 ? 4 : 0)}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link href="/instructors/" className="inline-flex items-center gap-1">
          View instructors
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </section>
  )
}

export default function Dashboard() {
  const [trendDays, setTrendDays] = useState(30)

  const statsQuery = useQuery({
    queryKey: ['admin-stats', trendDays],
    queryFn: () => fetchAdminStats({ days: trendDays }),
  })

  const skeletonCount = CARDS.length

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Umbar platform overview</p>
      </div>

      {statsQuery.isLoading ? (
        <div className={CARD_GRID_CLASS}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <div
              key={index}
              className="min-h-[11.5rem] animate-pulse rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-9 w-9 rounded-lg bg-muted" />
              </div>
              <div className="mt-4 h-9 w-16 rounded bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {statsQuery.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {statsQuery.error instanceof Error ? statsQuery.error.message : 'Failed to load stats.'}
        </p>
      ) : null}

      {statsQuery.data ? (
        <>
          <div className={CARD_GRID_CLASS}>
            {CARDS.map(({ key, title, href, icon, iconClassName, total, metrics }) => (
              <StatCard
                key={key}
                title={title}
                href={href}
                icon={icon}
                iconClassName={iconClassName}
                total={total(statsQuery.data.stats)}
                metrics={metrics(statsQuery.data.stats)}
              />
            ))}
          </div>

          <RegistrationTrendsSection
            stats={statsQuery.data.stats}
            trendDays={trendDays}
            onTrendDaysChange={setTrendDays}
            isFetching={statsQuery.isFetching}
          />

          <DashboardUsageSummary stats={statsQuery.data.stats} />
        </>
      ) : null}
    </div>
  )
}
