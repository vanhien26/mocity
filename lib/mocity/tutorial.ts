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
    title: '① Khai trương cửa hàng đầu tiên',
    how: 'Bấm "Mở Tiệm Mới" bên dưới → chọn loại quán → bấm vào ô đất trống để đặt. Quán Cà Phê rẻ nhất — thử đó trước!',
    lesson:
      'Tiệm vừa mở là bắt đầu sinh tiền mỗi giây. Con số trên biển hiệu là lợi nhuận ròng — đã trừ nguyên liệu và mặt bằng rồi, thấp hơn doanh thu nhiều. Mở tiệm = bắt đầu dòng tiền, chưa phải tiền lời ngay.',
    anchor: 'build',
    done: (s) => s.buildings.some((b) => BUILDING_BY_ID[b.defId]?.zone === 'COMMERCIAL'),
  },

  /* ─── BƯỚC 2: BẤM VÀO TIỆM ĐỂ XEM CHI TIẾT ───────────────────────────── */
  {
    id: 'xem-tiem',
    title: '② Bấm vào tiệm để xem sổ sách',
    how: 'Bấm trực tiếp vào cửa hàng trên phố (hoặc nút "Quản Lý" ở thanh dưới). Xem tab Chi Tiết — có doanh thu, tốc độ phục vụ và sức chứa hàng đợi.',
    lesson:
      'Doanh thu/giây là sức khỏe của tiệm. Ba con số cần nhớ: doanh thu (tiền vào), tốc độ phục vụ (đơn/giây) và sức chứa (hàng đợi tối đa). Tiệm đông mà phục vụ chậm thì mất khách — không khác gì quán ngon mà thiếu nhân viên.',
    anchor: 'manage',
    done: (s) => hasFlag(s, 'inspector'),
  },

  /* ─── BƯỚC 3: NÂNG CẤP TIỆM ─────────────────────────────────────────── */
  {
    id: 'nang-cap',
    title: '③ Nâng cấp tiệm lên cấp 2',
    how: 'Trong bảng quản lý tiệm, bấm tab "Nâng Cấp" → bấm nút "Nâng +1 Cấp". Doanh thu tăng ngay lập tức.',
    lesson:
      'Nâng cấp là đầu tư vốn để tăng lợi nhuận. Trước khi bấm, nhìn gợi ý "Mẹo Thu Hồi Vốn" — biết bao lâu thu lại đủ tiền nâng cấp. Đó chính là cách đọc một khoản đầu tư: hỏi thời gian hoàn vốn trước, rồi mới tính lời.',
    anchor: 'shop-tab-upgrade',
    done: (s) => s.buildings.some((b) => b.level >= 2),
  },

  /* ─── BƯỚC 4: THUÊ NHÂN VIÊN ────────────────────────────────────────── */
  {
    id: 'thue-nv',
    title: '④ Thuê nhân viên — phục vụ nhanh hơn',
    how: 'Vẫn trong bảng tiệm, bấm tab "Nhân Lực" → bấm "Thuê Nhân Viên thứ 1". Tốc độ phục vụ tăng, khách được xử lý nhanh hơn.',
    lesson:
      'Nhân viên là chi phí một lần, tăng năng suất vĩnh viễn. Thuê thêm khi hàng đợi thường xuyên đầy — đó là dấu hiệu tiệm đang "nghẽn cổ chai" ở khâu phục vụ. Ngoài đời: đúng người đúng chỗ mới sinh lời, sai chỗ thì lãng phí.',
    anchor: 'shop-tab-staff',
    done: (s) => s.buildings.some((b) => (b.staffCount ?? 0) >= 1),
  },

  /* ─── BƯỚC 5: XÂY KHU DÂN CƯ ─────────────────────────────────────────── */
  {
    id: 'xay-nha',
    title: '⑤ Xây khu nhà ở để có khách',
    how: 'Bấm "Mở Tiệm Mới" → chọn nhóm "Dân Cư" → đặt một Khu Nhà Phố lên ô đất trống. Tiệm cần người mua mới hoạt động hết công suất.',
    lesson:
      'Không có người ở = không có khách = tiệm ế. Mở nhiều quán mà thiếu dân thì doanh thu mỗi quán thấp hơn tối đa. Trong game gọi là "hệ số lấp đầy" — ngoài đời là chọn mặt bằng sai: mở quán ở nơi không có khách qua lại.',
    anchor: 'build',
    done: (s) => s.buildings.some((b) => (BUILDING_BY_ID[b.defId]?.population ?? 0) > 0),
  },

  /* ─── BƯỚC 6: ĐỌC SỔ CÁI ─────────────────────────────────────────────── */
  {
    id: 'doc-so-cai',
    title: '⑥ Mở Sổ Cái — đọc báo cáo lãi lỗ',
    how: 'Bấm "Thị Chính" ở thanh dưới → chọn tab "Sổ Cái". Đây là báo cáo kết quả kinh doanh toàn thành phố.',
    lesson:
      'Đọc từ trên xuống: Doanh thu gộp → trừ giá vốn = Lợi nhuận gộp → trừ vận hành = Lợi nhuận hoạt động → trừ thuế = Lợi nhuận ròng. Biên gộp thấp: bán nhiều mà không giữ lại được bao nhiêu. Nắm con số này là nắm sức khỏe thật của cả chuỗi kinh doanh.',
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
