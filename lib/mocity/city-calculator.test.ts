import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  digitalShare,
  flowFor,
  happinessFor,
  landCostCoins,
  nodeYieldBreakdown,
  populationFor,
  supplyPerSecond,
  takeRateFor,
  taxMultiplierFromHappiness,
  HAPPINESS_BOOST_CAP,
} from './city-calculator';
import { BUILDINGS, BUILDING_BY_ID, STARTER_INVENTORY, upgradeCostCoins, CITY_TIERS, MILESTONE_LEVELS, milestoneMultiplierFor, nextMilestoneLevel } from './mock-city-data';
import { CITY_EVENTS, REQUEST_SCRIPTS } from './dialogue-data';
import { SERVICE_TOOL } from './npc-data';
import type { BuildingNode, NpcState } from './types';

function node(
  defId: string,
  col: number,
  row: number,
  level = 1,
  starRating = 1,
  extra: Partial<BuildingNode> = {},
): BuildingNode {
  return {
    id: `${defId}_${col}_${row}`,
    defId,
    col,
    row,
    level,
    starRating,
    lastCollectedAt: 0,
    modules: [],
    ...extra,
  };
}

function merchant(id: string, buildingId: string, acceptsDigital: boolean, services: NpcState['services'] = []): NpcState {
  return {
    id,
    buildingId,
    name: `Cô ${id}`,
    archetype: 'MERCHANT_CASH',
    role: 'MERCHANT',
    trust: acceptsDigital ? 90 : 20,
    acceptsDigital,
    services,
  };
}

describe('happinessFor', () => {
  it('khong pin 100 chi voi vai cong trinh tier-1', () => {
    const buildings = [node('quan-ca-phe', 0, 0), node('sieu-thi', 1, 0), node('cong-vien', 0, 1)];
    const h = happinessFor(buildings);
    assert.ok(h < 100, `3 cong trinh la du de hien thi 100% hanh phuc (nhan ${h})`);
  });

  it('tang don dien khi nang cap', () => {
    const a = happinessFor([node('cong-vien', 0, 0, 1)]);
    const b = happinessFor([node('cong-vien', 0, 0, 10)]);
    assert.ok(b > a, 'nang cap phai tang hanh phuc');
  });
});

/* ── 4.2 Hanh phuc co downside ───────────────────────────────────── */

describe('happinessFor - suy giam theo thoi gian', () => {
  const H = 3_600_000;
  const city = [
    node('quan-ca-phe', 0, 0),
    node('sieu-thi', 1, 0),
    node('cong-vien', 0, 1),
  ];

  it('khong giam trong 2 gio dau', () => {
    assert.equal(happinessFor(city, 0), happinessFor(city, 2 * H));
  });

  it('giam sau khi bo mat pho qua 2 gio', () => {
    assert.ok(happinessFor(city, 12 * H) < happinessFor(city, 2 * H));
  });

  it('khong giam qua tran 25 diem', () => {
    const at48 = happinessFor(city, 48 * H);
    const at720 = happinessFor(city, 720 * H);
    assert.equal(at48, at720, 'suy giam phai co tran, khong the ve -inf');
    assert.ok(25 - 1 <= 77 - at48, `giao do suy giam vuot 25 diem`);
  });

  it('co that su giam - khong con la hang so 1.6x vinh vien', () => {
    const fresh = happinessFor(city, 0);
    const stale = happinessFor(city, 48 * H);
    assert.ok(
      taxMultiplierFromHappiness(stale) < taxMultiplierFromHappiness(fresh),
      'bo mat pho phai lam giam he so nhan thue',
    );
  });
});

describe('taxMultiplierFromHappiness', () => {
  it('100% -> 1.6x, 50% -> 1.0x, 0% -> 0.7x', () => {
    assert.ok(Math.abs(taxMultiplierFromHappiness(100) - 1.6) < 1e-9);
    assert.ok(Math.abs(taxMultiplierFromHappiness(50) - 1.0) < 1e-9);
    assert.ok(Math.abs(taxMultiplierFromHappiness(0) - 0.7) < 1e-9);
  });

  it('duoi 50% co that bi phat - khong con "khong te la an"', () => {
    assert.ok(taxMultiplierFromHappiness(20) < 1);
    assert.ok(taxMultiplierFromHappiness(0) < taxMultiplierFromHappiness(40));
  });

  it('khong vuot 1.6x o cao diem', () => {
    assert.ok(taxMultiplierFromHappiness(1000) <= 1.6 + 1e-9);
  });
});

