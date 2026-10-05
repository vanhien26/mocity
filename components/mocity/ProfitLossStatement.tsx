'use client';

import { useEffect, useState } from 'react';

import {
  useCity,
  useCityDerived,
  takeLoan,
  repayLoan,
  markTutorialFlag,
  transferToPersonalWealth,
  depositToWorkingCapital,
  depositToTuiThanTai,
  withdrawFromTuiThanTai,
  buyMoMoInsurance,
} from '@/lib/mocity/store';
import {
  COVERAGE_WARNING_AT,
  LOAN_ANNUAL_RATE,
  MAX_DEBT_TO_EBIT,
  TUI_THAN_TAI_RATE_YEAR,
} from '@/lib/mocity/city-calculator';
import type { PeriodLedger } from '@/lib/mocity/types';
import { formatNumber, formatRate } from '@/lib/mocity/format';

type Period = 'day' | 'month' | 'life';

const PERIOD_LABEL: Record<Period, string> = {
  day: 'Hôm nay',
  month: 'Tháng này',
  life: 'Từ trước đến nay',
};

/**
 * Mot dong cua bao cao. `indent` lam noi bat dong tong cong.
 * `strong` cho dong ket qua - do la dong nguoi choi can nhin.
 */
function Row({
  label,
  sublabel,
  value,
  tone = 'plain',
  indent = false,
  strong = false,
  hint,
}: {
  label: string;
  sublabel?: string;
  value: number;
  tone?: 'plain' | 'minus' | 'plus' | 'total';
  indent?: boolean;
  strong?: boolean;
  hint?: string;
}) {
  const color =
    tone === 'minus'
      ? '#B91C1C'
      : tone === 'plus'
        ? '#047857'
        : tone === 'total'
          ? '#1C171A'
          : '#3E2A1B';
  const bg = strong ? '#FDF4E3' : 'transparent';
  return (
    <div
      className="flex items-baseline justify-between gap-3 px-2 py-1.5"
      style={{
        background: bg,
        borderTop: strong ? '1px solid #C9A22744' : undefined,
        paddingLeft: indent ? '1.25rem' : undefined,
      }}
    >
      <div className="flex flex-col">
        <span
          className="text-[13px] font-semibold"
          style={{ color: strong ? '#4A3018' : '#6E4F3A' }}
          title={hint}
        >
          {label}
        </span>
        {sublabel && (
          <span className="text-[9.5px] font-medium text-[#8C6D58] italic leading-tight">
            {sublabel}
          </span>
        )}
      </div>
      <span
        className="shrink-0 tabular-nums font-black"
        style={{ color, fontSize: strong ? 13 : 12 }}
      >
        {formatNumber(Math.round(value))}
      </span>
    </div>
  );
}

function Pct({ value }: { value: number }) {
  return (
    <span
      className="ml-1 rounded px-1 text-[11px] font-black"
      style={{
        background: value >= 0 ? '#DCFCE7' : '#FEE2E2',
        color: value >= 0 ? '#047857' : '#B91C1C',
      }}
    >
      {(value * 100).toFixed(0)}%
    </span>
  );
}

/**
 * BAO CAO KET QUA KINH DOANH.
 *
 * Ba con so tro len tren man hinh khac nhau, va khong so nao la so gia:
 *   - Dong "XU/giay" tren HUD la LOI NHUAN RONG (sau chi phi va thue).
 *   - "Doanh thu gop" la tien vao that, khong phong to (grossUp da bi xoa).
 *   - "Loi nhuan rong" chi con khoang 23% doanh thu gop - con lai bi gia von,
 *     chi phi van hanh va thue an het.
 *
 * Man hinh nay la noi day nguoi choi doc dung: doanh thu lon khong phai la
 * tien con lai. Phai tru gia von, chi phi van hanh va thue truoc.
 */
