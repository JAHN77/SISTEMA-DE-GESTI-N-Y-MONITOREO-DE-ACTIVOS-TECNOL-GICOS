import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const { name, role, department, password, disabled } = await req.json()

    const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(name       && { name }),
        ...(role       && { role }),
        ...(department !== undefined && { department }),
        ...(password   && { password: hashPassword(password) }),
        ...(disabled === true  && { deletedAt: new Date() }),
        ...(disabled === false && { deletedAt: null }),
      },
      select: { id: true, name: true, email: true, role: true, department: true, createdAt: true, deletedAt: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('[PATCH /api/users/:id]', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/users/:id]', error)
    return NextResponse.json({ error: 'Error al deshabilitar usuario' }, { status: 500 })
  }
}
