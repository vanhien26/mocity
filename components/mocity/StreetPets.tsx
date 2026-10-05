'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { TimeOfDay } from '@/lib/mocity/types';
import { claimTapReward, useCity } from '@/lib/mocity/store';
import { fillTen } from '@/lib/mocity/dialogue-name';

/**
 * HỆ THỐNG THÚ CƯNG VỈA HÈ (PETS OF MOCITY) — v2
 * Các bé pet ĐI LẠI dọc vỉa hè bằng requestAnimationFrame 60fps,
 * xen kẽ giữa WALKING ↔ IDLE (ngửi, ngồi nghỉ, liếm lông…),
 * phong cách cut-paper đồng bộ với ExpressiveStreetCitizens.
 */

const PETS_CSS = `
/* Bước đi lún lên lún xuống */
.pet-walking  { animation: petBob var(--walk-spd, 0.5s) ease-in-out infinite; }
.pet-idle     { animation: petIdle 2.5s ease-in-out infinite; }
@keyframes petBob  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
@keyframes petIdle { 0%,100%{transform:rotate(-1.5deg)} 50%{transform:rotate(1.5deg)} }
/* Dính lẹo lúng túng rung lắc giật giật */
.dinh-leo-wiggle { animation: dinhLeoShudder 0.35s ease-in-out infinite alternate; }
@keyframes dinhLeoShudder {
  0%   { transform: translate(0, 0) rotate(-1deg); }
  50%  { transform: translate(-1.5px, -1px) rotate(1deg); }
  100% { transform: translate(1.5px, 0.5px) rotate(-0.5deg); }
}
/* Giọt mồ hôi rơi / văng */
@keyframes sweatDrop {
  0%   { opacity: 0; transform: translateY(-4px) scale(0.6); }
  30%  { opacity: 1; transform: translateY(0) scale(1.1); }
  80%  { opacity: 0.9; transform: translateY(6px) scale(0.9); }
  100% { opacity: 0; transform: translateY(12px) scale(0.5); }
}
/* Chim vỗ cánh bay lượn */
.bird-flapping { animation: birdFlap 0.22s ease-in-out infinite alternate; }
@keyframes birdFlap {
  0%   { transform: scaleY(1) translateY(0); }
  100% { transform: scaleY(-0.7) translateY(-2px); }
}
@keyframes birdGlide {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
/* Bong bóng thoại */
@keyframes petBubblePop {
  0%   { opacity:0; transform:translateY(6px) scale(0.8); }
  100% { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes heartSparkle {
  0%   { opacity:1; transform:translateY(0) scale(0.6); }
  100% { opacity:0; transform:translateY(-35px) scale(1.3); }
}
/* Nốt nhạc bay bổng */
@keyframes noteFloat {
  0%   { opacity:0; transform:translate(0,0) scale(0.6); }
  30%  { opacity:0.95; transform:translate(6px,-12px) scale(1); }
  70%  { opacity:0.8; transform:translate(-4px,-24px) scale(1.1); }
  100% { opacity:0; transform:translate(8px,-36px) scale(0.8); }
}
`;

function chonNgauNhien<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// WALKING PET SVGs — mỗi bé là một tư thế đi bộ nhìn ngang
// ─────────────────────────────────────────────────────────────────────────────

/** Mèo Miu Miu — mèo mướp vàng đi nhón nhén */
function WalkingCat() {
  return (
    <svg width="58" height="44" viewBox="0 0 58 44" className="overflow-visible">
      <ellipse cx="29" cy="42" rx="20" ry="2.5" fill="rgba(62,42,27,0.14)" />
      {/* Đuôi dựng cong */}
      <path d="M4 28 C2 20 4 10 8 6 C10 4 12 8 11 14 C10 20 12 26 16 28 Z" fill="#D97706" />
      {/* Thân */}
      <ellipse cx="28" cy="28" rx="16" ry="10" fill="#F59E0B" />
      <path d="M22 20 Q24 26 23 30" stroke="#B45309" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M28 19 Q30 25 29 30" stroke="#B45309" strokeWidth="1.6" strokeLinecap="round" />
      {/* Bụng */}
      <ellipse cx="30" cy="32" rx="10" ry="5" fill="#FFFBEB" />
      {/* Chân sau */}
      <rect className="cit-lb" x="14" y="34" width="4" height="9" rx="2" fill="#D97706" style={{ transformOrigin: '16px 34px' }} />
      <rect className="cit-lf" x="20" y="34" width="4" height="9" rx="2" fill="#F59E0B" style={{ transformOrigin: '22px 34px' }} />
      {/* Chân trước */}
      <rect className="cit-lf" x="34" y="34" width="4" height="9" rx="2" fill="#F59E0B" style={{ transformOrigin: '36px 34px' }} />
      <rect className="cit-lb" x="38" y="34" width="4" height="9" rx="2" fill="#D97706" style={{ transformOrigin: '40px 34px' }} />
      {/* Đầu */}
      <circle cx="44" cy="20" r="8" fill="#F59E0B" />
      <ellipse cx="45" cy="22" rx="5" ry="3" fill="#FFFBEB" />
      {/* Tai */}
      <polygon points="38,14 40,6 43,14" fill="#F59E0B" />
      <polygon points="39,14 40,8 42,14" fill="#FCA5A5" />
      <polygon points="44,13 47,5 50,13" fill="#F59E0B" />
      <polygon points="45,13 47,7 49,13" fill="#FCA5A5" />
      {/* Mắt */}
      <circle cx="42" cy="18" r="1.6" fill="#78350F" />
      <circle cx="47" cy="18" r="1.6" fill="#78350F" />
      {/* Mũi & ria */}
      <polygon points="45,21 46,22 44,22" fill="#EF4444" />
      <line x1="48" y1="21" x2="54" y2="20" stroke="#78350F" strokeWidth="0.7" />
      <line x1="48" y1="22" x2="54" y2="23" stroke="#78350F" strokeWidth="0.7" />
      {/* Má hồng */}
      <circle cx="40" cy="22" r="1.3" fill="#FCA5A5" opacity="0.6" />
      <circle cx="49" cy="22" r="1.3" fill="#FCA5A5" opacity="0.6" />
    </svg>
  );
}

