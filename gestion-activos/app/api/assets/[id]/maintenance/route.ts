import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import type { MaintenanceType as PrismaMaintenanceType } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

const MAINTENANCE_TYPE_MAP: Record<string, PrismaMaintenanceType> = {
  PREVENTIVO:    'PREVENTIVE',
  CORRECTIVO:    'CORRECTIVE',
  CALIBRACION:   'CALIBRATION',
  ACTUALIZACION: 'UPDATE',
  LIMPIEZA:      'CLEANING',
}

// POST /api/assets/:id/maintenance — create a maintenance record
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'])
  if (auth instanceof Response) return auth
  const { user: actor } = auth

  const { id } = await params
  const assetId = parseInt(id)

  try {
    const { tipo, descripcion, proveedor, costo, fechaInicio, realizadoPorId, estadoInicial } =
      await req.json()

    if (!tipo || !descripcion || !fechaInicio) {
      return NextResponse.json(
        { error: 'tipo, descripcion y fechaInicio son requeridos' },
        { status: 400 }
      )
    }

    const mappedType = MAINTENANCE_TYPE_MAP[tipo]
    if (!mappedType) {
      return NextResponse.json({ error: `Tipo inválido: ${tipo}` }, { status: 400 })
    }

    // 'IN_PROGRESS' → asset goes UNDER_MAINTENANCE immediately
    const initialStatus = estadoInicial === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'SCHEDULED'

    let maintenance: any

    if (initialStatus === 'IN_PROGRESS') {
      await prisma.$transaction(async (tx) => {
        maintenance = await tx.maintenance.create({
          data: {
            assetId,
            type: mappedType,
            status: 'IN_PROGRESS',
            description: descripcion,
            provider:    proveedor ?? null,
            cost:        costo     ?? null,
            scheduledAt: new Date(fechaInicio),
            handledById: realizadoPorId ? parseInt(realizadoPorId) : null,
          },
        })
        await tx.asset.update({
          where: { id: assetId },
          data:  { technicalStatus: 'UNDER_MAINTENANCE' },
        })
        await tx.eventLog.create({
          data: {
            type:        'MAINTENANCE',
            description: `Mantenimiento ${tipo} iniciado: ${descripcion}`,
            assetId,
            userId: actor.id,
          },
        })
      })
    } else {
      maintenance = await prisma.maintenance.create({
        data: {
          assetId,
          type: mappedType,
          status: 'SCHEDULED',
          description: descripcion,
          provider:    proveedor ?? null,
          cost:        costo     ?? null,
          scheduledAt: new Date(fechaInicio),
          handledById: realizadoPorId ? parseInt(realizadoPorId) : null,
        },
      })
      await prisma.eventLog.create({
        data: {
          type:        'MAINTENANCE',
          description: `Mantenimiento ${tipo} programado: ${descripcion}`,
          assetId,
          userId: actor.id,
        },
      })
    }

    // Fetch asset name + active assignment for notifications
    const [maintAsset, activeAssignment] = await Promise.all([
      prisma.asset.findUnique({ where: { id: assetId }, select: { name: true } }),
      prisma.assetAssignment.findFirst({ where: { assetId, endDate: null }, select: { userId: true } }),
    ])
    const maintAssetName = maintAsset?.name ?? `#${assetId}`
    const technicianId = realizadoPorId ? parseInt(realizadoPorId) : null

    if (technicianId) {
      await createNotification({
        userId: technicianId,
        type: 'MAINTENANCE_DUE',
        title: 'Mantenimiento asignado',
        message: `Tienes un mantenimiento ${tipo} asignado para: ${maintAssetName}`,
        url: `/assets/${assetId}?tab=maintenance`,
        referenceId: maintenance.id,
        referenceType: 'Maintenance',
      })
    }
    if (activeAssignment && activeAssignment.userId !== technicianId) {
      await createNotification({
        userId: activeAssignment.userId,
        type: 'MAINTENANCE_DUE',
        title: 'Mantenimiento programado',
        message: `Tu activo "${maintAssetName}" entrará en mantenimiento ${tipo}.`,
        url: `/assets/${assetId}?tab=maintenance`,
        referenceId: maintenance.id,
        referenceType: 'Maintenance',
      })
    }

    return NextResponse.json(
      {
        ...maintenance,
        tipo:         maintenance.type,
        descripcion:  maintenance.description,
        proveedor:    maintenance.provider,
        costo:        maintenance.cost?.toString() ?? null,
        fechaInicio:  maintenance.scheduledAt,
        fechaFin:     maintenance.completedAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/assets/:id/maintenance]', error)
    return NextResponse.json({ error: 'Error al crear mantenimiento' }, { status: 500 })
  }
}

