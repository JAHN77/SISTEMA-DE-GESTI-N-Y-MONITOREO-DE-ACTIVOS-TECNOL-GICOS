// Central TypeScript types derived from the Prisma schema
// AGENTS.md: Do NOT modify domain types or bypass business rules

export type Role = 'ADMIN' | 'TECHNICIAN' | 'USER'

export type EstadoTecnico =
  | 'OPERATIVO'
  | 'DANADO'
  | 'EN_MANTENIMIENTO'
  | 'EN_REPARACION'
  | 'FUERA_DE_SERVICIO'
  | 'DE_BAJA'

export type EstadoUso =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'RESERVADO'
  | 'NO_DISPONIBLE'

export type EventType =
  | 'CREACION'
  | 'ACTUALIZACION'
  | 'CAMBIO_ESTADO'
  | 'ASIGNACION'
  | 'DESASIGNACION'
  | 'MANTENIMIENTO'
  | 'CAMBIO_CATEGORIA'
  | 'CAMBIO_UBICACION'

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type MaintenanceType = 'PREVENTIVO' | 'CORRECTIVO' | 'CALIBRACION'

// ─── Domain Entities ────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Category {
  id: number
  name: string
  descripcion: string | null
  parentId: number | null
  parent?: Category | null
  children?: Category[]
}

export interface Location {
  id: number
  nombre: string
  descripcion: string | null
  parentId: number | null
  parent?: Location | null
  children?: Location[]
  createdAt: string
}

export interface AssetSpec {
  id: number
  assetId: number
  marca: string | null
  modelo: string | null
  cpu: string | null
  ram: string | null
  almacenamiento: string | null
  sistemaOperativo: string | null
  versionSO: string | null
  ipAddress: string | null
  macAddress: string | null
  hostname: string | null
  data: Record<string, unknown> | null
}

export interface Asset {
  id: number
  nombre: string
  codigoInventario: string
  serial: string | null
  estadoTecnico: EstadoTecnico
  estadoUso: EstadoUso
  imageUrl: string | null
  categoryId: number
  category: Category
  locationId: number
  location: Location
  spec: AssetSpec | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface AssetAssignment {
  id: number
  userId: number
  assetId: number
  asignadoPorId: number | null
  fechaInicio: string
  fechaFin: string | null
  user: User
  asignadoPor: User | null
}

export interface EventLog {
  id: number
  tipo: EventType
  descripcion: string
  fecha: string
  metadata: Record<string, unknown> | null
  assetId: number
  userId: number | null
  user: User | null
}

export interface MovementRequest {
  id: number
  assetId: number
  requestedById: number
  approvedById: number | null
  nuevaLocationId: number | null
  motivo: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
  asset: Asset
  requestedBy: User
  approvedBy: User | null
  nuevaLocation: Location | null
}

export interface Maintenance {
  id: number
  assetId: number
  tipo: MaintenanceType
  descripcion: string
  proveedor: string | null
  costo: string | null
  fechaInicio: string
  fechaFin: string | null
  realizadoPorId: number | null
  createdAt: string
  updatedAt: string
  realizadoPor: User | null
}

// ─── Dashboard ──────────────────────────────────────────

export interface DashboardStats {
  totalAssets: number
  operative: number
  inMaintenance: number
  damaged: number
  byTechnicalState: Record<EstadoTecnico, number>
  byUsageState: Record<EstadoUso, number>
  recentLogs: EventLog[]
}

// ─── API Response Shapes ────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  error: string
  details?: string
}

// ─── Filter Types ───────────────────────────────────────

export interface AssetFilters {
  search?: string
  categoryId?: number
  locationId?: number
  estadoTecnico?: EstadoTecnico[]
  estadoUso?: EstadoUso[]
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
