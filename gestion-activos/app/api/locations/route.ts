import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: { children: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(locations)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ubicaciones' }, { status: 500 })
  }
}
