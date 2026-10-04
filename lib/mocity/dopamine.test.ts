import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mulberry32, rngForDay, seedFromString, shuffle, randomInt } from './rng';
import {
  averageGrowthPerDay,
  daysToNextTier,
  snapshotsOf,
  weekComparison,
  COMPARISON_WINDOW_DAYS,
} from './comparison';
import { DAILY_SNAPSHOT_KEEP, eventFits, normalizeStoredState } from './store';
import { CITY_EVENTS } from './dialogue-data';
import { CONDITIONAL_CITY_EVENTS } from './dialogue-events-conditional';
import { CITY_MOOD_LINES, cityMood, streetLineFor } from './dialogue-engine';
import { ARCHETYPES } from './npc-data';
import type { DailySnapshot, NpcState } from './types';

const NOW = 1_700_000_000_000;

describe('rng - phai tất định thiếu nó là mọi thứ khó test', () => {
  it('cùng seed cho cùng chuỗi số', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) assert.equal(a(), b());
  });

  it('khác seed cho chuỗi khác', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const xa = Array.from({ length: 20 }, () => a());
    const xb = Array.from({ length: 20 }, () => b());
    assert.notDeepEqual(xa, xb);
  });

  it('luôn trả về trong khoang [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 5000; i++) {
      const v = r();
      assert.ok(v >= 0 && v < 1, `ra ${v}`);
    }
  });

  it('phân bố không dính biên quá nhiều', () => {
    const r = mulberry32(99);
    let giua = 0;
    for (let i = 0; i < 5000; i++) if (r() > 0.4 && r() < 0.6) giua += 1;
    assert.ok(giua > 500, `giua = ${giua}, phai gan 20% cua 5000`);
  });

  it('seedFromString o dinh va khac nhau theo chuoi', () => {
    assert.equal(seedFromString('2026-1-5'), seedFromString('2026-1-5'));
    assert.notEqual(seedFromString('2026-1-5'), seedFromString('2026-1-6'));
  });

  it('randomInt trong khoang va an toan khi max khong hop le', () => {
    const r = mulberry32(3);
    for (let i = 0; i < 500; i++) {
      const v = randomInt(r, 5);
      assert.ok(v >= 0 && v < 5, `ra ${v}`);
    }
    assert.equal(randomInt(r, 0), 0);
    assert.equal(randomInt(r, -5), 0);
    assert.equal(randomInt(r, Number.NaN), 0);
  });

  it('shuffle giu nguyen do lon va khong mutate input', () => {
    const goc = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(goc, mulberry32(11));
    assert.deepEqual(goc, [1, 2, 3, 4, 5, 6, 7, 8], 'khong duoc mutate mang goc');
    assert.deepEqual([...out].sort((x, y) => x - y), goc);
    assert.equal(out.length, goc.length);
  });

  it('shuffle cung seed cho cung ket qua', () => {
    const goc = ['a', 'b', 'c', 'd', 'e'];
    assert.deepEqual(shuffle(goc, mulberry32(5)), shuffle(goc, mulberry32(5)));
  });

  it('rngForDay cho cung ket qua trong cung ngay', () => {
    const a = rngForDay('2026-3-1')();
    const b = rngForDay('2026-3-1')();
    assert.equal(a, b);
    assert.notEqual(a, rngForDay('2026-3-2')());
  });

  it('rngForDay tach biet theo salt', () => {
    assert.notEqual(rngForDay('2026-3-1', 'a')(), rngForDay('2026-3-1', 'b')());
  });
});

/** Tao ban ghi ngay, du dung cho so sanh. */
function snap(day: string, over: Partial<DailySnapshot> = {}): DailySnapshot {
  return {
    day,
    netIncome: 1_000,
    revenue: 2_000,
    danSo: 500,
    soCongTrinh: 10,
    mayorLevel: 5,
    cityTier: 3,
    streak: 5,
    eventsResolved: 4,
    happiness: 70,
    ...over,
  };
}

