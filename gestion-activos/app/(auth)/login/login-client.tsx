'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardIcon, ClipboardIcon, EyeIcon, AlertIcon } from '@/components/icons'

// ─── Brand Panel ─────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div className="auth-brand-panel">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, background: 'var(--color-accent)',
          borderRadius: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff',
          flexShrink: 0,
        }}>IT</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>ITAM</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Asset Management System</div>
        </div>
      </div>

      {/* Hero text */}
      <div>
        <h1 style={{
          fontSize: 30, fontWeight: 800,
          color: 'var(--color-text-primary)', lineHeight: 1.25, marginBottom: 14,
        }}>
          Gestión completa<br />de activos tecnológicos
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 36 }}>
          Control total sobre inventario, asignaciones, mantenimientos y trazabilidad
          de todos los equipos de tu organización.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              icon: <DashboardIcon size={16} />,
              label: 'Dashboard operacional',
              desc: 'Monitoreo en tiempo real del estado de todos los activos',
            },
            {
              icon: <EyeIcon size={16} />,
              label: 'Control de roles (RBAC)',
              desc: 'Super Admin, Admin, Técnico, Usuario y Auditor',
            },
            {
              icon: <ClipboardIcon size={16} />,
              label: 'Auditoría completa',
              desc: 'Historial de eventos, movimientos y cambios de estado',
            },
            {
              icon: <AlertIcon size={16} />,
              label: 'QR Tracking',
              desc: 'Identificación y rastreo de activos con códigos QR',
            },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 34, height: 34, background: 'var(--color-bg-overlay)',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
                color: 'var(--color-text-secondary)',
              }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{f.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
        CUC — Corporación Universitaria de la Costa · Desarrollo Web Full Stack
      </div>
    </div>
  )
}

// ─── Login Form ───────────────────────────────────────────────────
export default function LoginClient() {
  const router      = useRouter()
  const params      = useSearchParams()
  const redirectTo  = params.get('redirect') ?? '/dashboard'
  const expired     = params.get('expired') === '1'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Inline validation
  const emailTouched   = email.length > 0
  const emailValid     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const pwdTouched     = password.length > 0
  const pwdValid       = password.length >= 6
  const canSubmit      = emailValid && pwdValid && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    email.toLowerCase().trim(),
          password,
          remember,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión')
        return
      }

      router.replace(redirectTo)
    } catch {
      setError('No se pudo conectar con el servidor. Verifica tu conexión a internet.')
    } finally {
      setLoading(false)
    }
  }

  function fillDev(e: string, p: string) {
    setEmail(e)
    setPassword(p)
    setError(null)
  }

  return (
    <div className="auth-grid">
      <BrandPanel />

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}
              className="auth-mobile-logo">
              <div style={{
                width: 32, height: 32, background: 'var(--color-accent)',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff',
              }}>IT</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>ITAM</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              Bienvenido de vuelta
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Expired session alert */}
          {expired && (
            <div className="auth-alert auth-alert-warning" style={{ marginBottom: 16 }}>
              <AlertIcon size={14} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 1 }}>Sesión expirada</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>
                  Tu sesión ha expirado por inactividad. Inicia sesión nuevamente.
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Email */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="email">
                Correo electrónico <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`form-input${emailTouched && !emailValid ? ' auth-input-error' : ''}`}
                placeholder="admin@empresa.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                autoComplete="email"
                autoFocus
              />
              {emailTouched && !emailValid && (
                <div className="form-error">Ingresa un correo electrónico válido</div>
              )}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>
                  Contraseña <span className="required">*</span>
                </label>
                <a
                  href="/forgot-password"
                  style={{ fontSize: 11, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  className={`form-input${pwdTouched && !pwdValid ? ' auth-input-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  title={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                    cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                    fontSize: 14,
                  }}
                >
                  <EyeIcon size={14} />
                </button>
              </div>
              {pwdTouched && !pwdValid && (
                <div className="form-error">La contraseña debe tener al menos 6 caracteres</div>
              )}
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Mantener sesión iniciada (30 días)
              </span>
            </label>

            {/* Error alert */}
            {error && (
              <div className="auth-alert auth-alert-error">
                <span style={{ flexShrink: 0, fontWeight: 700 }}>✕</span>
                <span style={{ fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn btn-primary"
              style={{ width: '100%', height: 40, fontSize: 14, justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                  Verificando credenciales...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          {/* Dev credentials hint */}
          <div className="auth-dev-hint">
            <div style={{
              fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
            }}>
              Credenciales de desarrollo
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {([
                ['admin@itam.local',  'Admin123!',  'SUPER_ADMIN'],
                ['tech@itam.local',   'Tech123!',   'TECHNICIAN'],
                ['user@itam.local',   'User123!',   'USER'],
              ] as const).map(([e, p, role]) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => fillDev(e, p)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'left', padding: '2px 0',
                    display: 'flex', gap: 8, alignItems: 'center',
                  }}
                >
                  <span style={{
                    fontSize: 10, padding: '1px 6px',
                    background: 'var(--color-accent-subtle)', color: 'var(--color-accent)',
                    borderRadius: 4, fontWeight: 600, flexShrink: 0,
                  }}>{role}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{e}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
