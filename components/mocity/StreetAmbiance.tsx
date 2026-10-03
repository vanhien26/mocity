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
    /**
     * Bầu trời theo bảng màu bao cấp: bạc màu, ngả lục xám và vàng nghệ.
     * Bản cũ dùng #60A5FA / #F472B6 / #7C3AED - xanh hồng tím bão hoà cao,
     * thứ kéo mạnh nhất về cảm giác đương đại vì nó chiếm nửa khung hình.
     */
    skyBg: string;
    lampLit: boolean;
    ambientTint: string;
  }
> = {
  DAWN: {
    label: 'Bình Minh',
    icon: Sunrise,
    skyBg: 'linear-gradient(180deg, #E0B079 0%, #C98C87 40%, #A3B5B0 75%, #E8DCC0 100%)',
    lampLit: false,
    ambientTint: 'rgba(251, 191, 36, 0.08)',
  },
  DAY: {
    label: 'Ban Ngày',
    icon: Sun,
    skyBg: 'linear-gradient(180deg, #8FA8AE 0%, #BCCBC4 50%, #E8DCC0 100%)',
    lampLit: false,
    ambientTint: 'transparent',
  },
  SUNSET: {
    label: 'Hoàng Hôn',
    icon: Sunset,
    skyBg: 'linear-gradient(180deg, #C26A2E 0%, #A84B3C 40%, #6B5473 75%, #D9C9A6 100%)',
    lampLit: true,
    ambientTint: 'rgba(234, 88, 12, 0.12)',
  },
  NIGHT: {
    label: 'Đêm Phố',
    icon: Moon,
    skyBg: 'linear-gradient(180deg, #11151A 0%, #232B33 50%, #33333D 85%, #6E655A 100%)',
    lampLit: true,
    ambientTint: 'rgba(15, 23, 42, 0.35)',
  },
};

/**
 * Cột đèn đường cổ điển vỉa hè Việt Nam
 * Đèn đường tự động sáng khi hoàng hôn/ban đêm hoặc khi người chơi bật thủ công.
 * Có quầng sáng ấm áp toả tròn và vệt sáng hình nón rọi rõ xuống mặt vỉa hè & lòng đường.
 */
export function StreetLamp({
  timeOfDay,
  lit,
  onToggle,
  style,
  className = '',
}: {
  timeOfDay?: TimeOfDay;
  lit?: boolean;
  onToggle?: () => void;
  style?: React.CSSProperties;
  className?: string;
}) {
  const isLit = lit !== undefined ? lit : (timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET');

  return (
    <div
      style={style}
      onClick={onToggle}
      className={`absolute z-30 flex flex-col items-center select-none transition-transform ${
        onToggle ? 'cursor-pointer hover:scale-105 active:scale-95' : 'pointer-events-none'
      } ${className}`}
      title={
        onToggle
          ? isLit
            ? '💡 Đèn đường đang sáng (Bấm để tắt tiết kiệm điện)'
            : '💡 Đèn đường đang tắt (Bấm để thắp sáng)'
          : undefined
      }
    >
      {/* Chao đèn & Lồng đèn phát sáng */}
      <div className="relative flex flex-col items-center">
        {/* Chóp nhọn trang trí phong cách Đông Dương */}
        <div className="h-2 w-1 rounded-t-full bg-[#1A1410]" />

        {/* Nóc chao đèn sắt cong uốn lượn */}
        <div className="h-2.5 w-7 rounded-t-[8px] border border-[#1A1410] bg-[#2E241E] shadow-sm" />

        {/* Lồng kính đèn lục giác */}
        <div
          className="relative flex h-5 w-6 items-center justify-center overflow-hidden rounded-b-sm border border-[#1A1410] transition-colors duration-500"
          style={{
            background: isLit
              ? 'radial-gradient(ellipse at 50% 40%, #FFFBEB 0%, #FEF08A 45%, #F59E0B 100%)'
              : '#E2E8F0',
            boxShadow: isLit
              ? '0 0 12px #FDE047, 0 0 25px rgba(245,158,11,0.9), inset 0 0 6px #FFF'
              : 'none',
          }}
        >
          {/* Nan sắt bảo vệ kính */}
          <div className="absolute inset-y-0 left-2 w-[1px] bg-[#1A1410]/40" />
          <div className="absolute inset-y-0 right-2 w-[1px] bg-[#1A1410]/40" />

          {/* Tim đèn LED siêu sáng */}
          <div
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              isLit
                ? 'bg-white shadow-[0_0_8px_#FFF,0_0_16px_#FDE047]'
                : 'bg-[#94A3B8]'
            }`}
          />
        </div>

        {/* Vệt ánh sáng hình nón rọi xuống vỉa hè & lòng đường */}
        {isLit && (
          <>
            {/* Luồng sáng nón toả rộng hình phễu */}
            <div
              className="pointer-events-none absolute top-7 -left-[57px] h-48 w-36 opacity-75 transition-opacity duration-700"
              style={{
                background:
                  'radial-gradient(ellipse 65% 100% at 50% 0%, rgba(254, 240, 138, 0.65) 0%, rgba(253, 224, 71, 0.32) 35%, rgba(245, 158, 11, 0.12) 65%, transparent 85%)',
                clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
              }}
            />

            {/* Vệt sáng loang ấm áp trên mặt đất tại chân cột */}
            <div
              className="pointer-events-none absolute top-[110px] -left-[45px] h-8 w-28 rounded-full opacity-60 blur-[3px]"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, rgba(254,240,138,0.7) 0%, rgba(245,158,11,0.3) 50%, transparent 80%)',
              }}
            />
          </>
        )}
      </div>

      {/* Tay đỡ sắt uốn lượn mỹ thuật */}
      <div className="h-1.5 w-4 rounded-b-sm border-x border-b border-[#1A1410] bg-[#2E241E]" />

      {/* Cột sắt đúc đen gân nổi */}
      <div className="relative flex h-[82px] w-2.5 justify-center border-x border-[#1A1410] bg-[#352B24]">
        {/* Vạch gờ nổi trang trí thân cột */}
        <div className="absolute top-4 h-1 w-3 rounded-full bg-[#1A1410]" />
        <div className="absolute top-12 h-1 w-3 rounded-full bg-[#1A1410]" />
      </div>

      {/* Chân đế cột đèn đúc gang 2 tầng */}
      <div className="h-2 w-4 border-x border-t border-[#1A1410] bg-[#241D18]" />
      <div className="h-3 w-6 rounded-t-sm border border-[#1A1410] bg-[#1A1410] shadow" />
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
