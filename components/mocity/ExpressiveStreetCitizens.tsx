'use client';
 
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { claimTapReward } from '@/lib/mocity/store';
import { formatCompact } from '@/lib/mocity/format';
import { particles } from './ParticleEngine';

/** Xu moi ban cham vao mot cu dan. Nho de idle income van la nguon thu chinh. */
const CITIZEN_TAP_COINS = 25;
/** Han 5 giay: quet het 13 cu dan ton ~65 giay. */
const CITIZEN_TAP_COOLDOWN_MS = 5_000;

/**
 * Nhân Vật Đường Phố Phong Cách Hoạt Hình Chibi (Đế Chế Vỉa Hè)
 *
 * Tỉ lệ Chibi 1:2 (đầu to, thân ngắn), mắt oval biểu cảm, lông mày rõ nét,
 * squash-stretch khi nhảy, walk cycle nhún nhảy tự nhiên.
 */

export type FacialEmotion =
  | 'HAPPY'
  | 'STAR_EYES'
  | 'SURPRISED'
  | 'WHISTLE_CHILL'
  | 'SWEAT_FUNNY'
  | 'CHATTING'
  | 'WINK';

export type CitizenBehavior = 'WALKING' | 'ADMIRING_SHOP' | 'CHATTING' | 'WAVING';

export interface AutonomousCitizen {
  id: string;
  name: string;
  role: string;
  x: number;
  laneY: number;
  dir: 1 | -1;
  speed: number;
  walkCycle: number;
  behavior: CitizenBehavior;
  behaviorTimer: number;
  emotion: FacialEmotion;
  blinkTimer: number;
  isBlinking: boolean;
  jumpOffset: number;
  squash: number; // 0..1, tạo squash khi chạm đất
  bubbleText: string | null;
  skinColor: string;
  hairStyle: 'SHORT' | 'BUN' | 'BOB' | 'CAP_YELLOW' | 'HELMET_BLUE' | 'NON_LA' | 'BALD_GLASSES' | 'PONYTAIL' | 'AFRO';
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  accentColor: string; // màu highlight áo / phụ kiện
  hasTie?: boolean;
  hasMask?: boolean;
  heldItem?: 'MILK_TEA' | 'LOTTERY_FAN' | 'SHOPPING_BAG' | 'BRIEFCASE' | 'PHONE_QR' | 'LAPTOP' | 'CAMERA' | 'NONE';
  quotes: string[];
}

const INITIAL_CITIZENS: Omit<
  AutonomousCitizen,
  'walkCycle' | 'behavior' | 'behaviorTimer' | 'blinkTimer' | 'isBlinking' | 'jumpOffset' | 'squash' | 'bubbleText'
