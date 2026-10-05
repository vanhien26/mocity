/**
 * Regression cho ranh giới TÀI SẢN: nhà của thành phố (NPC) phải nằm trong
 * `cityBuildings`, KHÔNG BAO GIỜ nằm trong `buildings`.
 *
 * Vì sao suite này tồn tại: trước đây 4 tòa NPC được seed thẳng vào
 * `buildings`, kéo theo một loạt lệch số - người chơi lên Bậc 2 ngay khi vào
 * game, nhiệm vụ "Xây khu dân cư đầu tiên" hoàn thành sẵn, tiền AFK và
 * doanh thu có phần của nhà không ai sở hữu.
 *
 * Chạy: npm test
 */
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

const ls = new Map<string, string>();

before(() => {
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => (ls.has(k) ? ls.get(k)! : null),
    setItem: (k: string, v: string) => void ls.set(k, String(v)),
    removeItem: (k: string) => void ls.delete(k),
    clear: () => ls.clear(),
  };
  (globalThis as Record<string, unknown>).window = globalThis;
});

const mocity = await import('./store');
const {
  hydrateCity,
  getCityState,
  placeBuilding,
  normalizeStoredState,
  isQuestCompleted,
  currentCityTier,
} = mocity;
const { flowFor, nodeYieldBreakdown } = await import('./city-calculator');
const { BUILDING_BY_ID } = await import('./mock-city-data');

const NOW = 1_700_000_000_000;
/** 4 ô mặc định của nhà thành phố: hàng 1, cột 0..3. */
const CITY_LOT_CELLS = ['0:1', '1:1', '2:1', '3:1'];

function node(defId: string, col: number, row: number, level = 1) {
  assert.ok(BUILDING_BY_ID[defId], `thieu cong trinh ${defId}`);
  return {
    id: `${defId}_${col}_${row}`,
    defId,
    col,
    row,
    level,
    starRating: 1,
    lastCollectedAt: NOW,
    modules: [],
  };
}

/** Save phiên bản hiện tại, chỉ ghi những field cần cho case. */
function save(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: mocity.SAVE_FILE_VERSION,
    mayorName: 'Người Lập Nghiệp',
    cityName: 'Đô Thị MoCity',
    hasNamedCity: false,
    gridSize: 10,
    unlockedCols: 4,
    unlockedRows: 4,
    buildings: [],
    coins: 50_000_000,
    lastSeenAt: NOW,
    createdAt: NOW,
    ...overrides,
  });
}

const cellKey = (b: { col: number; row: number }) => `${b.col}:${b.row}`;

