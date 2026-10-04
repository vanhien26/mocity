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
    description: 'Cửa hàng ăn uống, vé xem phim, du lịch kiếm đồng mỗi giây.',
  },
  FINTECH: {
    type: 'FINTECH',
    label: 'Tài Chính, Đầu Tư & Tiết Kiệm',
    shortLabel: 'Tài chính',
    color: '#2563EB',
    tint: '#EFF6FF',
    ring: '#BFDBFE',
    description: 'Túi Thần Tài, Tiết Kiệm MoMo, Quỹ Đầu Tư sinh lãi kép & ưu đãi.',
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
    momoServiceTag: 'Cà phê phin & Trà đào vỉa hè',
    description: 'Cửa hàng khởi đầu thu hút sinh viên & dân văn phòng, đẻ đồng đều tay.',
    baseYieldPerSec: 60000,
    baseHappiness: 3,
    population: 0,
    costCoins: 5000000,
    costGems: 0,
    cogsRate: 0.45,
    opexRate: 0.35,
    maxLevel: 50,
    height: 22,
    hue: '#FB7185',
    accent: '#E11D48',
    merchantCapacity: 85,
    unlockAtMayorLevel: 1,
    unlockAtTier: 1,
    synergyWith: ['ky-tuc-xa-sinh-vien', 'rap-phim-momo', 'nha-pho-binh-dan'],
    synergyLabel: 'Combo Cà Phê & Phim/Sinh Viên (+25% đồng)',
  },
  {
    id: 'nha-pho-binh-dan',
    name: 'Khu Nhà Phố Dân Sinh',
    shortName: 'Nhà phố',
    icon: 'home',
    zone: 'RESIDENTIAL',
    momoServiceTag: 'Cư Dân Đô Thị',
    description: 'Đầu tư nhà trọ cho 90 người thuê phòng — tiền trọ thu hàng tháng, khách hàng cho các tiệm của bạn.',
    baseYieldPerSec: 100000,
    baseHappiness: 5,
    population: 90,
    costCoins: 10000000,
    costGems: 0,
    cogsRate: 0.15,
    opexRate: 0.3,
    maxLevel: 50,
    height: 24,
    hue: '#22C55E',
    accent: '#15803D',
    unlockAtMayorLevel: 1,
    unlockAtTier: 1,
    synergyWith: ['cong-vien', 'sieu-thi', 'tram-hoa-don'],
    synergyLabel: 'Combo Khu Dân Sinh Tiện Nghi (+25% đồng)',
  },
  {
    id: 'sieu-thi',
    name: 'Siêu Thị Tiện Lợi',
    shortName: 'Siêu thị',
    icon: 'store',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Nhu yếu phẩm & Đồ ăn nhanh 24/7',
    description: 'Cung cấp nhu yếu phẩm hàng ngày cho toàn bộ khu dân cư.',
    baseYieldPerSec: 150000,
    baseHappiness: 2,
    population: 0,
    costCoins: 15000000,
    costGems: 0,
    cogsRate: 0.42,
    opexRate: 0.28,
    maxLevel: 50,
    height: 28,
    hue: '#EB2F96',
    accent: '#C22181',
    merchantCapacity: 150,
    unlockAtMayorLevel: 1,
    unlockAtTier: 1,
    synergyWith: ['nha-pho-binh-dan', 'chung-cu-cao-cap', 'tram-tui-than-tai'],
    synergyLabel: 'Combo Siêu Thị Cạnh Khu Dân Cư (+25% đồng)',
  },
  {
    id: 'cong-vien',
    name: 'Công Viên Sinh Thái',
    shortName: 'Công viên',
    icon: 'trees',
    zone: 'RESIDENTIAL',
    momoServiceTag: 'Môi Trường Xanh',
    description: 'Tăng mạnh Hạnh Phúc cư dân, kéo theo hệ số nhân doanh thu toàn thành phố.',
    baseYieldPerSec: 80000,
    baseHappiness: 15,
    population: 20,
    costCoins: 8000000,
    costGems: 0,
    cogsRate: 0.4,
    opexRate: 0.38,
    maxLevel: 50,
    height: 18,
    hue: '#16A34A',
    accent: '#15803D',
    unlockAtMayorLevel: 1,
    unlockAtTier: 1,
    synergyWith: ['nha-pho-binh-dan', 'ky-tuc-xa-sinh-vien', 'chung-cu-cao-cap'],
    synergyLabel: 'Combo Đô Thị Xanh An Cư (+25% đồng)',
  },
  {
    id: 'ky-tuc-xa-sinh-vien',
    name: 'Ký Túc Xá Sinh Viên Gen Z',
    shortName: 'Ký túc xá',
    icon: 'graduation',
    zone: 'RESIDENTIAL',
    momoServiceTag: 'Cộng Đồng Sinh Viên',
    description: 'Đón 180 sinh viên trẻ cực kỳ chuộng quét QR, uống trà sữa và đặt vé xem phim.',
    baseYieldPerSec: 300000,
    baseHappiness: 8,
    population: 180,
    costCoins: 30000000,
    costGems: 0,
    cogsRate: 0.2,
    opexRate: 0.32,
    maxLevel: 50,
    height: 36,
    hue: '#3B82F6',
    accent: '#1D4ED8',
    unlockAtMayorLevel: 2,
    unlockAtTier: 2,
    synergyWith: ['quan-ca-phe', 'rap-phim-momo', 'pho-am-thuc'],
    synergyLabel: 'Combo Làng Đại Học Sôi Động (+25% đồng)',
  },
  {
    id: 'pho-am-thuc',
    name: 'Phố Ẩm Thực Đêm',
    shortName: 'Phố ăn',
    icon: 'utensils',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Thiên đường ăn vặt đêm & Lẩu nướng',
    description: 'Tụ điểm ăn uống tấp nập, tăng cả doanh thu đồng lẫn điểm Hạnh Phúc.',
    baseYieldPerSec: 420000,
    baseHappiness: 7,
    population: 0,
    costCoins: 45000000,
    costGems: 0,
    cogsRate: 0.48,
    opexRate: 0.34,
    maxLevel: 50,
    height: 34,
    hue: '#F472B6',
    accent: '#DB2777',
    merchantCapacity: 240,
    unlockAtMayorLevel: 2,
    unlockAtTier: 2,
    synergyWith: ['rap-phim-momo', 'ky-tuc-xa-sinh-vien', 'to-hop-du-lich'],
    synergyLabel: 'Combo Ăn Khuya & Xem Phim (+25% đồng)',
  },
  {
    id: 'rap-phim-momo',
    name: 'Rạp Chiếu Phim Khải Hoàn',
    shortName: 'Rạp phim',
    icon: 'film',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Điện ảnh bom tấn & Bắp nước giòn tan',
    description: 'Điểm hẹn giải trí bom tấn! Kiếm đồng lớn mỗi suất chiếu và tăng mạnh Hạnh Phúc.',
    baseYieldPerSec: 750000,
    baseHappiness: 14,
    population: 0,
    costCoins: 80000000,
    costGems: 0,
    cogsRate: 0.55,
    opexRate: 0.3,
    maxLevel: 50,
    height: 40,
    hue: '#EC4899',
    accent: '#BE185D',
    merchantCapacity: 320,
    unlockAtMayorLevel: 2,
    unlockAtTier: 3,
    synergyWith: ['quan-ca-phe', 'pho-am-thuc', 'trung-tam-thuong-mai'],
    synergyLabel: 'Combo Xem Phim & Trà Sữa/Ẩm Thực (+25% đồng)',
  },
  {
    id: 'tram-tui-than-tai',
    name: 'Trạm Tích Lũy Heo Vàng',
    shortName: 'Túi Thần Tài',
    icon: 'piggy',
    zone: 'FINTECH',
    momoServiceTag: 'Tích lũy nhàn rỗi & Đẻ lãi đêm',
    description: 'Giúp tổng đồng nhàn rỗi của Thị Trưởng tự đẻ lãi kép mỗi giây và buff cho ô liền kề.',
    baseYieldPerSec: 550000,
    baseHappiness: 6,
    population: 0,
    costCoins: 60000000,
    costGems: 1,
    cogsRate: 0.12,
    opexRate: 0.15,
    maxLevel: 50,
    height: 38,
    hue: '#F59E0B',
    accent: '#D97706',
    takeRateBonus: 0.006,
    unlockAtMayorLevel: 2,
    unlockAtTier: 2,
    synergyWith: ['sieu-thi', 'ngan-hang-so', 'san-chung-khoan', 'chung-cu-cao-cap'],
    synergyLabel: 'Hào Quang Lãi Kép Thần Tài (+25% đồng)',
  },
  {
    id: 'tram-hoa-don',
    name: 'Trạm Tiện Ích Đô Thị 24/7',
    shortName: 'Trạm Tiện Ích',
    icon: 'zap',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Thanh toán điện, nước, internet tiện lợi',
    description: 'Hạ tầng thu phí tiện ích tự động từ toàn bộ các khu nhà ở và chung cư.',
    baseYieldPerSec: 900000,
    baseHappiness: 8,
    population: 0,
    costCoins: 100000000,
    costGems: 0,
    cogsRate: 0.25,
    opexRate: 0.28,
    maxLevel: 50,
    height: 32,
    hue: '#06B6D4',
    accent: '#0E7490',
    merchantCapacity: 290,
    unlockAtMayorLevel: 3,
    unlockAtTier: 3,
    synergyWith: ['nha-pho-binh-dan', 'chung-cu-cao-cap', 'trung-tam-du-lieu'],
    synergyLabel: 'Combo Hạ Tầng Đô Thị Thông Minh (+25% đồng)',
  },
  {
    id: 'ngan-hang-so',
    name: 'Ngân Hàng Trung Tâm Phố',
    shortName: 'Ngân hàng',
    icon: 'landmark',
    zone: 'FINTECH',
    momoServiceTag: 'Dịch Vụ Tài Chính & Giao Thương',
    description: 'Trụ cột dịch vụ tài chính đô thị, hỗ trợ thanh toán số và tăng trưởng kinh tế toàn phố.',
    baseYieldPerSec: 1200000,
    baseHappiness: 4,
    population: 0,
    costCoins: 140000000,
    costGems: 2,
    cogsRate: 0.15,
    opexRate: 0.22,
    maxLevel: 50,
    height: 46,
    hue: '#2563EB',
    accent: '#1D4ED8',
    takeRateBonus: 0.008,
    unlockAtMayorLevel: 3,
    unlockAtTier: 3,
    synergyWith: ['tram-tui-than-tai', 'trung-tam-vi-tra-sau', 'san-chung-khoan'],
    synergyLabel: 'Combo Trung Tâm Tài Chính Số (+25% đồng)',
  },
  {
    id: 'trung-tam-vi-tra-sau',
    name: 'Trung Tâm Mua Sắm Linh Hoạt',
    shortName: 'Mua Sắm Linh Hoạt',
    icon: 'wallet',
    zone: 'FINTECH',
    momoServiceTag: 'Kích cầu mua sắm & Thanh toán tiện lợi',
    description: 'Tổ hợp mua sắm hiện đại kích cầu tiêu dùng phố thị, liên kết các cửa hàng để tăng doanh số bán lẻ toàn phố.',
    baseYieldPerSec: 1600000,
    baseHappiness: 7,
    population: 0,
    costCoins: 200000000,
    costGems: 2,
    cogsRate: 0.1,
    opexRate: 0.18,
    maxLevel: 50,
    height: 42,
    hue: '#8B5CF6',
    accent: '#6D28D9',
    takeRateBonus: 0.007,
    unlockAtMayorLevel: 3,
    unlockAtTier: 4,
    synergyWith: ['trung-tam-thuong-mai', 'rap-phim-momo', 'to-hop-du-lich'],
    synergyLabel: 'Combo Kích Cầu Mua Sắm Siêu Deal (+25% doanh thu)',
  },
  {
    id: 'chung-cu-cao-cap',
    name: 'Khu Chung Cư SmartHome',
    shortName: 'Chung cư',
    icon: 'building',
    zone: 'RESIDENTIAL',
    momoServiceTag: 'Cư Dân Văn Phòng & Gia Đình',
    description: 'Tòa tháp căn hộ hiện đại cung cấp 320 cư dân thu nhập cao cho thành phố.',
    baseYieldPerSec: 1400000,
    baseHappiness: 10,
    population: 320,
    costCoins: 180000000,
    costGems: 2,
    cogsRate: 0.18,
    opexRate: 0.25,
    maxLevel: 50,
    height: 54,
    hue: '#0EA5E9',
    accent: '#0369A1',
    unlockAtMayorLevel: 4,
    unlockAtTier: 4,
    synergyWith: ['cong-vien', 'sieu-thi', 'trung-tam-thuong-mai'],
    synergyLabel: 'Combo Đô Thị Kiểu Mẫu (+25% đồng)',
  },
  {
    id: 'to-hop-du-lich',
    name: 'Tổ Hợp Khách Sạn & Du Lịch',
    shortName: 'Du lịch',
    icon: 'plane',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Khách sạn, lữ hành & Tour check-in',
    description: 'Đón các đoàn du khách VIP đến tham quan và chi tiêu đồng lớn tại thành phố.',
    baseYieldPerSec: 2500000,
    baseHappiness: 12,
    population: 60,
    costCoins: 350000000,
    costGems: 3,
    cogsRate: 0.5,
    opexRate: 0.32,
    maxLevel: 50,
    height: 48,
    hue: '#06B6D4',
    accent: '#0284C7',
    merchantCapacity: 420,
    unlockAtMayorLevel: 4,
    unlockAtTier: 5,
    synergyWith: ['pho-am-thuc', 'trung-tam-thuong-mai', 'thap-momo'],
    synergyLabel: 'Combo Du Lịch & Mua Sắm Quốc Tế (+25% đồng)',
  },
  {
    id: 'trung-tam-thuong-mai',
    name: 'Trung Tâm Thương Mại Mega',
    shortName: 'TTTM Mega',
    icon: 'shoppingBag',
    zone: 'COMMERCIAL',
    momoServiceTag: 'Đại siêu thị & Thiên đường mua sắm',
    description: 'Đầu tàu thương mại sầm uất nhất, thu hút hàng ngàn lượt quét mã mỗi ngày.',
    baseYieldPerSec: 3500000,
    baseHappiness: 10,
    population: 0,
    costCoins: 500000000,
    costGems: 3,
    cogsRate: 0.46,
    opexRate: 0.26,
    maxLevel: 50,
    height: 52,
    hue: '#D946EF',
    accent: '#A21CAF',
    merchantCapacity: 560,
    unlockAtMayorLevel: 5,
    unlockAtTier: 5,
    synergyWith: ['rap-phim-momo', 'trung-tam-vi-tra-sau', 'chung-cu-cao-cap'],
    synergyLabel: 'Combo Tổ Hợp Mua Sắm & Giải Trí (+25% đồng)',
  },
  {
    id: 'hoc-vien-tai-chinh',
    name: 'Học Viện Tri Thức & Sáng Tạo',
    shortName: 'Học viện',
    icon: 'graduation',
    zone: 'FINTECH',
    momoServiceTag: 'Đào tạo nhân tài & Nâng tầm dân trí',
    description: 'Đào tạo chuyên gia, tăng dân số chất lượng cao và nâng tầm hiểu biết tài chính.',
    baseYieldPerSec: 4800000,
    baseHappiness: 12,
    population: 160,
    costCoins: 700000000,
    costGems: 3,
    cogsRate: 0.25,
    opexRate: 0.3,
    maxLevel: 50,
    height: 36,
    hue: '#6366F1',
    accent: '#4338CA',
    takeRateBonus: 0.005,
    unlockAtMayorLevel: 5,
    unlockAtTier: 6,
    synergyWith: ['ky-tuc-xa-sinh-vien', 'san-chung-khoan'],
    synergyLabel: 'Combo Tri Thức Đầu Tư (+25% đồng)',
  },
  {
    id: 'san-chung-khoan',
    name: 'Sàn Giao Dịch & Đầu Tư Đô Thị',
    shortName: 'Sàn Đầu Tư',
    icon: 'trendingUp',
    zone: 'FINTECH',
    momoServiceTag: 'Thị trường vốn & Cơ hội sinh lời',
    description: 'Nơi dòng vốn của cư dân sinh sôi mạnh mẽ, mang lại nguồn thu khổng lồ cho đô thị.',
    baseYieldPerSec: 7000000,
    baseHappiness: 8,
    population: 0,
    costCoins: 1000000000,
    costGems: 5,
    cogsRate: 0.08,
    opexRate: 0.2,
    maxLevel: 50,
    height: 58,
    hue: '#3B82F6',
    accent: '#1E40AF',
    takeRateBonus: 0.011,
    unlockAtMayorLevel: 5,
    unlockAtTier: 6,
    synergyWith: ['ngan-hang-so', 'tram-tui-than-tai', 'trung-tam-du-lieu'],
    synergyLabel: 'Combo Phố Wall Tài Chính (+25% đồng)',
  },
  {
    id: 'trung-tam-du-lieu',
    name: 'Trung Tâm Công Nghệ & Cloud',
    shortName: 'Data Center',
    icon: 'server',
    zone: 'FINTECH',
    momoServiceTag: 'Hạ tầng số thông minh toàn đô thị',
    description: 'Trái tim công nghệ xử lý hàng triệu giao dịch mỗi giây, tối ưu hóa toàn hệ thống.',
    baseYieldPerSec: 9500000,
    baseHappiness: 5,
    population: 0,
    costCoins: 1400000000,
    costGems: 6,
    cogsRate: 0.2,
    opexRate: 0.35,
    maxLevel: 50,
    height: 44,
    hue: '#0EA5E9',
    accent: '#0284C7',
    takeRateBonus: 0.012,
    unlockAtMayorLevel: 6,
    unlockAtTier: 7,
    synergyWith: ['san-chung-khoan', 'ngan-hang-so', 'thap-momo'],
    synergyLabel: 'Combo Lõi Siêu Ứng Dụng (+25% đồng)',
  },
  {
    id: 'quang-truong-heo-vang',
    name: 'Quảng Trường Ánh Sáng Trung Tâm',
    shortName: 'Quảng trường',
    icon: 'piggy',
    zone: 'LANDMARK',
    momoServiceTag: 'Không gian văn hóa, lễ hội & Sân khấu',
    description: 'Biểu tượng sẻ chia và tiết kiệm, lan tỏa Hạnh Phúc cực đại cho toàn thể cư dân.',
    baseYieldPerSec: 8500000,
    baseHappiness: 26,
    population: 120,
    costCoins: 1200000000,
    costGems: 8,
    cogsRate: 0.3,
    opexRate: 0.25,
    maxLevel: 50,
    height: 36,
    hue: '#FBBF24',
    accent: '#D97706',
    unlockAtMayorLevel: 7,
    unlockAtTier: 7,
    synergyWith: ['cong-vien', 'thap-momo', 'tram-tui-than-tai'],
    synergyLabel: 'Combo Hào Quang Thiện Nguyện (+25% đồng)',
  },
  {
    id: 'thap-momo',
    name: 'Tháp Landmark Biểu Tượng Đô Thị',
    shortName: 'Tháp Landmark',
    icon: 'tower',
    zone: 'LANDMARK',
    momoServiceTag: 'Kỳ quan kiến trúc chọc trời kiêu hãnh',
    description: 'Đỉnh cao kiến trúc của MoCity, tăng mạnh cả Dân số, Hạnh Phúc lẫn tốc độ kiếm đồng.',
    baseYieldPerSec: 16000000,
    baseHappiness: 32,
    population: 450,
    costCoins: 2500000000,
    costGems: 15,
    cogsRate: 0.14,
    opexRate: 0.22,
    maxLevel: 50,
    height: 78,
    hue: '#F59E0B',
    accent: '#B45309',
    takeRateBonus: 0.015,
    unlockAtMayorLevel: 8,
    unlockAtTier: 8,
    synergyWith: ['san-chung-khoan', 'trung-tam-thuong-mai', 'quang-truong-heo-vang'],
    synergyLabel: 'Combo Kỳ Quan Phồn Vinh (+25% đồng)',
  },
];

