import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeStoredState } from './store';
import { BUILDING_BY_ID } from './mock-city-data';

const NOW = 1_700_000_000_000;

function v3Save(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: 3,
    mayorName: 'Cô Ba',
    cityName: 'Phố Của',
    hasNamedCity: true,
    mayorLevel: 7,
    mayorXp: 40,
    gridSize: 10,
    unlockedCols: 5,
    unlockedRows: 4,
    buildings: [
      {
        id: 'quan-ca-phe_0_0',
        defId: 'quan-ca-phe',
        col: 0,
        row: 0,
        level: 4,
        starRating: 2,
        lastCollectedAt: NOW,
        modules: ['QR_LOA_THAN_TAI'],
      },
    ],
    npcs: [],
    unlockedManagers: [],
    claimedQuests: ['q-first-store'],
    inventory: { 'gift-tra-sua': 4 },
    equippedRelics: ['relic-heo-vang'],
    feverUntil: 0,
    activeRequests: [],
    pendingEvent: null,
    lastRequestAt: NOW,
    lastEventAt: NOW,
    totalVolume: 1234,
    coins: 4_321,
    gems: 7,
    energy: 0,
    blueprints: 0,
    medals: 0,
    lastSeenAt: NOW,
    createdAt: NOW - 86_400_000,
    totalCoinsEarned: 100_000,
    bubblesCollected: 12,
    pendingOffline: null,
    ...overrides,
  });
}

describe('normalizeStoredState - version 3 (khong xoa sach thanh pho)', () => {
  it('giu nguyen toan bo thanh pho sau migration', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.equal(s.buildings.length, 1);
    assert.equal(s.buildings[0].defId, 'quan-ca-phe');
    assert.equal(s.buildings[0].level, 4);
    assert.equal(s.buildings[0].starRating, 2);
    assert.deepEqual(s.buildings[0].modules, ['QR_LOA_THAN_TAI']);
  });

  it('nang len version 4 va bo sung field moi', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.equal(s.version, 4);
    assert.equal(s.eventLog.resolved, 0);
    assert.deepEqual(s.tappedAt, {});
    assert.equal(s.happinessBoost, 0);
  });

  it('lay lastEventAt lam moc bat dau cho suy giam hanh phuc', () => {
    const s = normalizeStoredState(v3Save({ lastEventAt: NOW - 3_600_000 }), NOW);
    assert.equal(s.lastEngagedAt, NOW - 3_600_000);
  });

  it('chuan hoa happinessBoost khong hop le', () => {
    // Save v4 co san field nay, save v3 thi migration gan 0 (xem test ben duoi).
    const v4 = (overrides: Record<string, unknown>) =>
      normalizeStoredState(JSON.stringify({ ...JSON.parse(v3Save()), version: 4, ...overrides }), NOW);
    assert.equal(v4({ happinessBoost: -50 }).happinessBoost, 0);
    assert.equal(v4({ happinessBoost: 9_999 }).happinessBoost, 30);
    assert.equal(v4({ happinessBoost: 12 }).happinessBoost, 12);
    assert.equal(v4({ happinessBoost: Number.NaN }).happinessBoost, 0);
  });

  it('save v3 khong co happinessBoost nen bat dau tu 0', () => {
    assert.equal(normalizeStoredState(v3Save({ happinessBoost: 999 }), NOW).happinessBoost, 0);
  });

  it('giu nguyen tien, cap do, ten thanh pho', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.equal(s.coins, 4_321);
    assert.equal(s.gems, 7);
    assert.equal(s.mayorLevel, 7);
    assert.equal(s.cityName, 'Phố Của');
    assert.deepEqual(s.claimedQuests, ['q-first-store']);
    assert.equal(s.totalVolume, 1234);
  });

  it('giu kho do va bo vut pham da co', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.equal(s.inventory['gift-tra-sua'], 4);
  });
});

