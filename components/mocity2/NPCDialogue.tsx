'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/lib/mocity2/store'

interface DialogueLine {
  npcName: string
  npcEmoji: string
  text: string
  triggerDay?: number
  triggerFlag?: string
  id: string
}

// NPC xuất hiện tự nhiên theo ngày hoặc sự kiện
const NPC_LINES: DialogueLine[] = [
  {
    id: 'ba-bat-dong-intro',
    npcName: 'Ông Ba Bất Động',
    npcEmoji: '👴',
    text: 'Ở thành phố này, người phá sản không phải người kiếm ít tiền — mà là người sáng mai mở mắt ra không còn một đồng tiền mặt để trả tiền nhà.',
    triggerDay: 3,
  },
  {
    id: 'neighbor-competitor',
    npcName: 'Chị Hàng Xóm',
    npcEmoji: '👩',
    text: 'Anh mới lên thành phố à? Hẻm này trước có mấy người mở tiệm lắm. Người thì bỏ về quê, người thì... thôi không kể. Chúc anh may mắn nhé.',
    triggerDay: 7,
  },
  {
    id: 'first-month-mentor',
    npcName: 'Cô Thu — Kế toán',
    npcEmoji: '👩‍💼',
    text: 'Doanh thu cao không đồng nghĩa với business tốt. Doanh thu 40M, Chi phí 42M → Cashflow âm 2M. Phải luôn nhìn vào lợi nhuận ròng, không phải tổng thu.',
    triggerDay: 15,
  },
  {
    id: 'debt-reminder-npc',
    npcName: 'Anh Bảo — Ngân hàng',
    npcEmoji: '🏦',
    text: 'Nhớ nhé, lãi suất phạt khi trễ hạn là 150% lãi suất gốc. Trễ 2 kỳ liên tiếp là hợp đồng chuyển bộ phận xử lý nợ xấu. Anh không muốn gặp họ đâu.',
    triggerDay: 25,
  },
  {
    id: 'hired-staff-tip',
    npcName: 'Ông Ba Bất Động',
    npcEmoji: '👴',
    text: 'Thuê người giỏi hơn mình — đó là cách duy nhất để scale. Tự mình làm hết thì chỉ tạo được một việc làm, mà lại là việc làm tệ nhất: chủ kiêm thợ.',
    triggerFlag: 'hired-staff',
    id: 'ba-bat-dong-staff',
  },
  {
    id: 'act2-warning',
    npcName: 'Chị Hàng Xóm',
    npcEmoji: '👩',
    text: 'Mặt tiền phố lớn đắt lắm anh ơi. Tiền thuê 18M/tháng, mưa một tuần là lỗ. Tính kỹ trước khi ký hợp đồng đó.',
    triggerDay: 62,
  },
  {
    id: 'halfway-coach',
    npcName: 'Cô Thu — Kế toán',
    npcEmoji: '👩‍💼',
    text: 'Đã qua 6 tháng. Giờ là lúc tính ROI thật sự: tổng vốn đã bỏ vào bao nhiêu, và đang thu về bao nhiêu mỗi tháng. Nếu ROI dưới 2%/tháng thì cần xem lại mô hình.',
    triggerDay: 180,
  },
  {
    id: 'debt-cleared-congrats',
    npcName: 'Anh Bảo — Ngân hàng',
    npcEmoji: '🏦',
    text: 'Chúc mừng anh đã trả sạch nợ! Lịch sử tín dụng của anh bây giờ rất đẹp. Ngân hàng sẵn sàng cấp hạn mức tín dụng doanh nghiệp 1 tỷ đồng nếu anh cần mở rộng.',
    triggerFlag: 'debt-cleared',
    id: 'debt-cleared-npc',
  },
]

export default function NPCDialogue() {
  const { day, flags } = useGameStore()
  const [visible, setVisible] = useState<DialogueLine | null>(null)
  const [shownIds, setShownIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (visible) return  // đang hiện rồi thì không trigger thêm

    const match = NPC_LINES.find(line => {
      if (shownIds.has(line.id)) return false
      if (line.triggerDay !== undefined && day >= line.triggerDay) return true
      if (line.triggerFlag && flags.includes(line.triggerFlag)) return true
      return false
    })

    if (match) {
      setVisible(match)
    }
  }, [day, flags, shownIds, visible])

  if (!visible) return null

  function dismiss() {
    setShownIds(prev => new Set(prev).add(visible!.id))
    setVisible(null)
  }

  return (
    <div className="fixed bottom-[88px] inset-x-0 z-[80] px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-gray-800 border border-gray-600 rounded-2xl p-4 shadow-2xl flex gap-3 items-start">
          <div className="shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
            {visible.npcEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-yellow-300 mb-1">{visible.npcName}</div>
            <p className="text-xs text-gray-200 leading-relaxed">{visible.text}</p>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-gray-500 hover:text-gray-300 text-lg leading-none mt-0.5"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
