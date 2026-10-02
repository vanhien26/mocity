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
  /**
   * Chang tien trinh. 1 la nhap mon (xong trong buoi dau), 2 la dai han.
   * Bang Nhiem Vu nhom theo truong nay, neu khong 18 muc se thanh mot danh
   * sach dai khong co moc nao de nguoi choi dinh huong.
   */
  stage: 1 | 2;
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

/** Tien do nhiem vu ngay. Reset khi `day` khac ngay hien tai. */
export interface DailyLog {
  day: string;
  built: number;
  upgraded: number;
  talked: number;
  eventsResolved: number;
  starEvolved: number;
  /**
   * XP nhan roi da cong trong ngay. Co tran rieng (`IDLE_XP_DAILY_CAP`) vi
   * khong co no thi de may chay mot ngay la gan het duong cong cap do.
   */
  idleXp: number;
  /** Id cac nhiem vu ngay da nhan thuong trong ngay nay. */
  claimed: string[];
}

/**
 * CHUOI NGAY CHOI LIEN TIEP.
 *
 * `days` la so ngay lien tiep TINH LANG giua cac lan mo game. `lastDay` la
 * khoa ngay da ghi nhan gan nhat de biet con tiep duoc hay phai reset.
 *
 * Day la co che giu nguoi choi quay lai re nhat va dat loi: nguoi choi da
 * xay 12 ngay thi mat chuoi la mot thu ly, khong phai con so o.
 */
export interface StreakState {
  /** So ngay lien tiep hien tai. 0 = vua ngat chuoi. */
  days: number;
  /** Khoa ngay `YYYY-M-D` ghi nhan gan nhat. */
  lastDay: string;
  /** Chuoi dai nhat da dat duoc, khong bao gio reset. */
  best: number;
}

/* ── SỔ CÁI & BÁO CÁO KẾT QUẢ KINH DOANH ────────────────────────── */

/**
 * Mot ky so cua bao cao ket qua kinh doanh. Moi dong la MOT DONG trong bang
 * P&L, khong phai tong hop tat ca cac dong - hieu sai se cong thieu.
 */
export interface LedgerEntry {
  /** TONG DOANH THU (gross) truoc khi tru chi phi. */
  grossRevenue: number;
  /** Gia von hang ban. */
  cogs: number;
  /** Chi phi vat hanh. */
  opex: number;
  /** Chi phi du phong no xau tu Vi Tra Sau trong ky. */
  badDebt: number;
  /** Chi phi lai vay tren du no trong ky. */
  interestExpense: number;
  /** Thue thu nhap doanh nghiep. */
  tax: number;
  /** Loi nhuan rong = tien thuc vao ngan khoc tu hoat dong. */
  netIncome: number;
  /**
   * Chi tieu von (capex): xay moi, nang cap, mo rong dat, len sao, lap tien ich.
   * KHONG phai chi phi - no tao tai san, va game khong khu hao nen `capex` chi
   * tich lu chu khong bao gio quay lai ngan khoc. Day la phan biet ma game
   * nay day dung.
   */
  capex: number;
  /** Kiem ke thi truong: chi tieu von bao tri, khong ghi vao P&L. */
  inventoryBought: number;
}

export function emptyLedger(): LedgerEntry {
  return {
    grossRevenue: 0,
    cogs: 0,
    opex: 0,
    badDebt: 0,
    interestExpense: 0,
    tax: 0,
    netIncome: 0,
    capex: 0,
    inventoryBought: 0,
  };
}

/** Ledger theo ky. `day`/`month` reset khi doi ngay / doi thang. */
export interface PeriodLedger extends LedgerEntry {
  /** Khoa ngay `YYYY-M-D`, rong neu chua co du lieu. */
  day: string;
  /** Khoa thang `YYYY-M`. */
  month: string;
}

