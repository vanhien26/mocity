'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { claimTapReward, recordCitizenTalk, spendCoins } from '@/lib/mocity/store';
import { formatCompact } from '@/lib/mocity/format';
import { particles } from './ParticleEngine';
import { useGameJuice } from '@/lib/mocity/useGameJuice';
import type { CharacterAppearance, FacialEmotion } from '@/lib/mocity/character-appearance';
import { ChibiBody } from './ChibiRenderer';
import {
  CITIZEN_SCRIPTS,
  FINANCE_TAG_META,
  type CitizenDialogueOption,
} from '@/lib/mocity/citizen-scenarios';
import type { ShopQueue } from '@/lib/mocity/types';
import { CYCLE_K, PHASE_PER_PX } from '@/lib/mocity/walk-cycle';
import { menuItemFor, MAX_WAIT_MS } from '@/lib/mocity/transactions';
import CharacterPanel from './CharacterPanel';

const EMPTY_REAL_QUEUE: ShopQueue[] = [];

/**
 * TALKING la trang thai do NGUOI CHOI kich hoat khi bam vao cu dan: nhan vat
 * dung han lai cho den khi dong hoi thoai, khac han cac trang thai con lai von
 * tu het han theo behaviorTimer.
 */
export type CitizenBehavior =
  | 'WALKING'
  | 'ADMIRING_SHOP'
  | 'CHATTING'
  | 'WAVING'
  | 'TALKING'
  /** Dang xep hang cho cua hang da mo. Chi giu chuc nang o RAM, khong dua vao React state. */
  | 'QUEUEING';

/**
 * Cư dân trên phố = KHÔNG GIAN (vị trí, lane, tốc độ, lời thoại) + DIỆN MẠAO
 * (màu da/tóc/áo) kế thừa từ `CharacterAppearance`.
 *
 * Tách phần diện mạo ra ngoài để mô-đun vẽ không phải biết gì về vòng mô
 * phỏng: thêm cố vấn/quản lý sau này chỉ cần cấp `CharacterAppearance`, không
 * phải dựng một `CitizenDef` với startX/lane/quotes.
 */
interface CitizenDef extends CharacterAppearance {
  id: string;
  name: string;
  role: string;
  startX: number;
  /** Chi so hang sau (0 = gan mat duong nhat), doc tu `LANES`. */
  lane: number;
  startDir: 1 | -1;
  speed: number;
  emotion: FacialEmotion;
  quotes: string[];
  /**
   * Đứng yên một chỗ: không đi dạo, không xếp hàng, không bị kéo vào tiệm.
   *
   * Khác với `speed: 0` - `speed = 0` chỉ làm nhân vật đứng im nhưng vẫn bị
   * hệ thống hành vi coi là người đi đường: vẫn chọn tiệm, vẫn nhận queue,
   * vẫn bị anti-cluster đẩy xô. Cờ này cắt cả ba nhánh đó.
   */
  stationary?: boolean;
}

/** Mutable simulation state - không trigger React re-render */
interface SimState {
  x: number;
  dir: 1 | -1;
  walkPhase: number;
  behavior: CitizenBehavior;
  behaviorTimer: number;
  jumpOffset: number;
  bubbleTimer: number;
  speechCooldown: number;
  /** Cửa hàng đang xếp hàng. `null` = đang đi dạo tự do. */
  queueShopId: string | null;
  /** Vị trí trong hàng đợi, 0 = sát cửa. -1 = chưa vào hàng. */
  queueSlot: number;
  /**
   * HÀNG DÙNG CHUNG - chi so hang cho TOAN BO nguoi dang xep hang cua tiem.
   *
   * Khong the loi dung `def.lane` duoc. `targetX` chi phan biet truc NGANG
   * (`shop.x - 34 - slot*26`), con truc SAU van la `laneYOf(def.lane)` rieng
   * cua tung nguoi - lane 14 den 86, bon buoc 9px. Ket qua: 3 nguoi xep hang
   * nam o 3 TUNG SAU KHAC NHAU, mat doc ra la mot bui nguoi cham truoc cua
   * tiem chu khong phai mot hang. Cai nay chinh la loi "bu lai" dang di.
   *
   * Nguoi vao hang dau tien chon lane cua minh, cac nguoi sau keo theo. Nguoi
   * do roi hang thi lane van giu tren nguoi con lai - khong ai bi day ve lane
   * rieng giua hang. Nguoi cuoi cung roi xong thi hang het, lan sau lai bat dau
   * tu lane rieng cua nguoi moi.
   *
   * -1 = chua vao hang nao.
   */
  queueLane: number;
  /** Số giây đã phục vụ, dùng cho bong bóng "Cảm ơn Thị Trưởng". */
  serviceTimer: number;
  /**
   * Mốc giờ (`arrivedAt`) của ĐƠN HÀNG THẬT mà cư dân này đang đại diện đứng
   * chờ - lấy thẳng từ `ShopQueue` trong store, không tự bịa.
   *
   * Khi mốc này KHÔNG CÒN trong hàng chờ thật nữa (người chơi đã bấm đóng,
   * hoặc đơn hết hạn), cư dân rời quầy ngay - đây là điểm khác bản cũ: cũ
   * đứng chờ theo đồng hồ riêng (`serviceTimer > phucVuGiay`), không liên
   * quan gì tới việc người chơi có bấm hay không.
   */
  claimedArrivedAt: number | null;
  /** Khoảng lấy lý do kêu gọi cư dân vào tiệm, chống spam mỗi frame. */
  nextShopPullAt: number;
  /**
   * Điểm neo sinh hoạt: mỗi cư dân quanh quẩn một khúc phố của mình.
   *
   * Trước đây biên duy nhất là mép trái và mép phải, nên cả 12 người đều tuần
   * hành trọn chiều dài phố như lính gác. Đo 66 giây: ai cũng đi từ x≈190 tới
   * x≈1220 trên khúc phố rộng 1.364px.
   */
  homeX: number;
  /** Bán kính quanh `homeX` mà cư dân này đi lại. */
  roamRadius: number;
  /**
   * Vận tốc hiện tại, px mỗi đơn vị dt.
   *
   * Tách khỏi `dir * def.speed` để có tăng tốc và giảm tốc. Trước đây vận tốc
   * đổi dấu tức thì ở biên: nhân vật đang đi 100% tốc độ thì frame sau đã đi
   * ngược lại cũng 100%, không có nhịp dừng nào. Mắt người đọc ra ngay đó là
   * chuyển động máy móc.
   */
  vel: number;
  /** Hướng mặt đang hiển thị, tách khỏi `dir` để quay người có thời lượng. */
  faceDir: 1 | -1;
  /** Tiến độ cú quay người, 1 là vừa bắt đầu, 0 là xong. */
  faceTurn: number;
}

/** Một cửa tiệm đã mở, dùng làm điểm tụ cho cư dân xếp hàng. */
export interface ShopAnchor {
  id: string;
  /** `BuildingDef.id` - dùng để tra menu món (`menuItemFor`). */
  defId: string;
  /** Tọa độ X của cửa tiệm trên vỉa hè. */
  x: number;
  /** Tên hiển thị trên bảng hiệu. */
  label: string;
  /** Số chỗ phục vụ đồng thời, tăng theo cấp tiệm. */
  capacity: number;
}

/** Appearance state - chỉ thay đổi khi behavior change (~mỗi 10-15s) */
interface CitAppearance {
  emotion: FacialEmotion;
  bubbleText: string | null;
}


/**
 * Bong bong sau khi được phục vụ.
 *
 * Câu ngắn, đời thường, và gắn với việc quét mã - đó là hành động người chơi
 * đã đầu tư (lắp Loa QR) mới thấy.
 */
const SERVED_LINE = [
  'Ting ting! Xong rồi nha, quét MoMo một cái là xong!',
  'Cảm ơn Thị Trưởng, tiệm vừa loa đọc tiền về êm tai lắm!',
  'Hết nước sổ nơ rồi, giờ tui không cần mè mỗi lần bán nữa!',
  'Thiệt là nhẹ hậu trường, không phải đếm tiền lẻ mỏi tay nữa!',
  'Quét QR nhanh hơn đổi tiền lẻ, chú bán hàng cũng mừng lắm!',
  'Để tiền vô Túi Thần Tài luôn đi, kẹp xong tiếp đồ!',
];


/**
 * Hang sau tren via he.
 *
 * Truoc day `laneY` long le 16-42 tren via he cao 150px: 12 nguoi chen vao
 * mot day rong 26px nen nhin nhu di hang ngang, va ai cung gan mat duong.
 * Via he gio cao 196px va hang rai 9 buoc 9px = vung 14-86px, gap gan 3 lan.
 *
 * `lane` la CHI SO (0 = gan mat duong nhat), `LANE_Y` moi la toa do thuc. Dung
 * chi so de khi them nhan vat moi chi can cham so hang, khong phai tinh toa do
 * va dam bao khong trung hang voi nguoi da co.
 *
 * Moc gioi han: dau nguoi (72px + 8px day `bottom-2`) phai khong vuot qua
 * mat via he, tuc `laneY <= VIA_HE_HEIGHT - 80 = 116`. Hang cuc lai 86 con
 * du 30px cho dong tac vi hoat thanh ban cong gianh.
 */
export const LANES = [14, 23, 32, 41, 50, 59, 68, 77, 86];
export const LANE_COUNT = LANES.length;

/** Toa do hang theo chi so hang, vo han (lan 0 roi quay lai tu dau). Export cho `StreetPassersby` dung chung - khong sua hai ban. */
export function laneYOf(lane: number): number {
  return LANES[((lane % LANE_COUNT) + LANE_COUNT) % LANE_COUNT];
}

