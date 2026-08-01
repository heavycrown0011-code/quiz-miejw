import { notFound } from 'next/navigation'
import QuizExperience from '@/components/QuizExperience'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: quiz, error } = await supabase.rpc('get_public_quiz', { p_slug: 'quiz-biblico' })
  if (error) console.error('public_quiz_error', error)
  if (!quiz) notFound()
  return <QuizExperience quiz={quiz} />
}
