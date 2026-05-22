import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const eventTypeES: Record<string, string> = {
  CREATED:          'CREACION',
  UPDATED:          'ACTUALIZACION',
  STATUS_CHANGED:   'CAMBIO_ESTADO',
  ASSIGNED:         'ASIGNACION',
  UNASSIGNED:       'DESASIGNACION',
  MAINTENANCE:      'MANTENIMIENTO',
  CATEGORY_CHANGED: 'CAMBIO_CATEGORIA',
  LOCATION_CHANGED: 'CAMBIO_UBICACION',
  DECOMMISSIONED:   'DESBILITADO',
  REACTIVATED:      'REACTIVADO',
  LOANED:           'PRESTAMO',
  RETURNED:         'DEVOLUCION',
}

export async function GET() {
  try {
    const [
      techStats,
      usageStats,
      recentLogs,
    ] = await Promise.all([
      prisma.asset.groupBy({ by: ['technicalStatus'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.asset.groupBy({ by: ['usageStatus'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.eventLog.findMany({
        take: 10,
        orderBy: { occurredAt: 'desc' },
        include: {
          asset: { select: { id: true, name: true, inventoryCode: true } },
          user:  { select: { id: true, name: true, role: true } },
        },
      }),
    ])

    // Convert groupBy results to mapped dictionaries
    const techCount = (status: string) => techStats.find(s => s.technicalStatus === status)?._count._all || 0;
    const usageCount = (status: string) => usageStats.find(s => s.usageStatus === status)?._count._all || 0;

    const totalAssets = techStats.reduce((sum, s) => sum + s._count._all, 0);
    const operativo = techCount('OPERATIONAL');
    const enMantenimiento = techCount('UNDER_MAINTENANCE');
    const enReparacion = techCount('UNDER_REPAIR');
    const danado = techCount('DAMAGED');
    const fueraDeServicio = techCount('OUT_OF_SERVICE');
    const deBaja = techCount('DECOMMISSIONED');
    const enTransito = techCount('IN_TRANSIT');

    const disponible = usageCount('AVAILABLE');
    const asignado = usageCount('ASSIGNED');
    const reservado = usageCount('RESERVED');
    const noDisponible = usageCount('UNAVAILABLE');
    const prestado = usageCount('ON_LOAN');

    const mappedLogs = recentLogs.map((log: any) => ({
      ...log,
      tipo: eventTypeES[log.type] ?? log.type,
      descripcion: log.description,
      fecha: log.occurredAt,
      asset: log.asset
        ? { ...log.asset, nombre: log.asset.name, codigoInventario: log.asset.inventoryCode }
        : null,
    }))

    return NextResponse.json({
      totalAssets,
      operativo,
      enMantenimiento,
      enReparacion,
      danado,
      fueraDeServicio,
      deBaja,
      enTransito,
      disponible,
      asignado,
      reservado,
      noDisponible,
      prestado,
      inMaintenance: enMantenimiento + enReparacion,
      damaged: danado + fueraDeServicio + deBaja,
      byTechnicalState: {
        OPERATIVO: operativo,
        EN_MANTENIMIENTO: enMantenimiento,
        EN_REPARACION: enReparacion,
        DANADO: danado,
        FUERA_DE_SERVICIO: fueraDeServicio,
        DE_BAJA: deBaja,
        EN_TRANSITO: enTransito,
      },
      byUsageState: {
        DISPONIBLE: disponible,
        ASIGNADO: asignado,
        RESERVADO: reservado,
        NO_DISPONIBLE: noDisponible,
        PRESTADO: prestado,
      },
      recentLogs: mappedLogs,
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
