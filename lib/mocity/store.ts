'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
  BUILDING_BY_ID,
  INVENTORY_BY_ID,
  MANAGER_BY_ID,
  MAYOR_QUESTS,
  CITY_TIERS,
  DAILY_QUESTS,
  cityTierFor,
  STREAK_MILESTONES,
  MODULE_BY_ID,
  STARTER_INVENTORY,
  starUpgradeCost,
  upgradeCostCoins,
  xpForLevel,
} from './mock-city-data';
import { spend } from './currency-manager';
import { VND_PER_OLD_COIN } from './currency';
import {
  buildingAt,
  flowFor,
  type FlowOptions,
  debtCeilingFor,
  interestCoverage,
  clampHappiness,
  HAPPINESS_BOOST_CAP,
  happinessFor,
  isInsideUnlocked,
  landCostCoins,
  populationFor,
  taxMultiplierFromHappiness,
  type FlowBreakdown,
  checkFraudRiskForBuilding,
  calculateMayorTrustScore,
  calculateCashflowRatio,
  calculateTuiThanTaiInterest,
  calculateInsuranceCoverage,
  overloadedShopCount,
  type CityCondition,
  nodeYieldBreakdown,
  takeRateFor,
  demandPerSecond,
  supplyPerSecond,
  savingsInterestPerSecond,
  MIN_SUPPLY_FACTOR,
  blendedRates,
  CORPORATE_TAX_RATE,
} from './city-calculator';

import { CITY_EVENTS, EVENT_BY_ID, REQUEST_BY_ID } from './dialogue-data';
import { eligibleRequestFor } from './dialogue-engine';
import { weekComparison, type WeekComparison } from './comparison';
import { TUTORIAL_STEPS, currentTutorialStep, type TutorialStep } from './tutorial';
import { ARCHETYPES, DIGITAL_TRUST_THRESHOLD, archetypeForBuilding, npcNameFor } from './npc-data';
import { INITIAL_NPC_LEDGERS, grantNpcLoan, investNpcEquity } from './npc-micro-economy';
import { INITIAL_MOMO_FINANCIAL_OS, depositTuiThanTai, withdrawTuiThanTai, borrowViTraSau, repayViTraSau } from './momo-financial-os';
import { OPPORTUNITY_CARDS, BLACK_SWAN_EVENTS } from './opportunity-cards';
import { calculateWealthMatrix, evaluateEndingProfile } from './wealth-matrix';
import {
  emptyLedger,
  emptyPeriodLedger,
  type ActiveRequest,
  type BuildingNode,
  type CityEventScript,
  type DailySnapshot,
  type CityState,
  type Currencies,
  type DialogueEffects,
  type LedgerEntry,
  type NpcState,
  type PeriodLedger,
  type StreakState,
  type StoreModuleId,
  type TimeOfDay,
  type WeatherType,
  type GameAct,
  type EndingEvaluation,
  type GameEnding,
  type NpcMicroLedger,
  type OpportunityCardDef,
  type BlackSwanEventDef,
  type MomoFinancialOSState,
  type WealthMatrixMetrics,
} from './types';
import {
  autoServeQueues,
  clearShopQueue as txClearShopQueue,
  closeSingleOrder,
  expireQueues,
  resetArrivalAccumulator,
  serviceIntervalMsFor,
  settleArrivals,
  simulateOfflineBatch,
  STAFF_MAX,
  sumTransactions,
  totalBacklog,
  type ShopQueue,
  type TxCtx,
  type Transaction,
} from './transactions';

/**
 * Tien to khoa luu tru. `/mocity` bay gio bat buoc dang nhap (middleware), nen
 * save duoc gan theo tai khoan: khong thi hai nguoi dung lao tai khoan tren
 * cung mot may se ke thua toan bo thanh pho cua nhau (cung Xu, cung ten Tho).
 */
const STORAGE_KEY_PREFIX = 'momo_city_v10';
const STATE_VERSION = 10;
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
/**
 * Trần lô giao dịch AFK, tính trên LỢI NHUẬN RÒNG.
 *
 * Trước đây là `Math.min(500_000, earned)` đặt chung với code - cắt tiền mà
 * người chơi không nhìn thấy. Giờ là hằng có tên, test được.
 */
export const OFFLINE_COIN_CAP = 50_000_000;
const OFFLINE_MIN_MS = 60 * 1000;
const PERSIST_DEBOUNCE_MS = 250;
/** Toi da 3 dau `!` cung luc - nhieu hon se thanh nhieu loan tren ban do. */
const MAX_ACTIVE_REQUESTS = 3;
const REQUEST_INTERVAL_MS = 25 * 1000;
/**
 * Yeu cau cua dan co han 8 phut.
 *
 * Khong co han thi mot request bo qua tro thanh chan suc: `activeRequests` day
 * 3 o la moi yeu cau moi dung, va ca 2 cong Chuyen Pho (nut thu cong va hen
 * 6-9 phut) deu do `activeRequests.length > 0` nen pho khoi tinh chuyen gi
 * nua. 8 phut du cho nguoi choi noi chuyen 2-3 lan, qua do thi co viec khac.
 */
export const REQUEST_TTL_MS = 8 * 60 * 1000;
const EVENT_INTERVAL_MS = 6 * 60 * 1000;

/*
 * GIO VANG (Fever x2 doanh thu) DA BO HOAN TOAN.
 *
 * `feverUntil`/`feverEverUsed`/`feverUsedToday`/`feverDay` van con trong
 * `CityState` CHI de save cu doc duoc ma khong vo migration; khong con duong
 * nao ghi gia tri moi vao cac field do. `flowFor` cung khong con tham so
 * `isFever` nua - he so 2x da xoa han khoi cong thuc, nen khong con cach nao
 * (ke ca test) tinh lai so cu.
 */

/**
 * Toi da so su kien toan pho Thieu Truong duoc giai quyet trong mot ngay.
 * Day la chot chong arbitrage: neu khong co han, nguoi choi co the bam lien
 * "Chuyen Pho" de spawn event, chon phuong an hien viet (tra Xu nho, nhan vat
 * pham dat gia tri lon) va lui ve loi thu hieu hon.
 */
/**
 * Chuyen Pho tu dong hien moi 6 phut (trung voi `EVENT_INTERVAL_MS`) va tran
 * 6 luot/ngay. 6/6 la can du cho nhiem vu ngay `d-xu-chuyen-pho` (2 luot)
 * hoan thanh sau khoang 12 phut choi, ma van du de Chuyen Pho khong tro thanh
 * chuong trinh chinh chiem het phien choi. Event chu yeu TRU Xu doi lay uy
 * tin chu khong phai nguon thu, nen noi tran khong tao lo hong kinh te.
 */
const MAX_EVENTS_PER_DAY = 6;

/**
 * Diem khoi dau. O version <= 3 game cap toi da 1.000.000 Xu / 500 Kim Cuong
 * ngay tu dau va con "ban" lai nhu vay moi lan hydrate, khong co cong trinh
 * nao dat duoc nguong chi phi do. V4 dat lai so khoi tao dung do kinh te:
 * bat dau o Tho Tier-1 (60 - 240 Xu) va tien chi ton tai o dia phuong.
 */
export const STARTING_COINS = 50_000_000;
export const STARTING_GEMS = 10;

/** Khoa ngay theo gio dia phuong, dung de dem han su kiet 24h. */
function todayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Ngày due date +N ngày từ ts, cùng format todayKey. */
function futureDateKey(ts: number, days: number): string {
  return todayKey(ts + days * 86_400_000);
}

/** true nếu today >= dueDateStr. */
function isOverdue(dueDateStr: string, now: number): boolean {
  if (!dueDateStr) return false;
  return todayKey(now) >= dueDateStr;
}

const PLAYER_DEBT_MONTHLY_INTEREST = 5_000_000;
const PLAYER_DEBT_INTERVAL_DAYS = 30;
/**
 * So ky lai tre lien tien truoc khi ong Chin lay dat.
 *
 * Moi ky la 30 ngay thuc, nen day la canh bao cuoi cung chu khong phai tro
 * cham: 1 - 2 ky tre se bi tru uy tin (thieu tien thi khong tra duoc), den
 * ky thu 3 thi `endingForState` tra ve 'bankrupt'.
 */
export const PLAYER_DEBT_MISSED_LIMIT = 3;

/**
 * Khoa thang cho so cai thang. Khac `todayKey`: quy doi 1 ngay 0h cua thang
 * sau se xoa so thang - day la ky bao cao ma nguoi choi can xem lai de
 * danh gia xem ca thanh pho co dang on dinh khong.
 */
function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

/** Tang mot bo dem nhiem vu ngay, tu reset khi sang ngay moi. */
function bumpDaily(
  s: CityState,
  key: import('./mock-city-data').DailyCounterKey,
  amount = 1,
  now = Date.now(),
): import('./types').DailyLog {
  const log = s.dailyLog?.day === todayKey(now) ? s.dailyLog : emptyDailyLog(now);
  return { ...log, [key]: log[key] + amount };
}

/**
 * SO BAN GHI SO LUC GIU LAI.
 *
 * 7 ngay: bang so sanh 7 ngay truoc la moi dung nhung cong thich ngay hom
 * nay hon. Giu them 1 ban ghi de khi nguoi choi vua qua 7 ngay thi ngay 8
 * van co moc so sanh (khong ra man hinh trong khoang khong).
 */
export const DAILY_SNAPSHOT_KEEP = 7;

function emptyDailyLog(ts: number): import('./types').DailyLog {
  return { day: todayKey(ts), built: 0, upgraded: 0, talked: 0, eventsResolved: 0, starEvolved: 0, idleXp: 0, claimed: [] };
}

/* ── NHÀ CỦA THÀNH PHỐ (NPC) ────────────────────────────────────────────── */

interface CityLotDef {
  id: string;
  defId: string;
  /** Ô ưa thích - hàng 1 (hàng sau), để hàng 0 còn lại cho tiệm của player. */
  col: number;
  row: number;
  level: number;
  starRating: number;
}

/**
 * 4 tòa nhà thành phố seed từ đầu: khu dân cư đã có người từ trước khi
 * người lập nghiệp tới phố. Chúng là "hàng xóm" - nguồn khách và điểm
 * cộng synergy liên kế - chứ không phải tài sản của player.
 */
const CITY_LOTS: CityLotDef[] = [
  { id: 'city-nha-1', defId: 'nha-pho-binh-dan', col: 0, row: 1, level: 2, starRating: 3 },
  { id: 'city-nha-2', defId: 'nha-pho-binh-dan', col: 1, row: 1, level: 2, starRating: 3 },
  { id: 'city-ky-tuc', defId: 'ky-tuc-xa-sinh-vien', col: 2, row: 1, level: 1, starRating: 3 },
  { id: 'city-nha-3', defId: 'nha-pho-binh-dan', col: 3, row: 1, level: 1, starRating: 3 },
];

const CITY_LOT_IDS = new Set(CITY_LOTS.map((lot) => lot.id));

/** Node có phải nhà của thành phố không? Dùng khi đọc save cũ. */
function isCityNode(node: BuildingNode): boolean {
  return node.npcOwned === true || CITY_LOT_IDS.has(node.id);
}

function makeCityBuildings(now: number): BuildingNode[] {
  return CITY_LOTS.map((lot) => ({
    id: lot.id,
    defId: lot.defId,
    col: lot.col,
    row: lot.row,
    level: lot.level,
    starRating: lot.starRating,
    lastCollectedAt: now,
    npcOwned: true,
  }));
}

/**
 * Ghép nhà thành phố vào lưới, KHÔNG BAO GIỜ chồng lên ô người chơi đã xây.
 *
 * Vì sao cần hàm này thay vì seed cứng 4 ô (0..3, 1):
 * - Save cũ có thể đã có tiệm ở đúng hàng 1 -> hai node cùng ô, bảng vỉa
 *   hè render ô này còn `buildingAt` trả ô kia, người chơi không bấm được
 *   công trình của chính mình nữa.
 * - Bản build trước đã đẩy thẳng nhà NPC vào `state.buildings`; save đó
 *   phải được gỡ ra và đặt lại.
 *
 * Bảo đảm tính idempotent: giữ nguyên vị trí đã đặt nếu ô đó còn trống
 * (đối với `playerBuildings`), chỉ những tòa thiếu mới đi tìm ô mới. Gọi
 * hai lần liên tiếp cho cùng input cho ra y hệt kết quả.
 */
function ensureCityBuildings(
  playerBuildings: BuildingNode[],
  existing: BuildingNode[] | undefined,
  unlockedCols: number,
  unlockedRows: number,
  now: number,
): BuildingNode[] {
  const cols = Math.max(1, Math.min(unlockedCols, 10));
  const rows = Math.max(1, Math.min(unlockedRows, 10));

  const takenByPlayer = new Set(
    playerBuildings.map((b) => `${b.col}:${b.row}`),
  );

  // Node nhà thành phố đã có từ save: khử trùng lặp theo id, bỏ node đang
  // nằm trên đất của người chơi (để đặt lại xuống ô trống thay vì tranh ô).
  const kept: BuildingNode[] = [];
  for (const lot of CITY_LOTS) {
    const found = (existing ?? []).find((n) => n.id === lot.id && !takenByPlayer.has(`${n.col}:${n.row}`));
    if (found) kept.push({ ...found, npcOwned: true });
  }
  const placed = new Set(kept.map((b) => `${b.col}:${b.row}`));

  const missing = CITY_LOTS.filter((lot) => !kept.some((n) => n.id === lot.id));
  for (const lot of missing) {
    // Ưu tiên ô ưa thích, rồi cả hàng 1, rồi quét toàn bộ vùng đã mở.
    const candidates: Array<[number, number]> = [];
    const seen = new Set<string>();
    const push = (c: number, r: number) => {
      if (c < 0 || c >= cols || r < 0 || r >= rows) return;
      const key = `${c}:${r}`;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push([c, r]);
    };
    push(lot.col, lot.row);
    for (let c = 0; c < cols; c++) push(c, 1);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) push(c, r);

    const free = candidates.find(([c, r]) => !takenByPlayer.has(`${c}:${r}`) && !placed.has(`${c}:${r}`));
    if (!free) continue; // Hết đất trống - bỏ tòa, đây chỉ là cảnh quan.
    placed.add(`${free[0]}:${free[1]}`);
    kept.push({
      id: lot.id,
      defId: lot.defId,
      col: free[0],
      row: free[1],
      level: lot.level,
      starRating: lot.starRating,
      lastCollectedAt: now,
      npcOwned: true,
    });
  }

  // Trả về theo thứ tự CITY_LOTS để kết quả ổn định giữa các lần hydrate.
  return CITY_LOTS.flatMap((lot) => kept.filter((n) => n.id === lot.id));
}

function createInitialState(): CityState {
  const now = Date.now();
  return {
    version: STATE_VERSION,
    mayorName: 'Người Lập Nghiệp',
    cityName: 'Đô Thị MoCity',
    hasNamedCity: false,
    mayorGender: 'female',
    mayorLevel: 1,
    mayorXp: 0,
    gridSize: 10,
    unlockedCols: 4,
    unlockedRows: 4,
    // Toàn bộ tài sản của người chơi - khởi đầu TRỐNG: 50 triệu Xu và một
    // khoản nợ là tất cả những gì người lập nghiệp mang lên phố.
    buildings: [],
    // 4 tòa nhà của thành phố (NPC): khu dân cư đã có người từ trước khi
    // player tới. Xem `ensureCityBuildings` để biết cách đặt ô không chồng
    // lên công trình mà người chơi đã xây ở save cũ.
    cityBuildings: makeCityBuildings(now),
    npcs: [],
    unlockedManagers: [],
    claimedQuests: [],
    inventory: { ...STARTER_INVENTORY },
    // Truoc day trang bi san 'relic-heo-vang' (+25% doanh thu MIEN PHI ngay
    // tu phut dau). Khong con RELIC nao trong INVENTORY_ITEMS nua nen de rong.
    equippedRelics: [],
    feverUntil: 0,
    feverEverUsed: false,
    feverUsedToday: 0,
    feverDay: '',
    activeRequests: [],
    pendingEvent: null,
    lastRequestAt: now,
    lastEventAt: now,
    lastTalkAt: 0,
    lastEngagedAt: now,
    eventLog: { day: todayKey(now), resolved: 0 },
    tutorialStep: 0,
    tutorialFlags: [],
    debt: 0,
    totalInterestPaid: 0,
    playerDebtPrincipal: 200_000_000,
    playerDebtPaid: 0,
    playerDebtNextDueDateStr: futureDateKey(now, PLAYER_DEBT_INTERVAL_DAYS),
    playerDebtMissed: 0,
    gameEnding: null,
    dailyLog: emptyDailyLog(now),
    streak: { days: 0, lastDay: '', best: 0, shields: 0 },
    streakClaimed: 0,
    dailySnapshots: [],
    cityTierClaimed: 1,
    happinessBoost: 0,
    tappedAt: {},
    totalVolume: 0,
    coins: STARTING_COINS,
    gems: STARTING_GEMS,
    energy: 0,
    blueprints: 0,
    medals: 0,
    lastSeenAt: now,
    createdAt: now,
    totalCoinsEarned: STARTING_COINS,
    totalRevenue: 0,
    totalGrants: 0,
    totalTapIncome: 0,
    ledgerLifetime: emptyPeriodLedger(todayKey(now), monthKey(now)),
    ledgerDay: emptyPeriodLedger(todayKey(now), monthKey(now)),
    ledgerMonth: emptyPeriodLedger(todayKey(now), monthKey(now)),
    bubblesCollected: 0,
    pendingOffline: null,
    // Transaction Engine: khởi đầu không có ai chờ. Không có hàng chờ thì
    // không có doanh thu - luật chơi mới từ đây.
    shopQueues: [],
    ordersLost: 0,
    ordersClosed: 0,
    timeOfDay: 'DAY',
    trustScore: 650,
    workingCapital: STARTING_COINS,
    personalWealth: 0,
    loanDueDay: '',
    loanLateFeeCount: 0,
    fraudBlockedCount: 0,
    fraudLossCoins: 0,
    tuiThanTaiBalance: 0,
    tuiThanTaiInterestEarned: 0,
    hasInsurance: false,
    insuranceClaimsPaid: 0,
    weather: 'SUNNY',
    isFlooded: false,
    ap: 50,
    maxAp: 50,
    lastApRegenMs: now,
    mayorPoints: 100,
    savingsBalance: 0,
    savingsTier: 'NONE',
    savingsStartedAt: 0,
    loanPrincipal: 0,
    loanStartedAt: 0,
    investedFundId: 'NONE',
    investedAmount: 0,
    investedAt: 0,
    insuranceActiveUntilMs: 0,
    activeIncidents: [],
    fixedIncidents: [],
    currentAct: 'ACT_1_STARTER',
    npcMicroLedgers: INITIAL_NPC_LEDGERS,
    momoOSState: INITIAL_MOMO_FINANCIAL_OS,
    activeOpportunityCardId: 'ACT1_STARTUP_CHOICE',
    activeBlackSwanId: null,
  };
}

let state: CityState = createInitialState();
const serverSnapshot: CityState = createInitialState();
let hydrated = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Tai khoan dang choi. `null` = chua bind (dung o server render). */
let boundPlayerId: string | null = null;

/**
 * Da nap thanh pho tu localStorage chua. Can cho UI: `state` mac dinh la
 * thanh pho moi, nen render truoc khi hydrate se hien "Chao moi den Do Thi
 * MoCity" roi vut sang "Mung ban tro lai" - nhay hinh.
 */
let cityHydrated = false;

/**
 * Khoa localStorage cua tai khoan hien tai. Session co `sub`/email la dinh
 * danh on dinh trong ca chieu doi mo hinh dang nhap, nen dung chung cho ca
 * Google OAuth va tai khoan admin.
 */
function storageKeyFor(playerId: string | null): string {
  return playerId ? `${STORAGE_KEY_PREFIX}_${playerId}` : STORAGE_KEY_PREFIX;
}

/**
 * Migration ladder. Moi khoi `n` bien state version `n` sang `n + 1`.
 * Bat buoc phai giu nguyen `buildings` / `npcs` / `inventory`: version <= 3
 * quy dinh xoa sach toan bo thanh pho khi version lech, nghia la moi thay doi
 * balance deu phai xoa save cua nguoi choi.
 */
const MIGRATIONS: Record<number, (s: CityState) => CityState> = {
  3: (s) => ({
    ...s,
    eventLog: { day: todayKey(Date.now()), resolved: 0 },
    tutorialStep: 0,
    tutorialFlags: [],
    debt: 0,
    totalInterestPaid: 0,
    dailyLog: emptyDailyLog(Date.now()),
    cityTierClaimed: 1,
    happinessBoost: 0,
    lastEngagedAt: s.lastEventAt ?? Date.now(),
    tappedAt: {},
  }),
  /**
   * V4 -> V5: them `feverEverUsed` va noi `lastTalkAt` cho cooldown noi pho.
   * `feverEverUsed` giu nguyen gia tri cua save dang chay Fever de khong phat
   * nguoi choi dang giua chung.
   */
  4: (s) => ({
    ...s,
    feverEverUsed: (s.feverUntil ?? 0) > 0,
    lastTalkAt: s.lastTalkAt ?? 0,
  }),
  /**
   * V5 -> V6: tach khoan thu thanh doanh thu / thuong cap / tien cham.
   *
   * Save cu khong the biet phan nao la doanh thu that, nen KHONG doan - ca
   * `totalCoinsEarned` cu duoc giu o ca hai dong va con so doanh thu dung
   * bat dau tu 0. Ngay khi nguoi choi lai, doanh thu moi cong dung vao
   * `totalRevenue`; con so cu chi dung de hien tong nhap.
   */
  5: (s) => ({
    ...s,
    totalRevenue: 0,
    totalGrants: s.totalCoinsEarned ?? 0,
    totalTapIncome: 0,
  }),
  /**
   * V6 -> V7: them so cai P&L (vĩnh viễn / ngày / tháng).
   *
   * Save cu khong co du lieu doanh thu / gia von theo ky nen KHONG doan - ca
   * ba so bat dau tu 0 va cong dan tu tick dau tien. Khong suy tien doanh thu
   * ra gia von theo ty le mac dinh: 2.959 trieu Xu thuong khong phai la loi
   * nhuan nen uoc luong sai se ghi vao bao cao mot lan nua.
   */
  6: (s) => {
    const day = todayKey(Date.now());
    const month = monthKey(Date.now());
    return {
      ...s,
      ledgerLifetime: emptyPeriodLedger(day, month),
      ledgerDay: emptyPeriodLedger(day, month),
      ledgerMonth: emptyPeriodLedger(day, month),
    };
  },
  /**
   * V7 -> V8: them chuoi ngay choi lien tiep.
   *
   * Khoi tao `days: 0` chu khong phai 1: nguoi choi moi chua choi ngay nao.
   * `registerStreak` se tang len 1 ngay dau tien.
   */
  7: (s) => ({
    ...s,
    streak: s.streak ?? { days: 0, lastDay: '', best: 0 },
    streakClaimed: s.streakClaimed ?? 0,
  }),
  /**
   * V8 -> V9: so luc 7 ngay qua + phieu bao vui chuoi + gioi han so lan dung
   * Giờ Vàng trong ngày.
   *
   * `dailySnapshots` KHỞI TẠO RỖNG chứ không dựng lại từ ledger cũ: ledger
   * chỉ giữ ba số tien (doanh thu, gia von, chi phi) nen suy ra loi nhuan
   * rong, dan so va hanh phuc cho 7 ngay da qua la uoc luong. Uoc luong do se
   * ghi mot lan nua nhung bao cao sai - dung hon la de cho bang so sanh
   * chay sau khi nguoi choi da sung du 7 ngay.
   */
   8: (s) => ({
     ...s,
     dailySnapshots: Array.isArray(s.dailySnapshots) ? s.dailySnapshots : [],
     feverUsedToday: nonNeg(s.feverUsedToday),
     feverDay: typeof s.feverDay === 'string' ? s.feverDay : '',
     streak: s.streak ? { ...s.streak, shields: nonNeg(s.streak.shields) } : s.streak,
   }),
   /**
    * V9 -> V10: rebase đồng sang VND thật.
    *
    * Tất cả các số tiền trong save cũ đều nhân với `VND_PER_OLD_COIN`. Khi
    * hệ thống kinh tế thay đổi đơn vị, người chơi không mất tiền - chỉ phải
    * chờ game chuyển đổi tự động.
    */
   9: (s) => {
     const m = VND_PER_OLD_COIN;
     return {
       ...s,
       coins: s.coins * m,
       debt: s.debt * m,
       totalRevenue: s.totalRevenue * m,
       totalGrants: s.totalGrants * m,
       totalTapIncome: s.totalTapIncome * m,
       totalInterestPaid: s.totalInterestPaid * m,
     };
    },
   };