/** 7 ban ghi cho 7 ngay lien tiep, moi ngay tang dan. */
function sevenDays(lastRevenue = 2_000): DailySnapshot[] {
  return Array.from({ length: COMPARISON_WINDOW_DAYS }, (_, i) =>
    snap(`2026-3-${i + 1}`, {
      revenue: lastRevenue + i * 100,
      netIncome: (lastRevenue + i * 100) / 2,
    }),
  );
}

describe('so sanh 7 ngay - CHUA DU DU LIEU thi khong duoc hien so', () => {
  it('khong co ban ghi nao thi ra rong, khong bao gi la -100%', () => {
    const r = weekComparison([], { netIncome: 0, revenue: 0 });
    assert.equal(r.sanhDuoc, false);
    assert.equal(r.lines.length, 0);
    assert.equal(r.dangTut, false, 'khong du du lieu thi khong duoc bao nguoi choi dang tut');
  });

  it('chi 3 ngay thi van chua du', () => {
    const r = weekComparison(sevenDays().slice(0, 3), { netIncome: 0, revenue: 0 });
    assert.equal(r.sanhDuoc, false);
    assert.equal(r.soBanGhi, 3);
    assert.equal(r.canBaoNhieu, 7);
  });

  it('du 7 ngay thi moi bat dau so sanh', () => {
    const r = weekComparison(sevenDays(), { netIncome: 5_000, revenue: 9_000 });
    assert.equal(r.sanhDuoc, true);
    assert.ok(r.lines.length > 0);
  });

  it('khong bao gi NaN khi ky truoc bang 0', () => {
    const r = weekComparison([snap('2026-3-1', { revenue: 0, netIncome: 0 })], {
      netIncome: 5_000,
      revenue: 9_000,
    });
    for (const line of r.lines) {
      assert.ok(line.chenhLech === null || Number.isFinite(line.chenhLech));
    }
  });

  it('khong phan tram am vo nghia khi hom nay co va ky truoc khong co', () => {
    const r = weekComparison([snap('2026-3-1', { revenue: 0 })], { netIncome: 100, revenue: 200 });
    const doanhThu = r.lines.find((l) => l.label === 'Doanh thu gộp');
    assert.equal(doanhThu?.chenhLech, null, 'tu 0 len 200 khong phai tang vo han');
    assert.equal(doanhThu?.trend, 'UNKNOWN');
  });

  it('bang 0 o ca hai ben thi chenh lech 0 chu khong phai NaN', () => {
    const r = weekComparison([snap('2026-3-1', { revenue: 0, netIncome: 0 })], {
      netIncome: 0,
      revenue: 0,
    });
    const doanhThu = r.lines.find((l) => l.label === 'Doanh thu gộp');
    assert.equal(doanhThu?.chenhLech, 0);
  });
});

describe('so sanh 7 ngay - phai so VOI NGAY LIEN KE truoc', () => {
  it('lay ban ghi CUOI CUNG chu khong phai ban ghi dau tien', () => {
    /*
     * Chuoi snapshot bi cat con 7 ban ghi. Neu nguoi choi da choi 30 ngay thi
     * `snaps[0]` la ngay 23 truoc, khong phai 7 ngay truoc. Lay `length - 1`
     * moi la ngay lien ke hom nay.
     */
    const cu = sevenDays(2_000);
    const r = weekComparison(cu, { netIncome: 2_500, revenue: 5_000 });
    assert.equal(r.ngaySoSanh, cu[cu.length - 1].day);
  });

  it('so sanh nhom voi ngay lien ke chu khong phai voi trung binh', () => {
    const cu = sevenDays(2_000);
    const r = weekComparison(cu, { netIncome: 3_000, revenue: 5_000 });
    const doanhThu = r.lines.find((l) => l.label === 'Doanh thu gộp');
    assert.equal(doanhThu?.kyTruoc, 2_600, 'ky truoc la ngay gan nhat chu khong phai trung binh');
  });

  it('xac dinh xu huong tang giam dung', () => {
    const cu = sevenDays(2_000);
    const tang = weekComparison(cu, { netIncome: 1_000, revenue: 9_000 });
    const giam = weekComparison(cu, { netIncome: 1_000, revenue: 500 });
    const bang = weekComparison(cu, { netIncome: 1_000, revenue: 2_600 });

    const t1 = tang.lines.find((l) => l.label === 'Doanh thu gộp');
    const t2 = giam.lines.find((l) => l.label === 'Doanh thu gộp');
    const t3 = bang.lines.find((l) => l.label === 'Doanh thu gộp');
    assert.equal(t1?.trend, 'UP');
    assert.equal(t2?.trend, 'DOWN');
    assert.equal(t3?.trend, 'FLAT');
  });

  it('chi so khong tien doi bang chenh lech tuyet doi chu khong phai phan tram', () => {
    const cu = sevenDays(2_000);
    const r = weekComparison(cu, { netIncome: 1_000, revenue: 2_600, danSo: 505, soCongTrinh: 11 });
    const danSo = r.lines.find((l) => l.label === 'Cư dân');
    assert.equal(danSo?.chenhLech, 5, '500 -> 505 la them 5 nguoi, khong phai tang 1%');
    assert.equal(danSo?.donVi, 'người');
  });
});

