'use client';

/* ═══════════════════════════════════════════════════════════════════════════
 * LỚP PHIM RETRO - THẨM MỸ BAO CẤP, THẬP NIÊN 80-90
 *
 * Gộp ba thứ làm nên cảm giác cũ, đặt thành MỘT lớp phủ thay vì sửa màu ở
 * từng component:
 *
 *   1. Ngả màu  - giảm bão hoà, kéo về phía vàng nghệ và nâu đỏ
 *   2. Kết cấu  - hạt nhiễu và vân giấy, thứ mà đồ hoạ vector phẳng không có
 *   3. Vignette - tối bốn góc như ảnh phim rửa thủ công
 *
 * Vì sao gộp một lớp: bảng màu hiện tại rải trong 64 gradient và hàng trăm mã
 * màu cứng ở 20 nghìn dòng. Sửa từng chỗ vừa lâu vừa không thể đảo lại. Một
 * lớp phủ thì bật tắt được bằng một prop, và quan trọng hơn là nó ÉP mọi màu
 * về cùng một tông - đó mới là thứ tạo ra sự thống nhất thời kỳ, không phải
 * từng mã màu riêng lẻ đẹp hay xấu.
 *
 * CẢNH BÁO KỸ THUẬT: `filter` trên một phần tử tạo containing block mới cho
 * con cháu `position: fixed`, y như `transform`. Nên lớp ngả màu CHỈ bọc khung
 * phố, không bọc modal hay HUD - nếu không thì bảng hội thoại neo bằng
 * `fixed` sẽ dính vào khung phố và trôi theo khi cuộn.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Hạt nhiễu phim, sinh bằng feTurbulence nên không cần file ảnh. */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E")`;

/**
 * Bảng màu thời kỳ. Dùng chung cho pixel art sắp vẽ, nên để ở đây làm nguồn
 * sự thật thay vì rải mã màu trong từng sprite.
 */
export const BAO_CAP_PALETTE = {
  /** Trời bạc màu, ngả lục xám chứ không xanh tươi. */
  troi: '#A9BEB4',
  troiCao: '#8FA89E',
  /** Tường vôi ngả vàng, màu phổ biến nhất của phố cũ. */
  voi: '#E3D6B4',
  voiDam: '#C9B98F',
  /** Vàng nghệ của biển hiệu sơn tay. */
  nghe: '#D9A441',
  /** Đỏ son cờ và băng rôn. */
  son: '#B33A2B',
  /** Xanh rêu của cửa chớp gỗ và cổng sắt. */
  reu: '#4A6B5A',
  /** Nâu gỗ cũ. */
  go: '#6B4A2F',
  /** Mực in đen ngả nâu, KHÔNG dùng đen tuyền. */
  muc: '#2B2420',
  /** Giấy cũ, nền cho bảng biểu. */
  giay: '#F0E6CE',
  /** Xi măng vỉa hè. */
  ximang: '#B5AC98',
} as const;

export default function RetroFilm({
  /** Tắt để so sánh nhanh với bản gốc. */
  enabled = true,
}: {
  enabled?: boolean;
}) {
  if (!enabled) return null;

  return (
    <>
      {/*
       * Hạt nhiễu + vân giấy phủ toàn màn. `pointer-events-none` để không
       * chặn thao tác, z-index dưới modal để chữ trong bảng vẫn sạch.
       */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[45]"
        style={{
          backgroundImage: GRAIN,
          backgroundRepeat: 'repeat',
          opacity: 0.28,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Vệt ố vàng không đều, mô phỏng giấy ảnh cũ. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[45]"
        style={{
          background:
            'radial-gradient(130% 90% at 50% 40%, rgba(217,164,65,0) 45%, rgba(150,102,42,0.34) 100%)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Ánh vàng nhẹ phủ lên, kéo toàn bộ về một tông. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[45]"
        style={{
          backgroundColor: 'rgba(214, 170, 94, 0.2)',
          mixBlendMode: 'overlay',
        }}
      />
    </>
  );
}

/**
 * Bộ lọc ngả màu cho KHUNG PHỐ.
 *
 * Tách khỏi lớp phủ ở trên vì `filter` phá `position: fixed` của con cháu.
 * Chuỗi này giảm bão hoà rồi kéo nhẹ về vàng: `sepia` một mình sẽ làm mọi thứ
 * nâu đều như ảnh cũ hỏng, nên trộn lại một phần độ bão hoà gốc.
 */
export const RETRO_BOARD_FILTER = 'saturate(0.62) sepia(0.3) contrast(1.08) brightness(0.97)';
