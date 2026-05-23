'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { EventType } from '@/types/domain'
import { eventTypeBadge, EVENT_TYPE_LABELS, formatDateTime, timeAgo } from '@/lib/ui-helpers'
import { ClipboardIcon } from '@/components/icons'

const ALL_TYPES: EventType[] = ['CREACION','ACTUALIZACION','CAMBIO_ESTADO','ASIGNACION','DESASIGNACION','MANTENIMIENTO','CAMBIO_CATEGORIA','CAMBIO_UBICACION']

export default function LogsPage() {
  const [logs, setLogs]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState<EventType | ''>('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterTipo) params.set('tipo', filterTipo)
    fetch(`/api/logs?${params}`).then(r => r.json()).then(setLogs).finally(() => setLoading(false))
  }, [filterTipo])

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Bitácora de Eventos</span>
      </div>

      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="page-title">Bitácora del Sistema</h1>
          <p className="page-subtitle">Registro completo de todas las acciones del sistema</p>
        </div>
      </div>

      {/* Event type filter */}
      <div className="filters-bar">
        <button id="filter-log-all" className={`filter-chip${filterTipo === '' ? ' active' : ''}`} onClick={() => setFilterTipo('')}>Todos</button>
        {ALL_TYPES.map(t => (
          <button
            key={t}
            id={`filter-log-${t}`}
            className={`filter-chip${filterTipo === t ? ' active' : ''}`}
            onClick={() => setFilterTipo(t)}
          >
            {EVENT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Activo</th>
              <th className="col-secondary">Tipo</th>
              <th className="col-secondary">Descripción</th>
              <th className="col-optional">Actor</th>
              <th className="col-optional">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>)}</tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><ClipboardIcon size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-title">Sin eventos</div>
                    <div className="empty-state-desc">No se encontraron eventos con el filtro seleccionado.</div>
                  </div>
                </td>
              </tr>
            ) : logs.map(log => (
              <tr key={log.id}>
                <td className="col-title">
                  <div>
                    <Link href={`/assets/${log.assetId}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                      {log.asset?.nombre ?? `#${log.assetId}`}
                    </Link>
                    {log.asset?.codigoInventario && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{log.asset.codigoInventario}</div>}
                  </div>
                  <span className={eventTypeBadge(log.tipo)} style={{ flexShrink: 0 }}>{EVENT_TYPE_LABELS[log.tipo as EventType]}</span>
                </td>
                <td className="col-secondary" data-label="Tipo"><span className={eventTypeBadge(log.tipo)}>{EVENT_TYPE_LABELS[log.tipo as EventType]}</span></td>
                <td className="col-secondary" data-label="Descripción" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="truncate" style={{ maxWidth: 280 }}>{log.descripcion}</span>
                </td>
                <td className="col-optional" data-label="Actor" style={{ color: 'var(--color-text-secondary)' }}>{log.user?.name ?? <span style={{ color: 'var(--color-text-muted)' }}>Sistema</span>}</td>
                <td className="col-optional" data-label="Fecha" style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{formatDateTime(log.fecha)}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{timeAgo(log.fecha)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
