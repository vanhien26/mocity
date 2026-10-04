import type { BusinessType } from './types'

// ─── Thời gian ──────────────────────────────────────────
export const REAL_MS_PER_GAME_DAY = 3_000   // 3 giây = 1 ngày game
export const DAYS_PER_ACT = { act1: 60, act2: 90, act3: 120, act4: 90 }
export const MONTHLY_CYCLE_DAYS = 30

// ─── Khởi điểm ──────────────────────────────────────────
export const STARTING_CASH = 50_000_000     // 50 triệu
export const DEBT_PRINCIPAL = 200_000_000   // 200 triệu nợ gốc
export const MONTHLY_INTEREST = 5_000_000  // 5 triệu/tháng lãi

// ─── Plot ───────────────────────────────────────────────
export const MAX_PLOTS_BY_ACT: Record<string, number> = {
  act1: 1,
  act2: 2,
  act3: 3,
  act4: 3,
}

// ─── Business definitions ────────────────────────────────
export interface BusinessDef {
  type: BusinessType
  name: string
  emoji: string
  openCost: number        // chi phí mở
  depositRent: number     // đặt cọc thuê (hoàn lại khi đóng)
  dailyRent: number
  dailyUtility: number
  baseDailyRevenue: number
  availableFromAct: string
  description: string
}

export const BUSINESS_DEFS: BusinessDef[] = [
  {
    type: 'ca-phe-coc',
    name: 'Quán Cà Phê Cóc',
    emoji: '☕',
    openCost: 5_000_000,
    depositRent: 3_000_000,
    dailyRent: 500_000,
    dailyUtility: 100_000,
    baseDailyRevenue: 1_200_000,
    availableFromAct: 'act1',
    description: 'Rẻ nhất, dễ vận hành. Doanh thu ổn định nhưng biên lợi nhuận thấp.',
  },
  {
    type: 'banh-mi',
    name: 'Xe Bánh Mì',
    emoji: '🥖',
    openCost: 4_000_000,
    depositRent: 2_000_000,
    dailyRent: 350_000,
    dailyUtility: 80_000,
    baseDailyRevenue: 900_000,
    availableFromAct: 'act1',
    description: 'Vốn thấp nhất. Hàng thiu nhanh — phải nhập hàng đúng lượng.',
  },
  {
    type: 'quan-an',
    name: 'Quán Cơm Bình Dân',
    emoji: '🍚',
    openCost: 12_000_000,
    depositRent: 6_000_000,
    dailyRent: 1_200_000,
    dailyUtility: 300_000,
    baseDailyRevenue: 3_500_000,
    availableFromAct: 'act2',
    description: 'Doanh thu cao, nhưng chi phí vận hành lớn và cần ít nhất 1 nhân viên.',
  },
  {
    type: 'shop-thoi-trang',
    name: 'Shop Thời Trang',
    emoji: '👗',
    openCost: 25_000_000,
    depositRent: 10_000_000,
    dailyRent: 2_500_000,
    dailyUtility: 400_000,
    baseDailyRevenue: 6_000_000,
    availableFromAct: 'act2',
    description: 'Biên lợi nhuận cao nhất. Doanh thu giảm mạnh khi mưa hoặc dịch bệnh.',
  },
  {
    type: 'tiem-giat',
    name: 'Tiệm Giặt Sấy Tự Động',
    emoji: '🫧',
    openCost: 80_000_000,
    depositRent: 20_000_000,
    dailyRent: 3_000_000,
    dailyUtility: 800_000,
    baseDailyRevenue: 8_000_000,
    availableFromAct: 'act4',
    description: 'Cỗ máy kiếm tiền thụ động. Không cần nhân viên đứng bán.',
  },
]

export const BUSINESS_BY_TYPE = Object.fromEntries(
  BUSINESS_DEFS.map((d) => [d.type, d])
) as Record<BusinessType, BusinessDef>

// ─── Staff ──────────────────────────────────────────────
export const STAFF_COST_PER_DAY = 300_000    // lương/ngày/nhân viên
export const STAFF_REVENUE_BOOST = 0.25      // +25% doanh thu mỗi nhân viên
export const STAFF_MAX = 3

// ─── Inventory spoilage ─────────────────────────────────
export const SPOILAGE_LOSS_RATE = 0.5        // 50% hàng thiu = mất tiền

// ─── Ethics thresholds (ảnh hưởng ending) ───────────────
export const ETHICS_CLEAN_THRESHOLD = 5      // >= 5 = doanh nhân bền vững
export const ETHICS_RISKY_THRESHOLD = -3     // <= -3 = con buôn mạo hiểm

// ─── Debt ───────────────────────────────────────────────
export const MISSED_PAYMENT_LIMIT = 2        // 2 kỳ liên tiếp = cảnh báo game over
