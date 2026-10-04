/**
 * DIỆN MẠO NHÂN VẬT - nguồn dữ liệu duy nhất.
 *
 * Trước đây `FacialEmotion` được khai báo HAI lần với hai giá trị y hệt nhau:
 * một lần ở `citizen-scenarios.ts` và một lần ở `ExpressiveStreetCitizens.tsx`.
 * Hai file cùng giữ một union hợp nhất kiểu này sẽ lệch nhau ngay lần đổi đầu
 * tiên, và vì TypeScript so sánh theo cấu trúc chứ không theo tên, chỗ lệch
 * không báo lỗi - chỉ hiện ra khi rendering sai expression trên mặt nhân vật.
 *
 * Mọi file cần kiểu này phải import từ đây, không khai báo lại.
 */

/**
 * Biểu cảm khuôn mặt - đây là định nghĩa DUY NHẤT trong repo.
 *
 * LÚC 4: chỉ đủ để chào/đói/ngạc hứng. Cả 4 đều là emotion "tươi" nên ai cũng
 * giống ai - cả phố vui như nhau là phố không có chuyện.
 * LÚC 9: thêm 5 emotion ĐỘNG TRỰC (tiền, khóc, đắc thắng, cáu, ngủ gật) -
 * chính là những cái được dùng để kể chuyện cho lời thoại tài chính.
 *
 * Không thêm emotion nếu không định vẽ nó trong `ChibiRenderer` - một case
 * rơi xuống `default` là mặt nhân vật im lìm, đọc như lỗi chứ không như thái độ.
 */
export type FacialEmotion =
  | 'HAPPY'
  | 'STAR_EYES'
  | 'SURPRISED'
  | 'TIRED'
  /** Thấy tiền: mắt thành ký hiệu tiền, lỡ dịp nói về thu nhập. */
  | 'MONEY_EYES'
  /** Khóc thương: nước mắt thành suối. Dùng khi NPC nói về chi phí/lãi. */
  | 'CRYING'
  /** Tự đắc: lim mắt + môi nhếch một bên. */
  | 'SMUG'
  /** Cáu: lông mày chữ V dốc, miệng thẳng. */
  | 'ANGRY'
  /** Ngủ gật: mắt hở một khe + ngáp. */
  | 'SLEEPY';

/** Kiểu tóc/mũ đội đầu. */
export type HairStyle =
  | 'SHORT'
  | 'BUN'
  | 'BOB'
  | 'PONYTAIL'
  | 'LONG_HAIR'
  | 'BALD_GLASSES'
  | 'NON_LA'
  | 'CAP_YELLOW'
  | 'HELMET_BLUE'
  | 'HARD_HAT_ORANGE'
  | 'HARD_HAT_YELLOW'
  | 'HEADSCARF'
  /** Tóc rối dựng ngược - dành cho người không có điều kiện gội đầu. */
  | 'MESSY';

/** Kiểu trang phục đặc thù đậm chất Việt Nam */
export type OutfitType =
  | 'DEFAULT'
  | 'AO_DAI'
  | 'SKIRT'
  | 'WORKER_OVERALLS'
  | 'ELECTRICIAN'
  | 'OFFICE_VEST'
  /** Đồng phục lao công: áo xanh phản quang + khẩu trang kéo xuống cổ. */
  | 'CLEANER';

/** Đồ cầm trên tay phải, vẽ ở translate(44,46). */
export type HeldItem =
  | 'MILK_TEA'
  | 'LOTTERY_FAN'
  | 'SHOPPING_BAG'
  | 'BRIEFCASE'
  | 'PHONE_QR'
  | 'LAPTOP'
  | 'CAMERA'
  /** Cái bát đặt mời, không phải bát đang ăn. */
  | 'BOWL'
  /**
   * Que gánh ve chai.
   *
   * Vẽ ở `translate(44,46)` như mọi đồ cầm tay, nên mô phỏng đúng kiểu nhìn
   * từ phía trước: que đi ngược lên sau đầu (đầu kia chìm sau gáy nên giỏ bên
   * kia bị thân che - thật và đỡ rối), còn đầu thõng xuống là giỏ thấy được.
   * Gánh thật qua hai vai sẽ đòi hỏi xoay thân trong mô phỏng - chưa đáng ở
   * hình 56x72.
   */
  | 'SHOULDER_POLE'
  /** Cây chổi quét rác, vẽ nghiêng tựa vai - đồ nghề của Cô Lao Công. */
  | 'BROOM'
  | 'NONE';

/**
 * Tư thế vẽ.
 *
 * `SIT` không phải chỉ là `STAND` thấp xuống: người ngồi XÓA chân, thay bằng
 * một khối gập ngang, và hạ thân + đầu xuống cho tới khi đáy thân chạm khối
 * gập. Nếu chỉ dịch chuyển thì đầu vẫn cao ngang người đứng, đọc ra "ngồi
 * liệt" chứ không phải ngồi bệt.
 */
export type Pose = 'STAND' | 'SIT';

/**
 * Phần diện mạo dùng chung cho TẤT CẢ hình vẽ nhân vật: cư dân trên phố,
 * NPC sinh theo tòa nhà, cố vấn, quản lý.
 *
 * Tách khỏi `CitizenDef` để mô-đun vẽ không phải phụ thuộc mô-đun mô phỏng
 * (vốn kéo theo `store`, `ref`, RAF loop). `CitizenDef extends` interface này
 * nên thêm một trường mới ở đây là bắt buộc mọi nhân vật phải khai - không
 * phải nhớ tay từng file.
 */
export interface CharacterAppearance {
  skinColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  accentColor: string;
  outfitType?: OutfitType;
  hasTie?: boolean;
  heldItem?: HeldItem;
  /** Mặc định `STAND`. */
  pose?: Pose;
}