describe('happinessBoost - bu lai suy giam bang cach xu lý chuyen pho', () => {
  it('duoc bu lai sau khi xu lý chuyen pho', () => {
    const city = [node('quan-ca-phe', 0, 0), node('sieu-thi', 1, 0)];
    const stale = happinessFor(city, 48 * 3_600_000, 0);
    const recovered = happinessFor(city, 48 * 3_600_000, HAPPINESS_BOOST_CAP);
    assert.ok(recovered > stale, 'xu lý chuyện phố phải bù lại được phần bị suy giảm');
  });

  it('khong vuot tran boost', () => {
    const city = [node('quan-ca-phe', 0, 0)];
    assert.ok(happinessFor(city, 0, 9_999) <= 100);
  });
});

describe('populationFor', () => {
  it('cong don gia tri population cua cong trinh dan cu', () => {
    assert.equal(populationFor([node('nha-pho-binh-dan', 0, 0)]), 90);
    assert.equal(populationFor([node('quan-ca-phe', 0, 0)]), 0);
  });

  it('bi cong thuong khi khong co gi', () => {
    assert.equal(populationFor([]), 0);
  });
});

describe('nodeYieldBreakdown', () => {
  it('khong cong don chinh no voi chinh no', () => {
    const only = node('quan-ca-phe', 0, 0);
    const y = nodeYieldBreakdown(only, [only]);
    assert.equal(y.synergyBonus, 0);
    assert.equal(y.synergyNeighbors.length, 0);
  });

  it('bat combo lien ke khi hai cong trinh dat canh nhau', () => {
    const a = node('quan-ca-phe', 0, 0);
    const b = node('rap-phim-momo', 1, 0);
    const y = nodeYieldBreakdown(a, [a, b]);
    assert.ok(y.synergyBonus > 0, 'ca phe + rap phim canh nhau phai duoc combo');
  });

  it('khong bat combo khi cach nhau 2 o', () => {
    const a = node('quan-ca-phe', 0, 0);
    const b = node('rap-phim-momo', 2, 0);
    const y = nodeYieldBreakdown(a, [a, b]);
    assert.equal(y.synergyBonus, 0);
  });

  it('cong don tang dan theo cap', () => {
    const a = node('quan-ca-phe', 0, 0, 1);
    const b = node('quan-ca-phe', 0, 0, 10);
    assert.ok(nodeYieldBreakdown(b, [b]).totalPerSec > nodeYieldBreakdown(a, [a]).totalPerSec);
  });

  it('khong tra ve NaN khi defId khong ton tai', () => {
    const bad = node('khong-ton-tai', 0, 0);
    const y = nodeYieldBreakdown(bad, [bad]);
    assert.equal(y.totalPerSec, 0);
    assert.ok(Number.isFinite(y.totalPerSec));
  });
});

describe('digitalShare', () => {
  it('tang khi chu tiem chap nhan thanh toan so', () => {
    const a = node('quan-ca-phe', 0, 0);
    const b = node('sieu-thi', 1, 0);
    const cash = [merchant('m1', a.id, false), merchant('m2', b.id, false)];
    const digital = [merchant('m1', a.id, true), merchant('m2', b.id, false)];

    assert.equal(digitalShare([a, b], cash), 0);
    const share = digitalShare([a, b], digital);
    assert.ok(share > 0 && share < 1, 'mot chu tiem chuyen so -> ty le nam trong (0,1)');
  });

  it('tra ve 0 khi khong co cong trinh thuong mai', () => {
    assert.equal(digitalShare([node('nha-pho-binh-dan', 0, 0)], []), 0);
  });
});

