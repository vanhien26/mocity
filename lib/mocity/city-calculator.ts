import {
  BUILDING_BY_ID,
  MANAGER_BY_ID,
  milestoneMultiplierFor,
  MODULE_BY_ID,
} from './mock-city-data';
import { SERVICE_SPEND_BONUS } from './npc-data';
import type { BuildingNode, NpcState } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ── Hang so kinh te ────────────────────────────────────────────── */

/**
 * Cau tu khach vang lai. Giam tu 160 xuong 90 de cau cua dan cu that su co
 * trong luong: neu chi dan gia tri nen, mot nhom tienm se lam thap day va do
 * doanh thu bi cat.
 */
const BASE_DEMAND_PER_SEC = 90;
/** Thu nhap moi dan cu moi giay. */
const INCOME_PER_CAPITA = 0.65;
/** Ti le thu nhap dem di chi tieu. */
const SPEND_RATIO = 0.75;
/** Phi ha tang co ban thi truong thu tren giao dich so. */
export const BASE_TAKE_RATE = 0.025;
/** Tran take rate du nang cap bao nhieu ha tang. */
const MAX_TAKE_RATE = 0.065;
/** Moi cap cong trinh tang 45% nang luc. */
const LEVEL_SCALE = 0.45;
/** Cong trinh o cap cao hon thi cong tron nhieu, nhung khong vuot qua bien do. */
const HAPPINESS_LEVEL_SCALE = 0.03;

/**
 * Hanh phuc chay theo Thoi gian, khong phai theo hanh dong giu chung.
 * Ban <= 3 khong co chuyen gi: 6 cong trinh cap 1 da 97%, cap 2 la 100% va
 * `taxMultiplier` bi kep vinh vien o 1.6x. Bay gio bo mat pho thi keo theo.
 */
const HAPPINESS_DECAY_GRACE_MS = 2 * 60 * 60 * 1000;
const HAPPINESS_DECAY_PER_HOUR = 2;
const HAPPINESS_DECAY_CAP = 25;

/** San cho phuc vu duoi bao nhieu phan thi thap do khong hoat dong het. */
const MIN_SUPPLY_FACTOR = 0.6;

/** Tran diem Hanh Phuc cong don tu dialogue. */
export const HAPPINESS_BOOST_CAP = 30;

/** Duoi nguong nay HUD canh bao Thieu Truong lai vao phan xu chuyen pho. */
export const HAPPINESS_WARNING_AT = 60;

