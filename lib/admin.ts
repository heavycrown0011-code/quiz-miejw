import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: claimsData, error } = await supabase.auth.getClaims()
  const uid = claimsData?.claims?.sub as string | undefined

  if (error || !claimsData || !uid) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('user_id,full_name')
    .eq('user_id', uid)
    .maybeSingle()

  if (!profile) redirect('/admin/login?error=forbidden')
  return { supabase, profile, claims: claimsData.claims }
}
