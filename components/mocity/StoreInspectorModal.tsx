'use client';

import { useState } from 'react';
import {
  ArrowUpCircle,
  CheckCircle2,
  CircleDollarSign,
  Crown,
  Gem,
  Layers,
  Lock,
  Star,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import {
  BUILDING_BY_ID,
  MANAGER_BY_ID,
  nextMilestoneLevel,
  starUpgradeCost,
  STORE_MANAGERS,
  STORE_MODULES,
  upgradeCostCoins,
  ZONES,
} from '@/lib/mocity/mock-city-data';
import { BUILDING_ICON } from './building-icons';
import { nodeYieldBreakdown } from '@/lib/mocity/city-calculator';
import {
  assignStoreManager,
  evolveBuildingStar,
  installStoreModule,
  upgradeBuilding,
  MAX_UPGRADE_PER_ACTION,
  useCity,
} from '@/lib/mocity/store';
import { formatCompact, formatRate } from '@/lib/mocity/format';
import { particles } from './ParticleEngine';
import type { BuildingNode, StoreModuleId } from '@/lib/mocity/types';

const EMPTY_MANAGERS: string[] = [];

export default function StoreInspectorModal({
  open,
  node,
  onClose,
  onToast,
}: {
  open: boolean;
  node: BuildingNode | undefined;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'UPGRADE' | 'MOMO_TECH' | 'MANAGER'>('UPGRADE');
  const coins = useCity((s) => s.coins);
  const gems = useCity((s) => s.gems);
  const buildings = useCity((s) => s.buildings);
  const unlockedManagers = useCity((s) => s.unlockedManagers ?? EMPTY_MANAGERS);

  if (!open || !node) return null;
  const def = BUILDING_BY_ID[node.defId];
  if (!def) return null;

  const Icon = BUILDING_ICON[def.icon];
  const zone = ZONES[def.zone];
  const yieldInfo = nodeYieldBreakdown(node, buildings);
  const nextMilestone = nextMilestoneLevel(node.level);
  const atMaxLevel = node.level >= def.maxLevel;
  const currentStar = node.starRating || 1;
  const starCost = starUpgradeCost(def, currentStar);

  const cost1 = upgradeCostCoins(def, node.level);
  const headroom = Math.max(0, def.maxLevel - node.level);
  const countToMilestone = Math.min(MAX_UPGRADE_PER_ACTION, Math.max(1, nextMilestone - node.level), headroom);
  let costMilestone = 0;
  for (let i = 0; i < countToMilestone; i++) {
    costMilestone += upgradeCostCoins(def, node.level + i);
  }
  /**
   * Con cap sau dot pha nay. `MAX_UPGRADE_PER_ACTION` chan mot click nhay qua
   * cap, nen can bao nguoi choi khi con duoc cap o lan bam sau.
   */
  const levelsLeftAfterMilestone = Math.max(0, headroom - countToMilestone);

  const assignedManager = node.managerId ? MANAGER_BY_ID[node.managerId] : undefined;

  /**
   * Doanh thu tang them khi len 1 cap. `nodeYieldBreakdown` da tinh san phan
   * nhau cua moi cap, nen chi can hieu cua cap cu voi cap sau.
   */
  const currentYield = nodeYieldBreakdown(node, buildings).totalPerSec;
  const nextYield = nodeYieldBreakdown(
    { ...node, level: node.level + 1 },
    buildings.map((b) => (b.id === node.id ? { ...b, level: b.level + 1 } : b)),
  ).totalPerSec;
  const marginalYield = Math.max(0, nextYield - currentYield);
  const paybackMinutes = marginalYield > 0 ? cost1 / marginalYield / 60 : Number.POSITIVE_INFINITY;

  const handleLevelUpgrade = (count: number) => {
    const applied = Math.min(count, MAX_UPGRADE_PER_ACTION, headroom);
    const res = upgradeBuilding(node.col, node.row, applied);
    if (res === 'ok') {
      onToast(`Đã nâng cấp ${def.name} (+${applied} cấp)! Sản lượng Xu tăng vọt.`);
    } else if (res === 'funds') {
      onToast('Chưa đủ Xu để nâng cấp.');
    } else if (res === 'max') {
      onToast('Công trình đã đạt cấp tối đa.');
    }
  };

  const handleStarEvolve = () => {
    const res = evolveBuildingStar(node.col, node.row);
    if (res === 'ok') {
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
      onToast(`Đột phá kiến trúc ${def.name} lên ${currentStar + 1} Sao!`);
    } else if (res === 'funds') {
      onToast('Chưa đủ Xu hoặc Kim Cương để nâng Sao.');
    }
  };

  const handleInstallModule = (modId: StoreModuleId, modName: string) => {
    const res = installStoreModule(node.col, node.row, modId);
    if (res === 'ok') {
      onToast(`Đã tích hợp tiện ích ${modName} cho ${def.name}!`);
    } else if (res === 'funds') {
      onToast('Chưa đủ Xu để gắn tiện ích MoMo này.');
    }
  };

  const handleAssignManager = (mgrId: string, mgrName: string) => {
    const res = assignStoreManager(node.col, node.row, mgrId);
    if (res === 'ok') {
      onToast(`Đã bổ nhiệm ${mgrName} quản lý ${def.name}!`);
    } else if (res === 'funds') {
      onToast('Chưa đủ Xu hoặc Kim Cương để chiêu mộ Quản lý này.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Quản lý ${def.name}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-2 shadow-2xl sm:rounded-3xl"
        style={{
          background: 'linear-gradient(180deg, #FBF3DE 0%, #F2E3BE 100%)',
          borderColor: '#C9A227',
        }}
      >
        {/* Header Cua Hang */}
        <div
          className="flex items-center justify-between gap-3 border-b-2 px-4 py-3.5"
          style={{
            background: 'linear-gradient(180deg, #4A3018 0%, #3E2A1B 100%)',
            borderColor: '#C9A227',
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2"
              style={{ background: zone.tint, borderColor: '#C9A227' }}
            >
              <Icon size={24} className="shrink-0" style={{ color: def.hue }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-black uppercase" style={{ color: '#F5E6C8' }}>
                  {def.name}
                </h2>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-black"
                  style={{ background: '#C9A227', color: '#3E2A1B' }}
                >
                  Cấp {node.level}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      size={12}
                      className="shrink-0"
                      style={{
                        color: idx < currentStar ? '#FBBF24' : '#6B5A45',
                        fill: idx < currentStar ? '#FBBF24' : 'transparent',
                      }}
                    />
                  ))}
                </div>
                {def.momoServiceTag && (
                  <span className="truncate text-[12px] font-bold" style={{ color: '#F0C25E' }}>
                    · {def.momoServiceTag}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: '#C4AC85' }}
            aria-label="Đóng bảng quản lý"
          >
            <X size={18} className="shrink-0" />
          </button>
        </div>

        {/*
          * THOI GIAN HOAN VON.
          *
          * `yieldInfo.totalPerSec` va `cost1` deu da co san trong component
          * nay tu truoc nhung chua bao gio chia cho nhau. Thoi gian hoan von
          * =(chi phi tang them) / (doanh thu tang them) la con so de doc nhat
          * trong game idle - noi cho biet dong tieu nao duoc lai nhanh.
          *
          * Chi tinh khi chua dat cap toi da va tang cap thuc su tang them doanh
          * thu (neu bang 0 thi khong bao gio hoa von duoc).
          */}
        {!atMaxLevel && cost1 > 0 && marginalYield > 0 && (
          <div
            className="border-b px-4 py-2.5"
            style={{ background: 'rgba(5,150,105,0.10)', borderColor: '#10B98144' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-bold uppercase" style={{ color: '#047857' }}>
                  Hoàn vốn nâng cấp
                </p>
                <p className="text-base font-black tabular-nums" style={{ color: '#065F46' }}>
                  {paybackMinutes < 60
                    ? `${Math.round(paybackMinutes)} phút`
                    : paybackMinutes < 60 * 24
                      ? `${(paybackMinutes / 60).toFixed(1)} giờ`
                      : `${(paybackMinutes / 1440).toFixed(1)} ngày`}
                </p>
              </div>
              <p className="flex-1 text-right text-[12px] font-semibold leading-tight" style={{ color: '#3E2A1B' }}>
                Bỏ {formatCompact(cost1)} Xu để nhận thêm {formatRate(marginalYield)}.
                <br />
                <span style={{ color: '#047857' }}>Đây là vốn, không phải chi phí vận hành.</span>
              </p>
            </div>
          </div>
        )}

        {/* Thong so Doanh Thu IDLE RPG & Combo Quy Hoach */}
        <div className="border-b px-4 py-3" style={{ background: 'rgba(201,162,39,0.12)', borderColor: '#C9A22744' }}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[12px] font-bold uppercase" style={{ color: '#7A6449' }}>
                Sản lượng cửa hàng hiện tại
              </p>
              <p className="text-lg font-black tabular-nums" style={{ color: '#A67C1E' }}>
                {formatRate(yieldInfo.totalPerSec)}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 text-[12px] font-black">
              <span className="rounded-lg border px-2 py-1" style={{ background: '#FFFBEB', borderColor: '#F59E0B66', color: '#B45309' }}>
                Đột phá ×{yieldInfo.milestoneMultiplier.toFixed(1)}
              </span>
              {yieldInfo.moduleBonus > 0 && (
                <span className="rounded-lg border px-2 py-1" style={{ background: '#FFF0F8', borderColor: '#EB2F9666', color: '#C22181' }}>
                  MoMo +{Math.round(yieldInfo.moduleBonus * 100)}%
                </span>
              )}
              {yieldInfo.managerBonus > 0 && (
                <span className="rounded-lg border px-2 py-1" style={{ background: '#EFF6FF', borderColor: '#2563EB66', color: '#1D4ED8' }}>
                  Quản lý +{Math.round(yieldInfo.managerBonus * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Hieu ung Lien Ke City Builder */}
          <div
            className="mt-2 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[13px]"
            style={
              yieldInfo.synergyBonus > 0
                ? { background: '#F0FDF4', borderColor: '#22C55E88', color: '#15803D' }
                : { background: 'rgba(0,0,0,0.04)', borderColor: '#C9A22744', color: '#7A6449' }
            }
          >
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <Layers size={14} className="shrink-0" />
              <span className="truncate font-bold">
                {yieldInfo.synergyBonus > 0
                  ? `Đã kích hoạt Combo với: ${yieldInfo.synergyNeighbors.join(', ')}`
                  : def.synergyLabel || 'Đặt cạnh Rạp Phim, Cà Phê hoặc Túi Thần Tài để kích hoạt Combo'}
              </span>
            </div>
            <span className="shrink-0 font-black">
              {yieldInfo.synergyBonus > 0 ? `+${Math.round(yieldInfo.synergyBonus * 100)}% Xu` : 'Chưa kích hoạt'}
            </span>
          </div>
        </div>

        {/* 3 Tabs Dieu Khien */}
        <div className="grid grid-cols-3 gap-1.5 border-b px-4 py-2.5" style={{ borderColor: '#C9A22744' }}>
          <button
            type="button"
            onClick={() => setActiveTab('UPGRADE')}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              activeTab === 'UPGRADE'
                ? { background: 'linear-gradient(180deg,#D9A441,#C9A227)', color: '#3E2A1B', borderColor: '#8A6A43' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <ArrowUpCircle size={14} className="shrink-0" />
            <span className="truncate">Cấp & Sao</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MOMO_TECH')}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              activeTab === 'MOMO_TECH'
                ? { background: 'linear-gradient(180deg,#EB2F96,#C22181)', color: '#FFFFFF', borderColor: '#9D174D' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <Zap size={14} className="shrink-0" />
            <span className="truncate">Tiện Ích MoMo ({node.modules?.length ?? 0}/3)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MANAGER')}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition-all"
            style={
              activeTab === 'MANAGER'
                ? { background: 'linear-gradient(180deg,#2563EB,#1D4ED8)', color: '#FFFFFF', borderColor: '#1E3A8A' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B5A45', borderColor: 'transparent' }
            }
          >
            <UserCheck size={14} className="shrink-0" />
            <span className="truncate">Quản Lý RPG</span>
          </button>
        </div>

        {/* Noi dung Tab */}
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
          {activeTab === 'UPGRADE' && (
            <>
              {/* Tien trinh Moc Dot Pha */}
              <div className="rounded-2xl border-2 p-3.5" style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}>
                <div className="flex items-center justify-between text-xs font-black" style={{ color: '#3E2A1B' }}>
                  <span>Mốc Đột Phá Tiếp Theo: Cấp {nextMilestone}</span>
                  <span style={{ color: '#D97706' }}>Thưởng Đột Phá ×1.5 – ×3.0 Xu/s</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-amber-950/15">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (node.level / nextMilestone) * 100)}%`,
                      background: 'linear-gradient(90deg, #D9A441, #EB2F96)',
                    }}
                  />
                </div>

                {!atMaxLevel ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={coins < cost1}
                      onClick={() => handleLevelUpgrade(1)}
                      className="flex flex-col items-center justify-center rounded-xl border-2 py-2.5 px-3 transition-transform active:scale-95"
                      style={
                        coins >= cost1
                          ? { background: 'linear-gradient(180deg,#D9A441,#C9A227)', borderColor: '#8A6A43', color: '#3E2A1B' }
                          : { background: 'rgba(0,0,0,0.06)', borderColor: '#C9A22733', color: '#9C8767', cursor: 'not-allowed' }
                      }
                    >
                      <span className="text-xs font-black uppercase">Nâng +1 Cấp</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[13px] font-bold">
                        <CircleDollarSign size={12} className="shrink-0" />
                        {formatCompact(cost1)} Xu
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={coins < costMilestone}
                      onClick={() => handleLevelUpgrade(countToMilestone)}
                      className="flex flex-col items-center justify-center rounded-xl border-2 py-2.5 px-3 transition-transform active:scale-95"
                      style={
                        coins >= costMilestone
                          ? { background: 'linear-gradient(180deg,#EB2F96,#C22181)', borderColor: '#9D174D', color: '#FFFFFF' }
                          : { background: 'rgba(0,0,0,0.06)', borderColor: '#C9A22733', color: '#9C8767', cursor: 'not-allowed' }
                      }
                    >
                      <span className="text-xs font-black uppercase">
                        Đột Phá Cấp {node.level + countToMilestone} (+{countToMilestone})
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[13px] font-bold">
                        <CircleDollarSign size={12} className="shrink-0" />
                        {formatCompact(costMilestone)} Xu
                      </span>
                    </button>
                    {/*
                     * Nut "Đột Phá" chi nhay toi da MAX_UPGRADE_PER_ACTION cap
                     * moi thao tac. Neu con cap, noi ro con bao nhieu de tranh
                     * viec nguoi choi click lien tiep khong bi cam.
                     */}
                    {levelsLeftAfterMilestone > 0 && (
                      <p className="text-center text-[12px] font-bold" style={{ color: '#9C8767' }}>
                        Còn {levelsLeftAfterMilestone} cấp nữa tới mốc ×{nextMilestone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-center text-xs font-black" style={{ color: '#16A34A' }}>
                    Công trình đã đạt cấp độ tối đa ({def.maxLevel})!
                  </p>
                )}
              </div>

              {/* Nang Sao Cong Trinh (1★ -> 5★) */}
              <div className="rounded-2xl border-2 p-3.5" style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase" style={{ color: '#3E2A1B' }}>
                      Tiến Hóa Kiến Trúc ({currentStar}★ / 5★)
                    </p>
                    <p className="mt-0.5 text-[13px]" style={{ color: '#7A6449' }}>
                      Mỗi cấp Sao tăng +35% sản lượng Xu và +25% sức chứa Cư dân.
                    </p>
                  </div>
                  <Star size={18} className="shrink-0 text-amber-500" />
                </div>

                {currentStar < 5 ? (
                  <button
                    type="button"
                    disabled={coins < starCost.coins || gems < starCost.gems}
                    onClick={handleStarEvolve}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 text-xs font-black uppercase transition-transform active:scale-95"
                    style={
                      coins >= starCost.coins && gems >= starCost.gems
                        ? { background: 'linear-gradient(180deg,#F59E0B,#D97706)', borderColor: '#92400E', color: '#FFFFFF' }
                        : { background: 'rgba(0,0,0,0.06)', borderColor: '#C9A22733', color: '#9C8767', cursor: 'not-allowed' }
                    }
                  >
                    <Star size={14} className="shrink-0" />
                    <span>Tiến hóa lên {currentStar + 1} Sao</span>
                    <span className="flex items-center gap-1">
                      · {formatCompact(starCost.coins)} Xu & {starCost.gems} Kim Cương
                    </span>
                  </button>
                ) : (
                  <p className="mt-2 text-center text-xs font-black text-amber-600">
                    Đã đạt phẩm chất 5 Sao Huyền Thoại!
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'MOMO_TECH' && (
            <div className="space-y-2.5">
              {STORE_MODULES.map((mod) => {
                const installed = (node.modules ?? []).includes(mod.id);
                const levelLocked = node.level < mod.unlockLevel;
                const affordable = coins >= mod.costCoins;

                return (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border-2 p-3"
                    style={{
                      background: installed ? '#F0FDF4' : '#FFFDF7',
                      borderColor: installed ? '#22C55E' : '#C9A22766',
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-md px-2 py-0.5 text-[12px] font-black text-white"
                          style={{ background: mod.color }}
                        >
                          +{Math.round(mod.yieldBonus * 100)}% Xu/s
                        </span>
                        <p className="truncate text-xs font-black" style={{ color: '#3E2A1B' }}>
                          {mod.name}
                        </p>
                      </div>
                      <p className="mt-1 text-[13px]" style={{ color: '#7A6449' }}>
                        {mod.description}
                      </p>
                    </div>

                    {installed ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700">
                        <CheckCircle2 size={14} className="shrink-0" />
                        Đã gắn
                      </span>
                    ) : levelLocked ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-xl bg-black/5 px-3 py-2 text-[13px] font-bold text-[#8A7355]">
                        <Lock size={12} className="shrink-0" />
                        Yêu cầu Cấp {mod.unlockLevel}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!affordable}
                        onClick={() => handleInstallModule(mod.id, mod.name)}
                        className="flex shrink-0 flex-col items-center rounded-xl border-2 px-3.5 py-2 text-xs font-black transition-transform active:scale-95"
                        style={
                          affordable
                            ? { background: 'linear-gradient(180deg,#EB2F96,#C22181)', borderColor: '#9D174D', color: '#FFFFFF' }
                            : { background: 'rgba(0,0,0,0.06)', borderColor: '#C9A22733', color: '#9C8767', cursor: 'not-allowed' }
                        }
                      >
                        <span>Tích hợp</span>
                        <span className="text-[12px]">{formatCompact(mod.costCoins)} Xu</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'MANAGER' && (
            <div className="space-y-2.5">
              {STORE_MANAGERS.map((mgr) => {
                const isAssignedHere = assignedManager?.id === mgr.id;
                const isUnlocked = unlockedManagers.includes(mgr.id);
                const canAffordMgr = coins >= mgr.costCoins && gems >= mgr.costGems;

                return (
                  <div
                    key={mgr.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border-2 p-3"
                    style={{
                      background: isAssignedHere ? '#EFF6FF' : '#FFFDF7',
                      borderColor: isAssignedHere ? '#2563EB' : '#C9A22766',
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[12px] font-black text-white"
                          style={{ background: mgr.hue }}
                        >
                          {mgr.rarity}
                        </span>
                        <p className="truncate text-xs font-black" style={{ color: '#3E2A1B' }}>
                          {mgr.name}
                        </p>
                        <span className="truncate text-[12px] font-bold" style={{ color: '#8A7355' }}>
                          · {mgr.title}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px]" style={{ color: '#5B3D22' }}>
                        <strong>{mgr.skillName}:</strong> +{Math.round(mgr.yieldMultiplier * 100)}% Xu/s, +{mgr.happinessBonus} Hạnh phúc
                      </p>
                    </div>

                    {isAssignedHere ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-xl bg-blue-100 px-3 py-2 text-xs font-black text-blue-800">
                        <Crown size={14} className="shrink-0" />
                        Đang quản lý
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!isUnlocked && !canAffordMgr}
                        onClick={() => handleAssignManager(mgr.id, mgr.name)}
                        className="flex shrink-0 flex-col items-center rounded-xl border-2 px-3 py-1.5 text-xs font-black transition-transform active:scale-95"
                        style={
                          isUnlocked || canAffordMgr
                            ? { background: 'linear-gradient(180deg,#2563EB,#1D4ED8)', borderColor: '#1E3A8A', color: '#FFFFFF' }
                            : { background: 'rgba(0,0,0,0.06)', borderColor: '#C9A22733', color: '#9C8767', cursor: 'not-allowed' }
                        }
                      >
                        <span>{isUnlocked ? 'Điều động' : 'Chiêu mộ'}</span>
                        {!isUnlocked && (
                          <span className="flex items-center gap-1 text-[12px]">
                            {formatCompact(mgr.costCoins)} Xu
                            {mgr.costGems > 0 && (
                              <>
                                · <Gem size={9} className="shrink-0" />
                                {mgr.costGems}
                              </>
                            )}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
