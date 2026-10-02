import type {
  BuildingDef,
  InventoryItemDef,
  ManagerDef,
  MayorQuestDef,
  StoreModuleDef,
  StoreModuleId,
  ZoneMeta,
} from './types';

export const ZONES: Record<ZoneMeta['type'], ZoneMeta> = {
  COMMERCIAL: {
    type: 'COMMERCIAL',
    label: 'Thương Mại, Giải Trí & Đời Sống',
    shortLabel: 'Cửa hàng',
    color: '#EB2F96',
    tint: '#FFF0F8',
    ring: '#FFD6EE',
    description: 'Cửa hàng ăn uống, vé xem phim, du lịch kiếm Xu mỗi giây.',
  },
  FINTECH: {
    type: 'FINTECH',
    label: 'Tài Chính, Đầu Tư & Tiết Kiệm',
    shortLabel: 'Tài chính',
    color: '#2563EB',
    tint: '#EFF6FF',
    ring: '#BFDBFE',
    description: 'Túi Thần Tài, Ví Trả Sau, Chứng Khoán sinh lãi kép & buff.',
  },
  RESIDENTIAL: {
    type: 'RESIDENTIAL',
    label: 'Dân Cư & Sinh Thái Đô Thị',
    shortLabel: 'Dân cư',
    color: '#16A34A',
    tint: '#F0FDF4',
    ring: '#BBF7D0',
    description: 'Tăng Cư Dân đi mua sắm và điểm Hạnh Phúc.',
  },
  LANDMARK: {
    type: 'LANDMARK',
    label: 'Kỳ Quan Biểu Tượng MoMo',
    shortLabel: 'Kỳ quan',
    color: '#F59E0B',
    tint: '#FFFBEB',
    ring: '#FDE68A',
    description: 'Biểu tượng phồn vinh, buff vĩnh viễn toàn thành phố.',
  },
};

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'quan-ca-phe',
    name: 'Quán Cà Phê & Trà Sữa',
    shortName: 'Cà phê',
    icon: 'coffee',
    zone: 'COMMERCIAL',
    momoServiceTag: 'MoMo QR · Đặt Đồ Uống',
    description: 'Cửa hàng khởi đầu thu hút sinh viên & dân văn phòng, đẻ Xu đều tay.',
    baseYieldPerSec: 1.2,
    baseHappiness: 3,
    population: 0,
    costCoins: 60,
    costGems: 0,
    cogsRate: 0.45,
    opexRate: 0.35,
    maxLevel: 50,
    height: 22,
    hue: '#FB7185',
    accent: '#E11D48',
    merchantCapacity: 85,
    unlockAtMayorLevel: 1,
    synergyWith: ['ky-tuc-xa-sinh-vien', 'rap-phim-momo', 'nha-pho-binh-dan'],
    synergyLabel: 'Combo Cà Phê & Phim/Sinh Viên (+25% Xu)',
  },
  {
    id: 'nha-pho-binh-dan',
    name: 'Khu Nhà Phố Dân Sinh',
    shortName: 'Nhà phố',
    icon: 'home',
    zone: 'RESIDENTIAL',
    momoServiceTag: 'Cư Dân Đô Thị',
    description: 'Xây dựng tổ ấm cho 90 cư dân mới đến sinh sống và chi tiêu tại các cửa hàng.',
    baseYieldPerSec: 0.5,
    baseHappiness: 5,
    population: 90,
    costCoins: 80,
    costGems: 0,
    cogsRate: 0.15,
    opexRate: 0.3,
    maxLevel: 50,
    height: 24,
    hue: '#22C55E',
    accent: '#15803D',
    unlockAtMayorLevel: 1,
    synergyWith: ['cong-vien', 'sieu-thi', 'tram-hoa-don'],
    synergyLabel: 'Combo Khu Dân Sinh Tiện Nghi (+25% Xu)',
  },
  {
    id: 'sieu-thi',
    name: 'Siêu Thị Tiện Lợi MoMo',
    shortName: 'Siêu thị',
    icon: 'store',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Đi Chợ Online · Hoàn Tiền',
    description: 'Cung cấp nhu yếu phẩm hàng ngày cho toàn bộ khu dân cư.',
    baseYieldPerSec: 2.2,
    baseHappiness: 2,
    population: 0,
    costCoins: 140,
    costGems: 0,
    cogsRate: 0.42,
    opexRate: 0.28,
    maxLevel: 50,
    height: 28,
    hue: '#EB2F96',
    accent: '#C22181',
    merchantCapacity: 150,
    unlockAtMayorLevel: 1,
    synergyWith: ['nha-pho-binh-dan', 'chung-cu-cao-cap', 'tram-tui-than-tai'],
    synergyLabel: 'Combo Siêu Thị Cạnh Khu Dân Cư (+25% Xu)',
  },
  {
    id: 'cong-vien',
    name: 'Công Viên Sinh Thái',
    shortName: 'Công viên',
    icon: 'trees',
    zone: 'RESIDENTIAL',
    momoServiceTag: 'Môi Trường Xanh',
    description: 'Tăng mạnh Hạnh Phúc cư dân, kéo theo hệ số nhân doanh thu toàn thành phố.',
    baseYieldPerSec: 0.6,
    baseHappiness: 15,
    population: 20,
    costCoins: 240,
    costGems: 0,
    cogsRate: 0.4,
    opexRate: 0.38,
    maxLevel: 50,
    height: 18,
    hue: '#16A34A',
    accent: '#15803D',
    unlockAtMayorLevel: 1,
    synergyWith: ['nha-pho-binh-dan', 'ky-tuc-xa-sinh-vien', 'chung-cu-cao-cap'],
    synergyLabel: 'Combo Đô Thị Xanh An Cư (+25% Xu)',
  },
  {
    id: 'ky-tuc-xa-sinh-vien',
    name: 'Ký Túc Xá Sinh Viên Gen Z',
    shortName: 'Ký túc xá',
    icon: 'graduation',
    zone: 'RESIDENTIAL',
    momoServiceTag: 'Cộng Đồng Sinh Viên',
    description: 'Đón 180 sinh viên trẻ cực kỳ chuộng quét QR, uống trà sữa và đặt vé xem phim.',
    baseYieldPerSec: 1.4,
    baseHappiness: 8,
    population: 180,
    costCoins: 340,
    costGems: 0,
    cogsRate: 0.2,
    opexRate: 0.32,
    maxLevel: 50,
    height: 36,
    hue: '#3B82F6',
    accent: '#1D4ED8',
    unlockAtMayorLevel: 2,
    synergyWith: ['quan-ca-phe', 'rap-phim-momo', 'pho-am-thuc'],
    synergyLabel: 'Combo Làng Đại Học Sôi Động (+25% Xu)',
  },
  {
    id: 'pho-am-thuc',
    name: 'Phố Ẩm Thực Đêm',
    shortName: 'Phố ăn',
    icon: 'utensils',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Ẩm Thực & Quét Mã QR',
    description: 'Tụ điểm ăn uống tấp nập, tăng cả doanh thu Xu lẫn điểm Hạnh Phúc.',
    baseYieldPerSec: 3.8,
    baseHappiness: 7,
    population: 0,
    costCoins: 450,
    costGems: 0,
    cogsRate: 0.48,
    opexRate: 0.34,
    maxLevel: 50,
    height: 34,
    hue: '#F472B6',
    accent: '#DB2777',
    merchantCapacity: 240,
    unlockAtMayorLevel: 2,
    synergyWith: ['rap-phim-momo', 'ky-tuc-xa-sinh-vien', 'to-hop-du-lich'],
    synergyLabel: 'Combo Ăn Khuya & Xem Phim (+25% Xu)',
  },
  {
    id: 'rap-phim-momo',
    name: 'Rạp Chiếu Phim MoMo Cinema',
    shortName: 'Rạp phim',
    icon: 'film',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Đặt Vé Xem Phim & Bắp Nước',
    description: 'Điểm hẹn giải trí bom tấn! Kiếm Xu lớn mỗi suất chiếu và tăng mạnh Hạnh Phúc.',
    baseYieldPerSec: 5.6,
    baseHappiness: 14,
    population: 0,
    costCoins: 680,
    costGems: 0,
    cogsRate: 0.55,
    opexRate: 0.3,
    maxLevel: 50,
    height: 40,
    hue: '#EC4899',
    accent: '#BE185D',
    merchantCapacity: 320,
    unlockAtMayorLevel: 2,
    synergyWith: ['quan-ca-phe', 'pho-am-thuc', 'trung-tam-thuong-mai'],
    synergyLabel: 'Combo Xem Phim & Trà Sữa/Ẩm Thực (+25% Xu)',
  },
  {
    id: 'tram-tui-than-tai',
    name: 'Trạm Túi Thần Tài',
    shortName: 'Túi Thần Tài',
    icon: 'piggy',
    zone: 'FINTECH',
    momoServiceTag: 'Tiết Kiệm Sinh Lời Mỗi Ngày',
    description: 'Giúp tổng Xu nhàn rỗi của Thị Trưởng tự đẻ lãi kép mỗi giây và buff cho ô liền kề.',
    baseYieldPerSec: 4.8,
    baseHappiness: 6,
    population: 0,
    costCoins: 780,
    costGems: 1,
    cogsRate: 0.12,
    opexRate: 0.15,
    maxLevel: 50,
    height: 38,
    hue: '#F59E0B',
    accent: '#D97706',
    takeRateBonus: 0.006,
    unlockAtMayorLevel: 2,
    synergyWith: ['sieu-thi', 'ngan-hang-so', 'san-chung-khoan', 'chung-cu-cao-cap'],
    synergyLabel: 'Hào Quang Lãi Kép Thần Tài (+25% Xu)',
  },
  {
    id: 'tram-hoa-don',
    name: 'Trạm Hóa Đơn Điện Nước 24/7',
    shortName: 'Trạm Hóa Đơn',
    icon: 'zap',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Thanh Toán Điện · Nước · Internet',
    description: 'Hạ tầng thu phí tiện ích tự động từ toàn bộ các khu nhà ở và chung cư.',
    baseYieldPerSec: 6.4,
    baseHappiness: 8,
    population: 0,
    costCoins: 890,
    costGems: 0,
    cogsRate: 0.25,
    opexRate: 0.28,
    maxLevel: 50,
    height: 32,
    hue: '#06B6D4',
    accent: '#0E7490',
    merchantCapacity: 290,
    unlockAtMayorLevel: 3,
    synergyWith: ['nha-pho-binh-dan', 'chung-cu-cao-cap', 'trung-tam-du-lieu'],
    synergyLabel: 'Combo Hạ Tầng Đô Thị Thông Minh (+25% Xu)',
  },
  {
    id: 'ngan-hang-so',
    name: 'Ngân Hàng Số MoMo',
    shortName: 'Ngân hàng',
    icon: 'landmark',
    zone: 'FINTECH',
    momoServiceTag: 'Tài Khoản Số & Vay Nhanh',
    description: 'Trụ cột tài chính đô thị, cấp vốn cho tiểu thương và tăng phí hạ tầng giao dịch.',
    baseYieldPerSec: 7.5,
    baseHappiness: 4,
    population: 0,
    costCoins: 1_050,
    costGems: 2,
    cogsRate: 0.15,
    opexRate: 0.22,
    maxLevel: 50,
    height: 46,
    hue: '#2563EB',
    accent: '#1D4ED8',
    takeRateBonus: 0.008,
    unlockAtMayorLevel: 3,
    synergyWith: ['tram-tui-than-tai', 'trung-tam-vi-tra-sau', 'san-chung-khoan'],
    synergyLabel: 'Combo Trung Tâm Tài Chính Số (+25% Xu)',
  },
  {
    id: 'trung-tam-vi-tra-sau',
    name: 'Trung Tâm Ví Trả Sau (BNPL)',
    shortName: 'Ví Trả Sau',
    icon: 'wallet',
    zone: 'FINTECH',
    momoServiceTag: 'Mua Trước Trả Sau 0% Lãi',
    description: 'Mở rộng hạn mức chi tiêu cho cư dân, đẩy mạnh doanh số mua sắm tại mọi cửa hàng.',
    baseYieldPerSec: 8.8,
    baseHappiness: 7,
    population: 0,
    costCoins: 1_280,
    costGems: 2,
    cogsRate: 0.1,
    opexRate: 0.18,
    maxLevel: 50,
    height: 42,
    hue: '#8B5CF6',
    accent: '#6D28D9',
    takeRateBonus: 0.007,
    unlockAtMayorLevel: 3,
    synergyWith: ['trung-tam-thuong-mai', 'rap-phim-momo', 'to-hop-du-lich'],
    synergyLabel: 'Combo Kích Cầu Mua Sắm Trả Sau (+25% Xu)',
  },
  {
    id: 'chung-cu-cao-cap',
    name: 'Khu Chung Cư SmartHome',
    shortName: 'Chung cư',
    icon: 'building',
    zone: 'RESIDENTIAL',
    momoServiceTag: 'Cư Dân Văn Phòng & Gia Đình',
    description: 'Tòa tháp căn hộ hiện đại cung cấp 320 cư dân thu nhập cao cho thành phố.',
    baseYieldPerSec: 3.2,
    baseHappiness: 10,
    population: 320,
    costCoins: 1_450,
    costGems: 2,
    cogsRate: 0.18,
    opexRate: 0.25,
    maxLevel: 50,
    height: 54,
    hue: '#0EA5E9',
    accent: '#0369A1',
    unlockAtMayorLevel: 4,
    synergyWith: ['cong-vien', 'sieu-thi', 'trung-tam-thuong-mai'],
    synergyLabel: 'Combo Đô Thị Kiểu Mẫu (+25% Xu)',
  },
  {
    id: 'to-hop-du-lich',
    name: 'Tổ Hợp Du Lịch & Vé Máy Bay',
    shortName: 'Du lịch',
    icon: 'plane',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Vé Máy Bay · Khách Sạn · Tàu Xe',
    description: 'Đón các đoàn du khách VIP đến tham quan và chi tiêu Xu lớn tại thành phố.',
    baseYieldPerSec: 11.5,
    baseHappiness: 12,
    population: 60,
    costCoins: 1_750,
    costGems: 3,
    cogsRate: 0.5,
    opexRate: 0.32,
    maxLevel: 50,
    height: 48,
    hue: '#06B6D4',
    accent: '#0284C7',
    merchantCapacity: 420,
    unlockAtMayorLevel: 4,
    synergyWith: ['pho-am-thuc', 'trung-tam-thuong-mai', 'thap-momo'],
    synergyLabel: 'Combo Du Lịch & Mua Sắm Quốc Tế (+25% Xu)',
  },
  {
    id: 'trung-tam-thuong-mai',
    name: 'Trung Tâm Thương Mại Mega',
    shortName: 'TTTM Mega',
    icon: 'shoppingBag',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Đại Siêu Thị & Mua Sắm',
    description: 'Đầu tàu thương mại sầm uất nhất, thu hút hàng ngàn lượt quét mã mỗi ngày.',
    baseYieldPerSec: 14.2,
    baseHappiness: 10,
    population: 0,
    costCoins: 2_200,
    costGems: 3,
    cogsRate: 0.46,
    opexRate: 0.26,
    maxLevel: 50,
    height: 52,
    hue: '#D946EF',
    accent: '#A21CAF',
    merchantCapacity: 560,
    unlockAtMayorLevel: 5,
    synergyWith: ['rap-phim-momo', 'trung-tam-vi-tra-sau', 'chung-cu-cao-cap'],
    synergyLabel: 'Combo Tổ Hợp Mua Sắm & Giải Trí (+25% Xu)',
  },
  {
    id: 'hoc-vien-tai-chinh',
    name: 'Học Viện Tài Chính & AI',
    shortName: 'Học viện',
    icon: 'graduation',
    zone: 'FINTECH',
    momoServiceTag: 'Giáo Dục Tài Chính Thông Minh',
    description: 'Đào tạo chuyên gia, tăng dân số chất lượng cao và nâng tầm hiểu biết tài chính.',
    baseYieldPerSec: 9.6,
    baseHappiness: 12,
    population: 160,
    costCoins: 1_900,
    costGems: 3,
    cogsRate: 0.25,
    opexRate: 0.3,
    maxLevel: 50,
    height: 36,
    hue: '#6366F1',
    accent: '#4338CA',
    takeRateBonus: 0.005,
    unlockAtMayorLevel: 5,
    synergyWith: ['ky-tuc-xa-sinh-vien', 'san-chung-khoan'],
    synergyLabel: 'Combo Tri Thức Đầu Tư (+25% Xu)',
  },
  {
    id: 'san-chung-khoan',
    name: 'Sàn Đầu Tư Chứng Khoán & Quỹ Mở',
    shortName: 'Sàn Đầu Tư',
    icon: 'trendingUp',
    zone: 'FINTECH',
    momoServiceTag: 'Chứng Chỉ Quỹ · Cổ Phiếu · Vàng',
    description: 'Nơi dòng vốn của cư dân sinh sôi mạnh mẽ, mang lại nguồn thu khổng lồ cho đô thị.',
    baseYieldPerSec: 18.5,
    baseHappiness: 8,
    population: 0,
    costCoins: 2_900,
    costGems: 5,
    cogsRate: 0.08,
    opexRate: 0.2,
    maxLevel: 50,
    height: 58,
    hue: '#3B82F6',
    accent: '#1E40AF',
    takeRateBonus: 0.011,
    unlockAtMayorLevel: 5,
    synergyWith: ['ngan-hang-so', 'tram-tui-than-tai', 'trung-tam-du-lieu'],
    synergyLabel: 'Combo Phố Wall Tài Chính (+25% Xu)',
  },
  {
    id: 'trung-tam-du-lieu',
    name: 'Trung Tâm Dữ Liệu Cloud AI',
    shortName: 'Data Center',
    icon: 'server',
    zone: 'FINTECH',
    momoServiceTag: 'Bảo Mật PCI-DSS & AI',
    description: 'Trái tim công nghệ xử lý hàng triệu giao dịch mỗi giây, tối ưu hóa toàn hệ thống.',
    baseYieldPerSec: 22.0,
    baseHappiness: 5,
    population: 0,
    costCoins: 3_600,
    costGems: 6,
    cogsRate: 0.2,
    opexRate: 0.35,
    maxLevel: 50,
    height: 44,
    hue: '#0EA5E9',
    accent: '#0284C7',
    takeRateBonus: 0.012,
    unlockAtMayorLevel: 6,
    synergyWith: ['san-chung-khoan', 'ngan-hang-so', 'thap-momo'],
    synergyLabel: 'Combo Lõi Siêu Ứng Dụng (+25% Xu)',
  },
  {
    id: 'quang-truong-heo-vang',
    name: 'Quảng Trường Heo Vàng Nhân Ái',
    shortName: 'Quảng trường',
    icon: 'piggy',
    zone: 'LANDMARK',
    momoServiceTag: 'MoMo Nhân Ái · Cộng Đồng',
    description: 'Biểu tượng sẻ chia và tiết kiệm, lan tỏa Hạnh Phúc cực đại cho toàn thể cư dân.',
    baseYieldPerSec: 26.0,
    baseHappiness: 26,
    population: 120,
    costCoins: 4_800,
    costGems: 8,
    cogsRate: 0.3,
    opexRate: 0.25,
    maxLevel: 50,
    height: 36,
    hue: '#FBBF24',
    accent: '#D97706',
    unlockAtMayorLevel: 7,
    synergyWith: ['cong-vien', 'thap-momo', 'tram-tui-than-tai'],
    synergyLabel: 'Combo Hào Quang Thiện Nguyện (+25% Xu)',
  },
  {
    id: 'thap-momo',
    name: 'Tháp Đôi MoMo Tower',
    shortName: 'Tháp MoMo',
    icon: 'tower',
    zone: 'LANDMARK',
    momoServiceTag: 'Kỳ Quan Siêu Ứng Dụng',
    description: 'Đỉnh cao kiến trúc của MoCity, tăng mạnh cả Dân số, Hạnh Phúc lẫn tốc độ kiếm Xu.',
    baseYieldPerSec: 42.0,
    baseHappiness: 32,
    population: 450,
    costCoins: 8_500,
    costGems: 15,
    cogsRate: 0.14,
    opexRate: 0.22,
    maxLevel: 50,
    height: 78,
    hue: '#F59E0B',
    accent: '#B45309',
    takeRateBonus: 0.015,
    unlockAtMayorLevel: 8,
    synergyWith: ['san-chung-khoan', 'trung-tam-thuong-mai', 'quang-truong-heo-vang'],
    synergyLabel: 'Combo Kỳ Quan Phồn Vinh (+25% Xu)',
  },
];

