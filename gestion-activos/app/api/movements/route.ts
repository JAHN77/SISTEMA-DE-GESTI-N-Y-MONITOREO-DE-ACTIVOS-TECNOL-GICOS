import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const movements = await prisma.movementRequest.findMany({
      include: {
        asset:        { include: { location: true } },
        requestedBy:  { select: { id: true, name: true, role: true } },
        approvedBy:   { select: { id: true, name: true, role: true } },
        destination:  true,
      },
      orderBy: { createdAt: 'desc' },
    })
    const mappedMovements = movements.map(m => ({
      ...m,
      motivo: m.reason,
      nuevaLocationId: m.destinationId,
      nuevaLocation: m.destination,
      asset: m.asset ? { ...m.asset, nombre: m.asset.name, codigoInventario: m.asset.inventoryCode, location: m.asset.location ? { ...m.asset.location, nombre: m.asset.location.name } : null } : null
    }));
    return NextResponse.json(mappedMovements)
  } catch (error) {
    console.error('[GET /api/movements all]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
