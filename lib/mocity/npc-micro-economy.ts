import type { NpcMicroLedger, NpcMood, NpcPlayerEquity, NpcPlayerLoan } from './types';

/**
 * Danh sách 10 Archetypes NPC đa dạng tính cách, nhịp sống, gia đình & làm ăn
 */
export const INITIAL_NPC_LEDGERS: NpcMicroLedger[] = [
  {
    npcId: 'MERCHANT_CASH',
    name: 'Chị Tư',
    roleTitle: 'Tiểu Thương Chợ',
    monthlyIncome: 16_000_000,
    monthlyExpense: 11_000_000,
    savings: 28_000_000,
    currentDebt: 0,
    riskTolerance: 'CONSERVATIVE',
    personality: 'SAVER_CONSERVATIVE',
    mood: 'HAPPY',
    stressLevel: 20,
    currentActivity: 'WORKING',
    bioQuote: 'Tiền mặt giắt lưng là an tâm nhất, sợ nhất là nợ nần!',
    financialGoal: 'Tích lũy mua quầy hàng cố định tại chợ',
    avatarHue: '#EB2F96',
    familyTies: [{ relatedNpcId: 'STUDENT', relation: 'PARENT' }],
    businessRelations: [{ partnerNpcId: 'LOCAL_BAKER', relationType: 'SUPPLIER' }],
    playerLoan: null,
    playerEquity: null,
  },
  {
    npcId: 'MERCHANT_ESTABLISHED',
    name: 'Chú Sáu',
    roleTitle: 'Chủ Tiệm Bách Hóa Lâu Năm',
    monthlyIncome: 48_000_000,
    monthlyExpense: 32_000_000,
    savings: 130_000_000,
    currentDebt: 100_000_000,
    riskTolerance: 'MODERATE',
    personality: 'BALANCED_PLANNER',
    mood: 'ANXIOUS',
    stressLevel: 45,
    currentActivity: 'WORKING',
    bioQuote: 'Kinh doanh phải biết xoay vốn, nhưng dạo này nợ ngân hàng áp lực quá.',
    financialGoal: 'Mở rộng tiệm thứ 2 tại đại lộ MoCity',
    avatarHue: '#D946EF',
    familyTies: [{ relatedNpcId: 'SALARIED', relation: 'SIBLING' }],
    businessRelations: [{ partnerNpcId: 'GIG_WORKER', relationType: 'LOGISTICS_PARTNER' }],
    playerLoan: null,
    playerEquity: null,
  },
  {
    npcId: 'GIG_WORKER',
    name: 'Anh Nam',
    roleTitle: 'Tài Xế Công Nghệ',
    monthlyIncome: 19_000_000,
    monthlyExpense: 13_500_000,
    savings: 16_000_000,
    currentDebt: 20_000_000,
    riskTolerance: 'AGGRESSIVE',
    personality: 'RISK_TAKER_ENTREPRENEUR',
    mood: 'HAPPY',
    stressLevel: 30,
    currentActivity: 'WORKING',
    bioQuote: 'Chạy xe từ sáng sớm đến đêm muộn, ráng cày để lo cho bà xã và con đi học.',
    financialGoal: 'Đổi sang xe điện MoCity chạy tiết kiệm nhiên liệu',
    avatarHue: '#F59E0B',
    familyTies: [{ relatedNpcId: 'LOCAL_BAKER', relation: 'SPOUSE' }],
    businessRelations: [{ partnerNpcId: 'MERCHANT_ESTABLISHED', relationType: 'CLIENT' }],
    playerLoan: null,
    playerEquity: null,
  },
  {
    npcId: 'LOCAL_BAKER',
    name: 'Chị Lan',
    roleTitle: 'Chủ Tiệm Bánh Mì & Cà Phê',
    monthlyIncome: 35_000_000,
    monthlyExpense: 24_000_000,
    savings: 45_000_000,
    currentDebt: 30_000_000,
    riskTolerance: 'MODERATE',
    personality: 'COMMUNITY_HELPFUL',
    mood: 'HAPPY',
    stressLevel: 25,
    currentActivity: 'WORKING',
    bioQuote: 'Cà phê ngon, bánh nóng giòn mỗi sáng cho cả phố cùng vui!',
    financialGoal: 'Sắm thêm máy pha cà phê tự động MoMo',
    avatarHue: '#EC4899',
    familyTies: [
      { relatedNpcId: 'GIG_WORKER', relation: 'SPOUSE' },
      { relatedNpcId: 'RETIRED_TEACHER', relation: 'CHILD' },
    ],
    businessRelations: [{ partnerNpcId: 'MERCHANT_CASH', relationType: 'CLIENT' }],
    playerLoan: null,
    playerEquity: null,
  },
  {
    npcId: 'SALARIED',
    name: 'Chị Hoàng',
    roleTitle: 'Chuyên Viên Văn Phòng',
    monthlyIncome: 30_000_000,
    monthlyExpense: 22_000_000,
    savings: 90_000_000,
    currentDebt: 0,
    riskTolerance: 'MODERATE',
    personality: 'IMPULSE_BUYER',
    mood: 'ECSTATIC',
    stressLevel: 15,
    currentActivity: 'SHOPPING',
    bioQuote: 'Làm hết sức, chơi hết mình! Tiền nằm nhàn rỗi là tiền lãng phí.',
    financialGoal: 'Đầu tư chứng khoán MoMo & Mua căn hộ cao cấp',
    avatarHue: '#16A34A',
    familyTies: [{ relatedNpcId: 'MERCHANT_ESTABLISHED', relation: 'SIBLING' }],
    businessRelations: [],
    playerLoan: null,
    playerEquity: null,
  },
  {
    npcId: 'STUDENT',
    name: 'Minh',
    roleTitle: 'Sinh Viên Khởi Nghiệp',
    monthlyIncome: 9_000_000,
    monthlyExpense: 7_000_000,
    savings: 6_000_000,
    currentDebt: 0,
    riskTolerance: 'AGGRESSIVE',
    personality: 'RISK_TAKER_ENTREPRENEUR',
    mood: 'HAPPY',
    stressLevel: 20,
    currentActivity: 'RESTING',
    bioQuote: 'Sắp ra mắt ứng dụng giao hàng xanh! Mẹ Tư luôn ủng hộ ước mơ của em.',
    financialGoal: 'Gọi vốn thành công cho dự án startup MoCity Delivery',
    avatarHue: '#3B82F6',
    familyTies: [{ relatedNpcId: 'MERCHANT_CASH', relation: 'CHILD' }],
    businessRelations: [{ partnerNpcId: 'TECH_FREELANCER', relationType: 'CO_OWNER' }],
    playerLoan: null,
    playerEquity: null,
  },
  {
    npcId: 'RETIRED_TEACHER',
    name: 'Bác Ba',
    roleTitle: 'Giáo Viên Về Hưu',
    monthlyIncome: 12_000_000,
    monthlyExpense: 7_500_000,
    savings: 180_000_000,
    currentDebt: 0,
    riskTolerance: 'CONSERVATIVE',
    personality: 'SAVER_CONSERVATIVE',
    mood: 'HAPPY',
    stressLevel: 10,
    currentActivity: 'RESTING',
    bioQuote: 'Tuổi già nhàn rỗi, gửi tiền Túi Thần Tài nhận lãi hàng ngày cho an tâm.',
    financialGoal: 'Để lại khoản tiết kiệm học bổng cho cháu ngoại',
    avatarHue: '#8B5CF6',
    familyTies: [{ relatedNpcId: 'LOCAL_BAKER', relation: 'PARENT' }],
    businessRelations: [],
    playerLoan: null,
    playerEquity: null,
  },
  {
    npcId: 'PHARMACIST',
    name: 'Cô Hoa',
    roleTitle: 'Dược Sĩ Nhà Thuốc MoCity',
    monthlyIncome: 32_000_000,
    monthlyExpense: 20_000_000,
    savings: 110_000_000,
    currentDebt: 0,
    riskTolerance: 'CONSERVATIVE',
    personality: 'BALANCED_PLANNER',
    mood: 'HAPPY',
    stressLevel: 15,
    currentActivity: 'WORKING',
    bioQuote: 'Sức khỏe bà con là trên hết, buôn bán phải giữ cái tâm lành.',
    financialGoal: 'Đầu tư chuỗi trang thiết bị y tế an sinh phố',
    avatarHue: '#06B6D4',
    familyTies: [{ relatedNpcId: 'FACTORY_WORKER', relation: 'PARENT' }],
    businessRelations: [],
    playerLoan: null,
    playerEquity: null,
  },
  {
    npcId: 'FACTORY_WORKER',
    name: 'Kiên',
    roleTitle: 'Kỹ Sư Nhà Máy',
    monthlyIncome: 22_000_000,
    monthlyExpense: 15_000_000,
    savings: 40_000_000,
    currentDebt: 10_000_000,
    riskTolerance: 'MODERATE',
    personality: 'COMMUNITY_HELPFUL',
    mood: 'HAPPY',
    stressLevel: 25,
    currentActivity: 'WORKING',
    bioQuote: 'Dây chuyền máy móc chạy êm là nhà máy đạt năng suất cao nhất.',
    financialGoal: 'Trả hết nợ sửa nhà và mua bảo hiểm sức khỏe',
    avatarHue: '#F97316',
    familyTies: [{ relatedNpcId: 'PHARMACIST', relation: 'CHILD' }],
    businessRelations: [],
    playerLoan: null,
    playerEquity: null,
  },
  {
    npcId: 'TECH_FREELANCER',
    name: 'Hoàng',
    roleTitle: 'Kỹ Sư Phần Mềm Tự Do',
    monthlyIncome: 40_000_000,
    monthlyExpense: 25_000_000,
    savings: 95_000_000,
    currentDebt: 0,
    riskTolerance: 'AGGRESSIVE',
    personality: 'RISK_TAKER_ENTREPRENEUR',
    mood: 'ECSTATIC',
    stressLevel: 20,
    currentActivity: 'WORKING',
    bioQuote: 'Code bất kể ngày đêm, lập trình hệ thống thanh toán tự động QR MoMo!',
    financialGoal: 'Xây dựng nền tảng giải pháp số cho toàn đô thị',
    avatarHue: '#6366F1',
    familyTies: [],
    businessRelations: [{ partnerNpcId: 'STUDENT', relationType: 'CO_OWNER' }],
    playerLoan: null,
    playerEquity: null,
  },
];