export const BUILDING_BY_ID: Record<string, BuildingDef> = Object.fromEntries(
  BUILDINGS.map((b) => [b.id, b]),
);

/** 3 Tiện ích MoMo gắn trực tiếp vào từng cửa hàng (IDLE RPG Tech Modules) */
export const STORE_MODULES: StoreModuleDef[] = [
  {
    id: 'QR_LOA_THAN_TAI',
    name: 'MoMo QR & Loa Thần Tài',
    shortName: 'Loa QR',
    serviceTag: 'Thanh Toán 1 Chạm',
    description: 'Tự động thu Xu liên tục, báo tiền về tức thì và tăng +25% tốc độ phục vụ đơn hàng.',
    unlockLevel: 1,
    costCoins: 90,
    yieldBonus: 0.25,
    color: '#EB2F96',
  },
  {
    id: 'VI_TRA_SAU_VOUCHER',
    name: 'Ví Trả Sau & Thẻ Quà Tặng',
    shortName: 'Ví Trả Sau',
    serviceTag: 'Chi Tiêu Trước Trả Sau',
    description: 'Cư dân thoải mái chốt đơn lớn và săn deal, tăng +50% sản lượng Xu của công trình.',
    unlockLevel: 3,
    costCoins: 280,
    yieldBonus: 0.5,
    color: '#8B5CF6',
  },
  {
    id: 'TUI_THAN_TAI_AUTO',
    name: 'Kết Nối Túi Thần Tài Tự Động',
    shortName: 'Túi Thần Tài',
    serviceTag: 'Lãi Kép Doanh Thu',
    description: 'Tự động trích doanh thu cửa hàng sinh lời kép, tăng +65% sản lượng Xu mỗi giây.',
    unlockLevel: 5,
    costCoins: 650,
    yieldBonus: 0.65,
    color: '#F59E0B',
  },
];

