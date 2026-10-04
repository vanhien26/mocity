'use client'

import { useGameStore } from '@/lib/mocity2/store'
import { BUSINESS_BY_TYPE, BUSINESS_DEFS } from '@/lib/mocity2/constants'
import type { BusinessType } from '@/lib/mocity2/types'

const PLOT_COUNT = 3

// Màu sắc theo loại business
const SHOP_COLORS: Record<BusinessType, { bg: string; border: string; text: string }> = {
  'ca-phe-coc':     { bg: '#4A2C17', border: '#8B5E3C', text: '#F5CBA7' },
  'banh-mi':        { bg: '#5C3A1E', border: '#C47A3A', text: '#FAD7A0' },
  'quan-an':        { bg: '#1A3A2A', border: '#2ECC71', text: '#A9DFBF' },
  'shop-thoi-trang':{ bg: '#2C1A3A', border: '#9B59B6', text: '#D7BDE2' },
  'tiem-giat':      { bg: '#1A2A3A', border: '#3498DB', text: '#AED6F1' },
  'tiem-thuoc':     { bg: '#1A3A3A', border: '#1ABC9C', text: '#A2D9CE' },
}

function ShopPlot({ plotIndex }: { plotIndex: number }) {
  const { businesses, maxPlots, openModal, phase } = useGameStore()
  const biz = businesses.find(b => b.plotIndex === plotIndex)
  const isLocked = plotIndex >= maxPlots

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center w-[110px] h-[140px] rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/50">
        <span className="text-2xl opacity-30">🔒</span>
        <span className="text-[10px] text-gray-600 mt-1 text-center px-1">Mở khóa<br/>ở Màn tiếp</span>
      </div>
    )
  }

  if (!biz) {
    return (
      <button
        onClick={() => openModal('business')}
        className="flex flex-col items-center justify-center w-[110px] h-[140px] rounded-2xl border-2 border-dashed border-gray-600 hover:border-yellow-400 bg-gray-800/60 hover:bg-gray-700/60 transition-all group"
      >
        <span className="text-3xl group-hover:scale-110 transition-transform">🏗️</span>
        <span className="text-[11px] text-gray-400 group-hover:text-yellow-300 mt-2 font-medium">Mở tiệm</span>
      </button>
    )
  }

  const colors = SHOP_COLORS[biz.type] ?? SHOP_COLORS['ca-phe-coc']
  const def = BUSINESS_BY_TYPE[biz.type]

  return (
    <button
      onClick={() => openModal('business', biz.id)}
      className="flex flex-col items-center justify-between w-[110px] h-[140px] rounded-2xl border-2 transition-all hover:scale-105"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      {/* Storefront header */}
      <div className="w-full rounded-t-xl px-2 py-1.5 text-center"
        style={{ backgroundColor: colors.border + '40' }}>
        <span className="text-[10px] font-bold" style={{ color: colors.text }}>{biz.name}</span>
      </div>

      {/* Emoji icon */}
      <span className="text-4xl">{def?.emoji ?? '🏪'}</span>

      {/* Staff & level indicators */}
      <div className="w-full px-2 pb-2 flex items-center justify-between">
        <span className="text-[9px]" style={{ color: colors.text }}>
          Lv.{biz.level}
        </span>
        <span className="text-[9px]" style={{ color: colors.text }}>
          {'👤'.repeat(biz.staffCount) || '—'}
        </span>
      </div>
    </button>
  )
}

export default function StreetView() {
  const { phase, day } = useGameStore()

  return (
    <div className="flex flex-col items-center w-full px-4 pt-2">

      {/* Sky / atmosphere */}
      <div className="w-full max-w-md h-16 rounded-t-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 60%, #2a1a0a 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center gap-8 opacity-40">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-0.5 h-8 bg-yellow-300/60 rounded-full"
              style={{ transform: `translateY(${i % 2 === 0 ? -4 : 4}px)` }} />
          ))}
        </div>
        <div className="absolute bottom-2 left-4 text-[10px] text-yellow-200/60">
          Thành phố • Ngày {day}
        </div>
      </div>

      {/* Street + shops */}
      <div className="w-full max-w-md bg-gray-800 border-x border-gray-600 px-4 py-6">
        <div className="flex items-end justify-center gap-3">
          {Array.from({ length: PLOT_COUNT }).map((_, i) => (
            <ShopPlot key={i} plotIndex={i} />
          ))}
        </div>
      </div>

      {/* Sidewalk */}
      <div className="w-full max-w-md h-6 bg-gray-600 border-x border-b border-gray-500 rounded-b-lg flex items-center px-4">
        <div className="flex gap-8 opacity-30">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-6 h-1 bg-gray-300 rounded" />
          ))}
        </div>
      </div>

    </div>
  )
}