export const BUILDING_BY_ID: Record<string, BuildingDef> = Object.fromEntries(
  BUILDINGS.map((b) => [b.id, b]),
);

/**
 * MENU TỪNG TIỆM - "khách đến order đa dạng" thay vì một con số vô danh.
 *
 * Chỉ 7 tiệm COMMERCIAL có khách xếp hàng thật (xem `arrivalRateFor` trong
 * `transactions.ts`), nên chỉ 7 tiệm này cần menu. Mỗi món có `priceRatio`
 * neo quanh 1.0 - trung bình CỘNG của một menu LUÔN đúng bằng 1.0 (vd
 * 0,55+0,85+1,10+1,50 = 4,0 / 4 món = 1.0), để không phải cân bằng lại
 * `orderValueFor`: món rẻ/đắt chỉ xáo trộn TỪNG đơn, tổng nhiều đơn vẫn
 * khớp đúng tiềm năng gốc của tiệm - đúng nguyên tắc `ORDER_VARIANCE_CYCLE`
 * cũ, giờ gắn tên món thật thay vì một hệ số vô nghĩa.
 */
export interface MenuItemDef {
  /** Tên món hiện trong bong bóng thoại và sổ cái. */
  name: string;
  /** Hệ số giá so với giá trị đơn trung bình của tiệm - trung bình 1 menu = 1.0. */
  priceRatio: number;
}