/** Gia tri so khong am, ho tro cho ca migration lan normalize. */
function nonNeg(n: unknown): number {
  return Number.isFinite(n) ? Math.max(0, n as number) : 0;
}

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      localStorage.setItem(storageKeyFor(boundPlayerId), JSON.stringify(state));
    } catch {
      // bo qua khi het quota hoac tat storage
    }
  }, PERSIST_DEBOUNCE_MS);
}

function setState(next: CityState) {
  state = {
    ...next,
    workingCapital: Number.isFinite(next.coins) ? Math.max(0, next.coins) : 0,
  };
  emit();
  schedulePersist();
}

/** Tran cap do Thị Truong. HUD doc hang so nay de hien "Cap toi da". */
export const MAX_MAYOR_LEVEL = 50;

/**
 * XP thuong cho HANH DONG. Truoc day hanh dong chi cho 20-120 XP trong khi Xu
 * nhan roi bom toi 500 XP/giay, nen choi tich cuc hay de may chay deu nhu nhau.
 */
const XP_PER_BUILD = 400;
const XP_PER_UPGRADE = 260;
const XP_PER_STAR = 900;
/**
 * XP tu Xu nhan roi, cong o moi tick AFK.
 *
 * Tran cu la 60/tick = 5.184.000 XP/ngay, gap 4,1 lan TOAN BO duong cong cap 1
 * -> 50 cua thoi gian. Nghia la chi can de may, lv50 trong chua mot gio. Dinh
 * muc nay de len cap phai den tu hanh dong, nhung van thuong cho nguoi choi
 * offline chay duoc mot phan nho.
 */
const IDLE_XP_DIVISOR = 60;
/**
 * Trần XP mỗi GIÂY khi Xu vào ngân khố.
 *
 * Trần cũ = 4 XP/s. Ở cấp 40 doanh thu cho 4.649 XP/s lý thuyết nên 99,9% bị
 * vứt: XP idle trở thành hành động vô nghĩa đúng lúc người chơi cần thấy tiến
 * độ. Trần 15 XP/s cắt ở mức `15 × 86400 = 1.296.000` XP/ngay — vô tác dụng vì
 * `IDLE_XP_DAILY_CAP` (9.000) mới là cửa chặn thật, nhưng ở giữa trận nó cho
 * XP idle kịp hiện trên thanh trước khi chạm trần ngày.
 */
export const IDLE_XP_CAP = 15;
/**
 * Tran XP nhan roi MOI NGAY.
 *
 * Tran theo tick khong du. `IDLE_XP_CAP = 15`/giay nhan voi 86.400 giay la
 * 1.296.000 XP - vuot toan bo duong cong cap 1 -> 50 (377.300 XP), nen cua chan
 * that la `IDLE_XP_DAILY_CAP` duoi day.
 *
 * 9.000 XP/ngay = 2,4% duong cong: van thuong nguoi choi de may chay, nhung
 * khong the thay the viec xay, nang cap va lam nhiem vu.
 */
export const IDLE_XP_DAILY_CAP = 9_000;

/**
 * Tang cap do Thị Truong.
 *
 * Vong lap thay vi chia mot lan: `xpForLevel` tra ve YEU TANG theo cap, nen mot
 * `needed` co dinh se cap thieu cap. Ban <= 3 chia `totalXp / needed` bang
 * nghia den cap 17 tu 5.000 XP (gia thuc lv10 -> 17 ton 7.786 XP).
 */
function addMayorXp(s: CityState, amount: number): Pick<CityState, 'mayorLevel' | 'mayorXp'> {
  let level = Number.isFinite(s.mayorLevel)
    ? Math.min(MAX_MAYOR_LEVEL, Math.max(1, s.mayorLevel))
    : 1;
  let pool = Number.isFinite(s.mayorXp) ? Math.max(0, s.mayorXp) : 0;
  const gain = Number.isFinite(amount) ? Math.min(25_000, Math.max(0, amount)) : 0;

  if (level >= MAX_MAYOR_LEVEL) {
    return { mayorLevel: MAX_MAYOR_LEVEL, mayorXp: 0 };
  }

  pool += gain;
  // `gain` co tran 25.000 nen toi da 50 vong, du cho cap 50 an toan.
  while (level < MAX_MAYOR_LEVEL && pool >= xpForLevel(level)) {
    pool -= xpForLevel(level);
    level += 1;
  }

  return { mayorLevel: level, mayorXp: level >= MAX_MAYOR_LEVEL ? 0 : pool };
}

/**
 * Phan loai mot khoan thu cho `totalCoinsEarned`.
 *
 * `OPERATING` la doanh thu that cua thanh pho (san luong cua hang + phi ha
 * tang + lai tich luy). `GRANT` la tien thuong: nhiem vu, bac thanh pho, qua
 * dang nhap, qua offline. `TAP` la tien thuong vi cham vao cung dan / thu.
 *
 * Phan loai nay khong phai chi cho dep so lieu. Ban <= 4 tat ca gop chung vao
 * `totalCoinsEarned` roi ShareCityCard dan nhan "TONG DOANH THU TICH LUY" -
 * tuc 2,9 trieu Xu thuong cap bi bao cao nhu doanh thu ban hang. Ve ke toan
 * do la von gop von chu so huu, khong phai doanh thu.
 */
type CoinFlow = 'OPERATING' | 'GRANT' | 'TAP';

function withCoins(state: CityState, delta: number, flow: CoinFlow = 'GRANT'): CityState {
  const safeDelta = Number.isFinite(delta) ? delta : 0;
  const gained = Math.max(0, safeDelta);
  const next = { ...state, coins: Math.max(0, (Number.isFinite(state.coins) ? state.coins : 0) + safeDelta) };
  if (gained > 0) {
    const cur = (n: unknown) => (Number.isFinite(n) ? Math.max(0, n as number) : 0);
    next.totalCoinsEarned = cur(next.totalCoinsEarned) + gained;
    next.totalRevenue = cur(next.totalRevenue) + (flow === 'OPERATING' ? gained : 0);
    next.totalGrants = cur(next.totalGrants) + (flow === 'GRANT' ? gained : 0);
    next.totalTapIncome = cur(next.totalTapIncome) + (flow === 'TAP' ? gained : 0);
    // Chi doanh thu van hua duoc sinh cap do Thị Truơng; thuong khong.
    if (flow === 'OPERATING') {
      const now = Date.now();
      const log = next.dailyLog?.day === todayKey(now) ? next.dailyLog : emptyDailyLog(now);
      const conLai = Math.max(0, IDLE_XP_DAILY_CAP - (log.idleXp ?? 0));
      const them = Math.min(IDLE_XP_CAP, gained / IDLE_XP_DIVISOR, conLai);
      if (them > 0) {
        Object.assign(next, addMayorXp(next, them));
        next.dailyLog = { ...log, idleXp: (log.idleXp ?? 0) + them };
      }
    }
  }
  return next;
}

/** Chu tiem tu dong dong y nhan thanh toan so khi du tin tuong. */
function applyTrustThreshold(npc: NpcState): NpcState {
  if (npc.role !== 'MERCHANT' || npc.acceptsDigital) return npc;
  if (npc.trust < DIGITAL_TRUST_THRESHOLD) return npc;
  return { ...npc, acceptsDigital: true, services: [...new Set([...npc.services, 'QR_PAYMENT' as const])] };
}

function clampTrust(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return serverSnapshot;
}

/**
 * Doc + chuan hoa + migrate state luu trong localStorage.
 * Tach rieng khoi `hydrateCity` de co the kiem thu doc lap.
 *
 * - Client cu hon server (version > hien tai): reset, vi khong doc cau truc moi.
 * - Client moi hon server (version < hien tai): chay MIGRATIONS, GIU NGUYEN
 *   thanh pho. Version <= 3 quy dinh xoa sach khi version lech, nghia la moi
 *   thay doi balance deu phai xoa save cua nguoi choi.
 * - KHONG bao gio dat san duoi cho Xu/Kim Cuong: version <= 3 dung
 *   Math.max(coins, 1_000_000) nen moi lan hydrate la "mua" lai 1 trieu Xu.
 */
export function normalizeStoredState(raw: string, now = Date.now()): CityState {
  const parsed = JSON.parse(raw) as Partial<CityState>;
  const fresh = createInitialState();

  if (typeof parsed.version !== 'number') return fresh;
  if (parsed.version > STATE_VERSION) return fresh;

  /**
   * Chay MIGRATIONS theo thu tu bac: save v3 phai qua 3 -> 4 -> 5 -> moi den
   * 6. Ban <= 5 chi goi `MIGRATIONS[parsed.version]` MOT LAN, nen save v3 bo
   * qua hoan toan buoc 4 va 5 - `feverEverUsed` va `lastTalkAt` deu khong duoc
   * gan. Cac fallback o `normalizeStoredState` che lai loi nen test van xanh,
   * nhung moi bat buoc them field sau nay se lam save v3 hong.
   */
  let migrated: CityState = { ...fresh, ...parsed } as CityState;
  for (let v = parsed.version; v < STATE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) continue;
    migrated = step(migrated);
  }

  const merged: CityState = { ...fresh, ...migrated };
  merged.version = STATE_VERSION;
  {
    /*
     * Tách nhà thành phố (NPC) khỏi tài sản người chơi.
     *
     * Bản build trước đẩy thẳng 4 tòa NPC vào `state.buildings` - hậu quả:
     * tiền thụ động free, quest thưởng ngay khi vào game, bậc thành phố nhảy
     * trước khi người chơi làm gì. Gỡ ra khỏi `buildings` là toàn bộ logic
     * kinh tế/nhiệm vụ/bậc thành phố tự đúng lại theo mặc định.
     *
     * Vị trí đặt lại qua `ensureCityBuildings` vì ô ưa thích (hàng 1) có thể
     * đã bị tiệm của người chơi chiếm ở save cũ.
     */
    const base = Array.isArray(migrated.buildings) ? migrated.buildings : [];
    const storedCity = Array.isArray(migrated.cityBuildings) ? migrated.cityBuildings : [];
    merged.buildings = base.filter((b) => !isCityNode(b));
    merged.cityBuildings = ensureCityBuildings(
      merged.buildings,
      [...storedCity, ...base.filter((b) => isCityNode(b))],
      merged.unlockedCols ?? 4,
      merged.unlockedRows ?? 4,
      now,
    );
  }
  merged.npcs = Array.isArray(migrated.npcs) ? migrated.npcs : [];
  merged.activeRequests = Array.isArray(migrated.activeRequests) ? migrated.activeRequests : [];
  merged.unlockedManagers = Array.isArray(migrated.unlockedManagers) ? migrated.unlockedManagers : [];
  merged.claimedQuests = Array.isArray(migrated.claimedQuests) ? migrated.claimedQuests : [];
  merged.inventory =
    typeof migrated.inventory === 'object' &&
    migrated.inventory !== null &&
    Object.keys(migrated.inventory).length > 0
      ? { ...STARTER_INVENTORY, ...migrated.inventory }
      : { ...STARTER_INVENTORY };
  /*
   * Save cu co the con id Relic (vd 'relic-heo-vang') trong mang nay - giu
   * nguyen, vo hai: INVENTORY_BY_ID khong con muc nao nhu vay nen vong lap
   * tinh yield bonus se bo qua qua `if (!def) continue`. Chi doi gia tri
   * MAC DINH khi mang rong/thieu, truoc day la trang bi san mot Relic mien
   * phi, gio khong con Relic nao de trang bi nua.
   */
  merged.equippedRelics = Array.isArray(migrated.equippedRelics) ? migrated.equippedRelics : [];

  merged.coins = Number.isFinite(merged.coins) ? Math.max(0, merged.coins) : 0;
  merged.gems = Number.isFinite(merged.gems) ? Math.max(0, merged.gems) : 0;
  merged.mayorLevel = Number.isFinite(merged.mayorLevel)
    ? Math.min(MAX_MAYOR_LEVEL, Math.max(1, merged.mayorLevel))
    : 1;
  /**
   * Tran `mayorXp` theo `xpForLevel` CUA CAP HIEN TAI, khong phai theo hang so
   * phang quang danh. Ban <= 4 clamp vao `MAYOR_XP_PER_LEVEL - 1` = 199 trong
   * khi `xpForLevel(10)` = 3.400: người choi cap 10 tro ve cap 1 mat sach 401
   * XP MO LAN REFRESH. Dung `xpForLevel(mayorLevel) - 1` de giu nguyen du
   * so XP con duoc phep mang.
   */
  merged.mayorXp = Number.isFinite(merged.mayorXp)
    ? Math.min(xpForLevel(merged.mayorLevel) - 1, Math.max(0, merged.mayorXp))
    : 0;
  /* Ba dong khoan thu. Save cu khong tach duoc nen gan 0 phan chua biet. */
  merged.totalRevenue = nonNeg(merged.totalRevenue);
  merged.totalGrants = nonNeg(merged.totalGrants);
  merged.totalTapIncome = nonNeg(merged.totalTapIncome);
  merged.totalCoinsEarned = nonNeg(merged.totalCoinsEarned);
  /*
   * Transaction Engine. Save cũ không có trường này - về mảng rỗng thay vì
   * `undefined`: mỗi chỗ đọc đều phải nén một nhánh null thì sớm muộn cũng
   * có chỗ quên.
   */
  merged.shopQueues = Array.isArray(merged.shopQueues)
    ? merged.shopQueues
        .filter((q) => q && typeof q.shopId === 'string' && Array.isArray(q.arrivedAt))
        .map((q) => ({
          shopId: q.shopId,
          arrivedAt: q.arrivedAt.filter((t: unknown) => Number.isFinite(t)),
        }))
        .filter((q) => q.arrivedAt.length > 0)
    : [];
  merged.ordersLost = nonNeg(merged.ordersLost);
  merged.ordersClosed = nonNeg(merged.ordersClosed);
  merged.eventLog =
    migrated.eventLog && typeof migrated.eventLog.day === 'string'
      ? { day: migrated.eventLog.day, resolved: Math.max(0, migrated.eventLog.resolved ?? 0) }
      : { day: todayKey(now), resolved: 0 };
  /* Save cu khong co dailyLog/cityTierClaimed - lay mac dinh tu `fresh`. */
  merged.dailyLog =
    migrated.dailyLog && typeof migrated.dailyLog.day === 'string'
      ? {
          day: migrated.dailyLog.day,
          built: Math.max(0, migrated.dailyLog.built ?? 0),
          upgraded: Math.max(0, migrated.dailyLog.upgraded ?? 0),
          talked: Math.max(0, migrated.dailyLog.talked ?? 0),
          eventsResolved: Math.max(0, migrated.dailyLog.eventsResolved ?? 0),
          starEvolved: Math.max(0, migrated.dailyLog.starEvolved ?? 0),
          idleXp: Math.max(0, migrated.dailyLog.idleXp ?? 0),
          claimed: Array.isArray(migrated.dailyLog.claimed) ? migrated.dailyLog.claimed : [],
        }
      : emptyDailyLog(now);
  /*
   * Save cu khong co huong dan. Nguoi da choi tu truoc thi KHONG bat hoc lai:
   * co cong trinh roi tuc la da biet choi.
   */
  merged.tutorialStep = Number.isFinite(migrated.tutorialStep)
    ? migrated.tutorialStep
    : merged.buildings.length > 0
      ? -1
      : 0;
  merged.tutorialFlags = Array.isArray(migrated.tutorialFlags) ? migrated.tutorialFlags : [];

  /* Bảo toàn dữ liệu khi migrate, nhưng tính năng vay mới bị vô hiệu hóa trong gameplay. */
  merged.debt = nonNeg(migrated.debt);
  merged.loanDueDay = typeof migrated.loanDueDay === 'string' ? migrated.loanDueDay : '';
  merged.loanLateFeeCount = nonNeg(migrated.loanLateFeeCount);
  merged.totalInterestPaid = nonNeg(migrated.totalInterestPaid);
  merged.playerDebtPrincipal = nonNeg(migrated.playerDebtPrincipal ?? 200_000_000);
  merged.playerDebtPaid = nonNeg(migrated.playerDebtPaid ?? 0);
  merged.playerDebtNextDueDateStr = typeof migrated.playerDebtNextDueDateStr === 'string' && migrated.playerDebtNextDueDateStr
    ? migrated.playerDebtNextDueDateStr
    : futureDateKey(Date.now(), PLAYER_DEBT_INTERVAL_DAYS);
  merged.playerDebtMissed = nonNeg(migrated.playerDebtMissed ?? 0);
  const validEndings = ['survival', 'prosperity', 'empire', 'bankrupt'] as const;
  merged.gameEnding = validEndings.includes(migrated.gameEnding as typeof validEndings[number])
    ? (migrated.gameEnding as typeof validEndings[number])
    : null;
  merged.cityTierClaimed = Number.isFinite(migrated.cityTierClaimed)
    ? Math.max(1, Math.min(CITY_TIERS.length, migrated.cityTierClaimed))
    : 1;
  merged.tappedAt =
    migrated.tappedAt && typeof migrated.tappedAt === 'object' ? migrated.tappedAt : {};

  /**
   * Chuẩn hoá 3 sổ cái. Save V7 đã có sẵn, save cũ thì migration 6 tạo rỗng -
   * ở đây chỉ chặn trường hợp save hỏng tay có object thiếu chữ.
   */
  const day = todayKey(now);
  const month = monthKey(now);
  /**
   * Moi dong trong so cai la so duong. Save hong tay co gia tri am se lam
   * bao cao hien "loi nhuan am" o nhung dong van phai la chi phi - nguoi choi
   * nhin thay cong trinh sinh loi va doc sai hoan toan.
   */
  const normPeriod = (l: unknown): PeriodLedger => {
    const src = (l ?? {}) as Partial<PeriodLedger>;
    const out = emptyLedger();
    for (const key of Object.keys(out) as (keyof LedgerEntry)[]) {
      const v = src[key];
      out[key] = Number.isFinite(v) ? Math.max(0, v as number) : 0;
    }
    return { ...out, day: src.day ?? day, month: src.month ?? month };
  };
  merged.ledgerLifetime = normPeriod(merged.ledgerLifetime);
  merged.ledgerDay = normPeriod(merged.ledgerDay);
  merged.ledgerMonth = normPeriod(merged.ledgerMonth);
  // Sổ ngày/tháng phải trỏ đúng kỳ hiện tại, nếu lệch thì `rollPeriods` sẽ
  // tự xoá khi người chơi tick - nhưng sửa ở đây cho HUD đọc ngay.
  merged.ledgerDay.day = day;
  merged.ledgerMonth.month = month;
  /*
 * Chuan hoa `streak` trong MOT bieu thuc.
 *
 * Truoc day khoi tao o day dung mot object moi, nen moi field them vao sau
 * do (nhu `shields` cua phieu bao vui chuoi) se bi quang mat trong khi
 * `normalize` chay - chuoi goc ma nguoi choi vua phai cong phieu se mat phieu
 * ngay lan reload dau tien. Moi field phai them vao cung khoi tao.
 */
  merged.streak =
    migrated.streak && typeof migrated.streak.lastDay === 'string'
      ? {
          days: nonNeg(migrated.streak.days),
          lastDay: migrated.streak.lastDay,
          best: nonNeg(migrated.streak.best),
          shields: nonNeg(migrated.streak.shields),
        }
      : { days: 0, lastDay: '', best: 0, shields: 0 };
  merged.streakClaimed = nonNeg(merged.streakClaimed);
  /*
   * Chuan hoa `dailySnapshots`: giu toi da 7 ban ghi va bo cac ban ghi hong.
   *
   * Cac truong cua tung ban ghi deu la SO DUONG, nen cua ban gihong ma co
   * field con giong cau truc van duoc giu lai - mau doanh thu ve bang so sanh
   * thi bao loi hon la mat hanh dong.
   */
  if (Array.isArray(merged.dailySnapshots)) {
    const hopLe = merged.dailySnapshots.filter(
      (snap): snap is NonNullable<typeof snap> =>
        !!snap && typeof snap.day === 'string' && snap.day.length > 0,
    );
    merged.dailySnapshots = hopLe
      .slice(-DAILY_SNAPSHOT_KEEP)
      .map((snap) => ({
        day: snap.day,
        netIncome: nonNeg(snap.netIncome),
        revenue: nonNeg(snap.revenue),
        danSo: nonNeg(snap.danSo),
        soCongTrinh: nonNeg(snap.soCongTrinh),
        mayorLevel: nonNeg(snap.mayorLevel),
        cityTier: nonNeg(snap.cityTier),
        streak: nonNeg(snap.streak),
        eventsResolved: nonNeg(snap.eventsResolved),
        happiness: nonNeg(snap.happiness),
      }));
  } else {
    merged.dailySnapshots = [];
  }
  merged.feverUsedToday = nonNeg(merged.feverUsedToday);
  merged.feverDay = typeof merged.feverDay === 'string' ? merged.feverDay : '';
  merged.happinessBoost = Number.isFinite(merged.happinessBoost)
    ? Math.min(HAPPINESS_BOOST_CAP, Math.max(0, merged.happinessBoost))
    : 0;
  merged.lastEngagedAt = Number.isFinite(merged.lastEngagedAt) ? merged.lastEngagedAt : merged.lastEventAt;
  merged.feverEverUsed = merged.feverEverUsed === true || merged.feverUntil > 0;
  merged.lastTalkAt = Number.isFinite(merged.lastTalkAt) ? Math.max(0, merged.lastTalkAt) : 0;
  merged.trustScore = typeof migrated.trustScore === 'number' ? Math.max(300, Math.min(850, migrated.trustScore)) : 650;
  merged.workingCapital = typeof migrated.workingCapital === 'number' ? Math.max(0, migrated.workingCapital) : merged.coins;
  merged.personalWealth = typeof migrated.personalWealth === 'number' ? Math.max(0, migrated.personalWealth) : 0;
  merged.loanDueDay = typeof migrated.loanDueDay === 'string' ? migrated.loanDueDay : '';
  merged.loanLateFeeCount = typeof migrated.loanLateFeeCount === 'number' ? Math.max(0, migrated.loanLateFeeCount) : 0;
  merged.fraudBlockedCount = typeof migrated.fraudBlockedCount === 'number' ? Math.max(0, migrated.fraudBlockedCount) : 0;
  merged.fraudLossCoins = typeof migrated.fraudLossCoins === 'number' ? Math.max(0, migrated.fraudLossCoins) : 0;
  merged.tuiThanTaiBalance = typeof migrated.tuiThanTaiBalance === 'number' ? Math.max(0, migrated.tuiThanTaiBalance) : 0;
  merged.tuiThanTaiInterestEarned = typeof migrated.tuiThanTaiInterestEarned === 'number' ? Math.max(0, migrated.tuiThanTaiInterestEarned) : 0;
  merged.hasInsurance = typeof migrated.hasInsurance === 'boolean' ? migrated.hasInsurance : false;
  merged.insuranceClaimsPaid = typeof migrated.insuranceClaimsPaid === 'number' ? Math.max(0, migrated.insuranceClaimsPaid) : 0;
  merged.weather = (['SUNNY', 'RAIN', 'FLOOD', 'STORM'].includes(migrated.weather as string) ? migrated.weather : 'SUNNY') as WeatherType;
  merged.isFlooded = typeof migrated.isFlooded === 'boolean' ? migrated.isFlooded : merged.weather === 'FLOOD';
  merged.ap = typeof migrated.ap === 'number' ? Math.max(0, Math.min(50, migrated.ap)) : 50;
  merged.maxAp = 50;
  merged.lastApRegenMs = typeof migrated.lastApRegenMs === 'number' ? migrated.lastApRegenMs : now;
  merged.mayorPoints = typeof migrated.mayorPoints === 'number' ? Math.max(0, migrated.mayorPoints) : 100;
  merged.savingsBalance = typeof migrated.savingsBalance === 'number' ? Math.max(0, migrated.savingsBalance) : 0;
  merged.savingsTier = (['1D', '3D', '7D', 'NONE'].includes(migrated.savingsTier as string) ? migrated.savingsTier : 'NONE') as '1D' | '3D' | '7D' | 'NONE';
  merged.savingsStartedAt = typeof migrated.savingsStartedAt === 'number' ? migrated.savingsStartedAt : 0;
  merged.loanPrincipal = typeof migrated.loanPrincipal === 'number' ? Math.max(0, migrated.loanPrincipal) : 0;
  merged.loanStartedAt = typeof migrated.loanStartedAt === 'number' ? migrated.loanStartedAt : 0;
  merged.investedFundId = (['SAFE', 'BALANCED', 'AGGRESSIVE', 'NONE'].includes(migrated.investedFundId as string) ? migrated.investedFundId : 'NONE') as 'SAFE' | 'BALANCED' | 'AGGRESSIVE' | 'NONE';
  merged.investedAmount = typeof migrated.investedAmount === 'number' ? Math.max(0, migrated.investedAmount) : 0;
  merged.investedAt = typeof migrated.investedAt === 'number' ? migrated.investedAt : 0;
  merged.insuranceActiveUntilMs = typeof migrated.insuranceActiveUntilMs === 'number' ? migrated.insuranceActiveUntilMs : 0;
  merged.activeIncidents = Array.isArray(migrated.activeIncidents) ? migrated.activeIncidents : [];
  merged.fixedIncidents = Array.isArray(migrated.fixedIncidents) ? migrated.fixedIncidents : [];

  const elapsed = now - (Number.isFinite(merged.lastSeenAt) ? merged.lastSeenAt : now);
  if (elapsed >= OFFLINE_MIN_MS) {
    const capped = Math.min(elapsed, OFFLINE_CAP_MS);
    /**
     * KHONG truyen `idleMs` khi tinh thuong offline.
     *
     * `idleMs` la moc dem cua suy giam hanh phuc (`HAPPINESS_DECAY_GRACE_MS`).
     * Ban <= 7 truyen `now - lastEngagedAt` nen nguoi choi dong tab 8 tieng quay
     * lai nhan tien TINH TREN hanh phuc da bi tru toi da - con nguoi choi
     * quay lai moi gio thi nhan duoc nhieu hon 11%. Do la phat nguoc retention
     * loop: game thuong cho su co mat va phat cho su van hoi.
     *
     * Thanh pho khong bi phat vi nguoi choi di ngoaii gio. Suy giam hanh phuc
     * van ap dung khi game chay (`tickIdle`), nen khi mo len lai thi pho bi
     * thay doi ngay - dung nghhia, va khong chan viec quay lai.
     */
    // `idleMs: 0` - xem `txCtxFor`. Thưởng AFK không được phụ thuộc
    // lần tương tác gần nhất.
    const ctx = txCtxFor(merged, now, 0);
    // Bỏ `now` vì `simulateOfflineBatch` tự gắn `now: 0` cho từng đơn;
    // còn `supplyFactor`/`earnMult` PHẢI giữ - thiếu chúng thì phần thưởng
    // AFK lệch với phần thưởng khi chơi (cung-cầu và cổ vật bị bỏ sót).
    const { now: _now, ...offlineCtx } = ctx;
    const offlineTxns = simulateOfflineBatch(merged.buildings, offlineCtx, capped);

    const sum = sumTransactions(offlineTxns);
    /*
     * Lãi tiết kiệm chạy cả khi vắng mặt - nó là lãi trên số dư, không cần
     * ai có mặt. Không cộng vào đây thì `tram-tui-than-tai` đùng đùng sinh
     * lãi khi mở tab nhưng modal lại không hiện.
     */
    const savingsGross = savingsInterestPerSecond(merged.buildings, merged.coins) * (capped / 1000);
    const { opexRate } = blendedRates(merged.buildings);
    const savingsOpex = savingsGross * opexRate;
    const savingsTax = Math.max(0, savingsGross - savingsOpex) * CORPORATE_TAX_RATE;

    /*
     * Thu nhập thụ động (ngoài COMMERCIAL) cũng chạy khi vắng mặt - cùng lý
     * do với lãi tiết kiệm ở trên. Xem khối "THU NHẬP THỤ ĐỘNG" trong
     * `tickIdle` để biết vì sao nhóm này không qua hàng chờ.
     */
    const passiveNodesOffline = merged.buildings.filter((b) => {
      const def = BUILDING_BY_ID[b.defId];
      if (!def || def.zone === 'COMMERCIAL') return false;
      return b.defId !== 'tram-tui-than-tai' && b.defId !== 'ngan-hang-so';
    });
    const passiveStreetOffline = streetNodes(merged);
    const passiveRateOffline = passiveNodesOffline.reduce(
      (s, b) => s + nodeYieldBreakdown(b, passiveStreetOffline).totalPerSec,
      0,
    );
    const passiveGrossOffline = passiveRateOffline * (capped / 1000);
    const { opexRate: passiveOpexRateOffline } = blendedRates(passiveNodesOffline);
    const passiveOpexOffline = passiveGrossOffline * passiveOpexRateOffline;
    const passiveTaxOffline = Math.max(0, passiveGrossOffline - passiveOpexOffline) * CORPORATE_TAX_RATE;

    const gross = sum.grossRevenue + savingsGross + passiveGrossOffline;
    const cogs = sum.cogs;
    const opex = sum.opex + savingsOpex + passiveOpexOffline;
    const tax = sum.tax + savingsTax + passiveTaxOffline;

    /**
     * Trần thưởng AFK (500.000 Xu) - trước đây cắt im lặng `earned` trong khi
     * modal vẫn khoe đầy đủ 8 giờ.
     *
     * PHẢI scale cả 4 dòng chứ không cắt riêng `net`: nếu để `gross` nguyên
     * mà `net` bị cắt thì ví vào bao nhiêu, sổ cái tự trừ ra bấy nhiêu, và
     * "ngân khố = lãi ròng sổ cái" - cam kết cốt lõi của lần sửa này - hỏng
     * đúng ở chỗ thử nghiệm đầu tiên người chơi gặp.
     */
    const rawNet = Math.max(0, gross - cogs - opex - tax);
    const k = rawNet > OFFLINE_COIN_CAP ? OFFLINE_COIN_CAP / rawNet : 1;
    const net = rawNet * k;
    merged.pendingOffline = {
      coins: net,
      elapsedMs: capped,
      orders: offlineTxns.length,
      gross: gross * k,
      cogs: cogs * k,
      opex: opex * k,
      tax: tax * k,
      // `elapsed` là thời gian THẬT trước khi cắt. Tự suy từ `capped` thì
      // luôn ra false và cảnh báo mất hẳn khỏi modal.
      capped: elapsed > OFFLINE_CAP_MS,
    };
  } else {
    merged.pendingOffline = null;
  }

  merged.lastSeenAt = now;
  /*
   * Vao lai phai ton trong `EVENT_INTERVAL_MS` (6 phut). Truoc day chi kiem
   * so su kien trong ngay nen moi lan reload deu spawn su kien moi - nguoi
   * choi quet cu de farm Chuyen Pho nhu vong lap tranh.
   *
   * Doc tu `parsed` (save goc) chu khong tu `merged`: save cu khong co truong
   * `lastEventAt` nen `merged` lay gia tri tu `createInitialState()` = "vua
   * xong" va se chan luon su kien dau tien cua nguoi choi moi.
   */
  const lanCu = typeof parsed.lastEventAt === 'number' ? parsed.lastEventAt : null;
  const quaHanEvent = lanCu === null || now - lanCu >= EVENT_INTERVAL_MS;
  if (!merged.pendingEvent && quaHanEvent && resolvedEventsToday(merged, now) < MAX_EVENTS_PER_DAY) {
    /*
     * Quay vong theo thoi gian thay vi `Math.random()`.
     *
     * Người chơi hay reload game khi vừa vào. Random ở đây nghĩa là mỗi lần
     * reload một sự kiện, và người chơi chỉ cần reload cho tới khi gặp sự kiện
     * dễ thì giải, còn lại thì đóng app luôn.
     */
    const eligible = eligibleCityEvents(merged);
    if (eligible.length > 0) {
      const script = eligible[Math.floor(now / EVENT_INTERVAL_MS) % eligible.length];
      merged.pendingEvent = { id: `${script.id}_${now.toString(36)}`, scriptId: script.id, createdAt: now };
      merged.lastEventAt = now;
    }
  }

  return merged;
}

