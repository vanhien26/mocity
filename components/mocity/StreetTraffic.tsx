'use client';

import React, { useEffect, useRef } from 'react';
import type { TimeOfDay } from '@/lib/mocity/types';
import type { TrafficPhase } from './useTrafficController';
import { ChibiBody } from './ChibiRenderer';
import { CYCLE_K } from './ExpressiveStreetCitizens';
import { appearanceFromSeed } from '@/lib/mocity/character-appearance-gen';

/**
 * Dàn phương tiện chạy dưới LÒNG ĐƯỜNG, vẽ theo cut paper đồng bộ với nhân vật MoCity.
 * Tích hợp hệ thống vật lý giao thông thông minh:
 * - Dừng đúng vạch dừng ngã tư (x ≈ 142px) khi gặp ĐÈN ĐỎ / ĐÈN VÀNG.
 * - Xếp hàng chờ (queueing) không đè lên nhau, giữ khoảng cách an toàn.
 * - Đèn phanh sáng đỏ khi hãm tốc độ hoặc dừng đỗ.
 * - Xe Cảnh Sát ưu tiên khẩn cấp vượt ngã tư an toàn với còi đèn hụ.
 * - Người đi bộ sang đường trên vạch kẻ zebra khi xe dừng đèn đỏ.
 * - Tự động tăng tốc mượt mà khi đèn chuyển sang XANH.
 */

const TRAFFIC_CSS = `
@keyframes police-siren-red {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px rgba(239,68,68,0.95)); }
  50% { opacity: 0.2; filter: drop-shadow(0 0 1px rgba(239,68,68,0.2)); }
}
@keyframes police-siren-blue {
  0%, 100% { opacity: 0.2; filter: drop-shadow(0 0 1px rgba(59,130,246,0.2)); }
  50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(59,130,246,0.95)); }
}
[data-braking="true"] .brake-light {
  fill: #EF4444 !important;
  filter: drop-shadow(0 0 8px #EF4444) !important;
}
`;

function Wheel({ cx, cy, r = 7 }: { cx: number; cy: number; r?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#2A3442" />
      <circle cx={cx} cy={cy} r={r * 0.42} fill="#C3CCD8" />
    </>
  );
}

/** Đèn pha hắt sáng khi trời tối hoặc bật đèn đường. */
function Beam({ x, y, on }: { x: number; y: number; on: boolean }) {
  if (!on) return null;
  return (
    <polygon
      points={`${x},${y - 5} ${x + 96},${y - 22} ${x + 96},${y + 16}`}
      fill="rgba(254,240,138,0.45)"
    />
  );
}

function XichLo({ night }: { night: boolean }) {
  return (
    <svg width="98" height="56" viewBox="0 0 98 56" className="overflow-visible select-none">
      <ellipse cx="49" cy="53" rx="34" ry="2.6" fill="rgba(62,42,27,0.16)" />
      <Wheel cx={18} cy={44} r={8} />
      <Wheel cx={82} cy={44} r={7} />
      {/* Khung nối cabin với phần đạp */}
      <path d="M26 40 L68 38 L69 42 L27 44 Z" fill="#4A4038" />
      <path d="M62 40 L72 24 L76 25.6 L66 41.6 Z" fill="#5A4E42" />
      {/* Cabin khách - mảng phẳng + lớp đậm bên trái */}
      <path d="M6 42 L40 42 L40 24 L6 26 Z" fill="#2E7D6E" />
      <path d="M6 42 L15 42 L15 25.2 L6 26 Z" fill="#1F5A4E" />
      {/* Mui che vải đỏ */}
      <path d="M3 25 Q22 8 43 23 L43 27 Q22 13 4 29 Z" fill="#D94F3D" />
      <path d="M22.4 15.6 Q33 18.4 43 23 L43 27 Q33 21.6 23 18.6 Z" fill="#A83628" />
      {/* Khách ngồi */}
      <circle cx="24" cy="31" r="5.4" fill="#EFC49C" />
      <path d="M18.6 31.4 C18.6 24.6 29.4 24.6 29.4 31.4 C26 28.4 22 28.4 18.6 31.4 Z" fill="#2E1D16" />
      <path d="M19 42 L29 42 L29 34.4 L19 34.4 Z" fill="#E8B23C" />
      {/* Người đạp */}
      <path d="M64 38 L76 38 L75.2 26 L65 26 Z" fill="#4C83C4" />
      <path d="M64 38 L68 38 L67.6 26 L65 26 Z" fill="#35639A" />
      <circle cx="70" cy="19" r="6" fill="#EFC49C" />
      <path d="M62.8 19.6 L77.2 19.6 L76.6 16 L63.4 16 Z" fill="#DEBE63" />
      <path d="M63.6 13.4 L76.4 13.4 Q70 5.4 63.6 13.4 Z" fill="#DEBE63" />
      {/* Đèn phản quang / phanh đuôi */}
      <circle className="brake-light" cx="82" cy="38" r="3" fill="#7F1D1D" />
      <Beam x={90} y={38} on={night} />
    </svg>
  );
}

