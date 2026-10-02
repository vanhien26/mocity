'use client';

import { useCity, useCityDerived } from '@/lib/mocity/store';
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
  value,
  tone = 'plain',
  indent = false,
  strong = false,
  hint,
}: {
  label: string;
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
      <span
        className="text-[11px] font-semibold"
        style={{ color: strong ? '#4A3018' : '#6E4F3A' }}
        title={hint}
      >
        {label}
      </span>
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
      className="ml-1 rounded px-1 text-[9px] font-black"
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
 * Ban <= 6 game chi co MOT con so: tien vao ngan khoc. Khong co gia von, khong
 * co chi phi van hanh, khong co thue - nen loi nhuan gop va loi nhuan rong VO
 * NGHIA chu khong phai "chua hien thi". Cong truong "XU/giay" tren HUD cung
 * la loi nhuan rong chu khong phai doanh thu.
 *
 * Man hinh nay la noi game day nguoi choi hieu tien doanh thu KHONG phai la
 * tien con lai: phai tru gia von, chi phi van hanh va thue truoc.
 */
export default function ProfitLossStatement() {
  const day = useCity((s) => s.ledgerDay);
  const month = useCity((s) => s.ledgerMonth);
  const life = useCity((s) => s.ledgerLifetime);
  const derived = useCityDerived();

  // Giu ca thoi khoa de hien, nhung phan tinh toan chi dung phan LedgerEntry.
  const ledgers: Record<Period, PeriodLedger> = { day, month, life };

  return (
    <div className="space-y-3">
      {/* Tốc độ hiện tại - cùng cấu trúc nhưng là /giây */}
      <div
        className="rounded-2xl border-2 p-3.5"
        style={{ background: '#F0FDF9', borderColor: '#10B98166' }}
      >
        <p className="text-[10px] font-black uppercase tracking-wide text-[#047857]">
          Nhịp hiện tại · mỗi giây
        </p>
        <div className="mt-2 space-y-0.5">
          <Row label="Doanh thu gộp" value={derived.grossRevenue} indent />
          <Row label="− Giá vốn hàng bán" value={-derived.cogs} tone="minus" indent />
          <Row
            label={`= Lợi nhuận gộp${derived.grossMargin ? ` (biên ${(derived.grossMargin * 100).toFixed(0)}%)` : ''}`}
            value={derived.grossProfit}
            strong
          />
          <Row label="− Chi phí vận hành" value={-derived.opex} tone="minus" indent />
          <Row
            label={`= Lợi nhuận hoạt động${derived.operatingMargin ? ` (biên ${(derived.operatingMargin * 100).toFixed(0)}%)` : ''}`}
            value={derived.operatingIncome}
            strong
          />
          <Row label="− Thuế TNDN 20%" value={-derived.tax} tone="minus" indent />
          <Row label="= Lợi nhuận ròng" value={derived.netIncome} tone="total" strong />
        </div>
        <p className="mt-2 border-t pt-2 text-[10px] font-semibold leading-relaxed text-[#5B3D22]">
          HUD đang hiện <b>{formatRate(derived.netIncome)}</b> — đây là <b>lợi nhuận ròng</b>,
          không phải doanh thu. Doanh thu gộp thật là {formatRate(derived.grossRevenue)}. Mỗi đồng
          Xu bạn kiếm được đều phải trả tiền hàng, tiền mặt băng và thuế.
        </p>
      </div>

      {/* Báo cáo theo kỳ */}
      {(Object.keys(PERIOD_LABEL) as Period[]).map((period) => {
        const l = ledgers[period];
        const grossProfit = l.grossRevenue - l.cogs;
        const operating = grossProfit - l.opex;
        const net = operating - l.tax;
        const empty = l.grossRevenue === 0 && l.capex === 0;

        const periodLabel = period === 'day' ? l.day : l.month;

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
              <p className="text-[10px] font-black uppercase tracking-wide">
                {PERIOD_LABEL[period]}
              </p>
              {period !== 'life' && (
                <span className="text-[9px] font-bold opacity-80">
                  {period === 'day' ? l.day : l.month}
                </span>
              )}
            </div>

            {empty ? (
              <p className="px-3 py-4 text-center text-[11px] font-semibold text-[#9C8767]">
                Chưa có phát sinh nào. Vận hành thành phố vài giây để có số liệu.
              </p>
            ) : (
              <div className="space-y-0.5 p-1.5">
                <Row label="Doanh thu gộp" value={l.grossRevenue} />
                <Row label="− Giá vốn hàng bán" value={-l.cogs} tone="minus" indent />
                <Row
                  label={`= Lợi nhuận gộp`}
                  value={grossProfit}
                  strong
                />
                <Row
                  label={`− Chi phí vận hành`}
                  value={-l.opex}
                  tone="minus"
                  indent
                />
                <Row label={`= Lợi nhuận hoạt động`} value={operating} strong />
                <Row label={`− Thuế TNDN`} value={-l.tax} tone="minus" indent />
                <Row
                  label="= Lợi nhuận ròng"
                  value={net}
                  tone="total"
                  strong
                />

                {/* Vốn không đi qua P&L */}
                <div className="mt-2 border-t pt-1.5">
                  <Row
                    label="Chi tiêu vốn (capex)"
                    value={l.capex}
                    tone="plain"
                    hint="Xây mới, nâng cấp, mở rộng đất, lên sao, lắp tiện ích, thuê quản lý. Đây là TIỀN VỐN tạo tài sản — không trừ vào lợi nhuận."
                  />
                  <Row
                    label="Kiểm kê thi trường"
                    value={l.inventoryBought}
                    tone="plain"
                    hint="Vật phẩm và Bảo Vật trong Kho Đồ. Tồn kho lâu ngày, không phải chi phí vận hành."
                  />
                </div>

                <p className="px-2 pt-1 text-[10px] font-semibold leading-relaxed text-[#6E4F3A]">
                  Biên lợi nhuận gộp <Pct value={l.grossRevenue > 0 ? grossProfit / l.grossRevenue : 0} />
                  {' · '}biên ròng <Pct value={l.grossRevenue > 0 ? net / l.grossRevenue : 0} />
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Giải thích các dòng */}
      <div
        className="rounded-2xl border-2 p-3.5"
        style={{ background: '#FFFBEB', borderColor: '#C9A22766' }}
      >
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8B6318]">
          Đọc báo cáo này thế nào
        </p>
        <ul className="mt-1.5 space-y-1.5 text-[11px] leading-relaxed text-[#5B3D22]">
          <li>
            <b>Doanh thu gộp</b> là tiền bán ra chưa trừ gì. Luôn lớn hơn số Xu bạn
            thật sự kiếm.
          </li>
          <li>
            <b>Giá vốn</b> là tiền mua hàng bán lại. Quán cà phê tốn nhiều (45%) vì bán
            đồ uống; sàn chứng khoán tốn ít (8%) vì không có hàng tồn kho.
          </li>
          <li>
            <b>Chi phí vận hành</b> là tiền thuê mặt bằng, trả lương, hóa đơn điện nước.
            Cửa hàng ăn uống tốn nhiều (35%) vì cần người; trạm tài chính ít (15%) vì
            chạy máy.
          </li>
          <li>
            <b>Thuế 20%</b> tính trên <i>lợi nhuận hoạt động</i>, không phải trên doanh
            thu — trả thuế theo thắng, không theo bán được bao nhiêu.
          </li>
          <li>
            <b>Chi tiêu vốn</b> không đi qua báo cáo lãi/lỗ. Xây tiệm là mua tài sản,
            không phải chi phí. Game này không có khấu hao nên vốn đã bỏ ra không bao
            giờ tự quay lại — cùng một điểm yếu của sổ sách thật khi bạn quên dòng
            khấu hao.
          </li>
          <li>
            Biên gộp <b>thấp</b> nghĩa là bán nhiều mà không thu được gì — dấu hiệu xây
            quá nhiều tiệm bán đồ giống nhau trong khi dân cư không đủ tiền.
          </li>
        </ul>
      </div>
    </div>
  );
}