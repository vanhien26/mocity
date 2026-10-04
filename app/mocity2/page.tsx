'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/mocity2/store'
import HUD from '@/components/mocity2/HUD'
import StreetView from '@/components/mocity2/StreetView'
import BusinessModal from '@/components/mocity2/BusinessModal'
import EventModal from '@/components/mocity2/EventModal'
import IntroScreen from '@/components/mocity2/IntroScreen'

export default function MoCity2Page() {
  const { phase, isPaused, pendingEvent, realTickMs, tick, openModal } = useGameStore()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Game loop
  useEffect(() => {
    if (phase === 'intro' || phase === 'ending') return
    if (tickRef.current) clearInterval(tickRef.current)
    if (isPaused || pendingEvent) return

    tickRef.current = setInterval(() => {
      tick()
    }, realTickMs)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [phase, isPaused, pendingEvent, realTickMs, tick])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Intro overlay */}
      <IntroScreen />

      {/* HUD */}
      {phase !== 'intro' && <HUD />}

      {/* Main content */}
      {phase !== 'intro' && (
        <main className="flex-1 flex flex-col pt-[56px] pb-24">
          <StreetView />

          {/* Ledger summary teaser */}
          {phase !== 'ending' && (
            <div className="px-4 mt-4 max-w-md mx-auto w-full">
              <button
                onClick={() => openModal('ledger')}
                className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-500 text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <span>📒</span> Sổ Cái thu chi
              </button>
            </div>
          )}
        </main>
      )}

      {/* Bottom action bar */}
      {phase !== 'intro' && phase !== 'ending' && (
        <div className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-gray-700 px-4 py-3">
          <div className="max-w-md mx-auto flex gap-3">
            <button
              onClick={() => openModal('business')}
              className="flex-1 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm transition-colors"
            >
              🏪 Mở tiệm mới
            </button>
            <button
              onClick={() => openModal('debt')}
              className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
            >
              💳 Quản lý nợ
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BusinessModal />
      <EventModal />

    </div>
  )
}
