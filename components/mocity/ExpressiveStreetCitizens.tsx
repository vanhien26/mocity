'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { claimTapReward } from '@/lib/mocity/store';
import { formatCompact } from '@/lib/mocity/format';
import { particles } from './ParticleEngine';

const CITIZEN_TAP_COINS = 25;
const CITIZEN_TAP_COOLDOWN_MS = 5_000;

export type FacialEmotion =
  | 'HAPPY'
  | 'STAR_EYES'
  | 'SURPRISED'
  | 'WHISTLE_CHILL'
  | 'SWEAT_FUNNY'
  | 'CHATTING'
  | 'WINK';

export type CitizenBehavior = 'WALKING' | 'ADMIRING_SHOP' | 'CHATTING' | 'WAVING';

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
}

/** Appearance state - chỉ thay đổi khi behavior change (~mỗi 10-15s) */
interface CitAppearance {
  emotion: FacialEmotion;
  bubbleText: string | null;
}

const ALL_EMOTIONS: FacialEmotion[] = [
  'HAPPY', 'STAR_EYES', 'SURPRISED', 'WHISTLE_CHILL', 'SWEAT_FUNNY', 'CHATTING', 'WINK',
];

const CITIZEN_DEFS: CitizenDef[] = [
  {
    id: 'cit-mayor-assistant', name: 'Trợ Lý Thị Trưởng', role: 'Cán Bộ Quy Hoạch',
    startX: 240, laneY: 28, startDir: 1, speed: 0.72, emotion: 'HAPPY',
    skinColor: '#FDE6D2', hairStyle: 'SHORT', hairColor: '#2B2118',
    shirtColor: '#2B4368', pantsColor: '#1E293B', accentColor: '#DC2626', hasTie: true,
    heldItem: 'BRIEFCASE',
    quotes: ['Phố vỉa hè bữa nay khang trang quá!', 'Bà con nhớ bật Loa Thần Tài QR nha!', 'Đi tuần coi tiệm nào đông khách nhất!'],
  },
  {
    id: 'cit-co-tu', name: 'Cô Tư Đi Chợ', role: 'Bà Nội Trợ Săn Deal',
    startX: 420, laneY: 16, startDir: -1, speed: 0.55, emotion: 'STAR_EYES',
    skinColor: '#FCD9BD', hairStyle: 'NON_LA', hairColor: '#2B2118',
    shirtColor: '#EC4899', pantsColor: '#334155', accentColor: '#FEF08A',
    heldItem: 'SHOPPING_BAG',
    quotes: ['Ủa tiệm tạp hóa giảm nước mắm kìa!', 'Quét MoMo hoàn tiền mua thêm bó rau!', 'Khỏi mang ví tiền lẻ, khỏe cái bụng ghê!'],
  },
  {
    id: 'cit-be-nam', name: 'Bé Nam GenZ', role: 'Sinh Viên Năm 3',
    startX: 640, laneY: 42, startDir: 1, speed: 0.92, emotion: 'WHISTLE_CHILL',
    skinColor: '#FDE6D2', hairStyle: 'CAP_YELLOW', hairColor: '#1F2937',
    shirtColor: '#65A30D', pantsColor: '#374151', accentColor: '#FACC15',
    heldItem: 'MILK_TEA',
    quotes: ['Trà sữa full trân châu 1 XU ngon nhức nách!', 'Tối rủ cả phòng trọ đi coi MoMo Cinema!', 'Chia tiền lẩu trên app, hết đứa trốn WC!'],
  },
  {
    id: 'cit-chi-thao', name: 'Chị Thảo Văn Phòng', role: 'Thánh Chốt Đơn',
    startX: 860, laneY: 22, startDir: -1, speed: 0.68, emotion: 'HAPPY',
    skinColor: '#FFF1E6', hairStyle: 'BUN', hairColor: '#3E2723',
    shirtColor: '#F472B6', pantsColor: '#475569', accentColor: '#D82D8B',
    heldItem: 'PHONE_QR',
    quotes: ['Ting! Lãi Túi Thần Tài sáng vừa về!', 'Làm ly trà sữa chữa lành cột sống thôi!', 'Quét mã nhanh còn kịp chấm công!'],
  },
  {
    id: 'cit-ong-loc', name: 'Ông Lộc Vé Số', role: 'Thần Tài Góc Phố',
    startX: 1080, laneY: 34, startDir: 1, speed: 0.50, emotion: 'HAPPY',
    skinColor: '#FCD9BD', hairStyle: 'BALD_GLASSES', hairColor: '#9CA3AF',
    shirtColor: '#D97706', pantsColor: '#3E2A1B', accentColor: '#FEF08A',
    heldItem: 'LOTTERY_FAN',
    quotes: ['Lựa tờ đuôi 68 chiều xổ nha con!', 'Đầu hẻm có người trúng giải đặc biệt!', 'Đi bộ quanh phố vừa khỏe vừa nuôi Heo Vàng!'],
  },
  {
    id: 'cit-anh-hoang', name: 'Anh Hoàng IT', role: 'Kỹ Sư Phần Mềm',
    startX: 1290, laneY: 18, startDir: -1, speed: 0.76, emotion: 'SWEAT_FUNNY',
    skinColor: '#FDE6D2', hairStyle: 'SHORT', hairColor: '#111827',
    shirtColor: '#E2E8F0', pantsColor: '#1E293B', accentColor: '#38BDF8',
    heldItem: 'LAPTOP',
    quotes: ['Code không bug nhưng ví tiền hơi lag nhẹ...', 'Có Ví Trả Sau cứu bồ cuối tháng!', 'Bug fix xong rồi, đi ăn trà sữa thôi!'],
  },
  {
    id: 'cit-bao-ngoc', name: 'Bảo Ngọc KOC', role: 'Reviewer Phố Phường',
    startX: 1520, laneY: 38, startDir: 1, speed: 0.82, emotion: 'STAR_EYES',
    skinColor: '#FFF1E6', hairStyle: 'BOB', hairColor: '#7C2D12',
    shirtColor: '#38BDF8', pantsColor: '#1E293B', accentColor: '#F43F5E',
    heldItem: 'CAMERA',
    quotes: ['Check-in MoCity lên xu hướng liền!', 'Tiệm nào trên phố cũng đẹp mê ly!', 'Review 10 điểm cho Thị Trưởng!'],
  },
  {
    id: 'cit-chu-bay', name: 'Chú Bảy Hàng Xóm', role: 'Tổ Trưởng Dân Phố',
    startX: 1740, laneY: 26, startDir: -1, speed: 0.60, emotion: 'SURPRISED',
    skinColor: '#FCD9BD', hairStyle: 'HELMET_BLUE', hairColor: '#1F2937',
    shirtColor: '#4ADE80', pantsColor: '#334155', accentColor: '#22D3EE',
    heldItem: 'NONE',
    quotes: ['Đóng tiền điện tự động rồi, hết lo cúp điện!', 'Phố xá nhộn nhịp mà sạch đẹp ghê chưa!', 'Trả nợ tiền bia cho Cô Tư qua QR rồi nghen!', 'Bà con khu phố ai cũng khen Thị Trưởng mát tay!'],
  },
];

