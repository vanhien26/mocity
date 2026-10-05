/**
 * Test KET THUC GAME + CHANG BA NHIEM VU.
 *
 * Vì sao suite này tồn tại:
 * - `endingForState` từng nằm chìm trong `tickIdle` nên không ai test được;
 *   hệ quả là ngưỡng win (50 tr / 100 tr mỗi tháng) vẫn nằm ở quy mô của bản
 *   nháp đầu tiên, trong khi kinh tế thật đã tính bằng hàng trăm tỷ.
 * - Chặng 3 từng không tồn tại: bảng nhiệm vụ dừng ở Chặng 2 nên người chơi
 *   dài hạn không còn mục tiêu.
 *
 * Chạy: npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  endingForState,
  isQuestCompleted,
  normalizeStoredState,
  PLAYER_DEBT_MISSED_LIMIT,
  SAVE_FILE_VERSION as STATE_VERSION,
} from './store';
import { BUILDING_BY_ID, MAYOR_QUESTS } from './mock-city-data';
import { happinessFor, populationFor } from './city-calculator';
import type { BuildingNode, CityState, StreakState } from './types';

const NOW = 1_700_000_000_000;
const NO_GOC = 200_000_000;

function node(defId: string, col: number, row: number, level = 1, starRating = 1): BuildingNode {
  assert.ok(BUILDING_BY_ID[defId], `thieu cong trinh ${defId}`);
  return { id: `${defId}_${col}_${row}`, defId, col, row, level, starRating, lastCollectedAt: 0, modules: [] };
}

/** `n` công trình đầu tiên trong danh sách, chia đều theo lưới 10x10. */
function grid(n: number, make: (i: number) => BuildingNode): BuildingNode[] {
  return Array.from({ length: n }, (_, i) => make(i));
}

function save(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: STATE_VERSION,
    mayorName: 'Người Lập Nghiệp',
    cityName: 'Đô Thị MoCity',
    hasNamedCity: true,
    gridSize: 10,
    unlockedCols: 10,
    unlockedRows: 10,
    buildings: [],
    coins: 50_000_000,
    playerDebtPrincipal: NO_GOC,
    playerDebtPaid: 0,
    playerDebtMissed: 0,
    lastSeenAt: NOW,
    createdAt: NOW,
    ...overrides,
  });
}

function state(overrides: Record<string, unknown> = {}): CityState {
  return normalizeStoredState(save(overrides), NOW);
}

function ending(s: Pick<CityState, 'buildings' | 'playerDebtPrincipal' | 'playerDebtPaid' | 'playerDebtMissed'>) {
  return endingForState(s);
}

describe('endingForState - tra het no goc', () => {
  it('chua tra het no -> khong ket thuc', () => {
    assert.equal(ending(state({ playerDebtPaid: NO_GOC - 1 })), null, 'con 1 dong no cua thi chua duoc ket thuc');
  });

  it('tra het no ma khong con cong trinh -> survival', () => {
    assert.equal(ending(state({ playerDebtPaid: NO_GOC })), 'survival', 'tra het no nhung chay khong gi la Song Sot');
  });

  it('2 tiem cap 1 van la survival - co cau nho nen khong phat dat', () => {
    const s = state({
      playerDebtPaid: NO_GOC,
      buildings: [node('quan-ca-phe', 0, 0), node('nha-pho-binh-dan', 1, 0)],
    });
    assert.equal(ending(s), 'survival', '2 tiem cap 1 chi ~414 ty/thang, duoi nguong phat dat 500 ty');
  });

  it('6 tiem cap 10 la prosperity', () => {
    const s = state({
      playerDebtPaid: NO_GOC,
      buildings: grid(6, (i) => node('quan-ca-phe', i, 0, 10, 2)),
    });
    assert.equal(ending(s), 'prosperity', '6 tiem cap 10 vuot nguong 500 ty/thang');
  });

  it('du dong tien nhung < 10 cong trinh van khong phai empire', () => {
    const s = state({
      playerDebtPaid: NO_GOC,
      buildings: grid(9, (i) => node('thap-momo', i, 0, 50, 5)),
    });
    assert.equal(ending(s), 'prosperity', '9 cong trinh khong du dieu kien quy mo cua co do');
  });

  it('>= 10 cong trinh va dong tien lon -> empire', () => {
    const s = state({
      playerDebtPaid: NO_GOC,
      buildings: grid(10, (i) => node('thap-momo', i % 10, Math.floor(i / 10), 50, 5)),
    });
    assert.equal(ending(s), 'empire');
  });
});

describe('endingForState - tre no (bankrupt)', () => {
  it('du so ky tre -> bankrupt', () => {
    const s = state({ playerDebtMissed: PLAYER_DEBT_MISSED_LIMIT });
    assert.equal(ending(s), 'bankrupt');
  });

  it('thieu mot ky -> van chua mat dat', () => {
    const s = state({ playerDebtMissed: PLAYER_DEBT_MISSED_LIMIT - 1 });
    assert.equal(ending(s), null, '2 ky tre chi la canh bao, ky thu 3 moi mat dat');
  });

  it('tra het no sau do thi win uu tien hon trang thai bankrupt', () => {
    const s = state({ playerDebtPaid: NO_GOC, playerDebtMissed: PLAYER_DEBT_MISSED_LIMIT });
    assert.equal(ending(s), 'survival', 'co tien tra het no thi khong the van con bi mat dat');
  });
});

