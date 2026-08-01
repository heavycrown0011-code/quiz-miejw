import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import MirjeLogo from '@/components/MirjeLogo'

function qs(values: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => value && params.set(key, value))
  return params.toString()
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireAdmin()
  const page = Number(sp.page || 1)

  const [metricsRes, listRes, quizzesRes] = await Promise.all([
    supabase.rpc('admin_dashboard_metrics', { p_quiz_id: sp.quiz || null }),
    supabase.rpc('admin_list_submissions', {
      p_search: sp.search || null,
      p_quiz_id: sp.quiz || null,
      p_date_from: sp.from || null,
      p_date_to: sp.to || null,
      p_page: page,
      p_page_size: 20,
    }),
    supabase.rpc('admin_quiz_options'),
  ])

  if (metricsRes.error || listRes.error || quizzesRes.error) {
    console.error('admin_dashboard_error', metricsRes.error || listRes.error || quizzesRes.error)
  }

  const m: any = metricsRes.data || {}
  const list: any = listRes.data || { rows: [], total: 0, total_pages: 1 }
  const quizzes: any[] = quizzesRes.data || []

  return (
    <><header className="topbar"><div className="wrap"><div className="admin-brand"><MirjeLogo size={62} priority /><div className="brand">MIRJE<small>Painel do Quiz Bíblico</small></div></div><div className="admin-user"><span>{profile.full_name || 'Administrador'}</span><form action="/auth/signout" method="post"><button className="btn secondary">Sair</button></form></div></div></header><main className="wrap">
      <h1>Painel administrativo</h1>
      <p className="muted">Acompanhe participações, respostas, pedidos e contatos.</p>

      <section className="grid metrics">
        <div className="card metric"><span className="muted">Participantes</span><b>{m.total_participants ?? 0}</b></div>
        <div className="card metric"><span className="muted">Hoje</span><b>{m.today_participants ?? 0}</b></div>
        <div className="card metric"><span className="muted">Pedidos de oração</span><b>{m.prayer_requests ?? 0}</b></div>
        <div className="card metric"><span className="muted">Acompanhamento</span><b>{m.follow_up_requests ?? 0}</b></div>
      </section>

      <section className="card raffle-access">
        <div><span className="raffle-kicker">Sorteio MIRJE</span><h2>Roleta de participantes</h2><p className="muted">Todos os nomes únicos e seus códigos de três dígitos, prontos para o sorteio no telão.</p></div>
        <Link className="btn raffle-open" href="/admin/raffle">Abrir roleta</Link>
      </section>

      <form className="toolbar">
        <input className="input" name="search" defaultValue={sp.search} placeholder="Pesquisar nome, telefone ou código" />
        <select className="select" name="quiz" defaultValue={sp.quiz || ''}>
          <option value="">Todos os quizzes</option>
          {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
        <input className="input" type="date" name="from" defaultValue={sp.from} />
        <input className="input" type="date" name="to" defaultValue={sp.to} />
        <button className="btn">Filtrar</button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <a className="btn secondary" href={`/api/admin/export?${qs({ search: sp.search, quiz: sp.quiz, from: sp.from, to: sp.to })}`}>Exportar CSV</a>
      </div>

      <section className="card table-wrap">
        {list.rows?.length ? (
          <table>
            <thead><tr><th>Código</th><th>Participante</th><th>Telefone</th><th>Nascimento</th><th>Célula/Igreja</th><th>Quiz</th><th>Respostas corretas</th><th>Data</th><th>Contato</th></tr></thead>
            <tbody>{list.rows.map((r: any) => (
              <tr key={r.id}>
                <td><span className="raffle-code-small">{r.raffle_code || '—'}</span></td>
                <td><Link href={`/admin/participants/${r.id}`}><b>{r.participant_name || 'Sem nome'}</b></Link></td>
                <td>{r.phone || '—'}</td><td>{r.birth_date ? new Date(`${r.birth_date}T00:00:00`).toLocaleDateString('pt-BR') : '—'}</td><td>{r.cell_name || r.leader_name || '—'}</td><td>{r.quiz_title}</td>
                <td>{r.correct_answers} de {r.total_scored_questions}</td>
                <td>{new Date(r.submitted_at).toLocaleString('pt-BR', { timeZone: 'America/Manaus' })}</td>
                <td>{r.wants_follow_up ? <span className="badge yes">Sim</span> : <span className="badge no">Não</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <div className="muted">Ainda não há participações para os filtros escolhidos.</div>}

        <div className="pagination">
          <span>Página {list.page || 1} de {list.total_pages || 1}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {page > 1 && <Link className="btn secondary" href={`?${qs({ ...sp, page: String(page - 1) })}`}>Anterior</Link>}
            {page < (list.total_pages || 1) && <Link className="btn secondary" href={`?${qs({ ...sp, page: String(page + 1) })}`}>Próxima</Link>}
          </div>
        </div>
      </section>
    </main></>
  )
}