/**
 * Nap thanh pho cua mot tai khoan.
 *
 * - Lan dau: doc save rieng cua `playerId`.
 * - Doi tai khoan tren cung may: doc lai save cua tai khoan moi thay vi
 *   giu nguyen thanh pho dang`hydrated` roi.
 */
export function hydrateCity(playerId?: string | null): void {
  if (typeof window === 'undefined') return;

  const pid = playerId ?? null;
  if (hydrated && pid === boundPlayerId) return;
  hydrated = true;
  boundPlayerId = pid;

  // Gate UI trong luc nap: `state` luc nay van la thanh pho moi.
  cityHydrated = false;
  /*
   * Bo tich lugy khach o module la toan cuc theo shopId. Doi save = doi
   * so tiem, nhung neu tiem trung ten thi phan le con lai tu phien truoc
   * se dua khach vao hang cua phien moi truoc khi tick chay.
   */
  resetArrivalAccumulator();
  try {
    const raw = localStorage.getItem(storageKeyFor(pid));
    const next = raw ? normalizeStoredState(raw) : createInitialState();
    // Gan truoc `setState` de chi phat mot lan `emit`, va listener luon thay
    // `cityHydrated = true` kem theo state da dung.
    cityHydrated = true;
    setState(next);
  } catch {
    cityHydrated = true;
    setState(createInitialState());
  }
}

/** Tai khoan dang mo khoa duoc gan save. `null` neu chua bind. */
export function boundPlayer(): string | null {
  return boundPlayerId;
}

/**
 * Nhận lô giao dịch AFK.
 *
 * Đi qua `recordTransactions` như mọi lần bán hàng khác, gộp lô thành một
 * Transaction - cùng một đường code với khi bấm đơn. Nếu tách riêng thì
 * ví và sổ cái sẽ có hai cách tính, và đó chính là lỗi P&L đang sửa.
 */
export function claimOffline(): void {
  if (!state.pendingOffline) return;
  const po = state.pendingOffline;
  const net = Number.isFinite(po.coins) ? Math.max(0, po.coins) : 0;
  const cleared: CityState = {
    ...state,
    pendingOffline: null,
    lastSeenAt: Date.now(),
  };
  if (net <= 0) {
    setState(cleared);
    return;
  }
  setState(
    recordTransactions(cleared, [
      {
        id: `offline-${po.elapsedMs}`,
        at: cleared.lastSeenAt,
        shopId: '__offline__',
        // Save cũ chỉ có `coins`; bốn dòng không có thì net tức là gross.
        gross: Number.isFinite(po.gross) ? (po.gross as number) : net,
        cogs: po.cogs ?? 0,
        opex: po.opex ?? 0,
        tax: po.tax ?? 0,
        net,
        digital: false,
      },
    ]),
  );
}

/**
 * Bỏ qua lô AFK: tiền không vào ví, và các đơn đó được đếm là đơn mất.
 *
 * Trước đây đây là hành động âm thầm "mất 8 giờ doanh thu". Giờ nó xuất hiện
 * trong `ordersLost` để người chơi nhìn thấy hệ quả.
 */
export function dismissOffline(): void {
  if (!state.pendingOffline) return;
  const lost = state.pendingOffline.orders ?? 0;
  setState({
    ...state,
    pendingOffline: null,
    lastSeenAt: Date.now(),
    ordersLost: (state.ordersLost ?? 0) + lost,
  });
}

export const RENAME_COST_GEMS = 5;

/** Trả một phần nợ gốc cá nhân. Trả lỗi nếu không đủ tiền hoặc nợ đã hết. */
export function payPlayerDebt(amount: number): 'ok' | 'insufficient_funds' | 'no_debt' {
  const remaining = Math.max(0, state.playerDebtPrincipal - state.playerDebtPaid);
  if (remaining <= 0) return 'no_debt';
  if (state.coins < amount) return 'insufficient_funds';
  const pay = Math.min(amount, remaining);
  setState({
    ...state,
    coins: Math.max(0, state.coins - pay),
    playerDebtPaid: state.playerDebtPaid + pay,
    playerDebtMissed: 0,
  });
  return 'ok';
}

export function renameCityAndMayor(mayorName: string, cityName: string, mayorGender?: import('./types').MayorGender): 'ok' | 'funds' {
  const cleanMayor = mayorName.trim() || state.mayorName || 'Người Lập Nghiệp';
  const cleanCity = cityName.trim() || state.cityName || 'Đô Thị MoCity';
  if (state.hasNamedCity && (cleanMayor !== state.mayorName || cleanCity !== state.cityName)) {
    if (state.gems < RENAME_COST_GEMS) return 'funds';
    setState({ ...state, mayorName: cleanMayor, cityName: cleanCity, gems: state.gems - RENAME_COST_GEMS });
    return 'ok';
  }
  setState({ ...state, mayorName: cleanMayor, cityName: cleanCity, hasNamedCity: true, ...(mayorGender ? { mayorGender } : {}) });
  return 'ok';
}

/** So su kien da giai quyet hom nay. Tu reset sang 0 khi sang ngay moi. */
function resolvedEventsToday(s: CityState, now = Date.now()): number {
  return s.eventLog?.day === todayKey(now) ? s.eventLog.resolved : 0;
}

/** Ghi nhan 1 su kien da xu ly, tu xoay vong dem neu sang ngay moi. */
function bumpResolvedEvents(s: CityState, now = Date.now()): Pick<CityState, 'eventLog'> {
  const today = todayKey(now);
  return {
    eventLog:
      s.eventLog?.day === today
        ? { day: today, resolved: s.eventLog.resolved + 1 }
        : { day: today, resolved: 1 },
  };
}

export function completeMayorLogin(mayorName: string, cityName: string, bonusCoins = 10_000_000, mayorGender?: import('./types').MayorGender): number {
  const cleanMayor = mayorName.trim() || state.mayorName || 'Người Lập Nghiệp';
  const cleanCity = cityName.trim() || state.cityName || 'Đô Thị MoCity';
  const offlineReward = state.pendingOffline && Number.isFinite(state.pendingOffline.coins)
    ? Math.max(0, state.pendingOffline.coins)
    : 0;
  /**
   * Thuong dang nhap chi tra mot lan. Truoc day moi lan bam "Nhan that truong"
   * la +50.000 Xu nen chi can F5 la lam dau lai.
   */
  const isFirstRun = !state.hasNamedCity;
  const loginBonus = (isFirstRun ? Math.max(0, bonusCoins) : 0) + offlineReward;
  const baseCoins = Number.isFinite(state.coins) ? Math.max(0, state.coins) : 0;
  const baseState: CityState = {
    ...state,
    mayorName: cleanMayor,
    cityName: cleanCity,
    hasNamedCity: true,
    ...(mayorGender ? { mayorGender } : {}),
    pendingOffline: null,
    lastSeenAt: Date.now(),
    coins: baseCoins + loginBonus,
    gems: Number.isFinite(state.gems) ? Math.max(0, state.gems) : 0,
    totalCoinsEarned:
      (Number.isFinite(state.totalCoinsEarned) ? Math.max(0, state.totalCoinsEarned) : 0) + loginBonus,
    // Thuong nham chuc + phan thuong offline la GRANT, khong phai doanh thu.
    totalGrants:
      (Number.isFinite(state.totalGrants) ? Math.max(0, state.totalGrants) : 0) +
      (isFirstRun ? Math.max(0, bonusCoins) : 0),
    totalRevenue:
      (Number.isFinite(state.totalRevenue) ? Math.max(0, state.totalRevenue) : 0) + offlineReward,
  };
  setState(baseState);
  // Dang nhap la "mo game" - ghi nhan vao chuoi ngay choi lien tiep.
  registerStreak();
  return loginBonus;
}

/**
 * Tick AFK 1 lan/giay: cong Xu theo doanh thu Cua Hang + Phi ha tang + Lai kep Tui Than Tai.
 */
/**
 * Cong mot khoan vao MOT dong cua so cai. Khong dung khi dong = 0 (thuong
 * bac, xay moi) va khong cho phep am (dong la so duong).
 */
function addToLedger(ledger: PeriodLedger, key: keyof LedgerEntry, amount: number): PeriodLedger {
  if (!Number.isFinite(amount) || amount === 0) return ledger;
  const cur = (ledger[key] as number) ?? 0;
  return { ...ledger, [key]: Math.max(0, cur + amount) };
}

/**
 * Reset so cai theo ky khi qua ngay / thang moi, giu nguyen so vi vien.
 *
 * Khong dung `useEffect`: `tickIdle` chay moi giay nen so ngay phai dung moc
 * thoi gian thuc te chu khong phai thoi diem render.
 */
function rollPeriods(s: CityState, now: number): CityState {
  const day = todayKey(now);
  const month = monthKey(now);
  let next = s;
  if (s.ledgerDay?.day !== day) {
    /*
     * GHI SO LUC NGAY CU DONG LAI truoc khi xoa so cai ngay.
     *
     * Thu tu bat buoc: phai chup `ledgerDay` TRUOC, boi vi dong tiep theo thay
     * no bang so rong ngay moi. Ghi sau se luon ghi nhung con so rong.
     */
    next = withDailySnapshot(next);
    next = { ...next, ledgerDay: emptyPeriodLedger(day, month) };
  }
  if (s.ledgerMonth?.month !== month) {
    next = { ...next, ledgerMonth: emptyPeriodLedger(day, month) };
  }
  return next;
}

/**
 * Chup so lieu cua ngay dang ket thuc vao chuoi snapshot 7 ngay.
 *
 * Khong dung lai `s` ma dung `next`: `rollPeriods` co the da them bien khac
 * truoc khi goi ham nay, va ban ghi phai phan anh trang thai tai thoi diem
 * ngay do dong.
 *
 * Mot ngay co the bi ghi lai nhieu lan (tickIdle chay moi giay, va`rollPeriods`
 * chay o moi tick) nen phai chong ghi trung cung mot `day`.
 */
function withDailySnapshot(s: CityState): CityState {
  const dayKey = s.ledgerDay?.day ?? '';
  if (!dayKey) return s;

  const cu = s.dailySnapshots ?? [];
  if (cu.some((snap) => snap.day === dayKey)) return s;

  const danSo = populationFor(s.buildings);
  const hangPho = cityTierFor(danSo, s.buildings.length);

  const snap: DailySnapshot = {
    day: dayKey,
    netIncome: s.ledgerDay?.netIncome ?? 0,
    revenue: s.ledgerDay?.grossRevenue ?? 0,
    danSo,
    soCongTrinh: s.buildings.length,
    mayorLevel: s.mayorLevel,
    cityTier: hangPho.rank,
    streak: s.streak?.days ?? 0,
    eventsResolved: s.eventLog?.resolved ?? 0,
    happiness: Math.round(
      happinessFor(s.buildings, 0, s.happinessBoost ?? 0),
    ),
  };

  return { ...s, dailySnapshots: [...cu, snap].slice(-DAILY_SNAPSHOT_KEEP) };
}

/** Ngay hom qua theo lich dia phuong, dung de xet chuoi co lien tuc khong. */
function yesterdayKey(ts: number): string {
  const d = new Date(ts);
  d.setDate(d.getDate() - 1);
  return todayKey(d.getTime());
}

/** Hom kia. Dung de phan biet "bo mot ngay" voi "bo nhieu ngay". */
function twoDaysAgoKey(ts: number): string {
  const d = new Date(ts);
  d.setDate(d.getDate() - 2);
  return todayKey(d.getTime());
}

/** So phieu bao vui chuoi toi da cho phep. */
export const STREAK_SHIELD_MAX = 3;

/** Ngay chuoi bat dau duoc nhan phieu bao vui. */
export const STREAK_SHIELD_DAY = 7;

/**
 * Phieu bao vui chuoi: quyet dinh chuoi co bi dung hay khong.
 *
 * Khong dung `Math.random()` va khong hoi nguoi choi. Nguoi choi khong the
 * kiem chung bang mat mot nhan bam co bao nhieu, nen phai quy tac xac dinh.
 *
 * Quy tac: chi dung khi bo qua DUNG MOT ngay. Bo qua nhieu ngay la quyet
 * dinh roi lo, khong duoc phieu giu - neu dung thi phieu se thanh vat leo
 * va khong ai buoc cham khi vang.
 *
 * @return `true` neu phai dung phieu de giu chuoi.
 */
function shouldConsumeShield(cur: StreakState, now: number): boolean {
  if ((cur.shields ?? 0) <= 0) return false;
  if (cur.days <= 0) return false;
  // Ngay choi gan nhat la hom qua -> chuoi con lien tuc, khong ngat.
  if (cur.lastDay === yesterdayKey(now)) return false;
  // Ngay choi gan nhat la hom kia -> bo DUNG MOT ngay -> dung phieu.
  return cur.lastDay === twoDaysAgoKey(now);
}

/**
 * Tang chuoi ngay choi lien tiep.
 *
 * Chi dem MOT LAN moi ngay. Va ngay hom qua thi `days + 1`; va ngay khac
 * (nguoi choi bo qua mot ngay) thi reset ve 1 - dung nghhia "chuoi bi ngat",
 * khong phai "con so dem nguoc".
 *
 * @return `days` la chuoi moi, `usedShield` la co dung phieu hay khong.
 */
export function registerStreak(): { days: number; usedShield: boolean } {
  const now = Date.now();
  const today = todayKey(now);
  const cur: StreakState = state.streak ?? { days: 0, lastDay: '', best: 0 };
  if (cur.lastDay === today) return { days: 0, usedShield: false };

  const tiepTuc = cur.lastDay === yesterdayKey(now);
  const usedShield = !tiepTuc && shouldConsumeShield(cur, now);
  const shields = cur.shields ?? 0;

  const days = tiepTuc || usedShield ? cur.days + 1 : 1;
  const next: StreakState = {
    days,
    lastDay: today,
    best: Math.max(cur.best, days),
    shields: usedShield ? shields - 1 : shields,
  };
  setState({ ...state, streak: next });
  return { days, usedShield };
}

/**
 * Tra phieu bao vui chuoi theo moc da cham.
 *
 * Moc 7 ngay cho 1, moi 14 ngay them 1, toi da 3. Thiet ke cua: nguoi choi
 * chi dung phieu khi CHAINH xay ra, tuc la nguoi choi da chay duoc vai ngay
 * lien tiep. Cho phieu tu ngay 1 thi tro thanh va muc 7 ngay khong con gi la.
 *
 * @return So phieu vua nhan, 0 neu khong du dieu kien.
 */
export function grantShieldForStreak(days: number): number {
  const cur = state.streak ?? { days: 0, lastDay: '', best: 0 };
  const shields = cur.shields ?? 0;
  if (days < STREAK_SHIELD_DAY) return 0;
  if (days !== STREAK_SHIELD_DAY && days % 14 !== 0) return 0;
  if (shields >= STREAK_SHIELD_MAX) return 0;
  setState({ ...state, streak: { ...cur, shields: shields + 1 } });
  return 1;
}

/**
 * Nhan thuong cho cac moc chuoi da cham nhung chua nhan.
 *
 * Vong lap tu moi moc len: chuoi 40 ngay cham 3/7/14/30/60 thi trao ca 4 moc
 * mot luot. Tra ve danh sach de UI bao tung moc.
 */
export function claimStreakMilestones() {
  const days = currentStreak();
  if (days === 0) return [];
  const claimed = state.streakClaimed ?? 0;
  const earned = STREAK_MILESTONES.filter((m) => m.days <= days && m.days > claimed);
  if (earned.length === 0) return [];

  let next = withCoins(state, earned.reduce((sum, m) => sum + m.rewardCoins, 0), 'GRANT');
  next = {
    ...next,
    gems: next.gems + earned.reduce((sum, m) => sum + m.rewardGems, 0),
    streakClaimed: Math.max(claimed, ...earned.map((m) => m.days)),
  };
  Object.assign(next, addMayorXp(next, earned.reduce((sum, m) => sum + m.rewardXp, 0)));
  setState(next);
  /*
   * Tra phieu bao vui cho tung moc vua cham.
   *
   * Gọi SAU `setState` vi `grantShieldForStreak` đọc `state.streak` từ module
   * và tự ghi state. Nhờ vậy hai lần `setState` không tranh nhau.
   */
  for (const m of earned) grantShieldForStreak(m.days);
  return earned;
}

