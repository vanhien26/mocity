'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/mocity2/store'

export default function IntroScreen() {
  const { phase, startGame } = useGameStore()
  const [name, setName] = useState('')
  const [step, setStep] = useState(0)

  if (phase !== 'intro') return null

  const story = [
    {
      text: 'Chuyến xe đò cuối cùng thả bạn xuống ngã tư sầm uất nhất thành phố lúc trời chập choạng tối. Đèn neon hắt xuống mặt đường loang loáng nước mưa. Thành phố này không có chỗ cho sự yếu đuối.',
      emoji: '🌆',
    },
    {
      text: 'Trong túi chỉ còn đúng 50 triệu đồng — số tiền gom góp cuối cùng sau khi gia đình ở quê vỡ nợ. Trên lưng là hợp đồng vay 200 triệu đồng. Mỗi tháng phải nộp 5 triệu tiền lãi.',
      emoji: '💸',
    },
    {
      text: '"Đúng ngày 30 hàng tháng nộp đủ 5 triệu lãi. Chậm 2 kỳ liên tiếp, hợp đồng sẽ chuyển cho bên cưỡng chế tài sản. Đừng có trốn."',
      emoji: '📱',
      isQuote: true,
    },
    {
      text: 'Để tồn tại, bạn chỉ có một con đường: lao vào kinh doanh để trả nợ và dựng lại cơ đồ từ con số không.',
      emoji: '🏗️',
    },
  ]

  if (step < story.length) {
    const s = story[step]
    return (
      <div className="fixed inset-0 z-[300] bg-gray-950 flex flex-col items-center justify-center px-6">
        <div className="max-w-sm w-full flex flex-col items-center gap-6">
          <span className="text-5xl">{s.emoji}</span>
          <p className={`text-center leading-relaxed ${
            s.isQuote
              ? 'text-orange-300 italic text-sm bg-gray-800 px-4 py-3 rounded-xl border border-orange-800'
              : 'text-gray-200 text-base'
          }`}>
            {s.text}
          </p>
          <button
            onClick={() => setStep(step + 1)}
            className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-sm transition-colors"
          >
            {step < story.length - 1 ? 'Tiếp →' : 'Bắt đầu'}
          </button>
          <div className="flex gap-1.5 mt-2">
            {story.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-yellow-400' : 'bg-gray-600'}`} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Name input screen
  return (
    <div className="fixed inset-0 z-[300] bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full flex flex-col gap-5">
        <div className="text-center">
          <span className="text-4xl">🏙️</span>
          <h1 className="text-xl font-bold text-white mt-3">Bạn tên gì?</h1>
          <p className="text-sm text-gray-400 mt-1">Thành phố sẽ nhớ tên bạn.</p>
        </div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && startGame(name.trim())}
          placeholder="Nhập tên..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-center text-lg focus:outline-none focus:border-yellow-400"
          autoFocus
        />
        <button
          disabled={!name.trim()}
          onClick={() => startGame(name.trim())}
          className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-gray-900 font-bold rounded-xl text-sm transition-colors"
        >
          Lên thành phố lập nghiệp →
        </button>
        <div className="text-center text-xs text-gray-500">
          50M vốn · 200M nợ · 360 ngày
        </div>
      </div>
    </div>
  )
}
