import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeStoredState, isQuestCompleted, MAX_MAYOR_LEVEL, IDLE_XP_CAP, SAVE_FILE_VERSION as STATE_VERSION } from './store';
import {
  BUILDINGS,
  BUILDING_BY_ID,
  STREAK_MILESTONES,
  nextStreakMilestone,
  streakMilestoneReached,
  upgradeCostCoins,
  xpForLevel,
} from './mock-city-data';
import { flowFor, grossUpFor, happinessFor, CORPORATE_TAX_RATE } from './city-calculator';
import { CITY_EVENTS, REQUEST_SCRIPTS } from './dialogue-data';
import { ARCHETYPES } from './npc-data';
import { emptyLedger, type BuildingNode, type StoreModuleId } from './types';

const NOW = 1_700_000_000_000;

function node(
  defId: string,
  col: number,
  row: number,
  level = 1,
  extra: Partial<BuildingNode> = {},
): BuildingNode {
  return {
    id: `${defId}_${col}_${row}`,
    defId,
    col,
    row,
    level,
    starRating: 1,
    lastCollectedAt: 0,
    modules: [],
    ...extra,
  };
}

/**
 * Save o phien ban hien tai (V6). Dung cho kiem thu khong chay migration -
 * khi do moi co the gan gia tri field cu theo y muon.
 */
