/**
 * Kiểm chứng Transaction Engine - nguồn tiền duy nhất của thành phố.
 *
 * Cốt lõi là một đẳng thức: **tiền vào ví từ giao dịch phải bằng đúng con số
 * P&L tự trừ ra**. Nếu lệch thì người chơi bấm thấy một đường, sổ cái báo một
 * nẻo - đúng lỗi mà lần sửa này ra đời để chặn.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CORPORATE_TAX_RATE,
  MIN_SUPPLY_FACTOR,
  blendedRates,
  demandPerSecond,
  directStoreYieldPerSecond,
  flowFor,
  happinessFor,
  nodeYieldBreakdown,
  savingsInterestPerSecond,
  supplyPerSecond,
  takeRateFor,
  taxMultiplierFromHappiness,
} from './city-calculator';
import {
  ARRIVAL_DIVISOR,
  MAX_WAIT_MS,
  menuItemFor,
  QUEUE_FILL_RATIO,
  OFFLINE_FILL_RATE,
  OFFLINE_ORDER_CAP,
  arrivalRateFor,
  closeOneOrder,
  closeSingleOrder,
  expireQueues,
  resetArrivalAccumulator,
  orderValueFor,
  orderVarianceFor,
  queueHardCap,
  settleArrivals,
  simulateOfflineBatch,
  sumTransactions,
  totalBacklog,
  type ShopQueue,
  type TxCtx,
} from './transactions';
import { BUILDINGS, MENU_BY_BUILDING } from './mock-city-data';
import type { BuildingNode } from './types';

function node(defId: string, level = 5, id = `${defId}_${level}`): BuildingNode {
  return {
    id,
    defId,
    col: 0,
    row: 0,
    level,
    starRating: 1,
    lastCollectedAt: 0,
    modules: [],
  };
}

/** Bối cảnh giống hệt `txCtxFor` trong store, dùng để so với `flowFor`. */
function ctxFor(buildings: BuildingNode[], mayorLevel = 10, _coins = 50_000, now = 0): TxCtx {
  const happiness = happinessFor(buildings, 0, 0);
  const demand = demandPerSecond(buildings, []);
  const supply = supplyPerSecond(buildings);
  return {
    buildings,
    npcs: [],
    happinessMult: taxMultiplierFromHappiness(happiness),
    levelBonus: 1 + (mayorLevel - 1) * 0.12,
    takeRate: takeRateFor(buildings),
    now,
    supplyFactor:
      demand <= 0 ? 1 : MIN_SUPPLY_FACTOR + (1 - MIN_SUPPLY_FACTOR) * Math.min(1, supply / demand),
    earnMult: 1,
  };
}

/**
 * Tổng doanh thu/gốc do giao dịch + lãi tiết kiệm + thu nhập thụ động tạo ra
 * mỗi giây.
 *
 * Đơn giờ có BIẾN THIÊN giá trị (`orderVarianceFor`, xem transactions.ts) -
 * một đơn đơn lẻ không còn khớp chính xác dự báo `flowFor` nữa, chỉ TRUNG
 * BÌNH một chu kỳ đủ dài (6 đơn, đúng độ dài `ORDER_VARIANCE_CYCLE`) mới
 * khớp - trung bình cộng của chu kỳ được thiết kế đúng bằng 1. Đây là
 * nguyên tắc mới thay cho "mọi đơn bằng nhau" của bản trước.
 */
