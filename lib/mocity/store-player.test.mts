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

    const savedA = ls.get('momo_city_v9_alice@momo.vn');
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
      !ls.has('momo_city_v9_dave@momo.vn') || JSON.parse(ls.get('momo_city_v9_dave@momo.vn')!).buildings.length === 0,
      'save cua tai khoan dang xoa phai sach',
    );
    assert.equal(
      JSON.parse(ls.get('momo_city_v9_carol@momo.vn')!).buildings.length,
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
    assert.equal(parsed.version, 9);
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
    assert.equal(getCityState().version, 9);
    assert.equal(getCityState().buildings.length, 1, 'giu nguyen tiem da xay');
    assert.equal(getCityState().coins, 9_999);
    assert.equal(getCityState().feverEverUsed, false, 'save v3 chua co field nay nen mac dinh false');
  });
});

/**
 * HANH VI CHUOI NGAY.
 *
 * Test duoi day dung ham THAT cua store, khong dung ham test. Ly do: logic
 * `registerStreak` va `grantShieldForStreak` phu thuoc ngay hien tai cua may,
 * va mot ban test lai rieng se khong bao duoc truong hop phieu bi ghi nhung
 * reload xong thi mat.
 */
describe('phieu bao vui chuoi ngay - HANH VI THAT', () => {
  /**
   * Nap save co chuoi duoc mot ngay va so phieu.
   *
   * `napSave` phai DUNG MOT TAI KHOAN MOI cho moi lan: `hydrateCity` co co so
   * "cung tai khoan thi giu state trong bo nho", nen goi lai voi cung id se
   * khong nap gi va test se doc nham du lieu cua test truoc.
   */
  let seq = 0;
  const napSave = (days: number, shields: number, ngayChoi: string) => {
    ls.clear();
    const pid = `shield-${seq++}@momo.vn`;
    ls.set(
      `momo_city_v9_${pid}`,
      JSON.stringify({
        version: 9,
        streak: { days, lastDay: ngayChoi, best: days, shields },
      }),
    );
    hydrateCity(pid);
  };

  /** Ngay hom qua theo moc thoi gian that cua may. */
  const homQua = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };
  const homKia = () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };
  const homNay = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  it('bo DUNG MOT ngay thi dung phieu giu chuoi', () => {
    napSave(12, 1, homKia());
    const r = mocity.registerStreak();
    assert.equal(r.usedShield, true, 'bo 1 ngay phai duoc dung phieu');
    assert.equal(r.days, 13, 'chuoi phai len 13 chu khong reset');
    assert.equal(getCityState().streak.shields, 0, 'dung 1 phieu');
  });

  it('bo HAI ngay tro len thi khong dung phieu - roi lo la roi lo', () => {
    napSave(12, 3, '2020-1-1');
    const r = mocity.registerStreak();
    assert.equal(r.usedShield, false, 'bo qua nhieu ngay khong phai chu bi ngat');
    assert.equal(r.days, 1, 'phai reset ve 1');
    assert.equal(getCityState().streak.shields, 3, 'phieu phai con nguyen');
  });

  it('chuoi lien tuc thi khong tiec phieu', () => {
    napSave(12, 2, homQua());
    const r = mocity.registerStreak();
    assert.equal(r.usedShield, false);
    assert.equal(r.days, 13);
    assert.equal(getCityState().streak.shields, 2);
  });

  it('khong co phieu thi chuoi van vỡ nhu truoc', () => {
    napSave(12, 0, homKia());
    const r = mocity.registerStreak();
    assert.equal(r.usedShield, false);
    assert.equal(r.days, 1);
  });

  it('goi lai trong cung ngay thi khong tang va khong tiec phieu', () => {
    napSave(12, 2, homQua());
    mocity.registerStreak();
    const lanHai = mocity.registerStreak();
    assert.equal(lanHai.days, 0, 'goi lai trong ngay khong phai ngay moi');
    assert.equal(lanHai.usedShield, false);
    assert.equal(getCityState().streak.shields, 2, 'khong duoc tiec phieu');
  });

  it('phieu con giu nguyen sau reload', () => {
    napSave(20, 3, homNay());
    assert.equal(getCityState().streak.shields, 3, 'phieu phai con qua hydrate');
  });

  it('chi nhan phieu tu moc 7 ngay', () => {
    napSave(3, 0, homNay());
    assert.equal(mocity.grantShieldForStreak(3), 0, '3 ngay chua du dieu kien');
  });

  it('moc 7 ngay cho 1 phieu', () => {
    napSave(7, 0, homNay());
    assert.equal(mocity.grantShieldForStreak(7), 1);
    assert.equal(getCityState().streak.shields, 1);
  });

  it('moc 14 ngay cho them 1 phieu', () => {
    napSave(14, 1, homNay());
    assert.equal(mocity.grantShieldForStreak(14), 1);
    assert.equal(getCityState().streak.shields, 2);
  });

  it('khong vượt tran 3 phieu', () => {
    napSave(30, 3, homNay());
    assert.equal(mocity.grantShieldForStreak(30), 0);
    assert.equal(getCityState().streak.shields, 3);
  });

  it('moc 21 ngay khong cho phieu - chi 7 va boi so cua 14', () => {
    napSave(21, 0, homNay());
    assert.equal(mocity.grantShieldForStreak(21), 0, '21 khong phai moc lam tron');
    napSave(28, 0, homNay());
    assert.equal(mocity.grantShieldForStreak(28), 1, '28 la boi so cua 14');
  });
});

