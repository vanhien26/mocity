/**
 * Test giọng điệu theo bối cảnh (player-tones.ts) + thứ tự ưu tiên trong
 * `streetLineFor`: khủng hoảng > giọng bối cảnh > thoại thường.
 *
 * Chạy: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { PLAYER_TONES, toneForCity, toneLineFor, type PlayerTone } from './player-tones';
import { CITY_MOOD_LINES, ambientLineFor, streetLineFor } from './dialogue-engine';
import type { NpcRole, NpcState } from './types';

const TONES: PlayerTone[] = ['CHAO_HOI', 'KHEN', 'DONG_VIEN', 'CANH_TRANH', 'CHEN_EP'];
const ROLES: NpcRole[] = ['MERCHANT', 'CITIZEN'];

function npc(role: NpcRole): NpcState {
  return {
    id: `n-${role}`,
    buildingId: 'b1',
    name: 'Test',
    archetype: role === 'MERCHANT' ? 'MERCHANT_CASH' : 'GIG_WORKER',
    role,
    trust: 20,
    acceptsDigital: false,
    services: [],
  };
}

describe('PLAYER_TONES - ngân khẩu giọng điệu', () => {
  it('đủ 5 giọng cho cả chủ tiệm lẫn cư dân', () => {
    for (const tone of TONES) {
      for (const role of ROLES) {
        const lines = PLAYER_TONES[tone][role];
        assert.ok(lines.length >= 6, `${tone}/${role} chỉ có ${lines.length} câu (cần >= 6)`);
        for (const line of lines) {
          assert.ok(line.length > 10, `${tone}/${role} câu quá ngắn: "${line}"`);
        }
      }
    }
  });

  it('không trùng câu giữa các pool', () => {
    const seen = new Map<string, string>();
    for (const tone of TONES) {
      for (const role of ROLES) {
        for (const line of PLAYER_TONES[tone][role]) {
          const prev = seen.get(line);
          assert.ok(!prev, `câu trùng giữa ${prev} và ${tone}/${role}: "${line}"`);
          seen.set(line, `${tone}/${role}`);
        }
      }
    }
  });

  it('phần lớn câu có xưng hô để tên người chơi được điền vào', () => {
    for (const tone of TONES) {
      for (const role of ROLES) {
        const lines = PLAYER_TONES[tone][role];
        const coTen = lines.filter((l) => l.includes('Thị Trưởng')).length;
        assert.ok(coTen >= 4, `${tone}/${role} chỉ ${coTen} câu gọi người chơi (cần >= 4)`);
      }
    }
  });
});

describe('toneForCity - chọn giọng theo ngữ cảnh thật', () => {
  const macDinh = {
    builtToday: 0,
    upgradedToday: 0,
    starEvolvedToday: 0,
    pendingRequests: 0,
    cityTier: 1,
  };

  it('không có gì mới thì chào hỏi', () => {
    assert.equal(toneForCity(macDinh), 'CHAO_HOI');
  });

  it('hôm nay vừa xây / tiến sao -> khen', () => {
    assert.equal(toneForCity({ ...macDinh, builtToday: 1 }), 'KHEN');
    assert.equal(toneForCity({ ...macDinh, starEvolvedToday: 2 }), 'KHEN');
    assert.equal(toneForCity({ ...macDinh, builtToday: 3, upgradedToday: 1 }), 'KHEN');
  });

  it('chỉ nâng cấp -> động viên (tiệm mới chưa có khách)', () => {
    assert.equal(toneForCity({ ...macDinh, upgradedToday: 1 }), 'DONG_VIEN');
  });

  it('còn chuyện của bà con chờ xử lý -> chèn ép', () => {
    assert.equal(toneForCity({ ...macDinh, pendingRequests: 2 }), 'CHEN_EP');
  });

  it('phố đã lên bậc 2 trở lên -> cạnh tranh', () => {
    assert.equal(toneForCity({ ...macDinh, cityTier: 2 }), 'CANH_TRANH');
    assert.equal(toneForCity({ ...macDinh, cityTier: 5 }), 'CANH_TRANH');
  });

  it('thành tựu hôm nay luôn thắng các hint khác', () => {
    assert.equal(
      toneForCity({ builtToday: 1, upgradedToday: 1, starEvolvedToday: 1, pendingRequests: 3, cityTier: 4 }),
      'KHEN',
    );
  });
});

describe('streetLineFor - thứ tự ưu tiên', () => {
  it('khủng hoảng vẫn thắng giọng bối cảnh', () => {
    const a = streetLineFor(npc('MERCHANT'), 0, 'CRISIS_CROWDING', 'KHEN');
    assert.ok(a);
    assert.notEqual(a, toneLineFor('MERCHANT', 'KHEN', 0));
    assert.ok(/khách|hàng|phục vụ|bỏ/i.test(a), `phải là câu khủng hoảng, nhận: "${a}"`);
  });

  it('không có hint thì giữ nguyên thoại thường (không đổi hành vi cũ)', () => {
    const a = streetLineFor(npc('MERCHANT'), 0, null);
    const b = streetLineFor(npc('MERCHANT'), 0, null, null);
    assert.ok(a);
    assert.equal(a, b, 'tone = null phải giống hệt không truyền tone');
    for (let r = 0; r < 6; r += 1) {
      assert.equal(
        streetLineFor(npc('MERCHANT'), r, null),
        ambientLineFor(npc('MERCHANT'), r),
        `nhịp ${r} không hint phải là ambient`,
      );
    }
  });

  it('có hint thì nói giọng bối cảnh, xen kẽ 1 câu ambient mỗi 4 nhịp', () => {
    for (let r = 0; r < 8; r += 1) {
      const line = streetLineFor(npc('CITIZEN'), r, null, 'CHEN_EP');
      assert.ok(line);
      if (Math.abs(r) % 4 === 3) {
        assert.equal(line, streetLineFor(npc('CITIZEN'), r, null), `nhịp ${r} phải là ambient`);
      } else {
        assert.equal(line, toneLineFor('CITIZEN', 'CHEN_EP', r), `nhịp ${r} phải là câu giọng`);
      }
    }
  });

  it('rotation quay vòng hết pool giọng rồi quay lại từ đầu', () => {
    const pool = PLAYER_TONES.KHEN.MERCHANT;
    const cacCau = Array.from({ length: pool.length }, (_, r) => streetLineFor(npc('MERCHANT'), r, null, 'KHEN'));
    assert.equal(new Set(cacCau).size, pool.length, 'mỗi nhịp phải ra một câu khác');
    assert.equal(streetLineFor(npc('MERCHANT'), pool.length, null, 'KHEN'), cacCau[0]);
  });

  it('giọng khác nhau cho ra câu khác nhau ở cùng nhịp', () => {
    const khen = streetLineFor(npc('MERCHANT'), 1, null, 'KHEN');
    const ep = streetLineFor(npc('MERCHANT'), 1, null, 'CHEN_EP');
    assert.ok(khen && ep);
    assert.notEqual(khen, ep);
  });

  it('pool khủng hoảng vẫn đủ câu cho cả hai vai (không đổi hành vi cũ)', () => {
    for (const [mood, pool] of Object.entries(CITY_MOOD_LINES)) {
      assert.ok((pool.cash ?? []).length >= 2, `${mood} thiếu câu cho chủ tiệm`);
      assert.ok((pool.plain ?? []).length >= 2, `${mood} thiếu câu cho cư dân`);
    }
  });
});
