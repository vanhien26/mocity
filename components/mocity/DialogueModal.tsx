'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SERVICE_LABEL, SERVICE_TOOL } from '@/lib/mocity/npc-data';
import { formatCompact } from '@/lib/mocity/format';
import type { ConsequenceTag, DialogueChoice } from '@/lib/mocity/types';
import { appearanceFromSeed } from '@/lib/mocity/character-appearance-gen';
import CharacterPanel from '@/components/mocity/CharacterPanel';
import { ChibiBody } from '@/components/mocity/ChibiRenderer';

export interface DialogueView {
  title: string;
  subtitle?: string;
  speaker: string;
  speakerTag?: string;
  body: string;
  choices: DialogueChoice[];
}

/**
 * Avatar NPC trong hội thoại - DÙNG CHUNG `ChibiBody` với cư dân trên phố.
 *
 * Trước đây hàm này tự vẽ riêng một bộ mặt (vòng cung mắt, tóc búi/mũ lưỡi
 * trai net vẽ tay) không khớp phong cách nón lá/mắt tròn/má hồng đã chốt làm
 * chuẩn cho TOÀN BỘ người trong game. Giờ chỉ còn việc chọn diện mạo xác định
 * theo tên (`appearanceFromSeed`) rồi giao `ChibiBody` vẽ - cùng một nhân vật
 * tên "Cô Tư" mở hội thoại 10 lần vẫn ra đúng một khuôn mặt.
 */
function ChibiNpcAvatar({ speaker }: { speaker: string }) {
  const appearance = appearanceFromSeed(speaker);
  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2"
      style={{ borderColor: '#6E5A47', background: '#FAF3E3' }}
    >
      <svg width="42" height="54" viewBox="0 0 56 72" className="overflow-visible" aria-hidden>
        <ChibiBody def={appearance} emotion="HAPPY" />
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
    const id = requestAnimationFrame(() => setPicked(null));
    return () => cancelAnimationFrame(id);
  }, [view?.title, view?.body]);

  if (!view) return null;

  const handlePick = (choice: DialogueChoice) => {
    if (onChoose(choice.id)) setPicked(choice);
  };

  const reply = picked?.reply ?? null;
  const tool = picked?.effects.grantService ? SERVICE_TOOL[picked.effects.grantService] : null;

  return (
    <CharacterPanel
      variant="dialogue"
      title={view.title}
      subtitle={view.subtitle ?? 'Chuyện này chỉ mình bạn biết...'}
      badge={view.speakerTag}
      avatar={<ChibiNpcAvatar speaker={view.speaker} />}
      speech={reply ?? view.body}
      onClose={onClose}
    >
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
                        className="block text-[12px] font-black uppercase tracking-wide"
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
                        className="text-[15.5px] font-black leading-snug"
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
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-extrabold leading-tight"
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
    </CharacterPanel>
  );
}
