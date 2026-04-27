'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { Category, EstadoTecnico, EstadoUso, Location } from '@/types/domain'
import { ESTADO_TECNICO_LABELS, ESTADO_USO_LABELS } from '@/lib/ui-helpers'
import { useToast } from '@/components/ui/ToastProvider'

interface AssetFormData {
  // Step 1 — Basic info
  nombre: string
  codigoInventario: string
  serial: string
  categoryId: string
  locationId: string
  // Step 2 — States
  estadoTecnico: EstadoTecnico
  estadoUso: EstadoUso
  imageUrl: string
  // Step 3 — Specs
  marca: string; modelo: string; cpu: string; ram: string; almacenamiento: string
  sistemaOperativo: string; versionSO: string
  ipAddress: string; macAddress: string; hostname: string
}

const EMPTY: AssetFormData = {
  nombre:'', codigoInventario:'', serial:'', categoryId:'', locationId:'',
  estadoTecnico:'OPERATIVO', estadoUso:'DISPONIBLE', imageUrl:'',
  marca:'', modelo:'', cpu:'', ram:'', almacenamiento:'',
  sistemaOperativo:'', versionSO:'', ipAddress:'', macAddress:'', hostname:'',
}

const ESTADOS_TECNICOS: EstadoTecnico[] = ['OPERATIVO','EN_MANTENIMIENTO','EN_REPARACION','DANADO','FUERA_DE_SERVICIO','DE_BAJA']
const ESTADOS_USO: EstadoUso[]          = ['DISPONIBLE','ASIGNADO','RESERVADO','NO_DISPONIBLE']

