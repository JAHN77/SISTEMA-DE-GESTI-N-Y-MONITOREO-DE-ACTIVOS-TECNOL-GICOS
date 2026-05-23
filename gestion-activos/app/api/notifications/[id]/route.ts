import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/notifications/:id — mark as read
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getUserFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  try {
    const notification = await prisma.notification.findUnique({ where: { id: parseInt(id) } })
    if (!notification) return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 })
    if (notification.userId !== session.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/notifications/:id]', error)
    return NextResponse.json({ error: 'Error al actualizar notificación' }, { status: 500 })
  }
}