/** Cậu Vàng — chó ta vàng lục lạc chạy tung tăng */
function WalkingDog({ night, awkward = false }: { night: boolean; awkward?: boolean }) {
  return (
    <svg width="66" height="50" viewBox="0 0 66 50" className="overflow-visible">
      <ellipse cx="33" cy="47" rx="24" ry="2.5" fill="rgba(62,42,27,0.14)" />
      {/* Đuôi vẫy / cụp khi dính lẹo */}
      {awkward ? (
        <path d="M12 30 C8 32 6 36 8 38 C10 40 14 36 16 32 Z" fill="#CA8A04" />
      ) : (
        <path d="M4 22 C2 16 4 8 8 4 C10 2 12 6 10 12 C8 18 12 24 16 26 Z" fill="#EAB308" />
      )}
      {/* Thân */}
      <ellipse cx="30" cy="28" rx="17" ry="12" fill="#EAB308" />
      <ellipse cx="30" cy="32" rx="12" ry="6" fill="#FEF9C3" />
      {/* Chân sau */}
      <rect className="cit-lb" x="14" y="36" width="5" height="11" rx="2.5" fill="#CA8A04" style={{ transformOrigin: '16px 36px' }} />
      <rect className="cit-lf" x="20" y="36" width="5" height="11" rx="2.5" fill="#EAB308" style={{ transformOrigin: '22px 36px' }} />
      {/* Chân trước */}
      <rect className="cit-lf" x="38" y="36" width="5" height="11" rx="2.5" fill="#EAB308" style={{ transformOrigin: '40px 36px' }} />
      <rect className="cit-lb" x="44" y="36" width="5" height="11" rx="2.5" fill="#CA8A04" style={{ transformOrigin: '46px 36px' }} />
      {/* Bàn chân trắng */}
      <ellipse cx="16" cy="46" rx="3.5" ry="1.5" fill="#FEF9C3" />
      <ellipse cx="22" cy="46" rx="3.5" ry="1.5" fill="#FEF9C3" />
      <ellipse cx="40" cy="46" rx="3.5" ry="1.5" fill="#FEF9C3" />
      <ellipse cx="46" cy="46" rx="3.5" ry="1.5" fill="#FEF9C3" />
      {/* Vòng cổ đỏ & lục lạc */}
      <path d="M40 20 Q46 23 52 20" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="46" cy="23" r="2.5" fill="#FACC15" stroke="#B45309" strokeWidth="0.5" />
      {/* Đầu */}
      <circle cx="50" cy="16" r="9" fill="#EAB308" />
      <path d="M49 8 Q50 14 50 20 Q48 20 47 16 Z" fill="#FEF9C3" />
      {/* Tai trái */}
      <path d="M42 12 C38 15 37 22 41 24 C43 25 44 20 43 16 Z" fill="#A16207" />
      {/* Tai phải */}
      <path d="M56 10 C60 4 63 8 62 14 C61 18 58 19 56 16 Z" fill="#CA8A04" />
      {/* Mắt — mắt tròn xoè / hoa mắt khi awkward */}
      {awkward ? (
        <>
          <circle cx="47" cy="14" r="2.4" fill="#FFF" stroke="#181411" strokeWidth="0.8" />
          <circle cx="47" cy="14" r="1.1" fill="#181411" />
          <circle cx="53" cy="14" r="2.4" fill="#FFF" stroke="#181411" strokeWidth="0.8" />
          <circle cx="53" cy="14" r="1.1" fill="#181411" />
        </>
      ) : (
        <>
          <circle cx="47" cy="14" r="2" fill="#181411" />
          <circle cx="47.6" cy="13.4" r="0.6" fill="#FFF" />
          <circle cx="53" cy="14" r="2" fill="#181411" />
          <circle cx="53.6" cy="13.4" r="0.6" fill="#FFF" />
        </>
      )}
      {/* Mõm */}
      <ellipse cx="51" cy="19" rx="4.5" ry="3" fill="#FEF9C3" />
      <ellipse cx="51" cy="17.5" rx="1.8" ry="1.2" fill="#181411" />
      {/* Lưỡi thè ra bối rối */}
      {awkward ? (
        <path d="M50 21 C50 25 53 25 53 21 Z" fill="#F472B6" />
      ) : !night ? (
        <path d="M50 21 C50 24 52 24 52 21 Z" fill="#F472B6" />
      ) : null}
      {/* Má hồng dở khóc dở cười */}
      <circle cx="44" cy="18" r={awkward ? 2.2 : 1.4} fill="#F87171" opacity={awkward ? 0.8 : 0.5} />
      <circle cx="56" cy="18" r={awkward ? 2.2 : 1.4} fill="#F87171" opacity={awkward ? 0.8 : 0.5} />
    </svg>
  );
}

