'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { Asset, EstadoTecnico, EstadoUso, Category, Location } from '@/types/domain'
import {
  estadoTecnicoBadge, estadoUsoBadge,
  ESTADO_TECNICO_LABELS, ESTADO_USO_LABELS,
} from '@/lib/ui-helpers'
import MovementRequestModal from '@/components/movements/MovementRequestModal'
import { useAuth } from '@/context/AuthContext'
import { can } from '@/lib/permissions'
import { SearchIcon, PackageIcon, EyeIcon, EditIcon, TruckIcon, TrashIcon, XIcon } from '@/components/icons'

const ESTADOS_TECNICOS: EstadoTecnico[] = ['OPERATIVO','EN_MANTENIMIENTO','EN_REPARACION','DANADO','FUERA_DE_SERVICIO','DE_BAJA','EN_TRANSITO']
const ESTADOS_USO: EstadoUso[] = ['DISPONIBLE','ASIGNADO','RESERVADO','NO_DISPONIBLE','PRESTADO']

export default function AssetsPage() {
  const { user } = useAuth()
  const canEdit    = can(user.role, 'editAsset')
  const canCreate  = can(user.role, 'createAsset')
  const canDelete  = can(user.role, 'deleteAsset')
  const canRequest = can(user.role, 'requestMovement')
  const [assets, setAssets]   = useState<Asset[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterTecnico, setFilterTecnico] = useState<EstadoTecnico[]>([])
  const [filterUso, setFilterUso]         = useState<EstadoUso[]>([])
  const [categories, setCategories]       = useState<Category[]>([])
  const [locations, setLocations]         = useState<Location[]>([])
  const [filterCat, setFilterCat]   = useState('')
  const [filterLoc, setFilterLoc]   = useState('')
  const [sortBy, setSortBy]         = useState('createdAt')
  const [sortOrder, setSortOrder]   = useState<'asc'|'desc'>('desc')
  const [movementAsset, setMovementAsset] = useState<Asset | null>(null)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)      params.set('search', search)
    if (filterCat)   params.set('categoryId', filterCat)
    if (filterLoc)   params.set('locationId', filterLoc)
    filterTecnico.forEach(v => params.append('estadoTecnico', v))
    filterUso.forEach(v     => params.append('estadoUso', v))
    params.set('page', String(page))
    params.set('pageSize', '25')
    params.set('sortBy', sortBy)
    params.set('sortOrder', sortOrder)

    const res  = await fetch(`/api/assets?${params}`)
    const data = await res.json()
    setAssets(data.data ?? [])
    setTotal(data.total ?? 0)
    setTotalPages(data.totalPages ?? 1)
    setLoading(false)
  }, [search, filterCat, filterLoc, filterTecnico, filterUso, page, sortBy, sortOrder])

  useEffect(() => { fetchAssets() }, [fetchAssets])
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    fetch('/api/locations').then(r => r.json()).then(setLocations)
  }, [])

  function toggleTecnico(e: EstadoTecnico) {
    setFilterTecnico(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
    setPage(1)
  }
  function toggleUso(e: EstadoUso) {
    setFilterUso(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
    setPage(1)
  }

  async function handleDelete(asset: Asset) {
    if (!confirm(`¿Eliminar "${asset.nombre}"? Esta acción es reversible (soft delete).`)) return
    await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' })
    fetchAssets()
  }

  function handleSort(col: string) {
    if (sortBy === col) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortOrder('asc') }
    setPage(1)
  }

  const SortIcon = ({ col }: { col: string }) =>
    sortBy === col ? <span style={{ marginLeft: 4 }}>{sortOrder === 'asc' ? '↑' : '↓'}</span> : null

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Activos</span>
      </div>

      {/* Page header */}
      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="page-title">Activos Tecnológicos</h1>
          <p className="page-subtitle">{total} activos registrados en el sistema</p>
        </div>
        {canCreate && (
          <div className="page-header-actions">
            <Link href="/assets/new" className="btn btn-primary">+ Nuevo Activo</Link>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}><SearchIcon size={14} /></span>
        <input
          id="asset-search"
          className="form-input"
          style={{ paddingLeft: 32 }}
          placeholder="Buscar por nombre, código o serial..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select id="filter-category" className="form-select" style={{ width: 180, height: 32, fontSize: 12 }} value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select id="filter-location" className="form-select" style={{ width: 180, height: 32, fontSize: 12 }} value={filterLoc} onChange={e => { setFilterLoc(e.target.value); setPage(1) }}>
          <option value="">Todas las ubicaciones</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ESTADOS_TECNICOS.map(e => (
            <button
              key={e}
              id={`filter-tecnico-${e}`}
              className={`filter-chip${filterTecnico.includes(e) ? ' active' : ''}`}
              onClick={() => toggleTecnico(e)}
            >
              {ESTADO_TECNICO_LABELS[e]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ESTADOS_USO.map(e => (
            <button
              key={e}
              id={`filter-uso-${e}`}
              className={`filter-chip${filterUso.includes(e) ? ' active' : ''}`}
              onClick={() => toggleUso(e)}
            >
              {ESTADO_USO_LABELS[e]}
            </button>
          ))}
        </div>

        {(filterTecnico.length > 0 || filterUso.length > 0 || filterCat || filterLoc || search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterTecnico([]); setFilterUso([]); setFilterCat(''); setFilterLoc(''); setSearch(''); setPage(1) }} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <XIcon size={12} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="responsive-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('nombre')}>Activo <SortIcon col="nombre" /></th>
              <th className="col-optional">Código</th>
              <th className="col-secondary">Categoría</th>
              <th className="col-secondary">Ubicación</th>
              <th>Asignado a</th>
              <th>Estado Técnico</th>
              <th className="col-optional">Estado de Uso</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: j === 7 ? 60 : '80%' }} /></td>
                  ))}
                </tr>
              ))
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><PackageIcon size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-title">Sin activos</div>
                    <div className="empty-state-desc">No se encontraron activos con los filtros actuales.</div>
                    {canCreate && (
                      <Link href="/assets/new" className="btn btn-primary">+ Crear primer activo</Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (assets as any[]).map(asset => (
              <tr key={asset.id}>
                {/* Title cell — shown as card header on mobile */}
                <td className="col-title">
                  <div>
                    <Link href={`/assets/${asset.id}`} style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                      {asset.nombre}
                    </Link>
                    {asset.serial && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>S/N: {asset.serial}</div>}
                  </div>
                  {/* On mobile, show usage badge inline with title */}
                  <span className={estadoUsoBadge(asset.estadoUso as EstadoUso)} style={{ flexShrink: 0 }}>
                    {ESTADO_USO_LABELS[asset.estadoUso as EstadoUso]}
                  </span>
                </td>
                <td className="col-optional" data-label="Código">
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{asset.codigoInventario}</span>
                </td>
                <td className="col-secondary" data-label="Categoría" style={{ color: 'var(--color-text-secondary)' }}>{asset.category?.name ?? '—'}</td>
                <td className="col-secondary" data-label="Ubicación" style={{ color: 'var(--color-text-secondary)' }}>{asset.location?.nombre ?? '—'}</td>
                <td data-label="Asignado a">
                  {asset.assignedTo ? (
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>{asset.assignedTo.name}</span>
                      {asset.assignedTo.department && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>{asset.assignedTo.department}</span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Sin asignar</span>
                  )}
                </td>
                <td data-label="Estado"><span className={estadoTecnicoBadge(asset.estadoTecnico as EstadoTecnico)}>{ESTADO_TECNICO_LABELS[asset.estadoTecnico as EstadoTecnico]}</span></td>
                <td className="col-optional" data-label="Uso"><span className={estadoUsoBadge(asset.estadoUso as EstadoUso)}>{ESTADO_USO_LABELS[asset.estadoUso as EstadoUso]}</span></td>
                <td className="col-actions" data-label="">
                  <Link href={`/assets/${asset.id}`} className="btn btn-secondary btn-sm" title="Ver detalle"><EyeIcon size={13} /> <span>Ver</span></Link>
                  {canEdit && (
                    <Link href={`/assets/${asset.id}/edit`} className="btn btn-ghost btn-icon btn-sm" title="Editar"><EditIcon size={13} /></Link>
                  )}
                  {canRequest && (
                    <button className="btn btn-ghost btn-icon btn-sm" title="Solicitar movimiento" onClick={() => setMovementAsset(asset)}><TruckIcon size={13} /></button>
                  )}
                  {canDelete && (
                    <button className="btn btn-ghost btn-icon btn-sm" title="Eliminar" onClick={() => handleDelete(asset)} style={{ color: 'var(--color-danado)' }}><TrashIcon size={13} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <span className="pagination-info">
            {total === 0 ? '0 resultados' : `${(page-1)*25+1}–${Math.min(page*25, total)} de ${total}`}
          </span>
          <div className="pagination-controls">
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}>‹</button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button key={p} className={`pagination-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              )
            })}
            <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>›</button>
            <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      </div>

      {/* Movement modal */}
      {movementAsset && (
        <MovementRequestModal
          asset={movementAsset}
          onClose={() => setMovementAsset(null)}
          onSuccess={() => { setMovementAsset(null); fetchAssets() }}
        />
      )}
    </div>
  )
}
