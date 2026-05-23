'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/ToastProvider'
import {
  estadoTecnicoBadge, estadoUsoBadge,
  ESTADO_TECNICO_LABELS, ESTADO_USO_LABELS,
  EVENT_TYPE_LABELS, eventTypeBadge,
  REQUEST_STATUS_LABELS, requestStatusBadge,
  formatDate, formatDateTime, timeAgo, formatCurrency,
} from '@/lib/ui-helpers'
import type { EstadoTecnico, EstadoUso } from '@/types/domain'
import {
  WrenchIcon, ClipboardIcon, UsersIcon, UserIcon,
  BuildingIcon, SearchIcon, EditIcon, TrashIcon, TruckIcon, RefreshIcon,
  CheckIcon, XIcon, AlertIcon, InfoIcon, ZapIcon, NoteIcon,
} from '@/components/icons'
import { AssetImage } from '@/components/assets/asset-image'

const LABEL = (map: Record<string, string>, key: string) => map[key] ?? key

// ─── Tab config ─────────────────────────────────────────────────
type Tab = 'overview' | 'specs' | 'assignments' | 'maintenance' | 'movements' | 'logs'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',    label: 'Resumen' },
  { id: 'specs',       label: 'Especificaciones' },
  { id: 'assignments', label: 'Asignaciones' },
  { id: 'maintenance', label: 'Mantenimiento' },
  { id: 'movements',   label: 'Traslados' },
  { id: 'logs',        label: 'Bitácora' },
]

// ─── Shared helpers ──────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico', USER: 'Usuario', AUDITOR: 'Auditor',
}

const MAINT_STATUS_BADGE: Record<string, string> = {
  SCHEDULED:   'badge badge-pending',
  IN_PROGRESS: 'badge badge-in-progress',
  COMPLETED:   'badge badge-approved',
  CANCELLED:   'badge badge-rejected',
}
const MAINT_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Programado', IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',  CANCELLED: 'Cancelado',
}
const MAINT_TYPE_LABEL: Record<string, string> = {
  PREVENTIVE: 'Preventivo', CORRECTIVE: 'Correctivo',
  CALIBRATION: 'Calibración', UPDATE: 'Actualización', CLEANING: 'Limpieza',
}
const MAINT_TYPE_OPTIONS = [
  { value: 'PREVENTIVO', label: 'Preventivo' },
  { value: 'CORRECTIVO', label: 'Correctivo' },
  { value: 'CALIBRACION', label: 'Calibración' },
  { value: 'ACTUALIZACION', label: 'Actualización' },
  { value: 'LIMPIEZA', label: 'Limpieza' },
]

const LOCATION_TYPE_LABEL: Record<string, string> = {
  CAMPUS: 'Campus', BUILDING: 'Edificio', FLOOR: 'Piso',
  AREA: 'Área', OFFICE: 'Oficina', LABORATORY: 'Laboratorio',
  WAREHOUSE: 'Bodega', SERVER_ROOM: 'Sala de Servidores', WORKSTATION: 'Estación de Trabajo',
}

const LOG_ICON: Record<string, string> = {
  CREACION: '+', ACTUALIZACION: '~', CAMBIO_ESTADO: '⇄',
  ASIGNACION: '→', DESASIGNACION: '←', MANTENIMIENTO: '⚙',
  CAMBIO_CATEGORIA: '≡', CAMBIO_UBICACION: '◎',
  DESBILITADO: '✕', REACTIVADO: '↺', PRESTAMO: '↗', DEVOLUCION: '↙',
}

