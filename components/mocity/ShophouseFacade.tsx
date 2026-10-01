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
  wallBg,
  wallHatch,
  signBg,
  onOpenBuild,
}: ShophouseFacadeProps) {
  const isNight = timeOfDay === 'NIGHT';
  const isSunset = timeOfDay === 'SUNSET';

  // Màu cửa sổ phản chiếu theo thời gian
  const windowGlow = isNight
    ? 'bg-[#FEF08A] shadow-[inset_0_0_14px_rgba(253,224,71,0.9),0_0_12px_rgba(254,240,138,0.7)]'
    : isSunset
      ? 'bg-[#FDBA74] shadow-[inset_0_0_10px_rgba(249,115,22,0.4)]'
      : 'bg-[#FAF8F5]';

  const windowPaneBorder = isNight ? 'border-[#854D0E]/60' : 'border-[#5A4A3F]/50';

  return (
    <div className="relative w-full flex flex-col justify-end">
      {/* ── 1. MÁI NHÀ / SÂN THƯỢNG ĐẶC SẮC (ROOFTOP) ──────────────── */}
      <div className="relative h-10 w-full flex items-end justify-between px-2 overflow-visible">
        {/* CAFE: Dây đèn tròn sân thượng + Dàn hoa giấy rủ */}
        {shopType === 'CAFE' && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pointer-events-none">
            {/* Dây cờ đuôi nheo & đèn tròn */}
            <div className="flex w-full justify-around items-center px-1 mb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full border border-black/30 transition-colors ${
                    isNight
                      ? 'bg-amber-300 shadow-[0_0_8px_#FDE047]'
                      : i % 2 === 0
                        ? 'bg-pink-400'
                        : 'bg-amber-400'
                  }`}
                />
              ))}
            </div>
            {/* Hoa giấy buông rủ */}
            <div className="flex w-full justify-between px-2">
              <div className="h-3 w-8 rounded-b-full bg-pink-500/80 border border-[#4A3B32]" />
              <div className="h-4 w-10 rounded-b-full bg-purple-500/80 border border-[#4A3B32]" />
            </div>
          </div>
        )}

        {/* CINEMA: Mái vòm Art Deco + Chaser Marquee */}
        {shopType === 'CINEMA' && (
          <div className="absolute -top-3 inset-x-2 flex flex-col items-center">
            <div
              className={`rounded-t-xl border-2 border-[#5A4A3F] px-3 py-1 flex items-center gap-1.5 shadow ${
                isNight
                  ? 'bg-[#1E1B4B] border-pink-400 shadow-[0_0_14px_rgba(236,72,153,0.8)]'
                  : 'bg-[#831843]'
              }`}
            >
              <Clapperboard size={12} className="text-pink-300 shrink-0" />
              <span className="text-[9px] font-black text-white tracking-widest uppercase">
                CINEMA
              </span>
            </div>
          </div>
        )}

        {/* FINTECH: Cột ăng-ten viễn thông & Bồn nước inox Tân Á */}
        {shopType === 'FINTECH' && (
          <div className="absolute -top-4 inset-x-2 flex items-end justify-between pointer-events-none">
            {/* Cột ăng-ten có đèn đỏ đỉnh */}
            <div className="flex flex-col items-center ml-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              <div className="h-6 w-0.5 bg-[#475569]" />
            </div>
            {/* Bồn nước Inox nằm ngang */}
            <div className="flex flex-col items-center mr-2">
              <div className="h-4 w-11 rounded-full border border-slate-600 bg-gradient-to-b from-slate-200 via-white to-slate-400 flex items-center justify-center shadow-sm">
                <span className="text-[6px] font-black text-blue-900 tracking-tighter">TÂN Á</span>
              </div>
              <div className="flex gap-4">
                <div className="h-2 w-0.5 bg-slate-700" />
                <div className="h-2 w-0.5 bg-slate-700" />
              </div>
            </div>
          </div>
        )}

        {/* RICE_SHOP: Mái ngói đỏ dốc truyền thống + Lồng chim tre */}
        {shopType === 'RICE_SHOP' && (
          <div className="absolute -top-2 inset-x-0 flex justify-between items-end pointer-events-none">
            <div
              className="h-4 w-full border-t-2 border-b border-[#5A4A3F]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #B91C1C 0px, #B91C1C 5px, #DC2626 5px, #DC2626 10px)',
              }}
            />
            {/* Lồng chim treo */}
            <div className="absolute right-4 top-2 flex flex-col items-center">
              <div className="h-4 w-3.5 rounded-t-full border border-[#78350F] bg-amber-100/70 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
              </div>
            </div>
          </div>
        )}

        {/* TIRE_SHOP: Khung sắt chuồng cọp chống trộm + Bồn nước */}
        {shopType === 'TIRE_SHOP' && (
          <div className="absolute -top-3 inset-x-2 flex items-end justify-between pointer-events-none">
            {/* Khung chuồng cọp sắt hộp */}
            <div
              className="h-5 w-20 border-2 border-slate-600 bg-transparent"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #475569 0px, #475569 1px, transparent 1px, transparent 6px)',
              }}
            />
            <div className="h-4 w-10 rounded-full border border-slate-500 bg-slate-300 flex items-center justify-center">
              <span className="text-[5px] font-bold text-slate-700">INOX</span>
            </div>
          </div>
        )}

        {/* GROCERY: Mái tôn xanh ngọc lượn sóng + Giàn cây ớt */}
        {shopType === 'GROCERY' && (
          <div className="absolute -top-2.5 inset-x-1 flex items-end justify-between pointer-events-none">
            <div
              className="h-3 w-full border-t-2 border-[#5A4A3F] bg-[#0D9488]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #14B8A6 0px, #14B8A6 4px, #0F766E 4px, #0F766E 8px)',
              }}
            />
          </div>
        )}

        {/* STATIONERY: Bảng hiệu nhô dọc "PHOTOCOPY" */}
        {shopType === 'STATIONERY' && (
          <div className="absolute -top-4 right-3 flex flex-col items-center pointer-events-none">
            <div className="rounded border border-black/40 bg-blue-700 px-1 py-0.5 text-[7px] font-black text-white shadow">
              IN MÀU
            </div>
          </div>
        )}

        {/* Gờ tường sân thượng chung */}
        <div className="h-2.5 w-full border-b-2 border-[#5A4A3F] bg-[#D5CBB8]" />
      </div>

      {/* ── 2. TẦNG 3: CỬA SỔ & CHI TIẾT ĐẶC TRƯNG ────────────────── */}
      <div className="relative flex justify-around px-4 pt-3 pb-2.5 border-b border-[#5A4A3F]/30">
        {/* Cửa sổ 1 */}
        <div
          className={`h-[52px] w-[68px] rounded-[2px] border-2 border-[#5A4A3F] grid grid-cols-2 overflow-hidden transition-all duration-300 ${windowGlow}`}
        >
          <div className={`border-r ${windowPaneBorder} flex items-center justify-center`}>
            {isNight && <span className="h-1.5 w-1.5 rounded-full bg-[#FDE68A] opacity-90" />}
          </div>
          <div className="flex items-center justify-center">
            {shopType === 'CAFE' && <Coffee size={10} className="shrink-0 text-[#78350F]/60" />}
          </div>
        </div>

        {/* Cửa sổ 2 */}
        <div
          className={`h-[52px] w-[68px] rounded-[2px] border-2 border-[#5A4A3F] grid grid-cols-2 overflow-hidden transition-all duration-300 ${windowGlow}`}
        >
          <div className={`border-r ${windowPaneBorder}`} />
          <div className="flex items-center justify-center">
            {shopType === 'STATIONERY' && <BookOpen size={9} className="text-blue-800/60" />}
          </div>
        </div>

        {/* Cục nóng điều hòa (gắn góc phải) */}
        <div className="absolute right-1.5 bottom-1 h-4 w-6 rounded-[2px] border border-[#5A4A3F] bg-white flex items-center justify-center shadow-sm">
          <div
            className="h-3 w-3 rounded-full border border-[#5A4A3F] bg-slate-100 flex items-center justify-center"
            style={{ animation: 'spin 3s linear infinite' }}
          >
            <div className="h-0.5 w-2 bg-slate-600" />
          </div>
        </div>
      </div>

      {/* ── 3. TẦNG 2: BAN CÔNG & NỘI THẤT VINTAGE ──────────────────── */}
      <div className="relative flex flex-col justify-end px-3.5 pt-2.5 pb-1">
        {/* Khung cửa ban công */}
        <div className="flex justify-around items-end">
          {/* Cửa sổ vòm hoặc cửa kính ban công */}
          <div
            className={`h-14 w-16 border-2 border-[#5A4A3F] rounded-t-sm flex items-center justify-center transition-all ${windowGlow}`}
          >
            {shopType === 'CINEMA' ? (
              <div className="rounded bg-pink-900/80 px-1 py-0.5 text-[7px] font-black text-pink-200">
                POSTER
              </div>
            ) : shopType === 'FINTECH' ? (
              <Tv size={12} className="text-cyan-800" />
            ) : null}
          </div>

          <div
            className={`h-16 w-12 border-2 border-[#5A4A3F] rounded-t-sm flex items-end justify-center transition-all ${windowGlow}`}
          >
            {/* Rèm vải hoặc cửa chớp */}
            <div className="h-8 w-full bg-slate-200/50 border-t border-[#5A4A3F]/30" />
          </div>
        </div>

        {/* Lan can sắt mỹ thuật tầng 2 */}
        <div
          className="mt-[-6px] h-6 w-full border-2 border-[#3E352F] relative flex items-center justify-around overflow-hidden"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #3E352F 0px, #3E352F 2px, transparent 2px, transparent 6px)',
          }}
        >
          {/* Dây phơi quần áo cho tiệm Gạo/Sửa xe */}
          {(shopType === 'RICE_SHOP' || shopType === 'TIRE_SHOP') && (
            <div className="absolute inset-x-2 top-0.5 flex gap-2 pointer-events-none">
              <div className="h-3 w-2.5 bg-rose-500 rounded-b-sm" />
              <div className="h-3.5 w-3 bg-blue-500 rounded-b-sm" />
              <div className="h-2.5 w-2 bg-yellow-400 rounded-b-sm" />
            </div>
          )}
        </div>

        {/* Chậu hoa / cây cảnh ban công */}
        <div className="absolute bottom-2 left-4 h-4 w-4 rounded-full border border-[#3E2A1B] bg-[#689F4D] flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-[#EC4899]" />
        </div>
        <div className="absolute bottom-2 right-4 h-4 w-4 rounded-full border border-[#3E2A1B] bg-[#689F4D] flex items-center justify-center">
          <span className="h-2 w-0.5 rounded-full bg-[#15803D]" />
        </div>
      </div>

      {/* ── 4. BẢNG HIỆU TẦNG TRỆT (SIGNBOARD) ────────────────────── */}
      <div
        className="relative mx-1.5 mt-1 flex h-10 items-center justify-center border-2 border-[#5A4A3F] px-2.5 shadow-sm transition-all"
        style={{
          background: isBuilt ? signBg : '#78716C',
          color: '#FFFFFF',
          textShadow: isNight ? '0 0 10px rgba(255,255,255,0.9), 0 0 20px currentColor' : 'none',
        }}
      >
        {/* Biển số nhà xanh dương cổ điển ("Số 2", "Số 4"...) */}
        <span className="absolute -bottom-4 left-1.5 z-10 rounded-[3px] border border-white bg-[#1D4ED8] px-1.5 py-0.5 text-[9px] font-black text-white shadow">
          Số {houseNumber}
        </span>

        {/* Tiêu đề tiệm */}
        <span className="truncate text-xs font-black tracking-wider uppercase">
          {isBuilt ? shopTitle : 'MẶT TIỀN TRỐNG'}
        </span>

        {/* Cấp độ & Sao của tiệm */}
        {isBuilt && (
          <span className="ml-1.5 flex items-center rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-black text-yellow-300">
            C.{level}
            {Array.from({ length: Math.min(starRating, 3) }).map((_, i) => (
              <Star key={i} size={8} className="ml-0.5 fill-yellow-300 text-yellow-300" />
            ))}
          </span>
        )}
      </div>

      {/* ── 5. MẶT TIỀN TẦNG TRỆT (124PX CAO) ──────────────────────── */}
      <div
        className={`relative mx-1.5 mt-1.5 mb-0 h-[124px] border-2 border-b-0 border-[#5A4A3F] overflow-hidden transition-colors ${
          isNight ? 'bg-[#3A3026]' : 'bg-[#F7F4EB]'
        }`}
      >
        {isBuilt ? (
          <>
            {/* 1. TIỆM SỬA XE MÁY & VÁ VỎ */}
            {shopType === 'TIRE_SHOP' && (
              <div className="flex h-full w-full items-end justify-between p-2.5 bg-[#E5E5E0]">
                {/* Chồng lốp xe Michelin đen & Bình bơm hơi đỏ */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    {/* Bình bơm hơi đỏ */}
                    <div className="h-9 w-5 rounded-t-sm border border-black/50 bg-red-600 flex flex-col items-center justify-between py-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                      <span className="text-[5px] font-bold text-white">AIR</span>
                    </div>
                    {/* Chồng lốp */}
                    <div className="flex flex-col gap-0.5">
                      <div className="h-4 w-8 rounded-full border-[3px] border-[#27272A] bg-[#52525B]" />
                      <div className="h-4 w-8 rounded-full border-[3px] border-[#27272A] bg-[#52525B]" />
                      <div className="h-4 w-8 rounded-full border-[3px] border-[#27272A] bg-[#52525B]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wrench size={10} className="text-slate-700" />
                    <span className="text-[7px] font-bold text-slate-800">VÁ KHÔNG RUỘT</span>
                  </div>
                </div>

                {/* Thợ sửa xe & xe máy */}
                <div className="flex flex-col items-center mr-2">
                  <div className="h-5 w-5 rounded-full border border-[#3E2A1B] bg-[#FDE6D2]" />
                  <div className="h-8 w-6 rounded-t border border-[#3E2A1B] bg-[#4D8B46] flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold">HẢI</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TẠP HÓA CÔ TƯ */}
            {shopType === 'GROCERY' && (
              <div className="flex h-full w-full flex-col justify-between p-1.5 bg-[#FFFDF9]">
                {/* Mái hiên sọc đỏ trắng vươn ra */}
                <div
                  className="h-3 w-full border-b border-[#78533D]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, #DC2626 0px, #DC2626 8px, #FFFFFF 8px, #FFFFFF 16px)',
                  }}
                />

                {/* Kệ hàng nhiều màu */}
                <div className="grid grid-cols-6 gap-1 border-b-2 border-[#78533D] pb-1">
                  <div className="h-3.5 bg-[#EF4444] rounded-[1px]" />
                  <div className="h-3.5 bg-[#F59E0B] rounded-[1px]" />
                  <div className="h-3.5 bg-[#10B981] rounded-[1px]" />
                  <div className="h-3.5 bg-[#3B82F6] rounded-[1px]" />
                  <div className="h-3.5 bg-[#EC4899] rounded-[1px]" />
                  <div className="h-3.5 bg-[#8B5CF6] rounded-[1px]" />
                </div>

                {/* Cô Tư & QR Loa */}
                <div className="flex items-end justify-between px-1">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full border border-[#3E2A1B] bg-[#FDE6D2]" />
                    <div className="h-6 w-5 rounded-t border border-[#3E2A1B] bg-[#EC4899]" />
                  </div>
                  <div className="flex items-center gap-1 rounded border border-[#D82D8B] bg-[#FDF2F8] px-1.5 py-0.5 text-[8px] font-black text-[#D82D8B]">
                    <span>Loa QR</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* 3. TRÀ SỮA & CÀ PHÊ MOMO */}
            {shopType === 'CAFE' && (
              <div className="flex h-full w-full flex-col justify-between p-2 bg-[#FEF7EE]">
                {/* Quầy bar cafe & Menu bảng đen */}
                <div className="flex items-center justify-between border-b border-amber-900/30 pb-1.5">
                  <div className="rounded bg-[#1C1917] px-2 py-0.5 text-[7px] font-black text-amber-200">
                    MENU · CÀ PHÊ MUỐI
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-black text-[#D82D8B]">
                    <Coffee size={12} className="shrink-0" />
                    <span>MoMo Cafe</span>
                  </div>
                </div>

                {/* Barista & Ly trà sữa khổng lồ */}
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    {/* Ly trà sữa */}
                    <div className="h-9 w-6 rounded-b-md border-2 border-[#5A4A3F] bg-amber-100 flex flex-col justify-between items-center p-0.5">
                      <div className="h-1 w-full bg-[#D82D8B]" />
                      <div className="flex gap-0.5">
                        <span className="h-1 w-1 rounded-full bg-[#1C171A]" />
                        <span className="h-1 w-1 rounded-full bg-[#1C171A]" />
                      </div>
                    </div>
                    {/* Barista */}
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-[#3E2A1B] bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t border border-[#3E2A1B] bg-[#78350F]" />
                    </div>
                  </div>
                  {/* Doanh thu Xu */}
                  <div className="rounded bg-emerald-100 border border-emerald-500 px-1.5 py-0.5 text-[8px] font-black text-emerald-800">
                    +{formatRate(yieldPerSec)}
                  </div>
                </div>
              </div>
            )}

            {/* 4. RẠP PHIM MOMO CINEMA */}
            {shopType === 'CINEMA' && (
              <div className="flex h-full w-full flex-col justify-between p-2 bg-[#2D1537] text-white">
                {/* Đèn trần rạp phim */}
                <div className="flex justify-around items-center border-b border-pink-500/40 pb-1">
                  <span className="text-[8px] font-black text-pink-300">BẮP RANG BƠ VÀNG</span>
                  <span className="text-[8px] font-black text-yellow-300">PHÒNG CHIẾU VIP</span>
                </div>

                {/* Quầy bắp nước & Nhân viên rạp */}
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    {/* Hộp bắp rang bơ đỏ trắng */}
                    <div
                      className="h-8 w-6 border border-white/60 flex items-center justify-center font-black text-[7px]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, #DC2626 0px, #DC2626 3px, #FFFFFF 3px, #FFFFFF 6px)',
                      }}
                    >
                      <span className="bg-black/60 px-0.5 rounded text-white">CORN</span>
                    </div>
                    {/* Nhân viên rạp áo vest hồng */}
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-white bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t border border-white bg-[#D82D8B]" />
                    </div>
                  </div>

                  <div className="rounded bg-[#EB2F96] px-2 py-1 text-[8px] font-black text-white shadow">
                    VÉ 2D/3D
                  </div>
                </div>
              </div>
            )}

            {/* 5. TRẠM TÚI THẦN TÀI & TÀI CHÍNH */}
            {shopType === 'FINTECH' && (
              <div className="flex h-full w-full flex-col justify-between p-2 bg-[#0C4A6E] text-white">
                {/* Màn hình điện tử LED lãi suất */}
                <div className="flex items-center justify-between border-b border-sky-400/40 pb-1 bg-sky-950/60 px-1.5 py-0.5 rounded">
                  <span className="text-[7px] font-black text-yellow-300">LÃI SUẤT 6.1%/NĂM</span>
                  <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
                </div>

                {/* Cây ATM MoMo & Giao dịch viên */}
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    {/* Cây ATM MoMo phát sáng */}
                    <div className="h-9 w-6 rounded border-2 border-sky-300 bg-sky-900 flex flex-col items-center justify-between p-0.5">
                      <div className="h-2 w-4 bg-[#D82D8B] rounded-[1px] flex items-center justify-center text-[5px] font-black text-white">
                        MoMo
                      </div>
                      <div className="h-1.5 w-4 bg-emerald-400 animate-pulse" />
                    </div>
                    {/* Chuyên viên tài chính */}
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-white bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t border border-white bg-[#1D4ED8]" />
                    </div>
                  </div>

                  <div className="rounded bg-sky-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                    TÚI THẦN TÀI
                  </div>
                </div>
              </div>
            )}

            {/* 6. TIỆM GẠO TÁM THƠM */}
            {shopType === 'RICE_SHOP' && (
              <div className="flex h-full w-full flex-col justify-between p-2 bg-[#FEF9EE]">
                {/* Biển hiệu gạo ST25 */}
                <div className="flex items-center justify-between border-b border-amber-800/30 pb-1">
                  <span className="text-[7px] font-black text-amber-900">GẠO SẠCH ST25</span>
                  <span className="text-[7px] font-bold text-emerald-700">ĐÃ KIỂM ĐỊNH</span>
                </div>

                {/* Các bao tải gạo cắm cờ & Cân đĩa */}
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-end gap-1.5">
                    {/* Bao tải gạo 1 */}
                    <div className="h-7 w-6 rounded-t-sm border border-amber-800 bg-[#D4A373] flex flex-col items-center justify-center">
                      <span className="text-[6px] font-black text-white">ST25</span>
                    </div>
                    {/* Bao tải gạo 2 */}
                    <div className="h-6 w-5 rounded-t-sm border border-amber-800 bg-[#CCD5AE] flex flex-col items-center justify-center">
                      <span className="text-[6px] font-black text-amber-900">NẾP</span>
                    </div>
                    {/* Bác chủ tiệm */}
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-[#3E2A1B] bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t border border-[#3E2A1B] bg-[#9A3412]" />
                    </div>
                  </div>

                  <span className="text-[7px] font-bold text-amber-950">GIAO TẬN NƠI</span>
                </div>
              </div>
            )}

            {/* 7. VĂN PHÒNG PHẨM & PHOTOCOPY */}
            {shopType === 'STATIONERY' && (
              <div className="flex h-full w-full flex-col justify-between p-2 bg-[#F0FDF4]">
                {/* Bảng in ấn */}
                <div className="flex items-center justify-between border-b border-emerald-800/30 pb-1">
                  <span className="text-[7px] font-black text-emerald-900">PHOTOCOPY · ĐÓNG SÁCH</span>
                  <span className="text-[7px] font-bold text-blue-700">A4/A3</span>
                </div>

                {/* Máy photocopy & Kệ sách */}
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    {/* Máy photocopy xám */}
                    <div className="h-8 w-7 rounded-sm border-2 border-slate-600 bg-slate-300 flex flex-col justify-between p-0.5">
                      <div className="h-1 w-full bg-slate-500" />
                      <div className="h-2 w-3 bg-white border border-slate-400 ml-auto" />
                    </div>
                    {/* Nhân viên sinh viên */}
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-[#3E2A1B] bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t border border-[#3E2A1B] bg-[#059669]" />
                    </div>
                  </div>

                  <div className="rounded bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black text-white">
                    IN NHANH
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* CỬA SẮT KÉO XẾP NGANG VIỆT NAM (CHO Ô ĐẤT CHƯA XÂY TIỆM) */
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenBuild?.();
            }}
            className="relative flex h-full w-full flex-col items-center justify-center bg-[#3F3A36] cursor-pointer group"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #2E2A27 0px, #2E2A27 6px, #4A443F 6px, #4A443F 12px)',
            }}
          >
            {/* Nan xếp chéo chữ X của cửa sắt kéo */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #FFF 0px, #FFF 1px, transparent 1px, transparent 12px), repeating-linear-gradient(-45deg, #FFF 0px, #FFF 1px, transparent 1px, transparent 12px)',
              }}
            />

            {/* Chiếc xe máy đỏ dựng thấp thoáng sau lớp cửa sắt xếp */}
            <div className="mb-1 h-2.5 w-9 rounded-full bg-[#DC2626]/75 border border-black/40" />

            <span className="z-10 rounded-lg border border-amber-300 bg-black/80 px-2.5 py-1 text-[10px] font-black text-amber-300 shadow group-hover:bg-[#D82D8B] group-hover:text-white group-hover:border-white transition-colors">
              {unlocked ? '+ Khai Trương Tiệm' : '○ Đất Chưa Mở'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
