/**
 * Đẳng thức gốc của Transaction Engine: **tiền vào ví bằng đúng phần lợi
 * nhuận ròng mà P&L ghi vào sổ cái**.
 *
 * Đây là bài test tích hợp - nó chạy thật store (singleton có window +
 * localStorage), cho khách đến thật, để `tickIdle` TỰ đóng đơn qua
 * `autoServeQueues` (không còn `closeOrder`/`clearShopQueue` bấm tay - đã bỏ
 * hẳn theo yêu cầu sản phẩm), rồi đối chiếu ví với sổ cái. Mọi lệch ở đây
 * nghĩa là người chơi thấy một đường, báo cáo thấy một nẻo.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

const ls = new Map<string, string>();

before(() => {
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => (ls.has(k) ? ls.get(k)! : null),
    setItem: (k: string, v: string) => void ls.set(k, String(v)),
    removeItem: (k: string) => void ls.delete(k),
    clear: () => void ls.clear(),
  };
  (globalThis as Record<string, unknown>).window = globalThis;
});

const m = await import('./store');
const { hydrateCity, getCityState, tickIdle, exportCitySave, importCitySave } = m;

const SHOP = 'tttm_txn';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Snapshot đủ để đối chiếu ví với từng dòng P&L. */
function snapshot() {
  const s = getCityState();
  return {
    coins: s.coins,
    gross: s.ledgerLifetime.grossRevenue,
    cogs: s.ledgerLifetime.cogs,
    opex: s.ledgerLifetime.opex,
    tax: s.ledgerLifetime.tax,
    net: s.ledgerLifetime.netIncome,
    volume: s.totalVolume,
    revenue: s.totalRevenue,
    orders: s.ordersClosed ?? 0,
  };
}

function delta(a: ReturnType<typeof snapshot>, b: ReturnType<typeof snapshot>) {
  return {
    coins: b.coins - a.coins,
    gross: b.gross - a.gross,
    cogs: b.cogs - a.cogs,
    opex: b.opex - a.opex,
    tax: b.tax - a.tax,
    net: b.net - a.net,
    volume: b.volume - a.volume,
    revenue: b.revenue - a.revenue,
    orders: b.orders - a.orders,
  };
}

/**
 * Nạp save có sẵn 1 tiệm lớn + tiền, bỏ qua giá đặt công trình.
 *
 * `staffCount: 3` (STAFF_MAX) - bài test cần tự phục vụ xảy ra trong thời
 * gian `sleep()` chịu được; để mặc định 0 nhân viên (14s/đơn) thì mỗi test
 * phải chờ hàng chục giây mới thấy 1 đơn tự đóng.
 */
function seedCity(staffCount = 3) {
  hydrateCity('txn-test@momo.vn');
  const now = Date.now();
  const save = JSON.parse(exportCitySave()) as Record<string, unknown>;
  save.buildings = [
    {
      id: SHOP,
      defId: 'trung-tam-thuong-mai',
      col: 0,
      row: 0,
      level: 10,
      starRating: 1,
      lastCollectedAt: 0,
      modules: [],
      staffCount,
      lastAutoServedAt: now,
    },
  ];
  save.coins = 100_000;
  save.lastSeenAt = now - 100;
  save.pendingOffline = null;
  importCitySave(JSON.stringify(save));
}

