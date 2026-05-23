import { NextResponse, type NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/jwt'

// Routes that don't require auth
const PUBLIC_PATHS = new Set(['/login', '/forgot-password'])

// API routes that are always public
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/forgot-password',
]

// Role-based route guards: only listed roles may access these path prefixes
const ROLE_GUARDS: { path: string; roles: string[] }[] = [
  { path: '/users',        roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/assignments',  roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/settings',     roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/reports',      roles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'] },
  { path: '/api/users',    roles: ['SUPER_ADMIN', 'ADMIN'] },
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static assets — skip
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(ico|png|svg|jpg|jpeg|webp|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Public API routes — skip auth
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get('auth-token')?.value
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured')
    return NextResponse.next()
  }

  const session = token ? await verifyJWT(token, jwtSecret) : null

  // Redirect authenticated users away from login/forgot-password
  if (PUBLIC_PATHS.has(pathname)) {
    if (session) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next()
  }

  // Root redirect
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(session ? '/dashboard' : '/login', req.url),
    )
  }

  // Require authentication for all other routes
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    if (pathname !== '/') loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // RBAC: check role-based access
  for (const guard of ROLE_GUARDS) {
    if (pathname.startsWith(guard.path) && !guard.roles.includes(session.role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Forward decoded user info to server components via request headers
  const res = NextResponse.next()
  res.headers.set('x-user-id',   String(session.id))
  res.headers.set('x-user-role', session.role)
  res.headers.set('x-user-name', session.name)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
