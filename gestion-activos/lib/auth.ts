import { type NextRequest } from 'next/server'
import { verifyJWT, type JWTPayload } from './jwt'

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIAN' | 'USER' | 'AUDITOR'

function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set')
  return s
}

export async function getUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return null
  return verifyJWT(token, secret())
}

/**
 * Validates that the request has a valid session and the user holds one of
 * the required roles. Returns { user } on success or a ready-to-return
 * Response (401/403) on failure.
 *
 * Usage:
 *   const auth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN'])
 *   if (auth instanceof Response) return auth
 *   const { user } = auth
 */
export async function requireRole(
  req: NextRequest,
  roles: Role[],
): Promise<{ user: JWTPayload } | Response> {
  const user = await getUserFromRequest(req)
  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }
  if (!roles.includes(user.role as Role)) {
    return Response.json({ error: 'No autorizado para esta acción' }, { status: 403 })
  }
  return { user }
}
