'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/ToastProvider'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN:       'Administrador',
  TECHNICIAN:  'Técnico',
  USER:        'Usuario',
  AUDITOR:     'Auditor',
}

const ROLE_DESC: Record<string, string> = {
  SUPER_ADMIN: 'Acceso completo al sistema, incluyendo configuración y gestión de usuarios.',
  ADMIN:       'Gestión completa de activos, movimientos, mantenimientos y usuarios.',
  TECHNICIAN:  'Registro y actualización de activos, mantenimientos y movimientos.',
  USER:        'Consulta de activos y solicitud de movimientos.',
  AUDITOR:     'Acceso de solo lectura a activos y bitácora del sistema.',
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [pwSaving, setPwSaving] = useState(false)

  function validatePw() {
    const e: Record<string, string> = {}
    if (!pwForm.current)         e.current = 'Ingresa tu contraseña actual'
    if (pwForm.next.length < 8)  e.next    = 'Mínimo 8 caracteres'
    if (pwForm.next !== pwForm.confirm) e.confirm = 'Las contraseñas no coinciden'
    setPwErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleChangePassword() {
    if (!validatePw()) return
    setPwSaving(true)
    const res  = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwForm.next }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast('error', 'Error al cambiar contraseña', data.error)
      setPwSaving(false)
      return
    }
    toast('success', 'Contraseña actualizada', 'Tu contraseña ha sido cambiada correctamente.')
    setPwForm({ current: '', next: '', confirm: '' })
    setPwSaving(false)
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Configuración</span>
      </div>

      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Gestiona tu perfil y preferencias del sistema</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="form-section">
        <div className="form-section-title">👤 Perfil de Usuario</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--color-bg-elevated)',
            border: '2px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: 'var(--color-primary)',
            flexShrink: 0,
          }}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{user.email}</div>
            <span style={{
              display: 'inline-block', padding: '2px 10px',
              background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
              borderRadius: 99, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(99,102,241,0.3)',
            }}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <div style={{ padding: '12px 16px', background: 'var(--color-bg-elevated)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Nombre</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{user.name}</div>
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--color-bg-elevated)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Correo</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{user.email}</div>
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--color-bg-elevated)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Rol</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{ROLE_LABELS[user.role] ?? user.role}</div>
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--color-bg-elevated)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>ID de Usuario</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>#{user.id}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.15)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 2 }}>PERMISOS DEL ROL</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{ROLE_DESC[user.role]}</div>
        </div>
      </div>

      {/* Change password */}
      <div className="form-section">
        <div className="form-section-title">🔒 Cambiar Contraseña</div>
        <div className="form-row form-row-1" style={{ maxWidth: 400 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="pw-current">Contraseña actual <span className="required">*</span></label>
            <input
              id="pw-current"
              type="password"
              className="form-input"
              placeholder="Tu contraseña actual"
              value={pwForm.current}
              onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
            />
            {pwErrors.current && <div className="form-error">{pwErrors.current}</div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pw-next">Nueva contraseña <span className="required">*</span></label>
            <input
              id="pw-next"
              type="password"
              className="form-input"
              placeholder="Mínimo 8 caracteres"
              value={pwForm.next}
              onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
            />
            {pwErrors.next && <div className="form-error">{pwErrors.next}</div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pw-confirm">Confirmar contraseña <span className="required">*</span></label>
            <input
              id="pw-confirm"
              type="password"
              className="form-input"
              placeholder="Repite la nueva contraseña"
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
            />
            {pwErrors.confirm && <div className="form-error">{pwErrors.confirm}</div>}
          </div>
          <button
            id="btn-change-password"
            className="btn btn-primary"
            onClick={handleChangePassword}
            disabled={pwSaving}
            style={{ marginTop: 4, alignSelf: 'flex-start' }}
          >
            {pwSaving ? 'Actualizando...' : '🔒 Actualizar Contraseña'}
          </button>
        </div>
      </div>

      {/* System info */}
      <div className="form-section">
        <div className="form-section-title">ℹ️ Información del Sistema</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Sistema', 'ITAM — Asset Management'],
            ['Versión', 'v1.0.0'],
            ['Entorno', 'Producción'],
            ['Base de datos', 'PostgreSQL (Supabase)'],
            ['Framework', 'Next.js App Router'],
            ['ORM', 'Prisma'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '10px 14px', background: 'var(--color-bg-elevated)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: label === 'Versión' ? 'monospace' : undefined }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
