'use client';

import { useCityDerived } from '@/lib/mocity/store';
import { COMPARISON_WINDOW_DAYS, type ComparisonTrend } from '@/lib/mocity/comparison';
import { formatNumber, formatRate } from '@/lib/mocity/format';

/**
 * BẢNG SO SÁNH VỚI CHÍNH MÌNH 7 NGÀY TRƯỚC
 *
 * KHÔNG phải bảng xếp hạng. Game không có dữ liệu về người chơi khác: state
 * nằm trong `localStorage`, không có API route, không có database. Nên câu
 * chữ ở đây cố tình tránh "hạng", "top", "toàn quốc", "đối thủ" - tất cả đều
 * là những thứ game không có dữ liệu để nói.
 *
 * Cơ chế tâm lý thì đúng: biết mình sắp làm nhiều hơn hay ít hơn chính mình
 * mới đẩy được người chơi. So với người khác còn tạo áp lực mạnh hơn, nhưng
 * cần server thì mới làm được.
 */

/** Màu theo xu hướng: tăng là xanh, giảm là đỏ, không đủ dữ liệu là xám. */
const TREND_COLOR: Record<ComparisonTrend, string> = {
  UP: '#047857',
  DOWN: '#B91C1C',
  FLAT: '#8A7355',
  UNKNOWN: '#9C8767',
};

function TrendBadge({ trend, pct }: { trend: ComparisonTrend; pct: number | null }) {
  if (trend === 'UNKNOWN' || pct === null) {
    return <span className="text-[9px] font-black text-[#9C8767]">mới có</span>;
  }
  const dau = pct > 0 ? '▲' : pct < 0 ? '▼' : '■';
  return (
    <span
      className="ml-1 rounded px-1 text-[9px] font-black tabular-nums"
      style={{ background: `${TREND_COLOR[trend]}1A`, color: TREND_COLOR[trend] }}
    >
      {dau} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export default function WeekComparisonPanel() {
  const derived = useCityDerived();
  const cmp = derived.weekCompare;

  /*
   * CHƯA ĐỦ DỮ LIỆU thì hiện tiến độ, không hiện con số.
   *
   * Hiện "0%" khi mới chơi 2 ngày sẽ đọc thành "bạn giảm 100% so với tuần
   * trước", đẩy người chơi ra khỏi game đúng lúc họ mới bắt đầu. Thiếu lịch
   * sử là chưa đủ dữ liệu, không phải kết quả kém.
   */
  if (!cmp.sanhDuoc) {
    return (
      <div
        className="rounded-2xl border-2 p-3.5"
        style={{ background: '#F8F5EF', borderColor: '#D8CBB2' }}
      >
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8A7355]">
          So sánh với 7 ngày trước
        </p>
        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#6E4F3A]">
          Thành phố mới bắt đầu ghi sổ sách nên chưa đủ dữ liệu để so sánh.
          Cần chơi đủ <b>{COMPARISON_WINDOW_DAYS} ngày</b> thì bảng này mở.
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#E6D9B8' }}>
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${(cmp.soBanGhi / cmp.canBaoNhieu) * 100}%`,
              background: 'linear-gradient(90deg,#34D399,#FBBF24)',
            }}
          />
        </div>
        <p className="mt-1 text-[9px] font-bold text-[#8A7355]">
          Đã ghi {cmp.soBanGhi}/{cmp.canBaoNhieu} ngày.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border-2 p-3.5"
      style={{
        background: cmp.dangTut ? '#FEF2F2' : '#F0FDF9',
        borderColor: cmp.dangTut ? '#FCA5A5' : '#10B98166',
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p
          className="text-[10px] font-black uppercase tracking-wide"
          style={{ color: cmp.dangTut ? '#B91C1C' : '#047857' }}
        >
          So sánh với 7 ngày trước
        </p>
        <span className="text-[9px] font-bold text-[#8A7355]">{cmp.ngaySoSanh}</span>
      </div>

      <div className="mt-2 space-y-0.5">
        {cmp.lines.map((line) => {
          const laTien = line.donVi === 'đồng';
          return (
            <div
              key={line.label}
              className="flex items-baseline justify-between gap-2 py-1"
              style={{ borderTop: '1px solid #0000000D' }}
            >
              <span className="text-[10px] font-semibold text-[#6E4F3A]">{line.label}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-black tabular-nums text-[#1C171A]">
                  {laTien ? formatNumber(Math.round(line.homNay)) : formatNumber(line.homNay)}
                </span>
                <TrendBadge trend={line.trend} pct={line.chenhLech} />
              </span>
            </div>
          );
        })}
      </div>

      {/*
       * Cảnh báo tụt: chỉ NHẮC, không phạt.
       *
       * Không trừ tiền, không khoá tính năng. Người chơi cần biết mình đang
       * chậm lại thì mới sửa được; phạt thì chỉ tạo cảm giác bất lực rồi bỏ.
       */}
      {cmp.dangTut && (
        <p
          className="mt-2 rounded-lg px-2 py-1.5 text-[10px] font-semibold leading-relaxed"
          style={{ background: '#FEE2E2', color: '#991B1B' }}
        >
          Lợi nhuận hôm nay thấp hơn cùng kỳ hơn 10%. Kiểm tra lại xem tiệm nào
          đang quá tải hoặc chi phí vận hành có tăng không.
        </p>
      )}

      <p className="mt-2 border-t pt-2 text-[10px] font-semibold leading-relaxed text-[#5B3D22]">
        Tiềm năng <b>{formatRate(derived.netIncome)}/giây</b> lợi nhuận ròng - tiền vào
        ngân khố khi bạn đóng đơn.
        {derived.crowdingFactor < 1 && (
          <>
            {' '}
            Khách đang bỏ hàng, còn {(derived.crowdingFactor * 100).toFixed(0)}% sức
            bán.
          </>
        )}
      </p>

      {derived.streakShields > 0 && (
        <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#8B6318]">
          🛡️ Bạn có {derived.streakShields} phiếu bảo vệ chuỗi ngày.
        </p>
      )}
    </div>
  );
}