/* ═══════════════════════════════════════════════════════════════════════════
 * KHOẢN VAY NGÂN HÀNG SỐ MOMO
 *
 * Đặt NGAY TRÊN báo cáo P&L, không phải một tab riêng: người chơi phải thấy
 * khoản vay và dòng "chi phí lãi vay" nó tạo ra trong cùng một màn hình, nếu
 * không thì vay tiền vẫn là chuyện không hậu quả.
 * ═══════════════════════════════════════════════════════════════════════════ */
export function LoanPanel(_props: { onToast?: (msg: string) => void }) {
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * BẢNG ĐIỀU HÀNH TÀI CHÍNH THỰC CHIẾN MOMO
 * ═══════════════════════════════════════════════════════════════════════════ */
export function FinancialRulesPanel({ onToast }: { onToast?: (msg: string) => void }) {
  const coins = useCity((s) => s.coins);
  const derived = useCityDerived();
  const [tuiInput, setTuiInput] = useState('');
  const [wealthInput, setWealthInput] = useState('');

  const tuiVal = Number(tuiInput.replace(/\D/g, '')) || 0;
  const wealthVal = Number(wealthInput.replace(/\D/g, '')) || 0;

  const handleDepositTui = () => {
    if (depositToTuiThanTai(tuiVal)) {
      setTuiInput('');
      onToast?.(`Đã gửi ${formatNumber(tuiVal)} đồng vào Túi Thần Tài! Lãi sinh lời đều đặn mỗi đêm.`);
    } else {
      onToast?.('Số đồng không hợp lệ hoặc Ngân Khố không đủ.');
    }
  };

  const handleWithdrawTui = () => {
    const amount = tuiVal || derived.tuiThanTaiBalance;
    if (withdrawFromTuiThanTai(amount)) {
      setTuiInput('');
      onToast?.(`Đã rút ${formatNumber(amount)} đồng từ Túi Thần Tài về Ngân Khố thành phố tức thì!`);
    } else {
      onToast?.('Số dư Túi Thần Tài không đủ để rút.');
    }
  };

  const handleRuttTienVeVi = () => {
    if (transferToPersonalWealth(wealthVal)) {
      setWealthInput('');
      onToast?.(`Đã rút ${formatNumber(wealthVal)} đồng về Ví Cá Nhân.`);
    } else {
      onToast?.('Ngân Khố không đủ để rút số đồng này.');
    }
  };

  const handleNapVonKinhDoanh = () => {
    const amount = wealthVal || derived.personalWealth;
    if (depositToWorkingCapital(amount)) {
      setWealthInput('');
      onToast?.(`Đã nạp ${formatNumber(amount)} đồng từ Ví Cá Nhân vào Quỹ Vận Hành!`);
    } else {
      onToast?.('Ví Cá Nhân không đủ số dư để nạp.');
    }
  };

  const handleBuyInsurance = () => {
    if (buyMoMoInsurance(2_000_000)) {
      onToast?.('🎉 Đã kích hoạt Gói Bảo Hiểm Toàn Diện MoMo! An tâm trước thiên tai, sự cố.');
    } else if (derived.hasInsurance) {
      onToast?.('Thành phố đã được bảo hiểm toàn diện!');
    } else {
      onToast?.('Cần 2.000.000đ để mua gói bảo hiểm.');
    }
  };

  const trustColor =
    derived.trustScore >= 800
      ? '#047857'
      : derived.trustScore >= 700
        ? '#2563EB'
        : derived.trustScore >= 600
          ? '#D97706'
          : '#DC2626';

  return (
    <div className="space-y-2.5">
      {/* 1. ĐIỂM TIN CẬY & VỐN LƯU ĐỘNG */}
      <div
        className="rounded-2xl border-2 p-3.5"
        style={{ background: '#FFFDF7', borderColor: '#C9A22788' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-black uppercase tracking-wide text-[#8A7355]">
              Điểm Tin Cậy & Tín Nhiệm Đô Thị
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums" style={{ color: trustColor }}>
                {derived.trustScore}
              </span>
              <span className="text-[11px] font-bold text-[#8A7355]">/ 1000 điểm tín nhiệm</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-[#8A7355]">Hệ số an toàn dòng tiền</p>
            <span
              className="text-base font-black tabular-nums"
              style={{ color: derived.cashflowRatio >= 1.5 ? '#047857' : derived.cashflowRatio >= 1 ? '#D97706' : '#DC2626' }}
            >
              {derived.cashflowRatio.toFixed(2)}x
            </span>
          </div>
        </div>

        <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-[#6E4F3A]">
          {derived.trustScore >= 800
            ? '🌟 Điểm hạng Vàng: Quản lý dòng tiền và thanh toán QR xuất sắc, phố thị hưng thịnh!'
            : derived.trustScore >= 700
              ? '👍 Điểm hạng Chuẩn: Duy trì dòng tiền lành mạnh và số dư ổn định để mở thêm ưu đãi.'
              : '⚠️ Cần tối ưu chi phí vận hành và giá vốn để gia tăng điểm tín nhiệm đô thị!'}
        </p>

        {/* Tách bạch Quỹ Vận Hành vs Ví Cá Nhân */}
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t pt-2.5" style={{ borderColor: '#EBDCB9' }}>
          <div className="rounded-xl bg-[#F6EFE0] p-2">
            <p className="text-[10px] font-bold uppercase text-[#8A7355]">Vốn Lưu Động (Quán)</p>
            <p className="text-sm font-black tabular-nums text-[#1C171A]">
              {formatNumber(derived.workingCapital)}
            </p>
          </div>
          <div className="rounded-xl bg-[#EFF6FF] p-2">
            <p className="text-[10px] font-bold uppercase text-[#2563EB]">Ví Cá Nhân</p>
            <p className="text-sm font-black tabular-nums text-[#1E40AF]">
              {formatNumber(derived.personalWealth)}
            </p>
          </div>
        </div>

        {/* Thao tác Chuyển tiền tách bạch */}
        <div className="mt-2 flex items-center gap-1.5">
          <input
            value={wealthInput}
            onChange={(e) => setWealthInput(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder="Số tiền VNĐ"
            className="min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs font-black tabular-nums outline-none"
            style={{ borderColor: '#C9A22788', background: '#FFFFFF', color: '#1C171A' }}
          />
          <button
            type="button"
            onClick={handleRuttTienVeVi}
            disabled={wealthVal <= 0 || coins < wealthVal}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-black text-white transition-transform active:scale-95 disabled:opacity-40"
            style={{ background: '#D97706' }}
            title="Rút tiền lời ra ví riêng"
          >
            Rút về ví
          </button>
          <button
            type="button"
            onClick={handleNapVonKinhDoanh}
            disabled={derived.personalWealth <= 0}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-black text-white transition-transform active:scale-95 disabled:opacity-40"
            style={{ background: '#2563EB' }}
            title="Bơm vốn từ ví cá nhân vào quán"
          >
            Nạp vốn
          </button>
        </div>
      </div>

      {/* 2. TÚI THẦN TÀI & BẢO HIỂM MOMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Túi Thần Tài */}
        <div
          className="rounded-2xl border-2 p-3"
          style={{ background: '#FFFBEB', borderColor: '#F59E0B88' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase text-[#B45309]">Heo Đất Tích Lũy</p>
            <span className="rounded bg-amber-200 px-1 py-0.5 text-[10px] font-bold text-amber-900">
              {(TUI_THAN_TAI_RATE_YEAR * 100).toFixed(1)}%/năm
            </span>
          </div>
          <div className="mt-1">
            <span className="text-base font-black tabular-nums text-[#92400E]">
              {formatNumber(Math.round(derived.tuiThanTaiBalance))}
            </span>
            <p className="text-[10px] font-medium text-[#78350F]">
              Đêm về tự sinh lời, rút ra 24/7 tức thì
            </p>
          </div>

          <div className="mt-2 flex items-center gap-1">
            <input
              value={tuiInput}
              onChange={(e) => setTuiInput(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="Số tiền VNĐ"
              className="min-w-0 flex-1 rounded border px-1.5 py-1 text-[11px] font-black tabular-nums outline-none"
              style={{ borderColor: '#F59E0B66', background: '#FFFFFF' }}
            />
            <button
              type="button"
              onClick={handleDepositTui}
              disabled={tuiVal <= 0 || coins < tuiVal}
              className="rounded bg-[#D97706] px-2 py-1 text-[10px] font-black text-white disabled:opacity-40"
            >
              Gửi
            </button>
            <button
              type="button"
              onClick={handleWithdrawTui}
              disabled={derived.tuiThanTaiBalance <= 0}
              className="rounded bg-[#047857] px-2 py-1 text-[10px] font-black text-white disabled:opacity-40"
            >
              Rút
            </button>
          </div>
        </div>

        {/* Bảo Hiểm Toàn Diện MoMo */}
        <div
          className="rounded-2xl border-2 p-3 flex flex-col justify-between"
          style={{
            background: derived.hasInsurance ? '#F0FDF4' : '#FEF2F2',
            borderColor: derived.hasInsurance ? '#22C55E88' : '#EF444466',
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-black uppercase"
                style={{ color: derived.hasInsurance ? '#15803D' : '#991B1B' }}
              >
                Quỹ Bảo Vệ Phố
              </p>
              <span
                className="rounded px-1.5 py-0.5 text-[9.5px] font-bold text-white"
                style={{ background: derived.hasInsurance ? '#16A34A' : '#DC2626' }}
              >
                {derived.hasInsurance ? 'ĐÃ BẢO VỆ' : 'CHƯA MUA'}
              </span>
            </div>
            <p className="mt-1 text-[10.5px] font-medium leading-tight text-[#4B5563]">
              {derived.hasInsurance
                ? 'Được bồi thường 90% khi gặp thiên tai mưa ngập, và chi trả 100% phí khắc phục sự cố mặt bằng.'
                : 'Chưa có khiên bảo vệ! Sự cố có thể làm tổn thất 10-20% tài sản ngân khố.'}
            </p>
          </div>

          {!derived.hasInsurance && (
            <button
              type="button"
              onClick={handleBuyInsurance}
              disabled={coins < 2_000_000}
              className="mt-2 w-full rounded-lg py-1.5 text-center text-[11px] font-black text-white transition-transform active:scale-95 disabled:opacity-40"
              style={{ background: '#DC2626' }}
            >
              Mua gói bảo vệ (2.000.000đ)
            </button>
          )}
        </div>
      </div>

      {/* Cảnh báo Chặn gian lận Bill giả */}
      {(derived.fraudBlockedCount > 0 || derived.fraudLossCoins > 0) && (
        <div className="rounded-xl border px-3 py-2 text-[11px]" style={{ background: '#FFF1F2', borderColor: '#FDA4AF' }}>
          <span className="font-bold text-[#9F1239]">🛡️ Giám Sát Quản Trị Rủi Ro: </span>
          <span className="text-[#881337]">
            Đã chặn đứng <b>{derived.fraudBlockedCount}</b> vụ bill giả nhờ Loa Thần Tài.
            {derived.fraudLossCoins > 0 && ` Thất thoát do tiền mặt/chưa có loa: ${formatNumber(derived.fraudLossCoins)} đồng.`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ProfitLossStatement({ onToast }: { onToast?: (msg: string) => void }) {
  const day = useCity((s) => s.ledgerDay);
  const month = useCity((s) => s.ledgerMonth);
  const life = useCity((s) => s.ledgerLifetime);
  const derived = useCityDerived();

  // Giu ca thoi khoa de hien, nhung phan tinh toan chi dung phan LedgerEntry.
  const ledgers: Record<Period, PeriodLedger> = { day, month, life };

  return (
    <div className="space-y-3">
      {/* LoanPanel va FinancialRulesPanel da chuyen sang tab Ngan Hang */}

      {/* Tốc độ hiện tại - cùng cấu trúc nhưng là /giây */}
      <div
        className="rounded-2xl border-2 p-3.5"
        style={{ background: '#F0FDF9', borderColor: '#10B98166' }}
      >
        <p className="text-[12px] font-black uppercase tracking-wide text-[#047857]">
          Tiềm năng mỗi giây
        </p>
        <div className="mt-2 space-y-0.5">
          <Row label="Doanh thu gộp" sublabel="Tiền vô đếm sướng tay 💵" value={derived.grossRevenue} />
          <Row label="− Giá vốn hàng bán" sublabel="Tiền mua thịt cá, trà sữa... 🥩" value={-derived.cogs} tone="minus" indent />
          <Row
            label={`= Lợi nhuận gộp${derived.grossMargin ? ` (biên ${(derived.grossMargin * 100).toFixed(0)}%)` : ''}`}
            sublabel="Tiền dôi ra sau khi trừ tiền hàng 📦"
            value={derived.grossProfit}
            strong
          />
          <Row label="− Chi phí vận hành" sublabel="Tiền nuôi quán (mặt bằng, điện nước) 🏢" value={-derived.opex} tone="minus" indent />
          <Row
            label={`= Lợi nhuận hoạt động${derived.operatingMargin ? ` (biên ${(derived.operatingMargin * 100).toFixed(0)}%)` : ''}`}
            sublabel="Hiệu quả làm ăn thực tế 📊"
            value={derived.operatingIncome}
            strong
          />
          <Row label="− Thuế TNDN 20%" sublabel="Đóng góp xây phố phồn vinh 🏛️" value={-derived.tax} tone="minus" indent />
          <Row label="= Lợi nhuận ròng" sublabel="Tiền THẬT SỰ nhét túi quần ✨" value={derived.netIncome} tone="total" strong />
        </div>
        {/* Khách bỏ hàng: chỉ báo khi mất đủ 1% doanh thu. Mất vài phần
            nghìn thì cảnh báo đỏ chót chỉ tạo ảo giác khủng hoảng. */}
        {derived.grossRevenue > 0 && derived.lostSales > derived.grossRevenue * 0.01 && (
          <div
            className="mt-2 rounded-xl px-2.5 py-2"
            style={{ background: '#FFF7ED', border: '1px solid #FDBA74' }}
          >
            <p className="text-[12px] font-black text-[#9A3412]">
              🧍 Khách bỏ hàng: đang mất {formatRate(derived.lostSales)}/giây
            </p>
            <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#7C2D12]">
              Hàng đợi dài hơn số chỗ phục vụ thì một phần khách không còn đợi nữa mà bỏ đi
              {' '}(còn {(derived.crowdingFactor * 100).toFixed(0)}% sức bán). Nâng cấp tiệm để thêm
              chỗ phục vụ, hoặc xây thêm tiệm để chia bớt khách.
            </p>
          </div>
        )}

        <p className="mt-2 border-t pt-2 text-[12px] font-semibold leading-relaxed text-[#5B3D22]">
          Một giây phục vụ tối đa cho ra <b>{formatRate(derived.grossRevenue)}</b> doanh thu gộp,
          nhưng chỉ giữ lại được{" "}
          <b>
            {Math.round(
              derived.grossRevenue > 0
                ? (derived.netIncome / derived.grossRevenue) * 100
                : 0,
            )}
            %
          </b>{" "}
          = <b>{formatRate(derived.netIncome)}</b> lợi nhuận ròng. Số trên HUD là{" "}
          <b>tiềm năng</b> - tiền chỉ thật sự vào ngân khố khi bạn bấm đóng đơn. Tiền vào nhiều
          không phải tiền còn lại.
        </p>
      </div>

      {/* Báo cáo theo kỳ */}
      {(Object.keys(PERIOD_LABEL) as Period[]).map((period) => {
        const l = ledgers[period];
        const grossProfit = l.grossRevenue - l.cogs;
        const operating = grossProfit - l.opex;
        const net = operating - l.tax;
        /*
         * DONG TIEN TU DO.
         *
         * Khong goi la "thay doi ngan kho" duoc: so cai khong ghi no goc vay,
         * thuong nhiem vu hay nap/rut Tui Than Tai - nhung khoan do khong phai
         * P&L. Ep thanh so ngan khac se tao ra con so noi doi moi, dung la cai
         * man hinh nay dang sua.
         *
         * FCF la chi so ke toan chuan: loi nhuan rong da tru von tai tai san.
         */
        const fcf = net - l.capex - l.inventoryBought;
        const empty = l.grossRevenue === 0 && l.capex === 0;

        return (
          <div
            key={period}
            className="rounded-2xl border-2"
            style={{ background: '#FFFDF7', borderColor: '#04785744' }}
          >
            <div
              className="flex items-center justify-between rounded-t-2xl px-3 py-1.5"
              style={{ background: '#047857', color: '#fff' }}
            >
              <p className="text-[12px] font-black uppercase tracking-wide">
                {PERIOD_LABEL[period]}
              </p>
              {period !== 'life' && (
                <span className="text-[11px] font-bold opacity-80">
                  {period === 'day' ? l.day : l.month}
                </span>
              )}
            </div>

            {empty ? (
              <p className="px-3 py-4 text-center text-[13px] font-semibold text-[#9C8767]">
                Chưa có phát sinh nào. Vận hành thành phố vài giây để có số liệu.
              </p>
            ) : (
              <div className="space-y-0.5 p-1.5">
                <Row label="Doanh thu gộp" sublabel="Tiền vô đếm sướng tay 💵" value={l.grossRevenue} />
                <Row label="− Giá vốn hàng bán" sublabel="Tiền mua thịt cá, trà sữa... 🥩" value={-l.cogs} tone="minus" indent />
                <Row
                  label={`= Lợi nhuận gộp`}
                  sublabel="Tiền dôi ra sau khi trừ tiền hàng 📦"
                  value={grossProfit}
                  strong
                />
                <Row
                  label={`− Chi phí vận hành`}
                  sublabel="Tiền nuôi quán (mặt bằng, điện nước) 🏢"
                  value={-l.opex}
                  tone="minus"
                  indent
                />
                <Row label={`= Lợi nhuận hoạt động`} sublabel="Hiệu quả làm ăn thực tế 📊" value={operating} strong />
                <Row label={`− Thuế TNDN`} sublabel="Đóng góp xây phố phồn vinh 🏛️" value={-l.tax} tone="minus" indent />
                <Row
                  label="= Lợi nhuận ròng"
                  sublabel="Tiền THẬT SỰ nhét túi quần ✨"
                  value={net}
                  tone="total"
                  strong
                />

                {/*
                 * DONG TIEN: CAPEX va ton kho la TIEN RA that nen hien am do,
                 * nhung KHONG tru vao Loi nhuan rong o tren: chung tao tai san,
                 * khong phai chi phi tieu thu. Dong cuoi doi lai doi sang FCF.
                 */}
                <div className="mt-2 border-t pt-1.5">
                  <p className="px-2 pb-0.5 text-[10px] font-black uppercase tracking-wide text-[#8A7355]">
                    Ngoài P&amp;L · dòng tiền
                  </p>
                  <Row
                    label="− Chi tiêu vốn (CAPEX)"
                    sublabel="Tiền ra sắm đồ nghề (máy móc, sửa quán) 🛠️"
                    value={-l.capex}
                    tone="minus"
                    hint="Xây mới, nâng cấp, mở rộng đất, lên sao, lắp tiện ích, thuê quản lý. TIỀN RA thật nên hiện âm, nhưng đây là TIỀN VỐN tạo tài sản nên KHÔNG trừ vào Lợi nhuận ròng."
                  />
                  <Row
                    label="− Kiểm kê thị trường"
                    sublabel="Hàng tồn kho & vật phẩm 🎁"
                    value={-l.inventoryBought}
                    tone="minus"
                    hint="Vật phẩm tiêu dùng trong Kho Đồ. Tiền đã ra rồi nhưng là tài sản còn dùng được, không phải chi phí vận hành nên không trừ vào lợi nhuận."
                  />
                  <Row
                    label="= Dòng tiền tự do"
                    sublabel="Lợi nhuận ròng sau khi đã tái đầu tư ✨"
                    value={fcf}
                    tone="total"
                    strong
                    hint="Lợi nhuận ròng trừ chi tiêu vốn và tồn kho. Đây là khoản tiền thật dôi ra, dùng để trả nợ hoặc mở rộng thêm."
                  />
                </div>

                <p className="px-2 pt-1 text-[12px] font-semibold leading-relaxed text-[#6E4F3A]">
                  Biên lợi nhuận gộp <Pct value={l.grossRevenue > 0 ? grossProfit / l.grossRevenue : 0} />
                  {' · '}biên ròng <Pct value={l.grossRevenue > 0 ? net / l.grossRevenue : 0} />
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Giải thích các dòng theo phong cách Phố Phường */}
      <div
        className="rounded-2xl border-2 p-3.5"
        style={{ background: '#FFFBEB', borderColor: '#C9A22766' }}
      >
        <p className="text-[12px] font-black uppercase tracking-wide text-[#8B6318]">
          💡 Khẩu Quyết Bỏ Túi Cho Chủ Quán MoCity
        </p>
        <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#5B3D22]">
          <li>
            💵 <b>Doanh thu gộp</b> là <i>tiền vô đếm sướng tay</i>, nhưng chưa trừ tiền thịt cá rau củ hay tiền nhà. Đừng vội mang đi mua sắm kẻo cuối tháng khóc thầm!
          </li>
          <li>
            🥩 <b>Giá vốn hàng bán (COGS)</b> là tiền mua nguyên liệu làm ra sản phẩm. Bán ly trà sữa 30k thì mất đứt 14k tiền sữa, trà, trân châu, ly nhựa rồi.
          </li>
          <li>
            🏢 <b>Chi phí vận hành (OPEX)</b> là <i>tiền nuôi quán mỗi tháng</i> (mặt bằng, điện nước, wifi, nhân viên). Quán mở hay đóng cửa thì tiền này vẫn bay đều đều.
          </li>
          <li>
            ✨ <b>Lợi nhuận ròng</b> mới là <i>tiền thật sự nhét túi quần</i> mang về nhà. Phải lấy Doanh thu trừ sạch Giá vốn, Vận hành và Thuế mới ra con số này.
          </li>
          <li>
            🛠️ <b>Chi tiêu vốn (CAPEX)</b>: Mua máy pha cà phê, đóng quầy bar là sắm &quot;cần câu cơm&quot; lâu dài, không trừ hết vào chi phí tháng mà tính vào tài sản của tiệm.
          </li>
          <li>
            🧍 <b>Khách bỏ hàng là mất doanh thu thật</b>: Xếp hàng lâu hơn sức phục vụ thì khách đi luôn, không phải chờ. Đó là lý do nâng cấp tiệm không chỉ tăng giá bán mà còn phải tăng chỗ phục vụ.
          </li>
        </ul>

        {/*
         * San pham phat hanh cong khai va co mo ta san pham tai chinh, nen phai
         * noi ro day la mo phong. Khong duoc de nguoi choi hieu cac con so trong
         * game la dieu kien that cua bat ky san pham nao.
         */}
        <p className="mt-3 border-t pt-2 text-[12px] font-semibold leading-relaxed text-[#8A7355]">
          Các con số kinh doanh và tài chính trong game là mô phỏng phục vụ giải trí,
          không phải điều kiện thật của bất kỳ sản phẩm nào. Game không đưa ra lời khuyên tài chính.
        </p>
      </div>
    </div>
  );
}