import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const ASSET_INCLUDE = {
  category: true,
  location: true,
  spec: true,
  assignments: { include: { user: true, assignedBy: true }, orderBy: { startDate: 'desc' as const } },
  maintenances: { include: { handledBy: true }, orderBy: { scheduledAt: 'desc' as const } },
  logs: { include: { user: true }, orderBy: { occurredAt: 'desc' as const } },
  requests: {
    include: { requestedBy: true, approvedBy: true, destination: true },
    orderBy: { createdAt: 'desc' as const },
  },
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id), deletedAt: null },
      include: ASSET_INCLUDE,
    }) as any
    if (!asset) return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 })

    const mappedAsset = {
  ...asset,
  nombre: asset.name,
  codigoInventario: asset.inventoryCode,
  serial: asset.serialNumber,
  estadoTecnico: asset.technicalStatus,
  estadoUso: asset.usageStatus,
  category: asset.category ? { ...asset.category, nombre: asset.category.name, descripcion: asset.category.description } : null,
  location: asset.location ? { ...asset.location, nombre: asset.location.name, descripcion: asset.location.description } : null,
};

    return NextResponse.json(mappedAsset)
  } catch (error) {
    console.error('[GET /api/assets/:id]', error)
    return NextResponse.json({ error: 'Error al obtener activo' }, { status: 500 })
  }
}

const statusMap: Record<string, any> = { 'OPERATIVO': 'OPERATIONAL', 'EN_MANTENIMIENTO': 'UNDER_MAINTENANCE', 'EN_REPARACION': 'UNDER_REPAIR', 'DANADO': 'DAMAGED', 'FUERA_DE_SERVICIO': 'OUT_OF_SERVICE', 'DE_BAJA': 'DECOMMISSIONED' };
const usageMap: Record<string, any> = { 'DISPONIBLE': 'AVAILABLE', 'ASIGNADO': 'ASSIGNED', 'RESERVADO': 'RESERVED', 'NO_DISPONIBLE': 'UNAVAILABLE' };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const body = await req.json()
    const { nombre, serial, estadoTecnico, estadoUso, imageUrl, categoryId, locationId, spec, userId } = body

    const existing = await prisma.asset.findUnique({ where: { id: parseInt(id), deletedAt: null } })
    if (!existing) return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 })

    const newTechStatus = estadoTecnico ? statusMap[estadoTecnico] : undefined;
    const newUsageStatus = estadoUso ? usageMap[estadoUso] : undefined;

    // Detect state change for EventLog
    const stateChanged = newTechStatus && newTechStatus !== existing.technicalStatus

    const asset = await prisma.asset.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre        && { name: nombre }),
        ...(serial        !== undefined && { serialNumber: serial }),
        ...(newTechStatus && { technicalStatus: newTechStatus }),
        ...(newUsageStatus && { usageStatus: newUsageStatus }),
        ...(imageUrl      !== undefined && { imageUrl }),
        ...(categoryId    && { categoryId: parseInt(categoryId) }),
        ...(locationId    && { locationId: parseInt(locationId) }),
        ...(spec && {
          spec: { upsert: { create: spec, update: spec } },
        }),
        logs: {
          create: [
            {
              type: stateChanged ? 'STATUS_CHANGED' : 'UPDATED',
              description: stateChanged
                ? `Estado técnico cambiado a ${estadoTecnico}.`
                : `Activo actualizado.`,
              ...(userId && { userId: parseInt(userId) }),
            },
          ],
        },
      },
      include: ASSET_INCLUDE,
    })

    const mappedAsset = {
      ...asset,
      nombre: asset.name,
      codigoInventario: asset.inventoryCode,
      serial: asset.serialNumber,
      estadoTecnico: asset.technicalStatus,
      estadoUso: asset.usageStatus,
    };

    return NextResponse.json(mappedAsset)
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
            type: 'STATUS_CHANGED',
            description: `Activo "${existing.name}" marcado como eliminado (soft delete).`,
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
