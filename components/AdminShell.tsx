'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, MessageSquare, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utils'
import { useAuth } from '@/providers/AuthProvider'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instructors/', label: 'Instructors', icon: Users },
  { href: '/classes/', label: 'Classes', icon: BookOpen },
  { href: '/students/', label: 'Students', icon: GraduationCap },
  { href: '/inquiries/', label: 'Inquiries', icon: MessageSquare },
] as const

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    router.push('/login/')
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-card px-4 py-6 md:block">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Umbar</p>
            <h1 className="mt-1 text-lg font-semibold text-foreground">Ops Admin</h1>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive(href)
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-6">
            <div className="md:hidden">
              <p className="text-lg font-semibold text-foreground">Umbar Ops Admin</p>
            </div>
            <div className="hidden md:block" />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden />
              Log out
            </Button>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
