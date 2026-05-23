import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: { in: [Role.TECHNICIAN, Role.ADMIN, Role.SUPER_ADMIN] },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatarUrl: true,
        _count: { select: { assignments: { where: { endDate: null } } } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(
      technicians.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        role: t.role,
        department: t.department,
        avatarUrl: t.avatarUrl,
        activeAssignments: t._count.assignments,
      }))
    )
  } catch (error) {
    console.error('[GET /api/technicians]', error)
    return NextResponse.json({ error: 'Error al obtener técnicos' }, { status: 500 })
  }
}
