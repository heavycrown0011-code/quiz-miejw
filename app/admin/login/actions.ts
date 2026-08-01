'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ADMIN_LOGIN_EMAIL = 'heavycrown0011@gmail.com'

export async function login(formData: FormData) {
  const password = String(formData.get('password') ?? '')

  if (password.length < 6) redirect('/admin/login?error=invalid')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_LOGIN_EMAIL,
    password,
  })
  if (error || !data.user) redirect('/admin/login?error=invalid')

  const { data: admin } = await supabase
    .from('admin_profiles')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()

  if (!admin) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=forbidden')
  }

  redirect('/admin')
}