>[] = [
  {
    id: 'cit-mayor-assistant',
    name: 'Trợ Lý Thị Trưởng',
    role: 'Cán Bộ Quy Hoạch',
    x: 240,
    laneY: 28,
    dir: 1,
    speed: 0.72,
    emotion: 'HAPPY',
    skinColor: '#FDE6D2',
    hairStyle: 'SHORT',
    hairColor: '#2B2118',
    shirtColor: '#2B4368',
    pantsColor: '#1E293B',
    accentColor: '#DC2626',
    hasTie: true,
    heldItem: 'BRIEFCASE',
    quotes: [
      'Phố vỉa hè bữa nay khang trang quá!',
      'Bà con nhớ bật Loa Thần Tài QR nha!',
      'Đi tuần coi tiệm nào đông khách nhất!',
    ],
  },
  {
    id: 'cit-co-tu',
    name: 'Cô Tư Đi Chợ',
    role: 'Bà Nội Trợ Săn Deal',
    x: 420,
    laneY: 16,
    dir: -1,
    speed: 0.55,
    emotion: 'STAR_EYES',
    skinColor: '#FCD9BD',
    hairStyle: 'NON_LA',
    hairColor: '#2B2118',
    shirtColor: '#EC4899',
    pantsColor: '#334155',
    accentColor: '#FEF08A',
    heldItem: 'SHOPPING_BAG',
    quotes: [
      'Ủa tiệm tạp hóa giảm nước mắm kìa!',
      'Quét MoMo hoàn tiền mua thêm bó rau!',
      'Khỏi mang ví tiền lẻ, khỏe cái bụng ghê!',
    ],
  },
  {
    id: 'cit-be-nam',
    name: 'Bé Nam GenZ',
    role: 'Sinh Viên Năm 3',
    x: 640,
    laneY: 42,
    dir: 1,
    speed: 0.92,
    emotion: 'WHISTLE_CHILL',
    skinColor: '#FDE6D2',
    hairStyle: 'CAP_YELLOW',
    hairColor: '#1F2937',
    shirtColor: '#65A30D',
    pantsColor: '#374151',
    accentColor: '#FACC15',
    heldItem: 'MILK_TEA',
    quotes: [
      'Trà sữa full trân châu 1 XU ngon nhức nách!',
      'Tối rủ cả phòng trọ đi coi MoMo Cinema!',
      'Chia tiền lẩu trên app, hết đứa trốn WC!',
    ],
  },
  {
    id: 'cit-chi-thao',
    name: 'Chị Thảo Văn Phòng',
    role: 'Thánh Chốt Đơn',
    x: 860,
    laneY: 22,
    dir: -1,
    speed: 0.68,
    emotion: 'HAPPY',
    skinColor: '#FFF1E6',
    hairStyle: 'BUN',
    hairColor: '#3E2723',
    shirtColor: '#F472B6',
    pantsColor: '#475569',
    accentColor: '#D82D8B',
    heldItem: 'PHONE_QR',
    quotes: [
      'Ting! Lãi Túi Thần Tài sáng vừa về!',
      'Làm ly trà sữa chữa lành cột sống thôi!',
      'Quét mã nhanh còn kịp chấm công!',
    ],
  },
  {
    id: 'cit-ong-loc',
    name: 'Ông Lộc Vé Số',
    role: 'Thần Tài Góc Phố',
    x: 1080,
    laneY: 34,
    dir: 1,
    speed: 0.50,
    emotion: 'HAPPY',
    skinColor: '#FCD9BD',
    hairStyle: 'BALD_GLASSES',
    hairColor: '#9CA3AF',
    shirtColor: '#D97706',
    pantsColor: '#3E2A1B',
    accentColor: '#FEF08A',
    heldItem: 'LOTTERY_FAN',
    quotes: [
      'Lựa tờ đuôi 68 chiều xổ nha con!',
      'Đầu hẻm có người trúng giải đặc biệt!',
      'Đi bộ quanh phố vừa khỏe vừa nuôi Heo Vàng!',
    ],
  },
  {
    id: 'cit-anh-hoang',
    name: 'Anh Hoàng IT',
    role: 'Kỹ Sư Phần Mềm',
    x: 1290,
    laneY: 18,
    dir: -1,
    speed: 0.76,
    emotion: 'SWEAT_FUNNY',
    skinColor: '#FDE6D2',
    hairStyle: 'SHORT',
    hairColor: '#111827',
    shirtColor: '#E2E8F0',
    pantsColor: '#1E293B',
    accentColor: '#38BDF8',
    heldItem: 'LAPTOP',
    quotes: [
      'Code không bug nhưng ví tiền hơi lag nhẹ...',
      'Có Ví Trả Sau cứu bồ cuối tháng!',
      'Bug fix xong rồi, đi ăn trà sữa thôi!',
    ],
  },
  {
    id: 'cit-bao-ngoc',
    name: 'Bảo Ngọc KOC',
    role: 'Reviewer Phố Phường',
    x: 1520,
    laneY: 38,
    dir: 1,
    speed: 0.82,
    emotion: 'STAR_EYES',
    skinColor: '#FFF1E6',
    hairStyle: 'BOB',
    hairColor: '#7C2D12',
    shirtColor: '#38BDF8',
    pantsColor: '#1E293B',
    accentColor: '#F43F5E',
    heldItem: 'CAMERA',
    quotes: [
      'Check-in MoCity lên xu hướng liền!',
      'Tiệm nào trên phố cũng đẹp mê ly!',
      'Review 10 điểm cho Thị Trưởng!',
    ],
  },
  {
    id: 'cit-chu-bay',
    name: 'Chú Bảy Hàng Xóm',
    role: 'Tổ Trưởng Dân Phố',
    x: 1740,
    laneY: 26,
    dir: -1,
    speed: 0.60,
    emotion: 'SURPRISED',
    skinColor: '#FCD9BD',
    hairStyle: 'HELMET_BLUE',
    hairColor: '#1F2937',
    shirtColor: '#4ADE80',
    pantsColor: '#334155',
    accentColor: '#22D3EE',
    heldItem: 'NONE',
    quotes: [
      'Đóng tiền điện tự động rồi, hết lo cúp điện!',
      'Phố xá nhộn nhịp mà sạch đẹp ghê chưa!',
      'Trả nợ tiền bia cho Cô Tư qua QR rồi nghen!',
      'Chiều nay ra công viên đánh cờ tướng với ông Lộc!',
      'Bà con khu phố ai cũng khen Thị Trưởng mát tay!',
    ],
  },
  {
    id: 'cit-co-ba-banh-mi',
    name: 'Cô Ba Bánh Mì',
    role: 'Hội Trưởng Tiểu Thương',
    x: 340,
    laneY: 32,
    dir: 1,
    speed: 0.64,
    emotion: 'HAPPY',
    skinColor: '#FDE6D2',
    hairStyle: 'NON_LA',
    hairColor: '#2B2118',
    shirtColor: '#E11D48',
    pantsColor: '#1E293B',
    accentColor: '#FDE047',
    heldItem: 'SHOPPING_BAG',
    quotes: [
      'Bánh mì heo quay giòn rụm, quét QR giảm liền 5k!',
      'Có Loa Thần Tài đọc tiền về, khỏi lo đếm tiền lẻ mỏi tay!',
      'Thị Trưởng ghé tiệm cô tặng ổ bánh mì đặc biệt 2 trứng nè!',
      'Sáng nay bán vèo 200 ổ nhờ khách đặt trước trên app!',
    ],
  },
  {
    id: 'cit-chuyen-gia-khai',
    name: 'Chuyên Gia Khải',
    role: 'Cố Vấn Chứng Khoán',
    x: 760,
    laneY: 20,
    dir: -1,
    speed: 0.7,
    emotion: 'WINK',
    skinColor: '#FFF1E6',
    hairStyle: 'SHORT',
    hairColor: '#1E293B',
    shirtColor: '#7C3AED',
    pantsColor: '#0F172A',
    accentColor: '#FACC15',
    hasTie: true,
    heldItem: 'BRIEFCASE',
    quotes: [
      'Trang bị đủ 3 Bảo Vật trong Kho Đồ là doanh thu nhảy vọt liền!',
      'Lãi kép Túi Thần Tài chính là kỳ quan thứ 8 của MoCity!',
      'Cổ phiếu khu thương mại hôm nay tím lịm toàn sàn!',
      'Đừng quên mở Bao Lì Xì Lộc Phát 68 trong Kho Đồ nhé Thị Trưởng!',
    ],
  },
  {
    id: 'cit-di-bay-che',
    name: 'Dì Bảy Chè Hẻm',
    role: 'Nghệ Nhân Chè Bưởi',
    x: 1180,
    laneY: 40,
    dir: -1,
    speed: 0.52,
    emotion: 'STAR_EYES',
    skinColor: '#FCD9BD',
    hairStyle: 'BUN',
    hairColor: '#3E2723',
    shirtColor: '#D97706',
    pantsColor: '#334155',
    accentColor: '#FEF08A',
    heldItem: 'MILK_TEA',
    quotes: [
      'Chè bưởi cốt dừa đậu xanh, ăn một ly mát tới tận tim!',
      'Mấy đứa sinh viên quét mã QR xong được dì tặng thêm thạch củ năng!',
      'Nhờ Vốn Kinh Doanh MoMo mà dì mở thêm 2 xe chè đầu ngã tư!',
      'Ai uống trà sữa full topping hôn, dì mời Thị Trưởng 1 ly!',
    ],
  },
  {
    id: 'cit-hoang-cine',
    name: 'Hoàng Cine',
    role: 'Mọt Phim Bom Tấn',
    x: 1440,
    laneY: 15,
    dir: 1,
    speed: 0.85,
    emotion: 'HAPPY',
    skinColor: '#FDE6D2',
    hairStyle: 'PONYTAIL',
    hairColor: '#7C2D12',
    shirtColor: '#DB2777',
    pantsColor: '#1E293B',
    accentColor: '#38BDF8',
    heldItem: 'CAMERA',
    quotes: [
      'Đặt vé ghế đôi Sweetbox trên MoMo Cinema nhanh hơn chớp!',
      'Combo bắp phô mai + caramel rạp mình đỉnh nhất vũ trụ!',
      'Coi phim xong ghé Phố Ẩm Thực ăn khuya là chuẩn bài Combo +25%!',
      'Tối nay có suất chiếu sớm IMAX, cả khu phố kéo đi coi đông nghịt!',
    ],
  },
  {
    id: 'cit-khoa-shipper',
    name: 'Anh Khoa Shipper',
    role: 'Thánh Giao Hàng Siêu Tốc',
    x: 1620,
    laneY: 35,
    dir: -1,
    speed: 0.96,
    emotion: 'WHISTLE_CHILL',
    skinColor: '#FCD9BD',
    hairStyle: 'HELMET_BLUE',
    hairColor: '#111827',
    shirtColor: '#0EA5E9',
    pantsColor: '#1E293B',
    accentColor: '#FACC15',
    heldItem: 'PHONE_QR',
    quotes: [
      'Giao 10 tô bún bò qua 4 ngã tư không sánh một giọt nước lèo!',
      'Đường phố MoCity êm ru, chạy đơn cả ngày không biết mệt!',
      'Khách chuyển khoản trước qua MoMo, giao hàng 3 giây là xong!',
      'Cần tiếp tế Trà Sữa hay Loa Phường cứ mở Kho Đồ nha Thị Trưởng!',
    ],
  },
];

