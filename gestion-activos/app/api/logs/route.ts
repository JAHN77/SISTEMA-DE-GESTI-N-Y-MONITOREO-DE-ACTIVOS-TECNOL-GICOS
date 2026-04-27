import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const assetId = searchParams.get('assetId')
    const tipo    = searchParams.get('tipo')

    const logs = await prisma.eventLog.findMany({
      where: {
        ...(assetId && { assetId: parseInt(assetId) }),
        ...(tipo && { tipo: tipo as any }),
      },
      include: {
        asset: { select: { id: true, nombre: true, codigoInventario: true } },
        user:  { select: { id: true, name: true, role: true } },
      },
      orderBy: { fecha: 'desc' },
      take: 200,
    })
    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener logs' }, { status: 500 })
  }
}