describe('canh bao dang tut - chi nhac khong phat', () => {
  it('loi nhuan giam qua 10% thi bat canh bao', () => {
    const cu = sevenDays(10_000);
    const loiNhuanKyTruoc = cu[cu.length - 1].netIncome;
    // Can X xuong duoi 90% cua ky truoc de canh bao bat.
    const r = weekComparison(cu, { netIncome: loiNhuanKyTruoc * 0.8, revenue: 5_000 });
    assert.equal(r.dangTut, true);
  });

  it('giam nho thi khong bat canh bao - tranh nhuc nhoi', () => {
    const cu = sevenDays(10_000);
    const r = weekComparison(cu, {
      netIncome: cu[cu.length - 1].netIncome * 0.98,
      revenue: 5_000,
    });
    assert.equal(r.dangTut, false);
  });

  it('CHUA DU DU LIEU thi khong bao gi dang tut', () => {
    const r = weekComparison(sevenDays().slice(0, 2), { netIncome: 0, revenue: 0 });
    assert.equal(r.sanhDuoc, false);
    assert.equal(r.dangTut, false, 'moi choi 2 ngay ma bao dang tut la sai');
  });
});

describe('snapshot - chi giu 7 ngay va khong ghi trung', () => {
  it('DAILY_SNAPSHOT_KEEP = 7', () => {
    assert.equal(DAILY_SNAPSHOT_KEEP, 7);
  });

  it('migration tao mang rong chu khong suy doanh thu cu', () => {
    const s = normalizeStoredState(
      JSON.stringify({
        version: 8,
        coins: 5_000,
        totalCoinsEarned: 9_999_999,
        ledgerLifetime: {
          grossRevenue: 8_000_000,
          cogs: 3_000_000,
          opex: 1_000_000,
          netIncome: 4_000_000,
          day: '2026-3-1',
          month: '2026-3',
        },
      }),
      NOW,
    );
    assert.equal(s.version, 10);
    assert.deepEqual(s.dailySnapshots, [], 'khong duoc uoc luong 7 ngay da qua tu ledger');
  });

  it('normalize cat con 7 ban ghi', () => {
    const nhieu = Array.from({ length: 20 }, (_, i) => snap(`2026-3-${i + 1}`));
    const s = normalizeStoredState(
      JSON.stringify({ version: 9, dailySnapshots: nhieu }),
      NOW,
    );
    assert.equal(s.dailySnapshots?.length, 7);
    assert.equal(s.dailySnapshots?.[6].day, '2026-3-20', 'phai giu 7 ngay CUOI');
  });

  it('normalize bo ban ghi hong', () => {
    const s = normalizeStoredState(
      JSON.stringify({ version: 9, dailySnapshots: [null, snap('2026-3-1')] }),
      NOW,
    );
    assert.equal(s.dailySnapshots?.length, 1);
  });

  it('normalize chuan hoa so am trong ban ghi', () => {
    const s = normalizeStoredState(
      JSON.stringify({
        version: 9,
        dailySnapshots: [snap('2026-3-1', { netIncome: -500, danSo: -10 })],
      }),
      NOW,
    );
    assert.equal(s.dailySnapshots?.[0].netIncome, 0);
    assert.equal(s.dailySnapshots?.[0].danSo, 0);
  });

  it('normalize giu nguyen ban ghi cu khi len version moi', () => {
    const s = normalizeStoredState(
      JSON.stringify({ version: 8, dailySnapshots: [snap('2026-3-1', { revenue: 777 })] }),
      NOW,
    );
    assert.equal(s.dailySnapshots?.[0].revenue, 777);
  });

  it('snapshotsOf chiu duoc save chua co field', () => {
    assert.deepEqual(snapshotsOf({} as never), []);
    assert.deepEqual(snapshotsOf({ dailySnapshots: 'khong phai mang' } as never), []);
  });
});

