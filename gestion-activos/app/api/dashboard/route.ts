import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const operative = techCount('OPERATIONAL');
    const enMantenimiento = techCount('UNDER_MAINTENANCE');
    const enReparacion = techCount('UNDER_REPAIR');
    const danado = techCount('DAMAGED');
    const fueraDeServicio = techCount('OUT_OF_SERVICE');
    const deBaja = techCount('DECOMMISSIONED');

    const disponible = usageCount('AVAILABLE');
    const asignado = usageCount('ASSIGNED');
    const reservado = usageCount('RESERVED');
    const noDisponible = usageCount('UNAVAILABLE');

    // Map new logs to old format expected by frontend
    const mappedLogs = recentLogs.map((log: any) => ({
      ...log,
      tipo: log.type,
      descripcion: log.description,
      fecha: log.occurredAt,
      asset: log.asset ? { ...log.asset, nombre: log.asset.name, codigoInventario: log.asset.inventoryCode } : null
    }));

    return NextResponse.json({
      totalAssets,
      operative,
      inMaintenance: enMantenimiento + enReparacion,
      damaged: danado + fueraDeServicio + deBaja,
      byTechnicalState: {
        OPERATIVO: operative,
        EN_MANTENIMIENTO: enMantenimiento,
        EN_REPARACION: enReparacion,
        DANADO: danado,
        FUERA_DE_SERVICIO: fueraDeServicio,
        DE_BAJA: deBaja,
      },
      byUsageState: {
        DISPONIBLE: disponible,
        ASIGNADO: asignado,
        RESERVADO: reservado,
        NO_DISPONIBLE: noDisponible,
      },
      recentLogs: mappedLogs,
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
