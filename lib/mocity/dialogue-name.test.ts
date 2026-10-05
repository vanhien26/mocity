/**
 * Bộ khửng của cơ chế xưng hô theo tên người chơi (dialogue-name.ts).
 *
 * Canon: người chơi là người lên phố lập nghiệp, "Thị Trưởng" trong lời thoại
 * là CÁCH BÀ CON GỌI NGƯỜI CHƠI - nên tại điểm render nó phải biến thành tên
 * người chơi. Các danh từ riêng ("Trợ Lý Thị Trưởng", "Thị Trưởng MoCity")
 * là tên NPC/nhóm, KHÔNG được đổi.
 *
 * Chạy: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { tenOf, fillTen } from './dialogue-name';

const PROTECTED = ['Trợ Lý Thị Trưởng', 'Thị Trưởng MoCity'];

/** Bỏ danh từ riêng được bảo vệ để tìm chữ "Thị Trưởng" sót lại. */
function stripProtected(text: string): string {
  let out = text;
  for (const p of PROTECTED) out = out.split(p).join('');
  return out;
}

describe('tenOf', () => {
  it('dùng tên khi có', () => {
    assert.equal(tenOf('  Hiến  '), 'Hiến');
    assert.equal(tenOf('Người Lập Nghiệp'), 'Người Lập Nghiệp');
  });

  it('fallback "bạn" khi rỗng', () => {
    assert.equal(tenOf(undefined), 'bạn');
    assert.equal(tenOf(null), 'bạn');
    assert.equal(tenOf(''), 'bạn');
    assert.equal(tenOf('   '), 'bạn');
  });
});

describe('fillTen', () => {
  it('đổi mọi chỗ gọi người chơi thành tên', () => {
    assert.equal(fillTen('Dạ Thị Trưởng ơi, đón xe thôi!', 'Hiến'), 'Dạ Hiến ơi, đón xe thôi!');
    assert.equal(
      fillTen('Thị Trưởng vừa đi tuần xong, Thị Trưởng nghỉ đi!', 'Hiến'),
      'Hiến vừa đi tuần xong, Hiến nghỉ đi!',
    );
  });

  it('fallback "bạn" khi chưa đặt tên', () => {
    assert.equal(fillTen('Cảm ơn Thị Trưởng nha!'), 'Cảm ơn bạn nha!');
    assert.equal(fillTen('Cảm ơn Thị Trưởng nha!', '   '), 'Cảm ơn bạn nha!');
  });

  it('bỏ qua chuỗi không có "Thị Trưởng"', () => {
    assert.equal(fillTen('Chào buổi sáng!'), 'Chào buổi sáng!');
    assert.equal(fillTen(''), '');
  });

  it('giữ nguyên danh từ riêng được bảo vệ', () => {
    assert.equal(fillTen('Trợ Lý Thị Trưởng chào Thị Trưởng', 'Hiến'), 'Trợ Lý Thị Trưởng chào Hiến');
    assert.equal(fillTen('Review Thị Trưởng MoCity mới lên sóng', 'Hiến'), 'Review Thị Trưởng MoCity mới lên sóng');
  });

  it('idempotent - điền lần hai không đổi thêm', () => {
    const once = fillTen('Thị Trưởng ơi, mở thêm lô đi!', 'Hiến');
    assert.equal(fillTen(once, 'Lan'), once);
    assert.equal(fillTen(once, undefined), once);
  });
});

/**
 * Quét TOÀN BỘ data thoại: mọi chuỗi chứa "Thị Trưởng" sau khi điền tên
 * không được còn chữ "Thị Trưởng" trần (trừ danh từ riêng bảo vệ).
 */
describe('data thoại không sót "Thị Trưởng" sau khi điền tên', () => {
  function collectStrings(value: unknown, out: string[] = []): string[] {
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) for (const v of value) collectStrings(v, out);
    else if (value && typeof value === 'object') for (const v of Object.values(value)) collectStrings(v, out);
    return out;
  }

  it('dialogue-data: AMBIENT, REQUEST_SCRIPTS, CITY_EVENTS', async () => {
    const mod = await import('./dialogue-data');
    const strings = collectStrings([mod.AMBIENT, mod.REQUEST_SCRIPTS, mod.CITY_EVENTS]);
    const hit = strings.filter((s) => s.includes('Thị Trưởng'));
    // Day la guard nho: data van con xưng hô "Thị Truong" (điền tên) voi nguoi choi.
    // Muc 45 thay vi 50 vi Tầng A da doi prompt "Thị Trưởng sẽ/quyết định" -> "Bạn".
    assert.ok(hit.length >= 45, `mong đợi data có lời thoại address người chơi, nhận ${hit.length}`);
    for (const s of hit) {
      assert.ok(
        !stripProtected(fillTen(s, 'Hiến')).includes('Thị Trưởng'),
        `còn sót: ${JSON.stringify(fillTen(s, 'Hiến'))}`,
      );
    }
  });

  it('dialogue-events: sự kiện & điều kiện', async () => {
    const extra = await import('./dialogue-events-extra');
    const cond = await import('./dialogue-events-conditional');
    const strings = [...collectStrings(extra), ...collectStrings(cond)];
    for (const s of strings.filter((x) => x.includes('Thị Trưởng'))) {
      assert.ok(
        !stripProtected(fillTen(s, 'Hiến')).includes('Thị Trưởng'),
        `còn sót: ${JSON.stringify(fillTen(s, 'Hiến'))}`,
      );
    }
  });

  it('pool giọng điệu & tâm trạng (player-tones, dialogue-engine)', async () => {
    const tones = await import('./player-tones');
    const engine = await import('./dialogue-engine');
    const strings = [...collectStrings(tones.PLAYER_TONES), ...collectStrings(engine.CITY_MOOD_LINES)];
    const hit = strings.filter((s) => s.includes('Thị Trưởng'));
    assert.ok(hit.length >= 60, `mong đợi pool co loi address nguoi choi, nhan ${hit.length}`);
    for (const s of hit) {
      assert.ok(
        !stripProtected(fillTen(s, 'Hiến')).includes('Thị Trưởng'),
        `còn sót: ${JSON.stringify(fillTen(s, 'Hiến'))}`,
      );
    }
  });

  it('dialogue-requests-extra & citizen-scenarios', async () => {
    const req = await import('./dialogue-requests-extra');
    const cit = await import('./citizen-scenarios');
    const strings = [...collectStrings(req), ...collectStrings(cit)];
    for (const s of strings.filter((x) => x.includes('Thị Trưởng'))) {
      assert.ok(
        !stripProtected(fillTen(s, 'Hiến')).includes('Thị Trưởng'),
        `còn sót: ${JSON.stringify(fillTen(s, 'Hiến'))}`,
      );
    }
  });
});