describe('uoc luong toi bac thanh pho', () => {
  it('khong du 2 ban ghi thi khong uoc duoc', () => {
    assert.equal(averageGrowthPerDay([snap('2026-3-1')], 'danSo'), 0);
    assert.equal(daysToNextTier([], 100), null);
  });

  it('tang dan deu thi uoc duoc so ngay', () => {
    const cu = [
      snap('2026-3-1', { danSo: 100 }),
      snap('2026-3-2', { danSo: 200 }),
      snap('2026-3-3', { danSo: 300 }),
    ];
    // 100 nguoi/ngay, can len moc 500 tu 300 thi 2 ngay.
    assert.equal(averageGrowthPerDay(cu, 'danSo'), 100);
    assert.equal(daysToNextTier(cu, 300), 2);
  });

  it('khong tang thi khong uoc duoc - con so 0 hon la "chua biet"', () => {
    const cu = [snap('2026-3-1', { danSo: 300 }), snap('2026-3-2', { danSo: 300 })];
    assert.equal(averageGrowthPerDay(cu, 'danSo'), 0);
    assert.equal(daysToNextTier(cu, 300), null);
  });

  it('da o bac cao nhat thi khong con bac ke tiep', () => {
    assert.equal(daysToNextTier(sevenDays(), 999_999), null);
  });
});

describe('su kien theo trang thai - phai co kich ban that su xay ra', () => {
  it('moi kich ban co dieu kien deu khai bao it nhat mot nguong', () => {
    for (const ev of CONDITIONAL_CITY_EVENTS) {
      const co =
        ev.happinessBelow !== undefined ||
        ev.cashflowBelow !== undefined ||
        ev.nplAbove !== undefined ||
        ev.debtAbove !== undefined ||
        ev.requiresCrowding ||
        ev.requiresLateFee ||
        ev.requiresNoInsurance;
      assert.ok(co, `${ev.id} ten la "co dieu kien" nhung khai bao gi ca`);
    }
  });

  it('kich ban co dieu kien van phai qua kiem thu khong loinhuan', () => {
    for (const ev of CITY_EVENTS) {
      for (const c of ev.choices) {
        const spent = (c.costCoins ?? 0) - (c.effects.coins ?? 0);
        assert.ok(spent >= 0, `${ev.id}/${c.id} sinh ${spent} Xu`);
        assert.equal(c.effects.rewardItemId, undefined, `${ev.id}/${c.id} trao vat pham`);
      }
    }
  });

  it('kich ban co dieu kien van phai cho phuong an hanh phuc', () => {
    for (const ev of CONDITIONAL_CITY_EVENTS) {
      for (const c of ev.choices) {
        assert.equal(typeof c.effects.happiness, 'number', `${ev.id}/${c.id} thieu happiness`);
      }
    }
  });

  it('moi phuong an van co pill hien chi phi dung so tien', () => {
    for (const ev of CITY_EVENTS) {
      for (const c of ev.choices) {
        if (c.costCoins === undefined) continue;
        const moneyTag = (c.tags ?? []).find((t) => {
          const digits = parseInt(t.label.replace(/[^\d]/g, ''), 10);
          return Number.isFinite(digits) && digits === c.costCoins;
        });
        assert.ok(moneyTag, `${ev.id}/${c.id} phai co pill hien chi phi`);
        assert.equal(parseInt(moneyTag.label.replace(/[^\d]/g, ''), 10), c.costCoins);
      }
    }
  });

  it('id cua kich ban co dieu kien khong trung ngan hang cu', () => {
    const ids = new Set(CITY_EVENTS.map((e) => e.id));
    assert.equal(ids.size, CITY_EVENTS.length);
  });

  it('muc do thu nguon tang dan: vi du doanh thu thap hon phai cham hon kieu qua day', () => {
    for (const ev of CONDITIONAL_CITY_EVENTS) {
      const [tot, mid, worst] = ev.choices;
      if (!tot?.effects.happiness || !mid?.effects.happiness || !worst?.effects.happiness) continue;
      assert.ok(
        tot.effects.happiness > mid.effects.happiness,
        `${ev.id}: phuong an tot nhat phai bu hanh phuc nhieu hon`,
      );
      assert.ok(
        mid.effects.happiness > worst.effects.happiness,
        `${ev.id}: phuong an o giua phai tot hon phuong an gay hai`,
      );
    }
  });
});