export const MODULE_BY_ID: Record<StoreModuleId, StoreModuleDef> = Object.fromEntries(
  STORE_MODULES.map((m) => [m.id, m]),
) as Record<StoreModuleId, StoreModuleDef>;

/** Đội ngũ 6 Quản Lý Cửa Hàng (Idle RPG Store Managers / Heroes) */
export const STORE_MANAGERS: ManagerDef[] = [
  {
    id: 'co-tu-bun-rieu',
    name: 'Cô Tư Bún Riêu',
    title: 'Tổ Trưởng Tiểu Thương',
    rarity: 'R',
    specialtyZone: 'COMMERCIAL',
    skillName: 'Loa Thần Tài Báo Đơn',
    skillDesc: 'Chuyên gia bán lẻ phố thị, tăng +30% Xu/giây cho cửa hàng được giao quản lý.',
    yieldMultiplier: 0.3,
    happinessBonus: 3,
    costCoins: 200,
    costGems: 0,
    hue: '#EB2F96',
  },
  {
    id: 'anh-tuan-ship',
    name: 'Anh Tuấn Đội Trưởng Ship',
    title: 'Điều Phối Giao Hàng Nhanh',
    rarity: 'R',
    specialtyZone: 'COMMERCIAL',
    skillName: 'Giao Nhanh 15 Phút',
    skillDesc: 'Tối ưu hóa đơn hàng ăn uống và siêu thị, tăng +35% Xu/giây và +4 Hạnh phúc.',
    yieldMultiplier: 0.35,
    happinessBonus: 4,
    costCoins: 350,
    costGems: 0,
    hue: '#F59E0B',
  },
  {
    id: 'dao-dien-bao-nam',
    name: 'Đạo Diễn Bảo Nam',
    title: 'Giám Đốc Giải Trí & Rạp Phim',
    rarity: 'SR',
    specialtyZone: 'COMMERCIAL',
    skillName: 'Suất Chiếu Cháy Vé',
    skillDesc: 'Tạo cơn sốt vé xem phim & giải trí đêm, tăng +65% Xu/giây và +8 Hạnh phúc.',
    yieldMultiplier: 0.65,
    happinessBonus: 8,
    costCoins: 750,
    costGems: 2,
    hue: '#EC4899',
  },
  {
    id: 'ngoc-khue-travel',
    name: 'Quản Lý Ngọc Khuê',
    title: 'Chuyên Gia Du Lịch & Dân Sinh',
    rarity: 'SR',
    specialtyZone: 'RESIDENTIAL',
    skillName: 'Đô Thị Đáng Sống 5 Sao',
    skillDesc: 'Nâng tầm chất lượng sống cư dân & khách sạn, tăng +70% Xu/giây và +10 Hạnh phúc.',
    yieldMultiplier: 0.7,
    happinessBonus: 10,
    costCoins: 900,
    costGems: 2,
    hue: '#06B6D4',
  },
  {
    id: 'minh-anh-quy-mo',
    name: 'Chuyên Gia Minh Anh',
    title: 'Giám Đốc Quỹ Mở & Túi Thần Tài',
    rarity: 'SSR',
    specialtyZone: 'FINTECH',
    skillName: 'Lãi Kép Thịnh Vượng',
    skillDesc: 'Bậc thầy quản lý tài sản số, tăng +120% Xu/giây và kích thích lãi suất toàn phố.',
    yieldMultiplier: 1.2,
    happinessBonus: 12,
    costCoins: 1_800,
    costGems: 3,
    hue: '#2563EB',
  },
  {
    id: 'khoi-nguyen-cto',
    name: 'Giám Đốc Khôi Nguyên',
    title: 'Kiến Trúc Sư Siêu Ứng Dụng',
    rarity: 'SSR',
    specialtyZone: 'ALL',
    skillName: 'Đô Thị Không Tiền Mặt',
    skillDesc: 'Thiên tài công nghệ điều phối mọi phân khu, tăng +135% Xu/giây và +15 Hạnh phúc.',
    yieldMultiplier: 1.35,
    happinessBonus: 15,
    costCoins: 2_500,
    costGems: 4,
    hue: '#8B5CF6',
  },
];

