import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerMicroQuiz,
  buyMoMoInsurancePackage,
  depositSavings,
  getCityState,
  harvestManual,
  hydrateCity,
  investFund,
  repayLoan,
  resolveIncident,
  settleFund,
  spawnRandomIncident,
  takeLoan,
  withdrawSavings,
} from './store';
import { formatVND, formatVNDCompact } from './currency';

test('VNĐ Currency formatting test', () => {
  assert.equal(formatVND(50_000), '50.000đ');
  assert.equal(formatVND(15_000_000), '15.000.000đ');
  assert.equal(formatVNDCompact(50_000), '50K');
  assert.equal(formatVNDCompact(15_000_000), '15.000K');
});

test('Manual Harvest with Action Points (AP) and Dopamine Loop', () => {
  hydrateCity('test-finance-user');
  const initial = getCityState();
  const initialAp = initial.ap ?? 50;
  const initialCoins = initial.coins;

  assert.ok(initialAp > 0, 'AP should be greater than 0');

  const harvest = harvestManual();
  assert.equal(harvest.ok, true, 'Harvest should succeed');
  assert.ok(harvest.earned > 0, 'Earned VNĐ must be positive');
  assert.ok(harvest.bonus > 0, 'Bonus VNĐ must be positive');

  const after = getCityState();
  assert.equal(after.ap, initialAp - 1, '1 AP should be deducted');
  assert.ok(after.coins > initialCoins, 'Coins should increase');
});

test('MoMo Savings Loop: Deposit, Interest & Financial Discipline', () => {
  hydrateCity('test-savings-user');
  const initial = getCityState();

  // Mở sổ 100K kỳ hạn 1 Ngày (2%)
  const res = depositSavings(100_000, '1D');
  assert.equal(res.ok, true);

  const state1 = getCityState();
  assert.equal(state1.savingsBalance, 100_000);
  assert.equal(state1.savingsTier, '1D');

  // Rút sớm (ngay lập tức) -> Lãi 0%, nhận lại 100K gốc
  const earlyWithdraw = withdrawSavings();
  assert.equal(earlyWithdraw.ok, true);
  assert.equal(earlyWithdraw.isEarly, true);
  assert.equal(earlyWithdraw.interest, 0, 'Early withdrawal must yield 0 interest');
  assert.equal(earlyWithdraw.principal, 100_000);

  const state2 = getCityState();
  assert.equal(state2.savingsBalance, 0);
  assert.equal(state2.savingsTier, 'NONE');
});

test('MoMo Investment Funds: Asset Allocation & Fluctuation', () => {
  hydrateCity('test-fund-user');

  // Đầu tư 200.000đ vào Quỹ An Toàn (SAFE)
  const res = investFund('SAFE', 200_000);
  assert.equal(res.ok, true);

  const state1 = getCityState();
  assert.equal(state1.investedAmount, 200_000);
  assert.equal(state1.investedFundId, 'SAFE');

  // Chốt danh mục
  const settle = settleFund();
  assert.equal(settle.ok, true);
  assert.ok(settle.returned > 0);
  assert.ok(settle.profit > 0, 'Safe fund target +5% should yield positive return');

  const state2 = getCityState();
  assert.equal(state2.investedAmount, 0);
  assert.equal(state2.investedFundId, 'NONE');
});

test('MoMo Insurance & Incident Management Loop', () => {
  hydrateCity('test-incident-user');

  // Mua bảo hiểm phố thị 2Mđ
  const insRes = buyMoMoInsurancePackage(2_000_000);
  assert.equal(insRes.ok, true);

  const state1 = getCityState();
  assert.equal(state1.hasInsurance, true);
  assert.ok((state1.insuranceActiveUntilMs ?? 0) > Date.now());

  // Thử sinh sự cố nếu có công trình
  if (state1.buildings.length > 0) {
    const inc = spawnRandomIncident();
    if (inc) {
      assert.ok(inc.id);
      // Giải quyết sự cố khi đã có bảo hiểm
      const res = resolveIncident(inc.id);
      assert.equal(res.ok, true);
      assert.equal(res.coveredByInsurance, true, 'Insurance must cover 100% loss');
      assert.equal(res.cost, 0, 'Out-of-pocket cost should be 0đ with insurance');
    }
  }
});

test('Micro-Quiz: Financial Knowledge Rewards', () => {
  hydrateCity('test-quiz-user');
  const before = getCityState();
  const beforeCoins = before.coins;
  const beforeMP = before.mayorPoints ?? 100;

  const quizRes = answerMicroQuiz(true, 50_000, 20);
  assert.equal(quizRes.ok, true);

  const after = getCityState();
  assert.equal(after.coins, beforeCoins + 50_000);
  assert.equal(after.mayorPoints, beforeMP + 20);
});
