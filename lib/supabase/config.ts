const fallbackUrl = 'https://eefftlstvynzxrlrarwr.supabase.co'
const fallbackPublishableKey = 'sb_publishable_5gBhP_lGqQNGon05CTLjIQ_KL_ie-4a'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || fallbackPublishableKey
