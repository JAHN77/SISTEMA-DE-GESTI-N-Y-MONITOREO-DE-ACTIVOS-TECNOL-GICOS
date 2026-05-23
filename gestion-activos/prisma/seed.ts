import {
  Role, TechnicalStatus, UsageStatus, LocationType,
  EventType, MaintenanceType, MaintenanceStatus,
} from '@prisma/client'
import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/password'

// ── helpers de fecha ─────────────────────────────────────────────
const ago  = (days: number) => new Date(Date.now() - days * 86_400_000)
const from = (days: number) => new Date(Date.now() + days * 86_400_000)

async function main() {
  console.log('🌱  Iniciando seed completo...\n')

  // ── Limpieza de datos previos (orden respeta FK) ──────
  await prisma.eventLog.deleteMany()
  await prisma.maintenance.deleteMany()
  await prisma.movementRequest.deleteMany()
  await prisma.assetAssignment.deleteMany()
  await prisma.assetSpec.deleteMany()
  await prisma.asset.deleteMany()
  // Romper jerarquía antes de borrar locations
  await prisma.location.updateMany({ data: { parentId: null } })
  await prisma.location.deleteMany()
  // Romper jerarquía de categorías
  await prisma.category.updateMany({ data: { parentId: null } })
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  console.log('🗑   Datos previos eliminados\n')

  // ══════════════════════════════════════════════════════
  //  1. USUARIOS — los 5 roles del sistema
  // ══════════════════════════════════════════════════════
  const superAdmin = await prisma.user.upsert({
    where:  { email: 'superadmin@itam.local' },
    update: { password: hashPassword('Admin123!') },
    create: { name: 'Director IT', email: 'superadmin@itam.local', password: hashPassword('Admin123!'), role: Role.SUPER_ADMIN, department: 'Dirección IT' },
  })
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@itam.local' },
    update: { password: hashPassword('Admin123!') },
    create: { name: 'Admin Principal', email: 'admin@itam.local', password: hashPassword('Admin123!'), role: Role.ADMIN, department: 'IT' },
  })
  const tech = await prisma.user.upsert({
    where:  { email: 'tech@itam.local' },
    update: { password: hashPassword('Tech123!') },
    create: { name: 'Carlos Técnico', email: 'tech@itam.local', password: hashPassword('Tech123!'), role: Role.TECHNICIAN, department: 'Soporte Técnico' },
  })
  const tech2 = await prisma.user.upsert({
    where:  { email: 'tech2@itam.local' },
    update: { password: hashPassword('Tech123!') },
    create: { name: 'Laura Técnica', email: 'tech2@itam.local', password: hashPassword('Tech123!'), role: Role.TECHNICIAN, department: 'Soporte Técnico' },
  })
  const user1 = await prisma.user.upsert({
    where:  { email: 'jperez@itam.local' },
    update: { password: hashPassword('User123!') },
    create: { name: 'Juan Pérez', email: 'jperez@itam.local', password: hashPassword('User123!'), role: Role.USER, department: 'Contabilidad' },
  })
  const user2 = await prisma.user.upsert({
    where:  { email: 'mlopez@itam.local' },
    update: { password: hashPassword('User123!') },
    create: { name: 'María López', email: 'mlopez@itam.local', password: hashPassword('User123!'), role: Role.USER, department: 'Recursos Humanos' },
  })
  const user3 = await prisma.user.upsert({
    where:  { email: 'agomez@itam.local' },
    update: { password: hashPassword('User123!') },
    create: { name: 'Andrés Gómez', email: 'agomez@itam.local', password: hashPassword('User123!'), role: Role.USER, department: 'Ventas' },
  })
  await prisma.user.upsert({
    where:  { email: 'user@itam.local' },
    update: { password: hashPassword('User123!') },
    create: { name: 'Usuario Demo', email: 'user@itam.local', password: hashPassword('User123!'), role: Role.USER, department: 'General' },
  })
  await prisma.user.upsert({
    where:  { email: 'auditor@itam.local' },
    update: { password: hashPassword('Audit123!') },
    create: { name: 'Sandra Auditora', email: 'auditor@itam.local', password: hashPassword('Audit123!'), role: Role.AUDITOR, department: 'Auditoría Interna' },
  })
  console.log('✅  Usuarios (9) creados')

  // ══════════════════════════════════════════════════════
  //  2. UBICACIONES — árbol jerárquico
  // ══════════════════════════════════════════════════════
  const campus = await prisma.location.upsert({
    where: { code: 'CUC-MAIN' }, update: {},
    create: { name: 'Campus Principal CUC', type: LocationType.CAMPUS, code: 'CUC-MAIN', description: 'Sede Barranquilla' },
  })
  const bldA = await prisma.location.upsert({
    where: { code: 'CUC-BLD-A' }, update: {},
    create: { name: 'Edificio A', type: LocationType.BUILDING, code: 'CUC-BLD-A', parentId: campus.id },
  })
  const bldB = await prisma.location.upsert({
    where: { code: 'CUC-BLD-B' }, update: {},
    create: { name: 'Edificio B', type: LocationType.BUILDING, code: 'CUC-BLD-B', parentId: campus.id },
  })
  const floor2A = await prisma.location.upsert({
    where: { code: 'CUC-BLD-A-P2' }, update: {},
    create: { name: 'Piso 2 — Edificio A', type: LocationType.FLOOR, code: 'CUC-BLD-A-P2', parentId: bldA.id },
  })
  const itOffice = await prisma.location.upsert({
    where: { code: 'CUC-BLD-A-P2-IT' }, update: {},
    create: { name: 'Oficina IT', type: LocationType.OFFICE, code: 'CUC-BLD-A-P2-IT', parentId: floor2A.id, description: 'Departamento de Tecnología' },
  })
  const serverRoom = await prisma.location.upsert({
    where: { code: 'CUC-BLD-A-SRV' }, update: {},
    create: { name: 'Sala de Servidores', type: LocationType.SERVER_ROOM, code: 'CUC-BLD-A-SRV', parentId: bldA.id, description: 'Data center principal' },
  })
  const labNets = await prisma.location.upsert({
    where: { code: 'CUC-BLD-B-LAB-NETS' }, update: {},
    create: { name: 'Laboratorio de Redes', type: LocationType.LABORATORY, code: 'CUC-BLD-B-LAB-NETS', parentId: bldB.id, description: 'Lab de redes y telecomunicaciones' },
  })
  const warehouse = await prisma.location.upsert({
    where: { code: 'CUC-WAREHOUSE' }, update: {},
    create: { name: 'Bodega General', type: LocationType.WAREHOUSE, code: 'CUC-WAREHOUSE', parentId: campus.id, description: 'Almacén de activos en reserva y baja' },
  })
  console.log('✅  Ubicaciones (8) creadas')

  // ══════════════════════════════════════════════════════
  //  3. CATEGORÍAS
  // ══════════════════════════════════════════════════════
  const hwCat = await prisma.category.upsert({
    where: { slug: 'hardware' }, update: {},
    create: { name: 'Hardware', slug: 'hardware', description: 'Equipos físicos', color: '#3b82f6', iconName: 'Cpu' },
  })
  const laptopCat = await prisma.category.upsert({
    where: { slug: 'laptops' }, update: {},
    create: { name: 'Laptops', slug: 'laptops', parentId: hwCat.id, color: '#6366f1', iconName: 'Laptop' },
  })
  const serverCat = await prisma.category.upsert({
    where: { slug: 'servers' }, update: {},
    create: { name: 'Servidores', slug: 'servers', parentId: hwCat.id, color: '#f59e0b', iconName: 'Server' },
  })
  const monitorCat = await prisma.category.upsert({
    where: { slug: 'monitors' }, update: {},
    create: { name: 'Monitores', slug: 'monitors', parentId: hwCat.id, color: '#10b981', iconName: 'Monitor' },
  })
  const tabletCat = await prisma.category.upsert({
    where: { slug: 'tablets' }, update: {},
    create: { name: 'Tablets', slug: 'tablets', parentId: hwCat.id, color: '#8b5cf6', iconName: 'Tablet' },
  })
  const netCat = await prisma.category.upsert({
    where: { slug: 'networking' }, update: {},
    create: { name: 'Red y Conectividad', slug: 'networking', description: 'Equipos de red', color: '#0ea5e9', iconName: 'Network' },
  })
  const switchCat = await prisma.category.upsert({
    where: { slug: 'switches' }, update: {},
    create: { name: 'Switches', slug: 'switches', parentId: netCat.id, color: '#0ea5e9' },
  })
  const desktopCat = await prisma.category.upsert({
    where: { slug: 'desktops' }, update: {},
    create: { name: 'Computadores de Escritorio', slug: 'desktops', parentId: hwCat.id, color: '#64748b' },
  })
  console.log('✅  Categorías (8) creadas')

  // ══════════════════════════════════════════════════════
  //  4. ACTIVOS — 10 con estados variados
  // ══════════════════════════════════════════════════════

  // A1 — MacBook ASSIGNED (garantía vigente, historial de asignaciones, traslado aprobado)
  const a1 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-LAP-001' }, update: {},
    create: {
      name: 'MacBook Pro 14" M2', inventoryCode: 'INV-LAP-001', serialNumber: 'C02GM4ABMD6N',
      technicalStatus: TechnicalStatus.OPERATIONAL, usageStatus: UsageStatus.ASSIGNED,
      categoryId: laptopCat.id, locationId: itOffice.id,
      acquisitionDate: ago(540), warrantyExpiry: from(480), acquisitionValue: 8_500_000,
    },
  })
  await prisma.assetSpec.upsert({
    where: { assetId: a1.id }, update: {},
    create: { assetId: a1.id, brand: 'Apple', model: 'MacBook Pro 14"', cpu: 'Apple M2 Pro 12 núcleos', ram: '16 GB LPDDR5', storage: '512 GB SSD NVMe', screenSize: '14.2" Liquid Retina XDR', operatingSystem: 'macOS Sonoma', osVersion: '14.5', osLicense: 'Incluida con hardware', ipAddress: '192.168.1.101', hostname: 'mbp-jperez' },
  })

  // A2 — Dell Latitude AVAILABLE (garantía por vencer en 45 días, historial de asignación)
  const a2 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-LAP-002' }, update: {},
    create: {
      name: 'Dell Latitude 5540', inventoryCode: 'INV-LAP-002', serialNumber: 'DLAT5540-0042',
      technicalStatus: TechnicalStatus.OPERATIONAL, usageStatus: UsageStatus.AVAILABLE,
      categoryId: laptopCat.id, locationId: itOffice.id,
      acquisitionDate: ago(730), warrantyExpiry: from(45), acquisitionValue: 4_200_000,
    },
  })
  await prisma.assetSpec.upsert({
    where: { assetId: a2.id }, update: {},
    create: { assetId: a2.id, brand: 'Dell', model: 'Latitude 5540', cpu: 'Intel Core i7-1365U', ram: '16 GB DDR4', storage: '256 GB SSD', screenSize: '15.6"', operatingSystem: 'Windows 11 Pro', osVersion: '23H2', osLicense: 'OEM Preinstalado', ipAddress: '192.168.1.102', hostname: 'lat-mlopez' },
  })

  // A3 — Servidor Dell UNDER_MAINTENANCE (garantía VENCIDA, mantenimiento activo)
  const a3 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-SRV-001' }, update: {},
    create: {
      name: 'Servidor Dell PowerEdge R740', inventoryCode: 'INV-SRV-001', serialNumber: 'DLPE740-2023-01',
      technicalStatus: TechnicalStatus.UNDER_MAINTENANCE, usageStatus: UsageStatus.UNAVAILABLE,
      categoryId: serverCat.id, locationId: serverRoom.id,
      acquisitionDate: ago(1100), warrantyExpiry: ago(30), acquisitionValue: 35_000_000,
    },
  })
  await prisma.assetSpec.upsert({
    where: { assetId: a3.id }, update: {},
    create: { assetId: a3.id, brand: 'Dell', model: 'PowerEdge R740', cpu: 'Dual Intel Xeon Gold 6226R', ram: '256 GB DDR4 ECC', storage: '8 TB NVMe RAID-10', operatingSystem: 'Ubuntu Server 22.04 LTS', osVersion: '22.04.3', osLicense: 'GPL — Libre', ipAddress: '10.0.0.10', macAddress: '00:1A:2B:3C:4D:5E', hostname: 'srv-prod-01', vlan: 'VLAN-10-PROD' },
  })

  // A4 — HP Server OPERATIONAL (historial mantenimiento, traslado rechazado)
  const a4 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-SRV-002' }, update: {},
    create: {
      name: 'Servidor HP ProLiant DL380', inventoryCode: 'INV-SRV-002', serialNumber: 'HPDL380-2022-02',
      technicalStatus: TechnicalStatus.OPERATIONAL, usageStatus: UsageStatus.AVAILABLE,
      categoryId: serverCat.id, locationId: serverRoom.id,
      acquisitionDate: ago(900), warrantyExpiry: from(365), acquisitionValue: 28_000_000,
    },
  })
  await prisma.assetSpec.upsert({
    where: { assetId: a4.id }, update: {},
    create: { assetId: a4.id, brand: 'HP', model: 'ProLiant DL380 Gen10', cpu: 'Dual Intel Xeon Silver 4210R', ram: '128 GB DDR4 ECC', storage: '4 TB SSD RAID-6', operatingSystem: 'Windows Server 2022', osVersion: '21H2', osLicense: 'Datacenter — 2 núcleos', ipAddress: '10.0.0.11', macAddress: '00:1A:2B:3C:4D:6F', hostname: 'srv-files-01', vlan: 'VLAN-10-PROD' },
  })

  // A5 — Monitor Dell ASSIGNED a técnico
  const a5 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-MON-001' }, update: {},
    create: {
      name: 'Monitor Dell UltraSharp 27"', inventoryCode: 'INV-MON-001', serialNumber: 'DLUS2723-00A',
      technicalStatus: TechnicalStatus.OPERATIONAL, usageStatus: UsageStatus.ASSIGNED,
      categoryId: monitorCat.id, locationId: itOffice.id,
      acquisitionDate: ago(400), warrantyExpiry: from(730), acquisitionValue: 2_100_000,
    },
  })
  await prisma.assetSpec.upsert({
    where: { assetId: a5.id }, update: {},
    create: { assetId: a5.id, brand: 'Dell', model: 'UltraSharp U2723D', screenSize: '27" IPS 4K UHD' },
  })

  // A6 — Monitor LG DAMAGED en bodega
  const a6 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-MON-002' }, update: {},
    create: {
      name: 'Monitor LG 24" (Dañado)', inventoryCode: 'INV-MON-002', serialNumber: 'LG24MK600-003',
      technicalStatus: TechnicalStatus.DAMAGED, usageStatus: UsageStatus.UNAVAILABLE,
      categoryId: monitorCat.id, locationId: warehouse.id,
      acquisitionDate: ago(1500), acquisitionValue: 900_000,
    },
  })
  await prisma.assetSpec.upsert({
    where: { assetId: a6.id }, update: {},
    create: { assetId: a6.id, brand: 'LG', model: '24MK600M-B', screenSize: '24" IPS FHD' },
  })

  // A7 — iPad Pro ON_LOAN a Andrés
  const a7 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-TAB-001' }, update: {},
    create: {
      name: 'iPad Pro 12.9" M2', inventoryCode: 'INV-TAB-001', serialNumber: 'IPAD-PRO-M2-007',
      technicalStatus: TechnicalStatus.OPERATIONAL, usageStatus: UsageStatus.ON_LOAN,
      categoryId: tabletCat.id, locationId: labNets.id,
      acquisitionDate: ago(300), warrantyExpiry: from(800), acquisitionValue: 5_500_000,
    },
  })

  // A8 — Switch Cisco UNDER_REPAIR (mantenimiento programado)
  const a8 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-NET-001' }, update: {},
    create: {
      name: 'Switch Cisco Catalyst 2960-X', inventoryCode: 'INV-NET-001', serialNumber: 'FOC2345X001A',
      technicalStatus: TechnicalStatus.UNDER_REPAIR, usageStatus: UsageStatus.UNAVAILABLE,
      categoryId: switchCat.id, locationId: labNets.id,
      acquisitionDate: ago(1800), acquisitionValue: 7_500_000,
    },
  })
  await prisma.assetSpec.upsert({
    where: { assetId: a8.id }, update: {},
    create: { assetId: a8.id, brand: 'Cisco', model: 'Catalyst 2960X-48FPD-L', vlan: 'Trunk All' },
  })

  // A9 — PC de escritorio DECOMMISSIONED en bodega
  const a9 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-PC-001' }, update: {},
    create: {
      name: 'PC HP Compaq Elite (De Baja)', inventoryCode: 'INV-PC-001', serialNumber: 'HPELITE-2018-001',
      technicalStatus: TechnicalStatus.DECOMMISSIONED, usageStatus: UsageStatus.UNAVAILABLE,
      categoryId: desktopCat.id, locationId: warehouse.id,
      acquisitionDate: ago(2500), acquisitionValue: 1_800_000,
    },
  })
  await prisma.assetSpec.upsert({
    where: { assetId: a9.id }, update: {},
    create: { assetId: a9.id, brand: 'HP', model: 'Compaq Elite 8300', cpu: 'Intel Core i5-3470', ram: '8 GB DDR3', storage: '500 GB HDD', operatingSystem: 'Windows 10 Pro', osVersion: '21H2', osLicense: 'OEM' },
  })

  // A10 — ThinkPad AVAILABLE recién ingresado
  const a10 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-LAP-003' }, update: {},
    create: {
      name: 'Lenovo ThinkPad X1 Carbon Gen 12', inventoryCode: 'INV-LAP-003', serialNumber: 'LVTPX1-2024-003',
      technicalStatus: TechnicalStatus.OPERATIONAL, usageStatus: UsageStatus.AVAILABLE,
      categoryId: laptopCat.id, locationId: itOffice.id,
      acquisitionDate: ago(60), warrantyExpiry: from(1095), acquisitionValue: 6_800_000,
    },
  })
  await prisma.assetSpec.upsert({
    where: { assetId: a10.id }, update: {},
    create: { assetId: a10.id, brand: 'Lenovo', model: 'ThinkPad X1 Carbon Gen 12', cpu: 'Intel Core Ultra 7 165U', ram: '32 GB LPDDR5', storage: '1 TB SSD NVMe', operatingSystem: 'Windows 11 Pro', osVersion: '24H2', osLicense: 'OEM Preinstalado', hostname: 'tpx1-new-003' },
  })

  console.log('✅  Activos (10) creados')

  // ══════════════════════════════════════════════════════
  //  5. ASIGNACIONES — historial + activas
  // ══════════════════════════════════════════════════════

  // A1: historial María → activa Juan
  if (!await prisma.assetAssignment.findFirst({ where: { assetId: a1.id, userId: user2.id } })) {
    await prisma.assetAssignment.create({
      data: { assetId: a1.id, userId: user2.id, createdById: admin.id, startDate: ago(200), endDate: ago(90), reason: 'Proyecto Q1 — cobertura temporal', notes: 'Devuelto en buen estado.' },
    })
  }
  if (!await prisma.assetAssignment.findFirst({ where: { assetId: a1.id, endDate: null } })) {
    await prisma.assetAssignment.create({
      data: { assetId: a1.id, userId: user1.id, createdById: admin.id, startDate: ago(88), reason: 'Equipo principal de trabajo', notes: 'Responsable del mantenimiento preventivo.' },
    })
  }

  // A2: historial Andrés (devuelto)
  if (!await prisma.assetAssignment.findFirst({ where: { assetId: a2.id } })) {
    await prisma.assetAssignment.create({
      data: { assetId: a2.id, userId: user3.id, createdById: admin.id, startDate: ago(400), endDate: ago(60), reason: 'Representante comercial zona norte' },
    })
  }

  // A5: Monitor → Carlos Técnico (activa)
  if (!await prisma.assetAssignment.findFirst({ where: { assetId: a5.id, endDate: null } })) {
    await prisma.assetAssignment.create({
      data: { assetId: a5.id, userId: tech.id, createdById: admin.id, startDate: ago(380), reason: 'Monitor de estación de trabajo IT' },
    })
  }

  // A7: iPad → Andrés en préstamo
  if (!await prisma.assetAssignment.findFirst({ where: { assetId: a7.id, endDate: null } })) {
    await prisma.assetAssignment.create({
      data: { assetId: a7.id, userId: user3.id, createdById: admin.id, startDate: ago(15), reason: 'Préstamo visitas comerciales', notes: 'Plazo de devolución: 30 días a partir del 2026-05-07.' },
    })
  }

  // A9: PC → María (histórico, antes de la baja)
  if (!await prisma.assetAssignment.findFirst({ where: { assetId: a9.id } })) {
    await prisma.assetAssignment.create({
      data: { assetId: a9.id, userId: user2.id, createdById: admin.id, startDate: ago(2000), endDate: ago(500), reason: 'Estación de trabajo RRHH', notes: 'Dado de baja por obsolescencia tecnológica.' },
    })
  }

  console.log('✅  Asignaciones creadas')

  // ══════════════════════════════════════════════════════
  //  6. MANTENIMIENTOS
  // ══════════════════════════════════════════════════════

  // A1 — preventivo completado
  if (!await prisma.maintenance.findFirst({ where: { assetId: a1.id } })) {
    await prisma.maintenance.create({
      data: { assetId: a1.id, type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.COMPLETED, description: 'Limpieza interna, actualización de macOS y revisión de batería', provider: 'Apple Authorized Service', cost: 150_000, scheduledAt: ago(180), completedAt: ago(178), handledById: tech.id },
    })
  }

  // A3 — histórico + activo IN_PROGRESS
  if (!await prisma.maintenance.findFirst({ where: { assetId: a3.id } })) {
    await prisma.maintenance.create({
      data: { assetId: a3.id, type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.COMPLETED, description: 'Mantenimiento preventivo anual — limpieza y actualización de firmware', provider: 'Dell Technologies Colombia', cost: 2_800_000, scheduledAt: ago(365), completedAt: ago(363), handledById: tech.id },
    })
    await prisma.maintenance.create({
      data: { assetId: a3.id, type: MaintenanceType.CORRECTIVE, status: MaintenanceStatus.IN_PROGRESS, description: 'Reemplazo de fuente de poder fallida y diagnóstico de controladora RAID', provider: 'Dell Technologies Colombia', cost: 4_500_000, scheduledAt: ago(3), handledById: tech2.id },
    })
  }

  // A4 — varios: completado + cancelado + actualización
  if (!await prisma.maintenance.findFirst({ where: { assetId: a4.id } })) {
    await prisma.maintenance.createMany({
      data: [
        { assetId: a4.id, type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.COMPLETED, description: 'Mantenimiento preventivo semestral — limpieza y verificación de discos', provider: 'HP Service Center', cost: 1_800_000, scheduledAt: ago(200), completedAt: ago(198), handledById: tech.id },
        { assetId: a4.id, type: MaintenanceType.CALIBRATION, status: MaintenanceStatus.CANCELLED, description: 'Calibración de sensores de temperatura (cancelado por el proveedor)', scheduledAt: ago(90), handledById: tech.id },
        { assetId: a4.id, type: MaintenanceType.UPDATE, status: MaintenanceStatus.COMPLETED, description: 'Actualización de firmware BIOS y drivers de red a versión 2.14', cost: 0, scheduledAt: ago(45), completedAt: ago(44), handledById: tech2.id },
      ],
    })
  }

  // A8 — correctivo SCHEDULED (para la próxima semana)
  if (!await prisma.maintenance.findFirst({ where: { assetId: a8.id } })) {
    await prisma.maintenance.create({
      data: { assetId: a8.id, type: MaintenanceType.CORRECTIVE, status: MaintenanceStatus.SCHEDULED, description: 'Reemplazo de módulo SFP dañado y revisión de puertos PoE', provider: 'Cisco Partner Colombia', cost: 3_200_000, scheduledAt: from(7), handledById: tech2.id },
    })
  }

  // A9 — limpieza antes de baja
  if (!await prisma.maintenance.findFirst({ where: { assetId: a9.id } })) {
    await prisma.maintenance.create({
      data: { assetId: a9.id, type: MaintenanceType.CLEANING, status: MaintenanceStatus.COMPLETED, description: 'Limpieza física y borrado seguro de datos antes de dar de baja (NIST 800-88)', cost: 80_000, scheduledAt: ago(510), completedAt: ago(508), handledById: tech.id },
    })
  }

  console.log('✅  Mantenimientos creados')

  // ══════════════════════════════════════════════════════
  //  7. SOLICITUDES DE MOVIMIENTO
  // ══════════════════════════════════════════════════════

  // A1 — APPROVED (usuario solicitó traslado a Lab Redes, aprobado)
  if (!await prisma.movementRequest.findFirst({ where: { assetId: a1.id, status: 'APPROVED' } })) {
    await prisma.movementRequest.create({
      data: { assetId: a1.id, reason: 'Cambio de departamento del usuario responsable (Contabilidad → Laboratorio)', destinationId: labNets.id, requestedById: user1.id, approvedById: admin.id, status: 'APPROVED' },
    })
  }

  // A2 — PENDING (solicitud de traslado a Lab Redes, en espera de aprobación)
  if (!await prisma.movementRequest.findFirst({ where: { assetId: a2.id, status: 'PENDING' } })) {
    await prisma.movementRequest.create({
      data: { assetId: a2.id, reason: 'Reasignación al laboratorio de redes para prácticas estudiantiles del semestre', destinationId: labNets.id, requestedById: user1.id, status: 'PENDING' },
    })
  }

  // A3 — PENDING (traslado temporal durante el mantenimiento)
  if (!await prisma.movementRequest.findFirst({ where: { assetId: a3.id, status: 'PENDING' } })) {
    await prisma.movementRequest.create({
      data: { assetId: a3.id, reason: 'Traslado temporal a bodega mientras dura el mantenimiento correctivo', destinationId: warehouse.id, requestedById: tech.id, status: 'PENDING' },
    })
  }

  // A4 — REJECTED (traslado rechazado)
  if (!await prisma.movementRequest.findFirst({ where: { assetId: a4.id } })) {
    await prisma.movementRequest.create({
      data: { assetId: a4.id, reason: 'Traslado al laboratorio para pruebas de carga y estrés de red', destinationId: labNets.id, requestedById: tech2.id, approvedById: admin.id, status: 'REJECTED' },
    })
  }

  console.log('✅  Solicitudes de movimiento creadas')

  // ══════════════════════════════════════════════════════
  //  8. BITÁCORA DE EVENTOS (EventLog)
  // ══════════════════════════════════════════════════════

  type LogEntry = { assetId: number; type: EventType; description: string; userId: number; daysBack: number }

  const logs: LogEntry[] = [
    // A1 — MacBook: ciclo de vida completo
    { assetId: a1.id, type: EventType.CREATED,          description: 'Activo MacBook Pro 14" M2 registrado en el sistema ITAM.',    userId: admin.id,      daysBack: 540 },
    { assetId: a1.id, type: EventType.ASSIGNED,          description: 'Asignado a María López — proyecto Q1 cobertura temporal.',   userId: admin.id,      daysBack: 200 },
    { assetId: a1.id, type: EventType.MAINTENANCE,       description: 'Mantenimiento preventivo completado por Apple Authorized Service.', userId: tech.id, daysBack: 178 },
    { assetId: a1.id, type: EventType.UNASSIGNED,        description: 'Asignación de María López finalizada. Activo disponible.',   userId: admin.id,      daysBack: 90  },
    { assetId: a1.id, type: EventType.ASSIGNED,          description: 'Asignado a Juan Pérez — equipo principal de trabajo.',       userId: admin.id,      daysBack: 88  },
    { assetId: a1.id, type: EventType.LOCATION_CHANGED,  description: 'Traslado aprobado: Oficina IT → Laboratorio de Redes.',      userId: admin.id,      daysBack: 10  },
    { assetId: a1.id, type: EventType.UPDATED,           description: 'Especificaciones actualizadas — SO actualizado a macOS Sonoma 14.5.', userId: tech.id, daysBack: 5 },

    // A2 — Latitude
    { assetId: a2.id, type: EventType.CREATED,           description: 'Dell Latitude 5540 registrado en inventario.',               userId: admin.id,      daysBack: 730 },
    { assetId: a2.id, type: EventType.ASSIGNED,          description: 'Asignado a Andrés Gómez — representante zona norte.',        userId: admin.id,      daysBack: 400 },
    { assetId: a2.id, type: EventType.UNASSIGNED,        description: 'Andrés Gómez devolvió el activo. Disponible para asignación.', userId: admin.id,    daysBack: 60  },

    // A3 — Servidor Dell: mantenimiento activo
    { assetId: a3.id, type: EventType.CREATED,           description: 'Servidor Dell PowerEdge R740 ingresado al inventario.',      userId: admin.id,      daysBack: 1100 },
    { assetId: a3.id, type: EventType.MAINTENANCE,       description: 'Mantenimiento preventivo anual completado — firmware actualizado.', userId: tech.id, daysBack: 363 },
    { assetId: a3.id, type: EventType.STATUS_CHANGED,    description: 'Estado cambiado a EN MANTENIMIENTO — falla detectada en fuente de poder.', userId: tech2.id, daysBack: 3 },
    { assetId: a3.id, type: EventType.MAINTENANCE,       description: 'Inicio de mantenimiento correctivo — reemplazo de PSU por Dell Colombia.', userId: tech2.id, daysBack: 3 },

    // A4 — HP Server
    { assetId: a4.id, type: EventType.CREATED,           description: 'Servidor HP ProLiant DL380 registrado en el sistema.',       userId: admin.id,      daysBack: 900 },
    { assetId: a4.id, type: EventType.MAINTENANCE,       description: 'Mantenimiento preventivo semestral completado — HP Service.', userId: tech.id,      daysBack: 198 },
    { assetId: a4.id, type: EventType.MAINTENANCE,       description: 'Actualización de firmware BIOS v2.14 y drivers de red completada.', userId: tech2.id, daysBack: 44 },
    { assetId: a4.id, type: EventType.STATUS_CHANGED,    description: 'Solicitud de traslado al laboratorio rechazada por administrador.', userId: admin.id, daysBack: 5 },

    // A5 — Monitor
    { assetId: a5.id, type: EventType.CREATED,           description: 'Monitor Dell UltraSharp U2723D registrado en inventario.',   userId: admin.id,      daysBack: 400 },
    { assetId: a5.id, type: EventType.ASSIGNED,          description: 'Asignado a Carlos Técnico — estación de trabajo IT.',        userId: admin.id,      daysBack: 380 },

    // A6 — Monitor dañado
    { assetId: a6.id, type: EventType.CREATED,           description: 'Monitor LG 24MK600M-B registrado en inventario.',            userId: admin.id,      daysBack: 1500 },
    { assetId: a6.id, type: EventType.STATUS_CHANGED,    description: 'Estado cambiado a DAÑADO — pantalla con líneas horizontales persistentes.', userId: tech.id, daysBack: 120 },
    { assetId: a6.id, type: EventType.LOCATION_CHANGED,  description: 'Trasladado a Bodega General para evaluación de baja.',       userId: admin.id,      daysBack: 115 },

    // A7 — iPad en préstamo
    { assetId: a7.id, type: EventType.CREATED,           description: 'iPad Pro 12.9" M2 registrado en inventario.',                userId: admin.id,      daysBack: 300 },
    { assetId: a7.id, type: EventType.LOANED,            description: 'iPad en préstamo a Andrés Gómez — visitas comerciales 30 días.', userId: admin.id, daysBack: 15 },

    // A8 — Switch en reparación
    { assetId: a8.id, type: EventType.CREATED,           description: 'Switch Cisco Catalyst 2960X-48FPD-L registrado en inventario.', userId: admin.id, daysBack: 1800 },
    { assetId: a8.id, type: EventType.STATUS_CHANGED,    description: 'Módulo SFP slot 48 fallido. Estado cambiado a EN REPARACIÓN.', userId: tech2.id, daysBack: 8 },
    { assetId: a8.id, type: EventType.MAINTENANCE,       description: 'Mantenimiento correctivo programado con Cisco Partner Colombia para 7 días.', userId: tech2.id, daysBack: 7 },

    // A9 — PC dado de baja
    { assetId: a9.id, type: EventType.CREATED,           description: 'PC HP Compaq Elite 8300 registrado en inventario.',          userId: admin.id,      daysBack: 2500 },
    { assetId: a9.id, type: EventType.ASSIGNED,          description: 'Asignado a María López — estación de trabajo RRHH.',         userId: admin.id,      daysBack: 2000 },
    { assetId: a9.id, type: EventType.UNASSIGNED,        description: 'María López devolvió el activo al finalizar contrato.',       userId: admin.id,      daysBack: 500 },
    { assetId: a9.id, type: EventType.MAINTENANCE,       description: 'Borrado seguro de datos (NIST 800-88) completado antes de baja.', userId: tech.id, daysBack: 508 },
    { assetId: a9.id, type: EventType.DECOMMISSIONED,    description: 'Activo dado de baja definitiva por obsolescencia tecnológica. Aprobado por Director IT.', userId: superAdmin.id, daysBack: 490 },

    // A10 — ThinkPad nuevo
    { assetId: a10.id, type: EventType.CREATED,          description: 'Lenovo ThinkPad X1 Carbon Gen 12 ingresado al inventario.',  userId: admin.id,      daysBack: 60 },
  ]

  for (const l of logs) {
    const exists = await prisma.eventLog.findFirst({
      where: { assetId: l.assetId, type: l.type, description: { contains: l.description.slice(0, 40) } },
    })
    if (!exists) {
      await prisma.eventLog.create({
        data: { type: l.type, description: l.description, assetId: l.assetId, userId: l.userId, occurredAt: ago(l.daysBack) },
      })
    }
  }

  console.log('✅  Bitácora de eventos creada')

  // ══════════════════════════════════════════════════════
  //  RESUMEN
  // ══════════════════════════════════════════════════════
  console.log('\n🎉  Seed completado exitosamente!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  CUENTAS DISPONIBLES')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  superadmin@itam.local  / Admin123!  → Super Admin')
  console.log('  admin@itam.local       / Admin123!  → Admin')
  console.log('  tech@itam.local        / Tech123!   → Técnico')
  console.log('  tech2@itam.local       / Tech123!   → Técnica')
  console.log('  jperez@itam.local      / User123!   → Usuario (Contabilidad)')
  console.log('  mlopez@itam.local      / User123!   → Usuaria (RRHH)')
  console.log('  agomez@itam.local      / User123!   → Usuario (Ventas)')
  console.log('  user@itam.local        / User123!   → Usuario (General)')
  console.log('  auditor@itam.local     / Audit123!  → Auditor')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n  DATOS GENERADOS:')
  console.log('  • 10 activos con estados técnicos variados')
  console.log('  • Garantías: vigente / por vencer (45d) / VENCIDA')
  console.log('  • 5 asignaciones (2 activas + 3 históricas)')
  console.log('  • 8 registros de mantenimiento (completado/activo/programado/cancelado)')
  console.log('  • 4 solicitudes de movimiento (PENDING ×2 / APPROVED / REJECTED)')
  console.log('  • 37 eventos en bitácora\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