describe('nha cua thanh pho nam rieng trong cityBuildings', () => {
  it('tao moi: buildings rong, cityBuildings day du 4 nha va deu npcOwned', () => {
    ls.clear();
    hydrateCity('city-fresh@momo.vn');
    const s = getCityState();

    assert.equal(s.buildings.length, 0, 'nguoi choi chua dat gi ma buildings phai rong');
    assert.equal(s.cityBuildings.length, 4, 'phai seed du 4 nha cua thanh pho');
    assert.ok(
      s.cityBuildings.every((n) => n.npcOwned === true),
      'moi nha thanh pho phai mang flag npcOwned',
    );
    assert.deepEqual(
      s.cityBuildings.map(cellKey),
      CITY_LOT_CELLS,
      'nha thanh pho phai nam dung 4 o mac dinh (hang 1, cot 0..3)',
    );
  });

  it('khong tinh nha thanh pho vao bac do thi va nhiem vu', () => {
    ls.clear();
    hydrateCity('city-quest@momo.vn');
    const s = getCityState();

    assert.equal(currentCityTier(s).rank, 1, '4 nha NPC khong duoc dut nguoi choi len Bac 2');
    assert.equal(
      isQuestCompleted('q-first-home', s),
      false,
      'nha thanh pho khong hoan thanh nhiem vu nha o cua nguoi choi',
    );
    assert.equal(isQuestCompleted('q-first-store', s), false);
    assert.equal(isQuestCompleted('q-expand-city', s), false);
  });

  it('nha cua nguoi choi van mo duoc nhiem vu va bac do thi', () => {
    ls.clear();
    hydrateCity('city-quest2@momo.vn');
    assert.equal(placeBuilding(1, 0, 'nha-pho-binh-dan'), 'ok');
    assert.equal(
      isQuestCompleted('q-first-home', getCityState()),
      true,
      'nha nguoi choi phai mo khoa nhiem vu nha o',
    );
  });

  it('khong duoc xay len dat cua thanh pho', () => {
    ls.clear();
    hydrateCity('city-occupied@momo.vn');

    assert.equal(
      placeBuilding(0, 1, 'quan-ca-phe'),
      'occupied',
      'o (0,1) da co nha thanh pho - phai tra loi occupied truoc khi tien hanh chi tien',
    );
    assert.equal(getCityState().buildings.length, 0, 'khong duoc tru tien khi dat bi chiem');
    assert.equal(getCityState().cityBuildings.length, 4, 'nha thanh pho khong mat di');

    assert.equal(placeBuilding(0, 0, 'quan-ca-phe'), 'ok');
    assert.equal(getCityState().buildings.length, 1);
    assert.equal(getCityState().cityBuildings.length, 4);
  });

  it('AFK: nha thanh pho khong sinh tien, tiem cua nguoi choi thi co', () => {
    ls.clear();
    hydrateCity('city-afk@momo.vn');
    const base = getCityState();
    const eightHours = 8 * 3_600_000;

    const chiNhaThanhPho = normalizeStoredState(
      JSON.stringify({ ...base, buildings: [], lastSeenAt: NOW - eightHours }),
      NOW,
    );
    assert.equal(
      chiNhaThanhPho.pendingOffline?.coins ?? 0,
      0,
      '8 gio AFK ma nguoi chua co tiem nao thi khong duoc nhan tien tu nha thanh pho',
    );

    const coTiem = normalizeStoredState(
      JSON.stringify({
        ...base,
        buildings: [node('quan-ca-phe', 0, 0)],
        lastSeenAt: NOW - eightHours,
      }),
      NOW,
    );
    assert.ok(
      (coTiem.pendingOffline?.coins ?? 0) > 0,
      'nguong kiem tra: tiem cua nguoi choi phai sinh duoc tien AFK (khong thi test tren vo nghia)',
    );
  });

  it('liên ke: nha thanh pho van tinh la hang xom (+25%), nhung khong sinh ra doanh thu rieng', () => {
    ls.clear();
    hydrateCity('city-synergy@momo.vn');
    const s = getCityState();
    const shop = node('quan-ca-phe', 1, 0);
    const nhaThanhPho = s.cityBuildings.find((n) => n.defId === 'nha-pho-binh-dan');
    assert.ok(nhaThanhPho, 'phai co nha thanh pho de lam hang xom');

    const le = nodeYieldBreakdown(shop, [shop]);
    const coHangXom = nodeYieldBreakdown(shop, [shop, nhaThanhPho]);
    assert.equal(le.synergyBonus, 0, 'o le khong co hang xom thi khong co synergy');
    assert.equal(
      coHangXom.synergyBonus,
      0.25,
      'nha thanh pho gan ke (+ nha pho la synergy target cua quan ca phe) phai +25%',
    );
    assert.ok(
      coHangXom.totalPerSec > le.totalPerSec,
      'liên ke phai lam tiem kiem nhieu hon',
    );

    const cityOnly = flowFor([], [], 1, 0, { street: s.cityBuildings });
    assert.equal(cityOnly.volume, 0, 'khong co tiem cua nguoi choi thi khong co giao dich');
    assert.equal(
      cityOnly.storeYield,
      0,
      'nha thanh pho khong sinh doanh thu cho vi nguoi choi',
    );
  });

  it('doc save: NPC trong buildings bi rua sang cityBuildings, khong lam mat tiem', () => {
    const s = normalizeStoredState(
      save({
        buildings: [
          node('quan-ca-phe', 5, 0),
          { ...node('nha-pho-binh-dan', 0, 1, 2), id: 'nha-pho-binh-dan_0_1', npcOwned: true },
        ],
      }),
      NOW,
    );

    assert.equal(s.buildings.length, 1, 'chi con tai san cua nguoi choi');
    assert.equal(s.buildings[0].defId, 'quan-ca-phe');
    assert.equal(s.buildings[0].col, 5);
    assert.ok(
      s.buildings.every((b) => b.npcOwned !== true),
      'khong duoc con node npcOwned trong mang tai san',
    );
    assert.ok(s.cityBuildings.length >= 4, 'phai co du nha thanh pho sau khi rua');
    assert.ok(
      s.cityBuildings.every((n) => n.npcOwned === true),
      'nha thanh pho sau khi rua phai van mang flag',
    );
  });

  it('nha thanh pho khong dung chung o voi tiem cua nguoi choi', () => {
    const s = normalizeStoredState(
      save({ buildings: [node('quan-ca-phe', 0, 1)] }),
      NOW,
    );

    const takenByPlayer = new Set(s.buildings.map(cellKey));
    assert.equal(s.buildings.length, 1, 'tiem nguoi choi van con tai vi tri cu');
    for (const lot of s.cityBuildings) {
      assert.ok(
        !takenByPlayer.has(cellKey(lot)),
        `nha thanh pho ${lot.id} dung chung o voi tiem cua nguoi choi`,
      );
    }
    assert.ok(s.cityBuildings.length >= 3, 'dat khac phai nhan cac nha con lai');
  });

  it('goi normalize hai lan lien tiep cho ra cityBuildings y hệt nhau (idempotent)', () => {
    const lanMot = normalizeStoredState(
      save({ buildings: [node('quan-ca-phe', 0, 1)] }),
      NOW,
    );
    const lanHai = normalizeStoredState(JSON.stringify(lanMot), NOW);
    assert.deepEqual(lanHai.cityBuildings, lanMot.cityBuildings, 'vi tri nha thanh pho khong duoc doi');
    assert.deepEqual(lanHai.buildings, lanMot.buildings, 'tai san nguoi choi khong bi chuyen di');
  });
});