/**
 * CSS keyframes cho walk animation.
 * Toàn bộ leg/arm swing, body bob, head wobble chạy hoàn toàn qua CSS -
 * không cần React re-render mỗi frame.
 * --spd: animation duration được set per-character dựa trên speed.
 */
const WALK_CSS = `
/* Dùng px tuyệt đối trong SVG space thay vì fill-box để tránh bug browser */
.cit-walk-anim .cit-lb { transform-origin: 24px 48px; will-change: transform; }
.cit-walk-anim .cit-lf { transform-origin: 32px 48px; will-change: transform; }
.cit-walk-anim .cit-ab { transform-origin: 22px 31px; will-change: transform; }
.cit-walk-anim .cit-af { transform-origin: 34px 31px; will-change: transform; }
.cit-walk-anim .cit-bw { transform-origin: 28px 40px; will-change: transform; }
.cit-walk-anim .cit-hw { transform-origin: 28px 16px; will-change: transform; }

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
`;

/** Chỉ render nội dung SVG bên trong (không bọc svg tag) - để parent control class/ref */
function CitizenContent({ def, emotion }: { def: CitizenDef; emotion: FacialEmotion }) {
  return (
    <>
      <ellipse cx="28" cy="69" rx="13" ry="3.5" fill="rgba(62,42,27,0.20)" />

      <g className="cit-bw">
        {/* LEGS */}
        <g transform="translate(24,48)" className="cit-lb">
          <rect x="-3" y="0" width="6" height="14" rx="3" fill={def.pantsColor} stroke="#3E2A1B" strokeWidth="1.8" />
          <ellipse cx="0" cy="15" rx="4.5" ry="2.5" fill="#3E2A1B" />
        </g>
        <g transform="translate(32,48)" className="cit-lf">
          <rect x="-3" y="0" width="6" height="14" rx="3" fill={def.pantsColor} stroke="#3E2A1B" strokeWidth="1.8" />
          <ellipse cx="0" cy="15" rx="4.5" ry="2.5" fill="#3E2A1B" />
        </g>

        {/* ARM BACK */}
        <g transform="translate(22,31)" className="cit-ab">
          <rect x="-2.5" y="0" width="5" height="14" rx="2.5" fill={def.shirtColor} stroke="#3E2A1B" strokeWidth="1.6" />
          <circle cx="0" cy="15.5" r="3" fill={def.skinColor} stroke="#3E2A1B" strokeWidth="1.5" />
          {def.heldItem === 'BRIEFCASE' && (
            <g transform="translate(-4,18)">
              <rect x="0" y="0" width="10" height="7" rx="1.5" fill="#C9A227" stroke="#3E2A1B" strokeWidth="1.3" />
              <rect x="3" y="-1.5" width="4" height="2" rx="1" fill="none" stroke="#3E2A1B" strokeWidth="1.2" />
            </g>
          )}
          {def.heldItem === 'SHOPPING_BAG' && (
            <g transform="translate(-4,17)">
              <rect x="0" y="0" width="9" height="10" rx="2" fill="#F97316" stroke="#3E2A1B" strokeWidth="1.4" />
              <path d="M2 0 Q2 -3 4.5 -3 Q7 -3 7 0" fill="none" stroke="#3E2A1B" strokeWidth="1.3" />
            </g>
          )}
        </g>

        {/* BODY */}
        <rect x="18" y="29" width="20" height="20" rx="7" fill={def.shirtColor} stroke="#3E2A1B" strokeWidth="2" />
        {def.hasTie && (
          <polygon points="28,30 26.5,40 28,43 29.5,40" fill={def.accentColor} stroke="#3E2A1B" strokeWidth="1" />
        )}

        {/* ARM FRONT */}
        <g transform="translate(34,31)" className="cit-af">
          <rect x="-2.5" y="0" width="5" height="14" rx="2.5" fill={def.shirtColor} stroke="#3E2A1B" strokeWidth="1.6" />
          <circle cx="0" cy="15.5" r="3" fill={def.skinColor} stroke="#3E2A1B" strokeWidth="1.5" />
          {def.heldItem === 'MILK_TEA' && (
            <g transform="translate(-3.5,14)">
              <line x1="3.5" y1="-4" x2="3.5" y2="2" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
              <rect x="0" y="0" width="7" height="9" rx="1.5" fill="#FDE68A" stroke="#3E2A1B" strokeWidth="1.4" />
              <circle cx="2.5" cy="7" r="1" fill="#3E2A1B" />
              <circle cx="4.5" cy="7" r="1" fill="#3E2A1B" />
            </g>
          )}
          {def.heldItem === 'LOTTERY_FAN' && (
            <g transform="translate(-3,15)">
              <rect x="0" y="0" width="8" height="6" fill="#F43F5E" stroke="#3E2A1B" strokeWidth="1.2" transform="rotate(-18)" />
              <rect x="1" y="1" width="8" height="6" fill="#FACC15" stroke="#3E2A1B" strokeWidth="1.2" transform="rotate(6)" />
              <rect x="2" y="0" width="8" height="6" fill="#34D399" stroke="#3E2A1B" strokeWidth="1.2" transform="rotate(22)" />
            </g>
          )}
          {def.heldItem === 'PHONE_QR' && (
            <g transform="translate(-3,14)">
              <rect x="0" y="0" width="6" height="10" rx="1.5" fill="#D82D8B" stroke="#3E2A1B" strokeWidth="1.3" />
              <rect x="1.5" y="1.5" width="3" height="3" rx="0.5" fill="white" opacity="0.9" />
            </g>
          )}
          {def.heldItem === 'LAPTOP' && (
            <g transform="translate(-5,15)">
              <rect x="0" y="0" width="10" height="7" rx="1" fill="#E2E8F0" stroke="#3E2A1B" strokeWidth="1.3" />
              <rect x="1" y="7" width="12" height="2" rx="0.5" fill="#94A3B8" stroke="#3E2A1B" strokeWidth="1" />
              <rect x="1.5" y="1" width="7" height="4.5" rx="0.5" fill="#38BDF8" opacity="0.8" />
            </g>
          )}
          {def.heldItem === 'CAMERA' && (
            <g transform="translate(-4,14)">
              <rect x="0" y="0" width="9" height="7" rx="2" fill="#1E293B" stroke="#3E2A1B" strokeWidth="1.3" />
              <circle cx="4.5" cy="3.5" r="2.2" fill="#3E2A1B" stroke={def.accentColor} strokeWidth="1" />
              <circle cx="4.5" cy="3.5" r="1" fill="#60A5FA" />
            </g>
          )}
        </g>

        {/* HEAD */}
        <g transform="translate(28,16)" className="cit-hw">
          {def.hairStyle === 'BUN' && (
            <ellipse cx="-8" cy="-9" rx="5" ry="4.5" fill={def.hairColor} stroke="#3E2A1B" strokeWidth="1.8" />
          )}
          {def.hairStyle === 'PONYTAIL' && (
            <path d="M -8 -6 Q -18 0 -14 8" fill="none" stroke={def.hairColor} strokeWidth="4" strokeLinecap="round" />
          )}

          <circle cx="0" cy="0" r="13" fill={def.skinColor} stroke="#3E2A1B" strokeWidth="2.2" />

          {/* Eyebrows based on emotion */}
          {emotion === 'SURPRISED' && (
            <>
              <path d="M -8 -7.5 Q -5 -10 -2 -7.5" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
              <path d="M 2 -7.5 Q 5 -10 8 -7.5" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {(emotion === 'HAPPY' || emotion === 'STAR_EYES' || emotion === 'CHATTING') && (
            <>
              <path d="M -8 -6.5 Q -5 -8 -2 -6.5" fill="none" stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 2 -6.5 Q 5 -8 8 -6.5" fill="none" stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
          {emotion === 'WINK' && (
            <>
              <path d="M -8 -6.5 Q -5 -8 -2 -6.5" fill="none" stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 2 -7.5 Q 5.5 -9.5 8 -7.5" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
            </>
          )}

          {/* Eyes based on emotion */}
          {(emotion === 'HAPPY' || emotion === 'CHATTING') && (
            <>
              <path d="M -7.5 -1 Q -4.5 -5 -1.5 -1" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 1.5 -1 Q 4.5 -5 7.5 -1" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
            </>
          )}
          {emotion === 'STAR_EYES' && (
            <>
              <text x="-8.5" y="0.5" fontSize="9" fill="#FACC15" stroke="#D97706" strokeWidth="0.4" fontWeight="bold">★</text>
              <text x="2" y="0.5" fontSize="9" fill="#FACC15" stroke="#D97706" strokeWidth="0.4" fontWeight="bold">★</text>
            </>
          )}
          {emotion === 'SURPRISED' && (
            <>
              <ellipse cx="-4.5" cy="-1" rx="3.2" ry="3.8" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="-4" cy="-0.5" r="1.6" fill="#3E2A1B" />
              <ellipse cx="4.5" cy="-1" rx="3.2" ry="3.8" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="4" cy="-0.5" r="1.6" fill="#3E2A1B" />
            </>
          )}
          {emotion === 'WINK' && (
            <>
              <ellipse cx="-4.5" cy="-1.5" rx="3" ry="3.5" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="-4" cy="-1" r="1.5" fill="#3E2A1B" />
              <path d="M 1.5 -1.5 Q 4.5 -4.5 7.5 -1.5" fill={def.skinColor} stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {emotion === 'WHISTLE_CHILL' && (
            <>
              <ellipse cx="-4.5" cy="-1" rx="3" ry="2.2" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="-4" cy="-0.5" r="1.2" fill="#3E2A1B" />
              <path d="M -7.5 -3 Q -4.5 -1.8 -1.5 -3" fill={def.skinColor} stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
              <ellipse cx="4.5" cy="-1" rx="3" ry="2.2" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="4" cy="-0.5" r="1.2" fill="#3E2A1B" />
              <path d="M 1.5 -3 Q 4.5 -1.8 7.5 -3" fill={def.skinColor} stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
          {emotion === 'SWEAT_FUNNY' && (
            <>
              <path d="M -7.5 -1.5 L -1.5 -1.5" stroke="#3E2A1B" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 1.5 -1.5 L 7.5 -1.5" stroke="#3E2A1B" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
          {(emotion !== 'HAPPY' && emotion !== 'CHATTING' && emotion !== 'STAR_EYES' &&
            emotion !== 'SURPRISED' && emotion !== 'WINK' && emotion !== 'WHISTLE_CHILL' && emotion !== 'SWEAT_FUNNY') && (
            <>
              <ellipse cx="-4.5" cy="-1.5" rx="3" ry="3.5" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="-4" cy="-1" r="1.5" fill="#3E2A1B" />
              <ellipse cx="4.5" cy="-1.5" rx="3" ry="3.5" fill="#FFFFFF" stroke="#3E2A1B" strokeWidth="1.8" />
              <circle cx="4" cy="-1" r="1.5" fill="#3E2A1B" />
            </>
          )}

          {/* Mouth */}
          {emotion === 'SURPRISED' && <ellipse cx="0.5" cy="6" rx="3" ry="3.5" fill="#D9534F" stroke="#3E2A1B" strokeWidth="1.5" />}
          {emotion === 'STAR_EYES' && <path d="M -3.5 5.5 Q 0.5 9 4.5 5.5" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />}
          {emotion === 'WHISTLE_CHILL' && <circle cx="2" cy="6" r="2" fill="#3E2A1B" />}
          {emotion === 'SWEAT_FUNNY' && <path d="M -3 6.5 Q 0 5 3.5 6.5" fill="none" stroke="#3E2A1B" strokeWidth="1.8" strokeLinecap="round" />}
          {emotion === 'WINK' && <path d="M -4 5.5 Q 0.5 9.5 5 5.5" fill="none" stroke="#3E2A1B" strokeWidth="2" strokeLinecap="round" />}
          {emotion === 'CHATTING' && (
            <>
              <ellipse cx="0.5" cy="6.5" rx="4" ry="3" fill="#D9534F" stroke="#3E2A1B" strokeWidth="1.5" />
              <line x1="-2" y1="6.5" x2="3" y2="6.5" stroke="#3E2A1B" strokeWidth="1" />
            </>
          )}
          {(emotion === 'HAPPY' || (emotion !== 'SURPRISED' && emotion !== 'STAR_EYES' && emotion !== 'WHISTLE_CHILL' &&
            emotion !== 'SWEAT_FUNNY' && emotion !== 'WINK' && emotion !== 'CHATTING')) && (
            <path d="M -4.5 5 Q 0.5 10 5.5 5" fill="none" stroke="#3E2A1B" strokeWidth="2.2" strokeLinecap="round" />
          )}

          {/* Hair */}
          {(def.hairStyle === 'SHORT' || def.hairStyle === 'BUN' || def.hairStyle === 'BOB') && (
            <path d="M -13 -2 C -13 -14 13 -14 13 -2 C 9 -8 -6 -8 -13 -2 Z" fill={def.hairColor} stroke="#3E2A1B" strokeWidth="2" />
          )}
          {def.hairStyle === 'BOB' && (
            <>
              <path d="M -13 -2 Q -15 6 -12 9" fill={def.hairColor} stroke="#3E2A1B" strokeWidth="1.8" />
              <path d="M 13 -2 Q 15 6 12 9" fill={def.hairColor} stroke="#3E2A1B" strokeWidth="1.8" />
            </>
          )}
          {def.hairStyle === 'NON_LA' && (
            <>
              <polygon points="-16,-4 0,-18 16,-4" fill="#FEF08A" stroke="#3E2A1B" strokeWidth="2" />
              <line x1="-16" y1="-4" x2="16" y2="-4" stroke="#3E2A1B" strokeWidth="1.5" />
            </>
          )}
          {def.hairStyle === 'CAP_YELLOW' && (
            <>
              <path d="M -12 -3 C -12 -14 11 -14 11 -3 Z" fill="#FACC15" stroke="#3E2A1B" strokeWidth="2" />
              <path d="M 5 -3 L 17 -2 L 16 1 L 5 0 Z" fill="#EAB308" stroke="#3E2A1B" strokeWidth="1.5" />
            </>
          )}
          {def.hairStyle === 'HELMET_BLUE' && (
            <>
              <path d="M -13 -1 C -13 -15 13 -15 13 -1 Z" fill={def.accentColor} stroke="#3E2A1B" strokeWidth="2" />
              <rect x="-13" y="-1" width="26" height="3" rx="1.5" fill={def.accentColor} stroke="#3E2A1B" strokeWidth="1.5" />
              <path d="M -10 -4 Q 0 -1 10 -4" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            </>
          )}
          {def.hairStyle === 'BALD_GLASSES' && (
            <>
              <path d="M -13 2 C -13 -10 -6 -14 0 -14 C 6 -14 13 -10 13 2" fill={def.hairColor} stroke="#3E2A1B" strokeWidth="1.5" opacity="0.6" />
              <circle cx="-5" cy="-1" r="4" fill="rgba(219,234,254,0.5)" stroke="#3E2A1B" strokeWidth="1.5" />
              <circle cx="5" cy="-1" r="4" fill="rgba(219,234,254,0.5)" stroke="#3E2A1B" strokeWidth="1.5" />
              <line x1="-1" y1="-1" x2="1" y2="-1" stroke="#3E2A1B" strokeWidth="1.3" />
              <line x1="-13" y1="-1" x2="-9" y2="-1" stroke="#3E2A1B" strokeWidth="1.3" />
              <line x1="9" y1="-1" x2="13" y2="-1" stroke="#3E2A1B" strokeWidth="1.3" />
            </>
          )}
          {def.hairStyle === 'BUN' && (
            <circle cx="0" cy="-14" r="3.5" fill={def.hairColor} stroke="#3E2A1B" strokeWidth="1.8" />
          )}
          {def.hairStyle === 'PONYTAIL' && (
            <>
              <path d="M -13 -2 C -13 -14 13 -14 13 -2 C 9 -8 -6 -8 -13 -2 Z" fill={def.hairColor} stroke="#3E2A1B" strokeWidth="2" />
              <path d="M 11 -8 Q 20 0 16 12" fill="none" stroke={def.hairColor} strokeWidth="5" strokeLinecap="round" />
            </>
          )}
        </g>
      </g>
    </>
  );
}

export default function ExpressiveStreetCitizens({
  onCitizenReward,
}: {
  onCitizenReward?: (msg: string) => void;
}) {
  // Appearance state: chỉ re-render khi emotion/bubble thay đổi (~mỗi 10-15s)
  const [appearances, setAppearances] = useState<CitAppearance[]>(() =>
    CITIZEN_DEFS.map((c, i) => ({
      emotion: c.emotion,
      bubbleText: i % 2 === 0 ? c.quotes[0] : null,
    }))
  );

  // Mutable sim state: cập nhật bằng RAF, không trigger re-render
  const simRef = useRef<SimState[]>(
    CITIZEN_DEFS.map((c, i) => ({
      x: c.startX,
      dir: c.startDir,
      walkPhase: i * 1.4,
      behavior: (i % 3 === 0 ? 'ADMIRING_SHOP' : 'WALKING') as CitizenBehavior,
      behaviorTimer: 60 + i * 25,
      jumpOffset: 0,
    }))
  );

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
      lastTime = now;
      flushAccum += elapsed;

      if (typeof document !== 'undefined' && document.hidden) return;

      simRef.current.forEach((sim, i) => {
        const def = CITIZEN_DEFS[i];
        sim.behaviorTimer -= dt * 10;
        sim.jumpOffset = Math.max(0, sim.jumpOffset - dt * 25);

        const wasWalking = sim.behavior === 'WALKING';
        if (wasWalking) {
          sim.x += sim.dir * def.speed * dt * 10;
          if (sim.x > 1960) { sim.x = 1960; sim.dir = -1; }
          else if (sim.x < 180) { sim.x = 180; sim.dir = 1; }
          sim.walkPhase += 0.22 * dt * 10;
        } else {
          sim.walkPhase += 0.08 * dt * 10;
        }

        const bodyBob = wasWalking
          ? Math.abs(Math.sin(sim.walkPhase)) * 3
          : Math.sin(sim.walkPhase) * 1.2;

        // Direct DOM updates - không qua React setState
        const container = containerRefs.current[i];
        if (container) {
          container.style.transform = `translate3d(${Math.round(sim.x)}px,${-Math.round(def.laneY + bodyBob + sim.jumpOffset)}px,0)`;
          container.style.zIndex = String(Math.round(60 - def.laneY));
        }
        const btn = btnRefs.current[i];
        if (btn) btn.style.transform = `scaleX(${sim.dir})`;

        const svg = svgRefs.current[i];
        if (svg) {
          const cls = wasWalking ? 'walking' : 'idle';
          if (!svg.classList.contains(cls)) {
            svg.classList.remove('walking', 'idle');
            svg.classList.add(cls);
          }
        }

        // Behavior transitions
        if (sim.behaviorTimer <= 0) {
          const roll = Math.random();
          let nextEmotion: FacialEmotion | null = null;
          let nextBubble: string | null = null;

          if (wasWalking && roll < 0.42) {
            sim.behavior = roll < 0.25 ? 'ADMIRING_SHOP' : 'CHATTING';
            sim.behaviorTimer = 75 + Math.random() * 60;
            nextEmotion = sim.behavior === 'ADMIRING_SHOP'
              ? 'STAR_EYES'
              : ALL_EMOTIONS[Math.floor(Math.random() * ALL_EMOTIONS.length)];
            nextBubble = def.quotes[Math.floor(Math.random() * def.quotes.length)];
          } else {
            sim.behavior = 'WALKING';
            sim.behaviorTimer = 110 + Math.random() * 90;
            if (Math.random() < 0.3) sim.dir = (sim.dir * -1) as 1 | -1;
            nextEmotion = Math.random() < 0.5 ? 'HAPPY' : Math.random() < 0.5 ? 'WHISTLE_CHILL' : 'SWEAT_FUNNY';
            nextBubble = Math.random() < 0.28 ? def.quotes[Math.floor(Math.random() * def.quotes.length)] : null;
          }

          if (nextEmotion) {
            pendingUpdates.current.set(i, { emotion: nextEmotion, bubbleText: nextBubble });
          }
        }
      });

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

  const handleClickCitizen = useCallback(
    (idx: number) => {
      const def = CITIZEN_DEFS[idx];
      const result = claimTapReward('citizen', CITIZEN_TAP_COINS, { cooldownMs: CITIZEN_TAP_COOLDOWN_MS });

      if (!result.ok) {
        setAppearances(prev =>
          prev.map((a, i) => i === idx ? { ...a, emotion: 'SWEAT_FUNNY', bubbleText: 'Ôi tay mỏi quá…' } : a)
        );
        return;
      }

      simRef.current[idx].jumpOffset = 20;
      particles.coinShower(simRef.current[idx].x, 380, 10);

      const quote = def.quotes[Math.floor(Math.random() * def.quotes.length)];
      const bubble = `${quote} (+${formatCompact(CITIZEN_TAP_COINS)} Xu ♥)`;
      setAppearances(prev =>
        prev.map((a, i) => i === idx ? { emotion: 'STAR_EYES', bubbleText: bubble } : a)
      );
      onCitizenReward?.(`${def.name}: "${quote}" (+${formatCompact(CITIZEN_TAP_COINS)} Xu ♥)`);
    },
    [onCitizenReward],
  );

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
                <div className="mb-1 max-w-[185px] truncate rounded-2xl border-2 border-[#3E2A1B] bg-[#FFFDF7] px-2.5 py-0.5 text-[10px] font-extrabold text-[#3E2A1B] shadow-md">
                  {app.bubbleText}
                </div>
              )}
              <div className="relative flex flex-col items-center">
                {app.emotion === 'STAR_EYES' && <span className="absolute -top-3 -right-3 text-[13px]">✦</span>}
                {app.emotion === 'WHISTLE_CHILL' && <span className="absolute -top-3 -right-2 text-[12px]">♪♫</span>}
                {app.emotion === 'SURPRISED' && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-black text-[#DC2626]">!</span>}
                {app.emotion === 'SWEAT_FUNNY' && <span className="absolute -top-2 -left-4 text-[11px]">💧</span>}

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
                    style={{ '--spd': `${(0.8 / def.speed).toFixed(2)}s` } as React.CSSProperties}
                  >
                    <CitizenContent def={def} emotion={app.emotion} />
                  </svg>
                </button>
              </div>
              <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#3E2A1B]/85 px-1.5 py-0.5 text-[8px] font-bold text-[#FEF08A] opacity-0 transition-opacity group-hover:opacity-100">
                {def.name}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