describe('takeRateFor', () => {
  it('khong vuot tran MAX', () => {
    const many = Array.from({ length: 40 }, (_, i) => node('thap-momo', i % 10, Math.floor(i / 10)));
    const rate = takeRateFor(many);
    assert.ok(rate <= 0.065 + 1e-9, `take rate vuot MAX: ${rate}`);
  });
});

describe('landCostCoins', () => {
  it('dat ton tai va tang theo dien tich da mo', () => {
    assert.ok(landCostCoins(4, 4) > 0);
    assert.ok(landCostCoins(10, 10) > landCostCoins(4, 4));
  });
});

describe('flowFor', () => {
  it('doanh thu luon la so huu duong', () => {
    const buildings = [node('quan-ca-phe', 0, 0, 5), node('rap-phim-momo', 1, 0, 3)];
    const npcs = [merchant('m1', buildings[0].id, true)];
    const f = flowFor(buildings, npcs, 5, 10_000);
    assert.ok(Number.isFinite(f.revenue));
    assert.ok(f.revenue > 0);
  });

  it('khong NaN khi thanh pho hoang trong', () => {
    const f = flowFor([], [], 1, 0);
    for (const [key, value] of Object.entries(f)) {
      assert.ok(Number.isFinite(value), `${key} khong phai so huu duong: ${value}`);
    }
  });

  it('so sanh duoc chay lai deterministically', () => {
    const buildings = [node('sieu-thi', 0, 0, 4), node('chung-cu-cao-cap', 1, 0, 2)];
    const npcs = [merchant('m1', buildings[0].id, true)];
    const a = flowFor(buildings, npcs, 6, 5_000).revenue;
    const b = flowFor(buildings, npcs, 6, 5_000).revenue;
    assert.equal(a, b);
  });
});

describe('supplyPerSecond', () => {
  it('chi cong cong trinh thuong mai', () => {
    assert.ok(supplyPerSecond([node('quan-ca-phe', 0, 0)]) > 0);
    assert.equal(supplyPerSecond([node('nha-pho-binh-dan', 0, 0)]), 0);
  });
});

/* ── 4.1 Thi truong that su chi phoi doanh thu ───────────────────── */

describe('supplyFactor - xay dan cu truoc, cua hang sau thi bi cat', () => {
  const housing = [
    node('chung-cu-cao-cap', 0, 0, 10),
    node('ky-tuc-xa-sinh-vien', 1, 0, 10),
    node('nha-pho-binh-dan', 2, 0, 10),
    node('hoc-vien-tai-chinh', 3, 0, 10),
  ];
  const shops = [
    node('quan-ca-phe', 4, 0, 10),
    node('sieu-thi', 5, 0, 10),
    node('pho-am-thuc', 6, 0, 10),
    node('rap-phim-momo', 7, 0, 10),
  ];

  it('cat doanh thu khi dan cu vuot xa nang luc phuc vu', () => {
    const starved = flowFor([...housing, shops[0]], [], 10, 0);
    assert.ok(starved.supplyFactor < 0.9, `1 tienm cho 4 khu dan cu phai bi cat (${starved.supplyFactor})`);
  });

  it('ven 1.0 khi can bang giua dan cu va cua hang', () => {
    const balanced = flowFor([...housing, ...shops], [], 10, 0);
    assert.ok(balanced.supplyFactor > 0.95, `can bang phai khong bi cat (${balanced.supplyFactor})`);
  });

  it('khong phat khi thua nang luc - thua thi cham, khong phai mat tien', () => {
    const oversupply = flowFor([...shops, node('nha-pho-binh-dan', 0, 9, 1)], [], 10, 0);
    assert.equal(oversupply.supplyFactor, 1);
  });

  it('khong bao gio xuong duoi san 0.6', () => {
    const nothing = flowFor(housing, [], 10, 0);
    assert.ok(nothing.supplyFactor >= 0.6, `san phuc vu khong duoc thap hon 0.6 (${nothing.supplyFactor})`);
  });

  it('doanh thu that su tang them khi bo sung nang luc phuc vu', () => {
    const before = flowFor([...housing, shops[0], shops[1]], [], 10, 0).revenue;
    const after = flowFor([...housing, shops[0], shops[1], shops[2], shops[3]], [], 10, 0).revenue;
    assert.ok(after > before, 'mo them cua hang phai tang doanh thu');
  });
});

