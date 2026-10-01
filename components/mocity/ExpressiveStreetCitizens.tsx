'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { claimTapReward } from '@/lib/mocity/store';
import { formatCompact } from '@/lib/mocity/format';
import { particles } from './ParticleEngine';

const CITIZEN_TAP_COINS = 25;
const CITIZEN_TAP_COOLDOWN_MS = 5_000;

/**
 * Cut-paper chi dung hinh phang, khong xep lop mat/may/mieng nhu ban chibi cu.
 * 7 emotion cu gop con 4: WHISTLE_CHILL + CHATTING + WINK -> HAPPY,
 * SWEAT_FUNNY -> TIRED. Moi emotion la mot bo hinh phang doi cho nhau.
 */
export type FacialEmotion = 'HAPPY' | 'STAR_EYES' | 'SURPRISED' | 'TIRED';

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

const ALL_EMOTIONS: FacialEmotion[] = ['HAPPY', 'STAR_EYES', 'SURPRISED', 'TIRED'];

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
    quotes: ['Phố vỉa hè bữa nay khang trang quá!', 'Bà con nhớ bật Loa Thần Tài QR nha!', 'Đi tuần coi tiệm nào đông khách nhất!'],
  },
  {
    id: 'cit-co-tu', name: 'Cô Tư Đi Chợ', role: 'Bà Nội Trợ Săn Deal',
    startX: 390, laneY: 16, startDir: -1, speed: 0.3, emotion: 'STAR_EYES',
    skinColor: '#FCD9BD', hairStyle: 'NON_LA', hairColor: '#2B2118',
    shirtColor: '#EC4899', pantsColor: '#334155', accentColor: '#FEF08A',
    heldItem: 'SHOPPING_BAG',
    quotes: ['Ủa tiệm tạp hóa giảm nước mắm kìa!', 'Quét MoMo hoàn tiền mua thêm bó rau!', 'Khỏi mang ví tiền lẻ, khỏe cái bụng ghê!'],
  },
  {
    id: 'cit-be-nam', name: 'Bé Nam GenZ', role: 'Sinh Viên Năm 3',
    startX: 540, laneY: 42, startDir: 1, speed: 0.5, emotion: 'HAPPY',
    skinColor: '#FDE6D2', hairStyle: 'CAP_YELLOW', hairColor: '#1F2937',
    shirtColor: '#65A30D', pantsColor: '#374151', accentColor: '#FACC15',
    heldItem: 'MILK_TEA',
    quotes: ['Trà sữa full trân châu 1 XU ngon nhức nách!', 'Tối rủ cả phòng trọ đi coi MoMo Cinema!', 'Chia tiền lẩu trên app, hết đứa trốn WC!'],
  },
  {
    id: 'cit-chi-thao', name: 'Chị Thảo Văn Phòng', role: 'Thánh Chốt Đơn',
    startX: 690, laneY: 22, startDir: -1, speed: 0.38, emotion: 'HAPPY',
    skinColor: '#FFF1E6', hairStyle: 'BUN', hairColor: '#3E2723',
    shirtColor: '#F472B6', pantsColor: '#475569', accentColor: '#D82D8B',
    heldItem: 'PHONE_QR',
    quotes: ['Ting! Lãi Túi Thần Tài sáng vừa về!', 'Làm ly trà sữa chữa lành cột sống thôi!', 'Quét mã nhanh còn kịp chấm công!'],
  },
  {
    id: 'cit-ong-loc', name: 'Ông Lộc Vé Số', role: 'Thần Tài Góc Phố',
    startX: 840, laneY: 34, startDir: 1, speed: 0.28, emotion: 'HAPPY',
    skinColor: '#FCD9BD', hairStyle: 'BALD_GLASSES', hairColor: '#9CA3AF',
    shirtColor: '#D97706', pantsColor: '#3E2A1B', accentColor: '#FEF08A',
    heldItem: 'LOTTERY_FAN',
    quotes: ['Lựa tờ đuôi 68 chiều xổ nha con!', 'Đầu hẻm có người trúng giải đặc biệt!', 'Đi bộ quanh phố vừa khỏe vừa nuôi Heo Vàng!'],
  },
  {
    id: 'cit-anh-hoang', name: 'Anh Hoàng IT', role: 'Kỹ Sư Phần Mềm',
    startX: 990, laneY: 18, startDir: -1, speed: 0.42, emotion: 'TIRED',
    skinColor: '#FDE6D2', hairStyle: 'SHORT', hairColor: '#111827',
    shirtColor: '#E2E8F0', pantsColor: '#1E293B', accentColor: '#38BDF8',
    heldItem: 'LAPTOP',
    quotes: ['Code không bug nhưng ví tiền hơi lag nhẹ...', 'Có Ví Trả Sau cứu bồ cuối tháng!', 'Bug fix xong rồi, đi ăn trà sữa thôi!'],
  },
  {
    id: 'cit-bao-ngoc', name: 'Bảo Ngọc KOC', role: 'Reviewer Phố Phường',
    startX: 1140, laneY: 38, startDir: 1, speed: 0.45, emotion: 'STAR_EYES',
    skinColor: '#FFF1E6', hairStyle: 'BOB', hairColor: '#7C2D12',
    shirtColor: '#38BDF8', pantsColor: '#1E293B', accentColor: '#F43F5E',
    heldItem: 'CAMERA',
    quotes: ['Check-in MoCity lên xu hướng liền!', 'Tiệm nào trên phố cũng đẹp mê ly!', 'Review 10 điểm cho Thị Trưởng!'],
  },
  {
    id: 'cit-chu-bay', name: 'Chú Bảy Hàng Xóm', role: 'Tổ Trưởng Dân Phố',
    startX: 1290, laneY: 26, startDir: -1, speed: 0.33, emotion: 'SURPRISED',
    skinColor: '#FCD9BD', hairStyle: 'HELMET_BLUE', hairColor: '#1F2937',
    shirtColor: '#4ADE80', pantsColor: '#334155', accentColor: '#22D3EE',
    heldItem: 'NONE',
    quotes: ['Đóng tiền điện tự động rồi, hết lo cúp điện!', 'Phố xá nhộn nhịp mà sạch đẹp ghê chưa!', 'Trả nợ tiền bia cho Cô Tư qua QR rồi nghen!', 'Bà con khu phố ai cũng khen Thị Trưởng mát tay!'],
  },
  {
    id: 'cit-bac-tai', name: 'Bác Tài Xe Ôm', role: 'Tài Xế Công Nghệ',
    startX: 1440, laneY: 20, startDir: 1, speed: 0.36, emotion: 'HAPPY',
    skinColor: '#FCD9BD', hairStyle: 'HELMET_BLUE', hairColor: '#1F2937',
    shirtColor: '#16A34A', pantsColor: '#1E293B', accentColor: '#22C55E',
    heldItem: 'PHONE_QR',
    quotes: ['Khách đặt cuốc là app báo liền, khỏi chờ!', 'Chạy xe cả ngày, tối về ví vẫn đầy!', 'Bà con cần đi đâu con chở, trả qua MoMo nghen!'],
  },
  {
    id: 'cit-chi-hang-rong', name: 'Chị Hàng Rong', role: 'Gánh Xôi Đầu Ngõ',
    startX: 1590, laneY: 36, startDir: -1, speed: 0.29, emotion: 'HAPPY',
    skinColor: '#FCD9BD', hairStyle: 'NON_LA', hairColor: '#2B2118',
    shirtColor: '#A16207', pantsColor: '#44403C', accentColor: '#FBBF24',
    heldItem: 'SHOPPING_BAG',
    quotes: ['Xôi gấc nóng hổi vừa thổi vừa ăn đây!', 'Dán cái mã QR mà bán chạy hẳn ra!', 'Sáng nào cũng gánh qua đây, quen mặt hết rồi!'],
  },
  {
    id: 'cit-be-an', name: 'Bé An Học Sinh', role: 'Học Sinh Cấp 2',
    startX: 1740, laneY: 30, startDir: 1, speed: 0.44, emotion: 'STAR_EYES',
    skinColor: '#FDE6D2', hairStyle: 'SHORT', hairColor: '#111827',
    shirtColor: '#F1F5F9', pantsColor: '#1E3A8A', accentColor: '#3B82F6',
    heldItem: 'NONE',
    quotes: ['Mẹ chuyển tiền ăn sáng qua app rồi nè!', 'Tan học ghé tiệm sách coi truyện mới!', 'Con để dành Heo Đất mua xe đạp đó!'],
  },
  {
    id: 'cit-co-linh', name: 'Cô Linh Dạy Thêm', role: 'Giáo Viên',
    startX: 1890, laneY: 24, startDir: -1, speed: 0.31, emotion: 'HAPPY',
    skinColor: '#FFF1E6', hairStyle: 'BOB', hairColor: '#4A2C17',
    shirtColor: '#0EA5E9', pantsColor: '#334155', accentColor: '#0284C7',
    heldItem: 'LAPTOP',
    quotes: ['Phụ huynh đóng học phí online hết rồi!', 'Chấm bài xong ghé làm ly cà phê muối!', 'Lớp tối nay đông, phải soạn thêm đề!'],
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
`;

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
            nextEmotion = Math.random() < 0.5 ? 'HAPPY' : Math.random() < 0.5 ? 'STAR_EYES' : 'TIRED';
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
          prev.map((a, i) => i === idx ? { ...a, emotion: 'TIRED', bubbleText: 'Ôi tay mỏi quá…' } : a)
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
                {app.emotion === 'SURPRISED' && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-black text-[#DC2626]">!</span>}

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