/** So ngay chuoi hien tai. 0 neu chua choi ngay hom nay. */
export function currentStreak(): number {
  const cur = state.streak;
  if (!cur) return 0;
  const today = todayKey(Date.now());
  return cur.lastDay === today ? cur.days : 0;
}

/**
 * Chuoi da vong nhung chua gap - dung cho modal "quay lai" de canh bao
 * "Chuoi 12 ngay cua ban bi ngat, bat dau lai tu hom nay".
 */
export function streakAtRisk(): number {
  const cur = state.streak;
  if (!cur || cur.days === 0) return 0;
  return cur.lastDay === yesterdayKey(Date.now()) ? cur.days : 0;
}

/** Ghi mot ky hanh dong len ca 3 so cai (vĩnh viễn / ngày / tháng). */
function postLedger(s: CityState, delta: Partial<LedgerEntry>): CityState {
  const keys = Object.keys(delta) as (keyof LedgerEntry)[];
  if (keys.length === 0) return s;
  const apply = (l: PeriodLedger): PeriodLedger => {
    let out = l;
    for (const k of keys) out = addToLedger(out, k, delta[k] ?? 0);
    return out;
  };
  return {
    ...s,
    ledgerLifetime: apply(s.ledgerLifetime),
    ledgerDay: apply(s.ledgerDay),
    ledgerMonth: apply(s.ledgerMonth),
  };
}

/**
 * Chốt một lô giao dịch thành biến động ngân khố + sổ cái.
 *
 * Đây là ĐIỂM DUY NHẤT tiền vào ví từ việc bán hàng. Trước đây là
 * `withCoins(flow.revenue * seconds)` - tiền tự sinh theo thời gian.
 *
 * Vòng tiền 1 lô gồm 4 bước kế toán:
 *   1. khách trả GROSS
 *   2. trả NCC (COGS)
 *   3. trả tiền nhà (OPEX)
 *   4. nộp thuế
 *
 * Sổ cái ghi cả 4 dòng riêng biệt, P&L tự trừ ra từ đó. Ví nhận đúng phần
 * net cuối cùng - không còn "con số suy ra từ tỷ lệ".
 *
 * XP tính trên LỢI NHUẬN RÒNG chứ không phải gross: nếu tính trên gross thì
 * nhịp lên cấp sẽ nhanh gấp ~4 lần và phá mốc 5-7 ngày lên cấp 50.
 */
function recordTransactions(s: CityState, txns: Transaction[]): CityState {
  if (txns.length === 0) return s;
  const sum = sumTransactions(txns);

  let next: CityState = { ...s };
  const cur = (n: unknown) => (Number.isFinite(n) ? Math.max(0, n as number) : 0);

  /*
   * 4 bước kế toán của một lô:
   *   +gross  (khách trả)   -cogs (NCC)   -opex (mặt bằng)   -thuế
   *
   * Cộng dồn một lần từ `net` chứ không trừ lần lượt từng dòng: nếu trừ
   * lần lượt thì giữa chừng có thể chạm đáy 0, khi đó ví ghi tăng ít hơn
   * con số mà P&L tự trừ ra từ các dòng - đúng loại lệch "báo cáo không
   * bao giờ cộng bằng" mà lần sửa này đang nhắm tới.
   *
   * `net` luôn dương (cogs+opex < 100%, thuế chỉ đánh phần lợi nhuận), nên
   * đây không phải cách che mất chi phí - chỉ là cộng kết quả cuối cùng.
   */
  const net = sum.grossRevenue - sum.cogs - sum.opex - sum.tax;
  next.coins = Math.max(0, cur(next.coins) + net);

  // Thống kê tích lũy. `totalRevenue` giữ NGHĨA lợi nhuận (nhãn trên thẻ
  // chia sẻ là "Lợi nhuận ròng tích lũy") nên cộng phần net.
  next.totalRevenue = cur(next.totalRevenue) + net;
  next.totalCoinsEarned = cur(next.totalCoinsEarned) + net;
  next.totalVolume = cur(next.totalVolume) + sum.grossRevenue;
  next.ordersClosed = cur(next.ordersClosed) + txns.length;

  // Sổ cái: 4 dòng P&L tách bạch.
  next = postLedger(next, {
    grossRevenue: sum.grossRevenue,
    cogs: sum.cogs,
    opex: sum.opex,
    tax: sum.tax,
    netIncome: net,
  });

  // XP theo lợi nhuận ròng, cùng công thức nhàn rỗi (chia 60, cap ngày).
  return accrueOperatingXp(next, net);
}

/**
 * Cộng XP Thị Trưởng từ dòng OPERATING.
 *
 * Tách khỏi `withCoins` để giao dịch dùng được riêng: trước đây hàm này gắn
 * cứng với `flow === 'OPERATING'` và tính trên delta vào ví, mà giờ delta vào
 * ví là GROSS nên sẽ cho XP gấp 4 lần nếu không tách.
 */
function accrueOperatingXp(s: CityState, amount: number): CityState {
  if (!(amount > 0)) return s;
  const now = Date.now();
  const log = s.dailyLog?.day === todayKey(now) ? s.dailyLog : emptyDailyLog(now);
  const conLai = Math.max(0, IDLE_XP_DAILY_CAP - (log.idleXp ?? 0));
  const them = Math.min(IDLE_XP_CAP, amount / IDLE_XP_DIVISOR, conLai);
  if (them <= 0) return s;
  const next = { ...s };
  Object.assign(next, addMayorXp(next, them));
  next.dailyLog = { ...log, idleXp: (log.idleXp ?? 0) + them };
  return next;
}

/**
 * Tach mot lan: cong doanh thu thi truong vao ngan khoc.
 *
 * `opts.relicBonus` phai duoc truyen vao day (xem `FlowOptions`) - nguoc lai
 * HUD hien mot con so ma ngan khoc khong nhan.
 */
/**
 * Tinh ket thuc game tu trang thai hien tai. `null` = chua ket thuc.
 *
 * Thu tu quyet dinh:
 * 1. Tra het no goc 200 trieu -> win, quy mo theo dong tien thang cua cong trinh.
 * 2. Tre du `PLAYER_DEBT_MISSED_LIMIT` ky lai -> `bankrupt`.
 *
 * Test: `lib/mocity/ending.test.ts`
 */
export function endingForState(
  s: Pick<CityState, 'buildings' | 'playerDebtPrincipal' | 'playerDebtPaid' | 'playerDebtMissed'>,
): GameEnding | null {
  const remaining = Math.max(0, s.playerDebtPrincipal - s.playerDebtPaid);
  if (remaining === 0) {
    /*
     * NGUONG DA DO LAI THEO KINH TE THUC TE (don vi: dong/thang).
     *
     * Nguong cu 50 trieu / 100 trieu thua xa quy mo that: mot quan caphe cap 1
     * da cho ~155 ty/thang (baseYieldPerSec 60.000 x 2.592.000 giay), nen
     * nguoi choi co 1 cay la tu dong nhan 'prosperity', co 10 cay la 'empire'
     * - ca 3 ket thuc tro thanh ham cua SO CONG TRINH, khong con do quy mo.
     *
     * Moi chot doi chieu voi do thuc:
     * - 2 tiem cap 1  ~ 311 ty/thang  -> van la 'survival' (tra du no nhung
     *   co cau con nho, dung voi cau chuyen "khong du nhieu").
     * - 6 tiem cap 10 ~ 17.800 ty/thang -> 'prosperity'.
     * - 10+ tiem, moi cay lon hon 5.000 ty -> 'empire'.
     */
    const monthlyFlow = s.buildings.reduce((sum, b) => {
      const def = BUILDING_BY_ID[b.defId];
      return sum + (def?.baseYieldPerSec ?? 0) * b.level * 30 * 86_400;
    }, 0);
    const PROSPERITY_MONTHLY_FLOW = 500_000_000_000;
    const EMPIRE_MONTHLY_FLOW = 50_000_000_000_000;
    if (s.buildings.length >= 10 && monthlyFlow >= EMPIRE_MONTHLY_FLOW) return 'empire';
    if (monthlyFlow >= PROSPERITY_MONTHLY_FLOW) return 'prosperity';
    return 'survival';
  }
  if ((s.playerDebtMissed ?? 0) >= PLAYER_DEBT_MISSED_LIMIT) return 'bankrupt';
  return null;
}

export function tickIdle(): void {
  const now = Date.now();
  const elapsed = now - state.lastSeenAt;
  if (elapsed <= 0) return;

  /** Reset so cai theo ngay/thang truoc khi ghi ky moi. */
  const rolled = rollPeriods(state, now);

  const seconds = elapsed / 1000;

  let relicYieldBonus = 0;
  let relicHappyBonus = 0;
  for (const rId of state.equippedRelics ?? []) {
    const def = INVENTORY_BY_ID[rId];
    if (!def) continue;
    relicYieldBonus += def.passiveYieldBonus ?? 0;
    relicHappyBonus += def.passiveHappinessBonus ?? 0;
  }

  const flow = flowFor(state.buildings, state.npcs, state.mayorLevel, state.coins, {
    idleMs: now - state.lastEngagedAt,
    happinessBoost: state.happinessBoost,
    relicBonus: relicYieldBonus,
    relicHappinessBonus: relicHappyBonus,
    debt: state.debt ?? 0,
    shopQueue: realShopQueueCounts(state.shopQueues ?? []),
    street: streetNodes(state),
  });

  let next: CityState = {
    ...rolled,
    lastSeenAt: now,
    // Field legacy: giu gia tri da migration duoc, khong con cach nao bat.
    feverEverUsed: rolled.feverEverUsed,
  };

  /*
   * ⚠ NGUỒN TIỀN ĐÃ ĐỔI.
   *
   * TRƯỚC: `withCoins(flow.revenue * seconds)` - tiền tự sinh theo thời gian.
   * GIỜ: tickIdle KHÔNG cộng đồng Xu nào từ việc bán hàng. Nó chỉ:
   *   (a) đón khách mới vào hàng chờ  (autonomous)
   *   (b) cho khách quá hạn bỏ đi      (autonomous)
   * Tiền chỉ vào ví khi NGƯỜI CHƠI bấm đóng đơn -> `recordTransactions`.
   *
   * `flowFor` vẫn được gọi nhưng giờ là DỰ BÁN: nó nuôi lãi vay, nợ xấu,
   * điều kiện spawn sự kiện và con số "tiềm năng" trên HUD.
   */
  const arrived = settleArrivals(next.buildings, next.shopQueues ?? [], { now, street: streetNodes(next) }, elapsed);
  const expired = expireQueues(next.buildings, arrived.queues, { now });
  next = {
    ...next,
    shopQueues: expired.queues,
    ordersLost: (next.ordersLost ?? 0) + arrived.lost + expired.lost,
  };

  /*
   * TỰ PHỤC VỤ - không còn nút bấm tay nào khác biến khách chờ thành tiền.
   * Chủ quán một mình thì chậm (14s/đơn); mỗi Nhân Viên thuê thêm rút ngắn
   * khoảng cách. Chạy mỗi tick (mỗi giây) nên hoạt động cả khi đang chơi lẫn
   * khi tab ở nền - chỉ tắt hẳn lúc đóng tab, lúc đó đã có
   * `simulateOfflineBatch` lo riêng.
   */
  const autoServed = autoServeQueues(
    next.buildings,
    next.shopQueues ?? [],
    txCtxFor(next, now),
    (next.ordersClosed ?? 0) + 1,
  );
  next = { ...next, buildings: autoServed.buildings, shopQueues: autoServed.queues };
  if (autoServed.txns.length > 0) {
    next = recordTransactions(next, autoServed.txns);
  }

  /*
   * LÃI TIẾT KIỂM TỪ CÔNG TRÌNH - dòng thu thụ động duy nhất còn lại.
   *
   * `tram-tui-than-tai` và `ngan-hang-so` không có khách hàng nào đến chờ:
   * tiền lãi sinh ra từ số dư, không sinh ra từ một đơn hàng. Ép nó vào hàng
   * chờ thì vừa vô nghĩa về mô tả, vừa khiến `orderValueFor` phụ thuộc số dư
   * đang đổi theo từng tick.
   *
   * Nhưng nếu bỏ qua là mất thật: `flowFor` vẫn tính `savingsYield` vào doanh
   * thu, nên để ví không cộng mà P&L vẫn báo là tự tạo ra đúng lỗi sổ cái đang
   * sửa. Ghi đủ 3 dòng: gross, chi phí bình quân, thuế.
   */
  const savingsGross =
    savingsInterestPerSecond(next.buildings, next.coins) *
    seconds *
    (1 + relicYieldBonus);
  if (savingsGross > 0) {
    const { opexRate } = blendedRates(next.buildings);
    const savingsOpex = savingsGross * opexRate;
    const savingsTax = Math.max(0, savingsGross - savingsOpex) * CORPORATE_TAX_RATE;
    const savingsNet = savingsGross - savingsOpex - savingsTax;
    const cur = (n: unknown) => (Number.isFinite(n) ? Math.max(0, n as number) : 0);
    next = {
      ...next,
      coins: Math.max(0, cur(next.coins) + savingsNet),
      totalCoinsEarned: cur(next.totalCoinsEarned) + savingsNet,
      totalRevenue: cur(next.totalRevenue) + savingsNet,
    };
    next = postLedger(next, {
      grossRevenue: savingsGross,
      opex: savingsOpex,
      tax: savingsTax,
      netIncome: savingsNet,
    });
    // Lãi tự sinh KHÔNG cho XP Thị Trưởng: XP đến từ việc bán hàng (bấm đơn).
    // Ép lãi tiết kiệm vào XP thì thành phố chỉ cần ngồi giữ tiền là lên cấp.
  }

  /*
   * THU NHẬP THỤ ĐỘNG - ngoài COMMERCIAL.
   *
   * Hàng chờ + bấm đơn giờ CHỈ áp dụng cho 7 công trình COMMERCIAL (ăn uống,
   * mua sắm - xem `arrivalRateFor` trong `transactions.ts`). Nhà ở, kỳ quan
   * và nhóm FINTECH ngoài túi thần tài/ngân hàng số (đã có lãi tiết kiệm
   * riêng ở trên) không có khách xếp hàng - không hợp lý khi nhà ở hay sàn
   * chứng khoán bắt người ta xếp hàng để trả tiền.
   *
   * Nhóm này quay lại mô hình CŨ: tự sinh Xu đều theo giây, không cần bấm.
   */
  const passiveNodes = next.buildings.filter((b) => {
    const def = BUILDING_BY_ID[b.defId];
    if (!def || def.zone === 'COMMERCIAL') return false;
    return b.defId !== 'tram-tui-than-tai' && b.defId !== 'ngan-hang-so';
  });
  const passiveStreet = streetNodes(next);
  const passiveRate = passiveNodes.reduce(
    (sum, b) => sum + nodeYieldBreakdown(b, passiveStreet).totalPerSec,
    0,
  );
  const passiveGross = passiveRate * seconds * (1 + relicYieldBonus);
  if (passiveGross > 0) {
    const { opexRate } = blendedRates(passiveNodes);
    const passiveOpex = passiveGross * opexRate;
    const passiveTax = Math.max(0, passiveGross - passiveOpex) * CORPORATE_TAX_RATE;
    const passiveNet = passiveGross - passiveOpex - passiveTax;
    const cur = (n: unknown) => (Number.isFinite(n) ? Math.max(0, n as number) : 0);
    next = {
      ...next,
      coins: Math.max(0, cur(next.coins) + passiveNet),
      totalCoinsEarned: cur(next.totalCoinsEarned) + passiveNet,
      totalRevenue: cur(next.totalRevenue) + passiveNet,
    };
    next = postLedger(next, {
      grossRevenue: passiveGross,
      opex: passiveOpex,
      tax: passiveTax,
      netIncome: passiveNet,
    });
    // Cùng lý do với lãi tiết kiệm: thụ động không cho XP, XP đến từ bán hàng.
  }

  /*
   * LAI VAY VA NO XAU - nay la TIEN RA THAT khoi ngan khoc.
   *
   * Trước đây cả hai chỉ "không được cộng vào" (net vào ví đã trừ sẵn).
   * Giờ gross đã vào ví nên phải trừ đích danh, nếu không P&L sẽ nói
   * có chi phí mà ví không hề mất tiền - đúng loại lỗi đang sửa.
   */
  const interestOut = flow.interestExpense * seconds;
  const badDebtOut = flow.badDebt * seconds;
  if (interestOut > 0 || badDebtOut > 0) {
    const out = interestOut + badDebtOut;
    next = {
      ...next,
      coins: Math.max(0, next.coins - out),
      totalInterestPaid: (next.totalInterestPaid ?? 0) + interestOut,
    };
    next = postLedger(next, {
      interestExpense: interestOut,
      badDebt: badDebtOut,
      netIncome: -out,
    });
  }

  /*
   * LÃI NỢ CÁ NHÂN (story debt) - charge mỗi 30 ngày thực.
   * Khác với `debt` (vay kinh doanh per-second), khoản này thu lần/kỳ.
   */
  const debtRemaining = Math.max(0, next.playerDebtPrincipal - next.playerDebtPaid);
  if (debtRemaining > 0 && isOverdue(next.playerDebtNextDueDateStr, now)) {
    const canPay = next.coins >= PLAYER_DEBT_MONTHLY_INTEREST;
    next = {
      ...next,
      coins: canPay ? Math.max(0, next.coins - PLAYER_DEBT_MONTHLY_INTEREST) : next.coins,
      playerDebtMissed: canPay ? 0 : (next.playerDebtMissed ?? 0) + 1,
      // Tre ky = mat uy tin ngay lap tuc (nguoi choi thay truoc khi den ky mat dat).
      trustScore: canPay ? next.trustScore : Math.max(300, (next.trustScore ?? 650) - 60),
      playerDebtNextDueDateStr: futureDateKey(now, PLAYER_DEBT_INTERVAL_DAYS),
    };
  }

  /*
   * KIEM TRA KET THUC.
   *
   * Dung ham test duoc `endingForState` thay vi code inline: 3 - 4 phep tinh
   * trong tick giay la cho code chay nhung kho test. Uu tien: tra het no goc
   * (win) an het trang thai khac, ke ca 'bankrupt' - neu nguoi choi vuot qua
   * giai doan tre no roi moi tra het van phai nhan ket thuc dung.
   */
  const resolvedEnding = endingForState(next);
  if (resolvedEnding && (!next.gameEnding || (next.gameEnding === 'bankrupt' && resolvedEnding !== 'bankrupt'))) {
    next = { ...next, gameEnding: resolvedEnding };
  }

  next = maybeSpawnRequest(next, now);
  next = maybeSpawnEvent(next, now);

  const tuiGain = calculateTuiThanTaiInterest(state.tuiThanTaiBalance ?? 0, seconds);
  if (tuiGain > 0) {
    next = {
      ...next,
      tuiThanTaiBalance: (next.tuiThanTaiBalance ?? 0) + tuiGain,
      tuiThanTaiInterestEarned: (next.tuiThanTaiInterestEarned ?? 0) + tuiGain,
      // Lãi tiền gửi là khoản thu nhập tài chính, phải có trong sổ cái.
      totalRevenue: (next.totalRevenue ?? 0) + tuiGain,
    };
    const day = todayKey(now);
    const month = monthKey(now);
    next.ledgerLifetime = addToLedger(next.ledgerLifetime, 'grossRevenue', tuiGain);
    next.ledgerLifetime.netIncome = Math.max(0, next.ledgerLifetime.netIncome + tuiGain);
    next.ledgerDay = addToLedger(next.ledgerDay, 'grossRevenue', tuiGain);
    next.ledgerDay.netIncome = Math.max(0, next.ledgerDay.netIncome + tuiGain);
    next.ledgerMonth = addToLedger(next.ledgerMonth, 'grossRevenue', tuiGain);
    next.ledgerMonth.netIncome = Math.max(0, next.ledgerMonth.netIncome + tuiGain);
    void day;
    void month;
  }

  // 1. Hồi Action Points (AP): 1 AP mỗi 5 phút (300.000ms), trần 50 AP
  const currentAp = next.ap ?? 50;
  const maxAp = next.maxAp ?? 50;
  const lastApRegen = next.lastApRegenMs ?? now;
  if (currentAp < maxAp && now - lastApRegen >= 300_000) {
    const regained = Math.floor((now - lastApRegen) / 300_000);
    next = {
      ...next,
      ap: Math.min(maxAp, currentAp + regained),
      lastApRegenMs: lastApRegen + regained * 300_000,
    };
  }

  // 2. Kiểm tra hiệu lực Bảo Hiểm MoMo
  if (next.hasInsurance && next.insuranceActiveUntilMs && next.insuranceActiveUntilMs < now) {
    next = { ...next, hasInsurance: false, insuranceActiveUntilMs: 0 };
  }

  setState(next);
  processLoanOverdue(now);
  maybeTriggerHazardTick();
  maybeProcessFraudTick();
}

function processLoanOverdue(now: number): void {
  const due = state.loanDueDay ?? '';
  const overdue = due && todayKey(now) > due && (state.debt ?? 0) > 0;
  if (!overdue) return;

  const fee = Math.max(50_000, Math.round((state.debt ?? 0) * 0.05));
  const actualFee = Math.min(state.coins, fee);
  if (actualFee <= 0) return;

  const next = {
    ...state,
    coins: Math.max(0, state.coins - actualFee),
    loanLateFeeCount: (state.loanLateFeeCount ?? 0) + 1,
    loanDueDay: todayKey(now + 7 * 24 * 3600 * 1000),
  };
  setState({
    ...next,
    ledgerLifetime: addToLedger(next.ledgerLifetime, 'opex', actualFee),
    ledgerDay: addToLedger(next.ledgerDay, 'opex', actualFee),
    ledgerMonth: addToLedger(next.ledgerMonth, 'opex', actualFee),
  });
}

function maybeTriggerHazardTick(): void {
  if (Math.random() >= 0.00008) return;
  if (state.coins <= 0) return;
  const damage = Math.min(3_000_000, Math.max(500_000, Math.round(state.coins * 0.05)));
  triggerHazardEvent(damage);
}

function maybeProcessFraudTick(): void {
  if (state.buildings.length === 0) return;
  if (Math.random() >= 0.0003) return;
  const pick = state.buildings[Math.floor(Math.random() * state.buildings.length)];
  if (pick) processFraudCheckForBuilding(pick.id);
}

/** Bo request da qua han truoc khi dem/chiem chan. */
function expireStaleRequests(current: CityState, now: number): CityState {
  const alive = current.activeRequests.filter((r) => now - r.createdAt < REQUEST_TTL_MS);
  if (alive.length === current.activeRequests.length) return current;
  return { ...current, activeRequests: alive };
}

function maybeSpawnRequest(current: CityState, now: number): CityState {
  current = expireStaleRequests(current, now);
  if (current.activeRequests.length >= MAX_ACTIVE_REQUESTS) return current;
  if (now - current.lastRequestAt < REQUEST_INTERVAL_MS) return current;

  const taken = new Set(current.activeRequests.map((r) => r.npcId));
  for (const npc of current.npcs) {
    if (taken.has(npc.id)) continue;
    const script = eligibleRequestFor(npc);
    if (!script) continue;

    const request: ActiveRequest = {
      id: `${npc.id}_${script.id}_${now.toString(36)}`,
      scriptId: script.id,
      npcId: npc.id,
      createdAt: now,
    };
    return { ...current, activeRequests: [...current.activeRequests, request], lastRequestAt: now };
  }
  return current;
}

function maybeSpawnEvent(current: CityState, now: number): CityState {
  if (current.pendingEvent) return current;
  if (now - current.lastEventAt < EVENT_INTERVAL_MS) return current;
  if (resolvedEventsToday(current) >= MAX_EVENTS_PER_DAY) return current;

  const eligible = eligibleCityEvents(current);
  if (eligible.length === 0) return current;

  /*
   * QUAY VONG THEO THOI GIAN, KHONG `Math.random()`.
   *
   * `Math.random()` o day nghia la nguoi choi co the reload cho den khi gap
   * su kien tot nhat - dang sau doanh nghiep, khac het muc dich cua su kien
   * la day con phu. `Math.floor(now / EVENT_INTERVAL_MS) % length` giu su kien
   * chay vong qua, va gop voi `eligibleCityEvents` thi su kien phu trang thai
   * duoc day vao danh sach truoc nen van co nhip de quyet.
   */
  const script = eligible[Math.floor(now / EVENT_INTERVAL_MS) % eligible.length];
  return {
    ...current,
    pendingEvent: { id: `${script.id}_${now.toString(36)}`, scriptId: script.id, createdAt: now },
    lastEventAt: now,
  };
}

