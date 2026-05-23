'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/types/domain'
import {
  DashboardIcon, PackageIcon, TruckIcon, WrenchIcon,
  ClipboardIcon, UsersIcon, SettingsIcon, CheckCircleIcon, FilterIcon, BellIcon,
} from '@/components/icons'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',    icon: <DashboardIcon size={18} />,  roles: ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER', 'AUDITOR'] },
  { label: 'Activos',       href: '/assets',       icon: <PackageIcon size={18} />,    roles: ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER', 'AUDITOR'] },
  { label: 'Movimientos',   href: '/movements',    icon: <TruckIcon size={18} />,      roles: ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER'] },
  { label: 'Asignaciones',  href: '/assignments',  icon: <CheckCircleIcon size={18} />, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Mantenimiento', href: '/maintenance',  icon: <WrenchIcon size={18} />,     roles: ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'] },
  { label: 'Bitácora',         href: '/logs',          icon: <ClipboardIcon size={18} />,  roles: ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'AUDITOR'] },
  { label: 'Notificaciones',  href: '/notifications', icon: <BellIcon size={18} />,       roles: ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER', 'AUDITOR'] },
  { label: 'Reportes',        href: '/reports',       icon: <FilterIcon size={18} />,     roles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'] },
  { label: 'Usuarios',        href: '/users',         icon: <UsersIcon size={18} />,      roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Configuración',   href: '/settings',      icon: <SettingsIcon size={18} />,   roles: ['SUPER_ADMIN', 'ADMIN'] },
]

interface SidebarProps {
  collapsed: boolean
  role: Role
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ collapsed, role, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))
  const generalItems = visibleItems.slice(0, 3)
  const opsItems     = visibleItems.slice(3)

  // Labels are shown when sidebar is expanded OR when mobile overlay is open
  const showLabels = !collapsed || mobileOpen

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">IT</div>
        {showLabels && (
          <div>
            <div className="sidebar-logo-text">ITAM</div>
            <div className="sidebar-logo-sub">Asset Management</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {showLabels && <div className="nav-section-label">General</div>}

        {generalItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${pathname.startsWith(item.href) ? ' active' : ''}`}
            title={!showLabels ? item.label : undefined}
            onClick={onMobileClose}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {showLabels && <span className="nav-item-label">{item.label}</span>}
          </Link>
        ))}

        {showLabels && opsItems.length > 0 && <div className="nav-section-label">Operaciones</div>}

        {opsItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${pathname.startsWith(item.href) ? ' active' : ''}`}
            title={!showLabels ? item.label : undefined}
            onClick={onMobileClose}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {showLabels && <span className="nav-item-label">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {showLabels && (
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            v1.0.0 · Sistema ITAM
          </div>
        )}
      </div>
    </aside>
  )
}