/**
 * Cập nhật cảm xúc (Mood) và hoạt động (Activity) của NPC theo giờ thực & mức độ stress
 */
export function updateNpcMoodAndActivity(
  ledger: NpcMicroLedger,
  currentHour: number,
  cityHappiness: number
): NpcMicroLedger {
  // 1. Nhịp hoạt động theo khung giờ 24h
  let nextActivity: NpcMicroLedger['currentActivity'] = 'RESTING';
  if (currentHour >= 6 && currentHour < 8) {
    nextActivity = 'COMMUTING';
  } else if (currentHour >= 8 && currentHour < 17) {
    nextActivity = 'WORKING';
  } else if (currentHour >= 17 && currentHour < 22) {
    nextActivity = 'SHOPPING';
  } else {
    nextActivity = 'RESTING';
  }

  // 2. Tính toán tỷ lệ nợ / thu nhập & Mức độ stress
  const debtToIncomeRatio = ledger.monthlyIncome > 0 ? ledger.currentDebt / ledger.monthlyIncome : 0;
  let nextStress = Math.min(100, Math.max(0, Math.round(debtToIncomeRatio * 20 + (100 - cityHappiness) * 0.3)));

  if (ledger.playerLoan && ledger.playerLoan.termMonthsRemaining > 0) {
    nextStress += 10;
  }

  // 3. Phân loại Cảm Xúc (Mood)
  let nextMood: NpcMood = 'HAPPY';
  if (nextStress > 70 || debtToIncomeRatio > 5) {
    nextMood = 'DESPERATE';
  } else if (nextStress > 50 || debtToIncomeRatio > 3) {
    nextMood = 'ANXIOUS';
  } else if (nextStress > 35) {
    nextMood = 'STRESSED';
  } else if (ledger.savings > ledger.monthlyExpense * 6 && cityHappiness > 80) {
    nextMood = 'ECSTATIC';
  } else {
    nextMood = 'HAPPY';
  }

  return {
    ...ledger,
    mood: nextMood,
    stressLevel: nextStress,
    currentActivity: nextActivity,
  };
}

