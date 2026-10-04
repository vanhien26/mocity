'use client'

import { useGameStore } from '@/lib/mocity2/store'
import type { EventChoice } from '@/lib/mocity2/types'

export default function EventModal() {
  const { pendingEvent, resolveEvent } = useGameStore()
  if (!pendingEvent) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center pb-4 px-4 bg-black/60">
      <div className="w-full max-w-md bg-gray-900 border border-gray-600 rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-white leading-tight">{pendingEvent.title}</h2>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed">{pendingEvent.body}</p>
        </div>

        {/* Choices */}
        <div className="px-4 pb-5 flex flex-col gap-2">
          {pendingEvent.choices.map((choice: EventChoice) => (
            <button
              key={choice.id}
              onClick={() => resolveEvent(choice)}
              className="w-full text-left px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-400 transition-colors"
            >
              <div className="text-sm font-semibold text-white">{choice.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{choice.description}</div>
              {choice.cashEffect !== 0 && (
                <div className={`text-xs font-bold mt-1 ${choice.cashEffect < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {choice.cashEffect > 0 ? '+' : ''}{(choice.cashEffect / 1_000_000).toFixed(1)}M đồng
                </div>
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
