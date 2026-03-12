import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const EVENT_CODE = 'KILO2024'

export async function GET() {
  const { data: event, error: eventError } = await supabaseServer
    .from('events')
    .select('*')
    .eq('code', EVENT_CODE)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const { count } = await supabaseServer
    .from('attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)

  return NextResponse.json({ event, count: count ?? 0 })
}
