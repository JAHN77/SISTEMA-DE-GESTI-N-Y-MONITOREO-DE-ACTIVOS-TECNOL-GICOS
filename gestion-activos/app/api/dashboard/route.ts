import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { EstadoTecnico, EstadoUso } from '@prisma/client'

export async function GET() {
  try {
    const [
      totalAssets,
      operative,
      enMantenimiento,
      enReparacion,
      danado,
      fueraDeServicio,
      deBaja,
      disponible,
      asignado,
      reservado,
      noDisponible,
      recentLogs,
    ] = await Promise.all([
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.asset.count({ where: { deletedAt: null, estadoTecnico: 'OPERATIVO' } }),
      prisma.asset.count({ where: { deletedAt: null, estadoTecnico: 'EN_MANTENIMIENTO' } }),
      prisma.asset.count({ where: { deletedAt: null, estadoTecnico: 'EN_REPARACION' } }),
      prisma.asset.count({ where: { deletedAt: null, estadoTecnico: 'DANADO' } }),
      prisma.asset.count({ where: { deletedAt: null, estadoTecnico: 'FUERA_DE_SERVICIO' } }),
      prisma.asset.count({ where: { deletedAt: null, estadoTecnico: 'DE_BAJA' } }),
      prisma.asset.count({ where: { deletedAt: null, estadoUso: 'DISPONIBLE' } }),
      prisma.asset.count({ where: { deletedAt: null, estadoUso: 'ASIGNADO' } }),
      prisma.asset.count({ where: { deletedAt: null, estadoUso: 'RESERVADO' } }),
      prisma.asset.count({ where: { deletedAt: null, estadoUso: 'NO_DISPONIBLE' } }),
      prisma.eventLog.findMany({
        take: 10,
        orderBy: { fecha: 'desc' },
        include: {
          asset: { select: { id: true, nombre: true, codigoInventario: true } },
          user:  { select: { id: true, name: true, role: true } },
        },
      }),
    ])

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
      recentLogs,
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
