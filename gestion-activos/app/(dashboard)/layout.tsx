import AppShell from '@/components/layout/AppShell'

// TODO: Replace with real session/auth once auth is implemented
// For now, simulates ADMIN role for development
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="ADMIN" userName="Admin ITAM" pendingMovements={3}>
      {children}
    </AppShell>
  )
}
