'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types/domain'

interface HeaderProps {
  onToggleSidebar: () => void
  role: Role
  userName: string
  pendingMovements?: number
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN:       'Administrador',
  TECHNICIAN:  'Técnico',
  USER:        'Usuario',
  AUDITOR:     'Auditor',
}

export default function Header({ onToggleSidebar, role, userName, pendingMovements = 0 }: HeaderProps) {
  const [search, setSearch]       = useState('')
  const [menuOpen, setMenuOpen]   = useState(false)
  const { logout } = useAuth()

  return (
    <header className="app-header">
      {/* Left section: Toggle & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="header-toggle-btn" onClick={onToggleSidebar} title="Toggle sidebar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect y="2" width="16" height="2" rx="1" fill="currentColor"/>
            <rect y="7" width="16" height="2" rx="1" fill="currentColor"/>
            <rect y="12" width="16" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>ITAM</span>
          <span>/</span>
          <span>Dashboard</span>
        </div>
      </div>


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
        {/* Quick actions */}
        <button style={{ 
          background: 'var(--color-primary)', 
          color: 'white', 
          border: 'none', 
          padding: '6px 12px', 
          borderRadius: '6px', 
          fontSize: '13px', 
          fontWeight: 500, 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nuevo
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 8px' }} />

        {/* Notifications */}
        <button className="header-icon-btn" title="Movimientos pendientes">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1a5 5 0 015 5c0 3 1 4 1.5 5h-13C2 10 3 9 3 6a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          {pendingMovements > 0 && <span className="notification-badge" />}
        </button>

        {/* User chip + dropdown */}
        <div style={{ position: 'relative' }}>
          <div className="user-chip" onClick={() => setMenuOpen(v => !v)}>
            <div className="user-avatar">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="user-chip-name">{userName}</div>
              <div className="user-chip-role">{ROLE_LABELS[role] ?? role}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 4, color: 'var(--color-text-muted)', flexShrink: 0 }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                minWidth: 180, zIndex: 50,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{userName}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>{ROLE_LABELS[role] ?? role}</div>
                </div>
                <div style={{ padding: 4 }}>
                  <button
                    onClick={() => { setMenuOpen(false); logout() }}
                    style={{
                      width: '100%', background: 'transparent', border: 'none',
                      color: 'var(--color-danado)', cursor: 'pointer',
                      padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                      fontSize: 13, fontWeight: 500, textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-danado-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
