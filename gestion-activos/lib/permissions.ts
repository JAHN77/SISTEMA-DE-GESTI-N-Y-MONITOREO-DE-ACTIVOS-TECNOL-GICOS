import type { Role } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────
// Centralized RBAC permission matrix
// Add new permissions here — never scatter role checks in components.
// ─────────────────────────────────────────────────────────────────
const PERMISSION_MAP = {
  // ── Assets ───────────────────────────────────────────────────
  viewAssets:           ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER', 'AUDITOR'],
  createAsset:          ['SUPER_ADMIN', 'ADMIN'],
  editAsset:            ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  deleteAsset:          ['SUPER_ADMIN', 'ADMIN'],

  // ── Assignments ───────────────────────────────────────────────
  viewAssignments:      ['SUPER_ADMIN', 'ADMIN'],
  assignAsset:          ['SUPER_ADMIN', 'ADMIN'],

  // ── Maintenance ───────────────────────────────────────────────
  viewMaintenance:      ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],
  manageMaintenance:    ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'],

  // ── Movements ────────────────────────────────────────────────
  viewMovements:        ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER'],
  requestMovement:      ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER'],
  approveMovement:      ['SUPER_ADMIN', 'ADMIN'],

  // ── Logs ─────────────────────────────────────────────────────
  viewLogs:             ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'AUDITOR'],

  // ── Users ────────────────────────────────────────────────────
  manageUsers:          ['SUPER_ADMIN', 'ADMIN'],

  // ── Reports ──────────────────────────────────────────────────
  viewReports:          ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'],
  exportReports:        ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'],

  // ── Settings ─────────────────────────────────────────────────
  manageSettings:       ['SUPER_ADMIN', 'ADMIN'],

  // ── Notifications ────────────────────────────────────────────
  viewNotifications:    ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER', 'AUDITOR'],
} as const satisfies Record<string, readonly string[]>

export type Permission = keyof typeof PERMISSION_MAP

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSION_MAP[permission] as readonly string[]).includes(role)
}

export const PERMISSIONS = PERMISSION_MAP
