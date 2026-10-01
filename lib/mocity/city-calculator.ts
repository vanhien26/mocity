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
  /** Xu thi truong thu ve moi giay. */
  revenue: number;
}

export interface FlowOptions {
  isFever?: boolean;
  /** Ms ke tu su kien toan pho gan nhat duoc xu ly - day vao suy giam hanh phuc. */
  idleMs?: number;
  /** Diem hanh phuc cong don tu phuong an dialogue vua chon. */
  happinessBoost?: number;
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
    happinessFor(buildings, opts.idleMs ?? 0, opts.happinessBoost ?? 0),
  );
  const levelBonus = 1 + (mayorLevel - 1) * 0.12;
  const feverMult = opts.isFever ? 2 : 1;

  const storeYield = directStoreYieldPerSecond(buildings) * supplyFactor * happinessMult * levelBonus;
  const savingsYield = savingsInterestPerSecond(buildings, currentCoins);
  const networkFeeRevenue = digitalVolume * takeRate * happinessMult * levelBonus;

  const revenue = (storeYield + networkFeeRevenue + savingsYield) * feverMult;

  return {
    demand,
    supply,
    volume,
    digitalShare: share,
    digitalVolume,
    takeRate,
    supplyFactor,
    storeYield: storeYield * feverMult,
    savingsYield: savingsYield * feverMult,
    networkFee: networkFeeRevenue * feverMult,
    revenue,
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
