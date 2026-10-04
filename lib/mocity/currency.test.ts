import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatVND,
  formatVNDCompact,
  formatVNDPerSecond,
  roundVND,
  CURRENCY_UNIT,
  VND_ROUNDING,
} from './currency';

describe('currency.ts - định dạng VNĐ', () => {
  it('formatVND: số đầy đủ có dấu đ', () => {
    assert.equal(formatVND(0), `0${CURRENCY_UNIT}`);
    assert.equal(formatVND(999), '999đ');
    assert.equal(formatVND(1000), '1.000đ');
    assert.equal(formatVND(-1500), '-1.500đ');
    assert.equal(formatVND(1_500_000), '1.500.000đ');
    assert.equal(formatVND(1e9), '1.000.000.000đ');
  });

  it('formatVNDCompact: chỉ dừng lại ở K (không dùng M và B), ví dụ 60.000K', () => {
    assert.equal(formatVNDCompact(0), '0');
    assert.equal(formatVNDCompact(999), '999');
    assert.equal(formatVNDCompact(1500), '1.5K');
    assert.equal(formatVNDCompact(100000), '100K');
    assert.equal(formatVNDCompact(150000), '150K');
    assert.equal(formatVNDCompact(999499), '999K');
    assert.equal(formatVNDCompact(999500), '1.000K');
    assert.equal(formatVNDCompact(1e6), '1.000K');
    assert.equal(formatVNDCompact(1.5e6), '1.500K');
    assert.equal(formatVNDCompact(15e6), '15.000K');
    assert.equal(formatVNDCompact(22e6), '22.000K');
    assert.equal(formatVNDCompact(50e6), '50.000K');
    assert.equal(formatVNDCompact(60e6), '60.000K');
    assert.equal(formatVNDCompact(1e9), '1.000.000K');
    assert.equal(formatVNDCompact(1.2345e9), '1.234.500K');
    assert.equal(formatVNDCompact(2.5e9), '2.500.000K');
    assert.equal(formatVNDCompact(3.8e9), '3.800.000K');
    assert.equal(formatVNDCompact(1e12), '1.000.000.000K');
    assert.equal(formatVNDCompact(-1e6), '-1.000K');
    assert.equal(formatVNDCompact(-60e6), '-60.000K');
    assert.equal(formatVNDCompact(-1500), '-1.5K');
  });

  it('formatVNDPerSecond: rút gọn dạng K và /s', () => {
    assert.equal(formatVNDPerSecond(0), '0/s');
    assert.equal(formatVNDPerSecond(850), '850/s');
    assert.equal(formatVNDPerSecond(4000), '4K/s');
    assert.equal(formatVNDPerSecond(15000), '15K/s');
    assert.equal(formatVNDPerSecond(48000), '48K/s');
    assert.equal(formatVNDPerSecond(1.5e6), '1.500K/s');
    assert.equal(formatVNDPerSecond(22e6), '22.000K/s');
    assert.equal(formatVNDPerSecond(30e6), '30.000K/s');
  });

  it('roundVND: làm tròn xuống 1.000', () => {
    assert.equal(roundVND(0), 0);
    assert.equal(roundVND(999), 1000);
    assert.equal(roundVND(1000), 1000);
    assert.equal(roundVND(12345), 12000);
    assert.equal(roundVND(1.5e6), 1500000);
    assert.equal(roundVND(-12345), 12000);
  });

  it('hằng số đúng kiểu', () => {
    assert.equal(CURRENCY_UNIT, 'đ');
    assert.equal(VND_ROUNDING, 1000);
  });
});
