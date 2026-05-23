import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const session = await getUserFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    await prisma.notification.updateMany({
      where: { userId: session.id, read: false },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/notifications/read-all]', error)
    return NextResponse.json({ error: 'Error al marcar notificaciones' }, { status: 500 })
  }
}
