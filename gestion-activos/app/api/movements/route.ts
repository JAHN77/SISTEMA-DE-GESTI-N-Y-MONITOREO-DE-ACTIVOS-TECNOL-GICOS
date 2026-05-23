import { NextRequest, NextResponse } from 'next/server'
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
      nuevaLocation: m.destination
        ? { ...m.destination, nombre: m.destination.name }
        : null,
      asset: m.asset
        ? {
            ...m.asset,
            nombre: m.asset.name,
            codigoInventario: m.asset.inventoryCode,
            location: m.asset.location
              ? { ...m.asset.location, nombre: m.asset.location.name }
              : null,
          }
        : null,
    }))
    return NextResponse.json(mappedMovements)
  } catch (error) {
    console.error('[GET /api/movements]', error)
    return NextResponse.json({ error: 'Error al obtener solicitudes de movimiento' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { assetId, motivo, nuevaLocationId, solicitadoPorId } = await req.json()

    if (!assetId || !motivo || !nuevaLocationId || !solicitadoPorId) {
      return NextResponse.json({ error: 'assetId, motivo, nuevaLocationId y solicitadoPorId son requeridos' }, { status: 400 })
    }

    const movement = await prisma.movementRequest.create({
      data: {
        assetId: parseInt(assetId),
        reason: motivo,
        destinationId: parseInt(nuevaLocationId),
        requestedById: parseInt(solicitadoPorId),
      },
      include: {
        asset: { include: { location: true } },
        requestedBy: true,
        destination: true,
      },
    })

    const mappedMovement = {
      ...movement,
      motivo: movement.reason,
      nuevaLocationId: movement.destinationId,
      nuevaLocation: movement.destination,
      asset: movement.asset ? { ...movement.asset, nombre: movement.asset.name, codigoInventario: movement.asset.inventoryCode } : null,
    }

    return NextResponse.json(mappedMovement, { status: 201 })
  } catch (error) {
    console.error('[POST /api/movements]', error)
    return NextResponse.json({ error: 'Error al crear solicitud de movimiento' }, { status: 500 })
  }
}
