'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/ToastProvider'
import {
  estadoTecnicoBadge, estadoUsoBadge,
  ESTADO_TECNICO_LABELS, ESTADO_USO_LABELS,
  EVENT_TYPE_LABELS, eventTypeBadge,
  formatDate, formatDateTime, timeAgo,
} from '@/lib/ui-helpers'

type Tab = 'overview' | 'specs' | 'assignments' | 'maintenance' | 'movements' | 'logs'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',     label: 'Información' },
  { id: 'specs',        label: 'Especificaciones' },
  { id: 'assignments',  label: 'Asignaciones' },
  { id: 'maintenance',  label: 'Mantenimiento' },
  { id: 'movements',    label: 'Movimientos' },
  { id: 'logs',         label: 'Bitácora' },
]

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { user } = useAuth()

  const [asset, setAsset]   = useState<any>(null)
  const [tab, setTab]       = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const canEdit   = ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'].includes(user.role)
  const canAdmin  = ['SUPER_ADMIN', 'ADMIN'].includes(user.role)

  const loadAsset = useCallback(() => {
    setLoading(true)
    fetch(`/api/assets/${id}`)
      .then(r => r.json())
      .then(data => { setAsset(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => { loadAsset() }, [loadAsset])

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${asset?.nombre}"? Se realizará un soft delete.`)) return
    setDeleting(true)
    await fetch(`/api/assets/${id}`, { method: 'DELETE' })
    router.push('/assets')
  }

  if (loading) return (
    <div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: i === 0 ? 80 : 36, borderRadius: 8, marginBottom: 16 }} />
      ))}
    </div>
  )

  if (!asset || asset.error) return (
    <div className="empty-state">
      <div className="empty-state-icon">⚠️</div>
      <div className="empty-state-title">Activo no encontrado</div>
      <Link href="/assets" className="btn btn-secondary">← Volver a Activos</Link>
    </div>
  )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <Link href="/assets">Activos</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">{asset.nombre}</span>
      </div>

      {/* Header */}
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginTop: 16,
        marginBottom: 16,
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 12,
          background: 'var(--color-accent-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
        }}>📦</div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            {asset.nombre}
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg-overlay)', padding: '2px 8px', borderRadius: 4 }}>
              {asset.codigoInventario}
            </span>
            {asset.serial && (
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                S/N: {asset.serial}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className={estadoTecnicoBadge(asset.estadoTecnico)}>
              {ESTADO_TECNICO_LABELS[asset.estadoTecnico]}
            </span>
            <span className={estadoUsoBadge(asset.estadoUso)}>
              {ESTADO_USO_LABELS[asset.estadoUso]}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {canEdit && (
            <Link href={`/assets/${id}/edit`} className="btn btn-secondary btn-sm">
              ✏️ Editar
            </Link>
          )}
          {canAdmin && (
            <button
              className="btn btn-sm"
              onClick={handleDelete}
              disabled={deleting}
              style={{ background: 'var(--color-danado-bg)', color: 'var(--color-danado)', border: '1px solid var(--color-danado)' }}
            >
              {deleting ? '...' : '🗑 Eliminar'}
            </button>
          )}
        </div>
      </div>

      {/* Meta bar */}
      <div style={{
        display: 'flex', gap: 24, padding: '12px 16px',
        background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', marginBottom: 20, flexWrap: 'wrap',
      }}>
        {[
          { label: 'Categoría', value: asset.category?.name ?? '—' },
          { label: 'Ubicación', value: asset.location?.nombre ?? '—' },
          { label: 'Registrado', value: formatDate(asset.createdAt) },
          { label: 'Actualizado', value: timeAgo(asset.updatedAt) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab asset={asset} />}
      {tab === 'specs'    && <SpecsTab spec={asset.spec} />}
      {tab === 'assignments' && <AssignmentsTab asset={asset} canEdit={canEdit} currentUserId={user.id} onRefresh={loadAsset} />}
      {tab === 'maintenance' && <MaintenanceTab asset={asset} canEdit={canEdit} />}
      {tab === 'movements'  && <MovementsTab requests={asset.requests ?? []} />}
      {tab === 'logs'       && <LogsTab logs={asset.logs ?? []} />}
    </div>
  )
}

// ── Overview ────────────────────────────────────────────────────
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{value ?? '—'}</div>
    </div>
  )
}