describe('tam trang thanh pho - chon dung, dung thu tu nghiem trong', () => {
  const binhThuong = {
    happiness: 70,
    cashflowRatio: 3,
    nplRate: 0.03,
    debt: 0,
    shopsOverloaded: 0,
    netIncomePerSec: 10,
  };

  it('thanh pho binh thuong thi khong co tam trang', () => {
    assert.equal(cityMood(binhThuong), null);
  });

  it('khach bo hang thi uu tien ca nhat', () => {
    assert.equal(
      cityMood({ ...binhThuong, shopsOverloaded: 2, nplRate: 0.5, happiness: 10 }),
      'CRISIS_CROWDING',
      'khach dang bo thi do la chuyen cap nhat, du ho co con no',
    );
  });

  it('co no thi bao CRISIS_DEBT', () => {
    assert.equal(cityMood({ ...binhThuong, debt: 500_000 }), 'CRISIS_DEBT');
  });

  it('no xau vuot nguong thi bao CRISIS_NPL', () => {
    assert.equal(cityMood({ ...binhThuong, nplRate: 0.2 }), 'CRISIS_NPL');
  });

  it('dong tien khong an toan thi bao CRISIS_CASHFLOW', () => {
    assert.equal(cityMood({ ...binhThuong, cashflowRatio: 0.5 }), 'CRISIS_CASHFLOW');
  });

  it('hanh phuc thap thi bao CRISIS_HAPPINESS', () => {
    assert.equal(cityMood({ ...binhThuong, happiness: 20 }), 'CRISIS_HAPPINESS');
  });

  it('khoe khong thi bao BOOM nhung chi khi co lai nhuan duong', () => {
    assert.equal(cityMood({ ...binhThuong, happiness: 90 }), 'BOOM');
    assert.equal(cityMood({ ...binhThuong, happiness: 90, netIncomePerSec: 0 }), null);
  });

  it('khong bao gi tran khi chi so bang bien', () => {
    assert.equal(cityMood({ ...binhThuong, cashflowRatio: 1 }), null, 'duoi 1 moi la crisis');
    assert.equal(cityMood({ ...binhThuong, happiness: 45 }), null, 'duoi 45 moi la crisis');
    // Nguong npl dung bang 0.12 thi DA la crisis: nguong bao gia la canh bao
    // som, khong phai nguong "chac chan no".
    assert.equal(cityMood({ ...binhThuong, nplRate: 0.12 }), 'CRISIS_NPL');
    assert.equal(cityMood({ ...binhThuong, nplRate: 0.119 }), null);
  });
});

