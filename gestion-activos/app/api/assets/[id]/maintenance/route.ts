import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const assetId = parseInt(id)

  try {
    const { tipo, descripcion, proveedor, costo, fechaInicio, fechaFin, realizadoPorId } = await req.json()

    if (!tipo || !descripcion || !fechaInicio) {
      return NextResponse.json({ error: 'tipo, descripcion y fechaInicio son requeridos' }, { status: 400 })
    }

    const maintenance = await prisma.maintenance.create({
      data: {
        assetId,
        tipo,
        descripcion,
        proveedor:     proveedor     ?? null,
        costo:         costo         ?? null,
        fechaInicio:   new Date(fechaInicio),
        fechaFin:      fechaFin ? new Date(fechaFin) : null,
        realizadoPorId: realizadoPorId ? parseInt(realizadoPorId) : null,
      },


// EventLog: MAINTENANCE — always log (AGENTS.md rule)
    await prisma.eventLog.create({
      data: {
        type: 'MAINTENANCE',
        description: `Mantenimiento ${tipo} creado para el activo: ${descripcion}`,
        assetId,
        userId: realizadoPorId ? parseInt(realizadoPorId) : null,
      },
    });
  } catch (error) {
    console.error('[POST /api/assets/:id/maintenance]', error)
    return NextResponse.json({ error: 'Error al crear mantenimiento' }, { status: 500 })
  }
}