function calcDuration(start: string, end?: string | null): string {
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  const days = Math.floor((e.getTime() - s.getTime()) / 86400000)
  if (days < 1)   return 'Hoy'
  if (days < 30)  return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}m ${days % 30}d`
  return `${Math.floor(days / 365)}a ${Math.floor((days % 365) / 30)}m`
}

function UserAvatar({ name, size = 36, style: s = {} }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--color-primary-bg)',
      border: '1px solid rgba(99,102,241,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: 'var(--color-primary)',
      ...s,
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{value ?? <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────
export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { user } = useAuth()

  const [asset, setAsset]     = useState<any>(null)
  const [tab, setTab]         = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const canEdit  = ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'].includes(user.role)
  const canAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user.role)

  const loadAsset = useCallback(() => {
    setLoading(true)
    fetch(`/api/assets/${id}`)
      .then(r => r.json())
      .then(data => { setAsset(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => { loadAsset() }, [loadAsset])

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${asset?.nombre}"? Se realizará un soft delete.`)) return
    setDeleting(true)
    await fetch(`/api/assets/${id}`, { method: 'DELETE' })
    router.push('/assets')
  }

  if (loading) return (
    <div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: i === 0 ? 80 : 36, borderRadius: 8, marginBottom: 16 }} />
      ))}
    </div>
  )

  if (!asset || asset.error) return (
    <div className="empty-state">
      <div className="empty-state-icon"><AlertIcon size={32} strokeWidth={1.5} /></div>
      <div className="empty-state-title">Activo no encontrado</div>
      <Link href="/assets" className="btn btn-secondary">← Volver a Activos</Link>
    </div>
  )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <Link href="/assets">Activos</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">{asset.nombre}</span>
      </div>

      {/* Header */}
      <div style={{
        background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: '20px 24px',
        marginTop: 16, marginBottom: 16,
        display: 'flex', gap: 20, alignItems: 'flex-start',
      }}>
        <AssetImage
          imageUrl={asset.imageUrl}
          categoryName={asset.category?.nombre}
          size={80}
          alt={asset.nombre}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            {asset.nombre}
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg-overlay)', padding: '2px 8px', borderRadius: 4 }}>
              {asset.codigoInventario}
            </span>
            {asset.serial && (
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                S/N: {asset.serial}
              </span>
            )}
            {asset.location && (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {asset.location.nombre}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className={estadoTecnicoBadge(asset.estadoTecnico as EstadoTecnico)}>{ESTADO_TECNICO_LABELS[asset.estadoTecnico as EstadoTecnico] ?? asset.estadoTecnico}</span>
            <span className={estadoUsoBadge(asset.estadoUso as EstadoUso)}>{ESTADO_USO_LABELS[asset.estadoUso as EstadoUso] ?? asset.estadoUso}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {canEdit && (
            <Link href={`/assets/${id}/edit`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><EditIcon size={13} /> Editar</Link>
          )}
          {canAdmin && (
            <button className="btn btn-sm" onClick={handleDelete} disabled={deleting}
              style={{ background: 'var(--color-danado-bg)', color: 'var(--color-danado)', border: '1px solid var(--color-danado)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {deleting ? '...' : <><TrashIcon size={13} /> Eliminar</>}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'    && <OverviewTab    asset={asset} canEdit={canEdit} setTab={setTab} />}
      {tab === 'specs'       && <SpecsTab       spec={asset.spec} />}
      {tab === 'assignments' && <AssignmentsTab asset={asset} canEdit={canEdit} currentUserId={user.id} onRefresh={loadAsset} />}
      {tab === 'maintenance' && <MaintenanceTab asset={asset} canEdit={canEdit} currentUserId={user.id} onRefresh={loadAsset} />}
      {tab === 'movements'   && <MovementsTab   asset={asset} canEdit={canEdit} currentUserId={user.id} onRefresh={loadAsset} />}
      {tab === 'logs'        && <LogsTab        logs={asset.logs ?? []} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 1. OVERVIEW TAB — Operational control center summary
// ══════════════════════════════════════════════════════════════════
function OverviewTab({ asset, canEdit, setTab }: { asset: any; canEdit: boolean; setTab: (t: Tab) => void }) {
  const activeAssignment = (asset.assignments ?? []).find((a: any) => !a.endDate)
  const recentLogs       = (asset.logs ?? []).slice(0, 5)
  const activeMaintenance = (asset.maintenances ?? []).find((m: any) =>
    m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS'
  )

  const warrantyDate    = asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null
  const warrantyExpired  = warrantyDate && warrantyDate < new Date()
  const warrantyExpiring = warrantyDate && !warrantyExpired &&
    (warrantyDate.getTime() - Date.now()) < 90 * 24 * 60 * 60 * 1000

  return (
    <div className="layout-detail-sidebar">

      {/* ── Left column ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canEdit && (
            <Link href={`/assets/${asset.id}/edit`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><EditIcon size={13} /> Editar Activo</Link>
          )}
          {canEdit && (
            <button className="btn btn-sm" onClick={() => setTab('assignments')}
              style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(99,102,241,0.25)' }}>
              + Asignar
            </button>
          )}
          {canEdit && (
            <button className="btn btn-sm" onClick={() => setTab('maintenance')}
              style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--color-mantenimiento)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <WrenchIcon size={13} /> Mantenimiento
            </button>
          )}
          <button className="btn btn-sm" onClick={() => setTab('movements')}
            style={{ background: 'rgba(14,165,233,0.08)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.25)' }}>
            Solicitar Traslado
          </button>
          <button className="btn btn-sm" onClick={() => setTab('logs')}
            style={{ background: 'var(--color-bg-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ClipboardIcon size={13} /> Bitácora
          </button>
        </div>

        {/* Alerts */}
        {(warrantyExpired || warrantyExpiring || activeMaintenance) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {warrantyExpired && (
              <AlertBanner type="error" onClick={() => {}}>
                Garantía vencida el {formatDate(asset.warrantyExpiry)}. Considera gestionar el soporte técnico.
              </AlertBanner>
            )}
            {warrantyExpiring && !warrantyExpired && (
              <AlertBanner type="warning" onClick={() => {}}>
                Garantía por vencer el {formatDate(asset.warrantyExpiry)} ({calcDuration(new Date().toISOString(), asset.warrantyExpiry)} restantes).
              </AlertBanner>
            )}
            {activeMaintenance && (
              <AlertBanner type="info" onClick={() => setTab('maintenance')}>
                Mantenimiento {MAINT_STATUS_LABEL[activeMaintenance.status]?.toLowerCase()} · {MAINT_TYPE_LABEL[activeMaintenance.type] ?? activeMaintenance.type}
                <span style={{ marginLeft: 8, textDecoration: 'underline', cursor: 'pointer' }}>Ver detalles →</span>
              </AlertBanner>
            )}
          </div>
        )}

        {/* Asset Information Card */}
        <div className="card">
          <div className="card-header"><span className="card-title">Información del Activo</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 20 }}>
              <InfoItem label="Nombre" value={asset.nombre} />
              <InfoItem label="Código de Inventario" value={<span className="font-mono">{asset.codigoInventario}</span>} />
              {asset.serial && <InfoItem label="Número de Serie" value={<span className="font-mono">{asset.serial}</span>} />}
              <InfoItem label="Categoría" value={asset.category?.name} />
              <InfoItem label="Ubicación actual" value={asset.location?.nombre} />
              <InfoItem label="Fecha de Adquisición" value={asset.acquisitionDate ? formatDate(asset.acquisitionDate) : null} />
              <InfoItem label="Garantía hasta" value={
                asset.warrantyExpiry
                  ? <span style={{ color: warrantyExpired ? 'var(--color-danado)' : warrantyExpiring ? 'var(--color-mantenimiento)' : 'inherit' }}>
                      {formatDate(asset.warrantyExpiry)}
                    </span>
                  : null
              } />
              <InfoItem label="Valor de Adquisición" value={asset.acquisitionValue ? formatCurrency(String(asset.acquisitionValue)) : null} />
              <InfoItem label="Registrado" value={formatDateTime(asset.createdAt)} />
              <InfoItem label="Última actualización" value={timeAgo(asset.updatedAt)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Current State Card */}
        <div className="card">
          <div className="card-header"><span className="card-title">Estado del Activo</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>Estado Técnico</div>
              <span className={estadoTecnicoBadge(asset.estadoTecnico as EstadoTecnico)} style={{ fontSize: 13, padding: '4px 12px' }}>
                {ESTADO_TECNICO_LABELS[asset.estadoTecnico as EstadoTecnico] ?? asset.estadoTecnico}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>Estado de Uso</div>
              <span className={estadoUsoBadge(asset.estadoUso as EstadoUso)} style={{ fontSize: 13, padding: '4px 12px' }}>
                {ESTADO_USO_LABELS[asset.estadoUso as EstadoUso] ?? asset.estadoUso}
              </span>
            </div>
          </div>
        </div>

        {/* Current Assignment Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Responsable</span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setTab('assignments')}>
              Gestionar →
            </button>
          </div>
          <div className="card-body">
            {activeAssignment ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <UserAvatar name={activeAssignment.user?.name ?? '?'} size={40} style={{ border: '2px solid rgba(99,102,241,0.3)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                    {activeAssignment.user?.name}
                  </div>
                  {activeAssignment.user?.department && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                      {activeAssignment.user.department}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Desde {formatDate(activeAssignment.startDate)} · {calcDuration(activeAssignment.startDate)} en uso
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: 8 }}><UserIcon size={28} strokeWidth={1.5} /></div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>Sin asignación activa</div>
                {canEdit && (
                  <button className="btn btn-primary btn-sm" onClick={() => setTab('assignments')}>+ Asignar</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <span className="card-title">Actividad Reciente</span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setTab('logs')}>
              Ver todo →
            </button>
          </div>
          {recentLogs.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Sin eventos registrados
            </div>
          ) : recentLogs.map((log: any, i: number) => (
            <div key={log.id} style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className={eventTypeBadge(log.tipo ?? log.type)} style={{ fontSize: 10, padding: '1px 6px' }}>
                  {LABEL(EVENT_TYPE_LABELS, log.tipo ?? log.type)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {timeAgo(log.occurredAt ?? log.fecha)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.description ?? log.descripcion}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AlertBanner({ type, children, onClick }: { type: 'error' | 'warning' | 'info'; children: React.ReactNode; onClick?: () => void }) {
  const styles = {
    error:   { bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.3)',   color: 'var(--color-danado)' },
    warning: { bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.3)',  color: 'var(--color-mantenimiento)' },
    info:    { bg: 'rgba(99,102,241,0.06)',  border: 'rgba(99,102,241,0.3)',  color: 'var(--color-primary)' },
  }[type]
  return (
    <div onClick={onClick} style={{
      padding: '10px 14px', borderRadius: 8, fontSize: 13,
      background: styles.bg, border: `1px solid ${styles.border}`, color: styles.color,
      display: 'flex', alignItems: 'center', gap: 8,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {type === 'error' ? <AlertIcon size={14} style={{ flexShrink: 0 }} /> : type === 'warning' ? <AlertIcon size={14} style={{ flexShrink: 0 }} /> : <InfoIcon size={14} style={{ flexShrink: 0 }} />} {children}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 2. SPECS TAB
// ══════════════════════════════════════════════════════════════════
function SpecsTab({ spec }: { spec: any }) {
  if (!spec) return (
    <div className="empty-state" style={{ padding: 40 }}>
      <div className="empty-state-icon"><WrenchIcon size={32} strokeWidth={1.5} /></div>
      <div className="empty-state-title">Sin especificaciones técnicas</div>
      <div className="empty-state-desc">Este activo no tiene especificaciones técnicas registradas.</div>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-header"><span className="card-title">Hardware</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <InfoItem label="Marca"          value={spec.brand} />
            <InfoItem label="Modelo"         value={spec.model} />
            <InfoItem label="CPU"            value={spec.cpu} />
            <InfoItem label="RAM"            value={spec.ram} />
            <InfoItem label="Almacenamiento" value={spec.storage} />
            <InfoItem label="Pantalla"       value={spec.screenSize} />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Software</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <InfoItem label="Sistema Operativo" value={spec.operatingSystem} />
            <InfoItem label="Versión SO"         value={spec.osVersion} />
            <InfoItem label="Licencia OS"        value={spec.osLicense} />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Red</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <InfoItem label="IP"       value={spec.ipAddress  ? <span className="font-mono">{spec.ipAddress}</span>  : null} />
            <InfoItem label="MAC"      value={spec.macAddress ? <span className="font-mono">{spec.macAddress}</span> : null} />
            <InfoItem label="Hostname" value={spec.hostname   ? <span className="font-mono">{spec.hostname}</span>   : null} />
            <InfoItem label="VLAN"     value={spec.vlan} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 3. ASSIGNMENTS TAB — Enterprise ownership lifecycle
// ══════════════════════════════════════════════════════════════════
function AssignmentsTab({
  asset, canEdit, currentUserId, onRefresh,
}: { asset: any; canEdit: boolean; currentUserId: number; onRefresh: () => void }) {
  const { toast } = useToast()

  const [users, setUsers]               = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showForm, setShowForm]         = useState(false)
  const [isReassign, setIsReassign]     = useState(false)
  const [search, setSearch]             = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [reason, setReason]             = useState('')
  const [notes, setNotes]               = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [returning, setReturning]       = useState(false)

  const assignments = asset.assignments ?? []
  const active = assignments.find((a: any) => !a.endDate)

  useEffect(() => {
    setUsersLoading(true)
    fetch('/api/users/assignable').then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUsers(data) })
      .finally(() => setUsersLoading(false))
  }, [])

  const filteredUsers = search.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : users.slice(0, 8)

  function resetForm() {
    setShowForm(false); setIsReassign(false); setSelectedUser(null)
    setSearch(''); setReason(''); setNotes(''); setShowDropdown(false)
  }

  async function handleAssign() {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      if (isReassign && active) {
        const endRes = await fetch(`/api/assets/${asset.id}/assignments`, { method: 'PATCH' })
        if (!endRes.ok) { const d = await endRes.json(); toast('error', 'Error al finalizar asignación', d.error); return }
      }
      const res = await fetch(`/api/assets/${asset.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, asignadoPorId: currentUserId, reason: reason || null, notes: notes || null }),
      })
      const data = await res.json()
      if (!res.ok) { toast('error', 'Error al asignar', data.error); return }
      toast('success', isReassign ? 'Activo reasignado' : 'Activo asignado', `${asset.nombre} asignado a ${selectedUser.name}.`)
      resetForm(); onRefresh()
    } finally { setSubmitting(false) }
  }

  async function handleEndAssignment() {
    if (!confirm(`¿Finalizar la asignación de ${active?.user?.name}?\nEl activo quedará disponible.`)) return
    setReturning(true)
    try {
      const res = await fetch(`/api/assets/${asset.id}/assignments`, { method: 'PATCH' })
      if (!res.ok) { const d = await res.json(); toast('error', 'Error al devolver activo', d.error); return }
      toast('success', 'Asignación finalizada', `${active?.user?.name} ha devuelto el activo.`)
      onRefresh()
    } finally { setReturning(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ─── Current Assignment Card ─── */}
      {active ? (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.07),rgba(99,102,241,0.07))', borderBottom: '1px solid var(--color-border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-operativo)', display: 'inline-block', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asignación Activa</span>
            </div>
            <span className="badge badge-asignado">En uso</span>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <UserAvatar name={active.user?.name ?? '?'} size={52} style={{ border: '2px solid rgba(99,102,241,0.4)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{active.user?.name}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                {active.user?.department && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg-overlay)', padding: '1px 8px', borderRadius: 99, border: '1px solid var(--color-border)' }}>
                    {active.user.department}
                  </span>
                )}
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{ROLE_LABELS[active.user?.role] ?? active.user?.role}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Desde {formatDate(active.startDate)}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{calcDuration(active.startDate)} en uso</span>
                {active.reason && <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>"{active.reason}"</span>}
              </div>
            </div>
            {canEdit && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setIsReassign(true); setShowForm(true) }} disabled={returning || submitting} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><RefreshIcon size={13} /> Reasignar</button>
                <button className="btn btn-sm" onClick={handleEndAssignment} disabled={returning || submitting}
                  style={{ background: 'var(--color-danado-bg)', color: 'var(--color-danado)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {returning ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '↩ Devolver'}
                </button>
              </div>
            )}
          </div>
          {active.notes && (
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-overlay)', fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {active.notes}
            </div>
          )}
        </div>
      ) : !showForm && canEdit && (
        <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 32, textAlign: 'center', background: 'var(--color-bg-surface)' }}>
          <div style={{ marginBottom: 12, color: 'var(--color-text-muted)' }}><UsersIcon size={36} strokeWidth={1.5} /></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>Sin asignación activa</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 18, maxWidth: 360, margin: '0 auto 18px' }}>
            Este activo está disponible. Asígnalo a un empleado para registrar la responsabilidad operativa.
          </div>
          <button className="btn btn-primary" onClick={() => { setIsReassign(false); setShowForm(true) }}>+ Asignar Activo</button>
        </div>
      )}

      {/* ─── Quick Assignment Panel ─── */}
      {showForm && canEdit && (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 0 0 4px rgba(99,102,241,0.08)' }}>
          <div style={{ background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
              {isReassign ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><RefreshIcon size={13} /> Reasignar Activo</span> : '+ Nueva Asignación'}
            </span>
            <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', lineHeight: 1, padding: '2px 4px', display: 'flex', alignItems: 'center' }} onClick={resetForm}><XIcon size={16} /></button>
          </div>
          <div style={{ padding: 20 }}>
            {isReassign && active && (
              <div style={{ padding: '10px 14px', marginBottom: 16, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--color-mantenimiento)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertIcon size={14} style={{ flexShrink: 0 }} /> La asignación actual de <strong>{active.user?.name}</strong> será finalizada automáticamente.
              </div>
            )}
            {/* Employee combobox */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Empleado <span style={{ color: 'var(--color-danado)', marginLeft: 2 }}>*</span></label>
              {selectedUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
                  <UserAvatar name={selectedUser.name} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedUser.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {selectedUser.department ?? 'Sin departamento'} · {ROLE_LABELS[selectedUser.role] ?? selectedUser.role}
                      {selectedUser.activeAssignments > 0 && <span style={{ marginLeft: 8, color: 'var(--color-mantenimiento)' }}>· {selectedUser.activeAssignments} activo{selectedUser.activeAssignments !== 1 ? 's' : ''} asignado{selectedUser.activeAssignments !== 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }} onClick={() => { setSelectedUser(null); setSearch('') }}><XIcon size={14} /></button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Buscar por nombre, correo o departamento..."
                    value={search} autoComplete="off"
                    onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                    onFocus={() => setShowDropdown(true)} />
                  {showDropdown && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setShowDropdown(false)} />
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', maxHeight: 300, overflowY: 'auto', zIndex: 31 }}>
                        {usersLoading ? (
                          <div style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                            <span className="loading-spinner" style={{ width: 14, height: 14, display: 'inline-block', marginRight: 6 }} />Cargando...
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>No se encontraron empleados</div>
                        ) : filteredUsers.map(u => (
                          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', transition: 'background 0.1s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-overlay)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                            onClick={() => { setSelectedUser(u); setSearch(''); setShowDropdown(false) }}>
                            <UserAvatar name={u.name} size={36} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>{u.department ?? 'Sin departamento'} · {ROLE_LABELS[u.role] ?? u.role}</div>
                            </div>
                            <div style={{ fontSize: 11, flexShrink: 0, color: u.activeAssignments > 0 ? 'var(--color-mantenimiento)' : 'var(--color-operativo)', fontWeight: 500 }}>
                              {u.activeAssignments ?? 0} asignado{(u.activeAssignments ?? 0) !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                        {!search && users.length > 8 && (
                          <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>Escribe para filtrar {users.length} empleados...</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 14 }}>
              <div className="form-group">
                <label className="form-label">Razón de asignación</label>
                <input className="form-input" placeholder="ej. Equipo de trabajo, reemplazo temporal..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Notas adicionales</label>
                <textarea className="form-input" rows={2} placeholder="Condiciones especiales, acuerdos, observaciones..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical', minHeight: 56 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedUser || submitting}
                style={{ minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {submitting
                  ? <><span className="loading-spinner" style={{ width: 14, height: 14 }} />{isReassign ? 'Reasignando...' : 'Asignando...'}</>
                  : isReassign
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><RefreshIcon size={14} /> Confirmar Reasignación</span>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckIcon size={14} /> Asignar Activo</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Assignment History ─── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Historial de Asignaciones <span style={{ fontWeight: 400 }}>({assignments.length})</span>
          </span>
          {!showForm && canEdit && active && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => { setIsReassign(false); setShowForm(true) }}>+ Nueva</button>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Empleado</th><th>Departamento</th><th>Asignado por</th>
                <th>Inicio</th><th>Fin</th><th>Duración</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state" style={{ padding: 32 }}>
                  <div className="empty-state-icon"><ClipboardIcon size={28} strokeWidth={1.5} /></div>
                  <div className="empty-state-title">Sin historial de asignaciones</div>
                </div></td></tr>
              ) : assignments.map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserAvatar name={a.user?.name ?? '?'} size={28} />
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{a.user?.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{a.user?.department ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{a.createdBy?.name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(a.startDate)}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {a.endDate ? <span style={{ color: 'var(--color-text-secondary)' }}>{formatDate(a.endDate)}</span>
                              : <span style={{ color: 'var(--color-operativo)', fontWeight: 600 }}>Activo</span>}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{calcDuration(a.startDate, a.endDate)}</td>
                  <td>{!a.endDate ? <span className="badge badge-asignado">Activo</span> : <span className="badge badge-baja">Finalizado</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 4. MAINTENANCE TAB — Enterprise Technical Lifecycle Control
// ══════════════════════════════════════════════════════════════════
const TECH_STATUS_ALL: EstadoTecnico[] = [
  'OPERATIVO', 'EN_MANTENIMIENTO', 'EN_REPARACION', 'DANADO', 'FUERA_DE_SERVICIO', 'EN_TRANSITO', 'DE_BAJA',
]

const TECH_STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  OPERATIVO:         { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)',   label: 'Operativo' },
  EN_MANTENIMIENTO:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.35)', label: 'En Mantenimiento' },
  EN_REPARACION:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.3)',  label: 'En Reparación' },
  DANADO:            { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   label: 'Dañado' },
  FUERA_DE_SERVICIO: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.3)', label: 'Fuera de Servicio' },
  EN_TRANSITO:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)',  label: 'En Tránsito' },
  DE_BAJA:           { color: '#374151', bg: 'rgba(55,65,81,0.08)',    border: 'rgba(55,65,81,0.3)',    label: 'De Baja' },
}

function TechnicianAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
    }}>
      {initials}
    </div>
  )
}

function RoleBadgeTech({ role }: { role: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    ADMIN:       { label: 'Admin',       color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
    TECHNICIAN:  { label: 'Técnico',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  }
  const c = cfg[role] ?? { label: role, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, color: c.color, background: c.bg, letterSpacing: '0.04em' }}>
      {c.label}
    </span>
  )
}

function MaintenanceTab({
  asset, canEdit, onRefresh,
}: { asset: any; canEdit: boolean; currentUserId: number; onRefresh: () => void }) {
  const { toast } = useToast()
  const maintenances = asset.maintenances ?? []
  const activeMaint  = maintenances.find((m: any) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS')
  const currentStatus = (asset.estadoTecnico ?? 'OPERATIVO') as EstadoTecnico
  const statusCfg = TECH_STATUS_CONFIG[currentStatus] ?? TECH_STATUS_CONFIG['OPERATIVO']

  const [technicians, setTechnicians]   = useState<any[]>([])
  const [loadingTechs, setLoadingTechs] = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [acting, setActing]             = useState(false)

  // form state
  const [isExternal, setIsExternal]         = useState(false)
  const [tipo, setTipo]                     = useState('PREVENTIVO')
  const [estadoInicial, setEstadoInicial]   = useState('SCHEDULED')
  const [descripcion, setDescripcion]       = useState('')
  const [proveedor, setProveedor]           = useState('')
  const [costo, setCosto]                   = useState('')
  const [fechaInicio, setFechaInicio]       = useState(new Date().toISOString().split('T')[0])
  const [realizadoPorId, setRealizadoPorId] = useState('')
  const [techSearch, setTechSearch]         = useState('')
  const [showTechDrop, setShowTechDrop]     = useState(false)
  const [progressNote, setProgressNote]     = useState('')

  useEffect(() => {
    setLoadingTechs(true)
    fetch('/api/technicians')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTechnicians(data) })
      .catch(() => setTechnicians([]))
      .finally(() => setLoadingTechs(false))
  }, [])

  const selectedTech  = technicians.find(t => String(t.id) === realizadoPorId)
  const filteredTechs = technicians.filter(t =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()) ||
    (t.department ?? '').toLowerCase().includes(techSearch.toLowerCase())
  )

  function resetForm() {
    setShowForm(false); setIsExternal(false); setTipo('PREVENTIVO'); setEstadoInicial('SCHEDULED')
    setDescripcion(''); setProveedor(''); setCosto('')
    setFechaInicio(new Date().toISOString().split('T')[0])
    setRealizadoPorId(''); setTechSearch(''); setShowTechDrop(false)
  }

  async function handleCreate() {
    if (!descripcion.trim() || !fechaInicio) return
    if (isExternal && !proveedor.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/assets/${asset.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo, descripcion, estadoInicial,
          proveedor: proveedor || null,
          costo:     costo     || null,
          fechaInicio,
          realizadoPorId: (!isExternal && realizadoPorId) ? realizadoPorId : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast('error', 'Error', data.error); return }
      toast('success', estadoInicial === 'IN_PROGRESS' ? 'Mantenimiento iniciado' : 'Mantenimiento programado',
        MAINT_TYPE_OPTIONS.find(o => o.value === tipo)?.label)
      resetForm(); onRefresh()
    } finally { setSubmitting(false) }
  }

  async function handleAction(maintenanceId: number, accion: string) {
    if (accion === 'ACTUALIZAR_PROGRESO') {
      if (!progressNote.trim()) return
      setActing(true)
      try {
        const res = await fetch(`/api/assets/${asset.id}/maintenance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maintenanceId, accion, nota: progressNote }),
        })
        if (!res.ok) { const d = await res.json(); toast('error', 'Error', d.error); return }
        toast('success', 'Progreso registrado', progressNote.slice(0, 60))
        setProgressNote(''); setShowProgress(false); onRefresh()
      } finally { setActing(false) }
      return
    }
    const label = accion === 'COMPLETAR' ? 'completado' : 'cancelado'
    if (!confirm(`¿Marcar este mantenimiento como ${label}?${accion === 'COMPLETAR' ? '\nEl activo volverá a estado OPERATIVO.' : ''}`)) return
    setActing(true)
    try {
      const res = await fetch(`/api/assets/${asset.id}/maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceId, accion }),
      })
      if (!res.ok) { const d = await res.json(); toast('error', 'Error', d.error); return }
      toast('success',
        accion === 'COMPLETAR' ? 'Mantenimiento completado' : 'Mantenimiento cancelado',
        accion === 'COMPLETAR' ? 'Activo restaurado a estado OPERATIVO.' : '')
      onRefresh()
    } finally { setActing(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ══ 1. TECHNICAL STATUS COMMAND CENTER ══ */}
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${statusCfg.border}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: `linear-gradient(135deg,${statusCfg.bg},transparent)`,
          borderBottom: '1px solid var(--color-border)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: statusCfg.bg, border: `2px solid ${statusCfg.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {currentStatus === 'OPERATIVO' ? <CheckIcon size={20} /> :
                 currentStatus === 'EN_MANTENIMIENTO' ? <WrenchIcon size={20} /> :
                 currentStatus === 'EN_REPARACION' ? <WrenchIcon size={20} /> :
                 currentStatus === 'DANADO' ? <AlertIcon size={20} /> :
                 currentStatus === 'FUERA_DE_SERVICIO' ? <XIcon size={20} /> :
                 currentStatus === 'EN_TRANSITO' ? <ZapIcon size={20} /> : <XIcon size={20} />}
              </div>
              {activeMaint?.status === 'IN_PROGRESS' && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 13, height: 13, borderRadius: '50%',
                  background: '#f59e0b', border: '2px solid var(--color-bg-elevated)',
                }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Estado Técnico Actual
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: statusCfg.color, letterSpacing: '-0.01em', lineHeight: 1 }}>
                {statusCfg.label}
              </div>
            </div>
          </div>
          {canEdit && !showForm && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} style={{ fontWeight: 700 }}>
              + Registrar Mantenimiento
            </button>
          )}
        </div>
        {/* Status pipeline chips */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {TECH_STATUS_ALL.map((status, idx) => {
            const isCurrent = currentStatus === status
            const cfg = TECH_STATUS_CONFIG[status]
            return (
              <React.Fragment key={status}>
                {idx > 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>›</span>}
                <span style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 11,
                  background: isCurrent ? cfg.bg : 'transparent',
                  border: `1px solid ${isCurrent ? cfg.border : 'var(--color-border)'}`,
                  color: isCurrent ? cfg.color : 'var(--color-text-muted)',
                  fontWeight: isCurrent ? 700 : 400,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  {isCurrent && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />}
                  {cfg.label}
                </span>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* ══ 2. ACTIVE MAINTENANCE OPERATIONAL CARD ══ */}
      {activeMaint && (
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 0 0 4px rgba(245,158,11,0.05)',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.05))',
            borderBottom: '1px solid rgba(245,158,11,0.2)',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: activeMaint.status === 'IN_PROGRESS' ? '#f59e0b' : '#94a3b8',
                boxShadow: activeMaint.status === 'IN_PROGRESS' ? '0 0 0 3px rgba(245,158,11,0.25)' : 'none',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Mantenimiento Activo
              </span>
              <span className="badge badge-mantenimiento" style={{ fontSize: 10 }}>
                {MAINT_TYPE_LABEL[activeMaint.type] ?? activeMaint.type}
              </span>
            </div>
            <span className={MAINT_STATUS_BADGE[activeMaint.status] ?? 'badge'} style={{ fontSize: 11 }}>
              {MAINT_STATUS_LABEL[activeMaint.status] ?? activeMaint.status}
            </span>
          </div>

          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Two columns: technician profile + work details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Technician / Provider profile */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  {activeMaint.handledBy ? 'Técnico Responsable' : 'Proveedor'}
                </div>
                {activeMaint.handledBy ? (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                  }}>
                    <TechnicianAvatar name={activeMaint.handledBy.name} size={42} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 5 }}>
                        {activeMaint.handledBy.name}
                      </div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                        <RoleBadgeTech role={activeMaint.handledBy.role} />
                        {activeMaint.handledBy.department && (
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{activeMaint.handledBy.department}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{activeMaint.handledBy.email}</div>
                    </div>
                  </div>
                ) : activeMaint.provider ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(14,165,233,0.1)', border: '2px solid rgba(14,165,233,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><BuildingIcon size={18} /></div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                        {activeMaint.provider}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0ea5e9', background: 'rgba(14,165,233,0.1)', padding: '2px 7px', borderRadius: 99 }}>
                        Proveedor Externo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 14px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text-muted)', fontSize: 13 }}>
                    Sin asignar
                  </div>
                )}
              </div>

              {/* Work details */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Detalles del Trabajo
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <InfoItem label="Programado"   value={formatDate(activeMaint.scheduledAt)} />
                  <InfoItem label="Costo"         value={activeMaint.cost ? formatCurrency(String(activeMaint.cost)) : '—'} />
                  {activeMaint.completedAt && <InfoItem label="Completado" value={formatDate(activeMaint.completedAt)} />}
                </div>
                <div style={{ marginTop: 10 }}>
                  <InfoItem label="Diagnóstico / Trabajo" value={activeMaint.description} />
                </div>
              </div>
            </div>

            {/* Progress update inline panel */}
            {showProgress && canEdit && (
              <div style={{
                padding: '14px 16px',
                background: 'rgba(245,158,11,0.04)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <NoteIcon size={13} /> Registrar Nota de Progreso
                </div>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Describe el estado actual del trabajo, hallazgos o próximos pasos..."
                  value={progressNote}
                  onChange={e => setProgressNote(e.target.value)}
                  style={{ resize: 'vertical', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowProgress(false); setProgressNote('') }}>
                    Cancelar
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleAction(activeMaint.id, 'ACTUALIZAR_PROGRESO')}
                    disabled={!progressNote.trim() || acting}
                    style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-mantenimiento)', border: '1px solid rgba(245,158,11,0.4)', fontWeight: 600 }}
                  >
                    {acting ? 'Guardando...' : 'Guardar nota'}
                  </button>
                </div>
              </div>
            )}

            {/* Action bar */}
            {canEdit && (
              <div style={{
                display: 'flex', gap: 8, flexWrap: 'wrap',
                paddingTop: 12, borderTop: '1px solid var(--color-border)',
              }}>
                {!showProgress && (
                  <button className="btn btn-sm" onClick={() => setShowProgress(true)}
                    style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-mantenimiento)', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <NoteIcon size={13} /> Actualizar Progreso
                  </button>
                )}
                <button className="btn btn-sm" onClick={() => handleAction(activeMaint.id, 'COMPLETAR')} disabled={acting}
                  style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-operativo)', border: '1px solid rgba(34,197,94,0.3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {acting ? '...' : <><CheckIcon size={13} /> Completar Mantenimiento</>}
                </button>
                <button className="btn btn-sm" onClick={() => handleAction(activeMaint.id, 'CANCELAR')} disabled={acting}
                  style={{ background: 'rgba(239,68,68,0.06)', color: 'var(--color-danado)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ 3. EMPTY STATE CTA ══ */}
      {!activeMaint && !showForm && canEdit && (
        <div style={{
          border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)',
          padding: '32px 24px', textAlign: 'center', background: 'var(--color-bg-surface)',
        }}>
          <div style={{ marginBottom: 12, color: 'var(--color-text-muted)' }}><WrenchIcon size={40} strokeWidth={1.5} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
            Sin Mantenimiento Activo
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 400, margin: '0 auto 20px' }}>
            Registra mantenimiento preventivo, correctivo, de calibración o limpieza para este activo.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
            {MAINT_TYPE_OPTIONS.map(opt => (
              <button key={opt.value} className="btn btn-ghost btn-sm"
                onClick={() => { setTipo(opt.value); setShowForm(true) }}
                style={{ fontSize: 12, border: '1px solid var(--color-border)' }}>
                {opt.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ fontWeight: 700 }}>
            + Registrar Mantenimiento
          </button>
        </div>
      )}

      {/* ══ 4. ENTERPRISE MAINTENANCE FORM ══ */}
      {showForm && canEdit && (
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 0 0 4px rgba(245,158,11,0.05)',
        }}>
          {/* Form header */}
          <div style={{
            background: 'rgba(245,158,11,0.07)',
            borderBottom: '1px solid rgba(245,158,11,0.2)',
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WrenchIcon size={16} color="var(--color-mantenimiento)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-mantenimiento)' }}>Nuevo Registro de Mantenimiento</span>
            </div>
            <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center' }} onClick={resetForm}><XIcon size={16} /></button>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Internal / External toggle */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Tipo de Gestión
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { ext: false, icon: <UserIcon size={22} />,     title: 'Mantenimiento Interno', sub: 'Técnico del equipo IT', accent: 'var(--color-mantenimiento)', accentBg: 'rgba(245,158,11,0.06)' },
                  { ext: true,  icon: <BuildingIcon size={22} />, title: 'Mantenimiento Externo', sub: 'Proveedor / Vendor',   accent: '#0ea5e9',                   accentBg: 'rgba(14,165,233,0.06)' },
                ].map(opt => (
                  <button key={String(opt.ext)} type="button" onClick={() => setIsExternal(opt.ext)} style={{
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${isExternal === opt.ext ? opt.accent : 'var(--color-border)'}`,
                    background: isExternal === opt.ext ? opt.accentBg : 'var(--color-bg-surface)',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ marginBottom: 4, color: isExternal === opt.ext ? opt.accent : 'var(--color-text-muted)' }}>{opt.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isExternal === opt.ext ? opt.accent : 'var(--color-text-primary)' }}>{opt.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Tipo <span style={{ color: 'var(--color-danado)' }}>*</span></label>
                <select className="form-input" value={tipo} onChange={e => setTipo(e.target.value)}>
                  {MAINT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado inicial</label>
                <select className="form-input" value={estadoInicial} onChange={e => setEstadoInicial(e.target.value)}>
                  <option value="SCHEDULED">Programado</option>
                  <option value="IN_PROGRESS">Iniciar ahora (EN PROGRESO)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha programada <span style={{ color: 'var(--color-danado)' }}>*</span></label>
                <input type="date" className="form-input" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Costo estimado</label>
                <input type="number" className="form-input" placeholder="0.00" value={costo} onChange={e => setCosto(e.target.value)} />
              </div>
            </div>

            {/* Technician combobox (internal) or provider field (external) */}
            {!isExternal ? (
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Técnico responsable
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 99 }}>
                    Solo personal técnico autorizado
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  {selectedTech ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      border: '1px solid rgba(245,158,11,0.4)', borderRadius: 8,
                      background: 'rgba(245,158,11,0.04)', cursor: 'pointer',
                    }} onClick={() => { setRealizadoPorId(''); setTechSearch(''); setShowTechDrop(true) }}>
                      <TechnicianAvatar name={selectedTech.name} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{selectedTech.name}</div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 2 }}>
                          <RoleBadgeTech role={selectedTech.role} />
                          {selectedTech.department && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{selectedTech.department}</span>}
                        </div>
                      </div>
                      <XIcon size={14} color="var(--color-text-muted)" />
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        placeholder={loadingTechs ? 'Cargando técnicos...' : 'Buscar técnico por nombre o área...'}
                        disabled={loadingTechs}
                        value={techSearch}
                        onChange={e => { setTechSearch(e.target.value); setShowTechDrop(true) }}
                        onFocus={() => setShowTechDrop(true)}
                        onBlur={() => setTimeout(() => setShowTechDrop(false), 200)}
                        style={{ paddingLeft: 34, opacity: loadingTechs ? 0.6 : 1 }}
                      />
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)', display: 'flex' }}><SearchIcon size={14} /></span>
                    </div>
                  )}

                  {showTechDrop && !selectedTech && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 10, marginTop: 4,
                      maxHeight: 300, overflowY: 'auto',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    }}>
                      {/* Loading state */}
                      {loadingTechs ? (
                        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: 13 }}>
                          <span className="loading-spinner" style={{ width: 14, height: 14 }} />
                          Cargando personal técnico...
                        </div>
                      ) : filteredTechs.length === 0 ? (
                        /* Empty state */
                        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                          <div style={{ marginBottom: 8, color: 'var(--color-text-muted)' }}><UsersIcon size={28} strokeWidth={1.5} /></div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                            {techSearch ? `Sin resultados para "${techSearch}"` : 'Sin personal técnico disponible'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                            {techSearch
                              ? 'Prueba con otro nombre o área'
                              : 'No hay usuarios con rol TECHNICIAN, ADMIN o SUPER_ADMIN'}
                          </div>
                          {!techSearch && (
                            <Link href="/users" style={{
                              fontSize: 12, fontWeight: 600, color: 'var(--color-primary)',
                              textDecoration: 'none', padding: '5px 12px',
                              border: '1px solid var(--color-primary)',
                              borderRadius: 6, display: 'inline-block',
                            }}
                              onMouseDown={e => e.preventDefault()}>
                              → Ir a Gestión de Usuarios
                            </Link>
                          )}
                        </div>
                      ) : (
                        filteredTechs.map(tech => (
                          <div key={tech.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}
                            onMouseDown={() => { setRealizadoPorId(String(tech.id)); setTechSearch(''); setShowTechDrop(false) }}>
                            <TechnicianAvatar name={tech.name} size={32} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{tech.name}</div>
                              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                                <RoleBadgeTech role={tech.role} />
                                {tech.department && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{tech.department}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>Asignaciones</div>
                              <div style={{
                                fontSize: 13, fontWeight: 700,
                                color: (tech.activeAssignments ?? 0) >= 3 ? '#ef4444' : (tech.activeAssignments ?? 0) > 0 ? '#f59e0b' : '#22c55e',
                              }}>
                                {tech.activeAssignments ?? 0}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {!loadingTechs && filteredTechs.length > 0 && (
                        <div style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}
                          onMouseDown={() => { setRealizadoPorId(''); setShowTechDrop(false) }}>
                          Sin asignar
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Proveedor / Empresa externa <span style={{ color: 'var(--color-danado)' }}>*</span></label>
                <input className="form-input" placeholder="ej. Dell Support, HP Enterprise, Cisco TAC..." value={proveedor} onChange={e => setProveedor(e.target.value)} />
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Proveedor externo que realizará el trabajo técnico</div>
              </div>
            )}

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Diagnóstico / Descripción del trabajo <span style={{ color: 'var(--color-danado)' }}>*</span></label>
              <textarea className="form-input" rows={3}
                placeholder="Describe el trabajo a realizar, síntomas observados o diagnóstico inicial..."
                value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ resize: 'vertical' }} />
            </div>

            {/* IN_PROGRESS warning */}
            {estadoInicial === 'IN_PROGRESS' && (
              <div style={{
                padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start',
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 8, fontSize: 13, color: 'var(--color-mantenimiento)',
              }}>
                <AlertIcon size={14} style={{ flexShrink: 0 }} />
                <span>Al iniciar en modo <strong>"En Progreso"</strong>, el activo cambiará a <strong>EN MANTENIMIENTO</strong> automáticamente y quedará no disponible.</span>
              </div>
            )}

            {/* Form actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
              <button className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate}
                disabled={!descripcion.trim() || !fechaInicio || (isExternal && !proveedor.trim()) || submitting}
                style={{ minWidth: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}>
                {submitting
                  ? <><span className="loading-spinner" style={{ width: 14, height: 14 }} />Guardando...</>
                  : estadoInicial === 'IN_PROGRESS'
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ZapIcon size={14} /> Iniciar Mantenimiento</span>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardIcon size={14} /> Programar Mantenimiento</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ 5. MAINTENANCE HISTORY ══ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Historial de Mantenimiento
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 8 }}>
              ({maintenances.length} {maintenances.length === 1 ? 'registro' : 'registros'})
            </span>
          </div>
          {activeMaint && canEdit && !showForm && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setShowForm(true)}>
              + Programar otro
            </button>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Diagnóstico</th>
                <th>Técnico / Proveedor</th>
                <th>Costo</th>
                <th>Programado</th>
                <th>Completado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state" style={{ padding: 32 }}>Sin registros de mantenimiento</div></td></tr>
              ) : maintenances.map((m: any) => {
                const durationDays = m.completedAt
                  ? Math.round((new Date(m.completedAt).getTime() - new Date(m.scheduledAt).getTime()) / 86_400_000)
                  : null
                return (
                  <tr key={m.id}>
                    <td>
                      <span className="badge badge-mantenimiento" style={{ fontSize: 11 }}>
                        {MAINT_TYPE_LABEL[m.type] ?? m.type}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, fontSize: 13 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</div>
                    </td>
                    <td>
                      {m.handledBy ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <TechnicianAvatar name={m.handledBy.name} size={24} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 1 }}>{m.handledBy.name}</div>
                            <RoleBadgeTech role={m.handledBy.role} />
                          </div>
                        </div>
                      ) : m.provider ? (
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><BuildingIcon size={12} /> {m.provider}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {m.cost ? formatCurrency(String(m.cost)) : '—'}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(m.scheduledAt)}</td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {m.completedAt ? (
                        <div>
                          <div>{formatDate(m.completedAt)}</div>
                          {durationDays !== null && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{durationDays}d de trabajo</div>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={MAINT_STATUS_BADGE[m.status] ?? 'badge'} style={{ fontSize: 11 }}>
                        {MAINT_STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 5. MOVEMENTS TAB — Physical location lifecycle
// ══════════════════════════════════════════════════════════════════
function MovementsTab({
  asset, canEdit, currentUserId, onRefresh,
}: { asset: any; canEdit: boolean; currentUserId: number; onRefresh: () => void }) {
  const { toast } = useToast()
  const requests = asset.requests ?? []

  const [locations, setLocations]   = useState<any[]>([])
  const [showForm, setShowForm]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [destId, setDestId]         = useState('')
  const [motivo, setMotivo]         = useState('')

  useEffect(() => {
    fetch('/api/locations').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setLocations(data.filter((l: any) => l.id !== asset.locationId))
    })
  }, [asset.locationId])

  async function handleTransfer() {
    if (!destId || !motivo.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: asset.id, motivo, nuevaLocationId: destId, solicitadoPorId: currentUserId }),
      })
      const data = await res.json()
      if (!res.ok) { toast('error', 'Error al solicitar traslado', data.error); return }
      toast('success', 'Traslado solicitado', 'La solicitud está pendiente de aprobación por un administrador.')
      setShowForm(false); setDestId(''); setMotivo('')
      onRefresh()
    } finally { setSubmitting(false) }
  }

  const location = asset.location

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ─── Current Location Card ─── */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.06),rgba(99,102,241,0.06))', borderBottom: '1px solid var(--color-border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ubicación Actual</span>
          </div>
          {canEdit && !showForm && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>Solicitar Traslado</button>
          )}
        </div>
        <div style={{ padding: '18px 20px' }}>
          {location ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              <InfoItem label="Nombre" value={<span style={{ fontWeight: 600, fontSize: 14 }}>{location.nombre ?? location.name}</span>} />
              <InfoItem label="Tipo" value={
                location.type ? (
                  <span style={{ fontSize: 12, color: '#0ea5e9', background: 'rgba(14,165,233,0.08)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(14,165,233,0.2)' }}>
                    {LOCATION_TYPE_LABEL[location.type] ?? location.type}
                  </span>
                ) : null
              } />
              {location.code && <InfoItem label="Código" value={<span className="font-mono" style={{ fontSize: 12 }}>{location.code}</span>} />}
              {location.description && <InfoItem label="Descripción" value={location.description} />}
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Ubicación no registrada</div>
          )}
        </div>
      </div>

      {/* ─── Transfer Form ─── */}
      {showForm && canEdit && (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid #0ea5e9', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 0 0 4px rgba(14,165,233,0.06)' }}>
          <div style={{ background: 'rgba(14,165,233,0.06)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0ea5e9' }}>Solicitar Traslado</span>
            <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center' }} onClick={() => { setShowForm(false); setDestId(''); setMotivo('') }}><XIcon size={16} /></button>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 14px', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, fontSize: 13, color: '#0ea5e9', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <InfoIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} /> La solicitud de traslado quedará pendiente de aprobación por un administrador. Una vez aprobada, la ubicación del activo se actualizará automáticamente.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Ubicación destino <span style={{ color: 'var(--color-danado)', marginLeft: 2 }}>*</span></label>
                <select className="form-input" value={destId} onChange={e => setDestId(e.target.value)}>
                  <option value="">Seleccionar ubicación de destino...</option>
                  {locations.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre ?? l.name}
                      {l.type ? ` (${LOCATION_TYPE_LABEL[l.type] ?? l.type})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Motivo del traslado <span style={{ color: 'var(--color-danado)', marginLeft: 2 }}>*</span></label>
                <textarea className="form-input" rows={2} placeholder="Explica el motivo del traslado..." value={motivo} onChange={e => setMotivo(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowForm(false); setDestId(''); setMotivo('') }}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleTransfer} disabled={!destId || !motivo.trim() || submitting}
                style={{ minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {submitting
                  ? <><span className="loading-spinner" style={{ width: 14, height: 14 }} />Enviando...</>
                  : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Movement Timeline (last 3 approved) ─── */}
      {(() => {
        const approved = requests.filter((r: any) => r.status === 'APPROVED' || r.status === 'COMPLETED')
        if (approved.length === 0) return null
        return (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Trayectoria Reciente</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {approved.slice(0, 3).map((r: any, i: number) => (
                <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#0ea5e9', fontWeight: 700, zIndex: 1 }}>→</div>
                    {i < approved.slice(0, 3).length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--color-border)', minHeight: 16, marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                      {r.destination?.nombre ?? r.destination?.name ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 2 }}>{r.reason ?? r.motivo}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Por {r.requestedBy?.name ?? '—'} · {timeAgo(r.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ─── Movement History Table ─── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Historial de Traslados <span style={{ fontWeight: 400 }}>({requests.length})</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Destino</th><th>Motivo</th><th>Solicitado por</th>
                <th>Aprobado por</th><th>Fecha</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state" style={{ padding: 32 }}>
                  <div className="empty-state-icon"><TruckIcon size={28} strokeWidth={1.5} /></div>
                  <div className="empty-state-title">Sin historial de traslados</div>
                  <div className="empty-state-desc">Solicita un traslado para mover este activo a otra ubicación.</div>
                </div></td></tr>
              ) : requests.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{r.destination?.nombre ?? r.destination?.name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason ?? r.motivo}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{r.requestedBy?.name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{r.approvedBy?.name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</td>
                  <td><span className={requestStatusBadge(r.status)} style={{ fontSize: 11 }}>{LABEL(REQUEST_STATUS_LABELS, r.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 6. LOGS TAB — Jira-style audit timeline
// ══════════════════════════════════════════════════════════════════
function LogsTab({ logs }: { logs: any[] }) {
  return (
    <div>
      {logs.length === 0 && (
        <div className="empty-state" style={{ padding: 48 }}>
          <div className="empty-state-icon"><ClipboardIcon size={32} strokeWidth={1.5} /></div>
          <div className="empty-state-title">Sin eventos registrados</div>
          <div className="empty-state-desc">Las acciones sobre este activo aparecerán aquí automáticamente.</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {logs.map((log: any, i: number) => {
          const tipo = log.tipo ?? log.type
          const icon = LOG_ICON[tipo] ?? '●'
          return (
            <div key={log.id} style={{ display: 'flex', gap: 0 }}>
              {/* Track */}
              <div style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', zIndex: 1, position: 'relative',
                  background: 'var(--color-bg-elevated)', border: '2px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 700, flexShrink: 0,
                }}>{icon}</div>
                {i < logs.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: 'var(--color-border)', minHeight: 20, marginTop: 2, marginBottom: 2 }} />
                )}
              </div>
              {/* Content */}
              <div style={{ flex: 1, paddingBottom: 20, paddingLeft: 8, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={eventTypeBadge(tipo)} style={{ fontSize: 10, padding: '1px 7px' }}>
                      {LABEL(EVENT_TYPE_LABELS, tipo)}
                    </span>
                    {log.user && (
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <UserAvatar name={log.user.name} size={18} />
                        {log.user.name}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatDateTime(log.occurredAt ?? log.fecha)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, background: 'var(--color-bg-surface)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                  {log.description ?? log.descripcion}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