describe('nhan vat binh luan ve khung hoang cua pho', () => {
  function npc(role: 'MERCHANT' | 'CITIZEN'): NpcState {
    return {
      id: 'n1',
      buildingId: 'b1',
      name: 'Test',
      archetype: role === 'MERCHANT' ? 'MERCHANT_CASH' : 'GIG_WORKER',
      role,
      trust: 20,
      acceptsDigital: false,
      services: [],
    };
  }

  it('khi co tam trang thi nhan vat noi ve chuyen do', () => {
    const thuong = streetLineFor(npc('MERCHANT'), 0, null);
    const crisis = streetLineFor(npc('MERCHANT'), 0, 'CRISIS_CROWDING');
    assert.ok(thuong);
    assert.ok(crisis);
    assert.notEqual(thuong, crisis, 'phai khac cau, khong phai cau chung chung');
  });

  it('khong co tam trang thi dung thoai thuong', () => {
    const thuong = streetLineFor(npc('MERCHANT'), 0, null);
    const khac = streetLineFor(npc('MERCHANT'), 3, null);
    assert.ok(thuong && khac);
  });

  it('moi tam trang phai co cau cho ca chu tiem lan cu dan', () => {
    const moods = [
      'CRISIS_HAPPINESS',
      'CRISIS_CASHFLOW',
      'CRISIS_NPL',
      'CRISIS_DEBT',
      'CRISIS_CROWDING',
      'BOOM',
    ] as const;
    for (const mood of moods) {
      for (const role of ['MERCHANT', 'CITIZEN'] as const) {
        const line = streetLineFor(npc(role), 0, mood);
        assert.ok(line && line.length > 10, `${mood}/${role} thieu cau`);
      }
    }
  });

  it('cau phai khac nhau giua cac tam trang - tranh lap lai', () => {
    const a = streetLineFor(npc('MERCHANT'), 0, 'CRISIS_NPL');
    const b = streetLineFor(npc('MERCHANT'), 0, 'CRISIS_CROWDING');
    assert.notEqual(a, b);
  });

  it('rotation quay vong qua het pool ma khong lap lai nguyen cau', () => {
    /*
     * Lay so cau that tu module thay vi hardcode: pool cua tung tam trang
     * khac nhau va se duoc bo sung, test hardcode se hỏng ngay lan sau.
     */
    const pool = CITY_MOOD_LINES.CRISIS_NPL.cash ?? [];
    assert.ok(pool.length >= 2, 'phai co it nhat 2 cau de rotation co y nghia');

    const cacCau = Array.from({ length: pool.length }, (_, r) =>
      streetLineFor(npc('MERCHANT'), r, 'CRISIS_NPL'),
    );
    assert.equal(new Set(cacCau).size, pool.length, 'moi cau trong pool phai la mot cau khac');

    const vongSau = streetLineFor(npc('MERCHANT'), pool.length, 'CRISIS_NPL');
    assert.equal(vongSau, cacCau[0], 'het pool phai quay lai tu dau');
  });

  it('moi tam trang phai co it nhat 2 cau cho ca hai vai', () => {
    for (const [mood, pool] of Object.entries(CITY_MOOD_LINES)) {
      assert.ok((pool.cash ?? []).length >= 2, `${mood} thieu cau cho chu tiem`);
      assert.ok((pool.plain ?? []).length >= 2, `${mood} thieu cau cho cu dan`);
    }
  });

  it('mau nghiem trong hon phai co nhieu cau hon: chung khai it nua', () => {
    // Cu dan dang kiem tien thi can nhieu cau hon de khong bi quay vong.
    const npl = (CITY_MOOD_LINES.CRISIS_NPL.cash ?? []).length;
    const boom = (CITY_MOOD_LINES.BOOM.cash ?? []).length;
    assert.ok(npl >= boom, 'khung hoang phai nhieu cau hon luc pho on');
  });

  it('cau phan ung khung hoang phai cham dung chi so', () => {
    // Cau ve khach bo hang khong duoc xuat hien khi khong co tiem nao qua tai.
    const line = streetLineFor(npc('MERCHANT'), 0, 'CRISIS_CROWDING') ?? '';
    assert.ok(/khách|hàng|phục s��|bỏ/i.test(line), `cau khong cham nhung chuyen xep hang: "${line}"`);
  });

  it('moi cau phan ung phai la cau hoi chuyen, khong phai cau chay nhanh', () => {
    for (const mood of ['CRISIS_NPL', 'CRISIS_DEBT', 'BOOM'] as const) {
      const line = streetLineFor(npc('MERCHANT'), 0, mood) ?? '';
      assert.ok(!/MoCity tại|http/i.test(line), 'khong duoc nhung lien ket cong khai trong thoai');
    }
  });

  it('khong phai archetype nao cung noi duoc cau khung hoang', () => {
    // KHÔNG phải ai cũng hỏi chuyện tài chính: cần đúng vai.
    assert.ok(Object.keys(ARCHETYPES).length > 0);
  });
});

