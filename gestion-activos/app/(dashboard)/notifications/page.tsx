'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { timeAgo } from '@/lib/ui-helpers'
import { BellIcon } from '@/components/icons'

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
  REQUEST_APPROVED:     '✓',
  REQUEST_REJECTED:     '✕',
  MAINTENANCE_DUE:      '⚙',
  NEW_ASSIGNMENT:       '→',
  WARRANTY_EXPIRING:    '!',
  ASSET_DECOMMISSIONED: '↓',
}

const TYPE_COLORS: Record<string, string> = {
  REQUEST_APPROVED:     'var(--color-operativo)',
  REQUEST_REJECTED:     'var(--color-danado)',
  MAINTENANCE_DUE:      'var(--color-mantenimiento)',
  NEW_ASSIGNMENT:       'var(--color-accent)',
  WARRANTY_EXPIRING:    'var(--color-mantenimiento)',
  ASSET_DECOMMISSIONED: 'var(--color-danado)',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [records, setRecords]   = useState<Notification[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<'all' | 'unread'>('all')
  const [marking, setMarking]   = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function markAllRead() {
    setMarking(true)
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setRecords(prev => prev.map(n => ({ ...n, read: true })))
    setMarking(false)
  }

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setRecords(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function handleClick(n: Notification) {
    if (!n.read) await markRead(n.id)
    if (n.url) router.push(n.url)
  }

  const filtered   = filter === 'unread' ? records.filter(n => !n.read) : records
  const unreadCount = records.filter(n => !n.read).length

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Notificaciones</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Centro de Notificaciones</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer` : 'Todas leídas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={markAllRead}
            disabled={marking}
          >
            {marking ? 'Marcando...' : 'Marcar todas leídas'}
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="filters-bar">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `Todas (${records.length})` : `No leídas (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 13, borderRadius: 4, width: '40%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 11, borderRadius: 4, width: '75%' }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <div className="empty-state-icon"><BellIcon size={32} strokeWidth={1.5} /></div>
            <div className="empty-state-title">
              {filter === 'unread' ? 'Sin notificaciones sin leer' : 'Sin notificaciones'}
            </div>
            <div className="empty-state-desc">
              {filter === 'unread'
                ? 'Estás al día con todas las actualizaciones del sistema.'
                : 'Las notificaciones aparecerán aquí cuando ocurran eventos importantes.'}
            </div>
          </div>
        ) : filtered.map(n => {
          const color = TYPE_COLORS[n.type] ?? 'var(--color-text-secondary)'
          const card = (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                background: n.read ? 'var(--color-bg-elevated)' : 'var(--color-bg-overlay)',
                border: `1px solid ${n.read ? 'var(--color-border)' : 'rgba(99,102,241,0.25)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '14px 16px',
                display: 'flex', gap: 12, alignItems: 'flex-start',
                cursor: n.url ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `${color}18`,
                border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color,
              }}>
                {TYPE_ICONS[n.type] ?? '●'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{n.title}</span>
                  {!n.read && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.45, marginBottom: 6 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{timeAgo(n.createdAt)}</div>
              </div>

              {/* Arrow indicator if clickable */}
              {n.url && (
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)', flexShrink: 0, alignSelf: 'center' }}>›</span>
              )}
            </div>
          )

          return n.url ? (
            <div key={n.id}>{card}</div>
          ) : card
        })}
      </div>

      {!loading && records.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Mostrando {filtered.length} de {records.length} notificaciones · máximo 50 recientes
        </div>
      )}
    </div>
  )
}
