import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const ASSET_INCLUDE = {
  category: true,
  location: true,
  spec: true,
  assignments: { include: { user: true, asignadoPor: true }, orderBy: { fechaInicio: 'desc' as const } },
  maintenances: { include: { realizadoPor: true }, orderBy: { fechaInicio: 'desc' as const } },
  logs: { include: { user: true }, orderBy: { fecha: 'desc' as const } },
  requests: {
    include: { requestedBy: true, approvedBy: true, nuevaLocation: true },
    orderBy: { createdAt: 'desc' as const },
  },
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id), deletedAt: null },
      include: ASSET_INCLUDE,
    })
    if (!asset) return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 })
    return NextResponse.json(asset)
  } catch (error) {
    console.error('[GET /api/assets/:id]', error)
    return NextResponse.json({ error: 'Error al obtener activo' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const body = await req.json()
    const { nombre, serial, estadoTecnico, estadoUso, imageUrl, categoryId, locationId, spec, userId } = body

    const existing = await prisma.asset.findUnique({ where: { id: parseInt(id), deletedAt: null } })
    if (!existing) return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 })

    // Detect state change for EventLog
    const stateChanged = estadoTecnico && estadoTecnico !== existing.estadoTecnico

    const asset = await prisma.asset.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre        && { nombre }),
        ...(serial        !== undefined && { serial }),
        ...(estadoTecnico && { estadoTecnico }),
        ...(estadoUso     && { estadoUso }),
        ...(imageUrl      !== undefined && { imageUrl }),
        ...(categoryId    && { categoryId: parseInt(categoryId) }),
        ...(locationId    && { locationId: parseInt(locationId) }),
        ...(spec && {
          spec: { upsert: { create: spec, update: spec } },
        }),
        logs: {
          create: [
            {
              tipo: stateChanged ? 'CAMBIO_ESTADO' : 'ACTUALIZACION',
              descripcion: stateChanged
                ? `Estado técnico cambiado de ${existing.estadoTecnico} a ${estadoTecnico}.`
                : `Activo "${existing.nombre}" actualizado.`,
              ...(userId && { userId: parseInt(userId) }),
            },
          ],
        },
      },
      include: ASSET_INCLUDE,
    })

    return NextResponse.json(asset)
  } catch (error: any) {
    console.error('[PATCH /api/assets/:id]', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Código de inventario o serial duplicado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al actualizar activo' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const existing = await prisma.asset.findUnique({ where: { id: parseInt(id), deletedAt: null } })
    if (!existing) return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 })

    // Soft delete — never hard delete (AGENTS.md schema uses deletedAt pattern)
    await prisma.asset.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
        logs: {
          create: {
            tipo: 'CAMBIO_ESTADO',
            descripcion: `Activo "${existing.nombre}" marcado como eliminado (soft delete).`,
          },
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/assets/:id]', error)
    return NextResponse.json({ error: 'Error al eliminar activo' }, { status: 500 })
  }
}