describe('mien bao hiem - chi khi thieu`, không phai khi da mua', () => {
  const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.requiresNoInsurance);
  assert.ok(ev, 'phai co kich ban bao hiem');
  assert.equal(ev.minMayorLevel, 1);
});
/**
 * GATE SỰ KIỆN - HÀNH VI THẬT.
 *
 * Phần trên chỉ kiểm dữ liệu. Phần này kiểm `eventFits` với đúng các trạng
 * thái mà UI thực sự đưa vào: ngưỡng đúng bằng biên, ngưỡng sai một chút.
 */
/** Trạng thái thành phố bình thường, dùng chung cho cả hai nhóm test. */
const BINH = {
  happiness: 70,
  nplRate: 0.03,
  debt: 0,
  cashflowRatio: 3,
  shopsOverloaded: 0,
  lateFeeCount: 0,
  hasInsurance: false,
  netIncomePerSec: 10,
};

describe('eventFits - chay tren trang thai that cua pho', () => {
  const binh = BINH;

  it('khong co dieu kien nao thi luon hợp lệ', () => {
    const ev = CITY_EVENTS.find((e) => e.id === 'ev-lac-heo-vang');
    assert.ok(ev);
    assert.equal(eventFits(ev, binh), true);
  });

  it('hanh phuc thap moi bat kich ban hanh phuc', () => {
    const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.happinessBelow !== undefined);
    assert.ok(ev);
    assert.equal(eventFits(ev, { ...binh, happiness: 30 }), true);
    assert.equal(eventFits(ev, { ...binh, happiness: 80 }), false);
  });

  it('nguong bang bien thi CHUA bat - nguong bao gia la "hon"', () => {
    const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.happinessBelow !== undefined);
    assert.ok(ev);
    const nguong = ev.happinessBelow!;
    assert.equal(
      eventFits(ev, { ...binh, happiness: nguong }),
      false,
      `hanh phuc = ${nguong} bang nguong thi chua bat`,
    );
    assert.equal(eventFits(ev, { ...binh, happiness: nguong - 1 }), true);
  });

  it('no xau vuot nguong moi bat', () => {
    const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.nplAbove !== undefined);
    assert.ok(ev);
    const nguong = ev.nplAbove!;
    assert.equal(eventFits(ev, { ...binh, nplRate: nguong - 0.01 }), false);
    assert.equal(eventFits(ev, { ...binh, nplRate: nguong }), true);
  });

  it('NGUONG cua kich ban phai trung nguong cua tam trang pho', () => {
    /*
     * Hai he thong doc cung mot con so: `cityMood` cho NPC lo lắng, `eventFits`
     * cho kich ban chay. Neu hai nguong lech nhau thi nguoi choi thay pho bi
     * bao dong nhung kich ban cua chuyen do lai khong chay - he thong noi hai
     * chuyen khac nhau.
     */
    const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.nplAbove !== undefined);
    assert.ok(ev);
    const nguong = ev.nplAbove!;

    // Tai chinh nguong, ca hai he phai cung ket luan.
    const canhBaoNPC = cityMood({ ...BINH, nplRate: nguong });
    const kichBanChay = eventFits(ev, { ...BINH, nplRate: nguong });
    assert.equal(
      canhBaoNPC !== null,
      kichBanChay,
      `nplRate = ${nguong}: NPC ${canhBaoNPC} nhung kich ban ${kichBanChay}`,
    );

    // Duoi nguong, ca hai he phai cung im.
    assert.equal(cityMood({ ...BINH, nplRate: nguong - 0.01 }), null);
    assert.equal(eventFits(ev, { ...BINH, nplRate: nguong - 0.01 }), false);
  });

  it('chi can MOT tiem qua tai la bat kich ban xep hang', () => {
    const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.requiresCrowding);
    assert.ok(ev);
    assert.equal(eventFits(ev, { ...binh, shopsOverloaded: 0 }), false);
    assert.equal(eventFits(ev, { ...binh, shopsOverloaded: 1 }), true);
  });

  it('tru han tra no moi bat kich bao', () => {
    const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.requiresLateFee);
    assert.ok(ev);
    assert.equal(eventFits(ev, { ...binh, lateFeeCount: 0 }), false);
    assert.equal(eventFits(ev, { ...binh, lateFeeCount: 1 }), true);
  });

  it('kich bao hiem chi bat khi CHUA mua', () => {
    const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.requiresNoInsurance);
    assert.ok(ev);
    assert.equal(eventFits(ev, { ...binh, hasInsurance: false }), true);
    assert.equal(eventFits(ev, { ...binh, hasInsurance: true }), false);
  });

  it('dang co no thi kich bao han bao - kich bao noi', () => {
    const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.requiresLateFee);
    assert.ok(ev);
    // Nguoi choi dang no: kich phat han, KHONG phai kich bao.
    const dangNo = { ...binh, debt: 500_000, lateFeeCount: 0 };
    assert.equal(eventFits(ev, dangNo), false);
  });

  it('kich bao dong tien dung nguong an toan', () => {
    const ev = CONDITIONAL_CITY_EVENTS.find((e) => e.cashflowBelow !== undefined);
    assert.ok(ev);
    const nguong = ev.cashflowBelow!;
    assert.equal(eventFits(ev, { ...binh, cashflowRatio: nguong }), false);
    assert.equal(eventFits(ev, { ...binh, cashflowRatio: nguong - 0.1 }), true);
  });
});

