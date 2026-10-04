'use client'

import { useGameStore, selectDebtRemaining } from '@/lib/mocity2/store'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  return `${(n / 1_000).toFixed(0)}K`
}

const ENDINGS = {
  'cashflow-master': {
    emoji: '🏆',
    title: 'Chúa Tể Dòng Tiền',
    color: 'text-yellow-300',
    borderColor: 'border-yellow-600',
    bgColor: 'bg-yellow-950/30',
    desc: 'Bạn không nợ một đồng. Các cơ sở kinh doanh tự vận hành trơn tru, tạo ra dòng tiền dương đều đặn mỗi ngày. Bạn hoàn toàn tự do tài chính.',
    lesson: 'Cashflow là vua. Tài sản trên giấy không nuôi được bạn qua ngày khó — dòng tiền mặt thực tế mới làm được điều đó.',
  },
  'risk-taker': {
    emoji: '⚡',
    title: 'Con Buôn Mạo Hiểm',
    color: 'text-orange-300',
    borderColor: 'border-orange-700',
    bgColor: 'bg-orange-950/30',
    desc: 'Doanh thu bạc tỷ, tài sản bóng bẩy nhưng sổ sách chắp vá. Bạn giàu có trên giấy tờ, nhưng luôn sống trong nỗi sợ lãi suất và kiểm tra.',
    lesson: 'Tốc độ tăng trưởng nhanh không bù được rủi ro systemic. Một đợt lãi suất tăng hay thanh tra bất ngờ có thể xóa sổ tất cả.',
  },
  'sustainable': {
    emoji: '🌱',
    title: 'Doanh Nhân Bền Vững',
    color: 'text-green-300',
    borderColor: 'border-green-700',
    bgColor: 'bg-green-950/30',
    desc: 'Đóng thuế đầy đủ, tạo công ăn việc làm cho nhiều người, điểm tín nhiệm tuyệt đối và là đối tác tin cậy của ngân hàng.',
    lesson: 'Kinh doanh bền vững không phải là chậm — đó là xây nền móng đủ vững để mở rộng mà không sợ sụp đổ.',
  },
}

export default function EndingScreen() {
  const { phase, ending, playerName, totalRevenue, totalExpenses, ethicsScore, debt } = useGameStore()
  const debtRemaining = useGameStore(selectDebtRemaining)

  if (phase !== 'ending' || !ending) return null

  const e = ENDINGS[ending]
  const netProfit = totalRevenue - totalExpenses
  const ethicsLabel = ethicsScore >= 5 ? 'Minh bạch 🌟' : ethicsScore <= -3 ? 'Rủi ro ⚡' : 'Trung lập ⚖️'

  return (
    <div className="fixed inset-0 z-[300] bg-gray-950 flex flex-col items-center justify-center px-5 overflow-y-auto py-8">
      <div className="w-full max-w-sm flex flex-col gap-5">

        {/* Kết thúc badge */}
        <div className={`rounded-2xl border-2 p-5 text-center ${e.bgColor} ${e.borderColor}`}>
          <div className="text-5xl mb-3">{e.emoji}</div>
          <div className={`text-xl font-bold mb-1 ${e.color}`}>{e.title}</div>
          <div className="text-sm text-gray-300 leading-relaxed">{e.desc}</div>
        </div>

        {/* Stats */}
        <div className="bg-gray-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">
            Báo cáo 360 ngày — {playerName}
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Tổng doanh thu', value: fmt(totalRevenue) + 'đ', color: 'text-green-400' },
              { label: 'Tổng chi phí', value: fmt(totalExpenses) + 'đ', color: 'text-red-400' },
              { label: 'Lãi ròng', value: fmt(netProfit) + 'đ', color: netProfit >= 0 ? 'text-green-300' : 'text-red-300' },
              { label: 'Nợ còn lại', value: debtRemaining > 0 ? fmt(debtRemaining) + 'đ' : '✓ Đã trả sạch', color: debtRemaining > 0 ? 'text-orange-400' : 'text-green-400' },
              { label: 'Chỉ số đạo đức', value: ethicsLabel, color: 'text-gray-200' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{item.label}</span>
                <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bài học */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-400 mb-2">💡 Bài học rút ra</div>
          <p className="text-sm text-gray-200 leading-relaxed italic">"{e.lesson}"</p>
        </div>

        {/* Chơi lại */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-sm transition-colors"
        >
          Chơi lại từ đầu →
        </button>

        <p className="text-center text-xs text-gray-600">
          Thành phố này không dạy bạn làm giàu bằng lời hứa hão huyền.<br />
          Nó dạy bạn bằng cái giá của từng đồng tiền nợ.
        </p>

      </div>
    </div>
  )
}
