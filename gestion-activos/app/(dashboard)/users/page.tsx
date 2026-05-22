'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Role } from '@/types/domain'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/ToastProvider'
import { formatDate } from '@/lib/ui-helpers'

interface UserRow {
  id: number
  name: string
  email: string
  role: Role
  department: string | null
  createdAt: string
}

const ALL_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER', 'AUDITOR']

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN:       'Administrador',
  TECHNICIAN:  'Técnico',
  USER:        'Usuario',
  AUDITOR:     'Auditor',
}

const ROLE_BADGE: Record<Role, string> = {
  SUPER_ADMIN: 'badge badge-operativo',
  ADMIN:       'badge badge-asignado',
  TECHNICIAN:  'badge badge-mantenimiento',
  USER:        'badge badge-disponible',
  AUDITOR:     'badge badge-reservado',
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'USER' as Role, department: '' }

export default function UsersPage() {
  const { user: me } = useAuth()
  const { toast } = useToast()
  const [users, setUsers]     = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterRole, setFilterRole] = useState<Role | ''>('')

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving]         = useState(false)

  const [editUser, setEditUser]     = useState<UserRow | null>(null)
  const [editRole, setEditRole]     = useState<Role>('USER')
  const [editDept, setEditDept]     = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const isSuperAdmin = me.role === 'SUPER_ADMIN'
  const canManage    = ['SUPER_ADMIN', 'ADMIN'].includes(me.role)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole   = !filterRole || u.role === filterRole
    return matchSearch && matchRole
  })

  function validateCreate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())     e.name = 'El nombre es requerido'
    if (!form.email.trim())    e.email = 'El correo es requerido'
    if (!form.password.trim()) e.password = 'La contraseña es requerida'
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleCreate() {
    if (!validateCreate()) return
    setSaving(true)
    const res  = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role, department: form.department || null }),
    })
    const data = await res.json()
    if (!res.ok) { toast('error', 'Error al crear usuario', data.error); setSaving(false); return }
    toast('success', 'Usuario creado', `"${data.name}" agregado al sistema.`)
    setShowCreate(false)
    setForm(EMPTY_FORM)
    setSaving(false)
    load()
  }

  async function handleEditSave() {
    if (!editUser) return
    setEditSaving(true)
    const res  = await fetch(`/api/users/${editUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: editRole, department: editDept || null }),
    })
    const data = await res.json()
    if (!res.ok) { toast('error', 'Error al actualizar', data.error); setEditSaving(false); return }
    toast('success', 'Usuario actualizado', `"${data.name}" modificado.`)
    setEditUser(null)
    setEditSaving(false)
    load()
  }

  async function handleDisable(u: UserRow) {
    if (!confirm(`¿Deshabilitar a "${u.name}"? No podrá iniciar sesión.`)) return
    const res  = await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast('error', 'Error', data.error); return }
    toast('success', 'Usuario deshabilitado', u.name)
    load()
  }

  const roleCount = (r: Role) => users.filter(u => u.role === r).length

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Usuarios</span>
      </div>

      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">{users.length} usuarios registrados en el sistema</p>
        </div>
        {isSuperAdmin && (
          <div className="page-header-actions">
            <button id="btn-new-user" className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + Nuevo Usuario
            </button>
          </div>
        )}
      </div>

      {/* Role summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {ALL_ROLES.map(r => (
          <div
            key={r}
            className="stat-card"
            style={{ cursor: 'pointer', border: filterRole === r ? '1px solid var(--color-primary)' : undefined }}
            onClick={() => setFilterRole(prev => prev === r ? '' : r)}
          >
            <div className="stat-value">{roleCount(r)}</div>
            <div className="stat-label">{ROLE_LABELS[r]}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>🔍</span>
          <input
            id="user-search"
            className="form-input"
            style={{ paddingLeft: 32 }}
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 180 }}
          value={filterRole}
          onChange={e => setFilterRole(e.target.value as Role | '')}
        >
          <option value="">Todos los roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        {(search || filterRole) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterRole('') }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Departamento</th>
              <th>Registrado</th>
              {canManage && <th style={{ textAlign: 'right' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>)}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div className="empty-state-title">Sin usuarios</div>
                    <div className="empty-state-desc">No se encontraron usuarios con los filtros actuales.</div>
                  </div>
                </td>
              </tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, color: 'var(--color-primary)',
                      flexShrink: 0,
                    }}>
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {u.name}
                      {u.id === me.id && (
                        <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--color-primary)', fontWeight: 600 }}>TÚ</span>
                      )}
                    </span>
                  </div>
                </td>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{u.email}</td>
                <td><span className={ROLE_BADGE[u.role]}>{ROLE_LABELS[u.role]}</span></td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{u.department ?? <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(u.createdAt)}</td>
                {canManage && (
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        id={`btn-edit-user-${u.id}`}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Editar rol"
                        onClick={() => { setEditUser(u); setEditRole(u.role); setEditDept(u.department ?? '') }}
                      >✏️</button>
                      {isSuperAdmin && u.id !== me.id && (
                        <button
                          id={`btn-disable-user-${u.id}`}
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Deshabilitar usuario"
                          style={{ color: 'var(--color-danado)' }}
                          onClick={() => handleDisable(u)}
                        >🚫</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">+ Nuevo Usuario</span>
            </div>
            <div className="modal-body">
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Nombre completo <span className="required">*</span></label>
                  <input id="new-user-name" className="form-input" placeholder="Juan Pérez" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Correo electrónico <span className="required">*</span></label>
                  <input id="new-user-email" className="form-input" type="email" placeholder="juan@empresa.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Contraseña <span className="required">*</span></label>
                  <input id="new-user-password" className="form-input" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                  {formErrors.password && <div className="form-error">{formErrors.password}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <input id="new-user-dept" className="form-input" placeholder="TI, Ventas, RRHH..." value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Rol <span className="required">*</span></label>
                <select id="new-user-role" className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <div className="form-hint" style={{ marginTop: 6 }}>
                  {form.role === 'SUPER_ADMIN' && '⚠️ Acceso total al sistema incluyendo configuración.'}
                  {form.role === 'ADMIN' && 'Acceso completo excepto configuración del sistema.'}
                  {form.role === 'TECHNICIAN' && 'Puede gestionar activos y registrar mantenimientos.'}
                  {form.role === 'USER' && 'Solo puede ver activos y solicitar movimientos.'}
                  {form.role === 'AUDITOR' && 'Acceso de solo lectura a activos y bitácora.'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); setFormErrors({}) }}>Cancelar</button>
              <button id="btn-confirm-create-user" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creando...' : '+ Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit role modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✏️ Editar Usuario</span>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '10px 14px', background: 'var(--color-bg-elevated)', borderRadius: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--color-primary)' }}>
                  {editUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{editUser.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{editUser.email}</div>
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select id="edit-user-role" className="form-select" value={editRole} onChange={e => setEditRole(e.target.value as Role)}>
                    {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <input id="edit-user-dept" className="form-input" placeholder="TI, Ventas..." value={editDept} onChange={e => setEditDept(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancelar</button>
              <button id="btn-confirm-edit-user" className="btn btn-primary" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
