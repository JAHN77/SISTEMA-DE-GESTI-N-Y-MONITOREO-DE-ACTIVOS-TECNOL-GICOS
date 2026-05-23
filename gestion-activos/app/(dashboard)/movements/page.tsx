'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { RequestStatus } from '@/types/domain'
import { timeAgo } from '@/lib/ui-helpers'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuth } from '@/context/AuthContext'
import { TruckIcon, CheckIcon, XIcon } from '@/components/icons'

// ─── Constants ───────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:   { label: 'Pendiente',  color: 'var(--color-mantenimiento)',  bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  APPROVED:  { label: 'Aprobado',   color: 'var(--color-operativo)',      bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'  },
  REJECTED:  { label: 'Rechazado',  color: 'var(--color-danado)',         bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'  },
  CANCELLED: { label: 'Cancelado',  color: 'var(--color-text-muted)',     bg: 'rgba(75,85,99,0.1)',    border: 'rgba(75,85,99,0.2)'    },
}

// ─── Sub-components ──────────────────────────────────────────────

function LocationPill({ name, origin }: { name?: string; origin?: boolean }) {
  const color  = origin ? '#0ea5e9' : '#22c55e'
  const bg     = origin ? 'rgba(14,165,233,0.09)' : 'rgba(34,197,94,0.09)'
  const border = origin ? 'rgba(14,165,233,0.22)' : 'rgba(34,197,94,0.22)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 5, background: bg, border: `1px solid ${border}`, maxWidth: 148, overflow: 'hidden' }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 500, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name ?? <em style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Sin ubicación</em>}
      </span>
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: 'var(--color-text-muted)', bg: 'var(--color-bg-overlay)', border: 'var(--color-border)' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 11, fontWeight: 600 }}>
      {status === 'PENDING' && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0, animation: 'pulse 2s ease infinite' }} />
      )}
      {cfg.label}
    </span>
  )
}

