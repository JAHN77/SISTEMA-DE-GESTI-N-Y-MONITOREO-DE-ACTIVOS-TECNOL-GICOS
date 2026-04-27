'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/types/domain'

interface NavItem {
  label: string
  href: string
  icon: string
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',    icon: '◼',  roles: ['ADMIN', 'TECHNICIAN', 'USER'] },
  { label: 'Activos',       href: '/assets',       icon: '📦', roles: ['ADMIN', 'TECHNICIAN', 'USER'] },
  { label: 'Movimientos',   href: '/movements',    icon: '🚚', roles: ['ADMIN', 'TECHNICIAN', 'USER'] },
  { label: 'Mantenimiento', href: '/maintenance',  icon: '🔧', roles: ['ADMIN', 'TECHNICIAN'] },
  { label: 'Bitácora',      href: '/logs',         icon: '📋', roles: ['ADMIN', 'TECHNICIAN'] },
  { label: 'Usuarios',      href: '/users',        icon: '👥', roles: ['ADMIN'] },
  { label: 'Configuración', href: '/settings',     icon: '⚙️', roles: ['ADMIN'] },
]

interface SidebarProps {
  collapsed: boolean
  role: Role
}

export default function Sidebar({ collapsed, role }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">IT</div>
        {!collapsed && (
          <div>
            <div className="sidebar-logo-text">ITAM</div>
            <div className="sidebar-logo-sub">Asset Management</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">General</div>}

        {visibleItems.slice(0, 3).map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${pathname.startsWith(item.href) ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {!collapsed && <span className="nav-item-label">{item.label}</span>}
          </Link>
        ))}

        {!collapsed && visibleItems.length > 3 && <div className="nav-section-label">Operaciones</div>}

        {visibleItems.slice(3).map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${pathname.startsWith(item.href) ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {!collapsed && <span className="nav-item-label">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            v1.0.0 · Sistema ITAM
          </div>
        )}
      </div>
    </aside>
  )
}
