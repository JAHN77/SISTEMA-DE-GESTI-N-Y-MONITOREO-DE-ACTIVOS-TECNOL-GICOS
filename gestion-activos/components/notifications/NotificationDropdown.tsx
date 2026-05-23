'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { timeAgo } from '@/lib/ui-helpers'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  url: string | null
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  REQUEST_APPROVED:      '✓',
  REQUEST_REJECTED:      '✕',
  MAINTENANCE_DUE:       '⚙',
  NEW_ASSIGNMENT:        '→',
  WARRANTY_EXPIRING:     '!',
  ASSET_DECOMMISSIONED:  '↓',
}

export default function NotificationDropdown() {
  const [open, setOpen]               = useState(false)
  const [notifications, setNotifs]    = useState<Notification[]>([])
  const [loading, setLoading]         = useState(false)
  const dropdownRef                   = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  async function loadNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setNotifs(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 60_000)
    return () => clearInterval(interval)
  }, [])

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="header-icon-btn"
        title="Notificaciones"
        onClick={() => { setOpen(v => !v); if (!open) loadNotifications() }}
        style={{ position: 'relative' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1a5 5 0 015 5c0 3 1 4 1.5 5h-13C2 10 3 9 3 6a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 16, height: 16, borderRadius: 99,
            background: 'var(--color-danado)', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', border: '1.5px solid var(--color-bg-surface)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: 340, zIndex: 50,
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Notificaciones {unread > 0 && <span style={{ fontSize: 11, background: 'var(--color-danado)', color: '#fff', borderRadius: 99, padding: '1px 6px', marginLeft: 4 }}>{unread}</span>}
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ fontSize: 11, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  Marcar todas leídas
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  Sin notificaciones
                </div>
              ) : notifications.map(n => {
                const content = (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--color-border)',
                      background: n.read ? 'transparent' : 'rgba(99,102,241,0.05)',
                      cursor: n.url ? 'pointer' : 'default',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, flexShrink: 0,
                      background: 'var(--color-bg-overlay)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: 'var(--color-text-secondary)',
                    }}>
                      {TYPE_ICONS[n.type] ?? '●'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0, marginTop: 6 }} />}
                  </div>
                )
                return n.url ? (
                  <Link key={n.id} href={n.url} onClick={() => { markRead(n.id); setOpen(false) }} style={{ textDecoration: 'none', display: 'block' }}>
                    {content}
                  </Link>
                ) : content
              })}
            </div>
            {/* Footer */}
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '10px 14px', textAlign: 'center', fontSize: 12, color: 'var(--color-accent)', borderTop: '1px solid var(--color-border)', textDecoration: 'none', fontWeight: 500 }}
            >
              Ver todas las notificaciones →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
