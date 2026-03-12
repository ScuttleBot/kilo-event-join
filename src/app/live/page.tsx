'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import QRCode from 'react-qr-code'

type Event = { id: string; name: string; code: string }
type Attendee = { id: string; email: string; name: string | null; joined_at: string }
type ClawEntry = { id: string; x: number; y: number; rot: number; size: number; isNew: boolean }
type Toast = { id: string; name: string | null; email: string; exiting: boolean; left: number; top: number; delay: number }

function PotSVG() {
  return (
    <svg viewBox="0 0 320 280" className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
      <path
        d="M 40,60 L 20,250 Q 20,268 38,268 L 282,268 Q 300,268 300,250 L 280,60 Z"
        fill="none" stroke="rgba(103,232,249,0.55)" strokeWidth="4" strokeLinejoin="round"
      />
      <rect x="28" y="46" width="264" height="22" rx="11"
        fill="rgba(8,145,178,0.15)" stroke="rgba(103,232,249,0.7)" strokeWidth="3.5" />
      <path d="M 48,68 Q 2,68 2,108 Q 2,148 48,148"
        fill="none" stroke="rgba(103,232,249,0.6)" strokeWidth="4" strokeLinecap="round" />
      <path d="M 272,68 Q 318,68 318,108 Q 318,148 272,148"
        fill="none" stroke="rgba(103,232,249,0.6)" strokeWidth="4" strokeLinecap="round" />
      <path d="M 110,38 Q 116,26 110,14" fill="none" stroke="rgba(103,232,249,0.35)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M 160,34 Q 166,20 160,6"  fill="none" stroke="rgba(103,232,249,0.35)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M 210,38 Q 216,26 210,14" fill="none" stroke="rgba(103,232,249,0.35)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null
  const pieces = ['🎊', '⭐', '✨', '🎉', '💛', '🌟']
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden" style={{ zIndex: 50 }}>
      {pieces.map((p, i) => (
        <span key={i} className={`absolute text-2xl confetti-${i + 1}`}>{p}</span>
      ))}
    </div>
  )
}

