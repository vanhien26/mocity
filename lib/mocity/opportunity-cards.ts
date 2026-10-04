import type { BlackSwanEventDef, OpportunityCardDef } from './types';

/**
 * 20 Thẻ Quyết Định Chiến Lược (Strategic Opportunity Cards) trải dài từ Act 1 đến Act 5
 */
export const OPPORTUNITY_CARDS: OpportunityCardDef[] = [
  // ==========================================
  // ACT 1: CÓ TIỀN CHƯA CHẮC ĐÃ GIÀU (100M VỐN)
  // ==========================================
  {
    id: 'ACT1_STARTUP_CHOICE',
    act: 'ACT_1_STARTER',
    title: 'Khởi Nghiệp 100 Triệu: Bước Đi Đầu Tiên',
    context: 'Bạn vừa nhận được khoản vốn khởi nghiệp 100M VNĐ. Cần quyết định phương án phân bổ vốn ban đầu.',
    description: 'Chiến lược ban đầu sẽ định hình cấu trúc tài sản và dòng tiền của bạn.',
    choices: [
      {
        id: 'COFFEE_SHOP',
        label: 'Mở Quán Cà Phê Cũ',
        costCoins: 70_000_000,
        summaryEffect: 'Tạo dòng tiền ngay (+8M/tháng), cần quản lý chi phí cố định.',
        financialImpact: {
          cashDeltaCoins: -70_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 8_000_000,
          happinessDelta: 10,
          riskDelta: 15,
        },
      },
      {
        id: 'BUY_OLD_HOUSE',
        label: 'Mua Căn Nhà Cũ Phố Huyện',
        costCoins: 70_000_000,
        summaryEffect: 'Không tạo dòng tiền ngay (0/tháng), tài sản có thể tăng giá.',
        financialImpact: {
          cashDeltaCoins: -70_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 0,
          happinessDelta: 5,
          riskDelta: 5,
        },
      },
      {
        id: 'HOLD_CASH',
        label: 'Giữ Tiền Mặt & Gửi Túi Thần Tài',
        costCoins: 0,
        summaryEffect: 'Dòng tiền lãi nhẹ (+0.5M/tháng), an toàn tuyệt đối cho Quỹ dự phòng.',
        financialImpact: {
          cashDeltaCoins: 0,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 500_000,
          happinessDelta: 0,
          riskDelta: 0,
        },
      },
    ],
  },
  {
    id: 'ACT1_MICRO_LOAN_NPC',
    act: 'ACT_1_STARTER',
    title: 'Anh Nam Tài Xế Cần Vốn Sửa Xe',
    context: 'Anh Nam (Tài xế công nghệ) bị hỏng xe, cần 20M để sửa phương tiện làm ăn.',
    description: 'Giúp đỡ cư dân bằng hình thức Cho Vay hoặc Đầu Tư Cổ Phần.',
    choices: [
      {
        id: 'LOAN_NAM',
        label: 'Cho Vay 20M (Lãi 2%/tháng)',
        costCoins: 20_000_000,
        summaryEffect: 'Thu hồi cả gốc lẫn lãi sau 6 tháng.',
        financialImpact: {
          cashDeltaCoins: -20_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 1_200_000,
          happinessDelta: 8,
          riskDelta: 10,
        },
      },
      {
        id: 'EQUITY_NAM',
        label: 'Góp Vốn 20M (Hưởng 25% Lợi Nhuận)',
        costCoins: 20_000_000,
        equityDilutionPct: 25,
        summaryEffect: 'Nhận cổ tức dài hạn theo thu nhập của Nam.',
        financialImpact: {
          cashDeltaCoins: -20_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 1_800_000,
          happinessDelta: 12,
          riskDelta: 15,
        },
      },
      {
        id: 'DECLINE_NAM',
        label: 'Từ Chối (Bảo Vệ Thanh Khoản)',
        costCoins: 0,
        summaryEffect: 'Giữ nguyên tiền mặt, Nam gặp khó khăn.',
        financialImpact: {
          cashDeltaCoins: 0,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 0,
          happinessDelta: -5,
          riskDelta: 0,
        },
      },
    ],
  },

  // ==========================================
  // ACT 2: TIỀN BẮT ĐẦU ĐẺ RA TIỀN (CASHFLOW & MARGIN)
  // ==========================================
  {
    id: 'ACT2_PRIME_RENTAL',
    act: 'ACT_2_CASHFLOW',
    title: 'Mặt Bằng Đắt Giá Ngã Tư Phố',
    context: 'Chủ tiệm lâu năm chào thuê mặt bằng ngã tư với lượt khách cao gấp 3 lần.',
    description: 'Doanh thu dự kiến 25M/tháng nhưng Chi phí thuê + Nhân viên lên tới 20M/tháng.',
    choices: [
      {
        id: 'RENT_PRIME',
        label: 'Thuê Mặt Bằng Vàng',
        costCoins: 40_000_000, // Tiền cọc & setup
        summaryEffect: 'Doanh thu lớn (25M), Chi phí cố định cao (20M) -> Cashflow +5M.',
        financialImpact: {
          cashDeltaCoins: -40_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 5_000_000,
          happinessDelta: 15,
          riskDelta: 25,
        },
      },
      {
        id: 'KEEP_OLD_RENT',
        label: 'Ở Bắt Đầu Tại Tiệm Cũ',
        costCoins: 0,
        summaryEffect: 'Doanh thu 10M, Chi phí 5M -> Cashflow +5M. An toàn hơn khi vắng khách.',
        financialImpact: {
          cashDeltaCoins: 0,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 5_000_000,
          happinessDelta: 0,
          riskDelta: 5,
        },
      },
    ],
  },
  {
    id: 'ACT2_WAREHOUSE_LOGISTICS',
    act: 'ACT_2_CASHFLOW',
    title: 'Đầu Tư Kho Hàng Trung Luân MoCity',
    context: 'Xây dựng kho hàng riêng để giảm giá vốn (COGS) nhập hàng cho toàn bộ tiệm trong phố.',
    description: 'Chi phí đầu tư 80M VNĐ. Giúp tăng biên lợi nhuận gộp lên 12%.',
    choices: [
      {
        id: 'BUILD_WAREHOUSE',
        label: 'Xây Kho Hàng Trung Luân (80M)',
        costCoins: 80_000_000,
        summaryEffect: 'Giảm 12% giá vốn cho tất cả tiệm thương mại.',
        financialImpact: {
          cashDeltaCoins: -80_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 12_000_000,
          happinessDelta: 8,
          riskDelta: 10,
        },
      },
      {
        id: 'OUTSOURCING',
        label: 'Thuê Kho Ngoài (Trả theo tháng)',
        costCoins: 10_000_000,
        summaryEffect: 'Chi phí linh hoạt nhưng lợi nhuận biên thấp hơn.',
        financialImpact: {
          cashDeltaCoins: -10_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 4_000_000,
          happinessDelta: 2,
          riskDelta: 5,
        },
      },
    ],
  },

  // ==========================================
  // ACT 3: CƠ HỘI LUÔN ĐI KÈM CÁI GIÁ (DEBT VS EQUITY)
  // ==========================================
  {
    id: 'ACT3_LAND_ACQUISITION',
    act: 'ACT_3_LEVERAGE',
    title: 'Mảnh Đất Vàng 500 Triệu',
    context: 'Cơ hội mua mảnh đất chiến lược cạnh trung tâm với giá 500M. Bạn chỉ có 300M tiền mặt.',
    description: 'Quyết định sử dụng Nợ vay (Debt) hay Gọi vốn (Equity) để thâu tóm.',
    choices: [
      {
        id: 'SKIP_LAND',
        label: 'Bỏ Qua Cơ Hội',
        costCoins: 0,
        summaryEffect: 'Bảo vệ thanh khoản, giữ 300M tiền mặt.',
        financialImpact: {
          cashDeltaCoins: 0,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 0,
          happinessDelta: 0,
          riskDelta: 0,
        },
      },
      {
        id: 'DEBT_LEVERAGE',
        label: 'Vay Ngân Hàng 200M Mua Đất',
        costCoins: 300_000_000,
        borrowAmountCoins: 200_000_000,
        summaryEffect: 'Sở hữu 100% đất, nhưng gánh áp lực trả gốc + lãi 4M/tháng.',
        financialImpact: {
          cashDeltaCoins: -300_000_000,
          debtDeltaCoins: 200_000_000,
          monthlyCashflowDeltaCoins: -4_000_000,
          happinessDelta: 10,
          riskDelta: 35,
        },
      },
      {
        id: 'CO_INVESTOR',
        label: 'Gọi Cổ Đông Góp Vốn 200M',
        costCoins: 300_000_000,
        equityDilutionPct: 40,
        summaryEffect: 'Không có nợ vay, sở hữu 60% mảnh đất.',
        financialImpact: {
          cashDeltaCoins: -300_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 6_000_000,
          happinessDelta: 15,
          riskDelta: 10,
        },
      },
    ],
  },
  {
    id: 'ACT3_MOMO_FINTECH_CENTER',
    act: 'ACT_3_LEVERAGE',
    title: 'Trung Tâm Tài Chính Số MoMo',
    context: 'Xây dựng Trung Tâm Tài Chính Số giúp tự động hóa thanh toán QR & quản lý dòng tiền toàn thị trấn.',
    description: 'Chi phí 250M. Tăng 15% doanh thu thu nhập phí dịch vụ Fintech.',
    choices: [
      {
        id: 'BUILD_FINTECH',
        label: 'Xây Trung Tâm Fintech (250M)',
        costCoins: 250_000_000,
        summaryEffect: 'Tăng 15% lợi nhuận Fintech & nâng cấp hạ tầng số.',
        financialImpact: {
          cashDeltaCoins: -250_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 20_000_000,
          happinessDelta: 20,
          riskDelta: 15,
        },
      },
    ],
  },

  // ==========================================
  // ACT 4: THỬ THÁCH THIÊN NGA ĐEN (BLACK SWAN SHOCKS)
  // ==========================================
  {
    id: 'ACT4_CRISIS_MANAGEMENT',
    act: 'ACT_4_BLACK_SWAN',
    title: 'Mưa Kéo Dài 3 Tuần & Sụt Giảm Doanh Thu',
    context: 'Mưa lớn bão lũ kéo dài khiến lượng khách ra đường giảm 40%. Chi phí cố định vẫn phải trả đủ.',
    description: 'Bạn phải đưa ra giải pháp ứng phó khủng hoảng thanh khoản.',
    choices: [
      {
        id: 'USE_EMERGENCY_FUND',
        label: 'Rút Tiền Từ Túi Thần Tài / Quỹ Dự Phòng',
        costCoins: 30_000_000,
        summaryEffect: 'Bù đắp dòng tiền âm, bảo vệ uy tín thị trấn.',
        financialImpact: {
          cashDeltaCoins: -30_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 0,
          happinessDelta: 5,
          riskDelta: -10,
        },
      },
      {
        id: 'USE_VI_TRA_SAU',
        label: 'Dùng Hạn Mức Ví Trả Sau MoMo',
        costCoins: 0,
        borrowAmountCoins: 30_000_000,
        summaryEffect: 'Ứng vốn tức thì, nhưng trả lãi 1.5%/tháng.',
        financialImpact: {
          cashDeltaCoins: 0,
          debtDeltaCoins: 30_000_000,
          monthlyCashflowDeltaCoins: -450_000,
          happinessDelta: 0,
          riskDelta: 15,
        },
      },
      {
        id: 'LIQUIDATE_ASSETS',
        label: 'Bán Tháo Bất Động Sản Chiết Khấu 20%',
        costCoins: -150_000_000, // Thu về 150M cash
        summaryEffect: 'Thu tiền mặt khẩn cấp nhưng tổn thất giá trị tài sản.',
        financialImpact: {
          cashDeltaCoins: 150_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: -10_000_000,
          happinessDelta: -10,
          riskDelta: -20,
        },
      },
    ],
  },

  // ==========================================
  // ACT 5: ĐỊNH HÌNH CƠ ĐỒ (ENDGAME)
  // ==========================================
  {
    id: 'ACT5_FINAL_LEGACY',
    act: 'ACT_5_ESTATE',
    title: 'Tầm Nhìn Định Hình Cơ Đồ MoCity',
    context: 'Thị trấn đã phát triển vững mạnh. Bạn chọn di sản nào để lại cho tương lai?',
    description: 'Lựa chọn quyết định danh hiệu và thứ hạng Ending Profile của bạn.',
    choices: [
      {
        id: 'COMMUNITY_FIRST',
        label: 'Trường Học & Hạ Tầng An Sinh Bền Vững',
        costCoins: 300_000_000,
        summaryEffect: 'Tối đa Hạnh phúc cư dân & Legacy Score.',
        financialImpact: {
          cashDeltaCoins: -300_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 15_000_000,
          happinessDelta: 30,
          riskDelta: -30,
        },
      },
      {
        id: 'CONGLOMERATE_EXPANSION',
        label: 'Tập Đoàn Kinh Doanh Đa Ngành MoCity',
        costCoins: 500_000_000,
        summaryEffect: 'Tối đa Định giá tài sản & Doanh thu thuần.',
        financialImpact: {
          cashDeltaCoins: -500_000_000,
          debtDeltaCoins: 0,
          monthlyCashflowDeltaCoins: 50_000_000,
          happinessDelta: 10,
          riskDelta: 20,
        },
      },
    ],
  },
];

