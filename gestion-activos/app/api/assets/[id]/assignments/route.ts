import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// POST /api/assets/:id/assignments — assign asset to user
// Business rule: only one active assignment per asset (AssetAssignment with endDate IS NULL)
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN'])
  if (auth instanceof Response) return auth
  const { user: actor } = auth

  const { id } = await params
  const assetId = parseInt(id)

  try {
    const { userId, reason, notes } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }

    // Enforce: only one active assignment per asset
    const active = await prisma.assetAssignment.findFirst({
      where: { assetId, endDate: null },
    })
    if (active) {
      return NextResponse.json(
        { error: 'El activo ya tiene una asignación activa. Finalice la asignación anterior primero.' },
        { status: 409 }
      )
    }

    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId,
        userId:      parseInt(userId),
        createdById: actor.id,
        reason:      reason ?? null,
        notes:       notes  ?? null,
      },
      include: { user: true, createdBy: true },
    })

    // EventLog: ASIGNACION
    await prisma.eventLog.create({
      data: {
        type: 'ASSIGNED',
        description: `Activo asignado a ${assignment.user.name}.`,
        assetId,
        userId: actor.id,
      },
    })

    // Update usage state
    await prisma.asset.update({
      where: { id: assetId },
      data: { usageStatus: 'ASSIGNED' },
    })

    const mappedAssignment = {
      ...assignment,
      usuario: assignment.user,
      asignadoPor: assignment.createdBy,
    }

    return NextResponse.json(mappedAssignment, { status: 201 })
  } catch (error) {
    console.error('[POST /api/assets/:id/assignments]', error)
    return NextResponse.json({ error: 'Error al asignar activo' }, { status: 500 })
  }
}

// PATCH /api/assets/:id/assignments — end active assignment
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN'])
  if (auth instanceof Response) return auth
  const { user: actor } = auth

  const { id } = await params
  const assetId = parseInt(id)

  try {
    const active = await prisma.assetAssignment.findFirst({
      where: { assetId, endDate: null },
    })
    if (!active) {
      return NextResponse.json({ error: 'No hay asignación activa para este activo' }, { status: 404 })
    }

    const updated = await prisma.assetAssignment.update({
      where: { id: active.id },
      data: { endDate: new Date() },
      include: { user: true },
    })

    // EventLog: DESASIGNACION
    await prisma.eventLog.create({
      data: {
        type: 'UNASSIGNED',
        description: `Asignación de ${updated.user.name} finalizada.`,
        assetId,
        userId: actor.id,
      },
    })

    // Update usage state back to DISPONIBLE
    await prisma.asset.update({
      where: { id: assetId },
      data: { usageStatus: 'AVAILABLE' },
    })

    const mappedAssignment = {
      ...updated,
      usuario: updated.user,
    }

    return NextResponse.json(mappedAssignment)
  } catch (error) {
    console.error('[PATCH /api/assets/:id/assignments]', error)
    return NextResponse.json({ error: 'Error al finalizar asignación' }, { status: 500 })
  }
}
