import type { EndingEvaluation, EndingProfileId, MomoFinancialOSState, NpcMicroLedger, WealthMatrixMetrics } from './types';

/**
 * Tính toán 7 chỉ số trong WEALTH MATRIX dựa trên trạng thái tài chính & thị trấn
 */
export function calculateWealthMatrix(params: {
  playerCoins: number;
  totalDebtCoins: number;
  monthlyBuildingYieldCoins: number;
  monthlyBuildingOpexCoins: number;
  totalBuildingValuationCoins: number;
  happinessIndex: number;
  npcLedgers: NpcMicroLedger[];
  momoOS: MomoFinancialOSState;
}): WealthMatrixMetrics {
  const {
    playerCoins,
    totalDebtCoins,
    monthlyBuildingYieldCoins,
    monthlyBuildingOpexCoins,
    totalBuildingValuationCoins,
    happinessIndex,
    npcLedgers,
    momoOS,
  } = params;

  // 1. Cổ tức từ NPC Equity
  const monthlyNpcDividends = npcLedgers.reduce((acc, npc) => {
    return acc + (npc.playerEquity?.monthlyDividend || 0);
  }, 0);

  // Lãi từ Túi Thần Tài (30 ngày)
  const monthlyTuiThanTaiInterest = (momoOS.tuiThanTaiBalanceCoins * (momoOS.tuiThanTaiYieldRateDailyPct / 100)) * 30;

  // Chi phí trả lãi vay ngân hàng & Ví Trả Sau hàng tháng
  const monthlyDebtInterest = (totalDebtCoins * 0.015) + (momoOS.viTraSauUsedCoins * (momoOS.viTraSauInterestRateMonthlyPct / 100));

  // 2. Dòng tiền thuần hàng tháng (Monthly Net Cashflow)
  const monthlyNetCashflow = (monthlyBuildingYieldCoins + monthlyNpcDividends + monthlyTuiThanTaiInterest) - (monthlyBuildingOpexCoins + monthlyDebtInterest);

  // 3. Tổng định giá tài sản (Total Assets Valuation)
  const npcEquityValuation = npcLedgers.reduce((acc, npc) => acc + (npc.playerEquity?.investedCapital || 0), 0);
  const totalAssetsValuation = playerCoins + momoOS.tuiThanTaiBalanceCoins + totalBuildingValuationCoins + npcEquityValuation;

  // 4. Tỷ lệ thanh khoản (Liquidity Ratio = Cash & Túi Thần Tài / Monthly Operating Expenses & Debt Interest)
  const monthlyExpenses = Math.max(1, monthlyBuildingOpexCoins + monthlyDebtInterest);
  const liquidCash = playerCoins + momoOS.tuiThanTaiBalanceCoins;
  const liquidityRatio = Number((liquidCash / monthlyExpenses).toFixed(2));

  // 5. Tỷ lệ Nợ / Tài sản (Debt-to-Asset Ratio)
  const totalDebtCombined = totalDebtCoins + momoOS.viTraSauUsedCoins;
  const debtToAssetRatio = totalAssetsValuation > 0 ? Number((totalDebtCombined / totalAssetsValuation).toFixed(3)) : 0;

  // 6. Rủi ro danh mục (Portfolio Risk Index: 0 = Rất đa dạng, 100 = Tập trung rủi ro cao)
  const cashShare = totalAssetsValuation > 0 ? liquidCash / totalAssetsValuation : 1;
  const buildingShare = totalAssetsValuation > 0 ? totalBuildingValuationCoins / totalAssetsValuation : 0;
  const equityShare = totalAssetsValuation > 0 ? npcEquityValuation / totalAssetsValuation : 0;

  // Rủi ro cao nếu nợ cao hoặc tập trung 1 kênh duy nhất
  const concentrationRisk = Math.abs(buildingShare - 0.5) * 40;
  const debtRiskPenalty = debtToAssetRatio * 50;
  const portfolioRiskIndex = Math.min(100, Math.max(0, Math.round(concentrationRisk + debtRiskPenalty + (cashShare < 0.1 ? 30 : 0))));

  // 7. Legacy & Sustainability Score (0 - 100)
  const happinessScore = happinessIndex;
  const zeroDebtBonus = debtToAssetRatio === 0 ? 20 : Math.max(0, 20 - debtToAssetRatio * 40);
  const liquidityBonus = Math.min(20, liquidityRatio * 10);
  const legacyScore = Math.min(100, Math.round(happinessScore * 0.4 + zeroDebtBonus + liquidityBonus + (monthlyNetCashflow > 0 ? 20 : 0)));

  return {
    totalAssetsValuation,
    monthlyNetCashflow,
    liquidityRatio,
    debtToAssetRatio,
    portfolioRiskIndex,
    citizenHappinessIndex: happinessIndex,
    legacyScore,
  };
}

/**
 * Đánh giá Ending Profile dựa trên WEALTH MATRIX
 */