const ALL_EMOTIONS: FacialEmotion[] = [
  'HAPPY', 'STAR_EYES', 'SURPRISED', 'WHISTLE_CHILL', 'SWEAT_FUNNY', 'CHATTING', 'WINK',
];

// ── Chibi character SVG (đầu lớn 1:2, mắt oval, lông mày biểu cảm) ──────────

function CitizenSvg({ cit, walkCycle, isWalking, bodyBob, jumpOffset }: {
  cit: AutonomousCitizen;
  walkCycle: number;
  isWalking: boolean;
  bodyBob: number;
  jumpOffset: number;
}) {
  const legSwing = isWalking ? Math.sin(walkCycle) * 20 : Math.sin(walkCycle) * 3;
  const armSwing = isWalking ? -Math.sin(walkCycle) * 18 : Math.sin(walkCycle * 2) * 12;
  // squash khi chạm đất (jumpOffset gần 0 và đang nhảy)
  const squashX = jumpOffset > 2 ? 1 : (isWalking ? 1 + Math.abs(Math.sin(walkCycle)) * 0.04 : 1);
  const squashY = jumpOffset > 2 ? 1 : (isWalking ? 1 - Math.abs(Math.sin(walkCycle)) * 0.04 : 1);
  const headWobble = Math.sin(walkCycle * 0.5) * (isWalking ? 4 : 1.5);

  // Chibi proportions: head r=13, body y=30..47, legs len=13
  // total canvas 56x72
  return (
    <svg
      width="56"
      height="72"
      viewBox="0 0 56 72"
      className="overflow-visible"
    >
      {/* Shadow */}
      <ellipse cx="28" cy="69" rx="13" ry="3.5" fill="rgba(62,42,27,0.20)" />

      <g transform={`translate(28, 68) scale(${squashX}, ${squashY}) translate(-28, -68)`}>
        {/* ── LEGS ── */}
        {/* Back leg */}
        <g transform={`translate(24, 48) rotate(${-legSwing})`}>
          <rect x="-3" y="0" width="6" height="14" rx="3" fill={cit.pantsColor} stroke="#3E2A1B" strokeWidth="1.8" />
          {/* shoe */}
          <ellipse cx="0" cy="15" rx="4.5" ry="2.5" fill="#3E2A1B" />
        </g>
        {/* Front leg */}
        <g transform={`translate(32, 48) rotate(${legSwing})`}>
          <rect x="-3" y="0" width="6" height="14" rx="3" fill={cit.pantsColor} stroke="#3E2A1B" strokeWidth="1.8" />
          <ellipse cx="0" cy="15" rx="4.5" ry="2.5" fill="#3E2A1B" />
        </g>

        {/* ── ARMS ── */}
        {/* Back arm */}
        <g transform={`translate(22, 31) rotate(${-armSwing})`}>
          <rect x="-2.5" y="0" width="5" height="14" rx="2.5" fill={cit.shirtColor} stroke="#3E2A1B" strokeWidth="1.6" />
          <circle cx="0" cy="15.5" r="3" fill={cit.skinColor} stroke="#3E2A1B" strokeWidth="1.5" />
          {/* Briefcase */}
          {cit.heldItem === 'BRIEFCASE' && (
            <g transform="translate(-4, 18)">
              <rect x="0" y="0" width="10" height="7" rx="1.5" fill="#C9A227" stroke="#3E2A1B" strokeWidth="1.3" />
              <rect x="3" y="-1.5" width="4" height="2" rx="1" fill="none" stroke="#3E2A1B" strokeWidth="1.2" />
              <line x1="5" y1="0" x2="5" y2="7" stroke="#3E2A1B" strokeWidth="1" />
            </g>
          )}
          {/* Shopping bag */}
          {cit.heldItem === 'SHOPPING_BAG' && (
            <g transform="translate(-4, 17)">
              <rect x="0" y="0" width="9" height="10" rx="2" fill="#F97316" stroke="#3E2A1B" strokeWidth="1.4" />
              <path d="M2 0 Q2 -3 4.5 -3 Q7 -3 7 0" fill="none" stroke="#3E2A1B" strokeWidth="1.3" />
            </g>
          )}
        </g>

        {/* ── BODY ── */}
        <rect x="18" y="29" width="20" height="20" rx="7" fill={cit.shirtColor} stroke="#3E2A1B" strokeWidth="2" />
        {/* Tie */}
        {cit.hasTie && (
          <polygon points="28,30 26.5,40 28,43 29.5,40" fill={cit.accentColor} stroke="#3E2A1B" strokeWidth="1" />
        )}

        {/* Front arm */}
        <g transform={`translate(34, 31) rotate(${armSwing})`}>
          <rect x="-2.5" y="0" width="5" height="14" rx="2.5" fill={cit.shirtColor} stroke="#3E2A1B" strokeWidth="1.6" />
          <circle cx="0" cy="15.5" r="3" fill={cit.skinColor} stroke="#3E2A1B" strokeWidth="1.5" />
          {/* Milk tea */}
          {cit.heldItem === 'MILK_TEA' && (
            <g transform="translate(-3.5, 14)">
              <line x1="3.5" y1="-4" x2="3.5" y2="2" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
              <rect x="0" y="0" width="7" height="9" rx="1.5" fill="#FDE68A" stroke="#3E2A1B" strokeWidth="1.4" />
              <circle cx="2.5" cy="7" r="1" fill="#3E2A1B" />
              <circle cx="4.5" cy="7" r="1" fill="#3E2A1B" />
              <circle cx="6" cy="7" r="0.6" fill="#3E2A1B" />
            </g>
          )}
          {/* Lottery fan */}
          {cit.heldItem === 'LOTTERY_FAN' && (
            <g transform="translate(-3, 15)">
              <rect x="0" y="0" width="8" height="6" fill="#F43F5E" stroke="#3E2A1B" strokeWidth="1.2" transform="rotate(-18)" />
              <rect x="1" y="1" width="8" height="6" fill="#FACC15" stroke="#3E2A1B" strokeWidth="1.2" transform="rotate(6)" />
              <rect x="2" y="0" width="8" height="6" fill="#34D399" stroke="#3E2A1B" strokeWidth="1.2" transform="rotate(22)" />
            </g>
          )}
          {/* Phone QR */}
          {cit.heldItem === 'PHONE_QR' && (
            <g transform="translate(-3, 14)">
              <rect x="0" y="0" width="6" height="10" rx="1.5" fill="#D82D8B" stroke="#3E2A1B" strokeWidth="1.3" />
              <rect x="1.5" y="1.5" width="3" height="3" rx="0.5" fill="white" opacity="0.9" />
            </g>
          )}
          {/* Laptop */}
          {cit.heldItem === 'LAPTOP' && (
            <g transform="translate(-5, 15)">
              <rect x="0" y="0" width="10" height="7" rx="1" fill="#E2E8F0" stroke="#3E2A1B" strokeWidth="1.3" />
              <rect x="1" y="7" width="12" height="2" rx="0.5" fill="#94A3B8" stroke="#3E2A1B" strokeWidth="1" />
              <rect x="1.5" y="1" width="7" height="4.5" rx="0.5" fill="#38BDF8" opacity="0.8" />
            </g>
          )}
          {/* Camera */}
          {cit.heldItem === 'CAMERA' && (
            <g transform="translate(-4, 14)">
              <rect x="0" y="0" width="9" height="7" rx="2" fill="#1E293B" stroke="#3E2A1B" strokeWidth="1.3" />
              <circle cx="4.5" cy="3.5" r="2.2" fill="#3E2A1B" stroke={cit.accentColor} strokeWidth="1" />
              <circle cx="4.5" cy="3.5" r="1" fill="#60A5FA" />
            </g>
          )}
        </g>

        {/* ── HEAD ── (chibi: đầu to r=13) */}
        <g transform={`translate(28, 16) rotate(${headWobble})`}>
          {/* Tóc sau / phụ kiện đầu */}
          {cit.hairStyle === 'BUN' && (
            <ellipse cx="-8" cy="-9" rx="5" ry="4.5" fill={cit.hairColor} stroke="#3E2A1B" strokeWidth="1.8" />
          )}
          {cit.hairStyle === 'PONYTAIL' && (
            <path d="M -8 -6 Q -18 0 -14 8" fill="none" stroke={cit.hairColor} strokeWidth="4" strokeLinecap="round" />
          )}

          {/* Mặt tròn (chibi) */}
          <circle cx="0" cy="0" r="13" fill={cit.skinColor} stroke="#3E2A1B" strokeWidth="2.2" />


          {/* ── LÔNG MÀY ── (biểu cảm rõ nét) */}
          {!cit.isBlinking && cit.emotion === 'SURPRISED' && (
            <>
              <path d="M -8 -7.5 Q -5 -10 -2 -7.5" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
              <path d="M 2 -7.5 Q 5 -10 8 -7.5" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {!cit.isBlinking && cit.emotion === 'SWEAT_FUNNY' && (
            <>
              <path d="M -8 -7 Q -5.5 -9 -3 -7" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
              <path d="M 8 -7 Q 5.5 -9 3 -7" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {!cit.isBlinking && (cit.emotion === 'HAPPY' || cit.emotion === 'STAR_EYES' || cit.emotion === 'CHATTING') && (
            <>
              <path d="M -8 -6.5 Q -5 -8 -2 -6.5" fill="none" stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 2 -6.5 Q 5 -8 8 -6.5" fill="none" stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
          {!cit.isBlinking && cit.emotion === 'WINK' && (
            <>
              <path d="M -8 -6.5 Q -5 -8 -2 -6.5" fill="none" stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 2 -7.5 Q 5.5 -9.5 8 -7.5" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
            </>
          )}

          {/* ── MẮT ── (oval to, biểu cảm đặc trưng) */}
          {cit.isBlinking ? (
            <>
              <path d="M -7.5 -2 Q -4.5 -4 -1.5 -2" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 1.5 -2 Q 4.5 -4 7.5 -2" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
            </>
          ) : cit.emotion === 'HAPPY' || cit.emotion === 'CHATTING' ? (
            /* Mắt cười cong ^ ^ */
            <>
              <path d="M -7.5 -1 Q -4.5 -5 -1.5 -1" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 1.5 -1 Q 4.5 -5 7.5 -1" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
            </>
          ) : cit.emotion === 'STAR_EYES' ? (
            /* Mắt ngôi sao ★ */
            <>
              <text x="-8.5" y="0.5" fontSize="9" fill="#FACC15" stroke="#D97706" strokeWidth="0.4" fontWeight="bold">★</text>
              <text x="2" y="0.5" fontSize="9" fill="#FACC15" stroke="#D97706" strokeWidth="0.4" fontWeight="bold">★</text>
            </>
          ) : cit.emotion === 'SURPRISED' ? (
            /* Mắt tròn xoe O_O */
            <>
              <ellipse cx="-4.5" cy="-1" rx="3.2" ry="3.8" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="-4" cy="-0.5" r="1.6" fill="#3E2A1B" />
              <circle cx="-3.5" cy="-1.2" r="0.7" fill="white" />
              <ellipse cx="4.5" cy="-1" rx="3.2" ry="3.8" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="4" cy="-0.5" r="1.6" fill="#3E2A1B" />
              <circle cx="4.5" cy="-1.2" r="0.7" fill="white" />
            </>
          ) : cit.emotion === 'WINK' ? (
            /*윙크 mắt nheo */
            <>
              <ellipse cx="-4.5" cy="-1.5" rx="3" ry="3.5" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="-4" cy="-1" r="1.5" fill="#3E2A1B" />
              <circle cx="-3.5" cy="-1.8" r="0.6" fill="white" />
              <path d="M 1.5 -1.5 Q 4.5 -4.5 7.5 -1.5" fill={cit.skinColor} stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : cit.emotion === 'WHISTLE_CHILL' ? (
            /* Mắt lười nửa nhắm */
            <>
              <ellipse cx="-4.5" cy="-1" rx="3" ry="2.2" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="-4" cy="-0.5" r="1.2" fill="#3E2A1B" />
              <path d="M -7.5 -3 Q -4.5 -1.8 -1.5 -3" fill={cit.skinColor} stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
              <ellipse cx="4.5" cy="-1" rx="3" ry="2.2" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="4" cy="-0.5" r="1.2" fill="#3E2A1B" />
              <path d="M 1.5 -3 Q 4.5 -1.8 7.5 -3" fill={cit.skinColor} stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
            </>
          ) : cit.emotion === 'SWEAT_FUNNY' ? (
            /* Mắt - _ - lo lắng hài hước */
            <>
              <path d="M -7.5 -1.5 L -1.5 -1.5" stroke="#3E2A1B" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 1.5 -1.5 L 7.5 -1.5" stroke="#3E2A1B" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            /* Default: mắt tròn đen láy */
            <>
              <ellipse cx="-4.5" cy="-1.5" rx="3" ry="3.5" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="-4" cy="-1" r="1.5" fill="#3E2A1B" />
              <circle cx="-3.5" cy="-1.8" r="0.6" fill="white" />
              <ellipse cx="4.5" cy="-1.5" rx="3" ry="3.5" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="4" cy="-1" r="1.5" fill="#3E2A1B" />
              <circle cx="4.5" cy="-1.8" r="0.6" fill="white" />
            </>
          )}


          {/* ── MIỆNG ── */}
          {cit.hasMask ? (
            <rect x="-7" y="3" width="14" height="6.5" rx="3" fill="#67E8F9" stroke="#3E2A1B" strokeWidth="1.3" />
          ) : cit.emotion === 'SURPRISED' ? (
            <ellipse cx="0.5" cy="6" rx="3" ry="3.5" fill="#D9534F" stroke="#3E2A1B" strokeWidth="1.5" />
          ) : cit.emotion === 'STAR_EYES' ? (
            <path d="M -3.5 5.5 Q 0.5 9 4.5 5.5" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
          ) : cit.emotion === 'WHISTLE_CHILL' ? (
            <circle cx="2" cy="6" r="2" fill="#3E2A1B" />
          ) : cit.emotion === 'SWEAT_FUNNY' ? (
            <path d="M -3 6.5 Q 0 5 3.5 6.5" fill="none" stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
          ) : cit.emotion === 'WINK' ? (
            <path d="M -4 5.5 Q 0.5 9.5 5 5.5" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
          ) : cit.emotion === 'CHATTING' ? (
            /* Miệng tám chuyện mở rộng */
            <>
              <ellipse cx="0.5" cy="6.5" rx="4" ry="3" fill="#D9534F" stroke="#3E2A1B" strokeWidth="1.5" />
              <line x1="-2" y1="6.5" x2="3" y2="6.5" stroke="#3E2A1B" strokeWidth="1" />
            </>
          ) : (
            /* HAPPY: nụ cười to cute */
            <path d="M -4.5 5 Q 0.5 10 5.5 5" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
          )}

          {/* ── TÓC & PHỤ KIỆN ĐẦU ── */}
          {(cit.hairStyle === 'SHORT' || cit.hairStyle === 'BUN' || cit.hairStyle === 'BOB') && (
            <path
              d="M -13 -2 C -13 -14 13 -14 13 -2 C 9 -8 -6 -8 -13 -2 Z"
              fill={cit.hairColor}
              stroke="#3E2A1B"
              strokeWidth="2"
            />
          )}
          {/* BOB thêm phần hai bên má */}
          {cit.hairStyle === 'BOB' && (
            <>
              <path d="M -13 -2 Q -15 6 -12 9" fill={cit.hairColor} stroke="#3E2A1B" strokeWidth="1.8" />
              <path d="M 13 -2 Q 15 6 12 9" fill={cit.hairColor} stroke="#3E2A1B" strokeWidth="1.8" />
            </>
          )}
          {/* Nón Lá Việt Nam */}
          {cit.hairStyle === 'NON_LA' && (
            <>
              <polygon points="-16,-4 0,-18 16,-4" fill="#FEF08A" stroke="#3E2A1B" strokeWidth="2" />
              <line x1="-16" y1="-4" x2="16" y2="-4" stroke="#3E2A1B" strokeWidth="1.5" />
            </>
          )}
          {/* Nón Lưỡi Trai */}
          {cit.hairStyle === 'CAP_YELLOW' && (
            <>
              <path d="M -12 -3 C -12 -14 11 -14 11 -3 Z" fill="#FACC15" stroke="#3E2A1B" strokeWidth="2" />
              <path d="M 5 -3 L 17 -2 L 16 1 L 5 0 Z" fill="#EAB308" stroke="#3E2A1B" strokeWidth="1.5" />
            </>
          )}
          {/* Mũ Bảo Hiểm */}
          {cit.hairStyle === 'HELMET_BLUE' && (
            <>
              <path d="M -13 -1 C -13 -15 13 -15 13 -1 Z" fill={cit.accentColor} stroke="#3E2A1B" strokeWidth="2" />
              <rect x="-13" y="-1" width="26" height="3" rx="1.5" fill={cit.accentColor} stroke="#3E2A1B" strokeWidth="1.5" />
              {/* kính chắn gió */}
              <path d="M -10 -4 Q 0 -1 10 -4" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            </>
          )}
          {/* Đầu hói + Kính lão */}
          {cit.hairStyle === 'BALD_GLASSES' && (
            <>
              {/* vành tóc thưa */}
              <path d="M -13 2 C -13 -10 -6 -14 0 -14 C 6 -14 13 -10 13 2" fill={cit.hairColor} stroke="#3E2A1B" strokeWidth="1.5" opacity="0.6" />
              {/* Kính */}
              <circle cx="-5" cy="-1" r="4" fill="rgba(219,234,254,0.5)" stroke="#3E2A1B" strokeWidth="1.5" />
              <circle cx="5" cy="-1" r="4" fill="rgba(219,234,254,0.5)" stroke="#3E2A1B" strokeWidth="1.5" />
              <line x1="-1" y1="-1" x2="1" y2="-1" stroke="#3E2A1B" strokeWidth="1.3" />
              <line x1="-13" y1="-1" x2="-9" y2="-1" stroke="#3E2A1B" strokeWidth="1.3" />
              <line x1="9" y1="-1" x2="13" y2="-1" stroke="#3E2A1B" strokeWidth="1.3" />
            </>
          )}
          {/* BUN nút tóc phía trước */}
          {cit.hairStyle === 'BUN' && (
            <circle cx="0" cy="-14" r="3.5" fill={cit.hairColor} stroke="#3E2A1B" strokeWidth="1.8" />
          )}
          {/* Ponytail */}
          {cit.hairStyle === 'PONYTAIL' && (
            <>
              <path d="M -13 -2 C -13 -14 13 -14 13 -2 C 9 -8 -6 -8 -13 -2 Z" fill={cit.hairColor} stroke="#3E2A1B" strokeWidth="2" />
              <path d="M 11 -8 Q 20 0 16 12" fill="none" stroke={cit.hairColor} strokeWidth="5" strokeLinecap="round" />
            </>
          )}
        </g>
      </g>
    </svg>
  );
}

export default function ExpressiveStreetCitizens({
  onCitizenReward,
}: {
  onCitizenReward?: (msg: string) => void;
}) {
  const [citizens, setCitizens] = useState<AutonomousCitizen[]>(() =>
    INITIAL_CITIZENS.map((c, idx) => ({
      ...c,
      walkCycle: idx * 1.4,
      behavior: idx % 3 === 0 ? 'ADMIRING_SHOP' : 'WALKING',
      behaviorTimer: 60 + idx * 25,
      blinkTimer: 40 + idx * 17,
      isBlinking: false,
      jumpOffset: 0,
      squash: 0,
      bubbleText: idx % 2 === 0 ? c.quotes[0] : null,
    })),
  );

  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const dt = 10;
      setCitizens((prev) =>
        prev.map((c) => {
          let nextX = c.x;
          let nextDir = c.dir;
          let nextWalkCycle = c.walkCycle;
          let nextBehavior = c.behavior;
          let nextTimer = c.behaviorTimer - dt;
          let nextEmotion = c.emotion;
          let nextBubble = c.bubbleText;
          const nextJump = Math.max(0, c.jumpOffset - dt * 2.5);

          let nextBlinkTimer = c.blinkTimer - dt;
          let nextIsBlinking = c.isBlinking;
          if (nextBlinkTimer <= 0) {
            if (nextIsBlinking) {
              nextIsBlinking = false;
              nextBlinkTimer = 65 + Math.random() * 55;
            } else {
              nextIsBlinking = true;
              nextBlinkTimer = 4.5;
            }
          }

          if (nextTimer <= 0) {
            const roll = Math.random();
            if (c.behavior === 'WALKING' && roll < 0.42) {
              nextBehavior = roll < 0.25 ? 'ADMIRING_SHOP' : 'CHATTING';
              nextTimer = 75 + Math.random() * 60;
              nextEmotion =
                nextBehavior === 'ADMIRING_SHOP'
                  ? 'STAR_EYES'
                  : ALL_EMOTIONS[Math.floor(Math.random() * ALL_EMOTIONS.length)];
              nextBubble = c.quotes[Math.floor(Math.random() * c.quotes.length)];
            } else {
              nextBehavior = 'WALKING';
              nextTimer = 110 + Math.random() * 90;
              if (Math.random() < 0.3) nextDir = (c.dir * -1) as 1 | -1;
              nextEmotion = Math.random() < 0.5 ? 'HAPPY' : Math.random() < 0.5 ? 'WHISTLE_CHILL' : 'SWEAT_FUNNY';
              nextBubble = Math.random() < 0.28 ? c.quotes[Math.floor(Math.random() * c.quotes.length)] : null;
            }
          }

          if (nextBehavior === 'WALKING') {
            nextX += nextDir * c.speed * dt;
            nextWalkCycle += 0.22 * dt;
            if (nextX > 1960) { nextX = 1960; nextDir = -1; }
            else if (nextX < 180) { nextX = 180; nextDir = 1; }
          } else {
            nextWalkCycle += 0.08 * dt;
          }

          return {
            ...c,
            x: nextX,
            dir: nextDir,
            walkCycle: nextWalkCycle,
            behavior: nextBehavior,
            behaviorTimer: nextTimer,
            emotion: nextEmotion,
            blinkTimer: nextBlinkTimer,
            isBlinking: nextIsBlinking,
            jumpOffset: nextJump,
            bubbleText: nextBubble,
          };
        }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClickCitizen = useCallback(
    (citizen: AutonomousCitizen) => {
      /**
       * Tap la "niem vui", khong phai nguon thu chinh. Rate-limit 5s va khong
       * ro vat pham: truoc day 500 Xu + 38% ro do la ~10.000 Xu/lan, quyet
       * dinh toan bo do kinh te chi trong 15 giay quet het 13 cu dan.
       */
      const result = claimTapReward('citizen', CITIZEN_TAP_COINS, {
        cooldownMs: CITIZEN_TAP_COOLDOWN_MS,
      });
      if (!result.ok) {
        setCitizens((prev) =>
          prev.map((c) =>
            c.id === citizen.id
              ? { ...c, emotion: 'SWEAT_FUNNY', behaviorTimer: 40, bubbleText: 'Ôi tay mỏi quá…' }
              : c,
          ),
        );
        return;
      }


      particles.coinShower(citizen.x, 380, 10);

      const quote = citizen.quotes[Math.floor(Math.random() * citizen.quotes.length)];
      const dropSuffix = `+${formatCompact(CITIZEN_TAP_COINS)} Xu ♥`;

      setCitizens((prev) =>
        prev.map((c) =>
          c.id === citizen.id
            ? {
                ...c,
                emotion: 'STAR_EYES',
                behavior: 'WAVING',
                behaviorTimer: 85,
                jumpOffset: 20,
                bubbleText: `${quote} (${dropSuffix})`,
              }
            : c,
        ),
      );
      onCitizenReward?.(`${citizen.name}: “${quote}” (${dropSuffix})`);
    },
    [onCitizenReward],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {citizens.map((cit) => {
        const isWalking = cit.behavior === 'WALKING';
        const bodyBob = isWalking ? Math.abs(Math.sin(cit.walkCycle)) * 4 : Math.sin(cit.walkCycle) * 1.5;

        return (
          <div
            key={cit.id}
            style={{
              transform: `translate3d(${Math.round(cit.x)}px, ${-Math.round(cit.laneY + bodyBob + cit.jumpOffset)}px, 0)`,
              zIndex: Math.round(60 - cit.laneY),
              willChange: 'transform',
            }}
            className="group absolute bottom-2 left-0 flex flex-col items-center"
          >
            {/* Speech bubble */}
            {cit.bubbleText && (
              <div
                className="mb-1 max-w-[185px] truncate rounded-2xl border-2 border-[#3E2A1B] bg-[#FFFDF7] px-2.5 py-0.5 text-[10px] font-extrabold text-[#3E2A1B] shadow-md"
                style={{ boxShadow: '0 2px 0 rgba(62,42,27,0.15)' }}
              >
                {cit.bubbleText}
              </div>
            )}

            {/* Floating emotion icons */}
            <div className="relative flex flex-col items-center">
              {cit.emotion === 'STAR_EYES' && (
                <span className="absolute -top-3 -right-3 text-[13px]">✦</span>
              )}
              {cit.emotion === 'WHISTLE_CHILL' && (
                <span className="absolute -top-3 -right-2 text-[12px]">♪♫</span>
              )}
              {cit.emotion === 'SURPRISED' && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-black text-[#DC2626]">!</span>
              )}
              {cit.emotion === 'SWEAT_FUNNY' && (
                <span className="absolute -top-2 -left-4 text-[11px]">💧</span>
              )}
              {cit.emotion === 'WINK' && (
                <span className="absolute -top-3 -right-3 text-[12px]">😏</span>
              )}

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClickCitizen(cit); }}
                title={`Bấm để trò chuyện với ${cit.name} (${cit.role})`}
                className="pointer-events-auto relative cursor-pointer focus:outline-none"
                style={{ transform: `scaleX(${cit.dir})` }}
              >
                <CitizenSvg
                  cit={cit}
                  walkCycle={cit.walkCycle}
                  isWalking={isWalking}
                  bodyBob={bodyBob}
                  jumpOffset={cit.jumpOffset}
                />
              </button>
            </div>
            {/* Name label nằm ngoài button để tránh bị scaleX(-1) lật ngược */}
            <span
              className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#3E2A1B]/85 px-1.5 py-0.5 text-[8px] font-bold text-[#FEF08A] opacity-0 transition-opacity group-hover:opacity-100"
            >
              {cit.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
