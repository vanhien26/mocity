'use client';

import React, { useState } from 'react';
import type { EndingEvaluation, NpcMicroLedger, WealthMatrixMetrics } from '../../lib/mocity/types';
import { formatVND } from '../../lib/mocity/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  metrics: WealthMatrixMetrics;
  ending: EndingEvaluation;
  npcLedgers: NpcMicroLedger[];
  onGrantLoan: (npcId: string, amount: number) => void;
  onInvestEquity: (npcId: string, amount: number, pct: number) => void;
}

export const WealthMatrixModal: React.FC<Props> = ({
  isOpen,
  onClose,
  metrics,
  ending,
  npcLedgers,
  onGrantLoan,
  onInvestEquity,
}) => {
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'NPC_LEDGERS'>('MATRIX');
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [investmentType, setInvestmentType] = useState<'LOAN' | 'EQUITY'>('LOAN');

  if (!isOpen) return null;

  const selectedNpc = npcLedgers.find((n) => n.npcId === selectedNpcId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-pink-500/20">
              💎
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                Cơ Đồ MoCity: WEALTH MATRIX
              </h2>
              <p className="text-xs text-slate-400 font-medium">Hệ thống Đánh giá 7 Chiều & Hồ sơ Kinh tế Cư dân</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6">
          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'MATRIX'
                ? 'border-pink-500 text-pink-400 bg-pink-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 7 Chỉ Số Cơ Đồ & Ending
          </button>
          <button
            onClick={() => setActiveTab('NPC_LEDGERS')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'NPC_LEDGERS'
                ? 'border-pink-500 text-pink-400 bg-pink-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            👥 Cư Dân & Góp Vốn (Micro-Ledger)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'MATRIX' ? (
            <>
              {/* Ending Profile Highlight Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 via-purple-950/40 to-slate-900 border border-purple-500/30 p-6 shadow-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
                      {ending.badge}
                    </span>
                    <h3 className="text-2xl font-black text-white">{ending.title}</h3>
                    <p className="text-sm font-medium text-purple-200/80 italic mt-0.5">{ending.subtitle}</p>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-xl">{ending.description}</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-purple-500/20 min-w-[120px]">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Điểm Cơ Đồ</span>
                    <span className="text-4xl font-black text-pink-400 mt-1">{ending.score}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Thang điểm 100</span>
                  </div>
                </div>

                {/* Strengths & Vulnerabilities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-700/50">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">✅ Điểm Mạnh Cốt Lõi:</h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {ending.keyStrengths.map((s, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-emerald-400">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">⚠️ Điểm Cần Tối Ưu:</h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {ending.keyVulnerabilities.map((v, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-amber-400">•</span> {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 7-Dimension Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  title="1. Tổng Định Giá Tài Sản"
                  value={formatVND(metrics.totalAssetsValuation)}
                  icon="💎"
                  color="from-emerald-500 to-teal-600"
                  desc="Bất động sản + Tiền mặt + Cổ phần NPC"
                />
                <MetricCard
                  title="2. Dòng Tiền Thuần Hàng Tháng"
                  value={`${metrics.monthlyNetCashflow >= 0 ? '+' : ''}${formatVND(metrics.monthlyNetCashflow)}/tháng`}
                  icon="💸"
                  color={metrics.monthlyNetCashflow >= 0 ? 'from-green-500 to-emerald-600' : 'from-rose-500 to-red-600'}
                  desc="Lợi nhuận ròng sau chi phí cố định & nợ"
                />
                <MetricCard
                  title="3. Tỷ Lệ Thanh Khoản"
                  value={`${metrics.liquidityRatio}x`}
                  icon="🌊"
                  color={metrics.liquidityRatio >= 1.0 ? 'from-cyan-500 to-blue-600' : 'from-amber-500 to-orange-600'}
                  desc="Số tháng chi phí sống sót bằng Tiền mặt"
                />
                <MetricCard
                  title="4. Tỷ Lệ Nợ / Tài Sản"
                  value={`${(metrics.debtToAssetRatio * 100).toFixed(1)}%`}
                  icon="🏦"
                  color={metrics.debtToAssetRatio < 0.3 ? 'from-blue-500 to-indigo-600' : 'from-rose-600 to-red-700'}
                  desc="Mức độ đòn bẩy rủi ro nợ vay"
                />
                <MetricCard
                  title="5. Chỉ Số Rủi Ro Danh Mục"
                  value={`${metrics.portfolioRiskIndex} / 100`}
                  icon="🎯"
                  color={metrics.portfolioRiskIndex < 35 ? 'from-violet-500 to-purple-600' : 'from-orange-500 to-amber-600'}
                  desc="Độ đa dạng hóa kênh đầu tư"
                />
                <MetricCard
                  title="6. Hạnh Phúc Cư Dân"
                  value={`${Math.round(metrics.citizenHappinessIndex)}%`}
                  icon="😊"
                  color="from-pink-500 to-rose-500"
                  desc="An sinh & Mức độ hài lòng thị trấn"
                />
              </div>
            </>
          ) : (
            /* NPC Micro-Ledgers Tab */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Xem bảng cân đối kế toán cá nhân từng cư dân và đưa ra quyết định <strong className="text-pink-400">Cho Vay</strong> hoặc <strong className="text-purple-400">Góp Vốn Cổ Phần</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {npcLedgers.map((npc) => {
                  const moodBadge =
                    npc.mood === 'ECSTATIC'
                      ? '🤩 Hào Hứng'
                      : npc.mood === 'HAPPY'
                      ? '😊 Vui Vẻ'
                      : npc.mood === 'ANXIOUS'
                      ? '😰 Lo Lắng'
                      : npc.mood === 'STRESSED'
                      ? '😤 Áp Lực'
                      : '😱 Tuyệt Vọng';

                  const moodColor =
                    npc.mood === 'ECSTATIC' || npc.mood === 'HAPPY'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : npc.mood === 'ANXIOUS' || npc.mood === 'STRESSED'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

                  const activityText =
                    npc.currentActivity === 'WORKING'
                      ? '🛠️ Đang Làm Việc'
                      : npc.currentActivity === 'SHOPPING'
                      ? '🛍️ Đang Mua Sắm'
                      : npc.currentActivity === 'COMMUTING'
                      ? '🚗 Đang Di Chuyển'
                      : '🛌 Đang Nghỉ Nơi';

                  return (
                    <div
                      key={npc.npcId}
                      className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md"
                            style={{ backgroundColor: npc.avatarHue }}
                          >
                            {npc.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-100 text-base">{npc.name}</h4>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${moodColor}`}>
                                {moodBadge}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-400">{npc.roleTitle}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                          {activityText}
                        </span>
                      </div>

                      {/* Bio Quote */}
                      {npc.bioQuote && (
                        <p className="text-xs italic text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                          &ldquo;{npc.bioQuote}&rdquo;
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl text-xs">
                        <div>
                          <span className="text-slate-500 block">Thu Nhập:</span>
                          <span className="font-bold text-emerald-400">{formatVND(npc.monthlyIncome)}/tháng</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Chi Phí Hàng Tháng:</span>
                          <span className="font-bold text-slate-300">{formatVND(npc.monthlyExpense)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Tiết Kiệm Tích Lũy:</span>
                          <span className="font-bold text-cyan-400">{formatVND(npc.savings)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Dư Nợ Hiện Tại:</span>
                          <span className="font-bold text-rose-400">{formatVND(npc.currentDebt)}</span>
                        </div>
                      </div>

                      {/* Relationships & Goal */}
                      <div className="space-y-1 text-[11px] text-slate-400">
                        {npc.familyTies.length > 0 && (
                          <p>
                            👨‍👩‍👧 <strong className="text-slate-300">Gia đình: </strong>
                            {npc.familyTies.map((f) => `${f.relation === 'SPOUSE' ? 'Vợ/Chồng' : f.relation === 'PARENT' ? 'Cha/Mẹ' : f.relation === 'CHILD' ? 'Con' : 'Anh em'} với ${f.relatedNpcId}`).join(', ')}
                          </p>
                        )}

                        {npc.businessRelations.length > 0 && (
                          <p>
                            🤝 <strong className="text-slate-300">Chuỗi làm ăn: </strong>
                            {npc.businessRelations.map((b) => `${b.relationType === 'SUPPLIER' ? 'Cung cấp hàng' : b.relationType === 'CLIENT' ? 'Khách đối tác' : 'Hợp tác'} với ${b.partnerNpcId}`).join(', ')}
                          </p>
                        )}

                        <p>
                          🎯 <strong className="text-slate-300">Mục tiêu: </strong>
                          <span className="text-slate-200">{npc.financialGoal}</span>
                        </p>
                      </div>

                      {/* Active Investment Status */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-800/60 text-xs">
                        {npc.playerLoan ? (
                          <div className="flex justify-between items-center bg-blue-950/40 border border-blue-500/20 p-2 rounded-lg text-blue-300">
                            <span>💳 Đang vay bạn: <strong>{formatVND(npc.playerLoan.amount)}</strong></span>
                            <span className="text-[10px] font-bold">Lãi 2%/tháng</span>
                          </div>
                        ) : null}

                        {npc.playerEquity ? (
                          <div className="flex justify-between items-center bg-purple-950/40 border border-purple-500/20 p-2 rounded-lg text-purple-300">
                            <span>📈 Sở hữu: <strong>{npc.playerEquity.ownershipPct}% cổ phần</strong></span>
                            <span className="text-[10px] font-bold">Cổ tức +{formatVND(npc.playerEquity.monthlyDividend)}/tháng</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => onGrantLoan(npc.npcId, 20_000_000)}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
                        >
                          💵 Cho Vay 20M
                        </button>
                        <button
                          onClick={() => onInvestEquity(npc.npcId, 30_000_000, 20)}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
                        >
                          📈 Góp Vốn 30M (20%)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: string;
  color: string;
  desc: string;
}> = ({ title, value, icon, color, desc }) => (
  <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-2 hover:border-slate-700 transition-all">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-400">{title}</span>
      <span className="text-base">{icon}</span>
    </div>
    <div className={`text-xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
      {value}
    </div>
    <p className="text-[11px] text-slate-500">{desc}</p>
  </div>
);
