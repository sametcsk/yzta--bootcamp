import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyrmcbtbwutwsiaqqokl.supabase.co'
const supabaseKey = 'sb_publishable_OtYXRZ8c5mV3tFsESj9Cig_gkMoFz-S'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('runs').select('id, display_name, net_worth').order('net_worth', { ascending: false }).limit(5)
  console.log(data)
}
run()
