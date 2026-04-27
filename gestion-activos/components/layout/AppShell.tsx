'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import type { Role } from '@/types/domain'

interface AppShellProps {
  children: React.ReactNode
  role?: Role
  userName?: string
  pendingMovements?: number
}

export default function AppShell({
  children,
  role = 'ADMIN',
  userName = 'Admin',
  pendingMovements = 0,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} role={role} />
      <div className="main-area">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
          role={role}
          userName={userName}
          pendingMovements={pendingMovements}
        />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