function actualPerSecond(buildings: BuildingNode[], coins: number, mayorLevel = 10) {
  const ctx = ctxFor(buildings, mayorLevel, coins);
  const CYCLE = 6;
  let gross = 0;
  let net = 0;
  for (const n of buildings) {
    const rate = arrivalRateFor(n);
    if (rate <= 0) continue;
    let cycleGross = 0;
    let cycleNet = 0;
    for (let seq = 0; seq < CYCLE; seq++) {
      const txn = closeOneOrder(n, ctx, seq);
      if (!txn) continue;
      cycleGross += txn.gross;
      cycleNet += txn.net;
    }
    gross += (cycleGross / CYCLE) * rate;
    net += (cycleNet / CYCLE) * rate;
  }
  const savingsGross = savingsInterestPerSecond(buildings, coins);
  const { opexRate } = blendedRates(buildings);
  const savingsOpex = savingsGross * opexRate;
  const savingsTax = Math.max(0, savingsGross - savingsOpex) * CORPORATE_TAX_RATE;
  gross += savingsGross;
  net += savingsGross - savingsOpex - savingsTax;

  // Thu nhap thu dong (ngoai COMMERCIAL, ngoai 2 toa nha lai tiet kiem) -
  // guong dung khoi "THU NHAP THU DONG" trong tickIdle cua store.ts.
  const passiveNodes = buildings.filter((b) => {
    const def = BUILDINGS.find((d) => d.id === b.defId);
    if (!def || def.zone === 'COMMERCIAL') return false;
    return b.defId !== 'tram-tui-than-tai' && b.defId !== 'ngan-hang-so';
  });
  const passiveGross = passiveNodes.reduce(
    (s, n) => s + nodeYieldBreakdown(n, buildings).totalPerSec,
    0,
  );
  if (passiveGross > 0) {
    const { opexRate: passiveOpexRate } = blendedRates(passiveNodes);
    const passiveOpex = passiveGross * passiveOpexRate;
    const passiveTax = Math.max(0, passiveGross - passiveOpex) * CORPORATE_TAX_RATE;
    gross += passiveGross;
    net += passiveGross - passiveOpex - passiveTax;
  }

  return { gross, net };
}

/**
 * Lợi nhuận mà giao dịch phải tạo ra, tính từ đúng các dòng P&L của
 * `flowFor` nhưng KHÔNG có dự phòng nợ xấu / lãi vay - hai khoản này không
 * sinh ra trong một đơn hàng mà được ghi riêng trong `tickIdle`.
 */
function debtFreeNet(f: ReturnType<typeof flowFor>): number {
  const pretax = f.grossRevenue - f.cogs - f.opex;
  return pretax * (1 - CORPORATE_TAX_RATE);
}

describe('Giao dich phai khop 100% voi du bao flowFor', () => {
  /** Một công trình: hệ số pha trộn toàn phố chính bằng hệ số của nó. */
  const singleCases: [string, string[]][] = [
    ['tiem don le', ['quan-ca-phe']],
    ['tram tui than tai', ['tram-tui-than-tai']],
    ['ngan hang so', ['ngan-hang-so']],
    ['tiem + nha o (cau vuot cung)', ['quan-ca-phe', 'chung-cu-cao-cap']],
  ];

  for (const [name, defs] of singleCases) {
    it(`${name}: gross va net cung so`, () => {
      const buildings = defs.map((d, i) => node(d, 5, `${d}_${i}`));
      const coins = 50_000;
      const forecast = flowFor(buildings, [], 10, coins, { idleMs: 0 });
      const actual = actualPerSecond(buildings, coins);

      assert.ok(
        Math.abs(actual.gross - forecast.grossRevenue) < 1e-6,
        `gross: giao dich ${actual.gross} vs flowFor ${forecast.grossRevenue}`,
      );
      assert.ok(
        Math.abs(actual.net - debtFreeNet(forecast)) < 1e-6,
        `net: giao dich ${actual.net} vs flowFor ${debtFreeNet(forecast)}`,
      );
    });
  }

  it('phia sau lon: gross khop cang, net lech duong hien he so pha truoc', () => {
    /*
     * `flowFor` tính COGS/OPEX bằng hệ số PHA TRỘN toàn phố (`blendedRates`),
     * engine tính theo TỪNG tiệm (`ratesFor`). Hai con tiệm cùng tổng sản
     * lượng nhưng hệ số khác nhau thì tổng hai cách trừ không thể bằng nhau.
     * Chấp nhận lệch nhỏ để giữ phân tầng biên lợi nhuận theo loại hình:
     * quán ăn cogs 0.48 không được mang biên của ngân hàng cogs 0.15.
     *
     * Gross thì không có cớ nào lệch - đó mới là đẳng thức bắt buộc.
     */
    const buildings = ['trung-tam-thuong-mai', 'pho-am-thuc', 'chung-cu-cao-cap', 'ngan-hang-so'].map(
      (d, i) => node(d, 5, `${d}_${i}`),
    );
    const coins = 50_000;
    const forecast = flowFor(buildings, [], 10, coins, { idleMs: 0 });
    const actual = actualPerSecond(buildings, coins);

    assert.ok(
      Math.abs(actual.gross - forecast.grossRevenue) < 1e-6,
      `gross: giao dich ${actual.gross} vs flowFor ${forecast.grossRevenue}`,
    );
    assert.ok(
      Math.abs(actual.net - debtFreeNet(forecast)) < 0.02 * actual.gross,
      `net lech ${(actual.net - debtFreeNet(forecast)).toFixed(4)} - vuot 2% gross`,
    );
  });
});