function currentSave(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({ ...JSON.parse(v3Save()), version: STATE_VERSION, ...overrides });
}

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

  it('nang len version 8 va bo sung field moi', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.equal(s.version, 8);
    assert.equal(s.eventLog.resolved, 0);
    assert.deepEqual(s.tappedAt, {});
    assert.equal(s.happinessBoost, 0);
  });

  it('lay lastEventAt lam moc bat dau cho suy giam hanh phuc', () => {
    const s = normalizeStoredState(v3Save({ lastEventAt: NOW - 3_600_000 }), NOW);
    assert.equal(s.lastEngagedAt, NOW - 3_600_000);
  });

  it('chuan hoa happinessBoost khong hop le', () => {
    // Save v6 co san field nay, save v3 thi migration gan 0 (xem test ben duoi).
    const v6 = (overrides: Record<string, unknown>) =>
      normalizeStoredState(JSON.stringify({ ...JSON.parse(v3Save()), version: 6, ...overrides }), NOW);
    assert.equal(v6({ happinessBoost: -50 }).happinessBoost, 0);
    assert.equal(v6({ happinessBoost: 9_999 }).happinessBoost, 30);
    assert.equal(v6({ happinessBoost: 12 }).happinessBoost, 12);
    assert.equal(v6({ happinessBoost: Number.NaN }).happinessBoost, 0);
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
        version: 6,
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
    assert.equal(s.version, 8);
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
    const s = normalizeStoredState(currentSave({ feverUntil: 0, feverEverUsed: true }), NOW);
    assert.equal(s.feverUntil <= NOW, true, 'fever da het');
    assert.equal(isQuestCompleted('q-fever-mode', s), true);
  });

  it('migration tu save dang chay Fever khong phat nguoi choi', () => {
    const s = normalizeStoredState(
      JSON.stringify({ ...JSON.parse(v3Save()), version: 4, feverUntil: NOW + 30_000 }),
      NOW,
    );
    assert.equal(s.version, 8);
    assert.equal(s.feverEverUsed, true, 'save v4 co Fever dang chay phai giu nhan');
  });

  it('migration tu save chua tung mo Fever de false', () => {
    const s = normalizeStoredState(JSON.stringify({ ...JSON.parse(v3Save()), version: 4, feverUntil: 0 }), NOW);
    assert.equal(s.feverEverUsed, false);
  });

  it('normalize tu ghi nhan khi save ghi Fever da het nhung chua co co', () => {
    const s = normalizeStoredState(currentSave({ feverUntil: 0, feverEverUsed: false }), NOW);
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

/* ═══════════════════════════════════════════════════════════════════════════
 * TẦNG 0 - SỐ LIỆU PHẢI TRUNG THỰC
 * Game dạy tài chính: số trên màn hình phải bằng số người chơi nhận, và
 * "doanh thu" phải là doanh thu chứ không phải tiền thưởng.
 * ═══════════════════════════════════════════════════════════════════════════ */

describe('Bảo Vật không được làm lệch số liệu', () => {
  /**
   * Regression cho bug nghiêm trọng nhất: `useCityDerived` nhân
   * `flow.revenue × (1 + relicBonus)` cho HUD, còn `tickIdle` cộng tiền theo
   * `flow.revenue` CHƯA nhân. Đeo 3 Bảo Vật (+90%) thì HUD hiện gấp 1,9 lần
   * nhưng ngân khố chỉ nhận 1 lần - người chơi thấy doanh thu không bao giờ
   * vận hành được.
   */
  it('truyền relicBonus vào flowFor để HUD và ngân khố cùng một số', () => {
    const b = node('quan-ca-phe', 0, 0, 10);
    const plain = flowFor([b], [], 10, 100_000, { idleMs: 0 }).revenue;
    // Chỉ bật relic doanh thu, không bật relic hạnh phúc (bật cái sau thì
    // hệ số thuế cũng đổi theo, không tách được hai hệ quả).
    const boosted = flowFor([b], [], 10, 100_000, { idleMs: 0, relicBonus: 0.9 }).revenue;
    assert.ok(
      Math.abs(boosted - plain * 1.9) < plain * 0.01,
      `relic +90% phai nhan doanh thu len 1,9 lan (${plain} -> ${boosted})`,
    );
  });

  it('Bảo Vật Hạnh Phúc đi cùng đường với Bảo Vật Doanh Thu', () => {
    const b = node('quan-ca-phe', 0, 0, 1);
    const plain = happinessFor([b], 0, 0);
    const relic = happinessFor([b], 0, 12);
    assert.ok(relic > plain, 'Bảo Vật hạnh phúc phải tăng điểm hạnh phúc');
  });

  it('KHÔNG con đường nào nhân relic ở ngoài flowFor', () => {
    // `useCityDerived` trước đây tự nhân lần nữa, gây nhân đôi. Không còn.
    const b = node('quan-ca-phe', 0, 0, 5);
    const once = flowFor([b], [], 5, 50_000, { relicBonus: 0.5 }).revenue;
    const twice = flowFor([b], [], 5, 50_000, { relicBonus: 0.5 }).revenue;
    assert.equal(once, twice, 'cùng đầu vào phải cho cùng kết quả');
  });

  it('Bảo Vật Hạnh Phúc đi cùng đường với Bảo Vật Doanh Thu', () => {
    const b = node('quan-ca-phe', 0, 0, 1);
    const plain = happinessFor([b], 0, 0);
    const relic = happinessFor([b], 0, 12);
    assert.ok(relic > plain, 'Bảo Vật hạnh phúc phải tăng điểm hạnh phúc');
  });
});

describe('Phân loại khoản thu - doanh thu ≠ tiền thưởng', () => {
  /**
   * Trước đây mọi khoản vào đều cộng vào `totalCoinsEarned` rồi thẻ chia sẻ
   * dán nhãn "Tổng Doanh Thu Tích Lũy". 2,96 triệu Xu thưởng bậc thành phố
   * bị báo thành doanh thu bán hàng — về kế toán đó là vốn góp chủ sở hữu.
   */
  it('migration v5 -> v6 không đoán bừa doanh thu cũ', () => {
    const s = normalizeStoredState(v3Save({ totalCoinsEarned: 5_000_000 }), NOW);
    assert.equal(s.totalRevenue, 0, 'không đoán doanh thu của save cũ');
    assert.equal(s.totalGrants, 5_000_000, 'ghi nhận vào dòng thưởng');
  });

  it('ba dòng khoản thu không âm', () => {
    const s = normalizeStoredState(currentSave({ totalRevenue: -5, totalGrants: -1 }), NOW);
    assert.equal(s.totalRevenue, 0);
    assert.equal(s.totalGrants, 0);
  });

  it('normalize giữ nguyên doanh thu đã ghi nhận', () => {
    const s = normalizeStoredState(currentSave({ totalRevenue: 777_000 }), NOW);
    assert.equal(s.totalRevenue, 777_000);
  });
});

describe('Chi phí hội thoại không bị trích hai lần', () => {
  /**
   * `resolveEvent` trừ `choice.costCoins` RỒI `applyEffects` lại trừ
   * `choice.effects.coins` — hai giá trị bằng nhau nên mọi lựa chọn có phí
   * đều mất gấp đôi. 26/36 pill hiển thị đúng một nửa số tiền thực trừ.
   *
   * `costCoins` là nguồn sự thật vì nó lái logic "không đủ Xu" trong
   * `DialogueModal`; `effects.coins` phải vắng mặt.
   */
  it('khong script nao co ca costCoins va effects.coins', () => {
    for (const s of CITY_EVENTS) {
      for (const c of s.choices) {
        assert.equal(
          c.effects?.coins,
          undefined,
          `${s.id}/${c.id}: bo effects.coins - costCoins da la nguon su that`,
        );
      }
    }
    for (const s of REQUEST_SCRIPTS) {
      for (const c of s.choices) {
        assert.equal(
          c.effects?.coins,
          undefined,
          `${s.id}/${c.id}: yeu cau cung chi dung costCoins`,
        );
      }
    }
  });

  it('pill chi phi hien DUNG so tien thuc tru', () => {
    for (const s of [...CITY_EVENTS, ...REQUEST_SCRIPTS]) {
      for (const c of s.choices) {
        if (c.costCoins === undefined) continue;
        const moneyTag = (c.tags ?? []).find((t) => /XU/.test(t.label));
        assert.ok(moneyTag, `${s.id}/${c.id} phai co pill hien chi phi`);
        const shown = parseInt(moneyTag.label.replace(/[^\d]/g, ''), 10);
        assert.equal(
          shown,
          c.costCoins,
          `${s.id}/${c.id}: pill "${moneyTag.label}" phai bang costCoins ${c.costCoins}`,
        );
      }
    }
  });

  it('khong con pill ghi "XU tong" (dau vet cua double-charge)', () => {
    for (const s of [...CITY_EVENTS, ...REQUEST_SCRIPTS]) {
      for (const c of s.choices) {
        for (const t of c.tags ?? []) {
          assert.ok(!/tổng/i.test(t.label), `${s.id}: pill "${t.label}" la vet cua loi double-charge`);
        }
      }
    }
  });

  it('khong lựa chọn nào trả thưởng Xu dương', () => {
    for (const s of [...CITY_EVENTS, ...REQUEST_SCRIPTS]) {
      for (const c of s.choices) {
        assert.ok(
          (c.effects?.coins ?? 0) <= 0,
          `${s.id}/${c.id}: khong duoc thu Xu qua hoi thoai - se la may in tien`,
        );
      }
    }
  });
});

describe('Migration ladder phai chay DAY DU cac bac', () => {
  /**
   * Ban <= 5 chi goi `MIGRATIONS[parsed.version]` MOT LAN nen save v3 bo qua
   * hoan toan buoc 4 va 5. Cac fallback o `normalizeStoredState` che loi nen
   * test van xanh - nhung moi bat buoc them field sau nay se lam save v3 hong.
   * Biet `feverEverUsed` la field cua V5 nen save V3 khong duoc co no.
   */
  it('save v3 qua duoc ca bac 4 den 8', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.equal(s.version, 8);
    assert.equal(s.feverEverUsed, false, 'V5 phai gan false vi V3 chua co field');
    assert.equal(s.lastTalkAt, 0, 'V5 phai gan 0');
  });

  it('save v4 qua duoc bac 5 den 8', () => {
    const s = normalizeStoredState(JSON.stringify({ ...JSON.parse(v3Save()), version: 4 }), NOW);
    assert.equal(s.version, 8);
    assert.equal(typeof s.totalGrants, 'number');
  });

  it('save v5 qua duoc bac 6 den 8', () => {
    const s = normalizeStoredState(JSON.stringify({ ...JSON.parse(v3Save()), version: 5 }), NOW);
    assert.equal(s.version, 8);
    assert.equal(s.totalRevenue, 0);
  });

  it('save hien tai khong chay migration nao', () => {
    const s = normalizeStoredState(currentSave({ totalRevenue: 4_200 }), NOW);
    assert.equal(s.totalRevenue, 4_200, 'save V7 phai giu nguyên doanh thu đã ghi');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * TẦNG 1 - BÁO CÁO KẾT QUẢ KINH DOANH
 * Đây là cả hai vế. Trước Tầng 1 game chỉ có một vế nên "lợi nhuận gộp"
 * và "lợi nhuận ròng" không tồn tại về mặt toán học.
 * ═══════════════════════════════════════════════════════════════════════════ */

describe('P&L - cong bang va tat ca dinh nghia', () => {
  const cafe = node('quan-ca-phe', 0, 0, 10);

  it('doanh thu - gia von = loi nhuan gop', () => {
    const f = flowFor([cafe], [], 10, 100_000, { idleMs: 0 });
    assert.ok(
      Math.abs(f.grossRevenue - f.cogs - f.grossProfit) < 1e-6,
      'grossProfit phai = grossRevenue - cogs',
    );
  });

  it('doanh thu - gia von - van hanh = loi nhuan hoat dong', () => {
    const f = flowFor([cafe], [], 10, 100_000, { idleMs: 0 });
    assert.ok(
      Math.abs(f.grossProfit - f.opex - f.operatingIncome) < 1e-6,
      'operatingIncome phai = grossProfit - opex',
    );
  });

  it('tru thue 20% tren loi nhuan hoat dong', () => {
    const f = flowFor([cafe], [], 10, 100_000, { idleMs: 0 });
    assert.ok(
      Math.abs(f.operatingIncome * CORPORATE_TAX_RATE - f.tax) < 1e-6,
      `thue phai = 20% x EBIT (${f.tax} vs ${f.operatingIncome * CORPORATE_TAX_RATE})`,
    );
  });

  it('dong cuoi cung bang nhau: gross - cogs - opex - tax = net', () => {
    const f = flowFor([cafe], [], 10, 100_000, { idleMs: 0 });
    assert.ok(
      Math.abs(f.grossRevenue - f.cogs - f.opex - f.tax - f.netIncome) < 1e-6,
      'dong cuoi bao cao phai cong bang',
    );
  });

  it('costPerSec = tong ba dong chi phi', () => {
    const f = flowFor([cafe], [], 10, 100_000, { idleMs: 0 });
    assert.ok(Math.abs(f.cogs + f.opex + f.tax - f.costPerSec) < 1e-6);
  });

  it('thue khong bao gio am khi cong trinh lam loi chay', () => {
    // Thua l亏损 thi EBIT < 0; thue phai = 0 chu khong duoc trừ nguoc.
    const f = flowFor([], [], 1, 0, { idleMs: 0 });
    assert.equal(f.tax, 0, 'cong trinh rong khong phai nop thue');
  });
});

describe('P&L - bien loi nhuan phu thuoc cau truc kinh doanh', () => {
  it('cua hang an uong co bien gop thap hon tram tai chinh', () => {
    const cafe = flowFor([node('quan-ca-phe', 0, 0, 10)], [], 10, 0, { idleMs: 0 });
    const bank = flowFor([node('ngan-hang-so', 0, 0, 10)], [], 10, 0, { idleMs: 0 });
    assert.ok(
      cafe.grossMargin < bank.grossMargin,
      `quan ca phe (${cafe.grossMargin.toFixed(3)}) phai thap hon ngan hang (${bank.grossMargin.toFixed(3)})`,
    );
  });

  it('cong trinh giao dich so gia von thap hon hang ban', () => {
    const shop = BUILDING_BY_ID['quan-ca-phe'];
    const exchange = BUILDING_BY_ID['san-chung-khoan'];
    assert.ok(
      (exchange.cogsRate ?? 1) < (shop.cogsRate ?? 1),
      'san chung khoan khong ton ha tong nen gia von phai thap',
    );
  });

  it('moi cong trinh deu khai bao ty le gia von va van hanh', () => {
    for (const b of BUILDINGS) {
      assert.ok(
        typeof b.cogsRate === 'number' && b.cogsRate > 0 && b.cogsRate < 1,
        `${b.id} thieu cogsRate hop le`,
      );
      assert.ok(
        typeof b.opexRate === 'number' && b.opexRate > 0 && b.opexRate < 1,
        `${b.id} thieu opexRate hop le`,
      );
    }
  });

  it('moi thu muc doi grossUp - khong con so phong to chung', () => {
    // Cong trinh giao dich so (gia von 8%) phai can grossUp nho hon cua hang
    // an uong (gia von 45%). Dung 1 he so chung se lam mot trong hai ben sai,
    // va so do cua game se khong cong bang nua.
    const cafe = grossUpFor(0.45, 0.35, 0.9);
    const sàn = grossUpFor(0.08, 0.2, 0.9);
    assert.ok(sàn < cafe, `sàn (${sàn.toFixed(2)}) < cà phê (${cafe.toFixed(2)})`);
    assert.ok(cafe > 4, 'gia von cao phai can phong to doanh thu gap nhieu');
  });

  it('moi cong trinh van ra duoc bao cao P&L co bien khac nhau', () => {
    // Cung mot cap, mot doanh thu: bien gop phai KHAC nghen nhau theo nganh.
    const g = (id: string) => flowFor([node(id, 0, 0, 10)], [], 10, 0, { idleMs: 0 }).grossMargin;
    // Gia von goc: ca phe 45%, rap phim 55%, san chung khoan 8%.
    const cafe = g('quan-ca-phe');
    const rạp = g('rap-phim-momo');
    const sàn = g('san-chung-khoan');
    // Mot cong trinh: toan bo doanh thu la doanh thu ban hang nen bien gop
    // = 1 - cogsRate. San giao dich so KHONG ton hang nen bien cao nhat.
    assert.ok(sàn > cafe, `sàn (${sàn.toFixed(2)}) phai cao hơn cà phê (${cafe.toFixed(2)})`);
    assert.ok(cafe > rạp, `cà phê (${cafe.toFixed(2)}) phai cao hơn rạp phim (${rạp.toFixed(2)})`);
    // Rạp phim gia von nang nhat: biên thap nhat.
    assert.ok(rạp < 0.5, `rạp phim phai thap hon 50%, dang ${(rạp * 100).toFixed(1)}%`);
  });

  it('ty le ghep don tang - gia von va van hanh cong lai duoi 100%', () => {
    for (const b of BUILDINGS) {
      assert.ok(
        (b.cogsRate ?? 0) + (b.opexRate ?? 0) < 0.9,
        `${b.id}: cogs ${b.cogsRate} + opex ${b.opexRate} phai duoi 90%`,
      );
    }
  });
});

describe('P&L - tien thuc nhan khong doi so voi truoc Tầng 1', () => {
  /**
   * Tien ngan khoc phai GIONG nhau truoc khi tach viet chi. Neu khong, nguoi
   * choi dang cap 40 se phai tra them 4,5 gio moi cap thay vi 269 phut, va moi
   * hang so san bang (`UPGRADE_GROWTH`, `xpForLevel`) se pha.
   */
  it('netIncome = tong 3 dong doanh thu, khong con la con so nao khac', () => {
    /**
     * Bat buoc: `grossUp` phai tri chinh het muc giam cua ca gia von, chi phi
     * van hanh va thue. Bang chung: so tien thuc vao ngan khoc phai bang DUNG
     * tong 3 dong doanh thu tinh duoc - y het tinh huong truoc Tầng 1.
     *
     * Test nay khong dung so co dinh nen khong phu thuoc toa do (ke lien nhau
     * lam doi Combo Lien Ke) hay con so may sinh ngau nhien.
     */
    const mods: StoreModuleId[] = ['QR_LOA_THAN_TAI', 'VI_TRA_SAU_VOUCHER', 'TUI_THAN_TAI_AUTO'];
    const max = (defId: string, c: number, r: number) =>
      node(defId, c, r, 10, { starRating: 5, modules: mods, managerId: 'khoi-nguyen-cto' });
    const at = (i: number) => ({ c: i % 4, r: Math.floor(i / 4) });

    const cities: BuildingNode[][] = [
      [node('quan-ca-phe', 0, 0, 1)],
      BUILDINGS.slice(0, 4).map((d, i) => node(d.id, at(i).c, at(i).r, 1)),
      BUILDINGS.slice(0, 4).map((d, i) => max(d.id, at(i).c, at(i).r)),
      BUILDINGS.map((d, i) => max(d.id, at(i).c, at(i).r)),
    ];

    for (const city of cities) {
      const f = flowFor(city, [], 10, 100_000, { idleMs: 0 });
      const lines = f.storeYield + f.networkFee + f.savingsYield;
      const diff = Math.abs((f.netIncome / lines - 1) * 100);
      assert.ok(
        diff < 0.01,
        `netIncome ${f.netIncome} phai bang tong 3 dong ${lines} (lech ${diff.toFixed(3)}%)`,
      );
    }
  });

  it('cong toan khong doi khi them Bảo Vật hay Giờ Vàng', () => {
    const b = [node('quan-ca-phe', 0, 0, 10)];
    const plain = flowFor(b, [], 10, 100_000, { idleMs: 0 });
    const relics = flowFor(b, [], 10, 100_000, { idleMs: 0, relicBonus: 0.9 });
    const fever = flowFor(b, [], 10, 100_000, { idleMs: 0, isFever: true });
    for (const [name, f] of [['bao vat', relics], ['gio vang', fever]] as const) {
      const lines = f.storeYield + f.networkFee + f.savingsYield;
      assert.ok(
        Math.abs((f.netIncome / lines - 1) * 100) < 0.01,
        `${name}: phai van giu cong thuc doanh thu = loi nhuan rong`,
      );
    }
    // Giờ Vàng nhân đôi mọi thứ: cả doanh thu lẫn lợi nhuận ròng.
    assert.ok(fever.netIncome > plain.netIncome * 1.9);
  });

  it('grossUp tu hieu - chi phi cao thi grossUp tham hon', () => {
    // Doanh thu gop phai lon gap hon de con nghiem loi nhuan mong doi.
    // Gia von cao -> phai phong to doanh thu it hon.
    const dat = grossUpFor(0.45, 0.35, 0.9);
    const rao = grossUpFor(0.10, 0.15, 0.9);
    assert.ok(
      rao < dat,
      `giao dich so (${rao.toFixed(2)}) phai it phong to hon cua hang an uong (${dat.toFixed(2)})`,
    );
  });

  it('grossUp luon duong - tien nhan khong bao gio am', () => {
    for (const [c, o] of [[0.45, 0.35], [0.1, 0.15], [0.05, 0.05], [0.7, 0.2]]) {
      const g = grossUpFor(c, o, 0.95);
      assert.ok(g > 1, `grossUp(${c},${o},0.95)=${g} phai > 1`);
    }
  });
});

describe('Sổ cái - phân biệt chi phí vận hành và chi tiêu vốn', () => {
  it('capex khong bao gio la doi am', () => {
    const s = normalizeStoredState(
      currentSave({
        ledgerLifetime: { ...emptyLedger(), capex: -100, day: 'x', month: 'y' },
      }),
      NOW,
    );
    assert.equal(s.ledgerLifetime.capex, 0);
  });

  it('save chuaa co so cai thi tao ba so rong', () => {
    const s = normalizeStoredState(v3Save(), NOW);
    assert.equal(s.ledgerLifetime.grossRevenue, 0);
    assert.equal(s.ledgerDay.netIncome, 0);
    assert.equal(s.ledgerMonth.cogs, 0);
  });

  it('migration v6 -> v8 KHONG uoc luong doanh thu cu', () => {
    // 2,96 trieu Xu thuong khong phai loi nhuan. Uoc luong se ghi mot lan nua
    // vao bao cao - dung hon la de do so 0 va ghi tu tick dau tien.
    const s = normalizeStoredState(
      JSON.stringify({
        ...JSON.parse(v3Save()),
        version: 6,
        totalRevenue: 9_999_999,
        totalCoinsEarned: 12_000_000,
      }),
      NOW,
    );
    assert.equal(s.ledgerLifetime.grossRevenue, 0);
    assert.equal(s.ledgerLifetime.netIncome, 0);
    assert.equal(s.ledgerLifetime.capex, 0);
  });

  it('so ngay va thang tro ve ky hien tai khi normalize', () => {
    const s = normalizeStoredState(
      currentSave({
        ledgerDay: { ...emptyLedger(), day: '1999-1-1', month: '1999-1', grossRevenue: 500 },
        ledgerMonth: { ...emptyLedger(), day: '1999-1-1', month: '1999-1', grossRevenue: 900 },
      }),
      NOW,
    );
    const d = new Date(NOW);
    assert.equal(s.ledgerDay.day, `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
    assert.equal(s.ledgerMonth.month, `${d.getFullYear()}-${d.getMonth() + 1}`);
  });

  it('so lieu da ghi trong so ngay khong bi mat khi sua khoa ky', () => {
    const s = normalizeStoredState(
      currentSave({
        ledgerDay: { ...emptyLedger(), day: '1999-1-1', month: '1999-1', grossRevenue: 500, cogs: 200 },
      }),
      NOW,
    );
    assert.equal(s.ledgerDay.grossRevenue, 500, 'chi sua khoa ky, khong xoa so lieu');
    assert.equal(s.ledgerDay.cogs, 200);
  });

  it('khong ghi am khi ledger phai cham', () => {
    const s = normalizeStoredState(
      currentSave({
        ledgerLifetime: { ...emptyLedger(), cogs: -50, opex: -20, tax: -5, netIncome: -99 },
      }),
      NOW,
    );
    assert.equal(s.ledgerLifetime.cogs, 0);
    assert.equal(s.ledgerLifetime.opex, 0);
    assert.equal(s.ledgerLifetime.tax, 0);
    assert.equal(s.ledgerLifetime.netIncome, 0);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * CHUỖI NGÀY CHƠI LIÊN TIẾP — đòn bẩy retention rẻ nhất
 * ═══════════════════════════════════════════════════════════════════════════ */

describe('Chuỗi ngày - không được tự tăng trong cùng một ngày', () => {
  it('chuỗi và con số 0 khi chưa chơi ngày nào', () => {
    const s = normalizeStoredState(currentSave(), NOW);
    assert.equal(s.streak.days, 0);
    assert.equal(s.streak.lastDay, '');
    assert.equal(s.streak.best, 0);
  });

  it('normalize chuẩn hoá chuỗi hỏng tay', () => {
    const s = normalizeStoredState(
      currentSave({
        streak: { days: -5, lastDay: 'abc', best: -1 },
      }),
      NOW,
    );
    assert.equal(s.streak.days, 0, 'so ngay am phai ve 0');
    assert.equal(s.streak.best, 0);
    assert.equal(s.streak.lastDay, 'abc', 'khoa ngay giu nguyen de tranh reset o chay sai');
  });

  it('migration v7 -> v8 tao chuỗi rỗng, khong tự cho 1 ngày', () => {
    const s = normalizeStoredState(JSON.stringify({ ...JSON.parse(v3Save()), version: 7 }), NOW);
    assert.equal(s.streak.days, 0, 'nguoi choi moi CHUA choi ngay nao');
    assert.equal(s.streakClaimed, 0);
  });

  it('migration giu nguyen chuỗi dang có o save v7', () => {
    const s = normalizeStoredState(
      JSON.stringify({
        ...JSON.parse(v3Save()),
        version: 7,
        streak: { days: 12, lastDay: '2020-1-1', best: 20 },
      }),
      NOW,
    );
    assert.equal(s.streak.days, 12, 'khong duoc reset chuỗi nguoi choi da co');
    assert.equal(s.streak.best, 20);
  });
});

describe('Chuỗi ngày - moc thuong tăng vọt', () => {
  it('moc thuong tang dan va khong trung ngay', () => {
    const days = STREAK_MILESTONES.map((m) => m.days);
    for (let i = 1; i < days.length; i++) {
      assert.ok(days[i] > days[i - 1], `moc ${days[i]} phai lon hon moc truoc`);
    }
  });

  it('thuong moc 30 ngay lon hon moc 14 ngay', () => {
    const m14 = STREAK_MILESTONES.find((m) => m.days === 14)!;
    const m30 = STREAK_MILESTONES.find((m) => m.days === 30)!;
    assert.ok(m30.rewardCoins > m14.rewardCoins, 'thuong phai ngoi hon de tao ly do quay lai');
  });

  it('streakMilestoneReached tra ve moc cao nhat da cham', () => {
    assert.equal(streakMilestoneReached(0), null);
    assert.equal(streakMilestoneReached(5)?.days, 3);
    assert.equal(streakMilestoneReached(10)?.days, 7);
    assert.equal(streakMilestoneReached(200)?.days, 100);
  });

  it('nextStreakMilestone chi ra moc con thieu', () => {
    assert.equal(nextStreakMilestone(0)?.days, 3);
    assert.equal(nextStreakMilestone(3)?.days, 7);
    assert.equal(nextStreakMilestone(6)?.days, 7);
    assert.equal(nextStreakMilestone(100), null, 'da cham toi da thi khong con moc');
  });

  it('moc tiep theo luon lon hon chuoi hien tai', () => {
    for (let d = 0; d <= 100; d++) {
      const next = nextStreakMilestone(d);
      if (next) assert.ok(next.days > d, `d=${d}: moc ${next.days} phai > chuoi`);
    }
  });
});

describe('Thưởng offline không được phạt người chơi vắng mặt', () => {
  /**
   * Ban <= 7 `normalizeStoredState` truyền `idleMs: now - lastEngagedAt` khi tính
   * thưởng offline. `idleMs` làm tụt hạnh phúc, mà hạnh phúc làm tụt hệ số
   * thu ngân — nên đóng tab 8 tiếng nhận 7,77 triệu Xu còn quay lại mỗi giờ
   * nhận 8,60 triệu. Game thưởng cho sự hiện diện, phạt cho sự vắng mặt: ngược
   * hẳn mục tiêu kéo người chơi quay lại.
   */
  it('cung thoi gian vang mat, thuong luon bang nhau du keo dao hanh phuc', () => {
    /**
     * Test truc tiep hon "co phat nguoi chua": cung mot khoang van mat 8 tieng,
     * mot ban vua tam ngung 8 tieng (`lastEngagedAt` rat cu) va mot ban vua
     * vua cham danh 8 tieng (`lastEngagedAt` moi) PHAI nhan cung so tien.
     *
     * Truoc khi sua, ban thu hai nhan nhieu hon ~16%.
     */
    const stuck = normalizeStoredState(
      currentSave({
        buildings: [node('chung-cu-cao-cap', 0, 0, 20, { starRating: 3 })],
        lastSeenAt: NOW - 8 * 3_600_000,
        lastEngagedAt: NOW - 8 * 3_600_000,
      }),
      NOW,
    );
    const justWentAway = normalizeStoredState(
      currentSave({
        buildings: [node('chung-cu-cao-cap', 0, 0, 20, { starRating: 3 })],
        lastSeenAt: NOW - 8 * 3_600_000,
        lastEngagedAt: NOW - 60_000,
      }),
      NOW,
    );
    assert.ok(stuck.pendingOffline && justWentAway.pendingOffline);
    assert.equal(
      stuck.pendingOffline.coins,
      justWentAway.pendingOffline.coins,
      'thuong offline khong duoc phu thuoc lan tuong tac gan nhat',
    );
  });

  it('hanh phuc van suy giam khi game chay - pho bi thay doi ngay khi vao', () => {
    const b = [node('chung-cu-cao-cap', 0, 0, 20, { starRating: 3 })];
    assert.ok(happinessFor(b, 0, 0) > happinessFor(b, 8 * 3_600_000, 0),
      'suy giam van con nguyen y nghia: pho xau di, nguoi choi quay lai xem lai');
  });
});

describe('Subtitle viết tay phải tới được người chơi', () => {
  /**
   * `DialogueModal` hiện `view.subtitle ?? 'Chuyện này chỉ mình bạn biết...'`.
   * Trước đây `page.tsx` dựng `DialogueView` mà KHÔNG truyền `subtitle`, nên 70
   * câu đã viết tay trong code không bao giờ hiện ra - mất sạch một lớp
   * narrative.
   */
  it('mọi script đều có subtitle viết tay', () => {
    for (const s of [...CITY_EVENTS, ...REQUEST_SCRIPTS]) {
      assert.ok(s.subtitle && s.subtitle.length > 0, `${s.id} thieu subtitle`);
    }
  });

  it('subtitle khac tieu de roi', () => {
    const junk = [...CITY_EVENTS, ...REQUEST_SCRIPTS].filter(
      (s) => s.subtitle?.trim() === s.title.trim(),
    );
    assert.equal(junk.length, 0, 'subtitle khong duoc trung title');
  });

  it('khong script nao con fallback chu chua doi', () => {
    const FALLBACK = 'Chuyện này chỉ mình bạn biết...';
    for (const s of [...CITY_EVENTS, ...REQUEST_SCRIPTS]) {
      assert.notEqual(s.subtitle, FALLBACK, `${s.id} dang de fallback trong code du lieu`);
    }
  });
});

describe('Không còn script chết do xung đột với startServices', () => {
  /**
   * `eligibleRequestsFor` loại script khi `missingService` đã nằm trong
   * `ARCHETYPES[x].startServices`. 6 script khai báo đúng trường hợp đó nên
   * không bao giờ hiển thị dù người chơi đạt mọi điều kiện.
   */
  it('mọi request đều có thể xuất hiện với NPC archetype của nó', () => {
    for (const s of REQUEST_SCRIPTS) {
      const start = ARCHETYPES[s.archetype].startServices;
      if (!s.missingService) continue;
      assert.ok(
        !start.includes(s.missingService),
        `${s.id}: ${s.missingService} đã có sẵn trong startServices của ${s.archetype} nên script chết vĩnh viễn`,
      );
    }
  });

  it('không trùng id sau khi xoá script', () => {
    const ids = new Set(REQUEST_SCRIPTS.map((s) => s.id));
    assert.equal(ids.size, REQUEST_SCRIPTS.length, 'id phải duy nhất để REQUEST_BY_ID tra ra đúng script');
  });

  it('mọi request vẫn có đủ lựa chọn và reply sau khi xoá', () => {
    for (const s of REQUEST_SCRIPTS) {
      assert.ok(s.choices.length >= 2, `${s.id} can it nhat 2 lua chon`);
      for (const c of s.choices) {
        assert.ok(c.reply.trim().length > 0, `${s.id}/${c.id} thieu reply`);
      }
    }
  });

  it('CINEPHILE và TRAVELER vẫn còn nội dung chạy được', () => {
    // Sau khi xoá, 2 archetype nay chi con 1 script. Neu test nay fail thi
    // da xoa nham nhieu.
    assert.ok(REQUEST_SCRIPTS.filter((s) => s.archetype === 'CINEPHILE').length >= 1);
    assert.ok(REQUEST_SCRIPTS.filter((s) => s.archetype === 'TRAVELER').length >= 1);
  });
});
