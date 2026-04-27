'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { MovementRequest, RequestStatus, Role } from '@/types/domain'
import { requestStatusBadge, REQUEST_STATUS_LABELS, formatDateTime } from '@/lib/ui-helpers'
import { useToast } from '@/components/ui/ToastProvider'

const ROLE: Role = 'ADMIN' // TODO: from auth

export default function MovementsPage() {
  const { toast } = useToast()
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('')
  const [selected, setSelected]   = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    const res  = await fetch(`/api/movements?${params}`)
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
      body: JSON.stringify({ action, approvedById: 1 }),
    })
    const data = await res.json()
    if (!res.ok) { toast('error', 'Error', data.error); setActionLoading(false); return }
    toast('success', action === 'APPROVED' ? 'Movimiento aprobado' : 'Movimiento rechazado', '')
    setSelected(null)
    setActionLoading(false)
    load()
  }

  const filtered = filterStatus
    ? movements.filter(m => m.status === filterStatus)
    : movements

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Movimientos</span>
      </div>

      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="page-title">Solicitudes de Movimiento</h1>
          <p className="page-subtitle">Gestiona traslados de activos entre ubicaciones</p>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="filters-bar">
        {(['', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
          <button
            key={s}
            id={`filter-movement-${s || 'all'}`}
            className={`filter-chip${filterStatus === s ? ' active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === '' ? 'Todos' : REQUEST_STATUS_LABELS[s]}
            <span style={{ marginLeft: 4, opacity: 0.7 }}>
              ({s === '' ? movements.length : movements.filter(m => m.status === s).length})
            </span>
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Activo</th>
              <th>Ubicación Actual</th>
              <th>Destino</th>
              <th>Motivo</th>
              <th>Solicitante</th>
              <th>Estado</th>
              <th>Fecha</th>
              {ROLE === 'ADMIN' && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>)}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🚚</div>
                    <div className="empty-state-title">Sin solicitudes</div>
                    <div className="empty-state-desc">No hay solicitudes de movimiento registradas.</div>
                  </div>
                </td>
              </tr>
            ) : filtered.map(m => (
              <tr key={m.id}>
                <td>
                  <Link href={`/assets/${m.assetId}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>
                    {m.asset?.nombre}
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{m.asset?.codigoInventario}</div>
                </td>
                <td style={{ color: 'var(--color-text-secondary)' }}>📍 {m.asset?.location?.nombre}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>→ {m.nuevaLocation?.nombre ?? '—'}</td>
                <td className="truncate" style={{ maxWidth: 200, color: 'var(--color-text-secondary)' }}>{m.motivo}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{m.requestedBy?.name}</td>
                <td><span className={requestStatusBadge(m.status)}>{REQUEST_STATUS_LABELS[m.status as RequestStatus]}</span></td>
                <td style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>{formatDateTime(m.createdAt)}</td>
                {ROLE === 'ADMIN' && (
                  <td>
                    {m.status === 'PENDING' && (
                      <div className="table-actions">
                        <button
                          id={`btn-approve-${m.id}`}
                          className="btn btn-sm"
                          style={{ background: 'var(--color-approved-bg)', color: 'var(--color-approved)', border: '1px solid rgba(34,197,94,0.2)' }}
                          onClick={() => setSelected({ ...m, _action: 'APPROVED' })}
                        >✓ Aprobar</button>
                        <button
                          id={`btn-reject-${m.id}`}
                          className="btn btn-sm"
                          style={{ background: 'var(--color-rejected-bg)', color: 'var(--color-rejected)', border: '1px solid rgba(239,68,68,0.2)' }}
                          onClick={() => setSelected({ ...m, _action: 'REJECTED' })}
                        >✕ Rechazar</button>
                      </div>
                    )}
                    {m.status !== 'PENDING' && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.approvedBy?.name ?? '—'}</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {selected._action === 'APPROVED' ? '✅ Confirmar Aprobación' : '❌ Confirmar Rechazo'}
              </span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                {selected._action === 'APPROVED'
                  ? `¿Aprobar el traslado de "${selected.asset?.nombre}" a "${selected.nuevaLocation?.nombre}"? Esta acción actualizará la ubicación del activo.`
                  : `¿Rechazar la solicitud de traslado de "${selected.asset?.nombre}"?`}
              </p>
              <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>MOTIVO DE LA SOLICITUD</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{selected.motivo}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cancelar</button>
              <button
                id="btn-confirm-action"
                className={`btn ${selected._action === 'APPROVED' ? 'btn-primary' : 'btn-danger'}`}
                onClick={() => handleAction(selected.id, selected._action)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Procesando...' : (selected._action === 'APPROVED' ? '✅ Aprobar' : '❌ Rechazar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
