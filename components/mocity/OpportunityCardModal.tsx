'use client';

import React from 'react';
import type { OpportunityCardDef, OpportunityChoice } from '../../lib/mocity/types';
import { formatVND } from '../../lib/mocity/currency';

interface Props {
  isOpen: boolean;
  card: OpportunityCardDef | null;
  onClose: () => void;
  onSelectChoice: (choice: OpportunityChoice) => void;
  playerCoins: number;
}

export const OpportunityCardModal: React.FC<Props> = ({
  isOpen,
  card,
  onClose,
  onSelectChoice,
  playerCoins,
}) => {
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-pink-500/30 shadow-2xl shadow-pink-500/10 text-slate-100 overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 p-6 text-white relative">
          <span className="inline-block px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest bg-black/30 rounded-full border border-white/20 mb-2">
            Thẻ Quyết Định Chiến Lược • {card.act.replace('_', ' ')}
          </span>
          <h2 className="text-2xl font-black">{card.title}</h2>
          <p className="text-xs text-pink-100/90 mt-1 leading-relaxed">{card.context}</p>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-slate-300 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            💡 {card.description}
          </p>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lựa Chọn Quyết Định Của Bạn:</h4>

            {card.choices.map((choice) => {
              const canAfford = playerCoins >= choice.costCoins;

              return (
                <div
                  key={choice.id}
                  className={`rounded-2xl border p-4 space-y-3 transition-all ${
                    canAfford
                      ? 'bg-slate-950/80 border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/50'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-slate-100 text-base">{choice.label}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">{choice.summaryEffect}</p>
                    </div>

                    <div className="text-right">
                      {choice.costCoins > 0 ? (
                        <span className={`text-xs font-black ${canAfford ? 'text-amber-400' : 'text-rose-400'}`}>
                          Chi phí: {formatVND(choice.costCoins)}
                        </span>
                      ) : choice.costCoins < 0 ? (
                        <span className="text-xs font-black text-emerald-400">
                          Thu về: {formatVND(Math.abs(choice.costCoins))}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Miễn phí</span>
                      )}
                    </div>
                  </div>

                  {/* Impact Summary Pills */}
                  <div className="flex flex-wrap gap-2 text-[11px] pt-2 border-t border-slate-800/60">
                    {choice.financialImpact.monthlyCashflowDeltaCoins !== 0 && (
                      <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                        choice.financialImpact.monthlyCashflowDeltaCoins > 0
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {choice.financialImpact.monthlyCashflowDeltaCoins > 0 ? '+' : ''}
                        {formatVND(choice.financialImpact.monthlyCashflowDeltaCoins)}/tháng
                      </span>
                    )}

                    {choice.borrowAmountCoins ? (
                      <span className="px-2.5 py-1 rounded-lg font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        💳 Vay: {formatVND(choice.borrowAmountCoins)}
                      </span>
                    ) : null}

                    {choice.equityDilutionPct ? (
                      <span className="px-2.5 py-1 rounded-lg font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        📈 Pha loãng: {choice.equityDilutionPct}% cổ phần
                      </span>
                    ) : null}

                    {choice.financialImpact.happinessDelta !== 0 && (
                      <span className="px-2.5 py-1 rounded-lg font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                        😊 Hạnh phúc {choice.financialImpact.happinessDelta > 0 ? '+' : ''}{choice.financialImpact.happinessDelta}%
                      </span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    disabled={!canAfford}
                    onClick={() => onSelectChoice(choice)}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md active:scale-95 ${
                      canAfford
                        ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-pink-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Xác Nhận Lựa Chọn Này' : 'Không Đủ Tiền Mặt'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
