import type { ArchetypeId, NpcRole, ServiceId, ZoneType } from './types';

export interface ArchetypeDef {
  id: ArchetypeId;
  role: NpcRole;
  /** Nhan ngan hien tren bong bong thoai. */
  label: string;
  /** Pain point that - dung de viet thoai, khong hien thi truc tiep. */
  painPoint: string;
  /** Mau nhan dien tren marker. */
  hue: string;
  /** Trust khoi diem. Tieu thuong cash-first bat dau thap nhat. */
  startTrust: number;
  /** Dich vu ho co san tu dau. */
  startServices: ServiceId[];
}

/**
 * 5 archetype duoc chon co chu dich: 4/5 nam o Use Case dang co SoV thap
 * (Vay Nhanh 6%, CIC 0%, Tiet kiem 0%), de game educate dung mang dang yeu.
 */
export const ARCHETYPES: Record<ArchetypeId, ArchetypeDef> = {
  MERCHANT_CASH: {
    id: 'MERCHANT_CASH',
    role: 'MERCHANT',
    label: 'Tiểu thương chợ',
    painPoint: 'Sợ phí, sợ lộ doanh thu, quen tiền mặt',
    hue: '#EB2F96',
    startTrust: 15,
    startServices: [],
  },
  MERCHANT_ESTABLISHED: {
    id: 'MERCHANT_ESTABLISHED',
    role: 'MERCHANT',
    label: 'Chủ tiệm lâu năm',
    painPoint: 'Thiếu vốn nhập hàng, không có sổ sách chứng minh',
    hue: '#D946EF',
    startTrust: 35,
    startServices: [],
  },
  GIG_WORKER: {
    id: 'GIG_WORKER',
    role: 'CITIZEN',
    label: 'Tài xế & Tự do',
    painPoint: 'Thu nhập bấp bênh, kẹt tiền giữa tháng',
    hue: '#F59E0B',
    startTrust: 45,
    startServices: [],
  },
  SALARIED: {
    id: 'SALARIED',
    role: 'CITIZEN',
    label: 'Dân văn phòng',
    painPoint: 'Tiền nằm không sinh lời, không kiểm soát chi tiêu',
    hue: '#16A34A',
    startTrust: 60,
    startServices: ['QR_PAYMENT'],
  },
  STUDENT: {
    id: 'STUDENT',
    role: 'CITIZEN',
    label: 'Sinh viên Gen Z',
    painPoint: 'Thích săn vé xem phim, trà sữa nhưng thiếu hạn mức trả sau',
    hue: '#2563EB',
    startTrust: 55,
    startServices: ['QR_PAYMENT'],
  },
  FAMILY: {
    id: 'FAMILY',
    role: 'CITIZEN',
    label: 'Gia đình trẻ',
    painPoint: 'Lo đóng hóa đơn điện nước, học phí và bảo hiểm cho con',
    hue: '#0EA5E9',
    startTrust: 65,
    startServices: ['QR_PAYMENT', 'SAVINGS'],
  },
  CINEPHILE: {
    id: 'CINEPHILE',
    role: 'CITIZEN',
    label: 'Tín đồ Điện ảnh',
    painPoint: 'Săn vé phim bom tấn cuối tuần & combo bắp nước',
    hue: '#EC4899',
    startTrust: 70,
    startServices: ['QR_PAYMENT', 'BNPL'],
  },
  TRAVELER: {
    id: 'TRAVELER',
    role: 'CITIZEN',
    label: 'Du khách & Phượt thủ',
    painPoint: 'Cần đặt vé máy bay, khách sạn nhanh chóng không tiền mặt',
    hue: '#06B6D4',
    startTrust: 75,
    startServices: ['QR_PAYMENT', 'BNPL'],
  },
  INVESTOR: {
    id: 'INVESTOR',
    role: 'CITIZEN',
    label: 'Nhà đầu tư trẻ',
    painPoint: 'Tìm kênh sinh lời kép từ Túi Thần Tài và Quỹ Mở',
    hue: '#8B5CF6',
    startTrust: 80,
    startServices: ['QR_PAYMENT', 'SAVINGS', 'CREDIT_SCORE'],
  },
  ELDER: {
    id: 'ELDER',
    role: 'CITIZEN',
    label: 'Bô lão khu phố',
    painPoint: 'Gắn kết tình làng nghĩa xóm và phong trào Heo Vàng nhân ái',
    hue: '#D97706',
    startTrust: 50,
    startServices: [],
  },
};

