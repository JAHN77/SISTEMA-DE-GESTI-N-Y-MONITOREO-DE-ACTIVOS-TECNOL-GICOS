'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/ToastProvider'
import { CheckCircleIcon, SearchIcon, PackageIcon } from '@/components/icons'
import { formatDate, timeAgo } from '@/lib/ui-helpers'

interface Assignment {
  id: number
  assetId: number
  userId: number
  startDate: string
  endDate: string | null
  reason: string | null
  notes: string | null
  user: { id: number; name: string; email: string; department: string | null }
  createdBy: { id: number; name: string } | null
  asset?: { id: number; nombre: string; codigoInventario: string }
}

export default function AssignmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [assets, setAssets]       = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStatus, setStatus] = useState<'all' | 'active'>('active')
  const [returning, setReturning] = useState<number | null>(null)

  // We derive all active assignments by fetching assets with status ASIGNADO
  // and reading their first active assignment
  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '100', sortBy: 'name', sortOrder: 'asc' })
      if (filterStatus === 'active') params.set('estadoUso', 'ASIGNADO')
      if (search.trim()) params.set('search', search.trim())
      const res  = await fetch(`/api/assets?${params}`)
      const data = await res.json()
      setAssets(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filterStatus])

  async function handleReturn(assetId: number, assetName: string) {
    if (!confirm(`¿Finalizar la asignación de "${assetName}"?`)) return
    setReturning(assetId)
    try {
      const res = await fetch(`/api/assets/${assetId}/assignments`, { method: 'PATCH' })
      if (!res.ok) { const d = await res.json(); toast('error', 'Error', d.error); return }
      toast('success', 'Asignación finalizada', `${assetName} está ahora disponible.`)
      loadData()
    } finally {
      setReturning(null)
    }
  }

  const canManage = ['SUPER_ADMIN', 'ADMIN'].includes(user.role)

  const filtered = search.trim()
    ? assets.filter(a =>
        a.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        a.codigoInventario?.toLowerCase().includes(search.toLowerCase()) ||
        a.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : assets

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Asignaciones</span>
      </div>

      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="page-title">Asignaciones</h1>
          <p className="page-subtitle">Control de activos asignados a usuarios y departamentos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}>
            <SearchIcon size={13} />
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por activo o usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32, height: 34, fontSize: 13 }}
          />
        </div>
        {(['active', 'all'] as const).map(s => (
          <button
            key={s}
            className={`filter-chip${filterStatus === s ? ' active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s === 'active' ? 'Activas' : 'Todas (incluye historial)'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Activo</th>
              <th>Código</th>
              <th>Usuario Asignado</th>
              <th>Departamento</th>
              <th>Asignado Por</th>
              <th>Fecha Inicio</th>
              <th>Estado</th>
              {canManage && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>{[...Array(canManage ? 8 : 7)].map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><CheckCircleIcon size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-title">Sin asignaciones{filterStatus === 'active' ? ' activas' : ''}</div>
                    <div className="empty-state-desc">
                      {search ? 'No se encontraron resultados para la búsqueda.' : 'No hay activos asignados actualmente.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : filtered.map((asset: any) => {
              const assignee  = asset.assignedTo
              const isActive  = !!assignee
              return (
                <tr key={asset.id}>
                  <td>
                    <Link href={`/assets/${asset.id}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
                      {asset.nombre}
                    </Link>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {asset.codigoInventario}
                  </td>
                  <td>
                    {assignee ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{assignee.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{assignee.email}</div>
                      </div>
                    ) : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{assignee?.department ?? '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>—</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>—</td>
                  <td>
                    {isActive ? (
                      <span className="badge badge-operativo">Activa</span>
                    ) : (
                      <span className="badge badge-de-baja">Finalizada</span>
                    )}
                  </td>
                  {canManage && (
                    <td>
                      {isActive && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleReturn(asset.id, asset.nombre)}
                          disabled={returning === asset.id}
                          style={{ fontSize: 12, color: 'var(--color-mantenimiento)' }}
                        >
                          {returning === asset.id ? 'Finalizando...' : 'Devolver'}
                        </button>
                      )}
                      <Link
                        href={`/assets/${asset.id}?tab=assignments`}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 12, marginLeft: 4 }}
                      >
                        Ver detalle
                      </Link>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
          {filtered.length} {filterStatus === 'active' ? 'activos asignados' : 'registros'}
        </div>
      )}
    </div>
  )
}