/**
 * Danh sách các sự cố Thiên Nga Đen (Act 4 Black Swan Events)
 */
export const BLACK_SWAN_EVENTS: BlackSwanEventDef[] = [
  {
    id: 'HEAVY_RAIN_STORM',
    title: '🌧️ Mưa Bão Kéo Dài 3 Tuần',
    description: 'Doanh thu bán lẻ & ăn uống sụt giảm 40%. Chi phí cố định không giảm.',
    icon: '⛈️',
    severity: 'MODERATE',
    durationDays: 21,
    revenueMultiplier: 0.6,
    debtInterestMultiplier: 1.0,
    realEstateValuationMultiplier: 0.95,
    mitigationAdvice: 'Sử dụng Quỹ dự phòng trong Túi Thần Tài hoặc Ví Trả Sau để bù đắp dòng tiền.',
  },
  {
    id: 'MACHINERY_BREAKDOWN',
    title: '🔧 Máy Móc Nhà Máy Hỏng Đột Ngột',
    description: 'Cần 100M VNĐ để thay thế linh kiện khẩn cấp, nếu không năng suất giảm 50%.',
    icon: '🛠️',
    severity: 'MODERATE',
    durationDays: 14,
    revenueMultiplier: 0.5,
    repairCostCoins: 100_000_000,
    debtInterestMultiplier: 1.0,
    realEstateValuationMultiplier: 1.0,
    mitigationAdvice: 'Mua trước Bảo Hiểm MoMo để được chi trả 80% chi phí sửa chữa.',
  },
  {
    id: 'INTEREST_RATE_HIKE',
    title: '🏦 Ngân Hàng Tăng Lãi Suất Vay',
    description: 'Lãi suất khoản vay tăng 3%/năm. Chi phí trả lãi vay hàng tháng tăng 25%.',
    icon: '📉',
    severity: 'CRITICAL',
    durationDays: 30,
    revenueMultiplier: 1.0,
    debtInterestMultiplier: 1.25,
    realEstateValuationMultiplier: 0.85,
    mitigationAdvice: 'Ưu tiên trả bớt nợ gốc để giảm áp lực chi phí lãi vay.',
  },
];
