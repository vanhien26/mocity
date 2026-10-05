/**
 * Test WEALTH MATRIX lay so lieu THAT tu state.
 *
 * Vì sao suite này tồn tại: trước đây `getWealthMatrixMetricsStore` hardcode
 * yield 30 trieu/thang + opex 10 trieu/thang va dinh gia cong trinh = level x
 * 50 trieu. Hau qua: `debtToAsset` luon ~0 (vi `takeLoan` bi tat nen `debt`
 * = 0), cashflow luon duong -> `evaluateEndingProfile` tra ve RESILIENT_ESTATE
 * 95/100 cho moi nguoi choi, co nghia la diem so da hien thi o man hinh ket thuc
 * chi la so lam.
 *
 * Chay: npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildingValuation, normalizeStoredState, SAVE_FILE_VERSION as STATE_VERSION, wealthMetricsFor } from './store';
import { evaluateEndingProfile } from './wealth-matrix';
import { BUILDING_BY_ID } from './mock-city-data';
import type { BuildingNode, CityState } from './types';

const NOW = 1_700_000_000_000;

function node(defId: string, col: number, row: number, level = 1, starRating = 1): BuildingNode {
  assert.ok(BUILDING_BY_ID[defId], `thieu cong trinh ${defId}`);
  return { id: `${defId}_${col}_${row}`, defId, col, row, level, starRating, lastCollectedAt: 0, modules: [] };
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
    debt: 0,
    lastSeenAt: NOW,
    lastEngagedAt: NOW,
    createdAt: NOW,
    ...overrides,
  });
}

function state(overrides: Record<string, unknown> = {}): CityState {
  return normalizeStoredState(save(overrides), NOW);
}

describe('wealthMetricsFor - dong tien la so that', () => {
  it('pho rong cho dong tien gan nhu 0, khong con 20 trieu/thang cua so mau', () => {
    const m = wealthMetricsFor(state());
    assert.ok(
      Math.abs(m.monthlyNetCashflow) < 1_000_000_000,
      `pho rong ma dong tien ${m.monthlyNetCashflow} la bat binh thuong`,
    );
    assert.ok(Number.isFinite(m.totalAssetsValuation));
  });

  it('6 tiem cap 10 cho dong tien hang nghin ty, khong phai hang chuc trieu', () => {
    const s = state({
      buildings: Array.from({ length: 6 }, (_, i) => node('quan-ca-phe', i, 0, 10, 2)),
    });
    const m = wealthMetricsFor(s);
    // Ban cu: yield 30 trieu - opex 10 trieu = ~20 trieu/thang cho MOI trang thai.
    assert.ok(
      m.monthlyNetCashflow > 100_000_000_000,
      `6 tiem cap 10 ma dong tien chi ${m.monthlyNetCashflow} = so mau con trong`,
    );
    assert.ok(Number.isFinite(m.liquidityRatio) && Number.isFinite(m.debtToAssetRatio));
  });

  it('them tiem thi dong tien tang', () => {
    const itMot = wealthMetricsFor(state({ buildings: [node('quan-ca-phe', 0, 0)] }));
    const itSau = wealthMetricsFor(state({
      buildings: Array.from({ length: 6 }, (_, i) => node('quan-ca-phe', i, 0)),
    }));
    assert.ok(
      itSau.monthlyNetCashflow > itMot.monthlyNetCashflow,
      'them tiem thi doanh thu phai tang hon chi phi',
    );
  });

  it('khong bi NaN khi save cu thieu lastEngagedAt', () => {
    const raw = JSON.parse(save()) as Record<string, unknown>;
    delete raw.lastEngagedAt;
    const m = wealthMetricsFor(normalizeStoredState(JSON.stringify(raw), NOW));
    for (const v of Object.values(m)) {
      assert.ok(typeof v !== 'number' || Number.isFinite(v), `chi so ${v} khong duoc la NaN/Infinity`);
    }
  });
});

describe('buildingValuation - gia xay lai', () => {
  it('it nhat bang gia xay ban dau', () => {
    const def = BUILDING_BY_ID['quan-ca-phe'];
    assert.ok(buildingValuation(node('quan-ca-phe', 0, 0)) >= def.costCoins);
  });

  it('tang theo cap va theo sao', () => {
    const cap1 = buildingValuation(node('quan-ca-phe', 0, 0, 1, 1));
    const cap10 = buildingValuation(node('quan-ca-phe', 0, 0, 10, 1));
    const sao5 = buildingValuation(node('quan-ca-phe', 0, 0, 10, 5));
    assert.ok(cap10 > cap1, 'nang cap phai lam gia tri tang');
    assert.ok(sao5 > cap10, 'nang sao phai lam gia tri tang');
  });

  it('khong con la con so lam 50 trieu moi cap', () => {
    // Cach cu: level x 50 trieu -> quan caphe cap 1 = 50 trieu (gia that 5 trieu).
    assert.notEqual(buildingValuation(node('quan-ca-phe', 0, 0, 1, 1)), 50_000_000);
  });
});

describe('evaluateEndingProfile + so that = co phan biet', () => {
  it('khong no -> khong bi ket loi la Do Che Mong Manh', () => {
    const s = state({ buildings: Array.from({ length: 6 }, (_, i) => node('quan-ca-phe', i, 0, 10, 2)) });
    const profile = evaluateEndingProfile(wealthMetricsFor(s));
    assert.notEqual(profile.id, 'FRAGILE_EMPIRE', 'co 6 tiem nhung khong no ma khong the la do che mong manh');
  });

  it('no lon hon tai san -> Do Che Mong Manh', () => {
    const s = state({ debt: 10_000_000_000, buildings: [node('quan-ca-phe', 0, 0)] });
    const metrics = wealthMetricsFor(s);
    assert.ok(metrics.debtToAssetRatio > 0.35, `ty le no/ tai san ${metrics.debtToAssetRatio} phai vuot 0.35`);
    assert.equal(evaluateEndingProfile(metrics).id, 'FRAGILE_EMPIRE');
  });
});