describe('Hang cho chi danh cho COMMERCIAL', () => {
  it('cong trinh COMMERCIAL nao cung phai co don hang', () => {
    const missing: string[] = [];
    for (const def of BUILDINGS) {
      if (def.zone !== 'COMMERCIAL' || !def.baseYieldPerSec) continue;
      const n = node(def.id, 5, `${def.id}_5`);
      if (arrivalRateFor(n) <= 0 || orderValueFor(n, [n]) <= 0) missing.push(def.id);
    }
    assert.deepEqual(missing, [], `thieu don hang: ${missing.join(', ')}`);
  });

  it('cong trinh NGOAI COMMERCIAL khong xep hang - thu nhap qua tickIdle thu dong', () => {
    const offCommercial: string[] = [];
    for (const def of BUILDINGS) {
      if (def.zone === 'COMMERCIAL') continue;
      const n = node(def.id, 5, `${def.id}_5`);
      if (arrivalRateFor(n) !== 0) offCommercial.push(def.id);
    }
    assert.deepEqual(offCommercial, [], `cong trinh ngoai COMMERCIAL khong duoc co khach xep hang: ${offCommercial.join(', ')}`);
  });

  it('cong trinh khong sinh nang suat khong sinh khach gia', () => {
    // Ô đất trống không có năng suất -> không có gì để bán.
    const empty = node('quan-ca-phe', 1, 'khong-xay');
    assert.equal(orderValueFor({ ...empty, defId: 'khong-ton-tai' }, [empty]), 0);
  });
});

describe('Tong tiem nang COMMERCIAL van bang nang suat goc', () => {
  it('sum(orderValue x arrivalRate) = sum(totalPerSec) - chi dung voi COMMERCIAL', () => {
    // `chung-cu-cao-cap` (RESIDENTIAL) KHONG con trong phep tinh nay: no
    // khong xep hang nua, thu nhap cua no di qua tickIdle thu dong thay vi
    // qua don hang - xem khoi "THU NHAP THU DONG" trong store.ts.
    const buildings = [node('quan-ca-phe'), node('sieu-thi', 8, 'sieu-thi_8')];
    let fromOrders = 0;
    let fromYield = 0;
    for (const n of buildings) {
      fromOrders += orderValueFor(n, buildings) * arrivalRateFor(n);
      fromYield += nodeYieldBreakdown(n, buildings).totalPerSec;
    }
    assert.ok(Math.abs(fromOrders - fromYield) < 1e-9);
    assert.ok(fromYield > 0, 'phai co nang suat de do');
    assert.ok(fromYield === directStoreYieldPerSecond(buildings));
  });

  it('chua tinh multiplier: chinh cac he so moi nhan vao (tru bien thien don)', () => {
    const b = [node('quan-ca-phe')];
    const base = orderValueFor(b[0], b) * arrivalRateFor(b[0]);
    const ctx = { ...ctxFor(b), happinessMult: 1.5, levelBonus: 2, supplyFactor: 0.8, earnMult: 2 };
    const txn = closeOneOrder(b[0], ctx, 1)!;
    const scaled = txn.gross * arrivalRateFor(b[0]);
    const variance = orderVarianceFor(b[0].id, 1);
    assert.ok(Math.abs(scaled - base * 1.5 * 2 * 0.8 * 2 * variance) < 1e-9);
  });
});

