import { notFound } from 'next/navigation'
import QuizExperience from '@/components/QuizExperience'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: quiz, error } = await supabase.rpc('get_public_quiz', { p_slug: slug })

  if (error) console.error('public_quiz_error', error)
  if (!quiz) notFound()

  return <QuizExperience quiz={quiz} />
}
