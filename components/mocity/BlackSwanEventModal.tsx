'use client';

import React from 'react';
import type { BlackSwanEventDef } from '../../lib/mocity/types';
import { formatVND } from '../../lib/mocity/currency';

interface Props {
  isOpen: boolean;
  event: BlackSwanEventDef | null;
  onClose: () => void;
  onMitigateWithTuiThanTai: () => void;
  onMitigateWithViTraSau: () => void;
}

export const BlackSwanEventModal: React.FC<Props> = ({
  isOpen,
  event,
  onClose,
  onMitigateWithTuiThanTai,
  onMitigateWithViTraSau,
}) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl shadow-rose-500/20 text-slate-100 overflow-hidden">
        
        {/* Warning Ribbon Header */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 p-6 text-white text-center relative">
          <span className="text-4xl block mb-2">{event.icon}</span>
          <span className="inline-block px-3 py-0.5 text-[10px] font-black uppercase tracking-widest bg-black/40 rounded-full border border-white/20 mb-1">
            ⚠️ Biến Cố Thiên Nga Đen (Act 4)
          </span>
          <h2 className="text-2xl font-black">{event.title}</h2>
          <p className="text-xs text-rose-100 mt-1">{event.description}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-rose-400 uppercase tracking-wider">Tác Động Tài Chính Khẩn Cấp:</h4>
            <ul className="space-y-1 text-slate-300">
              {event.revenueMultiplier !== 1.0 && (
                <li>📉 Doanh thu bán hàng giảm còn <strong>{(event.revenueMultiplier * 100).toFixed(0)}%</strong></li>
              )}
              {event.repairCostCoins && (
                <li>🔧 Chi phí khắc phục sự cố: <strong className="text-amber-400">{formatVND(event.repairCostCoins)}</strong></li>
              )}
              {event.debtInterestMultiplier > 1.0 && (
                <li>📈 Chi phí lãi vay tăng <strong>+{((event.debtInterestMultiplier - 1) * 100).toFixed(0)}%</strong></li>
              )}
              <li>⏳ Thời gian kéo dài: <strong>{event.durationDays} ngày</strong></li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200 space-y-1">
            <span className="font-bold block">💡 Lời khuyên Quản trị Rủi ro MoMo:</span>
            <p className="text-amber-200/90">{event.mitigationAdvice}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onMitigateWithTuiThanTai}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <span>💰 Rút Tiền Từ Túi Thần Tài Ứng Cứu</span>
            </button>

            <button
              onClick={onMitigateWithViTraSau}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <span>💳 Dùng Hạn Mức Ví Trả Sau MoMo</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
            >
              Chấp Nhận Chịu Tổn Thất & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