describe('Hang cho: sinh, day, het han', () => {
  const b = [node('trung-tam-thuong-mai', 5)];

  it('khach den theo toc do arrivalRate', () => {
    const res = settleArrivals(b, [], { now: 1_000 }, 10_000);
    const expected = arrivalRateFor(b[0]) * 10;
    assert.ok(Math.abs(res.arrived - expected) < 1.5, `den ${res.arrived}, ky vong ${expected}`);
    assert.equal(totalBacklog(res.queues), res.arrived);
  });

  it('vuot suc chua thi khach bo di ngay - mat tien that', () => {
    let queues: ShopQueue[] = [];
    let lost = 0;
    // Chạy đủ lâu để hàng đầy hẳn (suc chua hien tai la khoang 51 khach).
    for (let i = 0; i < 80; i++) {
      const r = settleArrivals(b, queues, { now: i * 1000 }, 1_000);
      queues = r.queues;
      lost += r.lost;
    }
    const cap = queueHardCap(b[0]);
    assert.equal(totalBacklog(queues), cap, 'hang khong vuot suc chua');
    assert.ok(lost > 0, 'phai co khach bi mat vi hang day');
  });

  it('khach cho qua han thi di ve', () => {
    const t0 = 1_000_000;
    const queues: ShopQueue[] = [{ shopId: b[0].id, arrivedAt: [t0] }];
    const kept = expireQueues(b, queues, { now: t0 + MAX_WAIT_MS - 1 });
    assert.equal(totalBacklog(kept.queues), 1, 'chua het han');
    const gone = expireQueues(b, queues, { now: t0 + MAX_WAIT_MS + 1 });
    assert.equal(totalBacklog(gone.queues), 0, 'het han phai di ve');
    assert.equal(gone.lost, 1);
  });

  it('dung suc chua = mot nua thoi gian cho, khong phai queueCapacityFor 1..4', () => {
    const lv1 = node('quan-ca-phe', 1, 'q1');
    assert.ok(
      queueHardCap(lv1) > 1,
      'queueCapacityFor tra 1 o level 1 - neu dung thi khach bo sau mot lan den',
    );
    assert.ok(queueHardCap(lv1) >= Math.ceil(arrivalRateFor(lv1) * (MAX_WAIT_MS / 1000) * 0.5));
  });
});

describe('Mo phong lo AFK', () => {
  const big = [node('trung-tam-thuong-mai', 10)];

  it('van dung hieu suat 45% khi con trong tran don', () => {
    const elapsedMs = 60_000;
    const txns = simulateOfflineBatch(big, { ...ctxFor(big) }, elapsedMs);
    assert.ok(txns.length > 0, 'phai co don');

    // Sản lượng 60 giây chia giá 1 đơn = số đơn nếu bán full 100%.
    const potential =
      (nodeYieldBreakdown(big[0], big).totalPerSec * (elapsedMs / 1000)) /
      orderValueFor(big[0], big);
    const ratio = txns.length / potential;
    assert.ok(
      Math.abs(ratio - OFFLINE_FILL_RATE) < 0.15,
      `hieu suat offline ${ratio.toFixed(2)} phai quanh ${OFFLINE_FILL_RATE}`,
    );
  });

  it('nghi lau qua se cham tran don - khong phat sinh loi ao', () => {
    const txns = simulateOfflineBatch(big, { ...ctxFor(big) }, 8 * 3_600_000);
    assert.ok(txns.length > 0, 'phai co don');
    assert.equal(
      txns.length,
      OFFLINE_ORDER_CAP,
      'tiem lon 8h phai bi cap tai tran OFFLINE_ORDER_CAP',
    );
    // Gross phai it hon san luong 8h, khong de cap cho phep qua luong.
    const gross8h = nodeYieldBreakdown(big[0], big).totalPerSec * 8 * 3_600;
    const sum = sumTransactions(txns);
    assert.ok(sum.grossRevenue < gross8h, 'khong duoc ghi nang suat ca hon thoi gian cho phep');
  });

  it('khong co nang suat thi khong co don', () => {
    assert.deepEqual(simulateOfflineBatch([], { ...ctxFor([]) }, 3_600_000), []);
  });
});

