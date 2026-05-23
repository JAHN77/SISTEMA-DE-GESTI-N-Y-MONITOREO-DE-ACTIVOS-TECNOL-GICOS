import AppShell from '@/components/layout/AppShell'
import { AuthProvider } from '@/context/AuthContext'
import { requireSession } from '@/lib/session'
import type { Role } from '@/types/domain'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  const user = {
    id:    session.id,
    name:  session.name,
    email: session.email,
    role:  session.role as Role,
  }

  return (
    <AuthProvider initialUser={user}>
      <AppShell role={user.role} userName={user.name} pendingMovements={0}>
        {children}
      </AppShell>
    </AuthProvider>
  )
}
