'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  const router = useRouter()
  const [showThreshold, setShowThreshold] = useState(false)
  const [threshold, setThreshold] = useState('')

  async function handlePresenterGo() {
    const n = parseInt(threshold)
    if (!threshold || isNaN(n) || n < 1) return
    await fetch('/api/reset', { method: 'POST' })
    router.push(`/live?threshold=${n}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0c1445 0%, #0e3460 30%, #0a5c7a 60%, #0891b2 100%)' }}>

      {/* Bubbles */}
      {[...Array(12)].map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-10 bg-cyan-300 pointer-events-none"
          style={{
            width: `${8 + (i * 7) % 24}px`,
            height: `${8 + (i * 7) % 24}px`,
            left: `${(i * 83 + 5) % 95}%`,
            bottom: `${(i * 61) % 80}%`,
            animation: `bob ${2.5 + (i % 4) * 0.7}s ease-in-out infinite`,
            animationDelay: `${(i * 0.4) % 2.5}s`,
          }} />
      ))}

      <Card className="w-full max-w-md relative z-10 border-cyan-500/30 shadow-2xl"
        style={{ background: 'rgba(8, 47, 73, 0.85)', backdropFilter: 'blur(12px)' }}>
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-2">🦞</div>
          <CardTitle className="text-3xl font-bold text-white">KiloClaw</CardTitle>
          <CardDescription className="text-cyan-200 text-base">
            Realtime event participation — ocean style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <Link href="/join" className="block">
            <Button className="w-full text-base font-semibold h-12 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)', border: '1px solid rgba(103,232,249,0.3)' }}
              size="lg">
              🌊 Join an Event
            </Button>
          </Link>

          {!showThreshold ? (
            <Button
              className="w-full text-base font-semibold h-12 cursor-pointer"
              style={{ background: 'transparent', border: '1px solid rgba(103,232,249,0.4)', color: '#67e8f9' }}
              size="lg"
              onClick={() => setShowThreshold(true)}>
              📊 Presenter View
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-xl border border-cyan-500/30"
              style={{ background: 'rgba(8, 145, 178, 0.15)' }}>
              <Label className="text-cyan-200 text-sm font-medium">
                Set your KiloClaw threshold
              </Label>
              <p className="text-cyan-400 text-xs">
                When this many people join, the offer upgrades from 1 month FREE → 2 months FREE
              </p>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePresenterGo()}
                className="bg-cyan-950/50 border-cyan-600/50 text-white placeholder:text-cyan-600 text-lg text-center font-bold h-12"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 text-cyan-400 border border-cyan-700/40 cursor-pointer"
                  onClick={() => setShowThreshold(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 font-bold cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)' }}
                  onClick={handlePresenterGo}
                  disabled={!threshold || isNaN(parseInt(threshold)) || parseInt(threshold) < 1}>
                  Launch 🚀
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
