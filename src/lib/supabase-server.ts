import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey)

export type Event = {
  id: string
  code: string
  name: string
  is_active: boolean
  created_at: string
}

export type Attendee = {
  id: string
  event_id: string
  email: string
  name: string | null
  joined_at: string
}