/* ── Tap reward: rate-limit o store, khong de component tu ghi tien ── */

export type TapSource = 'bubble' | 'citizen' | 'advisor' | 'patrol' | 'pet' | 'stall';

export interface TapRewardOptions {
  /** Han giay cho phep bam lai. Mac dinh 800ms. */
  cooldownMs?: number;
  /** Ty le % ro vat pham (0 - 1). Mac dinh 0. */
  itemChance?: number;
  /** Vat pham nao duoc ro. Mac dinh khong ro gi. */
  itemId?: string;
}

export type TapRewardResult =
  | { ok: true; coins: number; itemId?: string }
  | { ok: false; reason: 'cooldown' };

/**
 * Moi duong "bam de nhan Xu" deu phai di qua day. Truoc day khong co han nao:
 * 13 cu dan x 500 Xu + 38% ro vat pham la farm loop lam sap do kinh te.
 *
 * KHONG cong XP - chinh la de khong farm cap do bang click NPC.
 */
export function claimTapReward(
  source: TapSource,
  amount: number,
  options: TapRewardOptions = {},
): TapRewardResult {
  const now = Date.now();
  const cooldownMs = options.cooldownMs ?? 800;
  const last = state.tappedAt?.[source] ?? 0;
  if (now - last < cooldownMs) {
    return { ok: false, reason: 'cooldown' };
  }

  const safeCoins = Math.max(0, Math.floor(amount));
  const next: CityState = {
    ...state,
    coins: Math.max(0, state.coins + safeCoins),
    bubblesCollected: state.bubblesCollected + 1,
    totalCoinsEarned: state.totalCoinsEarned + safeCoins,
    // Tien cham cung dan / thu cu: tach rieng khoi doanh thu de bao cao
    // khong tron hai thu khac nhau vao mot dong.
    totalTapIncome: (Number.isFinite(state.totalTapIncome) ? Math.max(0, state.totalTapIncome) : 0) + safeCoins,
    tappedAt: { ...(state.tappedAt ?? {}), [source]: now },
  };

  const chance = options.itemChance ?? 0;
  if (chance > 0 && options.itemId && Math.random() < chance) {
    const cur = next.inventory?.[options.itemId] ?? 0;
    setState({ ...next, inventory: { ...(next.inventory ?? {}), [options.itemId]: cur + 1 } });
    return { ok: true, coins: safeCoins, itemId: options.itemId };
  }

  setState(next);
  return { ok: true, coins: safeCoins };
}

/* ── Doi thoai ──────────────────────────────────────────────────── */

function applyEffects(current: CityState, npcId: string | null, effects: DialogueEffects): CityState {
  let next: CityState = { ...current };

  next.npcs = current.npcs.map((npc) => {
    let updated = npc;
    if (effects.trustAll !== undefined) {
      updated = { ...updated, trust: clampTrust(updated.trust + effects.trustAll) };
    }
    if (npcId && npc.id === npcId) {
      if (effects.trust !== undefined) {
        updated = { ...updated, trust: clampTrust(updated.trust + effects.trust) };
      }
      if (effects.acceptDigital) {
        updated = {
          ...updated,
          acceptsDigital: true,
          services: [...new Set([...updated.services, 'QR_PAYMENT' as const])],
        };
      }
      if (effects.grantService) {
        updated = {
          ...updated,
          services: [...new Set([...updated.services, effects.grantService])],
        };
      }
    }
    return applyTrustThreshold(updated);
  });

  if (effects.coins) next = withCoins(next, effects.coins);
  if (effects.xp) Object.assign(next, addMayorXp(next, effects.xp));
  if (effects.rewardItemId) {
    const curQty = next.inventory?.[effects.rewardItemId] ?? 0;
    next.inventory = { ...(next.inventory ?? {}), [effects.rewardItemId]: curQty + 1 };
  }
  /**
   * Xu lý chuyện phố là cách bù lại suy giảm hạnh phúc theo thời gian.
   * Chọn phương án tàn nhẫn thì tự động trừ điểm.
   */
  if (effects.happiness) {
    next.happinessBoost = Math.min(
      HAPPINESS_BOOST_CAP,
      Math.max(0, (next.happinessBoost ?? 0) + effects.happiness),
    );
  }
  return next;
}

export function grantInventoryItem(itemId: string, qty = 1): void {
  if (!INVENTORY_BY_ID[itemId] || qty <= 0) return;
  const cur = state.inventory?.[itemId] ?? 0;
  setState({
    ...state,
    inventory: { ...(state.inventory ?? {}), [itemId]: cur + qty },
  });
}

export type UseItemResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export function applyInventoryItem(itemId: string): UseItemResult {
  const def = INVENTORY_BY_ID[itemId];
  if (!def) return { ok: false, message: 'Vật phẩm không tồn tại.' };
  const qty = state.inventory?.[itemId] ?? 0;
  if (qty <= 0) return { ok: false, message: 'Bạn đã dùng hết vật phẩm này trong Kho Đồ.' };

  // Không còn RELIC nào trong INVENTORY_ITEMS nên nhánh trang bị đã bỏ.

  // Giảm 1 số lượng đối với CONSUMABLE và GIFT
  const nextInv = { ...(state.inventory ?? {}), [itemId]: Math.max(0, qty - 1) };
  const nextState: CityState = { ...state, inventory: nextInv };

  /**
   * KHONG VAT PHAM NAO TRAO XU THO.
   *
   * Ban <= 3 moi vat pham deu loi ron: Loa Phuong gia 18.000 tra 35.000 Xu,
   * Trà Sữa 12.000 tra 22.000 Xu, Bản Vẽ 80.000 "quy doi" 85.000 Xu. Voi
   * `buyInventoryItem` khong chan so luong mua, chi can vong lap mua-ban la
   * pha het do kinh te - dung thu may in tien da gap o `hydrateCity`.
   *
   * Bay gio XU chi den tu do kinh te cua thanh pho. Vat pham GIFT con lai chi
   * tra Tin Cay/Hanh Phuc cho NPC - khong con item nao buff truc tiep nguoi
   * choi hay thanh pho nua (Loa Phuong, Giờ Vàng, Bao Li Xi, Bản Vẽ Quy
   * Hoạch va 4 Relic da bo het, xem chu thich o INVENTORY_ITEMS).
   */
  const boostAllTrust = (n: number) => {
    nextState.npcs = nextState.npcs.map((npc) =>
      applyTrustThreshold({ ...npc, trust: clampTrust(npc.trust + n) }),
    );
  };
  const boostHappiness = (n: number) => {
    nextState.happinessBoost = Math.min(
      HAPPINESS_BOOST_CAP,
      Math.max(0, (nextState.happinessBoost ?? 0) + n),
    );
  };

  if (itemId === 'gift-tra-sua') {
    boostAllTrust(25);
    boostHappiness(10);
    setState(nextState);
    return {
      ok: true,
      message:
        'Đã mời Cư dân & Chủ tiệm uống Trà Sữa! +25 Tin Cậy (Mở khóa QR) & +10 Hạnh Phúc.',
    };
  }

  if (itemId === 'gift-hop-qua-tet') {
    boostAllTrust(35);
    boostHappiness(14);
    setState(nextState);
    return {
      ok: true,
      message: 'Đã trao Hộp Quà Đoàn Viên toàn khu phố! +35 Tin Cậy mọi NPC & +14 Hạnh Phúc.',
    };
  }

  setState(nextState);
  return { ok: true, message: `Đã sử dụng "${def.name}"!` };
}

export function buyInventoryItem(itemId: string): UseItemResult {
  const def = INVENTORY_BY_ID[itemId];
  if (!def) return { ok: false, message: 'Vật phẩm không tồn tại.' };
  if (state.coins < def.costCoins) {
    return { ok: false, message: 'Chưa đủ đồng để mua vật phẩm này.' };
  }
  if (state.gems < def.costGems) {
    return { ok: false, message: 'Chưa đủ Kim Cương để mua vật phẩm này.' };
  }
  const curQty = state.inventory?.[itemId] ?? 0;
  if (def.category === 'RELIC' && curQty >= 1) {
    return { ok: false, message: 'Bạn đã sở hữu Bảo Vật này trong Kho Đồ rồi.' };
  }
  setState(
    postLedger(
      {
        ...state,
        coins: state.coins - def.costCoins,
        gems: state.gems - def.costGems,
        inventory: { ...(state.inventory ?? {}), [itemId]: curQty + 1 },
      },
      // Vật phẩm / Bảo Vật là KIỂM KÊ THI TRƯỜNG: mang tính tài sản, tồn
      // kho lau ngay nên không ghi vào chi phi vận hành.
      { inventoryBought: def.costCoins },
    ),
  );
  return { ok: true, message: `Đã mua thêm +1 "${def.name}" vào Kho Đồ!` };
}

export type DialogueResult = 'ok' | 'missing' | 'funds';

/** Thi truong chon mot phuong an trong doi thoai yeu cau. */
export function resolveRequest(requestId: string, choiceId: string): DialogueResult {
  const request = state.activeRequests.find((r) => r.id === requestId);
  if (!request) return 'missing';

  const script = REQUEST_BY_ID[request.scriptId];
  const choice = script?.choices.find((c) => c.id === choiceId);
  if (!script || !choice) return 'missing';

  let next: CityState = state;
  if (choice.costCoins) {
    const wallet = spend(state, { coins: choice.costCoins });
    if (!wallet) return 'funds';
    next = { ...state, coins: wallet.coins };
  }

  next = applyEffects(next, request.npcId, choice.effects);
  next.activeRequests = next.activeRequests.filter((r) => r.id !== requestId);
  next.lastEngagedAt = Date.now();
  setState(next);
  return 'ok';
}

/** Thi truong xu ly su kien toan thanh pho. */
export function resolveEvent(choiceId: string): DialogueResult {
  const pending = state.pendingEvent;
  if (!pending) return 'missing';

  const script = EVENT_BY_ID[pending.scriptId];
  const choice = script?.choices.find((c) => c.id === choiceId);
  if (!script || !choice) return 'missing';

  let next: CityState = state;
  if (choice.costCoins) {
    const wallet = spend(state, { coins: choice.costCoins });
    if (!wallet) return 'funds';
    next = { ...state, coins: wallet.coins };
  }

  next = applyEffects(next, null, choice.effects);
  next.pendingEvent = null;
  next.lastEventAt = Date.now();
  next.lastEngagedAt = Date.now();
  next.dailyLog = bumpDaily(next, 'eventsResolved');
  Object.assign(next, bumpResolvedEvents(next));
  setState(next);
  return 'ok';
}

/** Bo qua su kien hien tai va len lich su kien moi sau EVENT_INTERVAL_MS (6 phut) */
export function dismissEvent(): void {
  if (!state.pendingEvent) return;
  setState({
    ...state,
    pendingEvent: null,
    lastEventAt: Date.now(),
    lastEngagedAt: Date.now(),
  });
}

export type NextEventResult = 'ok' | 'missing' | 'cooldown' | 'dailyLimit' | 'level';

/**
 * Kich hoat su kien tiep theo. KHONG con spawn tu do: phai het han
 * `EVENT_INTERVAL_MS` (6 phut) VÀ còn lượt trong ngày. Truoc day ham nay la
 * spawn mien phi vo han, bam lien nut "Chuyen Pho" de chay vong lap tra Xu
 * nho - nhan vat pham dat gia tri lon.
 */
export function triggerNextEvent(specificScriptId?: string): NextEventResult {
  if (state.pendingEvent) return 'missing';
  const now = Date.now();
  if (now - state.lastEventAt < EVENT_INTERVAL_MS) return 'cooldown';
  if (resolvedEventsToday(state) >= MAX_EVENTS_PER_DAY) return 'dailyLimit';

  const eligible = eligibleCityEvents(state);
  if (eligible.length === 0) return 'level';

  /*
   * Chon theo THU TU THOI GIAN, KHONG `Math.random()`.
   *
   * Nut "Chuyen Pho" cho nguoi choi quyet dinh khi nao xem, nen dung chon
   * ngau nhien trong danh sach dang cho, ma giong cac muc khac: reload
   * cho den khi gap phuong an de se la farm loop.
   */
  const script = specificScriptId
    ? (eligible.find((e) => e.id === specificScriptId) ?? eligible[0])
    : eligible[Math.floor(Date.now() / EVENT_INTERVAL_MS) % eligible.length];
  setState({
    ...state,
    pendingEvent: { id: `${script.id}_${now.toString(36)}`, scriptId: script.id, createdAt: now },
    lastEventAt: now,
  });
  return 'ok';
}

/** So su kien con lai trong ngay, dung cho hien thi tren UI. */
export function eventsLeftToday(): number {
  return Math.max(0, MAX_EVENTS_PER_DAY - resolvedEventsToday(state));
}

/* ── Sự kiện theo trạng thái thành phố ────────────────────────────── */

/**
 * Đọc trạng thái phố để làm điều kiện cho kịch bản sự kiện.
 *
 * Chỉ trạng thái RẼ TIỀN và RỦI RO, không đụng `coins` trần 0: sự kiện phải
 * chạm vào việc kinh doanh mà người chơi nhìn thấy trên báo cáo P&L, nếu lấy
 * `coins` thì một người chơi vừa xây xong và một người đang phá sản nghiệp
 * nhận cùng một kịch bản.
 */
function cityConditionFor(s: CityState): CityCondition {
  const flow = flowFor(s.buildings, s.npcs, s.mayorLevel, s.coins, flowOptsFor(s));
  return {
    happiness: clampHappiness(happinessFor(s.buildings, 0, s.happinessBoost ?? 0)),
    nplRate: flow.nplRate,
    debt: s.debt ?? 0,
    cashflowRatio: calculateCashflowRatio(
      s.workingCapital ?? s.coins,
      flow.opex,
      flow.interestExpense,
    ),
    shopsOverloaded: overloadedShopCount(s.buildings, realShopQueueCounts(s.shopQueues ?? [])),
    lateFeeCount: s.loanLateFeeCount ?? 0,
    hasInsurance: s.hasInsurance ?? false,
  };
}

/**
 * Kịch bản có hợp với trạng thái phố hiện tại không.
 *
 * Tất cả điều kiện trong `CityEventScript` là AND. Kịch bản không khai báo
 * điều kiện nào thì luôn hợp lệ, nên thêm điều kiện mới không phá kịch bản cũ.
 */
export function eventFits(script: CityEventScript, cond: CityCondition): boolean {
  if (script.happinessBelow !== undefined && cond.happiness >= script.happinessBelow) return false;
  if (script.cashflowBelow !== undefined && cond.cashflowRatio >= script.cashflowBelow) return false;
  /*
   * `nplAbove` và `debtAbove` dùng `>=` để BẮT ĐẦU kịch bản, khác với hai
   * ngưỡng trên là `>=` để LOẠI.
   *
   * Lý do: hai nhóm này là ngưỡng "đã vượt", nên chạm ngưỡng là phải có trợ
   * giúp. `cityMood` cũng kích hoạt đúng tại ngưỡng (`nplRate >= 0.12`). Nếu ở
   * đây dùng `>` thì người chơi thấy bà con bày tay báo "nợ xấu cao" mà
   * không có kịch bản nào chạy theo - hai hệ thống nói hai chuyện khác nhau.
   */
  if (script.nplAbove !== undefined && cond.nplRate < script.nplAbove) return false;
  if (script.debtAbove !== undefined && cond.debt < script.debtAbove) return false;
  if (script.requiresCrowding && cond.shopsOverloaded <= 0) return false;
  if (script.requiresLateFee && cond.lateFeeCount <= 0) return false;
  if (script.requiresNoInsurance && cond.hasInsurance) return false;
  return true;
}

/**
 * Danh sách sự kiện hợp lệ: đủ cấp Thị Trưởng VÀ hợp trạng thái phố.
 *
 * Tách khỏi `normalizeStoredState` để hàm đó không phải gọi `flowFor` - đường
 * hydrate phải giữ được rẻ vì nó chạy mỗi lần mở game.
 *
 * Không nhận `now`: điều kiện lọc toàn là trạng thái (hạnh phúc, NPL, nợ,
 * dòng tiền...) chứ không có điều kiện thời gian, nên `now` truyền vào chỉ bị
 * bỏ qua - gọi `eligibleCityEvents(state)` là đủ.
 */
export function eligibleCityEvents(s: CityState): CityEventScript[] {
  const byLevel = CITY_EVENTS.filter((e) => s.mayorLevel >= e.minMayorLevel);
  // Không tốn công tính trạng thái phố khi không kịch bản nào cần nó.
  const canCoDieuKien = byLevel.some(
    (e) =>
      e.happinessBelow !== undefined ||
      e.nplAbove !== undefined ||
      e.debtAbove !== undefined ||
      e.requiresCrowding ||
      e.requiresLateFee ||
      e.requiresNoInsurance ||
      e.cashflowBelow !== undefined,
  );
  if (!canCoDieuKien) return byLevel;
  const cond = cityConditionFor(s);
  return byLevel.filter((e) => eventFits(e, cond));
}

/* ── Xay dung & Nang cap IDLE RPG ───────────────────────────────── */

/**
 * Tru Xu cho cac tuong tac nho le (vi du bieu cu dan tren pho).
 * Tra ve false va khong doi state neu khong du.
 */
export function spendCoins(amount: number): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const wallet = spend(state, { coins: amount });
  if (!wallet) return false;
  setState({ ...state, coins: wallet.coins });
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * TRANSACTION ENGINE - NGƯỜI CHƠI ĐÓNG ĐƠN
 *
 * Đây là những hàm DUY NHẤT chuyển doanh thu thành tiền trong ngân khố.
 * Không còn đường `withCoins(flow.revenue * seconds)` nào sống cả.
 *
 * Luật chơi: khách tự đến, người chơi bấm để bán. Không bấm là mất.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Bối cảnh tính 1 giao dịch tại thời điểm `now`.
 *
 * `idleMs` mặc định là `now - lastEngagedAt` - đúng với lúc đang chơi.
 * Khi tính lô AFK phải truyền `idleMs: 0`: tiền vắng mặt không được phép
 * phụ thuộc vào lần tương tác gần nhất, nếu không thì hai người cùng đi vắng
 * 8 giờ sẽ nhận hai con số khác nhau chỉ vì một người vừa mới bấm.
 */
function txCtxFor(s: CityState, now: number, idleMs?: number): TxCtx {
  const relicHappyBonus = (s.equippedRelics ?? []).reduce((sum, rId) => {
    return sum + (INVENTORY_BY_ID[rId]?.passiveHappinessBonus ?? 0);
  }, 0);
  const happiness = clampHappiness(
    happinessFor(s.buildings, idleMs ?? Math.max(0, now - s.lastEngagedAt), s.happinessBoost) +
      relicHappyBonus,
  );

  /*
   * Cung - cầu: sao đúng công thức trong `flowFor`. Cầu vượt cung thì bán
   * được ít hơn, không thể để giao dịch cứ bán full rồi lệch với P&L.
   */
  const demand = demandPerSecond(s.buildings, s.npcs);
  const supply = supplyPerSecond(s.buildings);
  const supplyFactor =
    demand <= 0 ? 1 : MIN_SUPPLY_FACTOR + (1 - MIN_SUPPLY_FACTOR) * Math.min(1, supply / demand);

  const relicYieldBonus = (s.equippedRelics ?? []).reduce((sum, rId) => {
    return sum + (INVENTORY_BY_ID[rId]?.passiveYieldBonus ?? 0);
  }, 0);

  return {
    buildings: s.buildings,
    street: streetNodes(s),
    npcs: s.npcs,
    happinessMult: taxMultiplierFromHappiness(happiness),
    levelBonus: 1 + (s.mayorLevel - 1) * 0.12,
    takeRate: takeRateFor(s.buildings),
    now,
    supplyFactor,
    earnMult: 1 + relicYieldBonus,
  };
}

/** Đóng 1 đơn hàng thủ công tại tiệm được chọn. */
export function closeOrder(shopId: string): { ok: boolean; txn?: Transaction | null } {
  const node = state.buildings.find((b) => b.id === shopId);
  if (!node) return { ok: false };
  const ctx = txCtxFor(state, Date.now());
  const { queues: nextQueues, txn } = closeSingleOrder(node, state.shopQueues ?? [], ctx, (state.ordersClosed ?? 0) + 1);
  if (!txn) return { ok: false };
  const next: CityState = { ...state, shopQueues: nextQueues };
  const recorded = recordTransactions(next, [txn]);
  setState(recorded);
  return { ok: true, txn };
}

/** Dọn toàn bộ hàng chờ tại tiệm được chọn. */
export function clearShopQueue(shopId: string): { ok: boolean; txns: Transaction[] } {
  const node = state.buildings.find((b) => b.id === shopId);
  if (!node) return { ok: false, txns: [] };
  const ctx = txCtxFor(state, Date.now());
  const { queues: nextQueues, txns } = txClearShopQueue(node, state.shopQueues ?? [], ctx, (state.ordersClosed ?? 0) + 1);
  if (txns.length === 0) return { ok: false, txns: [] };
  const next: CityState = { ...state, shopQueues: nextQueues };
  const recorded = recordTransactions(next, txns);
  setState(recorded);
  return { ok: true, txns };
}

/** Giá thuê Nhân Viên thứ N - tỉ lệ với quy mô tiệm, tăng dần mỗi người. */
export function staffHireCost(node: BuildingNode): number {
  const def = BUILDING_BY_ID[node.defId];
  const base = Math.max(1000, (def?.costCoins ?? 100_000) * 0.02);
  const staff = Math.min(STAFF_MAX, Math.max(0, node.staffCount ?? 0));
  return Math.round(base * 1.8 ** staff);
}

export type HireStaffResult = 'ok' | 'funds' | 'max' | 'notFound';

/**
 * Thuê thêm 1 Nhân Viên cho tiệm - rút ngắn `serviceIntervalMsFor`, KHÔNG
 * ảnh hưởng doanh thu mỗi đơn (đó là việc của Cổ Đông, xem `assignStoreManager`).
 */
export function hireStaff(col: number, row: number): HireStaffResult {
  const node = buildingAt(state.buildings, col, row);
  if (!node) return 'notFound';
  const current = Math.min(STAFF_MAX, Math.max(0, node.staffCount ?? 0));
  if (current >= STAFF_MAX) return 'max';

  const cost = staffHireCost(node);
  const wallet = spend(state, { coins: cost });
  if (!wallet) return 'funds';

  const nextState: CityState = {
    ...state,
    coins: wallet.coins,
    buildings: state.buildings.map((b) =>
      b.id === node.id ? { ...b, staffCount: current + 1 } : b,
    ),
  };
  setState(postLedger(nextState, { capex: cost }));
  return 'ok';
}

/* ═══════════════════════════════════════════════════════════════════════════
 * VAY VON NGAN HANG SO MOMO
 *
 * Tien vay vao ngan khoc ngay, nghia vu tra o lai duoi dang `debt`. Lai tinh
 * moi giay va tru thang vao P&L truoc thue.
 *
 * Han muc khong phai mot con so co dinh ma suy tu KHA NANG TRA NO (bội số
 * EBIT), dung cach ngan hang that tham dinh. Nguoi choi lai mong se thay minh
 * vay duoc it hon nguoi lai day du doanh thu bang nhau - do chinh la bai hoc.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type LoanResult =
  | { ok: true; amount: number }
  | { ok: false; reason: 'ceiling' | 'invalid' | 'noIncome' | 'needBank' | 'disabled' };

/**
 * Dung MOT bo tham so cho moi noi tinh dong tien.
 *
 * Ban dau `takeLoan` goi `flowFor` chi voi `{ debt }`, bo het hanh phuc, Gio
 * Vang va Bao Vat. Ket qua la bang Kho an Vay hien "con vay duoc 362.809"
 * (tinh qua `useCityDerived`, co day du bonus) nhung bam Vay thi bi tu choi
 * vi store tinh ra EBIT thap hon han. Mot game day ve tai chinh khong duoc
 * phep hien mot con so roi tu choi chinh con so do.
 */