/** Corgi Bánh Bao — mông trái tim lon ton */
function WalkingCorgi({ awkward = false }: { awkward?: boolean }) {
  return (
    <svg width="62" height="42" viewBox="0 0 62 42" className="overflow-visible">
      <ellipse cx="31" cy="40" rx="24" ry="2" fill="rgba(62,42,27,0.14)" />
      {/* Mông trái tim + đuôi cộc */}
      <ellipse cx="12" cy="22" rx="9" ry="10" fill="#F59E0B" />
      <path d="M6 24 Q12 18 18 24 Q12 32 6 24 Z" fill="#FFFBEB" />
      <circle cx="12" cy="14" r="2.5" fill="#FFFBEB" />
      {/* Thân dài */}
      <ellipse cx="28" cy="22" rx="15" ry="9" fill="#F59E0B" />
      <ellipse cx="28" cy="26" rx="11" ry="4.5" fill="#FFFBEB" />
      {/* 4 chân ngắn ngủn */}
      <rect className="cit-lb" x="10" y="30" width="4.5" height="9" rx="2" fill="#D97706" style={{ transformOrigin: '12px 30px' }} />
      <rect className="cit-lf" x="17" y="30" width="4.5" height="9" rx="2" fill="#F59E0B" style={{ transformOrigin: '19px 30px' }} />
      <rect className="cit-lf" x="34" y="30" width="4.5" height="9" rx="2" fill="#F59E0B" style={{ transformOrigin: '36px 30px' }} />
      <rect className="cit-lb" x="40" y="30" width="4.5" height="9" rx="2" fill="#D97706" style={{ transformOrigin: '42px 30px' }} />
      {/* Nơ MoMo */}
      <circle cx="40" cy="16" r="2" fill="#EC4899" />
      <polygon points="38,16 36,13 36,19" fill="#EC4899" />
      <polygon points="42,16 44,13 44,19" fill="#EC4899" />
      {/* Đầu */}
      <circle cx="46" cy="14" r="7.5" fill="#F59E0B" />
      <path d="M45 7 Q46 12 46 18 Q44 18 43 14 Z" fill="#FFFBEB" />
      {/* Tai */}
      <polygon points="40,8 42,0 45,8" fill="#F59E0B" />
      <polygon points="41,8 42,2 44,8" fill="#FCA5A5" />
      <polygon points="47,7 50,0 53,7" fill="#F59E0B" />
      <polygon points="48,7 50,2 52,7" fill="#FCA5A5" />
      {/* Mắt — ngơ ngác khi dính lẹo */}
      {awkward ? (
        <>
          <circle cx="44" cy="13" r="2.2" fill="#FFF" stroke="#181411" strokeWidth="0.8" />
          <circle cx="44" cy="13" r="1" fill="#181411" />
          <circle cx="49" cy="13" r="2.2" fill="#FFF" stroke="#181411" strokeWidth="0.8" />
          <circle cx="49" cy="13" r="1" fill="#181411" />
        </>
      ) : (
        <>
          <circle cx="44" cy="13" r="1.6" fill="#181411" />
          <circle cx="44.5" cy="12.5" r="0.5" fill="#FFF" />
          <circle cx="49" cy="13" r="1.6" fill="#181411" />
          <circle cx="49.5" cy="12.5" r="0.5" fill="#FFF" />
        </>
      )}
      {/* Mõm */}
      <ellipse cx="47" cy="17" rx="4" ry="2.5" fill="#FFFBEB" />
      <ellipse cx="47" cy="16" rx="1.5" ry="1" fill="#181411" />
      <path d="M46 19 Q47 21 48 19 Z" fill="#F472B6" />
    </svg>
  );
}

/** Heo Chiêu Tài MoMo — lon ton nhún nhẩy */
function WalkingPiggy() {
  return (
    <svg width="54" height="42" viewBox="0 0 54 42" className="overflow-visible">
      <ellipse cx="27" cy="40" rx="18" ry="2" fill="rgba(62,42,27,0.14)" />
      {/* Đuôi xoăn */}
      <path d="M4 22 Q2 18 4 14 Q8 12 6 16" fill="none" stroke="#DB2777" strokeWidth="1.8" strokeLinecap="round" />
      {/* Thân tròn ú */}
      <ellipse cx="24" cy="24" rx="16" ry="12" fill="#F472B6" />
      <ellipse cx="24" cy="28" rx="11" ry="7" fill="#FCE7F3" />
      {/* Đồng tiền vàng may mắn */}
      <circle cx="24" cy="26" r="4.5" fill="#FACC15" stroke="#B45309" strokeWidth="0.6" />
      <rect x="22.5" y="24.5" width="3" height="3" fill="#B45309" />
      {/* 4 chân */}
      <rect className="cit-lb" x="12" y="32" width="4.5" height="8" rx="2" fill="#DB2777" style={{ transformOrigin: '14px 32px' }} />
      <rect className="cit-lf" x="18" y="32" width="4.5" height="8" rx="2" fill="#F472B6" style={{ transformOrigin: '20px 32px' }} />
      <rect className="cit-lf" x="28" y="32" width="4.5" height="8" rx="2" fill="#F472B6" style={{ transformOrigin: '30px 32px' }} />
      <rect className="cit-lb" x="34" y="32" width="4.5" height="8" rx="2" fill="#DB2777" style={{ transformOrigin: '36px 32px' }} />
      {/* Đầu */}
      <circle cx="40" cy="16" r="8" fill="#F472B6" />
      {/* Tai */}
      <polygon points="34,10 36,2 39,10" fill="#DB2777" />
      <polygon points="43,9 46,1 49,9" fill="#DB2777" />
      {/* Mắt híp */}
      <path d="M37 14 Q39 12 41 14" fill="none" stroke="#831843" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M43 14 Q45 12 47 14" fill="none" stroke="#831843" strokeWidth="1.2" strokeLinecap="round" />
      {/* Má hồng */}
      <circle cx="36" cy="17" r="1.8" fill="#FB7185" />
      <circle cx="46" cy="17" r="1.8" fill="#FB7185" />
      {/* Mũi heo */}
      <ellipse cx="42" cy="18" rx="3.5" ry="2.2" fill="#FB7185" stroke="#BE185D" strokeWidth="0.5" />
      <circle cx="41" cy="18" r="0.8" fill="#831843" />
      <circle cx="43" cy="18" r="0.8" fill="#831843" />
    </svg>
  );
}

