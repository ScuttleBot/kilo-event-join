import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const DEFAULT_EVENT_NAME = 'Kilo Code Launch Event'
const CODE_PREFIX = 'KILO'

function buildEventCode() {
  const segment = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${CODE_PREFIX}${segment}`
}

async function createEvent(name: string) {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = buildEventCode()
    const { data: created, error } = await supabaseServer
      .from('events')
      .insert({ code, name, is_active: true })
      .select('*')
      .single()

    if (!error && created) return { event: created }
    if (error?.code !== '23505') {
      return { error }
    }
    lastError = error
  }
  return { error: lastError ?? new Error('Failed to generate unique event code') }
}

async function getActiveEvent() {
  return supabaseServer
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const presentview = url.searchParams.get('presentview')

  if (presentview === 'launch') {
    const { data: latest } = await getActiveEvent()
    const eventName = latest?.name ?? DEFAULT_EVENT_NAME

    const { error: deactivateError } = await supabaseServer
      .from('events')
      .update({ is_active: false })
      .eq('is_active', true)

    if (deactivateError) {
      return NextResponse.json({ error: 'Failed to start new event' }, { status: 500 })
    }

    const { event: created, error: createError } = await createEvent(eventName)
    if (createError || !created) {
      return NextResponse.json({ error: 'Failed to start new event' }, { status: 500 })
    }

    const { count } = await supabaseServer
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', created.id)

    return NextResponse.json({ event: created, count: count ?? 0 })
  }

  let { data: event, error: eventError } = await getActiveEvent()

  if (eventError || !event) {
    const { event: created, error: createError } = await createEvent(DEFAULT_EVENT_NAME)
    if (createError || !created) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    event = created
  }

  const { count } = await supabaseServer
    .from('attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)

  return NextResponse.json({ event, count: count ?? 0 })
}
