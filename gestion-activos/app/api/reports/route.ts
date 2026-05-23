import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

const techStatusES: Record<string, string> = {
  OPERATIONAL:       'OPERATIVO',
  DAMAGED:           'DANADO',
  UNDER_MAINTENANCE: 'EN_MANTENIMIENTO',
  UNDER_REPAIR:      'EN_REPARACION',
  OUT_OF_SERVICE:    'FUERA_DE_SERVICIO',
  DECOMMISSIONED:    'DE_BAJA',
  IN_TRANSIT:        'EN_TRANSITO',
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'])
  if (auth instanceof Response) return auth

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') ?? 'assets'

  try {
    if (type === 'assets') {
      const assets = await prisma.asset.findMany({
        where: { deletedAt: null },
        include: {
          category: true,
          location: true,
          assignments: { where: { endDate: null }, include: { user: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(assets.map(a => ({
        id: a.id,
        nombre: a.name,
        codigoInventario: a.inventoryCode,
        serial: a.serialNumber ?? '—',
        estadoTecnico: techStatusES[a.technicalStatus] ?? a.technicalStatus,
        categoria: a.category?.name ?? '—',
        ubicacion: a.location?.name ?? '—',
        asignadoA: a.assignments[0]?.user?.name ?? '—',
        valorAdquisicion: a.acquisitionValue?.toString() ?? '—',
        vencimientoGarantia: a.warrantyExpiry?.toISOString().slice(0, 10) ?? '—',
        createdAt: a.createdAt.toISOString().slice(0, 10),
      })))
    }

    if (type === 'maintenance') {
      const records = await prisma.maintenance.findMany({
        include: { asset: true, handledBy: true },
        orderBy: { scheduledAt: 'desc' },
      })
      const typeES: Record<string, string> = {
        PREVENTIVE: 'PREVENTIVO', CORRECTIVE: 'CORRECTIVO',
        CALIBRATION: 'CALIBRACION', UPDATE: 'ACTUALIZACION', CLEANING: 'LIMPIEZA',
      }
      const statusES: Record<string, string> = {
        SCHEDULED: 'PROGRAMADO', IN_PROGRESS: 'EN_CURSO',
        COMPLETED: 'COMPLETADO', CANCELLED: 'CANCELADO',
      }
      return NextResponse.json(records.map(m => ({
        id: m.id,
        activo: m.asset?.name ?? '—',
        tipo: typeES[m.type] ?? m.type,
        estado: statusES[m.status] ?? m.status,
        descripcion: m.description,
        proveedor: m.provider ?? '—',
        costo: m.cost?.toString() ?? '—',
        fechaInicio: m.scheduledAt?.toISOString().slice(0, 10) ?? '—',
        fechaFin: m.completedAt?.toISOString().slice(0, 10) ?? '—',
        tecnico: m.handledBy?.name ?? '—',
      })))
    }

    if (type === 'movements') {
      const movements = await prisma.movementRequest.findMany({
        include: {
          asset: true,
          requestedBy: { select: { name: true } },
          approvedBy:  { select: { name: true } },
          destination: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      const statusES: Record<string, string> = {
        PENDING: 'PENDIENTE', APPROVED: 'APROBADO', REJECTED: 'RECHAZADO',
        CANCELLED: 'CANCELADO', IN_PROGRESS: 'EN_CURSO', COMPLETED: 'COMPLETADO',
      }
      return NextResponse.json(movements.map(m => ({
        id: m.id,
        activo: m.asset?.name ?? '—',
        estado: statusES[m.status] ?? m.status,
        motivo: m.reason,
        destino: m.destination?.name ?? '—',
        solicitadoPor: m.requestedBy?.name ?? '—',
        aprobadoPor: m.approvedBy?.name ?? '—',
        fecha: m.createdAt.toISOString().slice(0, 10),
      })))
    }

    return NextResponse.json({ error: 'Tipo de reporte inválido. Use: assets, maintenance, movements' }, { status: 400 })
  } catch (error) {
    console.error('[GET /api/reports]', error)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}