/** Mèo Mun Tam Thể — kiêu sa nhón chân */
function WalkingCalico({ night }: { night: boolean }) {
  return (
    <svg width="56" height="44" viewBox="0 0 56 44" className="overflow-visible">
      <ellipse cx="28" cy="42" rx="19" ry="2.5" fill="rgba(62,42,27,0.14)" />
      {/* Đuôi chữ S dựng cao */}
      <path d="M4 26 C2 18 4 8 8 4 C10 2 12 8 10 14 C8 22 12 26 16 28 Z" fill="#1E293B" />
      {/* Thân tam thể */}
      <ellipse cx="26" cy="26" rx="14" ry="9" fill="#FFFFFF" />
      <path d="M14 22 Q20 18 24 24 Q20 32 14 28 Z" fill="#1E293B" />
      <path d="M28 22 Q34 24 34 30 Q28 32 26 26 Z" fill="#EA580C" />
      {/* Chân */}
      <rect className="cit-lb" x="14" y="32" width="4" height="10" rx="2" fill="#FFFFFF" style={{ transformOrigin: '16px 32px' }} />
      <rect className="cit-lf" x="20" y="32" width="4" height="10" rx="2" fill="#1E293B" style={{ transformOrigin: '22px 32px' }} />
      <rect className="cit-lf" x="32" y="32" width="4" height="10" rx="2" fill="#FFFFFF" style={{ transformOrigin: '34px 32px' }} />
      <rect className="cit-lb" x="36" y="32" width="4" height="10" rx="2" fill="#EA580C" style={{ transformOrigin: '38px 32px' }} />
      {/* Chuông bạc */}
      <path d="M36 18 Q40 20 44 18" stroke="#0284C7" strokeWidth="1.6" />
      <circle cx="40" cy="20" r="1.8" fill="#E2E8F0" stroke="#64748B" strokeWidth="0.4" />
      {/* Đầu */}
      <circle cx="42" cy="14" r="7.5" fill="#FFFFFF" />
      <ellipse cx="39" cy="13" rx="3.5" ry="3" fill="#1E293B" />
      <ellipse cx="46" cy="15" rx="3" ry="2.5" fill="#EA580C" />
      {/* Tai */}
      <polygon points="36,8 38,0 41,8" fill="#1E293B" />
      <polygon points="37,8 38,2 40,8" fill="#FCA5A5" />
      <polygon points="43,7 46,0 49,7" fill="#EA580C" />
      <polygon points="44,7 46,2 48,7" fill="#FCA5A5" />
      {/* Mắt xanh ngọc */}
      <circle cx="39" cy="12" r="1.8" fill={night ? '#FEF08A' : '#10B981'} />
      <circle cx="39" cy="12" r="0.7" fill="#0F172A" />
      <circle cx="45" cy="12" r="1.8" fill={night ? '#FEF08A' : '#10B981'} />
      <circle cx="45" cy="12" r="0.7" fill="#0F172A" />
      {/* Mũi & ria */}
      <polygon points="42,15 43,16 41,16" fill="#F43F5E" />
      <line x1="38" y1="16" x2="33" y2="15" stroke="#64748B" strokeWidth="0.7" />
      <line x1="38" y1="17" x2="33" y2="18" stroke="#64748B" strokeWidth="0.7" />
      <line x1="46" y1="16" x2="51" y2="15" stroke="#64748B" strokeWidth="0.7" />
      <line x1="46" y1="17" x2="51" y2="18" stroke="#64748B" strokeWidth="0.7" />
    </svg>
  );
}