/* ── 4.3 Duong cong chi phi nang cap ─────────────────────────────── */

describe('upgradeCostCoins - bang nhau giua moi cong trinh', () => {
  it('chi phi tang don dien theo cap', () => {
    for (const b of BUILDINGS) {
      assert.ok(
        upgradeCostCoins(b, 2) > upgradeCostCoins(b, 1),
        `${b.id} chi phi cap phai tang`,
      );
    }
  });

  it('khong cong don chet - cap 50 van afford duoc', () => {
    for (const b of BUILDINGS) {
      assert.ok(upgradeCostCoins(b, b.maxLevel) < Number.MAX_SAFE_INTEGER / 1e6, `${b.id} tran so`);
    }
  });

  /**
   * Ban <= 3 dung `costCoins * 1.42^n`, cong ty chi phai 140x gia xay dung
   * nhung doanh thu gap 68.000x, nen cap 10 hoa von 1 phut con cap 40 ton
   * 6,7 ngay. Neu chi phi gan vao san luong thi moi cong trinh phai cung nhip.
   */
  it('quy hoa 1 don tang cap duong nhat giua cap re va cap dat', () => {
    for (const b of BUILDINGS) {
      const early = upgradeCostCoins(b, 2) / upgradeCostCoins(b, 1);
      const late = upgradeCostCoins(b, 40) / upgradeCostCoins(b, 39);
      assert.ok(late / early < 3, `${b.id} nhip cap 40 lech cap 1 qua xa (${(late / early).toFixed(1)}x)`);
    }
  });

  it('chi phi phai ty le voi san luong, khong phai gia xay dung', () => {
    const cheap = BUILDING_BY_ID['quan-ca-phe'];
    const rich = BUILDING_BY_ID['thap-momo'];
    // gia xay dung gap 140x, san luong chi gap 35x
    assert.ok(rich.costCoins / cheap.costCoins > 100);
    assert.ok(
      upgradeCostCoins(rich, 10) / upgradeCostCoins(cheap, 10) < 100,
      'neu chi phi gan vao costCoins thi thap MoMo se dat gap 100x lan',
    );
  });
});

/* ── Bat bien chong arbitrage: BAT BUOC cho phep nap lai vao code ── */

describe('CITY_EVENTS khong duoc la may in tien', () => {
  for (const ev of CITY_EVENTS) {
    it(`"${ev.id}" moi phuong an deu khong sinh loi nhuan`, () => {
      for (const choice of ev.choices) {
        const spent = (choice.costCoins ?? 0) - (choice.effects.coins ?? 0);
        assert.ok(
          spent >= 0,
          `phuong an "${choice.id}" sinh ${spent} Xu - se bien thanh farm loop`,
        );
      }
    });

    it(`"${ev.id}" khong trao vat pham khi chon`, () => {
      for (const choice of ev.choices) {
        assert.equal(
          choice.effects.rewardItemId,
          undefined,
          `phuong an "${choice.id}" trao ${choice.effects.rewardItemId} - gia tri vat pham vuot chi phi`,
        );
      }
    });
  }

  it('khong con choice nao cho XU ma khong ton y', () => {
    const freebies = CITY_EVENTS.flatMap((ev) =>
      ev.choices
        .filter((c) => (c.effects.coins ?? 0) > 0)
        .map((c) => `${ev.id}/${c.id}`),
    );
    assert.deepEqual(freebies, []);
  });
});

/* ── 4.2b Hanh phuc cong theo sac thai phuong an ─────────────────── */

