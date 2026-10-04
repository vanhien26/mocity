'use client';

import { useState } from 'react';
import { RotateCcw, Share2 } from 'lucide-react';
import { resetCity, useCity } from '@/lib/mocity/store';
import { formatCompact } from '@/lib/mocity/format';

type Ending = 'survival' | 'prosperity' | 'empire';

const ENDING_DATA: Record<Ending, {
  emoji: string;
  title: string;
  subtitle: string;
  story: string;
  color: string;
  bg: string;
  border: string;
}> = {
  survival: {
    emoji: '🎒',
    title: 'Về Quê Ngẩng Cao Đầu',
    subtitle: 'Kết thúc: Sống Sót',
    story: 'Bạn trả hết 200 triệu cho ông Chín. Không dư nhiều, nhưng đủ để nhìn thẳng vào mặt bố mẹ. Hành lý về quê nhẹ hơn lúc lên — không phải vì ít đồ, mà vì không còn nặng nợ.',
    color: '#7C3AED',
    bg: 'linear-gradient(160deg, #1E1035 0%, #2D1A5E 100%)',
    border: '#7C3AED',
  },
  prosperity: {
    emoji: '🏪',
    title: 'Làm Chủ Hẻm',
    subtitle: 'Kết thúc: Phát Đạt',
    story: 'Tiệm chạy ngon, nợ sạch. Anh Tư nghe tin tìm đến hỏi bí quyết. Bạn chỉ cười — không có bí quyết, chỉ có mỗi sáng mở cửa đúng giờ và không để lãi ăn vào vốn.',
    color: '#D97706',
    bg: 'linear-gradient(160deg, #1C0F00 0%, #3B1F06 100%)',
    border: '#C9A227',
  },
  empire: {
    emoji: '🏙️',
    title: 'Đế Chế Phố MoCity',
    subtitle: 'Kết thúc: Cơ Đồ',
    story: 'Thị Trưởng gặp riêng bạn. "Tôi có khu đất mới ở phía bắc thành phố," ông nói. "Vẫn còn mấy lô trống." Lần này bạn không run tay khi ký hợp đồng thuê.',
    color: '#059669',
    bg: 'linear-gradient(160deg, #002010 0%, #064E3B 100%)',
    border: '#34D399',
  },
};

interface EndingScreenProps {
  ending: Ending;
  mayorName: string;
  coins: number;
  buildingCount: number;
}

export default function EndingScreen({ ending, mayorName, coins, buildingCount }: EndingScreenProps) {
  const [confirmed, setConfirmed] = useState(false);
  const data = ENDING_DATA[ending];

  if (confirmed) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(10,6,12,0.88)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-[480px] overflow-hidden rounded-3xl border-2 shadow-2xl"
        style={{ background: data.bg, borderColor: data.border }}
      >
        {/* Scene */}
        <div className="flex flex-col items-center py-10 px-6 text-center">
          <span className="text-7xl leading-none">{data.emoji}</span>
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest" style={{ color: data.color }}>
            {data.subtitle}
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
            {data.title}
          </h1>
        </div>

        {/* Story */}
        <div className="mx-5 mb-5 rounded-2xl border px-4 py-4" style={{ borderColor: `${data.border}55`, background: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm leading-relaxed text-white/80 italic">
            "{data.story}"
          </p>
        </div>

        {/* Stats */}
        <div className="mx-5 mb-6 grid grid-cols-3 gap-2">
          {[
            ['Người chơi', mayorName],
            ['Tiền mặt', formatCompact(coins)],
            ['Số tiệm', String(buildingCount)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl px-2 py-2 text-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${data.border}44` }}
            >
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: data.color }}>
                {label}
              </p>
              <p className="mt-0.5 text-sm font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 px-5 pb-6">
          <button
            type="button"
            onClick={() => {
              resetCity();
              setConfirmed(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 bg-white/10 px-6 py-3.5 text-sm font-black text-white transition-all hover:bg-white/20 active:scale-95"
            style={{ borderColor: data.border }}
          >
            <RotateCcw size={16} className="shrink-0" />
            Lên phố lần nữa
          </button>
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            className="text-center text-[12px] font-bold py-2 opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: data.color }}
          >
            Tiếp tục quản lý đô thị
          </button>
        </div>
      </div>
    </div>
  );
}