function XeDayDoAn({ night }: { night: boolean }) {
  return (
    <svg width="92" height="58" viewBox="0 0 92 58" className="overflow-visible select-none">
      <ellipse cx="42" cy="55" rx="32" ry="2.6" fill="rgba(62,42,27,0.16)" />
      <Wheel cx={20} cy={47} r={6} />
      <Wheel cx={52} cy={47} r={6} />
      {/* Thân xe đẩy */}
      <path d="M8 44 L66 44 L66 28 L8 28 Z" fill="#E8D5A8" />
      <path d="M8 44 L66 44 L66 38.6 L8 38.6 Z" fill="#C9B078" />
      <path d="M8 28 L66 28 L66 31.4 L8 31.4 Z" fill="#A8926A" />
      {/* Mái che sọc đỏ trắng */}
      <path d="M2 24 L72 24 L72 28 L2 28 Z" fill="#B23A2C" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${4 + i * 10} 14 L${12 + i * 10} 14 L${12 + i * 10} 24 L${4 + i * 10} 24 Z`} fill={i % 2 ? '#F5EDD8' : '#D94F3D'} />
      ))}
      <path d="M2 11 L72 11 L72 14.6 L2 14.6 Z" fill="#8F2C20" />
      {/* Nồi nước lèo + khói nghi ngút */}
      <path d="M16 28 L34 28 L34 18.6 L16 18.6 Z" fill="#8A7A68" />
      <path d="M14 18.6 L36 18.6 L36 22 L14 22 Z" fill="#6B5D4E" />
      {/* Tay đẩy */}
      <path d="M66 32 L78 32 L78 35 L66 35 Z" fill="#8A7A68" />
      {/* Người bán */}
      <path d="M76 46 L88 46 L87 30 L77 30 Z" fill="#C2410C" />
      <path d="M76 46 L80 46 L79.4 30 L77 30 Z" fill="#92300A" />
      <circle cx="82" cy="23" r="6.2" fill="#EFC49C" />
      <path d="M74.6 23.8 L89.4 23.8 L88.8 20 L75.2 20 Z" fill="#DEBE63" />
      <path d="M75.4 17.4 L88.6 17.4 Q82 9 75.4 17.4 Z" fill="#DEBE63" />
      {/* Đèn phản quang đuôi */}
      <circle className="brake-light" cx="78" cy="38" r="3" fill="#7F1D1D" />
      <Beam x={2} y={38} on={night} />
    </svg>
  );
}

function OTo({ night }: { night: boolean }) {
  return (
    <svg width="106" height="50" viewBox="0 0 106 50" className="overflow-visible select-none">
      <ellipse cx="53" cy="47" rx="40" ry="2.8" fill="rgba(62,42,27,0.16)" />
      {/* Thân xe taxi vàng retro */}
      <path d="M4 38 L102 38 L100 24 L80 24 L68 11 L36 11 L26 24 L6 25 Z" fill="#E8B23C" />
      <path d="M4 38 L102 38 L101.4 32 L4.6 32 Z" fill="#C08E22" />
      {/* Kính */}
      <path d="M39 14 L51 14 L51 24 L30 24 Z" fill="#BDD8E8" />
      <path d="M55 14 L66 14 L75 24 L55 24 Z" fill="#BDD8E8" />
      {/* Sọc hông taxi */}
      <path d="M6 28.4 L100 28.4 L100 31.4 L6 31.4 Z" fill="#8A6414" />
      {/* Mào taxi trên nóc */}
      <path d="M44 5 L62 5 L62 11 L44 11 Z" fill="#2E7D32" />
      <path d="M44 5 L62 5 L62 7.4 L44 7.4 Z" fill="#1F5A23" />
      <Wheel cx={27} cy={39} r={8} />
      <Wheel cx={82} cy={39} r={8} />
      {/* Đèn phanh đuôi đỏ */}
      <path className="brake-light" d="M4 25 L8 25 L8 31 L4 31 Z" fill="#991B1B" />
      {/* Đèn pha trước */}
      <path d="M98 26 L103 26 L103 30 L98 30 Z" fill="#FDE68A" />
      <Beam x={103} y={30} on={night} />
    </svg>
  );
}

function VinFast({ night }: { night: boolean }) {
  return (
    <svg width="110" height="50" viewBox="0 0 110 50" className="overflow-visible select-none">
      <ellipse cx="55" cy="47" rx="42" ry="2.8" fill="rgba(62,42,27,0.16)" />
      {/* SUV điện, dáng bo tròn hiện đại */}
      <path d="M4 38 L106 38 L104 22 L84 20 L70 8 L38 8 L24 21 L5 24 Z" fill="#2B6CB0" />
      <path d="M4 38 L106 38 L105.2 31 L4.8 31 Z" fill="#1E4E84" />
      {/* Kính liền khối */}
      <path d="M40 11 L53 11 L53 21 L28.4 21.4 Z" fill="#C6DEEE" />
      <path d="M57 11 L68 11 L79 20.6 L57 20.6 Z" fill="#C6DEEE" />
      {/* Chỉ mạ bạc */}
      <path d="M6 27.6 L104 27.6 L104 29.6 L6 29.6 Z" fill="#8FB4D8" />
      {/* Logo chữ V */}
      <path d="M14 32.6 L17.6 32.6 L19.6 36.4 L21.6 32.6 L25.2 32.6 L19.6 42 Z" fill="#E8EEF6" />
      <Wheel cx={28} cy={39} r={8.4} />
      <Wheel cx={85} cy={39} r={8.4} />
      {/* Đèn phanh hậu đỏ LED */}
      <path className="brake-light" d="M4 22 L9 22 L9 29 L4 29 Z" fill="#7F1D1D" />
      {/* Dải đèn LED đặc trưng xe điện */}
      <path d="M96 23.6 L104.4 24.2 L104.4 26.6 L96 26 Z" fill="#DDF2FF" />
      <Beam x={105} y={29} on={night} />
    </svg>
  );
}

function XeMay({ night }: { night: boolean }) {
  return (
    <svg width="72" height="54" viewBox="0 0 72 54" className="overflow-visible select-none">
      <ellipse cx="36" cy="51" rx="23" ry="2.6" fill="rgba(62,42,27,0.16)" />
      <Wheel cx={16} cy={43} r={7.6} />
      <Wheel cx={56} cy={43} r={7.6} />
      <path d="M11 40 L29 28 L48 38 L45 42.4 L28 33.6 Z" fill="#1E4FBF" />
      <path d="M46 40 L55 25 L59 26.6 L50 42 Z" fill="#2563EB" />
      <path d="M49 24 L59.4 25 L59 27.8 L48.6 26.8 Z" fill="#17388A" />
      <path d="M14 28 L32 29 L31.6 35.4 L13.6 34.4 Z" fill="#1E293B" />
      {/* Đèn phanh đuôi xe máy */}
      <path className="brake-light" d="M11 29 L15 29 L15 34 L11 34 Z" fill="#7F1D1D" />
      {/* Người lái */}
      <path d="M24 15.6 L37 16.2 L36.4 32.4 L23.4 31.8 Z" fill="#4BC6DC" />
      <path d="M24 15.6 L28 15.8 L27.4 32 L23.4 31.8 Z" fill="#35A3B8" />
      <path d="M34.6 19.6 L50 26 L48.4 29.2 L33.4 23 Z" fill="#E0A87E" />
      <circle cx="31" cy="9" r="7.8" fill="#EFC49C" />
      <circle cx="33.6" cy="8.4" r="1.5" fill="#3E2A1B" />
      <path d="M31.6 12 Q34.1 14.6 36.6 12" fill="none" stroke="#2B2420" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M22.6 8.6 C22.6 -0.8 39.4 -0.8 39.4 8.6 Z" fill="#C2410C" />
      <path d="M22 8.4 L40 8.4 L39.6 11 L22.4 11 Z" fill="#8F2C0A" />
      <Beam x={62} y={32} on={night} />
    </svg>
  );
}

function XeDap({ night }: { night: boolean }) {
  return (
    <svg width="68" height="54" viewBox="0 0 68 54" className="overflow-visible select-none">
      <ellipse cx="34" cy="51" rx="21" ry="2.6" fill="rgba(62,42,27,0.16)" />
      <circle cx="16" cy="42" r="8.4" fill="none" stroke="#2A3442" strokeWidth="2.6" />
      <circle cx="50" cy="42" r="8.4" fill="none" stroke="#2A3442" strokeWidth="2.6" />
      <path d="M16 42 L28 28.6 L31.4 30.2 L19.4 43.2 Z" fill="#2AA87A" />
      <path d="M28 28.4 L46 28.4 L45.8 31.2 L29.2 31.2 Z" fill="#34D399" />
      <path d="M46 28.8 L50 41.6 L47.2 42.4 L43.2 29.6 Z" fill="#2AA87A" />
      <path d="M31 29.2 L34.2 41.8 L31.4 42.4 L28.2 29.8 Z" fill="#34D399" />
      <path d="M44.6 25.6 L52.4 26.2 L52.2 28.6 L44.4 28 Z" fill="#1F8A62" />
      <path d="M23 13.6 L34.6 14.2 L33.8 29.4 L23.8 28.8 Z" fill="#EC4899" />
      <path d="M23 13.6 L26.8 13.8 L26.2 29.1 L23.8 28.8 Z" fill="#C0246F" />
      <path d="M33.2 17 L47 23.4 L45.4 26.2 L32 20 Z" fill="#E0A87E" />
      <circle cx="23" cy="-2" r="4.2" fill="#2E1D16" />
      <circle cx="29.4" cy="5" r="7.8" fill="#EFC49C" />
      <ellipse cx="26" cy="8" rx="2" ry="1.3" fill="#F0A8BE" />
      <circle cx="32.8" cy="4.4" r="1.5" fill="#3E2A1B" />
      <path d="M31 8 Q33.4 10.8 35.8 8" fill="none" stroke="#2B2420" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M21.4 3.2 C21.4 -4.4 37.4 -4.4 37.4 3.2 C33 -1.4 25.8 -1.4 21.4 3.2 Z" fill="#2E1D16" />
      {/* Đèn phản quang đỏ phía sau */}
      <circle className="brake-light" cx="15" cy="36" r="3.2" fill="#7F1D1D" />
      <Beam x={56} y={32} on={night} />
    </svg>
  );
}

function XeCanhSat({ night, onClick }: { night: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`group relative ${onClick ? 'cursor-pointer' : ''}`}
      title="🚓 Xe Cảnh Sát Tuần Tra MoCity (Nhấn để chào)"
    >
      <svg width="118" height="54" viewBox="0 0 118 54" className="overflow-visible select-none">
        {/* Bóng xe dưới mặt đường */}
        <ellipse cx="58" cy="48" rx="46" ry="3" fill="rgba(62,42,27,0.22)" />

        {/* Chân đế còi cảnh sát trên nóc */}
        <rect x="50" y="5" width="20" height="3" rx="1" fill="#334155" />

        {/* Còi đèn báo động nhấp nháy: Đỏ bên trái, Xanh bên phải */}
        <g>
          {/* Đèn đỏ nhấp nháy */}
          <rect
            x="51"
            y="1"
            width="8"
            height="5"
            rx="1.5"
            fill="#EF4444"
            style={{ animation: 'police-siren-red 0.55s infinite ease-in-out' }}
          />
          <circle
            cx="55"
            cy="3.5"
            r="8"
            fill="rgba(239,68,68,0.35)"
            style={{ animation: 'police-siren-red 0.55s infinite ease-in-out' }}
          />

          {/* Loa còi ở giữa */}
          <rect x="59.5" y="1" width="3" height="5" rx="0.5" fill="#CBD5E1" />

          {/* Đèn xanh nhấp nháy */}
          <rect
            x="63"
            y="1"
            width="8"
            height="5"
            rx="1.5"
            fill="#3B82F6"
            style={{ animation: 'police-siren-blue 0.55s infinite ease-in-out' }}
          />
          <circle
            cx="67"
            cy="3.5"
            r="8"
            fill="rgba(59,130,246,0.35)"
            style={{ animation: 'police-siren-blue 0.55s infinite ease-in-out' }}
          />
        </g>

        {/* Thân xe cảnh sát màu trắng */}
        <path
          d="M6 39 L112 39 L110 23 L88 21 L74 8 L36 8 L24 22 L6 24 Z"
          fill="#FFFFFF"
        />
        {/* Vạt bóng xám gầm xe */}
        <path
          d="M6 39 L112 39 L111.2 32.5 L6.8 32.5 Z"
          fill="#CBD5E1"
        />

        {/* Cửa sổ kính xanh nhạt */}
        <path d="M38 11 L53 11 L53 22 L27 22 Z" fill="#93C5FD" />
        <path d="M57 11 L72 11 L83 22 L57 22 Z" fill="#93C5FD" />
        <line x1="55" y1="9" x2="55" y2="22" stroke="#475569" strokeWidth="2" />

        {/* Sọc decal xanh đậm CẢNH SÁT */}
        <path d="M7 26 L110 26 L109 33 L7 33 Z" fill="#1E3A8A" />
        <path d="M7 33 L110 33 L109.5 34.5 L7 34.5 Z" fill="#172554" />

        {/* Phù hiệu sao vàng trên nền đỏ */}
        <circle cx="28" cy="29.5" r="3.2" fill="#EAB308" />
        <path
          d="M28 27 L28.7 28.5 L30.4 28.6 L29.1 29.7 L29.5 31.4 L28 30.4 L26.5 31.4 L26.9 29.7 L25.6 28.6 L27.3 28.5 Z"
          fill="#DC2626"
        />

        {/* Chữ CẢNH SÁT màu trắng nổi bật */}
        <text
          x="66"
          y="31.8"
          fill="#FFFFFF"
          fontSize="6.2"
          fontWeight="900"
          letterSpacing="0.8"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          CẢNH SÁT
        </text>

        {/* Bánh xe */}
        <Wheel cx={29} cy={40} r={8.5} />
        <Wheel cx={88} cy={40} r={8.5} />

        {/* Đèn pha trước */}
        <path d="M106 25 L111 25 L111 29 L106 29 Z" fill="#FEF08A" />
        {/* Đèn hậu đỏ */}
        <path className="brake-light" d="M5 25 L8 25 L8 29 L5 29 Z" fill="#DC2626" />

        {/* Tia sáng đèn pha rọi đường vào ban đêm */}
        <Beam x={111} y={28} on={night} />
      </svg>
    </div>
  );
}

/**
 * Người đi bộ băng qua đường trên vạch Zebra khi xe gặp ĐÈN ĐỎ.
 *
 * Trước đây đây là 5 div CSS xếp chồng (nón + mặt + áo + 2 chân xoay) - thấp
 * hơn hẳn `ChibiBody` dùng cho mọi người khác trong game. Bản kế tiếp thay
 * bằng `ChibiBody` nhưng lái vị trí bằng `setInterval` + CSS `transition`:
 * mỗi 220ms React re-render toàn cây rồi trình duyệt mới nội suy `top` - hai
 * tầng không đồng bộ là lý do bước đi giật, khác hẳn cách `StreetPassersby`
 * và `ExpressiveStreetCitizens` làm (RAF + ghi thẳng `style.transform` vào
 * DOM, không qua React render mỗi khung hình).
 *
 * Bản này đổi sang đúng mô hình đó: RAF cập nhật `translateY` trực tiếp từng
 * khung hình, mượt như cư dân đi trên vỉa hè. Đồng thời tăng từ 1 lên 3
 * người - một người băng qua đường đỏ một mình trông vắng vẻ hơn thực tế.
 */
const PEDESTRIAN_CROSSERS = [
  { seed: 'nguoi-qua-duong-1', left: 10, delay: 0, speed: 0.46 },
  { seed: 'nguoi-qua-duong-2', left: 52, delay: 0.3, speed: 0.4 },
  { seed: 'nguoi-qua-duong-3', left: -28, delay: 0.65, speed: 0.5 },
].map((p) => ({ ...p, appearance: appearanceFromSeed(p.seed) }));

/** Thời gian băng hết vạch sọc (y: 12px -> 88px), giây. */
const CROSS_SECONDS = 2.1;

function ZebraPedestrians({ phase }: { phase: TrafficPhase }) {
  const crossing = phase === 'RED' || phase === 'YELLOW';
  const elapsedRef = useRef(PEDESTRIAN_CROSSERS.map(() => 0));
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);

  useEffect(() => {
    if (!crossing) {
      elapsedRef.current = PEDESTRIAN_CROSSERS.map(() => 0);
      return;
    }
    let rafId = 0;
    let last = performance.now();

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      PEDESTRIAN_CROSSERS.forEach((def, i) => {
        elapsedRef.current[i] += dt;
        const t = elapsedRef.current[i] - def.delay;
        const progress = Math.max(0, Math.min(1, t / CROSS_SECONDS));
        const y = 12 + progress * 76;

        const box = boxRefs.current[i];
        if (box) box.style.transform = `translateY(${y.toFixed(1)}px)`;

        const svg = svgRefs.current[i];
        if (svg) {
          const walking = t >= 0 && progress < 1;
          const cls = walking ? 'walking' : 'idle';
          if (!svg.classList.contains(cls)) {
            svg.classList.remove('walking', 'idle');
            svg.classList.add(cls);
          }
          svg.style.visibility = t < 0 ? 'hidden' : 'visible';
        }
      });
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [crossing]);

  if (!crossing) return null;

  return (
    <>
      {PEDESTRIAN_CROSSERS.map((def, i) => (
        <div
          key={def.seed}
          ref={(el) => {
            boxRefs.current[i] = el;
          }}
          className="pointer-events-none absolute z-20 select-none"
          style={{ left: def.left, top: 0, transform: 'translateY(12px)' }}
        >
          <svg
            ref={(el) => {
              svgRefs.current[i] = el;
            }}
            width="56"
            height="72"
            viewBox="0 0 56 72"
            className="cit-walk-anim overflow-visible idle"
            style={{ '--spd': `${(CYCLE_K / def.speed).toFixed(2)}s` } as React.CSSProperties}
          >
            <ChibiBody def={def.appearance} emotion="HAPPY" />
          </svg>
        </div>
      ))}
    </>
  );
}

interface VehicleModel {
  id: string;
  El: React.ComponentType<{ night: boolean; onClick?: () => void }>;
  lane: 'far' | 'near' | 'mid';
  length: number;
  initialX: number;
  baseSpeed: number; // px/s
  direction: 1 | -1; // 1 = left-to-right (far, mid), -1 = right-to-left (near)
}

const VEHICLE_MODELS: VehicleModel[] = [
  { id: 'xichlo', El: XichLo, lane: 'far', length: 98, initialX: 340, baseSpeed: 34, direction: 1 },
  { id: 'xemay', El: XeMay, lane: 'far', length: 72, initialX: 1100, baseSpeed: 76, direction: 1 },
  { id: 'canhsat', El: XeCanhSat, lane: 'mid', length: 118, initialX: 80, baseSpeed: 82, direction: 1 },
  { id: 'oto', El: OTo, lane: 'far', length: 106, initialX: 1850, baseSpeed: 58, direction: 1 },
  { id: 'xedaydoan', El: XeDayDoAn, lane: 'near', length: 92, initialX: 580, baseSpeed: 30, direction: -1 },
  { id: 'vinfast', El: VinFast, lane: 'near', length: 110, initialX: 1350, baseSpeed: 72, direction: -1 },
  { id: 'xedap', El: XeDap, lane: 'near', length: 68, initialX: 2050, baseSpeed: 40, direction: -1 },
];

export default function StreetTraffic({
  timeOfDay,
  trafficPhase = 'GREEN',
  streetLightsLit = true,
  roadWidth = 2400,
  onPoliceClick,
}: {
  timeOfDay: TimeOfDay;
  trafficPhase?: TrafficPhase;
  streetLightsLit?: boolean;
  roadWidth?: number;
  onPoliceClick?: () => void;
}) {
  const isNight = timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET';
  const headlightsOn = isNight || streetLightsLit;

  const trafficPhaseRef = useRef(trafficPhase);
  const roadWidthRef = useRef(Math.max(2200, roadWidth));
  useEffect(() => {
    trafficPhaseRef.current = trafficPhase;
    roadWidthRef.current = Math.max(2200, roadWidth);
  }, [trafficPhase, roadWidth]);

  // Lưu trạng thái vật lý của từng xe
  const vehiclesRef = useRef(
    VEHICLE_MODELS.map((m) => ({
      ...m,
      x: m.initialX,
      currentSpeed: m.baseSpeed,
      targetSpeed: m.baseSpeed,
      isBraking: false,
    })),
  );

  // Lưu refs của từng DOM element
  const domRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const ACCEL = 65; // px/s^2 (tăng tốc)
    const DECEL = 95; // px/s^2 (hãm phanh)

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.08); // clamp tránh giật khi đổi tab
      lastTime = now;

      const phase = trafficPhaseRef.current;
      const isRed = phase === 'RED';
      const isYellow = phase === 'YELLOW';
      const shouldStopNear = isRed || isYellow;
      const currentRoadWidth = roadWidthRef.current;

      const vehicles = vehiclesRef.current;

      // ==========================================
      // 1. LANE NEAR (Xe chạy từ phải sang trái, x giảm dần)
      // Stop line tại x = 142px (trước ngã tư 0-132px).
      // ==========================================
      const nearCars = vehicles.filter((v) => v.lane === 'near');
      // Sắp xếp theo x tăng dần: xe có x nhỏ nhất đang ở gần ngã tư nhất
      nearCars.sort((a, b) => a.x - b.x);

      let stopTargetX = 142; // Xe đầu tiên dừng tại x = 142px

      for (let i = 0; i < nearCars.length; i++) {
        const v = nearCars[i];

        if (shouldStopNear && v.x >= stopTargetX - 12) {
          // Xe đang tiếp cận ngã tư chưa vượt qua vạch dừng: cần dừng lại
          const distToStop = v.x - stopTargetX;

          if (distToStop <= 4) {
            v.targetSpeed = 0;
            v.isBraking = true;
          } else if (distToStop < 160) {
            // Hãm phanh mượt mà
            v.targetSpeed = Math.min(v.baseSpeed, Math.max(6, (distToStop / 160) * v.baseSpeed));
            v.isBraking = true;
          } else {
            v.targetSpeed = v.baseSpeed;
            v.isBraking = false;
          }

          // Xe kế tiếp phía sau phải xếp hàng sau đuôi xe này
          stopTargetX = v.x + v.length + 26;
        } else {
          // Đèn xanh hoặc xe đã vượt qua ngã tư (x < 142): phóng tự do!
          // Giữ khoảng cách an toàn với xe đi trước
          const carAhead = i > 0 ? nearCars[i - 1] : null;
          if (carAhead && v.x - (carAhead.x + carAhead.length) < 110 && v.x - carAhead.x > 0) {
            v.targetSpeed = Math.min(carAhead.currentSpeed, v.baseSpeed * 0.5);
            v.isBraking = v.currentSpeed > v.targetSpeed;
          } else {
            v.targetSpeed = v.baseSpeed;
            v.isBraking = false;
          }
        }
      }

      // ==========================================
      // 2. LANE FAR (Xe chạy từ trái sang phải, x tăng dần)
      // Khi đèn đỏ: xe ở x < 0 dừng trước vạch x = -15px.
      // ==========================================
      const farCars = vehicles.filter((v) => v.lane === 'far');
      // Xe có x lớn hơn đang đi trước
      farCars.sort((a, b) => b.x - a.x);

      let farStopX = -15;
      for (let i = 0; i < farCars.length; i++) {
        const v = farCars[i];
        if (isRed && v.x <= farStopX + 10) {
          const distToStop = farStopX - v.x;
          if (distToStop <= 4) {
            v.targetSpeed = 0;
            v.isBraking = true;
          } else if (distToStop < 140) {
            v.targetSpeed = Math.min(v.baseSpeed, Math.max(6, (distToStop / 140) * v.baseSpeed));
            v.isBraking = true;
          } else {
            v.targetSpeed = v.baseSpeed;
            v.isBraking = false;
          }
          farStopX = v.x - (v.length + 26);
        } else {
          // Xe đã qua ngã tư hoặc đèn xanh
          const carAhead = i > 0 ? farCars[i - 1] : null;
          if (carAhead && carAhead.x - (v.x + v.length) < 110 && carAhead.x - v.x > 0) {
            v.targetSpeed = Math.min(carAhead.currentSpeed, v.baseSpeed * 0.5);
            v.isBraking = v.currentSpeed > v.targetSpeed;
          } else {
            v.targetSpeed = v.baseSpeed;
            v.isBraking = false;
          }
        }
      }

      // ==========================================
      // 3. LANE MID (Xe Cảnh Sát - Emergency Priority)
      // Vượt ngã tư an toàn với còi hụ, không bị kẹt đèn đỏ
      // ==========================================
      const midCars = vehicles.filter((v) => v.lane === 'mid');
      for (const v of midCars) {
        if (isRed && v.x >= -30 && v.x <= 160) {
          // Đi chậm thận trọng qua ngã tư đèn đỏ nhưng không dừng hẳn
          v.targetSpeed = Math.max(48, v.baseSpeed * 0.65);
          v.isBraking = false;
        } else {
          v.targetSpeed = v.baseSpeed;
          v.isBraking = false;
        }
      }

      // ==========================================
      // 4. ÁP DỤNG GIA TỐC VÀ CẬP NHẬT TOẠ ĐỘ DOM
      // ==========================================
      for (const v of vehicles) {
        if (v.currentSpeed < v.targetSpeed) {
          v.currentSpeed = Math.min(v.targetSpeed, v.currentSpeed + ACCEL * dt);
        } else if (v.currentSpeed > v.targetSpeed) {
          v.currentSpeed = Math.max(v.targetSpeed, v.currentSpeed - DECEL * dt);
        }

        v.x += v.direction * v.currentSpeed * dt;

        // Wrap-around khi ra khỏi màn hình
        const minBound = -240;
        const maxBound = currentRoadWidth + 240;

        if (v.direction === 1 && v.x > maxBound) {
          v.x = minBound;
        } else if (v.direction === -1 && v.x < minBound) {
          v.x = maxBound;
        }

        // Cập nhật trực tiếp vào style transform của DOM node
        const el = domRefs.current[v.id];
        if (el) {
          el.style.transform = `translateX(${v.x.toFixed(1)}px) scaleX(${v.direction})`;
          el.setAttribute('data-braking', v.isBraking ? 'true' : 'false');
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TRAFFIC_CSS }} />

      {/* Người đi bộ sang đường khi xe dừng đèn đỏ */}
      <ZebraPedestrians phase={trafficPhase} />

      {/* Danh sách xe di chuyển */}
      {VEHICLE_MODELS.map(({ id, El, lane, initialX, direction }) => {
        const isPolice = id === 'canhsat';
        return (
          <div
            key={id}
            ref={(el) => {
              domRefs.current[id] = el;
            }}
            className={`absolute left-0 z-10 ${
              isPolice && onPoliceClick ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            style={{
              ...(lane === 'mid'
                ? { top: 37 }
                : lane === 'far'
                  ? { top: 8 }
                  : { bottom: 6 }),
              transform: `translateX(${initialX}px) scaleX(${direction})`,
            }}
          >
            <El
              night={headlightsOn}
              onClick={isPolice ? onPoliceClick : undefined}
            />
          </div>
        );
      })}
    </>
  );
}
