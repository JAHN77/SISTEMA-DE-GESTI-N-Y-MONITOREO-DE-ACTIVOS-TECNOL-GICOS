# Sistema de Gestión y Monitoreo de Activos Tecnológicos

Plataforma web empresarial de **IT Asset Management (ITAM)** que centraliza el control, seguimiento y monitoreo del ciclo de vida completo de activos de hardware dentro de una organización.

Desarrollada con **Next.js 15 App Router**, **Prisma ORM** y **PostgreSQL**, el sistema cubre desde el registro inicial de un equipo hasta su disposición final, incluyendo mantenimientos, asignaciones, traslados y auditoría total de operaciones.

---

## Módulos del sistema

| Módulo | Descripción |
|---|---|
| **Dashboard** | Métricas en tiempo real, distribución de estados, panel de alertas operativas |
| **Activos** | CRUD completo con especificaciones técnicas, imágenes e historial por equipo |
| **Asignaciones** | Control de responsabilidad: quién tiene qué equipo y desde cuándo |
| **Mantenimiento** | Registro de mantenimientos preventivos, correctivos, calibraciones y actualizaciones |
| **Movimientos** | Flujo de solicitudes de traslado con aprobación (Pendiente → Aprobado / Rechazado) |
| **Bitácora** | Registro de auditoría inmutable de todas las acciones del sistema |
| **Notificaciones** | Centro de notificaciones en tiempo real con badge de no leídas |
| **Reportes** | Informes exportables por estado técnico, ubicación y categoría |
| **Usuarios** | Gestión de cuentas y roles del sistema |
| **Configuración** | Edición de perfil y cambio de contraseña |

---

## Roles y permisos

El sistema implementa control de acceso basado en roles (RBAC) centralizado en `lib/permissions.ts`.

| Permiso | SUPER_ADMIN | ADMIN | TECHNICIAN | USER | AUDITOR |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver activos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Crear activos | ✓ | ✓ | | | |
| Editar activos | ✓ | ✓ | ✓ | | |
| Eliminar activos | ✓ | ✓ | | | |
| Asignar activos | ✓ | ✓ | | | |
| Gestionar mantenimiento | ✓ | ✓ | ✓ | | |
| Solicitar movimientos | ✓ | ✓ | ✓ | ✓ | |
| Aprobar movimientos | ✓ | ✓ | | | |
| Ver bitácora | ✓ | ✓ | ✓ | | ✓ |
| Gestionar usuarios | ✓ | ✓ | | | |
| Ver reportes | ✓ | ✓ | | | ✓ |
| Configuración del sistema | ✓ | ✓ | | | |

La UI se adapta dinámicamente según el rol — los usuarios nunca ven acciones que no pueden ejecutar.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma 6 |
| Autenticación | JWT con cookies HttpOnly (HS256) |
| Estilos | CSS custom properties (dark theme) |
| Despliegue DB | Supabase |

---

## Modelo de dominio

```
User ──────────────────────────────────────────────────────┐
                                                           │
Asset ─── AssetSpec                                        │
  │ ─── Category                                           │
  │ ─── Location                                           │
  │ ─── AssetAssignment[] ── User                          │
  │ ─── Maintenance[] ────── User (technician)             │
  │ ─── MovementRequest[] ── User (requestedBy/approvedBy) │
  │ ─── EventLog[] ────────── User                         │
  └─── Notification[] ─────── User ──────────────────────┘
```

Modelos de Prisma: `User`, `Asset`, `AssetSpec`, `Category`, `Location`, `AssetAssignment`, `Maintenance`, `MovementRequest`, `EventLog`, `Notification`, `QRScan`, `AssetLabel`.

**Reglas de negocio críticas:**
- Todo cambio de estado genera un `EventLog` — la auditoría es inmutable
- Los cambios de ubicación solo se realizan mediante `MovementRequest` aprobado
- Solo puede existir una asignación activa por activo a la vez

---