export const MENU_BY_BUILDING: Record<string, MenuItemDef[]> = {
  'quan-ca-phe': [
    { name: 'Cà Phê Đen', priceRatio: 0.54 },
    { name: 'Cà Phê Sữa Đá', priceRatio: 0.89 },
    { name: 'Bạc Xỉu', priceRatio: 1.14 },
    { name: 'Trà Sữa Trân Châu', priceRatio: 1.43 },
  ],
  'sieu-thi': [
    { name: 'Mì Gói & Đồ Khô', priceRatio: 0.44 },
    { name: 'Nước Ngọt Lốc 6 Lon', priceRatio: 0.67 },
    { name: 'Đồ Ăn Vặt Linh Tinh', priceRatio: 1.11 },
    { name: 'Giỏ Hàng Gia Đình', priceRatio: 1.78 },
  ],
  'pho-am-thuc': [
    { name: 'Bánh Tráng Trộn', priceRatio: 0.38 },
    { name: 'Ốc Các Loại', priceRatio: 0.69 },
    { name: 'Nem Nướng Cuốn', priceRatio: 1.08 },
    { name: 'Lẩu Băng Chuyền', priceRatio: 1.85 },
  ],
  'rap-phim-momo': [
    { name: 'Vé 2D', priceRatio: 0.47 },
    { name: 'Combo Bắp Nước', priceRatio: 0.73 },
    { name: 'Vé 3D', priceRatio: 1 },
    { name: 'Vé VIP Đôi', priceRatio: 1.8 },
  ],
  'tram-hoa-don': [
    { name: 'Hóa Đơn Điện', priceRatio: 0.59 },
    { name: 'Hóa Đơn Nước', priceRatio: 0.82 },
    { name: 'Hóa Đơn Internet', priceRatio: 1.06 },
    { name: 'Phí Dịch Vụ Gộp Tháng', priceRatio: 1.53 },
  ],
  'to-hop-du-lich': [
    { name: 'Vé Tàu Xe', priceRatio: 0.15 },
    { name: 'Tour Trong Ngày', priceRatio: 0.45 },
    { name: 'Vé Máy Bay Giá Rẻ', priceRatio: 1.33 },
    { name: 'Phòng Khách Sạn', priceRatio: 2.07 },
  ],
  'trung-tam-thuong-mai': [
    { name: 'Phụ Kiện Linh Tinh', priceRatio: 0.21 },
    { name: 'Giày Dép', priceRatio: 0.51 },
    { name: 'Quần Áo Thời Trang', priceRatio: 0.98 },
    { name: 'Đồ Gia Dụng', priceRatio: 2.3 },
  ],
};

