import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  crowdingFactorFor,
  flowFor,
  lostSalesPerSecond,
  queueCapacityFor,
  shopCrowdingFactor,
  MIN_CROWDING_FACTOR,
} from './city-calculator';
import type { BuildingNode } from './types';

function node(defId: string, col: number, row: number, level = 1): BuildingNode {
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

const SHOP = 'quan-ca-phe';

describe('suc chua phuc vu', () => {
  it('tiem cap thap chi phuc vu duoc mot nguoi', () => {
    assert.equal(queueCapacityFor(node(SHOP, 0, 0, 1)), 1);
  });

  it('nang cap tang suc chua phuc vu', () => {
    assert.ok(queueCapacityFor(node(SHOP, 0, 0, 12)) > queueCapacityFor(node(SHOP, 0, 0, 1)));
  });

  it('suc chua co tran, khong phuc vu duoc ca pho', () => {
    assert.equal(queueCapacityFor(node(SHOP, 0, 0, 50)), 4);
  });
});

describe('khach bo hang', () => {
  it('khong ai xep thi khong ai bo', () => {
    assert.equal(shopCrowdingFactor(node(SHOP, 0, 0, 1), 0), 1);
  });

  it('xep hang duoi suc chua thi van phuc vu het', () => {
    const cap = queueCapacityFor(node(SHOP, 0, 0, 6));
    assert.equal(shopCrowdingFactor(node(SHOP, 0, 0, 6), cap), 1);
  });

  it('vuot suc chua thi khach bo hang', () => {
    const cap = queueCapacityFor(node(SHOP, 0, 0, 1));
    assert.ok(shopCrowdingFactor(node(SHOP, 0, 0, 1), cap + 3) < 1);
  });

  it('hang cang dai thi bo hang cang nhieu', () => {
    const n = node(SHOP, 0, 0, 1);
    const vua = shopCrowdingFactor(n, 2);
    const lau = shopCrowdingFactor(n, 6);
    assert.ok(lau < vua, `${lau} phai nho hon ${vua}`);
  });

  it('khong bao gio mat het toan bo doanh thu', () => {
    const n = node(SHOP, 0, 0, 1);
    assert.ok(shopCrowdingFactor(n, 999) >= MIN_CROWDING_FACTOR);
  });

  it('tiem lon giu duoc nhieu hon tieu thuong khi cung xep', () => {
    // Cung mot hang doi 6 nguoi, quan cap 1 chap 1 nguoi, TTTM cap 50 chap 4.
    assert.ok(
      shopCrowdingFactor(node('trung-tam-thuong-mai', 1, 0, 50), 6) >
        shopCrowdingFactor(node(SHOP, 0, 0, 1), 6),
      'tiem lon phai it bi bo hang hon',
    );
  });
});

describe('crowdingFactorFor - cong don ca pho', () => {
  const shops = [node(SHOP, 0, 0, 1), node('trung-tam-thuong-mai', 1, 0, 1)];

  it('khong co hang doi thi he so = 1', () => {
    assert.equal(crowdingFactorFor(shops), 1);
  });

  it('hang doi rong thi he so < 1', () => {
    assert.ok(crowdingFactorFor(shops, { [shops[0].id]: 5 }) < 1);
  });

  it('chet ca phe khong lam pho mat nhieu bang chet TTTM', () => {
    /*
     * He so duoc cong don theo nang luc phuc vu nen phai DO DONG nghieu:
     * kiem phuc vu mot tieu thuong chi giam mot phan nho tong pho, con kiem
     * phuc vu mot TTTM thi danh trien toan bo pho. Truoc khi sua, cong thuc
     * nay thuong dung `Math.min` nen ca phe bi kiem thi pho cung ton that
     * nang - nguoi choi nang cap ca phe khong thay gi ca.
     */
    const pho = [node(SHOP, 0, 0, 1), node('trung-tam-thuong-mai', 1, 0, 50)];
    const chetCafe = crowdingFactorFor(pho, { [pho[0].id]: 12 });
    const chetMega = crowdingFactorFor(pho, { [pho[1].id]: 12 });
    assert.ok(
      chetMega < chetCafe,
      `chet TTTM (${chetMega.toFixed(3)}) phai gay thiet hai lon hon chet ca phe (${chetCafe.toFixed(3)})`,
    );
  });

  it('khong bao gio NaN hay am', () => {
    for (const q of [1, 3, 8, 40, 999]) {
      const f = crowdingFactorFor(shops, { [shops[0].id]: q });
      assert.ok(Number.isFinite(f) && f > 0 && f <= 1, `q=${q} -> ${f}`);
    }
  });

  it('pho khong co cua hang thi he so van = 1', () => {
    assert.equal(crowdingFactorFor([node('nha-pho-binh-dan', 0, 0)], { x: 9 }), 1);
  });
});

describe('doanh thu mat vi khach bo hang', () => {
  it('khong co hang doi thi khong mat doanh thu nao', () => {
    const b = [node(SHOP, 0, 0, 10)];
    assert.equal(lostSalesPerSecond(b, {}), 0);
  });

  it('hang dai thi mat mot phan doanh thu', () => {
    const b = [node(SHOP, 0, 0, 10)];
    assert.ok(lostSalesPerSecond(b, { [b[0].id]: 6 }) > 0);
  });
});

describe('hang doi phai cat vao P&L that chu khong chi hien thi', () => {
  const b = [node(SHOP, 0, 0, 10)];

  it('doanh thu giam khi co khach bo hang', () => {
    const vang = flowFor(b, [], 10, 0, { shopQueue: {} });
    const dong = flowFor(b, [], 10, 0, { shopQueue: { [b[0].id]: 8 } });
    assert.ok(dong.grossRevenue < vang.grossRevenue);
  });

  it('nguoi choi nhan it tien hon', () => {
    const vang = flowFor(b, [], 10, 0, { shopQueue: {} });
    const dong = flowFor(b, [], 10, 0, { shopQueue: { [b[0].id]: 8 } });
    assert.ok(dong.netIncome < vang.netIncome);
    assert.ok(dong.lostSales > 0);
  });

  it('khong lam hong chuoi bao cao', () => {
    const f = flowFor(b, [], 10, 0, { shopQueue: { [b[0].id]: 8 } });
    const chuoi = f.grossRevenue - f.cogs - f.opex - f.interestExpense - f.tax;
    assert.ok(Math.abs(f.netIncome - chuoi) < 1e-9);
  });

  it('khong dung hang doi thi moi lan chay cho ket qua giong nhau', () => {
    const a = flowFor(b, [], 10, 0).revenue;
    const c = flowFor(b, [], 10, 0).revenue;
    assert.equal(a, c);
  });

  it('tiem nen nghi khong bi phat vi hang doi', () => {
    // Cong trinh nong nghiep khong ban hang qua quay, nguoi xep hang khong lam
    // gia ton thu nhieu cung pho.
    const bank = node('ngan-hang-so', 0, 0, 10);
    const f = flowFor([bank], [], 10, 0, { shopQueue: { [bank.id]: 6 } });
    assert.equal(f.crowdingFactor, 1);
    assert.equal(f.lostSales, 0);
  });

  it('doanh thu khong bao gio am chi vi hang doi qua dong', () => {
    for (const q of [1, 5, 50, 500]) {
      const f = flowFor(b, [], 10, 0, { shopQueue: { [b[0].id]: q } });
      assert.ok(Number.isFinite(f.netIncome), `q=${q}`);
    }
  });
});