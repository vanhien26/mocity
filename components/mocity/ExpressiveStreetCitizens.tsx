'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { claimTapReward, recordCitizenTalk, spendCoins } from '@/lib/mocity/store';
import { formatCompact } from '@/lib/mocity/format';
import { particles } from './ParticleEngine';
import {
  CITIZEN_SCRIPTS,
  FINANCE_TAG_META,
  type CitizenDialogueOption,
} from '@/lib/mocity/citizen-scenarios';

const CITIZEN_TAP_COINS = 25;
const CITIZEN_TAP_COOLDOWN_MS = 5_000;

/**
 * Cut-paper chi dung hinh phang, khong xep lop mat/may/mieng nhu ban chibi cu.
 * 7 emotion cu gop con 4: WHISTLE_CHILL + CHATTING + WINK -> HAPPY,
 * SWEAT_FUNNY -> TIRED. Moi emotion la mot bo hinh phang doi cho nhau.
 */
export type FacialEmotion = 'HAPPY' | 'STAR_EYES' | 'SURPRISED' | 'TIRED';

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

interface CitizenDef {
  id: string;
  name: string;
  role: string;
  startX: number;
  laneY: number;
  startDir: 1 | -1;
  speed: number;
  emotion: FacialEmotion;
  skinColor: string;
  hairStyle: 'SHORT' | 'BUN' | 'BOB' | 'CAP_YELLOW' | 'HELMET_BLUE' | 'NON_LA' | 'BALD_GLASSES' | 'PONYTAIL';
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  accentColor: string;
  hasTie?: boolean;
  heldItem?: 'MILK_TEA' | 'LOTTERY_FAN' | 'SHOPPING_BAG' | 'BRIEFCASE' | 'PHONE_QR' | 'LAPTOP' | 'CAMERA' | 'NONE';
  quotes: string[];
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
  /** Số giây đã phục vụ, dùng cho bong bóng "Cảm ơn Thị Trưởng". */
  serviceTimer: number;
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
  /** Tọa độ X của cửa tiệm trên vỉa hè. */
  x: number;
  /** Tên hiển thị trên bảng hiệu. */
  label: string;
  /** Số chỗ phục vụ đồng thời, tăng theo cấp tiệm. */
  capacity: number;
}

/** shopId -> số khách đang xếp. */
export type ShopQueueCount = Record<string, number>;

/** Appearance state - chỉ thay đổi khi behavior change (~mỗi 10-15s) */
interface CitAppearance {
  emotion: FacialEmotion;
  bubbleText: string | null;
}

const ALL_EMOTIONS: FacialEmotion[] = ['HAPPY', 'STAR_EYES', 'SURPRISED', 'TIRED'];

/** Thời gian đứng ở quầy để "giao dịch" trước khi rời đi. */
const SERVICE_SECONDS = 6.5;

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

/** Dam/nhat mot mau hex theo he so - dung tao lop giay phia sau. */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.min(255, Math.round(v * k));
  return `#${((1 << 24) | (c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1)}`;
}

