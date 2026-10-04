import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CITIZEN_ROSTER,
  CITIZEN_BY_ID,
  MANAGER_APPEARANCES,
  ADVISOR_APPEARANCES,
  resolveCharacterAppearance,
} from './character-roster';
import { CITIZEN_SCRIPTS } from './citizen-scenarios';
import { STORE_MANAGERS } from './mock-city-data';
import { CITY_ADVISORS } from './npc-data';

describe('Character Roster - SSOT \u0026 Consistency', () => {
  it('15 cu dan tren pho deu co day du kich ban trong CITIZEN_SCRIPTS', () => {
    assert.equal(CITIZEN_ROSTER.length, 15);
    for (const citizen of CITIZEN_ROSTER) {
      assert.ok(CITIZEN_SCRIPTS[citizen.id], `Thieu kich ban cho cu dan ${citizen.id}`);
      assert.equal(CITIZEN_SCRIPTS[citizen.id].name, citizen.name);
    }
  });

  it('tat ca 6 Quan Ly deu co ngoai hinh chuan', () => {
    for (const mgr of STORE_MANAGERS) {
      const app = MANAGER_APPEARANCES[mgr.id];
      assert.ok(app, `Thieu ngoai hinh cho quan ly ${mgr.id}`);
      assert.ok(app.hairStyle);
      assert.ok(app.shirtColor);
      assert.ok(app.skinColor);
    }
  });

  it('tat ca 8 Co Van Do Thi deu co ngoai hinh chuan', () => {
    for (const adv of CITY_ADVISORS) {
      const app = ADVISOR_APPEARANCES[adv.id];
      assert.ok(app, `Thieu ngoai hinh cho co van ${adv.id}`);
      assert.ok(app.hairStyle);
      assert.ok(app.shirtColor);
      assert.ok(app.skinColor);
    }
  });

  it('resolveCharacterAppearance giai ma dung nhan vat tu chuoi ten phuc tap', () => {
    // 1. Cặp đối thoại ghép
    const thaoApp = resolveCharacterAppearance('Chị Thảo Văn Phòng \u0026 Bảo Ngọc KOC');
    assert.equal(thaoApp.shirtColor, CITIZEN_BY_ID['cit-chi-thao'].shirtColor);
    assert.equal(thaoApp.hairStyle, 'BUN');

    // 2. Tên kèm công việc
    const locApp = resolveCharacterAppearance('Ông Lộc bán vé số');
    assert.equal(locApp.hairStyle, 'BALD_GLASSES');
    assert.equal(locApp.shirtColor, '#D97706');

    // 3. Cô Tư
    const tuApp = resolveCharacterAppearance('Cô Tư Bún Riêu');
    assert.equal(tuApp.hairStyle, 'HEADSCARF');

    // 4. Bé Nam
    const namApp = resolveCharacterAppearance('Bé Nam GenZ \u0026 Bác Tài');
    assert.equal(namApp.hairStyle, 'CAP_YELLOW');

    // 5. Cô Sáu Lao Công
    const sauApp = resolveCharacterAppearance('Cô Sáu Lao Công');
    assert.equal(sauApp.outfitType, 'CLEANER');
    assert.equal(sauApp.heldItem, 'BROOM');
  });

  it('resolveCharacterAppearance fallback on dinh cho NPC khong xac dinh', () => {
    const unknown1 = resolveCharacterAppearance('Khách Vãng Lai A');
    const unknown2 = resolveCharacterAppearance('Khách Vãng Lai A');
    assert.deepEqual(unknown1, unknown2);
  });
});
