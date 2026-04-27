'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { EventType } from '@/types/domain'
import { eventTypeBadge, EVENT_TYPE_LABELS, formatDateTime, timeAgo } from '@/lib/ui-helpers'

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
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Activo</th>
              <th>Descripción</th>
              <th>Actor</th>
              <th>Fecha</th>
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
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-title">Sin eventos</div>
                    <div className="empty-state-desc">No se encontraron eventos con el filtro seleccionado.</div>
                  </div>
                </td>
              </tr>
            ) : logs.map(log => (
              <tr key={log.id}>
                <td><span className={eventTypeBadge(log.tipo)}>{EVENT_TYPE_LABELS[log.tipo as EventType]}</span></td>
                <td>
                  <Link href={`/assets/${log.assetId}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontSize: 13 }}>
                    {log.asset?.nombre ?? `#${log.assetId}`}
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{log.asset?.codigoInventario}</div>
                </td>
                <td style={{ color: 'var(--color-text-secondary)', maxWidth: 320 }} className="truncate">{log.descripcion}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{log.user?.name ?? <span style={{ color: 'var(--color-text-muted)' }}>Sistema</span>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
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
