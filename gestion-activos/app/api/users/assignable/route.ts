import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/assignable — users that can receive an asset assignment
// Accessible to SUPER_ADMIN, ADMIN, TECHNICIAN
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'])
  if (auth instanceof Response) return auth

  const rawUsers = await prisma.user.findMany({
    where: {
      role: { in: ['USER', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'] },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      assignments: {
        where: { endDate: null },
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const users = rawUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    activeAssignments: u.assignments.length,
  }))

  return NextResponse.json(users)
}
