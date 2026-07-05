'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { clearAdminToken, isAuthenticated, setAdminToken } from '@/lib/auth-storage'
import { fetchAdminLogin } from '@/lib/fetch-admin-api'

type AuthContextValue = {
  authed: boolean
  ready: boolean
  login: (password: string) => Promise<void>
  logout: () => void
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setAuthed(isAuthenticated())
    setReady(true)
  }, [])

  const refreshAuth = useCallback(() => {
    setAuthed(isAuthenticated())
  }, [])

  const login = useCallback(async (password: string) => {
    const { token } = await fetchAdminLogin(password)
    setAdminToken(token)
    setAuthed(true)
    setReady(true)
  }, [])

  const logout = useCallback(() => {
    clearAdminToken()
    setAuthed(false)
  }, [])

  const value = useMemo(
    () => ({ authed, ready, login, logout, refreshAuth }),
    [authed, ready, login, logout, refreshAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
