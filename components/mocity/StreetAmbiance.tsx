'use client';

import React, { useEffect } from 'react';
import { Sun, Sunset, Moon, Sunrise, CloudRain, Waves, CloudLightning } from 'lucide-react';
import type { TimeOfDay, WeatherType } from '@/lib/mocity/types';
import { cycleTimeOfDay, cycleWeather, getCityState, setTimeOfDay, toggleFlood, useCity } from '@/lib/mocity/store';

/**
 * Tính TimeOfDay dựa theo giờ thực của thiết bị:
 *  DAWN  : 05:00 – 08:59  (bình minh / sáng sớm)
 *  DAY   : 09:00 – 16:59  (ban ngày)
 *  SUNSET: 17:00 – 20:59  (chiều tối / hoàng hôn)
 *  NIGHT : 21:00 – 04:59  (ban đêm)
 */
export function getTimeOfDayFromHour(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 9) return 'DAWN';
  if (hour >= 9 && hour < 17) return 'DAY';
  if (hour >= 17 && hour < 21) return 'SUNSET';
  return 'NIGHT';
}

/**
 * Hook tự động đổi timeOfDay trong store 10 phút / 1 lần.
 * Tự động xoay vòng: DAY -> SUNSET -> NIGHT -> DAWN
 */
export function useAutoTimeOfDay() {
  useEffect(() => {
    const TIME_INTERVAL_MS = 10 * 60 * 1000; // 10 phút

    const interval = setInterval(() => {
      cycleTimeOfDay();
    }, TIME_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);
}

/**
 * Hook tự động đổi thời tiết trong store 5 phút / 1 lần.
 * Tự động xoay vòng: SUNNY -> RAIN -> FLOOD -> STORM
 */
export function useAutoWeather(onFloodTriggered?: (msg: string) => void) {
  useEffect(() => {
    const WEATHER_INTERVAL_MS = 5 * 60 * 1000; // 5 phút

    const interval = setInterval(() => {
      const next = cycleWeather();
      if (next === 'FLOOD') {
        const res = toggleFlood(true);
        if (res.damageResult) {
          if (res.damageResult.hasInsurance) {
            onFloodTriggered?.(`🌊 TRIỀU CƯỜNG DÂNG CAO! Đã kích hoạt Bảo Hiểm MoMo bồi thường +${res.damageResult.coveredAmount.toLocaleString('vi-VN')}đ!`);
          } else {
            onFloodTriggered?.(`🌊 CẢNH BÁO NGẬP LỤT! Triều cường tràn bờ kè gây thiệt hại -${res.damageResult.outOfPocket.toLocaleString('vi-VN')}đ (Chưa có bảo hiểm)!`);
          }
        }
      } else {
        const isFlooded = getCityState().isFlooded;
        if (isFlooded) {
          toggleFlood(false);
          onFloodTriggered?.('☀️ Nước triều cường đã rút, đường phố khô ráo trở lại!');
        }
      }
    }, WEATHER_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [onFloodTriggered]);
}

export const WEATHER_META: Record<
  WeatherType,
  {
    label: string;
    icon: typeof Sun;
    rainLevel: 'none' | 'light' | 'heavy' | 'storm';
    badgeColor: string;
    ambientTint: string;
    desc: string;
  }
> = {
  SUNNY: {
    label: 'Nắng Ráo',
    icon: Sun,
    rainLevel: 'none',
    badgeColor: 'border-amber-500 text-amber-300',
    ambientTint: 'transparent',
    desc: 'Thời tiết đẹp, đường phố khô ráo',
  },
  RAIN: {
    label: 'Mưa Rào',
    icon: CloudRain,
    rainLevel: 'light',
    badgeColor: 'border-sky-500 text-sky-300',
    ambientTint: 'rgba(56, 189, 248, 0.08)',
    desc: 'Mưa rào đường phố, bà con mặc áo mưa',
  },
  FLOOD: {
    label: 'Ngập Lụt',
    icon: Waves,
    rainLevel: 'heavy',
    badgeColor: 'border-blue-600 text-cyan-300 animate-pulse',
    ambientTint: 'rgba(14, 116, 144, 0.16)',
    desc: 'Triều cường dâng cao ngập vỉa hè & lòng đường!',
  },
  STORM: {
    label: 'Giông Bão',
    icon: CloudLightning,
    rainLevel: 'storm',
    badgeColor: 'border-purple-500 text-purple-300',
    ambientTint: 'rgba(88, 28, 135, 0.18)',
    desc: 'Gió giật mạnh sấm chớp, cây rung lá rơi',
  },
};

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
      className={`absolute z-15 flex flex-col items-center select-none transition-transform ${
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
 * Badge hiển thị thời gian trong ngày (Tự động đổi 10 phút/lần, không có tương tác thủ công).
 */
export function TimeOfDaySwitcher() {
  const timeOfDay = useCity((s) => s.timeOfDay ?? 'DAY');
  const meta = TIME_OF_DAY_META[timeOfDay];
  const Icon = meta.icon;

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-[#6B4423] bg-[#2A1305]/70 px-2.5 py-1.5 text-xs font-bold text-amber-200 shadow-sm select-none"
      title={`${meta.label} (Tự động đổi 10 phút/lần)`}
    >
      <Icon
        size={14}
        className={`shrink-0 ${
          timeOfDay === 'NIGHT'
            ? 'text-indigo-400 fill-indigo-400'
            : timeOfDay === 'SUNSET'
              ? 'text-amber-500 fill-amber-500'
              : 'text-amber-400 fill-amber-400'
        }`}
      />
      <span>{meta.label}</span>
    </div>
  );
}

/**
 * Badge hiển thị Thời Tiết đô thị (Tự động đổi 5 phút/lần, không có tương tác thủ công).
 */
export function WeatherSwitcher({ onFloodTriggered }: { onFloodTriggered?: (msg: string) => void }) {
  const weather = useCity((s) => s.weather ?? 'SUNNY');
  const isFlooded = useCity((s) => s.isFlooded ?? false);
  const meta = WEATHER_META[weather];
  const Icon = meta.icon;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold shadow-sm select-none bg-[#2A1305]/70 ${
        meta.badgeColor
      }`}
      title={`Thời tiết: ${meta.label} - ${meta.desc} (Tự động đổi 5 phút/lần)`}
    >
      <Icon size={14} className="shrink-0" />
      <span>{meta.label}</span>
      {isFlooded && (
        <span className="ml-0.5 inline-block h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
      )}
    </div>
  );
}

/**
 * Hiệu ứng Mưa rơi xối xả & Tia chớp giông bão
 */
export function RainOverlay({ weather }: { weather?: WeatherType }) {
  if (weather !== 'RAIN' && weather !== 'FLOOD' && weather !== 'STORM') {
    return null;
  }

  const isStorm = weather === 'STORM';
  const isFlood = weather === 'FLOOD';
  const streakCount = isStorm ? 35 : isFlood ? 26 : 18;

  return (
    <div className="pointer-events-none absolute inset-0 z-35 overflow-hidden">
      {/* Sấm chớp chớp nháy khi bão */}
      {isStorm && (
        <div
          className="absolute inset-0 bg-white/20"
          style={{ animation: 'stormFlash 4s infinite ease-in-out' }}
        />
      )}

      {/* Các vệt mưa rơi xiên chéo */}
      <svg className="absolute inset-0 h-full w-full opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rainDropGrad" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {Array.from({ length: streakCount }).map((_, i) => {
          const x = (i * 73) % 2000;
          const y = (i * 47) % 600;
          const len = 18 + (i % 12);
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x - 14}
              y2={y + len}
              stroke="url(#rainDropGrad)"
              strokeWidth={i % 3 === 0 ? 2 : 1.2}
              strokeLinecap="round"
              style={{
                animation: `rainFall ${0.6 + (i % 5) * 0.1}s linear infinite`,
                animationDelay: `${(i % 10) * 0.08}s`,
              }}
            />
          );
        })}
      </svg>

      <style jsx>{`
        @keyframes stormFlash {
          0%, 92%, 100% { opacity: 0; }
          93% { opacity: 0.6; }
          94% { opacity: 0.1; }
          96% { opacity: 0.8; }
          98% { opacity: 0; }
        }
        @keyframes rainFall {
          0% { transform: translate(40px, -60px); }
          100% { transform: translate(-40px, 800px); }
        }
      `}</style>
    </div>
  );
}

