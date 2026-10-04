// ═══════════════════════════════════════════════════════
// MOCITY 2 — Types
// Story: Người lên thành phố lập nghiệp, có nợ, phải trả
// ═══════════════════════════════════════════════════════

export type GamePhase = 'intro' | 'act1' | 'act2' | 'act3' | 'act4' | 'ending'

export type EndingType = 'cashflow-master' | 'risk-taker' | 'sustainable' | null

export type BusinessType =
  | 'ca-phe-coc'
  | 'banh-mi'
  | 'quan-an'
  | 'shop-thoi-trang'
  | 'tiem-giat'
  | 'tiem-thuoc'

export type EventType =
  | 'debt-due'        // lãi tháng đến hạn
  | 'rain'            // mưa lớn, giảm doanh thu
  | 'spoilage'        // hàng thiu, mất inventory
  | 'tax-check'       // thanh tra thuế
  | 'opportunity'     // cơ hội mua ô đất mới
  | 'competitor'      // đối thủ mở shop cạnh

export type EthicsPath = 'clean' | 'risky' | 'neutral'

// ─── Inventory ──────────────────────────────────────────
export interface InventoryItem {
  id: string
  name: string
  quantity: number
  costPerUnit: number   // VND
  revenuePerUnit: number
  spoilsInDays: number  // 0 = không thiu
  purchasedOnDay: number
}

// ─── Business (cửa hàng) ────────────────────────────────
export interface Business {
  id: string
  type: BusinessType
  name: string
  level: number         // 1-5
  plotIndex: number     // 0, 1, 2
  staffCount: number    // 0-3
  inventory: InventoryItem[]
  // Tài chính (per day)
  baseDailyRevenue: number
  dailyRent: number     // chi phí thuê mặt bằng
  dailyUtility: number  // điện nước
  // State
  openedOnDay: number
  isOpen: boolean
}

// ─── Nợ ─────────────────────────────────────────────────
export interface DebtRecord {
  principal: number         // 200_000_000
  monthlyInterest: number   // 5_000_000
  nextPaymentDay: number    // 30, 60, 90...
  missedPayments: number    // 2 liên tiếp = game over warning
  paidPrincipal: number     // tổng đã trả gốc
}

// ─── Event Card ─────────────────────────────────────────
export interface EventChoice {
  id: string
  label: string
  description: string
  ethicsImpact: number   // >0 clean, <0 risky
  cashEffect: number     // ngay lập tức
  apply: (state: GameState) => Partial<GameState>
}

export interface GameEvent {
  id: string
  type: EventType
  title: string
  body: string
  choices: EventChoice[]
  triggeredOnDay: number
}

// ─── Ledger entry ───────────────────────────────────────
export interface LedgerEntry {
  day: number
  label: string
  amount: number   // dương = thu, âm = chi
  category: 'revenue' | 'cogs' | 'rent' | 'staff' | 'debt' | 'tax' | 'misc'
}

// ─── NPC ────────────────────────────────────────────────
export interface NPC {
  id: string
  name: string
  role: string
  portrait: string   // seed cho ChibiBody
  dialogue: string[] // pool câu thoại
}

// ─── Game State (toàn bộ) ───────────────────────────────
export interface GameState {
  // Identity
  playerName: string

  // Tiền & nợ
  cash: number               // tiền mặt hiện tại
  debt: DebtRecord

  // Thời gian
  day: number                // 1-360
  phase: GamePhase
  realTickMs: number         // 1 game-day = X ms real (default 3000)

  // Kinh doanh
  businesses: Business[]
  maxPlots: number           // số ô đất được phép dùng

  // Events
  pendingEvent: GameEvent | null
  resolvedEventIds: string[]

  // Ledger
  ledger: LedgerEntry[]

  // Ethics path (ảnh hưởng ending)
  ethicsScore: number        // +1 clean, -1 risky per choice

  // Flags
  flags: string[]

  // Stats tổng
  totalRevenue: number
  totalExpenses: number
  ending: EndingType

  // UI state (không serialize)
  isPaused: boolean
  activeModal: 'none' | 'business' | 'ledger' | 'debt' | 'restock' | 'intro'
  selectedBusinessId: string | null
}
