import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { GameState, Business, BusinessType, LedgerEntry, GameEvent, EventChoice } from './types'
import {
  STARTING_CASH,
  DEBT_PRINCIPAL,
  MONTHLY_INTEREST,
  MONTHLY_CYCLE_DAYS,
  REAL_MS_PER_GAME_DAY,
  BUSINESS_BY_TYPE,
  STAFF_COST_PER_DAY,
  STAFF_REVENUE_BOOST,
  STAFF_MAX,
  ETHICS_CLEAN_THRESHOLD,
  ETHICS_RISKY_THRESHOLD,
  MISSED_PAYMENT_LIMIT,
  MAX_PLOTS_BY_ACT,
} from './constants'
import { buildDebtDueEvent, buildRainEvent, buildSpoilageEvent } from './events'

// ─── Initial State ───────────────────────────────────────
const INITIAL: GameState = {
  playerName: '',
  cash: STARTING_CASH,
  debt: {
    principal: DEBT_PRINCIPAL,
    monthlyInterest: MONTHLY_INTEREST,
    nextPaymentDay: MONTHLY_CYCLE_DAYS,
    missedPayments: 0,
    paidPrincipal: 0,
  },
  day: 1,
  phase: 'intro',
  realTickMs: REAL_MS_PER_GAME_DAY,
  businesses: [],
  maxPlots: 1,
  pendingEvent: null,
  resolvedEventIds: [],
  ledger: [],
  ethicsScore: 0,
  flags: [],
  totalRevenue: 0,
  totalExpenses: 0,
  ending: null,
  isPaused: false,
  activeModal: 'intro',
  selectedBusinessId: null,
}

// ─── Helpers ─────────────────────────────────────────────
function calcDailyProfit(b: Business): { revenue: number; expenses: number; profit: number } {
  const def = BUSINESS_BY_TYPE[b.type]
  const revenueBoost = 1 + b.staffCount * STAFF_REVENUE_BOOST
  const revenue = Math.round(b.baseDailyRevenue * revenueBoost)
  const staffCost = b.staffCount * STAFF_COST_PER_DAY
  const expenses = def.dailyRent + def.dailyUtility + staffCost
  return { revenue, expenses, profit: revenue - expenses }
}

function addLedger(state: GameState, entry: Omit<LedgerEntry, 'day'>) {
  state.ledger.push({ ...entry, day: state.day })
  if (entry.amount > 0) state.totalRevenue += entry.amount
  else state.totalExpenses += Math.abs(entry.amount)
}

function resolvePhase(day: number): GameState['phase'] {
  if (day <= 60) return 'act1'
  if (day <= 150) return 'act2'
  if (day <= 270) return 'act3'
  if (day <= 360) return 'act4'
  return 'ending'
}

// ─── Store ───────────────────────────────────────────────
interface Actions {
  startGame: (name: string) => void
  tick: () => void
  openBusiness: (type: BusinessType, plotIndex: number) => string | null  // returns error or null
  restockInventory: (businessId: string, quantity: number) => void
  hireStaff: (businessId: string) => string | null
  resolveEvent: (choice: EventChoice) => void
  payDebt: (amount: number) => string | null  // trả nợ gốc
  openModal: (modal: GameState['activeModal'], businessId?: string) => void
  closeModal: () => void
  pauseToggle: () => void
  setTickSpeed: (ms: number) => void
}

