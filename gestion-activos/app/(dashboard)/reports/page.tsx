'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/ToastProvider'
import { ClipboardIcon, PackageIcon, TruckIcon, WrenchIcon } from '@/components/icons'

type ReportType = 'assets' | 'maintenance' | 'movements'

const REPORTS = [
  { type: 'assets'      as const, label: 'Activos',       desc: 'Inventario completo de activos con estado, ubicación y asignación',  icon: <PackageIcon size={18} /> },
  { type: 'maintenance' as const, label: 'Mantenimientos', desc: 'Historial de mantenimientos con costos, técnicos y estados',         icon: <WrenchIcon size={18} /> },
  { type: 'movements'   as const, label: 'Movimientos',    desc: 'Solicitudes de traslado, estados y aprobaciones',                    icon: <TruckIcon size={18} /> },
]

function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape  = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [selected, setSelected] = useState<ReportType>('assets')
  const [data, setData]         = useState<any[]>([])
  const [loading, setLoading]   = useState(false)
  const [loaded, setLoaded]     = useState(false)

  async function loadReport(type: ReportType) {
    setSelected(type)
    setLoaded(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?type=${type}`)
      if (!res.ok) { toast('error', 'Error', 'No se pudo generar el reporte'); return }
      const d = await res.json()
      setData(d)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    const labels: Record<ReportType, string> = { assets: 'activos', maintenance: 'mantenimientos', movements: 'movimientos' }
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(toCSV(data), `itam_${labels[selected]}_${date}.csv`)
    toast('success', 'CSV descargado', `Reporte de ${labels[selected]} exportado.`)
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Reportes</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Genera y exporta reportes operacionales del sistema</p>
        </div>
      </div>

      {/* Report type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {REPORTS.map(r => (
          <button
            key={r.type}
            onClick={() => loadReport(r.type)}
            disabled={loading}
            style={{
              background: selected === r.type ? 'var(--color-primary-bg)' : 'var(--color-bg-elevated)',
              border: `1px solid ${selected === r.type ? 'rgba(99,102,241,0.4)' : 'var(--color-border)'}`,
              borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
              textAlign: 'left', transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ color: selected === r.type ? 'var(--color-primary)' : 'var(--color-text-secondary)', marginBottom: 8 }}>
              {r.icon}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{r.desc}</div>
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <span className="loading-spinner" style={{ width: 20, height: 20, display: 'inline-block' }} />
          <div style={{ marginTop: 12, fontSize: 13 }}>Generando reporte...</div>
        </div>
      )}

      {loaded && !loading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>{data.length}</strong> registros encontrados
            </div>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={data.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ClipboardIcon size={14} /> Descargar CSV
            </button>
          </div>

          <div className="table-wrapper" style={{ maxHeight: 500, overflowY: 'auto' }}>
            {data.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">Sin datos</div>
                <div className="empty-state-desc">No hay registros para este tipo de reporte.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    {columns.map(col => <th key={col} style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 200).map((row, i) => (
                    <tr key={i}>
                      {columns.map(col => (
                        <td key={col} style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row[col] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {data.length > 200 && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
              Mostrando los primeros 200 registros. El CSV incluye todos los {data.length}.
            </div>
          )}
        </>
      )}
    </div>
  )
}
