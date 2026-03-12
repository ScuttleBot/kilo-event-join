'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Event = { id: string; name: string; code: string }

function JoinPageInner() {
  const searchParams = useSearchParams()
  const threshold = parseInt(searchParams.get('threshold') || '0')
  const eventIdParam = searchParams.get('event')

  const [event, setEvent] = useState<Event | null>(null)
  const [count, setCount] = useState(0)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offerUnlocked, setOfferUnlocked] = useState(false)
  const [offerJustUnlocked, setOfferJustUnlocked] = useState(false)

  useEffect(() => {
    const eventUrl = eventIdParam ? `/api/event?event=${eventIdParam}` : '/api/event'
    fetch(eventUrl)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setEvent(data.event)
        const initialCount = data.count
        setCount(initialCount)
        if (threshold > 0 && initialCount >= threshold) setOfferUnlocked(true)
      })
      .catch(() => setError('Failed to load event'))
  }, [threshold])

  // Poll count every 2 seconds to update offer live
  useEffect(() => {
    if (!event || threshold <= 0) return
    const interval = setInterval(() => {
      const eventUrl = eventIdParam ? `/api/event?event=${eventIdParam}` : '/api/event'
      fetch(eventUrl)
        .then(r => r.json())
        .then(data => {
          if (data.error) return
          const newCount = data.count
          setCount(newCount)
          if (!offerUnlocked && newCount >= threshold) {
            setOfferUnlocked(true)
            setOfferJustUnlocked(true)
            setTimeout(() => setOfferJustUnlocked(false), 2500)
          }
        })
    }, 2000)
    return () => clearInterval(interval)
  }, [event, threshold, offerUnlocked])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const res = await fetch('/api/attendees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, eventId: event?.id || eventIdParam }),
    })
    const data = await res.json()
    setIsSubmitting(false)
    if (!res.ok) { setError(data.error || 'Failed to join. Please try again.'); return }
    setHasJoined(true)
  }

  const bgStyle = { background: 'linear-gradient(180deg, #0c1445 0%, #0e3460 35%, #0a5c7a 70%, #0891b2 100%)' }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
        <div className="text-red-300 bg-red-900/30 border border-red-500/40 rounded-2xl px-8 py-6 text-center">
          <div className="text-3xl mb-2">🚫</div>
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <div className="text-cyan-300 text-lg bob">🌊 Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={bgStyle}>

      {/* Bubbles */}
      {[...Array(10)].map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: `${6 + (i * 9) % 20}px`,
            height: `${6 + (i * 9) % 20}px`,
            left: `${(i * 91 + 3) % 92}%`,
            bottom: `${(i * 67 + 5) % 85}%`,
            background: 'rgba(103,232,249,0.12)',
            animation: `bob ${2 + (i % 5) * 0.6}s ease-in-out infinite`,
            animationDelay: `${(i * 0.35) % 2}s`,
          }} />
      ))}

      {/* Wave at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden pointer-events-none">
        <div className="wave-animate" style={{ display: 'flex', width: '200%', height: '100%' }}>
          {[0, 1].map(i => (
            <svg key={i} viewBox="0 0 1200 70" preserveAspectRatio="none" style={{ width: '50%', height: '100%' }}>
              <path d="M0,35 C150,5 350,65 600,35 C850,5 1050,65 1200,35 L1200,70 L0,70 Z" fill="rgba(8,145,178,0.2)" />
            </svg>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 bob inline-block">🦞</div>
          <h1 className="text-3xl font-black text-white">{event.name}</h1>
          <p className="text-cyan-300 text-sm mt-1">Throw your claw in the pot!</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden"
          style={{ background: 'rgba(8,47,73,0.85)', backdropFilter: 'blur(12px)' }}>

          {hasJoined ? (
            <div className="relative text-center py-10 px-6 overflow-hidden">

              {/* Full-screen flash overlay when offer unlocks */}
              {offerJustUnlocked && (
                <div className="unlock-flash absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.35) 0%, transparent 70%)', zIndex: 20 }} />
              )}

              <div className="text-6xl mb-3">🎉</div>
              <h3 className="text-xl font-black text-white mb-1">You&apos;re in!</h3>
              <p className="text-cyan-400 text-sm mb-6">Welcome to {event.name}</p>

              {/* Live offer card */}
              <div className={`relative px-4 py-5 rounded-2xl border transition-all duration-700 ${
                offerUnlocked ? 'offer-glow border-yellow-400/70' : 'border-yellow-500/40'
              }`} style={{
                background: offerUnlocked
                  ? 'linear-gradient(135deg, rgba(120,53,15,0.7), rgba(92,40,10,0.85))'
                  : 'rgba(92,53,10,0.35)',
              }}>
                <p className="text-yellow-300/80 text-xs font-semibold uppercase tracking-widest mb-2">
                  🦞 KiloClaw Offer
                </p>

                {offerUnlocked ? (
                  <div key="unlocked" className={offerJustUnlocked ? 'unlock-bounce' : ''}>
                    <p className="shimmer-text text-5xl font-black leading-tight">2 Months</p>
                    <p className="shimmer-text text-5xl font-black leading-tight">FREE</p>
                    <p className="text-yellow-400 text-sm mt-3 font-semibold">
                      🎊 The crowd unlocked this deal!
                    </p>
                  </div>
                ) : (
                  <div key="locked">
                    <p className="text-white text-5xl font-black leading-tight">1 Month</p>
                    <p className="text-white text-5xl font-black leading-tight">FREE</p>
                    {threshold > 0 && (
                      <p className="text-yellow-600 text-xs mt-3">
                        Stay on this page — deal upgrades live when enough people join!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-cyan-200 text-sm font-semibold">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-12 text-base bg-cyan-950/60 border-cyan-600/50 text-white placeholder:text-cyan-700 focus:border-cyan-400 focus:ring-cyan-400/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-cyan-200 text-sm font-semibold">
                  Name <span className="text-cyan-600 font-normal">(optional)</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-12 text-base bg-cyan-950/60 border-cyan-600/50 text-white placeholder:text-cyan-700 focus:border-cyan-400 focus:ring-cyan-400/20"
                />
              </div>
              {error && (
                <p className="text-red-300 text-sm bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-bold cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)', border: '1px solid rgba(103,232,249,0.3)' }}>
                {isSubmitting ? '🌊 Joining...' : '🦞 Throw My Claw In!'}
              </Button>

              {/* Offer teaser — updates live */}
              <div key={offerUnlocked ? 'unlocked' : 'locked'}
                className={`text-center pt-1 ${offerJustUnlocked ? 'unlock-bounce' : ''}`}>
                {offerUnlocked
                  ? <p className="shimmer-text text-lg font-black">🦞 2 Months FREE — join now!</p>
                  : <p className="text-cyan-500 text-xs">
                      🦞 KiloClaw Offer — join to claim <span className="text-yellow-400 font-bold">1 month FREE</span>
                    </p>
                }
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0c1445 0%, #0e3460 35%, #0a5c7a 70%, #0891b2 100%)' }}>
        <div className="text-cyan-300 text-lg">🌊 Loading...</div>
      </div>
    }>
      <JoinPageInner />
    </Suspense>
  )
}