export const MANAGER_BY_ID: Record<string, ManagerDef> = Object.fromEntries(
  STORE_MANAGERS.map((m) => [m.id, m]),
);

/** Hệ thống Nhiệm Vụ Thị Trưởng (Mayor Progression Quests — Phiên bản Hài Hước Đời Thường) */
export const MAYOR_QUESTS: MayorQuestDef[] = [
  {
    id: 'q-name-city',
    title: 'Khai Sinh Đô Thị — Đặt Tên Sao Cho Sang Miệng',
    description: 'Bấm vào bảng tên trên thanh HUD để đặt tên Thị Trưởng & Thành Phố (đừng để tên mặc định kẻo Shipper tìm không ra!).',
    rewardCoins: 1_000,
    rewardGems: 3,
    stage: 1,
    rewardXp: 150,
  },
  {
    id: 'q-first-home',
    title: 'Chấm Dứt Cảnh Ngủ Ghế Đá Công Viên',
    description: 'Xây dựng ít nhất 1 công trình Dân Cư (Khu Nhà Phố hoặc Ký Túc Xá Sinh Viên) để bà con có chỗ che mưa che nắng.',
    rewardCoins: 1_500,
    rewardGems: 3,
    stage: 1,
    rewardXp: 200,
  },
  {
    id: 'q-first-store',
    title: 'Khởi Nghiệp Trà Sữa & Cà Phê Hốt Bạc',
    description: 'Xây dựng 1 Cửa Hàng thương mại đầu tiên để dân tình có chỗ “chữa lành” và tạo dòng XU/giây tự động.',
    rewardCoins: 2_000,
    rewardGems: 4,
    stage: 1,
    rewardXp: 250,
  },
  {
    id: 'q-install-qr',
    title: 'Giải Cứu Cô Tư Khỏi Cảnh Thối Tiền Bằng Kẹo Cao Su',
    description: 'Bấm vào 1 cửa hàng trên bản đồ và lắp đặt tiện ích “MoMo QR & Loa Thần Tài” đọc tiền về vang dội.',
    rewardCoins: 5_000,
    rewardGems: 5,
    stage: 1,
    rewardXp: 400,
  },
  {
    id: 'q-milestone-lv5',
    title: 'Lên Đời Cửa Hàng — Đột Phá Cấp 5 Nhận x2 Doanh Thu',
    description: 'Nâng cấp bất kỳ cửa hàng nào đạt mốc Cấp 5 để kích hoạt hệ số nhân đôi sản lượng XU/giây.',
    rewardCoins: 8_000,
    rewardGems: 6,
    stage: 1,
    rewardXp: 600,
  },
  {
    id: 'q-cinema-tui-than-tai',
    title: 'Cứu Tinh Hẹn Hò & Thoát Kiếp Mì Tôm Cuối Tháng',
    description: 'Xây dựng Rạp Chiếu Phim MoMo Cinema (cho các cặp đôi khỏi ra công viên đếm muỗi) hoặc Trạm Túi Thần Tài (sinh lãi kép).',
    rewardCoins: 15_000,
    rewardGems: 8,
    stage: 1,
    rewardXp: 900,
  },
  {
    id: 'q-hire-manager',
    title: 'Tuyển CEO Về Trông Quán Nước',
    description: 'Mở bảng Quản lý Cửa hàng (Tab Quản Lý RPG) và bổ nhiệm 1 Quản Lý chuyên trách để ngồi mát ăn bát vàng.',
    rewardCoins: 20_000,
    rewardGems: 10,
    stage: 1,
    rewardXp: 1_100,
  },
  {
    id: 'q-star-evolve',
    title: 'Dát Vàng Bảng Hiệu — Tiến Hóa Lên 2 Sao (★★)',
    description: 'Tiến hóa bất kỳ công trình nào từ 1★ lên 2★ để cả khu phố phải ngước nhìn.',
    rewardCoins: 25_000,
    rewardGems: 12,
    stage: 1,
    rewardXp: 1_300,
  },
  {
    id: 'q-fever-mode',
    title: 'Bật Nhạc Lên! Kích Hoạt Giờ Vàng Siêu Sale x2 XU',
    description: 'Bấm nút “Giờ Vàng x2” trên thanh HUD để cả thành phố bước vào đại tiệc săn deal nhân đôi tốc độ kiếm XU.',
    rewardCoins: 18_000,
    rewardGems: 8,
    stage: 1,
    rewardXp: 1_000,
  },
  {
    id: 'q-expand-city',
    title: 'Đại Gia Bất Động Sản — Quy Hoạch 6 Tòa Nhà & 200 Dân',
    description: 'Sở hữu từ 6 công trình trở lên và đón ít nhất 200 Cư dân về sinh sống nhộn nhịp.',
    rewardCoins: 50_000,
    rewardGems: 20,
    stage: 1,
    rewardXp: 2_000,
  },

  /*
   * CHẶNG HAI.
   *
   * Mười nhiệm vụ trên đều xong trong vài chục phút đầu, sau đó bảng Nhiệm Vụ
   * trống trơn và người chơi không còn mục tiêu dài hạn nào ngoài con số doanh
   * thu tự chạy. Chặng này bám vào các hệ thống đã có sẵn nhưng ít người đụng
   * tới: tiến hóa sao, module cửa hàng, quản lý, mở rộng đất, chuỗi ngày.
   *
   * Thưởng ở đây phải lớn hơn hẳn chặng một vì tới lúc đó doanh thu mỗi giây
   * đã vài trăm Xu - thưởng 50.000 Xu không còn là phần thưởng nữa.
   */
  {
    id: 'q-full-street',
    title: 'Kín Mặt Tiền — Lấp Đầy 12 Lô Đất',
    description: 'Sở hữu 12 công trình trên phố. Đất trống là tiền nằm im, Thị Trưởng ạ.',
    rewardCoins: 180_000,
    rewardGems: 25,
    stage: 2,
    rewardXp: 4_500,
  },
  {
    id: 'q-three-managers',
    title: 'Bộ Sậu Quản Lý — Bổ Nhiệm 3 Người',
    description: 'Có ít nhất 3 cửa hàng đang được Quản Lý chuyên trách trông coi cùng lúc.',
    rewardCoins: 260_000,
    rewardGems: 30,
    stage: 2,
    rewardXp: 6_000,
  },
  {
    id: 'q-module-master',
    title: 'Phủ Sóng Tiện Ích — Lắp 6 Module',
    description: 'Lắp tổng cộng 6 tiện ích lên các cửa hàng trong phố (QR, Loa, Ví Trả Sau...).',
    rewardCoins: 350_000,
    rewardGems: 35,
    stage: 2,
    rewardXp: 7_500,
  },
  {
    id: 'q-three-star',
    title: 'Dát Vàng Toàn Phố — Một Tiệm Lên ★★★',
    description: 'Tiến hóa bất kỳ công trình nào lên 3 sao. Bảng hiệu phải sáng cả khu.',
    rewardCoins: 500_000,
    rewardGems: 40,
    stage: 2,
    rewardXp: 10_000,
  },
  {
    id: 'q-level-20',
    title: 'Công Trình Cấp 20 — Xây Cho Ra Xây',
    description: 'Nâng bất kỳ công trình nào lên Cấp 20.',
    rewardCoins: 700_000,
    rewardGems: 45,
    stage: 2,
    rewardXp: 12_000,
  },
  {
    id: 'q-streak-7',
    title: 'Bảy Ngày Không Nghỉ — Thị Trưởng Mẫn Cán',
    description: 'Giữ chuỗi ngày chơi liên tiếp đạt 7 ngày.',
    rewardCoins: 450_000,
    rewardGems: 50,
    stage: 2,
    rewardXp: 9_000,
  },
  {
    id: 'q-tier-6',
    title: 'Lên Rank Đô Thị Quét Mã',
    description: 'Đưa thành phố đạt Rank 6 - Đô Thị Quét Mã. Cả phố không còn ai thối tiền lẻ.',
    rewardCoins: 1_200_000,
    rewardGems: 60,
    stage: 2,
    rewardXp: 18_000,
  },
  {
    id: 'q-landmark',
    title: 'Biểu Tượng Thành Phố — Dựng Một Landmark',
    description: 'Xây Quảng Trường Heo Vàng hoặc Tháp Đôi MoMo Tower.',
    rewardCoins: 900_000,
    rewardGems: 55,
    stage: 2,
    rewardXp: 14_000,
  },
];

