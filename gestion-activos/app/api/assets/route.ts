import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ASSET_INCLUDE = {
  category: true,
  location: true,
  spec: true,
  assignments: {
    where: { endDate: null },
    include: { user: { select: { id: true, name: true, department: true } } },
    take: 1,
    orderBy: { startDate: 'desc' as const },
  },
} as const

// Spanish → DB (for WHERE filters)
const statusMap: Record<string, string> = {
  OPERATIVO:        'OPERATIONAL',
  EN_MANTENIMIENTO: 'UNDER_MAINTENANCE',
  EN_REPARACION:    'UNDER_REPAIR',
  DANADO:           'DAMAGED',
  FUERA_DE_SERVICIO:'OUT_OF_SERVICE',
  DE_BAJA:          'DECOMMISSIONED',
  EN_TRANSITO:      'IN_TRANSIT',
  REACTIVADO:       'REACTIVATED',
}

const usageMap: Record<string, string> = {
  DISPONIBLE:    'AVAILABLE',
  ASIGNADO:      'ASSIGNED',
  RESERVADO:     'RESERVED',
  NO_DISPONIBLE: 'UNAVAILABLE',
  PRESTADO:      'ON_LOAN',
}

// DB → Spanish (for API response)
const techStatusES: Record<string, string> = {
  OPERATIONAL:       'OPERATIVO',
  DAMAGED:           'DANADO',
  UNDER_MAINTENANCE: 'EN_MANTENIMIENTO',
  UNDER_REPAIR:      'EN_REPARACION',
  OUT_OF_SERVICE:    'FUERA_DE_SERVICIO',
  DECOMMISSIONED:    'DE_BAJA',
  IN_TRANSIT:        'EN_TRANSITO',
  REACTIVATED:       'REACTIVADO',
}

const usageStatusES: Record<string, string> = {
  AVAILABLE:   'DISPONIBLE',
  ASSIGNED:    'ASIGNADO',
  RESERVED:    'RESERVADO',
  UNAVAILABLE: 'NO_DISPONIBLE',
  ON_LOAN:     'PRESTADO',
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const search      = searchParams.get('search') ?? ''
    const categoryId  = searchParams.get('categoryId')
    const locationId  = searchParams.get('locationId')
    const estadoTecnico = searchParams.getAll('estadoTecnico')
    const estadoUso     = searchParams.getAll('estadoUso')
    const page          = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const pageSize      = Math.min(100, parseInt(searchParams.get('pageSize') ?? '25'))
    const sortBy        = searchParams.get('sortBy') ?? 'createdAt'
    const sortOrder     = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc'

    const where: any = {
  deletedAt: null,
  ...(search && {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { inventoryCode: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
    ],
  }),
  ...(categoryId && { categoryId: parseInt(categoryId) }),
  ...(locationId && { locationId: parseInt(locationId) }),
};


    if (estadoTecnico.length > 0) {
      where.technicalStatus = { in: estadoTecnico.map(s => statusMap[s] || s) };
    }
    if (estadoUso.length > 0) {
      where.usageStatus = { in: estadoUso.map(s => usageMap[s] || s) };
    }

    const [data, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: ASSET_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.asset.count({ where }),
    ])

    const mappedData = data.map(asset => {
      const { assignments, ...rest } = asset as any
      return {
        ...rest,
        nombre: asset.name,
        codigoInventario: asset.inventoryCode,
        serial: asset.serialNumber,
        estadoTecnico: techStatusES[asset.technicalStatus] ?? asset.technicalStatus,
        estadoUso: usageStatusES[asset.usageStatus] ?? asset.usageStatus,
        category: asset.category ? { ...asset.category, nombre: asset.category.name, descripcion: asset.category.description } : null,
        location: asset.location ? { ...asset.location, nombre: asset.location.name, descripcion: asset.location.description } : null,
        assignedTo: (assignments as any[])?.[0]?.user ?? null,
      }
    })

    return NextResponse.json({
      data: mappedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[GET /api/assets]', error)
    return NextResponse.json({ error: 'Error al obtener activos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      nombre, codigoInventario, serial,
      estadoTecnico, estadoUso, imageUrl,
      categoryId, locationId,
      spec,
    } = body

    if (!nombre || !codigoInventario || !categoryId || !locationId) {
      return NextResponse.json({ error: 'Campos requeridos: nombre, codigoInventario, categoryId, locationId' }, { status: 400 })
    }

    const asset = await prisma.asset.create({
      data: {
        name: nombre,
        inventoryCode: codigoInventario,
        serialNumber:       serial       ?? null,
        technicalStatus: (estadoTecnico ? statusMap[estadoTecnico] : null) ?? 'OPERATIONAL',
        usageStatus:     (estadoUso ? usageMap[estadoUso] : null) ?? 'AVAILABLE',
        imageUrl:     imageUrl     ?? null,
        categoryId:   parseInt(categoryId),
        locationId:   parseInt(locationId),
        ...(spec && {
          spec: { create: spec },
        }),
        logs: {
          create: {
            type: 'CREATED',
            description: `Activo "${nombre}" creado en el sistema.`,
          },
        },
      },
      include: ASSET_INCLUDE,
    })

    const mappedAsset = {
      ...asset,
      nombre: asset.name,
      codigoInventario: asset.inventoryCode,
      serial: asset.serialNumber,
      estadoTecnico: techStatusES[asset.technicalStatus] ?? asset.technicalStatus,
      estadoUso: usageStatusES[asset.usageStatus] ?? asset.usageStatus,
    }

    return NextResponse.json(mappedAsset, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/assets]', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El código de inventario o serial ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear activo' }, { status: 500 })
  }
}
