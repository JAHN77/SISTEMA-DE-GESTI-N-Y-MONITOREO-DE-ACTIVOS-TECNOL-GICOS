import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DB MaintenanceType → Spanish (matches frontend MAINTENANCE_TYPE_LABELS keys)
const maintTypeES: Record<string, string> = {
  PREVENTIVE:  'PREVENTIVO',
  CORRECTIVE:  'CORRECTIVO',
  CALIBRATION: 'CALIBRACION',
  UPDATE:      'ACTUALIZACION',
  CLEANING:    'LIMPIEZA',
}

// DB MaintenanceStatus → Spanish
const maintStatusES: Record<string, string> = {
  SCHEDULED:   'PROGRAMADO',
  IN_PROGRESS: 'EN_PROGRESO',
  COMPLETED:   'COMPLETADO',
  CANCELLED:   'CANCELADO',
}

export async function GET() {
  try {
    const records = await prisma.maintenance.findMany({
      include: {
        asset:     { select: { id: true, name: true, inventoryCode: true } },
        handledBy: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    const mapped = records.map(r => ({
      ...r,
      tipo:        maintTypeES[r.type] ?? r.type,
      descripcion: r.description,
      fechaInicio: r.scheduledAt,
      fechaFin:    r.completedAt,
      realizadoPor: r.handledBy,
      proveedor:   r.provider,
      costo:       r.cost?.toString() ?? null,
      asset: r.asset
        ? { ...r.asset, nombre: r.asset.name, codigoInventario: r.asset.inventoryCode }
        : null,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener mantenimientos' }, { status: 500 })
  }
}
