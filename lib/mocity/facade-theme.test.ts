/**
 * Khoá lại việc MẶT TIỀN PHẢI KHỚP LOẠI CÔNG TRÌNH.
 *
 * Lỗi gốc: `ViaHeStreetBoard` chọn mặt tiền bằng `SHOPHOUSE_THEMES[idx % 7]`
 * với `idx` là SỐ THỨ TỰ Ô ĐẤT, chỉ có 4 nhánh ghi đè riêng. Đo được 9/19
 * công trình lấy mặt tiền theo chỗ đứng - công viên treo biển "MENU · CÀ PHÊ
 * MUỐI", nhà phố in "PHOTOCOPY · ĐÓNG SÁCH", và cùng một công viên xây ở hai
 * ô khác nhau lại ra hai mặt tiền khác nhau.
 *
 * Test này đọc THẲNG mã nguồn thay vì import component React (kéo theo cả
 * cây store/DOM, không chạy được trong node). Bảng tra nằm ở
 * `facade-theme.ts` (dùng chung cho cả ViaHeStreetBoard và StoreInspectorModal),
 * còn logic gán theme theo idx (nhánh ô trống) vẫn ở `ViaHeStreetBoard.tsx`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { BUILDINGS, BUILDING_BY_ID } from './mock-city-data';

const SRC = readFileSync(
  path.join(process.cwd(), 'lib/mocity/facade-theme.ts'),
  'utf8',
);
const SRC_BOARD = readFileSync(
  path.join(process.cwd(), 'components/mocity/ViaHeStreetBoard.tsx'),
  'utf8',
);

/** Trích bảng `THEME_BY_BUILDING` thành map id -> chỉ số theme. */
function bangTra(): Record<string, number> {
  const start = SRC.indexOf('export const THEME_BY_BUILDING');
  assert.ok(start > -1, 'khong con bang THEME_BY_BUILDING - mat tien lai gan theo vi tri?');
  const end = SRC.indexOf('\n};', start);
  const block = SRC.slice(start, end);
  const out: Record<string, number> = {};
  for (const m of block.matchAll(/'([a-z0-9-]+)':\s*SHOPHOUSE_THEMES\[(\d+)\]/g)) {
    out[m[1]] = Number(m[2]);
  }
  return out;
}

/** Chỉ số theme -> `shopType`, đọc theo đúng thứ tự khai báo trong mảng. */
function kieuTheoChiSo(): string[] {
  const start = SRC.indexOf('export const SHOPHOUSE_THEMES');
  const end = SRC.indexOf('\n];', start);
  return [...SRC.slice(start, end).matchAll(/shopType:\s*'([A-Z_]+)'/g)].map((m) => m[1]);
}

describe('Mat tien phai khop loai cong trinh', () => {
  it('KHONG con chon mat tien bang vi tri o dat', () => {
    // `idx % SHOPHOUSE_THEMES.length` chi duoc phep ton tai o nhanh o TRONG
    // (chua xay), khong duoc dung cho cong trinh da xay.
    assert.ok(
      !/const theme = SHOPHOUSE_THEMES\[idx %/.test(SRC_BOARD),
      'theme van dang gan truc tiep theo idx cho cong trinh da xay',
    );
  });

  it('du 19 cong trinh deu co mat tien khai bao tuong minh', () => {
    const map = bangTra();
    const thieu = BUILDINGS.filter((b) => !(b.id in map)).map((b) => b.id);
    assert.deepEqual(thieu, [], `thieu khai bao mat tien: ${thieu.join(', ')}`);
  });

  it('bang tra khong tro toi cong trinh khong ton tai', () => {
    const thua = Object.keys(bangTra()).filter((id) => !BUILDING_BY_ID[id]);
    assert.deepEqual(thua, [], `tro toi id khong co that: ${thua.join(', ')}`);
  });

  it('cong vien / nha o / ky quan KHONG duoc ve thanh cua tiem', () => {
    const map = bangTra();
    const kieu = kieuTheoChiSo();
    const khongPhaiTiem = new Set(['PARK', 'HOME', 'LANDMARK']);

    for (const b of BUILDINGS) {
      if (b.zone !== 'RESIDENTIAL' && b.zone !== 'LANDMARK') continue;
      const t = kieu[map[b.id]];
      assert.ok(
        khongPhaiTiem.has(t),
        `${b.id} (${b.zone}) dang ve bang mat tien '${t}' - do la kieu cua tiem`,
      );
    }
  });

  it('cong trinh COMMERCIAL/FINTECH van phai la kieu cua tiem', () => {
    const map = bangTra();
    const kieu = kieuTheoChiSo();
    const khongPhaiTiem = new Set(['PARK', 'HOME', 'LANDMARK']);

    for (const b of BUILDINGS) {
      if (b.zone !== 'COMMERCIAL' && b.zone !== 'FINTECH') continue;
      const t = kieu[map[b.id]];
      assert.ok(
        !khongPhaiTiem.has(t),
        `${b.id} (${b.zone}) la noi buon ban nhung lai ve kieu '${t}'`,
      );
    }
  });

  it('moi cong trinh FINTECH deu dung mat tien tai chinh', () => {
    const map = bangTra();
    const kieu = kieuTheoChiSo();
    for (const b of BUILDINGS.filter((x) => x.zone === 'FINTECH')) {
      assert.equal(kieu[map[b.id]], 'FINTECH', `${b.id} phai la mat tien FINTECH`);
    }
  });
});
