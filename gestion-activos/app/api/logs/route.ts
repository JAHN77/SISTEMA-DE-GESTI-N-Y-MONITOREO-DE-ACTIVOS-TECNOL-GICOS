import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DB EventType → Spanish EventType (matches frontend types/domain.ts)
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

// Spanish EventType → DB EventType (for filter)
const eventTypeDB: Record<string, string> = Object.fromEntries(
  Object.entries(eventTypeES).map(([db, es]) => [es, db])
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const assetId  = searchParams.get('assetId')
    const tipoES   = searchParams.get('tipo')
    const tipoDB   = tipoES ? eventTypeDB[tipoES] : null

    const logs = await prisma.eventLog.findMany({
      where: {
        ...(assetId && { assetId: parseInt(assetId) }),
        ...(tipoDB  && { type: tipoDB as any }),
      },
      include: {
        asset: { select: { id: true, name: true, inventoryCode: true } },
        user:  { select: { id: true, name: true, role: true } },
      },
      orderBy: { occurredAt: 'desc' },
      take: 200,
    })

    const mappedLogs = logs.map(l => ({
      ...l,
      tipo: eventTypeES[l.type] ?? l.type,
      descripcion: l.description,
      fecha: l.occurredAt,
      asset: l.asset
        ? { ...l.asset, nombre: l.asset.name, codigoInventario: l.asset.inventoryCode }
        : null,
    }))

    return NextResponse.json(mappedLogs)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener logs' }, { status: 500 })
  }
}
