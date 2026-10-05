import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TUTORIAL_STEPS, currentTutorialStep, hasFlag } from './tutorial';
import { BUILDING_BY_ID } from './mock-city-data';
import type { BuildingNode, CityState } from './types';

function node(defId: string, level = 1): BuildingNode {
  assert.ok(BUILDING_BY_ID[defId], `thieu cong trinh ${defId}`);
  return {
    id: `${defId}_0_0`,
    defId,
    col: 0,
    row: 0,
    level,
    starRating: 1,
    lastCollectedAt: 0,
    modules: [],
  };
}

/** State toi thieu du cho cac dieu kien huong dan doc. */
function st(over: Partial<CityState> = {}): CityState {
  return {
    buildings: [],
    tutorialStep: 0,
    tutorialFlags: [],
    dailyLog: { day: '', built: 0, upgraded: 0, talked: 0, eventsResolved: 0, starEvolved: 0, idleXp: 0, claimed: [] },
    eventLog: { day: '', resolved: 0 },
    ...over,
  } as unknown as CityState;
}

const buoc = (id: string) => {
  const s = TUTORIAL_STEPS.find((x) => x.id === id);
  assert.ok(s, `thieu buoc ${id}`);
  return s;
};

describe('cau truc huong dan', () => {
  it('moi buoc co du viec can lam va bai hoc', () => {
    for (const s of TUTORIAL_STEPS) {
      assert.ok(s.title.length > 0, `${s.id} thieu tieu de`);
      assert.ok(s.how.length > 0, `${s.id} thieu huong dan thao tac`);
      assert.ok(s.lesson.length > 40, `${s.id} bai hoc qua ngan, khong day duoc gi`);
    }
  });

  it('id khong trung nhau', () => {
    const ids = TUTORIAL_STEPS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('khong buoc nao tu dung dieu kien da thoa san', () => {
    // Pho rong thi khong buoc nao duoc coi la xong san.
    const trong = st();
    for (const s of TUTORIAL_STEPS) {
      assert.equal(s.done(trong), false, `${s.id} xong san khi chua lam gi`);
    }
  });
});

describe('dieu kien tung buoc', () => {
  it('mo tiem: can mot cong trinh thuong mai, nha o khong tinh', () => {
    const b = buoc('mo-tiem');
    assert.equal(b.done(st({ buildings: [node('nha-pho-binh-dan')] })), false);
    assert.equal(b.done(st({ buildings: [node('quan-ca-phe')] })), true);
  });

  it('mo tiem thu hai: can it nhat 2 cong trinh, 1 tiem chua du', () => {
    const b = buoc('mo-tiem-2');
    assert.equal(b.done(st({ buildings: [node('quan-ca-phe')] })), false);
    assert.equal(
      b.done(st({ buildings: [node('quan-ca-phe'), node('sieu-thi')] })),
      true,
    );
    /*
     * Nhà của thành phố (NPC) KHÔNG được tính - chúng nằm trong
     * `cityBuildings`, không nằm trong `buildings`. Điều kiện này chỉ đọc
     * `buildings` nên mặc định đã đúng; assertion dưới đây khoá lại để
     * không ai lỡ đưa NPC quay vào mảng tài sản người chơi.
     */
    assert.equal(
      b.done(
        st({
          buildings: [node('quan-ca-phe')],
          cityBuildings: [node('nha-pho-binh-dan')],
        }),
      ),
      false,
      'nhà thành phố không làm bước mở tiệm thứ hai hoàn thành',
    );
  });

  it('nang cap: cap 1 chua tinh, cap 2 moi tinh', () => {
    const b = buoc('nang-cap');
    assert.equal(b.done(st({ buildings: [node('quan-ca-phe', 1)] })), false);
    assert.equal(b.done(st({ buildings: [node('quan-ca-phe', 2)] })), true);
  });

  it('doc so cai: chi xong khi co moc tu UI', () => {
    const b = buoc('doc-so-cai');
    assert.equal(b.done(st({ buildings: [node('quan-ca-phe', 9)] })), false);
    assert.equal(b.done(st({ tutorialFlags: ['ledger'] })), true);
  });

  it('xem tiem: chi xong khi co moc inspector tu UI', () => {
    const b = buoc('xem-tiem');
    assert.equal(b.done(st({ buildings: [node('quan-ca-phe', 1)] })), false);
    assert.equal(b.done(st({ tutorialFlags: ['inspector'] })), true);
  });

  it('thue nv: can it nhat 1 nhan vien dung quay', () => {
    const b = buoc('thue-nv');
    assert.equal(b.done(st({ buildings: [node('quan-ca-phe', 1)] })), false);
    assert.equal(b.done(st({ buildings: [{ ...node('quan-ca-phe', 1), staffCount: 1 }] })), true);
  });
});

describe('dieu huong buoc', () => {
  it('step -1 nghia la da xong, khong con buoc nao', () => {
    assert.equal(currentTutorialStep(st({ tutorialStep: -1 })), null);
  });

  it('step vuot bien cung tra ve null thay vi loi', () => {
    assert.equal(currentTutorialStep(st({ tutorialStep: 999 })), null);
  });

  it('step 0 tra ve buoc dau tien', () => {
    assert.equal(currentTutorialStep(st({ tutorialStep: 0 })), TUTORIAL_STEPS[0]);
  });

  it('hasFlag chiu duoc tutorialFlags thieu', () => {
    assert.equal(hasFlag(st({ tutorialFlags: undefined as never }), 'ledger'), false);
  });
});