export const useGameStore = create<GameState & Actions>()(
  immer((set, get) => ({
    ...INITIAL,

    startGame: (name) =>
      set((s) => {
        s.playerName = name
        s.phase = 'act1'
        s.activeModal = 'none'
        s.maxPlots = MAX_PLOTS_BY_ACT['act1']
      }),

    tick: () =>
      set((s) => {
        if (s.isPaused || s.pendingEvent) return
        if (s.phase === 'intro' || s.phase === 'ending') return

        s.day += 1

        // Phase transition
        const newPhase = resolvePhase(s.day)
        if (newPhase !== s.phase) {
          s.phase = newPhase
          s.maxPlots = MAX_PLOTS_BY_ACT[newPhase] ?? s.maxPlots
        }

        // Ending
        if (s.day > 360) {
          s.phase = 'ending'
          if (s.ethicsScore >= ETHICS_CLEAN_THRESHOLD) s.ending = 'sustainable'
          else if (s.ethicsScore <= ETHICS_RISKY_THRESHOLD) s.ending = 'risk-taker'
          else s.ending = 'cashflow-master'
          return
        }

        // Daily business income/expense
        for (const b of s.businesses) {
          if (!b.isOpen) continue
          const { revenue, expenses } = calcDailyProfit(b)
          s.cash += revenue - expenses
          addLedger(s, { label: `${b.name} - doanh thu`, amount: revenue, category: 'revenue' })
          addLedger(s, { label: `${b.name} - chi phí`, amount: -expenses, category: 'rent' })
        }

        // Monthly debt payment
        if (s.day === s.debt.nextPaymentDay) {
          const event = buildDebtDueEvent(s.day, s.debt.monthlyInterest)
          s.pendingEvent = event
          s.debt.nextPaymentDay += MONTHLY_CYCLE_DAYS
        }

        // Random events (10% chance per day in act1+)
        if (!s.pendingEvent && Math.random() < 0.08) {
          const roll = Math.random()
          if (roll < 0.4 && s.businesses.length > 0) {
            s.pendingEvent = buildRainEvent(s.day)
          } else if (roll < 0.7 && s.businesses.some(b => b.inventory.length > 0)) {
            s.pendingEvent = buildSpoilageEvent(s.day)
          }
        }
      }),

    openBusiness: (type, plotIndex) => {
      const state = get()
      const def = BUSINESS_BY_TYPE[type]
      if (!def) return 'Loại hình kinh doanh không tồn tại'
      if (state.businesses.length >= state.maxPlots) return `Chỉ được mở tối đa ${state.maxPlots} cửa hàng ở giai đoạn này`

      const totalCost = def.openCost + def.depositRent
      if (state.cash < totalCost) return `Không đủ tiền. Cần ${(totalCost / 1_000_000).toFixed(0)}M để mở`

      const taken = state.businesses.some(b => b.plotIndex === plotIndex)
      if (taken) return 'Ô đất này đã được sử dụng'

      set((s) => {
        s.cash -= totalCost
        const newBiz: Business = {
          id: `biz-${Date.now()}`,
          type,
          name: def.name,
          level: 1,
          plotIndex,
          staffCount: 0,
          inventory: [],
          baseDailyRevenue: def.baseDailyRevenue,
          dailyRent: def.dailyRent,
          dailyUtility: def.dailyUtility,
          openedOnDay: s.day,
          isOpen: true,
        }
        s.businesses.push(newBiz)
        addLedger(s, { label: `Mở ${def.name}`, amount: -totalCost, category: 'misc' })
        s.flags.push('opened-business')
      })
      return null
    },

    restockInventory: (businessId, quantity) =>
      set((s) => {
        const biz = s.businesses.find(b => b.id === businessId)
        if (!biz) return
        const def = BUSINESS_BY_TYPE[biz.type]
        const cost = quantity * 50_000  // 50k/đơn vị hàng
        if (s.cash < cost) return
        s.cash -= cost
        biz.inventory.push({
          id: `inv-${Date.now()}`,
          name: 'Hàng hóa',
          quantity,
          costPerUnit: 50_000,
          revenuePerUnit: 80_000,
          spoilsInDays: def.type === 'banh-mi' ? 1 : def.type === 'ca-phe-coc' ? 3 : 0,
          purchasedOnDay: s.day,
        })
        addLedger(s, { label: `Nhập hàng - ${biz.name}`, amount: -cost, category: 'cogs' })
      }),

    hireStaff: (businessId) => {
      const state = get()
      const biz = state.businesses.find(b => b.id === businessId)
      if (!biz) return 'Không tìm thấy cửa hàng'
      if (biz.staffCount >= STAFF_MAX) return `Đã đủ ${STAFF_MAX} nhân viên`
      const hireCost = 2_000_000 * (biz.staffCount + 1)  // 2M, 4M, 6M
      if (state.cash < hireCost) return `Thiếu tiền thuê. Cần ${(hireCost / 1_000_000).toFixed(0)}M`

      set((s) => {
        const b = s.businesses.find(b => b.id === businessId)!
        b.staffCount += 1
        s.cash -= hireCost
        addLedger(s, { label: `Thuê nhân viên - ${b.name}`, amount: -hireCost, category: 'staff' })
        if (!s.flags.includes('hired-staff')) s.flags.push('hired-staff')
      })
      return null
    },

    resolveEvent: (choice) =>
      set((s) => {
        if (!s.pendingEvent) return
        s.ethicsScore += choice.ethicsImpact
        s.cash += choice.cashEffect

        if (choice.cashEffect !== 0) {
          addLedger(s, {
            label: choice.label,
            amount: choice.cashEffect,
            category: choice.cashEffect < 0 ? 'debt' : 'misc',
          })
        }

        // Apply any extra state changes
        const extra = choice.apply(s)
        Object.assign(s, extra)

        s.resolvedEventIds.push(s.pendingEvent.id)
        s.pendingEvent = null
      }),

    payDebt: (amount) => {
      const state = get()
      if (state.cash < amount) return 'Không đủ tiền mặt'
      if (amount > state.debt.principal - state.debt.paidPrincipal) return 'Số tiền vượt quá nợ gốc còn lại'
      set((s) => {
        s.cash -= amount
        s.debt.paidPrincipal += amount
        addLedger(s, { label: 'Trả nợ gốc', amount: -amount, category: 'debt' })
        if (s.debt.paidPrincipal >= s.debt.principal && !s.flags.includes('debt-cleared')) {
          s.flags.push('debt-cleared')
        }
      })
      return null
    },

    openModal: (modal, businessId) =>
      set((s) => {
        s.activeModal = modal
        s.selectedBusinessId = businessId ?? null
      }),

    closeModal: () =>
      set((s) => {
        s.activeModal = 'none'
        s.selectedBusinessId = null
      }),

    pauseToggle: () => set((s) => { s.isPaused = !s.isPaused }),

    setTickSpeed: (ms) => set((s) => { s.realTickMs = ms }),
  }))
)

// ─── Selectors ───────────────────────────────────────────
export const selectDebtRemaining = (s: GameState) =>
  s.debt.principal - s.debt.paidPrincipal

export const selectNetWorth = (s: GameState) =>
  s.cash - selectDebtRemaining(s)

export const selectDailyCashflow = (s: GameState) => {
  let flow = 0
  for (const b of s.businesses) {
    if (!b.isOpen) continue
    const { profit } = calcDailyProfit(b)
    flow += profit
  }
  return flow
}
