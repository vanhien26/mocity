'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Database,
  Flame,
  Gem,
  Gift,
  MessageSquareWarning,
  Receipt,
  ScrollText,
  TriangleAlert,
  Users,
  X,
  GraduationCap,
} from 'lucide-react';
import { MAYOR_QUESTS, CITY_TIERS, nextCityTier, xpForLevel, BUILDING_BY_ID } from '@/lib/mocity/mock-city-data';
import { populationFor } from '@/lib/mocity/city-calculator';
import { ARCHETYPES, CITY_ADVISORS, SERVICE_LABEL } from '@/lib/mocity/npc-data';
import { ChibiBody } from './ChibiRenderer';
import { ADVISOR_APPEARANCES } from '@/lib/mocity/character-roster';
import { EVENT_BY_ID } from '@/lib/mocity/dialogue-data';
import {
  claimQuestReward,
  claimDailyQuest,
  dailyQuestViews,
  currentCityTier,
  isQuestCompleted,
  renameCityAndMayor,
  RENAME_COST_GEMS,
  resetCity,
  SAVE_FILE_VERSION,
  exportCitySave,
  importCitySave,
  triggerNextEvent,
  useCity,
  MAX_MAYOR_LEVEL,
  STARTING_COINS,
} from '@/lib/mocity/store';
import { formatCompact, formatNumber } from '@/lib/mocity/format';
import { particles } from './ParticleEngine';
import ProfitLossStatement, { LoanPanel, FinancialRulesPanel } from './ProfitLossStatement';
import WeekComparisonPanel from './WeekComparisonPanel';
import { markTutorialFlag, restartTutorial } from '@/lib/mocity/store';
import StreakBoard from './StreakBoard';

type Tab = 'PROFILE' | 'QUESTS' | 'CITIZENS' | 'LEDGER' | 'BANK' | 'STREAK' | 'DATA';

