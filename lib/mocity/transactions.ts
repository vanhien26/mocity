/**
 * TRANSACTION ENGINE - nguồn sinh tiền duy nhất của game.
 *
 * TRƯỚC ĐÂY: `coins += rate × seconds` trong `tickIdle`. Tiền tự sinh theo
 * thời gian, không có khái niệm khách hàng, không có giao dịch. P&L là số
 * suy ra từ tỷ lệ chứ không phản ánh tiền đi lại.
 *
 * GIỜ: tiền chỉ vào ngân khố khi một ĐƠN HÀNG được ĐÓNG, và mỗi đơn là một
 * dòng tiền thật đi qua 4 bước:
 *
 *   khách trả gross  ->  ví  +gross
 *   trả NCC          ->  ví  -cogs
 *   trả tiền nhà     ->  ví  -opex
 *   nộp thuế         ->  ví  -tax
 *
 * Vòng đời 1 đơn:
 *   ĐẾN   khách tự đến theo `arrivalRateFor` (autonomous)
 *   CHỜ   nằm trong hàng, đồng hồ đếm `MAX_WAIT_MS`
 *   ĐÓNG  NGƯỜI CHƠI bấm -> sinh Transaction -> tiền chảy
 *   HỦY   quá hạn hoặc hàng đầy -> khách bỏ đi, mất doanh thu thật
 *
 * `flowFor` KHÔNG BỊ XÓA. Nó trở thành hàm DỰ BÁO (tiềm năng mỗi giây),
 * dùng cho HUD, trần vay EBIT và test purity. Nguồn tiền không còn đọc nó.
 */

import type { BuildingNode, NpcState, ShopQueue } from './types';
import {
  CORPORATE_TAX_RATE,
  nodeYieldBreakdown,
  queueCapacityFor,
} from './city-calculator';
import { BUILDING_BY_ID, MENU_BY_BUILDING, type MenuItemDef } from './mock-city-data';

/** Khớp `DEFAULT_COGS_RATE` / `DEFAULT_OPEX_RATE` trong `city-calculator`. */
const DEFAULT_COGS_RATE = 0.35;
const DEFAULT_OPEX_RATE = 0.22;

export type { ShopQueue };

/* ───────────────────────── THAM SỐ CÂN BẰNG ───────────────────────── */

/**
 * Trọng số chuyển `merchantCapacity` thành số khách đến mỗi giây.
 *
 * `merchantCapacity` trong data (85..560) là chỉ số sức chứa tương đối, không
 * phải "Xu/giây" như cách `supplyPerSecond` từng dùng. Chia 600 để Quán Cà
 * Phê (85) đón ~0,14 khách/giây - tức 1 khách mỗi 7 giây, khớp thời gian
 * phục vụ mà mô hình visual đang mô phỏng.
 */
export const ARRIVAL_DIVISOR = 600;

/** Dân số khá hơn -> đi lại nhiều hơn. Hệ số nhẹ để không phá cân bằng. */
export const ARRIVAL_LEVEL_SCALE = 0.05;

/**
 * HÀNG CHỜ CHỈ DÀNH CHO ĐÚNG NHÓM ĂN UỐNG - MUA SẮM (zone COMMERCIAL).
 *
 * Bản trước cho MỌI công trình có năng suất một `arrivalRate` giả (qua
 * `DEFAULT_MERCHANT_CAPACITY`) để không mất nguồn thu - kết quả là nhà ở,
 * ngân hàng, kỳ quan... cũng bày ra "khách xếp hàng" dù không hợp lý: nhà ở
 * thì ai xếp hàng để trả tiền thuê, sàn chứng khoán thì ai xếp hàng để gửi
 * lệnh mua.
 *
 * Giờ hàng chờ CHỈ áp dụng cho 7 công trình COMMERCIAL (đúng 7/19, khớp với
 * tập công trình có khai báo `merchantCapacity` trong data - hai thứ luôn đi
 * cùng nhau, không cần default). Các zone còn lại (RESIDENTIAL, FINTECH,
 * LANDMARK) trở lại sinh Xu THỤ ĐỘNG mỗi giây trong `tickIdle` - xem khối
 * "THU NHẬP THỤ ĐỘNG - ngoài COMMERCIAL" ở đó.
 */