/** Mốc cấp độ đột phá (Tier Breakthrough): đạt Lv.5, 10, 25, 50 nhận hệ số nhân lớn */
export const MILESTONE_LEVELS = [5, 10, 25, 50] as const;

export function milestoneMultiplierFor(level: number): number {
  let mult = 1;
  if (level >= 5) mult *= 1.5;
  if (level >= 10) mult *= 1.8;
  if (level >= 25) mult *= 2.2;
  if (level >= 50) mult *= 3.0;
  return mult;
}

export function nextMilestoneLevel(level: number): number {
  for (const m of MILESTONE_LEVELS) {
    if (level < m) return m;
  }
  return 50;
}

/**
 * Chi phi nang cap phai TAI LE VOI doanh thu cua chinh cong trinh do, khong
 * phai voi gia xay dung.
 *
 * Ban <= 3 dung `costCoins * 1.42^n`. Van sai vi `costCoins` khong phai he so
 * doanh thu: Thap MoMo dat 8.500 Xu (gap Thap/Ca phe = 140x) nhung san luong
 * gap 35x, nhan voi cap 50 + 5* + module + SSR + hieu ung lien ke thi doanh
 * thu gap 68.000x. Che do kinh doanh nhu vay khiến ca o cap 10 chi 1 phut hoa
 * von, cap 30 la 4,8 gio, cap 40 la 6,7 ngay - vung chet.
 *
 * Gan chi phi vao `baseYieldPerSec` lam thoi gian hoa von bang nhau o moi
 * tang cap, bat ke cong trinh nao, nen ca 20 cong trinh deu co nhip nang cap
 * nhat quan.
 */
