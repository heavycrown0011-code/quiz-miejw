import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  quizSlug: z.string().min(1).max(160),
  participant: z.object({
    full_name: z.string().min(2).max(80),
    birth_date: z.string().date(),
    phone: z.string().max(40).nullable().optional(),
    cell_name: z.string().max(120).nullable().optional(),
    leader_name: z.string().max(120).nullable().optional(),
    is_visitor: z.boolean().nullable().optional(),
    wants_follow_up: z.boolean().nullable().optional(),
    prayer_request: z.string().max(3000).nullable().optional(),
    consent_given: z.literal(true),
  }),
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    selected_option_ids: z.array(z.string().uuid()).max(20),
    text_answer: z.string().max(5000).nullable().optional(),
    numeric_answer: z.number().nullable().optional(),
  })).max(200),
  fingerprint: z.string().max(200).nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const birthDate = new Date(`${body.participant.birth_date}T00:00:00Z`)
    const today = new Date()
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear()
    const birthdayHasPassed = today.getUTCMonth() > birthDate.getUTCMonth() ||
      (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() >= birthDate.getUTCDate())
    if (!birthdayHasPassed) age--
    if (age < 5 || age > 120) {
      return Response.json({ message: 'Informe uma data de nascimento válida.' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('submit_quiz_public', {
      p_quiz_slug: body.quizSlug,
      p_participant: { ...body.participant, age },
      p_answers: body.answers,
      p_fingerprint: body.fingerprint,
    })

    if (error) {
      console.error('quiz_submit_error', error)
      return Response.json({ message: 'Não foi possível registrar sua participação. Tente novamente.' }, { status: 400 })
    }

    return Response.json(data)
  } catch (error) {
    console.error('quiz_submit_validation_error', error)
    return Response.json({ message: 'Dados inválidos. Revise as informações e tente novamente.' }, { status: 400 })
  }
}