/**
 * Lớp nước ngập triều cường trên mặt đường & vỉa hè
 * Có gợn sóng nhấp nhô, rác nổi/dép tông/vịt cao su trôi lờ lững
 */
export function FloodWaterLayer({ isFlooded }: { isFlooded?: boolean }) {
  if (!isFlooded) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-25 overflow-hidden">
      {/* Mặt nước triều cường dâng cao ánh xanh lục lam phản chiếu */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-cyan-900/60 via-sky-700/40 to-transparent transition-opacity duration-700"
        style={{ animation: 'waterShimmer 3s ease-in-out infinite alternate' }}
      />

      {/* Gợn sóng lăn tăn chạy ngang */}
      <div className="absolute inset-x-0 top-2 h-4 opacity-50">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 20">
          <path
            d="M0,10 C150,20 350,0 500,10 C650,20 850,0 1000,10 C1100,15 1150,5 1200,10 L1200,20 L0,20 Z"
            fill="#38BDF8"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Đồ vật trôi dạt trong dòng nước ngập: Dép tổ ong, lá bàng, thùng nhựa */}
      {[
        { left: 320, bottom: 22, text: '🩴', label: 'Dép tổ ong trôi' },
        { left: 740, bottom: 45, text: '🍂', label: 'Lá bàng' },
        { left: 1180, bottom: 18, text: '🦆', label: 'Vịt cao su' },
        { left: 1620, bottom: 35, text: '📦', label: 'Thùng carton' },
      ].map((item, idx) => (
        <div
          key={idx}
          className="absolute select-none text-base filter drop-shadow"
          style={{
            left: item.left,
            bottom: item.bottom,
            animation: `bobbingFloat ${2.5 + (idx % 2)}s ease-in-out infinite alternate`,
            animationDelay: `${idx * 0.4}s`,
          }}
          title={item.label}
        >
          {item.text}
        </div>
      ))}

      <style jsx>{`
        @keyframes waterShimmer {
          0% { opacity: 0.75; transform: translateY(0px); }
          100% { opacity: 0.95; transform: translateY(-3px); }
        }
        @keyframes bobbingFloat {
          0% { transform: translateY(0px) rotate(-6deg); }
          100% { transform: translateY(-6px) rotate(6deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Mây trời bay ban ngày / Ngôi sao lấp lánh ban đêm
 */
export function SkyAtmosphere({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  const isNight = timeOfDay === 'NIGHT';
  const weather = useCity((s) => s.weather ?? 'SUNNY');

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
      {!isNight && weather !== 'STORM' && (
        <div className="absolute top-4 inset-x-0 flex justify-around opacity-70">
          <div className="h-8 w-24 rounded-full bg-white/70 blur-[2px]" />
          <div className="h-10 w-32 rounded-full bg-white/60 blur-[2px] mt-2" />
          <div className="h-7 w-20 rounded-full bg-white/65 blur-[2px]" />
          <div className="h-9 w-28 rounded-full bg-white/50 blur-[2px] mt-1" />
        </div>
      )}

      {/* MÂY ĐEN GIÔNG BÃO */}
      {(weather === 'STORM' || weather === 'FLOOD') && (
        <div className="absolute top-2 inset-x-0 flex justify-around opacity-90">
          <div className="h-14 w-48 rounded-full bg-slate-800/80 blur-[4px]" />
          <div className="h-16 w-64 rounded-full bg-slate-900/85 blur-[5px] mt-2" />
          <div className="h-12 w-40 rounded-full bg-slate-800/80 blur-[4px]" />
          <div className="h-14 w-56 rounded-full bg-slate-900/75 blur-[4px] mt-1" />
        </div>
      )}

      {/* Màng phủ màu sắc tổng thể (Ambient Color Wash) */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-700"
        style={{
          backgroundColor:
            WEATHER_META[weather]?.ambientTint !== 'transparent'
              ? WEATHER_META[weather]?.ambientTint
              : TIME_OF_DAY_META[timeOfDay].ambientTint,
        }}
      />
    </div>
  );
}