export default function AssetFormPage({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const params   = useParams()
  const router   = useRouter()
  const { toast } = useToast()
  const id = params?.id as string | undefined

  const [form, setForm]       = useState<AssetFormData>(EMPTY)
  const [step, setStep]       = useState(0) // 0 = basic, 1 = states, 2 = specs
  const [specsOpen, setSpecsOpen] = useState(false)
  const [errors, setErrors]   = useState<Partial<Record<keyof AssetFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!id)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations]   = useState<Location[]>([])

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    fetch('/api/locations').then(r => r.json()).then(setLocations)
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/assets/${id}`).then(r => r.json()).then((a: any) => {
      setForm({
        nombre: a.nombre, codigoInventario: a.codigoInventario, serial: a.serial ?? '',
        categoryId: String(a.categoryId), locationId: String(a.locationId),
        estadoTecnico: a.estadoTecnico, estadoUso: a.estadoUso, imageUrl: a.imageUrl ?? '',
        marca: a.spec?.marca ?? '', modelo: a.spec?.modelo ?? '',
        cpu: a.spec?.cpu ?? '', ram: a.spec?.ram ?? '', almacenamiento: a.spec?.almacenamiento ?? '',
        sistemaOperativo: a.spec?.sistemaOperativo ?? '', versionSO: a.spec?.versionSO ?? '',
        ipAddress: a.spec?.ipAddress ?? '', macAddress: a.spec?.macAddress ?? '', hostname: a.spec?.hostname ?? '',
      })
      if (a.spec) setSpecsOpen(true)
      setFetching(false)
    })
  }, [id])

  function set(field: keyof AssetFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof AssetFormData, string>> = {}
    if (!form.nombre.trim())           e.nombre = 'El nombre es requerido'
    if (!form.codigoInventario.trim()) e.codigoInventario = 'El código de inventario es requerido'
    if (!form.categoryId)              e.categoryId = 'Seleccione una categoría'
    if (!form.locationId)              e.locationId = 'Seleccione una ubicación'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const hasSpecData = Object.entries(form).some(
    ([k, v]) => ['marca','modelo','cpu','ram','almacenamiento','sistemaOperativo','ipAddress','macAddress','hostname'].includes(k) && v
  )

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)

    const body: Record<string, unknown> = {
      nombre: form.nombre, codigoInventario: form.codigoInventario,
      serial: form.serial || null,
      estadoTecnico: form.estadoTecnico, estadoUso: form.estadoUso,
      imageUrl: form.imageUrl || null,
      categoryId: parseInt(form.categoryId), locationId: parseInt(form.locationId),
    }

    if (specsOpen || hasSpecData) {
      body.spec = {
        marca: form.marca || null, modelo: form.modelo || null,
        cpu: form.cpu || null, ram: form.ram || null, almacenamiento: form.almacenamiento || null,
        sistemaOperativo: form.sistemaOperativo || null, versionSO: form.versionSO || null,
        ipAddress: form.ipAddress || null, macAddress: form.macAddress || null, hostname: form.hostname || null,
      }
    }

    const url    = id ? `/api/assets/${id}` : '/api/assets'
    const method = id ? 'PATCH' : 'POST'

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()

    if (!res.ok) {
      toast('error', 'Error al guardar', data.error)
      setLoading(false)
      return
    }

    toast('success', id ? 'Activo actualizado' : 'Activo creado', `"${data.nombre}" guardado correctamente.`)
    router.push(`/assets/${data.id}`)
  }

  if (fetching) return (
    <div style={{ padding: 32 }}>
      <div className="skeleton" style={{ height: 28, width: 200, marginBottom: 24, borderRadius: 6 }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8, marginBottom: 16 }} />
      ))}
    </div>
  )

  const isEdit = !!id

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ padding: '8px 0', background: 'transparent', border: 'none', marginBottom: 16 }}>
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <Link href="/assets">Activos</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">{isEdit ? 'Editar Activo' : 'Nuevo Activo'}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? '✏️ Editar Activo' : '+ Nuevo Activo'}</h1>
          <p className="page-subtitle">{isEdit ? 'Actualiza la información del activo' : 'Registra un nuevo activo tecnológico en el sistema'}</p>
        </div>
      </div>

      {/* ── SECTION 1: Basic Info ── */}
      <div className="form-section">
        <div className="form-section-title">📋 Información Básica</div>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label" htmlFor="input-nombre">Nombre del Activo <span className="required">*</span></label>
            <input id="input-nombre" className="form-input" placeholder="ej. Laptop HP EliteBook 840" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
            {errors.nombre && <div className="form-error">{errors.nombre}</div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="input-codigo">Código de Inventario <span className="required">*</span></label>
            <input id="input-codigo" className="form-input font-mono" placeholder="ej. TI-2024-0042" value={form.codigoInventario} onChange={e => set('codigoInventario', e.target.value)} />
            {errors.codigoInventario && <div className="form-error">{errors.codigoInventario}</div>}
          </div>
        </div>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label" htmlFor="input-serial">Número de Serie</label>
            <input id="input-serial" className="form-input font-mono" placeholder="ej. SN1234567890" value={form.serial} onChange={e => set('serial', e.target.value)} />
            <div className="form-hint">Opcional. Debe ser único en el sistema.</div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="input-imageurl">URL de Imagen</label>
            <input id="input-imageurl" className="form-input" placeholder="https://..." value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} />
          </div>
        </div>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label" htmlFor="select-category">Categoría <span className="required">*</span></label>
            <select id="select-category" className="form-select" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">Seleccionar categoría...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <div className="form-error">{errors.categoryId}</div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="select-location">Ubicación <span className="required">*</span></label>
            <select id="select-location" className="form-select" value={form.locationId} onChange={e => set('locationId', e.target.value)}>
              <option value="">Seleccionar ubicación...</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
            {errors.locationId && <div className="form-error">{errors.locationId}</div>}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: States ── */}
      <div className="form-section">
        <div className="form-section-title">🔘 Estados del Activo</div>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label" htmlFor="select-estado-tecnico">Estado Técnico <span className="required">*</span></label>
            <select id="select-estado-tecnico" className="form-select" value={form.estadoTecnico} onChange={e => set('estadoTecnico', e.target.value as EstadoTecnico)}>
              {ESTADOS_TECNICOS.map(e => <option key={e} value={e}>{ESTADO_TECNICO_LABELS[e]}</option>)}
            </select>
            <div className="form-hint">Estado técnico de la condición física del equipo.</div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="select-estado-uso">Estado de Uso <span className="required">*</span></label>
            <select id="select-estado-uso" className="form-select" value={form.estadoUso} onChange={e => set('estadoUso', e.target.value as EstadoUso)}>
              {ESTADOS_USO.map(e => <option key={e} value={e}>{ESTADO_USO_LABELS[e]}</option>)}
            </select>
            <div className="form-hint">Disponibilidad operacional del activo.</div>
          </div>
        </div>

        {form.estadoTecnico !== 'OPERATIVO' && (
          <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--color-mantenimiento)', border: '1px solid rgba(245,158,11,0.2)', marginTop: 4 }}>
            ℹ️ Al guardar, se registrará automáticamente un EventLog de <strong>CAMBIO_ESTADO</strong> en la bitácora del activo.
          </div>
        )}
      </div>

      {/* ── SECTION 3: Specs (collapsible) ── */}
      <div className="form-section">
        <div className="collapsible-header" onClick={() => setSpecsOpen(o => !o)}>
          <div className="form-section-title" style={{ marginBottom: 0 }}>
            💻 Especificaciones Técnicas
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>(Opcional)</span>
          </div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 18, lineHeight: 1 }}>{specsOpen ? '−' : '+'}</span>
        </div>

        {specsOpen && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Hardware</div>
            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label" htmlFor="spec-marca">Marca</label>
                <input id="spec-marca" className="form-input" placeholder="HP, Dell, Lenovo..." value={form.marca} onChange={e => set('marca', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="spec-modelo">Modelo</label>
                <input id="spec-modelo" className="form-input" placeholder="EliteBook 840 G9" value={form.modelo} onChange={e => set('modelo', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="spec-cpu">CPU</label>
                <input id="spec-cpu" className="form-input" placeholder="Intel Core i7-1265U" value={form.cpu} onChange={e => set('cpu', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="spec-ram">RAM</label>
                <input id="spec-ram" className="form-input" placeholder="16 GB DDR5" value={form.ram} onChange={e => set('ram', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="spec-storage">Almacenamiento</label>
                <input id="spec-storage" className="form-input" placeholder="512 GB SSD NVMe" value={form.almacenamiento} onChange={e => set('almacenamiento', e.target.value)} />
              </div>
            </div>

            <div className="divider" />
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Software</div>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="spec-so">Sistema Operativo</label>
                <input id="spec-so" className="form-input" placeholder="Windows 11 Pro" value={form.sistemaOperativo} onChange={e => set('sistemaOperativo', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="spec-so-ver">Versión SO</label>
                <input id="spec-so-ver" className="form-input" placeholder="22H2" value={form.versionSO} onChange={e => set('versionSO', e.target.value)} />
              </div>
            </div>

            <div className="divider" />
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Red</div>
            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label" htmlFor="spec-ip">Dirección IP</label>
                <input id="spec-ip" className="form-input font-mono" placeholder="192.168.1.100" value={form.ipAddress} onChange={e => set('ipAddress', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="spec-mac">MAC Address</label>
                <input id="spec-mac" className="form-input font-mono" placeholder="AA:BB:CC:DD:EE:FF" value={form.macAddress} onChange={e => set('macAddress', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="spec-hostname">Hostname</label>
                <input id="spec-hostname" className="form-input font-mono" placeholder="PC-TI-042" value={form.hostname} onChange={e => set('hostname', e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          id="btn-submit-asset"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ minWidth: 160 }}
        >
          {loading ? (
            <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> Guardando...</>
          ) : (isEdit ? '💾 Actualizar Activo' : '+ Crear Activo')}
        </button>
        <Link href={id ? `/assets/${id}` : '/assets'} className="btn btn-secondary">Cancelar</Link>
      </div>
    </div>
  )
}
