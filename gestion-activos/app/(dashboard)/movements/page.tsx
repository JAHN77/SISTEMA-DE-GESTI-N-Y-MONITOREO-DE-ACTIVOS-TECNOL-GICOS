'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { RequestStatus } from '@/types/domain'
import { requestStatusBadge, REQUEST_STATUS_LABELS, formatDateTime, timeAgo } from '@/lib/ui-helpers'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuth } from '@/context/AuthContext'
import { TruckIcon, CheckIcon, XIcon } from '@/components/icons'

const STATUS_FILTERS: { value: RequestStatus | ''; label: string; color: string }[] = [
  { value: '',         label: 'Todos',     color: 'var(--color-primary)' },
  { value: 'PENDING',  label: 'Pendiente', color: 'var(--color-mantenimiento)' },
  { value: 'APPROVED', label: 'Aprobado',  color: 'var(--color-operativo)' },
  { value: 'REJECTED', label: 'Rechazado', color: 'var(--color-danado)' },
]

export default function MovementsPage() {
  const { toast }  = useToast()
  const { user }   = useAuth()
  const [movements, setMovements]     = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('')
  const [selected, setSelected]       = useState<any | null>(null)
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
      body: JSON.stringify({
        accion:        action === 'APPROVED' ? 'APROBADO' : 'RECHAZADO',
        aprobadoPorId: user.id,
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast('error', 'Error', data.error); setActionLoading(false); return }
    toast(
      'success',
      action === 'APPROVED' ? 'Traslado aprobado' : 'Traslado rechazado',
      action === 'APPROVED'
        ? `La ubicación del activo ha sido actualizada.`
        : `La solicitud fue rechazada.`
    )
    setSelected(null)
    setActionLoading(false)
    load()
  }

  const count = (s: RequestStatus | '') =>
    s === '' ? movements.length : movements.filter(m => m.status === s).length

  const filtered = filterStatus
    ? movements.filter(m => m.status === filterStatus)
    : movements

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Movimientos</span>
      </div>

      {/* Header */}
      <div className="page-header" style={{ marginTop: 16, marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Solicitudes de Traslado</h1>
          <p className="page-subtitle">Gestiona el ciclo de vida físico de los activos entre ubicaciones</p>
        </div>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {STATUS_FILTERS.map(sf => {
          const c = count(sf.value)
          const isActive = filterStatus === sf.value
          return (
            <button key={sf.value} onClick={() => setFilterStatus(sf.value)} style={{
              background: isActive ? `${sf.color}12` : 'var(--color-bg-elevated)',
              border: `1px solid ${isActive ? sf.color : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              boxShadow: isActive ? `0 0 0 3px ${sf.color}18` : 'none',
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: isActive ? sf.color : 'var(--color-text-primary)', lineHeight: 1, marginBottom: 4 }}>
                {loading ? '—' : c}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: isActive ? sf.color : 'var(--color-text-secondary)' }}>
                {sf.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {/* Table toolbar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginRight: 4 }}>
            {loading ? '...' : filtered.length} solicitud{filtered.length !== 1 ? 'es' : ''}
          </span>
          {filterStatus && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              · filtrando por <strong>{REQUEST_STATUS_LABELS[filterStatus]}</strong>
              <button onClick={() => setFilterStatus('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1, padding: '0 2px', display: 'flex', alignItems: 'center' }}><XIcon size={12} /></button>
            </span>
          )}
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Activo</th>
                <th>Traslado</th>
                <th>Motivo</th>
                <th>Solicitante</th>
                <th>Fecha</th>
                <th>Estado</th>
                {canApprove && <th>Resolución</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(canApprove ? 7 : 6)].map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: j === 1 ? '90%' : '70%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canApprove ? 7 : 6}>
                    <div className="empty-state" style={{ padding: 48 }}>
                      <div className="empty-state-icon"><TruckIcon size={32} strokeWidth={1.5} /></div>
                      <div className="empty-state-title">Sin solicitudes</div>
                      <div className="empty-state-desc">
                        {filterStatus
                          ? `No hay solicitudes con estado "${REQUEST_STATUS_LABELS[filterStatus]}".`
                          : 'No hay solicitudes de traslado registradas. Crea una desde el detalle de un activo.'}
                      </div>
                      {filterStatus && (
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setFilterStatus('')}>
                          Ver todas
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(m => (
                <MovementRow key={m.id} m={m} canApprove={canApprove} onApprove={() => setSelected({ ...m, _action: 'APPROVED' })} onReject={() => setSelected({ ...m, _action: 'REJECTED' })} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => !actionLoading && setSelected(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>

            <div className="modal-header" style={{
              background: selected._action === 'APPROVED'
                ? 'linear-gradient(135deg,rgba(34,197,94,0.07),rgba(16,185,129,0.07))'
                : 'linear-gradient(135deg,rgba(239,68,68,0.07),rgba(220,38,38,0.07))',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span className="modal-title" style={{ color: selected._action === 'APPROVED' ? 'var(--color-operativo)' : 'var(--color-danado)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {selected._action === 'APPROVED' ? <><CheckIcon size={16} /> Confirmar Aprobación</> : <><XIcon size={16} /> Confirmar Rechazo</>}
              </span>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Asset + movement preview */}
              <div style={{ background: 'var(--color-bg-overlay)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 12 }}>
                  {selected.asset?.nombre}
                  <span className="font-mono" style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400 }}>{selected.asset?.codigoInventario}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <LocationChip name={selected.asset?.location?.nombre} current />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <LocationChip name={selected.nuevaLocation?.nombre} destination />
                </div>
              </div>

              {/* Reason */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>Motivo de la solicitud</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, background: 'var(--color-bg-surface)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  {selected.motivo}
                </div>
              </div>

              {selected._action === 'APPROVED' && (
                <div style={{ fontSize: 13, color: 'var(--color-operativo)', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <CheckIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} /> Al aprobar, la ubicación del activo se actualizará automáticamente y se registrará en la bitácora.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)} disabled={actionLoading}>
                Cancelar
              </button>
              <button
                id="btn-confirm-action"
                className="btn"
                onClick={() => handleAction(selected.id, selected._action)}
                disabled={actionLoading}
                style={selected._action === 'APPROVED'
                  ? { background: 'var(--color-operativo)', color: '#fff', border: 'none', minWidth: 140 }
                  : { background: 'var(--color-danado)', color: '#fff', border: 'none', minWidth: 140 }
                }
              >
                {actionLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="loading-spinner" style={{ width: 14, height: 14 }} />Procesando...</span>
                  : selected._action === 'APPROVED'
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

// ─── Sub-components ──────────────────────────────────────────────

function MovementRow({ m, canApprove, onApprove, onReject }: {
  m: any; canApprove: boolean; onApprove: () => void; onReject: () => void
}) {
  const isPending = m.status === 'PENDING'
  return (
    <tr style={{ opacity: m.status === 'CANCELLED' ? 0.55 : 1 }}>

      {/* Asset */}
      <td>
        <Link href={`/assets/${m.assetId}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
          {m.asset?.nombre}
        </Link>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1, fontFamily: 'monospace' }}>
          {m.asset?.codigoInventario}
        </div>
      </td>

      {/* Movement route */}
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
          <LocationChip name={m.asset?.location?.nombre} current />
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/></svg>
          </div>
          <LocationChip name={m.nuevaLocation?.nombre} destination />
        </div>
      </td>

      {/* Reason */}
      <td style={{ maxWidth: 220 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.motivo}>
          {m.motivo}
        </div>
      </td>

      {/* Requested by */}
      <td>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{m.requestedBy?.name}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{m.requestedBy?.role}</div>
      </td>

      {/* Date */}
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{timeAgo(m.createdAt)}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{formatDateTime(m.createdAt)}</div>
      </td>

      {/* Status */}
      <td>
        <span className={requestStatusBadge(m.status as RequestStatus)}>
          {REQUEST_STATUS_LABELS[m.status as RequestStatus] ?? m.status}
        </span>
      </td>

      {/* Actions / Resolution */}
      {canApprove && (
        <td>
          {isPending ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                id={`btn-approve-${m.id}`}
                className="btn btn-sm"
                onClick={onApprove}
                style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-operativo)', border: '1px solid rgba(34,197,94,0.25)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
              ><CheckIcon size={13} /> Aprobar</button>
              <button
                id={`btn-reject-${m.id}`}
                className="btn btn-sm"
                onClick={onReject}
                style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-danado)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}
              ><XIcon size={13} /> Rechazar</button>
            </div>
          ) : m.approvedBy ? (
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{m.approvedBy.name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{timeAgo(m.updatedAt)}</div>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>
          )}
        </td>
      )}
    </tr>
  )
}

function LocationChip({ name, current, destination }: { name?: string; current?: boolean; destination?: boolean }) {
  const color = current ? '#0ea5e9' : destination ? 'var(--color-operativo)' : 'var(--color-text-muted)'
  const bg    = current ? 'rgba(14,165,233,0.08)' : destination ? 'rgba(34,197,94,0.08)' : 'var(--color-bg-overlay)'
  const border = current ? 'rgba(14,165,233,0.2)' : destination ? 'rgba(34,197,94,0.2)' : 'var(--color-border)'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, background: bg, border: `1px solid ${border}` }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 500, color, whiteSpace: 'nowrap' }}>
        {name ?? <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Sin ubicación</span>}
      </span>
    </div>
  )
}