function JoinToasts({ toasts }: { toasts: Toast[] }) {
  // Show at most 6 toasts at a time to avoid chaos
  const visible = toasts.slice(-6)
  return (
    <>
      {visible.map((t) => {
        const displayName = t.name || t.email.split('@')[0]
        return (
          <div key={t.id}
            className={`fixed pointer-events-none ${t.exiting ? 'toast-out' : 'toast-in'}`}
            style={{
              left: `${t.left}%`,
              top: `${t.top}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 100,
              animationDelay: t.exiting ? '0ms' : `${t.delay}ms`,
              opacity: 0,
            }}>
            <div className="flex items-center gap-2 px-5 py-3 rounded-full border border-cyan-400/50 shadow-2xl whitespace-nowrap"
              style={{ background: 'rgba(8,47,73,0.92)', backdropFilter: 'blur(14px)' }}>
              <span className="text-xl">🦞</span>
              <span className="text-white font-black text-xl">{displayName}</span>
              <span className="text-cyan-400 text-base">joined!</span>
            </div>
          </div>
        )
      })}
    </>
  )
}

function LivePageInner() {
  const searchParams = useSearchParams()
  const threshold = parseInt(searchParams.get('threshold') || '0')
  const presentview = searchParams.get('presentview')
  const eventIdParam = searchParams.get('event')

  const [event, setEvent] = useState<Event | null>(null)
  const [attendeeCount, setAttendeeCount] = useState(0)
  const [claws, setClaws] = useState<ClawEntry[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [error, setError] = useState<string | null>(null)
  const [joinUrl, setJoinUrl] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const knownIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = threshold > 0 ? `?threshold=${threshold}` : ''
      setJoinUrl(`${window.location.origin}/join${params}`)
    }
    const eventUrl = presentview === 'launch'
      ? '/api/event?presentview=launch'
      : eventIdParam ? `/api/event?event=${eventIdParam}` : '/api/event'
    fetch(eventUrl)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setEvent(data.event)
        setAttendeeCount(data.count)
        if (presentview === 'launch' && data.event?.id && typeof window !== 'undefined') {
          const nextParams = new URLSearchParams()
          nextParams.set('event', data.event.id)
          if (threshold > 0) nextParams.set('threshold', String(threshold))
          window.history.replaceState(null, '', `/live?${nextParams.toString()}`)
        }
      })
      .catch(() => setError('Failed to load event'))
  }, [])

  useEffect(() => {
    if (!event) return
    const interval = setInterval(() => {
      const activeEventId = event?.id || eventIdParam
      const attendeesUrl = activeEventId ? `/api/attendees?event=${activeEventId}` : '/api/attendees'
      fetch(attendeesUrl)
        .then(r => r.json())
        .then(data => {
          if (data.error) return
          setAttendeeCount(data.count)

          const newClaws: ClawEntry[] = []
          const newToasts: Toast[] = []

          for (const a of (data.recent as Attendee[])) {
            if (!knownIdsRef.current.has(a.id)) {
              knownIdsRef.current.add(a.id)
              newClaws.push({
                id: a.id,
                x: 8 + Math.random() * 72,
                y: 4 + Math.random() * 70,
                rot: -20 + Math.random() * 40,
                size: 28 + Math.random() * 20,
                isNew: true,
              })
              newToasts.push({
                id: a.id,
                name: a.name,
                email: a.email,
                exiting: false,
                left: 25 + Math.random() * 50,
                top: 30 + Math.random() * 40,
                delay: newToasts.length * 180,
              })
            }
          }

          if (newClaws.length > 0) {
            setClaws(prev => [...prev, ...newClaws].slice(-60))
            setTimeout(() => setClaws(prev => prev.map(c => ({ ...c, isNew: false }))), 750)
          }

          if (newToasts.length > 0) {
            setToasts(prev => [...prev, ...newToasts])
            // Exit timing accounts for stagger delay so each toast stays visible ~2.5s
            newToasts.forEach(t => {
              const appear = t.delay
              setTimeout(() => {
                setToasts(prev => prev.map(x => x.id === t.id ? { ...x, exiting: true } : x))
              }, appear + 2800)
              setTimeout(() => {
                setToasts(prev => prev.filter(x => x.id !== t.id))
              }, appear + 3200)
            })
          }

          if (threshold > 0 && data.count >= threshold && !unlocked) {
            setUnlocked(true)
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 2000)
          }
        })
    }, 2000)
    return () => clearInterval(interval)
  }, [event, threshold, unlocked])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0c1445 0%, #0e3460 40%, #0a5c7a 100%)' }}>
        <div className="text-red-400 text-xl bg-red-900/30 px-8 py-6 rounded-2xl border border-red-500/30">{error}</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0c1445 0%, #0e3460 40%, #0a5c7a 100%)' }}>
        <div className="text-cyan-200 text-xl bob">Loading...</div>
      </div>
    )
  }

  const offerUnlocked = unlocked || (threshold > 0 && attendeeCount >= threshold)

  return (
    <div className="min-h-screen flex flex-col p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0c1445 0%, #0e3460 30%, #0a5c7a 70%, #0e7490 100%)' }}>

      {/* Waves */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div className="wave-animate" style={{ display: 'flex', width: '200%', height: '100%' }}>
          {[0,1].map(i => (
            <svg key={i} viewBox="0 0 1200 80" preserveAspectRatio="none" style={{ width: '50%', height: '100%' }}>
              <path d="M0,40 C150,10 350,70 600,40 C850,10 1050,70 1200,40 L1200,80 L0,80 Z" fill="rgba(8,145,178,0.18)" />
            </svg>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div className="wave-animate-slow" style={{ display: 'flex', width: '200%', height: '100%' }}>
          {[0,1].map(i => (
            <svg key={i} viewBox="0 0 1200 60" preserveAspectRatio="none" style={{ width: '50%', height: '100%' }}>
              <path d="M0,30 C200,0 400,60 600,30 C800,0 1000,60 1200,30 L1200,60 L0,60 Z" fill="rgba(6,182,212,0.12)" />
            </svg>
          ))}
        </div>
      </div>

      <div className="relative flex flex-col flex-1" style={{ zIndex: 2 }}>

        {/* ====== TOP: Offer Banner (centered, big) ====== */}
        <div className="mb-6">
          <div className={`relative rounded-2xl px-10 py-5 border transition-all duration-700 text-center ${
            offerUnlocked ? 'offer-glow border-yellow-400/70' : 'border-cyan-500/30'
          }`}
            style={{
              background: offerUnlocked
                ? 'linear-gradient(135deg, rgba(120,53,15,0.7), rgba(92,40,10,0.8))'
                : 'rgba(8,47,73,0.7)',
              backdropFilter: 'blur(8px)',
            }}>
            <ConfettiBurst active={showConfetti} />

            <h1 className="text-2xl font-bold text-white mb-1">{event.name}</h1>

            <p className="text-cyan-300 text-xs font-semibold uppercase tracking-widest mb-1">🦞 KiloClaw Offer</p>

            <div key={offerUnlocked ? 'unlocked' : 'locked'} className={offerUnlocked ? 'offer-text-pop' : ''}>
              {offerUnlocked
                ? <p className="shimmer-text text-6xl font-black leading-tight">2 Months FREE</p>
                : <p className="text-6xl font-black text-white leading-tight">1 Month FREE</p>
              }
            </div>

            {threshold > 0 && (
              <p className="text-yellow-400/80 text-sm mt-1">
                {offerUnlocked
                  ? '🎊 Crowd deal unlocked!'
                  : `Get ${threshold} people to join — unlock 2 months FREE!`}
              </p>
            )}
          </div>
        </div>

        {/* ====== MAIN: Pot + QR side by side ====== */}
        <div className="flex flex-1 gap-6 min-h-0">

          {/* POT */}
          <div className="flex-1 flex items-center justify-center rounded-2xl border border-cyan-500/20 relative overflow-hidden"
            style={{ background: 'rgba(8,47,73,0.5)', backdropFilter: 'blur(8px)' }}>
            <div className="absolute pointer-events-none"
              style={{
                width: '70%', height: '70%', bottom: '5%', left: '15%',
                background: 'radial-gradient(ellipse at center bottom, rgba(8,145,178,0.3) 0%, transparent 70%)',
              }} />
            <div className="relative w-full h-full max-w-[600px] max-h-[600px] m-auto p-8">
              <div className="relative w-full h-full">
                <div className="absolute overflow-hidden"
                  style={{ top: '24%', left: '13%', right: '13%', bottom: '6%', zIndex: 5 }}>
                  {claws.map((c) => (
                    <span key={c.id}
                      className={c.isNew ? 'claw-drop' : ''}
                      style={{
                        position: 'absolute',
                        left: `${c.x}%`,
                        bottom: `${c.y}%`,
                        fontSize: `${c.size * 1.8}px`,
                        transform: `rotate(${c.rot}deg)`,
                        lineHeight: 1,
                      }}>
                      🦞
                    </span>
                  ))}
                </div>
                <PotSVG />
              </div>
            </div>
          </div>

          {/* QR */}
          <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-cyan-500/20 gap-6"
            style={{ background: 'rgba(8,47,73,0.5)', backdropFilter: 'blur(8px)' }}>
            <p className="text-cyan-300 text-lg font-semibold">Scan to join</p>
            <div className="bg-white p-5 rounded-2xl shadow-2xl">
              {joinUrl && <QRCode value={joinUrl} size={320} />}
            </div>
            <p className="text-cyan-500 text-sm font-mono">{joinUrl}</p>
            <p className="text-cyan-600 text-xs">
              Event Code: <span className="font-bold text-cyan-400">{event.code}</span>
            </p>
          </div>

        </div>
      </div>

      {/* ====== TOASTS: temporary join notifications ====== */}
      <JoinToasts toasts={toasts} />
    </div>
  )
}

export default function LivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0c1445 0%, #0e3460 40%, #0a5c7a 100%)' }}>
        <div className="text-cyan-200 text-xl">Loading...</div>
      </div>
    }>
      <LivePageInner />
    </Suspense>
  )
}
