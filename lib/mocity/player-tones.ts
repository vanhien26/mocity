/**
 * GIỌNG ĐIỆU THEO BỐI CẢNH KHI NGƯỜI CHƠI XUẤT HIỆN.
 *
 * Trước đây bà con chỉ nói 2 loại: thoại trạng thái cá nhân (`AMBIENT`) và
 * thoại phản ứng khủng hoảng (`CITY_MOOD_LINES`). Hậu quả: không có cảm giác
 * hàng xóm NHẬN RA người chơi vừa làm gì - mở tiệm mới, nâng cấp, lên bậc...
 * cả phố vẫn im lặng kể chuyện thời tiết.
 *
 * 5 giọng điệu here, mỗi giọng có pool riêng cho chủ tiệm và cho cư dân:
 * - CHAO_HOI    : chào xã giao mặc định (mặc định khi không có hint nào)
 * - KHEN        : hôm nay người chơi vừa xây / tiến sao / lên bậc
 * - DONG_VIEN   : vừa nâng cấp nhưng chưa thấy tiền về - động viên
 * - CANH_TRANH  : phố đã lên bậc, hàng xóm khích bác chuyện làm ăn
 * - CHEN_EP     : còn việc/chuyện chờ xử lý - bà con hối
 *
 * Ngữ cảnh lấy từ state thật (xem `toneForCity`), KHÔNG random: đúng nghĩa
 * "cô Tư thấy tiệm mới của bạn nên khen", không phải ngẫu nhiên có hôm khen
 * có hôm chê vô lý.
 *
 * Lời thoại vẫn viết "Thị Trưởng" như data khác, đổi sang tên người chơi tại
 * điểm render qua `fillTen` (xem dialogue-name.ts).
 */
import type { NpcRole } from './types';

export type PlayerTone = 'CHAO_HOI' | 'KHEN' | 'DONG_VIEN' | 'CANH_TRANH' | 'CHEN_EP';

/** Chỉ số tối thiểu để chọn giọng - đọc trực tiếp từ `CityState`. */
export interface ToneHint {
  /** Số công trình người chơi đã xây hôm nay. */
  builtToday: number;
  /** Số nâng cấp hôm nay. */
  upgradedToday: number;
  /** Số tiệm tiến sao hôm nay. */
  starEvolvedToday: number;
  /** Số NPC còn chuyện muốn nói (hàng đang chờ xử lý). */
  pendingRequests: number;
  /** Rank bậc thành phố hiện tại (bắt đầu từ 1 - mới lên phố). */
  cityTier: number;
}

