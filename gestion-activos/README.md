# Sistema de Gestión y Monitoreo de Activos Tecnológicos 💻

Este proyecto es una solución empresarial de **IT Asset Management (ITAM)** desarrollada con **Next.js** y **Prisma ORM**. Su objetivo es centralizar el control, seguimiento y monitoreo del ciclo de vida de los activos de hardware dentro de una organización.

El sistema permite gestionar desde el registro inicial de un equipo hasta su disposición final, pasando por mantenimientos, asignaciones a usuarios y solicitudes de movimiento entre sedes o departamentos.

---

## 📖 Descripción del Programa

El sistema ofrece una plataforma web robusta donde diferentes roles (Administradores, Técnicos y Usuarios) pueden interactuar con el inventario tecnológico. 

El núcleo del programa se basa en un **Modelo de Dominio** estricto que garantiza la integridad de los datos:
* **Gestión de Activos**: Registro detallado con especificaciones técnicas (CPU, RAM, IP, etc.).
* **Ciclo de Vida**: Seguimiento de estados técnicos (Operativo, Dañado, En Mantenimiento) y estados de uso (Disponible, Asignado).
* **Auditoría Total**: Cada cambio significativo genera automáticamente un `EventLog` para trazabilidad completa.
* **Flujos de Trabajo**: Los cambios de ubicación se gestionan mediante solicitudes (`MovementRequests`) que requieren aprobación.

---
<!-- 
## Diagrama de Datos (Modelo de Dominio)

El siguiente diagrama representa la estructura de entidades y sus relaciones en la base de datos. -->

<!-- <p align="center">
  <img src="public\diagrama_entidad_relacion.png" width="800" alt="Diagrama Entidad Relación">
</p>

> [!NOTE]
> El diagrama detallado se encuentra en la documentación técnica del proyecto. -->

<!-- --->

## ⚙️ Funcionalidades Actuales

*   **Dashboard Integral**: Visualización de métricas clave, estados de activos y actividades recientes.
*   **Inventario Detallado**: CRUD de activos con soporte para categorías jerárquicas y ubicaciones físicas.
*   **Especificaciones Técnicas**: Almacenamiento de detalles de hardware y red vinculados a cada activo.
*   **Asignaciones a Usuarios**: Control de quién tiene qué equipo en tiempo real.
*   **Gestión de Mantenimiento**: Registro histórico de mantenimientos preventivos y correctivos, incluyendo costos y proveedores.
*   **Solicitudes de Movimiento**: Sistema de flujo para reubicación de activos con estados de aprobación (Pendiente, Aprobado, Rechazado).
*   **Logs de Auditoría**: Registro inmutable de acciones del sistema para cumplimiento y seguridad.

---

## 🧠 Estructura de Datos (Prisma Schema)

El modelo principal de nuestra base de datos está definido de la siguiente manera:

```prisma
model Asset {
  id               Int           @id @default(autoincrement())
  nombre           String
  codigoInventario String        @unique
  serial           String?       @unique
  estadoTecnico    EstadoTecnico @default(OPERATIVO)
  estadoUso        EstadoUso     @default(DISPONIBLE)
  
  categoryId       Int
  locationId       Int
  
  spec             AssetSpec?
  logs             EventLog[]
  maintenances     Maintenance[]
  assignments      AssetAssignment[]
  
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}
```

---

## 💻 Vista del Dashboard

Ejemplo de la información procesada en el backend para el Dashboard:

```json
{
  "totalAssets": 156,
  "inMaintenance": 12,
  "pendingMovements": 4,
  "recentLogs": [
    { "tipo": "ASIGNACION", "descripcion": "Laptop Dell XPS asignada a Juan Pérez" },
    { "tipo": "MANTENIMIENTO", "descripcion": "Mantenimiento preventivo completado para PC-04" }
  ]
}
```

---

## 📋 Requisitos para Ejecución

Para ejecutar este proyecto en entorno de desarrollo, asegúrate de tener instalado:

*   **Node.js 18+**
*   **PostgreSQL** (o acceso a una instancia de Supabase)
*   **NPM o PNPM**

---

## 🚀 Cómo ejecutar el programa

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/JAHN77/SISTEMA-DE-GESTI-N-Y-MONITOREO-DE-ACTIVOS-TECNOL-GICOS.git
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**
    Crea un archivo `.env` en la raíz con:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
    ```

4.  **Sincronizar base de datos**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Iniciar servidor de desarrollo**
    ```bash
    npm run dev
    ```

---

## 📁 Estructura del proyecto

```text
gestion-activos/
├── app/                  # Rutas de Next.js (App Router)
│   ├── api/              # Endpoints del backend
│   └── (dashboard)/      # Páginas de la interfaz de usuario
├── components/           # Componentes React reutilizables
├── lib/                  # Utilidades y cliente de Prisma
├── prisma/               # Esquema de base de datos y migraciones
├── types/                # Definiciones de TypeScript
└── public/               # Activos estáticos e imágenes
```

---

## 📈 Mejoras Futuras

*   **Integración de Códigos QR**: Para identificación rápida de activos desde dispositivos móviles.
*   **Sistema de Notificaciones**: Alertas por correo para mantenimientos próximos o solicitudes urgentes.
*   **Generación de Reportes PDF**: Exportación masiva de inventario y hojas de vida de equipos.
*   **Gestión de Software**: Seguimiento de licencias instaladas en los activos.

---

## 👨‍💻 Autor

**Juan Andrés Henríquez**