describe('Gio Vang - HANH VI THAT', () => {
  let seqFever = 0;
  const nap = (gems: number) => {
    ls.clear();
    const pid = `fever-${seqFever++}@momo.vn`;
    ls.set(
      `momo_city_v9_${pid}`,
      JSON.stringify({ version: 9, gems, feverUntil: 0, feverUsedToday: 0, feverDay: '' }),
    );
    hydrateCity(pid);
  };

  it('dung thi tru cua chuoi Kim Cuong', () => {
    nap(20);
    assert.equal(mocity.triggerFeverMode(), true);
    assert.equal(getCityState().gems, 20 - mocity.FEVER_COST_GEMS);
  });

  it('khong du Kim Cuong thi khong duoc dung', () => {
    nap(1);
    assert.equal(mocity.triggerFeverMode(), false);
    assert.equal(getCityState().gems, 1, 'khong duoc tru tien');
  });

  it('het luot trong ngay thi chan, kiem chung bang may khong cho doi Y kieu', () => {
    nap(100);
    const lan = mocity.FEVER_PER_DAY;
    for (let i = 0; i < lan; i++) {
      // Reset `feverUntil` de dong mo moi duoc dung ngay.
      mocity.importCitySave(
        JSON.stringify({ ...getCityState(), feverUntil: 0, version: 9 }),
      );
      assert.equal(mocity.triggerFeverMode(), true, `lan ${i + 1} phai dung duoc`);
    }
    assert.equal(
      mocity.triggerFeverMode(),
      false,
      `${mocity.FEVER_PER_DAY} lan la tran, lan sau phai bi chan`,
    );
  });

  it('qua ngay moi thi bo dem ve 0', () => {
    nap(100);
    for (let i = 0; i < mocity.FEVER_PER_DAY; i++) {
      mocity.importCitySave(JSON.stringify({ ...getCityState(), feverUntil: 0, version: 9 }));
      mocity.triggerFeverMode();
    }
    // Ghi ngay hom qua vao bo dem: `feverLeftToday` phai cho lai.
    const homQua = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    })();
    mocity.importCitySave(
      JSON.stringify({ ...getCityState(), feverUntil: 0, feverDay: homQua, feverUsedToday: 2 }),
    );
    assert.equal(mocity.feverUsedToday(), 0, 'khac ngay phai ve 0');
    assert.equal(mocity.feverLeftToday(), mocity.FEVER_PER_DAY);
  });
});