const UPGRADE_YIELD_FACTOR = 600;
/**
 * Do nhanh tien tang theo cap.
 *
 * 1.25 la "cam ung phong no" kinh dien cua idle game, nhung o do doanh thu o
 * day la TUYEN TINH theo cap (`LEVEL_SCALE`) va chi nhay o moc 5/10/25/50. Hai
 * ben khong cung he, nen chi phi vuot xa doanh thu: cap 40 -> 41 cat 4.333.340
 * Xu de lay them 7,5 Xu/giay, tien hoa von 2,7 ngay. San luong cap 49 -> 50
 * nhay 780 Xu/giay (do moc x3 cua `milestoneMultiplierFor`) nen tro lai co lai
 * 690 phut - khong co nhip nang cap deu.
 *
 * 1.15 lam hoa von cap 40 -> 41 ve 152 phut, cap 49 -> 50 ve 5 phut, va giu
 * duong chi phi cung nhip voi moi cong trinh.
 */
const UPGRADE_GROWTH = 1.15;

/** Chi phi len cap moi. Lam tron ve 5 don vi de so dep. */
export function upgradeCostCoins(def: BuildingDef, currentLevel: number): number {
  const raw = def.baseYieldPerSec * UPGRADE_YIELD_FACTOR * Math.pow(UPGRADE_GROWTH, currentLevel - 1);
  return Math.max(20, Math.round(raw / 5) * 5);
}

/** Chi phi nang sao cong trinh (1★ -> 5★). +35% doanh thu moi sao. */
export function starUpgradeCost(def: BuildingDef, currentStar: number): { coins: number; gems: number } {
  return {
    coins: Math.round(def.baseYieldPerSec * 2_000 * Math.pow(2.2, currentStar)),
    gems: currentStar * 2,
  };
}

/**
 * XP can de len cap tiep theo. TUYEN TINH, khong phai nhan 1.15 moi cap.
 *
 * Duong cong luy thua `200 * 1.15^(cap-1)` nghe hay nhung la tuong: lv49 can
 * 163.880 XP, gap 823 lan lv2. Tong lv1 -> 50 la 1.255.079 XP - nhip nang cap
 * cong trinh chua duoc 50 cap thi game chua bao gio tra loi, nen hien duong
 * cong nay chinh la "tuong" chu khong phai "cong bang".
 *
 * Hien tai: `500 + 300 * (cap - 1)`. Tong lv1 -> 50 la 368.700 XP, lv49 can
 * 14.700. Nguyen tac: XP hang dau phai cham hon doanh thu AFK, va phai tro
 * khop voi `IDLE_XP_CAP` o `store.ts` de AFK khong bao gio lo lao cap do.
 */
export function xpForLevel(level: number): number {
  return 500 + 300 * Math.max(0, level - 1);
}

/** Backward-compat: dung cho cac component chi can 1 con so tuong doi. */
export const MAYOR_XP_PER_LEVEL = 500;