export function emptyPeriodLedger(day: string, month: string): PeriodLedger {
  return { ...emptyLedger(), day, month };
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
  /**
   * So ngay `StreakMilestoneDef.days` da nhan thuong.
   *
   * Luu SO NGAY chu khong luu id nen mot lan chuoi dai hon van nhan duoc thuong
   * moc da cham (vi du chuoi 10 ngay cham moc 3 va 7, chuoi 40 ngay cham them
   * 14 va 30). Da cham `days` thi khong bao gio trao lai - nhanh vien khong
   * doi lui, thuong cap bang so ngay.
   */
  streakClaimed: number;
  /** Kho do cua Thi Truong: itemId -> so luong */
  inventory: Record<string, number>;
  /** Danh sach Bau Vat (Relics) dang trang bi (toi da 3) */
  equippedRelics: string[];
  feverUntil: number;
  /**
   * Da BAO GIO kich hoat Giờ Vàng chua, ghi lai vĩnh viễn.
   *
   * `feverUntil` chi true trong 60 giay nen quest `q-fever-mode` kiem tra
   * bang `feverUntil > 0` se khong bao gio hoan thanh duoc sau khi thi
   * trang het - thuong 18.000 Xu + 8 Kim Cuong bay bien vo hinh. Cờ nay ghi
   * nhan "da tung mo" mot lan duy nhat.
   */
  feverEverUsed: boolean;
  activeRequests: ActiveRequest[];
  pendingEvent: PendingEvent | null;
  lastRequestAt: number;
  lastEventAt: number;
  /**
   * Lan gan nhat dem `talked` cho nhiem vu ngay. Chan spam click cu dan: khong
   * co han nay thi `recordCitizenTalk` chay vo han va `d-tro-chuyen` (target 5)
   * hoan thanh trong 5 giay.
   */
  lastTalkAt: number;
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
   * DU NO hien tai. Sinh lai vay moi giay, tru thang vao P&L.
   *
   * Tach khoi `coins` chu khong tru thang: tien vay VAO ngan khoc ngay, con
   * nghia vu tra thi o lai. Do la toan bo y nghia cua don bay tai chinh, va
   * neu gop chung mot con so thi khong con gi de day.
   */
  debt: number;
  /** Tong lai vay da tra tu truoc toi nay, de bao cao. */
  totalInterestPaid: number;
  dailyLog: DailyLog;
  streak: StreakState;
  /** Rank bac thanh pho cao nhat da nhan thuong, de khong tra thuong hai lan. */
  cityTierClaimed: number;
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
  /**
   * TONG DA NHAP - gom ca doanh thu va thuong cap. Chi dung de hien "tong so
   * da vao ngan khoc". KHONG dung lam "doanh thu": xem `totalRevenue`.
   */
  totalCoinsEarned: number;
  /**
   * DOANH THU VAN HAI sinh ra tu hoat dong cua thanh pho: san luong cua
   * hang + phi ha tang giao dich so + lai tich luy. Day moi la dong "doanh thu"
   * co nghia ke toan.
   */
  totalRevenue: number;
  /**
   * Tien thuong khong phai ban ra: nhiem vu Thị Truơng, bac thanh pho, thuong
   * nhiem vu ngay, thuong nham chuc lan dau.
   *
   * Về kế toán đây là vốn góp của chủ sở hữu, KHÔNG phải doanh thu. Trước đây
   * 2,96 triệu Xu thuong bị dán nhãn "Tổng Doanh Thu Tích Lũy" trên thẻ chia
   * sẻ - dạy sai người chơi rằng tiền thưởng game là tiền bán hàng.
   */
  totalGrants: number;
  /** Tiền thuong vi tương tác: chạm cư dân, thú cưng, quầy Lộc, bóng Xu. */
  totalTapIncome: number;
  /** Sổ cái vĩnh viễn, không reset. */
  ledgerLifetime: PeriodLedger;
  /** Sổ cái trong ngày. Reset lúc sang ngày mới. */
  ledgerDay: PeriodLedger;
  /** Sổ cái trong tháng. Reset lúc sang tháng mới. */
  ledgerMonth: PeriodLedger;
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
  /**
   * TY LE GIA VON tren phan doanh thu ban hang cua cong trinh nay (0.35 =
   * 35% doanh thu het vao mua hang ton kho + chi phi giao hang).
   *
   * Day la dong "Gia von hang ban" cua bao cao ket qua kinh doanh. KHONG
   * ap dung cho doanh thu phi thu ho hay lai tich lu - nhung dong do khong
   * co ha ton kho.
   *
   * Bien loi nhuan gop = 1 - tong ty le nay. Nganh ban le thuong 35-45%, cong
   * trinh dich vu o giua, cong trinh giao dich so o cuoi (giao dich khong ton
   * hang).
   */
  cogsRate?: number;
  /**
   * TY LE CHI PHI VAT HANH tren phan doanh thu cua cong trinh nay: thue mat
   * bang, luong nhan vien, dien nuoc, bao tri thiet bi.
   *
   * Cua hang an uong ton trong nhan vien va mat bang nen OPEX cao; tram tu
   * than tai chi can may chay nen OPEX thap.
   */
  opexRate?: number;
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
