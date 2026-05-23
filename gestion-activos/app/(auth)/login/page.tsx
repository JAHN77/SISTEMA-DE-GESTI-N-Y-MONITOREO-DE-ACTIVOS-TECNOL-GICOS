import { Suspense } from 'react'
import LoginClient from './login-client'

export const metadata = { title: 'Iniciar sesión — ITAM' }

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