function BankTab({ onToast }: { onToast: (msg: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 p-3" style={{ background: '#FFFBEB', borderColor: '#C9A22766' }}>
        <p className="text-[11px] font-black uppercase tracking-wide text-[#8B6318]">
          Ngân Khố Đô Thị & Quỹ Dự Trữ
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#6E4F3A]">
          Gửi tiết kiệm Heo Đất, quản trị quỹ vận hành và bảo vệ rủi ro phố thị - nguồn vốn dồi dào để phát triển kinh doanh.
        </p>
      </div>
      <FinancialRulesPanel onToast={onToast} />
    </div>
  );
}

export default function MayorCenterModal({
  open,
  initialTab = 'PROFILE',
  onClose,
  onToast,
  onOpenDialogue,
}: {
  open: boolean;
  initialTab?: Tab;
  onClose: () => void;
  onToast: (msg: string) => void;
  onOpenDialogue?: () => void;
}) {
  const state = useCity((s) => s);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [mayorInput, setMayorInput] = useState(state.mayorName || 'Thị Trưởng MoMo');
  const [cityInput, setCityInput] = useState(state.cityName || 'Đô Thị MoCity');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      setTab(initialTab);
      setMayorInput(state.mayorName || 'Thị Trưởng MoMo');
      setCityInput(state.cityName || 'Đô Thị MoCity');
      setConfirmReset(false);
    });
    return () => cancelAnimationFrame(id);
  }, [open, initialTab, state.mayorName, state.cityName]);

  if (!open) return null;

  const claimed = state.claimedQuests ?? [];

  const isRename = state.hasNamedCity;
  const canAffordRename = state.gems >= RENAME_COST_GEMS;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const result = renameCityAndMayor(mayorInput, cityInput);
    if (result === 'funds') {
      onToast(`Cần ${RENAME_COST_GEMS} Kim Cương để đổi tên thành phố!`);
      return;
    }
    onToast(isRename
      ? `Đã đổi tên thành phố (tốn ${RENAME_COST_GEMS} Kim Cương)!`
      : `Đã đặt tên thành phố "${cityInput.trim() || state.cityName}"!`
    );
  };

  const handleClaimDaily = (questId: string, title: string) => {
    if (claimDailyQuest(questId)) {
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
      onToast(`Xong nhiệm vụ ngày "${title}"!`);
    }
  };

  const handleClaim = (questId: string, title: string) => {
    if (claimQuestReward(questId)) {
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
      onToast(`Đã nhận thưởng nhiệm vụ "${title}"!`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trung tâm Thị Trưởng & Nhiệm vụ"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-2 shadow-2xl sm:rounded-3xl"
        style={{
          background: 'linear-gradient(180deg, #FBF3DE 0%, #F2E3BE 100%)',
          borderColor: '#C9A227',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 border-b-2 px-4 py-3.5"
          style={{
            background: 'linear-gradient(180deg, #4A3018 0%, #3E2A1B 100%)',
            borderColor: '#C9A227',
          }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2"
              style={{ background: 'rgba(201,162,39,0.2)', borderColor: '#C9A227' }}
            >
              <Crown size={20} className="shrink-0" style={{ color: '#F0C25E' }} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black uppercase" style={{ color: '#F5E6C8' }}>
                Tòa Thị Chính & Nhiệm Vụ
              </h2>
              <p className="truncate text-[13px] font-bold" style={{ color: '#C4AC85' }}>
                {state.mayorName} · Cấp Thị Trưởng {state.mayorLevel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: '#C4AC85' }}
            aria-label="Đóng Tòa Thị Chính"
          >
            <X size={18} className="shrink-0" />
          </button>
        </div>

        {/* 3 Tabs */}
        <div className="grid grid-cols-3 gap-1.5 border-b px-4 py-2.5" style={{ borderColor: '#C9A22744' }}>
          <button
            type="button"
            onClick={() => setTab('PROFILE')}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              tab === 'PROFILE'
                ? { background: 'linear-gradient(180deg,#D9A441,#C9A227)', color: '#3E2A1B', borderColor: '#8A6A43' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <Crown size={14} className="shrink-0" />
            <span className="truncate">Đô Thị & Cố Vấn</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('QUESTS')}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              tab === 'QUESTS'
                ? { background: 'linear-gradient(180deg,#EB2F96,#C22181)', color: '#FFFFFF', borderColor: '#9D174D' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <ScrollText size={14} className="shrink-0" />
            <span className="truncate">Nhiệm Vụ ({MAYOR_QUESTS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('CITIZENS')}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              tab === 'CITIZENS'
                ? { background: 'linear-gradient(180deg,#2563EB,#1D4ED8)', color: '#FFFFFF', borderColor: '#1E3A8A' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <Users size={14} className="shrink-0" />
            <span className="truncate">Cư Dân ({state.npcs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('STREAK')}
            aria-pressed={tab === 'STREAK'}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              tab === 'STREAK'
                ? { background: 'linear-gradient(180deg,#F97316,#C2410C)', color: '#FFFFFF', borderColor: '#7C2D12' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <Flame size={14} className="shrink-0" />
            <span className="truncate">Chuỗi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('LEDGER');
              // Moc huong dan "da mo So Cai" - chi UI moi biet.
              markTutorialFlag('ledger');
            }}
            aria-pressed={tab === 'LEDGER'}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              tab === 'LEDGER'
                ? { background: 'linear-gradient(180deg,#059669,#047857)', color: '#FFFFFF', borderColor: '#064E3B' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <Receipt size={14} className="shrink-0" />
            <span className="truncate">Sổ Cái</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('BANK')}
            aria-pressed={tab === 'BANK'}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              tab === 'BANK'
                ? { background: 'linear-gradient(180deg,#B45309,#92400E)', color: '#FFFFFF', borderColor: '#78350F' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <CircleDollarSign size={14} className="shrink-0" />
            <span className="truncate">Ngân Khố</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('DATA')}
            aria-pressed={tab === 'DATA'}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              tab === 'DATA'
                ? { background: 'linear-gradient(180deg,#D82D8B,#C22181)', color: '#FFFFFF', borderColor: '#9D174D' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <Database size={14} className="shrink-0" />
            <span className="truncate">Dữ Liệu</span>
          </button>
        </div>

        {/* Body */}
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
          {tab === 'PROFILE' && (
            <>
              <form
                onSubmit={handleSaveProfile}
                className="space-y-3 rounded-2xl border-2 p-3.5"
                style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}
              >
                <div>
                  <label className="block text-[13px] font-black uppercase" style={{ color: '#5B3D22' }}>
                    Tên Thị Trưởng (Người Chơi)
                  </label>
                  <input
                    type="text"
                    maxLength={28}
                    value={mayorInput}
                    onChange={(e) => setMayorInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border-2 px-3 py-2 text-xs font-bold outline-none"
                    style={{ background: '#FBF3DE', borderColor: '#C9A227', color: '#3E2A1B' }}
                    placeholder="Nhập tên Thị Trưởng..."
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-black uppercase" style={{ color: '#5B3D22' }}>
                    Tên Thành Phố Của Bạn
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border-2 px-3 py-2 text-xs font-bold outline-none"
                    style={{ background: '#FBF3DE', borderColor: '#C9A227', color: '#3E2A1B' }}
                    placeholder="Nhập tên Thành phố..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRename && !canAffordRename}
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border-2 text-xs font-black uppercase transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(180deg,#D9A441,#C9A227)',
                    borderColor: '#8A6A43',
                    color: '#3E2A1B',
                  }}
                >
                  {isRename ? (
                    <>
                      <Gem size={13} className="shrink-0" style={{ color: canAffordRename ? '#1C6FEB' : '#9CA3AF' }} />
                      <span>Đổi tên ({RENAME_COST_GEMS} Kim Cương)</span>
                    </>
                  ) : (
                    <span>Lưu Hồ Sơ Thị Trưởng & Đô Thị</span>
                  )}
                </button>
              </form>

              {/* Choi lai huong dan */}
              <button
                type="button"
                onClick={() => {
                  restartTutorial();
                  onClose();
                  onToast?.('Đã mở lại hướng dẫn. Thẻ hướng dẫn hiện ở cuối màn hình.');
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-black transition-colors hover:bg-white"
                style={{ background: '#FFFDF7', borderColor: '#C9A22788', color: '#5B3D22' }}
              >
                <GraduationCap size={14} className="shrink-0" />
                Xem lại hướng dẫn chơi
              </button>

              {/* Ban Co Van Do Thi */}
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase" style={{ color: '#4A3018' }}>
                  Ban Cố Vấn Đô Thị MoCity
                </h2>
                {CITY_ADVISORS.map((adv) => {
                  const app = ADVISOR_APPEARANCES[adv.id];
                  return (
                    <div
                      key={adv.id}
                      className="flex items-start gap-3 rounded-2xl border-2 p-3"
                      style={{ background: '#FFFDF7', borderColor: '#C9A22755' }}
                    >
                      {app && (
                        <div
                          className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2"
                          style={{ borderColor: adv.hue, background: '#FAF3E3' }}
                        >
                          <svg width="32" height="42" viewBox="0 0 56 72" className="overflow-visible" aria-hidden>
                            <ChibiBody def={app} emotion="HAPPY" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-md px-2 py-0.5 text-[12px] font-black text-white"
                            style={{ background: adv.hue }}
                          >
                            {adv.roleTitle}
                          </span>
                          <p className="truncate text-xs font-black" style={{ color: '#3E2A1B' }}>
                            {adv.name}
                          </p>
                        </div>
                        <p className="mt-1.5 text-[13px] font-semibold" style={{ color: '#5B3D22' }}>
                          “{adv.tip}”
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'QUESTS' && (
            <div className="space-y-3">
              {/* BẬC THÀNH PHỐ */}
              {(() => {
                const tier = currentCityTier(state);
                const sau = nextCityTier(tier.rank);
                const dan = populationFor(state.buildings);
                const nha = state.buildings.length;
                const pct = sau
                  ? Math.min(100, Math.round(Math.min(dan / sau.minPopulation, nha / sau.minBuildings) * 100))
                  : 100;
                return (
                  <div className="rounded-2xl border-2 p-3.5 shadow-sm" style={{ background: '#FFFBEB', borderColor: '#C9A227' }}>
                    <p className="text-[12px] font-black uppercase tracking-wide text-[#8B6318]">
                      Rank Thành Phố {tier.rank}/{CITY_TIERS.length}
                    </p>
                    <p className="mt-0.5 text-sm font-black text-[#3E2A1B]">{tier.name}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[#6E4F3A]">{tier.tagline}</p>

                    {sau ? (
                      <>
                        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full" style={{ background: '#E6D9B8' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#D82D8B' }} />
                        </div>
                        <p className="mt-1.5 text-[12px] font-bold text-[#8B6318]">
                          Lên {sau.name}: cần {sau.minPopulation.toLocaleString('vi-VN')} cư dân (đang {dan.toLocaleString('vi-VN')})
                          {' · '}{sau.minBuildings} công trình (đang {nha})
                        </p>
                        {sau.unlocks && (
                          <div className="mt-2.5 rounded-2xl border-2 border-[#E5DAC6] bg-[#FAF7F0] p-3 shadow-inner">
                            <p className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wide text-[#A8246B]">
                              🏗️ Công trình mở khóa khi lên bậc
                            </p>
                            <p className="mt-1 text-[13px] font-black text-[#3E2A1B]">{sau.unlocks.headline}</p>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-[#6E4F3A]">{sau.unlocks.detail}</p>
                            {sau.unlocks.buildingIds && sau.unlocks.buildingIds.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {sau.unlocks.buildingIds.map((bId) => {
                                  const bDef = BUILDING_BY_ID[bId];
                                  if (!bDef) return null;
                                  return (
                                    <span
                                      key={bId}
                                      className="inline-flex items-center gap-1 rounded-xl border border-[#D5CEBF] bg-white px-2 py-1 text-[11px] font-bold text-[#3E2A1B] shadow-sm"
                                    >
                                      <span>{bDef.name}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-[12px] font-black text-[#B45309]">Đã đạt rank cao nhất.</p>
                    )}
                  </div>
                );
              })()}

              {/* NHIỆM VỤ NGÀY */}
              <div className="rounded-2xl border-2 p-3.5 shadow-sm" style={{ background: '#FFFDF7', borderColor: '#2563EB66' }}>
                <p className="text-[12px] font-black uppercase tracking-wide text-[#1D4ED8]">
                  Nhiệm Vụ Ngày · làm lại mỗi ngày
                </p>
                <div className="mt-2 space-y-1.5">
                  {dailyQuestViews().map((v) => (
                    <div key={v.def.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5" style={{ background: '#F4F7FC' }}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-black text-[#3E2A1B]">{v.def.title}</p>
                        <p className="text-[12px] font-bold text-[#6E4F3A]">
                          {v.progress}/{v.def.target} · +{formatNumber(v.def.rewardCoins)} ·{' '}
                          <span style={{ color: '#0284C7' }}>+{v.def.rewardGems} Kim Cương</span> ·{' '}
                          <span style={{ color: '#7C3AED' }}>+{v.def.rewardXp.toLocaleString('vi-VN')} XP</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!v.done || v.claimed}
                        onClick={() => handleClaimDaily(v.def.id, v.def.title)}
                        className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-black transition-transform active:scale-95 disabled:cursor-not-allowed"
                        style={
                          v.claimed
                            ? { background: '#E2E8F0', color: '#94A3B8' }
                            : v.done
                              ? { background: '#2563EB', color: '#FFFFFF' }
                              : { background: '#E2E8F0', color: '#94A3B8' }
                        }
                      >
                        {v.claimed ? 'Đã nhận' : v.done ? 'Nhận' : 'Chưa xong'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tình huống Chuyện Phố / Sự Kiện Thị Trưởng */}
              <div
                className="rounded-2xl border-2 p-3.5 shadow-sm"
                style={{
                  background: state.pendingEvent ? 'linear-gradient(135deg, #FFF0F5 0%, #FFFBEB 100%)' : '#FFFDF7',
                  borderColor: state.pendingEvent ? '#D82D8B' : '#C9A22766',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D82D8B] text-white">
                      <MessageSquareWarning size={15} />
                    </span>
                    <p className="text-xs font-black uppercase text-[#D82D8B]">
                      Chuyện Phố & Tình Huống Hài Hước
                    </p>
                  </div>
                  {state.pendingEvent && (
                    <span className="rounded-full bg-[#D82D8B] px-2.5 py-0.5 text-[10.5px] font-black uppercase text-white animate-pulse">
                      Cần phân xử
                    </span>
                  )}
                </div>

                {state.pendingEvent && EVENT_BY_ID[state.pendingEvent.scriptId] ? (
                  <div className="mt-2.5 space-y-1.5">
                    <p className="text-sm font-black text-[#1C171A]">
                      {EVENT_BY_ID[state.pendingEvent.scriptId].title}
                    </p>
                    <p className="text-xs font-medium text-[#5B3D22] line-clamp-2">
                      “{EVENT_BY_ID[state.pendingEvent.scriptId].body}”
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDialogue?.();
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#D82D8B] py-2 text-xs font-black text-white shadow transition-all hover:bg-[#EB2F96] active:scale-95"
                    >
                      <span>Mở Màn Phân Xử Ngay</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-[#7A6449]">
                      Chưa có sự kiện nào đang treo. Bấm để nghe chuyện mới!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        triggerNextEvent();
                        onClose();
                        onOpenDialogue?.();
                      }}
                      className="shrink-0 rounded-xl border border-[#D82D8B] bg-[#FFF0F5] px-3 py-1.5 text-xs font-black text-[#D82D8B] hover:bg-[#D82D8B] hover:text-white transition-colors"
                    >
                      Gọi Chuyện Mới
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-[13px] font-black uppercase tracking-wider text-[#5B3D22]">
                Nhiệm Vụ Kiến Thiết Đô Thị ({claimed.length}/{MAYOR_QUESTS.length})
              </h3>

              {/*
               * Sap xep: chua nhan ma da xong len dau, dang lam o giua, da nhan
               * xuong cuoi. Khong co buoc nay thi nut "Nhan thuong" nam lan giua
               * danh sach 18 muc va nguoi choi phai cuon di tim.
               */}
              {([1, 2] as const).map((chang) => {
                const nhom = MAYOR_QUESTS.filter((q) => q.stage === chang);
                const xongNhom = nhom.filter((q) => claimed.includes(q.id)).length;
                const moKhoa =
                  chang === 1 ||
                  MAYOR_QUESTS.filter((q) => q.stage === 1).every((q) => isQuestCompleted(q.id, state));

                const thuTu = [...nhom].sort((a, b) => {
                  const hang = (q: typeof a) =>
                    claimed.includes(q.id) ? 2 : isQuestCompleted(q.id, state) ? 0 : 1;
                  return hang(a) - hang(b);
                });

                return (
                  <div key={chang} className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="text-xs font-black uppercase tracking-wide text-[#8A7355]">
                        {chang === 1 ? 'Chặng 1 · Dựng Phố' : 'Chặng 2 · Bành Trướng'}
                      </p>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10.5px] font-black"
                        style={
                          xongNhom === nhom.length
                            ? { background: '#DCFCE7', color: '#15803D' }
                            : { background: '#F3EADA', color: '#8A7355' }
                        }
                      >
                        {xongNhom}/{nhom.length}
                      </span>
                    </div>

                    {!moKhoa && (
                      <p className="rounded-xl px-3 py-2 text-xs font-bold" style={{ background: '#F3EADA', color: '#8A7355' }}>
                        Xong Chặng 1 để mở khóa phần thưởng lớn của Chặng 2.
                      </p>
                    )}

                    {thuTu.map((q) => {
                      const isClaimed = claimed.includes(q.id);
                      // Chang 2 chua mo thi coi nhu chua xong, de khong hien nut
                      // "Nhan thuong" mau thuan voi dong thong bao khoa o tren.
                      const completed = moKhoa && isQuestCompleted(q.id, state);

                      return (
                  <div
                    key={q.id}
                    className="rounded-2xl border-2"
                    style={{
                      background: isClaimed ? 'rgba(0,0,0,0.04)' : completed ? '#F0FDF4' : '#FFFDF7',
                      borderColor: isClaimed ? '#C9A22733' : completed ? '#22C55E' : '#C9A22766',
                    }}
                  >
                    {/* Dong chinh: title + nut hanh dong */}
                    <div className="flex items-center gap-2.5 p-2.5">
                      {/* Icon trang thai nho */}
                      <span className="shrink-0 text-base leading-none">
                        {isClaimed ? '✅' : completed ? '🎁' : '⬜'}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-[13px] font-black" style={{ color: isClaimed ? '#8A7355' : '#3E2A1B' }}>
                        {q.title}
                      </p>
                      {isClaimed ? (
                        <span className="shrink-0 text-[11px] font-bold text-[#8A7355]">Xong</span>
                      ) : completed ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(q.id, q.title)}
                          className="flex shrink-0 items-center gap-1 rounded-lg border-2 px-2.5 py-1 text-[11px] font-black text-white shadow transition-transform active:scale-95"
                          style={{ background: 'linear-gradient(180deg,#22C55E,#16A34A)', borderColor: '#15803D' }}
                        >
                          <Gift size={12} className="shrink-0" />
                          Nhận
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold" style={{ borderColor: '#C9A22755', color: '#8A7355' }}>
                          Đang làm
                        </span>
                      )}
                    </div>
                    {/* Reward row - luon hien, gon */}
                    <div className="flex items-center gap-2.5 border-t px-2.5 pb-2 pt-1.5" style={{ borderColor: '#C9A22722' }}>
                      <span className="flex items-center gap-1 text-[11px] font-black" style={{ color: '#B45309' }}>
                        <CircleDollarSign size={10} className="shrink-0" />+{formatCompact(q.rewardCoins)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-black text-blue-600">
                        <Gem size={10} className="shrink-0" />+{q.rewardGems}
                      </span>
                      <span className="text-[11px] font-black" style={{ color: '#16A34A' }}>+{formatCompact(q.rewardXp)} XP</span>
                      {/* Mo rong de xem huong dan - text mau xam nho */}
                      {!isClaimed && (
                        <details className="ml-auto">
                          <summary className="cursor-pointer list-none text-[10px] font-bold" style={{ color: '#C9A227' }}>
                            Hướng dẫn
                          </summary>
                          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: '#7A6449' }}>
                            {q.description}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'CITIZENS' && (
            <div className="space-y-2.5">
              {state.npcs.length === 0 ? (
                <div className="rounded-2xl border-2 p-5 text-center" style={{ background: '#FFFDF7', borderColor: '#C9A22755' }}>
                  <p className="text-xs font-black" style={{ color: '#3E2A1B' }}>
                    Thành phố chưa có cư dân hoặc chủ tiệm nào.
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: '#7A6449' }}>
                    Hãy bấm “Xây dựng” để đặt Khu Nhà Phố, Ký Túc Xá hoặc Cửa Hàng đầu tiên!
                  </p>
                </div>
              ) : (
                state.npcs.map((npc) => {
                  const arch = ARCHETYPES[npc.archetype];
                  return (
                    <div
                      key={npc.id}
                      className="rounded-2xl border-2 p-3"
                      style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="shrink-0 rounded-md px-2 py-0.5 text-[12px] font-black text-white"
                            style={{ background: arch?.hue ?? '#EB2F96' }}
                          >
                            {arch?.label ?? npc.role}
                          </span>
                          <p className="truncate text-xs font-black" style={{ color: '#3E2A1B' }}>
                            {npc.name}
                          </p>
                        </div>
                        <span className="shrink-0 text-[12px] font-black" style={{ color: '#16A34A' }}>
                          Tín nhiệm {npc.trust}%
                        </span>
                      </div>
                      <p className="mt-1 text-[13px]" style={{ color: '#7A6449' }}>
                        Nhu cầu: {arch?.painPoint}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {npc.services.length > 0 ? (
                          npc.services.map((srv) => (
                            <span
                              key={srv}
                              className="rounded-full border px-2 py-0.5 text-[12px] font-bold"
                              style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                            >
                              {SERVICE_LABEL[srv] ?? srv}
                            </span>
                          ))
                        ) : (
                          <span className="text-[12px] font-semibold" style={{ color: '#A0916F' }}>
                            Chưa mở dịch vụ số — hãy nâng cấp quầy thu ngân hoặc xử lý hội thoại `!`
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'LEDGER' && (
            <div className="space-y-3">
              <WeekComparisonPanel />
              <ProfitLossStatement onToast={onToast} />
            </div>
          )}

          {tab === 'BANK' && (
            <BankTab onToast={onToast} />
          )}

          {tab === 'STREAK' && <StreakBoard />}

          {tab === 'DATA' && (
            <div className="space-y-3">
              <div className="rounded-2xl border-2 p-3.5" style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}>
                <h2 className="text-xs font-black uppercase" style={{ color: '#4A3018' }}>
                  Thành Phố Của Bạn Đang Ở Đâu
                </h2>
                <p className="mt-1 text-[13px]" style={{ color: '#7A6449' }}>
                  Toàn bộ Đô Thị MoCity nằm trong trình duyệt của thiết bị này, chưa đồng bộ lên
                  tài khoản. Xóa dữ liệu trình duyệt là mất vĩnh viễn. Hãy tải bản sao lưu trước khi
                  xóa bất kỳ thứ gì.
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                  {[
                    ['Ngân khố', `${formatCompact(state.coins)} đồng`],
                    ['Kim Cương', `${state.gems}`],
                    ['Tiệm đã mở', `${state.buildings.length} / ${state.unlockedCols * state.unlockedRows}`],
                    ['Dân cư & chủ tiệm', `${state.npcs.length}`],
                    [
                      'Cấp Thị Trưởng',
                      state.mayorLevel >= MAX_MAYOR_LEVEL
                        ? `Lv.${state.mayorLevel} (tối đa)`
                        : `Lv.${state.mayorLevel} · ${formatCompact(state.mayorXp)}/${formatCompact(xpForLevel(state.mayorLevel))} XP`,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="min-w-0 rounded-xl border px-2.5 py-1.5"
                      style={{ background: '#FBF3DE', borderColor: '#C9A22755' }}
                    >
                      <dt className="truncate font-black uppercase" style={{ color: '#7A6449' }}>
                        {label}
                      </dt>
                      <dd className="truncate font-black" style={{ color: '#3E2A1B' }}>
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="space-y-2 rounded-2xl border-2 p-3.5" style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}>
                <h2 className="text-xs font-black uppercase" style={{ color: '#4A3018' }}>
                  Sao Lưu
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([exportCitySave()], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `mocity-${(state.cityName || 'do-thi').replace(/\s+/g, '-').toLowerCase()}-v${SAVE_FILE_VERSION}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      onToast('Đã tải bản sao lưu Đô Thị xuống máy!');
                    }}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-xs font-black uppercase transition-transform active:scale-95"
                    style={{ background: 'linear-gradient(180deg,#34D399,#059669)', borderColor: '#065F46', color: '#FFFFFF' }}
                  >
                    <Database size={14} className="shrink-0" />
                    <span>Tải bản sao lưu</span>
                  </button>

                  <label className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-xs font-black uppercase transition-transform hover:scale-[1.02] active:scale-95"
                    style={{ background: 'linear-gradient(180deg,#FBBF24,#D97706)', borderColor: '#92400E', color: '#3E2A1B' }}
                  >
                    <TriangleAlert size={14} className="shrink-0" />
                    <span>Nạp lại từ file</span>
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        const result = importCitySave(await file.text());
                        if (result === 'ok') {
                          setConfirmReset(false);
                          onToast(`Đã nạp lại thành phố từ ${file.name}.`);
                        } else if (result === 'incompatible') {
                          onToast('File lưu từ phiên bản mới hơn, không thể nạp lại.');
                        } else {
                          onToast('File không hợp lệ, không phải bản sao lưu MoCity.');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div
                className="space-y-2.5 rounded-2xl border-2 p-3.5"
                style={{ background: '#FEF2F2', borderColor: '#FCA5A5' }}
              >
                <h2 className="flex items-center gap-1.5 text-xs font-black uppercase" style={{ color: '#991B1B' }}>
                  <TriangleAlert size={14} className="shrink-0" />
                  Xóa Đô Thị &amp; Chơi Lại
                </h2>

                {!confirmReset ? (
                  <>
                    <p className="text-[13px]" style={{ color: '#7F1D1D' }}>
                      Xóa vĩnh viễn {state.buildings.length} tiệm, {state.npcs.length} cư dân, toàn bộ đồng
                      và Kim Cương. Thành phố sẽ quay về {formatCompact(STARTING_COINS)} đồng khởi điểm. Không hoàn tác được.
                    </p>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-xs font-black uppercase transition-transform active:scale-95"
                      style={{ background: '#FFFFFF', borderColor: '#DC2626', color: '#991B1B' }}
                    >
                      <span>Tôi muốn xóa và chơi lại</span>
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] font-black" style={{ color: '#991B1B' }}>
                      Chắc chắn? Nhấn nữa để xóa vĩnh viễn.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetCity();
                          setConfirmReset(false);
                          particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
                          onToast('Đã xóa Đô Thị. Bắt đầu thành phố mới!');
                          onClose();
                        }}
                        className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-xs font-black uppercase transition-transform active:scale-95"
                        style={{ background: 'linear-gradient(180deg,#EF4444,#B91C1C)', borderColor: '#7F1D1D', color: '#FFFFFF' }}
                      >
                        <span>Đúng, xóa đi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex h-10 flex-1 items-center justify-center rounded-xl border-2 bg-white px-3 text-xs font-black uppercase transition-transform active:scale-95"
                        style={{ borderColor: '#C9A227', color: '#3E2A1B' }}
                      >
                        <span>Giữ lại thành phố</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
