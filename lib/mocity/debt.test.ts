import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORPORATE_TAX_RATE,
  COVERAGE_WARNING_AT,
  GAME_YEAR_SECONDS,
  LOAN_ANNUAL_RATE,
  MAX_DEBT_TO_EBIT,
  debtCeilingFor,
  flowFor,
  interestCoverage,
  interestPerSecond,
  nplRateFor,
  NPL_BASE_RATE,
  NPL_MAX_RATE,
  HEALTHY_CREDIT_PER_CAPITA,
} from './city-calculator';
import { BUILDING_BY_ID } from './mock-city-data';
import type { BuildingNode } from './types';

/** Mot cong trinh o o (col,row), cap `level`. */
function node(defId: string, col: number, row: number, level = 1): BuildingNode {
  const def = BUILDING_BY_ID[defId];
  assert.ok(def, `thieu dinh nghia cong trinh ${defId}`);
  return {
    id: `${defId}_${col}_${row}`,
    defId,
    col,
    row,
    level,
    starRating: 1,
    lastCollectedAt: 0,
    modules: [],
  };
}

/** Mot pho co ca dan cu lan cua hang, du de sinh loi nhuan duong. */
function pho(): BuildingNode[] {
  return [
    node('nha-pho-binh-dan', 0, 0, 5),
    node('ky-tuc-xa-sinh-vien', 1, 0, 5),
    node('quan-ca-phe', 2, 0, 5),
    node('sieu-thi', 3, 0, 5),
  ];
}

describe('lai vay', () => {
  it('khong no thi khong co lai', () => {
    assert.equal(interestPerSecond(0), 0);
    assert.equal(interestPerSecond(-100), 0);
  });

  it('lai moi giay dung theo lai suat nam quy doi', () => {
    const duNo = 360_000;
    assert.equal(interestPerSecond(duNo), (duNo * LOAN_ANNUAL_RATE) / GAME_YEAR_SECONDS);
  });

  it('lai tang tuyen tinh theo du no', () => {
    assert.ok(Math.abs(interestPerSecond(2000) - 2 * interestPerSecond(1000)) < 1e-9);
  });
});

describe('han muc vay theo kha nang tra no', () => {
  it('khong co loi nhuan hoat dong thi khong duoc vay', () => {
    assert.equal(debtCeilingFor(0), 0);
    assert.equal(debtCeilingFor(-5), 0);
  });

  it('tran bang boi so EBIT mot nam game', () => {
    const ebit = 10;
    assert.equal(debtCeilingFor(ebit), ebit * GAME_YEAR_SECONDS * MAX_DEBT_TO_EBIT);
  });

  it('bien mong thi vay duoc it hon du doanh thu bang nhau', () => {
    // Cung mot EBIT thi tran bang nhau; EBIT thap hon thi tran thap hon.
    assert.ok(debtCeilingFor(5) < debtCeilingFor(10));
  });
});

