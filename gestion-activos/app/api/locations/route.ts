import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: { children: true },
      orderBy: { name: 'asc' },
    })
    const mapped = locations.map(l => ({ ...l, nombre: l.name }));
    return NextResponse.json(mapped)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ubicaciones' }, { status: 500 })
  }
}
