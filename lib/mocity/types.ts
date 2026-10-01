export type ZoneType = 'COMMERCIAL' | 'FINTECH' | 'RESIDENTIAL' | 'LANDMARK';

export interface Currencies {
  coins: number;
  gems: number;
  energy: number;
  blueprints: number;
  medals: number;
}

export type CurrencyKey = keyof Currencies;

export interface CityMetrics {
  cityName: string;
  mayorLevel: number;
  population: number;
  maxPopulation: number;
  happinessIndex: number;
  taxRateMultiplier: number;
}

export type StoreModuleId = 'QR_LOA_THAN_TAI' | 'VI_TRA_SAU_VOUCHER' | 'TUI_THAN_TAI_AUTO';

export interface StoreModuleDef {
  id: StoreModuleId;
  name: string;
  shortName: string;
  serviceTag: string;
  description: string;
  unlockLevel: number;
  costCoins: number;
  yieldBonus: number;
  color: string;
}

export type ManagerRarity = 'R' | 'SR' | 'SSR';

export interface ManagerDef {
  id: string;
  name: string;
  title: string;
  rarity: ManagerRarity;
  specialtyZone: ZoneType | 'ALL';
  skillName: string;
  skillDesc: string;
  yieldMultiplier: number;
  happinessBonus: number;
  costCoins: number;
  costGems: number;
  hue: string;
}

export interface MayorQuestDef {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
}

export interface BuildingNode {
  id: string;
  defId: string;
  col: number;
  row: number;
  level: number;
  starRating: number;
  lastCollectedAt: number;
  modules?: StoreModuleId[];
  managerId?: string;
}

/* ── Con nguoi trong thanh pho ──────────────────────────────────── */

export type ArchetypeId =
  | 'MERCHANT_CASH'
  | 'MERCHANT_ESTABLISHED'
  | 'GIG_WORKER'
  | 'SALARIED'
  | 'STUDENT'
  | 'FAMILY'
  | 'CINEPHILE'
  | 'TRAVELER'
  | 'INVESTOR'
  | 'ELDER';

/** Dich vu tai chinh NPC da duoc mo. Moi dich vu doi hanh vi kinh te cua ho. */
export type ServiceId =
  | 'QR_PAYMENT'
  | 'CREDIT'
  | 'BNPL'
  | 'SAVINGS'
  | 'CREDIT_SCORE'
  | 'INSURANCE';

export type NpcRole = 'MERCHANT' | 'CITIZEN';

/**
 * Moi cong trinh COMMERCIAL sinh 1 chu tiem, moi cong trinh RESIDENTIAL sinh
 * 1 dai dien cu dan. Dai dien noi thay cho ca cohort - tranh phai mo phong
 * hang tram entity rieng le.
 */
export interface NpcState {
  id: string;
  buildingId: string;
  name: string;
  archetype: ArchetypeId;
  role: NpcRole;
  /** 0-100. Merchant doi sang thanh toan so khi cham nguong. */
  trust: number;
  acceptsDigital: boolean;
  services: ServiceId[];
}

/* ── Doi thoai ──────────────────────────────────────────────────── */

export type InventoryItemCategory = 'CONSUMABLE' | 'RELIC' | 'GIFT';

export interface InventoryItemDef {
  id: string;
  name: string;
  category: InventoryItemCategory;
  rarity: 'R' | 'SR' | 'SSR';
  description: string;
  effectSummary: string;
  hue: string;
  costCoins: number;
  costGems: number;
  /** Buff thụ động khi trang bị (dành cho RELIC) */
  passiveYieldBonus?: number;
  passiveHappinessBonus?: number;
}

export interface DialogueEffects {
  trust?: number;
  acceptDigital?: boolean;
  grantService?: ServiceId;
  coins?: number;
  xp?: number;
  /** Ap dung cho toan bo NPC thay vi rieng nguoi dang noi. */
  trustAll?: number;
  /** Vat pham nhan duoc vao Kho Do khi chon phuong an nay */
  rewardItemId?: string;
  /**
   * Diem Hanh Phuc cong don. Xử lý chuyện phố là cách duy nhất bù lại suy
   * giam hanh phuc theo thoi gian.
   */
  happiness?: number;
}

export interface ConsequenceTag {
  label: string;
  tone: 'red' | 'green' | 'neutral';
}

export interface DialogueChoice {
  id: string;
  text: string;
  costCoins?: number;
  effects: DialogueEffects;
  /** Cau NPC dap lai sau khi thi truong chon. */
  reply: string;
  /** Danh sach pill tag he qua hien thi truc quan nhu '[-800k]', '[ong Loc ++]', '[khep chuyen]' */
  tags?: ConsequenceTag[];
  /** Mau nut Chon: green | red | blue */
  btnTone?: 'green' | 'red' | 'blue';
}