/**
 * Tính toán hiệu ứng tác động chuỗi cung ứng giữa các NPC có liên kết làm ăn
 */
export function calculateSupplyChainEfficiency(npcLedgers: NpcMicroLedger[]): {
  chainEfficiencyBonusPct: number;
  distressedPartnersCount: number;
} {
  let distressedCount = 0;
  let healthyRelationsCount = 0;

  npcLedgers.forEach((npc) => {
    npc.businessRelations.forEach((rel) => {
      const partner = npcLedgers.find((p) => p.npcId === rel.partnerNpcId);
      if (partner) {
        if (partner.mood === 'ANXIOUS' || partner.mood === 'DESPERATE') {
          distressedCount++;
        } else if (partner.mood === 'HAPPY' || partner.mood === 'ECSTATIC') {
          healthyRelationsCount++;
        }
      }
    });
  });

  const chainEfficiencyBonusPct = Math.max(-20, Math.min(30, healthyRelationsCount * 5 - distressedCount * 10));

  return {
    chainEfficiencyBonusPct,
    distressedPartnersCount: distressedCount,
  };
}

/**
 * Cấp khoản vay cá nhân cho NPC (Player Loan)
 */
export function grantNpcLoan(
  ledger: NpcMicroLedger,
  amount: number,
  interestRateMonthly: number = 0.02,
  termMonths: number = 6
): NpcMicroLedger {
  const newLoan: NpcPlayerLoan = {
    amount,
    interestRateMonthly,
    termMonthsRemaining: termMonths,
    startMonth: 1,
  };
  return {
    ...ledger,
    currentDebt: ledger.currentDebt + amount,
    savings: ledger.savings + amount,
    stressLevel: Math.max(0, ledger.stressLevel - 15), // Giảm stress nhờ có vốn cấp cứu
    mood: 'HAPPY',
    playerLoan: newLoan,
  };
}