/** 3 Tiện ích MoMo gắn trực tiếp vào từng cửa hàng (IDLE RPG Tech Modules) */
export const STORE_MODULES: StoreModuleDef[] = [
  {
    id: 'QR_LOA_THAN_TAI',
    name: 'MoMo QR & Loa Thần Tài',
    shortName: 'Loa QR',
    serviceTag: 'Thanh Toán 1 Chạm',
    description: 'Quét mã 1 chạm báo tiền về tức thì, tăng +25% sản lượng tiệm.',
    unlockLevel: 1,
    costCoins: 500_000,
    yieldBonus: 0.25,
    color: '#EB2F96',
  },
  {
    id: 'VI_TRA_SAU_VOUCHER',
    name: 'Thẻ Thành Viên & Combo Ưu Đãi',
    shortName: 'Thẻ Thành Viên',
    serviceTag: 'Ưu Đãi Khách Hàng',
    description: 'Cư dân thoải mái chốt đơn và tích điểm đổi quà, tăng +50% sản lượng doanh thu.',
    unlockLevel: 3,
    costCoins: 2_000_000,
    yieldBonus: 0.5,
    color: '#8B5CF6',
  },
  {
    id: 'TUI_THAN_TAI_AUTO',
    name: 'Kết Nối Túi Thần Tài Tự Động',
    shortName: 'Túi Thần Tài',
    serviceTag: 'Lãi Kép Doanh Thu',
    description: 'Tự động trích doanh thu cửa hàng sinh lời kép, tăng +65% sản lượng đồng mỗi giây.',
    unlockLevel: 5,
    costCoins: 5_000_000,
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
    skillDesc: 'Chuyên gia bán lẻ phố thị, tăng +30% doanh thu/giây cho cửa hàng được giao quản lý.',
    yieldMultiplier: 0.3,
    happinessBonus: 3,
    costCoins: 12_000_000,
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
    skillDesc: 'Tối ưu hóa đơn hàng ăn uống và siêu thị, tăng +35% doanh thu/giây và +4 Hạnh phúc.',
    yieldMultiplier: 0.35,
    happinessBonus: 4,
    costCoins: 15_000_000,
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
    skillDesc: 'Tạo cơn sốt vé xem phim & giải trí đêm, tăng +65% doanh thu/giây và +8 Hạnh phúc.',
    yieldMultiplier: 0.65,
    happinessBonus: 8,
    costCoins: 35_000_000,
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
    skillDesc: 'Nâng tầm chất lượng sống cư dân & khách sạn, tăng +70% doanh thu/giây và +10 Hạnh phúc.',
    yieldMultiplier: 0.7,
    happinessBonus: 10,
    costCoins: 45_000_000,
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
    skillDesc: 'Bậc thầy quản lý tài sản số, tăng +120% doanh thu/giây và kích thích lãi suất toàn phố.',
    yieldMultiplier: 1.2,
    happinessBonus: 12,
    costCoins: 90_000_000,
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
    skillDesc: 'Thiên tài công nghệ điều phối mọi phân khu, tăng +135% doanh thu/giây và +15 Hạnh phúc.',
    yieldMultiplier: 1.35,
    happinessBonus: 15,
    costCoins: 150_000_000,
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
    title: 'Đặt tên thành phố',
    description: 'Bấm vào bảng tên trên thanh HUD để đặt tên Thị Trưởng & Thành Phố (đừng để tên mặc định kẻo Shipper tìm không ra!).',
    rewardCoins: 5_000_000,
    rewardGems: 3,
    stage: 1,
    rewardXp: 150,
  },
  {
    id: 'q-first-home',
    title: 'Xây khu dân cư đầu tiên',
    description: 'Thuê ít nhất 1 lô Nhà Trọ (Khu Nhà Phố hoặc Ký Túc Xá) để kéo người đến phố. Không có dân thì tiệm ế.',
    rewardCoins: 15_000_000,
    rewardGems: 3,
    stage: 1,
    rewardXp: 200,
  },
  {
    id: 'q-first-store',
    title: 'Mở cửa hàng đầu tiên',
    description: 'Khai trương 1 cửa hàng thương mại để tạo dòng tiền đầu tiên — đồng tiền duy nhất có thể trả nợ ông Chín.',
    rewardCoins: 10_000_000,
    rewardGems: 4,
    stage: 1,
    rewardXp: 250,
  },
  {
    id: 'q-install-qr',
    title: 'Lắp QR MoMo',
    description: 'Bấm vào 1 cửa hàng trên bản đồ và lắp đặt tiện ích “MoMo QR & Loa Thần Tài” đọc tiền về vang dội.',
    rewardCoins: 12_000_000,
    rewardGems: 5,
    stage: 1,
    rewardXp: 400,
  },
  {
    id: 'q-milestone-lv5',
    title: 'Nâng cửa hàng lên Cấp 5',
    description: 'Nâng cấp bất kỳ cửa hàng nào đạt mốc Cấp 5 để kích hoạt hệ số nhân đôi sản lượng đồng/giây.',
    rewardCoins: 15_000_000,
    rewardGems: 6,
    stage: 1,
    rewardXp: 600,
  },
  {
    id: 'q-cinema-tui-than-tai',
    title: 'Xây Rạp hoặc Túi Thần Tài',
    description: 'Thuê lô giải trí cao cấp: Rạp Chiếu Phim hoặc Trạm Túi Thần Tài. Biên lợi nhuận cao hơn tiệm cà phê.',
    rewardCoins: 25_000_000,
    rewardGems: 8,
    stage: 1,
    rewardXp: 900,
  },
  {
    id: 'q-hire-manager',
    title: 'Thuê quản lý đầu tiên',
    description: 'Mở bảng Quản lý Cửa hàng (tab Nhân Lực) và bổ nhiệm 1 Cổ Đông / Quản Lý chuyên trách để gia tăng doanh thu.',
    rewardCoins: 20_000_000,
    rewardGems: 10,
    stage: 1,
    rewardXp: 1_100,
  },
  {
    id: 'q-star-evolve',
    title: 'Tiến hóa lên ★★',
    description: 'Tiến hóa bất kỳ công trình nào từ 1★ lên 2★ để cả khu phố phải ngước nhìn.',
    rewardCoins: 30_000_000,
    rewardGems: 12,
    stage: 1,
    rewardXp: 1_300,
  },
  {
    /*
     * Thay cho q-fever-mode cũ (bấm nút Giờ Vàng x2) - nút đó đã bỏ cùng
     * toàn bộ hệ Bảo Vật/buff. Thưởng giữ nguyên, điều kiện đổi sang một
     * hành động thật không tạo thêm doanh thu miễn phí: thuê đủ 2 Quản Lý.
     */
    id: 'q-two-managers',
    title: 'Thuê 2 quản lý',
    description: 'Mở bảng Quản Lý Cửa Hàng và bổ nhiệm Quản Lý cho 2 cửa tiệm khác nhau.',
    rewardCoins: 35_000_000,
    rewardGems: 8,
    stage: 1,
    rewardXp: 1_000,
  },
  {
    id: 'q-expand-city',
    title: '6 công trình & 200 cư dân',
    description: 'Sở hữu từ 6 công trình trở lên và đón ít nhất 200 Cư dân về sinh sống nhộn nhịp.',
    rewardCoins: 50_000_000,
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
   * đã vài trăm đồng - thưởng 50.000 đồng không còn là phần thưởng nữa.
   */
  {
    id: 'q-full-street',
    title: 'Lấp đầy 12 lô đất',
    description: 'Sở hữu 12 công trình trên phố. Đất trống là tiền nằm im, Thị Trưởng ạ.',
    rewardCoins: 100_000_000,
    rewardGems: 25,
    stage: 2,
    rewardXp: 4_500,
  },
  {
    id: 'q-three-managers',
    title: '3 quản lý cùng lúc',
    description: 'Có ít nhất 3 cửa hàng đang được Quản Lý chuyên trách trông coi cùng lúc.',
    rewardCoins: 80_000_000,
    rewardGems: 30,
    stage: 2,
    rewardXp: 6_000,
  },
  {
    id: 'q-module-master',
    title: 'Lắp 6 tiện ích',
    description: 'Lắp tổng cộng 6 tiện ích lên các cửa hàng trong phố (QR, Loa, Thẻ Thành Viên...).',
    rewardCoins: 120_000_000,
    rewardGems: 35,
    stage: 2,
    rewardXp: 7_500,
  },
  {
    id: 'q-three-star',
    title: 'Tiến hóa lên ★★★',
    description: 'Tiến hóa bất kỳ công trình nào lên 3 sao. Bảng hiệu phải sáng cả khu.',
    rewardCoins: 150_000_000,
    rewardGems: 40,
    stage: 2,
    rewardXp: 10_000,
  },
  {
    id: 'q-level-20',
    title: 'Nâng công trình lên Cấp 20',
    description: 'Nâng bất kỳ công trình nào lên Cấp 20.',
    rewardCoins: 200_000_000,
    rewardGems: 45,
    stage: 2,
    rewardXp: 12_000,
  },
  {
    id: 'q-streak-7',
    title: '7 ngày chơi liên tiếp',
    description: 'Giữ chuỗi ngày chơi liên tiếp đạt 7 ngày.',
    rewardCoins: 250_000_000,
    rewardGems: 50,
    stage: 2,
    rewardXp: 9_000,
  },
  {
    id: 'q-tier-6',
    title: 'Đạt Rank 6',
    description: 'Đưa thành phố đạt Rank 6 - Đô Thị Quét Mã. Cả phố không còn ai thối tiền lẻ.',
    rewardCoins: 500_000_000,
    rewardGems: 60,
    stage: 2,
    rewardXp: 18_000,
  },
  {
    id: 'q-landmark',
    title: 'Xây Landmark',
    description: 'Xây Quảng Trường Heo Vàng hoặc Tháp Đôi Phố Thị.',
    rewardCoins: 1_000_000_000,
    rewardGems: 55,
    stage: 2,
    rewardXp: 14_000,
  },
];

/** Mốc cấp độ đột phá (Tier Breakthrough): đạt Lv.5, 10, 25, 50 nhận hệ số nhân lớn */
/**
 * MOC DOT PHA - cu moi 5 cap mot moc, de LUON co dot pha trong tam 5 cap toi.
 *
 * Ban cu chi co 4 moc 5/10/25/50: khoang 10->25 va 25->50 la mot doan phang
 * dai dang dang, doanh thu cong tuyen tinh con chi phi tang ham mu, nguoi choi
 * khong thay ly do nang tiep. Lich day hon giu "number go up" luon co dich gan.
 *
 * He so moc front-load (manh o dau de tao da), nho dan ve giua, roi mot cu
 * finale lon o cap 50. Tong he so tai cap 50 ~15x (ban cu ~17.8x) - khong lam
 * kinh te no vi chi phi nang cap van tang ham mu nhanh hon.
 */
export const MILESTONE_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const;

const MILESTONE_STEP: Record<number, number> = {
  5: 1.4, 10: 1.4, 15: 1.3, 20: 1.3, 25: 1.3,
  30: 1.25, 35: 1.25, 40: 1.25, 45: 1.2, 50: 1.5,
};

export function milestoneMultiplierFor(level: number): number {
  let mult = 1;
  for (const m of MILESTONE_LEVELS) {
    if (level >= m) mult *= MILESTONE_STEP[m];
  }
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
 * doanh thu: Thap MoMo dat 8.500 đồng (gap Thap/Ca phe = 140x) nhung san luong
 * gap 35x, nhan voi cap 50 + 5* + module + SSR + hieu ung lien ke thi doanh
 * thu gap 68.000x. Che do kinh doanh nhu vay khiến ca o cap 10 chi 1 phut hoa
 * von, cap 30 la 4,8 gio, cap 40 la 6,7 ngay - vung chet.
 *
 * Gan chi phi vao `baseYieldPerSec` lam thoi gian hoa von bang nhau o moi
 * tang cap, bat ke cong trinh nao, nen ca 20 cong trinh deu co nhip nang cap
 * nhat quan.
 */
/* ═══════════════════════════════════════════════════════════════════════════
 * CHI PHÍ NÂNG CẤP - MỖI NHÓM CÔNG TRÌNH MỘT HỒ SƠ ĐẦU TƯ RIÊNG
 *
 * Bản cũ dùng CHUNG một hệ số 600 và một tốc độ 1.15 cho mọi công trình, với
 * chủ ý cho thời gian hoàn vốn bằng nhau ở mọi nơi. Nhưng chính điều đó làm
 * người chơi KHÔNG CẦN NGHĨ: nâng cái gì cũng như nhau, nên không có quyết
 * định nào có ý nghĩa. Đo thực tế: mười cấp đầu hoàn vốn 22, 26, 29 phút,
 * gần như phẳng.
 *
 * Giờ bốn nhóm có bốn đường cong CẮT NHAU:
 *
 *   Thương mại  rẻ, hoàn vốn 14 phút ở cấp 1, nhưng leo nhanh nên cấp 49 là
 *               4,6 ngày. Tiền tươi sớm, biên giảm dần - đúng bản chất quán
 *               ăn và cửa hàng nhỏ.
 *   Dân cư      ở giữa. Không sinh nhiều doanh thu trực tiếp nhưng nuôi dân,
 *               mà thiếu dân thì mọi cửa hàng đều ế.
 *   Fintech     37 phút ở cấp 1, chậm gấp đôi thương mại. Bù lại leo chậm
 *               nên cấp 40 chỉ 8,6 giờ so với 25 giờ của thương mại.
 *   Landmark    chậm nhất lúc đầu, tốt nhất về sau.
 *
 * Hệ quả thiết kế: không thể dồn tiền vào một tiệm mãi. Muốn đi xa phải mở
 * rộng và phải đầu tư dài hạn - đó chính là bài học dòng tiền của game.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface HoSoNangCap {
  /** Hệ số chi phí, nhân với `baseYieldPerSec`. Cao = hoàn vốn lâu hơn. */
  heSo: number;
  /** Tốc độ leo chi phí mỗi cấp. Cao = biên lợi nhuận giảm nhanh. */
  tocDo: number;
}

/**
 * Hệ số chi phí nâng cấp theo zone.
 *
 * `tocDo` đã hạ từ {1.18, 1.15, 1.12, 1.10} xuống {1.14, 1.11, 1.08, 1.06}
 * khi bỏ `grossUp` trong `flowFor`. Bỏ grossUp làm thu nhập ròng giảm còn
 * ~24% gross, kéo hoàn vốn lên 4× — giảm tocDo bù lại để giữ dải 2-13 phút.
 *
 * Nguyên tắc: `tocDo` quyết định HÌNH DẠNG đường hoàn vốn (tăng theo cấp),
 * `heSo` quyết định VỊ TRÍ (cao hơn = hoàn vốn lâu hơn ở mọi cấp).
 */
const HO_SO_NANG_CAP: Record<ZoneMeta['type'], HoSoNangCap> = {
  COMMERCIAL: { heSo: 0.1, tocDo: 1.14 },
  RESIDENTIAL: { heSo: 0.02, tocDo: 1.11 },
  FINTECH: { heSo: 0.03, tocDo: 1.08 },
  LANDMARK: { heSo: 0.05, tocDo: 1.06 },
};

/** Chi phí lên cấp mới. Làm tròn về 5 đơn vị để số đẹp. */
export function upgradeCostCoins(def: BuildingDef, currentLevel: number): number {
  const ho = HO_SO_NANG_CAP[def.zone] ?? HO_SO_NANG_CAP.COMMERCIAL;
  const raw = def.baseYieldPerSec * ho.heSo * Math.pow(ho.tocDo, currentLevel - 1);
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

/**
 * KHÔNG CÒN VẬT PHẨM TRANG BỊ HAY BUFF.
 *
 * Trước đây có 4 CONSUMABLE (Loa Phường, Giờ Vàng x2, Bao Lì Xì, Bản Vẽ Quy
 * Hoạch +1 cấp miễn phí) và 4 RELIC (Bảo Vật trang bị, cộng dồn tới +90%
 * doanh thu nếu trang bị đủ 3 cái). Bỏ thẳng, không giảm nhẹ: thành phố mới
 * tạo còn tự động trang bị sẵn `relic-heo-vang` (+25%) và tặng kèm
 * `relic-cup-qr` (+30%) MIỄN PHÍ trong `STARTER_INVENTORY` - một người chơi
 * mới vào game đã có +55% doanh thu không tốn một đồng nào, đè thẳng lên
 * đường cân bằng kinh tế vừa chỉnh theo nhóm công trình.
 *
 * Chỉ còn GIFT - quà tặng cho NPC để tăng Tín Cậy/Hạnh Phúc, không phải tự
 * buff bản thân hay thành phố.
 */
export const INVENTORY_ITEMS: InventoryItemDef[] = [
  {
    id: 'gift-tra-sua',
    name: 'Ly Trà Sữa Full Topping',
    category: 'GIFT',
    rarity: 'R',
    description: 'Món quà quốc dân giải nhiệt chiều hè, tặng cho các chủ tiệm và cư dân để gắn kết tình làng nghĩa xóm.',
    effectSummary: 'Tặng cư dân: +25 Tin Cậy (Mở khóa QR) & +10 Hạnh Phúc',
    hue: '#EC4899',
    costCoins: 35_000,
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
    costCoins: 350_000,
    costGems: 0,
  },
];

export const INVENTORY_BY_ID: Record<string, InventoryItemDef> = Object.fromEntries(
  INVENTORY_ITEMS.map((item) => [item.id, item]),
);

export const STARTER_INVENTORY: Record<string, number> = {
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
  /**
   * Thu mo ra khi dat bac nay - LY DO de nguoi choi leo bac. Gom san pham
   * tai chinh MoMo moi va/hoac nhom cong trinh/zone moi duoc phep xay.
   */
  unlocks?: {
    /** Tieu de ngan hien o bang bac, vd "Mo Vay Nhanh". */
    headline: string;
    /** Mo ta 1 cau: hoc duoc gi / lam duoc gi moi. */
    detail: string;
    /** Tag san pham MoMo neu bac nay mo mot san pham tai chinh. */
    productTag?: string;
    /** Cong trinh moi duoc phep xay tu bac nay. */
    buildingIds: string[];
  };
}

export const CITY_TIERS: CityTierDef[] = [
  {
    id: 'tier-xom-choi-la', rank: 1, name: 'Xóm Chòi Lá',
    tagline: 'Mới dựng tạm vài mái che, mưa xuống là cả xóm chạy dột.',
    minPopulation: 0, minBuildings: 0,
    rewardCoins: 0, rewardGems: 0, rewardXp: 0,

    unlocks: {
      headline: 'Mở Khóa: Quán Cà Phê, Nhà Phố, Siêu Thị & Công Viên',
      detail: 'Khởi đầu gánh hàng vỉa hè. Bạn toàn quyền tự do xây dựng và sắp xếp dãy phố đầu tiên theo ý thích!',
      buildingIds: ['quan-ca-phe','nha-pho-binh-dan','sieu-thi','cong-vien'],
    },
  },
  {
    id: 'tier-hem-ba-gac', rank: 2, name: 'Hẻm Ba Gác',
    tagline: 'Hẻm vừa đúng một chiếc ba gác, hàng quán bắt đầu sáng đèn.',
    minPopulation: 150, minBuildings: 3,
    rewardCoins: 20_000_000, rewardGems: 5, rewardXp: 900,

    unlocks: {
      headline: 'Mở Khóa: Ký Túc Xá Sinh Viên & Phố Ẩm Thực Đêm',
      detail: 'Đón 180 sinh viên trẻ náo nhiệt, mở dãy hàng ăn đêm lung linh ánh đèn và trạm tích lũy Heo Vàng.',
      buildingIds: ['ky-tuc-xa-sinh-vien','pho-am-thuc','tram-tui-than-tai'],
    },
  },
  {
    id: 'tier-pho-via-he', rank: 3, name: 'Phố Vỉa Hè',
    tagline: 'Dãy phố mặt tiền lung linh, xe cộ tấp nập từ sáng tới khuya.',
    minPopulation: 500, minBuildings: 6,
    rewardCoins: 80_000_000, rewardGems: 10, rewardXp: 2_400,

    unlocks: {
      headline: 'Mở Khóa: Rạp Chiếu Phim & Trạm Tiện Ích Đô Thị',
      detail: 'Rạp chiếu phim cuối tuần, trạm tiện ích phục vụ người dân và ngân hàng cấp vốn kinh doanh.',
      buildingIds: ['rap-phim-momo','tram-hoa-don','ngan-hang-so'],
    },
  },
  {
    id: 'tier-thi-tu-tra-da', rank: 4, name: 'Thị Tứ Trà Đá',
    tagline: 'Đông đúc nhộn nhịp, góc phố rôm rả tiếng cười nói của cư dân.',
    minPopulation: 2_000, minBuildings: 10,
    rewardCoins: 250_000_000, rewardGems: 18, rewardXp: 5_200,

    unlocks: {
      headline: 'Mở Khóa: Chung Cư SmartHome & Khu Mua Sắm',
      detail: 'Tòa tháp căn hộ hiện đại đón 320 cư dân mới, mở rộng trung tâm mua sắm kéo dòng người tấp nập.',
      buildingIds: ['trung-tam-vi-tra-sau','chung-cu-cao-cap'],
    },
  },
  {
    id: 'tier-quan-tra-sua', rank: 5, name: 'Quận Trà Sữa',
    tagline: 'GenZ kéo tới check-in, cả con phố biến thành điểm hẹn sôi động.',
    minPopulation: 5_500, minBuildings: 16,
    rewardCoins: 800_000_000, rewardGems: 30, rewardXp: 9_000,

    unlocks: {
      headline: 'Mở Khóa: Tổ Hợp Khách Sạn & Đại Siêu Thị Mega',
      detail: 'Khách sạn đón khách du lịch thập phương, đại siêu thị hoành tráng nâng tầm đẳng cấp quận.',
      buildingIds: ['to-hop-du-lich','trung-tam-thuong-mai'],
    },
  },
  {
    id: 'tier-do-thi-quet-ma', rank: 6, name: 'Đại Lộ Ánh Đèn',
    tagline: 'Dãy nhà phố hiện đại rực sáng, thành phố chuyển mình thành trung tâm sầm uất.',
    minPopulation: 14_000, minBuildings: 24,
    rewardCoins: 2_000_000_000, rewardGems: 45, rewardXp: 14_000,

    unlocks: {
      headline: 'Mở Khóa: Học Viện Đô Thị & Tòa Nhà Tài Chính',
      detail: 'Nâng cao dân trí, mở trung tâm tri thức và sàn giao dịch tài chính quy mô lớn.',
      buildingIds: ['hoc-vien-tai-chinh','san-chung-khoan'],
    },
  },
  {
    id: 'tier-dai-do-thi-ting-ting', rank: 7, name: 'Đại Đô Thị Phồn Vinh',
    tagline: 'Thành phố náo nhiệt suốt ngày đêm, người người tấp nập trên đại lộ thênh thang.',
    minPopulation: 24_000, minBuildings: 34,
    rewardCoins: 5_000_000_000, rewardGems: 60, rewardXp: 20_000,

    unlocks: {
      headline: 'Mở Khóa: Quảng Trường Ánh Sáng & Trung Tâm Dữ Liệu',
      detail: 'Quảng trường lễ hội hoa lệ và trung tâm công nghệ cao kết nối toàn bộ hoạt động đô thị.',
      buildingIds: ['trung-tam-du-lieu','quang-truong-heo-vang'],
    },
  },
  {
    id: 'tier-sieu-do-thi-khong-tien-mat', rank: 8, name: 'Siêu Đô Thị Kỳ Quan',
    tagline: 'Đỉnh cao phồn vinh. Thành phố trong mơ do chính tay bạn kiến tạo.',
    minPopulation: 40_000, minBuildings: 46,
    rewardCoins: 15_000_000_000, rewardGems: 100, rewardXp: 25_000,

    unlocks: {
      headline: 'Kỳ Quan: Tháp Landmark Biểu Tượng Chọc Trời',
      detail: 'Khánh thành Tháp Đôi Biểu Tượng kiêu hãnh giữa trời mây, hoàn tất hành trình đô thị trong mơ!',
      buildingIds: ['thap-momo'],
    },
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
    rewardCoins: 500_000, rewardGems: 2, rewardXp: 1_600,
  },
  {
    id: 'd-nang-cap', title: 'Nâng cấp công trình 3 lượt',
    counter: 'upgraded', target: 3,
    rewardCoins: 800_000, rewardGems: 2, rewardXp: 2_200,
  },
  {
    id: 'd-xu-chuyen-pho', title: 'Phân xử 2 Chuyện Phố',
    counter: 'eventsResolved', target: 2,
    rewardCoins: 1_000_000, rewardGems: 3, rewardXp: 2_800,
  },
  {
    id: 'd-mo-tiem', title: 'Mở thêm 1 tiệm mới',
    counter: 'built', target: 1,
    rewardCoins: 600_000, rewardGems: 2, rewardXp: 1_800,
  },
  {
    /**
     * Dung het counter `starEvolved`: `evolveBuildingStar` da dem san nhung khong
     * quest nao doc, nen nhanh tien hoa 1 sao khong co do dua gi. Day la vong
     * lap tach bi bo sot khi them cac bo dem moi.
     */
    id: 'd-tien-hoa', title: 'Dát vàng 1 tiệm lên ★★',
    counter: 'starEvolved', target: 1,
    rewardCoins: 1_200_000, rewardGems: 3, rewardXp: 4_500,
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
  { days: 3, title: '3 ngày — Phố đã quen mặt bạn', rewardCoins: 20_000_000, rewardGems: 2, rewardXp: 3_000 },
  { days: 7, title: '1 tuần — Hàng xóm kín chào', rewardCoins: 60_000_000, rewardGems: 5, rewardXp: 9_000 },
  { days: 14, title: '2 tuần — Thị Trưởng được cử tri tín nhiệm', rewardCoins: 180_000_000, rewardGems: 10, rewardXp: 20_000 },
  { days: 30, title: '1 tháng — Cả thành phố đứng sau lưng bạn', rewardCoins: 600_000_000, rewardGems: 25, rewardXp: 45_000 },
  { days: 60, title: '2 tháng — Rank thành phố không còn chờ ai', rewardCoins: 1_500_000_000, rewardGems: 50, rewardXp: 90_000 },
  { days: 100, title: '100 ngày — Huyền thoại Đại Lộ Hoa Sữa', rewardCoins: 5_000_000_000, rewardGems: 100, rewardXp: 180_000 },
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