function flowOptsFor(s: CityState): FlowOptions {
  let relicYieldBonus = 0;
  let relicHappyBonus = 0;
  for (const rId of s.equippedRelics ?? []) {
    const def = INVENTORY_BY_ID[rId];
    if (!def) continue;
    relicYieldBonus += def.passiveYieldBonus ?? 0;
    relicHappyBonus += def.passiveHappinessBonus ?? 0;
  }
  return {
    idleMs: Date.now() - s.lastEngagedAt,
    happinessBoost: s.happinessBoost,
    relicBonus: relicYieldBonus,
    relicHappinessBonus: relicHappyBonus,
    debt: 0,
    shopQueue: realShopQueueCounts(s.shopQueues ?? []),
    street: streetNodes(s),
  };
}

/**
 * Han muc vay con lai. 0 nghia la khong du kha nang tra de vay them.
 *
 * LUU Y: `takeLoan` dang bi TAT chinh sach (luon tra 'disabled'), nen con so
 * nay khong duoc UI nao hien ra va khong mo cho vay - no chi con la chi so
 * trong so P&L/GDQ de test va tai lieu.
 */
export function loanHeadroom(s: CityState = state): number {
  if (!hasBankAccess(s)) return 0;
  const flow = flowFor(s.buildings, s.npcs, s.mayorLevel, s.coins, flowOptsFor(s));
  const tran = debtCeilingFor(flow.operatingIncome);
  return Math.max(0, tran - (s.debt ?? 0));
}

/**
 * Chi vay duoc khi da xay NGAN HANG SO (mo o Bac 3 - Pho Via He). Day la bai
 * hoc tin dung dau tien: muon vay thi phai co quan he tin dung truoc, khong
 * phai cu muon la co tien. Gate nay bien 'Vay Nhanh' thanh nang luc PHAI mo
 * khoa chu khong phai co san.
 */
export function hasBankAccess(s: CityState = state): boolean {
  return s.buildings.some((b) => b.defId === 'ngan-hang-so');
}

export function takeLoan(_amount: number): LoanResult {
  return { ok: false, reason: 'disabled' };
}

export type RepayResult =
  | { ok: true; amount: number; remaining: number }
  | { ok: false; reason: 'funds' | 'noDebt' | 'invalid' };

export function repayLoan(amount: number): RepayResult {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: 'invalid' };
  const duNo = state.debt ?? 0;
  if (duNo <= 0) return { ok: false, reason: 'noDebt' };

  const traThuc = Math.min(amount, duNo);
  if (state.coins < traThuc) return { ok: false, reason: 'funds' };

  const remaining = duNo - traThuc;
  const isFullyRepaid = remaining <= 0;
  const trustDelta = isFullyRepaid ? 20 : 5;
  const newTrustScore = Math.min(850, (state.trustScore ?? 650) + trustDelta);

  // Tra no la giam nghia vu, KHONG phai chi phi - khong ghi vao P&L.
  setState({
    ...state,
    coins: state.coins - traThuc,
    workingCapital: Math.max(0, (state.workingCapital ?? state.coins) - traThuc),
    debt: remaining,
    loanDueDay: isFullyRepaid ? '' : state.loanDueDay,
    trustScore: newTrustScore,
  });
  return { ok: true, amount: traThuc, remaining };
}

/* ── CÁC HÀNH ĐỘNG QUẢN TRỊ TÀI CHÍNH THỰC CHIẾN (GAME RULES) ── */

/**
 * LUẬT 1: Rút tiền từ Quỹ Vận Hành sang Ví Tiêu Dùng Cá Nhân Thị Trưởng.
 * Giúp người chơi tích lũy tài sản cá nhân, nhưng nếu rút lố sẽ khiến quán kẹt vốn!
 */
export function transferToPersonalWealth(amount: number): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  if (state.coins < amount) return false;

  setState({
    ...state,
    coins: state.coins - amount,
    workingCapital: Math.max(0, (state.workingCapital ?? state.coins) - amount),
    personalWealth: (state.personalWealth ?? 0) + amount,
  });
  return true;
}

/**
 * Nạp tiền từ Ví Cá Nhân về lại Quỹ Vận Hành của Thành Phố / Quán xá.
 */
export function depositToWorkingCapital(amount: number): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const availableWealth = state.personalWealth ?? 0;
  if (availableWealth < amount) return false;

  setState({
    ...state,
    personalWealth: availableWealth - amount,
    coins: state.coins + amount,
    workingCapital: (state.workingCapital ?? 0) + amount,
  });
  return true;
}

/**
 * LUẬT 5: Gửi tiền nhàn rỗi vào Túi Thần Tài để tự động sinh lãi đêm.
 */
export function depositToTuiThanTai(amount: number): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  if (state.coins < amount) return false;

  setState({
    ...state,
    coins: state.coins - amount,
    workingCapital: Math.max(0, (state.workingCapital ?? state.coins) - amount),
    tuiThanTaiBalance: (state.tuiThanTaiBalance ?? 0) + amount,
  });
  return true;
}

/**
 * Rút tiền từ Túi Thần Tài về Ngân Khố Thành Phố (rút tức thì 24/7).
 */
export function withdrawFromTuiThanTai(amount: number): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const bal = state.tuiThanTaiBalance ?? 0;
  if (bal < amount) return false;

  setState({
    ...state,
    tuiThanTaiBalance: bal - amount,
    coins: state.coins + amount,
    workingCapital: (state.workingCapital ?? 0) + amount,
  });
  return true;
}

/**
 * LUẬT 6: Mua Gói Bảo Hiểm Toàn Diện MoMo phòng vệ rủi ro thời tiết/thiên tai.
 */
export function buyMoMoInsurance(costCoins = 2_000_000): boolean {
  if (state.hasInsurance && (state.insuranceActiveUntilMs ?? 0) > Date.now()) return false;
  return buyMoMoInsurancePackage(costCoins).ok;
}

/* ── HỆ THỐNG TĂNG TRƯỞNG & VÒNG LẶP DOPAMINE THỊ TRƯỞNG MOMO ── */

export interface HarvestResult {
  ok: boolean;
  earned: number;
  bonus: number;
  isJackpot: boolean;
  apRemaining: number;
  message: string;
}

/**
 * Thu hoạch tức thì bằng Điểm Năng Lượng (AP):
 * - Tiêu 1 AP
 * - Nhận 45s doanh thu + 10% Bonus VNĐ
 * - 5% cơ hội nổ Siêu Lợi Nhuận x10 (Jackpot)
 * - Tự động phục vụ mọi khách chờ trên phố
 */
export function harvestManual(): HarvestResult {
  const currentAp = state.ap ?? 50;
  if (currentAp < 1) {
    return {
      ok: false,
      earned: 0,
      bonus: 0,
      isJackpot: false,
      apRemaining: 0,
      message: 'Hết Năng Lượng (AP)! Đang hồi 1 AP mỗi 5 phút.',
    };
  }

  const now = Date.now();
  const flow = flowFor(state.buildings, state.npcs, state.mayorLevel, state.coins, flowOptsFor(state));
  const baseYield = Math.max(15_000, Math.round(flow.operatingIncome * 45));
  const bonus = Math.round(baseYield * 0.10);
  let totalEarned = baseYield + bonus;

  const isJackpot = Math.random() < 0.05;
  if (isJackpot) {
    totalEarned *= 10;
  }

  const autoServed = autoServeQueues(
    state.buildings,
    state.shopQueues ?? [],
    txCtxFor(state, now),
    (state.ordersClosed ?? 0) + 1,
  );

  let nextState: CityState = {
    ...state,
    ap: currentAp - 1,
    lastApRegenMs: state.lastApRegenMs || now,
    buildings: autoServed.buildings,
    shopQueues: [],
    mayorPoints: (state.mayorPoints ?? 100) + 5,
  };

  if (autoServed.txns.length > 0) {
    nextState = recordTransactions(nextState, autoServed.txns);
  }

  nextState = withCoins(nextState, totalEarned, 'OPERATING');
  setState(nextState);

  return {
    ok: true,
    earned: totalEarned,
    bonus,
    isJackpot,
    apRemaining: currentAp - 1,
    message: isJackpot
      ? `💥 SIÊU LỢI NHUẬN x10! Nhận +${totalEarned.toLocaleString('vi-VN')}đ VNĐ!`
      : `⚡ Thu hoạch tức thì: +${totalEarned.toLocaleString('vi-VN')}đ VNĐ (+10% Bonus)!`,
  };
}

/**
 * Mở sổ Tiết Kiệm MoMo sinh lời có kỳ hạn
 */
export function depositSavings(amount: number, tier: '1D' | '3D' | '7D'): { ok: boolean; message: string } {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: 'Số tiền không hợp lệ.' };
  if (state.coins < amount) return { ok: false, message: 'Không đủ số dư VNĐ trong ví.' };

  if ((state.savingsBalance ?? 0) > 0) {
    return { ok: false, message: 'Bạn đang có một sổ tiết kiệm chưa tất toán.' };
  }

  const now = Date.now();
  setState({
    ...state,
    coins: state.coins - amount,
    workingCapital: Math.max(0, (state.workingCapital ?? state.coins) - amount),
    savingsBalance: amount,
    savingsTier: tier,
    savingsStartedAt: now,
  });

  return { ok: true, message: `Đã mở sổ tiết kiệm kỳ hạn ${tier} với ${amount.toLocaleString('vi-VN')}đ!` };
}

/**
 * Tất toán sổ Tiết Kiệm MoMo
 */
export function withdrawSavings(): { ok: boolean; principal: number; interest: number; isEarly: boolean; message: string } {
  const bal = state.savingsBalance ?? 0;
  if (bal <= 0) return { ok: false, principal: 0, interest: 0, isEarly: false, message: 'Không có sổ tiết kiệm nào.' };

  const tier = state.savingsTier ?? '1D';
  const startedAt = state.savingsStartedAt ?? 0;
  const now = Date.now();
  const elapsedDays = (now - startedAt) / (24 * 3600 * 1000);

  const reqDays = tier === '1D' ? 1 : tier === '3D' ? 3 : 7;
  const ratePerDay = tier === '1D' ? 0.02 : tier === '3D' ? 0.03 : 0.05;

  const isMatured = elapsedDays >= reqDays;
  const interest = isMatured ? Math.round(bal * ratePerDay * reqDays) : 0;
  const totalPayout = bal + interest;

  const next = withCoins(
    {
      ...state,
      savingsBalance: 0,
      savingsTier: 'NONE',
      savingsStartedAt: 0,
      mayorPoints: (state.mayorPoints ?? 100) + (isMatured ? 25 : 0),
    },
    totalPayout,
    'GRANT',
  );

  setState(next);

  return {
    ok: true,
    principal: bal,
    interest,
    isEarly: !isMatured,
    message: isMatured
      ? `Đáo hạn thành công! Nhận gốc ${bal.toLocaleString('vi-VN')}đ + Lãi ${interest.toLocaleString('vi-VN')}đ (+25 MP)!`
      : `Tất toán trước hạn: Chỉ nhận lại tiền gốc ${bal.toLocaleString('vi-VN')}đ (Lãi 0%).`,
  };
}

/**
 * Rót vốn vào Quỹ Đầu Tư MoMo
 */
export function investFund(fundId: 'SAFE' | 'BALANCED' | 'AGGRESSIVE', amount: number): { ok: boolean; message: string } {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: 'Số tiền không hợp lệ.' };
  if (state.coins < amount) return { ok: false, message: 'Không đủ số dư VNĐ trong ví.' };
  if ((state.investedAmount ?? 0) > 0) return { ok: false, message: 'Đang có danh mục đầu tư đang hoạt động.' };

  setState({
    ...state,
    coins: state.coins - amount,
    workingCapital: Math.max(0, (state.workingCapital ?? state.coins) - amount),
    investedFundId: fundId,
    investedAmount: amount,
    investedAt: Date.now(),
  });

  return { ok: true, message: `Đã rót vốn ${amount.toLocaleString('vi-VN')}đ vào Quỹ Đầu Tư!` };
}

/**
 * Chốt danh mục đầu tư Quỹ
 */
export function settleFund(): { ok: boolean; invested: number; returned: number; profit: number; yieldPct: number; message: string } {
  const amount = state.investedAmount ?? 0;
  const fundId = state.investedFundId ?? 'NONE';
  if (amount <= 0 || fundId === 'NONE') {
    return { ok: false, invested: 0, returned: 0, profit: 0, yieldPct: 0, message: 'Không có danh mục nào.' };
  }

  let yieldRate = 0;
  if (fundId === 'SAFE') {
    yieldRate = 0.04 + Math.random() * 0.02; // +4% đến +6%
  } else if (fundId === 'BALANCED') {
    yieldRate = -0.05 + Math.random() * 0.25; // -5% đến +20%
  } else {
    yieldRate = -0.25 + Math.random() * 0.60; // -25% đến +35%
  }

  const returned = Math.max(0, Math.round(amount * (1 + yieldRate)));
  const profit = returned - amount;
  const yieldPct = Math.round(yieldRate * 100);

  const next = withCoins(
    {
      ...state,
      investedAmount: 0,
      investedFundId: 'NONE',
      investedAt: 0,
      mayorPoints: (state.mayorPoints ?? 100) + (profit > 0 ? 30 : 5),
    },
    returned,
    'GRANT',
  );

  setState(next);

  return {
    ok: true,
    invested: amount,
    returned,
    profit,
    yieldPct,
    message: profit >= 0
      ? `Chốt lời thành công! Lãi +${profit.toLocaleString('vi-VN')}đ (${yieldPct >= 0 ? '+' : ''}${yieldPct}%)`
      : `Cắt lỗ danh mục: ${profit.toLocaleString('vi-VN')}đ (${yieldPct}%)`,
  };
}

/**
 * Mua Gói Bảo Hiểm Phố Thị MoMo
 */
export function buyMoMoInsurancePackage(costCoins = 2_000_000): { ok: boolean; message: string } {
  if (state.coins < costCoins) return { ok: false, message: 'Không đủ số dư VNĐ trong ví.' };
  const durationMs = 7 * 24 * 3600 * 1000; // 7 ngày
  const now = Date.now();

  setState({
    ...state,
    coins: state.coins - costCoins,
    workingCapital: Math.max(0, (state.workingCapital ?? state.coins) - costCoins),
    hasInsurance: true,
    insuranceActiveUntilMs: (state.insuranceActiveUntilMs && state.insuranceActiveUntilMs > now ? state.insuranceActiveUntilMs : now) + durationMs,
  });

  return { ok: true, message: 'Đã kích hoạt Gói Bảo Hiểm Phố Thị MoMo (Hiệu lực 7 ngày)!' };
}

/**
 * Sinh sự cố đường phố ngẫu nhiên có ngữ cảnh & nguyên nhân gốc rễ
 */
export function spawnRandomIncident(): import('./types').CityIncident | null {
  if (state.buildings.length === 0) return null;
  const active = state.activeIncidents ?? [];
  if (active.length >= 2) return null;
  const fixed = state.fixedIncidents ?? [];

  // Tìm các tổ hợp (building, incidentType) chưa bị fix triệt để
  const types: import('./types').IncidentType[] = ['FIRE', 'THEFT', 'COMPLAINT', 'STOCKOUT'];
  const candidates: { building: typeof state.buildings[0]; type: import('./types').IncidentType }[] = [];

  for (const b of state.buildings) {
    for (const t of types) {
      if (!fixed.includes(`${b.id}:${t}`)) {
        candidates.push({ building: b, type: t });
      }
    }
  }

  // Nếu tất cả đã fix triệt để, cho phép lặp ngẫu nhiên nhưng ưu tiên tòa nhà có sẵn
  const chosen = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : {
        building: state.buildings[Math.floor(Math.random() * state.buildings.length)],
        type: types[Math.floor(Math.random() * types.length)],
      };

  const targetBuilding = chosen.building;
  const type = chosen.type;
  const def = BUILDING_BY_ID[targetBuilding.defId];
  const bName = def?.name ?? 'Cửa hàng';

  const incidentMeta: Record<
    import('./types').IncidentType,
    {
      title: string;
      description: string;
      rootCause: string;
      witnessQuote: string;
      solutions: import('./types').IncidentSolution[];
    }
  > = {
    FIRE: {
      title: 'Chập Điện Quá Tải & Nguy Cơ Cháy',
      description: `Chập rơ-le bảng điện và khói bốc lên tại ${bName}!`,
      rootCause: `Dây dẫn điện cũ bị quá tải do sử dụng đồng thời nhiều thiết bị công suất cao vào giờ cao điểm, bảng điện chưa có atomat tự ngắt chống chập.`,
      witnessQuote: `“Bảng điện xẹt tia lửa rồi khói bốc nghi ngút, khách đang ngồi hoảng loạn bỏ chạy ra ngoài!”`,
      solutions: [
        {
          id: 'sol_upgrade_smart_fuse',
          title: 'Lắp Tủ Điện Rơ-le Tự Ngắt Chuẩn An Toàn',
          desc: 'Thay mới toàn bộ đường dẫn điện chịu tải cao và lắp atomat tự động ngắt điện khi phát hiện xung đột.',
          cost: 450_000,
          mayorPoints: 35,
          fixPermanent: true,
          bonusEffectText: 'Fix vĩnh viễn nguy cơ cháy chập tại tiệm (+35 MP)',
        },
        {
          id: 'sol_ai_fire_safety',
          title: 'Hệ Thống Cảm Biến Khói & Khí Dập Lửa Tự Động',
          desc: 'Trang bị cảm biến nhiệt AI thông minh kết nối trực tiếp với mạng lưới cứu hỏa đô thị.',
          cost: 750_000,
          mayorPoints: 50,
          fixPermanent: true,
          bonusEffectText: 'Bảo vệ an ninh tối đa, tăng uy tín toàn khu (+50 MP)',
        },
        {
          id: 'sol_quick_fuse',
          title: 'Thay Cầu Chì Tạm Thời & Giảm Tải',
          desc: 'Khắc phục tạm thời để duy trì buôn bán trong ngày, chưa nâng cấp hệ thống dây tải.',
          cost: 200_000,
          mayorPoints: 10,
          fixPermanent: false,
          bonusEffectText: 'Xử lý tình thế nhanh (+10 MP)',
        },
      ],
    },
    COMPLAINT: {
      title: 'Khách Phàn Nàn Chất Lượng & Phục Vụ',
      description: `Khách phản ánh đồ uống nguội ngắt và thái độ phục vụ tại ${bName}!`,
      rootCause: `Nhân viên mới chưa qua đào tạo quy trình kiểm tra nhiệt độ món, đồng thời máy in bill bị kẹt giấy dẫn đến trễ giờ và nhầm lẫn đơn hàng.`,
      witnessQuote: `“Tôi gọi ly đồ uống đợi 25 phút mới có mà mang ra thì nguội tanh, nhân viên lại không một lời xin lỗi!”`,
      solutions: [
        {
          id: 'sol_training_sop',
          title: 'Đào Tạo Chuẩn Phục Vụ & Tặng Voucher Xin Lỗi',
          desc: 'Tập huấn nhân sự quy trình phục vụ 5 sao, tặng mã giảm giá tri ân xoa dịu khách hàng.',
          cost: 300_000,
          mayorPoints: 35,
          fixPermanent: true,
          bonusEffectText: 'Fix triệt để phàn nàn tại tiệm, tăng độ hài lòng (+35 MP)',
        },
        {
          id: 'sol_auto_kitchen_pos',
          title: 'Trang Bị Máy Giữ Nhiệt & Màn Hình Bếp KDS',
          desc: 'Số hóa quản lý order tự động, đảm bảo 100% món ăn thức uống luôn nóng sốt khi giao.',
          cost: 600_000,
          mayorPoints: 50,
          fixPermanent: true,
          bonusEffectText: 'Tự động hóa order, tăng tốc độ phục vụ (+50 MP)',
        },
        {
          id: 'sol_apology_refund',
          title: 'Đổi Món Ngay & Xin Lỗi Trực Tiếp',
          desc: 'Làm lại món mới nóng hổi và xin lỗi trực tiếp để giải quyết bức xúc tại chỗ.',
          cost: 150_000,
          mayorPoints: 10,
          fixPermanent: false,
          bonusEffectText: 'Xoa dịu tại chỗ (+10 MP)',
        },
      ],
    },
    THEFT: {
      title: 'Kẻ Gian Đột Nhập & Nguy Cơ Mất Trộm',
      description: `Kẻ gian cạy cửa đột nhập nhằm vào két tiền mặt tại ${bName}!`,
      rootCause: `Cửa hàng còn giữ thói quen tích trữ nhiều tiền mặt qua đêm thay vì số hóa thanh toán MoMo Merchant QR, ổ khóa cửa cũ dễ bị vô hiệu hóa.`,
      witnessQuote: `“Sáng sớm mở tiệm thấy ổ khóa bị cạy bung, may mà két sắt nặng nên trộm chưa kịp bê đi!”`,
      solutions: [
        {
          id: 'sol_cashless_momo',
          title: 'Chuyển Đổi Số 100% MoMo QR & Két Số Thông Minh',
          desc: 'Triệt tiêu tiền mặt tồn đọng, toàn bộ doanh thu nạp thẳng vào Ví MoMo an toàn 24/7.',
          cost: 350_000,
          mayorPoints: 35,
          fixPermanent: true,
          bonusEffectText: 'Xóa bỏ rủi ro mất cắp tiền mặt vĩnh viễn (+35 MP)',
        },
        {
          id: 'sol_ai_camera',
          title: 'Lắp Camera AI Nhận Diện & Chuông Báo Động Phố',
          desc: 'Camera an ninh nhận diện khuôn mặt tự động kích hoạt còi báo động khi có kẻ lạ đột nhập đêm.',
          cost: 700_000,
          mayorPoints: 50,
          fixPermanent: true,
          bonusEffectText: 'An ninh tối đa toàn khu phố (+50 MP)',
        },
        {
          id: 'sol_new_padlock',
          title: 'Thay Ổ Khóa Cường Lực Mới',
          desc: 'Lắp khóa chống cắt và sửa chữa cánh cửa bị hư hại do kẻ trộm.',
          cost: 200_000,
          mayorPoints: 10,
          fixPermanent: false,
          bonusEffectText: 'Gia cố tạm thời (+10 MP)',
        },
      ],
    },
    STOCKOUT: {
      title: 'Đứt Gãy Chuỗi Cung Ứng Nguyên Liệu',
      description: `Hết sạch nguyên liệu chính vào giờ cao điểm tại ${bName}!`,
      rootCause: `Phụ thuộc vào một mối cung cấp duy nhất ở xa, không có hệ thống cảnh báo tồn kho tối thiểu trước khi cạn hàng.`,
      witnessQuote: `“Khách kéo đến đông nghẹt mà trong bếp hết sạch nguyên liệu chính, phải từ chối khách rất mất uy tín!”`,
      solutions: [
        {
          id: 'sol_local_supplier_network',
          title: 'Ký Kết Mạng Lưới Nhà Cung Ứng Địa Phương',
          desc: 'Thiết lập 3 đối tác cung ứng dự phòng trong bán kính 2km, cam kết giao hàng cấp tốc 15 phút.',
          cost: 350_000,
          mayorPoints: 35,
          fixPermanent: true,
          bonusEffectText: 'Fix vĩnh viễn đứt hàng, nguồn cung luôn ổn định (+35 MP)',
        },
        {
          id: 'sol_smart_inventory_erp',
          title: 'Phần Mềm Quản Lý Tồn Kho Thông Minh MoCity',
          desc: 'Tự động tính toán lượng tiêu thụ và đặt hàng trước khi tồn kho xuống dưới 25%.',
          cost: 650_000,
          mayorPoints: 50,
          fixPermanent: true,
          bonusEffectText: 'Tự động đặt hàng, tối ưu 10% doanh thu (+50 MP)',
        },
        {
          id: 'sol_emergency_restock',
          title: 'Nhập Gấp Một Lô Nguyên Liệu Khẩn Cấp',
          desc: 'Mua lẻ nguyên liệu giá cao tại chợ đầu mối để tiếp tục bán trong ngày.',
          cost: 200_000,
          mayorPoints: 10,
          fixPermanent: false,
          bonusEffectText: 'Chữa cháy tạm thời (+10 MP)',
        },
      ],
    },
  };

  const meta = incidentMeta[type];

  const incident: import('./types').CityIncident = {
    id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    title: meta.title,
    buildingId: targetBuilding.id,
    buildingName: bName,
    description: meta.description,
    rootCause: meta.rootCause,
    witnessQuote: meta.witnessQuote,
    solutions: meta.solutions,
    penaltyPct: 0.30,
    startedAt: Date.now(),
    resolved: false,
  };

  setState({
    ...state,
    activeIncidents: [...active, incident],
  });

  return incident;
}

