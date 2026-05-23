import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, getUserFromRequest } from '@/lib/auth'
import { notifyAllAdmins } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })
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
  const auth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'USER', 'AUDITOR'])
  if (auth instanceof Response) return auth
  const { user: actor } = auth

  try {
    const { assetId, motivo, nuevaLocationId } = await req.json()

    if (!assetId || !motivo || !nuevaLocationId) {
      return NextResponse.json({ error: 'assetId, motivo y nuevaLocationId son requeridos' }, { status: 400 })
    }

    const movement = await prisma.movementRequest.create({
      data: {
        assetId: parseInt(assetId),
        reason: motivo,
        destinationId: parseInt(nuevaLocationId),
        requestedById: actor.id,
      },
      include: {
        asset: { include: { location: true } },
        requestedBy: true,
        destination: true,
      },
    })

    // Missing EventLog for movement creation
    await prisma.eventLog.create({
      data: {
        type: 'STATUS_CHANGED',
        description: `Solicitud de movimiento creada hacia "${movement.destination?.name ?? '—'}".`,
        assetId: movement.assetId,
        userId: actor.id,
      },
    })

    // Notify all admins of the pending request
    await notifyAllAdmins({
      type: 'WARRANTY_EXPIRING',
      title: 'Solicitud de movimiento pendiente',
      message: `${actor.name} solicita mover "${movement.asset?.name ?? `#${movement.assetId}`}" a ${movement.destination?.name ?? '—'}.`,
      url: '/movements',
      referenceId: movement.id,
      referenceType: 'MovementRequest',
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
