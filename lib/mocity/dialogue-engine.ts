import { AMBIENT, REQUEST_SCRIPTS } from './dialogue-data';
import { ARCHETYPES } from './npc-data';
import { toneLineFor, type PlayerTone } from './player-tones';
import type { NpcState, RequestScript } from './types';

/**
 * Chon cau thoai ambient hop trang thai hien tai cua NPC.
 * `rotation` la so nguyen tang dan - dung thay random de cung mot NPC khong
 * lap lai cau vua noi, va de test duoc.
 */
export function ambientLineFor(npc: NpcState, rotation: number): string | null {
  const pool = AMBIENT[npc.archetype];
  if (!pool) return null;

  const lines =
    npc.role === 'MERCHANT'
      ? npc.acceptsDigital
        ? pool.digital
        : pool.cash
      : npc.services.length > ARCHETYPES[npc.archetype].startServices.length
        ? pool.served
        : pool.plain;

  if (!lines || lines.length === 0) return null;
  return lines[rotation % lines.length];
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CƯ DÂN PHẢN ỨNG TRẠNG THÁI THÀNH PHỐ
 *
 * Trước đây `AMBIENT` chỉ chia theo trạng thái của CHÍNH NPC (đã mở QR chưa,
 * đã mở dịch vụ chưa). Thành phố có khủng hoảng thì bà con vẫn kể chuyện thời
 * tiết và drama trên mạng, y như không có gì xảy ra.
 *
 * Ở đây, mỗi tình huống khủng hoảng có một nhóm câu riêng cho đúng archetype.
 * Câu nói luôn chạm đúng chỉ số mà người chơi đang nhìn trên báo cáo P&L, nên
 * nó vừa là tạo không khí vừa là một lời nhắc ngữ cảnh.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type CityMood =
  | 'CRISIS_HAPPINESS'
  | 'CRISIS_CASHFLOW'
  | 'CRISIS_NPL'
  | 'CRISIS_DEBT'
  | 'CRISIS_CROWDING'
  | 'BOOM';

interface MoodPool {
  /** Câu nói cho chủ tiệm. */
  cash?: string[];
  /** Câu nói cho cư dân. */
  plain?: string[];
}

/**
 * Ngân kho câu thoại theo tâm trạng.
 *
 * Export để test kiểm chứng số câu thực tế: pool nhỏ thì `rotation` quay vòng
 * nhanh, và test hardcode số câu sẽ hỏng mỗi lần thêm hoặc bớt một câu.
 */
export const CITY_MOOD_LINES: Record<CityMood, MoodPool> = {
  CRISIS_HAPPINESS: {
    cash: [
      'Khách ngày này nhìn mặt tui rồi quay đi luôn Thị Trưởng ạ, tui đoán phố mình đang có chuyện gì đó...',
      'Tui mở quán 20 năm chưa gặp ngày nào khách đứng ngoài nhìn mà không vào. Chắc phố có vấn đề rồi...',
      'Bà con qua hỏi "Thị Trưởng có ổn không?" suốt buổi sáng. Phố mình có chuyện gì vậy ạ?',
    ],
    plain: [
      'Thị Trưởng ơi khu phố mình sao buồn thế, tụi con đi đứng thấy ai cũng thở dài...',
      'Con cảm nhận được không, phố mình mấy bữa nay yếu lắm. Có gì đó sai sai rồi...',
    ],
  },
  CRISIS_CASHFLOW: {
    cash: [
      'Tháng này tiền mặt trong két e hẹp quá Thị Trưởng ơi, trả tiền mặt bằng còn chưa đủ nữa...',
      'Tui tính sổ thì thấy tiền chi phí chạy đều đều mà tiền bán hàng không kịp bù. Khó lắm Thị Trưởng...',
    ],
    plain: [
      'Chú làm xe công nghệ mà tui cảm thấy phố mình đang thiếu tiền lắm... có phải không chú?',
      'Bố mẹ con bảo tháng này phải dè sẹn hơn. Chắc cả phố đang vậy chứ con?',
    ],
  },
  CRISIS_NPL: {
    cash: [
      'Ba tháng nay mấy khách trả sau không trả nổi. Tui thống kê lại là hơn một phần tư số hóa đơn hỏng rồi Thị Trưởng...',
      'Trả sau thì bán nhiều hơn nhưng thu không về. Giờ tui tính kỹ hơn là chỉ bán cho khách nào có khả năng trả.',
    ],
    plain: [
      'Bọn con sinh viên trả sau nhiều quá, giờ nợ còn kẹt lắm Thị Trưởng ơi...',
      'Con nghe tiệm bên kia nói bán trả sau mà thu tiền khó lắm. Phố mình nên làm gì không chú?',
    ],
  },
  CRISIS_DEBT: {
    cash: [
      'Nghe đồn Thị Trưởng có khoản vay tới hạn rồi hả? Tiệm tui tính tiền mà cũng phải tính toán dè dặt...',
      'Vay nhiều quá thì kỳ hạn đến mà không có tiền thì khó lắm Thị Trưởng. Cẩn thận nha.',
    ],
    plain: [
      'Con thấy phố mình hơi căng thẳng chuyện tiền bạc hôm nay, có phải vì vay không chú?',
      'Bố con hỏi sao tháng này phải dè sẹn thế, chắc cả phố đang thiếu tiền chứ con...',
      'Con đi làm về thấy mấy tiệm đóng cửa sớm hơn mọi khi. Phố mình làm ăn có ổn không chú?',
    ],
  },
  CRISIS_CROWDING: {
    cash: [
      'Sáng nay khách xếp hàng ra tận ngoài đường mà tui chỉ phục vụ được hai người, tạm hết cửa Thị Trưởng ạ...',
      'Cửa tiệm tui hôm nay bị quá tải, khách đứng chờ lâu quá nên bỏ đi hết mấy người cuối cùng...',
    ],
    plain: [
      'Con xếp hàng ở tiệm bên kia lâu quá thì bỏ về không thèm mua nữa Thị Trưởng ạ...',
      'Tiệm xung quanh đông nghịt mà không phục vụ nổi, mấy chị bị bỏ rơi bỏ ngang. Con thấy mà thấy tội...',
    ],
  },
  BOOM: {
    cash: [
      'Hôm nay khách đông dồn, két tiền không kịp đếm. Cảm ơn Thị Trưởng quá nha!',
      'Tui đang tính cả buổi mà cứ phải đi lấy thêm giấy. Phố mình đông nhất từ trước tới giờ!',
    ],
    plain: [
      'Phố mình hôm nay náo nhiệt lắm Thị Trưởng ơi, con đi đâu cũng thấy vui!',
      'Con cảm nhận được không, dân phố mình dạo này tươi hẳn lên. Nhờ Thị Trưởng quá!',
    ],
  },
};

/** Ngưỡng xác định tâm trạng thành phố, theo đúng thứ người chơi nhìn thấy. */
const HAPPINESS_CRISIS_AT = 45;
const CASHFLOW_CRISIS_AT = 1;
const NPL_CRISIS_AT = 0.12;

/** Chỉ số thành phố đủ để chọn tâm trạng. */
export interface CityMoodInput {
  happiness: number;
  cashflowRatio: number;
  nplRate: number;
  /** Dư nợ hiện tại. */
  debt: number;
  /** Số tiệm đang quá tải. */
  shopsOverloaded: number;
  /** Lợi nhuận ròng mỗi giây. */
  netIncomePerSec: number;
}

/**
 * Tâm trạng thành phố.
 *
 * Trả về `null` khi thành phố bình thường: để dùng nhóm thoại khác, hoặc
 * `BOOM` chỉ khi doanh thu thực sự tốt chứ không phải cứ ổn là vui.
 *
 * Thứ tự kiểm tra đi từ nghiêm trọng nhất: nợ xấu và dòng tiền là chuyện mất
 * tiền thật, hạnh phúc chỉ là chuyện khách bực mặt.
 */
export function cityMood(mood: CityMoodInput): CityMood | null {
  if (mood.shopsOverloaded > 0) return 'CRISIS_CROWDING';
  if (mood.debt > 0) return 'CRISIS_DEBT';
  if (mood.nplRate >= NPL_CRISIS_AT) return 'CRISIS_NPL';
  if (mood.cashflowRatio < CASHFLOW_CRISIS_AT) return 'CRISIS_CASHFLOW';
  if (mood.happiness < HAPPINESS_CRISIS_AT) return 'CRISIS_HAPPINESS';
  if (mood.netIncomePerSec > 0 && mood.happiness >= 80) return 'BOOM';
  return null;
}

/**
 * Câu nói của NPC theo tâm trạng thành phố.
 *
 * `rotation` là số nguyên tăng dần (không random) để cùng một NPC không lặp
 * câu vừa nói, đúng như `ambientLineFor`. Câu phản ứng khủng hoảng được ưu tiên
 * trên câu thời tiết vì lúc đó người chơi đang cần biết phố mình có vấn đề.
 */
export function moodLineFor(
  npc: NpcState,
  mood: CityMood | null,
  rotation: number,
): string | null {
  if (!mood) return null;
  const pool = CITY_MOOD_LINES[mood];
  const lines = npc.role === 'MERCHANT' ? pool.cash : pool.plain;
  if (!lines || lines.length === 0) return null;
  return lines[rotation % lines.length];
}

/**
 * Tổng hợp: câu thoại cần nói cho NPC lúc này.
 *
 * Thứ tự ưu tiên: phản ứng khủng hoảng > giọng theo bối cảnh người chơi >
 * thoại thường theo trạng thái cá nhân. Hàm này là điểm vào duy nhất cho UI
 * nói thoại đường phố.
 *
 * `tone` là giọng điệu khi người chơi vừa có chuyện (mở tiệm, nâng cấp, hối
 * việc...). Xen kẽ 1 câu ambient sau mỗi 4 nhịp để thoại trạng thái cá nhân
 * không biến mất hoàn toàn khi thành phố đang có hint.
 */
export function streetLineFor(
  npc: NpcState,
  rotation: number,
  mood: CityMood | null,
  tone?: PlayerTone | null,
): string | null {
  if (mood) return moodLineFor(npc, mood, rotation);
  if (tone) {
    if (Math.abs(rotation) % 4 !== 3) return toneLineFor(npc.role, tone, rotation);
    return ambientLineFor(npc, rotation);
  }
  return ambientLineFor(npc, rotation);
}

/** Danh sach cac script hop le voi NPC nay. */
export function eligibleRequestsFor(npc: NpcState): RequestScript[] {
  return REQUEST_SCRIPTS.filter((script) => {
    if (script.archetype !== npc.archetype) return false;
    if (script.requiresDigital !== undefined && npc.acceptsDigital !== script.requiresDigital) {
      return false;
    }
    if (script.missingService && npc.services.includes(script.missingService)) return false;
    return true;
  });
}

/** Script con hop le voi NPC nay va chua duoc xu ly. */
export function eligibleRequestFor(npc: NpcState, seed?: number): RequestScript | null {
  const matches = eligibleRequestsFor(npc);
  if (matches.length === 0) return null;
  if (typeof seed === 'number') return matches[Math.abs(seed) % matches.length];
  return matches[Math.floor(Math.random() * matches.length)];
}

/** NPC dang co chuyen muon noi voi thi truong. */
export function npcsNeedingAttention(npcs: NpcState[]): NpcState[] {
  return npcs.filter((npc) => eligibleRequestFor(npc) !== null);
}