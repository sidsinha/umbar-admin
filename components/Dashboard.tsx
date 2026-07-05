'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpen, GraduationCap, MessageSquare, Users } from 'lucide-react'

import { fetchAdminStats } from '@/lib/admin-ops-api-client'
import { cn } from '@/utils'

const CARDS = [
  {
    key: 'instructors' as const,
    title: 'Instructors',
    href: '/instructors/',
    icon: Users,
    detail: (stats: Awaited<ReturnType<typeof fetchAdminStats>>['stats']) =>
      `${stats.instructors.active} active · ${stats.instructors.inactive} inactive`,
  },
  {
    key: 'classes' as const,
    title: 'Classes',
    href: '/classes/',
    icon: BookOpen,
    detail: (stats: Awaited<ReturnType<typeof fetchAdminStats>>['stats']) =>
      `${stats.classes.active} active · ${stats.classes.completed} completed · ${stats.classes.archived} archived`,
  },
  {
    key: 'students' as const,
    title: 'Students',
    href: '/students/',
    icon: GraduationCap,
    detail: (stats: Awaited<ReturnType<typeof fetchAdminStats>>['stats']) =>
      `${stats.students.active} active · ${stats.students.inactive} inactive`,
  },
  {
    key: 'inquiries' as const,
    title: 'Inquiries',
    href: '/inquiries/',
    icon: MessageSquare,
    detail: (stats: Awaited<ReturnType<typeof fetchAdminStats>>['stats']) =>
      `${stats.inquiries.last7Days} in the last 7 days`,
  },
]

export default function Dashboard() {
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
  })

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Umbar platform overview</p>
      </div>

      {statsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CARDS.map((card) => (
            <div key={card.key} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : null}

      {statsQuery.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {statsQuery.error instanceof Error ? statsQuery.error.message : 'Failed to load stats.'}
        </p>
      ) : null}

      {statsQuery.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CARDS.map(({ key, title, href, icon: Icon, detail }) => {
            const total =
              key === 'instructors'
                ? statsQuery.data.stats.instructors.total
                : key === 'classes'
                  ? statsQuery.data.stats.classes.total
                  : key === 'students'
                    ? statsQuery.data.stats.students.total
                    : statsQuery.data.stats.inquiries.total

            return (
              <Link
                key={key}
                href={href}
                className={cn(
                  'group rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-accent/40 hover:bg-secondary/30',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">{total}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {detail(statsQuery.data.stats)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary p-2 text-secondary-foreground">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                </div>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:underline">
                  View all
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </p>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
