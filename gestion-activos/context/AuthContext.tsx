'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { Role } from '@/types/domain'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: Role
}

interface AuthContextValue {
  user: AuthUser
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: AuthUser
}) {
  const [user] = useState<AuthUser>(initialUser)

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.replace('/login')
  }, [])

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be called inside AuthProvider')
  return ctx
}
