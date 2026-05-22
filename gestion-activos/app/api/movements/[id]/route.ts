import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const { accion, aprobadoPorId } = await req.json();

    const action = accion === 'APROBADO' ? 'APPROVED' : accion === 'RECHAZADO' ? 'REJECTED' : null;
    
    if (!action) {
      return NextResponse.json({ error: 'accion debe ser APROBADO o RECHAZADO' }, { status: 400 });
    }

    const movement = await prisma.movementRequest.findUnique({
      where: { id: parseInt(id) },
      include: { asset: true, destination: true },
    });
    if (!movement) return NextResponse.json({ error: 'Solicitud de movimiento no encontrada' }, { status: 404 });
    if (movement.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo las solicitudes PENDIENTES pueden ser procesadas' }, { status: 409 });
    }

    const updated = await prisma.movementRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: action,
        approvedById: aprobadoPorId ? parseInt(aprobadoPorId) : null,
      },
    });

    if (action === 'APPROVED' && movement.destinationId) {
      await prisma.asset.update({
        where: { id: movement.assetId },
        data: { locationId: movement.destinationId },
      });

      await prisma.eventLog.create({
        data: {
          type: 'LOCATION_CHANGED',
          description: `Activo reubicado a "${movement.destination?.name ?? '—'}". Solicitud aprobada.`,
          assetId: movement.assetId,
          userId: aprobadoPorId ? parseInt(aprobadoPorId) : null,
        },
      });
    } else {
      await prisma.eventLog.create({
        data: {
          type: 'STATUS_CHANGED',
          description: 'Solicitud de movimiento rechazada.',
          assetId: movement.assetId,
          userId: aprobadoPorId ? parseInt(aprobadoPorId) : null,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/movements/:id]', error);
    return NextResponse.json({ error: 'Error al procesar solicitud de movimiento' }, { status: 500 });
  }
}