describe('P&L co lai vay', () => {
  it('lai vay tru TRUOC thue, nen vay von lam giam thue phai nop', () => {
    const b = pho();
    const khongNo = flowFor(b, [], 10, 0, { debt: 0 });
    const coNo = flowFor(b, [], 10, 0, { debt: 500_000 });

    assert.ok(coNo.interestExpense > 0, 'co no thi phai co lai vay');
    assert.equal(khongNo.interestExpense, 0);

    // Loi nhuan truoc thue giam dung bang lai vay.
    assert.ok(
      Math.abs(coNo.pretaxIncome - (coNo.operatingIncome - coNo.interestExpense)) < 1e-9,
      'EBT phai bang EBIT tru lai vay',
    );
    // Thue tinh tren EBT chu khong phai EBIT.
    assert.ok(coNo.tax < khongNo.tax, 'vay von phai lam giam thue phai nop');
  });

  it('loi nhuan hoat dong KHONG doi khi vay - vay khong lam ban hang tot hon', () => {
    const b = pho();
    const khongNo = flowFor(b, [], 10, 0, { debt: 0 });
    const coNo = flowFor(b, [], 10, 0, { debt: 500_000 });
    assert.ok(Math.abs(coNo.operatingIncome - khongNo.operatingIncome) < 1e-9);
  });

  it('vay nhieu thi loi nhuan rong giam, co the am', () => {
    const b = pho();
    const nhe = flowFor(b, [], 10, 0, { debt: 10_000 });
    const nang = flowFor(b, [], 10, 0, { debt: 50_000_000_000 });
    assert.ok(nang.netIncome < nhe.netIncome);
    assert.ok(nang.netIncome < 0, 'vay qua suc thi phai lo');
  });

  it('thue khong am khi dang lo', () => {
    const b = pho();
    const nang = flowFor(b, [], 10, 0, { debt: 50_000_000 });
    assert.ok(nang.tax >= 0, 'dang lo thi khong nop thue, cung khong duoc hoan thue');
  });

  it('costPerSec gom ca lai vay', () => {
    const b = pho();
    const f = flowFor(b, [], 10, 0, { debt: 200_000 });
    assert.ok(
      Math.abs(f.costPerSec - (f.cogs + f.opex + f.interestExpense + f.tax)) < 1e-9,
      'tong chi phi phai gom lai vay',
    );
  });

  it('chuoi bao cao khop: gross - cogs - opex - lai - thue = rong', () => {
    const b = pho();
    const f = flowFor(b, [], 10, 0, { debt: 120_000 });
    const tinhTay = f.grossRevenue - f.cogs - f.opex - f.interestExpense - f.tax;
    assert.ok(Math.abs(f.netIncome - tinhTay) < 1e-9);
  });

  it('thue dung thue suat tren loi nhuan truoc thue duong', () => {
    const b = pho();
    const f = flowFor(b, [], 10, 0, { debt: 1_000 });
    assert.ok(Math.abs(f.tax - Math.max(0, f.pretaxIncome) * CORPORATE_TAX_RATE) < 1e-9);
  });
});

