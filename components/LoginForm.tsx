'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/AuthProvider'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { authed, ready, login } = useAuth()

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (ready && authed) {
      router.replace(redirect)
    }
  }, [authed, ready, redirect, router])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    try {
      await login(password)
      router.push(redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Umbar</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Ops Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Team access only. Enter the admin password to continue.
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2"
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
