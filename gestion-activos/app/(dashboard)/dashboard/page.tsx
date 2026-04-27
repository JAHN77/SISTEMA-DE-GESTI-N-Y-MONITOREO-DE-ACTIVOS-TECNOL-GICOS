'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { DashboardStats } from '@/types/domain'
import { eventTypeBadge, EVENT_TYPE_LABELS, ESTADO_TECNICO_LABELS, formatDateTime } from '@/lib/ui-helpers'

function MetricCard({
  icon, label, value, color, glow,
}: {
  icon: string; label: string; value: number | string; color: string; glow: string
}) {
  return (
    <div className="metric-card">
      <div className="metric-card-glow" style={{ background: glow }} />
      <div className="metric-card-icon" style={{ background: `${color}20` }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="metric-card-value" style={{ color }}>{value}</div>
      <div className="metric-card-label">{label}</div>
    </div>
  )
}

function MiniBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 600 }}>{value} <span style={{ color: 'var(--color-text-muted)' }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--color-bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 600ms ease' }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div><div className="page-title">Dashboard</div><div className="page-subtitle">Vista general del sistema</div></div>
        </div>
        <div className="metric-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="metric-card">
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: 80, height: 28, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 120, height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Estado del sistema de activos tecnológicos</p>
        </div>
        <div className="page-header-actions">
          <Link href="/assets/new" className="btn btn-primary">
            + Nuevo Activo
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="metric-grid">
        <MetricCard icon="📦" label="Total de Activos"  value={stats.totalAssets} color="var(--color-text-primary)" glow="#fff" />
        <MetricCard icon="✅" label="Operativos"        value={stats.operative}   color="var(--color-operativo)"    glow="var(--color-operativo)" />
        <MetricCard icon="🔧" label="En Mantenimiento"  value={stats.inMaintenance} color="var(--color-mantenimiento)" glow="var(--color-mantenimiento)" />
        <MetricCard icon="❌" label="Dañados / Inactivos" value={stats.damaged}   color="var(--color-danado)"       glow="var(--color-danado)" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Estado Técnico */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Estado Técnico</span>
          </div>
          <div className="card-body">
            {(Object.entries(stats.byTechnicalState) as [string, number][]).map(([estado, count]) => {
              const colors: Record<string, string> = {
                OPERATIVO: 'var(--color-operativo)', EN_MANTENIMIENTO: 'var(--color-mantenimiento)',
                EN_REPARACION: 'var(--color-reparacion)', DANADO: 'var(--color-danado)',
                FUERA_DE_SERVICIO: 'var(--color-fuera)', DE_BAJA: 'var(--color-baja)',
              }
              return (
                <MiniBar
                  key={estado}
                  label={ESTADO_TECNICO_LABELS[estado as keyof typeof ESTADO_TECNICO_LABELS] ?? estado}
                  value={count}
                  total={stats.totalAssets}
                  color={colors[estado] ?? '#888'}
                />
              )
            })}
          </div>
        </div>

        {/* Estado de Uso */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Estado de Uso</span>
          </div>
          <div className="card-body">
            {(Object.entries(stats.byUsageState) as [string, number][]).map(([estado, count]) => {
              const colors: Record<string, string> = {
                DISPONIBLE: 'var(--color-disponible)', ASIGNADO: 'var(--color-asignado)',
                RESERVADO: 'var(--color-reservado)', NO_DISPONIBLE: 'var(--color-baja)',
              }
              const labels: Record<string, string> = {
                DISPONIBLE: 'Disponible', ASIGNADO: 'Asignado',
                RESERVADO: 'Reservado', NO_DISPONIBLE: 'No Disponible',
              }
              return (
                <MiniBar key={estado} label={labels[estado] ?? estado} value={count} total={stats.totalAssets} color={colors[estado] ?? '#888'} />
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Actividad Reciente</span>
          <Link href="/logs" className="btn btn-ghost btn-sm">Ver todo →</Link>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
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
              {stats.recentLogs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin actividad reciente</td></tr>
              ) : (
                stats.recentLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td><span className={eventTypeBadge(log.tipo)}>{EVENT_TYPE_LABELS[log.tipo as keyof typeof EVENT_TYPE_LABELS] ?? log.tipo}</span></td>
                    <td>
                      <Link href={`/assets/${log.assetId}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontSize: 13 }}>
                        {log.asset?.nombre ?? `#${log.assetId}`}
                      </Link>
                    </td>
                    <td className="truncate" style={{ maxWidth: 280 }}>{log.descripcion}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{log.user?.name ?? '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(log.fecha)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
