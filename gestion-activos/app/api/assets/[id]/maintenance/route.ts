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
      include: { realizadoPor: true },
    })

    // EventLog: MANTENIMIENTO — always log (AGENTS.md rule)
    await prisma.eventLog.create({
      data: {
        tipo: 'MANTENIMIENTO',
        descripcion: `Registro de mantenimiento ${tipo} creado: ${descripcion}`,
        assetId,
        userId: realizadoPorId ? parseInt(realizadoPorId) : null,
      },
    })

    return NextResponse.json(maintenance, { status: 201 })
  } catch (error) {
    console.error('[POST /api/assets/:id/maintenance]', error)
    return NextResponse.json({ error: 'Error al crear mantenimiento' }, { status: 500 })
  }
}
