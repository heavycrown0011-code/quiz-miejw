import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import MirjeLogo from '@/components/MirjeLogo'

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, profile } = await requireAdmin()
  const { data, error } = await supabase.rpc('admin_submission_detail', { p_submission_id: id })

  if (error || !data) {
    console.error('admin_detail_error', error)
    notFound()
  }

  const s: any = data.submission
  const answers: any[] = data.answers || []

  return (
    <><header className="topbar"><div className="wrap"><div className="admin-brand"><MirjeLogo size={62} priority /><div className="brand">MIRJE<small>Painel do Quiz Bíblico</small></div></div><div className="admin-user"><span>{profile.full_name || 'Administrador'}</span><form action="/auth/signout" method="post"><button className="btn secondary">Sair</button></form></div></div></header><main className="wrap">
      <Link href="/admin">← Voltar</Link>
      <h1>{s.participant_name || 'Participação'}</h1>
      <section className="grid detail-grid">
        <div className="card">
          <h2>Dados</h2>
          <p><b>Código de sorteio:</b> <span className="raffle-code-small">{s.raffle_code || '—'}</span></p>
          <p><b>Telefone:</b> {s.phone || '—'}</p>
          <p><b>Data de nascimento:</b> {s.birth_date ? new Date(`${s.birth_date}T00:00:00`).toLocaleDateString('pt-BR') : '—'}</p>
          <p><b>Célula/Igreja:</b> {s.cell_name || s.leader_name || '—'}</p>
          <p><b>Quiz:</b> {s.quiz_title}</p>
          <p><b>Data:</b> {new Date(s.submitted_at).toLocaleString('pt-BR', { timeZone: 'America/Manaus' })}</p>
          <p><b>Uso interno autorizado:</b> {s.consent_given ? 'Sim' : 'Não'}</p>
          <p><b>Deseja contato:</b> {s.wants_follow_up ? 'Sim' : 'Não'}</p>
        </div>
        <div className="card">
          <h2>Resultado</h2>
          <p><b>Respostas corretas:</b> {s.correct_answers} de {s.total_scored_questions}</p>
          <p><b>Pedido de oração:</b><br />{s.prayer_request || 'Nenhum pedido informado.'}</p>
        </div>
      </section>

      <h2>Respostas</h2>
      {answers.map(a => (
        <div key={a.question_id} className={`answer ${a.is_correct ? 'correct' : 'wrong'}`}>
          <b>{a.prompt}</b>
          <p><strong>Resposta:</strong> {a.selected_options?.map((o: any) => o.label).join(', ') || a.text_answer || a.numeric_answer || 'Sem resposta'}</p>
          <p><strong>Correta:</strong> {a.correct_options?.map((o: any) => o.label).join(', ') || 'Não se aplica'}</p>
          <span className={`badge ${a.is_correct ? 'yes' : 'no'}`}>{a.is_correct ? 'Acertou' : 'Errou'}</span>
        </div>
      ))}
    </main></>
  )
}
