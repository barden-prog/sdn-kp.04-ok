import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ozvhbaychsopmbamnxyh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dmhiYXljaHNvcG1iYW1ueHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTA3MjQsImV4cCI6MjA5NDc4NjcyNH0.3sGMG8az2kikmp2_CaxQnL0NZ77QseFfl3tOj_AZO98'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key. Please check your configuration.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