function DetailDrawer({ movement, canApprove, actionLoading, onClose, onAction }: {
  movement: any
  canApprove: boolean
  actionLoading: boolean
  onClose: () => void
  onAction: (m: any, action: 'APPROVED' | 'REJECTED') => void
}) {
  const isPending = movement.status === 'PENDING'

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 440, maxWidth: '96vw',
        background: 'var(--color-bg-surface)', borderLeft: '1px solid var(--color-border)',
        zIndex: 81, display: 'flex', flexDirection: 'column',
        animation: 'slideLeft 180ms ease',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>#{movement.id}</span>
            <StatusBadge status={movement.status} />
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, display: 'flex', borderRadius: 'var(--radius-sm)' }}
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Asset card */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Activo</div>
            <Link href={`/assets/${movement.assetId}`} onClick={onClose} style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent)', marginBottom: 2 }}>{movement.asset?.nombre}</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{movement.asset?.codigoInventario}</div>
            </Link>
          </div>

          {/* Trayecto */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 12 }}>Trayecto</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>Origen</div>
                <LocationPill name={movement.asset?.location?.nombre} origin />
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 14 }}>
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>Destino</div>
                <LocationPill name={movement.nuevaLocation?.nombre} />
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Motivo</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px' }}>
              {movement.motivo || <em style={{ color: 'var(--color-text-muted)' }}>Sin motivo especificado</em>}
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Solicitante',  value: movement.requestedBy?.name ?? '—' },
              { label: 'Solicitado',   value: timeAgo(movement.createdAt)        },
              { label: 'Aprobado por', value: movement.approvedBy?.name  ?? '—' },
              { label: 'Actualizado',  value: timeAgo(movement.updatedAt)        },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer — approve/reject */}
        {isPending && canApprove && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              className="btn btn-sm"
              onClick={() => onAction(movement, 'REJECTED')}
              disabled={actionLoading}
              style={{ flex: 1, background: 'rgba(239,68,68,0.08)', color: 'var(--color-danado)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 600 }}
            >
              <XIcon size={13} /> Rechazar
            </button>
            <button
              className="btn btn-sm"
              onClick={() => onAction(movement, 'APPROVED')}
              disabled={actionLoading}
              style={{ flex: 1, background: 'rgba(34,197,94,0.1)', color: 'var(--color-operativo)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 600 }}
            >
              <CheckIcon size={13} /> Aprobar
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function MovementRow({ m, canApprove, onRowClick, onApprove, onReject }: {
  m: any
  canApprove: boolean
  onRowClick: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const isPending = m.status === 'PENDING'
  return (
    <tr onClick={onRowClick} style={{ opacity: m.status === 'CANCELLED' ? 0.5 : 1, cursor: 'pointer' }}>

      <td className="col-title">
        <div>
          <Link
            href={`/assets/${m.assetId}`}
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
          >
            {m.asset?.nombre}
          </Link>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1, fontFamily: 'monospace' }}>
            {m.asset?.codigoInventario}
          </div>
        </div>
        <StatusBadge status={m.status} />
      </td>

      <td data-label="Trayecto">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <LocationPill name={m.asset?.location?.nombre} origin />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
          <LocationPill name={m.nuevaLocation?.nombre} />
        </div>
      </td>

      <td className="col-secondary" data-label="Estado">
        <StatusBadge status={m.status} />
      </td>

      <td className="col-optional" data-label="Solicitante">
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{m.requestedBy?.name ?? '—'}</span>
      </td>

      <td className="col-optional" data-label="Hace" style={{ whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{timeAgo(m.createdAt)}</span>
      </td>

      {canApprove && (
        <td className="col-actions" data-label="" onClick={e => e.stopPropagation()}>
          {isPending ? (
            <>
              <button
                id={`btn-approve-${m.id}`}
                className="btn btn-sm"
                onClick={onApprove}
                style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-operativo)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
              ><CheckIcon size={12} /> Aprobar</button>
              <button
                id={`btn-reject-${m.id}`}
                className="btn btn-sm"
                onClick={onReject}
                style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-danado)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}
              ><XIcon size={12} /> Rechazar</button>
            </>
          ) : (
            <button
              className="btn btn-sm"
              onClick={onRowClick}
              style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'transparent', border: '1px solid var(--color-border)' }}
            >
              Ver →
            </button>
          )}
        </td>
      )}
    </tr>
  )
}

// ─── Main page ───────────────────────────────────────────────────

export default function MovementsPage() {
  const { toast } = useToast()
  const { user }  = useAuth()

  const [movements, setMovements]         = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [filterStatus, setFilterStatus]   = useState<RequestStatus | ''>('')
  const [search, setSearch]               = useState('')
  const [drawer, setDrawer]               = useState<any | null>(null)
  const [confirm, setConfirm]             = useState<{ movement: any; action: 'APPROVED' | 'REJECTED' } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const canApprove = ['SUPER_ADMIN', 'ADMIN'].includes(user.role)

  async function load() {
    setLoading(true)
    const res  = await fetch('/api/movements')
    const data = await res.json()
    setMovements(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAction(id: number, action: 'APPROVED' | 'REJECTED') {
    setActionLoading(true)
    const res = await fetch(`/api/movements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: action === 'APPROVED' ? 'APROBADO' : 'RECHAZADO' }),
    })
    const data = await res.json()
    if (!res.ok) { toast('error', 'Error', data.error); setActionLoading(false); return }
    toast(
      'success',
      action === 'APPROVED' ? 'Traslado aprobado' : 'Traslado rechazado',
      action === 'APPROVED' ? 'La ubicación del activo ha sido actualizada.' : 'La solicitud fue rechazada.',
    )
    setConfirm(null)
    setDrawer(null)
    setActionLoading(false)
    load()
  }

  const counts = {
    total:    movements.length,
    pending:  movements.filter(m => m.status === 'PENDING').length,
    approved: movements.filter(m => m.status === 'APPROVED').length,
    rejected: movements.filter(m => m.status === 'REJECTED').length,
  }

  const filtered = movements.filter(m => {
    const matchStatus = !filterStatus || m.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q ||
      m.asset?.nombre?.toLowerCase().includes(q) ||
      m.asset?.codigoInventario?.toLowerCase().includes(q) ||
      m.requestedBy?.name?.toLowerCase().includes(q) ||
      m.asset?.location?.nombre?.toLowerCase().includes(q) ||
      m.nuevaLocation?.nombre?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const filterPills: Array<{ value: RequestStatus | ''; label: string; count: number; color: string }> = [
    { value: '',         label: 'Todas',      count: counts.total,    color: 'var(--color-text-secondary)' },
    { value: 'PENDING',  label: 'Pendientes', count: counts.pending,  color: 'var(--color-mantenimiento)'  },
    { value: 'APPROVED', label: 'Aprobadas',  count: counts.approved, color: 'var(--color-operativo)'      },
    { value: 'REJECTED', label: 'Rechazadas', count: counts.rejected, color: 'var(--color-danado)'         },
  ]

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Movimientos</span>
      </div>

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Solicitudes de Traslado</h1>
          {!loading && (
            <p className="page-subtitle">
              {counts.total} solicitudes registradas
              {counts.pending > 0 && (
                <> · <span style={{ color: 'var(--color-mantenimiento)', fontWeight: 600 }}>
                  {counts.pending} pendiente{counts.pending !== 1 ? 's' : ''} de aprobación
                </span></>
              )}
              {counts.approved > 0 && (
                <> · <span style={{ color: 'var(--color-operativo)' }}>
                  {counts.approved} aprobada{counts.approved !== 1 ? 's' : ''}
                </span></>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Filter pills + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 3 }}>
          {filterPills.map(p => {
            const active = filterStatus === p.value
            return (
              <button
                key={p.value}
                onClick={() => setFilterStatus(p.value)}
                style={{
                  background: active ? 'var(--color-bg-surface)' : 'transparent',
                  border: active ? '1px solid var(--color-border)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  color: active ? p.color : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all var(--transition-fast)', whiteSpace: 'nowrap',
                }}
              >
                {p.label}
                <span style={{
                  background: active ? p.color : 'var(--color-bg-overlay)',
                  color: active ? '#fff' : 'var(--color-text-muted)',
                  borderRadius: 99, minWidth: 18, height: 18,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, padding: '0 4px',
                  transition: 'all var(--transition-fast)',
                }}>
                  {loading ? '·' : p.count}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por activo, solicitante, ubicación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 32px 7px 30px',
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
              fontSize: 12, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 2 }}
            >
              <XIcon size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Table panel */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {loading ? '...' : filtered.length}
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            solicitud{filtered.length !== 1 ? 'es' : ''}
            {(filterStatus || search) && ' · filtradas'}
          </span>
          {(filterStatus || search) && (
            <button
              onClick={() => { setFilterStatus(''); setSearch('') }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <XIcon size={11} /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Trayecto</th>
                <th className="col-secondary">Estado</th>
                <th className="col-optional">Solicitante</th>
                <th className="col-optional">Hace</th>
                {canApprove && <th className="col-actions">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(canApprove ? 6 : 5)].map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: j === 1 ? '90%' : '70%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canApprove ? 6 : 5}>
                    <div className="empty-state" style={{ padding: 48 }}>
                      <div className="empty-state-icon"><TruckIcon size={32} strokeWidth={1.5} /></div>
                      <div className="empty-state-title">Sin solicitudes</div>
                      <div className="empty-state-desc">
                        {search
                          ? `Sin coincidencias para "${search}".`
                          : filterStatus
                            ? `No hay solicitudes con estado "${STATUS_CFG[filterStatus]?.label ?? filterStatus}".`
                            : 'No hay solicitudes de traslado registradas. Crea una desde el detalle de un activo.'}
                      </div>
                      {(filterStatus || search) && (
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => { setFilterStatus(''); setSearch('') }}>
                          Ver todas
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(m => (
                <MovementRow
                  key={m.id}
                  m={m}
                  canApprove={canApprove}
                  onRowClick={() => setDrawer(m)}
                  onApprove={() => setConfirm({ movement: m, action: 'APPROVED' })}
                  onReject={() => setConfirm({ movement: m, action: 'REJECTED' })}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {drawer && (
        <DetailDrawer
          movement={drawer}
          canApprove={canApprove}
          actionLoading={actionLoading}
          onClose={() => setDrawer(null)}
          onAction={(m, action) => { setDrawer(null); setConfirm({ movement: m, action }) }}
        />
      )}

      {/* Confirmation modal */}
      {confirm && (
        <div className="modal-overlay" onClick={() => !actionLoading && setConfirm(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{
              background: confirm.action === 'APPROVED'
                ? 'linear-gradient(135deg,rgba(34,197,94,0.07),rgba(16,185,129,0.07))'
                : 'linear-gradient(135deg,rgba(239,68,68,0.07),rgba(220,38,38,0.07))',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span className="modal-title" style={{ color: confirm.action === 'APPROVED' ? 'var(--color-operativo)' : 'var(--color-danado)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {confirm.action === 'APPROVED'
                  ? <><CheckIcon size={16} /> Confirmar Aprobación</>
                  : <><XIcon size={16} /> Confirmar Rechazo</>}
              </span>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--color-bg-overlay)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 12 }}>
                  {confirm.movement.asset?.nombre}
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400, fontFamily: 'monospace' }}>{confirm.movement.asset?.codigoInventario}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <LocationPill name={confirm.movement.asset?.location?.nombre} origin />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                  <LocationPill name={confirm.movement.nuevaLocation?.nombre} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>Motivo de la solicitud</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, background: 'var(--color-bg-surface)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  {confirm.movement.motivo}
                </div>
              </div>

              {confirm.action === 'APPROVED' && (
                <div style={{ fontSize: 13, color: 'var(--color-operativo)', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <CheckIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  Al aprobar, la ubicación del activo se actualizará automáticamente y se registrará en la bitácora.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirm(null)} disabled={actionLoading}>
                Cancelar
              </button>
              <button
                id="btn-confirm-action"
                className="btn"
                onClick={() => handleAction(confirm.movement.id, confirm.action)}
                disabled={actionLoading}
                style={confirm.action === 'APPROVED'
                  ? { background: 'var(--color-operativo)', color: '#fff', border: 'none', minWidth: 140 }
                  : { background: 'var(--color-danado)', color: '#fff', border: 'none', minWidth: 140 }
                }
              >
                {actionLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="loading-spinner" style={{ width: 14, height: 14 }} />Procesando...</span>
                  : confirm.action === 'APPROVED'
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckIcon size={14} /> Aprobar traslado</span>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><XIcon size={14} /> Rechazar solicitud</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