export const PLAYER_TONES: Record<PlayerTone, Record<NpcRole, string[]>> = {
  /* ── Chào hỏi xã giao ─────────────────────────────────────────────── */
  CHAO_HOI: {
    MERCHANT: [
      'Chào Thị Trưởng đi ngang qua tiệm tui nha, khách mới tới đông lắm!',
      'Sáng nay tui mở hàng sớm, Thị Trưởng ghé uống ly cà phê nóng đi!',
      'Thị Trưởng ơi, tiệm tui vừa đổi biển hiệu mới, kêu cô Tư qua coi chung!',
      'Mới sáng ra ông Tư đầu hẻm đã hỏi thăm Thị Trưởng tới chưa kìa!',
      'Thị Trưởng đi chợ sớm vậy? Tiệm tui có rau củ mới về, ghé mắt qua nha!',
      'Trời mát mà đông khách quá, Thị Trưởng ghé tui ưu tiên tính trước!',
      'Nghe đồn hôm nay Thị Trưởng bận việc lớn, có gì cứ nói tui hỗ trợ!',
      'Thị Trưởng qua đây tui mừng lắm, có món mới đang chờ nếm thử đó!',
    ],
    CITIZEN: [
      'Dạ chào Thị Trưởng ơi, sáng nay phố mình đông khách lạ ghê!',
      'Thị Trưởng đi dạo hẻm này nha, mấy chị đang tập bên công viên kìa!',
      'Con chào Thị Trưởng! Hẻm mình hôm nay có mấy bạn sinh viên hỏi đường.',
      'Thị Trưởng ơi, ông Tư bảo chiều nay có họp khu phố ở đầu hẻm đó!',
      'Dạ, mấy đứa nhỏ nhà con đang chờ Thị Trưởng ghé chơi công viên!',
      'Chào Thị Trưởng sớm nha, con vừa thấy xe buýt MoMo chạy ngang!',
      'Thị Trưởng dùng sáng chưa? Tiệm cô Tư bán hủ tiếu mới mở đó!',
      'Sáng nay gió mát dễ thương, Thị Trưởng tranh thủ đi dạo một vòng đi!',
    ],
  },

  /* ── Khen vì hôm nay phố vừa có chuyện mới ────────────────────────── */
  KHEN: {
    MERCHANT: [
      'Thị Trưởng vừa mở thêm tiệm mới, tui đứng đây nhìn mà nể quá chừng!',
      'Tiệm mới lên 5 sao, bà con khen Thị Trưởng làm ăn chỉnh chu lắm!',
      'Dòng tiền hôm nay chạy tốt ghê, Thị Trưởng sắp thành đại gia phố mình rồi!',
      'Thị Trưởng nâng cấp xong khách kéo tới nườm nượp, tui cũng được thơm lây!',
      'Nghe nói phố mình lên bậc mới, cả hẻm mở tiệc ăn mừng kìa!',
      'Mấy cô chú khen Thị Trưởng trẻ mà giỏi, làm được chuyện lớn!',
      'Đợt này tiệm nào cũng đông khách, nhờ Thị Trưởng quy hoạch phố khéo!',
      'Thị Trưởng sắp hết nợ rồi hả? Bà con ai cũng mừng thay đó!',
    ],
    CITIZEN: [
      'Phố mình đẹp lên từng ngày, tụi con đi khoe với bạn bè khắp nơi!',
      'Thị Trưởng mới mở tiệm mới, mấy đứa nhỏ reo hò cả buổi!',
      'Con thấy tiệm nào cũng sáng đèn, phố mình sống động hẳn lên!',
      'Thị Trưởng làm ăn giỏi nên cả hẻm có việc làm thêm kìa!',
      'Bạn con qua khen phố mình văn minh, con hãnh diện lắm!',
      'Mới lên bậc mới mà công viên sạch sẽ, cây cối xanh tươi luôn!',
      'Mọi người khen hẻm mình ấm cúng hẳn, đúng là nhờ Thị Trưởng lo toan!',
      'Cả xóm đang khen chỉ số hạnh phúc tăng, đúng là nhờ Thị Trưởng!',
    ],
  },

  /* ── Động viên sau khi nâng cấp nhưng tiền chưa về ─────────────────── */
  DONG_VIEN: {
    MERCHANT: [
      'Thị Trưởng cứ bình tĩnh, dòng tiền chưa về ngay nhưng tháng này sẽ ổn!',
      'Tui mở tiệm 10 năm, lúc nào cũng có tháng chậm - Thị Trưởng cứ kiên trì!',
      'Mới nâng cấp xong mà khách chưa đông? Mất vài hôm là ổn thôi Thị Trưởng!',
      'Thị Trưởng làm ăn chắc tay, chậm một chút không sao đâu!',
      'Có mức lãi suất này, đợt tới tiệm tui và tiệm Thị Trưởng đều thơm!',
      'Thị Trưởng đừng nản, mấy tiệm đầu phố hồi mới mở cũng vậy!',
      'Tui thấy tiền vào đều đều rồi đó, Thị Trưởng yên tâm lo tiếp!',
      'Mạnh mẽ lên Thị Trưởng, cả hẻm đang trông vào mình kìa!',
    ],
    CITIZEN: [
      'Thị Trưởng đừng buồn, mấy bữa nay hơi chật vật thôi mà!',
      'Con thấy tiệm vẫn sáng đèn đều, chắc chỉ vài hôm nữa là đông khách!',
      'Bà con vẫn tin Thị Trưởng, chưa ai bỏ đi hết á!',
      'Thị Trưởng nghỉ ngơi chút đi, để mai làm lại - việc gì cũng có cách!',
      'Con gửi gắm phố mình cho Thị Trưởng, làm từ từ cũng được!',
      'Hạnh phúc cả xóm vẫn trên 85% kìa, Thị Trưởng lo gì nè!',
      'Thị Trưởng kể chuyện tiền nong nghe con nghe, có khi con bày được cách!',
      'Cứ chăm chỉ kiểu này, vài bữa nữa cả hẻm ăn mừng thôi!',
    ],
  },

  /* ── Khích bác cạnh tranh khi phố đã lên bậc ───────────────────────── */
  CANH_TRANH: {
    MERCHANT: [
      'Tiệm đầu hẻm mới khai trương mà đông khách hơn tiệm Thị Trưởng kìa!',
      'Nghe nói tiệm đối diện chuẩn bị nâng cấp 5 sao, Thị Trưởng không tranh hả?',
      'Bà con đang so tiệm nào đông khách kìa, xem ra tiệm Thị Trưởng hơi chậm!',
      'Cô Tư đầu hẻm mới mở thêm chi nhánh, Thị Trưởng ngồi yên sao được!',
      'Khách mới hỏi "tiệm nào ngon nhất" mà chưa ai nhắc tiệm Thị Trưởng!',
      'Hàng xóm mới nhận thêm quản lý, tiệm Thị Trưởng vẫn một mình sao?',
      'Đợt này tiệm nào cũng chạy giảm giá, tiệm Thị Trưởng im lặng kìa!',
      'Thị Trưởng phải cho thấy mình số 1 chứ, để hàng xóm qua mặt vậy à!',
    ],
    CITIZEN: [
      'Dân xóm mình đang bàn tiệm nào đông nhất, hình như chưa có tên Thị Trưởng!',
      'Bạn con khen tiệm bên kia hơn tiệm Thị Trưởng, con cãi lại không có lý!',
      'Thị Trưởng coi kìa, đầu hẻm mới trang trí hoành tráng hơn tiệm mình!',
      'Mấy chị đang so tiệm nào đông khách, Thị Trưởng không ra tay hả?',
      'Học trò con nói chưa từng thử tiệm của Thị Trưởng, phải để họ nhớ tên chứ!',
      'Bước qua đầu hẻm là tiệm mới mở, khách chen nhau xếp hàng kìa!',
      'Cô bên cạnh khoe tiệm mới 5 sao, Thị Trưởng chịu thua hả?',
      'Thị Trưởng mà thua hàng xóm thì cả xóm buồn đó, cố lên!',
    ],
  },

  /* ── Chèn ép: còn việc của bà con đang chờ ─────────────────────────── */
  CHEN_EP: {
    MERCHANT: [
      'Việc còn ngập đầu mà Thị Trưởng chưa xử lý, bà con đang chờ đó!',
      'Đơn kêu cứu xếp hàng dài rồi, Thị Trưởng định để tới khi nào?',
      'Tiệm tui chờ Thị Trưởng duyệt vụ tranh chấp suốt từ sáng!',
      'Thị Trưởng bận tới mức nào cũng nhớ việc của bà con nha!',
      'Đám đông đang chờ phía trước, áp lực lên Thị Trưởng ngày càng lớn!',
      'Còn mấy vụ chưa giải quyết nữa kìa, Thị Trưởng định để hết hạn sao?',
      'Bà con đếm từng phút chờ Thị Trưởng ra quyết định đó!',
      'Việc khẩn cấp chờ lâu quá, khách bỏ đi mất rồi Thị Trưởng ơi!',
    ],
    CITIZEN: [
      'Còn mấy đơn khiếu nại chưa ai xử lý kìa, Thị Trưởng ơi!',
      'Mẹ con bảo chuyện ở phố mình chưa xong mà Thị Trưởng đi đâu mất rồi!',
      'Đợi Thị Trưởng quyết chuyện đó mãi chưa thấy, cả xóm sốt ruột!',
      'Việc chưa dọn dẹp xong, tối nay lại trễ nữa rồi Thị Trưởng ơi!',
      'Cô Tư chờ Thị Trưởng tới hỏi chuyện từ sáng mà chưa thấy đâu!',
      'Đám trẻ con cũng đòi Thị Trưởng mở công viên nữa kìa, làm nhanh lên!',
      'Thị Trưởng ơi, chuyện đầu hẻm chưa xong mà mình ngồi im vậy hả?',
      'Sắp đóng cửa mà còn việc dở, Thị Trưởng tranh thủ làm nốt đi!',
    ],
  },
};

/**
 * Chọn giọng theo ngữ cảnh thật của thành phố.
 *
 * Thứ tự: thành tựu hôm nay -> chờ việc -> phố đã lên bậc -> chào hỏi.
 * Không có trường hợp trả `null`: không hint nào cũng vẫn phải có một giọng
 * chào hỏi để bà con nhận ra người chơi.
 */
export function toneForCity(hint: ToneHint): PlayerTone {
  if (hint.builtToday > 0 || hint.starEvolvedToday > 0) return 'KHEN';
  if (hint.upgradedToday > 0) return 'DONG_VIEN';
  if (hint.pendingRequests > 0) return 'CHEN_EP';
  if (hint.cityTier >= 2) return 'CANH_TRANH';
  return 'CHAO_HOI';
}

/** Câu thoại theo giọng - `rotation` tăng dần như ambient/mood, không random. */
export function toneLineFor(role: NpcRole, tone: PlayerTone, rotation: number): string | null {
  const lines = PLAYER_TONES[tone]?.[role];
  if (!lines || lines.length === 0) return null;
  const idx = Math.abs(rotation) % lines.length;
  return lines[idx];
}