const CITIZEN_DEFS: CitizenDef[] = [
  {
    id: 'cit-mayor-assistant', name: 'Trợ Lý Thị Trưởng', role: 'Cán Bộ Quy Hoạch',
    startX: 240, laneY: 28, startDir: 1, speed: 0.4, emotion: 'HAPPY',
    skinColor: '#FDE6D2', hairStyle: 'SHORT', hairColor: '#2B2118',
    shirtColor: '#2B4368', pantsColor: '#1E293B', accentColor: '#DC2626', hasTie: true,
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
    startX: 390, laneY: 16, startDir: -1, speed: 0.3, emotion: 'STAR_EYES',
    skinColor: '#FCD9BD', hairStyle: 'NON_LA', hairColor: '#2B2118',
    shirtColor: '#EC4899', pantsColor: '#334155', accentColor: '#FEF08A',
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
    startX: 540, laneY: 42, startDir: 1, speed: 0.5, emotion: 'HAPPY',
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
    startX: 690, laneY: 22, startDir: -1, speed: 0.38, emotion: 'HAPPY',
    skinColor: '#FFF1E6', hairStyle: 'BUN', hairColor: '#3E2723',
    shirtColor: '#F472B6', pantsColor: '#475569', accentColor: '#D82D8B',
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
    startX: 840, laneY: 34, startDir: 1, speed: 0.28, emotion: 'HAPPY',
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
    id: 'cit-anh-hoang', name: 'Anh Hoàng IT', role: 'Kỹ Sư Phần Mềm',
    startX: 990, laneY: 18, startDir: -1, speed: 0.42, emotion: 'TIRED',
    skinColor: '#FDE6D2', hairStyle: 'SHORT', hairColor: '#111827',
    shirtColor: '#E2E8F0', pantsColor: '#1E293B', accentColor: '#38BDF8',
    heldItem: 'LAPTOP',
    quotes: [
      'Server nóng 100 độ, ngoài trời 40 độ, coder sắp hoá thạch luôn!',
      'Trời nồm ẩm bàn phím dính nhơm nhở, fix bug mà tưởng làm thơ!',
      'Camera ngã tư chạy AI nhận diện biển số nét căng, đừng hòng vượt!',
      'Vừa nạp data 4G cấp tốc quét QR trả tiền cơm trưa cứu đói!',
      'Bug thì nhiều mà lương chưa về, may sao Ví Trả Sau hạn mức 5 củ!',
      'Đi xe điện lướt êm ru qua đoạn ngập nước, khỏi lo chết máy bug máy!',
    ],
  },
  {
    id: 'cit-bao-ngoc', name: 'Bảo Ngọc KOC', role: 'Reviewer Phố Phường',
    startX: 1140, laneY: 38, startDir: 1, speed: 0.45, emotion: 'STAR_EYES',
    skinColor: '#FFF1E6', hairStyle: 'BOB', hairColor: '#7C2D12',
    shirtColor: '#38BDF8', pantsColor: '#1E293B', accentColor: '#F43F5E',
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
    startX: 1290, laneY: 26, startDir: -1, speed: 0.33, emotion: 'SURPRISED',
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
    startX: 1440, laneY: 20, startDir: 1, speed: 0.36, emotion: 'HAPPY',
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
    startX: 1590, laneY: 36, startDir: -1, speed: 0.29, emotion: 'HAPPY',
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
    startX: 1740, laneY: 30, startDir: 1, speed: 0.44, emotion: 'STAR_EYES',
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
    id: 'cit-co-linh', name: 'Cô Linh Dạy Thêm', role: 'Giáo Viên',
    startX: 1890, laneY: 24, startDir: -1, speed: 0.31, emotion: 'HAPPY',
    skinColor: '#FFF1E6', hairStyle: 'BOB', hairColor: '#4A2C17',
    shirtColor: '#0EA5E9', pantsColor: '#334155', accentColor: '#0284C7',
    heldItem: 'LAPTOP',
    quotes: [
      'Trời nồm ẩm phấn viết bảng bị ướt, thôi cô chuyển qua chiếu slide online!',
      'Trời rét thế này học sinh đi học muộn với lý do trùm chăn ấm quá!',
      'Phụ huynh chuyển khoản học phí tự động ting ting, sổ sách nhẹ tênh!',
      'Hôm qua hóng drama đề thi thử khó quá làm học sinh kêu trời kêu đất!',
      'Đầu tháng trích lương vào Túi Thần Tài lấy lãi ngày, vừa tiết kiệm vừa an tâm!',
      'Nắng nóng học sinh nhớ uống nhiều nước, đừng ham trà sữa đá bào quá nha!',
    ],
  },
];

/**
 * CSS keyframes cho walk animation.
 * Toàn bộ leg/arm swing, body bob, head wobble chạy hoàn toàn qua CSS -
 * không cần React re-render mỗi frame.
 * --spd: animation duration được set per-character dựa trên speed.
 */