/**
 * Tỷ lệ khách CHỊU XẾP hàng trước khi hàng đầy, so với thời gian chờ tối đa.
 *
 * Đây là công thức mất tiền, không phải chi tiết trang trí: với F = 0,5 thì
 * để tiệm không ai dọn trong một khoảng thời gian, người chơi mất đúng khoảng
 * một nửa doanh thu. F = 1 thì không bao giờ mất gì và mất hết áp lực.
 */
export const QUEUE_FILL_RATIO = 0.5;

/**
 * Quá ngần này thì khách bỏ đi.
 *
 * 90 giây: đủ để người chơi lướt qua 3-4 hàng phố rồi quay lại, nhưng đủ ngắn
 * để vắng mặt thật sự có giá - không phải chờ đợi vô hạn rồi "khách hàng chờ
 * đến già".
 */
export const MAX_WAIT_MS = 90_000;

/** Trần đơn xử lý offline mỗi lần quay lại, chống ăn gian ngủ 3 ngày. */
export const OFFLINE_ORDER_CAP = 2_000;

/**
 * Giảm hiệu suất khi người chơi vắng mặt: cửa hàng vẫn buôn bán nhưng không
 * có chủ canh giá, không upsell. Giữ đúng ngưỡng 45% của cơ chế offline cũ.
 */
export const OFFLINE_FILL_RATE = 0.45;

/** Bấm đơn có cho XP - chia 60 như nhàn rỗi, giữ nguyên nhịp lên cấp. */
export const XP_PER_XU = 1 / 60;

/* ───────────────────────────────── TYPES ───────────────────────────── */

/** Một giao dịch đã đóng. Là đơn vị ghi sổ cái nhỏ nhất. */
export interface Transaction {
  id: string;
  at: number;
  shopId: string;
  /** Tiền khách trả. */
  gross: number;
  /** Trả nhà cung cấp. */
  cogs: number;
  /** Trả tiền mặt bằng, điện nước. */
  opex: number;
  /** Nộp thuế TNDN. */
  tax: number;
  /** Còn lại trong ngân khố = gross - cogs - opex - tax. */
  net: number;
  /** Đơn thanh toán số -> phát sinh phí hạ tầng. */
  digital: boolean;
  /** Tên món khách gọi - rỗng nếu tiệm không có menu (vd lô offline-batch cũ). */
  itemName?: string;
}

/** Hàng chờ của một tiệm. Xem `types.ts` (dùng chung để tránh vòng lặp import). */

/** Kết quả của một lượt dọn hàng / bấm đơn. */
export interface CloseResult {
  txns: Transaction[];
  /** Số khách bỏ đi vì quá hạn hoặc hết chỗ trong lượt này. */
  lost: number;
}

/**
 * Toàn bộ bối cảnh cần để sinh 1 giao dịch.
 *
 * Tách riêng để `transactions.ts` là module thuần: không đọc global, không
 * gọi `Date.now()` bên trong, cùng đầu vào ra cùng kết quả (giống `flowFor`).
 */
export interface TxCtx {
  buildings: BuildingNode[];
  npcs: NpcState[];
  /** `taxMultiplierFromHappiness(happiness)` - khách vui thì chịu chi cao hơn. */
  happinessMult: number;
  /** `1 + (mayorLevel - 1) × 0.12` - chính sách Thị Trưởng. */
  levelBonus: number;
  /** Phí hạ tầng MoMo tính trên đơn số. */
  takeRate: number;
  /** Thời điểm tuyệt đối, ms. */
  now: number;
  /**
   * Hệ số cung - cầu (`supplyFactor` trong `flowFor`).
   *
   * Thiếu nó thì giao dịch thực trả nhiều hơn dự báo khoảng 40% ở thành phố
   * có nhà ở: cầu vượt cung thì `flowFor` đã cắt sản lượng, còn giao dịch
   * vẫn bán full - P&L và ví lại nói hai câu chuyện khác nhau.
   */
  supplyFactor?: number;
  /**
   * Hệ số sự kiện: Fever x2, cổ vật cộng dồn.
   *
   * Cũ thì `flow.revenue` đã nhân sẵn, giờ giao dịch phải tự nhân nếu không
   * bật Fever sẽ không còn ý nghĩa gì.
   */
  earnMult?: number;
}

/* ─────────────────────── THÔNG SỐ THEO TIỆM ───────────────────────── */

