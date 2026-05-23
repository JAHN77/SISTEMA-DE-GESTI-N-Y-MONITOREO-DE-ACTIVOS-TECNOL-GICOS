import { prisma } from './prisma'
import { NotificationType } from '@prisma/client'

interface NotifParams {
  userId: number
  type: NotificationType
  title: string
  message: string
  url?: string
  referenceId?: number
  referenceType?: string
}

export async function createNotification(p: NotifParams): Promise<void> {
  await prisma.notification.create({ data: p })
}

export async function notifyAllAdmins(p: Omit<NotifParams, 'userId'>): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, deletedAt: null },
    select: { id: true },
  })
  await Promise.all(admins.map(a =>
    prisma.notification.create({ data: { ...p, userId: a.id } })
  ))
}
