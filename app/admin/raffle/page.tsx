import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import MirjeLogo from '@/components/MirjeLogo'
import RaffleWheel from '@/components/RaffleWheel'

export default async function RafflePage() {
  const { supabase, profile } = await requireAdmin()
  const { data, error } = await supabase.rpc('admin_raffle_entries')

  if (error) console.error('admin_raffle_error', error)

  const entries = (data || []).map((entry: any) => ({
    code: entry.raffle_code as string,
    name: entry.participant_name as string,
  }))

  return <div className="raffle-page">
    <header className="raffle-topbar">
      <div className="raffle-brand"><MirjeLogo size={58} priority /><div><b>MIRJE</b><span>Roleta oficial</span></div></div>
      <div className="raffle-admin"><span>{profile.full_name || 'Administrador'}</span><Link className="btn secondary" href="/admin">Voltar ao painel</Link></div>
    </header>
    <RaffleWheel entries={entries} />
  </div>
}