/** Số khách đến mỗi giây của một tiệm. */
export function arrivalRateFor(node: BuildingNode): number {
  const def = BUILDING_BY_ID[node.defId];
  // Chi COMMERCIAL moi co khach xep hang - xem ghi chu tren DEFAULT_MERCHANT_CAPACITY cu.
  if (!def || def.zone !== 'COMMERCIAL' || !def.merchantCapacity) return 0;
  const base = def.merchantCapacity / ARRIVAL_DIVISOR;
  return base * (1 + (node.level - 1) * ARRIVAL_LEVEL_SCALE);
}

/**
 * Số khách được phép chờ TỐI ĐA tại một tiệm.
 *
 * `queueCapacityFor` trong `city-calculator` trả 1..4 - đó là ngưỡng để tính
 * hệ số chen lấn, không phải sức chứa thật. Dùng nó làm trần hàng thì tiệm
 * level 1 chỉ giữ nổi 1 khách: khách đến sau 7 giây là bỏ đi và người chơi
 * mất tiền chỉ vì không kịp bấm.
 *
 * Sức chứa thật = khách đến trong nửa thời gian chờ, nên:
 * - không bấm gì -> mất khoảng một nửa doanh thu (xem `QUEUE_FILL_RATIO`);
 * - dọn hàng trước khi hàng đầy -> không mất gì;
 * - khách cũng có hạn 90 giây, nên dọn đều thì cả hai cơ chế cùng không chạm tới.
 */
export function queueHardCap(node: BuildingNode): number {
  const r = arrivalRateFor(node);
  const byTime = Math.ceil(r * (MAX_WAIT_MS / 1000) * QUEUE_FILL_RATIO);
  return Math.max(queueCapacityFor(node), byTime, 1);
}

/** Số chỗ chờ. Vượt chỗ này là khách mới bỏ đi ngay. */
export function capacityFor(node: BuildingNode): number {
  return queueCapacityFor(node);
}

/**
 * Giá trị GROSS của một đơn, chưa nhân multiplier thành phố.
 *
 * `totalPerSec / arrivalRate` nghĩa là "1 đơn = sản lượng của arrivalRate giây".
 * Đây là điểm then chốt: **tổng doanh thu tiềm năng mỗi giây vẫn bằng đúng
 * `totalPerSec`** nên toàn bộ cân bằng nâng cấp/cấp/chương không phải làm lại.
 */
export function orderValueFor(node: BuildingNode, allBuildings: BuildingNode[]): number {
  const rate = arrivalRateFor(node);
  if (rate <= 0) return 0;
  return nodeYieldBreakdown(node, allBuildings).totalPerSec / rate;
}

/**
 * CHU KỲ BIẾN THIÊN GIÁ ĐƠN - trung bình CỘNG đúng bằng 1.
 *
 * `orderValueFor` trả một giá trị duy nhất cho mọi đơn - khách nào cũng trả
 * y hệt nhau, không giống buôn bán thật (có người mua lẻ, có người gom sỉ).
 * 6 nấc này nhân vào `orderValueFor` để mỗi đơn khác giá trị nhau thật, nhưng
 * (0,6+0,85+1,0+1,2+1,45+0,9)/6 = 1,0 nên gộp nhiều đơn lại vẫn đúng tổng
 * tiềm năng gốc - không cần cân bằng lại nâng cấp/giá vì chuyện này.
 */
const ORDER_VARIANCE_CYCLE = [0.6, 0.85, 1.0, 1.2, 1.45, 0.9] as const;

/** Hash chuỗi đơn giản, chỉ để lệch pha chu kỳ giữa các tiệm - không cần mật mã học. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Hệ số biến thiên của đơn thứ `txSeq` tại tiệm `shopId`.
 *
 * Lệch pha theo `shopId` để các tiệm không cùng "đơn to" ở cùng một nhịp -
 * nếu không thì cảnh "mọi tiệm cùng lúc nổ đơn lớn" lặp lại mỗi 6 đơn trông
 * giả. Thuần, xác định - cùng input luôn ra cùng output, test được.
 */
export function orderVarianceFor(shopId: string, txSeq: number): number {
  const offset = hashString(shopId) % ORDER_VARIANCE_CYCLE.length;
  const idx = (((txSeq + offset) % ORDER_VARIANCE_CYCLE.length) + ORDER_VARIANCE_CYCLE.length) % ORDER_VARIANCE_CYCLE.length;
  return ORDER_VARIANCE_CYCLE[idx];
}