export interface RequestScript {
  id: string;
  archetype: ArchetypeId;
  /** Chi hien khi chu tiem da/chua nhan thanh toan so. undefined = bo qua dieu kien. */
  requiresDigital?: boolean;
  /** Chi hien khi NPC chua co dich vu nay. */
  missingService?: ServiceId;
  title: string;
  subtitle?: string;
  body: string;
  choices: DialogueChoice[];
}

export interface CityEventScript {
  id: string;
  title: string;
  subtitle?: string;
  speaker: string;
  body: string;
  minMayorLevel: number;
  choices: DialogueChoice[];
}

export interface ActiveRequest {
  id: string;
  scriptId: string;
  npcId: string;
  createdAt: number;
}

/** Su kien toan thanh pho dang cho thi truong xu ly. */
export interface PendingEvent {
  id: string;
  scriptId: string;
  createdAt: number;
}

/** So su kien toan pho da giai quyet trong ngay, dung chan arbitrage. */
export interface EventDayLog {
  /** Khoa ngay theo gio dia phuong, dang `YYYY-M-D`. */
  day: string;
  resolved: number;
}

export type MayorGender = 'male' | 'female';

export interface CityState extends Currencies {
  version: number;
  mayorName: string;
  cityName: string;
  hasNamedCity: boolean;
  mayorGender: MayorGender;
  mayorLevel: number;
  mayorXp: number;
  gridSize: number;
  unlockedCols: number;
  unlockedRows: number;
  buildings: BuildingNode[];
  npcs: NpcState[];
  unlockedManagers: string[];
  claimedQuests: string[];
  /** Kho do cua Thi Truong: itemId -> so luong */
  inventory: Record<string, number>;
  /** Danh sach Bau Vat (Relics) dang trang bi (toi da 3) */
  equippedRelics: string[];
  feverUntil: number;
  activeRequests: ActiveRequest[];
  pendingEvent: PendingEvent | null;
  lastRequestAt: number;
  lastEventAt: number;
  /**
   * Lan gan nhat Thi Truong THAT SỰ quan tâm den pho (giai quyet su kien hoac
   * yeu cau cua nguoi dan). Tach rieng `lastEventAt` - cai do chi dem han 35
   * giay giua cac su kien, dung de kiem tra xem co duoc spawn them khong.
   *
   * Day la dong ho chay cho suy giam hanh phuc.
   */
  lastEngagedAt: number;
  /** Dem han giai quyet su kien trong ngay. Tu reset sang 0 khi sang ngay moi. */
  eventLog: EventDayLog;
  /**
   * Diem Hanh Phuc cong don tu dialogue. Hanh phuc suy giam theo thoi gian
   * (xem `happinessFor`), nen day la lien he giữ "co xu lý chuyện phố" và
   * "doanh thu".
   */
  happinessBoost: number;
  /** Timestamp lan tap gan nhat cua tung nguon: 'bubble' | 'citizen' | 'advisor' | 'patrol'. */
  tappedAt: Record<string, number>;
  /** Tong volume giao dich tich luy - chi so tang truong cua thanh pho. */
  totalVolume: number;
  lastSeenAt: number;
  createdAt: number;
  totalCoinsEarned: number;
  bubblesCollected: number;
  /** Thuong AFK chua nhan. null = da xu ly xong. */
  pendingOffline: { coins: number; elapsedMs: number } | null;
  /** Thoi diem trong ngay: BINH MINH, NGAY, HOANG HON, DEM */
  timeOfDay?: TimeOfDay;
}

export type TimeOfDay = 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';

/** Ten icon trong BUILDING_ICON map (components/mocity/building-icons.ts). */
export type BuildingIconKey =
  | 'store'
  | 'utensils'
  | 'shoppingBag'
  | 'coffee'
  | 'landmark'
  | 'server'
  | 'graduation'
  | 'trees'
  | 'building'
  | 'tower'
  | 'piggy'
  | 'film'
  | 'plane'
  | 'wallet'
  | 'trendingUp'
  | 'zap'
  | 'home';

export interface BuildingDef {
  id: string;
  name: string;
  shortName: string;
  icon: BuildingIconKey;
  zone: ZoneType;
  momoServiceTag?: string;
  description: string;
  baseYieldPerSec: number;
  baseHappiness: number;
  population: number;
  costCoins: number;
  costGems: number;
  maxLevel: number;
  height: number;
  hue: string;
  accent: string;
  unlockAtMayorLevel: number;
  /** COMMERCIAL: suc chua giao dich moi giay. */
  merchantCapacity?: number;
  /** FINTECH: cong them vao take rate cua thi truong. */
  takeRateBonus?: number;
  /** Danh sach ID cong trinh tao hieu ung Combo Lien Ke khi dat canh nhau. */
  synergyWith?: string[];
  synergyLabel?: string;
}

export interface ZoneMeta {
  type: ZoneType;
  label: string;
  shortLabel: string;
  color: string;
  tint: string;
  ring: string;
  description: string;
}
