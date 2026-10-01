'use client';

import React from 'react';
import type { TrafficPhase } from './useTrafficController';

interface TrafficLightPoleProps {
  phase: TrafficPhase;
  countdown: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function TrafficLightPole({
  phase,
  countdown,
  onClick,
  style,
}: TrafficLightPoleProps) {
  const isRed = phase === 'RED';
  const isYellow = phase === 'YELLOW';
  const isGreen = phase === 'GREEN';

  const timerColor = isRed ? '#EF4444' : isYellow ? '#F59E0B' : '#10B981';

  return (
    <div
      style={style}
      onClick={onClick}
      className={`group absolute z-30 flex flex-col items-center select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
      title="Cột Đèn Giao Thông Ngã Tư (Bấm để đổi tín hiệu điều phối)"
    >
      {/* HỘP ĐÈN TÍN HIỆU CHÍNH */}
      <div
        className="relative flex flex-col items-center rounded-[6px] border-2 border-[#1E1B18] px-1 py-1 shadow-md transition-transform group-hover:scale-105"
        style={{
          background: '#2B2620',
          boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
        }}
      >
        {/* Màn hình LED đếm ngược số giây mini */}
        <div className="mb-1 flex h-4 w-7 items-center justify-center rounded border border-black bg-black font-mono text-[10px] font-black leading-none tracking-tighter">
          <span style={{ color: timerColor }}>
            {countdown < 10 ? `0${countdown}` : countdown}
          </span>
        </div>

        {/* 3 MẮT ĐÈN TÍN HIỆU (ĐỎ - VÀNG - XANH) */}
        <div className="flex flex-col gap-1">
          {/* ĐÈN ĐỎ */}
          <div className="relative flex items-center justify-center">
            {/* Chao che nắng trên mắt đèn */}
            <div className="absolute -top-1 h-1 w-4 rounded-t-full bg-[#181411]" />
            <div
              className="h-4 w-4 rounded-full border border-black/60 transition-all duration-300"
              style={{
                backgroundColor: isRed ? '#EF4444' : '#3E1818',
                boxShadow: isRed
                  ? '0 0 10px #EF4444, 0 0 20px rgba(239,68,68,0.85), inset 0 0 4px #FCA5A5'
                  : 'none',
              }}
            />
          </div>

          {/* ĐÈN VÀNG */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -top-1 h-1 w-4 rounded-t-full bg-[#181411]" />
            <div
              className="h-4 w-4 rounded-full border border-black/60 transition-all duration-300"
              style={{
                backgroundColor: isYellow ? '#F59E0B' : '#38260E',
                boxShadow: isYellow
                  ? '0 0 10px #F59E0B, 0 0 20px rgba(245,158,11,0.85), inset 0 0 4px #FDE68A'
                  : 'none',
              }}
            />
          </div>

          {/* ĐÈN XANH */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -top-1 h-1 w-4 rounded-t-full bg-[#181411]" />
            <div
              className="h-4 w-4 rounded-full border border-black/60 transition-all duration-300"
              style={{
                backgroundColor: isGreen ? '#10B981' : '#0F3325',
                boxShadow: isGreen
                  ? '0 0 10px #10B981, 0 0 20px rgba(16,185,129,0.85), inset 0 0 4px #A7F3D0'
                  : 'none',
              }}
            />
          </div>
        </div>

        {/* HỘP ĐÈN NGƯỜI ĐI BỘ MINI (BÊN DƯỚI) */}
        <div className="mt-1.5 flex h-4 w-6 items-center justify-center rounded border border-[#181411] bg-[#1C1814]">
          {isRed ? (
            /* Khi xe đèn đỏ: người đi bộ được đi (Đèn xanh hình người bước) */
            <span
              className="text-[9px] font-black text-[#10B981] animate-pulse"
              style={{ textShadow: '0 0 6px #10B981' }}
            >
              🚶
            </span>
          ) : (
            /* Khi xe đèn xanh/vàng: người đi bộ dừng lại (Đèn đỏ hình bàn tay) */
            <span
              className="text-[9px] font-black text-[#EF4444]"
              style={{ textShadow: '0 0 6px #EF4444' }}
            >
              ✋
            </span>
          )}
        </div>
      </div>

      {/* CỘT THÉP VÀ ĐẾ CẢNH BÁO */}
      <div className="h-14 w-2 border-x border-[#1E1B18] bg-[#423B33]" />
      {/* Đế sọc vàng đen cảnh báo công trình */}
      <div
        className="h-3 w-5 border border-[#1E1B18]"
        style={{
          background: 'repeating-linear-gradient(45deg, #EAB308 0 3px, #1E1B18 3px 6px)',
        }}
      />
    </div>
  );
}
