import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CITIZEN_SCRIPTS, FINANCE_TAG_META } from './citizen-scenarios';
import { AMBIENT } from './dialogue-data';
import { ARCHETYPES } from './npc-data';
import { DIGITAL_TRUST_THRESHOLD, SERVICE_SPEND_BONUS, SERVICE_TOOL } from './npc-data';

const allOptions = Object.values(CITIZEN_SCRIPTS).flatMap((s) => s.options);

describe('Nhan vat - chu de tai chinh', () => {
  it('moi nhan vat deu khai bao chu de tai chinh', () => {
    for (const s of Object.values(CITIZEN_SCRIPTS)) {
      assert.ok(s.financeTheme, `${s.id} thieu financeTheme`);
      assert.ok(s.financeTheme.title.length > 0, `${s.id} thieu tieu de chu de`);
      assert.ok(
        s.financeTheme.lesson.length > 40,
        `${s.id} bai hoc qua ngan de khong day duoc gi`,
      );
    }
  });

  it('khong hai nhan vat nao dung chung mot chu de', () => {
    const titles = Object.values(CITIZEN_SCRIPTS).map((s) => s.financeTheme.title);
    assert.equal(
      new Set(titles).size,
      titles.length,
      `trung chu de: ${titles.filter((t, i) => titles.indexOf(t) !== i).join(', ')}`,
    );
  });

  it('chu de phu kin toan mot khái niêm chính', () => {
    // 12 nhan vat phai phu duoc 12 khái niem khac nhau. Trung o 3 nguoi tro
    // xuong la game chua day duoc chung, ma chi con vui.
    const tags = Object.values(CITIZEN_SCRIPTS).map((s) => s.financeTheme.tag);
    assert.equal(
      new Set(tags).size,
      tags.length,
      `nhieu hon mot nhan vat cung mot chi so: ${tags.join(', ')}`,
    );
  });

  it('chi so trong chu de phai la chi so co that trong game', () => {
    for (const s of Object.values(CITIZEN_SCRIPTS)) {
      assert.ok(
        FINANCE_TAG_META[s.financeTheme.tag],
        `${s.id} dung chu de khong ton tai`,
      );
    }
  });
});

describe('Nhan vat - lua chon gan voi chi so', () => {
  it('phan lon cac lua chon deu gan chi so', () => {
    const coTag = allOptions.filter((o) => (o.financeTags?.length ?? 0) > 0).length;
    assert.ok(
      coTag / allOptions.length > 0.75,
      `chi ${coTag}/${allOptions.length} lua chon co chi so tai chinh`,
    );
  });

  it('khong co chi so khong ton tai', () => {
    for (const s of Object.values(CITIZEN_SCRIPTS)) {
      for (const o of s.options) {
        for (const t of o.financeTags ?? []) {
          assert.ok(FINANCE_TAG_META[t], `${s.id}/${o.id}: chi so ${t} khong co nhan`);
        }
      }
    }
  });

  it('nhan docc duoc o moi nhan vat', () => {
    for (const s of Object.values(CITIZEN_SCRIPTS)) {
      assert.ok(
        s.options.some((o) => (o.financeTags?.length ?? 0) > 0),
        `${s.id} khong co lua chon nao gan chi so`,
      );
    }
  });

  it('khong gan chieu mua thuong cho chu de rui ro lon', () => {
    // `rewardBonus` la TIEN THUONG. Gop no vao bai hoc ve NPL/BAO_HIEM/FRAUD
    // day nguoi choi hieu nham rang phong bao hiem cung la cach ban tien thuong.
    const ruiRo = new Set(['NPL', 'FRAUD', 'BAO_HIEM', 'LANH_VAY']);
    for (const s of Object.values(CITIZEN_SCRIPTS)) {
      if (!ruiRo.has(s.financeTheme.tag)) continue;
      for (const o of s.options) {
        assert.ok(
          !o.rewardBonus,
          `${s.id}/${o.id}: nhan mang chu de "${s.financeTheme.title}" lai trao tien thuong`,
        );
      }
    }
  });
});

describe('Nhan vat - lien he dich vu that cua MoMo', () => {
  it('dich vu cong trinh quyet dinh muc thuong phai duoc cap', () => {
    for (const [id, arch] of Object.entries(ARCHETYPES)) {
      for (const svc of arch.startServices) {
        assert.ok(SERVICE_SPEND_BONUS[svc] > 0, `${id}: dich vu ${svc} khong tang suc chi`);
      }
    }
  });

  it('moi dich vu duoc cap deu co cong cu that tren momo.vn', () => {
    for (const arch of Object.values(ARCHETYPES)) {
      for (const svc of arch.startServices) {
        assert.ok(SERVICE_TOOL[svc], `dich vu ${svc} chua gan URL cong cu`);
      }
    }
  });

  it('ngan muc tin cay con dung nguong mo QR', () => {
    // Neu nguong mo QR khong con 60, ma lai co NPC de trust 80 thi se co
    // nguoi ao dong so sanh - nguoi choi tinh khong ra ly do.
    const sanDienThoat = Object.entries(ARCHETYPES).filter(([, a]) => a.startTrust >= DIGITAL_TRUST_THRESHOLD);
    for (const [id, a] of sanDienThoat) {
      assert.ok(
        a.startServices.includes('QR_PAYMENT'),
        `${id} da tin cay muc chuyen so nhung lai chua co QR`,
      );
    }
  });
});

describe('Thoai ambient - lien he trang thai that cua NPC', () => {
  it('moi kieu nhan vat deu it nhat mot o thoai khi chua duoc mo dich vu', () => {
    for (const [id, pool] of Object.entries(AMBIENT)) {
      const soDong = (pool.cash?.length ?? 0) + (pool.plain?.length ?? 0);
      assert.ok(soDong > 0, `${id} khong co thoai o trang thai chua doi mo`);
    }
  });

  it('moi kieu nhan vat deu co thoai o trang thai da duoc phuc vu', () => {
    for (const [id, pool] of Object.entries(AMBIENT)) {
      const soDong = (pool.digital?.length ?? 0) + (pool.served?.length ?? 0);
      assert.ok(soDong > 0, `${id} khong co thoai o trang thai da doi mo`);
    }
  });

  it('thoai khoe uyen keo theo so sanh tien mat', () => {
    // Khach chua chuyen so chua bao gio quen "khong tien mat", neu khong game
    // day nguoc lai: dung app cham hon tien mat roi.
    for (const [id, pool] of Object.entries(AMBIENT)) {
      for (const line of pool.digital ?? []) {
        assert.ok(
          line.length > 10,
          `${id}: thoai chuyen so qua ngan`,
        );
      }
    }
  });
});