function OverviewTab({ asset }: { asset: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-header"><span className="card-title">Datos del Activo</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            <InfoItem label="Nombre" value={asset.nombre} />
            <InfoItem label="Código Inventario" value={<span className="font-mono">{asset.codigoInventario}</span>} />
            <InfoItem label="Número de Serie" value={asset.serial ? <span className="font-mono">{asset.serial}</span> : null} />
            <InfoItem label="Categoría" value={asset.category?.name} />
            <InfoItem label="Ubicación" value={asset.location?.nombre} />
            <InfoItem label="Estado Técnico" value={
              asset.estadoTecnico ? <span className={estadoTecnicoBadge(asset.estadoTecnico)}>{ESTADO_TECNICO_LABELS[asset.estadoTecnico]}</span> : null
            } />
            <InfoItem label="Estado de Uso" value={
              asset.estadoUso ? <span className={estadoUsoBadge(asset.estadoUso)}>{ESTADO_USO_LABELS[asset.estadoUso]}</span> : null
            } />
            <InfoItem label="Fecha de Adquisición" value={asset.acquisitionDate ? formatDate(asset.acquisitionDate) : null} />
            <InfoItem label="Vencimiento Garantía" value={asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : null} />
            <InfoItem label="Valor de Adquisición" value={asset.acquisitionValue ? `$${Number(asset.acquisitionValue).toLocaleString('es-CO')}` : null} />
            <InfoItem label="Registrado" value={formatDateTime(asset.createdAt)} />
            <InfoItem label="Última actualización" value={formatDateTime(asset.updatedAt)} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Specs ──────────────────────────────────────────────────────
function SpecsTab({ spec }: { spec: any }) {
  if (!spec) return (
    <div className="empty-state" style={{ padding: 40 }}>
      <div className="empty-state-icon">💻</div>
      <div className="empty-state-title">Sin especificaciones</div>
      <div className="empty-state-desc">Este activo no tiene especificaciones técnicas registradas.</div>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hardware */}
      <div className="card">
        <div className="card-header"><span className="card-title">Hardware</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <InfoItem label="Marca"          value={spec.brand} />
            <InfoItem label="Modelo"         value={spec.model} />
            <InfoItem label="CPU"            value={spec.cpu} />
            <InfoItem label="RAM"            value={spec.ram} />
            <InfoItem label="Almacenamiento" value={spec.storage} />
            <InfoItem label="Pantalla"       value={spec.screenSize} />
          </div>
        </div>
      </div>
      {/* Software */}
      <div className="card">
        <div className="card-header"><span className="card-title">Software</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <InfoItem label="Sistema Operativo" value={spec.operatingSystem} />
            <InfoItem label="Versión SO"         value={spec.osVersion} />
            <InfoItem label="Licencia OS"        value={spec.osLicense} />
          </div>
        </div>
      </div>
      {/* Network */}
      <div className="card">
        <div className="card-header"><span className="card-title">Red</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <InfoItem label="IP"       value={spec.ipAddress ? <span className="font-mono">{spec.ipAddress}</span> : null} />
            <InfoItem label="MAC"      value={spec.macAddress ? <span className="font-mono">{spec.macAddress}</span> : null} />
            <InfoItem label="Hostname" value={spec.hostname ? <span className="font-mono">{spec.hostname}</span> : null} />
            <InfoItem label="VLAN"     value={spec.vlan} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Assignments ─────────────────────────────────────────────────
const ROLE_LABELS_MAP: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico', USER: 'Usuario', AUDITOR: 'Auditor',
}

function calcDuration(start: string, end?: string | null): string {
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  const days = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 1)   return 'Hoy'
  if (days < 30)  return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}m ${days % 30}d`
  return `${Math.floor(days / 365)}a ${Math.floor((days % 365) / 30)}m`
}

function UserAvatar({ name, size = 36, style = {} }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--color-primary-bg)',
      border: '1px solid rgba(99,102,241,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: 'var(--color-primary)',
      ...style,
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function AssignmentsTab({
  asset,
  canEdit,
  currentUserId,
  onRefresh,
}: {
  asset: any
  canEdit: boolean
  currentUserId: number
  onRefresh: () => void
}) {
  const { toast } = useToast()

  const [users, setUsers]             = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showForm, setShowForm]       = useState(false)
  const [isReassign, setIsReassign]   = useState(false)
  const [search, setSearch]           = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [reason, setReason]           = useState('')
  const [notes, setNotes]             = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [returning, setReturning]     = useState(false)

  const assignments = asset.assignments ?? []
  const active = assignments.find((a: any) => !a.endDate)

  useEffect(() => {
    setUsersLoading(true)
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUsers(data) })
      .finally(() => setUsersLoading(false))
  }, [])

  const filteredUsers = search.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : users.slice(0, 8)

  function resetForm() {
    setShowForm(false)
    setIsReassign(false)
    setSelectedUser(null)
    setSearch('')
    setReason('')
    setNotes('')
    setShowDropdown(false)
  }

  async function handleAssign() {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      // Reassign: end current assignment first
      if (isReassign && active) {
        const endRes = await fetch(`/api/assets/${asset.id}/assignments`, { method: 'PATCH' })
        if (!endRes.ok) {
          const d = await endRes.json()
          toast('error', 'Error al finalizar asignación anterior', d.error)
          return
        }
      }

      const res = await fetch(`/api/assets/${asset.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:      selectedUser.id,
          asignadoPorId: currentUserId,
          reason:      reason || null,
          notes:       notes  || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast('error', 'Error al asignar', data.error)
        return
      }
      toast('success',
        isReassign ? 'Activo reasignado' : 'Activo asignado',
        `${asset.nombre} asignado a ${selectedUser.name}.`
      )
      resetForm()
      onRefresh()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEndAssignment() {
    if (!confirm(`¿Finalizar la asignación de ${active?.user?.name}?\nEl activo quedará disponible.`)) return
    setReturning(true)
    try {
      const res = await fetch(`/api/assets/${asset.id}/assignments`, { method: 'PATCH' })
      if (!res.ok) {
        const d = await res.json()
        toast('error', 'Error al devolver activo', d.error)
        return
      }
      toast('success', 'Asignación finalizada', `${active?.user?.name} ha devuelto el activo.`)
      onRefresh()
    } finally {
      setReturning(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ─── 1. CURRENT ASSIGNMENT CARD ─────────────────────────── */}
      {active ? (
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid rgba(59,130,246,0.4)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.07), rgba(99,102,241,0.07))',
            borderBottom: '1px solid var(--color-border)',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--color-operativo)',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Asignación Activa
              </span>
            </div>
            <span className="badge badge-asignado">En uso</span>
          </div>

          <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <UserAvatar name={active.user?.name ?? '?'} size={52} style={{ border: '2px solid rgba(99,102,241,0.4)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                {active.user?.name}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                {active.user?.department && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg-overlay)', padding: '1px 8px', borderRadius: 99, border: '1px solid var(--color-border)' }}>
                    {active.user.department}
                  </span>
                )}
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {ROLE_LABELS_MAP[active.user?.role] ?? active.user?.role}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Desde {formatDate(active.startDate)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {calcDuration(active.startDate)} en uso
                </span>
                {active.reason && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    "{active.reason}"
                  </span>
                )}
              </div>
            </div>

            {canEdit && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  id="btn-reassign"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setIsReassign(true); setShowForm(true) }}
                  disabled={returning || submitting}
                >
                  🔄 Reasignar
                </button>
                <button
                  id="btn-end-assignment"
                  className="btn btn-sm"
                  onClick={handleEndAssignment}
                  disabled={returning || submitting}
                  style={{ background: 'var(--color-danado-bg)', color: 'var(--color-danado)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  {returning ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '↩ Devolver'}
                </button>
              </div>
            )}
          </div>

          {active.notes && (
            <div style={{
              padding: '10px 20px', borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-overlay)',
              fontSize: 12, color: 'var(--color-text-secondary)',
              display: 'flex', gap: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {active.notes}
            </div>
          )}
        </div>
      ) : !showForm && canEdit && (
        <div style={{
          border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          textAlign: 'center',
          background: 'var(--color-bg-surface)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
            Sin asignación activa
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 18, maxWidth: 360, margin: '0 auto 18px' }}>
            Este activo está disponible. Asígnalo a un empleado para registrar la responsabilidad operativa.
          </div>
          <button
            id="btn-start-assignment"
            className="btn btn-primary"
            onClick={() => { setIsReassign(false); setShowForm(true) }}
          >
            + Asignar Activo
          </button>
        </div>
      )}

      {/* ─── 2. QUICK ASSIGNMENT PANEL ──────────────────────────── */}
      {showForm && canEdit && (
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 0 0 4px rgba(99,102,241,0.08)',
        }}>
          {/* Panel header */}
          <div style={{
            background: 'rgba(99,102,241,0.06)',
            borderBottom: '1px solid var(--color-border)',
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {isReassign ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> Reasignar Activo</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nueva Asignación</>
              )}
            </span>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}
              onClick={resetForm}
            >✕</button>
          </div>

          <div style={{ padding: '20px' }}>
            {isReassign && active && (
              <div style={{
                padding: '10px 14px', marginBottom: 16,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 8, fontSize: 13, color: 'var(--color-mantenimiento)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                La asignación actual de <strong>{active.user?.name}</strong> será finalizada automáticamente.
              </div>
            )}

            {/* Employee combobox */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">
                Empleado
                <span className="required" style={{ marginLeft: 4 }}>*</span>
              </label>

              {selectedUser ? (
                /* Selected state — compact chip */
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px',
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <UserAvatar name={selectedUser.name} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedUser.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {selectedUser.department ?? 'Sin departamento'} · {ROLE_LABELS_MAP[selectedUser.role] ?? selectedUser.role}
                      {selectedUser.activeAssignments > 0 && (
                        <span style={{ marginLeft: 8, color: 'var(--color-mantenimiento)' }}>
                          · {selectedUser.activeAssignments} activo{selectedUser.activeAssignments !== 1 ? 's' : ''} asignado{selectedUser.activeAssignments !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4 }}
                    onClick={() => { setSelectedUser(null); setSearch('') }}
                    title="Cambiar empleado"
                  >✕</button>
                </div>
              ) : (
                /* Search input + dropdown */
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input
                    id="assign-search"
                    className="form-input"
                    style={{ paddingLeft: 34 }}
                    placeholder="Buscar empleado por nombre, correo o departamento..."
                    value={search}
                    autoComplete="off"
                    onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                    onFocus={() => setShowDropdown(true)}
                  />

                  {showDropdown && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setShowDropdown(false)} />
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        maxHeight: 300, overflowY: 'auto',
                        zIndex: 31,
                      }}>
                        {usersLoading ? (
                          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                            <span className="loading-spinner" style={{ width: 14, height: 14, display: 'inline-block', marginRight: 6 }} />
                            Cargando empleados...
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                            No se encontraron empleados
                          </div>
                        ) : filteredUsers.map(u => (
                          <div
                            key={u.id}
                            role="option"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 14px', cursor: 'pointer',
                              borderBottom: '1px solid var(--color-border)',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-overlay)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                            onClick={() => { setSelectedUser(u); setSearch(''); setShowDropdown(false) }}
                          >
                            <UserAvatar name={u.name} size={36} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                                {u.department ?? 'Sin departamento'} · {ROLE_LABELS_MAP[u.role] ?? u.role}
                              </div>
                            </div>
                            <div style={{
                              fontSize: 11, flexShrink: 0, textAlign: 'right',
                              color: u.activeAssignments > 0 ? 'var(--color-mantenimiento)' : 'var(--color-operativo)',
                              fontWeight: 500,
                            }}>
                              {u.activeAssignments ?? 0} asignado{(u.activeAssignments ?? 0) !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                        {!search && users.length > 8 && (
                          <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            Escribe para filtrar {users.length} empleados...
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Reason + Notes */}
            <div className="form-row form-row-2" style={{ marginTop: 14 }}>
              <div className="form-group">
                <label className="form-label">Razón de asignación</label>
                <input
                  id="assign-reason"
                  className="form-input"
                  placeholder="ej. Equipo de trabajo, reemplazo temporal..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Notas adicionales</label>
              <textarea
                id="assign-notes"
                className="form-input"
                rows={2}
                placeholder="Condiciones especiales, acuerdos, observaciones..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ resize: 'vertical', minHeight: 56 }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
              <button
                id="btn-confirm-assign"
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={!selectedUser || submitting}
                style={{ minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {submitting ? (
                  <><span className="loading-spinner" style={{ width: 14, height: 14 }} />
                    {isReassign ? 'Reasignando...' : 'Asignando...'}</>
                ) : isReassign ? '🔄 Confirmar Reasignación' : '✓ Asignar Activo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. ASSIGNMENT HISTORY ──────────────────────────────── */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Historial de Asignaciones
            <span style={{ marginLeft: 8, fontWeight: 400 }}>({assignments.length})</span>
          </span>
          {!showForm && canEdit && active && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}
              onClick={() => { setIsReassign(false); setShowForm(true) }}>
              + Nueva
            </button>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Departamento</th>
                <th>Asignado por</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Duración</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state" style={{ padding: '32px' }}>
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-title">Sin historial de asignaciones</div>
                      <div className="empty-state-desc">Este activo no ha sido asignado a ningún empleado aún.</div>
                    </div>
                  </td>
                </tr>
              ) : assignments.map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserAvatar name={a.user?.name ?? '?'} size={28} />
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{a.user?.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {a.user?.department ?? <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{a.createdBy?.name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(a.startDate)}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {a.endDate
                      ? <span style={{ color: 'var(--color-text-secondary)' }}>{formatDate(a.endDate)}</span>
                      : <span style={{ color: 'var(--color-operativo)', fontWeight: 600 }}>Activo</span>
                    }
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {calcDuration(a.startDate, a.endDate)}
                  </td>
                  <td>
                    {!a.endDate
                      ? <span className="badge badge-asignado">Activo</span>
                      : <span className="badge badge-baja">Finalizado</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Maintenance ─────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  SCHEDULED:   'badge badge-pending',
  IN_PROGRESS: 'badge badge-in-progress',
  COMPLETED:   'badge badge-approved',
  CANCELLED:   'badge badge-rejected',
}
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Programado', IN_PROGRESS: 'En Progreso', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
}
const TYPE_LABEL: Record<string, string> = {
  PREVENTIVE: 'Preventivo', CORRECTIVE: 'Correctivo', CALIBRATION: 'Calibración', UPDATE: 'Actualización', CLEANING: 'Limpieza',
}

function MaintenanceTab({ asset, canEdit }: { asset: any; canEdit: boolean }) {
  const records = asset.maintenances ?? []
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Proveedor</th>
            <th>Costo</th>
            <th>Programado</th>
            <th>Completado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr><td colSpan={7}><div className="empty-state" style={{ padding: 32 }}>Sin registros de mantenimiento</div></td></tr>
          ) : records.map((m: any) => (
            <tr key={m.id}>
              <td><span className="badge badge-preventivo">{TYPE_LABEL[m.type] ?? m.type}</span></td>
              <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</td>
              <td style={{ color: 'var(--color-text-secondary)' }}>{m.provider ?? '—'}</td>
              <td style={{ color: 'var(--color-text-secondary)' }}>{m.cost ? `$${Number(m.cost).toLocaleString('es-CO')}` : '—'}</td>
              <td>{formatDate(m.scheduledAt)}</td>
              <td>{m.completedAt ? formatDate(m.completedAt) : '—'}</td>
              <td><span className={STATUS_BADGE[m.status] ?? 'badge'}>{STATUS_LABEL[m.status] ?? m.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Movements ──────────────────────────────────────────────────
const REQ_STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge badge-pending', APPROVED: 'badge badge-approved',
  REJECTED: 'badge badge-rejected', CANCELLED: 'badge badge-cancelled',
  IN_PROGRESS: 'badge badge-in-progress', COMPLETED: 'badge badge-approved',
}
const REQ_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', APPROVED: 'Aprobado', REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado', IN_PROGRESS: 'En Progreso', COMPLETED: 'Completado',
}

function MovementsTab({ requests }: { requests: any[] }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Destino</th>
            <th>Motivo</th>
            <th>Solicitado por</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr><td colSpan={5}><div className="empty-state" style={{ padding: 32 }}>Sin solicitudes de movimiento</div></td></tr>
          ) : requests.map((r: any) => (
            <tr key={r.id}>
              <td style={{ fontWeight: 500 }}>{r.destination?.name ?? '—'}</td>
              <td style={{ color: 'var(--color-text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
              <td style={{ color: 'var(--color-text-secondary)' }}>{r.requestedBy?.name}</td>
              <td><span className={REQ_STATUS_BADGE[r.status] ?? 'badge'}>{REQ_STATUS_LABEL[r.status] ?? r.status}</span></td>
              <td style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Logs ────────────────────────────────────────────────────────
function LogsTab({ logs }: { logs: any[] }) {
  return (
    <div className="timeline" style={{ paddingLeft: 8 }}>
      {logs.length === 0 && (
        <div className="empty-state" style={{ padding: 32 }}>Sin eventos registrados</div>
      )}
      {logs.map((log: any) => (
        <div key={log.id} className="timeline-item">
          <div className="timeline-track">
            <div className="timeline-dot" />
            <div className="timeline-line" />
          </div>
          <div className="timeline-content">
            <div className="timeline-header">
              <span className={eventTypeBadge(log.tipo ?? log.type)}>
                {EVENT_TYPE_LABELS[log.tipo ?? log.type] ?? log.tipo ?? log.type}
              </span>
              <span className="timeline-date">{formatDateTime(log.occurredAt ?? log.fecha)}</span>
              {log.user && <span className="timeline-actor">por {log.user.name}</span>}
            </div>
            <div className="timeline-desc">{log.description ?? log.descripcion}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
