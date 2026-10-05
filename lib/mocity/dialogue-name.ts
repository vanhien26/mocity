/**
 * XƯNG HÔI THEO TÊN NGƯỜI CHƠI TRONG LỜI THOẠI NPC.
 *
 * Canon: người chơi là người LÊN PHỐ LẬP NGHIỆP, Thị Trưởng là NPC chủ đất.
 * Toàn bộ lời thoại Address người chơi ("Thị Trưởng ơi", "Thị Trưởng sẽ:")
 * được viết nguyên văn như cũ trong data, rồi gọi `fillTen` tại ĐÚNG các điểm
 * render thoại để đổi sang tên người chơi - tránh phải sửa ~230 chuỗi tay và
 * tránh sót một chuỗi nào.
 *
 * Vì sao không thay ngay trong data:
 * - Data còn chứa danh từ riêng của NPC ("Trợ Lý Thị Trưởng", hội nhóm
 *   "Review Thị Trưởng MoCity") - thay theo quy tắc sẽ làm vỡ tên nhân vật.
 * - Thay tại choke point nghĩa là một chỗ sửa, mọi nguồn thoại (bong bóng,
 *   chat cư dân, Chuyện Phố, sự kiện) cùng hưởng.
 *
 * FALLBACK: chưa đặt tên thì xưng "bạn" - câu vẫn đọc được
 * ("Dạ bạn!", "bạn ơi...") thay vì lòi tên mặc định kỳ cục.
 */

/** Các danh từ riêng CÓ chứa "Thị Trưởng" nhưng KHÔNG được đổi sang tên. */
const PROTECTED_PHRASES = ['Trợ Lý Thị Trưởng', 'Thị Trưởng MoCity'];

/** Ký tự điều khiển, không xuất hiện trong nội dung thoại. */
const MASK = '\u0001';

/** Tên người chơi để xưng hô. Rỗng/khoảng trắng -> "bạn". */
export function tenOf(mayorName?: string | null): string {
  const clean = (mayorName ?? '').trim();
  return clean.length > 0 ? clean : 'bạn';
}

/**
 * Đổi mọi chỗ gọi người chơi thành tên người chơi.
 *
 * Idempotent: chuỗi đã điền một lần sẽ không bị đổi thêm lần nữa (không còn
 * chữ "Thị Trưởng" nào để đổi, trừ danh từ riêng được bảo vệ).
 */
export function fillTen(text: string, mayorName?: string | null): string {
  if (!text || !text.includes('Thị Trưởng')) return text;

  const ten = tenOf(mayorName);

  // Che danh từ riêng trước, trả lại sau - nếu không "Trợ Lý Thị Trưởng"
  // sẽ biến thành "Trợ Lý <tên>" và làm vỡ tên nhân vật.
  const masks: string[] = [];
  let out = text;
  for (const phrase of PROTECTED_PHRASES) {
    if (!out.includes(phrase)) continue;
    const token = `${MASK}${masks.length}${MASK}`;
    masks.push(phrase);
    out = out.split(phrase).join(token);
  }

  out = out.split('Thị Trưởng').join(ten);

  for (let i = 0; i < masks.length; i += 1) {
    out = out.split(`${MASK}${i}${MASK}`).join(masks[i]);
  }
  return out;
}
