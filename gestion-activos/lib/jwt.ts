// Edge-compatible JWT using Web Crypto API (no external packages)
// Works in both Edge Runtime (middleware) and Node.js (API routes, server components)

const enc = new TextEncoder()
const dec = new TextDecoder()

export interface JWTPayload {
  id: number
  email: string
  name: string
  role: string
  iat: number
  exp: number
}

function toBase64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(str: string): Uint8Array {
  const padded = str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(str.length + (4 - (str.length % 4)) % 4, '=')
  const bin = atob(padded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function getKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage,
  )
}

export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSec = 3600,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = toBase64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const claims = toBase64url(
    enc.encode(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec })),
  )
  const input = `${header}.${claims}`
  const key = await getKey(secret, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(input))
  return `${input}.${toBase64url(sig)}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, claims, sig] = parts
    const key = await getKey(secret, ['verify'])
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64url(sig),
      enc.encode(`${header}.${claims}`),
    )
    if (!valid) return null
    const payload = JSON.parse(dec.decode(fromBase64url(claims))) as JWTPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