/**
 * Món khách gọi - chốt NGAY từ lúc khách tới hàng (`arrivedAt`), không đổi
 * cho tới lúc đơn được đóng. Cùng một `arrivedAt` luôn ra cùng một món, nên
 * bong bóng thoại lúc khách đứng chờ và giá lúc bấm bán PHẢI khớp nhau -
 * đây là điểm thay thế trực tiếp `orderVarianceFor` cho tiệm có menu: món
 * CÓ TÊN thật thay vì một hệ số vô danh.
 */
export function menuItemFor(shopDefId: string, arrivedAt: number): MenuItemDef | null {
  const menu = MENU_BY_BUILDING[shopDefId];
  if (!menu || menu.length === 0) return null;
  const idx = Math.abs(hashString(`${shopDefId}:${arrivedAt}`)) % menu.length;
  return menu[idx];
}

/** Tiệm có nhận thanh toán số không (chủ đã tin tưởng hoặc gắn Loa QR). */
export function isDigitalShop(node: BuildingNode, npcs: NpcState[]): boolean {
  if ((node.modules ?? []).includes('QR_LOA_THAN_TAI')) return true;
  const npc = npcs.find((n) => n.buildingId === node.id);
  return Boolean(npc?.acceptsDigital);
}

/** Chi phí theo TỪNG tiệm, không pha trộn toàn phố như `blendedRates`. */
function ratesFor(node: BuildingNode): { cogsRate: number; opexRate: number } {
  const def = BUILDING_BY_ID[node.defId];
  return {
    cogsRate: def?.cogsRate ?? DEFAULT_COGS_RATE,
    opexRate: def?.opexRate ?? DEFAULT_OPEX_RATE,
  };
}

/* ───────────────────────── SINH GIAO DỊCH ─────────────────────────── */

/**
 * Chốt 1 đơn thành `Transaction`.
 *
 * Phân bổ theo đúng thứ tự kế toán:
 *   gross  = giá bán (+ phí hạ tầng nếu đơn số)
 *   cogs   = áp cho phần bán hàng (phần phí hạ tầng không có giá vốn)
 *   opex   = áp cho TOÀN bộ gross (như `flowFor` vẫn làm)
 *   tax    = 20% lợi nhuận trước thuế của đơn này
 */
export function closeOneOrder(
  node: BuildingNode,
  ctx: TxCtx,
  txSeq: number,
  /**
   * Mốc giờ khách TỚI hàng (ms). Có giá trị này thì giá đơn chốt theo MÓN
   * thật (`menuItemFor`) - cùng món, cùng giá với bong bóng thoại lúc khách
   * đứng chờ. Không có (vd lô offline-batch không giữ từng khách riêng) thì
   * rơi về `orderVarianceFor` cũ - vẫn khác giá mỗi đơn, chỉ không có tên món.
   */
  arrivedAt?: number,
): Transaction | null {
  const base = orderValueFor(node, ctx.buildings);
  if (base <= 0) return null;

  /*
   * Cùng chuỗi hệ số với `flowFor`: hạnh phúc -> cấp Thị Trưởng -> cung/cầu
   * -> Fever/cổ vật. Bỏ sót một bậc là giao dịch thực lệch dự báo và người
   * chơi không hiểu vì sao P&L báo một đường, ví đi một nẻo.
   */
  const mult =
    ctx.happinessMult * ctx.levelBonus * (ctx.supplyFactor ?? 1) * (ctx.earnMult ?? 1);
  const item = arrivedAt !== undefined ? menuItemFor(node.defId, arrivedAt) : null;
  // Moi don mot gia khac nhau that - mon neu co, khong thi roi ve chu ky cu.
  const variance = item ? item.priceRatio : orderVarianceFor(node.id, txSeq);
  const storeValue = base * mult * variance;
  const digital = isDigitalShop(node, ctx.npcs);
  const fee = digital ? storeValue * ctx.takeRate : 0;
  const gross = storeValue + fee;

  const { cogsRate, opexRate } = ratesFor(node);
  const cogs = storeValue * cogsRate;
  const opex = gross * opexRate;
  const pretax = Math.max(0, gross - cogs - opex);
  const tax = pretax * CORPORATE_TAX_RATE;
  const net = gross - cogs - opex - tax;

  return {
    id: `t${ctx.now}-${node.id}-${txSeq}`,
    at: ctx.now,
    shopId: node.id,
    gross,
    cogs,
    opex,
    tax,
    net,
    digital,
    itemName: item?.name,
  };
}

