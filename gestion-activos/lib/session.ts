// Server-only: reads the JWT cookie and returns the decoded session.
// Use in Server Components and Route Handlers — NOT in client components or middleware.
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJWT, type JWTPayload } from './jwt'

function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set')
  return s
}

export async function getSession(): Promise<JWTPayload | null> {
  const store = await cookies()
  const token = store.get('auth-token')?.value
  if (!token) return null
  return verifyJWT(token, secret())
}

export async function requireSession(): Promise<JWTPayload> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}
