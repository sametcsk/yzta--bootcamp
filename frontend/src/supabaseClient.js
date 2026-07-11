import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseAktif = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = supabaseAktif
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

if (!supabaseAktif) {
  console.warn("Supabase key'leri bulunamadı — login ve leaderboard devre dışı, oyun normal çalışıyor.")
}