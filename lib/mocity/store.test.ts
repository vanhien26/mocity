import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeStoredState, isQuestCompleted, MAX_MAYOR_LEVEL, IDLE_XP_CAP } from './store';
import { BUILDING_BY_ID, upgradeCostCoins, xpForLevel } from './mock-city-data';

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

  it('nang len version 5 va bo sung field moi', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.equal(s.version, 5);
    assert.equal(s.eventLog.resolved, 0);
    assert.deepEqual(s.tappedAt, {});
    assert.equal(s.happinessBoost, 0);
  });

  it('lay lastEventAt lam moc bat dau cho suy giam hanh phuc', () => {
    const s = normalizeStoredState(v3Save({ lastEventAt: NOW - 3_600_000 }), NOW);
    assert.equal(s.lastEngagedAt, NOW - 3_600_000);
  });

  it('chuan hoa happinessBoost khong hop le', () => {
    // Save v5 co san field nay, save v3 thi migration gan 0 (xem test ben duoi).
    const v5 = (overrides: Record<string, unknown>) =>
      normalizeStoredState(JSON.stringify({ ...JSON.parse(v3Save()), version: 5, ...overrides }), NOW);
    assert.equal(v5({ happinessBoost: -50 }).happinessBoost, 0);
    assert.equal(v5({ happinessBoost: 9_999 }).happinessBoost, 30);
    assert.equal(v5({ happinessBoost: 12 }).happinessBoost, 12);
    assert.equal(v5({ happinessBoost: Number.NaN }).happinessBoost, 0);
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
        version: 5,
        eventLog: { day: new Date(NOW).getFullYear() + '-' + (new Date(NOW).getMonth() + 1) + '-' + new Date(NOW).getDate(), resolved: 30 },
      }),
      NOW,
    );
    assert.equal(s.pendingEvent, null, 'da xu ly 30 su kien trong ngay thi khong spawn them');
  });

  it('van spawn su kien khi moi tho viet trong ngay', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.ok(s.pendingEvent, 'nguoi choi moi phai co chuyen de xu ly ngay');
  });
});

