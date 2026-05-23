import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signJWT } from '@/lib/jwt'
import { verifyPassword } from '@/lib/password'

// Session durations
const SESSION_1H  = 60 * 60          // 1 hour  — default
const SESSION_30D = 60 * 60 * 24 * 30 // 30 days — "remember me"

// Dummy hash used when user is not found, to prevent timing attacks
const DUMMY_HASH = 'pbkdf2:100000:00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000'

export async function POST(req: NextRequest) {
  try {
    const { email, password, remember } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      select: { id: true, name: true, email: true, role: true, password: true, deletedAt: true },
    })

    // Always run hash comparison even when user is not found (timing attack prevention)
    const storedHash = user?.password ?? DUMMY_HASH
    const passwordOk = verifyPassword(String(password), storedHash)

    if (!user || user.deletedAt || !passwordOk) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' },
        { status: 401 },
      )
    }

    const expiresInSec = remember ? SESSION_30D : SESSION_1H
    const secret = process.env.JWT_SECRET!

    const token = await signJWT(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      secret,
      expiresInSec,
    )

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })

    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresInSec,
      path: '/',
    })

    return res
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