/* ───────────────────── SINH KHÁCH MỚI (autonomous) ─────────────────── */

let arrivalAcc = new Map<string, number>();

/** Reset bộ tích lũy - gọi khi load save hoặc khi cấu trúc tiệm đổi. */
export function resetArrivalAccumulator(): void {
  arrivalAcc = new Map();
}

/**
 * Đưa khách mới vào hàng theo `arrivalRateFor × deltaMs`.
 *
 * Dùng tích lũy lẻ để rate 0,14 khách/giây không bị làm tròn về 0 mỗi tick:
 * sau 7 giây mới rụng đúng 1 khách. Vượt chỗ chờ thì khách bỏ đi ngay -
 * đây là mất doanh thu thật, không phải hình phạt suy ra.
 */
export function settleArrivals(
  buildings: BuildingNode[],
  queues: ShopQueue[],
  ctx: Pick<TxCtx, 'now'>,
  deltaMs: number,
): { queues: ShopQueue[]; arrived: number; lost: number } {
  if (deltaMs <= 0) return { queues, arrived: 0, lost: 0 };

  const byId = new Map(queues.map((q) => [q.shopId, q]));
  let arrived = 0;
  let lost = 0;

  for (const node of buildings) {
    const rate = arrivalRateFor(node);
    if (rate <= 0) continue;
    /*
     * Công trình không sinh năng suất thì không có gì để bán.
     *
     * Bỏ qua ở đây chứ không để im: nếu cứ cho khách vào hàng rồi
     * `closeOneOrder` trả `null` vì không có giá trị, khách sẽ đứng đó cho
     * tới khi hết hạn mà không ai đóng được - một hàng chờ chết.
     */
    if (orderValueFor(node, buildings) <= 0) continue;

    const prev = arrivalAcc.get(node.id) ?? 0;
    const raw = prev + rate * (deltaMs / 1000);
    const whole = Math.floor(raw);
    arrivalAcc.set(node.id, raw - whole);
    if (whole <= 0) continue;

    let q = byId.get(node.id);
    if (!q) {
      q = { shopId: node.id, arrivedAt: [] };
      byId.set(node.id, q);
      queues = [...queues, q];
    }

    const cap = queueHardCap(node);
    for (let i = 0; i < whole; i++) {
      if (q.arrivedAt.length < cap) {
        q.arrivedAt.push(ctx.now);
        arrived++;
      } else {
        lost++;
      }
    }
  }

  return { queues: Array.from(byId.values()), arrived, lost };
}

/* ─────────────────── KHÁCH BỎ ĐI (autonomous) ─────────────────────── */

/** Bỏ mọi khách đã chờ quá `MAX_WAIT_MS`. Trả về số khách mất. */
export function expireQueues(
  buildings: BuildingNode[],
  queues: ShopQueue[],
  ctx: Pick<TxCtx, 'now'>,
): { queues: ShopQueue[]; lost: number } {
  let lost = 0;
  const next = queues
    .map((q) => {
      const keep = q.arrivedAt.filter((at) => {
        const expired = ctx.now - at > MAX_WAIT_MS;
        if (expired) lost++;
        return !expired;
      });
      if (keep.length === q.arrivedAt.length) return q;
      return { ...q, arrivedAt: keep };
    })
    .filter((q) => q.arrivedAt.length > 0 || buildings.some((b) => b.id === q.shopId));

  return { queues: next, lost };
}

/* ───────────────────────── ĐÓNG ĐƠN (player) ──────────────────────── */

/**
 * Bấm 1 đơn ở tiệm cụ thể. Trả `null` nếu hàng đang trống.
 * Xóa luôn khách đã chờ lâu nhất (FIFO) để đơn giá nhất quán.
 */
export function closeSingleOrder(
  node: BuildingNode,
  queues: ShopQueue[],
  ctx: TxCtx,
  txSeq: number,
): { queues: ShopQueue[]; txn: Transaction | null } {
  const q = queues.find((x) => x.shopId === node.id);
  if (!q || q.arrivedAt.length === 0) return { queues, txn: null };

  // Vao truoc ban truoc (FIFO) - dung khach dang dung dau hang tren via he.
  const servedAt = q.arrivedAt[0];
  const txn = closeOneOrder(node, ctx, txSeq, servedAt);
  if (!txn) return { queues, txn: null };

  const remaining = q.arrivedAt.slice(1);
  const next = queues.map((x) => (x.shopId === node.id ? { ...x, arrivedAt: remaining } : x));
  return { queues: next.filter((x) => x.arrivedAt.length > 0), txn };
}

