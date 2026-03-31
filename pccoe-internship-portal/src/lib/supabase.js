import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    "CRITICAL ERROR: Supabase environment variables are missing! " +
    "You must add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel/Local .env configuration."
  )
}

// Fallback safely to prevent app crashing immediately on import, but auth will be disabled
export const supabase = createClient(
  supabaseUrl || 'https://configure-your-env-vars.supabase.co', 
  supabaseAnonKey || 'missing-key'
)
