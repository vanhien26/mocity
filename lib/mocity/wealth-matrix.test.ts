import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateWealthMatrix, evaluateEndingProfile } from './wealth-matrix';
import { INITIAL_NPC_LEDGERS, grantNpcLoan, investNpcEquity } from './npc-micro-economy';
import { INITIAL_MOMO_FINANCIAL_OS } from './momo-financial-os';
import { OPPORTUNITY_CARDS, BLACK_SWAN_EVENTS } from './opportunity-cards';

describe('Narrative Game Story & Wealth Matrix System', () => {
  test('calculateWealthMatrix calculates 7 metrics correctly', () => {
    const metrics = calculateWealthMatrix({
      playerCoins: 100_000_000,
      totalDebtCoins: 20_000_000,
      monthlyBuildingYieldCoins: 30_000_000,
      monthlyBuildingOpexCoins: 10_000_000,
      totalBuildingValuationCoins: 200_000_000,
      happinessIndex: 85,
      npcLedgers: INITIAL_NPC_LEDGERS,
      momoOS: INITIAL_MOMO_FINANCIAL_OS,
    });

    assert.equal(metrics.totalAssetsValuation, 300_000_000);
    assert.ok(metrics.monthlyNetCashflow > 0);
    assert.ok(metrics.liquidityRatio > 0);
    assert.ok(metrics.debtToAssetRatio > 0);
    assert.equal(metrics.citizenHappinessIndex, 85);
  });

  test('evaluateEndingProfile returns Fragile Empire when debt ratio is high', () => {
    const ending = evaluateEndingProfile({
      totalAssetsValuation: 1_000_000_000,
      monthlyNetCashflow: -10_000_000,
      liquidityRatio: 0.1,
      debtToAssetRatio: 0.5,
      portfolioRiskIndex: 80,
      citizenHappinessIndex: 50,
      legacyScore: 40,
    });

    assert.equal(ending.id, 'FRAGILE_EMPIRE');
    assert.equal(ending.title, 'Đế Chế Mong Manh');
  });

  test('evaluateEndingProfile returns Resilient Estate when balanced', () => {
    const ending = evaluateEndingProfile({
      totalAssetsValuation: 1_000_000_000,
      monthlyNetCashflow: 50_000_000,
      liquidityRatio: 2.5,
      debtToAssetRatio: 0,
      portfolioRiskIndex: 20,
      citizenHappinessIndex: 90,
      legacyScore: 90,
    });

    assert.equal(ending.id, 'RESILIENT_ESTATE');
    assert.equal(ending.title, 'Cơ Đồ Bền Vững');
  });

  test('NPC Micro-Economy loan and equity investment logic', () => {
    let namLedger = INITIAL_NPC_LEDGERS.find((n) => n.npcId === 'GIG_WORKER')!;
    assert.equal(namLedger.playerLoan, null);

    namLedger = grantNpcLoan(namLedger, 20_000_000, 0.02, 6);
    assert.ok(namLedger.playerLoan);
    assert.equal(namLedger.playerLoan.amount, 20_000_000);

    namLedger = investNpcEquity(namLedger, 30_000_000, 25);
    assert.ok(namLedger.playerEquity);
    assert.equal(namLedger.playerEquity.ownershipPct, 25);
  });

  test('Diverse 10 NPC roster with personalities, mood and supply chain relations', () => {
    assert.equal(INITIAL_NPC_LEDGERS.length, 10);
    
    const nam = INITIAL_NPC_LEDGERS.find((n) => n.npcId === 'GIG_WORKER')!;
    const lan = INITIAL_NPC_LEDGERS.find((n) => n.npcId === 'LOCAL_BAKER')!;
    
    assert.equal(nam.familyTies[0].relatedNpcId, 'LOCAL_BAKER');
    assert.equal(lan.familyTies[0].relatedNpcId, 'GIG_WORKER');
    assert.ok(nam.bioQuote.length > 0);
    assert.ok(lan.businessRelations.length > 0);
  });

  test('Opportunity cards and Black swan events exist', () => {
    assert.ok(OPPORTUNITY_CARDS.length >= 7);
    assert.ok(BLACK_SWAN_EVENTS.length >= 3);

    const act1Card = OPPORTUNITY_CARDS.find((c) => c.act === 'ACT_1_STARTER');
    assert.ok(act1Card);
    assert.ok(act1Card.choices.length >= 2);
  });
});

