'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle,
  CreditCard,
  HelpCircle,
  Percent,
  PiggyBank,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import {
  buyMoMoInsurancePackage,
  depositSavings,
  investFund,
  repayLoan,
  settleFund,
  takeLoan,
  useCity,
  withdrawSavings,
} from '@/lib/mocity/store';
import { formatVND, formatVNDCompact } from '@/lib/mocity/currency';
import { playKaChing, playPop, playTing } from '@/lib/mocity/sound-engine';
import { particles } from './ParticleEngine';
import MicroQuizModal from './MicroQuizModal';

export type FinanceTab = 'SAVINGS' | 'INVEST' | 'LOAN' | 'INSURANCE';

export default function MoMoFinanceModal({
  isOpen,
  onClose,
  initialTab = 'SAVINGS',
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: FinanceTab;
}) {
  const [tab, setTab] = useState<FinanceTab>(initialTab);
  const [quizOpen, setQuizOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // State từ store
  const coins = useCity((s) => s.coins);
  const creditScore = useCity((s) => s.trustScore ?? 650);
  const mayorPoints = useCity((s) => s.mayorPoints ?? 100);
  const debt = useCity((s) => s.debt ?? 0);
  const savingsBalance = useCity((s) => s.savingsBalance ?? 0);
  const savingsTier = useCity((s) => s.savingsTier ?? 'NONE');
  const savingsStartedAt = useCity((s) => s.savingsStartedAt ?? 0);
  const investedFundId = useCity((s) => s.investedFundId ?? 'NONE');
  const investedAmount = useCity((s) => s.investedAmount ?? 0);
  const hasInsurance = useCity((s) => Boolean(s.hasInsurance && (s.insuranceActiveUntilMs ?? 0) > Date.now()));
  const insuranceUntil = useCity((s) => s.insuranceActiveUntilMs ?? 0);
  const insuranceClaimsPaid = useCity((s) => s.insuranceClaimsPaid ?? 0);

  // Form states cho Tiết Kiệm
  const [savingsDepositAmount, setSavingsDepositAmount] = useState<number>(100_000);
  const [selectedTier, setSelectedTier] = useState<'1D' | '3D' | '7D'>('1D');

  // Form states cho Quỹ Đầu Tư
  const [selectedFund, setSelectedFund] = useState<'SAFE' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');
  const [fundInvestAmount, setFundInvestAmount] = useState<number>(200_000);

  // Form states cho Vay
  const [borrowAmount, setBorrowAmount] = useState<number>(500_000);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Tính hạn mức vay dựa trên credit score
  const maxCreditLimit = Math.round((creditScore / 850) * 50_000_000);
  const remainingCreditLimit = Math.max(0, maxCreditLimit - debt);

  // Handler Tiết kiệm
  const handleDepositSavings = () => {
    const res = depositSavings(savingsDepositAmount, selectedTier);
    if (res.ok) {
      playTing(1.2);
      particles.coinShower(window.innerWidth / 2, window.innerHeight * 0.4, 15);
      showFeedback(res.message);
    } else {
      showFeedback(res.message);
    }
  };

  const handleWithdrawSavings = () => {
    const res = withdrawSavings();
    if (res.ok) {
      playKaChing();
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
      showFeedback(res.message);
    } else {
      showFeedback(res.message);
    }
  };

  // Handler Quỹ Đầu Tư
  const handleInvestFund = () => {
    const res = investFund(selectedFund, fundInvestAmount);
    if (res.ok) {
      playTing(1.1);
      particles.coinShower(window.innerWidth / 2, window.innerHeight * 0.4, 15);
      showFeedback(res.message);
    } else {
      showFeedback(res.message);
    }
  };

  const handleSettleFund = () => {
    const res = settleFund();
    if (res.ok) {
      if (res.profit >= 0) {
        playKaChing();
        particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
      }
      showFeedback(res.message);
    } else {
      showFeedback(res.message);
    }
  };

  // Handler Vay / Trả
  const handleTakeLoan = () => {
    const res = takeLoan(borrowAmount);
    if (res.ok) {
      playKaChing();
      showFeedback(`Đã giải ngân khoản vay +${formatVND(borrowAmount)} vào ví!`);
    } else {
      showFeedback(
        res.reason === 'needBank'
          ? 'Cần xây Ngân Hàng Số trên phố để kích hoạt tín dụng!'
          : 'Vượt quá hạn mức tín dụng cho phép.'
      );
    }
  };

  const handleRepayLoan = (amount: number) => {
    const res = repayLoan(amount);
    if (res.ok) {
      playKaChing();
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
      showFeedback(`Đã thanh toán nợ -${formatVND(res.amount)}! Điểm tín dụng được cải thiện.`);
    } else {
      showFeedback('Không đủ tiền trong ví để trả nợ.');
    }
  };

  // Handler Bảo Hiểm
  const handleBuyInsurance = () => {
    const res = buyMoMoInsurancePackage(2_000_000);
    if (res.ok) {
      playKaChing();
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
      showFeedback(res.message);
    } else {
      showFeedback(res.message);
    }
  };

  const remainingInsuranceDays = insuranceUntil > Date.now()
    ? Math.ceil((insuranceUntil - Date.now()) / (24 * 3600 * 1000))
    : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex h-[92vh] max-h-[720px] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-4 border-[#8B5E1A] bg-[#FAF6ED] shadow-2xl">
        {/* HEADER VỚI MÁI HIÊN CHIBI */}
        <div
          className="relative shrink-0 px-4 py-3.5 text-white"
          style={{
            background: 'linear-gradient(135deg, #A8246B 0%, #C2185B 60%, #880E4F 100%)',
            boxShadow: '0 4px 12px rgba(168,36,107,0.3)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner">
                🏦
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-pixel text-base font-black tracking-wide text-amber-200">
                    NGÂN KHỐ ĐÔ THỊ & HEO ĐẤT
                  </h2>
                  <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[9px] font-black uppercase text-[#5C2D0E]">
                    Quản Lý Vốn
                  </span>
                </div>
                <p className="text-xs font-semibold text-pink-100">
                  Dòng tiền xây phố · Heo đất sinh lãi · Vốn mở rộng mặt bằng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Nút bật Micro Quiz */}
              <button
                type="button"
                onClick={() => setQuizOpen(true)}
                className="flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-400 px-2.5 py-1.5 text-[11px] font-black text-[#5C2D0E] shadow transition-transform hover:bg-amber-300 active:scale-95"
                title="Trả lời câu hỏi trắc nghiệm tài chính để nhận tiền và MP"
              >
                <Sparkles size={13} className="shrink-0" />
                <span className="hidden sm:inline">Đố Vui Phố Thị</span>
                <span>+50Kđ</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/25 text-white/90 transition-colors hover:bg-black/45 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Dải số dư ví & Uy tín nhanh */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/20 bg-black/20 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <Wallet size={15} className="text-amber-300" />
              <span className="text-white/80">Số dư ví:</span>
              <span className="font-pixel text-sm font-bold text-amber-200">
                {formatVND(coins)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-pink-200">Điểm Tín Dụng:</span>
                <span className="font-pixel font-bold text-emerald-300">{creditScore}/850</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <Award size={13} className="text-amber-300" />
                <span className="font-pixel font-bold text-amber-300">{mayorPoints} MP</span>
              </div>
            </div>
          </div>
        </div>

        {/* FEEDBACK TOAST NỘI BỘ */}
        {toastMsg && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-center text-xs font-bold text-[#78350F] animate-in slide-in-from-top-1">
            {toastMsg}
          </div>
        )}

        {/* TAB NAVIGATION CHIBI */}
        <div className="flex shrink-0 border-b-2 border-[#E5DAC6] bg-[#F3ECE0] px-3 pt-2">
          {[
            { id: 'SAVINGS' as FinanceTab, label: 'Heo Đất Tiết Kiệm', icon: PiggyBank, color: '#A8246B' },
            { id: 'INVEST' as FinanceTab, label: 'Quỹ Dự Trữ & Lãi', icon: TrendingUp, color: '#2563EB' },
            { id: 'LOAN' as FinanceTab, label: 'Vay Vốn Mở Rộng', icon: CreditCard, color: '#D97706' },
            { id: 'INSURANCE' as FinanceTab, label: 'Quỹ Bảo Vệ Phố', icon: Shield, color: '#059669' },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  playPop();
                  setTab(t.id);
                }}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-t-2xl py-2.5 text-xs font-black transition-all ${
                  active
                    ? 'border-2 border-b-0 border-[#78533D] bg-[#FAF6ED] text-[#1C171A] shadow-[0_-2px_6px_rgba(0,0,0,0.05)]'
                    : 'text-[#6B5A4E] hover:bg-[#EBE3D3] hover:text-[#1C171A]'
                }`}
              >
                <Icon size={15} style={{ color: active ? t.color : undefined }} />
                <span>{t.label}</span>
                {t.id === 'SAVINGS' && savingsBalance > 0 && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
                {t.id === 'INVEST' && investedAmount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                )}
                {t.id === 'LOAN' && debt > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* NỘI DUNG CUỘN CHÍNH */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: TIẾT KIỆM MOMO */}
          {tab === 'SAVINGS' && (
            <div className="space-y-4">
              {savingsBalance > 0 ? (
                /* THẺ SỔ TIẾT KIỆM ĐANG MỞ */
                <div className="rounded-3xl border-2 border-emerald-400 bg-emerald-50/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow">
                        🐷
                      </span>
                      <div>
                        <h4 className="font-pixel text-sm font-black text-emerald-950">
                          SỔ TIẾT KIỆM KỲ HẠN {savingsTier}
                        </h4>
                        <p className="text-[11px] text-emerald-700">Đang sinh lãi theo thời gian thực</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-black text-emerald-800">
                      Đang Hoạt Động
                    </span>
                  </div>

                  <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3 border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Tiền Gốc Đã Gửi</span>
                      <p className="font-pixel text-base font-black text-emerald-800">
                        {formatVND(savingsBalance)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Lãi Dự Kiến</span>
                      <p className="font-pixel text-base font-black text-emerald-600">
                        +{formatVND(
                          Math.round(
                            savingsBalance *
                              (savingsTier === '1D' ? 0.02 : savingsTier === '3D' ? 0.09 : 0.35)
                          )
                        )}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1 rounded-2xl bg-white p-3 border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Kỳ Hạn</span>
                      <p className="text-xs font-black text-emerald-900">
                        {savingsTier === '1D' ? '1 Ngày (2%/ngày)' : savingsTier === '3D' ? '3 Ngày (3%/ngày)' : '7 Ngày (5%/ngày)'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <p className="font-bold">⚠️ Bài Học Quản Lý Dòng Tiền:</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                      Nếu tất toán trước hạn, bạn chỉ nhận lại tiền gốc (Lãi 0%). Hãy kiên nhẫn để Lãi Kép phát huy sức mạnh!
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleWithdrawSavings}
                      className="flex items-center gap-1.5 rounded-2xl border-2 border-emerald-700 bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow transition-transform hover:bg-emerald-700 active:scale-95"
                    >
                      <PiggyBank size={16} />
                      <span>Tất Toán Sổ Tiết Kiệm</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CHƯA MỞ SỔ TIẾT KIỆM - GIAO DIỆN MỞ MỚI */
                <div className="space-y-4">
                  <div className="rounded-3xl border-2 border-[#E0D4C0] bg-white p-5 shadow-sm">
                    <h4 className="font-pixel text-sm font-black text-[#3E2A1B]">
                      CHỌN KỲ HẠN GỬI TIẾT KIỆM
                    </h4>
                    <p className="text-xs text-gray-600">
                      Tiền nhàn rỗi trong ví không sinh lời. Hãy nuôi Heo Đất để tích lũy vốn mở thêm tiệm mới!
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {[
                        { tier: '1D' as const, name: 'Linh Hoạt 1 Ngày', rate: '2%/ngày', total: '+2%', min: '50Kđ' },
                        { tier: '3D' as const, name: 'Tích Lũy 3 Ngày', rate: '3%/ngày', total: '+9%', min: '100Kđ' },
                        { tier: '7D' as const, name: 'Kỳ Quan 7 Ngày', rate: '5%/ngày', total: '+35%', min: '200Kđ' },
                      ].map((item) => {
                        const isChosen = selectedTier === item.tier;
                        return (
                          <button
                            key={item.tier}
                            type="button"
                            onClick={() => {
                              playPop();
                              setSelectedTier(item.tier);
                            }}
                            className={`flex flex-col items-start rounded-2xl border-2 p-3 text-left transition-all ${
                              isChosen
                                ? 'border-[#A8246B] bg-pink-50 ring-2 ring-pink-300'
                                : 'border-[#E5DAC6] bg-[#FAF7F0] hover:border-pink-300'
                            }`}
                          >
                            <span className="text-[11px] font-black text-[#3E2A1B]">{item.name}</span>
                            <span className="font-pixel text-base font-black text-[#A8246B]">{item.rate}</span>
                            <span className="mt-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              Tổng lãi: {item.total}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <label className="text-xs font-bold text-gray-700">Số tiền muốn gửi (VNĐ):</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          step={50_000}
                          min={50_000}
                          max={coins}
                          value={savingsDepositAmount}
                          onChange={(e) => setSavingsDepositAmount(Math.max(0, Number(e.target.value)))}
                          className="flex-1 rounded-xl border-2 border-[#D5CEBF] bg-[#FAF7F0] px-3 py-2 text-sm font-bold text-[#1C171A] focus:border-[#A8246B] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setSavingsDepositAmount(Math.min(coins, 500_000))}
                          className="rounded-xl border border-gray-300 bg-gray-100 px-2.5 py-2 text-xs font-bold hover:bg-gray-200"
                        >
                          500K
                        </button>
                        <button
                          type="button"
                          onClick={() => setSavingsDepositAmount(Math.min(coins, 2_000_000))}
                          className="rounded-xl border border-gray-300 bg-gray-100 px-2.5 py-2 text-xs font-bold hover:bg-gray-200"
                        >
                          2.000K
                        </button>
                        <button
                          type="button"
                          onClick={() => setSavingsDepositAmount(coins)}
                          className="rounded-xl border border-[#A8246B] bg-pink-100 px-2.5 py-2 text-xs font-black text-[#A8246B] hover:bg-pink-200"
                        >
                          Tất Cả
                        </button>
                      </div>

                      {/* Dự toán lãi */}
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-pink-50 p-2.5 text-xs border border-pink-200">
                        <span className="font-semibold text-pink-900">Lãi dự kiến khi đáo hạn:</span>
                        <span className="font-pixel text-sm font-black text-[#A8246B]">
                          +{formatVND(
                            Math.round(
                              savingsDepositAmount *
                                (selectedTier === '1D' ? 0.02 : selectedTier === '3D' ? 0.09 : 0.35)
                            )
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={handleDepositSavings}
                        disabled={savingsDepositAmount <= 0 || coins < savingsDepositAmount}
                        className="flex items-center gap-1.5 rounded-2xl border-2 border-[#73164A] bg-[#A8246B] px-6 py-3 text-xs font-black text-white shadow transition-transform hover:bg-[#B8307A] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <PiggyBank size={16} />
                        <span>Mở Sổ Tiết Kiệm Ngay</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUỸ ĐẦU TƯ */}
          {tab === 'INVEST' && (
            <div className="space-y-4">
              {investedAmount > 0 ? (
                /* ĐANG CÓ DANH MỤC ĐẦU TƯ */
                <div className="rounded-3xl border-2 border-blue-400 bg-blue-50/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white shadow">
                        📈
                      </span>
                      <div>
                        <h4 className="font-pixel text-sm font-black text-blue-950">
                          DANH MỤC QUỸ {investedFundId}
                        </h4>
                        <p className="text-[11px] text-blue-700">Tài sản đang tăng trưởng theo thị trường</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-200 px-3 py-1 text-xs font-black text-blue-900">
                      Đang Giao Dịch
                    </span>
                  </div>

                  <div className="my-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-3 border border-blue-200">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Vốn Rót Ban Đầu</span>
                      <p className="font-pixel text-base font-black text-blue-900">
                        {formatVND(investedAmount)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 border border-blue-200">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Mục Tiêu Lợi Nhuận</span>
                      <p className="font-pixel text-base font-black text-emerald-600">
                        {investedFundId === 'SAFE' ? '+5%/ngày' : investedFundId === 'BALANCED' ? '+10%/ngày' : '+20%/ngày'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-white p-3 text-xs text-blue-950">
                    <p className="font-bold">💡 Nguyên Tắc Đầu Tư:</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                      Lợi nhuận đi kèm rủi ro. Bạn có thể chốt lời bất cứ lúc nào hoặc chấp nhận biến động để gặt hái thành quả dài hạn!
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSettleFund}
                      className="flex items-center gap-1.5 rounded-2xl border-2 border-blue-800 bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow transition-transform hover:bg-blue-700 active:scale-95"
                    >
                      <TrendingUp size={16} />
                      <span>Chốt Lời / Cắt Lỗ Danh Mục</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CHƯA ĐẦU TƯ - CHỌN QUỸ */
                <div className="space-y-4">
                  <div className="rounded-3xl border-2 border-[#E0D4C0] bg-white p-5 shadow-sm">
                    <h4 className="font-pixel text-sm font-black text-[#3E2A1B]">
                      3 QUỸ ĐẦU TƯ TÀI CHÍNH MOMO
                    </h4>
                    <p className="text-xs text-gray-600">
                      Đa dạng hóa danh mục theo khẩu vị rủi ro của bạn
                    </p>

                    <div className="mt-3 space-y-2.5">
                      {[
                        {
                          id: 'SAFE' as const,
                          name: 'Quỹ Trái Phiếu An Toàn',
                          target: '+5%/ngày',
                          range: 'Biến động nhẹ +4% ~ +6%',
                          risk: 'Rủi ro rất thấp',
                          riskColor: 'text-emerald-700 bg-emerald-100',
                          icon: '🛡️',
                        },
                        {
                          id: 'BALANCED' as const,
                          name: 'Quỹ Cân Bằng Cổ Phiếu & Trái Phiếu',
                          target: '+10%/ngày',
                          range: 'Biến động vừa -5% ~ +20%',
                          risk: 'Rủi ro trung bình',
                          riskColor: 'text-amber-800 bg-amber-100',
                          icon: '⚖️',
                        },
                        {
                          id: 'AGGRESSIVE' as const,
                          name: 'Quỹ Tăng Trưởng Công Nghệ Cao',
                          target: '+20%/ngày',
                          range: 'Biến động mạnh -25% ~ +35%',
                          risk: 'Rủi ro cao',
                          riskColor: 'text-rose-800 bg-rose-100',
                          icon: '🚀',
                        },
                      ].map((f) => {
                        const isChosen = selectedFund === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              playPop();
                              setSelectedFund(f.id);
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl border-2 p-3 text-left transition-all ${
                              isChosen
                                ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300'
                                : 'border-[#E5DAC6] bg-[#FAF7F0] hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{f.icon}</span>
                              <div>
                                <h5 className="text-xs font-black text-[#1C171A]">{f.name}</h5>
                                <p className="text-[11px] text-gray-500">{f.range}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-pixel text-sm font-black text-blue-700">{f.target}</span>
                              <div>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${f.riskColor}`}>
                                  {f.risk}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <label className="text-xs font-bold text-gray-700">Vốn đầu tư (VNĐ):</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          step={100_000}
                          min={100_000}
                          max={coins}
                          value={fundInvestAmount}
                          onChange={(e) => setFundInvestAmount(Math.max(0, Number(e.target.value)))}
                          className="flex-1 rounded-xl border-2 border-[#D5CEBF] bg-[#FAF7F0] px-3 py-2 text-sm font-bold text-[#1C171A] focus:border-blue-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setFundInvestAmount(Math.min(coins, 500_000))}
                          className="rounded-xl border border-gray-300 bg-gray-100 px-2.5 py-2 text-xs font-bold hover:bg-gray-200"
                        >
                          500K
                        </button>
                        <button
                          type="button"
                          onClick={() => setFundInvestAmount(Math.min(coins, 2_000_000))}
                          className="rounded-xl border border-gray-300 bg-gray-100 px-2.5 py-2 text-xs font-bold hover:bg-gray-200"
                        >
                          2.000K
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={handleInvestFund}
                        disabled={fundInvestAmount <= 0 || coins < fundInvestAmount}
                        className="flex items-center gap-1.5 rounded-2xl border-2 border-blue-800 bg-blue-600 px-6 py-3 text-xs font-black text-white shadow transition-transform hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <TrendingUp size={16} />
                        <span>Rót Vốn Vào Quỹ</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VÍ TRẢ SAU & VAY NỢ */}
          {tab === 'LOAN' && (
            <div className="space-y-4">
              <div className="rounded-3xl border-2 border-[#E0D4C0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <h4 className="font-pixel text-sm font-black text-[#3E2A1B]">
                      VAY VỐN ĐẦU TƯ & MỞ RỘNG MẶT BẰNG
                    </h4>
                    <p className="text-xs text-gray-500">
                      Hạn mức cấp tự động theo Điểm Tín Dụng & Uy Tín Thị Trưởng
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500">Điểm Uy Tín</span>
                    <p className="font-pixel text-sm font-black text-emerald-600">
                      {creditScore} / 850
                    </p>
                  </div>
                </div>

                {/* Đo tiến độ hạn mức */}
                <div className="my-4 rounded-2xl bg-[#FAF7F0] p-4 border border-[#E5DAC6]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">Dư Nợ Hiện Tại:</span>
                    <span className="font-pixel text-base font-black text-rose-600">
                      {formatVND(debt)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Hạn Mức Còn Lại Được Vay:</span>
                    <span className="font-pixel font-bold text-emerald-700">
                      {formatVND(remainingCreditLimit)}
                    </span>
                  </div>

                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${maxCreditLimit > 0 ? Math.min(100, (debt / maxCreditLimit) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* BÀI HỌC TÀI CHÍNH */}
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                  <p className="font-bold">⭐ Quy Tắc Tín Dụng:</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    Vay vốn để mở rộng tiệm sinh lời là đòn bẩy thông minh. Thanh toán nợ đúng hạn thưởng ngay <strong>+20 Điểm Tín Dụng</strong> và <strong>+20 MP</strong>!
                  </p>
                </div>

                {/* Vay Thêm */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <label className="text-xs font-bold text-gray-700">Vay thêm vào ví (VNĐ):</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      step={100_000}
                      min={100_000}
                      max={remainingCreditLimit}
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(Math.max(0, Number(e.target.value)))}
                      className="flex-1 rounded-xl border-2 border-[#D5CEBF] bg-[#FAF7F0] px-3 py-2 text-sm font-bold text-[#1C171A] focus:border-amber-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setBorrowAmount(Math.min(remainingCreditLimit, 1_000_000))}
                      className="rounded-xl border border-gray-300 bg-gray-100 px-2.5 py-2 text-xs font-bold"
                    >
                      1.000K
                    </button>
                    <button
                      type="button"
                      onClick={() => setBorrowAmount(Math.min(remainingCreditLimit, 5_000_000))}
                      className="rounded-xl border border-gray-300 bg-gray-100 px-2.5 py-2 text-xs font-bold"
                    >
                      5.000K
                    </button>
                    <button
                      type="button"
                      onClick={handleTakeLoan}
                      disabled={borrowAmount <= 0 || remainingCreditLimit < borrowAmount}
                      className="rounded-xl border-2 border-amber-700 bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-40"
                    >
                      Vay Ngay
                    </button>
                  </div>
                </div>

                {/* Trả Nợ */}
                {debt > 0 && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      <span className="text-xs font-bold text-gray-700">Thanh toán nợ:</span>
                      <p className="text-[11px] text-gray-500">Giảm trừ ngay dư nợ để nâng uy tín</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRepayLoan(Math.min(coins, Math.round(debt / 2)))}
                        disabled={coins <= 0}
                        className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-bold hover:bg-gray-200"
                      >
                        Trả 50%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRepayLoan(Math.min(coins, debt))}
                        disabled={coins <= 0}
                        className="rounded-xl border-2 border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        Trả Toàn Bộ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BẢO HIỂM PHỐ THỊ */}
          {tab === 'INSURANCE' && (
            <div className="space-y-4">
              <div className="rounded-3xl border-2 border-[#E0D4C0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white text-xl shadow">
                      🛡️
                    </span>
                    <div>
                      <h4 className="font-pixel text-sm font-black text-[#3E2A1B]">
                        GÓI BẢO HIỂM PHỐ THỊ TOÀN DIỆN
                      </h4>
                      <p className="text-xs text-gray-500">
                        Phòng vệ rủi ro hỏa hoạn, ngập lụt, trộm cắp và khiếu nại
                      </p>
                    </div>
                  </div>
                  <div>
                    {hasInsurance ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                        <CheckCircle size={14} />
                        Còn {remainingInsuranceDays} ngày
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                        Chưa Tham Gia
                      </span>
                    )}
                  </div>
                </div>

                <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <span className="text-[10px] font-bold uppercase text-emerald-800">Quyền Lợi Bảo Hiểm</span>
                    <ul className="mt-1 space-y-1 text-xs font-semibold text-emerald-950">
                      <li>✓ Bồi thường 100% thiệt hại hỏa hoạn chập điện</li>
                      <li>✓ Chi trả toàn bộ phí khắc phục trộm cắp két sắt</li>
                      <li>✓ Miễn phí giải quyết khủng hoảng truyền thông</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-[#FAF7F0] p-3">
                    <span className="text-[10px] font-bold uppercase text-gray-500">Thống Kê Bồi Thường</span>
                    <p className="mt-1 font-pixel text-base font-black text-emerald-700">
                      {formatVND(insuranceClaimsPaid)}
                    </p>
                    <p className="text-[11px] text-gray-500">Đã được quỹ bảo vệ hỗ trợ bồi thường</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950">
                  <p className="font-bold">🛡️ Bài Học Bảo Vệ Tài Sản:</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    Bảo hiểm là chi phí bỏ ra để bảo vệ dòng tiền khỏi các sự cố không thể lường trước. Người làm chủ thông thái luôn mua bảo hiểm trước khi có biến cố xảy ra!
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <span className="text-xs text-gray-500">Phí bảo hiểm:</span>
                    <p className="font-pixel text-sm font-black text-[#A8246B]">
                      2.000.000đ / 7 ngày
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBuyInsurance}
                    disabled={coins < 2_000_000}
                    className="flex items-center gap-1.5 rounded-2xl border-2 border-emerald-700 bg-emerald-600 px-6 py-3 text-xs font-black text-white shadow transition-transform hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    <ShieldCheck size={16} />
                    <span>{hasInsurance ? 'Gia Hạn Thêm 7 Ngày' : 'Kích Hoạt Bảo Hiểm (2.000Kđ)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL QUIZ 1 CÂU */}
      <MicroQuizModal isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}