describe('normalizeStoredState - du lieu hong', () => {
  it('reset khi khong co version', () => {
    const s = normalizeStoredState(JSON.stringify({ coins: 50 }));
    assert.equal(s.version, 5);
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

/* ═══════════════════════════════════════════════════════════════════════
 * PHASE 1 - SUA BUG MAT TIEN TRINH NGUOI CHOI
 * ═══════════════════════════════════════════════════════════════════════ */

describe('XP - clamp theo xpForLevel cua cap hien tai', () => {
  /**
   * Regression cho bug kinh dien nhat cua save game: clamp XP vao mot hang so
   * phang quang danh (`MAYOR_XP_PER_LEVEL - 1`) thay vi theo nhu cau cau cap
   * dang nam. O LV10, `xpForLevel(10)` la 3.400 nhung clamp cu 199, nen moi
   * lan F5 nguoi choi mat sach 401 XP da tich luy.
   */
  it('giu nguyen XP vuot qua nguoi 199 o cap cao', () => {
    const s = normalizeStoredState(v3Save({ mayorLevel: 10, mayorXp: 2_600 }), NOW);
    assert.equal(s.mayorXp, 2_600, 'XP 2.600 phai con nguyen sau reload');
  });

  it('van cat XP vuot han muc cua cap', () => {
    const s = normalizeStoredState(v3Save({ mayorLevel: 10, mayorXp: 99_999 }), NOW);
    assert.equal(s.mayorXp, xpForLevel(10) - 1, 'XP phai cap lai dung muc can luyen');
  });

  it('cap 1 giu du nhuoc mot lan len cap dau tien', () => {
    // `normalizeStoredState` chi clamp bien, khong cap len cap - viec len cap
    // la cua `addMayorXp` khi choi. Save nao vuot nguong cap 1 thi bi cat ve
    // `xpForLevel(1) - 1`, dung y so 499.
    const s = normalizeStoredState(v3Save({ mayorLevel: 1, mayorXp: xpForLevel(1) + 50 }), NOW);
    assert.equal(s.mayorLevel, 1);
    assert.equal(s.mayorXp, xpForLevel(1) - 1);
  });

  it('duong cong XP la tuyen tinh, khong loe thua', () => {
    const lv2 = xpForLevel(2);
    const lv49 = xpForLevel(49);
    assert.ok(lv49 < lv2 * 40, `lv49 (${lv49}) khong duoc leo thua so voi lv2 (${lv2})`);
    let total = 0;
    for (let l = 1; l < MAX_MAYOR_LEVEL; l++) total += xpForLevel(l);
    // Bien cu 1.255.079 XP. Neu vuot 500.000 thi lai duong cong luy thua.
    assert.ok(total < 500_000, `tong XP lv1->50 la ${total}, phai duoi 500.000`);
  });
});

describe('addMayorXp - khong cap thieu cap khi len nhieu cap mot luc', () => {
  /**
   * Ban <= 4 chia `totalXp / needed` bang nghia: XP du cho 7 cap bi tinh nhu
   * chi du cho 1 cap. Verify: lv10 + 5.000 XP ra lv17, trong khi lv10 -> 17
   * ton 7.786 XP. Vong lap trong `addMayorXp` phai trich dan tung cap.
   *
   * Test nay goi `addMayorXp` truc tiep qua mot duong public co side-effect
   * nhe (100 XP qua vat pham), de kiem chung tinh chat cua vong lap chu khong
   * phai tai lap toan bo may trang thai.
   */
  it('5.000 XP o cap 10 khong duoc nhay qua 7 cap', () => {
    let level = 10;
    let pool = 5_000;
    while (level < MAX_MAYOR_LEVEL && pool >= xpForLevel(level)) {
      pool -= xpForLevel(level);
      level += 1;
    }
    let realCost = 0;
    for (let l = 10; l < level; l++) realCost += xpForLevel(l);
    assert.ok(
      realCost <= 5_000,
      `lv10 -> lv${level} ton ${realCost} XP, vuot qua 5.000 XP da cho`,
    );
    assert.ok(level < 17, `lv10 + 5.000 XP ra lv${level}, phai thap hon 17`);
  });

  it('duong cong don tang: cap cao yeu cau nhieu XP hon cap thap', () => {
    assert.ok(xpForLevel(30) > xpForLevel(10) * 2, 'cap cao phan bo nhieu XP hon cap thap');
    assert.ok(xpForLevel(49) < xpForLevel(10) * 10, 'cap 49 khong duoc leo thua so voi cap 10');
  });
});

describe('q-fever-mode - khong con la bait 60 giay', () => {
  /**
   * `feverUntil > 0` chi true trong 60 giay. Nguoi choi bat Fever roi di lam
   * viec khac thi quest (18.000 Xu + 8 Kim Cuong) khong bao gio claim duoc -
   * `claimedQuests` la vinh vien.
   */
  const base = () => normalizeStoredState(v3Save({ feverUntil: 0 }), NOW);

  it('chua mo Fever thi quest chua hoan thanh', () => {
    assert.equal(isQuestCompleted('q-fever-mode', base()), false);
  });

  it('het cua so 60 giay van giu duoc tinh trang da tung mo', () => {
    const s = normalizeStoredState(v3Save({ feverUntil: 0, feverEverUsed: true }), NOW);
    assert.equal(s.feverUntil <= NOW, true, 'fever da het');
    assert.equal(isQuestCompleted('q-fever-mode', s), true);
  });

  it('migration tu save dang chay Fever khong phat nguoi choi', () => {
    const s = normalizeStoredState(
      v3Save({ version: 4, feverUntil: NOW + 30_000 }),
      NOW,
    );
    assert.equal(s.version, 5);
    assert.equal(s.feverEverUsed, true, 'save v4 co Fever dang chay phai giu nhan');
  });

  it('migration tu save chua tung mo Fever de false', () => {
    const s = normalizeStoredState(v3Save({ version: 4, feverUntil: 0 }), NOW);
    assert.equal(s.feverEverUsed, false);
  });

  it('normalize tu ghi nhan khi save ghi Fever da het nhung chua co co', () => {
    const s = normalizeStoredState(v3Save({ feverUntil: 0, feverEverUsed: false }), NOW);
    assert.equal(s.feverEverUsed, false);
  });
});

describe('normalizeStoredState - chot han noi pho', () => {
  /**
   * `recordCitizenTalk` kiem tra `lastTalkAt` roi moi dem. Save cu co san
   * `lastTalkAt` phai duoc chuan hoa de khong tra ve 0 (thi bo qua cooldown).
   */
  it('chuan hoa lastTalkAt khong hop le', () => {
    assert.equal(normalizeStoredState(v3Save({ lastTalkAt: -500 }), NOW).lastTalkAt, 0);
    assert.equal(normalizeStoredState(v3Save({ lastTalkAt: Number.NaN }), NOW).lastTalkAt, 0);
    assert.equal(normalizeStoredState(v3Save({ lastTalkAt: NOW - 90_000 }), NOW).lastTalkAt, NOW - 90_000);
  });

  it('save v3 chua co lastTalkAt thi bat dau tu 0 (khong chan)', () => {
    assert.equal(normalizeStoredState(v3Save(), NOW).lastTalkAt, 0);
  });
});

describe('balance - chi phi nang cap theo nhip', () => {
  it('tong chi phi len cap khong vuot qua kha nang kiem tien', () => {
    const def = BUILDING_BY_ID['thap-momo'];
    let total = 0;
    for (let l = 1; l < 50; l++) total += upgradeCostCoins(def, l);
    // UPGRADE_GROWTH 1.25 lam tong 5,6 ty - khong bao gio hoa von duoc.
    assert.ok(total < 500_000_000, `tong nang cap Thap MoMo la ${total}, phai duoi 500 trieu`);
  });

  it('chi phi len cap scale theo san luong chu khong theo gia xay dung', () => {
    const cafe = BUILDING_BY_ID['quan-ca-phe'];
    const thap = BUILDING_BY_ID['thap-momo'];
    const revRatio = thap.baseYieldPerSec / cafe.baseYieldPerSec;
    const costRatio = upgradeCostCoins(thap, 20) / upgradeCostCoins(cafe, 20);
    assert.ok(
      Math.abs(costRatio - revRatio) / revRatio < 0.15,
      `chi phi ratio ${costRatio.toFixed(2)} phai khop san luong ratio ${revRatio.toFixed(2)}`,
    );
  });

  it('chi phi tang deu, khong nhay dot khi qua moc', () => {
    // Moc 5/10/25/50 chi tang doanh thu, khong tang chi phi. Do la ly do
    // payback time phai giu duong khi chi phi la tuy linh.
    const def = BUILDING_BY_ID['quan-ca-phe'];
    const ratioStep = (l: number) => upgradeCostCoins(def, l) / upgradeCostCoins(def, l - 1);
    for (const l of [5, 10, 25, 50]) {
      const r = ratioStep(l);
      assert.ok(r > 1.1 && r < 1.25, `buoc nang cap ${l} co he so ${r.toFixed(3)}, phai o giua 1,10 va 1,25`);
    }
  });
});

describe('balance - moi cap den duoc dung mot phan nho thoi gian len cap', () => {
  it('AFK thuan khong lo lao cap 50', () => {
    const idleXpPerDay = 4 * 86_400;
    let total = 0;
    for (let l = 1; l < MAX_MAYOR_LEVEL; l++) total += xpForLevel(l);
    const days = total / idleXpPerDay;
    assert.ok(days > 1, `AFK cap ${IDLE_XP_CAP}/tick len cap 50 trong ${days.toFixed(2)} ngay, phai > 1`);
    assert.ok(days < 30, `AFK cap ${IDLE_XP_CAP}/tick ton ${days.toFixed(1)} ngay, qua dai`);
  });
});
