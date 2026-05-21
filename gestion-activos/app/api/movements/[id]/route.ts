import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/movements/:id — approve or reject a movement request
// Business rule: only ADMIN can perform this action (auth to be added later)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const { action, approvedById } = await req.json();

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'action must be APPROVED or REJECTED' }, { status: 400 });
    }

    const movement = await prisma.movementRequest.findUnique({
      where: { id: parseInt(id) },
      include: { asset: true, destination: true },
    });
    if (!movement) return NextResponse.json({ error: 'Movement request not found' }, { status: 404 });
    if (movement.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only PENDING requests can be processed' }, { status: 409 });
    }

    // Update the movement request status
    const updated = await prisma.movementRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: action as any,
        approvedById: approvedById ? parseInt(approvedById) : null,
      },
    });

    // If approved, move the asset and log the location change
    if (action === 'APPROVED' && movement.destinationId) {
      await prisma.asset.update({
        where: { id: movement.assetId },
        data: { locationId: movement.destinationId },
      });

      await prisma.eventLog.create({
        data: {
          type: 'LOCATION_CHANGED',
          description: `Asset moved to "${movement.destination?.name ?? '—'}". Request approved.`,
          assetId: movement.assetId,
          userId: approvedById ? parseInt(approvedById) : null,
        },
      });
    } else if (action === 'REJECTED') {
      await prisma.eventLog.create({
        data: {
          type: 'STATUS_CHANGED',
          description: 'Movement request rejected.',
          assetId: movement.assetId,
          userId: approvedById ? parseInt(approvedById) : null,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/movements/:id]', error);
    return NextResponse.json({ error: 'Error processing movement request' }, { status: 500 });
  }
}
