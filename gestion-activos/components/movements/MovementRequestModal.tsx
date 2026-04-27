'use client'

import { useEffect, useState } from 'react'
import type { Asset, Location } from '@/types/domain'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  asset: Asset
  onClose: () => void
  onSuccess: () => void
}

export default function MovementRequestModal({ asset, onClose, onSuccess }: Props) {
  const { toast } = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [newLocationId, setNewLocationId] = useState('')
  const [motivo, setMotivo]   = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/locations').then(r => r.json()).then(setLocations)
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!newLocationId)  e.newLocationId = 'Seleccione una ubicación destino'
    if (Number(newLocationId) === asset.locationId) e.newLocationId = 'La ubicación destino debe ser diferente a la actual'
    if (!motivo.trim())  e.motivo = 'El motivo es requerido'
    if (motivo.length < 10) e.motivo = 'El motivo debe tener al menos 10 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId:        asset.id,
          requestedById:  1, // TODO: from auth session
          nuevaLocationId: parseInt(newLocationId),
          motivo,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast('error', 'Error', err.error)
        return
      }
      toast('success', 'Solicitud enviada', 'El movimiento está pendiente de aprobación.')
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" id="movement-request-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">🚚 Solicitar Movimiento</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            {/* Asset info — read only */}
            <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>ACTIVO</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{asset.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{asset.codigoInventario}</div>
            </div>

            {/* Current location — read only */}
            <div className="form-group">
              <label className="form-label">Ubicación Actual</label>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '8px 0' }}>
                📍 {asset.location?.nombre ?? '—'}
              </div>
            </div>

            {/* Destination */}
            <div className="form-group">
              <label className="form-label" htmlFor="new-location-select">
                Ubicación Destino <span className="required">*</span>
              </label>
              <select
                id="new-location-select"
                className="form-select"
                value={newLocationId}
                onChange={e => setNewLocationId(e.target.value)}
              >
                <option value="">Seleccionar ubicación...</option>
                {locations
                  .filter(l => l.id !== asset.locationId)
                  .map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)
                }
              </select>
              {errors.newLocationId && <div className="form-error">{errors.newLocationId}</div>}
            </div>

            {/* Reason */}
            <div className="form-group">
              <label className="form-label" htmlFor="movement-motivo">
                Motivo <span className="required">*</span>
              </label>
              <textarea
                id="movement-motivo"
                className="form-textarea"
                placeholder="Describa el motivo del traslado..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                rows={3}
              />
              {errors.motivo && <div className="form-error">{errors.motivo}</div>}
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--color-mantenimiento)', border: '1px solid rgba(245,158,11,0.2)' }}>
              ⚠️ La solicitud quedará en estado <strong>PENDIENTE</strong> hasta que un Administrador la apruebe.
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button
              id="submit-movement-btn"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> Enviando...</>
              ) : '🚚 Enviar Solicitud'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
