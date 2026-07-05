'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useAuth } from '@/providers/AuthProvider'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { authed, ready } = useAuth()

  useEffect(() => {
    if (ready && !authed) {
      router.replace('/login/')
    }
  }, [authed, ready, router])

  if (!ready || !authed) {
    return <p className="text-muted-foreground">Checking access…</p>
  }

  return children
}
