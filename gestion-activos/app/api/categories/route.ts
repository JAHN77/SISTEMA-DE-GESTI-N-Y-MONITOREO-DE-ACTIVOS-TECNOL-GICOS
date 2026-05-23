import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { children: true },
      orderBy: { name: 'asc' },
    })
    const mapped = categories.map(c => ({ ...c, nombre: c.name, descripcion: c.description }));
    return NextResponse.json(mapped)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}