export interface AdvisorDef {
  id: string;
  name: string;
  roleTitle: string;
  specialty: string;
  tip: string;
  hue: string;
}

export const CITY_ADVISORS: AdvisorDef[] = [
  {
    id: 'advisor-mai',
    name: 'Chị Mai Quy Hoạch',
    roleTitle: 'Cố vấn Đô thị & Dân sinh',
    specialty: 'Quy hoạch Combo liền kề & Cân bằng nhà ở',
    tip: 'Đặt Rạp Phim cạnh Quán Cà Phê hoặc Phố Ẩm Thực sẽ kích hoạt Combo +25% Xu/giây!',
    hue: '#16A34A',
  },
  {
    id: 'advisor-hung',
    name: 'Anh Hưng Tài Chính',
    roleTitle: 'Chuyên gia Túi Thần Tài & Đầu tư',
    specialty: 'Lãi kép tự động & Tiện ích MoMo',
    tip: 'Xây Trạm Túi Thần Tài giúp toàn bộ số Xu nhàn rỗi của Thị Trưởng tự đẻ lãi kép mỗi giây.',
    hue: '#2563EB',
  },
  {
    id: 'advisor-heo-vang',
    name: 'Bé Heo Vàng MoMo',
    roleTitle: 'Sứ giả Sự kiện & Phúc lợi',
    specialty: 'Giờ Vàng Siêu Ứng Dụng (Fever x2 Xu)',
    tip: 'Trang bị Tượng Heo Vàng trong Kho Đồ và bật Giờ Vàng để nhân đôi doanh thu toàn phố!',
    hue: '#EB2F96',
  },
  {
    id: 'advisor-ong-loc',
    name: 'Ông Lộc Vé Số',
    roleTitle: 'Bô lão Tổ Dân Phố & Thần Tài Hẻm',
    specialty: 'Tin tức dân phố & Chuyện vỉa hè',
    tip: 'Bà con tiểu thương rất quý ai tặng Trà Sữa hoặc lắp Loa Thần Tài miễn phí cho tiệm!',
    hue: '#D97706',
  },
  {
    id: 'advisor-co-ba',
    name: 'Cô Ba Bánh Mì Sài Gòn',
    roleTitle: 'Hội trưởng Tiểu Thương Chợ Đêm',
    specialty: 'Chuyển đổi số & Quét mã QR',
    tip: 'Tiệm nào điểm Tin Cậy đạt 60+ sẽ tự động nhận thanh toán QR, doanh thu nhảy vọt 35%!',
    hue: '#E11D48',
  },
  {
    id: 'advisor-bao-ngoc',
    name: 'Bảo Ngọc KOC',
    roleTitle: 'Reviewer Ẩm Thực & Điện Ảnh',
    specialty: 'Livestream quảng bá & Kéo khách Gen Z',
    tip: 'Dùng Loa Phường Phát Thanh Vàng trong Kho Đồ để +20 Tin Cậy toàn khu phố, đủ để mấy chủ tiệm chịu quét QR!',
    hue: '#8B5CF6',
  },
  {
    id: 'advisor-khoa-shipper',
    name: 'Anh Khoa Shipper Công Nghệ',
    roleTitle: 'Đội trưởng Giao Hàng Siêu Tốc',
    specialty: 'Kết nối đơn hàng & Logistics nội đô',
    tip: 'Càng nhiều Cửa Hàng Thương Mại cạnh Khu Dân Cư, luồng đơn giao hàng mỗi giây càng dày!',
    hue: '#0EA5E9',
  },
  {
    id: 'advisor-giao-su-khai',
    name: 'Chuyên Gia Khải Chứng Khoán',
    roleTitle: 'Cố vấn Sàn Giao Dịch & Quỹ Mở',
    specialty: 'Quản trị vốn & Bảo vật Thị Trưởng',
    tip: 'Đừng quên mở Kho Đồ để trang bị tối đa 3 Bảo Vật Thị Trưởng giúp cộng dồn tới +90% sản lượng Xu!',
    hue: '#7C3AED',
  },
];