## Estructura del proyecto

```
gestion-activos/
├── app/
│   ├── api/                    # Route Handlers (backend)
│   │   ├── assets/             # CRUD de activos + asignaciones + mantenimiento
│   │   ├── movements/          # Solicitudes de traslado
│   │   ├── notifications/      # Notificaciones + mark-all-read
│   │   ├── users/              # Gestión de usuarios
│   │   ├── reports/            # Exportación de reportes
│   │   └── auth/               # Login, logout, me (perfil)
│   └── (dashboard)/            # Páginas de la interfaz
│       ├── dashboard/
│       ├── assets/
│       ├── assignments/
│       ├── maintenance/
│       ├── movements/
│       ├── notifications/
│       ├── logs/
│       ├── reports/
│       ├── users/
│       └── settings/
├── components/
│   ├── assets/                 # AssetForm, AssetImage, AssetFallbackIcon
│   ├── icons/                  # Sistema de íconos SVG (24 íconos)
│   ├── layout/                 # AppShell, Header, Sidebar
│   ├── maintenance/            # MaintenanceCreateModal
│   ├── movements/              # MovementRequestModal
│   ├── notifications/          # NotificationDropdown
│   └── ui/                     # ToastProvider
├── context/
│   └── AuthContext.tsx         # Estado global de sesión
├── lib/
│   ├── auth.ts                 # requireRole(), getUserFromRequest()
│   ├── permissions.ts          # Matriz RBAC centralizada + can()
│   ├── notifications.ts        # createNotification(), notifyAllAdmins()
│   ├── prisma.ts               # Cliente Prisma singleton
│   └── ui-helpers.ts           # Badges, labels, formateo de fechas
├── middleware.ts               # Guards de rutas por rol
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                 # Datos de prueba
└── types/
    └── domain.ts               # Tipos TypeScript del dominio
```

---

## Instalación y ejecución

### Requisitos

- Node.js 18+
- PostgreSQL (local o Supabase)
- npm

### Pasos

**1. Clonar el repositorio**

```bash
git clone https://github.com/JAHN77/SISTEMA-DE-GESTI-N-Y-MONITOREO-DE-ACTIVOS-TECNOL-GICOS.git
cd SISTEMA-DE-GESTI-N-Y-MONITOREO-DE-ACTIVOS-TECNOL-GICOS/gestion-activos
```

**2. Instalar dependencias**

```bash
npm install
```

**3. Configurar variables de entorno**

Crea un archivo `.env` en la raíz:

```env
DATABASE_URL="postgresql://usuario:contraseña@host:5432/nombre_db"
JWT_SECRET="clave-secreta-minimo-32-caracteres"
```

**4. Sincronizar base de datos**

```bash
npx prisma generate
npx prisma db push
```

**5. Cargar datos de prueba** (opcional)

```bash
npx prisma db seed
```

**6. Iniciar en desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## Usuarios de prueba (seed)

| Email | Contraseña | Rol | Nombre |
|---|---|---|---|
| `superadmin@itam.local` | `Admin123!` | SUPER_ADMIN | Director IT |
| `admin@itam.local` | `Admin123!` | ADMIN | Admin Principal |
| `tech@itam.local` | `Tech123!` | TECHNICIAN | Carlos Técnico |
| `tech2@itam.local` | `Tech123!` | TECHNICIAN | Laura Técnica |
| `user@itam.local` | `User123!` | USER | Usuario Demo |
| `jperez@itam.local` | `User123!` | USER | Juan Pérez |
| `mlopez@itam.local` | `User123!` | USER | María López |
| `agomez@itam.local` | `User123!` | USER | Andrés Gómez |
| `auditor@itam.local` | `Audit123!` | AUDITOR | Sandra Auditora |

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm run db:generate  # Regenerar cliente Prisma
```

---

## Autor

**Juan Andrés Henríquez**  
Universidad de la Costa — CUC  
Desarrollo Web Full Stack
