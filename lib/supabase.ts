import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jthqqazzjdwzcgxxuavu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aHFxYXp6amR3emNneHh1YXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODQzMDgsImV4cCI6MjA2ODY2MDMwOH0.tYovz_Lbwj8LA2mNuAqiScmdDDpfT562THO9XLD40wI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)