import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const records = await prisma.maintenance.findMany({
      include: {
        asset:       { select: { id: true, nombre: true, codigoInventario: true } },
        realizadoPor: { select: { id: true, name: true } },
      },
      orderBy: { fechaInicio: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener mantenimientos' }, { status: 500 })
  }
}