/**
 * Xử lý sự cố đường phố theo giải pháp cụ thể & fix triệt để nguyên nhân gốc rễ
 */
export function resolveIncident(
  incidentId: string,
  options?: {
    solutionId?: string;
    cost?: number;
    mayorPoints?: number;
    fixPermanent?: boolean;
  }
): {
  ok: boolean;
  cost: number;
  coveredByInsurance: boolean;
  message: string;
  fixedPermanent: boolean;
} {
  const active = state.activeIncidents ?? [];
  const incident = active.find((i) => i.id === incidentId);
  if (!incident) {
    return {
      ok: false,
      cost: 0,
      coveredByInsurance: false,
      message: 'Sự cố không tồn tại.',
      fixedPermanent: false,
    };
  }

  const hasIns = Boolean(state.hasInsurance && (state.insuranceActiveUntilMs ?? 0) > Date.now());
  const selectedCost = options?.cost ?? 500_000;
  const earnedMP = options?.mayorPoints ?? 15;
  const shouldFixPermanent = options?.fixPermanent ?? true;
  const actualCost = hasIns ? 0 : Math.min(state.coins, selectedCost);

  const remainingIncidents = active.filter((i) => i.id !== incidentId);
  const currentFixed = state.fixedIncidents ?? [];
  const nextFixed = shouldFixPermanent && !currentFixed.includes(`${incident.buildingId}:${incident.type}`)
    ? [...currentFixed, `${incident.buildingId}:${incident.type}`]
    : currentFixed;

  const next = {
    ...state,
    coins: Math.max(0, state.coins - actualCost),
    activeIncidents: remainingIncidents,
    fixedIncidents: nextFixed,
    mayorPoints: (state.mayorPoints ?? 100) + earnedMP,
    insuranceClaimsPaid: (state.insuranceClaimsPaid ?? 0) + (hasIns ? selectedCost : 0),
  };

  setState(next);

  const successMessage = hasIns
    ? `🛡️ Bảo Hiểm MoMo chi trả 100% (${selectedCost.toLocaleString('vi-VN')}đ). Đã khắc phục triệt để vấn đề (+${earnedMP} MP)!`
    : shouldFixPermanent
      ? `Đã khắc phục tận gốc nguyên nhân sự cố! Chi phí: ${actualCost.toLocaleString('vi-VN')}đ (+${earnedMP} MP, Không tái diễn).`
      : `Đã xử lý sự cố tạm thời. Chi phí: ${actualCost.toLocaleString('vi-VN')}đ (+${earnedMP} MP).`;

  return {
    ok: true,
    cost: actualCost,
    coveredByInsurance: hasIns,
    message: successMessage,
    fixedPermanent: shouldFixPermanent,
  };
}

/**
 * Trả lời Micro-Quiz tài chính
 */
export function answerMicroQuiz(correct: boolean, rewardVND: number, rewardMP: number): { ok: boolean; earnedCoins: number; earnedMP: number } {
  if (!correct) {
    return { ok: false, earnedCoins: 0, earnedMP: 0 };
  }

  const next = withCoins(
    {
      ...state,
      mayorPoints: (state.mayorPoints ?? 100) + rewardMP,
    },
    rewardVND,
    'GRANT',
  );

  setState(next);
  return { ok: true, earnedCoins: rewardVND, earnedMP: rewardMP };
}

/**
 * Xử lý sự kiện thiên tai/sự cố đường phố: tính toán bồi thường bảo hiểm.
 */
export function triggerHazardEvent(damageCoins: number): {
  coveredAmount: number;
  outOfPocket: number;
  hasInsurance: boolean;
} {
  const hasIns = state.hasInsurance ?? false;
  const { coveredAmount, outOfPocket } = calculateInsuranceCoverage(damageCoins, hasIns);
  const actualDeduct = Math.min(state.coins, outOfPocket);

  const next = {
    ...state,
    coins: Math.max(0, state.coins - actualDeduct),
    workingCapital: Math.max(0, (state.workingCapital ?? state.coins) - actualDeduct),
    insuranceClaimsPaid: (state.insuranceClaimsPaid ?? 0) + coveredAmount,
  };
  setState(
    postLedger(next, { opex: actualDeduct }),
  );

  return { coveredAmount, outOfPocket, hasInsurance: hasIns };
}

/**
 * LUẬT 3: Xử lý rủi ro lừa đảo Bill Photoshop cho 1 cửa hàng.
 */
export function processFraudCheckForBuilding(
  buildingId: string,
  randomRoll?: number,
): { hasAttempt: boolean; blockedByLoa: boolean; lostAmount: number } {
  const node = state.buildings.find((b) => b.id === buildingId);
  if (!node) return { hasAttempt: false, blockedByLoa: false, lostAmount: 0 };

  const rate = nodeYieldBreakdown(node, streetNodes(state)).totalPerSec || 20;

  const result = checkFraudRiskForBuilding(node, rate, randomRoll);
  if (!result.hasFraudAttempt) return { hasAttempt: false, blockedByLoa: result.blockedByLoa, lostAmount: 0 };

  if (result.blockedByLoa) {
    setState({
      ...state,
      fraudBlockedCount: (state.fraudBlockedCount ?? 0) + 1,
    });
    return { hasAttempt: true, blockedByLoa: true, lostAmount: 0 };
  }

  // Bị mất tiền do không có Loa Thần Tài
  const actualLost = Math.min(state.coins, result.lostAmount);
  const next = {
    ...state,
    coins: Math.max(0, state.coins - actualLost),
    workingCapital: Math.max(0, (state.workingCapital ?? state.coins) - actualLost),
    fraudLossCoins: (state.fraudLossCoins ?? 0) + actualLost,
  };
  setState(postLedger(next, { opex: actualLost }));
  return { hasAttempt: true, blockedByLoa: false, lostAmount: actualLost };
}

export function buyLand(): boolean {
  const growCol = state.unlockedRows >= state.unlockedCols;
  const cost: Currencies = {
    coins: landCostCoins(state.unlockedCols, state.unlockedRows),
    gems: 0,
    energy: 0,
    blueprints: 0,
    medals: 0,
  };
  const wallet = spend(state, cost);
  if (!wallet) return false;

  setState(
    postLedger(
      {
        ...state,
        coins: wallet.coins,
        unlockedCols: growCol ? state.unlockedCols + 1 : state.unlockedCols,
        unlockedRows: growCol ? state.unlockedRows : state.unlockedRows + 1,
      },
      // Mua dat la CHI TIEU VON: tao tai san, khong phai chi phi van hanh.
      { capex: cost.coins },
    ),
  );
  return true;
}

export type PlaceResult = 'ok' | 'locked' | 'occupied' | 'level' | 'funds';

export function placeBuilding(col: number, row: number, defId: string): PlaceResult {
  const def = BUILDING_BY_ID[defId];
  if (!def) return 'ok';

  // TRUC TIEN TRINH: cong trinh mo theo BAC DO THI, khong theo cap Thi Truong.
  if (currentCityTier(state).rank < def.unlockAtTier) return 'level';
  if (!isInsideUnlocked(state, col, row)) return 'locked';
  // Đất của thành phố cũng là đất có chủ - không cho người chơi xây chồng lên.
  if (buildingAt(state.buildings, col, row) || buildingAt(state.cityBuildings, col, row)) {
    return 'occupied';
  }

  const wallet = spend(state, { coins: def.costCoins, gems: def.costGems });
  if (!wallet) return 'funds';

  const node: BuildingNode = {
    id: `${defId}_${col}_${row}_${Date.now().toString(36)}`,
    defId,
    col,
    row,
    level: 1,
    starRating: 1,
    lastCollectedAt: Date.now(),
    modules: [],
  };

  // Cong trinh thuong mai sinh chu tiem, cong trinh dan cu sinh dai dien cu dan.
  const archetype = archetypeForBuilding(def.zone, def.costCoins, state.npcs.length);
  const npcs = [...state.npcs];
  if (archetype) {
    const meta = ARCHETYPES[archetype];
    npcs.push({
      id: node.id,
      buildingId: node.id,
      name: npcNameFor(archetype, state.npcs.length),
      archetype,
      role: meta.role,
      trust: meta.startTrust,
      acceptsDigital: false,
      services: [...meta.startServices],
    });
  }

  const nextState: CityState = {
    ...state,
    coins: wallet.coins,
    gems: wallet.gems,
    buildings: [...state.buildings, node],
    npcs,
  };
  nextState.dailyLog = bumpDaily(state, 'built');
  Object.assign(nextState, addMayorXp(nextState, XP_PER_BUILD));
  // Xay moi la chi tieu von - tao cong trinh, khong phai chi phi van hanh.
  setState(postLedger(nextState, { capex: def.costCoins }));
  return 'ok';
}

export type UpgradeResult = 'ok' | 'missing' | 'max' | 'funds';

/**
 * BẬC NGƯỜI CHƠI KHÔNG GATE NĂNG CAP NỮA.
 *
 * Trước đây `maxLevel` thật = `min(def.maxLevel, mayorLevel)`: người chơi
 * xong cấp 8 là khoá cứng toàn bộ nâng cấp, 97% đường XP còn lại không mở
 * nội dung gì - thành ra cấp độ vừa là cột mốc vừa là rào cản, mâu thuẫn với
 * việc hiển thị 2 nhãn level khác nhau ("Cấp Thị Trưởng" và "Cấp Lập Nghiệp").
 *
 * Nay `mayorLevel` thuần túy là chỉ số thành tựu (XP), nâng tới `def.maxLevel`
 * bình đẳng với mọi người chơi. Ngưỡng khó được đẩy sang bậc thành phố
 * (`unlockAtTier`) và giá nâng cấp tăng dần - vẫn giữ độ khó nhưng không
 * khoá nội dung sau một mốc level mơ hồ.
 */

/**
 * So cap toi da nang cap duoc trong MOT LAN bam.
 *
 * `count` den tu UI ("Đột Phá Cấp" tinh san `countToMilestone`, xem
 * `StoreInspectorModal.tsx:72`) nen khong cap thi mot click nhay 5 cap. Hai
 * hau qua: quest `d-nang-cap` (target 3) xong trong 1 click, va `+260 XP`
 * moi cap bi tra thanh mot luot chu khong phai theo thao tac.
 */
export const MAX_UPGRADE_PER_ACTION = 5;

export function upgradeBuilding(col: number, row: number, count = 1): UpgradeResult {
  const node = buildingAt(state.buildings, col, row);
  if (!node) return 'missing';

  const def = BUILDING_BY_ID[node.defId];
  if (!def) return 'missing';
  if (node.level >= def.maxLevel) return 'max';

  const actualCount = Math.min(count, MAX_UPGRADE_PER_ACTION, def.maxLevel - node.level);
  let totalCost = 0;
  for (let i = 0; i < actualCount; i++) {
    totalCost += upgradeCostCoins(def, node.level + i);
  }

  const wallet = spend(state, { coins: totalCost });
  if (!wallet) return 'funds';

  const nextState: CityState = {
    ...state,
    coins: wallet.coins,
    buildings: state.buildings.map((b) =>
      b.id === node.id ? { ...b, level: b.level + actualCount } : b,
    ),
  };
  nextState.dailyLog = bumpDaily(state, 'upgraded', actualCount);
  Object.assign(nextState, addMayorXp(nextState, XP_PER_UPGRADE * actualCount));
  // Nang cap la chi tieu von: nang nang suc chua moi, khong ton tai loi nhuan
  // hang nam - ghi vao P&L se giam sai doanh thu.
  setState(postLedger(nextState, { capex: totalCost }));
  return 'ok';
}

export function installStoreModule(
  col: number,
  row: number,
  moduleId: StoreModuleId,
): UpgradeResult {
  const node = buildingAt(state.buildings, col, row);
  if (!node) return 'missing';
  const mod = MODULE_BY_ID[moduleId];
  if (!mod) return 'missing';

  const currentModules = node.modules ?? [];
  if (currentModules.includes(moduleId)) return 'max';
  if (node.level < mod.unlockLevel) return 'missing';

  const wallet = spend(state, { coins: mod.costCoins });
  if (!wallet) return 'funds';

  const nextBuildings = state.buildings.map((b) =>
    b.id === node.id ? { ...b, modules: [...(b.modules ?? []), moduleId] } : b,
  );

  // Neu lap MoMo QR & Loa Than Tai, chu tiem tu dong nhan thanh toan so
  const nextNpcs = state.npcs.map((npc) => {
    if (npc.buildingId === node.id && moduleId === 'QR_LOA_THAN_TAI') {
      return {
        ...npc,
        acceptsDigital: true,
        trust: clampTrust(npc.trust + 35),
        services: [...new Set([...npc.services, 'QR_PAYMENT' as const])],
      };
    }
    return npc;
  });

  const nextState: CityState = {
    ...state,
    coins: wallet.coins,
    buildings: nextBuildings,
    npcs: nextNpcs,
  };
  Object.assign(nextState, addMayorXp(nextState, 60));
  setState(postLedger(nextState, { capex: mod.costCoins }));
  return 'ok';
}

export function assignStoreManager(col: number, row: number, managerId: string): UpgradeResult {
  const node = buildingAt(state.buildings, col, row);
  if (!node) return 'missing';
  const mgr = MANAGER_BY_ID[managerId];
  if (!mgr) return 'missing';

  const alreadyUnlocked = state.unlockedManagers?.includes(managerId) ?? false;
  let nextCoins = state.coins;
  let nextGems = state.gems;

  if (!alreadyUnlocked) {
    const wallet = spend(state, { coins: mgr.costCoins, gems: mgr.costGems });
    if (!wallet) return 'funds';
    nextCoins = wallet.coins;
    nextGems = wallet.gems;
  }

  const nextUnlocked = alreadyUnlocked
    ? state.unlockedManagers
    : [...(state.unlockedManagers ?? []), managerId];

  // Go bo manager nay khoi cong trinh cu (neu co) va gan vao cong trinh moi
  const nextBuildings = state.buildings.map((b) => {
    if (b.id === node.id) return { ...b, managerId };
    if (b.managerId === managerId) return { ...b, managerId: undefined };
    return b;
  });

  const nextState: CityState = {
    ...state,
    coins: nextCoins,
    gems: nextGems,
    unlockedManagers: nextUnlocked,
    buildings: nextBuildings,
  };
  Object.assign(nextState, addMayorXp(nextState, 75));
  setState(postLedger(nextState, { capex: mgr.costCoins }));
  return 'ok';
}

export function evolveBuildingStar(col: number, row: number): UpgradeResult {
  const node = buildingAt(state.buildings, col, row);
  if (!node) return 'missing';
  const def = BUILDING_BY_ID[node.defId];
  if (!def) return 'missing';
  const currentStar = node.starRating || 1;
  if (currentStar >= 5) return 'max';

  const cost = starUpgradeCost(def, currentStar);
  const wallet = spend(state, { coins: cost.coins, gems: cost.gems });
  if (!wallet) return 'funds';

  const nextState: CityState = {
    ...state,
    coins: wallet.coins,
    gems: wallet.gems,
    buildings: state.buildings.map((b) =>
      b.id === node.id ? { ...b, starRating: currentStar + 1 } : b,
    ),
  };
  nextState.dailyLog = bumpDaily(state, 'starEvolved');
  Object.assign(nextState, addMayorXp(nextState, XP_PER_STAR));
  setState(postLedger(nextState, { capex: cost.coins }));
  return 'ok';
}

/* ── He thong Nhiem Vu Thi Truong (Mayor Quests) ─────────────────── */

export function isQuestCompleted(questId: string, s: CityState): boolean {
  switch (questId) {
    case 'q-name-city':
      return s.hasNamedCity || s.cityName !== 'Đô Thị MoCity';
    case 'q-first-home':
      return s.buildings.some((b) => BUILDING_BY_ID[b.defId]?.zone === 'RESIDENTIAL' && BUILDING_BY_ID[b.defId]?.population > 0);
    case 'q-first-store':
      return s.buildings.some((b) => BUILDING_BY_ID[b.defId]?.zone === 'COMMERCIAL');
    case 'q-install-qr':
      return s.buildings.some((b) => (b.modules ?? []).includes('QR_LOA_THAN_TAI'));
    case 'q-milestone-lv5':
      return s.buildings.some((b) => b.level >= 5);
    case 'q-cinema-tui-than-tai':
      return s.buildings.some((b) => b.defId === 'rap-phim-momo' || b.defId === 'tram-tui-than-tai');
    case 'q-hire-manager':
      return s.buildings.some((b) => !!b.managerId);
    case 'q-star-evolve':
      return s.buildings.some((b) => (b.starRating || 1) >= 2);
    case 'q-two-managers':
      return s.buildings.filter((b) => !!b.managerId).length >= 2;
    case 'q-expand-city':
      return s.buildings.length >= 6 && populationFor(s.buildings) >= 200;

    /* ── Chặng hai ─────────────────────────────────────────────── */
    case 'q-full-street':
      return s.buildings.length >= 12;
    case 'q-three-managers':
      return s.buildings.filter((b) => !!b.managerId).length >= 3;
    case 'q-module-master':
      return s.buildings.reduce((n, b) => n + (b.modules ?? []).length, 0) >= 6;
    case 'q-three-star':
      return s.buildings.some((b) => (b.starRating || 1) >= 3);
    case 'q-level-20':
      return s.buildings.some((b) => b.level >= 20);
    case 'q-streak-7':
      return (s.streak?.best ?? 0) >= 7 || (s.streak?.days ?? 0) >= 7;
    case 'q-tier-6':
      return cityTierFor(populationFor(s.buildings), s.buildings.length).rank >= 6;
    case 'q-landmark':
      return s.buildings.some((b) => BUILDING_BY_ID[b.defId]?.zone === 'LANDMARK');

    /* ── Chặng ba ─────────────────────────────────────────────── */
    case 'q-happiness-85':
      return happinessFor(s.buildings, 0, s.happinessBoost ?? 0) >= 85;
    case 'q-module-12':
      return s.buildings.reduce((n, b) => n + (b.modules ?? []).length, 0) >= 12;
    case 'q-half-debt':
      return Math.max(0, s.playerDebtPrincipal - s.playerDebtPaid) <= s.playerDebtPrincipal / 2;
    case 'q-streak-30':
      return (s.streak?.best ?? 0) >= 30 || (s.streak?.days ?? 0) >= 30;
    case 'q-level-50':
      return s.buildings.some((b) => b.level >= 50);
    case 'q-five-star':
      return s.buildings.some((b) => (b.starRating || 1) >= 5);
    case 'q-full-grid':
      return s.buildings.length >= 46;
    case 'q-tier-8':
      return cityTierFor(populationFor(s.buildings), s.buildings.length).rank >= 8;

    default:
      return false;
  }
}

export function claimQuestReward(questId: string): boolean {
  if (state.claimedQuests?.includes(questId)) return false;
  if (!isQuestCompleted(questId, state)) return false;

  const quest = MAYOR_QUESTS.find((q) => q.id === questId);
  if (!quest) return false;

  let next = withCoins(state, quest.rewardCoins, 'GRANT');
  next = {
    ...next,
    gems: next.gems + quest.rewardGems,
    claimedQuests: [...(state.claimedQuests ?? []), questId],
  };
  Object.assign(next, addMayorXp(next, quest.rewardXp));
  setState(next);
  return true;
}

/* ───────────────────────────── HƯỚNG DẪN ───────────────────────────────── */

/** Bước hướng dẫn hiện tại, `null` khi đã xong hoặc đã bỏ qua. */
export function useTutorialStep(): TutorialStep | null {
  const step = useCity((s) => s.tutorialStep ?? 0);
  const buildings = useCity((s) => s.buildings);
  const flags = useCity((s) => s.tutorialFlags);
  const dailyLog = useCity((s) => s.dailyLog);
  const eventLog = useCity((s) => s.eventLog);
  /*
   * Doc qua selector thay vi goi `currentTutorialStep(state)` mot lan: ham do
   * doc state o module nen khong kich hoat render lai, the huong dan se dung
   * yen sau khi nguoi choi lam xong thao tac.
   */
  return useMemo(() => {
    void buildings;
    void flags;
    void dailyLog;
    void eventLog;
    if (step < 0 || step >= TUTORIAL_STEPS.length) return null;
    return TUTORIAL_STEPS[step];
  }, [step, buildings, flags, dailyLog, eventLog]);
}

/** Bước hiện tại đã hoàn thành chưa. */
export function isTutorialStepDone(s: CityState = state): boolean {
  const step = currentTutorialStep(s);
  return step ? step.done(s) : false;
}

/** Sang bước kế. Hết bước thì đánh dấu xong. */
export function advanceTutorial(): void {
  const i = state.tutorialStep ?? 0;
  if (i < 0) return;
  const tiep = i + 1;
  setState({ ...state, tutorialStep: tiep >= TUTORIAL_STEPS.length ? -1 : tiep });
}

/** Bỏ qua toàn bộ hướng dẫn. */
export function skipTutorial(): void {
  if ((state.tutorialStep ?? 0) < 0) return;
  setState({ ...state, tutorialStep: -1 });
}

/** Chơi lại hướng dẫn từ đầu. */
export function restartTutorial(): void {
  setState({ ...state, tutorialStep: 0, tutorialFlags: [] });
}

/**
 * Đánh dấu một mốc mà chỉ UI mới biết, ví dụ "đã mở Sổ Cái".
 *
 * Tách khỏi `advanceTutorial`: đánh dấu mốc KHÔNG tự sang bước. Người chơi
 * vẫn phải đọc phần giải thích rồi tự bấm Tiếp, nếu không thì bước trôi qua
 * trước khi họ kịp nhìn.
 */
export function markTutorialFlag(flag: string): void {
  const cu = state.tutorialFlags ?? [];
  if (cu.includes(flag)) return;
  setState({ ...state, tutorialFlags: [...cu, flag] });
}

export function resetCity(): void {
  try {
    localStorage.removeItem(storageKeyFor(boundPlayerId));
  } catch {
    // bo qua
  }
  setState(createInitialState());
}

/* ── Sao luu / khoi phuc (khong co server, chi localStorage) ─────── */

export const SAVE_FILE_VERSION = STATE_VERSION;

/**
 * Xuất thành phố ra chuỗi JSON để người chơi tự sao lưu.
 * Toàn bộ game state nằm trong `localStorage` và KHÔNG đồng bộ qua thiết bị,
 * nên đây là cách duy nhất để không mất thành phố khi xóa cookie.
 */
export function exportCitySave(): string {
  return JSON.stringify({ ...state, pendingOffline: null }, null, 2);
}

export function citySaveBytes(): number {
  return new Blob([JSON.stringify(state)]).size;
}

export type ImportResult = 'ok' | 'invalid' | 'incompatible';

/**
 * Nạp lại thành phố từ chuỗi JSON đã export.
 *
 * Chạy qua `normalizeStoredState` nên vẫn giữ được lớp migration: file save
 * cũ hơn vẫn nâng cấp được, file từ phiên bản mới hơn thì từ chối thay vì
 * ghi đè bằng dữ liệu mà code hiện tại không hiểu.
 */
export function importCitySave(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return 'invalid';
  }
  if (typeof parsed !== 'object' || parsed === null) return 'invalid';

  const version = (parsed as Partial<CityState>).version;
  if (typeof version !== 'number') return 'invalid';
  if (version > STATE_VERSION) return 'incompatible';

  const next = normalizeStoredState(raw);
  next.pendingOffline = null;
  next.lastSeenAt = Date.now();
  // Save mới về = tích lũy khách phải bắt đầu lại từ 0, nếu không thì số khách
  // của lần chạy trước vẫn còn trong bộ đếm và sinh ra đơn vô căn cứ.
  resetArrivalAccumulator();
  setState(next);
  return 'ok';
}

