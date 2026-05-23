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

function SortArrow({ col, sortBy, sortOrder }: { col: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
  if (sortBy !== col) return <span style={{ opacity: 0.25, marginLeft: 3, fontSize: 10 }}>↕</span>
  return <span style={{ marginLeft: 3, fontSize: 10 }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
}

export default function AssetsPage() {
  const { user } = useAuth()
  const canEdit    = can(user.role, 'editAsset')
  const canCreate  = can(user.role, 'createAsset')
  const canDelete  = can(user.role, 'deleteAsset')
  const canRequest = can(user.role, 'requestMovement')

  const [assets, setAssets]         = useState<Asset[]>([])
  const [total, setTotal]           = useState(0)
  const [totalAll, setTotalAll]     = useState(0)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterTecnico, setFilterTecnico] = useState<EstadoTecnico[]>([])
  const [filterUso, setFilterUso]         = useState<EstadoUso[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations]   = useState<Location[]>([])
  const [filterCat, setFilterCat]   = useState('')
  const [filterLoc, setFilterLoc]   = useState('')
  const [sortBy, setSortBy]         = useState('createdAt')
  const [sortOrder, setSortOrder]   = useState<'asc'|'desc'>('desc')
  const [movementAsset, setMovementAsset] = useState<Asset | null>(null)

  const hasFilters = !!(search || filterCat || filterLoc || filterTecnico.length || filterUso.length)
  const activeFilterCount = filterTecnico.length + filterUso.length + (filterCat ? 1 : 0) + (filterLoc ? 1 : 0) + (search ? 1 : 0)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)    params.set('search', search)
    if (filterCat) params.set('categoryId', filterCat)
    if (filterLoc) params.set('locationId', filterLoc)
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
    if (!search && !filterCat && !filterLoc && !filterTecnico.length && !filterUso.length) {
      setTotalAll(data.total ?? 0)
    }
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
  function clearFilters() {
    setFilterTecnico([]); setFilterUso([]); setFilterCat(''); setFilterLoc(''); setSearch(''); setPage(1)
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

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumbs-sep">›</span>
        <span className="breadcrumbs-current">Activos</span>
      </div>

      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="page-title">Activos</h1>
          {!loading && (
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 400 }}>
              {hasFilters && totalAll > 0 ? `${total} de ${totalAll}` : (totalAll || total)} registros
            </span>
          )}
        </div>
        {canCreate && (
          <div className="page-header-actions">
            <Link href="/assets/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo activo
            </Link>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>

        {/* Row 1: Search + selects + clear */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative', minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}>
              <SearchIcon size={13} />
            </span>
            <input
              id="asset-search"
              className="form-input"
              style={{ paddingLeft: 30, height: 34, fontSize: 12 }}
              placeholder="Buscar por nombre, código o serial..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1) }}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 2 }}
              >
                <XIcon size={11} />
              </button>
            )}
          </div>
          <select
            id="filter-category"
            className="form-select"
            style={{ width: 168, height: 34, fontSize: 12, flexShrink: 0 }}
            value={filterCat}
            onChange={e => { setFilterCat(e.target.value); setPage(1) }}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            id="filter-location"
            className="form-select"
            style={{ width: 168, height: 34, fontSize: 12, flexShrink: 0 }}
            value={filterLoc}
            onChange={e => { setFilterLoc(e.target.value); setPage(1) }}
          >
            <option value="">Todas las ubicaciones</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
          {hasFilters && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 4, height: 34, flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              <XIcon size={11} /> Limpiar
            </button>
          )}
        </div>

        {/* Row 2: Status chips */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, marginRight: 2 }}>Técnico:</span>
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
          <span style={{ width: 1, height: 14, background: 'var(--color-border)', flexShrink: 0, margin: '0 4px' }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, marginRight: 2 }}>Uso:</span>
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
      </div>

      {/* Table panel */}
      <div className="table-wrapper">

        {/* Table toolbar */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {loading ? '...' : total === 0 ? '0 resultados' : `${(page-1)*25+1}–${Math.min(page*25, total)} de ${total}`}
          </span>
          {activeFilterCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>
              · {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <table className="responsive-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer' }}>
                Activo <SortArrow col="nombre" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
              <th className="col-secondary">Categoría · Ubicación</th>
              <th className="col-optional">Asignado a</th>
              <th onClick={() => handleSort('estadoTecnico')} style={{ cursor: 'pointer' }}>
                Estado <SortArrow col="estadoTecnico" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
              <th className="col-actions" style={{ textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: j === 4 ? 56 : j === 0 ? '82%' : '68%' }} /></td>
                  ))}
                </tr>
              ))
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state" style={{ padding: '48px 0' }}>
                    <div className="empty-state-icon"><PackageIcon size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-title">Sin activos</div>
                    <div className="empty-state-desc">
                      {hasFilters
                        ? 'No se encontraron activos con los filtros actuales.'
                        : 'No hay activos registrados en el sistema.'}
                    </div>
                    {hasFilters && (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={clearFilters}>
                        Limpiar filtros
                      </button>
                    )}
                    {!hasFilters && canCreate && (
                      <Link href="/assets/new" className="btn btn-primary" style={{ marginTop: 12, textDecoration: 'none' }}>
                        + Crear primer activo
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (assets as any[]).map(asset => (
              <tr key={asset.id}>

                {/* Title — name + code/serial */}
                <td className="col-title">
                  <div>
                    <Link
                      href={`/assets/${asset.id}`}
                      style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
                    >
                      {asset.nombre}
                    </Link>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                      {asset.codigoInventario}{asset.serial ? ` · ${asset.serial}` : ''}
                    </div>
                  </div>
                  <span className={estadoUsoBadge(asset.estadoUso as EstadoUso)} style={{ flexShrink: 0 }}>
                    {ESTADO_USO_LABELS[asset.estadoUso as EstadoUso]}
                  </span>
                </td>

                {/* Category + Location stacked */}
                <td className="col-secondary" data-label="Categoría · Ubicación">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {asset.category?.name && (
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.2 }}>
                        {asset.category.name}
                      </span>
                    )}
                    {asset.location?.nombre && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {asset.location.nombre}
                      </span>
                    )}
                    {!asset.category?.name && !asset.location?.nombre && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>
                    )}
                  </div>
                </td>

                {/* Assigned to */}
                <td className="col-optional" data-label="Asignado a">
                  {asset.assignedTo ? (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: 1.3 }}>
                        {asset.assignedTo.name}
                      </div>
                      {asset.assignedTo.department && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {asset.assignedTo.department}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sin asignar</span>
                  )}
                </td>

                {/* Status — técnico + uso stacked */}
                <td data-label="Estado">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <span className={estadoTecnicoBadge(asset.estadoTecnico as EstadoTecnico)}>
                      {ESTADO_TECNICO_LABELS[asset.estadoTecnico as EstadoTecnico]}
                    </span>
                    <span className={estadoUsoBadge(asset.estadoUso as EstadoUso)}>
                      {ESTADO_USO_LABELS[asset.estadoUso as EstadoUso]}
                    </span>
                  </div>
                </td>

                {/* Actions — icon buttons only */}
                <td className="col-actions" data-label="">
                  <Link
                    href={`/assets/${asset.id}`}
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Ver detalle"
                  >
                    <EyeIcon size={14} />
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/assets/${asset.id}/edit`}
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Editar activo"
                    >
                      <EditIcon size={14} />
                    </Link>
                  )}
                  {canRequest && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Solicitar movimiento"
                      onClick={() => setMovementAsset(asset)}
                    >
                      <TruckIcon size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Eliminar activo"
                      onClick={() => handleDelete(asset)}
                      style={{ color: 'var(--color-danado)' }}
                    >
                      <TrashIcon size={14} />
                    </button>
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
