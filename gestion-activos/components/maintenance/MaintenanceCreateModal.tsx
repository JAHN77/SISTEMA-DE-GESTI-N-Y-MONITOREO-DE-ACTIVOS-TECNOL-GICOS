'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { WrenchIcon, XIcon, SearchIcon } from '@/components/icons'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const TIPOS = [
  { value: 'PREVENTIVO',    label: 'Preventivo' },
  { value: 'CORRECTIVO',    label: 'Correctivo' },
  { value: 'CALIBRACION',   label: 'Calibración' },
  { value: 'ACTUALIZACION', label: 'Actualización' },
  { value: 'LIMPIEZA',      label: 'Limpieza' },
]

export default function MaintenanceCreateModal({ onClose, onSuccess }: Props) {
  const { toast } = useToast()

  // Asset search
  const [assetSearch, setAssetSearch] = useState('')
  const [assets, setAssets]           = useState<any[]>([])
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null)
  const [searching, setSearching]     = useState(false)

  // Technicians
  const [technicians, setTechnicians] = useState<any[]>([])

  // Form fields
  const [tipo, setTipo]           = useState('PREVENTIVO')
  const [descripcion, setDesc]    = useState('')
  const [proveedor, setProveedor] = useState('')
  const [costo, setCosto]         = useState('')
  const [fechaInicio, setFecha]   = useState(new Date().toISOString().slice(0, 10))
  const [realizadoPorId, setTech] = useState('')
  const [estadoInicial, setEstado] = useState('SCHEDULED')
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    fetch('/api/technicians').then(r => r.json()).then(setTechnicians)
  }, [])

  async function searchAssets() {
    if (!assetSearch.trim()) return
    setSearching(true)
    const res = await fetch(`/api/assets?search=${encodeURIComponent(assetSearch)}&pageSize=10`)
    const data = await res.json()
    setAssets(data.data ?? [])
    setSearching(false)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!selectedAsset) e.asset = 'Selecciona un activo'
    if (!descripcion.trim()) e.descripcion = 'La descripción es requerida'
    if (!fechaInicio) e.fechaInicio = 'La fecha es requerida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/assets/${selectedAsset.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          descripcion: descripcion.trim(),
          proveedor:   proveedor.trim() || null,
          costo:       costo ? parseFloat(costo) : null,
          fechaInicio,
          realizadoPorId: realizadoPorId ? parseInt(realizadoPorId) : null,
          estadoInicial,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast('error', 'Error', err.error)
        return
      }
      toast('success', 'Mantenimiento creado', `Registro creado para ${selectedAsset.nombre}.`)
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <WrenchIcon size={15} /> Nuevo Mantenimiento
          </span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ display: 'flex', alignItems: 'center' }}>
            <XIcon size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Asset search */}
          <div className="form-group">
            <label className="form-label">Activo <span className="required">*</span></label>
            {selectedAsset ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--color-bg-elevated)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedAsset.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{selectedAsset.codigoInventario}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedAsset(null); setAssets([]) }}>Cambiar</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Buscar por nombre o código..."
                  value={assetSearch}
                  onChange={e => setAssetSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchAssets()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary" onClick={searchAssets} disabled={searching} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SearchIcon size={13} /> Buscar
                </button>
              </div>
            )}
            {!selectedAsset && assets.length > 0 && (
              <div style={{ marginTop: 4, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                {assets.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAsset(a); setAssets([]) }}
                    style={{ width: '100%', background: 'var(--color-bg-elevated)', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{a.nombre}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 8 }}>{a.codigoInventario}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.asset && <div className="form-error">{errors.asset}</div>}
          </div>

          {/* Tipo + estado inicial */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado inicial</label>
              <select className="form-select" value={estadoInicial} onChange={e => setEstado(e.target.value)}>
                <option value="SCHEDULED">Programado</option>
                <option value="IN_PROGRESS">Iniciar ahora</option>
              </select>
            </div>
          </div>

          {/* Descripcion */}
          <div className="form-group">
            <label className="form-label">Descripción <span className="required">*</span></label>
            <textarea className="form-textarea" rows={3} placeholder="Describe el trabajo a realizar..." value={descripcion} onChange={e => setDesc(e.target.value)} />
            {errors.descripcion && <div className="form-error">{errors.descripcion}</div>}
          </div>

          {/* Proveedor + costo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Proveedor / Técnico externo</label>
              <input className="form-input" placeholder="Opcional" value={proveedor} onChange={e => setProveedor(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Costo (COP)</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={costo} onChange={e => setCosto(e.target.value)} />
            </div>
          </div>

          {/* Fecha + técnico */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Fecha de inicio <span className="required">*</span></label>
              <input className="form-input" type="date" value={fechaInicio} onChange={e => setFecha(e.target.value)} />
              {errors.fechaInicio && <div className="form-error">{errors.fechaInicio}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Técnico responsable</label>
              <select className="form-select" value={realizadoPorId} onChange={e => setTech(e.target.value)}>
                <option value="">Sin asignar</option>
                {technicians.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading ? <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> Guardando...</> : <><WrenchIcon size={14} /> Crear Mantenimiento</>}
          </button>
        </div>
      </div>
    </div>
  )
}
