import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/movements/:id — approve or reject
// Only ADMIN can do this (validated client-side by role; add server auth later)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params

  try {
    const { action, approvedById } = await req.json()

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'action debe ser APPROVED o REJECTED' }, { status: 400 })
    }

    const movement = await prisma.movementRequest.findUnique({
      where: { id: parseInt(id) },
      include: { asset: true, nuevaLocation: true },
    })
    if (!movement) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    if (movement.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo se pueden procesar solicitudes PENDING' }, { status: 409 })
    }

    // Update the movement request
    const updated = await prisma.movementRequest.update({
      where: { id: parseInt(id) },
      data: {
        status:      action,
        approvedById: approvedById ? parseInt(approvedById) : null,
      },
    })

    // If APPROVED: update asset location + log CAMBIO_UBICACION
    if (action === 'APPROVED' && movement.nuevaLocationId) {
      await prisma.asset.update({
        where: { id: movement.assetId },
        data:  { locationId: movement.nuevaLocationId },
      })

      await prisma.eventLog.create({
        data: {
          tipo: 'CAMBIO_UBICACION',
          descripcion: `Activo trasladado a "${movement.nuevaLocation?.nombre ?? '—'}". Solicitud aprobada.`,
          assetId: movement.assetId,
          userId:  approvedById ? parseInt(approvedById) : null,
        },
      })
    } else if (action === 'REJECTED') {
      await prisma.eventLog.create({
        data: {
          tipo: 'CAMBIO_ESTADO',
          descripcion: `Solicitud de movimiento rechazada.`,
          assetId: movement.assetId,
          userId:  approvedById ? parseInt(approvedById) : null,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/movements/:id]', error)
    return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 })
  }
}