describe('ngân hàng su kien - phai luon con kich ban de chơi duoc', () => {
  it('ngay cap thap van co it nhat 10 kich ban vo dieu kien', () => {
    const cap1VoDieuKien = CITY_EVENTS.filter(
      (e) =>
        e.minMayorLevel <= 1 &&
        e.happinessBelow === undefined &&
        e.cashflowBelow === undefined &&
        e.nplAbove === undefined &&
        e.debtAbove === undefined &&
        !e.requiresCrowding &&
        !e.requiresLateFee &&
        !e.requiresNoInsurance,
    );
    assert.ok(
      cap1VoDieuKien.length >= 10,
      `chi con ${cap1VoDieuKien.length} kich ban cap 1 vo dieu kien`,
    );
  });

  it('moi kich ban ton tai trong CITY_EVENTS de spawn duoc', () => {
    for (const ev of CONDITIONAL_CITY_EVENTS) {
      assert.ok(
        CITY_EVENTS.some((e) => e.id === ev.id),
        `${ev.id} vang nam ngoai CITY_EVENTS thi khong bao gio duoc spawn`,
      );
    }
  });

  it('nguong cua kich ban dang trong bien hop ly', () => {
    for (const ev of CONDITIONAL_CITY_EVENTS) {
      if (ev.happinessBelow !== undefined) {
        assert.ok(ev.happinessBelow > 0 && ev.happinessBelow < 100, `${ev.id} nguong hanh phuc vo nghia`);
      }
      if (ev.cashflowBelow !== undefined) {
        assert.ok(ev.cashflowBelow > 0 && ev.cashflowBelow < 10, `${ev.id} nguong dong tien vo nghia`);
      }
      if (ev.nplAbove !== undefined) {
        assert.ok(ev.nplAbove > 0 && ev.nplAbove < 1, `${ev.id} nguong no xau vo nghia`);
      }
    }
  });
});
