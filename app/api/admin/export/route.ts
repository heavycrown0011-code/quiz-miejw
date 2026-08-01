import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csv(value: unknown) {
  const text = String(value ?? '')
  return '"' + text.replaceAll('"', '""') + '"'
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const uid = claims?.claims?.sub as string | undefined
  if (!uid) return new Response('Não autorizado', { status: 401 })

  const { data: admin } = await supabase.from('admin_profiles').select('user_id').eq('user_id', uid).maybeSingle()
  if (!admin) return new Response('Não autorizado', { status: 403 })

  const url = new URL(req.url)
  const { data, error } = await supabase.rpc('admin_list_submissions', {
    p_search: url.searchParams.get('search'),
    p_quiz_id: url.searchParams.get('quiz'),
    p_date_from: url.searchParams.get('from'),
    p_date_to: url.searchParams.get('to'),
    p_page: 1,
    p_page_size: 1000,
  })

  if (error) {
    console.error('csv_export_error', error)
    return new Response('Falha ao exportar', { status: 500 })
  }

  const rows: any[] = data.rows || []
  const header = ['Nome','Telefone','Data de nascimento','Célula/Igreja','Quiz','Pontuação','Máximo','Acertos','Total de perguntas','Pedido de oração','Deseja acompanhamento','Autorização','Data']
  const lines = [
    header.map(csv).join(','),
    ...rows.map(r => [r.participant_name,r.phone,r.birth_date,r.cell_name || r.leader_name,r.quiz_title,r.score,r.max_score,r.correct_answers,r.total_scored_questions,r.prayer_request,r.wants_follow_up ? 'Sim' : 'Não',r.consent_given ? 'Sim' : 'Não',r.submitted_at].map(csv).join(',')),
  ]

  return new Response('\ufeff' + lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="participacoes-quiz.csv"',
    },
  })
}
