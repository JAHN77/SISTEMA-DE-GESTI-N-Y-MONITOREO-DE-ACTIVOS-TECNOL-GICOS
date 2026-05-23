import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, department: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  return NextResponse.json(user)
}

// PATCH /api/auth/me — update own profile (name and/or department only)
export async function PATCH(req: NextRequest) {
  const session = await getUserFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const { name, department } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: {
        name: name.trim(),
        ...(department !== undefined && { department: department?.trim() || null }),
      },
      select: { id: true, name: true, email: true, role: true, department: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/auth/me]', error)
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
  }
}
