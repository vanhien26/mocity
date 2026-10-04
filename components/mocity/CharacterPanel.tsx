'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * BANG HOA THONG NHAT cho MOI cuon tro chuyen trong game.
 *
 * TRUOC DAY co 2 bang ke ca tinh, khong ai giong ai:
 *
 * - `DialogueModal` (NPC theo toa nhan): giay kem, vien 3px #7A6855, co
 *   avatar chibi, co pill he qua, co nut "Chon" phai.
 * - Portal cu dan trong `ExpressiveStreetCitizens`: vien 2px #78533D, khong
 *   avatar, sticker cam xuc gai sau ten, nut lua chon la`button` phang mau
 *   hong, va chi xuat hien o cuoi man hinh.
 *
 * Hau qua thuc te: cung mot game ma 2 cai dau 2 mau giay 2 kieu nut, nguoi
 * choi phai hoc 2 lan. File nay gom vo dung PHAN CHUNG - khung giay, header
 * (badge vai tro / ten / sticker / chu de tai chinh), hang avatar + loi ke -
 * va de tung noi giu phan rieng cua minh qua `children`.
 *
 * `variant` CHI chon vi tri va backdrop, khong chon mau sac:
 * - `dialogue`: dim man hinh, giua man, dong khi bam ra ngoai.
 * - `street`: dan day man hinh tren HUD, khong dim (pho van thay duoc sau bang).
 */
export type CharacterPanelVariant = 'street' | 'dialogue';

export interface CharacterPanelSticker {
  emoji: string;
  line: string;
}

export interface CharacterPanelTheme {
  label: string;
  tone: 'good' | 'bad' | 'neutral';
}

const THEME_TONE: Record<CharacterPanelTheme['tone'], { bg: string; color: string }> = {
  good: { bg: '#DCFCE7', color: '#15803D' },
  bad: { bg: '#FEE2E2', color: '#B91C1C' },
  neutral: { bg: '#F1F5F9', color: '#475569' },
};

interface CharacterPanelProps {
  variant: CharacterPanelVariant;
  /** Badge vai tro, mau hong D82D8B. Bo neu khong co. */
  badge?: string;
  title: string;
  /** Dong nghieng mau nau duoi ten - chi `dialogue` co san. */
  subtitle?: string;
  /** Sticker cam xuc: emoji + mot cau trang thai. */
  sticker?: CharacterPanelSticker;
  /** Chu de tai chinh cua nhan vat. */
  theme?: CharacterPanelTheme;
  /** Avatar ben trai loi ke. Citizen truyen chibi, NPC truyen ve tay rieng. */
  avatar?: ReactNode;
  /** Noi dung loi ke hien tai. */
  speech: string;
  onClose: () => void;
  children: ReactNode;
}

export default function CharacterPanel({
  variant,
  badge,
  title,
  subtitle,
  sticker,
  theme,
  avatar,
  speech,
  onClose,
  children,
}: CharacterPanelProps) {
  const themeStyle = theme ? THEME_TONE[theme.tone] : null;

  const card = (
    <div
      role={variant === 'dialogue' ? 'dialog' : 'region'}
      aria-modal={variant === 'dialogue' ? true : undefined}
      aria-label={title}
      className="flex w-full max-w-[460px] flex-col overflow-hidden rounded-[22px] p-1.5 shadow-2xl"
      style={{
        background: '#FAF6E9',
        border: '3px solid #7A6855',
        boxShadow: '0 20px 50px rgba(34, 24, 16, 0.45)',
      }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[16px] border-2 px-4 py-4 sm:px-5 sm:py-5"
        style={{ borderColor: '#DFD5C0', background: '#FBF8EE' }}
      >
        {/* ── HEADER: badge / ten / chu de / sticker + nut dong ── */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {badge && (
              <span
                className="mb-1.5 inline-block rounded-lg px-2.5 py-1 text-xs font-black text-white shadow-xs"
                style={{ backgroundColor: '#D82D8B' }}
              >
                {badge}
              </span>
            )}
            <p
              className="text-[20px] font-black leading-tight tracking-tight sm:text-[23px]"
              style={{ color: '#4A3525' }}
            >
              {title}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-sm font-semibold italic" style={{ color: '#7A6855' }}>
                {subtitle}
              </p>
            )}
            {(sticker || theme) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {sticker && (
                  <span
                    className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[#E8DEC8] bg-[#FAF6EE] px-2 py-0.5 text-[11px] font-black text-[#8A6A43]"
                    title={`Tâm trạng: ${sticker.line}`}
                  >
                    <span aria-hidden>{sticker.emoji}</span>
                    {sticker.line}
                  </span>
                )}
                {theme && themeStyle && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-black"
                    style={{ backgroundColor: themeStyle.bg, color: themeStyle.color }}
                  >
                    📊 {theme.label}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            style={{ color: '#7A6855' }}
            aria-label="Đóng"
          >
            <X size={16} className="shrink-0" />
          </button>
        </div>

        {/* ── HANG AVATAR + LOI KE ── */}
        <div className="mb-4 flex items-center gap-3">
          {avatar}
          <div
            className="min-w-0 flex-1 rounded-2xl border px-3.5 py-2.5"
            style={{ borderColor: '#DFD5C0', background: '#F2ECE1' }}
          >
            <p
              className="text-[14.5px] font-semibold leading-relaxed"
              style={{ color: '#5A4634' }}
            >
              {speech}
            </p>
          </div>
        </div>

        {/* ── NOI DUNG RIENG CUA TUNG LOAI BANG ── */}
        {children}
      </div>
    </div>
  );

  if (variant === 'dialogue') {
    return (
      <>
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]"
          onClick={onClose}
        />
        <div className="fixed inset-x-3 top-1/2 z-[61] mx-auto flex max-h-[92dvh] -translate-y-1/2 justify-center sm:inset-x-6">
          {card}
        </div>
      </>
    );
  }

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-[88px] z-[60] flex justify-center px-3">
      {card}
    </div>
  );
}
