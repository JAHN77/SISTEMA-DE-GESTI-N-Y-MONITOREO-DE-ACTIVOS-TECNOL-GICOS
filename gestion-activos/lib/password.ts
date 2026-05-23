// Node.js-only: runs in API routes and server components (not Edge middleware)
// PBKDF2-SHA512 with 100k iterations — no external packages needed
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'

const ALGO    = 'pbkdf2'
const ITER    = 100_000
const KEY_LEN = 32
const DIGEST  = 'sha512'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, ITER, KEY_LEN, DIGEST).toString('hex')
  return `${ALGO}:${ITER}:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [, iters, salt, hash] = stored.split(':')
    const candidate = pbkdf2Sync(
      password,
      salt,
      parseInt(iters, 10),
      KEY_LEN,
      DIGEST,
    ).toString('hex')
    // Constant-time comparison prevents timing attacks
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'))
  } catch {
    return false
  }
}
