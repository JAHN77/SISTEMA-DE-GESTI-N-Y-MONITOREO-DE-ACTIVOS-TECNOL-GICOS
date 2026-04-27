'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { Asset, EstadoTecnico, EstadoUso, Category, Location, Role } from '@/types/domain'
import {
  estadoTecnicoBadge, estadoUsoBadge,
  ESTADO_TECNICO_LABELS, ESTADO_USO_LABELS,
} from '@/lib/ui-helpers'
import MovementRequestModal from '@/components/movements/MovementRequestModal'

const ROLE: Role = 'ADMIN' // TODO: from auth session

const ESTADOS_TECNICOS: EstadoTecnico[] = ['OPERATIVO','EN_MANTENIMIENTO','EN_REPARACION','DANADO','FUERA_DE_SERVICIO','DE_BAJA']
const ESTADOS_USO: EstadoUso[] = ['DISPONIBLE','ASIGNADO','RESERVADO','NO_DISPONIBLE']

export default function AssetsPage() {
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
        {['ADMIN','TECHNICIAN'].includes(ROLE) && (
          <div className="page-header-actions">
            <Link href="/assets/new" className="btn btn-primary">+ Nuevo Activo</Link>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>🔍</span>
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
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterTecnico([]); setFilterUso([]); setFilterCat(''); setFilterLoc(''); setSearch(''); setPage(1) }}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('codigoInventario')}>Código <SortIcon col="codigoInventario" /></th>
              <th onClick={() => handleSort('nombre')}>Nombre <SortIcon col="nombre" /></th>
              <th>Categoría</th>
              <th>Ubicación</th>
              <th>Estado Técnico</th>
              <th>Estado de Uso</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: j === 6 ? 60 : '80%' }} /></td>
                  ))}
                </tr>
              ))
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <div className="empty-state-title">Sin activos</div>
                    <div className="empty-state-desc">No se encontraron activos con los filtros actuales.</div>
                    {['ADMIN','TECHNICIAN'].includes(ROLE) && (
                      <Link href="/assets/new" className="btn btn-primary">+ Crear primer activo</Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : assets.map(asset => (
              <tr key={asset.id}>
                <td><span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{asset.codigoInventario}</span></td>
                <td>
                  <Link href={`/assets/${asset.id}`} style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                    {asset.nombre}
                  </Link>
                  {asset.serial && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>S/N: {asset.serial}</div>}
                </td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{asset.category?.name}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{asset.location?.nombre}</td>
                <td><span className={estadoTecnicoBadge(asset.estadoTecnico)}>{ESTADO_TECNICO_LABELS[asset.estadoTecnico]}</span></td>
                <td><span className={estadoUsoBadge(asset.estadoUso)}>{ESTADO_USO_LABELS[asset.estadoUso]}</span></td>
                <td>
                  <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                    <Link href={`/assets/${asset.id}`} className="btn btn-ghost btn-icon btn-sm" title="Ver detalle">👁</Link>
                    {['ADMIN','TECHNICIAN'].includes(ROLE) && (
                      <Link href={`/assets/${asset.id}/edit`} className="btn btn-ghost btn-icon btn-sm" title="Editar">✏️</Link>
                    )}
                    <button className="btn btn-ghost btn-icon btn-sm" title="Solicitar movimiento" onClick={() => setMovementAsset(asset)}>🚚</button>
                    {ROLE === 'ADMIN' && (
                      <button className="btn btn-ghost btn-icon btn-sm" title="Eliminar" onClick={() => handleDelete(asset)} style={{ color: 'var(--color-danado)' }}>🗑</button>
                    )}
                  </div>
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
