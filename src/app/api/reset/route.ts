import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

async function getActiveEventId() {
  return supabaseServer
    .from('events')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const eventId = url.searchParams.get('event')
  const { data: event, error: eventError } = eventId
    ? await supabaseServer.from('events').select('id').eq('id', eventId).single()
    : await getActiveEventId()

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
