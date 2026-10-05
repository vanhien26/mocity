import { BUILDING_BY_ID } from './mock-city-data';
import type { CityState } from './types';

/* ═══════════════════════════════════════════════════════════════════════════
 * HƯỚNG DẪN — NGƯỜI LẬP NGHIỆP MỚI LÊN PHỐ
 *
 * Nguyên tắc: HỌC BẰNG CÁCH LÀM, không phải đọc slide.
 * Context: Bạn có 50M vốn, nợ 200M, lãi 5M/tháng. Thị Trưởng là NPC.
 *
 * Flow: Mở tiệm → Xem sổ sách → Nâng cấp → Thuê nhân viên →
 *       Mở tiệm thứ hai → Đọc Sổ Cái (biết có đủ trả nợ không)
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
    title: '① Mở tiệm đầu tiên — tạo dòng tiền trả nợ',
    how: 'Bấm "Thuê & Khai Trương" bên dưới → chọn loại quán → bấm vào lô đất trống để khai trương. Quán Cà Phê rẻ nhất — thử đó trước! Lãi 5 triệu/tháng đang chạy đồng hồ.',
    lesson:
      'Tiền nằm trong túi không trả được nợ. Chỉ có tiệm đang chạy mới tạo ra dòng tiền (Cashflow) — đó là đồng tiền duy nhất có thể trả lãi cho ông Chín.',
    anchor: 'build',
    done: (s) => s.buildings.some((b) => BUILDING_BY_ID[b.defId]?.zone === 'COMMERCIAL'),
  },

  /* ─── BƯỚC 2: BẤM VÀO TIỆM ĐỂ XEM CHI TIẾT ───────────────────────────── */
  {
    id: 'xem-tiem',
    title: '② Kiểm tra sổ sách tiệm',
    how: 'Bấm trực tiếp vào cửa hàng trên phố (hoặc nút "Quản Lý" ở thanh dưới). Xem tab Chi Tiết — có doanh thu, chi phí và tốc độ phục vụ.',
    lesson:
      'Doanh thu cao không có nghĩa là lãi. Doanh thu 10M, chi phí thuê + vận hành 12M = bạn đang lỗ 2M mỗi tháng, cộng thêm 5M lãi nợ. Quản lý biên lợi nhuận trước khi mở rộng.',
    anchor: 'manage',
    done: (s) => hasFlag(s, 'inspector'),
  },

  /* ─── BƯỚC 3: NÂNG CẤP TIỆM ─────────────────────────────────────────── */
  {
    id: 'nang-cap',
    title: '③ Nâng cấp tiệm — tăng doanh thu',
    how: 'Trong bảng quản lý tiệm, bấm tab "Nâng Cấp" → bấm nút "Nâng +1 Cấp". Doanh thu tăng ngay lập tức.',
    lesson:
      'Tái đầu tư lợi nhuận vào tiệm đang chạy tốt = đòn bẩy nhanh nhất. Luôn tính thời gian hoàn vốn (số tháng để thu lại chi phí nâng cấp) trước khi quyết định dồn tiền.',
    anchor: 'shop-tab-upgrade',
    done: (s) => s.buildings.some((b) => b.level >= 2),
  },

  /* ─── BƯỚC 4: THUÊ NHÂN VIÊN ────────────────────────────────────────── */
  {
    id: 'thue-nv',
    title: '④ Thuê nhân viên — không thể tự làm hết',
    how: 'Vẫn trong bảng tiệm, bấm tab "Nhân Lực" → bấm "Thuê Nhân Viên thứ 1". Tốc độ phục vụ tăng, khách không phải chờ.',
    lesson:
      'Một mình bạn là nghẽn cổ chai. Nhân viên tốt giúp tiệm chạy khi bạn không có mặt — đó là lúc tiền thực sự "đẻ ra tiền" mà không cần bạn ngồi đó.',
    anchor: 'shop-tab-staff',
    done: (s) => s.buildings.some((b) => (b.staffCount ?? 0) >= 1),
  },

  /* ─── BƯỚC 5: MỞ TIỆM THỨ HAI ─────────────────────────────────────────── */
  {
    id: 'mo-tiem-2',
    title: '⑤ Khai trương tiệm thứ hai — đa dạng dòng tiền',
    how: 'Bấm "Thuê & Khai Trương" → chọn một loại hình khác (Fintech, ẩm thực...) → bấm vào lô đất trống còn lại. Dân trong phố đã có sẵn — khách hàng đang chờ.',
    lesson:
      'Một tiệm duy nhất = một điểm rủi ro. Hai tiệm khác loại giảm thiểu rủi ro: khi một tiệm ế do mùa, tiệm kia vẫn chạy. Đây là nền tảng của danh mục đầu tư (portfolio) trong kinh doanh.',
    anchor: 'build',
    done: (s) => s.buildings.length >= 2,
  },

  /* ─── BƯỚC 6: ĐỌC SỔ CÁI ─────────────────────────────────────────────── */
  {
    id: 'doc-so-cai',
    title: '⑥ Đọc Sổ Cái — biết mình đang lời hay lỗ',
    how: 'Bấm "Thị Chính" ở thanh dưới → chọn tab "Sổ Cái". Đây là báo cáo P&L toàn bộ hoạt động của bạn trên phố.',
    lesson:
      'Mục tiêu của bạn: dòng tiền ròng đủ trả 5M lãi/tháng và dần trả gốc 200M. Doanh thu gộp - Chi phí vận hành - Lãi nợ = Lợi nhuận thực. Con số đó quyết định bạn về quê hay ở lại.',
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
