/**
 * RNG CÓ SEED
 *
 * Toàn bộ code cũ dùng `Math.random()`, nên cùng một thao tác cho hai kết quả
 * khác nhau và không test được. Module này cung cấp RNG tất định cho phần
 * logic MỚI, không thay 82 call site cũ.
 *
 * Vì sao cần: ba tính năng dưới đây bắt buộc phải tất định nếu không thì
 * không kiểm thử được, và người chơi sẽ thấy kết quả đổi mỗi lần refresh.
 *   - Quest ngày: cùng một ngày phải cho cùng bộ nhiệm vụ.
 *   - Sự kiện toàn phố: mỗi ngày một bộ sự kiện, không random trần mỗi lần
 *     hydrate (người chơi sẽ reload cho tới khi gặp sự kiện dễ nhất).
 *   - Near-miss có cam kết: "trả gấp 3 ngày liên tiếp thì lần 4 chắc chắn"
 *     là hợp đồng, hợp đồng mà người chơi kiểm chứng được thì seed phải ổn.
 */

/**
 * mulberry32: 32-bit state, chu kỳ 2^32, chất lượng đủ dùng cho game.
 *
 * Chọn vì mã ngắn, không cả dependency, và cho kết quả giống nhau giữa mọi
 * runtime - quan trọng vì test chạy Node còn game chạy trình duyệt.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a 32-bit: chuỗi bất kỳ ra một số nguyên 32-bit ổn định.
 *
 * Chọn vì không cần thư viện hash, và cho cùng kết quả ở mọi nền tảng - nếu
 * dùng `String.prototype.hashCode` kiểu nào đó thì test trên Node có thể khác
 * trình duyệt, làm hỏng cả bất biến test.
 */
export function seedFromString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Lấy một số nguyên trong `[0, max)`. `max <= 0` trả về 0. */
export function randomInt(rng: () => number, max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 0;
  return Math.floor(rng() * max);
}

/**
 * Fisher-Yates dùng RNG truyền vào.
 *
 * Dùng `rng() * (i + 1)` thay vì Fisher-Yates ngược để không cần `slice`
 * trên mảng hằng (pool quest là hằng số module, không được phép mutate).
 */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/**
 * RNG theo ngày: cùng một ngày luôn cho cùng chuỗi số.
 *
 * `dayKey` là chuỗi `YYYY-M-D` do `store.ts` sinh ra, nên đổi format ở đó là
 * đổi luôn chuỗi số ở đây. Chấp nhận được: hàm này chỉ dùng cho nội dung
 * "hôm nay có gì", đổi lúc nào thì ngày đó có nội dung mới.
 */
export function rngForDay(dayKey: string, salt = ''): () => number {
  return mulberry32(seedFromString(`${dayKey}|${salt}`));
}