/** Ten theo archetype, xoay vong khi thanh pho co nhieu cong trinh cung loai. */
const NAME_POOL: Record<ArchetypeId, string[]> = {
  MERCHANT_CASH: ['Cô Ba', 'Dì Bảy', 'Cô Tư', 'Bà Năm', 'Chị Sáu', 'Cô Tám Chè', 'Dì Mười Xôi', 'Chị Hai Bún'],
  MERCHANT_ESTABLISHED: ['Bác Hùng', 'Chú Thành', 'Ông Dư', 'Bác Quý', 'Anh Lâm', 'Chú Bảy Sửa Xe', 'Bác Sáu Gạo', 'Anh Phúc Điện Máy'],
  GIG_WORKER: ['Anh Tuấn', 'Anh Khoa', 'Anh Dũng', 'Anh Phát', 'Minh', 'Tài Shipper', 'Hải Xe Ôm', 'Kiệt Freelancer'],
  SALARIED: ['Chị Lan', 'Chị Thu', 'Anh Bình', 'Chị Vy', 'Chị Thảo', 'Anh Hoàng IT', 'Chị Ngân Kế Toán', 'Anh Huy Designer'],
  STUDENT: ['Đạt', 'Trang', 'Ngọc', 'Huy', 'Bé Nam', 'Khánh Gen Z', 'Mỹ Linh ĐH', 'Tuấn KTX'],
  FAMILY: ['Gia đình anh Hải', 'Vợ chồng chị Mai', 'Nhà anh Khôi', 'Gia đình chị Hạnh', 'Nhà bác Hòa', 'Vợ chồng trẻ Minh - Thư'],
  CINEPHILE: ['Hoàng Cine', 'Linh Phim Ảnh', 'Tuấn Rạp Chiếu', 'Phương Review', 'Bảo Ngọc KOC', 'Đức Mê Bom Tấn'],
  TRAVELER: ['Kiên Phượt Thủ', 'Bích Du Lịch', 'Đoàn Khách VIP', 'Lâm Blogger', 'Nhóm Bạn Đà Lạt', 'Chị Hương Săn Vé'],
  INVESTOR: ['Chuyên gia Khải', 'Nhà đầu tư An', 'Quốc Chứng Khoán', 'Tâm Quỹ Mở', 'Anh Long Tài Chính', 'Chị Châu Cổ Đông'],
  ELDER: ['Ông Lộc', 'Bác Tổ Trưởng', 'Cụ Tâm', 'Bà Phúc', 'Ông Bảy Cờ Tướng', 'Bác Tư Trà Đá'],
};

/** Nghe nghiep gan voi ten, giup bong bong thoai co ngu canh. */
const TRADE_LABEL: Record<ArchetypeId, string[]> = {
  MERCHANT_CASH: ['bún riêu', 'bánh mì', 'cà phê cóc', 'chè hẻm', 'xôi sáng', 'hủ tiếu gõ', 'cơm tấm đêm', 'sinh tố vỉa hè'],
  MERCHANT_ESTABLISHED: ['tạp hoá', 'vật liệu', 'sửa xe', 'điện máy', 'gạo', 'nhà thuốc', 'tiệm vàng', 'văn phòng phẩm'],
  GIG_WORKER: ['shipper', 'xe ôm công nghệ', 'giao hàng nhanh', 'tài xế', 'freelancer', 'streamer', 'nhiếp ảnh dạo', 'cứu hộ xe'],
  SALARIED: ['văn phòng', 'kế toán', 'nhân sự', 'thiết kế', 'kinh doanh', 'kỹ sư phần mềm', 'trưởng phòng', 'chuyên viên'],
  STUDENT: ['sinh viên ĐH', 'Gen Z', 'sinh viên năm 2', 'sinh viên năm 3', 'thực tập sinh', 'câu lạc bộ âm nhạc', 'thủ khoa'],
  FAMILY: ['cư dân chung cư', 'cư dân khu phố', 'hộ gia đình', 'cư dân mới', 'ban quản trị', 'hội phụ huynh'],
  CINEPHILE: ['mê phim rạp', 'săn vé sớm', 'fan điện ảnh', 'khách VIP rạp', 'sưu tầm bắp nước', 'reviewer'],
  TRAVELER: ['săn vé máy bay', 'khách đặt phòng', 'du khách', 'phượt thủ', 'review khách sạn', 'tour xuyên Việt'],
  INVESTOR: ['tích lũy Thần Tài', 'đầu tư Quỹ Mở', 'cổ đông đô thị', 'chuyên gia tài chính', 'cố vấn dòng tiền', 'săn cổ tức'],
  ELDER: ['bán vé số', 'tổ dân phố', 'hội người cao tuổi', 'cư dân lâu năm', 'câu lạc bộ dưỡng sinh', 'trông coi khu phố'],
};

