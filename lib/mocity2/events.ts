import type { GameEvent, GameState } from './types'
import { MISSED_PAYMENT_LIMIT } from './constants'

// ─── Debt Due (mỗi 30 ngày) ──────────────────────────────
export function buildDebtDueEvent(day: number, amount: number): GameEvent {
  return {
    id: `debt-due-day-${day}`,
    type: 'debt-due',
    title: '📱 Tin nhắn từ bên thu nợ',
    body: `"Đúng hẹn tháng này. Nộp đủ ${(amount / 1_000_000).toFixed(0)} triệu tiền lãi ngay hôm nay. Chậm 2 kỳ liên tiếp, hợp đồng chuyển cưỡng chế."`,
    triggeredOnDay: day,
    choices: [
      {
        id: 'pay-interest',
        label: `Nộp ngay ${(amount / 1_000_000).toFixed(0)} triệu`,
        description: 'An toàn, giữ điểm tín dụng.',
        ethicsImpact: 1,
        cashEffect: -amount,
        apply: (s: GameState) => {
          s.debt.missedPayments = 0
          return {}
        },
      },
      {
        id: 'delay-payment',
        label: 'Xin hoãn thêm 1 tháng',
        description: 'Tiết kiệm tiền mặt ngắn hạn, nhưng lãi phạt tăng 50% tháng sau.',
        ethicsImpact: -1,
        cashEffect: 0,
        apply: (s: GameState) => {
          s.debt.missedPayments += 1
          s.debt.monthlyInterest = Math.round(s.debt.monthlyInterest * 1.5)
          if (s.debt.missedPayments >= MISSED_PAYMENT_LIMIT) {
            s.flags.push('debt-overdue-warning')
          }
          return {}
        },
      },
    ],
  }
}

// ─── Mưa lớn ─────────────────────────────────────────────
export function buildRainEvent(day: number): GameEvent {
  return {
    id: `rain-day-${day}`,
    type: 'rain',
    title: '🌧️ Mưa lớn kéo dài 3 ngày',
    body: 'Con phố ngập nước. Khách ít ghé hơn hẳn. Bạn sẽ xử lý thế nào?',
    triggeredOnDay: day,
    choices: [
      {
        id: 'wait-rain',
        label: 'Bình tĩnh chờ mưa tạnh',
        description: 'Mất 30% doanh thu 3 ngày, nhưng không thêm chi phí.',
        ethicsImpact: 0,
        cashEffect: 0,
        apply: (s: GameState) => {
          // Giảm revenue 3 ngày tiếp theo - đơn giản hóa: trừ tiền ngay
          const loss = s.businesses.reduce((sum, b) => {
            const dailyRev = b.baseDailyRevenue * 0.3
            return sum + dailyRev * 3
          }, 0)
          s.cash -= Math.round(loss)
          return {}
        },
      },
      {
        id: 'promo-rain',
        label: 'Chạy khuyến mãi mưa giảm 20%',
        description: 'Tốn thêm 1 triệu chi phí marketing, nhưng giữ được lượng khách.',
        ethicsImpact: 1,
        cashEffect: -1_000_000,
        apply: () => ({}),
      },
    ],
  }
}

// ─── Hàng thiu ───────────────────────────────────────────
export function buildSpoilageEvent(day: number): GameEvent {
  return {
    id: `spoilage-day-${day}`,
    type: 'spoilage',
    title: '🗑️ Hàng tươi bị chua',
    body: 'Một nửa số hàng tươi nhập hôm qua bị hỏng trước khi bán kịp. Bạn xử lý sao?',
    triggeredOnDay: day,
    choices: [
      {
        id: 'accept-loss',
        label: 'Chấp nhận đổ hàng, nhập lại',
        description: 'Mất 2 triệu, nhưng không vi phạm vệ sinh an toàn thực phẩm.',
        ethicsImpact: 1,
        cashEffect: -2_000_000,
        apply: () => ({}),
      },
      {
        id: 'sell-spoiled',
        label: 'Bán cố hàng còn dùng được',
        description: 'Tiết kiệm 2 triệu, nhưng rủi ro khách phàn nàn và mất uy tín.',
        ethicsImpact: -2,
        cashEffect: 0,
        apply: (s: GameState) => {
          // 30% cơ hội mất khách (giảm doanh thu hôm sau)
          if (Math.random() < 0.3) {
            s.cash -= 3_000_000  // mất khách hàng
            s.flags.push('reputation-hit')
          }
          return {}
        },
      },
    ],
  }
}
