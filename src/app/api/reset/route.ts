import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const EVENT_CODE = 'KILO2024'

export async function POST() {
  const { data: event, error: eventError } = await supabaseServer
    .from('events')
    .select('id')
    .eq('code', EVENT_CODE)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const { error } = await supabaseServer
    .from('attendees')
    .delete()
    .eq('event_id', event.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to reset event' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
