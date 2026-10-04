import { BUILDING_BY_ID } from './mock-city-data';
import type { CityState } from './types';

/* ═══════════════════════════════════════════════════════════════════════════
 * HƯỚNG DẪN — TỰ KINH DOANH 1 CỬA HÀNG TỪ A-Z
 *
 * Nguyên tắc: HỌC BẰNG CÁCH LÀM, không phải đọc slide.
 *
 * Flow: Mở tiệm → Bấm xem tiệm → Nâng cấp → Thuê nhân viên →
 *       Xây khu dân cư → Đọc Sổ Cái
 *
 * Mỗi bước yêu cầu một thao tác thật, game đọc state để biết đã xong chưa,
 * rồi mới mở phần giải thích. Trình tự đó quan trọng: nói trước thì người
 * chơi bấm cho qua, nói sau khi họ vừa tự tay làm thì khái niệm có chỗ bám.
 *
 * Mỗi bước dạy ĐÚNG MỘT khái niệm. Nhồi hai khái niệm vào một bước thì
 * không khái niệm nào đọng lại.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface TutorialStep {
  id: string;
  /** Việc cần làm, viết ở thể mệnh lệnh. */
  title: string;
  /** Hướng dẫn thao tác. Ngắn, không giải thích gì ở đây. */
  how: string;
  /**
   * Khái niệm tài chính, chỉ hiện SAU KHI người chơi làm xong.
   * Đây mới là lý do tồn tại của cả màn hướng dẫn.
   */
  lesson: string;
  /** Nút trên thanh dock cần làm nổi bật, khớp `data-tour`. */
  anchor?: string;
  /** Đã xong chưa. Đọc state thật, không tin vào việc người chơi bấm "Tiếp". */
  done: (s: CityState) => boolean;
}

/** Một mốc chỉ UI mới biết, ví dụ "đã mở Sổ Cái". */
export function hasFlag(s: CityState, flag: string): boolean {
  return (s.tutorialFlags ?? []).includes(flag);
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  /* ─── BƯỚC 1: MỞ CỬA HÀNG ─────────────────────────────────────────────── */
  {
    id: 'mo-tiem',
    title: '① Act 1: Khởi nghiệp & Dòng tiền đầu tiên',
    how: 'Bấm "Mở Tiệm Mới" bên dưới → chọn loại quán → bấm vào ô đất trống để đặt. Quán Cà Phê rẻ nhất — thử đó trước!',
    lesson:
      'Bài học Act 1 - Có tiền chưa chắc đã giàu: Mở tiệm = khởi tạo dòng tiền (Cashflow). Tiền nằm chết trong đất không đẻ ra lãi, chỉ có mô hình kinh doanh tạo dòng tiền thuần thặng dư mới giúp thị trấn tự vận hành bền vững.',
    anchor: 'build',
    done: (s) => s.buildings.some((b) => BUILDING_BY_ID[b.defId]?.zone === 'COMMERCIAL'),
  },

  /* ─── BƯỚC 2: BẤM VÀO TIỆM ĐỂ XEM CHI TIẾT ───────────────────────────── */
  {
    id: 'xem-tiem',
    title: '② Bấm vào tiệm để xem sổ sách',
    how: 'Bấm trực tiếp vào cửa hàng trên phố (hoặc nút "Quản Lý" ở thanh dưới). Xem tab Chi Tiết — có doanh thu, tốc độ phục vụ và sức chứa hàng đợi.',
    lesson:
      'Bài học Act 2 - Tiền đẻ ra tiền: Doanh thu cao không đồng nghĩa với business tốt nếu Chi phí thuê & vận hành quá lớn. Doanh thu 10M, Chi phí 12M ➔ Cashflow -2M. Phải luôn quản trị biên lợi nhuận ròng!',
    anchor: 'manage',
    done: (s) => hasFlag(s, 'inspector'),
  },

  /* ─── BƯỚC 3: NÂNG CẤP TIỆM ─────────────────────────────────────────── */
  {
    id: 'nang-cap',
    title: '③ Nâng cấp tiệm & Thu hồi vốn',
    how: 'Trong bảng quản lý tiệm, bấm tab "Nâng Cấp" → bấm nút "Nâng +1 Cấp". Doanh thu tăng ngay lập tức.',
    lesson:
      'Bài học Nguồn vốn & Thu hồi (ROIC): Nâng cấp là tái đầu tư lợi nhuận. Luôn tính thời gian hoàn vốn (Payback Period) trước khi quyết định dồn vốn mở rộng.',
    anchor: 'shop-tab-upgrade',
    done: (s) => s.buildings.some((b) => b.level >= 2),
  },

  /* ─── BƯỚC 4: THUÊ NHÂN VIÊN ────────────────────────────────────────── */
  {
    id: 'thue-nv',
    title: '④ Thuê nhân viên — Tối ưu năng suất',
    how: 'Vẫn trong bảng tiệm, bấm tab "Nhân Lực" → bấm "Thuê Nhân Viên thứ 1". Tốc độ phục vụ tăng, khách được xử lý nhanh hơn.',
    lesson:
      'Năng suất lao động là chìa khóa giải quyết "nghẽn cổ chai". Thuê thêm nhân sự đúng lúc giúp tự động hóa khâu phục vụ và tối đa hóa sản lượng bán.',
    anchor: 'shop-tab-staff',
    done: (s) => s.buildings.some((b) => (b.staffCount ?? 0) >= 1),
  },

  /* ─── BƯỚC 5: XÂY KHU DÂN CƯ ─────────────────────────────────────────── */
  {
    id: 'xay-nha',
    title: '⑤ Xây khu nhà ở — Tạo sức mua cư dân',
    how: 'Bấm "Mở Tiệm Mới" → chọn nhóm "Dân Cư" → đặt một Khu Nhà Phố lên ô đất trống. Tiệm cần người mua mới hoạt động hết công suất.',
    lesson:
      'Bài học Kinh tế vĩ mô: Tiện ích an sinh và nhà ở tạo ra cư dân. Cư dân có việc làm và thu nhập tốt sẽ là nguồn cầu tiêu dùng bền vững cho các cửa hàng trong phố.',
    anchor: 'build',
    done: (s) => s.buildings.some((b) => (BUILDING_BY_ID[b.defId]?.population ?? 0) > 0),
  },

  /* ─── BƯỚC 6: ĐỌC SỔ CÁI ─────────────────────────────────────────────── */
  {
    id: 'doc-so-cai',
    title: '⑥ Đọc Sổ Cái — Đánh giá WEALTH MATRIX',
    how: 'Bấm "Thị Chính" ở thanh dưới → chọn tab "Sổ Cái". Đây là báo cáo kết quả kinh doanh toàn thành phố.',
    lesson:
      'Bài học Act 5 - Xây dựng Cơ Đồ Bền Vững: Đọc P&L từ Doanh thu gộp ➔ Giá vốn ➔ Chi phí vận hành ➔ Lãi vay ➔ Lợi nhuận ròng. Thị trấn bền vững là thị trấn có thanh khoản an toàn, dòng tiền dương và cư dân hạnh phúc!',
    anchor: 'cityhall',
    done: (s) => hasFlag(s, 'ledger'),
  },
];

/** Bước hiện tại, `null` khi đã xong hoặc đã bỏ qua. */
export function currentTutorialStep(s: CityState): TutorialStep | null {
  const i = s.tutorialStep ?? 0;
  if (i < 0 || i >= TUTORIAL_STEPS.length) return null;
  return TUTORIAL_STEPS[i];
}
