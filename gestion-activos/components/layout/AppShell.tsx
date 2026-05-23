'use client'

import { useState, useCallback, useEffect } from 'react'
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
  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // On resize to desktop, close mobile sidebar
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setMobileSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileSidebarOpen])

  const handleToggle = useCallback(() => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(v => !v)
    } else {
      setSidebarCollapsed(v => !v)
    }
  }, [])

  return (
    <div className="app-shell">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        role={role}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="main-area">
        <Header
          onToggleSidebar={handleToggle}
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
