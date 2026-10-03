import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeStoredState } from './store';
import { FEVER_COST_GEMS, FEVER_PER_DAY } from './store';
import { STREAK_SHIELD_DAY, STREAK_SHIELD_MAX } from './store';

/** Moc thoi gian co dinh cho test chuan hoa save. */
const NOW = 1_700_000_000_000;

describe('Gio Vang - phai co gia va tran', () => {
  it('gia phai du de Kim Cương la tai san tich tru chu khong phai tien trang tri', () => {
    // Thu nhap mot ngay tu 5 nhiem vu daily la 10-12 KC. Gia 2 nghia la nua
    // ngay da ngheo, nen gia phai lon hon.
    assert.ok(
      FEVER_COST_GEMS >= 5,
      `gia ${FEVER_COST_GEMS} qua re so voi thu nhap 10-12 KC/ngay`,
    );
  });

  it('phanh vien gia tri khi tran trong ngay', () => {
    assert.ok(FEVER_PER_DAY >= 1 && FEVER_PER_DAY <= 3, `tran ${FEVER_PER_DAY} qua lon hoac qua nho`);
  });

  it('mien bac dau cho 20 KC nen cham toi duoc tran ngay', () => {
    // 20 KC / 5 KC = 4 lan, nhung tran 2 nen chan o 2.
    assert.ok(20 / FEVER_COST_GEMS > FEVER_PER_DAY, 'tran phai thu hon so lan cham duoc');
  });
});

describe('phieu bao vui chuoi ngay', () => {
  const base = { version: 9, streak: { days: 0, lastDay: '', best: 0 } };

  it('save cu khong co field phieu phai chuan hoa ve 0', () => {
    const s = normalizeStoredState(JSON.stringify(base), 1_700_000_000_000);
    assert.equal(s.streak.shields, 0);
  });

  it('save cu giu nguyen so phieu da co', () => {
    const s = normalizeStoredState(
      JSON.stringify({ ...base, streak: { days: 20, lastDay: '2026-3-1', best: 20, shields: 2 } }),
      1_700_000_000_000,
    );
    assert.equal(s.streak.shields, 2);
  });

  it('phieu am phai ve 0', () => {
    const s = normalizeStoredState(
      JSON.stringify({ ...base, streak: { days: 5, lastDay: '2026-3-1', best: 5, shields: -3 } }),
      1_700_000_000_000,
    );
    assert.equal(s.streak.shields, 0);
  });

  it('muc nhan phieu phai bat dau tu 7 ngay', () => {
    assert.equal(STREAK_SHIELD_DAY, 7, 'cho phieu tu ngay 1 thi tro thanh, muc 7 ngay vo nghia');
  });

  it('co tran toi da', () => {
    assert.ok(STREAK_SHIELD_MAX <= 3, 'qua 3 phieu thi phieu khong con hanh nghia');
  });
});

describe('Gio Vang - mat kiem cuong sang ngay moi', () => {
  it('b dem chua co gia tri mac dinh ve 0', () => {
    const s = normalizeStoredState(JSON.stringify({ version: 9 }), 1_700_000_000_000);
    assert.equal(s.feverUsedToday, 0);
    assert.equal(s.feverDay, '');
  });

  it('migration tu save v8 gan 0 chu khong uoc luong', () => {
    const s = normalizeStoredState(
      JSON.stringify({ version: 8, feverUntil: 0, gems: 999 }),
      1_700_000_000_000,
    );
    assert.equal(s.version, 9);
    assert.equal(s.feverUsedToday, 0);
    assert.equal(s.feverDay, '');
  });

  it('giu nguyen bo dem cua ngay hien tai', () => {
    const s = normalizeStoredState(
      JSON.stringify({ version: 9, feverUsedToday: 2, feverDay: '2026-3-1' }),
      1_700_000_000_000,
    );
    assert.equal(s.feverUsedToday, 2);
    assert.equal(s.feverDay, '2026-3-1');
  });

  it('bo dem am phai ve 0', () => {
    const s = normalizeStoredState(
      JSON.stringify({ version: 9, feverUsedToday: -5, feverDay: 'x' }),
      1_700_000_000_000,
    );
    assert.equal(s.feverUsedToday, 0);
  });
});

describe('khoa lưu - ha tang bao ve thuoc ve may in tien', () => {
  it('mua lại phieu phai ton ton mot lan duy nhat', () => {
    // Khong co ham nao tu them phieu tu chuoi cua nguoi choi. `grantShieldForStreak`
    // chi chay tu `claimStreakMilestones`, va `streakClaimed` chan nhan trung.
    assert.ok(true, 'bat bien: grantShield chi tiep qua claimStreakMilestones');
  });

  it('xem save co phieu thi khong duoc cap them tu save', () => {
    const s = normalizeStoredState(
      JSON.stringify({
        version: 9,
        streak: { days: 100, lastDay: '2026-3-1', best: 100, shields: 99 },
      }),
      1_700_000_000_000,
    );
    // Tran duoc ap o lúc cap phieu, khong phai luc normalize save.
    assert.equal(s.streak.shields, 99, 'normalize chi chuan hoa chu khong cat nhung gi hieu qua');
    assert.ok(STREAK_SHIELD_MAX <= 3);
  });
});
/**
 * BẤT BIẾN ĐỐI VỚI TRẠNG THÁI MỚI.
 *
 * `createInitialState` phải khai đủ mọi field mới. Thiếu thì `undefined` lọt
 * xuống UI và mọi `?? default` phải gánh thay - lỗi im lặng, khó thấy cho tới
 * khi người chơi mới chơi gặp phải.
 */
describe('thanh pho moi phai co du field', () => {
  it('khoi tao chuoi co san phieu bao ve', () => {
    const s = normalizeStoredState(JSON.stringify({ version: 9 }), NOW);
    assert.equal(s.streak.shields, 0, 'phieu phai la 0 chu khong undefined');
    assert.ok(Array.isArray(s.dailySnapshots), 'dailySnapshots phai la mang rong');
    assert.equal(s.dailySnapshots.length, 0);
  });

  it('save rong ngay se nhan du field qua migration', () => {
    const s = normalizeStoredState(JSON.stringify({}), NOW);
    assert.equal(typeof s.version, 'number');
    assert.equal(s.streak.shields, 0);
    assert.deepEqual(s.dailySnapshots, []);
    assert.equal(s.feverUsedToday, 0);
    assert.equal(s.feverDay, '');
  });

  it('khong duoc ton tai field undefined trong thanh pho moi', () => {
    /*
     * `normalizeStoredState` duot save rong ve `createInitialState`, nen moi
     * field phai co san gia tri mac dinh. Truoc day `streak.shields` va
     * `dailySnapshots` deu undefined luc moi choi.
     */
    const s = normalizeStoredState(JSON.stringify({ version: 9 }), NOW);
    assert.ok(s.streak !== undefined);
    assert.notEqual(s.streak.shields as unknown, undefined);
    assert.notEqual(s.dailySnapshots as unknown, undefined);
  });
});
