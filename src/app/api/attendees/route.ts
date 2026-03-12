import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const EVENT_CODE = 'KILO2024'

// GET /api/attendees - returns recent attendees + count
export async function GET() {
  const { data: event, error: eventError } = await supabaseServer
    .from('events')
    .select('id')
    .eq('code', EVENT_CODE)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const { count } = await supabaseServer
    .from('attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)

  const { data: recent } = await supabaseServer
    .from('attendees')
    .select('*')
    .eq('event_id', event.id)
    .order('joined_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ count: count ?? 0, recent: recent ?? [] })
}

// POST /api/attendees - join an event
export async function POST(req: NextRequest) {
  const { email, name } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const { data: event, error: eventError } = await supabaseServer
    .from('events')
    .select('id')
    .eq('code', EVENT_CODE)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const { error: insertError } = await supabaseServer
    .from('attendees')
    .insert({ event_id: event.id, email: email.trim(), name: name?.trim() || null })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'You have already joined this event!' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to join. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
