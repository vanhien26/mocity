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
import {
  buildingAt,
  coinsPerSecond,
  flowFor,
  type FlowOptions,
  debtCeilingFor,
  interestPerSecond,
  interestCoverage,
  clampHappiness,
  HAPPINESS_BOOST_CAP,
  happinessFor,
  isInsideUnlocked,
  landCostCoins,
  offlineCoins,
  populationFor,
  taxMultiplierFromHappiness,
  type FlowBreakdown,
  checkFraudRiskForBuilding,
  calculateMayorTrustScore,
  calculateCashflowRatio,
  calculateTuiThanTaiInterest,
  calculateInsuranceCoverage,
  currentShopQueue,
  overloadedShopCount,
  type CityCondition,
  type FraudCheckResult,
  nodeYieldBreakdown,
} from './city-calculator';

export { publishShopQueue } from './city-calculator';
import { CITY_EVENTS, EVENT_BY_ID, REQUEST_BY_ID } from './dialogue-data';
import { eligibleRequestFor } from './dialogue-engine';
import { weekComparison, type WeekComparison } from './comparison';
import { TUTORIAL_STEPS, currentTutorialStep, type TutorialStep } from './tutorial';
import { ARCHETYPES, DIGITAL_TRUST_THRESHOLD, archetypeForBuilding, npcNameFor } from './npc-data';
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
} from './types';

/**
 * Tien to khoa luu tru. `/mocity` bay gio bat buoc dang nhap (middleware), nen
 * save duoc gan theo tai khoan: khong thi hai nguoi dung lao tai khoan tren
 * cung mot may se ke thua toan bo thanh pho cua nhau (cung Xu, cung ten Tho).
 */
const STORAGE_KEY_PREFIX = 'momo_city_v9';
const STATE_VERSION = 9;
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
const OFFLINE_MIN_MS = 60 * 1000;
const PERSIST_DEBOUNCE_MS = 250;
/** Toi da 3 dau `!` cung luc - nhieu hon se thanh nhieu loan tren ban do. */
const MAX_ACTIVE_REQUESTS = 3;
const REQUEST_INTERVAL_MS = 25 * 1000;
const EVENT_INTERVAL_MS = 35 * 1000;

/**
 * Giá + thời lượng Giờ Vàng x2 doanh thu.
 *
 * Giá nâng từ 2 lên 5...
 *
 * KHÔNG CÒN DÙNG NỮA. Giờ Vàng (Fever x2 doanh thu) đã bỏ cùng toàn bộ hệ
 * Bảo Vật/buff - không còn nút bấm, không còn vật phẩm nào kích hoạt được.
 * `feverUntil`/`feverEverUsed`/`feverUsedToday`/`feverDay` vẫn còn trong
 * `CityState` CHỈ để save cũ đọc được mà không vỡ migration; không có
 * đường nào ghi giá trị mới vào các field đó nữa nên chúng tự nhiên bất
 * động. `isFever` trong `flowFor` vẫn là tham số hợp lệ - các test gọi
 * trực tiếp hàm thuần này để kiểm chứng công thức nhân đôi, tách biệt khỏi
 * việc trò chơi có đường nào bật nó hay không.
 */

/**
 * Toi da so su kien toan pho Thieu Truong duoc giai quyet trong mot ngay.
 * Day la chot chong arbitrage: neu khong co han, nguoi choi co the bam lien
 * "Chuyen Pho" de spawn event, chon phuong an hien viet (tra Xu nho, nhan vat
 * pham dat gia tri lon) va lui ve loi thu hieu hon.
 */
/**
 * Chuyen Pho tu dong hien moi 2-3 phut nen tran 3 luot/ngay se khoa tinh nang
 * lai sau chua toi 10 phut choi. Event chu yeu TRU Xu doi lay uy tin chu khong
 * phai nguon thu, nen noi tran khong tao lo hong kinh te.
 */
const MAX_EVENTS_PER_DAY = 30;

/**
 * Diem khoi dau. O version <= 3 game cap toi da 1.000.000 Xu / 500 Kim Cuong
 * ngay tu dau va con "ban" lai nhu vay moi lan hydrate, khong co cong trinh
 * nao dat duoc nguong chi phi do. V4 dat lai so khoi tao dung do kinh te:
 * bat dau o Tho Tier-1 (60 - 240 Xu) va tien chi ton tai o dia phuong.
 */
const STARTING_COINS = 600;
const STARTING_GEMS = 20;

/** Khoa ngay theo gio dia phuong, dung de dem han su kiet 24h. */
function todayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

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

