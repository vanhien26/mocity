import { BUILDING_BY_ID } from './mock-city-data';
import type { CityState } from './types';

/* ═══════════════════════════════════════════════════════════════════════════
 * HƯỚNG DẪN
 *
 * Nguyên tắc: HỌC BẰNG CÁCH LÀM, không phải đọc slide.
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
  {
    id: 'mo-tiem',
    title: 'Mở cửa hàng đầu tiên',
    how: 'Bấm “Mở Tiệm Mới” rồi chọn một ô đất trống trên phố. Quán Cà Phê là rẻ nhất.',
    lesson:
      'Quán vừa mở đã sinh doanh thu. Nhưng doanh thu KHÔNG phải tiền lời: mỗi ly bán ra còn phải trừ tiền nguyên liệu và tiền mặt bằng. Con số trên thanh HUD là lợi nhuận ròng, đã trừ hết rồi - thấp hơn doanh thu nhiều.',
    anchor: 'build',
    done: (s) => s.buildings.some((b) => BUILDING_BY_ID[b.defId]?.zone === 'COMMERCIAL'),
  },
  {
    id: 'xay-nha',
    title: 'Xây chỗ ở cho cư dân',
    how: 'Mở “Mở Tiệm Mới” lần nữa, chọn nhóm Dân Cư và đặt một Khu Nhà Phố.',
    lesson:
      'Không có người ở thì không ai mua. Mở nhiều quán mà thiếu dân thì hàng ế, doanh thu mỗi quán tụt xuống. Trong game gọi là hệ số lấp đầy, ngoài đời gọi là chọn sai mặt bằng - mở quán ở nơi không có khách.',
    anchor: 'build',
    done: (s) => s.buildings.some((b) => (BUILDING_BY_ID[b.defId]?.population ?? 0) > 0),
  },
  {
    id: 'nang-cap',
    title: 'Nâng cấp một công trình',
    how: 'Bấm vào một cửa hàng trên phố rồi chọn nâng cấp.',
    lesson:
      'Chi phí nâng cấp neo vào doanh thu của chính công trình đó, nên thời gian hoàn vốn ở mọi công trình gần như nhau. Trước khi bỏ tiền, câu hỏi luôn là: bao lâu thì thu lại đủ. Đó là cách đọc một khoản đầu tư, dù là nâng cấp quán hay mua máy mới.',
    done: (s) => s.buildings.some((b) => b.level >= 2),
  },
  {
    id: 'doc-so-cai',
    title: 'Mở Sổ Cái và đọc báo cáo',
    how: 'Bấm “Thị Chính” trên thanh dưới, rồi chọn tab “Sổ Cái”.',
    lesson:
      'Đây là báo cáo kết quả kinh doanh của cả thành phố. Đọc từ trên xuống: doanh thu gộp, trừ giá vốn ra lợi nhuận gộp, trừ chi phí vận hành ra lợi nhuận hoạt động, trừ thuế ra lợi nhuận ròng. Biên gộp thấp nghĩa là bán nhiều mà không giữ lại được bao nhiêu.',
    anchor: 'cityhall',
    done: (s) => hasFlag(s, 'ledger'),
  },
  {
    id: 'han-muc-vay',
    title: 'Xem hạn mức vay của bạn',
    how: 'Vẫn trong tab “Sổ Cái”, nhìn khối “Khoản vay Ngân Hàng Số MoMo” ở trên cùng.',
    lesson:
      'Hạn mức tính theo khả năng trả nợ, không theo doanh thu: biên lợi nhuận mỏng thì vay được ít hơn dù bán bằng nhau. Và lãi phải trả đều đặn dù tháng đó buôn bán ra sao - vay được không có nghĩa là nên vay.',
    anchor: 'cityhall',
    done: (s) => hasFlag(s, 'loan'),
  },
  {
    id: 'chuyen-pho',
    title: 'Phân xử một Chuyện Phố',
    how: 'Bấm nút “Chuyện Phố” trên thanh trên cùng và chọn một phương án.',
    lesson:
      'Cách bạn xử chuyện ảnh hưởng tới mức hài lòng của cư dân, mà mức hài lòng lại nhân vào doanh thu toàn phố. Bỏ mặc khu phố thì doanh thu tụt dần - chi phí chăm sóc khách hàng không nằm trên hóa đơn nào nhưng vẫn có thật.',
    done: (s) => (s.dailyLog?.eventsResolved ?? 0) > 0 || (s.eventLog?.resolved ?? 0) > 0,
  },
];

/** Bước hiện tại, `null` khi đã xong hoặc đã bỏ qua. */
export function currentTutorialStep(s: CityState): TutorialStep | null {
  const i = s.tutorialStep ?? 0;
  if (i < 0 || i >= TUTORIAL_STEPS.length) return null;
  return TUTORIAL_STEPS[i];
}
