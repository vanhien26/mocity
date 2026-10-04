/**
 * Khoá lại nhịp đi bộ.
 *
 * Lỗi "nhân vật đi như bay" đã lọt HAI lần: lần đầu vì nhịp chân gán cứng
 * theo tốc độ danh nghĩa, lần hai vì sải chân chỉ với được một nửa quãng
 * đường thân đi. Cả hai lần đều không có gì bắt được, vì không có test nào
 * đụng tới hình ảnh. File này chốt đúng một ràng buộc: bàn chân phải quét
 * đủ quãng mà thân di chuyển.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CYCLE_K,
  LEG_LEN,
  PHASE_PER_PX,
  PX_PER_SPEED,
  STRIDE_PX,
  SWING_DEG,
  cycleSeconds,
  groundPerStep,
} from './walk-cycle';

/** Dải tốc độ thật của cư dân trong `ExpressiveStreetCitizens`. */
const SPEEDS = [0.17, 0.28, 0.3, 0.36, 0.4, 0.44, 0.5];

describe('Nhip di bo - sai chan phai khop quang duong', () => {
  it('moi toc do: quang than di mot buoc = quang ban chan quet duoc', () => {
    for (const speed of SPEEDS) {
      const ground = groundPerStep(speed);
      assert.ok(
        Math.abs(ground - STRIDE_PX) < 1e-9,
        `speed ${speed}: than di ${ground.toFixed(2)}px mot buoc nhung chan chi voi ${STRIDE_PX.toFixed(2)}px`,
      );
    }
  });

  it('STRIDE_PX dung bang hinh hoc cua chan dang ve', () => {
    const expected = 2 * LEG_LEN * Math.sin((SWING_DEG * Math.PI) / 180);
    assert.ok(Math.abs(STRIDE_PX - expected) < 1e-9);
    // Neu ai do doi `dai`/goc xoay ma quen sua day, con so nay se bat.
    assert.ok(STRIDE_PX > 14 && STRIDE_PX < 16, `STRIDE_PX = ${STRIDE_PX}`);
  });

  it('ban cu (--spd = 0.6/speed) that su lam than di gap doi sai chan', () => {
    // Ghim lai chinh con so cu de khong ai "sua nguoc" ve 0.6.
    const speed = 0.4;
    const cuGround = (speed * PX_PER_SPEED * (0.6 / speed)) / 2;
    assert.ok(
      cuGround > STRIDE_PX * 1.9,
      `ban cu di ${cuGround.toFixed(1)}px/buoc so voi sai chan ${STRIDE_PX.toFixed(1)}px`,
    );
  });

  it('CYCLE_K khong phu thuoc toc do - mot he so dung cho ca pho', () => {
    const ratios = SPEEDS.map((s) => cycleSeconds(s) * s);
    for (const r of ratios) assert.ok(Math.abs(r - CYCLE_K) < 1e-9);
  });

  it('nhip buoc nam trong khoang doc duoc, khong giat cung cung khong le te', () => {
    for (const speed of SPEEDS) {
      const stepsPerSec = 2 / cycleSeconds(speed);
      assert.ok(
        stepsPerSec > 0.8 && stepsPerSec < 4,
        `speed ${speed}: ${stepsPerSec.toFixed(2)} buoc/giay`,
      );
    }
  });

  it('mot buoc lam walkPhase tien dung PI - tuc dung MOT cai nhun', () => {
    const phase = PHASE_PER_PX * STRIDE_PX;
    assert.ok(Math.abs(phase - Math.PI) < 1e-9, `mot buoc tien ${phase} rad, phai la PI`);
  });

  it('dung yen thi khong nhun: phase khong tien khi khong di', () => {
    assert.equal(PHASE_PER_PX * 0, 0);
    assert.equal(groundPerStep(0), 0);
    assert.equal(cycleSeconds(0), 0);
  });
});