const CITIZEN_DEFS: CitizenDef[] = [
  {
    id: 'cit-mayor-assistant', name: 'Trợ Lý Thị Trưởng', role: 'Cán Bộ Quy Hoạch',
    startX: 240, lane: 0, startDir: 1, speed: 0.4, emotion: 'HAPPY',
    skinColor: '#FDE6D2', hairStyle: 'SHORT', hairColor: '#2B2118',
    shirtColor: '#2B4368', pantsColor: '#1E293B', accentColor: '#DC2626',
    outfitType: 'OFFICE_VEST', hasTie: true,
    heldItem: 'BRIEFCASE',
    quotes: [
      'Trời nắng 40°C mà cán bộ vẫn đi tuần kiểm tra vỉa hè đây!',
      'Cây xanh đô thị giúp giảm 3 độ C, bà con ủng hộ trồng thêm nha!',
      'Mưa ngập triều cường nhưng hệ thống thoát nước MoCity đang cân đẹp!',
      'Nhà nào hát karaoke sau 10h đêm là có biên bản nhắc nhở liền nha!',
      'Phố vỉa hè bữa nay 100% quét mã QR, văn minh kiểu mẫu!',
      'Đèn đường vừa bật tự động lúc chập tối, bà con an tâm dạo mát!',
    ],
  },
  {
    id: 'cit-co-tu', name: 'Cô Tư Đi Chợ', role: 'Bà Nội Trợ Săn Deal',
    startX: 390, lane: 4, startDir: -1, speed: 0.3, emotion: 'STAR_EYES',
    skinColor: '#FCD9BD', hairStyle: 'HEADSCARF', hairColor: '#2B2118',
    shirtColor: '#0D9488', pantsColor: '#334155', accentColor: '#14B8A6',
    outfitType: 'WORKER_OVERALLS',
    heldItem: 'SHOPPING_BAG',
    quotes: [
      'Trời nồm ẩm sàn trơn như sân trượt băng, đi chợ phải rón rén!',
      'Sốt giá vàng từng giờ chóng cả mặt, thôi mua cá tươi ăn cho lành!',
      'Nắng cháy đầu mà săn được mã giảm giá 50k rau củ là mát lòng!',
      'Hàng xóm lại bật loa kẹo kéo hát "Duyên Phận", tui thuộc làu luôn!',
      'Quét mặt sinh trắc học MoMo lúc mới ngủ dậy tóc xù vẫn nhận diện chuẩn ghê!',
      'Tích xu đổi voucher mua sắm Tết từ bây giờ là vừa đẹp cô bác ơi!',
    ],
  },
  {
    id: 'cit-be-nam', name: 'Bé Nam GenZ', role: 'Sinh Viên Năm 3',
    startX: 540, lane: 8, startDir: 1, speed: 0.5, emotion: 'HAPPY',
    skinColor: '#FDE6D2', hairStyle: 'CAP_YELLOW', hairColor: '#1F2937',
    shirtColor: '#65A30D', pantsColor: '#374151', accentColor: '#FACC15',
    heldItem: 'MILK_TEA',
    quotes: [
      'Trưa 40 độ húp ly trà sữa full topping mới hồi sinh được!',
      'Mưa ngập ngã tư sâu nửa bánh xe, lội nước ngỡ đang chèo sup!',
      'Kèo lẩu tối qua chia tiền trên MoMo, đứa nào tính trốn WC tui tag thẳng!',
      'Mở 5 tab canh vé xe Tết về quê mà mạng xoay đều như chong chóng!',
      'Trời rét căm căm đi thực tập chỉ ước trùm chăn cày deadline...',
      'Sinh trắc học quét mặt nhanh phết, lỡ sưng mụn một bên vẫn qua vèo vèo!',
    ],
  },
  {
    id: 'cit-chi-thao', name: 'Chị Thảo Văn Phòng', role: 'Thánh Chốt Đơn',
    startX: 690, lane: 3, startDir: -1, speed: 0.38, emotion: 'HAPPY',
    skinColor: '#FFF1E6', hairStyle: 'BUN', hairColor: '#3E2723',
    shirtColor: '#F472B6', pantsColor: '#334155', accentColor: '#D82D8B',
    outfitType: 'SKIRT',
    heldItem: 'PHONE_QR',
    quotes: [
      'Ting! Lãi Túi Thần Tài sáng nay về đủ bù ly cà phê muối chữa lành!',
      'Thời tiết ẩm ương như deadline của sếp, sáng nắng chiều giông tối nồm!',
      'Săn sale 0h xong sáng ra hoa mắt, may có Ví Trả Sau gánh còng lưng!',
      'Camera ngã tư mới phạt nguội gắt lắm, đi đứng nghiêm chỉnh nha mấy ní!',
      'Drama trà xanh văn phòng bên tòa nhà đối diện hót hòn họt cả sáng!',
      'Vé máy bay Tết đắt quá, chắc gom voucher MoMo săn vé tàu hỏa thôi!',
    ],
  },
  {
    id: 'cit-ong-loc', name: 'Ông Lộc Vé Số', role: 'Thần Tài Góc Phố',
    startX: 840, lane: 7, startDir: 1, speed: 0.28, emotion: 'HAPPY',
    skinColor: '#FCD9BD', hairStyle: 'BALD_GLASSES', hairColor: '#9CA3AF',
    shirtColor: '#D97706', pantsColor: '#3E2A1B', accentColor: '#FEF08A',
    heldItem: 'LOTTERY_FAN',
    quotes: [
      'Trời nắng chang chang nhưng đi bộ vừa khỏe chân vừa nuôi Heo Vàng!',
      'Giá vàng lên xuống thây kệ, chiều nay vé số đuôi 68-79 bao nổ nha!',
      'Mưa to tui ghé hiên tiệm tạp hóa trú mưa, quét mã QR mua lẹ!',
      'Cả xóm đang kháo nhau hôm qua có người trúng giải nhì Vietlott kìa!',
      'Già rồi mà quét mặt sinh trắc học cái rẹt, MoMo làm tiện quá xá!',
      'Trời se lạnh làm chén trà nóng ngắm phố phường MoCity bình yên ghê!',
    ],
  },
  {
    id: 'cit-anh-hoang', name: 'Anh Hoàng Thợ Điện', role: 'Kỹ Thuật Điện Lực',
    startX: 990, lane: 2, startDir: -1, speed: 0.42, emotion: 'HAPPY',
    skinColor: '#E0A87E', hairStyle: 'HARD_HAT_ORANGE', hairColor: '#111827',
    shirtColor: '#EA580C', pantsColor: '#1E293B', accentColor: '#F97316',
    outfitType: 'ELECTRICIAN',
    heldItem: 'NONE',
    quotes: [
      'Kiểm tra trạm biến áp mùa nắng nóng, đảm bảo điện lưới cho cả phố MoCity!',
      'Trời nồm ẩm dây điện dễ chập, bà con chú ý an toàn thiết bị gia đình nha!',
      'Mưa ngập là đội kỹ thuật đi ngắt điện điểm trũng liền, bảo vệ an toàn!',
      'Tự động thanh toán hoá đơn tiền điện qua MoMo đỡ mất công đóng trễ cắt điện!',
      'Bảo trì đường dây cao thế mồ hôi ướt đẫm, mà thấy phố sáng rực là vui rồi!',
      'Mùa triều cường bà con nhớ ngắt aptomat tầng trệt nếu nước mấp mé cửa nghen!',
    ],
  },
  {
    id: 'cit-bao-ngoc', name: 'Bảo Ngọc Dạo Phố', role: 'Reviewer Phố Phường',
    startX: 1140, lane: 6, startDir: 1, speed: 0.45, emotion: 'STAR_EYES',
    skinColor: '#FFF1E6', hairStyle: 'BOB', hairColor: '#7C2D12',
    shirtColor: '#38BDF8', pantsColor: '#475569', accentColor: '#F43F5E',
    outfitType: 'SKIRT',
    heldItem: 'CAMERA',
    quotes: [
      'Livestream review quán lẩu trời mưa ngập mà view nổ triệu triệu tim!',
      'Trời nắng gắt chụp cam thường da vẫn bắt sáng, phố MoCity ăn ảnh xịn!',
      'Drama xóm: 2 quán trà sữa đối diện combat giảm giá 1 đồng giật giũ!',
      'Check-in cây thông Noel sớm giữa trời se lạnh, outfit triệu like!',
      'Vé concert idol mở bán cháy vé trong 3 giây, tui chốt qua MoMo đỉnh chóp!',
      'Trend quét mã lì xì online QR cute năm nay hot rần rần trên TikTok!',
    ],
  },
  {
    id: 'cit-chu-bay', name: 'Chú Bảy Hàng Xóm', role: 'Tổ Trưởng Dân Phố',
    startX: 1290, lane: 1, startDir: -1, speed: 0.33, emotion: 'SURPRISED',
    skinColor: '#FCD9BD', hairStyle: 'HELMET_BLUE', hairColor: '#1F2937',
    shirtColor: '#4ADE80', pantsColor: '#334155', accentColor: '#22D3EE',
    heldItem: 'NONE',
    quotes: [
      'Nhà nào hát karaoke loa kẹo kéo sau 10 giờ là Chú Bảy gõ cửa tận nơi!',
      'Mưa lớn triều cường là Chú Bảy ra khơi thông cống rãnh cho bà con liền!',
      'Phạt nguội gửi giấy báo về tận nhà đó nghen, chớ vượt đèn vàng ngã tư!',
      'Tự động trích tiền điện nước qua MoMo, cả tổ dân phố sạch nợ!',
      'Trời nắng gắt nhắc bà con kiểm tra bình chữa cháy mini trước cửa!',
      'Hàng xóm láng giềng tối lửa tắt đèn có nhau, mượn tiền nhớ trả đúng hẹn!',
    ],
  },
  {
    id: 'cit-bac-tai', name: 'Bác Tài Xe Ôm', role: 'Tài Xế Công Nghệ',
    startX: 1440, lane: 5, startDir: 1, speed: 0.36, emotion: 'HAPPY',
    skinColor: '#FCD9BD', hairStyle: 'HELMET_BLUE', hairColor: '#1F2937',
    shirtColor: '#16A34A', pantsColor: '#1E293B', accentColor: '#22C55E',
    heldItem: 'PHONE_QR',
    quotes: [
      'Trời nắng đổ lửa 40 độ nhưng có cuốc nổ ting ting là vít ga liền!',
      'Mưa ngập bì bõm nước tràn vỉa hè, tài xế công nghệ vẫn bao ship bún bò!',
      'Xăng tăng giá vàng tăng, may chạy xe điện sạc pin tiết kiệm khối mớ!',
      'Khách quét QR MoMo cái rẹt, khỏi lo thối 2 ngàn rách góc kẹt ví!',
      'Sáng ra hóng drama tài xế đối đầu khách bom hàng mà thấy tức anh ách!',
      'Đường phố lắp camera phạt nguội rồi, chạy điềm đạm an toàn là nhất!',
    ],
  },
  {
    id: 'cit-chi-hang-rong', name: 'Chị Hàng Rong', role: 'Gánh Xôi Đầu Ngõ',
    startX: 1590, lane: 0, startDir: -1, speed: 0.29, emotion: 'HAPPY',
    skinColor: '#FCD9BD', hairStyle: 'NON_LA', hairColor: '#2B2118',
    shirtColor: '#A16207', pantsColor: '#44403C', accentColor: '#FBBF24',
    heldItem: 'SHOPPING_BAG',
    quotes: [
      'Trời mưa lâm râm gánh xôi bay mùi nếp dẻo thơm phức cả con phố!',
      'Nắng nóng 40 độ chuyển sang bán thêm chè đậu xanh hạt sen giải nhiệt!',
      'Bà con quét mã MoMo mua bánh mì lia lịa, dán Loa Thần Tài ting ting vui tai!',
      'Dạo này xóm dưới rộ lên vụ săn vàng miếng xếp hàng từ 4 giờ sáng!',
      'Trời lạnh ăn bắp nướng mỡ hành nóng giòn là chuẩn bài số dzách!',
      'Buôn bán vỉa hè mà văn minh, sạch sẽ, không xả rác bừa bãi nha!',
    ],
  },
  {
    id: 'cit-be-an', name: 'Bé An Học Sinh', role: 'Học Sinh Cấp 2',
    startX: 1740, lane: 4, startDir: 1, speed: 0.44, emotion: 'STAR_EYES',
    skinColor: '#FDE6D2', hairStyle: 'SHORT', hairColor: '#111827',
    shirtColor: '#F1F5F9', pantsColor: '#1E3A8A', accentColor: '#3B82F6',
    heldItem: 'NONE',
    quotes: [
      'Trời mưa to trường cho nghỉ tiết thể dục, con kéo cả đám đi ăn kem!',
      'Mẹ quét mã đóng học phí với tiền bán trú trên app luôn, tiện quá chừng!',
      'Trời nồm ẩm đi cầu thang trường trượt té ếch một cú quê xỉu luôn!',
      'Nuôi Heo Đất trên MoMo được 500k rồi, Tết này mua bộ lego siêu nhân!',
      'Bố dặn qua ngã tư phải chờ đèn xanh, camera phạt nguội ghê lắm á!',
      'Trời se lạnh mặc áo khoác đồng phục mới tinh đi học thích mê ly!',
    ],
  },
  {
    id: 'cit-co-linh', name: 'Cô Linh Áo Dài', role: 'Cô Giáo Duyên Dáng',
    startX: 1890, lane: 8, startDir: -1, speed: 0.31, emotion: 'HAPPY',
    skinColor: '#FFF1E6', hairStyle: 'LONG_HAIR', hairColor: '#1E1B18',
    shirtColor: '#F43F5E', pantsColor: '#FFFFFF', accentColor: '#FDE047',
    outfitType: 'AO_DAI',
    heldItem: 'NONE',
    quotes: [
      'Tà áo dài thướt tha dạo bước giữa phố MoCity ngập tràn cờ hoa rực rỡ!',
      'Trời nồm ẩm phấn viết bảng bị ướt, thôi cô chuyển qua chiếu slide online!',
      'Trời rét thế này học sinh đi học muộn với lý do trùm chăn ấm quá!',
      'Phụ huynh chuyển khoản học phí tự động ting ting, sổ sách nhẹ tênh!',
      'Đầu tháng trích lương vào Túi Thần Tài lấy lãi ngày, vừa tiết kiệm vừa an tâm!',
      'Nắng rực rỡ soi bóng tà áo dài truyền thống, chụp hình kỷ yếu lớp đẹp mê ly!',
    ],
  },
  {
    /*
     * AN XIN - nhan vat dau tien khong phai khach hang.
     *
     * Tat ca 12 nguoi kia deu la khach hang: ho co tien tieu, xep hang, mua
     * duoc. Anh Ba thi khong. Neu cho anh vao vong di bo + xep hang chung thi
     * tro thanh mot "khach hang nua" va mat het ca y nghia ke ca tinh huong ke.
     * `stationary` cat ca ba nhanh do.
     *
     * `pose: 'SIT'`: nguoi xoi dat, chan gop thanh mot khoi ngang rong hon
     * than. Dung thi khong con doc ra gi.
     *
     * Vi tri: lane 0 (gan mat duong, thay ngay) tai `startX 780` - doan ma hai
     * cu dan lane 0 khac (home 240 va 1590, ban kinh toi da 430) khong bao gio
     * quay toi, nen khong ai di qua nguoi dang ngoi. Dung lane sau thi bi che
     * het boi 12 nguoi phia truoc.
     *
     * Thuong: di qua `claimTapReward` (bonus `rewardBonus`), KHONG qua
     * `recordTransactions`. Anh khong ban hang - cho tien la don gian la cho
     * tien, ma cho tien la chi tieu rieng cua thi truong, khong phai doanh thu
     * cua khoi.
     */
    id: 'cit-an-xin', name: 'Anh Ba', role: 'Ngồi Vỉa Hè',
    startX: 780, lane: 0, startDir: 1, speed: 0.3, emotion: 'TIRED',
    stationary: true, pose: 'SIT',
    skinColor: '#C98F68', hairStyle: 'MESSY', hairColor: '#4A3B30',
    shirtColor: '#7E7667', pantsColor: '#6B5B4A', accentColor: '#8C3B2E',
    heldItem: 'BOWL',
    quotes: [
      'Sáng nay chưa có gì vào bụng, Thị Trưởng có thừa bát nào không ạ?',
      'Đêm qua ngủ ở hiên chợ, sáng ra thì bị bảo vệ xua đi mất chỗ.',
      'Tội người ta, chứ tui cũng từng có cửa tiệm ngày xưa chú ơi.',
      'Bữa nay được hai ổ bánh mì, chia lại một ổ cho bà cụ cuối chợ.',
    ],
  },
  {
    /*
     * CO GANH VE CHAI - khach hang NHUNG khong phai khach hang cua tiem.
     *
     * Khac Anh Ba (dang ngoi xin, co `stationary`): co DI va co tien, nen
     * van binh thuong di bo va van xep hang duoc. `speed: 0.17` la cham nhat
     * pho - dang GANH mot gánh, khong phai dang di dao.
     *
     * NON_LA + que gach la hai dau hieu doc ra duoc ngay trong hinh 56x72,
     * khong can doc ten. Gioc ve chai ve ben NGOAI than (o `translate(44,46)`),
     * dau que con lai di len sau dau bi dau dau che - dung nhu nhin tu phia
     * truoc, va gioc sau nguoi bi than che nen chi con mot gioc thay ro.
     *
     * Chu de rieng `THANH_KHOAN` - xem ghi chu trong `citizen-scenarios.ts`.
     */
    id: 'cit-co-ve-chai', name: 'Cô Hai', role: 'Gánh Ve Chai',
    startX: 1215, lane: 3, startDir: -1, speed: 0.17, emotion: 'SMUG',
    skinColor: '#C98F68', hairStyle: 'NON_LA', hairColor: '#3A2E26',
    shirtColor: '#6E8C72', pantsColor: '#4A3B30', accentColor: '#C97A4A',
    heldItem: 'SHOULDER_POLE',
    quotes: [
      'Mệt thì mệt mà tiền tươi, cân xong là cầm liền chẳng phải chờ ai chốt.',
      'Cháu giữ cái này đi, cô gom cả ngày mới được có một bọc.',
      'Giá giấy hôm nay hơi xịt, thôi thì đi thêm một vòng nữa vậy.',
      'Cô gánh suốt hai mươi năm rồi, chân cô thuộc từng nẻo đường phố mình.',
    ],
  },
  {
    /*
     * CÔ LAO CÔNG - loại trang phục còn thiếu trong dàn nhân vật: đồng phục
     * vệ sinh môi trường (áo phản quang vàng + khẩu trang kéo xuống cổ), cầm
     * chổi thay vì đồ nghề buôn bán. Đi chậm đều vì vừa đi vừa quét, khác
     * nhịp hối hả của dân văn phòng/shipper.
     */
    id: 'cit-co-lao-cong', name: 'Cô Sáu Lao Công', role: 'Vệ Sinh Môi Trường',
    startX: 2040, lane: 2, startDir: 1, speed: 0.24, emotion: 'HAPPY',
    skinColor: '#E0A87E', hairStyle: 'HEADSCARF', hairColor: '#2B2118',
    shirtColor: '#16A34A', pantsColor: '#1E293B', accentColor: '#FDE047',
    outfitType: 'CLEANER',
    heldItem: 'BROOM',
    quotes: [
      'Quét xong đoạn này là phố mình sạch bong từ đầu hẻm tới cuối ngõ!',
      'Rác phân loại sẵn giùm cô nha, chai lọ với bọc ni lông để riêng ra.',
      'Nắng nóng 40 độ vẫn phải quét ca sáng, xong ca là tắm cái đã đời!',
      'Bà con đổ rác đúng giờ là cô đỡ cực biết bao nhiêu, cảm ơn nha!',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * SẢI CHÂN PHẢI KHỚP QUÃNG ĐƯỜNG - nếu không thì "đi như bay".
 *
 * Đây là phép đo, không phải cảm tính:
 *
 *   Tốc độ thật   `sim.x += vel * dt * 10`, với `dt = ms/100`
 *                 → quãng đường = speed × 100 px mỗi giây.
 *
 *   Sải chân thật chân dài `dai=17`, khớp ở hông, xoay ±`SWING_DEG`.
 *                 Bàn chân (đầu dưới) quét ngang
 *                 `2 × 17 × sin(26°)` ≈ 14,9px cho MỘT bước.
 *
 * Bản cũ đặt `--spd = 0.6 / speed`, nên mỗi chu kỳ (2 bước) thân đi
 * `speed×100 × 0.6/speed` = 60px, tức 30px/bước - GẤP ĐÔI quãng mà bàn chân
 * với tới được. Chân không bám kịp đất, thân trôi đi: đúng hiện tượng nhân
 * vật "lướt/bay" mà mắt bắt được ngay dù không chỉ ra được vì sao.
 *
 * Giữ nguyên tốc độ di chuyển (phố phải sống), chỉ RÚT NGẮN chu kỳ để mỗi
 * bước đi đúng 14,9px: chân ngắn thì phải bước nhanh và ngắn - đó cũng là
 * cách các bộ sprite walk-cycle chibi dựng sẵn vẫn làm.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* Hằng số suy từ ràng buộc trên, xem `lib/mocity/walk-cycle.ts`. */
export { CYCLE_K } from '@/lib/mocity/walk-cycle';

/**
 * CSS keyframes cho walk animation.
 * Toàn bộ leg/arm swing, body bob, head wobble chạy hoàn toàn qua CSS -
 * không cần React re-render mỗi frame.
 * --spd: thời lượng animation, CẬP NHẬT SỐNG mỗi khung hình theo vận tốc
 * thật (`Math.abs(sim.vel)`) chứ không chỉ gán một lần theo `def.speed` -
 * xem khối cập nhật `--spd` trong vòng lặp RAF, ngay sau khi đổi class
 * `walking`/`idle`. Không thì chân đá đều tốc độ danh nghĩa trong lúc thân
 * đang tăng/giảm tốc, nhìn như trượt băng.
 *
 * `export` cho `StreetPassersby.tsx` dùng lại: chung một keyframe set, không
 * nhân bản tay. Hai `<style>` cùng inject một bộ keyframe KHÔNG triệt tiêu
 * nhau - `@keyframes` trùng tên lấy cái xuất hiện sau, mà hai bộ giống hệt
 * nhau nên kết quả không đổi. Component kia vẫn tự inject để không phụ thuộc
 * vào việc file này có được mount hay không.
 */
export const WALK_CSS = `
/*
 * CHU KỲ ĐI BỘ CHIBI - khớp xoay liên tục.
 *
 * Quay lại rotate() sau khi thử pixel art bốn khung hình: ở khung 56x72 thì
 * số khung hình thấp không đọc thành phong cách, nó đọc thành giật cục.
 *
 * BẪY ĐÃ TỪNG DÍNH: thuộc tính transform của CSS animation GHI ĐÈ transform
 * attribute của SVG. Nhóm nào vừa có translate(...) vừa có animation rotate()
 * sẽ mất phần translate và rơi về gốc toạ độ - tay chân văng khỏi thân. Vì
 * vậy translate nằm ở nhóm NGOÀI, nhóm trong chỉ xoay.
 */
.cit-walk-anim .cit-lb,
.cit-walk-anim .cit-lf,
.cit-walk-anim .cit-ab,
.cit-walk-anim .cit-af { transform-origin: 0px 0px; will-change: transform; }
.cit-walk-anim .cit-hw { transform-origin: 28px 30px; will-change: transform; }
.cit-walk-anim .cit-bw { transform-origin: 28px 50px; will-change: transform; }

.walking .cit-lb { animation: cbLegB var(--spd,0.6s) ease-in-out infinite; }
.walking .cit-lf { animation: cbLegF var(--spd,0.6s) ease-in-out infinite; }
.walking .cit-ab { animation: cbArmB var(--spd,0.6s) ease-in-out infinite; }
.walking .cit-af { animation: cbArmF var(--spd,0.6s) ease-in-out infinite; }
.walking .cit-bw { animation: cbBob  var(--spd,0.6s) ease-in-out infinite; }
.walking .cit-hw { animation: cbHead calc(var(--spd,0.6s)*2) ease-in-out infinite; }
.idle    .cit-bw { animation: cbSway 3.2s ease-in-out infinite; }
.idle    .cit-hw { animation: cbSway 4.4s ease-in-out infinite; }

/*
 * Biên độ chân 26 độ, tay 20 độ. Chibi chân ngắn nên cùng một góc cho ra
 * sải bước nhỏ hơn người tỷ lệ thường, phải mở rộng hơn mới thấy là đang đi.
 */
@keyframes cbLegF { 0%,100%{transform:rotate(-26deg)} 50%{transform:rotate(26deg)} }
@keyframes cbLegB { 0%,100%{transform:rotate(26deg)}  50%{transform:rotate(-26deg)} }
@keyframes cbArmF { 0%,100%{transform:rotate(20deg)}  50%{transform:rotate(-20deg)} }
@keyframes cbArmB { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
/* Thân nhún HAI lần mỗi chu kỳ, vì mỗi chu kỳ là hai bước chân. */
@keyframes cbBob {
  0%,100% { transform: translateY(0) }
  25%     { transform: translateY(-2.2px) }
  50%     { transform: translateY(0) }
  75%     { transform: translateY(-2.2px) }
}
/* Đầu lắc nhẹ lệch pha với chân, nếu cùng pha sẽ thành gật gù máy móc. */
@keyframes cbHead { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
@keyframes cbSway { 0%,100%{transform:rotate(-1.4deg)} 50%{transform:rotate(1.4deg)} }

@keyframes citBubblePop {
  0% { opacity: 0; transform: translateY(6px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.cit-speech-bubble {
  animation: citBubblePop 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

/**
 * STICKER TAM TRANG - thay cho chuoi emoji loi cu.
 *
 * Emoji noi duoc "muon cam gi" va 9 emoji doc giong nhau o kich thuoc 14px
 * trong header. Sticker noi duoc CAI CAU - vi du "Thay tien la sang mat" -
 * chinh la phan lam nhan vat cuoi duoc khi dang noi tien.
 *
 * Day khong phai noi duy nhat bieu cam: mat da ve trong `ChibiBody`, sticker
 * chi la nhan de doc nhanh khi mat qua nho.
 */
const EMOTION_STICKERS: Record<FacialEmotion, { emoji: string; line: string }> = {
  HAPPY: { emoji: '😊', line: 'Vui vẻ' },
  STAR_EYES: { emoji: '🤩', line: 'Lóa mắt' },
  SURPRISED: { emoji: '😮', line: 'Hả?' },
  TIRED: { emoji: '😅', line: 'Mệt xỉu' },
  MONEY_EYES: { emoji: '🪙', line: 'Thấy tiền là sáng mắt' },
  CRYING: { emoji: '😭', line: 'Khóc cạn nước mắt' },
  SMUG: { emoji: '😏', line: 'Tự đắc' },
  ANGRY: { emoji: '🤬', line: 'Nổi điên' },
  SLEEPY: { emoji: '🥱', line: 'Ngáp te te' },
};


/**
 * Nhan vat kieu CUT PAPER: moi bo phan la MOT mang phang, khong stroke.
 * Chieu sau tao bang lop giay dam hon o phia sau (`shade`), khong bang vien.
 * Cac diem xoay cua walk animation (chan 24/32,48 - tay 22/34,31 - dau 28,16)
 * phai giu nguyen, neu doi thi WALK_CSS transform-origin lech theo.
 */


export default function ExpressiveStreetCitizens({
  onCitizenReward,
  streetWidth = 2400,
  shops = [],
  realQueue = EMPTY_REAL_QUEUE,
}: {
  onCitizenReward?: (msg: string) => void;
  /**
   * Be rong that cua day pho. Cu dan phai quay dau trong pham vi nay, neu khong
   * ho se di tiep ra ngoai via he va lo lung giua nen troi khi nguoi choi moi
   * mo it cot dat.
   */
  streetWidth?: number;
  /**
   * Danh sach cua tiem da mo. Cu dan tu chon tienm de xep hang; tiem dong thi
   * chi con "ADMIRING_SHOP" nhu truoc.
   */
  shops?: ShopAnchor[];
  /**
   * HÀNG CHỜ THẬT, đọc thẳng từ store (`state.shopQueues`).
   *
   * Trước đây cư dân tự quyết định ai xếp hàng, tự đếm rồi báo ngược ra
   * ngoài qua `onQueueChange` - một mô phỏng RIÊNG, không liên quan tới hàng
   * chờ thật mà badge/ví đang dùng. Giờ cư dân ĐỌC THẲNG mảng này: một người
   * đứng chờ trên phố = một đơn hàng thật đang chờ được bấm, không hơn
   * không kém.
   */
  realQueue?: ShopQueue[];
}) {
  /** Bien di lai, doc trong vong RAF nen giu o ref de khong resubscribe. */
  const walkBoundRef = useRef(Math.max(360, streetWidth - 140));
  useEffect(() => {
    walkBoundRef.current = Math.max(360, streetWidth - 140);
  }, [streetWidth]);

  /*
   * `floatNumber` tao tu hook nen phai luu vao ref de goi trong vong RAF -
   * cung ly do voi `realQueueRef`/`shopsRef` o duoi: dong trong lan render
   * dau se thanh closure cu vinh vien.
   */
  const { floatNumber } = useGameJuice();
  const floatNumberRef = useRef(floatNumber);
  useEffect(() => {
    floatNumberRef.current = floatNumber;
  }, [floatNumber]);

  /**
   * Danh sach tiem giu trong ref.
   *
   * RAF loop chi chay mot lan (mount) nen doc `shops` truc tiep se bien mat
   * sau lan render dau tien. Giu o ref va gan gia tri moi moi render de loop
   * luon thay pho moi nhung khong phai khoi dong lai RAF.
   */
  const shopsRef = useRef<ShopAnchor[]>(shops);
  useEffect(() => {
    shopsRef.current = shops;
  }, [shops]);

  /**
   * HÀNG CHỜ THẬT, gom theo `shopId -> arrivedAt[]`, giữ trong ref cùng lý do
   * với `shopsRef`: RAF loop chỉ mount một lần, đọc `realQueue` trực tiếp sẽ
   * đóng băng ở giá trị của lần render đầu.
   */
  const realQueueRef = useRef<Record<string, number[]>>({});
  useEffect(() => {
    const map: Record<string, number[]> = {};
    for (const q of realQueue) map[q.shopId] = q.arrivedAt;
    realQueueRef.current = map;
  }, [realQueue]);

  // Appearance state: tất cả bắt đầu rỗng, không hiện ồ ạt bóng thoại khi mới vào
  const [appearances, setAppearances] = useState<CitAppearance[]>(() =>
    CITIZEN_DEFS.map((c) => ({
      emotion: c.emotion,
      bubbleText: null,
    }))
  );

  // Mutable sim state: cập nhật bằng RAF, không trigger re-render
  const simRef = useRef<SimState[]>(
    CITIZEN_DEFS.map((c, i) => ({
      // Trai deu cu dan tren be rong that: `startX` cu rai toi 1890px nen khi
      // moi mo 4 cot dat ho se dung ngoai via he.
      x: Math.min(c.startX, Math.max(360, streetWidth - 140)),
      dir: c.startDir,
      walkPhase: i * 1.4,
      behavior: (i % 3 === 0 ? 'ADMIRING_SHOP' : 'WALKING') as CitizenBehavior,
      behaviorTimer: 6 + (i % 4) * 2.5,
      jumpOffset: 0,
      bubbleTimer: 0,
      speechCooldown: 2 + i * 4, // Trải đều cooldown ban đầu để tránh cư dân đồng loạt cất lời
      queueShopId: null,
      queueSlot: -1,
      queueLane: -1,
      serviceTimer: 0,
      claimedArrivedAt: null,
      /*
       * MILI GIAY, cung thang do voi timestamp cua requestAnimationFrame.
       * Ban cu dat `3 + i * 1.4` (3 toi 18) la gia tri co giay, trong khi nhip
       * ke tiep lai la `now + 9000`, nen ca 12 nguoi cung thu ghe tiem ngay
       * frame dau va y do rai deu khong chay.
       */
      /*
       * `Number.POSITIVE_INFINITY` cho nguoi stationary: khong bao gio het han,
       * nen khong con duoc keo vao queue. Dat `0` thi `now >= 0` luon dung va
       * nguoi ngoi tren via he lien tuc xep hang nhu mot khach hang binh thuong.
       */
      nextShopPullAt: c.stationary ? Number.POSITIVE_INFINITY : 3_000 + i * 1_400,
      // Neo ngay chỗ xuất phát, bán kính so le để các vùng chồng lấn tự nhiên.
      homeX: Math.min(c.startX, Math.max(360, streetWidth - 140)),
      roamRadius: c.stationary ? 0 : 170 + (i % 5) * 65,
      vel: c.stationary ? 0 : c.startDir * c.speed,
      faceDir: c.startDir,
      faceTurn: 0,
    }))
  );

  // Khoảng lặng đường phố trước khi cư dân tiếp theo phát biểu (tránh nói liên tục)
  const nextStreetSpeechTimerRef = useRef<number>(3.5); // 3.5s sau khi vào game mới có câu thoại đầu tiên

  // DOM refs cho direct style updates (không qua React state)
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);

  // Batched appearance updates để flush vào React mỗi 200ms
  const pendingUpdates = useRef<Map<number, Partial<CitAppearance>>>(new Map());

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    let flushAccum = 0;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const elapsed = now - lastTime;
      if (elapsed < 16) return;
      const dt = Math.min(elapsed, 50) / 100;
      const dtSec = Math.min(elapsed, 50) / 1000;
      lastTime = now;
      flushAccum += elapsed;

      if (typeof document !== 'undefined' && document.hidden) return;

      /**
       * HÀNG ĐỢI TIỆM - phân bổ chỗ đứng cho từng cửa hàng.
       *
       * Slot 0 sát cửa, mỗi slot lùi thêm về trái.
       *
       * SAPO THEO THU TU GIA NHAN HANG CHỜ THẬT, khong theo index.
       *
       * Ban cu` duyet `simRef.current` theo index nen ai index nho nhat giu slot
       * 0 du dang dung o dau kia pho. Nguoi dang dung ngay cua lai bi day ra slot
       * roi phai di NGANG QUA nguoi kia de vao cho - hai nguoi lan nhau, mat doc
       * ra la di qua di lai chu khong phai xep hang. `claimedArrivedAt` la moc
       * don THAT, nho nhat = vao hang TRUOC, dung nghia FIFO luc nguoi choi bam
       * ban.
       */
      const queueCounters = new Map<string, number>();
      const dangXep = simRef.current
        .filter((s) => s.behavior === 'QUEUEING' && s.queueShopId)
        .sort((a, b) => (a.claimedArrivedAt ?? 0) - (b.claimedArrivedAt ?? 0));
      /*
       * KHONG loc theo `queueSlot >= 0`.
       *
       * Nguoi vua vao hang luon mang slot -1, nen dieu kien do tu loai tru
       * chinh doi tuong can cap so: khong ai tung nhan slot 0. Hau qua la
       * `targetX = shop.x - 34 - (-1)*26` tro thanh `shop.x - 8` - ca hang
       * chong len nhau lech 8px ben phai cua.
       */
      for (const s of dangXep) {
        if (!s.queueShopId) continue;
        const occupied = queueCounters.get(s.queueShopId) ?? 0;
        s.queueSlot = occupied;
        queueCounters.set(s.queueShopId, occupied + 1);
      }

      simRef.current.forEach((sim, i) => {
        const def = CITIZEN_DEFS[i];
        sim.jumpOffset = Math.max(0, sim.jumpOffset - dt * 25);

        const wasWalking = sim.behavior === 'WALKING';
        const wasQueueing = sim.behavior === 'QUEUEING';
        if (wasWalking && !def.stationary) {
          /*
           * Vận tốc ĐUỔI THEO tốc độ mục tiêu thay vì nhảy thẳng tới.
           *
           * Hệ số 4/giây cho quãng đổi hướng khoảng 0,25 giây: đủ để thấy
           * nhân vật chậm lại, dừng, rồi đi ngược, thay vì lật tức thì.
           */
          const vMuc = sim.dir * def.speed;
          sim.vel += (vMuc - sim.vel) * Math.min(1, dtSec * 4);
          sim.x += sim.vel * dt * 10;
          /*
           * Quay đầu ở biên VÙNG SINH HOẠT, vẫn kẹp trong biên phố.
           *
           * Vùng riêng làm mỗi người có một khúc quen thuộc thay vì cả 12
           * người cùng quét hết mặt phố. Đi xếp hàng (`QUEUEING`) thì không
           * chịu biên này - đói thì đi xa cũng phải đi.
           */
          const maxX = walkBoundRef.current;
          const canTrai = Math.max(180, sim.homeX - sim.roamRadius);
          const canPhai = Math.min(maxX, sim.homeX + sim.roamRadius);

          /*
           * Ngoài vùng thì ĐỔI HƯỚNG đi về, không gán lại toạ độ.
           *
           * Xếp hàng xong ở một tiệm xa là cư dân đứng ngoài vùng của mình.
           * Gán `sim.x = canPhai` ở đó sẽ làm nhân vật dịch chuyển tức thời cả
           * trăm px - lỗi nặng hơn hẳn cái đang sửa. Chỉ kẹp cứng ở biên phố,
           * vì ra khỏi đó là lơ lửng giữa nền trời.
           */
          if (sim.x > canPhai) sim.dir = -1;
          else if (sim.x < canTrai) sim.dir = 1;

          if (sim.x > maxX) { sim.x = maxX; sim.dir = -1; }
          else if (sim.x < 180) { sim.x = 180; sim.dir = 1; }
          /*
           * Nhịp nhún thân tính theo QUÃNG ĐƯỜNG VỪA ĐI, không theo đồng hồ.
           * Một cái nhún đúng một bước chân (xem `PHASE_PER_PX`), nên thân và
           * chân không bao giờ lệch nhịp dù đang tăng hay giảm tốc.
           */
          sim.walkPhase += PHASE_PER_PX * Math.abs(sim.vel * dt * 10);
        } else if (wasQueueing) {
          /**
           * Tiệm bị xoá giữa chừng (người chơi bán lại) thì cư dân phải tự
           * rời hàng, nếu không họ đứng giữa vỉa hè vô thời hạn.
           */
          const shop = shopsRef.current.find((sh) => sh.id === sim.queueShopId);
          /*
           * ĐƠN HÀNG CÒN THẬT KHÔNG?
           *
           * Đây là điểm khác bản cũ: cũ đứng chờ theo đồng hồ riêng
           * (`serviceTimer > phucVuGiay`), không liên quan gì tới việc người
           * chơi có bấm hay không. Giờ hễ `claimedArrivedAt` KHÔNG CÒN trong
           * hàng chờ thật (`realQueueRef`) nữa - vì người chơi đã bấm đóng,
           * hoặc đơn hết hạn tự nhiên - cư dân rời quầy NGAY, không chờ thêm
           * một giây giả nào.
           */
          const pending = sim.claimedArrivedAt !== null && sim.queueShopId
            ? (realQueueRef.current[sim.queueShopId] ?? []).includes(sim.claimedArrivedAt)
            : false;
          if (!shop || !pending) {
            if (shop && sim.claimedArrivedAt !== null) {
              /*
               * Đơn vừa biến mất trong lúc đang đứng chờ: đoán lý do theo
               * tuổi đơn. Gần/ngang `MAX_WAIT_MS` thì nhiều khả năng ĐÃ HẾT
               * HẠN (người chơi không bấm kịp) - cư dân bực bội bỏ đi, đúng
               * hậu quả thật của việc để khách chờ quá lâu. Còn trẻ thì nhiều
               * khả năng VỪA ĐƯỢC BẤM BÁN - cư dân vui vẻ rời đi.
               */
              const age = now - sim.claimedArrivedAt;
              const expired = age >= MAX_WAIT_MS - 1500;
              const container = containerRefs.current[i];
              if (container) {
                const rect = container.getBoundingClientRect();
                floatNumberRef.current(
                  rect.left + rect.width / 2,
                  rect.top,
                  expired ? 'Thôi, đi chỗ khác!' : 'Đã phục vụ',
                  expired ? '#B45309' : '#4A6B5A',
                );
              }
              pendingUpdates.current.set(i, {
                emotion: expired ? 'ANGRY' : 'STAR_EYES',
                bubbleText: expired
                  ? 'Chờ lâu quá, thôi tui đi chỗ khác!'
                  : SERVED_LINE[Math.floor(Math.random() * SERVED_LINE.length)],
              });
              sim.bubbleTimer = 3.6;
            }
            sim.behavior = 'WALKING';
            sim.queueShopId = null;
            sim.queueSlot = -1;
            sim.queueLane = -1;
            sim.claimedArrivedAt = null;
            sim.serviceTimer = 0;
            sim.behaviorTimer = 8 + Math.random() * 10;
            sim.speechCooldown = 20 + Math.random() * 20;
            sim.dir = Math.random() < 0.5 ? 1 : -1;
            sim.jumpOffset = 6;
          } else {
            /**
             * Người đứng sát cửa, người sau lùi dần theo hàng.
             *
             * 32px chu khong phai 26px: luc moi nguoi cung mot lane (xem
             * `queueLane`), khoang cach 26px cho hai cai dau chieu ~34px CHUNG
             * mot do sau - nguoi sau an mat nguoi truoc. 32px van la hang cham
             * (chua sum) ma moi cai dau con doc duoc.
             */
            const targetX = shop.x - 34 - sim.queueSlot * 32;
            const gap = targetX - sim.x;
            if (Math.abs(gap) < 2.5) {
              // Đã tới chỗ: đứng yên, quay mặt về phía cửa tiệm.
              sim.x = targetX;
              sim.dir = targetX < shop.x ? 1 : -1;
              sim.vel += (0 - sim.vel) * Math.min(1, dtSec * 6);
              sim.walkPhase += 0.05 * dt * 10;
              sim.serviceTimer += dtSec;
              /*
               * Nhắc lại món đang chờ mỗi khoảng - KHÔNG quyết định rời hàng
               * nữa, chỉ là bong bóng thoại. Rời hàng giờ hoàn toàn do
               * `pending` ở trên quyết định.
               */
              if (sim.serviceTimer > 6 && sim.bubbleTimer <= 0) {
                const item = menuItemFor(shop.defId, sim.claimedArrivedAt!);
                pendingUpdates.current.set(i, {
                  bubbleText: item
                    ? `Món ${item.name} xong chưa chị ơi?`
                    : SERVED_LINE[Math.floor(Math.random() * SERVED_LINE.length)],
                  emotion: 'HAPPY',
                });
                sim.bubbleTimer = 4.2;
                sim.serviceTimer = 0;
              }
            } else {
              sim.dir = gap > 0 ? 1 : -1;
              const vMuc = sim.dir * def.speed;
              sim.vel += (vMuc - sim.vel) * Math.min(1, dtSec * 4);
              const step = Math.abs(sim.vel) * dt * 10;
              // Quang DI THAT: gan toi noi thi bi gap chan lai, phai lay so da
              // dich chuyen that de nhip chan khong chay tiep khi da dung.
              const diThat = Math.min(step, Math.abs(gap));
              sim.x += Math.sign(gap) * diThat;
              sim.walkPhase += PHASE_PER_PX * diThat;
            }
          }
        } else {
          // Đứng lại: hãm dần về 0 chứ không tắt máy đột ngột.
          sim.vel += (0 - sim.vel) * Math.min(1, dtSec * 6);
          sim.walkPhase += 0.08 * dt * 10;
        }

        const bodyBob = wasWalking || wasQueueing
          ? Math.abs(Math.sin(sim.walkPhase)) * 3
          : Math.sin(sim.walkPhase) * 1.2;

        // Direct DOM updates - không qua React setState
        const container = containerRefs.current[i];
        if (container) {
          /*
           * DANG XEP HANG thi lay lane CHUNG cua hang, khong lay lane rieng.
           * Day la nua sau cua loi "bu lai": truc ngang da dung (slot FIFO) thi
           * phai dung ca truc sau, neu khong van con bon nguoi o bon do sau khac
           * nhau va van doc la mot bui.
           */
          const laneY = wasQueueing && sim.queueLane >= 0
            ? laneYOf(sim.queueLane)
            : laneYOf(def.lane);
          container.style.transform = `translate3d(${Math.round(sim.x)}px,${-Math.round(laneY + bodyBob + sim.jumpOffset)}px,0)`;
          /*
           * `100 - laneY` chu de duong dan duong khi `laneY` len toi 86: cong
           * thuc cu `60 - laneY` cho ra so am va con nay nam trong mot stacking
           * context cua cha, so am se an duoi nen vỉa he thay vi nam tren no.
           */
          container.style.zIndex = String(Math.round(100 - laneY));
        }
        const btn = btnRefs.current[i];
        if (btn) {
          /*
           * Quay người theo hướng ĐANG ĐI THẬT, và co lại ở giữa cú quay.
           *
           * `scaleX(dir)` lật tức thì làm nhân vật như bị soi gương. Nội suy
           * qua `scaleX` nhỏ dần rồi lớn lại cho ra cảm giác xoay người.
           */
          const huong = Math.abs(sim.vel) > 0.02 ? Math.sign(sim.vel) : sim.dir;
          const nguoc = huong !== sim.faceDir;
          if (nguoc) sim.faceTurn = 1;
          if (sim.faceTurn > 0) {
            sim.faceTurn = Math.max(0, sim.faceTurn - dtSec * 7);
            if (sim.faceTurn < 0.5) sim.faceDir = huong as 1 | -1;
          }
          const beNgang = sim.faceDir * Math.max(0.12, Math.abs(Math.cos(sim.faceTurn * Math.PI)));
          btn.style.transform = `scaleX(${beNgang.toFixed(3)})`;
        }

        const svg = svgRefs.current[i];
        if (svg) {
          /*
           * Người đang đi TỚI tiệm cũng phải có nhịp chân.
           *
           * Bản cũ chỉ xét `wasWalking`, nên cư dân ở trạng thái QUEUEING
           * trượt ngang vỉa hè hàng trăm px với dáng đứng yên. Đứng tại quầy
           * rồi mới là `idle`.
           */
          // Nguoi ngoi van giu behavior 'WALKING' nhung khong buoc: khong cham
          // vao day thi chan se dap nhu di bo tren cho trong khi dang ngoi.
          const dangBuoc = !def.stationary && (wasWalking || (wasQueueing && Math.abs(sim.vel) > 0.04));
          const cls = dangBuoc ? 'walking' : 'idle';
          if (!svg.classList.contains(cls)) {
            svg.classList.remove('walking', 'idle');
            svg.classList.add(cls);
          }
          /*
           * NHỊP CHÂN PHẢI THEO TỐC ĐỘ THẬT, không phải tốc độ danh nghĩa.
           *
           * `--spd` trước đây gán MỘT LẦN lúc render từ `def.speed` (hằng số)
           * rồi không bao giờ đổi. Nhưng `sim.vel` luôn "đuổi theo" tốc độ
           * đích dần dần (đoạn `vel += (vMuc - vel) * dtSec*4`, mất khoảng
           * 0,25s mỗi lần đổi hướng) - nên suốt khoảng đó chân vẫn đá đều
           * tốc độ danh nghĩa trong khi thân gần như chưa dịch chuyển, đúng
           * kiểu "trượt băng" (feet-sliding) kinh điển của hoạt hình thuật
           * toán. Cập nhật sống theo vận tốc thật mỗi khung hình để chân
           * chậm lại đúng lúc thân chậm lại, nhanh lên đúng lúc thân tăng tốc.
           */
          if (dangBuoc) {
            const tocDoThat = Math.max(def.speed * 0.3, Math.min(def.speed * 1.5, Math.abs(sim.vel)));
            svg.style.setProperty('--spd', `${(CYCLE_K / tocDoThat).toFixed(2)}s`);
          }
        }

        // 1. Behavior transitions (Độc lập với bóng thoại - chỉ đổi dáng đi/dừng ngắm)
        if (sim.behavior !== 'TALKING' && sim.behavior !== 'QUEUEING') {
          sim.behaviorTimer -= dtSec;
          if (sim.behaviorTimer <= 0) {
            const roll = Math.random();
            if (wasWalking && roll < 0.42) {
              /*
               * "NGAM TIEM" PHAI CO TIEM THAT DE NGAM.
               *
               * Ban cu doi hanh vi thuan theo dong ho, khong theo khong gian:
               * nguoi choi thay nhan vat dung giua via he trong, mat ngoi sao,
               * ngam mot cua tiem khong co o do. Do luong 66 giay cho thay 17
               * trong 22 lan dung roi vao cho trong.
               *
               * Bay gio chi ngam khi dang dung CANH mot tiem (trong 120px).
               * Khong co tiem nao gan thi dung CHATTING - dung ten voi viec
               * dang xay ra la ba con tam chuyen giua pho.
               */
              const tiemGan = shopsRef.current.find((sh) => Math.abs(sh.x - sim.x) < 120);
              sim.behavior = roll < 0.22 && tiemGan ? 'ADMIRING_SHOP' : 'CHATTING';
              sim.behaviorTimer = 4.5 + Math.random() * 4.5; // Dừng ngắm phố 4.5s - 9s
              // Quay mat ve phia tiem dang ngam, khong dung yen nhin ra duong.
              if (sim.behavior === 'ADMIRING_SHOP' && tiemGan) {
                sim.dir = tiemGan.x > sim.x ? 1 : -1;
              }
              const emo = sim.behavior === 'ADMIRING_SHOP' ? 'STAR_EYES' : (Math.random() < 0.5 ? 'HAPPY' : 'STAR_EYES');
              pendingUpdates.current.set(i, { emotion: emo });
            } else {
              sim.behavior = 'WALKING';
              sim.behaviorTimer = 8 + Math.random() * 10; // Đi bộ 8s - 18s
              if (Math.random() < 0.3) sim.dir = (sim.dir * -1) as 1 | -1;
              const emo = Math.random() < 0.6 ? def.emotion : (Math.random() < 0.5 ? 'HAPPY' : 'TIRED');
              pendingUpdates.current.set(i, { emotion: emo });
            }
          }
        }

        /**
         * KÉO CƯ DÂN VỀ TIỆM - CHỈ KHI CÓ ĐƠN THẬT ĐANG CHỜ.
         *
         * Trước đây cư dân tự ước lượng "còn chỗ không" bằng cách đếm NHAU
         * (`dangXep < capacity`), hoàn toàn không đụng tới hàng chờ thật
         * trong store. Hệ quả: người chơi thấy cư dân xếp hàng trong khi
         * badge báo trống, hoặc ngược lại - hai mô phỏng không nói chuyện.
         *
         * Giờ một cư dân chỉ được vào hàng khi THỰC SỰ có một khách hàng
         * (`arrivedAt`) trong `realQueueRef` CHƯA ai nhận đại diện. Không có
         * đơn thật nào đang chờ ở tiệm gần đó thì không ai xếp hàng cả -
         * đúng nghĩa "khách phải đến xếp hàng thật sự".
         */
        if (wasWalking && !def.stationary && sim.behavior === 'WALKING' && shopsRef.current.length > 0) {
          if (now >= sim.nextShopPullAt) {
            sim.nextShopPullAt = now + 4000 + Math.random() * 6000;
            // Sắp tiệm theo khoảng cách, thử từng tiệm gần nhất tới xa dần.
            const ranked = shopsRef.current
              .map((sh) => ({ sh, dist: Math.abs(sh.x - sim.x) }))
              .sort((a, b) => a.dist - b.dist)
              .slice(0, Math.min(3, shopsRef.current.length));

            for (const { sh } of ranked) {
              const entries = realQueueRef.current[sh.id];
              if (!entries || entries.length === 0) continue;

              const claimedByOthers = new Set(
                simRef.current
                  .filter((o) => o !== sim && o.behavior === 'QUEUEING' && o.queueShopId === sh.id)
                  .map((o) => o.claimedArrivedAt),
              );
              // Khách chờ LÂU NHẤT trước - khớp đúng thứ tự FIFO lúc bấm bán.
              const free = entries.find((ts) => !claimedByOthers.has(ts));
              if (free === undefined) continue;

              sim.behavior = 'QUEUEING';
              sim.queueShopId = sh.id;
              sim.queueSlot = -1;
              sim.serviceTimer = 0;
              sim.claimedArrivedAt = free;
              sim.dir = sh.x > sim.x ? 1 : -1;
              /*
               * KEO THEO lane cua hang. Ai vao truoc dung lane cua minh, nguoi
               * sau keo theo de ca hang chung mot do sau. Chua ai dang xep thi
               * lay lane rieng cua minh - moi hang co mot do sau rieng, khong
               * phai moi nguoi.
               */
              const banCungHang = simRef.current.find(
                (o) =>
                  o !== sim &&
                  o.behavior === 'QUEUEING' &&
                  o.queueShopId === sh.id &&
                  o.queueLane >= 0,
              );
              sim.queueLane = banCungHang ? banCungHang.queueLane : def.lane;
              const item = menuItemFor(sh.defId, free);
              pendingUpdates.current.set(i, {
                emotion: 'STAR_EYES',
                bubbleText: item ? `Cho 1 ${item.name} đi chị ơi!` : null,
              });
              sim.bubbleTimer = 3.6;
              break;
            }
          }
        }

        // 2. Quản lý thời gian sống của bóng thoại cá nhân
        if (sim.bubbleTimer > 0) {
          sim.bubbleTimer -= dtSec;
          if (sim.bubbleTimer <= 0) {
            sim.bubbleTimer = 0;
            // Cooldown riêng cho nhân vật này sau khi nói xong: 40s - 70s
            sim.speechCooldown = 40 + Math.random() * 30;
            pendingUpdates.current.set(i, { bubbleText: null });
            // Khoảng lặng cả phố sau khi 1 người dứt lời: 6s - 12s
            nextStreetSpeechTimerRef.current = 6 + Math.random() * 6;
          }
        } else if (sim.speechCooldown > 0) {
          sim.speechCooldown -= dtSec;
        }
      });

      /*
       * TACH HAI NGUOI CUNG HANG neu dap len nhau.
       *
       * Hang gio rai 9 buoc nhung van co 2-3 nguoi chung mot hang, va moi
       * nguoi co `roamRadius` rieng nen cuoc gap mat la binh thuong. Khong co
       * buoc nay thi hai nguoi cung chieu di vao nhau va TRUYEN XAU qua nhau -
       * mat depth cua hang sau bien mat, nguoi doc thay 2 cai dau liet vao mot
       * cho. Nguocchieu thi ca hai quay dau, cung chieu thi nguoi sau quay lai.
       *
       * Day toa do ra tu tu (khong nhay) de khong thay doi vi tri mot cach
       * dot ngot giua hai frame - mat depth dang la cai dang bao ve.
       */
      {
        const MIN_GAP = 70;
        const sims = simRef.current;
        for (let a = 0; a < sims.length; a++) {
          const sa = sims[a];
          if (sa.behavior !== 'WALKING' || CITIZEN_DEFS[a].stationary) continue;
          const laneA = laneYOf(CITIZEN_DEFS[a].lane);
          for (let b = a + 1; b < sims.length; b++) {
            const sb = sims[b];
            if (sb.behavior !== 'WALKING' || CITIZEN_DEFS[b].stationary) continue;
            if (laneA !== laneYOf(CITIZEN_DEFS[b].lane)) continue;
            const d = sb.x - sa.x;
            const overlap = MIN_GAP - Math.abs(d);
            if (overlap <= 0) continue;
            /*
             * LẮC QUA LẮC LẠI khi hai người gần như đứng chồng lên nhau.
             *
             * `d` bị chính vòng lặp này làm nhiễu: mỗi frame đẩy hai người ra
             * xa nhau một chút, rồi frame sau `d` lại đổi dấu vì họ vừa vượt
             * qua nhau, rồi lại đổi dấu tiếp - `sign`/`dir` tính lại từ `d`
             * sống mỗi frame nên lật liên tục, nhìn như rung/giật qua lại.
             *
             * Khi còn cách nhau rõ (`|d|` đủ lớn) thì vẫn dùng `d` thật - ai ở
             * đâu rẽ đúng hướng đó. Chỉ khi gần như chồng khít (`|d| <= 4px`,
             * đúng vùng mặt đối mặt) mới chốt theo thứ tự chỉ số cố định (a,
             * b) - không đổi giữa chừng, hết lắc.
             */
            const sign: 1 | -1 = Math.abs(d) > 4 ? (d >= 0 ? 1 : -1) : (a < b ? 1 : -1);
            const back: 1 | -1 = sign === 1 ? -1 : 1;
            // Day nhanh hon de rut ngan thoi gian hai nguoi con nam trong "vung nguy hiem" gan 0.
            const shove = overlap * Math.min(0.9, dtSec * 10);
            sa.x -= sign * shove;
            sb.x += sign * shove;
            if (sa.dir === sign) sa.dir = back;
            if (sb.dir === back) sb.dir = sign;
          }
        }
      }

      // 3. Điều phối thoại đường phố: Chỉ cho phép tối đa 1 người nói tại một thời điểm
      const activeBubbles = simRef.current.filter(s => s.bubbleTimer > 0).length;
      if (activeBubbles === 0) {
        nextStreetSpeechTimerRef.current -= dtSec;
        if (nextStreetSpeechTimerRef.current <= 0) {
          // Lọc các cư dân sẵn sàng nói (không bận nói chuyện modal, không trong cooldown)
          const candidates = simRef.current
            .map((s, idx) => ({ sim: s, idx }))
            .filter(
              ({ sim }) =>
                sim.behavior !== 'TALKING' &&
                sim.behavior !== 'QUEUEING' &&
                sim.speechCooldown <= 0,
            );

          if (candidates.length > 0) {
            const picked = candidates[Math.floor(Math.random() * candidates.length)];
            const def = CITIZEN_DEFS[picked.idx];
            const quote = def.quotes[Math.floor(Math.random() * def.quotes.length)];

            // Thời lượng hiển thị: 5.5s đến 7.8s tùy độ dài câu nói (cho người chơi đủ thời gian đọc thoải mái)
            const durationSec = Math.max(5.5, Math.min(7.8, quote.length * 0.09));

            picked.sim.bubbleTimer = durationSec;
            picked.sim.speechCooldown = durationSec + 40 + Math.random() * 30;
            picked.sim.jumpOffset = 6; // Nhảy nhẹ vui vẻ khi cất lời

            const nextEmotion = Math.random() < 0.6 ? def.emotion : (Math.random() < 0.5 ? 'HAPPY' : 'STAR_EYES');
            pendingUpdates.current.set(picked.idx, {
              bubbleText: quote,
              emotion: nextEmotion,
            });
          } else {
            nextStreetSpeechTimerRef.current = 3.5;
          }
        }
      }

      // Flush appearance updates mỗi 200ms thay vì mỗi frame
      if (flushAccum >= 200 && pendingUpdates.current.size > 0) {
        flushAccum = 0;
        const updates = new Map(pendingUpdates.current);
        pendingUpdates.current.clear();
        setAppearances(prev =>
          prev.map((a, i) => {
            const u = updates.get(i);
            return u ? { ...a, ...u } : a;
          })
        );
      } else if (flushAccum >= 200) {
        flushAccum = 0;
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  /** Chi so cu dan dang dung noi chuyen voi nguoi choi, null la khong co ai. */
  const [talkingIdx, setTalkingIdx] = useState<number | null>(null);
  const [talkLine, setTalkLine] = useState<string>('');
  const [currentEmotion, setCurrentEmotion] = useState<FacialEmotion>('HAPPY');
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  /**
   * Bài học tài chính của lựa chọn vừa chọn.
   *
   * Đây là phần "học chơi": mỗi nhân vật mang một chủ đề, mỗi câu trả lời
   * chỉ ra chỉ số mà câu đó đụng tới, và sau đó hiện một dòng bài học để
   * người chơi biết mình vừa học được gì.
   */
  const [lesson, setLesson] = useState<{ title: string; text: string } | null>(null);
  /**
   * Cac lua chon CO TRA PHI (bieu tien) da dung trong lan tro chuyen hien
   * tai. Khong co bang nay thi nguoi choi bam lien tuc nut "Biếu 50 đồng" la
   * tru tien lien tuc - option khong tu disable sau lan dau.
   */
  const [usedPaidOptIds, setUsedPaidOptIds] = useState<Set<string>>(() => new Set());

  const handleClickCitizen = useCallback((idx: number) => {
    const def = CITIZEN_DEFS[idx];
    const sim = simRef.current[idx];

    // Dung han lai va quay mat ra, khong di tiep cho den khi dong hoi thoai.
    sim.behavior = 'TALKING';
    sim.behaviorTimer = Number.POSITIVE_INFINITY;
    sim.bubbleTimer = 0;
    sim.jumpOffset = 14;

    recordCitizenTalk();
    setTalkingIdx(idx);
    setSelectedOptId(null);
    setLesson(null);
    setUsedPaidOptIds(new Set());

    const script = CITIZEN_SCRIPTS[def.id];
    let greeting = `Dạ Thị Trưởng! Tui là ${def.name}, ${def.role.toLowerCase()} ở khu này.`;
    let initEmotion: FacialEmotion = 'HAPPY';

    if (script && script.greetings.length > 0) {
      const g = script.greetings[Math.floor(Math.random() * script.greetings.length)];
      greeting = g.text;
      initEmotion = g.emotion;
    }

    setTalkLine(greeting);
    setCurrentEmotion(initEmotion);
    setAppearances((prev) =>
      prev.map((a, i) => (i === idx ? { emotion: initEmotion, bubbleText: null } : a)),
    );
  }, []);

  // Đổi ngẫu nhiên sang một lời chào hoặc mẩu chuyện khác của cùng NPC
  const handleRerollGreeting = useCallback(() => {
    if (talkingIdx === null) return;
    const def = CITIZEN_DEFS[talkingIdx];
    const script = CITIZEN_SCRIPTS[def.id];
    if (!script || script.greetings.length === 0) return;
    const g = script.greetings[Math.floor(Math.random() * script.greetings.length)];
    setTalkLine(g.text);
    setCurrentEmotion(g.emotion);
    setSelectedOptId(null);
    setLesson(null);
    setAppearances((prev) =>
      prev.map((a, i) => (i === talkingIdx ? { emotion: g.emotion, bubbleText: null } : a)),
    );
  }, [talkingIdx]);

  // Danh sách kịch bản lựa chọn cho cư dân hiện tại
  const activeOptions: CitizenDialogueOption[] = useMemo(() => {
    if (talkingIdx === null) return [];
    const def = CITIZEN_DEFS[talkingIdx];
    const script = CITIZEN_SCRIPTS[def.id];
    if (script && script.options.length > 0) {
      return script.options;
    }
    return [
      {
        id: 'hoi-lam-an',
        label: 'Dạo này làm ăn sao rồi?',
        reply: def.quotes[Math.floor(Math.random() * def.quotes.length)],
        emotionOnSelect: 'HAPPY',
      },
      {
        id: 'hoi-khu-pho',
        label: 'Thấy khu phố mình thế nào?',
        reply: `Phố mình càng ngày càng xôm! ${def.role} như tui sống ở đây thấy dễ thở lắm Thị Trưởng à.`,
        emotionOnSelect: 'HAPPY',
      },
    ];
  }, [talkingIdx]);

  const handleTalkOption = useCallback(
    (opt: CitizenDialogueOption) => {
      if (talkingIdx === null) return;
      const idx = talkingIdx;
      const def = CITIZEN_DEFS[idx];
      const script = CITIZEN_SCRIPTS[def.id];
      const citizenX = simRef.current[idx]?.x ?? 400;
      const isPaidGift = !!(opt.cost && opt.cost > 0);

      if (isPaidGift) {
        // Da bieu trong lan tro chuyen nay roi - khong tru tien lan 2.
        if (usedPaidOptIds.has(opt.id)) return;
        const paid = spendCoins(opt.cost!);
        if (!paid) {
          setTalkLine('Thôi khỏi Thị Trưởng ơi, ngân khố đang eo hẹp mà!');
          setCurrentEmotion('TIRED');
          setAppearances((prev) =>
            prev.map((a, i) => (i === idx ? { ...a, emotion: 'TIRED' } : a)),
          );
          return;
        }
        particles.coinShower(citizenX, 380, 10);
        onCitizenReward?.(`Đã biếu ${def.name} ${formatCompact(opt.cost!)} đồng.`);
        setUsedPaidOptIds((prev) => new Set(prev).add(opt.id));
      }

      if (opt.particles === 'coin') {
        particles.coinShower(citizenX, 380, 8);
      } else if (opt.particles === 'stars') {
        particles.levelUpRing(citizenX, 380);
      }

      if (opt.rewardBonus) {
        claimTapReward('citizen', opt.rewardBonus.coins, { cooldownMs: 1500 });
        onCitizenReward?.(`🎁 ${def.name}: ${opt.rewardBonus.reason} (+${opt.rewardBonus.coins} đồng)!`);
      }

      const nextEmotion = opt.emotionOnSelect ?? (isPaidGift ? 'STAR_EYES' : 'HAPPY');
      setSelectedOptId(opt.id);
      setTalkLine(opt.reply);
      setCurrentEmotion(nextEmotion);

      /*
       * Bài học hiện ngay sau lựa chọn, không phải lúc mở hội thoại.
       *
       * Đây là nguyên tắc "học bằng cách làm": người chơi đã trả lời xong mới
       * đọc được phần giải thích, lúc này khái niệm mới có chỗ bám.
       */
      if (script?.financeTheme) {
        setLesson({ title: script.financeTheme.title, text: script.financeTheme.lesson });
      }
      setAppearances((prev) =>
        prev.map((a, i) => (i === idx ? { ...a, emotion: nextEmotion } : a)),
      );

      /*
       * BIẾU TIỀN XONG LÀ ĐÓNG LUÔN.
       *
       * Lựa chọn có trả phí là hành động "một lần rồi thôi" - người chơi đã
       * biếu xong thì không còn lý do đứng lại bảng hội thoại nữa. Đóng tự
       * động sau một nhịp ngắn để kịp thấy lời cảm ơn + hiệu ứng tiền rơi.
       */
      if (isPaidGift) {
        window.setTimeout(() => {
          const sim = simRef.current[idx];
          if (sim) {
            sim.behavior = 'WALKING';
            sim.behaviorTimer = 8 + Math.random() * 8;
            sim.bubbleTimer = 0;
            sim.speechCooldown = 30 + Math.random() * 20;
          }
          setTalkingIdx((cur) => (cur === idx ? null : cur));
          setSelectedOptId(null);
          setLesson(null);
        }, 1600);
      }
    },
    [talkingIdx, onCitizenReward],
  );

  /** Dong hoi thoai va tra cu dan ve lai nhip di bo binh thuong. */
  const handleEndTalk = useCallback(() => {
    if (talkingIdx === null) return;
    const sim = simRef.current[talkingIdx];
    sim.behavior = 'WALKING';
    sim.behaviorTimer = 8 + Math.random() * 8;
    sim.bubbleTimer = 0;
    sim.speechCooldown = 30 + Math.random() * 20;
    setTalkingIdx(null);
    setSelectedOptId(null);
    setLesson(null);
  }, [talkingIdx]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WALK_CSS }} />
      <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
        {CITIZEN_DEFS.map((def, i) => {
          const app = appearances[i];
          return (
            <div
              key={def.id}
              ref={el => { containerRefs.current[i] = el; }}
              style={{ willChange: 'transform' }}
              className="group absolute bottom-2 left-0 flex flex-col items-center"
            >
              {app.bubbleText && (
                <div
                  style={{ marginBottom: 10, zIndex: 50 }}
                  className="cit-speech-bubble relative w-max max-w-[190px]"
                >
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full border border-[#3E2A1B] bg-[#FFFDF7]"
                  />
                  <div className="relative whitespace-normal break-words rounded-xl border border-[#3E2A1B] bg-[#FFFDF7] px-2.5 py-1 text-center text-[10px] font-bold leading-tight text-[#3E2A1B] shadow-[0_3px_10px_rgba(62,42,27,0.18)]">
                    <span>{app.bubbleText}</span>
                  </div>
                </div>
              )}
              <div className="relative flex flex-col items-center">
                {/*
                 * Huy hieu cam xuc. Truoc day la ky tu font ✦ khong co class
                 * mau nen no thua ke mau chu toi cua trang va hien ra thanh
                 * mot cuc den thay vi tia sang. Doi sang mang phang cho khop
                 * voi phan con lai cua nhan vat.
                 */}
                {app.emotion === 'STAR_EYES' && (
                  <span className="pointer-events-none absolute -top-3 -right-3">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path d="M11.6 1 L13 5 L17 6.4 L13 7.8 L11.6 11.8 L10.2 7.8 L6.2 6.4 L10.2 5 Z" fill="#F2B91C" />
                      <path d="M4.8 9.2 L5.7 11.3 L7.8 12.2 L5.7 13.1 L4.8 15.2 L3.9 13.1 L1.8 12.2 L3.9 11.3 Z" fill="#FFDD77" />
                    </svg>
                  </span>
                )}
                {app.emotion === 'SURPRISED' && (
                  <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2">
                    <svg width="10" height="17" viewBox="0 0 10 17">
                      <path d="M2.9 0 L7.1 0 L6.4 10.4 L3.6 10.4 Z" fill="#DC2626" />
                      <circle cx="5" cy="14.2" r="2.1" fill="#DC2626" />
                    </svg>
                  </span>
                )}

                <button
                  type="button"
                  ref={el => { btnRefs.current[i] = el; }}
                  onClick={(e) => { e.stopPropagation(); handleClickCitizen(i); }}
                  title={`Bấm để trò chuyện với ${def.name} (${def.role})`}
                  className="pointer-events-auto relative cursor-pointer focus:outline-none"
                >
                  <svg
                    ref={el => { svgRefs.current[i] = el; }}
                    width="56"
                    height="72"
                    viewBox="0 0 56 72"
                    className="cit-walk-anim overflow-visible walking"
                    style={{ '--spd': `${(CYCLE_K / def.speed).toFixed(2)}s` } as React.CSSProperties}
                  >
                    <ChibiBody def={def} emotion={app.emotion} />
                  </svg>
                </button>
              </div>
              <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#3E2A1B]/90 px-2 py-0.5 text-[10px] font-bold text-[#FEF08A] opacity-0 transition-opacity group-hover:opacity-100 shadow">
                {def.name}
              </span>
            </div>
          );
        })}
      </div>

      {/*
       * BANG TRAO DOI - hien khi nguoi choi bam vao mot cu dan.
       *
       * Phai di qua portal ra body: component nay nam trong vung pho duoc
       * scale va cuon ngang rong ~2360px, nen `absolute inset-x-0` se can giua
       * theo CON PHO chu khong phai man hinh, va bang se troi di khi cuon.
       * `position: fixed` cung khong thoat duoc vi to tien co transform.
       */}
      {talkingIdx !== null && typeof document !== 'undefined' && createPortal(
        <CharacterPanel
          variant="street"
          badge={CITIZEN_DEFS[talkingIdx].role}
          title={CITIZEN_DEFS[talkingIdx].name}
          sticker={{
            emoji: EMOTION_STICKERS[currentEmotion].emoji,
            line: EMOTION_STICKERS[currentEmotion].line,
          }}
          /*
           * Chu de tai chinh: hien luon, ke ca luc moi chao - day la no dung
           * bai hoc cua nhan vat truoc khi nguoi choi chon gi.
           */
          theme={(() => {
            const t = talkingIdx !== null ? CITIZEN_SCRIPTS[CITIZEN_DEFS[talkingIdx].id]?.financeTheme : undefined;
            if (!t) return undefined;
            const m = FINANCE_TAG_META[t.tag];
            return { label: t.title, tone: m.tone };
          })()}
          /*
           * Avatar la CHINH nhan vat dang noi chuyen, khong phai ve du theo ten
           * nhu `ChibiNpcAvatar` cua NPC. Day la cai gia tri ma bang truoc khong
           * co: ban dang noi voi co Hai mac non la, khong phai mot dau chung.
           */
          avatar={
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
              style={{ borderColor: '#6E5A47', background: '#FAF3E3' }}
            >
              <svg
                width="44"
                height="56"
                viewBox="0 0 56 72"
                className="overflow-visible"
                aria-hidden
              >
                <ChibiBody def={CITIZEN_DEFS[talkingIdx]} emotion={currentEmotion} />
              </svg>
            </div>
          }
          speech={talkLine}
          onClose={handleEndTalk}
        >

            {/* Bài học tài chính, hiện sau khi người chơi đã chọn một phương án. */}
            {lesson && (
              <div className="mb-2.5 flex gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-2.5">
                <span aria-hidden="true" className="text-base leading-none">
                  💡
                </span>
                <p className="text-[11px] font-semibold leading-relaxed text-[#78350F]">
                  <span className="font-black">{lesson.title}:</span> {lesson.text}
                </p>
              </div>
            )}

            {/* Danh sách kịch bản lựa chọn */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F0E6D8]">
              {activeOptions.map((opt) => {
                const isSelected = selectedOptId === opt.id;
                const isPaid = !!(opt.cost && opt.cost > 0);
                const alreadyGiven = isPaid && usedPaidOptIds.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={alreadyGiven}
                    onClick={() => handleTalkOption(opt)}
                    title={
                      alreadyGiven
                        ? 'Đã biếu trong lần trò chuyện này rồi'
                        : opt.financeTags?.length
                          ? opt.financeTags.map((t) => FINANCE_TAG_META[t].label).join(' · ')
                          : undefined
                    }
                    className="group relative rounded-xl px-3 py-2 text-xs font-black transition-all active:scale-95 text-left"
                    style={
                      alreadyGiven
                        ? { backgroundColor: '#E5DEC9', color: '#9C8767', cursor: 'not-allowed', opacity: 0.7 }
                        : isPaid
                          ? {
                              backgroundColor: isSelected ? '#BE185D' : '#D82D8B',
                              color: '#FFFFFF',
                              boxShadow: isSelected ? '0 0 0 2px #FBCFE8' : undefined,
                              cursor: 'pointer',
                            }
                          : {
                              backgroundColor: isSelected ? '#EAD6C0' : '#F3E8DC',
                              color: '#5A3E2B',
                              boxShadow: isSelected ? '0 0 0 2px #D82D8B' : undefined,
                              cursor: 'pointer',
                            }
                    }
                  >
                    <span>{alreadyGiven ? '✅ Đã biếu rồi' : opt.label}</span>
                    {isPaid && !alreadyGiven && (
                      <span className="ml-1.5 rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-bold">
                        -{opt.cost}đ
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Nút nghe câu chuyện khác của cùng NPC */}
              <button
                type="button"
                onClick={handleRerollGreeting}
                className="rounded-xl border border-[#D5C2AF] bg-[#FAF6EE] px-3 py-2 text-xs font-bold text-[#8B7355] hover:bg-[#F3E8DC] transition-colors cursor-pointer"
                title="Nghe câu chuyện hoặc lời chào khác từ cư dân này"
              >
                🔄 Chuyện khác...
              </button>

              {/* Nút đóng / tạm biệt */}
              <button
                type="button"
                onClick={handleEndTalk}
                className="ml-auto rounded-xl px-3 py-2 text-xs font-black text-[#8B7355] hover:text-[#3E2A1B] transition-colors cursor-pointer"
              >
                Chào bà con 👋
              </button>
            </div>
        </CharacterPanel>,
        document.body,
      )}
    </>
  );
}