describe('he so bao phu lai vay', () => {
  it('khong no thi he so vo cuc', () => {
    assert.equal(interestCoverage(10, 0), Number.POSITIVE_INFINITY);
  });

  it('bang EBIT chia lai vay', () => {
    assert.equal(interestCoverage(10, 4), 2.5);
  });

  it('vay toi tran thi he so roi xuong gan nguong canh bao', () => {
    const b = pho();
    const f0 = flowFor(b, [], 10, 0, { debt: 0 });
    const tran = debtCeilingFor(f0.operatingIncome);
    const f = flowFor(b, [], 10, 0, { debt: tran });
    const heSo = interestCoverage(f.operatingIncome, f.interestExpense);

    // Vay het tran = MAX_DEBT_TO_EBIT nam EBIT, lai = EBIT * rate * boi so.
    const kyVong = 1 / (LOAN_ANNUAL_RATE * MAX_DEBT_TO_EBIT);
    assert.ok(Math.abs(heSo - kyVong) < 1e-6, `he so ${heSo} phai bang ${kyVong}`);
    assert.ok(heSo < 2, 'vay het tran thi phai o vung cang');
  });

  it('nguong canh bao nam duoi he so khi vay het tran', () => {
    // Thiet ke: vay het tran van chua duoi nguong canh bao, nhung sat.
    const khiVayHetTran = 1 / (LOAN_ANNUAL_RATE * MAX_DEBT_TO_EBIT);
    assert.ok(khiVayHetTran > COVERAGE_WARNING_AT, 'vay dung tran khong nen bi canh bao ngay');
    assert.ok(khiVayHetTran < COVERAGE_WARNING_AT * 1.5, 'nhung phai du sat de thay rui ro');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * NO XAU VI TRA SAU
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Pho co dan cu + BNPL o cap `lv`. */
function phoCoBnpl(lvBnpl: number, soNhaO: number): BuildingNode[] {
  const out: BuildingNode[] = [node('trung-tam-vi-tra-sau', 0, 1, lvBnpl)];
  for (let i = 0; i < soNhaO; i++) out.push(node('ky-tuc-xa-sinh-vien', i, 2, 5));
  out.push(node('quan-ca-phe', 5, 0, 5));
  return out;
}

describe('no xau Vi Tra Sau', () => {
  it('khong co BNPL thi khong co tin dung va khong co no xau', () => {
    const f = flowFor(pho(), [], 10, 0);
    assert.equal(f.bnplCredit, 0);
    assert.equal(f.badDebt, 0);
    assert.equal(f.nplRate, 0);
  });

  it('cap tin dung ma khong co dan thi ty le no xau kich tran', () => {
    assert.equal(nplRateFor(10, 0), NPL_MAX_RATE);
  });

  it('tin dung trong nguong lanh manh thi giu o ty le nen', () => {
    const danSo = 10_000;
    const credit = HEALTHY_CREDIT_PER_CAPITA * danSo;
    assert.equal(nplRateFor(credit, danSo), NPL_BASE_RATE);
    assert.equal(nplRateFor(credit / 2, danSo), NPL_BASE_RATE);
  });

  it('cap vuot kha nang tra thi ty le no xau tang', () => {
    const danSo = 1_000;
    const lanhManh = HEALTHY_CREDIT_PER_CAPITA * danSo;
    assert.ok(nplRateFor(lanhManh * 2, danSo) > NPL_BASE_RATE);
    assert.ok(nplRateFor(lanhManh * 4, danSo) > nplRateFor(lanhManh * 2, danSo));
  });

  it('ty le no xau khong vuot tran du cap bao nhieu', () => {
    assert.ok(nplRateFor(1e9, 10) <= NPL_MAX_RATE);
  });

  it('cung mot BNPL, them dan cu lam giam ty le no xau', () => {
    const itDan = flowFor(phoCoBnpl(20, 1), [], 10, 0);
    const nhieuDan = flowFor(phoCoBnpl(20, 8), [], 10, 0);

    assert.ok(itDan.bnplCredit > 0);
    assert.ok(
      Math.abs(nhieuDan.bnplCredit - itDan.bnplCredit) < 1e-9,
      'tin dung cap ra chi phu thuoc BNPL, khong phu thuoc dan so',
    );
    assert.ok(nhieuDan.nplRate < itDan.nplRate, 'nhieu dan hon thi rui ro thap hon');
    assert.ok(nhieuDan.badDebt < itDan.badDebt);
  });

  it('no xau tru o tang chi phi hoat dong, truoc lai vay va thue', () => {
    const b = phoCoBnpl(25, 1);
    const f = flowFor(b, [], 10, 0, { debt: 50_000 });
    const tinhTay = f.grossProfit - f.opex - f.badDebt;
    assert.ok(Math.abs(f.operatingIncome - tinhTay) < 1e-9);
  });

  it('chuoi bao cao van khop khi co ca no xau lan lai vay', () => {
    const f = flowFor(phoCoBnpl(25, 2), [], 10, 0, { debt: 80_000 });
    const tinhTay =
      f.grossRevenue - f.cogs - f.opex - f.badDebt - f.interestExpense - f.tax;
    assert.ok(Math.abs(f.netIncome - tinhTay) < 1e-9);
  });

  it('costPerSec gom ca no xau', () => {
    const f = flowFor(phoCoBnpl(20, 2), [], 10, 0, { debt: 10_000 });
    assert.ok(
      Math.abs(f.costPerSec - (f.cogs + f.opex + f.badDebt + f.interestExpense + f.tax)) < 1e-9,
    );
  });

  it('nang BNPL ma khong nang dan cu co the lam giam loi nhuan hoat dong', () => {
    const vua = flowFor(phoCoBnpl(1, 2), [], 10, 0);
    const quaTay = flowFor(phoCoBnpl(2, 2), [], 10, 0);
    assert.ok(quaTay.nplRate > vua.nplRate, 'cap qua tay thi rui ro phai tang');
    assert.ok(quaTay.badDebt > vua.badDebt);
  });
});