// PATCH /api/assets/:id/maintenance — Complete or Cancel an active maintenance record
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'])
  if (auth instanceof Response) return auth
  const { user: actor } = auth

  const { id } = await params
  const assetId = parseInt(id)

  try {
    const body = await req.json()
    const { maintenanceId, accion, nota } = body

    if (!maintenanceId || !accion) {
      return NextResponse.json(
        { error: 'maintenanceId y accion son requeridos' },
        { status: 400 }
      )
    }

    const maintenance = await prisma.maintenance.findFirst({
      where: { id: parseInt(maintenanceId), assetId },
    })
    if (!maintenance) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 })
    }

    // Progress update — no state change, just an EventLog note
    if (accion === 'ACTUALIZAR_PROGRESO') {
      const notaTrimmed = (nota as string | undefined)?.trim()
      if (!notaTrimmed) {
        return NextResponse.json({ error: 'nota es requerida para actualizar progreso' }, { status: 400 })
      }
      await prisma.eventLog.create({
        data: {
          type: 'MAINTENANCE',
          description: `[Progreso de mantenimiento] ${notaTrimmed}`,
          assetId,
          userId: actor.id,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (maintenance.status === 'COMPLETED' || maintenance.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'El mantenimiento ya fue finalizado o cancelado' },
        { status: 409 }
      )
    }

    if (accion === 'COMPLETAR') {
      await prisma.$transaction(async (tx) => {
        await tx.maintenance.update({
          where: { id: parseInt(maintenanceId) },
          data:  { status: 'COMPLETED', completedAt: new Date() },
        })
        await tx.asset.update({
          where: { id: assetId },
          data:  { technicalStatus: 'OPERATIONAL' },
        })
        await tx.eventLog.create({
          data: {
            type:        'STATUS_CHANGED',
            description: 'Mantenimiento completado. Activo restaurado a estado OPERATIVO.',
            assetId,
            userId: actor.id,
          },
        })
      })
      // Notify technician if assigned
      if (maintenance.handledById) {
        const completedAsset = await prisma.asset.findUnique({ where: { id: assetId }, select: { name: true } })
        await createNotification({
          userId: maintenance.handledById,
          type: 'MAINTENANCE_DUE',
          title: 'Mantenimiento completado',
          message: `Mantenimiento de "${completedAsset?.name ?? `#${assetId}`}" marcado como completado.`,
          url: `/assets/${assetId}?tab=maintenance`,
          referenceId: parseInt(maintenanceId),
          referenceType: 'Maintenance',
        })
      }
      return NextResponse.json({ ok: true })
    }

    if (accion === 'CANCELAR') {
      await prisma.$transaction(async (tx) => {
        await tx.maintenance.update({
          where: { id: parseInt(maintenanceId) },
          data:  { status: 'CANCELLED' },
        })
        await tx.asset.update({
          where: { id: assetId },
          data:  { technicalStatus: 'OPERATIONAL' },
        })
        await tx.eventLog.create({
          data: {
            type:        'MAINTENANCE',
            description: 'Mantenimiento cancelado. Activo restaurado a estado OPERATIVO.',
            assetId,
            userId: actor.id,
          },
        })
      })
      // Notify technician if assigned
      if (maintenance.handledById) {
        const cancelledAsset = await prisma.asset.findUnique({ where: { id: assetId }, select: { name: true } })
        await createNotification({
          userId: maintenance.handledById,
          type: 'MAINTENANCE_DUE',
          title: 'Mantenimiento cancelado',
          message: `El mantenimiento de "${cancelledAsset?.name ?? `#${assetId}`}" fue cancelado.`,
          url: `/assets/${assetId}?tab=maintenance`,
          referenceId: parseInt(maintenanceId),
          referenceType: 'Maintenance',
        })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json(
      { error: 'accion debe ser COMPLETAR o CANCELAR' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[PATCH /api/assets/:id/maintenance]', error)
    return NextResponse.json({ error: 'Error al actualizar mantenimiento' }, { status: 500 })
  }
}
