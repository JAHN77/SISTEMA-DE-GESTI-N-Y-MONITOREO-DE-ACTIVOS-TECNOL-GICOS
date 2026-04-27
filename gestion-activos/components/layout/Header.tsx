'use client'

import { useState } from 'react'
import type { Role } from '@/types/domain'

interface HeaderProps {
  onToggleSidebar: () => void
  role: Role
  userName: string
  pendingMovements?: number
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  USER: 'Usuario',
}

export default function Header({ onToggleSidebar, role, userName, pendingMovements = 0 }: HeaderProps) {
  const [search, setSearch] = useState('')

  return (
    <header className="app-header">
      {/* Sidebar toggle */}
      <button className="header-toggle-btn" onClick={onToggleSidebar} title="Toggle sidebar">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect y="2" width="16" height="2" rx="1" fill="currentColor"/>
          <rect y="7" width="16" height="2" rx="1" fill="currentColor"/>
          <rect y="12" width="16" height="2" rx="1" fill="currentColor"/>
        </svg>
      </button>

      {/* Global search */}
      <div className="header-search">
        <span className="header-search-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
        <input
          type="text"
          placeholder="Buscar activos (nombre, código, serial)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="global-search"
        />
      </div>

      <div className="header-spacer" />

      <div className="header-actions">
        {/* Notifications */}
        <button className="header-icon-btn" title="Movimientos pendientes">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1a5 5 0 015 5c0 3 1 4 1.5 5h-13C2 10 3 9 3 6a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          {pendingMovements > 0 && <span className="notification-badge" />}
        </button>

        {/* User chip */}
        <div className="user-chip">
          <div className="user-avatar">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="user-chip-name">{userName}</div>
            <div className="user-chip-role">{ROLE_LABELS[role]}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
