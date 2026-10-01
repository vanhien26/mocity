'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, X } from 'lucide-react';
import { SERVICE_LABEL, SERVICE_TOOL } from '@/lib/mocity/npc-data';
import { formatCompact } from '@/lib/mocity/format';
import type { ConsequenceTag, DialogueChoice } from '@/lib/mocity/types';

export interface DialogueView {
  title: string;
  subtitle?: string;
  speaker: string;
  speakerTag?: string;
  body: string;
  hue: string;
  choices: DialogueChoice[];
}

/** Ve Avatar Chibi net ve tay theo ten nhan vat (Ong Loc, Co Tu, Anh Lam, Chi Mai...) */
function ChibiNpcAvatar({ speaker }: { speaker: string }) {
  const lower = speaker.toLowerCase();
  const isElder = lower.includes('lộc') || lower.includes('bảy') || lower.includes('tổ');
  const isWoman = lower.includes('tư') || lower.includes('ba') || lower.includes('thảo') || lower.includes('mai');

  return (
    <div
      className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2"
      style={{ borderColor: '#6E5A47', background: '#FAF3E3' }}
    >
      <svg viewBox="0 0 48 48" className="h-11 w-11">
        {/* Co & Vai ao */}
        <path
          d="M10 46 C10 37, 38 37, 38 46 Z"
          fill={isElder ? '#D8C3A5' : isWoman ? '#E07A5F' : '#457B9D'}
          stroke="#3D2C1E"
          strokeWidth="1.8"
        />
        {/* Khuon mat tron chibi */}
        <circle
          cx="24"
          cy="24"
          r="12.5"
          fill="#FCE4C8"
          stroke="#3D2C1E"
          strokeWidth="1.8"
        />
        {/* Ma hong */}
        <ellipse cx="17.5" cy="26.5" rx="2.4" ry="1.3" fill="#F4A28C" opacity="0.75" />
        <ellipse cx="30.5" cy="26.5" rx="2.4" ry="1.3" fill="#F4A28C" opacity="0.75" />

        {/* Toc theo nhan vat */}
        {isElder ? (
          /* Toc bac xoan cua Ong Loc */
          <path
            d="M11.5 22 C10 14, 17 10, 24 10 C31 10, 38 14, 36.5 22 C34 17, 29 15, 24 15 C19 15, 14 17, 11.5 22 Z"
            fill="#EFECE6"
            stroke="#3D2C1E"
            strokeWidth="1.7"
          />
        ) : isWoman ? (
          /* Toc bui co Tu / chi Mai */
          <>
            <circle cx="24" cy="9.5" r="4.5" fill="#3D2C1E" />
            <path
              d="M11.5 23 C11 13, 17 11, 24 11 C31 11, 37 13, 36.5 23 C33 17, 15 17, 11.5 23 Z"
              fill="#3D2C1E"
            />
          </>
        ) : (
          /* Toc gon / mu luoi trai Anh Lam */
          <path
            d="M11.5 21 C12 12, 18 10.5, 24 10.5 C30 10.5, 36 12, 36.5 21 C32 16, 16 16, 11.5 21 Z"
            fill="#2C221E"
          />
        )}

        {/* Mat cuoi hinh vong cung net ve tay */}
        <path
          d="M18 23.5 Q20 21.5 22 23.5"
          fill="none"
          stroke="#3D2C1E"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M26 23.5 Q28 21.5 30 23.5"
          fill="none"
          stroke="#3D2C1E"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Mieng cuoi */}
        <path
          d="M21 28.2 Q24 30.8 27 28.2"
          fill="none"
          stroke="#3D2C1E"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** Tao danh sach tag he qua tu dong neu choice khong khai bao san tags */
function resolveChoiceTags(choice: DialogueChoice): ConsequenceTag[] {
  if (choice.tags && choice.tags.length > 0) return choice.tags;

  const list: ConsequenceTag[] = [];
  if (choice.costCoins) {
    list.push({ label: `-${formatCompact(choice.costCoins)}`, tone: 'red' });
  }
  if (choice.effects.trust && choice.effects.trust > 0) {
    list.push({
      label: choice.effects.trust >= 25 ? 'thiện cảm ++' : 'thiện cảm +',
      tone: 'green',
    });
  }
  if (choice.effects.trust && choice.effects.trust < 0) {
    list.push({ label: 'dân giận lắm', tone: 'red' });
  }
  if (choice.effects.trustAll && choice.effects.trustAll > 0) {
    list.push({ label: 'cả phố ++', tone: 'green' });
  }
  if (choice.effects.trustAll && choice.effects.trustAll < 0) {
    list.push({ label: 'cả phố buồn', tone: 'red' });
  }
  if (choice.effects.grantService) {
    list.push({ label: SERVICE_LABEL[choice.effects.grantService], tone: 'green' });
  }
  if (list.length === 0) {
    list.push({ label: 'khép chuyện', tone: 'neutral' });
  }
  return list;
}

const PILL_STYLES: Record<ConsequenceTag['tone'], { bg: string; text: string }> = {
  red: { bg: '#D64C47', text: '#FFFFFF' },
  green: { bg: '#559E54', text: '#FFFFFF' },
  neutral: { bg: '#8C7B6B', text: '#FFFFFF' },
};

const BTN_STYLES: Record<'green' | 'red' | 'blue', { bg: string; border: string }> = {
  green: { bg: '#4E8C4F', border: '#3B6E3C' },
  red: { bg: '#9C3832', border: '#782924' },
  blue: { bg: '#3B76A6', border: '#2B5980' },
};

export default function DialogueModal({
  view,
  coins,
  onChoose,
  onClose,
}: {
  view: DialogueView | null;
  coins: number;
  onChoose: (choiceId: string) => boolean;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<DialogueChoice | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [view?.title, view?.body]);

  if (!view) return null;

  const handlePick = (choice: DialogueChoice) => {
    if (onChoose(choice.id)) setPicked(choice);
  };

  const reply = picked?.reply ?? null;
  const tool = picked?.effects.grantService ? SERVICE_TOOL[picked.effects.grantService] : null;

  return (
    <>
      {/* Backdrop lam mo nhe */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Khung The Tinh Huong Giay Kem (Chuan Quan Hang Pho) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={view.title}
        className="fixed inset-x-3 top-1/2 z-[61] mx-auto max-w-[460px] -translate-y-1/2 rounded-[22px] p-1.5 shadow-2xl sm:inset-x-6 max-h-[92dvh] overflow-hidden flex flex-col"
        style={{
          background: '#FAF6E9',
          border: '3px solid #7A6855',
          boxShadow: '0 20px 50px rgba(34, 24, 16, 0.45)',
        }}
      >
        <div
          className="rounded-[16px] border-2 px-4 py-4 sm:px-5 sm:py-5 overflow-y-auto flex-1 min-h-0"
          style={{
            borderColor: '#DFD5C0',
            background: '#FBF8EE',
          }}
        >
          {/* Tieu de lon + Dong phu nghieng */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className="text-[20px] font-black leading-tight tracking-tight sm:text-[23px]"
                style={{ color: '#4A3525' }}
              >
                {view.title}
              </p>
              <p
                className="mt-0.5 text-[13px] font-semibold italic"
                style={{ color: '#7A6855' }}
              >
                {view.subtitle ?? 'Chuyện này chỉ mình bạn biết...'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              style={{ color: '#7A6855' }}
              aria-label="Đóng tình huống"
            >
              <X size={16} className="shrink-0" />
            </button>
          </div>

          {/* Hang Avatar Chibi + Khung loi ke chuyen */}
          <div className="mb-4 flex items-center gap-3">
            <ChibiNpcAvatar speaker={view.speaker} />
            <div
              className="min-w-0 flex-1 rounded-2xl border px-3.5 py-2.5"
              style={{
                borderColor: '#DFD5C0',
                background: '#F2ECE1',
              }}
            >
              <p
                className="text-[13px] font-semibold leading-snug"
                style={{ color: '#5A4634' }}
              >
                {reply ?? view.body}
              </p>
            </div>
          </div>

          {/* Danh sach 3 Phuong an hoac Ket qua */}
          <div className="flex flex-col gap-2.5">
            {reply ? (
              <>
                {tool && (
                  <Link
                    href={tool.href}
                    className="flex items-center justify-between gap-2 rounded-2xl border-2 px-3.5 py-2.5"
                    style={{ borderColor: '#C9A227', background: '#FFFDF7' }}
                  >
                    <span className="min-w-0">
                      <span
                        className="block text-[10px] font-black uppercase tracking-wide"
                        style={{ color: '#8A7355' }}
                      >
                        Tiện ích MoMo ngoài đời thật
                      </span>
                      <span
                        className="block truncate text-xs font-extrabold"
                        style={{ color: '#3E2A1B' }}
                      >
                        {tool.label}
                      </span>
                    </span>
                    <ChevronRight size={16} className="shrink-0" style={{ color: '#A67C1E' }} />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 w-full rounded-xl border-b-4 text-sm font-black text-white transition-transform active:scale-[0.98]"
                  style={{
                    background: '#4E8C4F',
                    borderColor: '#3B6E3C',
                  }}
                >
                  Tiếp tục quản lý phố
                </button>
              </>
            ) : (
              view.choices.map((choice, idx) => {
                const tooPoor = choice.costCoins !== undefined && coins < choice.costCoins;
                const tags = resolveChoiceTags(choice);
                const defaultTone: 'green' | 'red' | 'blue' =
                  idx === 0 ? 'green' : idx === 1 ? 'red' : 'blue';
                const btnStyle = BTN_STYLES[choice.btnTone ?? defaultTone];

                return (
                  <div
                    key={choice.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border-2 px-3.5 py-2.5 transition-all"
                    style={{
                      borderColor: '#E5DEC9',
                      background: '#FFFDF8',
                      opacity: tooPoor ? 0.6 : 1,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-black leading-snug"
                        style={{ color: '#4A3525' }}
                      >
                        {choice.text}
                      </p>

                      {/* Cac Pill Tag He Qua (Do / Xanh la / Xam) */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {tags.map((tag, tIdx) => {
                          const style = PILL_STYLES[tag.tone];
                          return (
                            <span
                              key={`${choice.id}-tag-${tIdx}`}
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold leading-tight"
                              style={{
                                background: style.bg,
                                color: style.text,
                              }}
                            >
                              {tag.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nut [Chon] ben phai */}
                    <button
                      type="button"
                      disabled={tooPoor}
                      onClick={() => handlePick(choice)}
                      className="shrink-0 cursor-pointer rounded-xl border-b-[3px] px-4 py-1.5 text-[13px] font-black text-white shadow-sm transition-transform hover:brightness-105 active:scale-95 disabled:cursor-not-allowed"
                      style={{
                        background: btnStyle.bg,
                        borderColor: btnStyle.border,
                      }}
                    >
                      Chọn
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
