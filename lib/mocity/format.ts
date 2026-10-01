const UNITS: Array<[number, string]> = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

/** 1234567 -> "1,23tr" (kieu viet gọn tieng Viet, doc nhanh tren HUD hien) */
export function formatCompact(n: number): string {
  const v = Math.floor(Math.abs(n));
  for (const [threshold, suffix] of UNITS) {
    if (v >= threshold) {
      const scaled = n / threshold;
      const text = scaled >= 100 ? scaled.toFixed(0) : scaled.toFixed(2);
      return `${text.replace(/\.?0+$/, '').replace('.', ',')}${suffix}`;
    }
  }
  return `${Math.floor(n)}`;
}

/** 1234567 -> "1.234.567" */
export function formatNumber(n: number): string {
  return Math.floor(n).toLocaleString('vi-VN');
}

/** Xu/giay -> chuoi de hien thi tren HUD. 0.5 -> "0,5/s" */
export function formatRate(perSec: number): string {
  if (perSec >= 1000) return `${formatCompact(perSec)}/s`;
  return `${perSec.toFixed(1).replace('.', ',')}/s`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits).replace('.', ',')}%`;
}
