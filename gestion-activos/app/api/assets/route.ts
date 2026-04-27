import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ASSET_INCLUDE = {
  category: true,
  location: true,
  spec: true,
} as const

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

    const where: Parameters<typeof prisma.asset.findMany>[0]['where'] = {
      deletedAt: null,
      ...(search && {
        OR: [
          { nombre:            { contains: search, mode: 'insensitive' } },
          { codigoInventario:  { contains: search, mode: 'insensitive' } },
          { serial:            { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(locationId && { locationId: parseInt(locationId) }),
      ...(estadoTecnico.length > 0 && { estadoTecnico: { in: estadoTecnico as any[] } }),
      ...(estadoUso.length   > 0 && { estadoUso:     { in: estadoUso     as any[] } }),
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

    return NextResponse.json({
      data,
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
        nombre,
        codigoInventario,
        serial:       serial       ?? null,
        estadoTecnico: estadoTecnico ?? 'OPERATIVO',
        estadoUso:     estadoUso    ?? 'DISPONIBLE',
        imageUrl:     imageUrl     ?? null,
        categoryId:   parseInt(categoryId),
        locationId:   parseInt(locationId),
        ...(spec && {
          spec: { create: spec },
        }),
        logs: {
          create: {
            tipo: 'CREACION',
            descripcion: `Activo "${nombre}" creado en el sistema.`,
          },
        },
      },
      include: ASSET_INCLUDE,
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/assets]', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El código de inventario o serial ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear activo' }, { status: 500 })
  }
}
