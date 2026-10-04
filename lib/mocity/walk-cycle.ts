/**
 * NHỊP ĐI BỘ - phép toán thuần, tách khỏi component để test được.
 *
 * Tồn tại vì một lỗi đã lọt hai lần: nhân vật "đi như bay". Nguyên nhân không
 * phải hình vẽ xấu mà là SẢI CHÂN KHÔNG KHỚP QUÃNG ĐƯỜNG - thân trôi đi xa
 * hơn quãng mà bàn chân với tới được, nên mắt đọc ra là lướt chứ không phải
 * bước. Mắt bắt được ngay nhưng rất khó chỉ ra bằng lời, nên phải chốt bằng
 * số và khoá bằng test.
 *
 * Ràng buộc duy nhất cần giữ:
 *
 *     quãng đường thân đi trong MỘT bước  ==  quãng bàn chân quét được
 *
 * Mọi hằng dưới đây suy ra từ đúng ràng buộc đó.
 */

/** Độ xoay chân tối đa. PHẢI khớp `cbLegF`/`cbLegB` trong `WALK_CSS`. */
export const SWING_DEG = 26;

/** Chiều dài chân trong `ChibiBody` (`<Chi dai={17} />`). */
export const LEG_LEN = 17;

/**
 * px mỗi giây ứng với `speed = 1`.
 *
 * Suy từ vòng lặp RAF: `sim.x += vel * dt * 10` với `dt = ms/100`, nên trong
 * một giây quãng đường là `vel * (1000/100) * 10 = vel * 100`.
 */
export const PX_PER_SPEED = 100;

/**
 * Quãng bàn chân quét ngang được trong MỘT bước, px.
 *
 * Chân xoay quanh khớp hông, bàn chân là đầu dưới cách khớp `LEG_LEN`. Biên
 * trước và biên sau cách nhau `2 * LEG_LEN * sin(SWING_DEG)`.
 */
export const STRIDE_PX = 2 * LEG_LEN * Math.sin((SWING_DEG * Math.PI) / 180);

/**
 * Hệ số cho `--spd`: thời lượng một chu kỳ = `CYCLE_K / speed` giây.
 *
 * Một chu kỳ animation = HAI bước (chân trái + chân phải). Đặt
 *     speed * PX_PER_SPEED * (CYCLE_K / speed) = 2 * STRIDE_PX
 * `speed` triệt tiêu hai vế, nên người đi nhanh và người đi chậm đều khớp
 * chân - không phải chỉnh tay cho từng nhân vật.
 */
export const CYCLE_K = (2 * STRIDE_PX) / PX_PER_SPEED;

/**
 * Radian `walkPhase` tiến thêm trên mỗi px đi được.
 *
 * `bodyBob` dùng `abs(sin(walkPhase))`, chu kỳ π - tức MỘT cái nhún mỗi bước.
 * Tính theo QUÃNG ĐƯỜNG chứ không theo đồng hồ: đứng lại là ngừng nhún, chậm
 * lại là nhún thưa ra, không cần thêm nhánh if nào.
 */
export const PHASE_PER_PX = Math.PI / STRIDE_PX;

/** Thời lượng một chu kỳ đi bộ (giây) ứng với tốc độ `speed`. */
export function cycleSeconds(speed: number): number {
  if (!Number.isFinite(speed) || speed <= 0) return 0;
  return CYCLE_K / speed;
}

/** Quãng đường thân đi được trong MỘT bước, ứng với tốc độ `speed`. */
export function groundPerStep(speed: number): number {
  const cyc = cycleSeconds(speed);
  if (cyc <= 0) return 0;
  // Một chu kỳ hai bước, nên chia đôi.
  return (speed * PX_PER_SPEED * cyc) / 2;
}
