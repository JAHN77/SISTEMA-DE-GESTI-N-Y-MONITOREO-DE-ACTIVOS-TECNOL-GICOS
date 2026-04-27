'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { MaintenanceType } from '@/types/domain'
import { maintenanceTypeBadge, MAINTENANCE_TYPE_LABELS, formatDate, formatCurrency } from '@/lib/ui-helpers'
// Client-side page — fetches from API routes
export default function MaintenancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState<MaintenanceType | ''>('')

  useEffect(() => {
    fetch('/api/maintenance').then(r => r.json()).then(d => {
      setRecords(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  const filtered = filterTipo ? records.filter(r => r.tipo === filterTipo) : records

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Mantenimiento</span>
      </div>

      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="page-title">Registros de Mantenimiento</h1>
          <p className="page-subtitle">Historial de mantenimientos preventivos, correctivos y calibraciones</p>
        </div>
      </div>

      <div className="filters-bar">
        {(['', 'PREVENTIVO', 'CORRECTIVO', 'CALIBRACION'] as const).map(t => (
          <button
            key={t}
            id={`filter-maint-${t || 'all'}`}
            className={`filter-chip${filterTipo === t ? ' active' : ''}`}
            onClick={() => setFilterTipo(t)}
          >
            {t === '' ? 'Todos' : MAINTENANCE_TYPE_LABELS[t]}
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
              <th>Proveedor</th>
              <th>Costo</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Técnico</th>
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
                    <div className="empty-state-icon">🔧</div>
                    <div className="empty-state-title">Sin registros de mantenimiento</div>
                    <div className="empty-state-desc">Los mantenimientos se registran desde la vista de detalle de cada activo.</div>
                  </div>
                </td>
              </tr>
            ) : filtered.map((m: any) => (
              <tr key={m.id}>
                <td><span className={maintenanceTypeBadge(m.tipo)}>{MAINTENANCE_TYPE_LABELS[m.tipo as MaintenanceType]}</span></td>
                <td>
                  <Link href={`/assets/${m.assetId}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                    {m.asset?.nombre ?? `#${m.assetId}`}
                  </Link>
                </td>
                <td className="truncate" style={{ maxWidth: 220, color: 'var(--color-text-secondary)' }}>{m.descripcion}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{m.proveedor ?? '—'}</td>
                <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatCurrency(m.costo)}</td>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDate(m.fechaInicio)}</td>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{m.fechaFin ? formatDate(m.fechaFin) : <em style={{ color: 'var(--color-mantenimiento)' }}>En curso</em>}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{m.realizadoPor?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
