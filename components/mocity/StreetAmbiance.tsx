'use client';

import React from 'react';
import { Sun, Sunset, Moon, Sunrise } from 'lucide-react';
import type { TimeOfDay } from '@/lib/mocity/types';
import { cycleTimeOfDay, useCity } from '@/lib/mocity/store';

export const TIME_OF_DAY_META: Record<
  TimeOfDay,
  {
    label: string;
    icon: typeof Sun;
    skyBg: string;
    lampLit: boolean;
    ambientTint: string;
  }
> = {
  DAWN: {
    label: 'Bình Minh',
    icon: Sunrise,
    skyBg: 'linear-gradient(180deg, #FDBA74 0%, #F472B6 40%, #93C5FD 75%, #EDEAE2 100%)',
    lampLit: false,
    ambientTint: 'rgba(251, 191, 36, 0.08)',
  },
  DAY: {
    label: 'Ban Ngày',
    icon: Sun,
    skyBg: 'linear-gradient(180deg, #60A5FA 0%, #BAE6FD 50%, #EDEAE2 100%)',
    lampLit: false,
    ambientTint: 'transparent',
  },
  SUNSET: {
    label: 'Hoàng Hôn',
    icon: Sunset,
    skyBg: 'linear-gradient(180deg, #EA580C 0%, #DB2777 40%, #7C3AED 75%, #EDEAE2 100%)',
    lampLit: true,
    ambientTint: 'rgba(234, 88, 12, 0.12)',
  },
  NIGHT: {
    label: 'Đêm Phố',
    icon: Moon,
    skyBg: 'linear-gradient(180deg, #090D16 0%, #1E1B4B 50%, #2E1065 85%, #EDEAE2 100%)',
    lampLit: true,
    ambientTint: 'rgba(15, 23, 42, 0.35)',
  },
};

/**
 * Cột đèn đường cổ điển vỉa hè Việt Nam
 */
export function StreetLamp({
  timeOfDay,
  style,
}: {
  timeOfDay: TimeOfDay;
  style?: React.CSSProperties;
}) {
  const isLit = timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET';

  return (
    <div
      style={style}
      className="pointer-events-none absolute z-30 flex flex-col items-center"
    >
      {/* Chao đèn & Bóng phát sáng */}
      <div className="relative flex flex-col items-center">
        {/* Nóc chao đèn sắt cong */}
        <div className="h-2 w-6 rounded-t-full border border-[#2A231D] bg-[#3E352F]" />
        {/* Bóng đèn phát sáng */}
        <div
          className={`h-4 w-4 rounded-full border border-[#2A231D] transition-all duration-500 ${
            isLit
              ? 'bg-[#FEF08A] shadow-[0_0_18px_#FDE047,0_0_35px_#FACC15]'
              : 'bg-[#E2E8F0]'
          }`}
        />
        {/* Vệt ánh sáng hình nón rọi xuống vỉa hè ban đêm */}
        {isLit && (
          <div
            className="absolute top-4 -left-12 h-44 w-28 pointer-events-none opacity-45"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(254,240,138,0.7) 0%, rgba(254,240,138,0.2) 40%, transparent 75%)',
            }}
          />
        )}
      </div>

      {/* Cột sắt đen uốn cong */}
      <div className="h-[88px] w-2 border-x border-[#2A231D] bg-[#3E352F]" />
      {/* Đế cột đèn hình thang */}
      <div className="h-4 w-5 rounded-t-sm border border-[#2A231D] bg-[#2A231D]" />
    </div>
  );
}

/**
 * Nút chuyển đổi nhanh Ngày/Đêm trên Toolbar hoặc Header
 */
export function TimeOfDaySwitcher() {
  const timeOfDay = useCity((s) => s.timeOfDay ?? 'DAY');
  const meta = TIME_OF_DAY_META[timeOfDay];
  const Icon = meta.icon;

  const handleToggle = () => {
    cycleTimeOfDay();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex items-center gap-1.5 rounded-2xl border-2 border-[#78533D] bg-[#FAF6ED] px-2.5 py-1.5 text-xs font-black text-[#3E2A1B] shadow-sm transition-transform hover:scale-105 active:scale-95"
      title={`Thời gian: ${meta.label}. Bấm để chuyển cảnh ngày/đêm`}
    >
      <Icon
        size={14}
        className={`shrink-0 ${
          timeOfDay === 'NIGHT'
            ? 'text-indigo-400 fill-indigo-400'
            : timeOfDay === 'SUNSET'
              ? 'text-amber-500 fill-amber-500'
              : 'text-amber-600 fill-amber-500'
        }`}
      />
      <span>{meta.label}</span>
    </button>
  );
}

/**
 * Mây trời bay ban ngày / Ngôi sao lấp lánh ban đêm
 */
export function SkyAtmosphere({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  const isNight = timeOfDay === 'NIGHT';
  const isSunset = timeOfDay === 'SUNSET';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* BAN ĐÊM: MẶT TRĂNG VÀNG & CÁC CHÒM SAO LẤP LÁNH */}
      {isNight && (
        <>
          {/* Trăng khuyết màu vàng */}
          <div className="absolute top-6 right-36 h-12 w-12 rounded-full bg-amber-200 shadow-[0_0_25px_#FDE047] flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-[#1E1B4B] translate-x-2 -translate-y-1" />
          </div>
          {/* Chòm sao */}
          {[
            { top: 20, left: 120, size: 2 },
            { top: 45, left: 280, size: 3 },
            { top: 15, left: 540, size: 2.5 },
            { top: 60, left: 780, size: 2 },
            { top: 30, left: 1020, size: 3 },
            { top: 50, left: 1320, size: 2 },
            { top: 25, left: 1650, size: 2.5 },
            { top: 40, left: 1980, size: 3 },
            { top: 15, left: 2300, size: 2 },
          ].map((star, idx) => (
            <div
              key={idx}
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animation: `pulse ${1.5 + (idx % 3)}s infinite ease-in-out`,
              }}
              className="absolute rounded-full bg-white shadow-[0_0_4px_#FFF]"
            />
          ))}
        </>
      )}

      {/* BAN NGÀY & HOÀNG HÔN: CÁC ĐÁM MÂY TRẮNG XỐP LƯỢN QUA */}
      {!isNight && (
        <div className="absolute top-4 inset-x-0 flex justify-around opacity-70">
          <div className="h-8 w-24 rounded-full bg-white/70 blur-[2px]" />
          <div className="h-10 w-32 rounded-full bg-white/60 blur-[2px] mt-2" />
          <div className="h-7 w-20 rounded-full bg-white/65 blur-[2px]" />
          <div className="h-9 w-28 rounded-full bg-white/50 blur-[2px] mt-1" />
        </div>
      )}

      {/* Màng phủ màu sắc tổng thể (Ambient Color Wash) */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: TIME_OF_DAY_META[timeOfDay].ambientTint }}
      />
    </div>
  );
}
