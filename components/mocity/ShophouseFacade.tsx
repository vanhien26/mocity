'use client';

import React from 'react';
import {
  Coffee,
  Clapperboard,
  Sparkles,
  Zap,
  Store,
  BookOpen,
  Wrench,
  Star,
  ShieldCheck,
  Tv,
} from 'lucide-react';
import type { TimeOfDay } from '@/lib/mocity/types';
import { formatRate } from '@/lib/mocity/format';

export type ShopType =
  | 'TIRE_SHOP'
  | 'GROCERY'
  | 'STATIONERY'
  | 'RICE_SHOP'
  | 'CINEMA'
  | 'FINTECH'
  | 'CAFE';

export interface ShophouseFacadeProps {
  shopType: ShopType;
  houseNumber: number;
  shopTitle: string;
  isBuilt: boolean;
  unlocked: boolean;
  level?: number;
  starRating?: number;
  yieldPerSec?: number;
  timeOfDay?: TimeOfDay;
  wallBg: string;
  wallHatch: string;
  signBg: string;
  onOpenBuild?: () => void;
}

/* Bảng màu nhà ống theo kiểu minh họa phố Việt Nam */
const PALETTE: Record<ShopType, { wall: string; wall2: string; stripe: string; signBg: string; roofBg: string }> = {
  TIRE_SHOP:  { wall: '#F2EAD3', wall2: '#EDE0C0', stripe: '#C9A96A', signBg: '#8B6318', roofBg: '#E8D9B8' },
  GROCERY:    { wall: '#EEC830', wall2: '#E0B818', stripe: '#8B6200', signBg: '#5C3D08', roofBg: '#D4A810' },
  CAFE:       { wall: '#FAF3E4', wall2: '#F4E8D0', stripe: '#A07840', signBg: '#6B3C18', roofBg: '#EDD9B8' },
  RICE_SHOP:  { wall: '#FDEBD0', wall2: '#F5D8B4', stripe: '#9A6030', signBg: '#6B3010', roofBg: '#F0C898' },
  CINEMA:     { wall: '#F5DCF0', wall2: '#ECC8E4', stripe: '#7A2868', signBg: '#5A1048', roofBg: '#E0B0D4' },
  FINTECH:    { wall: '#D8EAF8', wall2: '#C0D8F0', stripe: '#1848A8', signBg: '#0C2878', roofBg: '#B8CFF0' },
  STATIONERY: { wall: '#ECF1F8', wall2: '#DDE7F2', stripe: '#2C60A0', signBg: '#183C80', roofBg: '#C8D8EC' },
};

/** Dam/nhat mot mau hex theo he so - tao lop giay phia sau thay cho vien. */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.min(255, Math.round(v * k));
  return `#${((1 << 24) | (c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1)}`;
}