export function clampHappiness(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * He so nhan thue tu chi so Hanh Phuc.
 * 100% -> 1.6x, 50% -> 1.0x, 0% -> 0.7x.
 * Duoi 50% khong con "khong te la an" nua - do la chi tiet luong.
 */
export function taxMultiplierFromHappiness(happinessIndex: number): number {
  const normalized = clamp((happinessIndex - 50) / 50, -0.5, 1);
  return 1 + normalized * 0.6;
}

/**
 * Chi so Hanh Phuc 0 - 100.
 *
 * @param idleMs    Thoi gian ke tu su kien gan nhat duoc xu ly.
 * @param boost     Diem cong don tu phuong an dialogue (nguoi choi xu ly
 *                  chuyen pho la cach nhan lai diem nay).
 */
export function happinessFor(buildings: BuildingNode[], idleMs = 0, boost = 0): number {
  let raw = 25;
  for (const node of buildings) {
    const def = BUILDING_BY_ID[node.defId];
    if (!def) continue;
    raw += def.baseHappiness * (1 + (node.level - 1) * HAPPINESS_LEVEL_SCALE);
    if (node.managerId && MANAGER_BY_ID[node.managerId]) {
      raw += MANAGER_BY_ID[node.managerId].happinessBonus;
    }
  }
  const overdue = Math.max(0, idleMs - HAPPINESS_DECAY_GRACE_MS);
  const decay = Math.min(HAPPINESS_DECAY_CAP, (overdue / 3_600_000) * HAPPINESS_DECAY_PER_HOUR);
  return clampHappiness(raw + boost - decay);
}

export function populationFor(buildings: BuildingNode[]): number {
  return buildings.reduce((sum, node) => {
    const def = BUILDING_BY_ID[node.defId];
    if (!def) return sum;
    const starScale = 1 + ((node.starRating || 1) - 1) * 0.25;
    return Math.round(sum + def.population * node.level * starScale);
  }, 0);
}

/* ── IDLE RPG Store Yield & City Builder Adjacency Synergy ──────── */

export interface NodeYieldInfo {
  baseRate: number;
  levelMultiplier: number;
  milestoneMultiplier: number;
  starMultiplier: number;
  moduleBonus: number;
  managerBonus: number;
  synergyBonus: number;
  synergyNeighbors: string[];
  totalPerSec: number;
}

/**
 * Kiem tra 8 o xung quanh (Moore neighborhood) de kich hoat Combo Quy Hoach City Builder
 * hoac nhan Hao Quang Tai Chinh tu Tram Tui Than Tai / Ngan Hang So.
 */
export function nodeYieldBreakdown(
  node: BuildingNode,
  allBuildings: BuildingNode[],
): NodeYieldInfo {
  const def = BUILDING_BY_ID[node.defId];
  if (!def) {
    return {
      baseRate: 0,
      levelMultiplier: 1,
      milestoneMultiplier: 1,
      starMultiplier: 1,
      moduleBonus: 0,
      managerBonus: 0,
      synergyBonus: 0,
      synergyNeighbors: [],
      totalPerSec: 0,
    };
  }

  const levelMultiplier = 1 + (node.level - 1) * LEVEL_SCALE;
  const milestoneMultiplier = milestoneMultiplierFor(node.level);
  const starMultiplier = 1 + ((node.starRating || 1) - 1) * 0.35;

  const modules = node.modules ?? [];
  const moduleBonus = modules.reduce((sum, modId) => {
    return sum + (MODULE_BY_ID[modId]?.yieldBonus ?? 0);
  }, 0);

  const manager = node.managerId ? MANAGER_BY_ID[node.managerId] : undefined;
  const managerBonus = manager ? manager.yieldMultiplier : 0;

  // Kiem tra Combo Lien Ke (Adjacency Synergy) tren luoi col x row
  const synergyTargets = new Set(def.synergyWith ?? []);
  const synergyNeighbors: string[] = [];
  let synergyBonus = 0;

  for (const other of allBuildings) {
    if (other.id === node.id) continue;
    const distCol = Math.abs(other.col - node.col);
    const distRow = Math.abs(other.row - node.row);
    if (distCol <= 1 && distRow <= 1) {
      const otherDef = BUILDING_BY_ID[other.defId];
      if (!otherDef) continue;
      if (synergyTargets.has(other.defId)) {
        synergyBonus += 0.25;
        if (!synergyNeighbors.includes(otherDef.shortName)) {
          synergyNeighbors.push(otherDef.shortName);
        }
      } else if (other.defId === 'tram-tui-than-tai' || other.defId === 'ngan-hang-so') {
        synergyBonus += 0.15;
        if (!synergyNeighbors.includes(otherDef.shortName)) {
          synergyNeighbors.push(otherDef.shortName);
        }
      }
    }
  }
  synergyBonus = Math.min(0.75, synergyBonus);

  const totalPerSec =
    def.baseYieldPerSec *
    levelMultiplier *
    milestoneMultiplier *
    starMultiplier *
    (1 + moduleBonus + managerBonus + synergyBonus);

  return {
    baseRate: def.baseYieldPerSec,
    levelMultiplier,
    milestoneMultiplier,
    starMultiplier,
    moduleBonus,
    managerBonus,
    synergyBonus,
    synergyNeighbors,
    totalPerSec,
  };
}

/** Tong Xu/giay tu cac cua hang va cong trinh trong thanh pho. */
export function directStoreYieldPerSecond(buildings: BuildingNode[]): number {
  return buildings.reduce((sum, node) => {
    return sum + nodeYieldBreakdown(node, buildings).totalPerSec;
  }, 0);
}

/** Lai kep Tui Than Tai tren tong so Xu thi truong dang nam giu. */
export function savingsInterestPerSecond(buildings: BuildingNode[], currentCoins: number): number {
  let savingsRate = 0;
  for (const node of buildings) {
    if (node.defId === 'tram-tui-than-tai') {
      savingsRate += 0.00045 * node.level;
    } else if (node.defId === 'ngan-hang-so') {
      savingsRate += 0.00025 * node.level;
    }
    if (node.modules?.includes('TUI_THAN_TAI_AUTO')) {
      savingsRate += 0.00015;
    }
  }
  if (savingsRate <= 0) return 0;
  const effectiveCoins = Math.min(currentCoins, 250_000);
  return effectiveCoins * Math.min(0.006, savingsRate);
}

/* ── Mo hinh giao dich ──────────────────────────────────────────── */

/**
 * Tong suc chi cua dan cu moi giay. Cu dan co dich vu tai chinh chi nhieu hon:
 * tin dung va tra sau mo rong suc chi, tiet kiem giu tien lai trong he thong.
 */
export function demandPerSecond(buildings: BuildingNode[], npcs: NpcState[]): number {
  const population = populationFor(buildings);
  const baseIncome = population * INCOME_PER_CAPITA;

  const citizens = npcs.filter((n) => n.role === 'CITIZEN');
  const serviceBonus = citizens.reduce((sum, npc) => {
    return sum + npc.services.reduce((s, id) => s + (SERVICE_SPEND_BONUS[id] ?? 0), 0);
  }, 0);
  const avgBonus = citizens.length > 0 ? serviceBonus / citizens.length : 0;

  return (BASE_DEMAND_PER_SEC + baseIncome) * SPEND_RATIO * (1 + avgBonus);
}

/** Tong nang luc phuc vu cua cac cua tiem moi giay. */
export function supplyPerSecond(buildings: BuildingNode[]): number {
  return buildings.reduce((sum, node) => {
    const def = BUILDING_BY_ID[node.defId];
    if (!def?.merchantCapacity) return sum;
    return sum + def.merchantCapacity * (1 + (node.level - 1) * LEVEL_SCALE);
  }, 0);
}

/**
 * Ti le giao dich di qua kenh so, tinh theo nang luc chu khong theo dau nguoi:
 * mot trung tam thuong mai chuyen doi co gia tri hon mot quan ca phe.
 */
export function digitalShare(buildings: BuildingNode[], npcs: NpcState[]): number {
  let total = 0;
  let digital = 0;

  for (const node of buildings) {
    const def = BUILDING_BY_ID[node.defId];
    if (!def?.merchantCapacity) continue;
    const capacity = def.merchantCapacity * (1 + (node.level - 1) * LEVEL_SCALE);
    total += capacity;
    const owner = npcs.find((n) => n.buildingId === node.id);
    const hasQrModule = node.modules?.includes('QR_LOA_THAN_TAI');
    if (owner?.acceptsDigital || hasQrModule) {
      digital += capacity;
    }
  }

  if (total === 0) return 0;
  return digital / total;
}

/** Phi ha tang thi truong thu duoc, cong don tu cac cong trinh FINTECH. */
export function takeRateFor(buildings: BuildingNode[]): number {
  const bonus = buildings.reduce((sum, node) => {
    const def = BUILDING_BY_ID[node.defId];
    if (!def?.takeRateBonus) return sum;
    return sum + def.takeRateBonus * (1 + (node.level - 1) * 0.25);
  }, 0);
  return Math.min(MAX_TAKE_RATE, BASE_TAKE_RATE + bonus);
}

export interface FlowBreakdown {
  demand: number;
  supply: number;
  /** Giao dich thuc te khop duoc = min(cau, cung). */
  volume: number;
  digitalShare: number;
  digitalVolume: number;
  takeRate: number;
  storeYield: number;
  savingsYield: number;
  /** Phi ha tang MoMo QR thu duoc moi giay. */
  networkFee: number;
  /**
   * He so thap do: 1.0 = cung du khu vuc. Xuong 0.5 khi xay nhieu cua hang
   * ma khong co dan cu mua.
   */
  supplyFactor: number;

  /* ── BÁO CÁO KẾT QUẢ KINH DOANH (P&L) ──────────────────────────────
   * Doanh thu o tren la GROSS. Truoc day game chi tinh thu duong va bao
   * ngan khoc nhan dung so do - khong ton tai khai niem gia von hay chi phi
   * vat hanh, nen loi nhuan gop va loi nhuan rong VO NGHIA chu khong phai
   * "chua hien thi". Duoi day la ca hai ve cua bao cao.
   */

  /** TONG DOANH THU (gross) truoc khi tru chi phi. */
  grossRevenue: number;
  /** Gia von hang ban: ton kho + chi phi giao hang. Chi ap cho doanh thu ban hang. */
  cogs: number;
  /** LOI NHUAN GOP = doanh thu - gia von. */
  grossProfit: number;
  /** Bien loi nhuan gop (0-1). */
  grossMargin: number;
  /** Chi phi vat hanh: thue mat bang, luong, dien nuoc, bao tri. */
  opex: number;
  /**
   * CHI PHI DU PHONG NO XAU tu Vi Tra Sau. Day la gia that cua viec cho vay:
   * mot phan tin dung cap ra se khong doi duoc.
   */
  badDebt: number;
  /** Ty le no xau hien tai (0-1). */
  nplRate: number;
  /** Tin dung Vi Tra Sau cap ra moi giay. */
  bnplCredit: number;
  /** LOI NHUAN HOAT DONG (EBIT) = loi nhuan gop - chi phi vat hanh. */
  operatingIncome: number;
  operatingMargin: number;
  /**
   * CHI PHI LAI VAY tren du no. Nam GIUA EBIT va thue, dung thu tu bao cao
   * that: lai vay duoc tru truoc khi tinh thue, nen vay von co "la chan thue".
   */
  interestExpense: number;
  /** LOI NHUAN TRUOC THUE (EBT) = EBIT - lai vay. */
  pretaxIncome: number;
  /** Thue thu nhap doanh nghiep, tinh tren LOI NHUAN TRUOC THUE. */
  tax: number;
  /** LOI NHUAN RONG = loi nhuan hoat dong - thue. Day la tien thuc vao ngan khoc. */
  netIncome: number;
  netMargin: number;

  /**
   * Tien phai tieu ra moi giay (gia von + vat hanh + thue). TICK_IDLE tru
   * dung so nay. Truoc day chi co cong khong tru.
   */
  costPerSec: number;

  /** @deprecated Dung `grossRevenue` de bao cao doanh thu, `netIncome` de
   * hien tien thuc nhan. Giu lai de khong pha code goi cu. */
  revenue: number;
}

export interface FlowOptions {
  isFever?: boolean;
  /** Ms ke tu su kien toan pho gan nhat duoc xu ly - day vao suy giam hanh phuc. */
  idleMs?: number;
  /** Diem hanh phuc cong don tu phuong an dialogue vua chon. */
  happinessBoost?: number;
  /**
   * Tong bonus doanh thu tu Bao Vat dang trang bi (0.25 + 0.15 + ...).
   *
   * PHẢI truyền vào đây thay vì nhân ngoài `flowFor`. Ban <= 4 `useCityDerived`
   * nhân sau khi goi `flowFor` nen HUD hien doanh thu da × (1 + bonus) trong khi
   * `tickIdle` cong tien theo gia tri CHUA nhan - lech toi +90%. Mot game
   * day ve tai chinh khong duoc phep hien mot so ma khong tra.
   */
  relicBonus?: number;
  /**
   * Cong do hanh phuc tu Bao Vat. Cung phai vao cung mot cho voi `relicBonus`
   * de `happinessFor` va boi so hanh phuc khong lech nhau.
   */
  relicHappinessBonus?: number;
  /** Du no hien tai. Sinh ra chi phi lai vay tru vao P&L moi giay. */
  debt?: number;
}

/**
 * Doanh thu thi truong = Doanh thu truc tiep tu cac Cua Hang (IDLE RPG)
 * + Doanh thu phi ha tang giao dich so + Lai kep Tui Than Tai.
 *
 * `storeYield` bay gio bi `supplyFactor` cat. Ban <= 3 doanh thu cong trinh
 * bo qua hoan toan `demand`/`supply`, nen ca `demandPerSecond` va
 * `supplyPerSecond` chi la so lieu trang tri - xay bao nhieu cua hang cung
 * nhau van thu nhieu nhat. Gio thi xay tran pho se ton that.
 */
/**
 * Thue thu nhap doanh nghiep tren loi nhuan hoat dong.
 *
 * 20% la thue suat thuong nghiep tai VN. Game khong thu that nhung day la
 * dong "thue" trong bao cao - nguoi choi hoc duoc cach cong thue vao CHI PHI
 * chu khong phai cong vao doanh thu (sai so pho bien nhat khi lam P&L).
 */
export const CORPORATE_TAX_RATE = 0.2;

/* ═══════════════════════════════════════════════════════════════════════════
 * VAY VON & DONG TIEN
 *
 * Truoc day `coins` vua la loi nhuan vua la tien mat, va khong the am: muon
 * tieu ma khong du thi nut bi chan, the thoi. Nghia la cach doanh nghiep nho
 * chet pho bien nhat - LAI TREN GIAY NHUNG CAN TIEN MAT - khong mo hinh hoa
 * duoc, du do moi la bai hoc dang gia nhat cua ca mang SME.
 *
 * Them no vao thi: tien vay la don bay, lai vay la chi phi that tru vao P&L,
 * va vay qua suc tra thi bi chan vay tiep. Ba thu do la mot bai day hoan
 * chinh ve don bay tai chinh.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Lai suat vay, tinh theo NAM, quy doi ra moi giay trong `interestPerSecond`. */
export const LOAN_ANNUAL_RATE = 0.18;

/**
 * Mot "nam" trong game. Doanh thu tinh theo giay nen lai suat nam phai quy ve
 * cung thang do, neu khong lai vay se nho toi muc vo nghia.
 *
 * 1 gio thuc = 1 nam trong game: du dai de nguoi choi khong thay lai nhay
 * giat minh, du ngan de trong mot phien choi van cam nhan duoc gia cua no.
 */
export const GAME_YEAR_SECONDS = 3_600;

/**
 * HAN MUC VAY = bao nhieu lan loi nhuan hoat dong mot "nam".
 *
 * Day chinh la he so Debt / EBITDA ma ngan hang that dung de tham dinh. Dat
 * 3.0 vi do la nguong pho bien cho vay doanh nghiep nho - vuot qua thi ho
 * tu choi, dung nhu trong game.
 */
export const MAX_DEBT_TO_EBIT = 3.0;

/** Lai phai tra moi giay tren du no hien tai. */
export function interestPerSecond(debt: number): number {
  if (!Number.isFinite(debt) || debt <= 0) return 0;
  return (debt * LOAN_ANNUAL_RATE) / GAME_YEAR_SECONDS;
}

/**
 * Han muc vay toi da dua tren kha nang tra no.
 *
 * Dung loi nhuan HOAT DONG (truoc lai vay va thue) chu khong phai doanh thu:
 * doanh thu cao ma bien mong thi van khong tra duoc no, va do dung la cho
 * nhieu chu tiem nham.
 */
export function debtCeilingFor(operatingIncomePerSec: number): number {
  if (!Number.isFinite(operatingIncomePerSec) || operatingIncomePerSec <= 0) return 0;
  return operatingIncomePerSec * GAME_YEAR_SECONDS * MAX_DEBT_TO_EBIT;
}

/**
 * He so bao phu lai vay (Interest Coverage Ratio) = EBIT / lai vay.
 *
 * Duoi 1.5 la vung nguy hiem that trong tham dinh tin dung: lai an gan het
 * loi nhuan, chi can mot thang kem la vo no.
 */
export function interestCoverage(operatingIncomePerSec: number, interestPerSec: number): number {
  if (interestPerSec <= 0) return Number.POSITIVE_INFINITY;
  return operatingIncomePerSec / interestPerSec;
}

/** Nguong canh bao he so bao phu lai vay. */
export const COVERAGE_WARNING_AT = 1.5;

/* ═══════════════════════════════════════════════════════════════════════════
 * NO XAU CUA VI TRA SAU (BNPL)
 *
 * Ban truoc mo hinh Vi Tra Sau thuan tang doanh thu: gan the "0% Lai", mo ta
 * "mo rong han muc chi tieu cho cu dan", va co che chi co `baseYieldPerSec`
 * cong `takeRateBonus` cong synergy +25%. Khong co ky tra, khong co nghia vu
 * hoan tra, khong ai tra gia vi dung qua tay.
 *
 * Day BNPL ma bo ve nghia vu tra no thi khong phai giao duc tai chinh, do la
 * quang cao. Voi mot san pham gan thuong hieu trong nganh dich vu tai chinh
 * va phat hanh cong khai, do la rui ro that.
 *
 * Mo hinh dung: THANH PHO la ben cho vay. No thu phi thuong nhan, va no chiu
 * RUI RO TIN DUNG. Cap tin dung vuot kha nang tra cua dan thi ty le no xau
 * tang, an vao loi nhuan. Bai hoc hai chieu: ben vay phai tra, ben cho vay
 * khong he cho khong.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Ty le no xau nen, khi cap tin dung trong muc an toan. */
export const NPL_BASE_RATE = 0.03;
/** Tran ty le no xau khi cap tin dung qua tay. */
export const NPL_MAX_RATE = 0.4;
/**
 * Han muc tin dung LANH MANH tren moi cu dan, tinh bang Xu/giay.
 *
 * Vuot nguong nay la dau hieu tap trung tin dung: cap qua nhieu han muc cho
 * qua it nguoi, dung co che lam ho so tin dung xau di trong thuc te.
 */
export const HEALTHY_CREDIT_PER_CAPITA = 0.02;
/** Nguong canh bao ty le no xau. */
export const NPL_WARNING_AT = 0.1;

/** Tin dung Vi Tra Sau cap ra moi giay, suy tu san luong cac diem BNPL. */
export function bnplCreditPerSecond(buildings: BuildingNode[]): number {
  let total = 0;
  for (const node of buildings) {
    const def = BUILDING_BY_ID[node.defId];
    if (def?.id !== 'trung-tam-vi-tra-sau') continue;
    total += def.baseYieldPerSec * (1 + (node.level - 1) * LEVEL_SCALE);
  }
  return total;
}

/**
 * Ty le no xau theo muc do tap trung tin dung.
 *
 * Duoi nguong lanh manh thi giu o muc nen. Vuot nguong thi tang tuyen tinh
 * toi tran - khong tang dot ngot, de nguoi choi kip thay va sua.
 */
export function nplRateFor(creditPerSec: number, population: number): number {
  if (creditPerSec <= 0) return 0;
  if (population <= 0) return NPL_MAX_RATE;

  const perCapita = creditPerSec / population;
  if (perCapita <= HEALTHY_CREDIT_PER_CAPITA) return NPL_BASE_RATE;

  const vuot = perCapita / HEALTHY_CREDIT_PER_CAPITA - 1;
  return Math.min(NPL_MAX_RATE, NPL_BASE_RATE + vuot * 0.12);
}

/** Chi phi du phong no xau moi giay. */
export function badDebtPerSecond(buildings: BuildingNode[], population: number): number {
  const credit = bnplCreditPerSecond(buildings);
  return credit * nplRateFor(credit, population);
}

/** Ty le gia von mac dinh khi `BuildingDef` khong khai bao. */
const DEFAULT_COGS_RATE = 0.35;
/** Ty le chi phi vat hanh mac dinh. */
const DEFAULT_OPEX_RATE = 0.22;

/**
 * Bien loi nhuan gop ke doanh thu dat duoc tang.
 *
 * Cong trinh nao khong don gia von vao nhau, chon theo `baseYieldPerSec` x
 * `cogsRate`. Cong trinh giao dich so (take rate) sinh doanh thu ma khong ton
 * ha tong, nen tieu ty le hon cua hang ban.
 */
export function blendedRates(
  buildings: BuildingNode[],
): { cogsRate: number; opexRate: number } {
  let yieldSum = 0;
  let cogsWeighted = 0;
  let opexWeighted = 0;
  for (const node of buildings) {
    const def = BUILDING_BY_ID[node.defId];
    if (!def) continue;
    const weight = def.baseYieldPerSec * node.level;
    yieldSum += weight;
    cogsWeighted += weight * (def.cogsRate ?? DEFAULT_COGS_RATE);
    opexWeighted += weight * (def.opexRate ?? DEFAULT_OPEX_RATE);
  }
  if (yieldSum === 0) {
    return { cogsRate: DEFAULT_COGS_RATE, opexRate: DEFAULT_OPEX_RATE };
  }
  return { cogsRate: cogsWeighted / yieldSum, opexRate: opexWeighted / yieldSum };
}

/**
 * Ty le gia von van hanh tren DOANH THU GOP, sau thue.
 *
 * Ban <= 6 chi cong doanh thu nen `revenue` (nay la tien thuc nhan) chinh la
 * doanh thu thuan. Sau khi tach gia von + chi phi van hanh + thue, luoi thu
 * chi con mot phan nen tien ngan khoc se giam so voi truoc - pho sanh phu
 * thep `UPGRADE_GROWTH` va `xpForLevel` se pha.
 *
 * `grossRevenue` phai lon gap `grossUpFor()` lan moi thu duoc DUNG so tien
 * dang duoc tra. Cong thuc nay dung bien loi nhuan thuc te cua tung thanh pho
 * nen doi ty le gia von / van hanh khong lam cho canh bang lech.
 */
export function grossUpFor(cogsRate: number, opexRate: number, storeShare: number): number {
  const ebitRate = 1 - storeShare * cogsRate - opexRate;
  // Thanh pho khong co cua hang nao thi khong co gia van, chi con van hanh.
  const netRate = Math.max(0.05, ebitRate * (1 - CORPORATE_TAX_RATE));
  return 1 / netRate;
}

export function flowFor(
  buildings: BuildingNode[],
  npcs: NpcState[],
  mayorLevel: number,
  currentCoins = 0,
  opts: FlowOptions = {},
): FlowBreakdown {
  const demand = demandPerSecond(buildings, npcs);
  const supply = supplyPerSecond(buildings);
  const volume = Math.min(demand, supply);
  const share = digitalShare(buildings, npcs);
  const digitalVolume = volume * share;
  const takeRate = takeRateFor(buildings);

  const supplyFactor =
    demand <= 0 ? 1 : MIN_SUPPLY_FACTOR + (1 - MIN_SUPPLY_FACTOR) * Math.min(1, supply / demand);

  const happinessMult = taxMultiplierFromHappiness(
    happinessFor(buildings, opts.idleMs ?? 0, opts.happinessBoost ?? 0) +
      (opts.relicHappinessBonus ?? 0),
  );
  const levelBonus = 1 + (mayorLevel - 1) * 0.12;
  const feverMult = opts.isFever ? 2 : 1;
  const relicMult = 1 + (opts.relicBonus ?? 0);

  const storeYield = directStoreYieldPerSecond(buildings) * supplyFactor * happinessMult * levelBonus;
  const savingsYield = savingsInterestPerSecond(buildings, currentCoins);
  const networkFeeRevenue = digitalVolume * takeRate * happinessMult * levelBonus;

/* ── P&L: cong doanh thu gross truoc khi tru bat ky dong chi nao ── */
  const revenueCu = (storeYield + networkFeeRevenue + savingsYield) * feverMult * relicMult;

  /**
   * Gia von CHI ap cho doanh thu ban hang. Doanh thu phi thu ho va lai tich
   * lu khong ton ha tong nen khong co dong gia von - day la phan biet co ban
   * trong ke toan ma game nay day tinh.
   */
  const { cogsRate, opexRate } = blendedRates(buildings);
  const storeShare =
    revenueCu > 0 ? (storeYield * feverMult * relicMult) / revenueCu : 0;
  const grossUp = grossUpFor(cogsRate, opexRate, storeShare);
  const grossRevenue = revenueCu * grossUp;

  const cogs = grossRevenue * storeShare * cogsRate;
  const grossProfit = grossRevenue - cogs;

  const opex = grossRevenue * opexRate;

  /*
   * Du phong no xau: gia that cua viec cap tin dung. Tru o tang CHI PHI HOAT
   * DONG chu khong phai sau thue, vi voi ben cho vay thi ton that tin dung la
   * chi phi kinh doanh binh thuong.
   */
  const danSo = populationFor(buildings);
  const bnplCredit = bnplCreditPerSecond(buildings);
  const nplRate = nplRateFor(bnplCredit, danSo);
  const badDebt = bnplCredit * nplRate;

  const operatingIncome = grossProfit - opex - badDebt;

  /*
   * Lai vay tru TRUOC thue, dung thu tu bao cao that. Day cung la ly do vay
   * von co "la chan thue": moi dong lai vay lam giam thu nhap chiu thue.
   */
  const interestExpense = interestPerSecond(opts.debt ?? 0);
  const pretaxIncome = operatingIncome - interestExpense;
  const tax = Math.max(0, pretaxIncome) * CORPORATE_TAX_RATE;
  const netIncome = pretaxIncome - tax;

  return {
    demand,
    supply,
    volume,
    digitalShare: share,
    digitalVolume,
    takeRate,
    supplyFactor,
    storeYield: storeYield * feverMult * relicMult,
    savingsYield: savingsYield * feverMult * relicMult,
    networkFee: networkFeeRevenue * feverMult * relicMult,

    grossRevenue,
    cogs,
    grossProfit,
    grossMargin: grossRevenue > 0 ? grossProfit / grossRevenue : 0,
    opex,
    badDebt,
    nplRate,
    bnplCredit,
    operatingIncome,
    operatingMargin: grossRevenue > 0 ? operatingIncome / grossRevenue : 0,
    interestExpense,
    pretaxIncome,
    tax,
    netIncome,
    netMargin: grossRevenue > 0 ? netIncome / grossRevenue : 0,
    costPerSec: cogs + opex + badDebt + interestExpense + tax,

    revenue: netIncome,
  };
}

/** Xu/giay tong cong cua toan thanh pho. */
export function coinsPerSecond(
  buildings: BuildingNode[],
  npcs: NpcState[],
  mayorLevel: number,
  currentCoins = 0,
  opts: FlowOptions = {},
): number {
  return flowFor(buildings, npcs, mayorLevel, currentCoins, opts).revenue;
}

/** Thuong AFK Offline (45% san luong thuc te trong thoi gian vang mat). */
export function offlineCoins(coinsPerSecondValue: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || coinsPerSecondValue <= 0) return 0;
  const seconds = elapsedMs / 1000;
  return Math.round(coinsPerSecondValue * seconds * 0.45);
}

export function landCostCoins(unlockedCols: number, unlockedRows: number): number {
  const owned = unlockedCols * unlockedRows;
  return Math.round((150 + owned * 26) / 10) * 10;
}

export function isInsideUnlocked(
  state: { unlockedCols: number; unlockedRows: number },
  col: number,
  row: number,
): boolean {
  return col < state.unlockedCols && row < state.unlockedRows;
}

export function buildingAt(
  buildings: BuildingNode[],
  col: number,
  row: number,
): BuildingNode | undefined {
  return buildings.find((b) => b.col === col && b.row === row);
}
