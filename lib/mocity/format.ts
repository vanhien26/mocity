/**
 * Tương thích ngược: mọi file vẫn import từ đây, nhưng implementation
 * đã dời vào `lib/mocity/currency.ts`. GĐ 2 sẽ cleanup.
 */
import {
  formatVND,
  formatVNDCompact,
  formatVNDPerSecond,
  formatPercent,
} from './currency';

export {
  formatVND,
  formatVNDCompact,
  formatVNDPerSecond,
  formatPercent,
  CURRENCY_UNIT,
  VND_ROUNDING,
  VND_PER_OLD_COIN,
  roundVND,
} from './currency';

export function formatCompact(n: number): string {
  return formatVNDCompact(n);
}

export function formatNumber(n: number): string {
  return formatVND(n);
}

export function formatRate(perSec: number): string {
  return formatVNDPerSecond(perSec);
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
