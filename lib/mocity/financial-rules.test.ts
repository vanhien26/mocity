import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkFraudRiskForBuilding,
  calculateMayorTrustScore,
  calculateCashflowRatio,
  calculateTuiThanTaiInterest,
  calculateInsuranceCoverage,
} from './city-calculator';
import type { BuildingNode } from './types';

describe('Luật Chơi Tài Chính MoCity (Financial Game Rules)', () => {
  describe('Luật 3: Loa Thần Tài & Chặn Nạn Bill Photoshop', () => {
    const tiệmKhôngLoa: BuildingNode = {
      id: 'b-tiem-tap-hoa',
      defId: 'tiem-tap-hoa-chu-bay',
      col: 0,
      row: 0,
      level: 2,
      starRating: 1,
      lastCollectedAt: Date.now(),
      modules: [],
    };

    const tiệmCóLoa: BuildingNode = {
      id: 'b-quan-bun-bo',
      defId: 'quan-bun-bo-co-ba',
      col: 0,
      row: 1,
      level: 2,
      starRating: 1,
      lastCollectedAt: Date.now(),
      modules: ['QR_LOA_THAN_TAI'],
    };

    it('Tiệm KHÔNG có Loa Thần Tài bị mất tiền khi dính chiêu bill giả', () => {
      // randomRoll = 0.05 < 0.12 (có rủi ro bill giả)
      const res = checkFraudRiskForBuilding(tiệmKhôngLoa, 25, 0.05);
      assert.equal(res.hasFraudAttempt, true);
      assert.equal(res.blockedByLoa, false);
      assert.ok(res.lostAmount > 0, 'Phải ghi nhận số tiền bị thất thoát');
    });

    it('Tiệm CÓ Loa Thần Tài chặn đứng 100% rủi ro bill giả', () => {
      // randomRoll = 0.05 < 0.12 (có rủi ro bill giả)
      const res = checkFraudRiskForBuilding(tiệmCóLoa, 25, 0.05);
      assert.equal(res.hasFraudAttempt, true);
      assert.equal(res.blockedByLoa, true);
      assert.equal(res.lostAmount, 0, 'Loa Thần Tài triệt tiêu hoàn toàn thiệt hại');
    });

    it('Không có nguy cơ bill giả thì cả 2 tiệm đều bình an vô sự', () => {
      // randomRoll = 0.50 > 0.12
      const res = checkFraudRiskForBuilding(tiệmKhôngLoa, 25, 0.50);
      assert.equal(res.hasFraudAttempt, false);
      assert.equal(res.lostAmount, 0);
    });
  });

  describe('Luật 4: Điểm Tin Cậy MoMo (Mayor Trust Score: 300 - 850)', () => {
    it('Khởi điểm ở mức 650 (Hạng Vàng chuẩn)', () => {
      const score = calculateMayorTrustScore(650, 0, 100000, 0, 80);
      assert.equal(score, 650);
    });

    it('Bị phạt trễ hạn trừ mạnh điểm tin cậy (-35 điểm/lần)', () => {
      const score = calculateMayorTrustScore(650, 0, 100000, 2, 80);
      assert.equal(score, 650 - 70);
    });

    it('Cư dân hạnh phúc cao (>= 85%) cộng thêm điểm tín nhiệm', () => {
      const score = calculateMayorTrustScore(650, 0, 100000, 0, 95);
      assert.equal(score, 670);
    });

    it('Điểm tin cậy không bao giờ vượt ra ngoài dải [300, 850]', () => {
      const minScore = calculateMayorTrustScore(320, 90000, 100000, 5, 20);
      assert.equal(minScore, 300);

      const maxScore = calculateMayorTrustScore(845, 0, 100000, 0, 100);
      assert.equal(maxScore, 850);
    });
  });

  describe('Luật 1: Tỷ Lệ Dòng Tiền Lưu Động (Cashflow Health Ratio)', () => {
    it('Quỹ vận hành dồi dào cho hệ số an toàn cao (> 2.0x)', () => {
      // OPEX = 10 Xu/giây -> Chi phí chu kỳ 60s = 600 Xu. Quỹ = 3000 Xu -> Ratio = 5.0x
      const ratio = calculateCashflowRatio(3000, 10, 0);
      assert.equal(ratio, 5.0);
    });

    it('Quỹ vận hành cạn kiệt cảnh báo nguy cơ đứt gãy dòng tiền (< 1.0x)', () => {
      // Chi phí chu kỳ 60s = 600 Xu. Quỹ = 300 Xu -> Ratio = 0.5x
      const ratio = calculateCashflowRatio(300, 10, 0);
      assert.equal(ratio, 0.5);
    });
  });

  describe('Luật 5: Túi Thần Tài Sinh Lời Trên Dòng Tiền Nhàn Rỗi', () => {
    it('Tiền gửi vào Túi Thần Tài sinh lãi theo thời gian trôi qua', () => {
      // 100.000 Xu gửi trong 86400 giây (1 ngày) với lãi suất 5.5%/năm
      const interest = calculateTuiThanTaiInterest(100000, 86400, 0.055);
      assert.ok(interest > 14 && interest < 16, `Lãi 1 ngày khoảng 15.07 Xu, nhận được: ${interest}`);
    });

    it('Số dư bằng 0 không sinh lãi', () => {
      const interest = calculateTuiThanTaiInterest(0, 3600);
      assert.equal(interest, 0);
    });
  });

  describe('Luật 6: Áo Giáp Bảo Hiểm MoMo Phòng Vệ Thiên Tai', () => {
    it('CÓ bảo hiểm MoMo: Được bồi thường 90% thiệt hại, chỉ chịu 10% khấu trừ', () => {
      const { coveredAmount, outOfPocket } = calculateInsuranceCoverage(10000, true);
      assert.equal(coveredAmount, 9000);
      assert.equal(outOfPocket, 1000);
    });

    it('KHÔNG CÓ bảo hiểm: Phải tự bỏ tiền túi chịu 100% thiệt hại', () => {
      const { coveredAmount, outOfPocket } = calculateInsuranceCoverage(10000, false);
      assert.equal(coveredAmount, 0);
      assert.equal(outOfPocket, 10000);
    });
  });
});