/**
 * Nút "Dọn hàng": đóng TOÀN BỘ khách đang chờ của 1 tiệm.
 *
 * Đây là cách người chơi xử lý hàng dài khi quay lại sau thời gian vắng.
 * Trả về danh sách transaction để caller ghi sổ cái một lần (không ghi lẻ).
 */
export function clearShopQueue(
  node: BuildingNode,
  queues: ShopQueue[],
  ctx: TxCtx,
  txSeqStart: number,
): { queues: ShopQueue[]; txns: Transaction[] } {
  const q = queues.find((x) => x.shopId === node.id);
  if (!q || q.arrivedAt.length === 0) return { queues, txns: [] };

  const txns: Transaction[] = [];
  for (let i = 0; i < q.arrivedAt.length; i++) {
    const txn = closeOneOrder(node, ctx, txSeqStart + i, q.arrivedAt[i]);
    if (txn) txns.push(txn);
  }

  return { queues: queues.filter((x) => x.shopId !== node.id), txns };
}

/** Tổng số khách đang chờ trên toàn thành phố. */
export function totalBacklog(queues: ShopQueue[]): number {
  return queues.reduce((sum, q) => sum + q.arrivedAt.length, 0);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * TỰ PHỤC VỤ - NHÂN VIÊN
 *
 * Trước đây NGƯỜI CHƠI phải bấm tay "Đóng đơn"/"Dọn hàng" mới ra tiền - tap
 * economy. Giờ chủ quán TỰ bán, nhưng CHẬM nếu chỉ có một mình; mỗi Nhân
 * Viên thuê thêm rút ngắn khoảng cách giữa 2 đơn liên tiếp. Đây là cơ chế
 * DUY NHẤT biến khách đang chờ thành tiền lúc đang chơi - không còn nút bấm
 * nào khác. (Lúc vắng mặt dùng `simulateOfflineBatch` riêng, không đụng
 * `shopQueues` nên không chồng lấn với vòng này.)
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Một mình chủ quán xoay xở: 14 giây mới ra 1 đơn - CHẬM có chủ đích. */
export const STAFF_BASE_INTERVAL_MS = 14_000;
/** Thuê tối đa 3 Nhân Viên mỗi tiệm. */
export const STAFF_MAX = 3;
/** Mỗi Nhân Viên rút còn 72% thời gian - 3 người còn ~37% so với 1 mình. */
export const STAFF_SPEED_PER_HIRE = 0.72;

/** Khoảng cách giữa 2 đơn tự đóng liên tiếp, theo số Nhân Viên hiện có. */
export function serviceIntervalMsFor(node: BuildingNode): number {
  const staff = Math.min(STAFF_MAX, Math.max(0, node.staffCount ?? 0));
  return STAFF_BASE_INTERVAL_MS * STAFF_SPEED_PER_HIRE ** staff;
}

export interface AutoServeResult {
  buildings: BuildingNode[];
  queues: ShopQueue[];
  txns: Transaction[];
}

/**
 * Chạy mỗi `tickIdle` (mỗi giây khi đang mở game).
 *
 * Với mỗi tiệm đang có khách chờ: tính số đơn đã "đến hạn" tự đóng dựa trên
 * `node.lastAutoServedAt`, đóng tối đa bấy nhiêu đơn (không vượt số khách
 * thật đang chờ), rồi DỜI mốc lên đúng bấy nhiêu chu kỳ - không reset về
 * `now`, nếu không phần dư (vd còn 4s nữa mới tới hạn) bị xoá mỗi tick và
 * nhịp bán không bao giờ tới hạn khi interval > TICK_MS.
 */
export function autoServeQueues(
  buildings: BuildingNode[],
  queues: ShopQueue[],
  ctx: TxCtx,
  txSeqStart: number,
): AutoServeResult {
  const now = ctx.now;
  let nextBuildings = buildings;
  let nextQueues = queues;
  const txns: Transaction[] = [];
  let seq = txSeqStart;

  for (let bi = 0; bi < buildings.length; bi++) {
    const node = buildings[bi];
    const def = BUILDING_BY_ID[node.defId];
    if (!def || def.zone !== 'COMMERCIAL') continue;

    const qIdx = queues.findIndex((x) => x.shopId === node.id);
    const q = qIdx >= 0 ? queues[qIdx] : null;

    // Chua tung co moc (save cu hoac tiem moi xay) - khoi tao ngay bang
    // `now`, KHONG tinh lui ve luc xay de khong don don hoi to.
    if (node.lastAutoServedAt === undefined) {
      if (nextBuildings === buildings) nextBuildings = [...buildings];
      nextBuildings[bi] = { ...node, lastAutoServedAt: now };
      continue;
    }

    if (!q || q.arrivedAt.length === 0) continue;

    const lastAt = node.lastAutoServedAt;
    const interval = serviceIntervalMsFor(node);
    const due = Math.floor((now - lastAt) / interval);
    if (due <= 0) continue;

    const serveCount = Math.min(due, q.arrivedAt.length);
    let liveArrived = q.arrivedAt;
    for (let i = 0; i < serveCount; i++) {
      const servedAt = liveArrived[0];
      const txn = closeOneOrder(node, ctx, seq++, servedAt);
      if (txn) txns.push(txn);
      liveArrived = liveArrived.slice(1);
    }

    if (nextQueues === queues) nextQueues = [...queues];
    if (liveArrived.length > 0) {
      nextQueues[qIdx] = { ...q, arrivedAt: liveArrived };
    } else {
      nextQueues.splice(nextQueues.findIndex((x) => x.shopId === node.id), 1);
    }

    if (nextBuildings === buildings) nextBuildings = [...buildings];
    nextBuildings[bi] = { ...node, lastAutoServedAt: lastAt + serveCount * interval };
  }

  return { buildings: nextBuildings, queues: nextQueues, txns };
}

/* ───────────────────── OFFLINE - MÔ PHỎNG LÔ ──────────────────────── */

/**
 * Mô phỏng lô giao dịch trong lúc người chơi vắng mặt.
 *
 * Nguyên tắc: vẫn là GIAO DỊCH THẬT, chỉ bị gộp lại. Cửa hàng vẫn buôn bán
 * nhưng không có chủ canh giá nên chỉ đạt `OFFLINE_FILL_RATE` sản lượng.
 *
 * Cách tính: lấy sản lượng tiềm năng (`totalPerSec`) trong thời gian vắng,
 * nhân fill rate, rồi chia cho giá 1 đơn để ra SỐ LƯỢNG đơn. Việc gộp thành
 * lô là cách duy nhất để offline không tạo ra 30.000 object trong bộ nhớ.
 */
export function simulateOfflineBatch(
  buildings: BuildingNode[],
  ctx: Omit<TxCtx, 'now'>,
  elapsedMs: number,
): Transaction[] {
  if (elapsedMs <= 0) return [];

  const seconds = elapsedMs / 1000;
  const byShop = new Map<string, BuildingNode>();
  for (const b of buildings) byShop.set(b.id, b);

  const txns: Transaction[] = [];
  let seq = 0;
  let budget = OFFLINE_ORDER_CAP;

  for (const node of buildings) {
    if (budget <= 0) break;
    const value = orderValueFor(node, ctx.buildings);
    if (value <= 0) continue;

    const potential = nodeYieldBreakdown(node, ctx.buildings).totalPerSec * seconds;
    const orderCount = Math.floor((potential * OFFLINE_FILL_RATE) / value);
    if (orderCount <= 0) continue;

    const n = Math.min(orderCount, budget);
    budget -= n;
    for (let i = 0; i < n; i++) {
      seq++;
      const txn = closeOneOrder(node, { ...ctx, now: 0 }, seq);
      if (txn) txns.push(txn);
    }
  }

  return txns;
}

/** Cộng dồn danh sách transaction thành 1 delta ghi sổ cái. */
export function sumTransactions(txns: Transaction[]): {
  grossRevenue: number;
  cogs: number;
  opex: number;
  tax: number;
  netIncome: number;
  digitalCount: number;
} {
  const acc = {
    grossRevenue: 0,
    cogs: 0,
    opex: 0,
    tax: 0,
    netIncome: 0,
    digitalCount: 0,
  };
  for (const t of txns) {
    acc.grossRevenue += t.gross;
    acc.cogs += t.cogs;
    acc.opex += t.opex;
    acc.tax += t.tax;
    acc.netIncome += t.net;
    if (t.digital) acc.digitalCount++;
  }
  return acc;
}