export const INVENTORY_ITEMS: InventoryItemDef[] = [
  {
    id: 'item-loa-phuong',
    name: 'Loa Phường Phát Thanh Vàng',
    category: 'CONSUMABLE',
    rarity: 'SR',
    description: 'Phát sóng thông báo khuyến mãi toàn khu phố, thu hút dòng người mua sắm tấp nập.',
    effectSummary: 'Tăng +20 Tin Cậy toàn bộ Cư dân & +8 Hạnh Phúc',
    hue: '#EB2F96',
    costCoins: 18_000,
    costGems: 0,
  },
  {
    id: 'item-lenh-bai-gio-vang',
    name: 'Lệnh Bài Giờ Vàng Siêu Ứng Dụng',
    category: 'CONSUMABLE',
    rarity: 'SSR',
    description: 'Ấn lệnh đặc quyền của Thị Trưởng mở hội mua sắm đêm, nhân đôi tốc độ thu ngân.',
    effectSummary: 'Kích hoạt ngay 60 giây Giờ Vàng x2 Doanh Thu toàn phố',
    hue: '#F59E0B',
    costCoins: 25_000,
    costGems: 0,
  },
  {
    id: 'item-bao-li-xi',
    name: 'Bao Lì Xì Lộc Phát 68',
    category: 'CONSUMABLE',
    rarity: 'SR',
    description: 'Phong bao lì xì đỏ thắm chứa ngân phiếu may mắn và Kim Cương từ Tòa Thị Chính.',
    effectSummary: 'Mở nhận ngay +18 Kim Cương & +6 Hạnh Phúc',
    hue: '#EF4444',
    costCoins: 45_000,
    costGems: 0,
  },
  {
    id: 'item-ban-ve-quy-hoach',
    name: 'Bản Vẽ Quy Hoạch Cấp Tốc',
    category: 'CONSUMABLE',
    rarity: 'SSR',
    description: 'Bản thiết kế kiến trúc chuẩn Đô Thị 3D giúp nâng tầng đồng loạt các cửa tiệm đang hoạt động.',
    effectSummary: 'Tăng ngay +1 Cấp miễn phí cho mọi cửa hàng trên phố',
    hue: '#2563EB',
    costCoins: 80_000,
    costGems: 2,
  },
  {
    id: 'relic-heo-vang',
    name: 'Tượng Heo Vàng Thịnh Vượng',
    category: 'RELIC',
    rarity: 'SSR',
    description: 'Bảo vật phong thủy của MoCity. Khi đặt tại Tòa Thị Chính giúp toàn bộ cửa tiệm buôn may bán đắt.',
    effectSummary: 'Trang bị: +25% Doanh Thu Xu/giây toàn thành phố',
    hue: '#F59E0B',
    costCoins: 120_000,
    costGems: 3,
    passiveYieldBonus: 0.25,
    passiveHappinessBonus: 5,
  },
  {
    id: 'relic-so-do',
    name: 'Sổ Đỏ Đại Lộ Hoa Sữa',
    category: 'RELIC',
    rarity: 'SR',
    description: 'Chứng nhận quy hoạch đất vàng mặt tiền giúp tăng giá trị bất động sản và niềm vui khu dân cư.',
    effectSummary: 'Trang bị: +15% Doanh Thu Xu/giây & +12 Điểm Hạnh Phúc',
    hue: '#16A34A',
    costCoins: 75_000,
    costGems: 2,
    passiveYieldBonus: 0.15,
    passiveHappinessBonus: 12,
  },
  {
    id: 'relic-cup-qr',
    name: 'Cúp Thương Hiệu Quét QR Quốc Dân',
    category: 'RELIC',
    rarity: 'SSR',
    description: 'Danh hiệu cao quý trao cho khu phố dẫn đầu thanh toán không tiền mặt và Loa Thần Tài.',
    effectSummary: 'Trang bị: +30% Doanh Thu Xu/giây & +8 Điểm Hạnh Phúc',
    hue: '#D82D8B',
    costCoins: 150_000,
    costGems: 4,
    passiveYieldBonus: 0.30,
    passiveHappinessBonus: 8,
  },
  {
    id: 'relic-the-den',
    name: 'Thẻ Đen Đặc Quyền Thị Trưởng',
    category: 'RELIC',
    rarity: 'SSR',
    description: 'Thẻ kim loại giới hạn kết nối trực tiếp với Tháp Tài Chính và Sàn Chứng Khoán MoCity.',
    effectSummary: 'Trang bị: +35% Doanh Thu Xu/giây & +10 Điểm Hạnh Phúc',
    hue: '#7C3AED',
    costCoins: 180_000,
    costGems: 5,
    passiveYieldBonus: 0.35,
    passiveHappinessBonus: 10,
  },
  {
    id: 'gift-tra-sua',
    name: 'Ly Trà Sữa Full Topping',
    category: 'GIFT',
    rarity: 'R',
    description: 'Món quà quốc dân giải nhiệt chiều hè, tặng cho các chủ tiệm và cư dân để gắn kết tình làng nghĩa xóm.',
    effectSummary: 'Tặng cư dân: +25 Tin Cậy (Mở khóa QR) & +10 Hạnh Phúc',
    hue: '#EC4899',
    costCoins: 12_000,
    costGems: 0,
  },
  {
    id: 'gift-hop-qua-tet',
    name: 'Hộp Quà Đoàn Viên Phố Thị',
    category: 'GIFT',
    rarity: 'SR',
    description: 'Hộp quà bánh trà thượng hạng gửi tặng các hộ kinh doanh và bô lão toàn khu phố.',
    effectSummary: 'Tặng toàn phố: +35 Tin Cậy mọi NPC & +14 Hạnh Phúc',
    hue: '#0EA5E9',
    costCoins: 28_000,
    costGems: 0,
  },
];

export const INVENTORY_BY_ID: Record<string, InventoryItemDef> = Object.fromEntries(
  INVENTORY_ITEMS.map((item) => [item.id, item]),
);

export const STARTER_INVENTORY: Record<string, number> = {
  'item-loa-phuong': 2,
  'item-lenh-bai-gio-vang': 2,
  'item-bao-li-xi': 3,
  'item-ban-ve-quy-hoach': 1,
  'relic-heo-vang': 1,
  'relic-cup-qr': 1,
  'gift-tra-sua': 3,
  'gift-hop-qua-tet': 1,
};


/* ═══════════════════════════════════════════════════════════════════════════
 * BẬC THÀNH PHỐ
 * Mở khoá theo DÂN SỐ làm trục chính, kèm SỐ CÔNG TRÌNH để chặn trường hợp
 * xây toàn nhà ở lấy dân số mà khu phố không có kinh tế.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface CityTierDef {
  id: string;
  /** Bậc 1..8, dùng để so sánh và hiển thị. */
  rank: number;
  name: string;
  tagline: string;
  minPopulation: number;
  minBuildings: number;
  /** Thưởng một lần khi lần đầu đạt bậc này. */
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
}

/**
 * NGUONG DAN SO: phai doc cung `populationFor`, la `def.population * level`.
 *
 * Ban <= 5 dat nguong 120 / 320 / 700 / 1.400 / 2.800 / 5.500 / 10.000. Nghe
 * hop ly nhung dan so NHAN THEO CAP cong trinh trong khi `minBuildings` thi
 * khong, nen hai truc lech nhau rat nhanh: o moc 24 cong trinh nguoi choi da
 * co ~15.900 dan trong khi bac 6 chi doi 2.800. Ket qua la toan bo thang bac
 * chi con phu thuoc so cong trinh, con dan so la so trang tri.
 *
 * Nguong duoi day lay tu mo hinh tien trinh thuc (res chiem ~30% o dat, cap
 * trung binh tang dan 1 -> 18): 180 / 540 / 2.250 / 6.000 / 15.960 / 25.650 /
 * 41.040. Dat nguong hoi thap hon moc do mot chut de nguoi choi khong bi chan
 * cung, nhung du cao de PHAI xay them nha o chu khong chi dan o dat.
 */
