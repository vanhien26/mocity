'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/mocity2/store'
import { BUSINESS_DEFS, BUSINESS_BY_TYPE } from '@/lib/mocity2/constants'
import type { BusinessType } from '@/lib/mocity2/types'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  return `${(n / 1_000).toFixed(0)}K`
}

function OpenNewBusiness({ onClose }: { onClose: () => void }) {
  const { openBusiness, phase, businesses, maxPlots } = useGameStore()
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<BusinessType | null>(null)

  const availablePlot = Array.from({ length: maxPlots }).findIndex(
    (_, i) => !businesses.some(b => b.plotIndex === i)
  )

  const available = BUSINESS_DEFS.filter(d =>
    phase === 'act1' ? d.availableFromAct === 'act1' :
    phase === 'act2' ? ['act1', 'act2'].includes(d.availableFromAct) :
    true
  )

  function handleOpen() {
    if (!selected || availablePlot < 0) return
    const err = openBusiness(selected, availablePlot)
    if (err) { setError(err); return }
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-bold text-white">Chọn loại hình kinh doanh</h3>
        <p className="text-xs text-gray-400 mt-1">
          Ô đất #{availablePlot + 1} đang trống
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {available.map(def => (
          <button
            key={def.type}
            onClick={() => setSelected(def.type)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${
              selected === def.type
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-gray-600 bg-gray-800 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{def.emoji}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{def.name}</div>
                  <div className="text-[11px] text-gray-400">{def.description}</div>
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-3 text-[11px]">
              <span className="text-red-400">Mở: {fmt(def.openCost + def.depositRent)}đ</span>
              <span className="text-green-400">DT/ngày: ~{fmt(def.baseDailyRevenue)}đ</span>
              <span className="text-orange-400">Chi phí: {fmt(def.dailyRent + def.dailyUtility)}đ</span>
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>}

      <button
        disabled={!selected || availablePlot < 0}
        onClick={handleOpen}
        className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Mở tiệm
      </button>
    </div>
  )
}

function ManageBusiness({ businessId, onClose }: { businessId: string; onClose: () => void }) {
  const { businesses, hireStaff, restockInventory, openModal } = useGameStore()
  const biz = businesses.find(b => b.id === businessId)
  const [hireError, setHireError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'staff' | 'restock'>('overview')

  if (!biz) return null
  const def = BUSINESS_BY_TYPE[biz.type]

  function handleHire() {
    const err = hireStaff(businessId)
    if (err) setHireError(err)
  }

  const profitPerDay = biz.baseDailyRevenue * (1 + biz.staffCount * 0.25)
    - def.dailyRent - def.dailyUtility - biz.staffCount * 300_000

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{def.emoji}</span>
        <div>
          <h3 className="text-base font-bold text-white">{biz.name}</h3>
          <p className="text-xs text-gray-400">Cấp {biz.level} · {biz.staffCount} nhân viên · Ngày {biz.openedOnDay}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-800 p-1 rounded-xl">
        {(['overview', 'staff', 'restock'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t === 'overview' ? '📊 Tổng quan' : t === 'staff' ? '👥 Nhân viên' : '📦 Nhập hàng'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Doanh thu / ngày', value: fmt(biz.baseDailyRevenue * (1 + biz.staffCount * 0.25)) + 'đ', color: 'text-green-400' },
              { label: 'Chi phí / ngày', value: fmt(def.dailyRent + def.dailyUtility + biz.staffCount * 300_000) + 'đ', color: 'text-red-400' },
              { label: 'Lợi nhuận / ngày', value: fmt(profitPerDay) + 'đ', color: profitPerDay >= 0 ? 'text-green-300' : 'text-red-300' },
              { label: 'Hàng tồn kho', value: biz.inventory.reduce((s, i) => s + i.quantity, 0) + ' đv', color: 'text-yellow-400' },
            ].map(item => (
              <div key={item.label} className="bg-gray-800 rounded-xl p-3">
                <div className="text-[10px] text-gray-400">{item.label}</div>
                <div className={`text-sm font-bold mt-0.5 ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-sm text-gray-300">
              Hiện tại: <span className="text-white font-bold">{biz.staffCount}/3 nhân viên</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Mỗi nhân viên: +25% doanh thu, tốn 300K/ngày lương
            </div>
            {biz.staffCount > 0 && (
              <div className="flex gap-1 mt-2">
                {'👤'.repeat(biz.staffCount).split('').map((e, i) => (
                  <span key={i} className="text-xl">{e}</span>
                ))}
              </div>
            )}
          </div>
          {hireError && <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{hireError}</p>}
          <button
            onClick={handleHire}
            disabled={biz.staffCount >= 3}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-bold text-sm transition-colors"
          >
            {biz.staffCount < 3
              ? `Thuê nhân viên thứ ${biz.staffCount + 1} (${fmt(2_000_000 * (biz.staffCount + 1))}đ)`
              : 'Đã đủ nhân viên'}
          </button>
        </div>
      )}

      {tab === 'restock' && (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-sm text-gray-300">Nhập hàng tươi (50K/đv)</div>
            <div className="text-xs text-gray-400 mt-1">
              {def.type === 'banh-mi' ? 'Bánh mì thiu sau 1 ngày nếu không bán hết!' :
               def.type === 'ca-phe-coc' ? 'Nguyên liệu cà phê dùng được 3 ngày.' :
               'Hàng không hết hạn nếu nhập đúng lượng.'}
            </div>
          </div>
          {[10, 20, 50].map(qty => (
            <button
              key={qty}
              onClick={() => restockInventory(biz.id, qty)}
              className="w-full py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
            >
              Nhập {qty} đơn vị — {fmt(qty * 50_000)}đ
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BusinessModal() {
  const { activeModal, selectedBusinessId, closeModal } = useGameStore()
  const isOpen = activeModal === 'business'
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pb-4 px-4">
      <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-600 rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-white">
            {selectedBusinessId ? 'Quản lý cửa hàng' : 'Mở tiệm mới'}
          </span>
          <button onClick={closeModal} className="text-gray-400 hover:text-white text-lg w-7 h-7 flex items-center justify-center">✕</button>
        </div>
        <div className="px-5 py-4">
          {selectedBusinessId
            ? <ManageBusiness businessId={selectedBusinessId} onClose={closeModal} />
            : <OpenNewBusiness onClose={closeModal} />
          }
        </div>
      </div>
    </div>
  )
}
