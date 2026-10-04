'use client'

import { useState } from 'react'
import { useGameStore, selectDebtRemaining } from '@/lib/mocity2/store'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  return `${(n / 1_000).toFixed(0)}K`
}

export default function DebtModal() {
  const { activeModal, closeModal, cash, debt, payDebt, day } = useGameStore()
  const debtRemaining = useGameStore(selectDebtRemaining)
  const [payAmount, setPayAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (activeModal !== 'debt') return null

  const daysToPayment = debt.nextPaymentDay - day
  const isOverdue = daysToPayment <= 0
  const isCritical = daysToPayment <= 5 && daysToPayment > 0
  const paidPercent = Math.round((debt.paidPrincipal / debt.principal) * 100)

  function handlePay() {
    const amount = parseFloat(payAmount) * 1_000_000
    if (isNaN(amount) || amount <= 0) { setError('Nhập số tiền hợp lệ'); return }
    const err = payDebt(amount)
    if (err) { setError(err); return }
    setError(null)
    setSuccess(`Đã trả ${fmt(amount)}đ nợ gốc thành công!`)
    setPayAmount('')
    setTimeout(() => setSuccess(null), 3000)
  }

  const quickAmounts = [10, 20, 50].filter(m => m * 1_000_000 <= Math.min(cash, debtRemaining))

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pb-2 px-3">
      <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">

        <div className="border-b border-gray-700 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-white">💳 Quản lý nợ</span>
          <button onClick={closeModal} className="text-gray-400 hover:text-white w-7 h-7 flex items-center justify-center">✕</button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">

          {/* Cảnh báo nếu sắp đến hạn */}
          {(isOverdue || isCritical || debt.missedPayments > 0) && (
            <div className={`px-4 py-3 rounded-xl border text-sm ${
              debt.missedPayments >= 2 ? 'bg-red-950 border-red-700 text-red-300' :
              isOverdue ? 'bg-red-900/40 border-red-700 text-red-300' :
              'bg-orange-900/40 border-orange-700 text-orange-300'
            }`}>
              {debt.missedPayments >= 2
                ? '⚠️ CẢNH BÁO: Đã trễ 2 kỳ liên tiếp. Hợp đồng có thể bị chuyển cưỡng chế!'
                : isOverdue
                ? '🔴 Lãi tháng này đã đến hạn! Chưa thanh toán.'
                : `⏰ Lãi tháng đến hạn trong ${daysToPayment} ngày.`
              }
            </div>
          )}

          {/* Debt overview */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xs text-gray-400">Nợ gốc ban đầu</div>
                <div className="text-base font-bold text-white">{fmt(debt.principal)}đ</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Đã trả gốc</div>
                <div className="text-base font-bold text-green-400">{fmt(debt.paidPrincipal)}đ</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${paidPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-400">
              <span>Còn lại: <span className="text-orange-400 font-bold">{fmt(debtRemaining)}đ</span></span>
              <span>{paidPercent}% đã trả</span>
            </div>
          </div>

          {/* Monthly interest */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="text-[10px] text-gray-400">Lãi hàng tháng</div>
              <div className="text-sm font-bold text-red-400">{fmt(debt.monthlyInterest)}đ/tháng</div>
              {debt.missedPayments > 0 && (
                <div className="text-[10px] text-red-500 mt-0.5">Phạt x1.5 do trễ hạn</div>
              )}
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <div className="text-[10px] text-gray-400">Kỳ lãi tiếp theo</div>
              <div className={`text-sm font-bold ${isOverdue ? 'text-red-400' : isCritical ? 'text-orange-400' : 'text-gray-200'}`}>
                {isOverdue ? 'ĐẾN HẠN!' : `Ngày ${debt.nextPaymentDay}`}
              </div>
            </div>
          </div>

          {/* Tiền mặt hiện có */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Tiền mặt hiện có:</span>
            <span className={`font-bold ${cash < debt.monthlyInterest ? 'text-red-400' : 'text-green-400'}`}>
              {fmt(cash)}đ
            </span>
          </div>

          {debtRemaining > 0 ? (
            <>
              {/* Quick pay */}
              {quickAmounts.length > 0 && (
                <div className="flex gap-2">
                  {quickAmounts.map(m => (
                    <button
                      key={m}
                      onClick={() => setPayAmount(String(m))}
                      className="flex-1 py-2 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              )}

              {/* Custom amount */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => { setPayAmount(e.target.value); setError(null) }}
                    placeholder="Nhập số triệu..."
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">triệu đ</span>
                </div>
                <button
                  onClick={handlePay}
                  disabled={!payAmount}
                  className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-gray-900 font-bold text-sm rounded-xl transition-colors"
                >
                  Trả
                </button>
              </div>

              {error && <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
              {success && <p className="text-xs text-green-400 bg-green-900/20 px-3 py-2 rounded-lg">{success}</p>}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🎉</div>
              <div className="text-sm font-bold text-green-400">Đã trả sạch nợ!</div>
              <div className="text-xs text-gray-400 mt-1">Điểm tín dụng của bạn đang ở mức tuyệt vời.</div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
