'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Asset, EstadoTecnico, EstadoUso, EventType, MaintenanceType, Role } from '@/types/domain'
import {
  estadoTecnicoBadge, estadoUsoBadge,
  eventTypeBadge, maintenanceTypeBadge,
  ESTADO_TECNICO_LABELS, ESTADO_USO_LABELS,
  EVENT_TYPE_LABELS, MAINTENANCE_TYPE_LABELS,
  formatDate, formatDateTime, timeAgo, formatCurrency,
} from '@/lib/ui-helpers'
import MovementRequestModal from '@/components/movements/MovementRequestModal'
import { useToast } from '@/components/ui/ToastProvider'

const ROLE: Role = 'ADMIN' // TODO: from auth

type TabId = 'overview' | 'assignments' | 'maintenance' | 'logs'

export default function AssetDetailPage() {
  const params = useParams()
  const id     = params.id as string
  const { toast } = useToast()

  const [asset, setAsset]     = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showMovement, setShowMovement] = useState(false)

  // Maintenance form state
  const [showMainForm, setShowMainForm] = useState(false)
  const [mainForm, setMainForm] = useState({ tipo: 'PREVENTIVO', descripcion: '', proveedor: '', costo: '', fechaInicio: '', fechaFin: '' })
  const [mainLoading, setMainLoading] = useState(false)

  // Assignment form state
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [assignUserId, setAssignUserId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  async function loadAsset() {
    const res  = await fetch(`/api/assets/${id}`)
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setAsset(data)
    setLoading(false)
  }

  useEffect(() => { loadAsset() }, [id])
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers)
  }, [])

  async function handleAssign() {
    if (!assignUserId) return
    setAssignLoading(true)
    const res = await fetch(`/api/assets/${id}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: parseInt(assignUserId), asignadoPorId: 1 }),
    })
    const data = await res.json()
    if (!res.ok) { toast('error', 'Error', data.error); setAssignLoading(false); return }
    toast('success', 'Activo asignado', `Asignado a ${data.user?.name}.`)
    setShowAssignForm(false)
    setAssignUserId('')
    setAssignLoading(false)
    loadAsset()
  }

  async function handleEndAssignment() {
    if (!confirm('¿Finalizar la asignación activa?')) return
    const res = await fetch(`/api/assets/${id}/assignments`, { method: 'PATCH' })
    const data = await res.json()
    if (!res.ok) { toast('error', 'Error', data.error); return }
    toast('success', 'Asignación finalizada', '')
    loadAsset()
  }

  async function handleAddMaintenance() {
    if (!mainForm.tipo || !mainForm.descripcion || !mainForm.fechaInicio) {
      toast('warning', 'Campos requeridos', 'tipo, descripción y fecha de inicio son requeridos.')
      return
    }
    setMainLoading(true)
    const res = await fetch(`/api/assets/${id}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mainForm, realizadoPorId: 1 }),
    })
    const data = await res.json()
    if (!res.ok) { toast('error', 'Error', data.error); setMainLoading(false); return }
    toast('success', 'Mantenimiento registrado', '')
    setShowMainForm(false)
    setMainForm({ tipo: 'PREVENTIVO', descripcion: '', proveedor: '', costo: '', fechaInicio: '', fechaFin: '' })
    setMainLoading(false)
    loadAsset()
  }

  if (loading) return (
    <div>
      <div style={{ padding: '24px 0' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: i === 0 ? 32 : 16, borderRadius: 6, marginBottom: 12, width: ['60%','40%','50%','30%'][i] }} />
        ))}
      </div>
    </div>
  )

  if (!asset) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔍</div>
      <div className="empty-state-title">Activo no encontrado</div>
      <Link href="/assets" className="btn btn-secondary">← Volver a Activos</Link>
    </div>
  )

  const activeAssignment = asset.assignments?.find((a: any) => !a.fechaFin)

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <Link href="/assets">Activos</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">{asset.nombre}</span>
      </div>

      {/* Asset header */}
      <div style={{ marginTop: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h1 className="page-title">{asset.nombre}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>
                {asset.codigoInventario}
              </span>
              {asset.serial && (
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>S/N: {asset.serial}</span>
              )}
            </div>
          </div>
          <div className="page-header-actions">
            {['ADMIN','TECHNICIAN'].includes(ROLE) && (
              <Link href={`/assets/${asset.id}/edit`} className="btn btn-secondary">✏️ Editar</Link>
            )}
            <button className="btn btn-secondary" onClick={() => setShowMovement(true)}>🚚 Solicitar Movimiento</button>
            {ROLE === 'ADMIN' && (
              <button className="btn btn-danger" onClick={async () => {
                if (!confirm(`¿Eliminar "${asset.nombre}"?`)) return
                await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' })
                toast('success', 'Activo eliminado', '')
                window.location.href = '/assets'
              }}>🗑 Eliminar</button>
            )}
          </div>
        </div>

        {/* Dual state badges */}
        <div className="status-bar" style={{ marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado Técnico</div>
            <span className={estadoTecnicoBadge(asset.estadoTecnico)} style={{ fontSize: 12 }}>
              {ESTADO_TECNICO_LABELS[asset.estadoTecnico as EstadoTecnico]}
            </span>
          </div>
          <div className="divider" style={{ width: 1, height: 32, margin: '0 4px' }} />
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado de Uso</div>
            <span className={estadoUsoBadge(asset.estadoUso)} style={{ fontSize: 12 }}>
              {ESTADO_USO_LABELS[asset.estadoUso as EstadoUso]}
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>CATEGORÍA</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{asset.category?.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>UBICACIÓN</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>📍 {asset.location?.nombre}</div>
          </div>
        </div>

        {/* Active assignment indicator */}
        {activeAssignment && (
          <div style={{ padding: '10px 14px', background: 'var(--color-asignado-bg)', borderRadius: 8, border: '1px solid rgba(168,85,247,0.2)', fontSize: 13, color: 'var(--color-asignado)', marginTop: 12 }}>
            👤 Asignado a <strong>{activeAssignment.user?.name}</strong> desde {formatDate(activeAssignment.fechaInicio)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {([['overview','Resumen'],['assignments','Asignaciones'],['maintenance','Mantenimiento'],['logs','Bitácora']] as [TabId, string][]).map(([id, label]) => (
          <button key={id} id={`tab-${id}`} className={`tab${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>
            {label}
            {id === 'assignments' && asset.assignments?.length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--color-bg-overlay)', borderRadius: 99, padding: '1px 6px', fontSize: 10, color: 'var(--color-text-secondary)' }}>{asset.assignments.length}</span>
            )}
            {id === 'logs' && asset.logs?.length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--color-bg-overlay)', borderRadius: 99, padding: '1px 6px', fontSize: 10, color: 'var(--color-text-secondary)' }}>{asset.logs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {activeTab === 'overview' && (
        <div>
          {asset.spec ? (
            <div className="card">
              <div className="card-header"><span className="card-title">Especificaciones Técnicas</span></div>
              <div className="card-body">
                <div className="info-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {[
                    ['Marca',    asset.spec.marca],
                    ['Modelo',   asset.spec.modelo],
                    ['CPU',      asset.spec.cpu],
                    ['RAM',      asset.spec.ram],
                    ['Almacenamiento', asset.spec.almacenamiento],
                    ['Sistema Operativo', asset.spec.sistemaOperativo && `${asset.spec.sistemaOperativo} ${asset.spec.versionSO ?? ''}`],
                    ['Dirección IP',  asset.spec.ipAddress],
                    ['MAC Address',   asset.spec.macAddress],
                    ['Hostname',      asset.spec.hostname],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="info-item">
                      <div className="info-item-label">{label}</div>
                      <div className="info-item-value font-mono" style={{ fontSize: 12 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="empty-state" style={{ padding: '30px 24px' }}>
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">Sin especificaciones técnicas</div>
                  <div className="empty-state-desc">No se han registrado especificaciones para este activo.</div>
                  {['ADMIN','TECHNICIAN'].includes(ROLE) && (
                    <Link href={`/assets/${asset.id}/edit`} className="btn btn-secondary btn-sm">+ Agregar especificaciones</Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Assignments ── */}
      {activeTab === 'assignments' && (
        <div>
          {['ADMIN','TECHNICIAN'].includes(ROLE) && (
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              {!activeAssignment && (
                <button id="btn-assign" className="btn btn-primary" onClick={() => setShowAssignForm(true)}>👤 Asignar Activo</button>
              )}
              {activeAssignment && (
                <button id="btn-end-assignment" className="btn btn-danger" onClick={handleEndAssignment}>✕ Finalizar Asignación</button>
              )}
            </div>
          )}

          {showAssignForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">Nueva Asignación</span></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="assign-user-select">Usuario <span className="required">*</span></label>
                  <select id="assign-user-select" className="form-select" value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
                    <option value="">Seleccionar usuario...</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={handleAssign} disabled={!assignUserId || assignLoading}>
                    {assignLoading ? 'Asignando...' : 'Confirmar Asignación'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowAssignForm(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Asignado Por</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {asset.assignments?.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state" style={{ padding: 30 }}>Sin asignaciones registradas</div></td></tr>
                ) : asset.assignments?.map((a: any) => (
                  <tr key={a.id}>
                    <td><div style={{ fontWeight: 500 }}>{a.user?.name}</div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.user?.email}</div></td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{a.asignadoPor?.name ?? '—'}</td>
                    <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(a.fechaInicio)}</td>
                    <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{a.fechaFin ? formatDate(a.fechaFin) : '—'}</td>
                    <td>{!a.fechaFin ? <span className="badge badge-asignado">Activa</span> : <span className="badge badge-baja">Finalizada</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Maintenance ── */}
      {activeTab === 'maintenance' && (
        <div>
          {['ADMIN','TECHNICIAN'].includes(ROLE) && (
            <div style={{ marginBottom: 16 }}>
              <button id="btn-add-maintenance" className="btn btn-primary" onClick={() => setShowMainForm(true)}>🔧 Registrar Mantenimiento</button>
            </div>
          )}

          {showMainForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span className="card-title">Nuevo Registro de Mantenimiento</span>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowMainForm(false)}>✕</button>
              </div>
              <div className="card-body">
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="main-tipo">Tipo <span className="required">*</span></label>
                    <select id="main-tipo" className="form-select" value={mainForm.tipo} onChange={e => setMainForm(f => ({...f, tipo: e.target.value}))}>
                      <option value="PREVENTIVO">Preventivo</option>
                      <option value="CORRECTIVO">Correctivo</option>
                      <option value="CALIBRACION">Calibración</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="main-proveedor">Proveedor</label>
                    <input id="main-proveedor" className="form-input" placeholder="Nombre del proveedor" value={mainForm.proveedor} onChange={e => setMainForm(f => ({...f, proveedor: e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="main-descripcion">Descripción <span className="required">*</span></label>
                  <textarea id="main-descripcion" className="form-textarea" placeholder="Describe el trabajo realizado..." value={mainForm.descripcion} onChange={e => setMainForm(f => ({...f, descripcion: e.target.value}))} />
                </div>
                <div className="form-row form-row-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="main-costo">Costo (COP)</label>
                    <input id="main-costo" className="form-input" type="number" placeholder="0" value={mainForm.costo} onChange={e => setMainForm(f => ({...f, costo: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="main-fecha-inicio">Fecha Inicio <span className="required">*</span></label>
                    <input id="main-fecha-inicio" className="form-input" type="date" value={mainForm.fechaInicio} onChange={e => setMainForm(f => ({...f, fechaInicio: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="main-fecha-fin">Fecha Fin</label>
                    <input id="main-fecha-fin" className="form-input" type="date" value={mainForm.fechaFin} onChange={e => setMainForm(f => ({...f, fechaFin: e.target.value}))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={handleAddMaintenance} disabled={mainLoading}>
                    {mainLoading ? 'Guardando...' : '💾 Guardar Mantenimiento'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowMainForm(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Proveedor</th>
                  <th>Costo</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Técnico</th>
                </tr>
              </thead>
              <tbody>
                {asset.maintenances?.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state" style={{ padding: 30 }}>Sin registros de mantenimiento</div></td></tr>
                ) : asset.maintenances?.map((m: any) => (
                  <tr key={m.id}>
                    <td><span className={maintenanceTypeBadge(m.tipo)}>{MAINTENANCE_TYPE_LABELS[m.tipo as MaintenanceType]}</span></td>
                    <td className="truncate" style={{ maxWidth: 220 }}>{m.descripcion}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{m.proveedor ?? '—'}</td>
                    <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatCurrency(m.costo)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDate(m.fechaInicio)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{m.fechaFin ? formatDate(m.fechaFin) : <span style={{ color: 'var(--color-text-muted)' }}>En curso</span>}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{m.realizadoPor?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Event Log Timeline ── */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Bitácora de Eventos</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{asset.logs?.length ?? 0} eventos</span>
          </div>
          <div className="card-body">
            {asset.logs?.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>Sin eventos registrados</div>
            ) : (
              <div className="timeline">
                {asset.logs?.map((log: any) => (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-track">
                      <div className="timeline-dot" />
                      <div className="timeline-line" />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className={eventTypeBadge(log.tipo)}>{EVENT_TYPE_LABELS[log.tipo as EventType] ?? log.tipo}</span>
                        <span className="timeline-date">{formatDateTime(log.fecha)}</span>
                        {log.user && <span className="timeline-actor">· {log.user.name}</span>}
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{timeAgo(log.fecha)}</span>
                      </div>
                      <p className="timeline-desc">{log.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Movement modal */}
      {showMovement && (
        <MovementRequestModal asset={asset} onClose={() => setShowMovement(false)} onSuccess={() => { setShowMovement(false); loadAsset() }} />
      )}
    </div>
  )
}