function createInitialState(): CityState {
  const now = Date.now();
  return {
    version: STATE_VERSION,
    mayorName: 'Thị Trưởng MoMo',
    cityName: 'Đô Thị MoCity',
    hasNamedCity: false,
    mayorGender: 'female',
    mayorLevel: 1,
    mayorXp: 0,
    gridSize: 10,
    unlockedCols: 4,
    unlockedRows: 4,
    buildings: [],
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
export const IDLE_XP_CAP = 4;
/**
 * Tran XP nhan roi MOI NGAY.
 *
 * Tran theo tick khong du. `IDLE_XP_CAP = 4`/giay nghe nho, nhung nhan voi
 * 86.400 giay la 345.600 XP - bang 92% toan bo duong cong cap 1 -> 50
 * (377.300 XP). Tuc la chi can de may chay dung mot ngay la gan cham cap toi
 * da, trong khi muc tieu thiet ke la len cap phai den tu hanh dong.
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
  merged.buildings = Array.isArray(migrated.buildings) ? migrated.buildings : [];
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

  /* Save cu khong co no - mac dinh khong vay. */
  merged.debt = Number.isFinite(migrated.debt) ? Math.max(0, migrated.debt) : 0;
  merged.totalInterestPaid = Number.isFinite(migrated.totalInterestPaid)
    ? Math.max(0, migrated.totalInterestPaid)
    : 0;
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
    const earned = offlineCoins(
      coinsPerSecond(merged.buildings, merged.npcs, merged.mayorLevel, merged.coins, {
        happinessBoost: merged.happinessBoost,
      }),
      capped,
    );
    merged.pendingOffline = { coins: Math.min(500_000, Math.max(0, earned)), elapsedMs: capped };
  } else {
    merged.pendingOffline = null;
  }

  merged.lastSeenAt = now;
  if (!merged.pendingEvent && resolvedEventsToday(merged, now) < MAX_EVENTS_PER_DAY) {
    /*
     * Quay vong theo thoi gian thay vi `Math.random()`.
     *
     * Người chơi hay reload game khi vừa vào. Random ở đây nghĩa là mỗi lần
     * reload một sự kiện, và người chơi chỉ cần reload cho tới khi gặp sự kiện
     * dễ thì giải, còn lại thì đóng app luôn.
     */
    const eligible = eligibleCityEvents(merged, now);
    if (eligible.length > 0) {
      const script = eligible[Math.floor(now / EVENT_INTERVAL_MS) % eligible.length];
      merged.pendingEvent = { id: `${script.id}_${now.toString(36)}`, scriptId: script.id, createdAt: now };
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

export function claimOffline(): void {
  if (!state.pendingOffline) return;
  const reward = Number.isFinite(state.pendingOffline.coins)
    ? Math.max(0, state.pendingOffline.coins)
    : 0;
  const cleared: CityState = {
    ...state,
    pendingOffline: null,
    lastSeenAt: Date.now(),
  };
  setState(reward > 0 ? withCoins(cleared, reward, 'OPERATING') : cleared);
}

export function dismissOffline(): void {
  if (!state.pendingOffline) return;
  setState({ ...state, pendingOffline: null, lastSeenAt: Date.now() });
}

export const RENAME_COST_GEMS = 5;

export function renameCityAndMayor(mayorName: string, cityName: string, mayorGender?: import('./types').MayorGender): 'ok' | 'funds' {
  const cleanMayor = mayorName.trim() || state.mayorName || 'Thị Trưởng MoMo';
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

export function completeMayorLogin(mayorName: string, cityName: string, bonusCoins = 1_000, mayorGender?: import('./types').MayorGender): number {
  const cleanMayor = mayorName.trim() || state.mayorName || 'Thị Trưởng MoMo';
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
 * Ghi hoat dong kinh doanh vao so cai theo `seconds` vua tick.
 *
 * `flowFor` tinh ca bon dong tren co so mot GIAY, nen nhan `seconds` de ra
 * so tiền cua khoang thoi gian do. Day la nguyen tac ghi so: cong mot lan,
 * dung khoang thoi gian, khong cong lai moi khung hinh.
 */
function recordOperatingFlow(s: CityState, flow: FlowBreakdown, seconds: number): CityState {
  return postLedger(s, {
    grossRevenue: flow.grossRevenue * seconds,
    cogs: flow.cogs * seconds,
    opex: flow.opex * seconds,
    badDebt: flow.badDebt * seconds,
    interestExpense: flow.interestExpense * seconds,
    tax: flow.tax * seconds,
    netIncome: flow.netIncome * seconds,
  });
}

/**
 * Tach mot lan: cong doanh thu thi truong vao ngan khoc.
 *
 * `opts.relicBonus` phai duoc truyen vao day (xem `FlowOptions`) - nguoc lai
 * HUD hien mot con so ma ngan khoc khong nhan.
 */
export function tickIdle(): void {
  const now = Date.now();
  const elapsed = now - state.lastSeenAt;
  if (elapsed <= 0) return;

  /** Reset so cai theo ngay/thang truoc khi ghi ky moi. */
  const rolled = rollPeriods(state, now);

  const seconds = elapsed / 1000;
  const isFever = state.feverUntil > now;

  let relicYieldBonus = 0;
  let relicHappyBonus = 0;
  for (const rId of state.equippedRelics ?? []) {
    const def = INVENTORY_BY_ID[rId];
    if (!def) continue;
    relicYieldBonus += def.passiveYieldBonus ?? 0;
    relicHappyBonus += def.passiveHappinessBonus ?? 0;
  }

  const flow = flowFor(state.buildings, state.npcs, state.mayorLevel, state.coins, {
    isFever,
    idleMs: now - state.lastEngagedAt,
    happinessBoost: state.happinessBoost,
    relicBonus: relicYieldBonus,
    relicHappinessBonus: relicHappyBonus,
    debt: state.debt ?? 0,
    shopQueue: currentShopQueue(),
  });

  let next: CityState = {
    ...rolled,
    lastSeenAt: now,
    totalVolume: rolled.totalVolume + flow.volume * seconds,
    // Fever dang chay thi chot `feverEverUsed` ngay, de save ghi ra giua
    // chung khong bo mat quest `q-fever-mode`.
    feverEverUsed: rolled.feverEverUsed || isFever,
  };
  if (flow.revenue > 0) next = withCoins(next, flow.revenue * seconds, 'OPERATING');

  /**
   * Ghi so cai P&L. Doan nay cong DOANH THU GOP, gia von, chi phi van hanh va
   * thue - ca hai ve cua bao cao - trong khi `withCoins` o tren chi cong
   * LOI NHUAN RONG vao ngan khoc. Tach hai viec la bat buoc: coi doanh thu
   * bang tien nhan se lam bao cao khong bao gio cong bang.
   */
  next = recordOperatingFlow(next, flow, seconds);

  /*
   * Lai vay da duoc tru trong `flow.netIncome` roi, day chi cong don de bao
   * cao. Khong tru lan thu hai.
   */
  if (flow.interestExpense > 0) {
    next = {
      ...next,
      totalInterestPaid: (next.totalInterestPaid ?? 0) + flow.interestExpense * seconds,
    };
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

  setState(next);
  processLoanOverdue(now);
  maybeTriggerHazardTick();
  maybeProcessFraudTick();
}

function processLoanOverdue(now: number): void {
  const due = state.loanDueDay ?? '';
  const overdue = due && todayKey(now) > due && (state.debt ?? 0) > 0;
  if (!overdue) return;

  const fee = Math.max(50, Math.round((state.debt ?? 0) * 0.05));
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
  const damage = Math.max(120, Math.round(state.coins * 0.08));
  triggerHazardEvent(damage);
}

function maybeProcessFraudTick(): void {
  if (state.buildings.length === 0) return;
  if (Math.random() >= 0.0003) return;
  const pick = state.buildings[Math.floor(Math.random() * state.buildings.length)];
  if (pick) processFraudCheckForBuilding(pick.id);
}

function maybeSpawnRequest(current: CityState, now: number): CityState {
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

  const eligible = eligibleCityEvents(current, now);
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

export type TapSource = 'bubble' | 'citizen' | 'advisor' | 'patrol' | 'pet';

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

export function useInventoryItem(itemId: string): UseItemResult {
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
    return { ok: false, message: 'Chưa đủ Xu để mua vật phẩm này.' };
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

/** Bo qua su kien hien tai va len lich su kien moi sau 35s */
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
 * Kich hoat su kien tiep theo. KHONG con spawn tu do: phai het han 35s VÀ
 * con luot trong ngay. Truoc day ham nay la spawn miễn phi vo han, bam lien
 * nut "Chuyen Pho" de chay vong lap tra Xu nho - nhan vat pham dat gia tri lon.
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
    shopsOverloaded: overloadedShopCount(s.buildings, currentShopQueue()),
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
 */
export function eligibleCityEvents(s: CityState, now = Date.now()): CityEventScript[] {
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
  | { ok: false; reason: 'ceiling' | 'invalid' | 'noIncome' };

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
    isFever: (s.feverUntil ?? 0) > Date.now(),
    idleMs: Date.now() - s.lastEngagedAt,
    happinessBoost: s.happinessBoost,
    relicBonus: relicYieldBonus,
    relicHappinessBonus: relicHappyBonus,
    debt: s.debt ?? 0,
    shopQueue: currentShopQueue(),
  };
}

/** Han muc vay con lai. 0 nghia la khong du kha nang tra de vay them. */
export function loanHeadroom(s: CityState = state): number {
  const flow = flowFor(s.buildings, s.npcs, s.mayorLevel, s.coins, flowOptsFor(s));
  const tran = debtCeilingFor(flow.operatingIncome);
  return Math.max(0, tran - (s.debt ?? 0));
}

export function takeLoan(amount: number): LoanResult {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: 'invalid' };

  const flow = flowFor(state.buildings, state.npcs, state.mayorLevel, state.coins, flowOptsFor(state));
  if (flow.operatingIncome <= 0) return { ok: false, reason: 'noIncome' };

  const conLai = Math.max(0, debtCeilingFor(flow.operatingIncome) - (state.debt ?? 0));
  if (amount > conLai) return { ok: false, reason: 'ceiling' };

  /*
   * Tien vay KHONG phai doanh thu, cung khong phai tien thuong: no la mot
   * khoan no. Nen cong thang vao `coins` chu khong qua `withCoins`.
   * Gán chu kỳ đáo hạn 45 ngày cho khoản nợ.
   */
  const now = Date.now();
  const dueDay = todayKey(now + 45 * 24 * 3600 * 1000);

  setState({
    ...state,
    coins: state.coins + amount,
    workingCapital: (state.workingCapital ?? state.coins) + amount,
    debt: (state.debt ?? 0) + amount,
    loanDueDay: state.loanDueDay || dueDay,
  });
  return { ok: true, amount };
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
export function buyMoMoInsurance(costCoins = 2500): boolean {
  if (state.hasInsurance) return false;
  if (state.coins < costCoins) return false;

  setState({
    ...state,
    coins: state.coins - costCoins,
    workingCapital: Math.max(0, (state.workingCapital ?? state.coins) - costCoins),
    hasInsurance: true,
  });
  return true;
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

  const rate = nodeYieldBreakdown(node, state.buildings).totalPerSec || 20;

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

  if (state.mayorLevel < def.unlockAtMayorLevel) return 'level';
  if (!isInsideUnlocked(state, col, row)) return 'locked';
  if (buildingAt(state.buildings, col, row)) return 'occupied';

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
  isFever: boolean;
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
  /** Ngày đáo hạn nợ Ví Trả Sau */
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

export function useCityDerived(): CityDerived {
  const buildings = useCity((s) => s.buildings);
  const npcs = useCity((s) => s.npcs);
  const mayorLevel = useCity((s) => s.mayorLevel);
  const coins = useCity((s) => s.coins);
  const feverUntil = useCity((s) => s.feverUntil);
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
    const isFever = feverUntil > now;
    const happiness = clampHappiness(
      happinessFor(buildings, now - lastEngagedAt, happinessBoost) + relicHappyBonus,
    );
    /**
     * Bảo Vật phải được truyền VÀO `flowFor`, không nhân ngoài. Nhân ngoài thì
     * HUD hiện doanh thu đã × (1 + bonus) còn `tickIdle` thực sự chỉ cộng
     * `flow.revenue` chưa nhân - người chơi thấy 1,9× nhưng nhận 1×.
     */
    const flow = flowFor(buildings, npcs, mayorLevel, coins, {
      isFever,
      idleMs: now - lastEngagedAt,
      happinessBoost,
      relicBonus: relicYieldBonus,
relicHappinessBonus: relicHappyBonus,
      debt,
      shopQueue: currentShopQueue(),
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
      loanHeadroom: Math.max(0, debtCeiling - debt),
      interestCoverage: interestCoverage(flow.operatingIncome, flow.interestExpense),
      happiness,
      weekCompare,
      streakShields,
      population: danSo,
      taxMultiplier: taxMultiplierFromHappiness(happiness),
      landCost: landCostCoins(unlockedCols, unlockedRows),
      capacity: unlockedCols * unlockedRows,
      used: buildings.length,
      isFever,
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
    npcs,
    mayorLevel,
    coins,
    feverUntil,
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