describe('gameEnding - migration va luu tru', () => {
  it('giu ket thuc bankrupt da luu', () => {
    assert.equal(state({ gameEnding: 'bankrupt' }).gameEnding, 'bankrupt');
    assert.equal(state({ gameEnding: 'empire' }).gameEnding, 'empire');
  });

  it('loai gia tri ket thua khoi luu tru cu', () => {
    assert.equal(state({ gameEnding: 'phongtro' }).gameEnding, null);
  });
});

describe('Chặng 3 - Cơ Nghiệp', () => {
  const ch3 = MAYOR_QUESTS.filter((q) => q.stage === 3);

  it('bang nhiem vu co dung 3 chang va khong trung id', () => {
    const stages = MAYOR_QUESTS.map((q) => q.stage);
    assert.deepEqual([...new Set(stages)].sort(), [1, 2, 3], 'phai co du 3 chuong trinh tien trinh');
    assert.equal(MAYOR_QUESTS.length, 26, '10 + 8 + 8 muc');
    assert.equal(new Set(MAYOR_QUESTS.map((q) => q.id)).size, MAYOR_QUESTS.length, 'id phai la duy nhat');
    assert.equal(ch3.length, 8, 'chay 3 phai du 8 muc');
  });

  it('moi muc Chang 3 deu co phan thuong lon hon muc cuoi Chang 2', () => {
    const cuoiCh2 = Math.max(...MAYOR_QUESTS.filter((q) => q.stage === 2).map((q) => q.rewardCoins));
    for (const q of ch3) {
      assert.ok(q.rewardCoins > cuoiCh2, `${q.id} thuong ${q.rewardCoins} phai lon hon chay 2 (${cuoiCh2})`);
      assert.ok(q.rewardXp > 0 && q.rewardGems > 0, `${q.id} phai co ca gem lan XP`);
    }
  });

  it('chua lam gi het thi khong muc nao hoan thanh', () => {
    const s = state();
    for (const q of ch3) {
      assert.equal(isQuestCompleted(q.id, s), false, `${q.id} khong duoc hoan thanh o trang thai rong`);
    }
  });

  it('tung muc tra ve true khi dieu kien thuc su dat duoc', () => {
    const cases: Array<[string, Record<string, unknown>]> = [
      ['q-happiness-85', { buildings: [node('thap-momo', 0, 0)], happinessBoost: 30 }],
      ['q-module-12', {
        buildings: grid(12, (i) => ({ ...node('quan-ca-phe', i % 10, Math.floor(i / 10)), modules: ['QR_LOA_THAN_TAI' as const] })),
      }],
      ['q-half-debt', { playerDebtPaid: NO_GOC / 2 }],
      ['q-streak-30', { streak: { days: 0, lastDay: '2026-1-1', best: 30 } satisfies StreakState }],
      ['q-level-50', { buildings: [node('quan-ca-phe', 0, 0, 50)] }],
      ['q-five-star', { buildings: [node('quan-ca-phe', 0, 0, 1, 5)] }],
      ['q-full-grid', { buildings: grid(46, (i) => node('quan-ca-phe', i % 10, Math.floor(i / 10))) }],
      ['q-tier-8', {
        buildings: grid(46, (i) =>
          i === 0 ? node('thap-momo', 0, 0, 50, 5) : node('nha-pho-binh-dan', i % 10, Math.floor(i / 10))),
      }],
    ];

    assert.equal(cases.length, ch3.length, 'phai co case cho tung muc chang 3');
    for (const [questId, overrides] of cases) {
      const s = state(overrides);
      assert.equal(isQuestCompleted(questId, s), true, `${questId} phai hoan thanh khi dieu kien dat`);
    }
  });

  it('die kien cua tung case dang su dung that su co trong state', () => {
    // Khong thi test tren chi dang cham vao gia tri khong tac dong gi.
    assert.ok(happinessFor(state({ buildings: [node('thap-momo', 0, 0)], happinessBoost: 30 }).buildings, 0, 30) >= 85);
    assert.ok(populationFor(state({ buildings: grid(46, (i) => (i === 0 ? node('thap-momo', 0, 0, 50, 5) : node('nha-pho-binh-dan', i % 10, Math.floor(i / 10)))) }).buildings) >= 40_000,
      'die kien Rank 8 can it nhat 40.000 dan');
  });

  it('mot nua no chua du -> q-half-debt chua xong', () => {
    const s = state({ playerDebtPaid: NO_GOC / 2 - 1 });
    assert.equal(isQuestCompleted('q-half-debt', s), false);
  });
});