describe('Tu phuc vu: vi va so cai noi mot cau', () => {
  it('mot chu ky tu dong dong don: vi dung bang loi nhuan rong tren so cai', async () => {
    ls.clear();
    seedCity();
    // `elapsed <= 0` lam tickIdle no-op neu goi qua sat luc seed (cung
    // millisecond) - cho mot nhip nho de tick khoi tao `lastAutoServedAt`
    // la mot lan goi THAT, khong phai bi bo qua ngay tu dau.
    await sleep(20);
    tickIdle();

    // Du de (a) co khach vao hang (~1,35 khach/giay o tiem cap 10) va (b)
    // qua 1 chu ky tu phuc vu toi da nhan vien (~5,2s voi STAFF_MAX=3).
    await sleep(6500);

    const before = snapshot();
    tickIdle();
    const d = delta(before, snapshot());

    assert.ok(d.orders > 0, `phai tu dong duoc it nhat 1 don (orders=${d.orders})`);
    assert.ok(d.net > 0, `lan tu dong phai sinh loi nhuan rong, got ${d.net}`);
    assert.ok(
      Math.abs(d.coins - d.net) < 1e-6,
      `VIDUNG ${d.coins} NHUNG SOCAI ${d.net} (lech ${(d.coins - d.net).toExponential(3)})`,
    );
    assert.ok(
      Math.abs(d.gross - (d.cogs + d.opex + d.tax + d.net)) < 1e-6,
      'bon dong P&L phai cong duoc thanh gross',
    );
    assert.ok(Math.abs(d.volume - d.gross) < 1e-6, 'totalVolume la so luong gross');
    assert.ok(Math.abs(d.revenue - d.net) < 1e-6, 'totalRevenue la loi nhuan rong');
  });

  it('nhieu chu ky lien tiep: moi lan tickIdle tu dong van khop so cai', async () => {
    ls.clear();
    seedCity();
    await sleep(20);
    tickIdle();

    let examined = 0;
    for (let i = 0; i < 3; i++) {
      await sleep(5500);
      const before = snapshot();
      tickIdle();
      const d = delta(before, snapshot());
      if (d.orders === 0) continue;
      examined++;

      assert.ok(d.net > 0, `vong ${i} phai loi nhuan duong`);
      assert.ok(
        Math.abs(d.coins - d.net) < 1e-6,
        `vong ${i}: vi ${d.coins} vs so cai ${d.net}`,
      );
      assert.ok(
        Math.abs(d.gross - (d.cogs + d.opex + d.tax + d.net)) < 1e-6,
        `vong ${i}: 4 dong P&L khong cong duoc gross`,
      );
    }

    assert.ok(examined > 0, 'phai co it nhat 1 vong tu dong dong don');
  });

  it('vang mat lau trong luc tab mo: 1 tick gom nhieu don van khop so cai', async () => {
    ls.clear();
    seedCity();
    await sleep(20);
    tickIdle();

    // ~2 chu ky tu phuc vu don lai thanh MOT lan tickIdle - thay cho nut
    // "Dọn hàng" bam tay cu da bo: gom lo khong can nguoi choi can thiep.
    await sleep(12_000);

    const before = snapshot();
    tickIdle();
    const d = delta(before, snapshot());

    assert.ok(d.orders >= 2, `phai gom duoc it nhat 2 don trong 1 tick (orders=${d.orders})`);
    assert.equal(d.orders, Math.round(d.orders), 'so don phai la so nguyen');
    assert.ok(
      Math.abs(d.coins - d.net) < 1e-6,
      `gom lo: vi ${d.coins} vs so cai ${d.net}`,
    );
    assert.ok(
      Math.abs(d.gross - (d.cogs + d.opex + d.tax + d.net)) < 1e-6,
      'gom lo van phai cong duoc 4 dong P&L',
    );
  });

  it('khong thue Nhan Vien thi tiem van tu ban, chi cham hon han', async () => {
    ls.clear();
    seedCity(0);
    await sleep(20);
    tickIdle();

    // Doi dung 1 chu ky cham nhat (STAFF_BASE_INTERVAL_MS=14s) + chut du:
    // qua moc nay ma KHONG co don nao tu dong la autoServeQueues bi vo hieu
    // khi staffCount=0, chu khong chi la cham.
    await sleep(14_500);

    const before = snapshot();
    tickIdle();
    const d = delta(before, snapshot());

    assert.ok(d.orders > 0, `tiem 0 nhan vien van phai tu ban duoc, chi cham hon (orders=${d.orders})`);
  });
});
