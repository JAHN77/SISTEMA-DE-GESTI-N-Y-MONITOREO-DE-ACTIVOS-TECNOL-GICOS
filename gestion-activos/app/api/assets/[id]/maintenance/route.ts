import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { MaintenanceType as PrismaMaintenanceType } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

const MAINTENANCE_TYPE_MAP: Record<string, PrismaMaintenanceType> = {
  'PREVENTIVO': 'PREVENTIVE',
  'CORRECTIVO': 'CORRECTIVE',
  'CALIBRACION': 'CALIBRATION',
  'ACTUALIZACION': 'UPDATE',
  'LIMPIEZA': 'CLEANING',
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const assetId = parseInt(id)

  try {
    const { tipo, descripcion, proveedor, costo, fechaInicio, fechaFin, realizadoPorId } = await req.json()

    if (!tipo || !descripcion || !fechaInicio) {
      return NextResponse.json({ error: 'tipo, descripcion y fechaInicio son requeridos' }, { status: 400 })
    }

    const mappedType = MAINTENANCE_TYPE_MAP[tipo as keyof typeof MAINTENANCE_TYPE_MAP]
    if (!mappedType) {
      return NextResponse.json({ error: `Tipo de mantenimiento inválido: ${tipo}` }, { status: 400 })
    }

    const maintenance = await prisma.maintenance.create({
      data: {
        assetId,
        type: mappedType,
        description: descripcion,
        provider: proveedor ?? null,
        cost: costo ?? null,
        scheduledAt: new Date(fechaInicio),
        completedAt: fechaFin ? new Date(fechaFin) : null,
        handledById: realizadoPorId ? parseInt(realizadoPorId) : null,
      },
    })

    // EventLog: MAINTENANCE — always log (AGENTS.md rule)
    await prisma.eventLog.create({
      data: {
        type: 'MAINTENANCE',
        description: `Mantenimiento ${tipo} creado para el activo: ${descripcion}`,
        assetId,
        userId: realizadoPorId ? parseInt(realizadoPorId) : null,
      },
    })

    const mappedMaintenance = {
      ...maintenance,
      tipo: maintenance.type,
      descripcion: maintenance.description,
      proveedor: maintenance.provider,
      costo: maintenance.cost,
      fechaInicio: maintenance.scheduledAt,
      fechaFin: maintenance.completedAt,
      realizadoPorId: maintenance.handledById,
    }

    return NextResponse.json(mappedMaintenance, { status: 201 })
  } catch (error) {
    console.error('[POST /api/assets/:id/maintenance]', error)
    return NextResponse.json({ error: 'Error al crear mantenimiento' }, { status: 500 })
  }
}