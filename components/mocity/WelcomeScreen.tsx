'use client';

import { ArrowRight, Crown, Gift, Store, X } from 'lucide-react';
import { formatCompact, formatNumber } from '@/lib/mocity/format';

/** Hàng số thưởng nhậm chức, phải khớp `LOGIN_BONUS_COINS` trong page. */
export const WELCOME_FIRST_TIME_BONUS = 50_000;
const STARTING_COINS = 600;

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

/** Logo MoCity - toà nhà hình chữ M với ngôi sao vàng. */
function MoCityLogo({ size = 64 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      {/* Nền tròn gradient hồng */}
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#D82D8B" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#bg-grad)" />

      {/* Đường phố - nền vàng nhạt */}
      <rect x="8" y="46" width="48" height="8" rx="2" fill="#C9A227" opacity="0.35" />

      {/* Toà nhà trái - thấp */}
      <rect x="9" y="30" width="12" height="18" rx="1.5" fill="white" opacity="0.92" />
      <rect x="11" y="33" width="3" height="3" rx="0.5" fill="#D82D8B" opacity="0.7" />
      <rect x="16" y="33" width="3" height="3" rx="0.5" fill="#D82D8B" opacity="0.7" />
      <rect x="11" y="39" width="3" height="3" rx="0.5" fill="#D82D8B" opacity="0.7" />
      <rect x="16" y="39" width="3" height="3" rx="0.5" fill="#D82D8B" opacity="0.7" />

      {/* Toà nhà giữa - cao nhất, hình chữ M */}
      <rect x="23" y="18" width="18" height="30" rx="2" fill="white" />
      {/* Cửa sổ hình chữ M (3 tầng x 2 cột) */}
      <rect x="26" y="22" width="4" height="4" rx="0.5" fill="#D82D8B" opacity="0.75" />
      <rect x="34" y="22" width="4" height="4" rx="0.5" fill="#D82D8B" opacity="0.75" />
      <rect x="26" y="29" width="4" height="4" rx="0.5" fill="#D82D8B" opacity="0.75" />
      <rect x="34" y="29" width="4" height="4" rx="0.5" fill="#D82D8B" opacity="0.75" />
      {/* Cửa vào */}
      <rect x="28" y="40" width="8" height="8" rx="1" fill="#D82D8B" opacity="0.6" />

      {/* Toà nhà phải - vừa */}
      <rect x="43" y="26" width="12" height="22" rx="1.5" fill="white" opacity="0.92" />
      <rect x="45" y="29" width="3" height="3" rx="0.5" fill="#D82D8B" opacity="0.7" />
      <rect x="50" y="29" width="3" height="3" rx="0.5" fill="#D82D8B" opacity="0.7" />
      <rect x="45" y="35" width="3" height="3" rx="0.5" fill="#D82D8B" opacity="0.7" />
      <rect x="50" y="35" width="3" height="3" rx="0.5" fill="#D82D8B" opacity="0.7" />

      {/* Ngôi sao vàng trên đỉnh toà nhà giữa */}
      <polygon points="32,8 33.4,12.2 37.8,12.2 34.2,14.7 35.6,18.9 32,16.4 28.4,18.9 29.8,14.7 26.2,12.2 30.6,12.2" fill="#FACC15" stroke="#C9A227" strokeWidth="0.5" />
    </svg>
  );
}

