import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const records = await prisma.maintenance.findMany({
      include: {
        asset:       { select: { id: true, name: true, inventoryCode: true } },
        handledBy:   { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    })
    const mapped = records.map(r => ({
      ...r,
      tipo: r.type,
      descripcion: r.description,
      fechaInicio: r.scheduledAt,
      fechaFin: r.completedAt,
      realizadoPor: r.handledBy,
      asset: r.asset ? { ...r.asset, nombre: r.asset.name, codigoInventario: r.asset.inventoryCode } : null
    }));
    return NextResponse.json(mapped)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener mantenimientos' }, { status: 500 })
  }
}
