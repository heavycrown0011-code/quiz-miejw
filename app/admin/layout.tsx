import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin()
  return (
    <div className="shell">
      <header className="topbar">
        <div className="wrap">
          <div className="brand">MIRJE<small>Painel do Quiz Bíblico</small></div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>{profile.full_name || 'Administrador'}</span>
            <form action="/auth/signout" method="post"><button className="btn secondary">Sair</button></form>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
