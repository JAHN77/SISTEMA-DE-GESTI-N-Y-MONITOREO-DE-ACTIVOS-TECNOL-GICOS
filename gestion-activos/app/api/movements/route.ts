import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const movements = await prisma.movementRequest.findMany({
      include: {
        asset:        { include: { location: true } },
        requestedBy:  { select: { id: true, name: true, role: true } },
        approvedBy:   { select: { id: true, name: true, role: true } },
        nuevaLocation: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(movements)
  } catch (error) {
    console.error('[GET /api/movements all]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
