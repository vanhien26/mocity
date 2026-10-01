import type { Currencies, CurrencyKey } from './types';

export function canAfford(wallet: Currencies, cost: Partial<Currencies>): boolean {
  return (Object.keys(cost) as CurrencyKey[]).every((key) => wallet[key] >= (cost[key] ?? 0));
}

/**
 * Tra ve wallet moi da tru chi phi, hoac null neu khong du.
 * Khong tu am am - caller phai xu ly null de bao nguoi choi.
 */
export function spend(wallet: Currencies, cost: Partial<Currencies>): Currencies | null {
  if (!canAfford(wallet, cost)) return null;

  const next = { ...wallet };
  for (const key of Object.keys(cost) as CurrencyKey[]) {
    next[key] -= cost[key] ?? 0;
  }
  return next;
}

export function earn(wallet: Currencies, gain: Partial<Currencies>): Currencies {
  const next = { ...wallet };
  for (const key of Object.keys(gain) as CurrencyKey[]) {
    next[key] += gain[key] ?? 0;
  }
  return next;
}
