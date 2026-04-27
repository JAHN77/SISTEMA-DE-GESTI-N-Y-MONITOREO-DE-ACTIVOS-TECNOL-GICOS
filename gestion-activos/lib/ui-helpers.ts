import type { EstadoTecnico, EstadoUso, RequestStatus, EventType, MaintenanceType } from '@/types/domain'

// ─── Badge CSS class resolvers ──────────────────────────

export function estadoTecnicoBadge(estado: EstadoTecnico): string {
  const map: Record<EstadoTecnico, string> = {
    OPERATIVO:        'badge badge-operativo',
    EN_MANTENIMIENTO: 'badge badge-mantenimiento',
    EN_REPARACION:    'badge badge-reparacion',
    DANADO:           'badge badge-danado',
    FUERA_DE_SERVICIO:'badge badge-fuera',
    DE_BAJA:          'badge badge-baja',
  }
  return map[estado] ?? 'badge badge-baja'
}

export function estadoUsoBadge(estado: EstadoUso): string {
  const map: Record<EstadoUso, string> = {
    DISPONIBLE:    'badge badge-disponible',
    ASIGNADO:      'badge badge-asignado',
    RESERVADO:     'badge badge-reservado',
    NO_DISPONIBLE: 'badge badge-no-disponible',
  }
  return map[estado] ?? 'badge badge-baja'
}

export function requestStatusBadge(status: RequestStatus): string {
  const map: Record<RequestStatus, string> = {
    PENDING:  'badge badge-pending',
    APPROVED: 'badge badge-approved',
    REJECTED: 'badge badge-rejected',
  }
  return map[status] ?? 'badge'
}

export function eventTypeBadge(tipo: EventType): string {
  const map: Record<EventType, string> = {
    CREACION:          'badge badge-event-creacion',
    ACTUALIZACION:     'badge badge-event-actualizacion',
    CAMBIO_ESTADO:     'badge badge-event-cambio-estado',
    ASIGNACION:        'badge badge-event-asignacion',
    DESASIGNACION:     'badge badge-event-desasignacion',
    MANTENIMIENTO:     'badge badge-event-mantenimiento',
    CAMBIO_CATEGORIA:  'badge badge-event-cambio-categoria',
    CAMBIO_UBICACION:  'badge badge-event-cambio-ubicacion',
  }
  return map[tipo] ?? 'badge'
}

export function maintenanceTypeBadge(tipo: MaintenanceType): string {
  const map: Record<MaintenanceType, string> = {
    PREVENTIVO:  'badge badge-preventivo',
    CORRECTIVO:  'badge badge-correctivo',
    CALIBRACION: 'badge badge-calibracion',
  }
  return map[tipo] ?? 'badge'
}

// ─── Label helpers ──────────────────────────────────────

export const ESTADO_TECNICO_LABELS: Record<EstadoTecnico, string> = {
  OPERATIVO:        'Operativo',
  EN_MANTENIMIENTO: 'En Mantenimiento',
  EN_REPARACION:    'En Reparación',
  DANADO:           'Dañado',
  FUERA_DE_SERVICIO:'Fuera de Servicio',
  DE_BAJA:          'De Baja',
}

export const ESTADO_USO_LABELS: Record<EstadoUso, string> = {
  DISPONIBLE:    'Disponible',
  ASIGNADO:      'Asignado',
  RESERVADO:     'Reservado',
  NO_DISPONIBLE: 'No Disponible',
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING:  'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CREACION:          'Creación',
  ACTUALIZACION:     'Actualización',
  CAMBIO_ESTADO:     'Cambio de Estado',
  ASIGNACION:        'Asignación',
  DESASIGNACION:     'Desasignación',
  MANTENIMIENTO:     'Mantenimiento',
  CAMBIO_CATEGORIA:  'Cambio de Categoría',
  CAMBIO_UBICACION:  'Cambio de Ubicación',
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVO:  'Preventivo',
  CORRECTIVO:  'Correctivo',
  CALIBRACION: 'Calibración',
}

// ─── Date helpers ───────────────────────────────────────

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now.getTime() - then.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  return formatDate(dateStr)
}

// ─── Number helpers ─────────────────────────────────────

export function formatCurrency(val: string | null): string {
  if (!val) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(val))
}