/**
 * Chon archetype da dang cho cong trinh moi xay.
 */
export function archetypeForBuilding(
  zone: ZoneType,
  costCoins: number,
  seedIndex: number,
): ArchetypeId | null {
  if (zone === 'COMMERCIAL') {
    if (costCoins >= 1200) {
      const pool: ArchetypeId[] = ['MERCHANT_ESTABLISHED', 'CINEPHILE', 'TRAVELER'];
      return pool[seedIndex % pool.length];
    }
    return 'MERCHANT_CASH';
  }
  if (zone === 'RESIDENTIAL') {
    const citizens: ArchetypeId[] = ['STUDENT', 'SALARIED', 'GIG_WORKER', 'FAMILY', 'ELDER'];
    return citizens[seedIndex % citizens.length];
  }
  if (zone === 'FINTECH') {
    return 'INVESTOR';
  }
  return null;
}

export function npcNameFor(archetype: ArchetypeId, seedIndex: number): string {
  const names = NAME_POOL[archetype];
  const trades = TRADE_LABEL[archetype];
  const name = names[seedIndex % names.length];
  const trade = trades[seedIndex % trades.length];
  return `${name} (${trade})`;
}

/** Nguong trust de chu tiem tu dong dong y nhan thanh toan so. */
export const DIGITAL_TRUST_THRESHOLD = 60;

export const SERVICE_LABEL: Record<ServiceId, string> = {
  QR_PAYMENT: 'Thanh toán QR',
  CREDIT: 'Vay vốn',
  BNPL: 'Trả sau',
  SAVINGS: 'Tích luỹ',
  CREDIT_SCORE: 'Hồ sơ tín dụng',
  INSURANCE: 'Bảo hiểm',
};

/**
 * Cong cu that tren momo.vn ung voi tung dich vu vua mo trong game.
 * Chi hien SAU khi nguoi choi da giai quyet xong tinh huong - dung nguyen tac
 * Result -> Need -> Capability -> CTA, khong phai Result -> Promotion.
 */
export const SERVICE_TOOL: Record<ServiceId, { label: string; href: string } | null> = {
  QR_PAYMENT: {
    label: 'Thử công cụ phân bổ chi tiêu thực tế',
    href: '/tai-chinh/cong-cu/phan-bo-chi-tieu-50-30-20',
  },
  CREDIT: {
    label: 'Tính khả năng vay an toàn của bạn',
    href: '/tai-chinh/cong-cu/kha-nang-vay',
  },
  BNPL: {
    label: 'Kiểm tra tỉ lệ nợ trên thu nhập',
    href: '/tai-chinh/cong-cu/ti-le-no-thu-nhap',
  },
  SAVINGS: {
    label: 'Tính mục tiêu tích luỹ của bạn',
    href: '/tai-chinh/cong-cu/muc-tieu-tich-luy',
  },
  CREDIT_SCORE: {
    label: 'Tra cứu điểm tín dụng CIC',
    href: '/tai-chinh/tra-cuu-cic',
  },
  INSURANCE: null,
};

/**
 * He so chi tieu tang them khi cu dan co dich vu tai chinh.
 * Tin dung/tra sau mo rong suc chi, tiet kiem giu tien lai trong he.
 */
export const SERVICE_SPEND_BONUS: Record<ServiceId, number> = {
  QR_PAYMENT: 0.05,
  CREDIT: 0.22,
  BNPL: 0.18,
  SAVINGS: 0.08,
  CREDIT_SCORE: 0.1,
  INSURANCE: 0.06,
};