describe('moi phuong an deu cong diem hanh phuc', () => {
  const scripts = [...CITY_EVENTS, ...REQUEST_SCRIPTS];

  for (const s of scripts) {
    const id = 'id' in s ? s.id : 'request';
    it(`"${id}" khong phuong an nao thieu hanh phuc`, () => {
      for (const c of s.choices) {
        assert.equal(typeof c.effects.happiness, 'number', `phuong an "${c.id}" thieu effects.happiness`);
      }
    });
  }

  it('phuong an hien viet bu hanh phuc nhieu hon phuong an danh tiet', () => {
    for (const ev of CITY_EVENTS) {
      const [best, mid, worst] = ev.choices;
      if (!best?.effects.happiness || !mid?.effects.happiness || !worst?.effects.happiness) continue;
      assert.ok(
        best.effects.happiness > mid.effects.happiness,
        `${ev.id}: phuong an tot nhat phai bu hanh phuc nhieu hon phuong an dung o giua`,
      );
      assert.ok(
        mid.effects.happiness > worst.effects.happiness,
        `${ev.id}: phuong an o giua phai tot hon phuong an gay hai`,
      );
    }
  });
});

describe('REQUEST_SCRIPTS van giu duoc moc CTA', () => {  it('it nhat mot phuong an cap nhat dich vu (sinh deep-link)', () => {
    const withService = REQUEST_SCRIPTS.filter((s) =>
      s.choices.some((c) => c.effects.grantService),
    );
    assert.ok(withService.length >= 5, 'can it nhat 5 request co CTA sang momo.vn');
  });

  it('moi dich vu duoc cap deu co cong cu that tren momo.vn', () => {
    for (const script of REQUEST_SCRIPTS) {
      for (const choice of script.choices) {
        const svc = choice.effects.grantService;
        if (!svc) continue;
        assert.ok(SERVICE_TOOL[svc], `dich vu ${svc} chua duoc gan URL cong cu`);
      }
    }
  });
});

/* ── Bat vien du lieu ── */

describe('du lieu game', () => {
  it('moi cong trinh trong BUILDINGS deu hop le', () => {
    for (const b of BUILDINGS) {
      assert.ok(b.id.length > 0, 'thieu id');
      assert.ok(b.baseYieldPerSec > 0, `${b.id} yield phai > 0`);
      assert.ok(b.maxLevel > 0, `${b.id} thieu maxLevel`);
      for (const s of b.synergyWith ?? []) {
        assert.ok(BUILDING_BY_ID[s], `${b.id} tro toi khong ton tai: ${s}`);
      }
    }
  });

  it('chi phi nang cap khong vuot trai', () => {
    for (const b of BUILDINGS) {
      const atMax = upgradeCostCoins(b, b.maxLevel);
      assert.ok(
        Number.isFinite(atMax) && atMax > 0,
        `chi phi cap ${b.maxLevel} cua ${b.id} khong hop le: ${atMax}`,
      );
    }
  });

  it('kho do khoi tao chi chua id co that', () => {
    for (const id of Object.keys(STARTER_INVENTORY)) {
      assert.ok(BUILDING_BY_ID[id] || id.startsWith('item-') || id.startsWith('relic-') || id.startsWith('gift-'),
        `vat pham khoi tao khong hop le: ${id}`);
    }
  });
});

/* ── Bat bien chong may in tien qua vat pham ─────────────────────── */

