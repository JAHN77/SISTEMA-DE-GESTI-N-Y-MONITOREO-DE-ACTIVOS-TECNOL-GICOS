import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true, name: true, email: true, role: true, department: true, createdAt: true,
        _count: { select: { assignments: { where: { endDate: null } } } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(users.map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      department: u.department, createdAt: u.createdAt,
      activeAssignments: u._count.assignments,
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, department } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'name, email, password y role son requeridos' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword(password),
        role,
        department: department ?? null,
      },
      select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/users]', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
