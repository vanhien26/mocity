/**
 * NGUỒN ĐỊNH DẠNG TIỀN TỆ DUY NHẤT của MoCity.
 *
 * Quy ước:
 *  - Đơn vị là đồng (VNĐ). Không còn "Xu".
 *  - Số hiển thị làm tròn nghìn cho gọn đọc (chuẩn VND thực tế không có cấp nhỏ hơn 1.000đ).
 *  - Viết tắt rút gọn: nghìn / triệu / tỷ / nghìn tỷ.
 */

/** Số làm tròn khi hiển thị / ghi sổ cái ranh giới đơn hàng. */
export const VND_ROUNDING = 1_000 as const;

/** Ký hiệu đơn vị, dùng gắn vào HUD / toast / tooltip. */
export const CURRENCY_UNIT = 'đ';

/** Đổi từ đơn vị game cũ (Xu) sang đồng — dùng khi migrate save v10. */
export const VND_PER_OLD_COIN = 1 as const;

type UnitDef = readonly [threshold: number, label: string];

const UNITS_VND: readonly UnitDef[] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
] as const;

/**
 * Làm tròn đồng xuống mức gần nhất để sổ cái, thưởng offline, giá bán hiển thị gọn.
 */
export function roundVND(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.abs(n) / VND_ROUNDING) * VND_ROUNDING;
}

/**
 * Định dạng đầy đủ: 1.234.567đ, -5.000đ, 0đ.
 */
export function formatVND(n: number): string {
  if (!Number.isFinite(n)) return `0${CURRENCY_UNIT}`;
  const v = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  return `${sign}${v.toLocaleString('vi-VN')}${CURRENCY_UNIT}`;
}

/**
 * Định dạng rút gọn: dừng lại ở đơn vị K (không dùng M, B, T).
 * Người dùng yêu cầu hiển thị tiền quy đổi ra đơn vị K với dấu chấm phân cách hàng nghìn,
 * ví dụ: 60.000K, 15.000K, 1.500K, 50K, 1.000.000K.
 */
export function formatVNDCompact(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  if (abs >= 1000) {
    if (abs < 10_000 && abs % 1000 !== 0) {
      const s = Number((abs / 1000).toFixed(1));
      return `${sign}${s}K`;
    }
    const kValue = Math.round(abs / 1000);
    return `${sign}${kValue.toLocaleString('vi-VN')}K`;
  }

  return `${sign}${Math.round(abs)}`;
}

/**
 * Dòng tiền / giây rút gọn sạch sẽ:
 *   850/s / 15K/s / 1.5M/s / 30M/s
 */
export function formatVNDPerSecond(perSec: number): string {
  if (!Number.isFinite(perSec) || perSec <= 0) return `0/s`;
  return `${formatVNDCompact(perSec)}/s`;
}

/**
 * Tỷ lệ %, ví dụ 0,15 → "15%".
 */
export function formatPercent(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(fractionDigits).replace('.', ',')}%`;
}