export interface CityDerived extends FlowBreakdown {
  rate: number;
  happiness: number;
  /**
   * Bảng so sánh với chính mình 7 ngày trước.
   *
   * KHÔNG phải bảng xếp hạng: game không có dữ liệu về người chơi khác, nên
   * "so với người khác" là một con số bịa. Đây là áp lực thật vì chính người
   * chơi biết mình sắp làm nhiều hơn hay ít hơn.
   */
  weekCompare: WeekComparison;
  /** Số phần tư bảo vệ chuỗi ngày còn lại. */
  streakShields: number;
  population: number;
  taxMultiplier: number;
  landCost: number;
  capacity: number;
  used: number;
  /** Du no hien tai. */
  debt: number;
  /** Tran vay toi da theo kha nang tra no (boi so EBIT). */
  debtCeiling: number;
  /** Con vay them duoc bao nhieu. */
  loanHeadroom: number;
  /**
   * He so bao phu lai vay = EBIT / lai vay. Duoi `COVERAGE_WARNING_AT` la
   * vung nguy hiem: lai an gan het loi nhuan.
   */
  interestCoverage: number;
  /** Điểm Tin Cậy MoMo (300 - 850) */
  trustScore: number;
  /** Hệ số an toàn dòng tiền lưu động (> 2.0: Tốt, < 1.0: Nguy hiểm) */
  cashflowRatio: number;
  /** Quỹ Vận Hành Quán */
  workingCapital: number;
  /** Ví Tiêu Dùng Cá Nhân của Thị Trưởng */
  personalWealth: number;
  /** Đã trang bị Bảo Hiểm MoMo */
  hasInsurance: boolean;
  /** Số dư sinh lời Túi Thần Tài */
  tuiThanTaiBalance: number;
  /** Ngày đáo hạn nợ (nếu có) */
  loanDueDay: string;
  /** Số lần chặn đứng bill giả */
  fraudBlockedCount: number;
  /** Thất thoát do bill giả */
  fraudLossCoins: number;
}

export function setTimeOfDay(tod: TimeOfDay): void {
  state = { ...state, timeOfDay: tod };
  emit();
  schedulePersist();
}

export function cycleTimeOfDay(): TimeOfDay {
  const ORDER: TimeOfDay[] = ['DAY', 'SUNSET', 'NIGHT', 'DAWN'];
  const cur = state.timeOfDay ?? 'DAY';
  const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
  setTimeOfDay(next);
  return next;
}

export function setWeather(weather: WeatherType): void {
  const isFlooded = weather === 'FLOOD' ? true : state.isFlooded && weather === 'RAIN';
  state = { ...state, weather, isFlooded };
  emit();
  schedulePersist();
}

export function cycleWeather(): WeatherType {
  const ORDER: WeatherType[] = ['SUNNY', 'RAIN', 'FLOOD', 'STORM'];
  const cur = state.weather ?? 'SUNNY';
  const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
  setWeather(next);
  return next;
}

/**
 * Bật/tắt trạng thái ngập lụt cục bộ trên toàn tuyến đường.
 * Khi bị ngập lụt, nếu thành phố chưa trang bị Gói Bảo Hiểm Toàn Diện MoMo,
 * nước triều cường sẽ gây hư hại tài sản và hàng hóa (kích hoạt trừ tiền rủi ro).
 */
export function toggleFlood(forceStatus?: boolean): {
  isFlooded: boolean;
  damageResult?: { coveredAmount: number; outOfPocket: number; hasInsurance: boolean };
} {
  const nextFlooded = forceStatus !== undefined ? forceStatus : !state.isFlooded;
  let damageResult: { coveredAmount: number; outOfPocket: number; hasInsurance: boolean } | undefined;

  if (nextFlooded) {
    // Thiệt hại do triều cường / ngập lụt cục bộ: 1.500.000đ
    damageResult = triggerHazardEvent(1_500_000);
  }

  state = {
    ...state,
    isFlooded: nextFlooded,
    weather: nextFlooded ? 'FLOOD' : (state.weather === 'FLOOD' ? 'SUNNY' : state.weather),
  };
  emit();
  schedulePersist();

  return { isFlooded: nextFlooded, damageResult };
}

/**
 * Selector phai tra ve primitive hoac reference co dinh (mang/object trong state).
 * Tra ve object tao moi moi lan se lam useSyncExternalStore loop vo han.
 */
/**
 * Da nap thanh pho tu localStorage chua. `false` o server render va cho den
 * khi `hydrateCity` chay xong.
 */
export function useCityHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => cityHydrated,
    () => false,
  );
}

/**
 * Doc trang thai hien tai, dung cho consumer khong phai React (analytics,
 * the share card, kiem thu). Component nen dung `useCity` de theo subscribe.
 */
/**
 * Nhà của thành phố (NPC) tại ô `[col, row]`, hoặc `undefined` nếu ô đó là
 * đất trống hoặc tiệm của người chơi.
 *
 * UI cần hàm này riêng vì `buildingAt(state.buildings, ...)` chỉ tra tài
 * sản người chơi - ô nhà thành phố trả về `undefined`, mà nếu cứ thế coi là
 * "đất trống" thì bấm vào nhà thành phố lại mở tab Thuê & Khai Trương.
 */
export function cityBuildingAt(col: number, row: number): BuildingNode | undefined {
  return buildingAt(state.cityBuildings, col, row);
}

/**
 * Phố đầy đủ = tài sản người chơi + nhà của thành phố (NPC).
 *
 * DÙNG CHO MỘT VIỆC DUY NHẤT: quét hàng xóm khi tính năng suất
 * (`nodeYieldBreakdown` / `orderValueFor`). Nhà thành phố nằm cạnh tiệm thì
 * tiệm vẫn được cộng liên kế, đúng như thật - hàng xóm định giá trị vị trí.
 *
 * Mọi con số tiền bạc khác (cầu/cung, hạnh phúc, thu thụ động, bậc thành
 * phố, nhiệm vụ, số tiệm) PHẢI đọc `state.buildings` trực tiếp, không đọc
 * mảng này. Thành phố không tạo ra đồng nào cho người chơi.
 */
export function streetNodes(s: CityState): BuildingNode[] {
  return s.cityBuildings?.length ? [...s.buildings, ...s.cityBuildings] : s.buildings;
}

export function getCityState(): CityState {
  return state;
}

export function useCity<T>(selector: (s: CityState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

const EMPTY_RELICS: string[] = [];
const EMPTY_SNAPSHOTS: DailySnapshot[] = [];
const EMPTY_QUEUES: ShopQueue[] = [];

/**
 * Suc chua (so khach) cua tung tiem THEO HANG CHO THAT - thay cho
 * `currentShopQueue()` doc tu `liveShopQueue` (bien module-scope o
 * `city-calculator.ts`, chi do nhan vat tren pho tu dem roi ghi tay vao).
 *
 * `flowFor` dung so nay de tinh crowding/lost sales, va `cityMood` dung de
 * quyet dinh NPC co than van "khach bo hang" khong - ca hai PHAI doc dung
 * hang cho nguoi choi dang bam, khong phai mot con so trang tri rieng.
 */
function realShopQueueCounts(queues: ShopQueue[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const q of queues) map[q.shopId] = q.arrivedAt.length;
  return map;
}

export function useCityDerived(): CityDerived {
  const buildings = useCity((s) => s.buildings);
  const cityBuildings = useCity((s) => s.cityBuildings);
  const npcs = useCity((s) => s.npcs);
  const mayorLevel = useCity((s) => s.mayorLevel);
  const coins = useCity((s) => s.coins);
  const unlockedCols = useCity((s) => s.unlockedCols);
  const unlockedRows = useCity((s) => s.unlockedRows);
  const equippedRelics = useCity((s) => s.equippedRelics ?? EMPTY_RELICS);
  const lastEngagedAt = useCity((s) => s.lastEngagedAt);
  const happinessBoost = useCity((s) => s.happinessBoost);
  /**
   * Moc thoi gian cua tick dang chay. Dung lam `now` de khong goi `Date.now()`
   * trong render (React Compiler bat loi), va dung y nhau voi thoi diem ma
   * `tickIdle` vua cong tien - nen suy giam hanh phuc buoc theo nhip game.
   */
  const lastSeenAt = useCity((s) => s.lastSeenAt);
  const debt = useCity((s) => s.debt ?? 0);
  const trustScoreRaw = useCity((s) => s.trustScore);
  const workingCapital = useCity((s) => s.workingCapital ?? s.coins);
  const personalWealth = useCity((s) => s.personalWealth ?? 0);
  const hasInsurance = useCity((s) => s.hasInsurance ?? false);
  const tuiThanTaiBalance = useCity((s) => s.tuiThanTaiBalance ?? 0);
  const loanDueDay = useCity((s) => s.loanDueDay ?? '');
  const lateFeeCount = useCity((s) => s.loanLateFeeCount ?? 0);
  const fraudBlockedCount = useCity((s) => s.fraudBlockedCount ?? 0);
  const fraudLossCoins = useCity((s) => s.fraudLossCoins ?? 0);
  /*
   * Field cho bảng so sánh 7 ngày.
   *
   * KHÔNG gộp thành một selector trả object mới: `useSyncExternalStore` so
   * sánh bằng tham chiếu, nên object tạo mới ở mỗi lần gọi là loop vô hạn
   * (xem ghi chú ngay dưới). Mỗi field đọc riêng, đều là reference có sẵn
   * trong state hoặc hằng rỗng.
   */
  const dailySnapshots = useCity((s) => s.dailySnapshots ?? EMPTY_SNAPSHOTS);
  const ledgerDay = useCity((s) => s.ledgerDay);
  const streakShields = useCity((s) => s.streak?.shields ?? 0);
  const shopQueues = useCity((s) => s.shopQueues ?? EMPTY_QUEUES);

  return useMemo(() => {
    let relicYieldBonus = 0;
    let relicHappyBonus = 0;
    for (const rId of equippedRelics) {
      const def = INVENTORY_BY_ID[rId];
      if (def) {
        relicYieldBonus += def.passiveYieldBonus ?? 0;
        relicHappyBonus += def.passiveHappinessBonus ?? 0;
      }
    }

    /**
     * `idleMs` phai dung moc thoi gian thuc te, khong phai thoi diem render.
     * Memo nay chay lai moi giay vi `coins` doi, nen suy giam hanh phuc theo
     * thoi gian van chay dung nhip.
     */
    const now = lastSeenAt;
    const happiness = clampHappiness(
      happinessFor(buildings, now - lastEngagedAt, happinessBoost) + relicHappyBonus,
    );
    /**
     * Bảo Vật phải được truyền VÀO `flowFor`, không nhân ngoài. Nhân ngoài thì
     * HUD hiện doanh thu đã × (1 + bonus) còn `tickIdle` thực sự chỉ cộng
     * `flow.revenue` chưa nhân - người chơi thấy 1,9× nhưng nhận 1×.
     */
    const flow = flowFor(buildings, npcs, mayorLevel, coins, {
      idleMs: now - lastEngagedAt,
      happinessBoost,
      relicBonus: relicYieldBonus,
relicHappinessBonus: relicHappyBonus,
      debt,
      shopQueue: realShopQueueCounts(shopQueues),
      street: [...buildings, ...cityBuildings],
    });
    const debtCeiling = debtCeilingFor(flow.operatingIncome);
    const trustScore = calculateMayorTrustScore(
      trustScoreRaw ?? 650,
      debt,
      debtCeiling,
      lateFeeCount,
      happiness,
    );
    const cashflowRatio = calculateCashflowRatio(workingCapital, flow.opex, flow.interestExpense);

    const danSo = populationFor(buildings);

    /*
     * `ledgerDay` là số của ngày ĐANG CHẠY, chưa đóng. Đối chiếu nó với bản
     * ghi của ngày đã qua là so sánh công bằng: cùng một khoảng thời gian,
     * cùng một cách tính.
     */
    const danSoHomNay = danSo;
  const weekCompare = weekComparison(dailySnapshots, {
    netIncome: ledgerDay?.netIncome ?? 0,
    revenue: ledgerDay?.grossRevenue ?? 0,
    danSo: danSoHomNay,
    soCongTrinh: buildings.length,
    mayorLevel,
  });

    return {
      ...flow,
      rate: flow.revenue,
      debt,
      debtCeiling,
      loanHeadroom: buildings.some((b) => b.defId === 'ngan-hang-so') ? Math.max(0, debtCeiling - debt) : 0,
      interestCoverage: interestCoverage(flow.operatingIncome, flow.interestExpense),
      happiness,
      weekCompare,
      streakShields,
      population: danSo,
      taxMultiplier: taxMultiplierFromHappiness(happiness),
      landCost: landCostCoins(unlockedCols, unlockedRows),
      capacity: unlockedCols * unlockedRows,
      used: buildings.length,
      trustScore,
      cashflowRatio,
      workingCapital,
      personalWealth,
      hasInsurance,
      tuiThanTaiBalance,
      loanDueDay,
      fraudBlockedCount,
      fraudLossCoins,
    };
  }, [
    buildings,
    cityBuildings,
    npcs,
    mayorLevel,
    coins,
    unlockedCols,
    unlockedRows,
    equippedRelics,
    lastEngagedAt,
    happinessBoost,
    lastSeenAt,
    debt,
    trustScoreRaw,
    workingCapital,
    personalWealth,
    hasInsurance,
    tuiThanTaiBalance,
    loanDueDay,
    lateFeeCount,
    fraudBlockedCount,
    fraudLossCoins,
    dailySnapshots,
    ledgerDay,
    streakShields,
    shopQueues,
  ]);
}

/* ───────────────────────── NHIỆM VỤ NGÀY & BẬC THÀNH PHỐ ───────────────── */

export interface DailyQuestView {
  def: import('./mock-city-data').DailyQuestDef;
  progress: number;
  done: boolean;
  claimed: boolean;
}

/** Tiến độ nhiệm vụ ngày hôm nay. Sang ngày mới là bộ đếm về 0. */
export function dailyQuestViews(now = Date.now()): DailyQuestView[] {
  const log = state.dailyLog?.day === todayKey(now) ? state.dailyLog : emptyDailyLog(now);
  return DAILY_QUESTS.map((def) => {
    const progress = Math.min(def.target, log[def.counter]);
    return {
      def,
      progress,
      done: progress >= def.target,
      claimed: log.claimed.includes(def.id),
    };
  });
}

export function claimDailyQuest(questId: string, now = Date.now()): boolean {
  const def = DAILY_QUESTS.find((q) => q.id === questId);
  if (!def) return false;

  const log = state.dailyLog?.day === todayKey(now) ? state.dailyLog : emptyDailyLog(now);
  if (log.claimed.includes(questId)) return false;
  if (log[def.counter] < def.target) return false;

  let next = withCoins(state, def.rewardCoins, 'GRANT');
  next = {
    ...next,
    gems: next.gems + def.rewardGems,
    dailyLog: { ...log, claimed: [...log.claimed, questId] },
  };
  Object.assign(next, addMayorXp(next, def.rewardXp));
  setState(next);
  return true;
}

/** Bậc thành phố hiện tại, suy từ dân số và số công trình. */
export function currentCityTier(s: CityState = state) {
  return cityTierFor(populationFor(s.buildings), s.buildings.length);
}

/**
 * Nhận thưởng cho các bậc vừa đạt. Trả về danh sách bậc đã trao thưởng để UI
 * báo. Duyệt từng bậc một nên nhảy nhiều bậc cùng lúc vẫn nhận đủ.
 */
export function claimCityTierRewards(): import('./mock-city-data').CityTierDef[] {
  const reached = currentCityTier();
  const claimedRank = Math.max(1, state.cityTierClaimed ?? 1);
  if (reached.rank <= claimedRank) return [];

  const moi = CITY_TIERS.filter((t) => t.rank > claimedRank && t.rank <= reached.rank);
  let next = state;
  for (const t of moi) {
    next = withCoins(next, t.rewardCoins, 'GRANT');
    next = { ...next, gems: next.gems + t.rewardGems };
    Object.assign(next, addMayorXp(next, t.rewardXp));
  }
  setState({ ...next, cityTierClaimed: reached.rank });
  return moi;
}

/**
 * Han giay giua hai luot hoi chuyen cu dan.
 *
 * Khong co han nay thi nguoi choi spam click: `d-tro-chuyen` (target 5) xong
 * trong 5 giay, va - nghiem trong hon - moi click lai reset `lastEngagedAt`,
 * la moc dem cua `HAPPINESS_DECAY_GRACE_MS`. Click lien tuc = giu hanh phuc
 * 100% va thue toi da 1.6x ma khong ton mot Xu nao.
 */
export const TALK_COOLDOWN_MS = 60 * 1000;

/**
 * Ghi nhan mot luot hoi chuyen cu dan tren pho, phuc vu nhiem vu ngay.
 *
 * KHONG reset `lastEngagedAt`: xu ly chuyen PHO (`resolveRequest` /
 * `resolveEvent`) moi la thu nghiem huong hanh phuc. Chat vui tren pho phai
 * ton cong, nhung khong duoc tinh tien cho nguoi choi.
 *
 * @return `true` neu dem duoc, `false` neu con trong han.
 */
export function recordCitizenTalk(): boolean {
  const now = Date.now();
  if (now - (state.lastTalkAt ?? 0) < TALK_COOLDOWN_MS) return false;
  setState({
    ...state,
    dailyLog: bumpDaily(state, 'talked', 1, now),
    lastTalkAt: now,
  });
  return true;
}

/* ==========================================================================
 * NARRATIVE GAME STORY & WEALTH MATRIX STORE ACTIONS
 * ========================================================================== */

export function resolveOpportunityChoiceStore(choiceId: string): void {
  const cardId = state.activeOpportunityCardId;
  if (!cardId) return;
  const card = OPPORTUNITY_CARDS.find((c) => c.id === cardId);
  if (!card) return;
  const choice = card.choices.find((c) => c.id === choiceId);
  if (!choice) return;

  const cost = choice.costCoins;
  let nextCoins = state.coins;
  let nextDebt = state.debt;

  if (cost > 0) {
    if (nextCoins < cost) return;
    nextCoins -= cost;
  } else if (cost < 0) {
    nextCoins += Math.abs(cost);
  }

  if (choice.borrowAmountCoins) {
    nextDebt += choice.borrowAmountCoins;
    nextCoins += choice.borrowAmountCoins;
  }

  const nextHappiness = clampHappiness((state.happinessBoost ?? 0) + choice.financialImpact.happinessDelta);

  let nextAct = state.currentAct ?? 'ACT_1_STARTER';
  if (card.act === 'ACT_1_STARTER') nextAct = 'ACT_2_CASHFLOW';
  else if (card.act === 'ACT_2_CASHFLOW') nextAct = 'ACT_3_LEVERAGE';
  else if (card.act === 'ACT_3_LEVERAGE') nextAct = 'ACT_4_BLACK_SWAN';
  else if (card.act === 'ACT_4_BLACK_SWAN') nextAct = 'ACT_5_ESTATE';

  const nextCard = OPPORTUNITY_CARDS.find((c) => c.act === nextAct && c.id !== cardId);

  setState({
    ...state,
    coins: nextCoins,
    debt: nextDebt,
    happinessBoost: nextHappiness,
    currentAct: nextAct,
    activeOpportunityCardId: nextCard ? nextCard.id : null,
  });
}

export function grantNpcLoanStore(npcId: string, amount: number): void {
  const ledgers = state.npcMicroLedgers ?? INITIAL_NPC_LEDGERS;
  const targetIndex = ledgers.findIndex((n) => n.npcId === npcId);
  if (targetIndex === -1 || state.coins < amount) return;

  const updatedLedger = grantNpcLoan(ledgers[targetIndex], amount);
  const nextLedgers = [...ledgers];
  nextLedgers[targetIndex] = updatedLedger;

  setState({
    ...state,
    coins: state.coins - amount,
    npcMicroLedgers: nextLedgers,
  });
}

export function investNpcEquityStore(npcId: string, amount: number, pct: number): void {
  const ledgers = state.npcMicroLedgers ?? INITIAL_NPC_LEDGERS;
  const targetIndex = ledgers.findIndex((n) => n.npcId === npcId);
  if (targetIndex === -1 || state.coins < amount) return;

  const updatedLedger = investNpcEquity(ledgers[targetIndex], amount, pct);
  const nextLedgers = [...ledgers];
  nextLedgers[targetIndex] = updatedLedger;

  setState({
    ...state,
    coins: state.coins - amount,
    npcMicroLedgers: nextLedgers,
  });
}

export function depositTuiThanTaiStore(amount: number): void {
  if (state.coins < amount || amount <= 0) return;
  const currentOs = state.momoOSState ?? INITIAL_MOMO_FINANCIAL_OS;
  const nextOs = depositTuiThanTai(currentOs, amount);
  setState({
    ...state,
    coins: state.coins - amount,
    momoOSState: nextOs,
  });
}

export function withdrawTuiThanTaiStore(amount: number): void {
  const currentOs = state.momoOSState ?? INITIAL_MOMO_FINANCIAL_OS;
  const { nextState: nextOs, withdrawnCoins } = withdrawTuiThanTai(currentOs, amount);
  if (withdrawnCoins <= 0) return;
  setState({
    ...state,
    coins: state.coins + withdrawnCoins,
    momoOSState: nextOs,
  });
}

/**
 * Dinh gia mot cong trinh theo GIA XAY LAI tai cap/sao hien tai.
 *
 * Cach cu nhan `level x 50 trieu` la so lam: mot thap landmark cap 50 thi gia
 * xay lai hang ty ma van duoc ghi 2.5 ty, va nguoc lai quan caphe cap 1 chi
 * 5 trieu ma cung duoc 50 trieu. Ty le No/Tai san tinh tu do thi vo nghia.
 *
 * `upgradeCostCoins` tra ve chi phi len cap TIEP THEO nen phai cong dan tu
 * cap 1 den cap hien tai; sao cung vay voi `starUpgradeCost`.
 */
export function buildingValuation(b: BuildingNode): number {
  const def = BUILDING_BY_ID[b.defId];
  if (!def) return 0;
  let total = def.costCoins;
  for (let lv = 1; lv < Math.max(1, b.level); lv++) total += upgradeCostCoins(def, lv);
  const stars = Math.max(1, b.starRating || 1);
  for (let star = 1; star < stars; star++) total += starUpgradeCost(def, star).coins;
  return total;
}

const SECONDS_PER_MONTH = 30 * 86_400;

/**
 * WEALTH MATRIX tu TRANG THAI THAT.
 *
 * Truoc day ham nay dung so mau (yield 30 trieu/thang, opex 10 trieu/thang),
 * hau qua: `debtToAsset` luon ~0 vi `takeLoan` bi tat nen `debt` = 0, cashflow
 * luon duong -> evaluateEndingProfile luon tra ve `RESILIENT_ESTATE` 95/100.
 * So da vao man hinh ket thuc thi diem so khong con y nghia.
 *
 * Gio lay tu `flowFor` (cung cong thuc voi P&L trong tick) va gia xay lai that:
 * - `grossRevenue` = doanh thu goc moi giay x SECONDS_PER_MONTH.
 * - `cogs + opex + badDebt` = chi phi van hanh. KHONG gom `interestExpense` vi
 *   `calculateWealthMatrix` su dung rieng `totalDebtCoins x 1.5%/thang` - gom
 *   vao la tinh lai 2 lan.
 *
 * Test: `lib/mocity/wealth-metrics.test.ts`
 */
export function wealthMetricsFor(s: CityState): WealthMatrixMetrics {
  const opts = flowOptsFor(s);
  const flow = flowFor(s.buildings, s.npcs, s.mayorLevel, s.coins, {
    ...opts,
    // Bao ve khi save cu thieu lastEngagedAt: NaN thi toan bo 7 chi so bi NaN.
    idleMs: Number.isFinite(s.lastEngagedAt) ? opts.idleMs : 0,
  });
  return calculateWealthMatrix({
    playerCoins: s.coins,
    totalDebtCoins: s.debt,
    monthlyBuildingYieldCoins: flow.grossRevenue * SECONDS_PER_MONTH,
    monthlyBuildingOpexCoins: (flow.cogs + flow.opex + flow.badDebt) * SECONDS_PER_MONTH,
    totalBuildingValuationCoins: s.buildings.reduce((acc, b) => acc + buildingValuation(b), 0),
    happinessIndex: happinessFor(s.buildings, 0, s.happinessBoost ?? 0),
    npcLedgers: s.npcMicroLedgers ?? INITIAL_NPC_LEDGERS,
    momoOS: s.momoOSState ?? INITIAL_MOMO_FINANCIAL_OS,
  });
}

export function getWealthMatrixMetricsStore(): WealthMatrixMetrics {
  return wealthMetricsFor(state);
}

export function getEndingEvaluationStore(): EndingEvaluation {
  const metrics = getWealthMatrixMetricsStore();
  return evaluateEndingProfile(metrics);
}

