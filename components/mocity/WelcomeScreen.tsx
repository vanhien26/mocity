'use client';

import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { formatCompact } from '@/lib/mocity/format';
import { STARTING_COINS } from '@/lib/mocity/store';
import IntroStory from './IntroStory';
import {
  CoinIcon,
  GiftBoxIcon,
  MayorStarIcon,
  BuildHammerIcon,
  DialogueBadgeIcon,
  DebtContractIcon,
} from './GameIcons';

/** Hằng số thưởng nhậm chức, phải khớp `LOGIN_BONUS_COINS` trong page (10.000.000 VNĐ). */
export const WELCOME_FIRST_TIME_BONUS = 10_000_000;

export interface WelcomeScreenProps {
  /** Ten hien thi tu tai khoan da dang nhap. */
  displayName: string | null;
  hasNamedCity: boolean;
  mayorName: string;
  cityName: string;
  coins: number;
  buildingCount: number;
  npcCount: number;
  mayorLevel: number;
  offlineBonus: number;
  mayorInput: string;
  cityInput: string;
  onMayorInputChange: (value: string) => void;
  onCityInputChange: (value: string) => void;
  onStart: () => void;
}

/** Logo MoCity - Toà nhà 3D hình chữ M với huân chương ngôi sao vàng kim */
function MoCityLogo({ size = 68 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="shrink-0 select-none drop-shadow-[0_4px_8px_rgba(216,45,139,0.35)]"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="logoBg" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="35%" stopColor="#EC4899" />
          <stop offset="85%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#831843" />
        </radialGradient>
        <linearGradient id="logoGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      {/* Vành vàng nổi 3D */}
      <circle cx="32" cy="33.5" r="30" fill="#78350F" />
      <circle cx="32" cy="32" r="30" fill="url(#logoGoldRim)" />
      <circle cx="32" cy="32" r="27.5" fill="url(#logoBg)" stroke="#831843" strokeWidth="1" />

      {/* Đường phố vàng vỉa hè */}
      <rect x="10" y="47" width="44" height="6" rx="2" fill="#FDE047" opacity="0.4" />

      {/* Toà nhà trái */}
      <rect x="11" y="32" width="10" height="17" rx="1.5" fill="#FFFDF7" stroke="#831843" strokeWidth="0.75" />
      <rect x="13" y="35" width="2.5" height="3" rx="0.5" fill="#DB2777" />
      <rect x="17" y="35" width="2.5" height="3" rx="0.5" fill="#DB2777" />
      <rect x="13" y="41" width="2.5" height="3" rx="0.5" fill="#DB2777" />
      <rect x="17" y="41" width="2.5" height="3" rx="0.5" fill="#DB2777" />

      {/* Toà nhà chính giữa - Chữ M */}
      <rect x="23" y="18" width="18" height="31" rx="2.5" fill="#FFFFFF" stroke="#831843" strokeWidth="1" />
      {/* Cửa sổ Chữ M */}
      <rect x="26" y="22" width="4" height="4.5" rx="0.75" fill="#BE185D" />
      <rect x="34" y="22" width="4" height="4.5" rx="0.75" fill="#BE185D" />
      <rect x="26" y="29.5" width="4" height="4.5" rx="0.75" fill="#BE185D" />
      <rect x="34" y="29.5" width="4" height="4.5" rx="0.75" fill="#BE185D" />
      <rect x="27.5" y="39" width="9" height="10" rx="1" fill="#9D174D" />
      <circle cx="34" cy="44" r="0.75" fill="#FDE047" />

      {/* Toà nhà phải */}
      <rect x="43" y="27" width="10" height="22" rx="1.5" fill="#FFFDF7" stroke="#831843" strokeWidth="0.75" />
      <rect x="45" y="30" width="2.5" height="3" rx="0.5" fill="#DB2777" />
      <rect x="49" y="30" width="2.5" height="3" rx="0.5" fill="#DB2777" />
      <rect x="45" y="36" width="2.5" height="3" rx="0.5" fill="#DB2777" />
      <rect x="49" y="36" width="2.5" height="3" rx="0.5" fill="#DB2777" />

      {/* Ngôi sao vàng kim 3D trên đỉnh */}
      <polygon
        points="32,7 34,12 39.5,12 35,15.5 36.8,20.5 32,17.5 27.2,20.5 29,15.5 24.5,12 30,12"
        fill="#FEF08A"
        stroke="#78350F"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WelcomeScreen({
  displayName,
  hasNamedCity,
  mayorName,
  cityName,
  coins,
  buildingCount,
  npcCount,
  mayorLevel,
  offlineBonus,
  mayorInput,
  cityInput,
  onMayorInputChange,
  onCityInputChange,
  onStart,
}: WelcomeScreenProps) {
  const firstTimeBonus = hasNamedCity ? 0 : WELCOME_FIRST_TIME_BONUS;
  const loginBonus = firstTimeBonus + offlineBonus;
  const greeting = displayName?.trim() || 'bạn';

  const [introDone, setIntroDone] = useState(hasNamedCity);

  if (!introDone) {
    return <IntroStory onFinish={() => setIntroDone(true)} />;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mocity-welcome-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-[#140F12]/80 p-4 backdrop-blur-md"
    >
      <div className="relative my-8 w-full max-w-[560px]">
        {/* Khung Card Game dày dặn, viền vàng kim 3D */}
        <div className="overflow-hidden rounded-3xl border-[3px] border-[#C9A227] bg-[#FAF6ED] shadow-[0_24px_64px_rgba(0,0,0,0.75),inset_0_2px_0_rgba(255,255,255,0.8)]">
          {/* Header Chào Mừng */}
          <div className="flex items-start gap-4 border-b-2 border-[#C9A22733] bg-gradient-to-br from-[#FFFDF7] via-[#FFF9EE] to-[#FDF2F8] p-5">
            <span className="flex shrink-0 items-center justify-center rounded-2xl border-2 border-[#E7D9BC] bg-gradient-to-b from-white to-[#FDF2F8] p-1 shadow-md">
              <MoCityLogo size={64} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D97706]/40 bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-[#92400E]">
                ✨ Chào mừng {greeting}
              </span>
              <h1
                id="mocity-welcome-title"
                className="mt-1 text-balance text-xl font-black leading-tight text-[#3E2A1B] sm:text-2xl"
              >
                {hasNamedCity ? `Mừng bạn trở lại, ${mayorName}!` : 'Lên Phố Lập Nghiệp'}
              </h1>
              <p className="mt-1 text-pretty text-[12px] leading-relaxed text-[#6E4F3A] sm:text-[13px]">
                {hasNamedCity
                  ? `Khu phố ${cityName} đang chờ bạn. Tiếp tục kinh doanh, trả nợ và xây dựng cơ đồ.`
                  : 'Bạn lên thành phố với 50 triệu vốn và 200 triệu nợ. Thị trưởng là người cai quản đô thị - bạn chỉ là một người lập nghiệp cần chứng minh mình.'}
              </p>
            </div>
            {hasNamedCity && (
              <button
                type="button"
                onClick={onStart}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#D5CEBF] bg-white text-[#6E4F3A] shadow-sm transition-transform hover:scale-105 hover:border-[#D82D8B] hover:text-[#D82D8B] active:scale-95"
                aria-label="Vào thẳng đô thị"
                title="Vào thẳng đô thị"
              >
                <X size={15} className="shrink-0" />
              </button>
            )}
          </div>

          {/* Thông tin thành phố hiện có (người chơi cũ) */}
          {hasNamedCity && (
            <div className="border-b-2 border-[#C9A22733] bg-[#FDFBF7] px-5 py-4">
              <h2 className="text-[12px] font-black uppercase tracking-wider text-[#8B7355]">
                Thành phố của bạn
              </h2>
              <dl className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { label: 'Cấp Phố', value: `Cấp ${mayorLevel}`, Icon: MayorStarIcon },
                  { label: 'Tiệm Đã Mở', value: `${buildingCount} tiệm`, Icon: BuildHammerIcon },
                  { label: 'Cư Dân', value: `${npcCount} người`, Icon: DialogueBadgeIcon },
                  { label: 'Ngân Khố', value: `${formatCompact(coins)}đ`, Icon: CoinIcon },
                ].map(({ label, value, Icon }) => (
                  <div
                    key={label}
                    className="flex min-w-0 items-center gap-2 rounded-2xl border-2 border-[#E5DEC9] bg-white p-2.5 shadow-sm"
                  >
                    <Icon size={24} />
                    <div className="min-w-0">
                      <dt className="truncate text-[10px] font-black uppercase tracking-wide text-[#8B7355]">
                        {label}
                      </dt>
                      <dd className="truncate text-xs font-black text-[#3E2A1B]">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Nhập tên nhân vật (người mới) */}
          {!hasNamedCity && (
            <div className="border-b-2 border-[#C9A22733] bg-[#FDFBF7] px-5 py-4">
              <div className="flex items-center gap-2">
                <DebtContractIcon size={24} />
                <h2 className="text-[13px] font-black uppercase tracking-wide text-[#6E4F3A]">
                  Bạn là ai trên phố?
                </h2>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-[#6E4F3A]">
                Người ta sẽ gọi bạn bằng cái tên này khi giao thương trên vỉa hè MoCity.
              </p>
              <div className="mt-3">
                <label
                  htmlFor="mocity-mayor-name"
                  className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#8B7355]"
                >
                  Tên của bạn
                </label>
                <input
                  id="mocity-mayor-name"
                  type="text"
                  maxLength={28}
                  value={mayorInput}
                  onChange={(e) => onMayorInputChange(e.target.value)}
                  placeholder={displayName?.trim() || 'Người Lập Nghiệp'}
                  className="w-full rounded-2xl border-2 border-[#D5CEBF] bg-white px-4 py-2.5 text-xs font-black text-[#3E2A1B] shadow-inner focus:border-[#D82D8B] focus:outline-none sm:text-sm"
                />
              </div>
            </div>
          )}

          {/* Banner Thưởng / Vốn Game */}
          <div className="flex items-center justify-between gap-3 border-b-2 border-[#C9A22733] bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#CA8A04] bg-gradient-to-b from-[#FEF08A] to-[#F59E0B] p-1.5 shadow-md">
                <GiftBoxIcon size={28} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#78350F]">
                  {hasNamedCity ? 'Vốn kinh doanh hiện có' : 'Vốn khởi nghiệp · Nợ cá nhân 200 triệu'}
                </p>
                <p className="text-pretty text-[13px] font-bold text-[#92400E]">
                  {hasNamedCity
                    ? `Tiền mặt ${formatCompact(coins)} đồng`
                    : `Vốn ${formatCompact(STARTING_COINS)} đồng · Lãi 5 triệu/tháng`}
                  {offlineBonus > 0 ? ` · +${formatCompact(offlineBonus)} doanh thu vắng mặt` : ''}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-2xl border-2 border-[#9D174D] bg-gradient-to-b from-[#F472B6] to-[#DB2777] px-3 py-1.5 shadow-md">
              <CoinIcon size={16} />
              <span className="text-xs font-black text-white">
                {loginBonus > 0 ? `+${formatCompact(loginBonus)}` : `${formatCompact(coins)}`}
              </span>
            </div>
          </div>

          {/* Nút bấm Arcade Game CTA */}
          <div className="p-5">
            <button
              type="button"
              onClick={onStart}
              className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-[#FFE4E6] bg-gradient-to-b from-[#EC4899] via-[#DB2777] to-[#BE185D] px-6 py-4 text-base font-black text-white shadow-[0_6px_0_#831843,0_12px_24px_rgba(219,39,119,0.4)] transition-all hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_#831843]"
            >
              <span className="truncate tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                {hasNamedCity ? 'Vào Phố Thôi 🚀' : 'Lên Phố Lập Nghiệp 🚀'}
              </span>
              <ArrowRight size={19} className="shrink-0 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[#8B7355]">
              Thành phố lưu trong trình duyệt này và gắn với tài khoản của bạn. Xóa dữ liệu trình duyệt là mất.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