export const CITY_TIERS: CityTierDef[] = [
  {
    id: 'tier-xom-choi-la', rank: 1, name: 'Xóm Chòi Lá',
    tagline: 'Mới dựng tạm vài mái che, mưa xuống là cả xóm chạy dột.',
    minPopulation: 0, minBuildings: 0,
    rewardCoins: 0, rewardGems: 0, rewardXp: 0,
  },
  {
    id: 'tier-hem-ba-gac', rank: 2, name: 'Hẻm Ba Gác',
    tagline: 'Hẻm vừa đúng một chiếc ba gác, hai xe gặp nhau là phải lùi.',
    minPopulation: 150, minBuildings: 3,
    rewardCoins: 6_000, rewardGems: 4, rewardXp: 900,
  },
  {
    id: 'tier-pho-via-he', rank: 3, name: 'Phố Vỉa Hè',
    tagline: 'Bắt đầu có hàng quán mặt tiền, tối đến đèn vàng sáng cả dãy.',
    minPopulation: 500, minBuildings: 6,
    rewardCoins: 18_000, rewardGems: 8, rewardXp: 2_400,
  },
  {
    id: 'tier-thi-tu-tra-da', rank: 4, name: 'Thị Tứ Trà Đá',
    tagline: 'Đông người, có chỗ ngồi tám chuyện từ sáng tới chiều.',
    minPopulation: 2_000, minBuildings: 10,
    rewardCoins: 45_000, rewardGems: 14, rewardXp: 5_200,
  },
  {
    id: 'tier-quan-tra-sua', rank: 5, name: 'Quận Trà Sữa',
    tagline: 'GenZ kéo tới check-in, dòng tiền lên thấy rõ.',
    minPopulation: 5_500, minBuildings: 16,
    rewardCoins: 110_000, rewardGems: 22, rewardXp: 9_000,
  },
  {
    id: 'tier-do-thi-quet-ma', rank: 6, name: 'Đô Thị Quét Mã',
    tagline: 'Hết cảnh thối tiền bằng kẹo cao su, cả phố quét mã.',
    minPopulation: 14_000, minBuildings: 24,
    rewardCoins: 280_000, rewardGems: 32, rewardXp: 14_000,
  },
  {
    id: 'tier-dai-do-thi-ting-ting', rank: 7, name: 'Đại Đô Thị Ting Ting',
    tagline: 'Tiếng báo có tiền vang từ đầu hẻm tới cuối đại lộ.',
    minPopulation: 24_000, minBuildings: 34,
    rewardCoins: 700_000, rewardGems: 45, rewardXp: 20_000,
  },
  {
    id: 'tier-sieu-do-thi-khong-tien-mat', rank: 8, name: 'Siêu Đô Thị Không Tiền Mặt',
    tagline: 'Không còn ai cầm tiền lẻ. Thị Trưởng đã làm được.',
    minPopulation: 40_000, minBuildings: 46,
    rewardCoins: 1_800_000, rewardGems: 70, rewardXp: 25_000,
  },
];

/** Bậc cao nhất mà dân số + số công trình hiện tại với tới. */
export function cityTierFor(population: number, buildingCount: number): CityTierDef {
  let found = CITY_TIERS[0];
  for (const t of CITY_TIERS) {
    if (population >= t.minPopulation && buildingCount >= t.minBuildings) found = t;
  }
  return found;
}

export function nextCityTier(rank: number): CityTierDef | null {
  return CITY_TIERS.find((t) => t.rank === rank + 1) ?? null;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * NHIỆM VỤ NGÀY
 * Khác nhiệm vụ Thị Trưởng ở chỗ đếm theo HÀNH ĐỘNG trong ngày và reset lúc
 * sang ngày mới, nên nguồn XP gắn với việc người chơi thật sự làm gì.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type DailyCounterKey =
  | 'built'
  | 'upgraded'
  | 'talked'
  | 'eventsResolved'
  | 'starEvolved';

export interface DailyQuestDef {
  id: string;
  title: string;
  counter: DailyCounterKey;
  target: number;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
}

export const DAILY_QUESTS: DailyQuestDef[] = [
  {
    id: 'd-tro-chuyen', title: 'Đi một vòng hỏi thăm 5 bà con',
    counter: 'talked', target: 5,
    rewardCoins: 4_000, rewardGems: 2, rewardXp: 1_600,
  },
  {
    id: 'd-nang-cap', title: 'Nâng cấp công trình 3 lượt',
    counter: 'upgraded', target: 3,
    rewardCoins: 6_000, rewardGems: 2, rewardXp: 2_200,
  },
  {
    id: 'd-xu-chuyen-pho', title: 'Phân xử 2 Chuyện Phố',
    counter: 'eventsResolved', target: 2,
    rewardCoins: 8_000, rewardGems: 3, rewardXp: 2_800,
  },
  {
    id: 'd-mo-tiem', title: 'Mở thêm 1 tiệm mới',
    counter: 'built', target: 1,
    rewardCoins: 5_000, rewardGems: 2, rewardXp: 1_800,
  },
  {
    /**
     * Dung het counter `starEvolved`: `evolveBuildingStar` da dem san nhung khong
     * quest nao doc, nen nhanh tien hoa 1 sao khong co do dua gi. Day la vong
     * lap tach bi bo sot khi them cac bo dem moi.
     */
    id: 'd-tien-hoa', title: 'Dát vàng 1 tiệm lên ★★',
    counter: 'starEvolved', target: 1,
    rewardCoins: 12_000, rewardGems: 3, rewardXp: 4_500,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * CHUOI NGÀY CHƠI LIÊN TIẾP
 *
 * Cơ chế giữ người chơi quay lại rẻ nhất trong toàn bộ thiết kế: chỉ cần một
 * con số đếm và một thông báo khi bị ngắt.
 *
 * Mốc thưởng tăng vọt, không đều — người chơi thấy "còn 2 ngày nữa là đủ 7"
 * thì quay lại; thưởng tuyến tính thì không tạo lý do để quay lại.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface StreakMilestoneDef {
  /** So ngay lien tiep de mo khoa. */
  days: number;
  title: string;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
}

export const STREAK_MILESTONES: StreakMilestoneDef[] = [
  { days: 3, title: '3 ngày — Phố đã quen mặt bạn', rewardCoins: 20_000, rewardGems: 2, rewardXp: 3_000 },
  { days: 7, title: '1 tuần — Hàng xóm kín chào', rewardCoins: 60_000, rewardGems: 4, rewardXp: 9_000 },
  { days: 14, title: '2 tuần — Thị Trưởng được cử tri tín nhiệm', rewardCoins: 180_000, rewardGems: 8, rewardXp: 20_000 },
  { days: 30, title: '1 tháng — Cả thành phố đứng sau lưng bạn', rewardCoins: 600_000, rewardGems: 15, rewardXp: 45_000 },
  { days: 60, title: '2 tháng — Rank thành phố không còn chờ ai', rewardCoins: 1_500_000, rewardGems: 25, rewardXp: 90_000 },
  { days: 100, title: '100 ngày — Huyền thoại Đại Lộ Hoa Sữa', rewardCoins: 4_000_000, rewardGems: 40, rewardXp: 180_000 },
];

/** Moc cao nhat ma chuoi hien tai da cham toi. */
export function streakMilestoneReached(days: number): StreakMilestoneDef | null {
  let best: StreakMilestoneDef | null = null;
  for (const m of STREAK_MILESTONES) if (days >= m.days) best = m;
  return best;
}

/** Moc tiep theo can them bao nhieu ngay. `null` = da cham toi da. */
export function nextStreakMilestone(days: number): StreakMilestoneDef | null {
  return STREAK_MILESTONES.find((m) => days < m.days) ?? null;
}
