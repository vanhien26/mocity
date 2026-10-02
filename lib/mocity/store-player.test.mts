/**
 * Runtime test cho lop binding tai khoan cua `lib/mocity/store.ts`.
 *
 * Store la module singleton dung `window` + `localStorage`, nen file nay shim
 * hai thu do truoc khi import (import la ESM nen phai gan global truoc).
 *
 * Doc state bang `getCityState()` chu khong dung hook: hook React khong chay
 * duoc ngoai render.
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
    clear: () => ls.clear(),
  };
  (globalThis as Record<string, unknown>).window = globalThis;
});

const mocity = await import('./store');
const { hydrateCity, resetCity, getCityState, exportCitySave, importCitySave } = mocity;

/** Cho debounce persist (250ms) hoan tat truoc khi kiem tra localStorage. */
const flush = () => new Promise((r) => setTimeout(r, 340));

describe('gan save theo tai khoan', () => {
  it('hai tai khoan tren cung may khong ke thua thanh pho cua nhau', async () => {
    ls.clear();

    // Tai khoan A chay va xay tiem.
    hydrateCity('alice@momo.vn');
    mocity.placeBuilding(0, 0, 'quan-ca-phe');
    await flush();

    const savedA = ls.get('momo_city_v8_alice@momo.vn');
    assert.ok(savedA, 'save cua tai khoan A phai ton tai');
    assert.equal(JSON.parse(savedA).buildings.length, 1);

    // Doi sang tai khoan B tren cung may.
    hydrateCity('bob@momo.vn');
    assert.equal(
      getCityState().buildings.length,
      0,
      'tai khoan B phai bat dau tu thanh pho trong, khong duoc ke thua cua A',
    );
    assert.equal(
      getCityState().mayorName,
      'Thị Trưởng MoMo',
      'ten cua A khong duoc sang cho B',
    );

    // Quay lai A - thanh pho phai con nguyen.
    hydrateCity('alice@momo.vn');
    assert.equal(getCityState().buildings.length, 1);
  });

  it('xoa thanh pho chi xoa save cua tai khoan dang mo', async () => {
    ls.clear();
    hydrateCity('carol@momo.vn');
    mocity.placeBuilding(0, 0, 'quan-ca-phe');
    await flush();

    hydrateCity('dave@momo.vn');
    resetCity();
    await flush();

    assert.ok(
      !ls.has('momo_city_v8_dave@momo.vn') || JSON.parse(ls.get('momo_city_v8_dave@momo.vn')!).buildings.length === 0,
      'save cua tai khoan dang xoa phai sach',
    );
    assert.equal(
      JSON.parse(ls.get('momo_city_v8_carol@momo.vn')!).buildings.length,
      1,
      'save cua tai khoan khac khong bi dong vao',
    );
  });

  it('hydrate lai cung mot tai khoan thi giu nguyen state trong bo nho', () => {
    ls.clear();
    hydrateCity('erin@momo.vn');
    mocity.renameCityAndMayor('Anh Hien', 'Pho Vua He');
    const before = getCityState().cityName;

    hydrateCity('erin@momo.vn');
    assert.equal(getCityState().cityName, before, 'hydrate lai cung id khong duoc reset state');
  });
});

describe('sao luu / khoi phuc', () => {
  it('export ra save hop le, bo qua thuong offline', () => {
    ls.clear();
    hydrateCity('frank@momo.vn');
    const parsed = JSON.parse(exportCitySave());
    assert.equal(parsed.version, 8);
    assert.equal(parsed.pendingOffline, null, 'thue nghi khong duoc ghi ra file sao luu');
  });

  it('import lai save cua chinh minh giu nguyen thanh pho', () => {
    ls.clear();
    hydrateCity('grace@momo.vn');
    mocity.placeBuilding(0, 0, 'quan-ca-phe');
    mocity.placeBuilding(1, 0, 'sieu-thi');

    const backup = exportCitySave();
    resetCity();
    assert.equal(getCityState().buildings.length, 0);

    assert.equal(importCitySave(backup), 'ok');
    assert.equal(getCityState().buildings.length, 2);
  });

  it('tu choi file khong phai JSON', () => {
    assert.equal(importCitySave('khong phai json'), 'invalid');
    assert.equal(importCitySave('null'), 'invalid');
    assert.equal(importCitySave('123'), 'invalid');
  });

  it('tu choi file tu phien ban moi hon thay vi ghi de du lieu khong doc duoc', () => {
    assert.equal(importCitySave(JSON.stringify({ version: 999, coins: 1 })), 'incompatible');
  });

  it('van nap duoc file cu hon qua migration', () => {
    ls.clear();
    hydrateCity('heidi@momo.vn');
    const legacy = JSON.stringify({
      version: 3,
      mayorName: 'Cô Ba',
      cityName: 'Phố Của',
      hasNamedCity: true,
      mayorLevel: 6,
      mayorXp: 0,
      gridSize: 10,
      unlockedCols: 4,
      unlockedRows: 4,
      buildings: [
        { id: 'a', defId: 'quan-ca-phe', col: 0, row: 0, level: 3, starRating: 1, lastCollectedAt: 0, modules: [] },
      ],
      npcs: [],
      unlockedManagers: [],
      claimedQuests: [],
      inventory: {},
      equippedRelics: ['relic-heo-vang'],
      feverUntil: 0,
      activeRequests: [],
      pendingEvent: null,
      lastRequestAt: Date.now(),
      lastEventAt: Date.now(),
      lastEngagedAt: Date.now(),
      totalVolume: 0,
      coins: 9_999,
      gems: 4,
      energy: 0,
      blueprints: 0,
      medals: 0,
      lastSeenAt: Date.now(),
      createdAt: Date.now() - 1000,
      totalCoinsEarned: 9_999,
      bubblesCollected: 0,
      pendingOffline: null,
    });

    assert.equal(importCitySave(legacy), 'ok');
    assert.equal(getCityState().version, 8);
    assert.equal(getCityState().buildings.length, 1, 'giu nguyen tiem da xay');
    assert.equal(getCityState().coins, 9_999);
    assert.equal(getCityState().feverEverUsed, false, 'save v3 chua co field nay nen mac dinh false');
  });
});