export default function ShophouseFacade({
  shopType,
  houseNumber,
  shopTitle,
  isBuilt,
  unlocked,
  level = 1,
  starRating = 1,
  yieldPerSec = 0,
  timeOfDay = 'DAY',
  onOpenBuild,
}: ShophouseFacadeProps) {
  const isNight = timeOfDay === 'NIGHT';
  const isSunset = timeOfDay === 'SUNSET';
  const pal = PALETTE[shopType];

  /* Màu kính cửa sổ theo giờ */
  const winFill = isNight
    ? '#FEF08A'
    : isSunset
      ? '#FDBA74'
      : '#BDD8E8';

  const winShadow = isNight
    ? '0 0 10px rgba(254,240,138,0.8), inset 0 0 12px rgba(253,224,71,0.9)'
    : isSunset
      ? 'inset 0 0 8px rgba(249,115,22,0.35)'
      : 'none';

  /* Màu tường ban đêm tối hơn một chút */
  const wallColor = isNight
    ? `color-mix(in srgb, ${pal.wall} 60%, #1C1A14)`
    : pal.wall;
  const wall2Color = isNight
    ? `color-mix(in srgb, ${pal.wall2} 55%, #1C1A14)`
    : pal.wall2;

  /* Component cửa sổ tái sử dụng */
  /**
   * Cua so cut paper: khong vien nau. Khung la mot mang giay dam hon mau
   * tuong, kinh la mang phang dat long vao trong.
   */
  const frame = shade(pal.wall, 0.52);
  const Win = ({ wide = false, children }: { wide?: boolean; children?: React.ReactNode }) => (
    <div
      className="relative shrink-0"
      style={{ width: wide ? 76 : 58, height: wide ? 58 : 48, backgroundColor: frame }}
    >
      <div
        className="absolute overflow-hidden"
        style={{ inset: 4, backgroundColor: winFill, boxShadow: winShadow }}
      >
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2" style={{ backgroundColor: frame }} />
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2" style={{ backgroundColor: frame }} />
        {children}
      </div>
    </div>
  );

  return (
    <div className="relative w-full flex flex-col" style={{ backgroundColor: wallColor }}>

      {/* ═══ 1. SÂN THƯỢNG / PARAPET ═══════════════════════════════════ */}
      <div
        className="relative w-full flex items-end justify-between px-2 overflow-visible"
        style={{ height: 44, backgroundColor: pal.roofBg, borderBottom: `3px solid ${shade(pal.roofBg, 0.68)}` }}
      >
        {/* Viền gờ cornice trên cùng */}
        <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: pal.stripe }} />

        {/* Chi tiết sân thượng theo shop type */}
        {shopType === 'CAFE' && (
          <div className="absolute inset-x-2 top-3 flex justify-around items-center">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="h-3 w-3 "
                style={{ backgroundColor: isNight ? '#FDE047' : i%2===0 ? '#EC4899' : '#F59E0B',
                  boxShadow: isNight ? '0 0 6px #FDE047' : 'none' }} />
            ))}
          </div>
        )}
        {shopType === 'CINEMA' && (
          <div className="absolute inset-x-4 top-2 flex justify-center">
            <div className="flex items-center gap-1.5 rounded px-3 py-0.5"
              style={{ backgroundColor: isNight ? '#1E1B4B' : '#831843',
                boxShadow: isNight ? '0 0 12px rgba(236,72,153,0.9)' : 'none' }}>
              <Clapperboard size={10} className="text-pink-300 shrink-0" />
              <span className="text-[8px] font-black text-white tracking-widest">CINEMA</span>
            </div>
          </div>
        )}
        {shopType === 'FINTECH' && (
          <>
            <div className="flex flex-col items-center ml-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              <div className="h-5 w-0.5 bg-slate-500" />
            </div>
            <div className="h-4 w-12 rounded-full border border-slate-500 bg-gradient-to-b from-slate-200 to-slate-400 flex items-center justify-center mr-2">
              <span className="text-[6px] font-black text-blue-900">TÂN Á</span>
            </div>
          </>
        )}
        {shopType === 'RICE_SHOP' && (
          <div className="absolute top-2 inset-x-1 h-3 "
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #B91C1C 0px, #B91C1C 4px, #DC2626 4px, #DC2626 8px)' }} />
        )}
        {shopType === 'GROCERY' && (
          <div className="absolute top-2 inset-x-1 h-2.5 "
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #0D9488 0,#0D9488 4px,#0F766E 4px,#0F766E 8px)' }} />
        )}
        {shopType === 'TIRE_SHOP' && (
          <div className="absolute top-3 right-2 h-5 w-16 border-2 border-slate-500 bg-transparent"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg,#475569 0,#475569 1px,transparent 1px,transparent 6px)' }} />
        )}
        {shopType === 'STATIONERY' && (
          <div className="absolute top-2 right-3 rounded bg-blue-700 px-1 py-0.5 text-[7px] font-black text-white shadow">
            IN MÀU
          </div>
        )}

        {/* Gờ parapet dưới */}
        <div className="absolute bottom-0 inset-x-0 h-3"
          style={{ backgroundColor: pal.stripe }} />
      </div>

      {/* ═══ 2. TẦNG 3 — CỬA SỔ ════════════════════════════════════════ */}
      <div
        className="relative flex items-center justify-around px-5 py-3"
        style={{ backgroundColor: wallColor, borderBottom: `2px solid ${shade(pal.wall, 0.8)}` }}
      >
        <Win>
          {shopType === 'CAFE' && isNight && (
            <div className="absolute inset-0 flex items-center justify-center opacity-60">
              <Coffee size={10} className="text-amber-900" />
            </div>
          )}
        </Win>
        <Win>
          {shopType === 'STATIONERY' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              <BookOpen size={9} className="text-blue-900" />
            </div>
          )}
        </Win>
        {/* Điều hòa cục nóng góc phải */}
        <div className="absolute right-2 bottom-2 h-4 w-7 rounded-[2px] bg-white flex items-center justify-center shadow-sm">
          <div className="h-3 w-3 rounded-full bg-slate-200 flex items-center justify-center animate-spin"
            style={{ animationDuration: '4s' }}>
            <div className="h-px w-2 bg-slate-500" />
          </div>
        </div>
      </div>

      {/* ═══ 3. TẦNG 2 — BAN CÔNG ═══════════════════════════════════════ */}
      <div
        className="relative flex items-end justify-around gap-2 px-4 pt-2"
        style={{ backgroundColor: wall2Color }}
      >
        {/* Cửa sổ rộng tầng 2 */}
        <Win wide>
          {shopType === 'CINEMA' && (
            <div className="absolute inset-1 flex items-center justify-center rounded bg-pink-900/80">
              <span className="text-[7px] font-black text-pink-200 rotate-0">POSTER</span>
            </div>
          )}
          {shopType === 'FINTECH' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Tv size={14} className="text-cyan-800" />
            </div>
          )}
        </Win>
        <Win>
          {/* Rèm cửa nhẹ */}
          <div className="absolute bottom-0 inset-x-0 h-1/3 "
            style={{ backgroundColor: 'rgba(255,255,255,0.35)' }} />
        </Win>

        {/* Chậu hoa ban công */}
        <div className="absolute left-3 bottom-1 h-4 w-4 rounded-full bg-[#5A8A3C] flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-[#EC4899]" />
        </div>
        <div className="absolute right-2 bottom-1 h-4 w-4 rounded-full bg-[#5A8A3C]" />
      </div>

      {/* Bản lan can ban công — sàn bê tông + thanh ngang */}
      <div style={{ backgroundColor: wall2Color, paddingBottom: 2 }}>
        {/* Sàn slab bê tông */}
        <div className="w-full" style={{ height: 10, backgroundColor: '#D5C9A8', borderBottom: '3px solid #A89878' }} />
        {/* Thanh lan can ngang */}
        <div className="relative mx-1" style={{ height: 22, borderTop: '3px solid #B0A182', borderBottom: '3px solid #B0A182' }}>
          {/* Các thanh dọc */}
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute inset-y-0 w-px"
              style={{ left: `${10 + i * 9}%`, width: 2, backgroundColor: '#B0A182' }} />
          ))}
          {/* Dây phơi quần áo */}
          {(shopType === 'RICE_SHOP' || shopType === 'TIRE_SHOP') && (
            <div className="absolute inset-x-2 top-1 flex gap-1.5 pointer-events-none">
              <div className="h-3 w-2 rounded-b-sm bg-rose-500" />
              <div className="h-3.5 w-2.5 rounded-b-sm bg-blue-500" />
              <div className="h-2.5 w-2 rounded-b-sm bg-yellow-400" />
            </div>
          )}
        </div>
      </div>

      {/* ═══ 4. BẢNG HIỆU ════════════════════════════════════════════════ */}
      {/*
       * So nha truoc day la `absolute -bottom-4` nen no thong xuong tang tret
       * va de len badge MENU cua tiem. Gio no la mot flex item nam han trong
       * bang hieu, khong con cho de cham nhau.
       */}
      <div
        className="relative mx-0 flex h-[40px] items-center gap-1.5 px-2"
        style={{
          backgroundColor: isBuilt ? pal.signBg : '#5A5048',
          borderBottom: `3px solid ${shade(isBuilt ? pal.signBg : '#5A5048', 0.6)}`,
          textShadow: isNight ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
        }}
      >
        <span
          className="shrink-0 px-1.5 py-0.5 text-[9px] font-black leading-none text-white"
          style={{ backgroundColor: '#1D4ED8' }}
        >
          {houseNumber}
        </span>

        <span className="min-w-0 flex-1 truncate text-center text-[11px] font-black tracking-widest text-white uppercase">
          {isBuilt ? shopTitle : 'MẶT TIỀN TRỐNG'}
        </span>

        {isBuilt && (
          <span className="shrink-0 flex items-center px-1.5 py-0.5 text-[9px] font-black leading-none text-yellow-300"
            style={{ backgroundColor: shade(pal.signBg, 0.64) }}>
            C.{level}
            {Array.from({ length: Math.min(starRating, 3) }).map((_, i) => (
              <Star key={i} size={8} className="ml-0.5 fill-yellow-300 text-yellow-300" />
            ))}
          </span>
        )}
      </div>

      {/* ═══ 5. MẶT TIỀN TẦNG TRỆT (GROUND FLOOR) ══════════════════════ */}
      <div
        className="relative mx-0 mb-0 overflow-hidden"
        style={{
          height: 120,
          borderLeft: `3px solid ${shade(pal.wall, 0.62)}`,
          borderRight: `3px solid ${shade(pal.wall, 0.62)}`,
          borderBottom: `4px solid ${shade(pal.wall, 0.5)}`,
          backgroundColor: isBuilt
            ? (isNight ? '#2C2218' : '#FAF6EE')
            : (isNight ? '#2A2018' : '#E8E0CC'),
        }}
      >
        {isBuilt ? (
          <>
            {/* TIỆM SỬA XE MÁY */}
            {shopType === 'TIRE_SHOP' && (
              <div className="flex h-full w-full items-end justify-between px-3 pb-2" style={{ backgroundColor: isNight ? '#222018' : '#EDEBE0' }}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-end gap-2">
                    {/* Bình bơm */}
                    <div className="h-9 w-5 rounded-t bg-red-600 flex flex-col items-center justify-between py-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                      <span className="text-[5px] font-bold text-white">AIR</span>
                    </div>
                    {/* 3 lốp xe */}
                    <div className="flex flex-col gap-0.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="h-4 w-8 rounded-full border-[3px] border-[#1C1C1C] bg-[#3A3A3A]" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wrench size={9} className="text-slate-600" />
                    <span className="text-[7px] font-bold" style={{ color: isNight ? '#AAA' : '#444' }}>VÁ KHÔNG RUỘT</span>
                  </div>
                </div>
                {/* Thợ */}
                <div className="flex flex-col items-center mb-1 mr-1">
                  <div className="h-5 w-5 rounded-full bg-[#FDE6D2]" />
                  <div className="h-8 w-6 rounded-t bg-[#4D8B46] flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold">HẢI</span>
                  </div>
                </div>
              </div>
            )}

            {/* TẠP HÓA CÔ TƯ */}
            {shopType === 'GROCERY' && (
              <div className="flex h-full w-full flex-col justify-between px-2 pb-1 pt-1">
                {/* Mái hiên sọc đỏ trắng */}
                <div className="h-3 w-full rounded-b"
                  style={{ backgroundImage: 'repeating-linear-gradient(90deg,#DC2626 0,#DC2626 8px,#FFF 8px,#FFF 16px)', borderBottom: '1px solid #78533D' }} />
                {/* Kệ hàng */}
                <div className="grid grid-cols-6 gap-1 pb-1" style={{ borderBottom: '2px solid #78533D' }}>
                  {['#EF4444','#F59E0B','#10B981','#3B82F6','#EC4899','#8B5CF6'].map((c, i) => (
                    <div key={i} className="h-4 rounded-[1px]" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                    <div className="h-6 w-5 rounded-t bg-[#EC4899]" />
                  </div>
                  <div className="flex items-center gap-1 rounded border border-[#D82D8B] bg-[#FDF2F8] px-1.5 py-0.5 text-[8px] font-black text-[#D82D8B]">
                    <span>Loa QR</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* CÀ PHÊ MOMO */}
            {shopType === 'CAFE' && (
              <div className="flex h-full w-full flex-col justify-between p-2" style={{ backgroundColor: isNight ? '#1E1208' : '#FEF7EE' }}>
                <div className="flex items-center justify-between pb-1.5" style={{ borderBottom: '1px solid rgba(120,83,61,0.3)' }}>
                  <div className="rounded px-2 py-0.5 text-[7px] font-black text-amber-200" style={{ backgroundColor: '#1C1917' }}>
                    MENU · CÀ PHÊ MUỐI
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-black text-[#D82D8B]">
                    <Coffee size={11} /><span>MoMo Cafe</span>
                  </div>
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-6 rounded-b-md border-2 border-[#5A4A3F] bg-amber-100 flex flex-col justify-between items-center p-0.5">
                      <div className="h-1 w-full bg-[#D82D8B]" />
                      <div className="flex gap-0.5">
                        <span className="h-1 w-1 rounded-full bg-[#1C171A]" />
                        <span className="h-1 w-1 rounded-full bg-[#1C171A]" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t bg-[#78350F]" />
                    </div>
                  </div>
                  <div className="rounded border border-emerald-500 bg-emerald-100 px-1.5 py-0.5 text-[8px] font-black text-emerald-800">
                    +{formatRate(yieldPerSec)}
                  </div>
                </div>
              </div>
            )}

            {/* RẠP PHIM CINEMA */}
            {shopType === 'CINEMA' && (
              <div className="flex h-full w-full flex-col justify-between p-2 text-white" style={{ backgroundColor: '#2D1537' }}>
                <div className="flex justify-around items-center pb-1" style={{ borderBottom: '1px solid rgba(236,72,153,0.4)' }}>
                  <span className="text-[8px] font-black text-pink-300">BẮP RANG BƠ VÀNG</span>
                  <span className="text-[8px] font-black text-yellow-300">PHÒNG VIP</span>
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-6 border border-white/60 flex items-center justify-center font-black text-[7px]"
                      style={{ backgroundImage: 'repeating-linear-gradient(90deg,#DC2626 0,#DC2626 3px,#FFF 3px,#FFF 6px)' }}>
                      <span className="bg-black/60 px-0.5 rounded text-white">CORN</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-white bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t border border-white bg-[#D82D8B]" />
                    </div>
                  </div>
                  <div className="rounded bg-[#EB2F96] px-2 py-1 text-[8px] font-black text-white shadow">VÉ 2D/3D</div>
                </div>
              </div>
            )}

            {/* FINTECH / TÚI THẦN TÀI */}
            {shopType === 'FINTECH' && (
              <div className="flex h-full w-full flex-col justify-between p-2 text-white" style={{ backgroundColor: '#0C4A6E' }}>
                <div className="flex items-center justify-between pb-1 px-1 rounded" style={{ borderBottom: '1px solid rgba(56,189,248,0.4)', backgroundColor: 'rgba(12,26,48,0.6)' }}>
                  <span className="text-[7px] font-black text-yellow-300">LÃI SUẤT 6.1%/NĂM</span>
                  <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-6 rounded border-2 border-sky-300 bg-sky-900 flex flex-col items-center justify-between p-0.5">
                      <div className="h-2 w-4 rounded-[1px] flex items-center justify-center text-[5px] font-black text-white" style={{ backgroundColor: '#D82D8B' }}>MoMo</div>
                      <div className="h-1.5 w-4 bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-white bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t border border-white bg-[#1D4ED8]" />
                    </div>
                  </div>
                  <div className="rounded bg-sky-500 px-1.5 py-0.5 text-[8px] font-black text-white">TÚI THẦN TÀI</div>
                </div>
              </div>
            )}

            {/* TIỆM GẠO */}
            {shopType === 'RICE_SHOP' && (
              <div className="flex h-full w-full flex-col justify-between p-2" style={{ backgroundColor: isNight ? '#1C140A' : '#FEF9EE' }}>
                <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid rgba(120,83,61,0.3)' }}>
                  <span className="text-[7px] font-black text-amber-900">GẠO SẠCH ST25</span>
                  <span className="text-[7px] font-bold text-emerald-700">ĐÃ KIỂM ĐỊNH</span>
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-end gap-1.5">
                    <div className="h-7 w-6 rounded-t-sm border border-amber-800 bg-[#D4A373] flex items-center justify-center">
                      <span className="text-[6px] font-black text-white">ST25</span>
                    </div>
                    <div className="h-6 w-5 rounded-t-sm border border-amber-800 bg-[#CCD5AE] flex items-center justify-center">
                      <span className="text-[6px] font-black text-amber-900">NẾP</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t bg-[#9A3412]" />
                    </div>
                  </div>
                  <span className="text-[7px] font-bold text-amber-950">GIAO TẬN NƠI</span>
                </div>
              </div>
            )}

            {/* VĂN PHÒNG PHẨM */}
            {shopType === 'STATIONERY' && (
              <div className="flex h-full w-full flex-col justify-between p-2" style={{ backgroundColor: isNight ? '#101820' : '#F0FDF4' }}>
                <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid rgba(4,120,87,0.3)' }}>
                  <span className="text-[7px] font-black text-emerald-900">PHOTOCOPY · ĐÓNG SÁCH</span>
                  <span className="text-[7px] font-bold text-blue-700">A4/A3</span>
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-7 rounded-sm border-2 border-slate-500 bg-slate-300 flex flex-col justify-between p-0.5">
                      <div className="h-1 w-full bg-slate-500" />
                      <div className="h-2 w-3 bg-white border border-slate-400 ml-auto" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t bg-[#059669]" />
                    </div>
                  </div>
                  <div className="rounded bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black text-white">IN NHANH</div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* CỬA SẮT KÉO XẾP — ô đất trống */
          <div
            onClick={e => { e.stopPropagation(); onOpenBuild?.(); }}
            className="relative flex h-full w-full flex-col items-center justify-center cursor-pointer group"
            style={{
              backgroundColor: isNight ? '#28221A' : '#D8CEBC',
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0,rgba(0,0,0,0.08) 12px,transparent 12px,transparent 24px), repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 14px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.05) 0,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 14px)',
            }}
          >
            {/* Xe máy đỏ lờ mờ sau cửa */}
            <div className="mb-2 h-3 w-10 rounded-full border border-black/30 bg-red-600/50" />
            <span
              className="z-10 rounded-lg border px-3 py-1.5 text-[10px] font-black shadow transition-colors"
              style={{
                backgroundColor: 'rgba(0,0,0,0.65)',
                borderColor: '#D4A030',
                color: '#D4A030',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLSpanElement).style.background = '#D82D8B';
                (e.currentTarget as HTMLSpanElement).style.borderColor = '#FFF';
                (e.currentTarget as HTMLSpanElement).style.color = '#FFF';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLSpanElement).style.background = 'rgba(0,0,0,0.65)';
                (e.currentTarget as HTMLSpanElement).style.borderColor = '#D4A030';
                (e.currentTarget as HTMLSpanElement).style.color = '#D4A030';
              }}
            >
              {unlocked ? '+ Khai Trương Tiệm' : '○ Đất Chưa Mở'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