describe('So lieu can bang', () => {
  it('ARRIVAL_DIVISOR dat Quan Ca Phe ~0.14 khach/giay', () => {
    const rate = arrivalRateFor(node('quan-ca-phe', 1, 'q1'));
    assert.ok(rate > 0.1 && rate < 0.2, `rate=${rate}`);
    assert.equal(85 / ARRIVAL_DIVISOR, arrivalRateFor(node('quan-ca-phe', 1, 'q1')));
  });

  it('cong trinh RESIDENTIAL (vd chung-cu-cao-cap) khong xep hang - arrivalRate = 0', () => {
    const n = node('chung-cu-cao-cap', 1, 'c1');
    assert.equal(arrivalRateFor(n), 0);
  });
});

describe('Dong don mot phan va don hang', () => {
  const b = [node('sieu-thi', 5)];

  it('bodon lay khach dau hang va tra ve giao dich', () => {
    const t = 2_000_000;
    const queues: ShopQueue[] = [{ shopId: b[0].id, arrivedAt: [t, t + 1, t + 2] }];
    const ctx = { ...ctxFor(b), now: t + 3 };

    const first = closeSingleOrder(b[0], queues, ctx, 1);
    assert.ok(first.txn);
    assert.equal(totalBacklog(first.queues), 2, 'van con 2 khach');

    const second = closeSingleOrder(b[0], first.queues, ctx, 2);
    assert.ok(second.txn);
    assert.equal(totalBacklog(second.queues), 1, 'van con 1 khach');

    const third = closeSingleOrder(b[0], second.queues, ctx, 3);
    assert.ok(third.txn, 'khach cuoi van phai ban duoc');
    assert.deepEqual(third.queues, [], 'hang phai rong sau don thu 3');
  });

  it('rong hang thi tra null - khong phat sinh tien', () => {
    const txn = closeSingleOrder(b[0], [], { ...ctxFor(b), now: 1 }, 1);
    assert.equal(txn.txn, null);
    assert.deepEqual(txn.queues, []);
  });

  it('sumTransactions cong dung bon dong', () => {
    const ctx = { ...ctxFor(b), now: 5 };
    const txns = [1, 2, 3].map((i) => closeOneOrder(b[0], ctx, i)!);
    const sum = sumTransactions(txns);
    for (const t of txns) {
      assert.ok(Math.abs(t.net - (t.gross - t.cogs - t.opex - t.tax)) < 1e-9, 'net phai bang gross tru chi phi');
    }
    assert.ok(
      Math.abs(sum.grossRevenue - (sum.cogs + sum.opex + sum.tax + sum.netIncome)) < 1e-9,
      'tong gross = chi phi + loi nhuan',
    );
  });
});

/**
 * Tỷ lệ thu được khi mở tab nhưng KHÔNG bấm.
 *
 * Đây là bài test neo số, không phải bài test đúng/sai: nó ghim hành vi
 * hiện tại của 2 hằng `MAX_WAIT_MS` / `QUEUE_FILL_RATIO` để lần cân bằng sau
 * biết chính xác mình đang thay đổi gì. Chạm vào bất kỳ hằng nào là test
 * này hỏng ngay.
 */