export function evaluateEndingProfile(metrics: WealthMatrixMetrics): EndingEvaluation {
  const {
    totalAssetsValuation,
    monthlyNetCashflow,
    liquidityRatio,
    debtToAssetRatio,
    citizenHappinessIndex,
    legacyScore,
    portfolioRiskIndex,
  } = metrics;

  // Case 1: Đế chế mong manh (Fragile Empire) - Tài sản lớn nhưng Nợ cao, Tiền mặt ít hoặc Dòng tiền âm
  if (debtToAssetRatio > 0.35 || (monthlyNetCashflow < 0 && liquidityRatio < 0.5)) {
    return {
      id: 'FRAGILE_EMPIRE',
      title: 'Đế Chế Mong Manh',
      subtitle: 'Tài sản hào nhoáng nhưng thanh khoản kiệt quệ',
      description: 'Thị trấn sở hữu nhiều công trình nguy nga và quy mô kinh doanh lớn, nhưng áp lực nợ vay và chi phí cố định quá cao khiến bạn rơi vào thế "ngàn cân treo sợi tóc". Chỉ một biến cố nhỏ cũng có thể làm đứt gãy dòng tiền.',
      score: 62,
      badge: '⚠️ Đòn bẩy rủi ro',
      keyStrengths: ['Tổng tài sản định giá cao', 'Quy mô thị trấn rộng lớn'],
      keyVulnerabilities: ['Nợ vay vượt ngưỡng an toàn', 'Dòng tiền thặng dư âm/thấp', 'Dễ vỡ nợ khi có biến cố'],
    };
  }

  // Case 2: Cơ đồ bền vững (Resilient Estate) - Cân bằng hoàn hảo, 0 nợ, cashflow thặng dư cao
  if (debtToAssetRatio <= 0.05 && monthlyNetCashflow > 0 && liquidityRatio >= 1.5) {
    return {
      id: 'RESILIENT_ESTATE',
      title: 'Cơ Đồ Bền Vững',
      subtitle: 'Nền tảng vững chắc & Khả năng chống chịu tuyệt vời',
      description: 'Thị trấn của bạn tự vận hành trơn tru mà không cần liên tục bơm tiền cấp cứu. Tỷ lệ nợ an toàn, dòng tiền thặng dư đều đặn và có quỹ dự phòng thanh khoản dồi dào trước mọi sự cố thiên nga đen.',
      score: 95,
      badge: '🏆 Cơ Đồ Vàng',
      keyStrengths: ['Tỷ lệ nợ an toàn/bằng 0', 'Dòng tiền thuần thặng dư cao', 'Quỹ dự phòng an toàn tuyệt đối'],
      keyVulnerabilities: ['Cần duy trì nhịp độ mở rộng đều đặn'],
    };
  }

  // Case 3: Lãnh đạo cộng đồng (Community Builder) - Happiness cực cao, Legacy tốt
  if (citizenHappinessIndex >= 85 && legacyScore >= 80) {
    return {
      id: 'COMMUNITY_BUILDER',
      title: 'Lãnh Đạo Cộng Đồng',
      subtitle: 'Thị trấn an sinh & Dân cư hạnh phúc',
      description: 'Bạn ưu tiên hạ tầng an sinh, trường học, dịch vụ tiện ích và nâng cao chất lượng sống cho cư dân. Thị trấn của bạn là nơi đáng sống nhất, cư dân gắn bó dài lâu và phát triển thịnh vượng.',
      score: 92,
      badge: '🕊️ Kiến tạo An sinh',
      keyStrengths: ['Chỉ số Hạnh phúc cư dân tối đa', 'Chính sách hỗ trợ NPC xuất sắc', 'Hạ tầng bền vững'],
      keyVulnerabilities: ['Tỷ suất lợi nhuận tài chính ở mức vừa phải'],
    };
  }

  // Case 4: Nhà đầu tư tối ưu (Optimal Investor) - Danh mục đa dạng, cổ phần cao
  return {
    id: 'OPTIMAL_INVESTOR',
    title: 'Nhà Đầu Tư Tối Ưu',
    subtitle: 'Danh mục linh hoạt & Tiền tự đẻ ra tiền',
    description: 'Bạn không dồn hết vốn vào đất đai hay công trình cố định. Bằng việc phân bổ hợp lý giữa tiền mặt, Túi Thần Tài, và góp vốn cổ phần vào kinh doanh NPC, bạn xây dựng một nguồn thu nhập thụ động bền vững và tối ưu rủi ro.',
    score: 88,
    badge: '📈 Chuyên gia Tài chính',
    keyStrengths: ['Danh mục đầu tư đa dạng', 'Nguồn thu nhập thụ động dồi dào', 'Thanh khoản xuất sắc'],
    keyVulnerabilities: ['Ít biểu tượng công trình lớn trực tiếp sở hữu'],
  };
}

