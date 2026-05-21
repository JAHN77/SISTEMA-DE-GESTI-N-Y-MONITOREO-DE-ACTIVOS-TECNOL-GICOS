'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { DashboardStats } from '@/types/domain'
import { eventTypeBadge, EVENT_TYPE_LABELS, ESTADO_TECNICO_LABELS, formatDateTime } from '@/lib/ui-helpers'

function MetricCard({
  icon, label, value, color, trend
}: {
  icon: React.ReactNode; label: string; value: number | string; color: string; trend?: { value: string, positive: boolean }
}) {
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          background: `${color}15`, 
          color: color, 
          padding: '8px', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 500, 
            color: trend.positive ? 'var(--color-operativo)' : 'var(--color-danado)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: trend.positive ? 'var(--color-operativo)15' : 'var(--color-danado)15',
            padding: '2px 8px',
            borderRadius: '99px'
          }}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  )
}

function MiniBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 600 }}>{value} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--color-bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 600ms ease' }} />
      </div>
    </div>
  )
}

function AlertItem({ title, description, type, time }: { title: string, description: string, type: 'critical' | 'warning' | 'neutral', time: string }) {
  const colors = {
    critical: 'var(--color-danado)',
    warning: 'var(--color-mantenimiento)',
    neutral: 'var(--color-text-secondary)'
  }
  const bgColors = {
    critical: 'var(--color-danado)15',
    warning: 'var(--color-mantenimiento)15',
    neutral: 'var(--color-bg-overlay)'
  }
  
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '12px', borderBottom: '1px solid var(--color-border)', alignItems: 'flex-start' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[type], marginTop: '6px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{description}</div>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{time}</div>
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
      <div style={{ padding: '24px' }}>
        <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', borderRadius: '4px' }} />
        <div className="skeleton" style={{ width: '300px', height: '20px', marginBottom: '32px', borderRadius: '4px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />)}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header omitted as it is now in the layout/header area or kept minimal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Vista General</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>Monitoreo de estado y operaciones en tiempo real</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-primary)' }}>Descargar Reporte</button>
        </div>
      </div>

      {/* SECTION 1 - KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <MetricCard 
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>} 
          label="Total Activos" value={stats.totalAssets} color="var(--color-primary)" 
          trend={{ value: '12', positive: true }} 
        />
        <MetricCard 
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>} 
          label="Activos Operativos" value={stats.operative} color="var(--color-operativo)" 
          trend={{ value: '2.4%', positive: true }} 
        />
        <MetricCard 
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>} 
          label="En Mantenimiento" value={stats.inMaintenance} color="var(--color-mantenimiento)" 
          trend={{ value: '1', positive: false }} 
        />
        <MetricCard 
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>} 
          label="Dañados / Inactivos" value={stats.damaged} color="var(--color-danado)" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SECTION 2 - SYSTEM HEALTH CHART */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 24px 0', color: 'var(--color-text-primary)' }}>Distribución del Estado Técnico</h3>
            
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              {/* Minimalist SVG Donut Chart */}
              <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-bg-overlay)" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-operativo)" strokeWidth="4" strokeDasharray={`${stats.totalAssets > 0 ? (stats.operative / stats.totalAssets) * 100 : 0}, 100`} />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{stats.totalAssets > 0 ? Math.round((stats.operative / stats.totalAssets) * 100) : 0}%</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Salud</span>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                {(Object.entries(stats.byTechnicalState) as [string, number][]).map(([estado, count]) => {
                  const colors: Record<string, string> = {
                    OPERATIVO: 'var(--color-operativo)', EN_MANTENIMIENTO: 'var(--color-mantenimiento)',
                    EN_REPARACION: 'var(--color-reparacion)', DANADO: 'var(--color-danado)',
                    FUERA_DE_SERVICIO: 'var(--color-fuera)', DE_BAJA: 'var(--color-baja)',
                  }
                  if (count === 0 && estado !== 'OPERATIVO') return null; // Hide empty states for minimal look
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
          </div>

          {/* SECTION 3 - RECENT ACTIVITY TABLE */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>Actividad Reciente</h3>
              <Link href="/logs" style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>Ver todo →</Link>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--color-bg-overlay)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <tr>
                  <th style={{ padding: '12px 24px', fontWeight: 500, borderBottom: '1px solid var(--color-border)' }}>Activo</th>
                  <th style={{ padding: '12px 24px', fontWeight: 500, borderBottom: '1px solid var(--color-border)' }}>Acción</th>
                  <th style={{ padding: '12px 24px', fontWeight: 500, borderBottom: '1px solid var(--color-border)' }}>Usuario</th>
                  <th style={{ padding: '12px 24px', fontWeight: 500, borderBottom: '1px solid var(--color-border)' }}>Fecha</th>
                  <th style={{ padding: '12px 24px', fontWeight: 500, borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {stats.recentLogs.slice(0, 5).map((log: any) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s', cursor: 'pointer' }} className="hover:bg-var(--color-bg-overlay)">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{log.asset?.nombre ?? `#${log.assetId}`}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{log.asset?.codigoInventario}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={eventTypeBadge(log.tipo)}>{EVENT_TYPE_LABELS[log.tipo as keyof typeof EVENT_TYPE_LABELS] ?? log.tipo}</span>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{log.user?.name ?? 'Sistema'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(log.fecha)}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {stats.recentLogs.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin actividad reciente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4 - ALERTS PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>Panel de Alertas</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AlertItem 
                title="Movimientos Pendientes" 
                description="Existen 3 solicitudes de movimiento que requieren aprobación." 
                type="warning" 
                time="Hace 1h" 
              />
              <AlertItem 
                title="Mantenimiento Atrasado" 
                description="Servidor DELL PowerEdge (SV-002) tiene mantenimiento preventivo vencido." 
                type="critical" 
                time="Hace 2h" 
              />
              <AlertItem 
                title="Garantías por Expirar" 
                description="5 Laptops ThinkPad T14 pierden garantía este mes." 
                type="neutral" 
                time="Ayer" 
              />
              <AlertItem 
                title="Alerta de Capacidad" 
                description="El stock de componentes de red (Switches) está por debajo del mínimo (2)." 
                type="warning" 
                time="Ayer" 
              />
            </div>
            <div style={{ padding: '16px', textAlign: 'center', background: 'var(--color-bg-overlay)', borderTop: '1px solid var(--color-border)' }}>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Gestionar Alertas</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