/**
 * Góp vốn cổ phần vào mô hình kinh doanh của NPC (Player Equity)
 */
export function investNpcEquity(
  ledger: NpcMicroLedger,
  investedCapital: number,
  ownershipPct: number
): NpcMicroLedger {
  const netIncome = ledger.monthlyIncome - ledger.monthlyExpense;
  const initialMonthlyDividend = Math.max(0, Math.round((netIncome * (ownershipPct / 100)) * 0.5));

  const newEquity: NpcPlayerEquity = {
    ownershipPct,
    investedCapital,
    monthlyDividend: initialMonthlyDividend,
  };

  return {
    ...ledger,
    savings: ledger.savings + investedCapital,
    stressLevel: Math.max(0, ledger.stressLevel - 20),
    mood: 'ECSTATIC',
    playerEquity: newEquity,
  };
}

/**
 * Xử lý thu tiền lãi/cổ tức hàng tháng từ danh sách NPC
 */
export function processNpcMonthlyFinancials(npcLedgers: NpcMicroLedger[]): {
  updatedLedgers: NpcMicroLedger[];
  totalInterestCollected: number;
  totalDividendsCollected: number;
} {
  let totalInterestCollected = 0;
  let totalDividendsCollected = 0;

  const updatedLedgers = npcLedgers.map((ledger) => {
    let currentLoan = ledger.playerLoan;
    let currentEquity = ledger.playerEquity;

    if (currentLoan && currentLoan.termMonthsRemaining > 0) {
      const monthlyInterest = currentLoan.amount * currentLoan.interestRateMonthly;
      const principalPayment = currentLoan.amount / currentLoan.termMonthsRemaining;
      totalInterestCollected += monthlyInterest;

      const remainingMonths = currentLoan.termMonthsRemaining - 1;
      if (remainingMonths <= 0) {
        currentLoan = null;
      } else {
        currentLoan = {
          ...currentLoan,
          amount: Math.max(0, currentLoan.amount - principalPayment),
          termMonthsRemaining: remainingMonths,
        };
      }
    }

    if (currentEquity) {
      const netProfit = Math.max(0, ledger.monthlyIncome - ledger.monthlyExpense);
      const dividend = Math.round((netProfit * (currentEquity.ownershipPct / 100)) * 0.4);
      totalDividendsCollected += dividend;
      currentEquity = {
        ...currentEquity,
        monthlyDividend: dividend,
      };
    }

    return {
      ...ledger,
      playerLoan: currentLoan,
      playerEquity: currentEquity,
    };
  });

  return {
    updatedLedgers,
    totalInterestCollected,
    totalDividendsCollected,
  };
}