const WALK_CSS = `
/*
 * Thuoc tinh transform cua CSS animation GHI DE transform attribute cua SVG, nen
 * group nao vua co translate(...) vua co animation rotate() se mat phan
 * translate va roi ve goc toa do. Vi vay translate nam o group NGOAI, con
 * group trong chi xoay - pivot cua no chinh la goc toa do cua chinh no.
 */
.cit-walk-anim .cit-lb,
.cit-walk-anim .cit-lf,
.cit-walk-anim .cit-ab,
.cit-walk-anim .cit-af,
.cit-walk-anim .cit-hw { transform-origin: 0px 0px; will-change: transform; }
.cit-walk-anim .cit-bw { transform-origin: 28px 40px; will-change: transform; }

.walking .cit-lb { animation: citLB var(--spd,0.6s) linear infinite; }
.walking .cit-lf { animation: citLF var(--spd,0.6s) linear infinite; }
.walking .cit-ab { animation: citAB var(--spd,0.6s) linear infinite; }
.walking .cit-af { animation: citAF var(--spd,0.6s) linear infinite; }
.walking .cit-bw { animation: citBob var(--spd,0.6s) ease-in-out infinite; }
.walking .cit-hw { animation: citHw calc(var(--spd,0.6s)*2) ease-in-out infinite; }
.idle    .cit-bw { animation: citSw 3s ease-in-out infinite; }
.idle    .cit-hw { animation: citSw 4s ease-in-out infinite; }

@keyframes citLF { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
@keyframes citLB { 0%,100%{transform:rotate(20deg)}  50%{transform:rotate(-20deg)} }
@keyframes citAF { 0%,100%{transform:rotate(18deg)}  50%{transform:rotate(-18deg)} }
@keyframes citAB { 0%,100%{transform:rotate(-18deg)} 50%{transform:rotate(18deg)} }
@keyframes citBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
@keyframes citHw  { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
@keyframes citSw  { 0%,100%{transform:rotate(-1.5deg)} 50%{transform:rotate(1.5deg)} }
@keyframes citBubblePop {
  0% { opacity: 0; transform: translateY(6px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.cit-speech-bubble {
  animation: citBubblePop 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

const EMOTION_EMOJIS: Record<FacialEmotion, string> = {
  HAPPY: '😊',
  STAR_EYES: '🤩',
  SURPRISED: '😮',
  TIRED: '😅',
};


/**
 * Nhan vat kieu CUT PAPER: moi bo phan la MOT mang phang, khong stroke.
 * Chieu sau tao bang lop giay dam hon o phia sau (`shade`), khong bang vien.
 * Cac diem xoay cua walk animation (chan 24/32,48 - tay 22/34,31 - dau 28,16)
 * phai giu nguyen, neu doi thi WALK_CSS transform-origin lech theo.
 */
function CitizenContent({ def, emotion }: { def: CitizenDef; emotion: FacialEmotion }) {
  /**
   * Ba bac dam dan deu NHAT hon mau ao goc, khong dung bac sang hon: ao sang
   * mau (#E2E8F0) nhan he so >1 se clip ve trang va tay bien mat khoi than.
   */
  const shirtDark = shade(def.shirtColor, 0.64);
  const shirtLight = shade(def.shirtColor, 0.86);
  const pantsDark = shade(def.pantsColor, 0.74);
  const shoe = shade(def.pantsColor, 0.52);
  const hairDark = shade(def.hairColor, 0.78);
  const skinDark = shade(def.skinColor, 0.93);
  const ink = '#3E2A1B';

  /** Mot chan: ong quan phang + ban chan la mang rieng dam hon. */
  const Leg = ({ fill }: { fill: string }) => (
    <>
      <path d="M-3.6 0 L3.5 -0.4 L3.9 13.6 L-3.1 14 Z" fill={fill} />
      <path d="M-3.9 13.2 L4.1 12.8 L4.5 16.4 L-4.3 16.8 Z" fill={shoe} />
    </>
  );

  return (
    <>
      <ellipse cx="28" cy="66" rx="12" ry="2.8" fill="rgba(62,42,27,0.16)" />

      <g className="cit-bw">
        {/* CHAN */}
        <g transform="translate(24,48)"><g className="cit-lb"><Leg fill={pantsDark} /></g></g>
        <g transform="translate(32,48)"><g className="cit-lf"><Leg fill={def.pantsColor} /></g></g>

        {/* TAY SAU - lop giay dam hon de lui ra sau than */}
        <g transform="translate(22,31)"><g className="cit-ab">
          <path d="M-2.8 -3 L2.6 -3.3 L3 13.4 L-2.4 13.8 Z" fill={shirtDark} />
          <circle cx="0.3" cy="15.4" r="3" fill={skinDark} />
          {def.heldItem === 'BRIEFCASE' && (
            <g transform="translate(-4,18)">
              <path d="M0 0 L10.2 0.4 L9.9 7.3 L-0.3 6.9 Z" fill="#C9A227" />
              <path d="M0 0 L10.2 0.4 L10.1 2.4 L-0.1 2 Z" fill="#A5821A" />
              <path d="M3.2 -0.1 Q3.3 -2.4 5 -2.35 Q6.7 -2.3 6.6 0 L5.6 -0.05 Q5.65 -1.5 5 -1.52 Q4.35 -1.54 4.3 -0.05 Z" fill="#8A6B12" />
            </g>
          )}
          {def.heldItem === 'SHOPPING_BAG' && (
            <g transform="translate(-4,17)">
              <path d="M1.6 0.4 Q1.8 -3.6 4.6 -3.5 Q7.4 -3.4 7.3 0.6 L5.9 0.5 Q6 -2.2 4.6 -2.25 Q3.2 -2.3 3.1 0.35 Z" fill="#B8500A" />
              <path d="M0 0 L9.2 0.5 L8.7 10.3 L-0.4 9.8 Z" fill="#E86A10" />
              <path d="M0 0 L9.2 0.5 L9.1 3.2 L-0.1 2.7 Z" fill="#C85A0C" />
            </g>
          )}
        </g></g>

        {/* CO - mang skin noi dau voi than, tranh hieu ung dau troi */}
        <path d="M24.8 23.6 L31.2 23.6 L31.5 30.4 L24.5 30.4 Z" fill={skinDark} />

        {/* THAN - vai rong hon dau, day thu vao de khong doc thanh vay */}
        <path d="M18.6 28.4 L37.6 29.2 L36.8 46.2 L34.6 50.4 L21.2 50 L19.4 45.8 Z" fill={def.shirtColor} />
        <path d="M18.6 28.4 L24.6 28.7 L23.6 50.1 L21.2 50 L19.4 45.8 Z" fill={shade(def.shirtColor, 0.76)} />
        {def.hasTie && (
          <path d="M26.8 29 L29.2 29.1 L28.8 40.4 L27.8 43.4 L27 40.3 Z" fill={def.accentColor} />
        )}

        {/* TAY TRUOC - lop giay sang hon de noi len truoc than */}
        <g transform="translate(34,31)"><g className="cit-af">
          <path d="M-2.8 -3.3 L2.6 -3 L3 13.8 L-2.4 13.4 Z" fill={shirtLight} />
          <circle cx="0.3" cy="15.4" r="3" fill={def.skinColor} />
          {def.heldItem === 'MILK_TEA' && (
            <g transform="translate(-3.5,14)">
              <path d="M4.5 -4.4 L6 -4.3 L5.6 1.2 L4.1 1.1 Z" fill="#E0458A" />
              <path d="M0 0 L7.2 0.3 L6.6 9.3 L0.5 9 Z" fill="#F0D698" />
              <path d="M0.3 5.4 L6.9 5.7 L6.6 9.3 L0.5 9 Z" fill="#D8B46A" />
              <circle cx="2.4" cy="7.4" r="1.1" fill="#4A3524" />
              <circle cx="4.9" cy="7.6" r="1.1" fill="#4A3524" />
            </g>
          )}
          {def.heldItem === 'LOTTERY_FAN' && (
            <g transform="translate(-3,15)">
              <path d="M-0.5 1 L7 -1.4 L8.6 3.2 L1.1 5.6 Z" fill="#E03A52" />
              <path d="M0.4 2.6 L8.2 1.6 L8.8 6.4 L1 7.4 Z" fill="#E6B412" />
              <path d="M0.8 4.2 L8.4 5.6 L7.6 10.2 L0 8.8 Z" fill="#2BB37C" />
            </g>
          )}
          {def.heldItem === 'PHONE_QR' && (
            <g transform="translate(-3,14)">
              <path d="M0 0 L6.2 0.3 L5.9 10.2 L-0.3 9.9 Z" fill="#C21F78" />
              <path d="M1.4 1.6 L4.6 1.75 L4.5 4.9 L1.3 4.75 Z" fill="#FFF3F9" />
              <path d="M2 2.3 L3.1 2.35 L3.05 3.4 L1.95 3.35 Z" fill="#C21F78" />
            </g>
          )}
          {def.heldItem === 'LAPTOP' && (
            <g transform="translate(-5,15)">
              <path d="M0.4 0 L10.2 0.4 L9.9 7.2 L0.1 6.8 Z" fill="#D2DCE8" />
              <path d="M1.6 1.2 L8.8 1.5 L8.6 5.8 L1.4 5.5 Z" fill="#2E8FC4" />
              <path d="M-0.6 7 L11.4 7.5 L11.2 9.4 L-0.8 8.9 Z" fill="#8795A8" />
            </g>
          )}
          {def.heldItem === 'CAMERA' && (
            <g transform="translate(-4,14)">
              <path d="M2.4 -1.4 L6.6 -1.5 L6.7 0.4 L2.5 0.5 Z" fill="#1C242E" />
              <path d="M0 0.4 L9.2 0 L9.4 7.2 L0.2 7.6 Z" fill="#2A3442" />
              <circle cx="4.7" cy="3.8" r="2.4" fill="#4A5A6E" />
              <circle cx="4.7" cy="3.8" r="1.2" fill="#8FC4E8" />
            </g>
          )}
        </g></g>

        {/* DAU */}
        <g transform="translate(28,16)"><g className="cit-hw">
          {def.hairStyle === 'BUN' && <circle cx="-8.4" cy="-9" r="4.6" fill={hairDark} />}
          {def.hairStyle === 'PONYTAIL' && (
            <path d="M-8 -6.4 Q-18.4 -0.6 -14.2 8.4 L-10.6 7 Q-13.6 0.4 -5.6 -4.4 Z" fill={hairDark} />
          )}

          <circle cx="0" cy="0" r="12.6" fill={def.skinColor} />
          <path d="M-11.4 4.6 Q0 12.4 11.4 4.4 L11.6 0.6 L-11.6 0.6 Z" fill={skinDark} opacity="0.5" />
          <ellipse cx="-7.8" cy="2.6" rx="2.5" ry="1.5" fill="#F0A8BE" />
          <ellipse cx="7.8" cy="2.6" rx="2.5" ry="1.5" fill="#F0A8BE" />

          {emotion === 'HAPPY' && (
            <>
              <circle cx="-4.6" cy="-1.2" r="1.9" fill={ink} />
              <circle cx="4.6" cy="-1.2" r="1.9" fill={ink} />
              <path d="M-4.4 4.6 Q0.2 9 4.8 4.6 Q0.2 6.8 -4.4 4.6 Z" fill={ink} />
            </>
          )}
          {emotion === 'STAR_EYES' && (
            <>
              <path d="M-4.6 -4.4 L-3.5 -2.3 L-1.4 -1.2 L-3.5 -0.1 L-4.6 2 L-5.7 -0.1 L-7.8 -1.2 L-5.7 -2.3 Z" fill={ink} />
              <path d="M4.6 -4.4 L5.7 -2.3 L7.8 -1.2 L5.7 -0.1 L4.6 2 L3.5 -0.1 L1.4 -1.2 L3.5 -2.3 Z" fill={ink} />
              <path d="M-3.8 4.2 L4.2 4.2 Q0.2 9.6 -3.8 4.2 Z" fill={ink} />
            </>
          )}
          {emotion === 'SURPRISED' && (
            <>
              <circle cx="-4.6" cy="-1.4" r="2.5" fill={ink} />
              <circle cx="4.6" cy="-1.4" r="2.5" fill={ink} />
              <ellipse cx="0.3" cy="5.6" rx="2.5" ry="3.1" fill={ink} />
            </>
          )}
          {emotion === 'TIRED' && (
            <>
              <path d="M-7.6 -1.8 L-1.6 -1.8 L-1.6 0.2 L-7.6 0.2 Z" fill={ink} />
              <path d="M1.6 -1.8 L7.6 -1.8 L7.6 0.2 L1.6 0.2 Z" fill={ink} />
              <path d="M-3.4 5.2 L3.8 5.2 L3.8 7 L-3.4 7 Z" fill={ink} />
              <path d="M9.8 -6.2 Q12.2 -2.6 9.8 -1.2 Q7.4 -2.6 9.8 -6.2 Z" fill="#7FC4E8" />
            </>
          )}

          {(def.hairStyle === 'SHORT' || def.hairStyle === 'BUN' || def.hairStyle === 'BOB') && (
            <path d="M-12.8 -2.4 C-12.4 -14.6 12.6 -14.6 12.8 -2 C8.6 -7.8 -6.4 -8 -12.8 -2.4 Z" fill={def.hairColor} />
          )}
          {def.hairStyle === 'BOB' && (
            <>
              <path d="M-12.9 -3.2 Q-14.8 5.2 -11.4 9.2 L-8.4 7.6 Q-11.2 2.8 -10.2 -3.4 Z" fill={hairDark} />
              <path d="M12.9 -3.2 Q14.8 5.2 11.4 9.2 L8.4 7.6 Q11.2 2.8 10.2 -3.4 Z" fill={hairDark} />
            </>
          )}
          {def.hairStyle === 'NON_LA' && (
            <>
              <path d="M0 -18.6 L16.6 -3.6 L-16.6 -4.2 Z" fill="#DEBE63" />
              <path d="M0 -18.6 L5.8 -11.2 L-5.8 -11.6 Z" fill="#EFD48A" />
              <path d="M-17.2 -4.2 L17.2 -3.6 L16 -0.4 L-16.2 -1 Z" fill="#A8822F" />
            </>
          )}
          {def.hairStyle === 'CAP_YELLOW' && (
            <>
              <path d="M-11.8 -3.2 C-11.4 -14.4 11 -14.4 11.2 -2.8 Z" fill="#D19A0E" />
              <path d="M5 -3 L17.4 -2 L16.4 1.4 L5 0.3 Z" fill="#9A6E08" />
            </>
          )}
          {def.hairStyle === 'HELMET_BLUE' && (
            <>
              <path d="M-13 -1.4 C-12.6 -15.2 12.8 -15.2 13 -1 Z" fill={def.accentColor} />
              <path d="M-9.4 -6 Q0 -2.8 9.6 -6.2 L9 -8.8 Q0 -5.6 -8.8 -8.6 Z" fill="#FFFFFF" opacity="0.32" />
              <path d="M-13.2 -1.2 L13.2 -0.8 L13 2.4 L-13.4 2 Z" fill={shade(def.accentColor, 0.72)} />
            </>
          )}
          {def.hairStyle === 'BALD_GLASSES' && (
            <>
              <path d="M-12.8 1.4 C-12.6 -7.6 -8 -11.8 -3.4 -12.6 L-3.6 -9.2 C-7.4 -8.2 -9.8 -5 -9.8 1.2 Z" fill={def.hairColor} />
              <path d="M12.8 1.4 C12.6 -7.6 8 -11.8 3.4 -12.6 L3.6 -9.2 C7.4 -8.2 9.8 -5 9.8 1.2 Z" fill={def.hairColor} />
              <path d="M-9.8 -4 L-0.9 -4 L-0.9 1.6 L-9.8 1.6 Z" fill="#CFE4F7" opacity="0.72" />
              <path d="M0.9 -4 L9.8 -4 L9.8 1.6 L0.9 1.6 Z" fill="#CFE4F7" opacity="0.72" />
              <path d="M-1.1 -2.6 L1.1 -2.6 L1.1 -1.4 L-1.1 -1.4 Z" fill="#6E5A46" />
            </>
          )}
        </g></g>
      </g>
    </>
  );
}

export default function ExpressiveStreetCitizens({
  onCitizenReward,
  onQueueChange,
  streetWidth = 2400,
  shops = [],
}: {
  onCitizenReward?: (msg: string) => void;
  /**
   * Báo số khách đang xếp ở từng tiệm.
   *
   * Gửi ra ngoài để dải biển hiện đếm khách. Không gọi mỗi frame: chỉ gọi
   * khi chữ số thực sự đổi, tối đa một lần mỗi 500ms.
   */
  onQueueChange?: (counts: ShopQueueCount) => void;
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
}) {
  /** Bien di lai, doc trong vong RAF nen giu o ref de khong resubscribe. */
  const walkBoundRef = useRef(Math.max(360, streetWidth - 140));
  walkBoundRef.current = Math.max(360, streetWidth - 140);

  /**
   * Danh sach tiem giu trong ref.
   *
   * RAF loop chi chay mot lan (mount) nen doc `shops` truc tiep se bien mat
   * sau lan render dau tien. Giu o ref va gan gia tri moi moi render de loop
   * luon thay pho moi nhung khong phai khoi dong lai RAF.
   */
  const shopsRef = useRef<ShopAnchor[]>(shops);
  shopsRef.current = shops;

  /**
   * Callback báo hàng đợi cũng phải qua ref: RAF loop mount một lần nên
   * `onQueueChange` đóng trong lần render đầu sẽ thành closure cũ vĩnh viễn.
   */
  const onQueueChangeRef = useRef(onQueueChange);
  onQueueChangeRef.current = onQueueChange;

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
      serviceTimer: 0,
      /*
       * MILI GIAY, cung thang do voi timestamp cua requestAnimationFrame.
       * Ban cu dat `3 + i * 1.4` (3 toi 18) la gia tri co giay, trong khi nhip
       * ke tiep lai la `now + 9000`, nen ca 12 nguoi cung thu ghe tiem ngay
       * frame dau va y do rai deu khong chay.
       */
      nextShopPullAt: 3_000 + i * 1_400,
      // Neo ngay chỗ xuất phát, bán kính so le để các vùng chồng lấn tự nhiên.
      homeX: Math.min(c.startX, Math.max(360, streetWidth - 140)),
      roamRadius: 170 + (i % 5) * 65,
      vel: c.startDir * c.speed,
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

  /**
   * Số khách đang xếp, dùng để so sánh trước/sau rồi mới gọi callback.
   * Khởi tạo rỗng để lần đầu có hàng đều báo.
   */
  const lastQueueSigRef = useRef('');
  /** Mốc thời gian tối thiểu giữa hai lần gọi callback, chặn render dày. */
  const lastQueuePushRef = useRef(0);

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
       * Số thứ tự trong hàng là thứ tự index của cư dân đang xếp, nên người tới
       * trước luôn đứng trước. Slot 0 sát cửa, mỗi slot lùi thêm 26px về trái.
       */
      const queueCounters = new Map<string, number>();
      for (const s of simRef.current) {
        /*
         * KHONG loc theo `queueSlot >= 0`.
         *
         * Nguoi vua vao hang luon mang slot -1, nen dieu kien do tu loai tru
         * chinh doi tuong can cap so: khong ai tung nhan slot 0. Hau qua la
         * `targetX = shop.x - 34 - (-1)*26` tro thanh `shop.x - 8` - ca hang
         * chong len nhau lech 8px ben trai cua - va luot phuc vu ket thuc o
         * 4,1 giay thay vi 6,5 giay vi `SERVICE_SECONDS + (-1)*2.4`.
         */
        if (s.behavior === 'QUEUEING' && s.queueShopId) {
          const occupied = queueCounters.get(s.queueShopId) ?? 0;
          s.queueSlot = occupied;
          queueCounters.set(s.queueShopId, occupied + 1);
        }
      }

      simRef.current.forEach((sim, i) => {
        const def = CITIZEN_DEFS[i];
        sim.jumpOffset = Math.max(0, sim.jumpOffset - dt * 25);

        const wasWalking = sim.behavior === 'WALKING';
        const wasQueueing = sim.behavior === 'QUEUEING';
        if (wasWalking) {
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
          // Chân bước nhanh chậm theo tốc độ THẬT: đi chậm thì bước ngắn lại.
          sim.walkPhase += 0.22 * dt * 10 * Math.min(1, Math.abs(sim.vel) / def.speed);
        } else if (wasQueueing) {
          /**
           * Tiệm bị xoá giữa chừng (người chơi bán lại) thì cư dân phải tự
           * rời hàng, nếu không họ đứng giữa vỉa hè vô thời hạn.
           */
          const shop = shopsRef.current.find((sh) => sh.id === sim.queueShopId);
          if (!shop) {
            sim.behavior = 'WALKING';
            sim.queueShopId = null;
            sim.queueSlot = -1;
            sim.behaviorTimer = 6 + Math.random() * 6;
            sim.dir = Math.random() < 0.5 ? 1 : -1;
          } else {
            /** Người phục vụ đứng sát cửa, người sau lùi dần theo hàng. */
            const targetX = shop.x - 34 - sim.queueSlot * 26;
            const gap = targetX - sim.x;
            if (Math.abs(gap) < 2.5) {
              // Đã tới chỗ: đứng yên, quay mặt về phía cửa tiệm.
              sim.x = targetX;
              sim.dir = targetX < shop.x ? 1 : -1;
              sim.vel += (0 - sim.vel) * Math.min(1, dtSec * 6);
              sim.walkPhase += 0.05 * dt * 10;
              sim.serviceTimer += dtSec;
              if (sim.serviceTimer > 5.5 && sim.bubbleTimer <= 0) {
                pendingUpdates.current.set(i, {
                  bubbleText: SERVED_LINE[Math.floor(Math.random() * SERVED_LINE.length)],
                  emotion: 'HAPPY',
                });
                sim.bubbleTimer = 4.2;
              }
              /**
               * Chỗ phục vụ tính theo `queueSlot < capacity`. Người vượt số chỗ
               * vẫn xếp hàng (đó là chuyện bình thường ở quán đông) nhưng phải
               * chờ lâu hơn, nên thời gian phục vụ nhân theo độ dài hàng.
               */
              if (sim.serviceTimer > SERVICE_SECONDS + sim.queueSlot * 2.4) {
                sim.behavior = 'WALKING';
                sim.queueShopId = null;
                sim.queueSlot = -1;
                sim.serviceTimer = 0;
                sim.behaviorTimer = 10 + Math.random() * 10;
                sim.speechCooldown = 25 + Math.random() * 20;
                sim.dir = Math.random() < 0.5 ? 1 : -1;
                sim.jumpOffset = 8;
                pendingUpdates.current.set(i, { emotion: 'STAR_EYES' });
              }
            } else {
              sim.dir = gap > 0 ? 1 : -1;
              const vMuc = sim.dir * def.speed;
              sim.vel += (vMuc - sim.vel) * Math.min(1, dtSec * 4);
              const step = Math.abs(sim.vel) * dt * 10;
              sim.x += Math.sign(gap) * Math.min(step, Math.abs(gap));
              sim.walkPhase += 0.22 * dt * 10 * Math.min(1, Math.abs(sim.vel) / def.speed);
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
          container.style.transform = `translate3d(${Math.round(sim.x)}px,${-Math.round(def.laneY + bodyBob + sim.jumpOffset)}px,0)`;
          container.style.zIndex = String(Math.round(60 - def.laneY));
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
          const dangBuoc = wasWalking || (wasQueueing && Math.abs(sim.vel) > 0.04);
          const cls = dangBuoc ? 'walking' : 'idle';
          if (!svg.classList.contains(cls)) {
            svg.classList.remove('walking', 'idle');
            svg.classList.add(cls);
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
         * KÉO CƯ DÂN VỀ TIỆM.
         *
         * Chỉ xảy ra khi đang đi dạo và đã qua thời hạn riêng. Ưu tiên tiệm
         * gần nhất chưa xếp đầy: đây là thứ khiến người chơi thấy "xây thêm
         * tiệm thì phố đông hơn" bằng mắt, không cần đọc chỉ số nào.
         */
        if (wasWalking && sim.behavior === 'WALKING' && shopsRef.current.length > 0) {
          if (now >= sim.nextShopPullAt) {
            sim.nextShopPullAt = now + 9000 + Math.random() * 12000;
            if (Math.random() < 0.55) {
              // Sắp tiệm theo khoảng cách rồi chọn ngẫu nhiên trong nhóm gần nhất.
              const ranked = shopsRef.current
                .map((sh) => ({ sh, dist: Math.abs(sh.x - sim.x) }))
                .sort((a, b) => a.dist - b.dist);
              const shortlist = ranked.slice(0, Math.min(3, ranked.length));
              const pick = shortlist[Math.floor(Math.random() * shortlist.length)]?.sh;
              if (pick) {
                /*
                 * Dem theo SUC CHUA thay vi chan tu nguoi thu hai.
                 *
                 * Ban cu dung `some(...)`: chi can mot nguoi dang xep la ca pho
                 * khong ai duoc vao nua. `queueCapacityFor` tinh 1 toi 4 cho
                 * theo cap tiem va `ViaHeStreetBoard` da truyen sang, nhung
                 * `capacity` khong duoc doc o dau ca - toan bo he thong suc
                 * chua la ma chet. Voi 2 tiem thi toi da 2/12 cu dan co the o
                 * tiem cung luc, nen nhin nhu khong ai ghe.
                 */
                const dangXep = simRef.current.filter(
                  (o) => o !== sim && o.behavior === 'QUEUEING' && o.queueShopId === pick.id,
                ).length;
                if (dangXep < Math.max(1, pick.capacity)) {
                  sim.behavior = 'QUEUEING';
                  sim.queueShopId = pick.id;
                  sim.queueSlot = -1;
                  sim.serviceTimer = 0;
                  sim.dir = pick.x > sim.x ? 1 : -1;
                  pendingUpdates.current.set(i, { emotion: 'STAR_EYES' });
                }
              }
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
      /*
       * BÁO HÀNG ĐỢI LÊN BIỂN HIỆU.
       *
       * `queueCounters` đã tính ở đầu vòng lặp nên ở đây chỉ chuyển thành
       * object thường. Chỉ gọi khi chữ số khác lần trước VÀ đã qua 500ms,
       * tránh setState mỗi frame.
       */
      if (onQueueChangeRef.current) {
        const sig = [...queueCounters.entries()].map(([k, v]) => `${k}:${v}`).sort().join('|');
        if (sig !== lastQueueSigRef.current && now - lastQueuePushRef.current >= 500) {
          lastQueueSigRef.current = sig;
          lastQueuePushRef.current = now;
          const payload: ShopQueueCount = {};
          for (const [k, v] of queueCounters) payload[k] = v;
          onQueueChangeRef.current(payload);
        }
      }

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
      const def = CITIZEN_DEFS[talkingIdx];
      const script = CITIZEN_SCRIPTS[def.id];
      const citizenX = simRef.current[talkingIdx]?.x ?? 400;

      if (opt.cost && opt.cost > 0) {
        const paid = spendCoins(opt.cost);
        if (!paid) {
          setTalkLine('Thôi khỏi Thị Trưởng ơi, ngân khố đang eo hẹp mà!');
          setCurrentEmotion('TIRED');
          setAppearances((prev) =>
            prev.map((a, i) => (i === talkingIdx ? { ...a, emotion: 'TIRED' } : a)),
          );
          return;
        }
        particles.coinShower(citizenX, 380, 10);
        onCitizenReward?.(`Đã biếu ${def.name} ${formatCompact(opt.cost)} Xu.`);
      }

      if (opt.particles === 'coin') {
        particles.coinShower(citizenX, 380, 8);
      } else if (opt.particles === 'stars') {
        particles.levelUpRing(citizenX, 380);
      }

      if (opt.rewardBonus) {
        claimTapReward('citizen', opt.rewardBonus.coins, { cooldownMs: 1500 });
        onCitizenReward?.(`🎁 ${def.name}: ${opt.rewardBonus.reason} (+${opt.rewardBonus.coins} Xu)!`);
      }

      const nextEmotion = opt.emotionOnSelect ?? (opt.cost && opt.cost > 0 ? 'STAR_EYES' : 'HAPPY');
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
        prev.map((a, i) => (i === talkingIdx ? { ...a, emotion: nextEmotion } : a)),
      );
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
      <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
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
                  style={{ marginBottom: 10, zIndex: 45 }}
                  className="cit-speech-bubble relative w-max max-w-[250px] whitespace-normal break-words text-center leading-snug rounded-2xl border-2 border-[#3E2A1B] bg-[#FFFDF7] px-3.5 py-2 text-xs font-extrabold text-[#3E2A1B] shadow-[0_4px_14px_rgba(62,42,27,0.18)]"
                >
                  <span>{app.bubbleText}</span>
                  {/* Mũi tên hướng xuống nhân vật */}
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-b-2 border-r-2 border-[#3E2A1B] bg-[#FFFDF7]"
                  />
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
                    style={{ '--spd': `${(0.6 / def.speed).toFixed(2)}s` } as React.CSSProperties}
                  >
                    <CitizenContent def={def} emotion={app.emotion} />
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
        <div className="pointer-events-auto fixed inset-x-0 bottom-[88px] z-[60] flex justify-center px-3">
          <div
            className="w-full max-w-lg rounded-2xl p-3.5 shadow-[0_14px_34px_rgba(20,12,8,0.4)] transition-all"
            style={{ backgroundColor: '#FFFDF7', border: '2px solid #78533D' }}
          >
            {/* Header: Role badge, Citizen Name & Emotion emoji, Close button */}
            <div className="mb-2.5 flex items-start gap-2.5">
              <span
                className="mt-0.5 shrink-0 rounded-lg px-2.5 py-1 text-xs font-black text-white shadow-xs"
                style={{ backgroundColor: '#D82D8B' }}
              >
                {CITIZEN_DEFS[talkingIdx].role}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-black text-[#3E2A1B]">
                    {CITIZEN_DEFS[talkingIdx].name}
                  </p>
                  <span className="text-sm" title={`Tâm trạng: ${currentEmotion}`}>
                    {EMOTION_EMOJIS[currentEmotion]}
                  </span>
                </div>
                <div className="mt-1.5 rounded-xl bg-[#FAF6EE] p-2.5 border border-[#E8DEC8]">
                  <p className="text-sm font-semibold leading-relaxed text-[#5A3E2B]">
                    {talkLine}
                  </p>
                </div>
                {/* Chủ đề tài chính của nhân vật: luôn hiện, kể cả lúc mới chào. */}
                {(() => {
                  const theme = talkingIdx !== null ? CITIZEN_SCRIPTS[CITIZEN_DEFS[talkingIdx].id]?.financeTheme : undefined;
                  if (!theme) return null;
                  const meta = FINANCE_TAG_META[theme.tag];
                  return (
                    <span
                      className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-black"
                      style={{
                        backgroundColor: meta.tone === 'good' ? '#DCFCE7' : meta.tone === 'bad' ? '#FEE2E2' : '#F1F5F9',
                        color: meta.tone === 'good' ? '#15803D' : meta.tone === 'bad' ? '#B91C1C' : '#475569',
                      }}
                    >
                      📊 {theme.title}
                    </span>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={handleEndTalk}
                aria-label="Kết thúc trò chuyện"
                className="shrink-0 rounded-full px-2 py-0.5 text-lg font-black text-[#8B7355] transition-colors hover:text-[#D82D8B]"
              >
                ×
              </button>
            </div>

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
                const isPaid = opt.cost && opt.cost > 0;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleTalkOption(opt)}
                    title={
                      opt.financeTags?.length
                        ? opt.financeTags.map((t) => FINANCE_TAG_META[t].label).join(' · ')
                        : undefined
                    }
                    className="group relative rounded-xl px-3 py-2 text-xs font-black transition-all active:scale-95 text-left cursor-pointer"
                    style={
                      isPaid
                        ? {
                            backgroundColor: isSelected ? '#BE185D' : '#D82D8B',
                            color: '#FFFFFF',
                            boxShadow: isSelected ? '0 0 0 2px #FBCFE8' : undefined,
                          }
                        : {
                            backgroundColor: isSelected ? '#EAD6C0' : '#F3E8DC',
                            color: '#5A3E2B',
                            boxShadow: isSelected ? '0 0 0 2px #D82D8B' : undefined,
                          }
                    }
                  >
                    <span>{opt.label}</span>
                    {isPaid && (
                      <span className="ml-1.5 rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-bold">
                        -{opt.cost} Xu
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
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