describe('vat pham khong duoc tro thanh may in tien', () => {
  /**
   * Ban <= 3 moi vat pham deu loi ron: Loa Phuong gia 18.000 tra 35.000 Xu,
   * Tra Sua 12.000 tra 22.000 Xu, Ban Ve 80.000 "quy doi" 85.000 Xu.
   * `buyInventoryItem` khong chan so luong mua nen chi can vong lap mua-ban
   * la pha het do kinh te - dung thu may in tien da gap o `hydrateCity`.
   */
  it('applyInventoryItem khong con goi withCoins (tra Xu tho)', () => {
    const src = readFileSync(new URL('./store.ts', import.meta.url), 'utf8');
    const start = src.indexOf('export function applyInventoryItem');
    const end = src.indexOf('export function buyInventoryItem');
    assert.ok(start > 0 && end > start, 'khong tim thay khoi xu ly vat pham trong store.ts');
    const body = src.slice(start, end);
    assert.equal(
      (body.match(/withCoins\(/g) ?? []).length,
      0,
      'applyInventoryItem van con goi withCoins - van bang lo trao Xu tho',
    );
  });

  it('khong con phuong an trao Xu ma khong ton y', () => {
    const allChoices = [...CITY_EVENTS, ...REQUEST_SCRIPTS].flatMap((s) => s.choices);
    const paying = allChoices.filter((c) => (c.effects.coins ?? 0) > 0);
    assert.deepEqual(paying, []);
  });
});


describe('tien trinh theo bac - tier la truc mo khoa', () => {
  it('moi cong trinh co unlockAtTier hop le (1..8)', () => {
    for (const b of BUILDINGS) {
      assert.ok(
        Number.isInteger(b.unlockAtTier) && b.unlockAtTier >= 1 && b.unlockAtTier <= CITY_TIERS.length,
        `${b.id} unlockAtTier=${b.unlockAtTier} ngoai [1..${CITY_TIERS.length}]`,
      );
    }
  });

  it('bac 1 phai mo duoc it nhat mot cong trinh (khong bi chan cung luc moi vao)', () => {
    const atTier1 = BUILDINGS.filter((b) => b.unlockAtTier === 1);
    assert.ok(atTier1.length >= 1, 'khong co cong trinh nao mo o bac 1');
  });

  it('CityTierDef.unlocks.buildingIds khop dung voi unlockAtTier cua cong trinh', () => {
    for (const t of CITY_TIERS) {
      const listed = new Set(t.unlocks?.buildingIds ?? []);
      // moi id liet ke phai ton tai va dung bac
      for (const id of listed) {
        const def = BUILDING_BY_ID[id];
        assert.ok(def, `bac ${t.rank} liet ke id khong ton tai: ${id}`);
        assert.equal(def.unlockAtTier, t.rank, `${id} unlockAtTier=${def.unlockAtTier} nhung duoc liet ke o bac ${t.rank}`);
      }
      // moi cong trinh mo o bac nay phai nam trong danh sach cua bac do
      for (const b of BUILDINGS.filter((x) => x.unlockAtTier === t.rank)) {
        assert.ok(listed.has(b.id), `${b.id} mo o bac ${t.rank} nhung khong duoc liet ke trong unlocks`);
      }
    }
  });

  it('khong co bac nao bi bo trong hoan toan tu 1 toi bac cao nhat', () => {
    for (let rank = 1; rank <= CITY_TIERS.length; rank++) {
      const any = BUILDINGS.some((b) => b.unlockAtTier === rank);
      assert.ok(any, `bac ${rank} khong mo khoa cong trinh nao - trong rong`);
    }
  });
});


describe('moc dot pha - luon co dich gan de chong nham chan', () => {
  it('moi 5 cap trong [1..50] deu co mot moc ke tiep trong tam <= 5 cap', () => {
    for (let lv = 1; lv <= 50; lv++) {
      const next = nextMilestoneLevel(lv);
      assert.ok(next - lv <= 5, `cap ${lv}: moc ke tiep ${next} cach qua xa (${next - lv} cap)`);
    }
  });

  it('he so dot pha khong giam khi len cap (monotonic)', () => {
    let prev = 0;
    for (let lv = 1; lv <= 50; lv++) {
      const m = milestoneMultiplierFor(lv);
      assert.ok(m >= prev, `cap ${lv} he so ${m} nho hon cap truoc ${prev}`);
      prev = m;
    }
  });

  it('tong he so dot pha tai cap 50 bi chan (khong lam no kinh te)', () => {
    const top = milestoneMultiplierFor(50);
    assert.ok(top > 8 && top < 25, `he so dot pha cap 50 = ${top.toFixed(1)}, phai o giua 8 va 25`);
  });

  it('moi moc lam doanh thu nhay len that su', () => {
    for (const m of MILESTONE_LEVELS) {
      assert.ok(
        milestoneMultiplierFor(m) > milestoneMultiplierFor(m - 1),
        `vuot moc ${m} phai tang he so dot pha`,
      );
    }
  });
});
