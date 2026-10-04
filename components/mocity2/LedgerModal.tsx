'use client'

import { useGameStore, selectDebtRemaining, selectDailyCashflow } from '@/lib/mocity2/store'
import type { LedgerEntry } from '@/lib/mocity2/types'

function fmt(n: number) {
  const abs = Math.abs(n)
  const sign = n >= 0 ? '+' : '-'
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K`
  return `${sign}${abs.toLocaleString('vi-VN')}`
}

const CAT_LABEL: Record<LedgerEntry['category'], string> = {
  revenue: 'Doanh thu',
  cogs: 'Giá vốn',
  rent: 'Chi phí vận hành',
  staff: 'Lương nhân viên',
  debt: 'Nợ / Lãi',
  tax: 'Thuế',
  misc: 'Khác',
}

const CAT_COLOR: Record<LedgerEntry['category'], string> = {
  revenue: 'text-green-400',
  cogs: 'text-orange-400',
  rent: 'text-red-400',
  staff: 'text-yellow-400',
  debt: 'text-red-500',
  tax: 'text-purple-400',
  misc: 'text-gray-400',
}

export default function LedgerModal() {
  const { activeModal, closeModal, ledger, totalRevenue, totalExpenses, cash, day } = useGameStore()
  const debtRemaining = useGameStore(selectDebtRemaining)
  const dailyCashflow = useGameStore(selectDailyCashflow)

  if (activeModal !== 'ledger') return null

  const netProfit = totalRevenue - totalExpenses
  const recent = [...ledger].reverse().slice(0, 40)

  // Group by category for summary
  const byCategory = ledger.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pb-2 px-3">
      <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <span className="text-sm font-bold text-white">📒 Sổ Cái</span>
            <span className="text-xs text-gray-400 ml-2">Ngày {day}</span>
          </div>
          <button onClick={closeModal} className="text-gray-400 hover:text-white w-7 h-7 flex items-center justify-center">✕</button>
        </div>

        <div className="overflow-y-auto flex-1">

          {/* P&L Summary */}
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Tổng kết từ đầu</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-400">Doanh thu</div>
                <div className="text-sm font-bold text-green-400">{fmt(totalRevenue)}đ</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-400">Chi phí</div>
                <div className="text-sm font-bold text-red-400">{fmt(-totalExpenses)}đ</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-400">Lãi ròng</div>
                <div className={`text-sm font-bold ${netProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {fmt(netProfit)}đ
                </div>
              </div>
            </div>
          </div>

          {/* Daily cashflow */}
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Tình hình hiện tại</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 rounded-xl p-3">
                <div className="text-[10px] text-gray-400">Tiền mặt</div>
                <div className={`text-sm font-bold ${cash < 5_000_000 ? 'text-red-400' : 'text-white'}`}>
                  {(cash / 1_000_000).toFixed(1)}Mđ
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <div className="text-[10px] text-gray-400">Dòng tiền/ngày</div>
                <div className={`text-sm font-bold ${dailyCashflow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmt(dailyCashflow)}đ
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <div className="text-[10px] text-gray-400">Nợ còn lại</div>
                <div className={`text-sm font-bold ${debtRemaining > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  {debtRemaining > 0 ? `${(debtRemaining / 1_000_000).toFixed(0)}Mđ` : '✓ Sạch nợ'}
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <div className="text-[10px] text-gray-400">Tài sản ròng</div>
                <div className={`text-sm font-bold ${cash - debtRemaining >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {fmt(cash - debtRemaining)}đ
                </div>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          {Object.keys(byCategory).length > 0 && (
            <div className="px-4 py-3 border-b border-gray-800">
              <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Phân loại chi tiết</div>
              <div className="flex flex-col gap-1.5">
                {Object.entries(byCategory).map(([cat, total]) => (
                  <div key={cat} className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-300">{CAT_LABEL[cat as LedgerEntry['category']] ?? cat}</span>
                    <span className={`text-xs font-bold ${CAT_COLOR[cat as LedgerEntry['category']] ?? 'text-gray-400'}`}>
                      {fmt(total)}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent transactions */}
          <div className="px-4 py-3">
            <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Giao dịch gần đây</div>
            {recent.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Chưa có giao dịch nào.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {recent.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-200 truncate">{e.label}</div>
                      <div className="text-[10px] text-gray-500">Ngày {e.day}</div>
                    </div>
                    <span className={`text-xs font-bold ml-3 shrink-0 ${e.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmt(e.amount)}đ
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