describe('normalizeStoredState - chong may in tien qua reload', () => {
  it('khong hoi lai 1 trieu Xu khi da spend het', () => {
    const s = normalizeStoredState(v3Save({ coins: 0 }), NOW);
    assert.equal(s.coins, 0, 'Xu = 0 phai giu la 0, khong duoc ban lai 1 trieu');
  });

  it('khong hoi lai 500 gem khi da spend het', () => {
    const s = normalizeStoredState(v3Save({ gems: 0 }), NOW);
    assert.equal(s.gems, 0);
  });

  it('giu nguyen Xu lon da earn duoc', () => {
    const s = normalizeStoredState(v3Save({ coins: 999_999 }), NOW);
    assert.equal(s.coins, 999_999);
  });

  it('chuan hoa gia tri khong hop le thanh 0', () => {
    const s = normalizeStoredState(v3Save({ coins: Number.NaN, gems: -50 }), NOW);
    assert.equal(s.coins, 0);
    assert.equal(s.gems, 0);
  });
});

describe('normalizeStoredState - chuan hoa bien', () => {
  it('mang ve 0 khi khong co mang', () => {
    const s = normalizeStoredState(v3Save({ buildings: 'khong phai mang' }), NOW);
    assert.deepEqual(s.buildings, []);
  });

  it('khoa mayorLevel trong [1, 50]', () => {
    assert.equal(normalizeStoredState(v3Save({ mayorLevel: 999 }), NOW).mayorLevel, 50);
    assert.equal(normalizeStoredState(v3Save({ mayorLevel: -5 }), NOW).mayorLevel, 1);
  });

  it('giu sau khi khong phai la so', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.equal(s.mayorXp, 40);
  });
});

describe('normalizeStoredState - tu cho thuong offline', () => {
  it('khong trao thuong khi vua moi vao game', () => {
    const s = normalizeStoredState(v3Save({ lastSeenAt: NOW - 5_000 }), NOW);
    assert.equal(s.pendingOffline, null);
  });

  it('trao thuong khi van mat > 1 phut', () => {
    const s = normalizeStoredState(v3Save({ lastSeenAt: NOW - 3_600_000 }), NOW);
    assert.ok(s.pendingOffline, 'phai co thuong AFK');
    assert.ok((s.pendingOffline?.coins ?? 0) > 0);
  });

  it('gioi han 8 gio van mat', () => {
    const short = normalizeStoredState(v3Save({ lastSeenAt: NOW - 8 * 3_600_000 }), NOW);
    const long = normalizeStoredState(v3Save({ lastSeenAt: NOW - 72 * 3_600_000 }), NOW);
    assert.deepEqual(short.pendingOffline, long.pendingOffline, 'vuot 8h khong duoc thuong them');
  });
});

describe('normalizeStoredState - han muc su kien', () => {
  it('khong spawn su kien khi da het luot trong ngay', () => {
    const s = normalizeStoredState(
      JSON.stringify({
        ...JSON.parse(v3Save()),
        version: 4,
        eventLog: { day: new Date(NOW).getFullYear() + '-' + (new Date(NOW).getMonth() + 1) + '-' + new Date(NOW).getDate(), resolved: 3 },
      }),
      NOW,
    );
    assert.equal(s.pendingEvent, null, 'da xu ly 3 su kien trong ngay thi khong spawn them');
  });

  it('van spawn su kien khi moi tho viet trong ngay', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.ok(s.pendingEvent, 'nguoi choi moi phai co chuyen de xu ly ngay');
  });
});

describe('normalizeStoredState - du lieu hong', () => {
  it('reset khi khong co version', () => {
    const s = normalizeStoredState(JSON.stringify({ coins: 50 }));
    assert.equal(s.version, 4);
  });

  it('reset khi client cu hon server', () => {
    const s = normalizeStoredState(v3Save({ version: 99, coins: 88_888 }));
    assert.equal(s.coins, 600, 'version > hien tai phai reset ve khoi tao');
  });

  it('giu cong trinh ma khong con trong BUILDINGS', () => {
    const s = normalizeStoredState(
      v3Save({
        buildings: [{ id: 'x', defId: 'cong-trinh-da-xoa', col: 0, row: 0, level: 1, starRating: 1, lastCollectedAt: NOW }],
      }),
      NOW,
    );
    // node van duoc giu (khong xoa du lieu nguoi choi) nhung calculator bo qua
    assert.equal(s.buildings.length, 1);
    assert.equal(BUILDING_BY_ID['cong-trinh-da-xoa'], undefined);
  });
});