/** Chim Bay Trên Bầu Trời Phố Xá — vỗ cánh bay ngang */
function FlyingBirdGraphic({ night }: { night: boolean }) {
  return (
    <svg width="44" height="32" viewBox="0 0 44 32" className="overflow-visible select-none">
      {/* Cánh chim vỗ nhịp */}
      <g className="bird-flapping" style={{ transformOrigin: '20px 16px' }}>
        <path
          d="M18 16 Q10 4 2 8 Q8 14 16 18 Z"
          fill={night ? '#334155' : '#D97706'}
          stroke={night ? '#1E293B' : '#B45309'}
          strokeWidth="0.8"
        />
        <path
          d="M22 15 Q28 2 38 6 Q32 12 24 17 Z"
          fill={night ? '#475569' : '#F59E0B'}
          stroke={night ? '#1E293B' : '#D97706'}
          strokeWidth="0.8"
        />
      </g>
      {/* Đuôi chim */}
      <polygon points="6,18 0,22 2,16" fill={night ? '#1E293B' : '#78350F'} />
      {/* Thân chim */}
      <ellipse cx="20" cy="18" rx="10" ry="6" fill={night ? '#38BDF8' : '#FBBF24'} />
      <ellipse cx="22" cy="20" rx="7" ry="3.5" fill="#FFFBEB" />
      {/* Đầu & mào */}
      <circle cx="28" cy="14" r="5" fill={night ? '#0284C7' : '#D97706'} />
      <polygon points="26,10 28,4 30,10" fill={night ? '#0284C7' : '#B45309'} />
      {/* Mỏ vàng cam */}
      <polygon points="32,13 38,15 32,17" fill="#F97316" />
      {/* Mắt tròn xoe */}
      <circle cx="29" cy="13" r="1.4" fill="#FFFFFF" />
      <circle cx="29.3" cy="13" r="0.7" fill="#181411" />
      {/* Nốt nhạc bay theo khi trời sáng */}
      {!night && (
        <text x="32" y="6" fill="#EC4899" fontSize="8" style={{ animation: 'noteFloat 2.2s ease-in-out infinite' }}>
          🎶
        </text>
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WALK CSS — CSS walk-cycle giống ExpressiveStreetCitizens
// ─────────────────────────────────────────────────────────────────────────────
const WALK_CSS = `
.pet-walk .cit-lb { animation: petLB var(--walk-spd,0.5s) linear infinite; }
.pet-walk .cit-lf { animation: petLF var(--walk-spd,0.5s) linear infinite; }
@keyframes petLF { 0%,100%{transform:rotate(-18deg)} 50%{transform:rotate(18deg)} }
@keyframes petLB { 0%,100%{transform:rotate(18deg)}  50%{transform:rotate(-18deg)} }
`;

// ─────────────────────────────────────────────────────────────────────────────
// DATA — Các bé pet di chuyển trên vỉa hè
// ─────────────────────────────────────────────────────────────────────────────

interface WalkingPetDef {
  id: string;
  name: string;
  species: 'CAT' | 'DOG' | 'PIG';
  El: React.ComponentType<{ night: boolean; awkward?: boolean }>;
  startX: number;
  speed: number; // px/s
  startDir: 1 | -1;
  rewardCoins: number;
  emoji: string;
  quotes: string[];
}

const WALKING_PETS: WalkingPetDef[] = [
  {
    id: 'pet-cat-miumiu', name: 'Mèo Miu Miu', species: 'CAT',
    El: WalkingCat, startX: 420, speed: 18, startDir: 1, rewardCoins: 15, emoji: '🐾',
    quotes: [
      'Meo meo~ Miu Miu được gãi cằm sướng rù rù... (=^･ω･^=)',
      'Đi dạo hóng mát rồi về tiệm ngủ tiếp nhen Thị Trưởng!',
      'Meo~ Chúc bà con buôn may bán đắt như tôm tươi!',
    ],
  },
  {
    id: 'pet-dog-cauvang', name: 'Cậu Vàng', species: 'DOG',
    El: WalkingDog, startX: 780, speed: 26, startDir: -1, rewardCoins: 20, emoji: '🐕',
    quotes: [
      'Gâu gâu! Cậu Vàng tuần tra vỉa hè: Tiệm nào cũng đông khách!',
      'Gâu! Em đánh hơi thấy có ai đang quét QR MoMo gần đây!',
      'Gâu gâu gâu! Đi dạo mà gặp Thị Trưởng, vui quá chừng!',
    ],
  },
  {
    id: 'pet-corgi-banhbao', name: 'Corgi Bánh Bao', species: 'DOG',
    El: WalkingCorgi, startX: 1230, speed: 22, startDir: 1, rewardCoins: 20, emoji: '🐶',
    quotes: [
      'Ẳng ẳng! Bánh Bao lắc mông trái tim xin Thị Trưởng xúc xích!',
      'Gâu ẳng! Chân ngắn nhưng em đi tuần khắp vỉa hè không mệt nha!',
      'Ẳng! Em đi dạo đếm tiệm: tiệm nào cũng đẹp hết trơn!',
    ],
  },
  {
    id: 'pet-piggy-chieutai', name: 'Bé Heo Chiêu Tài', species: 'PIG',
    El: WalkingPiggy, startX: 1640, speed: 16, startDir: -1, rewardCoins: 30, emoji: '🐷',
    quotes: [
      'Ủn ỉn~ Tiền vào như nước, tích lũy sinh lời cùng MoMo nha!',
      'Éc éc~ Heo em đi giao lộc phát tài cho từng cửa hàng!',
      'Ủn ỉn~ Túi Thần Tài lãi suất đều đặn, heo em no ú nu!',
    ],
  },
  {
    id: 'pet-cat-mun', name: 'Mèo Mun Tam Thể', species: 'CAT',
    El: WalkingCalico, startX: 1920, speed: 20, startDir: 1, rewardCoins: 15, emoji: '🐾',
    quotes: [
      'Meo~! Bé Mun cọ đầu vào tay Thị Trưởng, tặng dấu chân may mắn!',
      'Gừ gừ... Mèo tam thể mang lại phú quý cho gia chủ!',
      'Meo~ Em đi tuần canh chuột cho cả dãy phố ngủ ngon!',
    ],
  },
];

// Chim bay tự do trên bầu trời phố
const FLYING_BIRD_DEF = {
  id: 'pet-bird-bayluon',
  name: 'Chào Mào Bay Lượn',
  species: 'BIRD' as const,
  rewardCoins: 25,
  emoji: '🕊️',
  quotes: [
    'Líu lo líu lo! Chim tự do sải cánh rợp trời MoCity!',
    'Ríu rít ríu rít! Ngắm phố xá từ trên cao đẹp lung linh Thị Trưởng ơi!',
    'Chích chòe líu lo! Tiếng hót chào ngày mới bình an phát tài!',
  ],
};

// Thoại dở khóc dở cười lúc 2 con chó "dính lẹo"
const DINH_LEO_QUOTES = [
  'Ủa ủa... sao dính cứng ngắc rồi anh Vàng ơi?! Quê xỉu luôn á! 😭🐶',
  'Cứu tụi tui với Thị Trưởng ơi! Ai tạt ca nước lạnh gỡ ra giùm cái! 💦🐕',
  'Trời ơi bà con cô bác đừng nhìn nữa... tụi tui xin chừa rồi! 😳🙈',
  'Mông chạm mông không rời được... kiếp nạn thứ 82 của Cậu Vàng & Corgi! 🤣',
];

/** Mutable sim state cho mỗi pet */
interface PetSim {
  x: number;
  dir: 1 | -1;
  speed: number;
  baseSpeed: number;
  behavior: 'WALKING' | 'IDLE';
  behaviorTimer: number; // seconds remaining
  walkPhase: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StreetPets({
  timeOfDay,
  streetWidth = 2400,
  onPetReward,
}: {
  timeOfDay: TimeOfDay;
  streetWidth?: number;
  onPetReward?: (toast: string) => void;
}) {
  const isNight = timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET';
  /** Tên người chơi để thú cưng xưng hô thay cho "Thị Trưởng". */
  const mayorName = useCity((s) => s.mayorName);

  const [activeSpeech, setActiveSpeech] = useState<{ petId: string; text: string; dir: number } | null>(null);
  const [effects, setEffects] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  // State dính lẹo (trigger định kỳ hoặc khi 2 con chó va chạm)
  const [dinhLeoActive, setDinhLeoActive] = useState(false);
  const dinhLeoTimerRef = useRef<number>(0);
  const nextDinhLeoCooldownRef = useRef<number>(35 + Math.random() * 25); // Sau 35-60s là xuất hiện

  // Chim bay lượn state
  const birdRef = useRef<HTMLDivElement | null>(null);
  const birdSimRef = useRef({
    x: 100,
    y: 28,
    dir: 1 as 1 | -1,
    speed: 68,
    dipPhase: 0,
  });

  // DOM refs cho mỗi pet walking
  const domRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sim state
  const simsRef = useRef<PetSim[]>(
    WALKING_PETS.map((p) => ({
      x: p.startX,
      dir: p.startDir,
      speed: p.speed,
      baseSpeed: p.speed,
      behavior: 'WALKING' as const,
      behaviorTimer: 8 + Math.random() * 10,
      walkPhase: 0,
    })),
  );

  const streetWidthRef = useRef(streetWidth);
  useEffect(() => {
    streetWidthRef.current = Math.max(1200, streetWidth);
  }, [streetWidth]);

  // ═══ VÒNG LẶP VẬT LÝ 60 FPS ═══
  useEffect(() => {
    let animId: number;
    let last = performance.now();

    const WALK_MIN_X = 160;
    const IDLE_WALK_S = [8, 14];
    const IDLE_REST_S = [3, 6];

    // Vị trí index của Cậu Vàng (1) và Corgi (2)
    const DOG_VANG_IDX = 1;
    const CORGI_IDX = 2;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.08);
      last = now;
      const maxX = streetWidthRef.current - 80;

      // 1. Cập nhật chim bay
      const bSim = birdSimRef.current;
      bSim.x += bSim.dir * bSim.speed * dt;
      bSim.dipPhase += dt * 3;
      const birdY = 22 + Math.sin(bSim.dipPhase) * 12; // Lượn sóng nhịp nhàng

      if (bSim.dir === 1 && bSim.x > streetWidthRef.current + 80) {
        bSim.x = -60;
        bSim.dir = 1;
        bSim.speed = 60 + Math.random() * 25;
      } else if (bSim.dir === -1 && bSim.x < -80) {
        bSim.x = streetWidthRef.current + 60;
        bSim.dir = -1;
        bSim.speed = 60 + Math.random() * 25;
      }

      const birdEl = birdRef.current;
      if (birdEl) {
        birdEl.style.transform = `translate(${bSim.x.toFixed(1)}px, ${birdY.toFixed(1)}px) scaleX(${bSim.dir})`;
      }

      // 2. Kiểm tra sự kiện DÍNH LẸO
      if (dinhLeoTimerRef.current > 0) {
        dinhLeoTimerRef.current -= dt;
        // Trong lúc dính lẹo: hai bé chó bị khóa vị trí mông-áp-mông, kéo giằng co nhẹ
        const dogVang = simsRef.current[DOG_VANG_IDX];
        const corgi = simsRef.current[CORGI_IDX];
        const midX = (dogVang.x + corgi.x) / 2;

        // Cậu Vàng quay mặt sang trái, Corgi quay mặt sang phải (hoặc ngược lại)
        dogVang.x = midX - 22;
        dogVang.dir = -1;
        dogVang.speed = 0;
        dogVang.behavior = 'IDLE';

        corgi.x = midX + 22;
        corgi.dir = 1;
        corgi.speed = 0;
        corgi.behavior = 'IDLE';

        if (dinhLeoTimerRef.current <= 0) {
          // Hết dính lẹo: tách nhau ra chạy té khói về hai phía
          setDinhLeoActive(false);
          dogVang.dir = -1;
          dogVang.speed = dogVang.baseSpeed * 1.8;
          dogVang.behavior = 'WALKING';
          dogVang.behaviorTimer = 6;

          corgi.dir = 1;
          corgi.speed = corgi.baseSpeed * 1.8;
          corgi.behavior = 'WALKING';
          corgi.behaviorTimer = 6;

          nextDinhLeoCooldownRef.current = 60 + Math.random() * 45; // 60-105s sau mới có lại
        }
      } else {
        // Đếm cooldown kích hoạt dính lẹo
        nextDinhLeoCooldownRef.current -= dt;
        const dogVang = simsRef.current[DOG_VANG_IDX];
        const corgi = simsRef.current[CORGI_IDX];
        const dist = Math.abs(dogVang.x - corgi.x);

        // Kích hoạt khi cooldown về 0 VÀ hai con chó ở khoảng cách gần nhau (< 180px)
        // Hoặc tự hút lại gần nhau nếu đã quá thời gian
        if (nextDinhLeoCooldownRef.current <= 0) {
          if (dist < 120) {
            // Snap vào dính lẹo!
            setDinhLeoActive(true);
            dinhLeoTimerRef.current = 10; // Dính lẹo trong 10 giây
            const quote = chonNgauNhien(DINH_LEO_QUOTES);
            setActiveSpeech({ petId: 'dinh-leo-pair', text: quote, dir: 1 });
            // Tạo effect giọt nước / mồ hôi
            setEffects((p) => [
              ...p,
              { id: Date.now(), text: '💦 Quê Xỉu!', x: (dogVang.x + corgi.x) / 2, y: 35 },
            ]);
            setTimeout(() => setEffects((p) => p.slice(1)), 2500);
          } else {
            // Cho 2 con chó đi hướng về phía nhau để chạm trán
            if (dogVang.x < corgi.x) {
              dogVang.dir = 1;
              corgi.dir = -1;
            } else {
              dogVang.dir = -1;
              corgi.dir = 1;
            }
          }
        }
      }

      // 3. Cập nhật các pet đi bộ bình thường
      for (let i = 0; i < simsRef.current.length; i++) {
        const sim = simsRef.current[i];

        // Nếu đang dính lẹo thì bỏ qua logic di chuyển ngẫu nhiên của 2 chó
        if (dinhLeoTimerRef.current > 0 && (i === DOG_VANG_IDX || i === CORGI_IDX)) {
          // Bỏ qua
        } else {
          sim.behaviorTimer -= dt;
          if (sim.behaviorTimer <= 0) {
            if (sim.behavior === 'WALKING') {
              sim.behavior = 'IDLE';
              sim.behaviorTimer = IDLE_REST_S[0] + Math.random() * (IDLE_REST_S[1] - IDLE_REST_S[0]);
              sim.speed = 0;
            } else {
              sim.behavior = 'WALKING';
              sim.behaviorTimer = IDLE_WALK_S[0] + Math.random() * (IDLE_WALK_S[1] - IDLE_WALK_S[0]);
              if (Math.random() < 0.35) sim.dir = (sim.dir * -1) as 1 | -1;
              sim.speed = sim.baseSpeed;
            }
          }

          if (sim.behavior === 'WALKING') {
            sim.x += sim.dir * sim.speed * dt;
            sim.walkPhase += dt;

            if (sim.x > maxX) { sim.x = maxX; sim.dir = -1; }
            if (sim.x < WALK_MIN_X) { sim.x = WALK_MIN_X; sim.dir = 1; }
          }
        }

        // Cập nhật DOM
        const el = domRefs.current[WALKING_PETS[i].id];
        if (el) {
          el.style.transform = `translateX(${sim.x.toFixed(1)}px) scaleX(${sim.dir})`;

          if (sim.behavior === 'WALKING') {
            if (!el.classList.contains('pet-walk')) {
              el.classList.add('pet-walk');
              el.classList.remove('pet-idle-anim');
            }
          } else {
            if (!el.classList.contains('pet-idle-anim')) {
              el.classList.remove('pet-walk');
              el.classList.add('pet-idle-anim');
            }
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Tự động tắt speech bubble
  useEffect(() => {
    if (!activeSpeech) return;
    const t = setTimeout(() => setActiveSpeech(null), 3800);
    return () => clearTimeout(t);
  }, [activeSpeech]);

  // Xử lý tap chim bay
  const handleTapBird = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = claimTapReward('pet', FLYING_BIRD_DEF.rewardCoins, { cooldownMs: 1800 });
    const quote = fillTen(chonNgauNhien(FLYING_BIRD_DEF.quotes), mayorName);
    const bSim = birdSimRef.current;
    setActiveSpeech({ petId: FLYING_BIRD_DEF.id, text: quote, dir: bSim.dir });

    setEffects((p) => [
      ...p,
      { id: Date.now() + Math.random(), text: `🪶 +${FLYING_BIRD_DEF.rewardCoins}đ`, x: bSim.x + 20, y: bSim.y + 10 },
    ]);
    setTimeout(() => setEffects((p) => p.slice(1)), 1400);

    // Tăng tốc chim vỗ cánh bay vụt đi một đoạn
    bSim.speed = 110;
    setTimeout(() => { bSim.speed = 68; }, 2000);

    if (result.ok) {
      onPetReward?.(`${FLYING_BIRD_DEF.emoji} ${FLYING_BIRD_DEF.name}: "${quote}" (+${FLYING_BIRD_DEF.rewardCoins}đ)`);
    } else {
      onPetReward?.(`${FLYING_BIRD_DEF.emoji} ${FLYING_BIRD_DEF.name}: "${quote}"`);
    }
  };

  // Xử lý tap dính lẹo (giải cứu 2 con chó)
  const handleTapDinhLeo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dinhLeoActive) return;

    // Người chơi bấm giải cứu: tạt nước lạnh gỡ ra và nhận thưởng nóng
    claimTapReward('pet', 50, { cooldownMs: 3000 });
    dinhLeoTimerRef.current = 0.1; // Giải thoát ngay lập tức

    const dogVang = simsRef.current[1];
    const corgi = simsRef.current[2];
    const midX = (dogVang.x + corgi.x) / 2;

    setEffects((p) => [
      ...p,
      { id: Date.now(), text: '🌊💦 GỠ ĐƯỢC RỒI! (+50đ)', x: midX - 30, y: 20 },
    ]);
    setTimeout(() => setEffects((p) => p.slice(1)), 1800);

    setActiveSpeech({
      petId: 'dinh-leo-pair',
      text: fillTen('Ôi cảm ơn Thị Trưởng đã tạt nước giải cứu! Tụi em chạy trốn đây! 🏃‍♂️💨', mayorName),
      dir: 1,
    });

    onPetReward?.(fillTen('💦 Giải cứu đôi bạn Cậu Vàng & Corgi dính lẹo thành công! (+50đ thưởng Thị Trưởng)', mayorName));
  };

  // Xử lý tap pet đi bộ bình thường
  const handleTap = (
    pet: { id: string; name: string; species: string; rewardCoins: number; emoji: string; quotes: string[] },
    simIndex: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    // Nếu đang trong cảnh dính lẹo mà bấm vào 1 trong 2 chó -> chuyển sang xử lý giải cứu
    if (dinhLeoActive && (pet.id === 'pet-dog-cauvang' || pet.id === 'pet-corgi-banhbao')) {
      handleTapDinhLeo(e);
      return;
    }

    const result = claimTapReward('pet', pet.rewardCoins, { cooldownMs: 1800 });
    const quote = fillTen(chonNgauNhien(pet.quotes), mayorName);
    const petDir = simsRef.current[simIndex].dir;
    setActiveSpeech({ petId: pet.id, text: quote, dir: petDir });

    const effectIcon = pet.species === 'CAT' ? '❤️' : pet.species === 'DOG' ? '🦴' : '💰';
    const effX = simsRef.current[simIndex].x + 20;
    const effY = 50;
    setEffects((p) => [...p, { id: Date.now() + Math.random(), text: effectIcon, x: effX, y: effY }]);
    setTimeout(() => setEffects((p) => p.slice(1)), 1200);

    // Khi bấm, pet dừng lại vài giây
    const sim = simsRef.current[simIndex];
    sim.behavior = 'IDLE';
    sim.speed = 0;
    sim.behaviorTimer = 4;

    if (result.ok) {
      onPetReward?.(`${pet.emoji} ${pet.name}: "${quote}" (+${pet.rewardCoins}đ)`);
    } else {
      onPetReward?.(`${pet.emoji} ${pet.name}: "${quote}"`);
    }
  };

  const dogVangSim = simsRef.current[1];
  const corgiSim = simsRef.current[2];
  const dinhLeoMidX = (dogVangSim.x + corgiSim.x) / 2;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PETS_CSS + WALK_CSS }} />

      {/* ═══ CHIM BAY TỰ DO TRÊN TRỜI PHỐ (THAY THẾ LỒNG CHIM) ═══ */}
      <div
        ref={birdRef}
        onClick={handleTapBird}
        className="group absolute z-30 cursor-pointer select-none pointer-events-auto"
        style={{
          top: 0,
          left: 0,
          transformOrigin: '22px 16px',
        }}
        title="🕊️ Chào Mào Bay Lượn (Bấm để nhận lộc đồng may mắn)"
      >
        {activeSpeech?.petId === FLYING_BIRD_DEF.id && (
          <div
            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
            style={{ animation: 'petBubblePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          >
            <div className="whitespace-nowrap rounded-xl border border-[#0284C7] bg-[#F0F9FF] px-2.5 py-1 text-[11px] font-bold text-[#0369A1] shadow-md">
              {activeSpeech.text}
            </div>
            <div className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-[#0284C7]" />
          </div>
        )}
        <div style={{ animation: 'birdGlide 3s ease-in-out infinite' }}>
          <FlyingBirdGraphic night={isNight} />
        </div>
      </div>

      {/* ═══ BUBBLE & HIỆU ỨNG RIÊNG CHO 2 CON CHÓ DÍNH LẸO ═══ */}
      {dinhLeoActive && (
        <div
          onClick={handleTapDinhLeo}
          className="absolute z-30 cursor-pointer select-none pointer-events-auto"
          style={{
            bottom: 48,
            left: dinhLeoMidX - 110,
            width: 220,
          }}
          title="💦 Bấm nhanh để tạt nước giải cứu 2 bạn cún!"
        >
          {/* Mồ hôi rơi vương vãi */}
          <div className="pointer-events-none absolute -top-4 left-1/4 text-sm" style={{ animation: 'sweatDrop 1.2s infinite' }}>💦</div>
          <div className="pointer-events-none absolute -top-3 right-1/4 text-sm" style={{ animation: 'sweatDrop 1.2s 0.6s infinite' }}>💦</div>

          {/* Bong bóng kêu cứu */}
          <div
            className="flex flex-col items-center"
            style={{ animation: 'petBubblePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          >
            <div className="rounded-xl border-2 border-red-500 bg-amber-50 px-2.5 py-1.5 text-center text-[11px] font-extrabold text-red-700 shadow-xl animate-pulse">
              {activeSpeech?.petId === 'dinh-leo-pair'
                ? activeSpeech.text
                : '😱 DÍNH LẸO RỒI! Bấm tạt nước cứu tụi em với! 💦'}
            </div>
            <div className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-red-500" />
          </div>
        </div>
      )}

      {/* ═══ WALKING PETS ═══ */}
      {WALKING_PETS.map((pet, i) => {
        const PetEl = pet.El;
        const isSpeaking = activeSpeech?.petId === pet.id;
        const isDinhLeoDog = dinhLeoActive && (pet.id === 'pet-dog-cauvang' || pet.id === 'pet-corgi-banhbao');

        return (
          <div
            key={pet.id}
            ref={(el) => { domRefs.current[pet.id] = el; }}
            onClick={(e) => handleTap(pet, i, e)}
            className={`absolute z-20 cursor-pointer select-none pointer-events-auto pet-walk ${
              isDinhLeoDog ? 'dinh-leo-wiggle' : ''
            }`}
            style={{
              bottom: 12,
              left: 0,
              transform: `translateX(${pet.startX}px) scaleX(${pet.startDir})`,
              ['--walk-spd' as string]: `${0.28 + 0.1 * (1 / (pet.speed / 20))}s`,
            }}
            title={`${pet.emoji} ${pet.name} ${isDinhLeoDog ? '(Đang dính lẹo - bấm để gỡ!)' : '(Bấm để cưng nựng)'}`}
          >
            {/* Bong bóng thoại thường — flip text nếu pet đang scaleX(-1) */}
            {isSpeaking && !dinhLeoActive && (
              <div
                className="pointer-events-none absolute -top-10 left-1/2 z-30 flex flex-col items-center"
                style={{
                  animation: 'petBubblePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transform: `translateX(-50%) scaleX(${activeSpeech!.dir})`,
                }}
              >
                <div className="whitespace-nowrap rounded-xl border border-[#78533D] bg-[#FFFDF7] px-3 py-1.5 text-xs font-bold text-[#3E2A1B] shadow-md">
                  {activeSpeech!.text}
                </div>
                <div className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-[#78533D]" />
              </div>
            )}

            {/* Wrapper bob lên xuống khi đi hoặc giật giật khi dính lẹo */}
            <div className={isDinhLeoDog ? '' : 'pet-walking'}>
              <PetEl night={isNight} awkward={isDinhLeoDog} />
            </div>
          </div>
        );
      })}

      {/* ═══ HIỆU ỨNG BAY LÊN (COINS, TIM, NƯỚC) ═══ */}
      {effects.map((eff) => (
        <div
          key={eff.id}
          className="pointer-events-none absolute z-40 select-none text-xs font-black text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded shadow border border-amber-300"
          style={{ left: eff.x, top: eff.y, animation: 'heartSparkle 1.2s cubic-bezier(0.2,0.8,0.2,1) forwards' }}
        >
          {eff.text}
        </div>
      ))}
    </>
  );
}

