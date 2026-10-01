import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BUILDING_BY_ID } from './mock-city-data';
import type { BuildingNode } from './types';

/** Mot lot dat tren pho. Khop voi `PLOT_WIDTH` trong `ViaHeStreetBoard`. */
const PLOT_WIDTH = 236;
/** Toi da bao gio render 10 lot/hang (giai han `gridSize`). */
const MAX_PLOTS_PER_ROW = 10;

interface PlotCoord {
  col: number;
  row: number;
}

/**
 * Lao chuc cua `streetPlots` trong `ViaHeStreetBoard.tsx`: dung MOT hang pho tai
 * mot thoi diem, lay tat ca cot cua hang do theo thu tu khong gian.
 *
 * Ban <= 3 dung `coords.slice(0, 10)` tren toan bo luoi da flatten, nen o dat
 * so 11-16 (va 17-100 sau khi mo rong pho) khong bao gio duoc render: nguoi
 * choi xay 16 tiem thi 6 tiem bien mat khoi man hinh, khong co dau hieu gi.
 * Layout moi phai bao dam moi o da xay deu tim thay duoc.
 */
function plotsForRow(
  row: number,
  unlockedCols: number,
  buildings: BuildingNode[],
): PlotCoord[] {
  const colCount = Math.max(4, unlockedCols);
  const bMap = new Map(buildings.map((b) => [b.id, b]));
  void bMap;
  const plots: PlotCoord[] = [];
  for (let c = 0; c < colCount; c++) {
    plots.push({ col: c, row });
  }
  return plots;
}

function node(col: number, row: number, defId = 'quan-ca-phe'): BuildingNode {
  return {
    id: `${defId}_${col}_${row}`,
    defId,
    col,
    row,
    level: 1,
    starRating: 1,
    lastCollectedAt: 0,
    modules: [],
  };
}

describe('pho theo hang - moi o dat deu tim thay duoc', () => {
  it('khoi tao 4x4: 16 o deu co the xem qua cac hang', () => {
    const cols = 4;
    const rows = 4;
    const buildings = [
      node(0, 0), node(1, 0), node(2, 0), node(3, 0),
      node(0, 1), node(1, 1), node(2, 1), node(3, 1),
      node(0, 2), node(1, 2), node(2, 2), node(3, 2),
      node(0, 3), node(1, 3), node(2, 3), node(3, 3),
    ];
    assert.equal(buildings.length, 16, 'vi du mo pho toi da');

    const visible = new Set<string>();
    for (let r = 0; r < rows; r++) {
      for (const p of plotsForRow(r, cols, buildings)) {
        visible.add(`${p.col}:${p.row}`);
      }
    }

    for (const b of buildings) {
      assert.ok(
        visible.has(`${b.col}:${b.row}`),
        `o dat ${b.col}:${b.row} da xay nhung khong xuat hien o bat ky hang nao`,
      );
    }
    assert.equal(visible.size, 16, 'khong o dat nao bi an');
  });

  it('mo rong toi 10x10: 100 o deu trai qua duoc', () => {
    const cols = 10;
    const rows = 10;
    const buildings: BuildingNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) buildings.push(node(c, r));
    }

    const seen = new Set<string>();
    for (let r = 0; r < rows; r++) {
      const plots = plotsForRow(r, cols, buildings);
      for (const p of plots) seen.add(`${p.col}:${p.row}`);
    }
    assert.equal(seen.size, 100);
  });

  it('DOM khong phong to so voi ban cu', () => {
    // 10 lot/hang x 178 node = 1.780, dung bang layout cu toi da.
    for (const cols of [4, 6, 10]) {
      const plots = plotsForRow(0, cols, []);
      assert.ok(
        plots.length <= MAX_PLOTS_PER_ROW,
        `hang 0 rong ${plots.length} lot, vuot tran ${MAX_PLOTS_PER_ROW}`,
      );
      assert.ok(
        plots.length * PLOT_WIDTH <= 10 * PLOT_WIDTH,
        'be rong pho phai nho hon layout cu',
      );
    }
  });
});

describe('pho theo hang - thu tu khong gian duoc giu nguyen', () => {
  it('so nha chay dung chieu ngang, khong bi sap xep lai', () => {
    // So nha gan voi o dat: o (col=2,row=1) phai ra 2*2 + 1*20 + 2 = 26
    const houseNumberFor = (col: number, row: number) => col * 2 + row * 20 + 2;
    assert.equal(houseNumberFor(0, 0), 2);
    assert.equal(houseNumberFor(2, 1), 26);
    assert.equal(houseNumberFor(9, 9), 200);
  });

  it('khac hang thi so nha khac nhau', () => {
    const houseNumberFor = (col: number, row: number) => col * 2 + row * 20 + 2;
    assert.notEqual(houseNumberFor(0, 0), houseNumberFor(0, 1));
    assert.notEqual(houseNumberFor(3, 0), houseNumberFor(0, 1));
  });

  it('cung mot o dat luon ra cung so nha qua cac lan render', () => {
    const houseNumberFor = (col: number, row: number) => col * 2 + row * 20 + 2;
    const before = houseNumberFor(3, 2);
    // Xay them nhieu tiem o cho khac khac
    const buildings = [node(0, 0), node(1, 0), node(2, 0), node(3, 0), node(0, 1)];
    assert.equal(houseNumberFor(3, 2), before, 'so nha khong doi khi danh sach pho thay doi');
    assert.equal(buildings.length, 5);
  });
});

describe('pho theo hang - chi mo so cot da quyet dinh', () => {
  it('luon it nhat 4 cot de thay dat chua mo', () => {
    for (const cols of [1, 2, 3, 4]) {
      assert.equal(plotsForRow(0, cols, []).length, 4);
    }
    assert.equal(plotsForRow(0, 5, []).length, 5);
  });

  it('chi cong cot da mo, khong mo o dat chua gia nhan', () => {
    const plots = plotsForRow(0, 5, []);
    assert.equal(plots.filter((p) => p.col < 5).length, 5);
    assert.ok(plots.every((p) => p.row === 0), 'chi mot hang pho duoc render');
  });
});

describe('pho theo hang - id cong trinh phai ton tai', () => {
  it('khong co o dat nao tro toi cong trinh da xoa', () => {
    // Hai lan migration lien tiep co the giu lai o dat cua version da go
    for (const defId of ['quan-ca-phe', 'thap-momo']) {
      assert.ok(BUILDING_BY_ID[defId], `cong trinh mau ${defId} khong ton tai`);
    }
  });
});