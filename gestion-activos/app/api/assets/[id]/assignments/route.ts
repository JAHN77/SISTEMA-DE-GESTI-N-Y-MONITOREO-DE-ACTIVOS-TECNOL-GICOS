import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// POST /api/assets/:id/assignments — assign asset to user
// Business rule: only one active assignment per asset (AssetAssignment with fechaFin IS NULL)
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const assetId = parseInt(id)

  try {
    const { userId, asignadoPorId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }

    // Enforce: only one active assignment per asset
    const active = await prisma.assetAssignment.findFirst({
      where: { assetId, fechaFin: null },
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
        userId: parseInt(userId),
        asignadoPorId: asignadoPorId ? parseInt(asignadoPorId) : null,
      },
      include: { user: true, asignadoPor: true },
    })

    // EventLog: ASIGNACION
    await prisma.eventLog.create({
      data: {
        tipo: 'ASIGNACION',
        descripcion: `Activo asignado a ${assignment.user.name}.`,
        assetId,
        userId: asignadoPorId ? parseInt(asignadoPorId) : null,
      },
    })

    // Update usage state
    await prisma.asset.update({
      where: { id: assetId },
      data: { estadoUso: 'ASIGNADO' },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('[POST /api/assets/:id/assignments]', error)
    return NextResponse.json({ error: 'Error al asignar activo' }, { status: 500 })
  }
}

// PATCH /api/assets/:id/assignments — end active assignment
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const assetId = parseInt(id)

  try {
    const active = await prisma.assetAssignment.findFirst({
      where: { assetId, fechaFin: null },
    })
    if (!active) {
      return NextResponse.json({ error: 'No hay asignación activa para este activo' }, { status: 404 })
    }

    const updated = await prisma.assetAssignment.update({
      where: { id: active.id },
      data: { fechaFin: new Date() },
      include: { user: true },
    })

    // EventLog: DESASIGNACION
    await prisma.eventLog.create({
      data: {
        tipo: 'DESASIGNACION',
        descripcion: `Asignación de ${updated.user.name} finalizada.`,
        assetId,
      },
    })

    // Update usage state back to DISPONIBLE
    await prisma.asset.update({
      where: { id: assetId },
      data: { estadoUso: 'DISPONIBLE' },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/assets/:id/assignments]', error)
    return NextResponse.json({ error: 'Error al finalizar asignación' }, { status: 500 })
  }
}