describe('Mo tab khong cham don', () => {
  /** Chạy N phút không bấm, trả về khách giữ được / khách đã tới. */
  function idleCapture(defId: string, level: number, minutes: number) {
    resetArrivalAccumulator();
    const b = [node(defId, level, `${defId}_${level}`)];
    let queues: ShopQueue[] = [];
    let entered = 0;
    for (let t = 1; t <= minutes * 60; t++) {
      const now = t * 1000;
      const a = settleArrivals(b, queues, { now }, 1_000);
      queues = a.queues;
      entered += a.arrived;
      queues = expireQueues(b, queues, { now }).queues;
    }
    const potential = arrivalRateFor(b[0]) * minutes * 60;
    return { retained: totalBacklog(queues), entered, potential };
  }

  it('luot khach qua hang phu hop chinh la QUEUE_FILL_RATIO', () => {
    /*
     * Ở trạng thái ổn định không bấm: hàng đầy dần trong
     * `MAX_WAIT_MS / QUEUE_FILL_RATIO` giây rồi bắt đầu tràn, và khách cũ
     * hết hạn chờ. Little's law cho ra tỷ lệ khách lọt vào hàng đúng bằng
     * `QUEUE_FILL_RATIO` - test này ghim con số đó.
     */
    for (const [defId, level] of [
      ['quan-ca-phe', 1],
      ['sieu-thi', 5],
      ['trung-tam-thuong-mai', 10],
    ] as const) {
      const r = idleCapture(defId, level, 10);
      const ratio = r.entered / r.potential;
      assert.ok(
        Math.abs(ratio - QUEUE_FILL_RATIO) < 0.06,
        `${defId}: ty le luot khach ${ratio.toFixed(3)} phai gan QUEUE_FILL_RATIO ${QUEUE_FILL_RATIO}`,
      );
    }
  });

  it('neu quay lai sau 5 phut, so don con lai chi khoang 15% tiem nang', () => {
    /*
     * Hàng chỉ giữ được `MAX_WAIT_MS / QUEUE_FILL_RATIO` giây khách, nên
     * càng để lâu tỷ lệ giữ được càng rơi: 1 phút ~75%, 5 phút ~15%.
     *
     * Số này cố tình ghim lại để thấy rõ trade-off của việc bắt người chơi
     * phải bấm - đổi lại là mất doanh thu thật nếu bỏ mặc.
     */
    const r = idleCapture('sieu-thi', 5, 5);
    const ratio = r.retained / r.potential;
    assert.ok(
      ratio > 0.1 && ratio < 0.2,
      `sau 5 phut phai con khoang 15% tiem nang, got ${(ratio * 100).toFixed(1)}%`,
    );
  });

  it('mo 1 phut khong cham van con giu duoc phan lon khach', () => {
    const r = idleCapture('sieu-thi', 5, 1);
    const ratio = r.retained / r.potential;
    assert.ok(ratio > 0.7, `mo 1 phut phai con >70%, got ${(ratio * 100).toFixed(1)}%`);
  });
});


describe('Menu mon - khach order da dang', () => {
  it('moi tiem COMMERCIAL co menu deu co trung binh priceRatio = 1.0', () => {
    for (const [shopId, items] of Object.entries(MENU_BY_BUILDING)) {
      const def = BUILDINGS.find((b) => b.id === shopId);
      assert.ok(def, `menu tro toi cong trinh khong ton tai: ${shopId}`);
      assert.equal(def!.zone, 'COMMERCIAL', `${shopId} co menu nhung khong phai COMMERCIAL`);
      const avg = items.reduce((s, it) => s + it.priceRatio, 0) / items.length;
      assert.ok(Math.abs(avg - 1) < 1e-9, `${shopId}: trung binh priceRatio = ${avg}, phai dung 1.0`);
    }
  });

  it('cung mot arrivedAt luon ra cung mot mon (xac dinh, khong random)', () => {
    const a = menuItemFor('quan-ca-phe', 123456789);
    const b = menuItemFor('quan-ca-phe', 123456789);
    assert.deepEqual(a, b);
  });

  it('tiem khong co menu tra ve null', () => {
    assert.equal(menuItemFor('chung-cu-cao-cap', 1), null);
    assert.equal(menuItemFor('khong-ton-tai', 1), null);
  });

  it('closeOneOrder voi arrivedAt gan dung ten mon vao Transaction.itemName', () => {
    const b = [node('quan-ca-phe')];
    const ctx = ctxFor(b);
    const txn = closeOneOrder(b[0], ctx, 1, 999)!;
    const expected = menuItemFor('quan-ca-phe', 999)!;
    assert.equal(txn.itemName, expected.name);
  });

  it('khong truyen arrivedAt thi khong co itemName (roi ve chu ky cu)', () => {
    const b = [node('quan-ca-phe')];
    const ctx = ctxFor(b);
    const txn = closeOneOrder(b[0], ctx, 1)!;
    assert.equal(txn.itemName, undefined);
  });

  it('closeSingleOrder gan dung mon cua khach DANG DUNG DAU hang (FIFO)', () => {
    const b = [node('quan-ca-phe')];
    const t1 = 5_000_000;
    const queues: ShopQueue[] = [{ shopId: b[0].id, arrivedAt: [t1, t1 + 1000] }];
    const ctx = { ...ctxFor(b), now: t1 + 2000 };
    const res = closeSingleOrder(b[0], queues, ctx, 1);
    const expected = menuItemFor('quan-ca-phe', t1)!;
    assert.equal(res.txn?.itemName, expected.name, 'phai la mon cua khach den truoc (t1), khong phai t1+1000');
  });
});
