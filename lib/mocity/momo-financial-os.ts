import type { MomoFinancialOSState } from './types';

/**
 * Trạng thái khởi tạo mặc định cho MoMo Financial OS
 */
export const INITIAL_MOMO_FINANCIAL_OS: MomoFinancialOSState = {
  tuiThanTaiBalanceCoins: 0,
  tuiThanTaiYieldRateDailyPct: 0.015, // ~0.015%/ngày (~5.5%/năm)
  viTraSauLimitCoins: 50_000_000, // Hạn mức Ví Trả Sau 50M
  viTraSauUsedCoins: 0,
  viTraSauInterestRateMonthlyPct: 1.5, // 1.5%/tháng nếu quá hạn
  activeInsurances: [],
  npcStockPortfolio: [],
};

/**
 * Nạp tiền vào Túi Thần Tài (Chuyển cash ➔ Túi Thần Tài)
 */
export function depositTuiThanTai(state: MomoFinancialOSState, amountCoins: number): MomoFinancialOSState {
  if (amountCoins <= 0) return state;
  return {
    ...state,
    tuiThanTaiBalanceCoins: state.tuiThanTaiBalanceCoins + amountCoins,
  };
}

/**
 * Rút tiền từ Túi Thần Tài về Tiền mặt khả dụng
 */
export function withdrawTuiThanTai(state: MomoFinancialOSState, amountCoins: number): {
  nextState: MomoFinancialOSState;
  withdrawnCoins: number;
} {
  const withdrawnCoins = Math.min(state.tuiThanTaiBalanceCoins, Math.max(0, amountCoins));
  return {
    nextState: {
      ...state,
      tuiThanTaiBalanceCoins: state.tuiThanTaiBalanceCoins - withdrawnCoins,
    },
    withdrawnCoins,
  };
}

/**
 * Rút vốn ứng từ Ví Trả Sau (BNPL)
 */
export function borrowViTraSau(state: MomoFinancialOSState, amountCoins: number): {
  nextState: MomoFinancialOSState;
  borrowedCoins: number;
} {
  const availableCredit = state.viTraSauLimitCoins - state.viTraSauUsedCoins;
  const borrowedCoins = Math.min(availableCredit, Math.max(0, amountCoins));
  return {
    nextState: {
      ...state,
      viTraSauUsedCoins: state.viTraSauUsedCoins + borrowedCoins,
    },
    borrowedCoins,
  };
}

/**
 * Thanh toán dư nợ Ví Trả Sau bằng tiền mặt
 */
export function repayViTraSau(state: MomoFinancialOSState, amountCoins: number): {
  nextState: MomoFinancialOSState;
  repaidCoins: number;
} {
  const repaidCoins = Math.min(state.viTraSauUsedCoins, Math.max(0, amountCoins));
  return {
    nextState: {
      ...state,
      viTraSauUsedCoins: state.viTraSauUsedCoins - repaidCoins,
    },
    repaidCoins,
  };
}

/**
 * Mua bảo hiểm rủi ro cho công trình
 */
export function purchaseBuildingInsurance(
  state: MomoFinancialOSState,
  buildingId: string,
  coverageType: 'BLACK_SWAN_SHOCK' | 'REPAIR_DAMAGE',
  monthlyPremiumCoins: number
): MomoFinancialOSState {
  const existing = state.activeInsurances.filter((i) => i.buildingId !== buildingId);
  return {
    ...state,
    activeInsurances: [
      ...existing,
      { buildingId, coverageType, monthlyPremiumCoins },
    ],
  };
}

/**
 * Tính toán tiền lãi Túi Thần Tài cộng dồn theo ngày/tick
 */
export function calculateDailyTuiThanTaiYield(state: MomoFinancialOSState): number {
  if (state.tuiThanTaiBalanceCoins <= 0) return 0;
  return Math.round(state.tuiThanTaiBalanceCoins * (state.tuiThanTaiYieldRateDailyPct / 100));
}
