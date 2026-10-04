'use client'

import { useGameStore, selectDebtRemaining, selectDailyCashflow } from '@/lib/mocity2/store'

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString('vi-VN')
}

export default function HUD() {
  const { cash, debt, day, phase, isPaused, pauseToggle } = useGameStore()
  const debtRemaining = useGameStore(selectDebtRemaining)
  const dailyCashflow = useGameStore(selectDailyCashflow)
  const daysToPayment = debt.nextPaymentDay - day

  const phaseLabel: Record<string, string> = {
    act1: 'Màn 1 · Góc Hẻm Cụt',
    act2: 'Màn 2 · Mặt Tiền Phố Lớn',
    act3: 'Màn 3 · Ngày Phán Xét',
    act4: 'Màn 4 · Endgame',
    ending: 'Kết Thúc',
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between max-w-lg mx-auto gap-3">

        {/* Ngày + Phase */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-gray-400 leading-none">Ngày {day}</span>
          <span className="text-xs text-yellow-300 font-medium truncate">{phaseLabel[phase] ?? phase}</span>
        </div>

        {/* Tiền mặt */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 leading-none">Tiền mặt</span>
          <span className={`text-sm font-bold ${cash < 5_000_000 ? 'text-red-400' : 'text-green-400'}`}>
            {fmt(cash)}đ
          </span>
        </div>

        {/* Dòng tiền / ngày */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 leading-none">Cashflow/ngày</span>
          <span className={`text-sm font-bold ${dailyCashflow >= 0 ? 'text-green-300' : 'text-red-400'}`}>
            {dailyCashflow >= 0 ? '+' : ''}{fmt(dailyCashflow)}đ
          </span>
        </div>

        {/* Nợ */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 leading-none">Nợ còn</span>
          <span className={`text-sm font-bold ${debtRemaining > 0 ? 'text-orange-400' : 'text-green-400'}`}>
            {debtRemaining > 0 ? fmt(debtRemaining) + 'đ' : '✓ Sạch nợ'}
          </span>
        </div>

        {/* Lãi sắp đến */}
        {debtRemaining > 0 && (
          <div className={`flex flex-col items-center px-2 py-1 rounded-lg ${daysToPayment <= 5 ? 'bg-red-900/60' : 'bg-gray-800'}`}>
            <span className="text-[10px] text-gray-400 leading-none">Lãi tháng</span>
            <span className={`text-xs font-bold ${daysToPayment <= 5 ? 'text-red-300' : 'text-gray-300'}`}>
              {daysToPayment <= 0 ? 'ĐẾN HẠN!' : `${daysToPayment}ng`}
            </span>
          </div>
        )}

        {/* Pause */}
        <button
          onClick={pauseToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm shrink-0"
        >
          {isPaused ? '▶' : '⏸'}
        </button>

      </div>
    </div>
  )
}
