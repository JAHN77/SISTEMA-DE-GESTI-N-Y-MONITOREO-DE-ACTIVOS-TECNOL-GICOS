'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { MaintenanceType } from '@/types/domain'
import { maintenanceTypeBadge, MAINTENANCE_TYPE_LABELS, formatDate, formatCurrency } from '@/lib/ui-helpers'
import { WrenchIcon, PlusIcon } from '@/components/icons'
import MaintenanceCreateModal from '@/components/maintenance/MaintenanceCreateModal'

export default function MaintenancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState<MaintenanceType | ''>('')
  const [showCreate, setShowCreate] = useState(false)

  function loadRecords() {
    setLoading(true)
    fetch('/api/maintenance').then(r => r.json()).then(d => {
      setRecords(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }

  useEffect(() => { loadRecords() }, [])

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
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <PlusIcon size={14} /> Nuevo Mantenimiento
        </button>
      </div>

      {showCreate && (
        <MaintenanceCreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); loadRecords() }}
        />
      )}

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
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Activo</th>
              <th>Tipo</th>
              <th className="col-secondary">Descripción</th>
              <th className="col-optional">Proveedor</th>
              <th className="col-secondary">Costo</th>
              <th className="col-optional">Fecha Inicio</th>
              <th className="col-optional">Fecha Fin</th>
              <th className="col-secondary">Técnico</th>
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
                    <div className="empty-state-icon"><WrenchIcon size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-title">Sin registros de mantenimiento</div>
                    <div className="empty-state-desc">Los mantenimientos se registran desde la vista de detalle de cada activo.</div>
                  </div>
                </td>
              </tr>
            ) : filtered.map((m: any) => (
              <tr key={m.id}>
                <td className="col-title">
                  <div>
                    <Link href={`/assets/${m.assetId}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                      {m.asset?.nombre ?? `#${m.assetId}`}
                    </Link>
                    {m.realizadoPor && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{m.realizadoPor.name}</div>}
                  </div>
                  <span className={maintenanceTypeBadge(m.tipo)} style={{ flexShrink: 0 }}>{MAINTENANCE_TYPE_LABELS[m.tipo as MaintenanceType]}</span>
                </td>
                <td data-label="Tipo"><span className={maintenanceTypeBadge(m.tipo)}>{MAINTENANCE_TYPE_LABELS[m.tipo as MaintenanceType]}</span></td>
                <td className="col-secondary" data-label="Descripción" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="truncate" style={{ maxWidth: 220 }}>{m.descripcion}</span>
                </td>
                <td className="col-optional" data-label="Proveedor" style={{ color: 'var(--color-text-secondary)' }}>{m.proveedor ?? '—'}</td>
                <td className="col-secondary" data-label="Costo" style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatCurrency(m.costo)}</td>
                <td className="col-optional" data-label="Inicio" style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDate(m.fechaInicio)}</td>
                <td className="col-optional" data-label="Fin" style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                  {m.fechaFin ? formatDate(m.fechaFin) : <em style={{ color: 'var(--color-mantenimiento)' }}>En curso</em>}
                </td>
                <td className="col-secondary" data-label="Técnico" style={{ color: 'var(--color-text-secondary)' }}>{m.realizadoPor?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