/** Ba vi muc chinh cua vong choi - dung cho nguoi moi. */
const HOW_TO_PLAY = [
  { icon: Store, title: 'Mở tiệm & quản lý', body: 'Trả tiền mặt hay MoMo QR? Bà con tin bạn thì doanh thu lên.' },
  { icon: Crown, title: 'Phân xử chuyện phố', body: 'Tốn Xu để mua uy tín, hoặc giữ túi tiền và bà con sẽ xa bạn.' },
  { icon: Gift, title: 'Giữ phố vui', body: 'Bỏ bê bà con vài giờ thì hạnh phúc tụt, doanh thu giảm theo.' },
];

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mocity-welcome-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-[#140F12]/75 p-4 backdrop-blur-md"
    >
      <div className="relative my-10 w-full max-w-[560px]">
        <div className="overflow-hidden rounded-3xl border-[3px] border-[#C9A227] bg-[#FAF6ED] shadow-[0_24px_64px_rgba(0,0,0,0.65)]">
          {/* Đầu màn hình: lời chào theo tài khoản đang đăng nhập */}
          <div className="flex items-start gap-3.5 border-b-2 border-[#C9A22733] bg-gradient-to-br from-[#FFFDF7] to-[#FDF2F8] p-5">
            <span className="flex shrink-0 items-center justify-center rounded-2xl border-2 border-[#D5CEBF] bg-[#FDF2F8]">
              <MoCityLogo size={64} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-black uppercase tracking-wide text-[#6E4F3A]">
                Chào mừng {greeting}
              </p>
              <h1
                id="mocity-welcome-title"
                className="mt-0.5 text-balance text-lg font-black leading-tight text-[#3E2A1B] sm:text-xl"
              >
                {hasNamedCity ? `Mừng bạn trở lại, ${mayorName}!` : 'Chào mừng đến Đô Thị MoCity'}
              </h1>
              <p className="mt-1 text-pretty text-[12px] leading-relaxed text-[#6E4F3A] sm:text-[13px]">
                {hasNamedCity
                  ? `Thành phố ${cityName} đang chờ bạn. Cư dân trên phố nhớ mặt bạn đấy.`
                  : 'Dựng phố phường Việt Nam, cho thuê mặt bằng, quyết định thuê người hay tiền mặt. Game hoá bài học quản lý tài chính mà bạn vẫn chơi như chơi.'}
              </p>
            </div>
            {hasNamedCity && (
              <button
                type="button"
                onClick={onStart}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D5CEBF] bg-white text-[#6E4F3A] transition-colors hover:border-[#D82D8B] hover:text-[#D82D8B]"
                aria-label="Vào thẳng đô thị"
                title="Vào thẳng đô thị"
              >
                <X size={15} className="shrink-0" />
              </button>
            )}
          </div>

          {/* Thông tin thành phố hiện có (người chơi cũ) */}
          {hasNamedCity && (
            <div className="border-b-2 border-[#C9A22733] px-5 py-4">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-[#6E4F3A]">
                Thành phố của bạn
              </h2>
              <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Cấp Thị Trưởng', String(mayorLevel)],
                  ['Tiệm đã mở', String(buildingCount)],
                  ['Cư dân', String(npcCount)],
                  ['Ngân khố', `${formatCompact(coins)} Xu`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-xl border-2 border-[#D5CEBF] bg-white px-2.5 py-2"
                  >
                    <dt className="truncate text-[10px] font-black uppercase text-[#8B7355]">
                      {label}
                    </dt>
                    <dd className="truncate text-sm font-black text-[#3E2A1B]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Hướng dẫn cho người mới */}
          {!hasNamedCity && (
            <div className="border-b-2 border-[#C9A22733] px-5 py-4">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-[#6E4F3A]">
                Chơi thế nào
              </h2>
              <ul className="mt-2.5 grid gap-2 sm:grid-cols-3">
                {HOW_TO_PLAY.map((step) => (
                  <li
                    key={step.title}
                    className="min-w-0 rounded-xl border-2 border-[#D5CEBF] bg-white p-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D82D8B]">
                      <step.icon size={16} className="shrink-0 text-white" />
                    </span>
                    <p className="mt-2 truncate text-xs font-black text-[#3E2A1B]">{step.title}</p>
                    <p className="mt-0.5 text-pretty text-[11px] leading-relaxed text-[#6E4F3A]">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Đặt tên thành phố (người mới) */}
          {!hasNamedCity && (
            <div className="border-b-2 border-[#C9A22733] px-5 py-4">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-[#6E4F3A]">
                Đặt tên cho thành phố
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-[#6E4F3A]">
                Tên Thị Trưởng lấy từ tài khoản của bạn. Đổi tên được miễn phí trước khi vào chơi.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <label
                    htmlFor="mocity-mayor-name"
                    className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#6E4F3A]"
                  >
                    Tên Thị Trưởng
                  </label>
                  <input
                    id="mocity-mayor-name"
                    type="text"
                    maxLength={28}
                    value={mayorInput}
                    onChange={(e) => onMayorInputChange(e.target.value)}
                    placeholder="Thị Trưởng MoMo"
                    className="w-full rounded-xl border-2 border-[#D5CEBF] bg-white px-3.5 py-2.5 text-xs font-extrabold text-[#3E2A1B] focus:border-[#D82D8B] focus:outline-none sm:text-sm"
                  />
                </div>
                <div className="min-w-0">
                  <label
                    htmlFor="mocity-city-name"
                    className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#6E4F3A]"
                  >
                    Tên Khu Phố
                  </label>
                  <input
                    id="mocity-city-name"
                    type="text"
                    maxLength={32}
                    value={cityInput}
                    onChange={(e) => onCityInputChange(e.target.value)}
                    placeholder="Đô Thị MoCity"
                    className="w-full rounded-xl border-2 border-[#D5CEBF] bg-white px-3.5 py-2.5 text-xs font-extrabold text-[#3E2A1B] focus:border-[#D82D8B] focus:outline-none sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ngân khố & thưởng */}
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] px-5 py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-white shadow-sm">
                <Gift size={20} className="shrink-0" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#78350F]">
                  {loginBonus > 0 ? 'Vốn khởi điểm & Thưởng nhậm chức' : 'Ngân khố Đô Thị'}
                </p>
                <p className="text-pretty text-[11px] font-bold text-[#92400E]">
                  {hasNamedCity
                    ? `Vốn sẵn có ${formatNumber(coins)} Xu`
                    : `Vốn sẵn có ${formatNumber(STARTING_COINS)} Xu · Tặng thêm +${formatNumber(firstTimeBonus)} Xu`}
                  {offlineBonus > 0 ? ` · +${formatCompact(offlineBonus)} Xu thuế nghỉ` : ''}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-xl bg-[#D82D8B] px-2.5 py-1 text-xs font-black text-white shadow-sm">
              {loginBonus > 0 ? `+${formatCompact(loginBonus)} XU` : `${formatCompact(coins)} XU`}
            </span>
          </div>

          {/* CTA */}
          <div className="p-5">
            <button
              type="button"
              onClick={onStart}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-[#D82D8B] px-6 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.01] hover:bg-[#EB2F96] active:scale-95"
            >
              <span className="truncate">
                {hasNamedCity ? 'Vào Phố Thôi' : 'Nhận Chức & Vào Phố MoCity'}
              </span>
              <ArrowRight size={17} className="shrink-0" />
            </button>
            <p className="mt-2.5 text-center text-[10px] leading-relaxed text-[#8B7355]">
              Thành phố lưu trong trình duyệt này và gắn với tài khoản của bạn. Xóa dữ liệu trình duyệt là
              mất. Bạn có thể tải bản sao lưu trong Tòa Thị Chính.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
