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
      },
      include: {
        asset: { select: { id: true, name: true, inventoryCode: true } },
        user:  { select: { id: true, name: true, role: true } },
      },
      orderBy: { occurredAt: 'desc' },
      take: 200,
    })
    
    const mappedLogs = logs.map(l => ({
      ...l,
      tipo: l.type,
      descripcion: l.description,
      fecha: l.occurredAt,
      asset: l.asset ? { ...l.asset, nombre: l.asset.name, codigoInventario: l.asset.inventoryCode } : null
    }));
    
    return NextResponse.json(mappedLogs)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener logs' }, { status: 500 })
  }
}
