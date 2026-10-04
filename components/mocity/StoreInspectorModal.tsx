'use client';

import { useState } from 'react';
import {
  ArrowUpCircle,
  CheckCircle2,
  CircleDollarSign,
  Crown,
  FileText,
  Gem,
  Layers,
  Lock,
  Star,
  UserCheck,
  X,
  Zap,
  ShoppingBag,
} from 'lucide-react';
import {
  BUILDING_BY_ID,
  MANAGER_BY_ID,
  nextMilestoneLevel,
  milestoneMultiplierFor,
  starUpgradeCost,
  STORE_MANAGERS,
  STORE_MODULES,
  upgradeCostCoins,
  ZONES,
} from '@/lib/mocity/mock-city-data';
import { BUILDING_ICON } from './building-icons';
import ShophouseFacade from './ShophouseFacade';
import BuildingDossierView from './BuildingDossierView';
import { ChibiBody } from './ChibiRenderer';
import { MANAGER_APPEARANCES } from '@/lib/mocity/character-roster';
import { themeForBuilding } from '@/lib/mocity/facade-theme';
import { nodeYieldBreakdown, queueCapacityFor } from '@/lib/mocity/city-calculator';
import { queueHardCap, arrivalRateFor, serviceIntervalMsFor, STAFF_MAX } from '@/lib/mocity/transactions';
import {
  assignStoreManager,
  evolveBuildingStar,
  hireStaff,
  installStoreModule,
  staffHireCost,
  upgradeBuilding,
  effectiveMaxLevel,
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
  const [activeTab, setActiveTab] = useState<'INFO' | 'UPGRADE' | 'MOMO_TECH' | 'MANAGER'>('INFO');
  const coins = useCity((s) => s.coins);
  const gems = useCity((s) => s.gems);
  const buildings = useCity((s) => s.buildings);
  const unlockedManagers = useCity((s) => s.unlockedManagers ?? EMPTY_MANAGERS);
  const mayorLevel = useCity((s) => s.mayorLevel);

  if (!open || !node) return null;
  const def = BUILDING_BY_ID[node.defId];
  if (!def) return null;

  const Icon = BUILDING_ICON[def.icon];
  const zone = ZONES[def.zone];
  const facadeTheme = themeForBuilding(def.id);
  const houseNumber = node.col * 2 + node.row * 20 + 2;
  const yieldInfo = nodeYieldBreakdown(node, buildings);
  const nextMilestone = nextMilestoneLevel(node.level);
  // He so dot pha CU THE cua moc sap toi (vd 1.4x), thay vi dai cung ban cu.
  const nextMilestoneStep = node.level >= nextMilestone
    ? 1
    : milestoneMultiplierFor(nextMilestone) / milestoneMultiplierFor(nextMilestone - 1);
  const upgradeCap = effectiveMaxLevel(def.maxLevel, mayorLevel);
  const atMaxLevel = node.level >= def.maxLevel;
  const gatedByMayor = !atMaxLevel && node.level >= upgradeCap;
  const currentStar = node.starRating || 1;
  const starCost = starUpgradeCost(def, currentStar);

  const cost1 = upgradeCostCoins(def, node.level);
  const headroom = Math.max(0, upgradeCap - node.level);
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
      onToast(`Đã nâng cấp ${def.name} (+${applied} cấp)! Sản lượng đồng tăng vọt.`);
    } else if (res === 'funds') {
      onToast('Chưa đủ đồng để nâng cấp.');
    } else if (res === 'max') {
      onToast('Công trình đã đạt cấp tối đa.');
    } else if (res === 'mayor') {
      onToast(`Lên cấp Thị Trưởng ${upgradeCap + 1} để mở khóa nâng cấp cao hơn.`);
    }
  };

  const handleStarEvolve = () => {
    const res = evolveBuildingStar(node.col, node.row);
    if (res === 'ok') {
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
      onToast(`Đột phá kiến trúc ${def.name} lên ${currentStar + 1} Sao!`);
    } else if (res === 'funds') {
      onToast('Chưa đủ đồng hoặc Kim Cương để nâng Sao.');
    }
  };

  const handleInstallModule = (modId: StoreModuleId, modName: string) => {
    const res = installStoreModule(node.col, node.row, modId);
    if (res === 'ok') {
      onToast(`Đã tích hợp tiện ích ${modName} cho ${def.name}!`);
    } else if (res === 'funds') {
      onToast('Chưa đủ đồng để gắn tiện ích nâng cấp này.');
    }
  };

  const handleAssignManager = (mgrId: string, mgrName: string) => {
    const res = assignStoreManager(node.col, node.row, mgrId);
    if (res === 'ok') {
      onToast(`Đã mời ${mgrName} làm Cổ Đông góp vốn ${def.name}!`);
    } else if (res === 'funds') {
      onToast('Chưa đủ đồng hoặc Kim Cương để mời Cổ Đông này.');
    }
  };

  const handleHireStaff = () => {
    const res = hireStaff(node.col, node.row);
    if (res === 'ok') {
      onToast(`Đã thuê thêm Nhân Viên cho ${def.name}! Tiệm bán nhanh hơn.`);
    } else if (res === 'funds') {
      onToast('Chưa đủ đồng để thuê thêm Nhân Viên.');
    } else if (res === 'max') {
      onToast(`${def.name} đã đủ ${STAFF_MAX} Nhân Viên tối đa.`);
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
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border-[3.5px] border-[#5A3517] shadow-[0_8px_0_#3A200B,0_20px_40px_rgba(0,0,0,0.5)] sm:rounded-[32px]"
        style={{
          background: 'linear-gradient(180deg, #FFFDF7 0%, #FAF2DE 100%)',
        }}
      >
        {/* Mái Hiên Shophouse Chibi (Striped Awning Strip) */}
        <div
          className="relative h-4 w-full shrink-0 overflow-hidden border-b-2 border-[#5A3517]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #D97706 0px, #D97706 18px, #FFFBEB 18px, #FFFBEB 36px)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/15" />
        </div>

        {/* Header Cửa Hàng - Biển Hiệu Quán Phố Thị */}
        <div
          className="flex items-center justify-between gap-3 border-b-2 border-[#7C4A21] px-4 py-3"
          style={{
            background: 'linear-gradient(180deg, #5A3517 0%, #3D220E 100%)',
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/*
             * THUMBNAIL MẶT TIỀN THẬT - đóng khung tranh đồ chơi retro.
             */}
            <span
              className="relative block shrink-0 overflow-hidden rounded-2xl border-2 shadow-[0_2px_0_#2E1807]"
              style={{ width: 56, height: 72, borderColor: '#FDE68A', background: facadeTheme.wallBg }}
            >
              <span
                className="pointer-events-none absolute bottom-0 left-0"
                style={{ width: 228, transform: 'scale(0.246)', transformOrigin: 'bottom left' }}
              >
                <ShophouseFacade
                  shopType={facadeTheme.shopType}
                  houseNumber={houseNumber}
                  shopTitle={def.shortName || def.name}
                  isBuilt
                  unlocked
                  level={node.level}
                  starRating={currentStar}
                  yieldPerSec={yieldInfo.totalPerSec}
                  timeOfDay="DAY"
                  wallBg={facadeTheme.wallBg}
                  wallHatch={facadeTheme.wallHatch}
                  signBg={facadeTheme.signBg}
                />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-black uppercase text-[#FEF3C7] drop-shadow-xs">
                  {def.name}
                </h2>
                <span
                  className="shrink-0 rounded-full border border-[#B45309] bg-[#F59E0B] px-2 py-0.5 text-[11px] font-black text-amber-950 shadow-xs"
                >
                  ⭐ Cấp {node.level}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      size={13}
                      className="shrink-0"
                      style={{
                        color: idx < currentStar ? '#FBBF24' : '#6B5A45',
                        fill: idx < currentStar ? '#FBBF24' : 'transparent',
                        filter: idx < currentStar ? 'drop-shadow(0 1px 2px rgba(251,191,36,0.6))' : 'none',
                      }}
                    />
                  ))}
                </div>
                {def.momoServiceTag && (
                  <span className="truncate rounded-md border border-[#D5CEBF] bg-[#FAF7F0] px-2 py-0.5 text-[10px] font-bold text-[#6E4F3A]">
                    {def.momoServiceTag}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Nút Đóng Tròn 3D Arcade */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#7F1D1D] bg-[#EF4444] text-white shadow-[0_3px_0_#7F1D1D] transition-transform hover:scale-105 active:translate-y-0.5 active:shadow-none"
            aria-label="Đóng bảng quản lý"
          >
            <X size={16} strokeWidth={3} className="shrink-0" />
          </button>
        </div>

        {/* Heo Đất Nhắc Hoàn Vốn */}
        {!atMaxLevel && !gatedByMayor && cost1 > 0 && marginalYield > 0 && (
          <div
            className="border-b-2 border-[#10B98155] px-4 py-2"
            style={{ background: '#ECFDF5' }}
          >
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#065F46]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base shrink-0">🐷</span>
                <p className="truncate">
                  <strong className="text-[#047857]">Mẹo Thu Hồi Vốn: </strong>
                  Hoàn vốn sau ~{paybackMinutes < 60
                    ? `${Math.round(paybackMinutes)} phút`
                    : paybackMinutes < 60 * 24
                      ? `${(paybackMinutes / 60).toFixed(1)} giờ`
                      : `${(paybackMinutes / 1440).toFixed(1)} ngày`}
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-[#D1FAE5] px-2 py-0.5 text-[11px] font-black text-[#047857]">
                +{formatRate(marginalYield)}
              </span>
            </div>
          </div>
        )}

        {/* Bảng Doanh Thu Quán & Sức Chứa Phố (Chibi Cashier HUD) */}
        <div className="border-b-2 border-[#D4A373] bg-[#FFF8EB] p-3.5 shadow-inner">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#8A6A43]">
                🪙 Doanh Thu Cửa Hàng
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black tabular-nums text-[#B45309] drop-shadow-xs">
                  {formatRate(yieldInfo.totalPerSec)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 text-[11px] font-black">
              <span className="rounded-xl border-2 border-[#F59E0B66] bg-[#FEF3C7] px-2 py-1 text-[#92400E] shadow-xs">
                ⚡ Đột phá ×{yieldInfo.milestoneMultiplier.toFixed(1)}
              </span>
              {yieldInfo.moduleBonus > 0 && (
                <span className="rounded-xl border-2 border-[#EB2F9666] bg-[#FFF0F8] px-2 py-1 text-[#C22181] shadow-xs">
                  🌸 MoMo +{Math.round(yieldInfo.moduleBonus * 100)}%
                </span>
              )}
              {yieldInfo.managerBonus > 0 && (
                <span className="rounded-xl border-2 border-[#2563EB66] bg-[#EFF6FF] px-2 py-1 text-[#1D4ED8] shadow-xs">
                  👑 Quản lý +{Math.round(yieldInfo.managerBonus * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Dải Banner Cặp Đôi Hàng Xóm Combo */}
          <div
            className="mt-2.5 flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-1.5 text-xs font-bold"
            style={
              yieldInfo.synergyBonus > 0
                ? { background: '#F0FDF4', borderColor: '#22C55E', color: '#15803D' }
                : { background: '#FFF', borderColor: '#E6D9BE', color: '#8A7355' }
            }
          >
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="text-sm shrink-0">🏘️</span>
              <span className="truncate">
                {yieldInfo.synergyBonus > 0
                  ? `Combo: ${yieldInfo.synergyNeighbors.join(', ')}`
                  : def.synergyLabel || 'Đặt cạnh công trình tương hỗ để kích hoạt Combo!'}
              </span>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black"
              style={
                yieldInfo.synergyBonus > 0
                  ? { background: '#22C55E', color: '#FFF' }
                  : { background: '#F3F4F6', color: '#6B7280' }
              }
            >
              {yieldInfo.synergyBonus > 0 ? `+${Math.round(yieldInfo.synergyBonus * 100)}% đồng` : 'Chưa kích hoạt'}
            </span>
          </div>

          {/* 3 Thẻ Đặc Tính Tiệm Phố */}
          {def.zone === 'COMMERCIAL' && (
            <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl border-2 border-[#E6D9BE] bg-white p-2 shadow-xs">
                <p className="text-[10px] font-bold text-[#8A7355]">🏪 Quầy Phục Vụ</p>
                <p className="mt-0.5 font-black text-[#3E2A1B]">{queueCapacityFor(node)} quầy</p>
              </div>
              <div className="rounded-2xl border-2 border-[#E6D9BE] bg-white p-2 shadow-xs">
                <p className="text-[10px] font-bold text-[#8A7355]">🚶 Sức Chứa Hàng</p>
                <p className="mt-0.5 font-black text-[#3E2A1B]">{queueHardCap(node)} khách</p>
              </div>
              <div className="rounded-2xl border-2 border-[#E6D9BE] bg-white p-2 shadow-xs">
                <p className="text-[10px] font-bold text-[#8A7355]">💳 Thanh Toán</p>
                <p className="mt-0.5 font-black text-[#047857]">
                  {node.modules?.includes('QR_LOA_THAN_TAI') ? '📱 QR + Loa' : '💵 Tiền Mặt'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4 Tabs Phím Bấm Đồ Chơi 3D (Tactile Chibi Buttons) */}
        <div className="grid grid-cols-4 gap-1.5 border-b-2 border-[#D4A373] bg-[#F7EED9] p-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('INFO')}
            className="flex items-center justify-center gap-1 rounded-2xl border-2 py-2 text-xs font-black transition-all active:translate-y-0.5"
            style={
              activeTab === 'INFO'
                ? {
                    background: 'linear-gradient(180deg,#7C4A21,#5A3517)',
                    color: '#FFFFFF',
                    borderColor: '#3D220E',
                    boxShadow: '0 3px 0 #3D220E',
                  }
                : {
                    background: '#FFFDF7',
                    color: '#7C4A21',
                    borderColor: '#D4C3A3',
                    boxShadow: '0 2px 0 #D4C3A3',
                  }
            }
          >
            <FileText size={13} className="shrink-0" />
            <span className="truncate">Chi Tiết</span>
          </button>
          <button
            type="button"
            data-tour="shop-tab-upgrade"
            onClick={() => setActiveTab('UPGRADE')}
            className="flex items-center justify-center gap-1 rounded-2xl border-2 py-2 text-xs font-black transition-all active:translate-y-0.5"
            style={
              activeTab === 'UPGRADE'
                ? {
                    background: 'linear-gradient(180deg,#F59E0B,#D97706)',
                    color: '#FFFFFF',
                    borderColor: '#92400E',
                    boxShadow: '0 3px 0 #92400E',
                  }
                : {
                    background: '#FFFDF7',
                    color: '#B45309',
                    borderColor: '#FDE68A',
                    boxShadow: '0 2px 0 #FDE68A',
                  }
            }
          >
            <ArrowUpCircle size={13} className="shrink-0" />
            <span className="truncate">Nâng Cấp</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MOMO_TECH')}
            className="flex items-center justify-center gap-1 rounded-2xl border-2 py-2 text-xs font-black transition-all active:translate-y-0.5"
            style={
              activeTab === 'MOMO_TECH'
                ? {
                    background: 'linear-gradient(180deg,#EC4899,#BE185D)',
                    color: '#FFFFFF',
                    borderColor: '#831843',
                    boxShadow: '0 3px 0 #831843',
                  }
                : {
                    background: '#FFFDF7',
                    color: '#BE185D',
                    borderColor: '#FBCFE8',
                    boxShadow: '0 2px 0 #FBCFE8',
                  }
            }
          >
            <Zap size={13} className="shrink-0" />
            <span className="truncate">MoMo ({node.modules?.length ?? 0}/3)</span>
          </button>
          <button
            type="button"
            data-tour="shop-tab-staff"
            onClick={() => setActiveTab('MANAGER')}
            className="flex items-center justify-center gap-1 rounded-2xl border-2 py-2 text-xs font-black transition-all active:translate-y-0.5"
            style={
              activeTab === 'MANAGER'
                ? {
                    background: 'linear-gradient(180deg,#3B82F6,#1D4ED8)',
                    color: '#FFFFFF',
                    borderColor: '#1E3A8A',
                    boxShadow: '0 3px 0 #1E3A8A',
                  }
                : {
                    background: '#FFFDF7',
                    color: '#1D4ED8',
                    borderColor: '#BFDBFE',
                    boxShadow: '0 2px 0 #BFDBFE',
                  }
            }
          >
            <UserCheck size={13} className="shrink-0" />
            <span className="truncate">Nhân Lực</span>
          </button>
        </div>

        {/* Nội dung Tab */}
        <div className="no-scrollbar flex-1 space-y-3.5 overflow-y-auto p-4">
          {activeTab === 'INFO' && (
            <BuildingDossierView
              node={node}
              def={def}
              yieldInfo={yieldInfo}
              buildings={buildings}
              houseNumber={houseNumber}
              onSwitchToUpgrade={() => setActiveTab('UPGRADE')}
            />
          )}

          {activeTab === 'UPGRADE' && (
            <>
              {/* Tiến trình Mốc Đột Phá Kẹo Ngọt */}
              <div
                className="rounded-3xl border-[2.5px] p-4 shadow-[0_4px_0_#7C4A21]"
                style={{ background: '#FFFDF5', borderColor: '#7C4A21' }}
              >
                <div className="flex items-center justify-between text-xs font-black" style={{ color: '#3E2A1B' }}>
                  <span className="flex items-center gap-1">
                    🚩 Mốc Đột Phá: Cấp {nextMilestone}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[#B45309]">
                    Vượt mốc: ×{nextMilestoneStep.toFixed(2)} đồng/s
                  </span>
                </div>

                {/* Thanh Kẹo Tiến Trình */}
                <div className="mt-2.5 h-3.5 w-full overflow-hidden rounded-full border-2 border-[#7C4A21] bg-amber-100 p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (node.level / nextMilestone) * 100)}%`,
                      background: 'linear-gradient(90deg, #F59E0B, #EC4899)',
                    }}
                  />
                </div>

                {!atMaxLevel && !gatedByMayor ? (
                  <div className="mt-3.5 space-y-2">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        data-tour="shop-upgrade-btn"
                        disabled={coins < cost1}
                        onClick={() => handleLevelUpgrade(1)}
                        className="flex flex-col items-center justify-center rounded-2xl border-b-4 py-2.5 px-3 transition-transform active:translate-y-0.5 active:border-b-2 shadow-sm"
                        style={
                          coins >= cost1
                            ? {
                                background: 'linear-gradient(180deg,#FBBF24,#F59E0B)',
                                borderColor: '#92400E',
                                color: '#451A03',
                              }
                            : {
                                background: '#E5E7EB',
                                borderColor: '#9CA3AF',
                                color: '#9CA3AF',
                                cursor: 'not-allowed',
                              }
                        }
                      >
                        <span className="text-xs font-black uppercase">Nâng +1 Cấp</span>
                        <span className="mt-0.5 flex items-center gap-1 text-[13px] font-black">
                          <CircleDollarSign size={13} className="shrink-0" />
                          {formatCompact(cost1)}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={coins < costMilestone}
                        onClick={() => handleLevelUpgrade(countToMilestone)}
                        className="flex flex-col items-center justify-center rounded-2xl border-b-4 py-2.5 px-3 transition-transform active:translate-y-0.5 active:border-b-2 shadow-sm"
                        style={
                          coins >= costMilestone
                            ? {
                                background: 'linear-gradient(180deg,#F472B6,#EC4899)',
                                borderColor: '#9D174D',
                                color: '#FFFFFF',
                              }
                            : {
                                background: '#E5E7EB',
                                borderColor: '#9CA3AF',
                                color: '#9CA3AF',
                                cursor: 'not-allowed',
                              }
                        }
                      >
                        <span className="text-xs font-black uppercase">
                          Đột Phá +{countToMilestone} Cấp
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[13px] font-black">
                          <CircleDollarSign size={13} className="shrink-0" />
                          {formatCompact(costMilestone)}
                        </span>
                      </button>
                    </div>

                    {levelsLeftAfterMilestone > 0 && (
                      <p className="text-center text-[12px] font-bold text-[#8A7355]">
                        Còn {levelsLeftAfterMilestone} cấp nữa tới mốc Cấp {nextMilestone} (×{nextMilestoneStep.toFixed(2)})
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-center text-xs font-black" style={{ color: gatedByMayor ? '#B45309' : '#16A34A' }}>
                    {gatedByMayor
                      ? `🔒 Cần cấp Thị Trưởng ${upgradeCap + 1} để mở khóa nâng cấp tiếp (${node.level}/${upgradeCap})`
                      : `Công trình đã đạt cấp độ tối đa (${def.maxLevel})!`}
                  </p>
                )}
              </div>

              {/* Nâng Sao Công Trình (1★ -> 5★) */}
              <div
                className="rounded-3xl border-[2.5px] p-4 shadow-[0_4px_0_#7C4A21]"
                style={{ background: '#FFFDF5', borderColor: '#7C4A21' }}
              >
                <div className="flex items-center justify-between border-b-2 border-[#EADFC7] pb-2">
                  <div>
                    <p className="text-xs font-black uppercase text-[#3E2A1B]">
                      ⭐ Tiến Hóa Kiến Trúc ({currentStar}★ / 5★)
                    </p>
                    <p className="mt-0.5 text-xs text-[#7A6449]">
                      Mỗi cấp Sao tăng +35% sản lượng và +25% sức chứa Cư dân.
                    </p>
                  </div>
                  <Star size={20} className="shrink-0 text-amber-500 fill-amber-400" />
                </div>

                {currentStar < 5 ? (
                  <button
                    type="button"
                    disabled={coins < starCost.coins || gems < starCost.gems}
                    onClick={handleStarEvolve}
                    className="mt-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-b-4 text-xs font-black uppercase transition-transform active:translate-y-0.5 active:border-b-2 shadow-md"
                    style={
                      coins >= starCost.coins && gems >= starCost.gems
                        ? {
                            background: 'linear-gradient(180deg,#F59E0B,#D97706)',
                            borderColor: '#92400E',
                            color: '#FFFFFF',
                          }
                        : {
                            background: '#E5E7EB',
                            borderColor: '#9CA3AF',
                            color: '#9CA3AF',
                            cursor: 'not-allowed',
                          }
                    }
                  >
                    <Star size={15} className="shrink-0 fill-current" />
                    <span>Tiến hóa lên {currentStar + 1} Sao</span>
                    <span className="flex items-center gap-1 font-black">
                      · {formatCompact(starCost.coins)} & {starCost.gems} Kim Cương
                    </span>
                  </button>
                ) : (
                  <p className="mt-2.5 text-center text-xs font-black text-amber-600">
                    👑 Đã đạt phẩm chất 5 Sao Huyền Thoại!
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'MOMO_TECH' && (
            <div className="space-y-3">
              {STORE_MODULES.map((mod) => {
                const installed = (node.modules ?? []).includes(mod.id);
                const levelLocked = node.level < mod.unlockLevel;
                const affordable = coins >= mod.costCoins;

                return (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between gap-3 rounded-3xl border-[2.5px] p-3.5 shadow-[0_4px_0_#7C4A21]"
                    style={{
                      background: installed ? '#F0FDF4' : '#FFFDF5',
                      borderColor: installed ? '#22C55E' : '#7C4A21',
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-black text-white shadow-xs"
                          style={{ background: mod.color }}
                        >
                          +{Math.round(mod.yieldBonus * 100)}% Doanh thu
                        </span>
                        <p className="truncate text-xs font-black text-[#3E2A1B]">
                          {mod.name}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[#6B5A45]">
                        {mod.description}
                      </p>
                    </div>

                    {installed ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700 border-2 border-emerald-300">
                        <CheckCircle2 size={15} className="shrink-0" />
                        Đã gắn
                      </span>
                    ) : levelLocked ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-100/60 px-2.5 py-1.5 text-xs font-bold text-[#8A7355] border border-amber-200">
                        <Lock size={12} className="shrink-0" />
                        Cần Cấp {mod.unlockLevel}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!affordable}
                        onClick={() => handleInstallModule(mod.id, mod.name)}
                        className="flex shrink-0 flex-col items-center rounded-2xl border-b-4 px-3.5 py-2 text-xs font-black transition-transform active:translate-y-0.5 active:border-b-2 shadow-xs"
                        style={
                          affordable
                            ? {
                                background: 'linear-gradient(180deg,#EC4899,#BE185D)',
                                borderColor: '#831843',
                                color: '#FFFFFF',
                              }
                            : {
                                background: '#E5E7EB',
                                borderColor: '#9CA3AF',
                                color: '#9CA3AF',
                                cursor: 'not-allowed',
                              }
                        }
                      >
                        <span>Tích hợp</span>
                        <span className="text-[11px]">{formatCompact(mod.costCoins)}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'MANAGER' && (
            <div className="space-y-3">
              {/* Nhân Viên Đứng Quầy */}
              {(() => {
                const staffCount = Math.min(STAFF_MAX, Math.max(0, node.staffCount ?? 0));
                const atMax = staffCount >= STAFF_MAX;
                const cost = staffHireCost(node);
                const canAffordStaff = coins >= cost;
                const intervalNow = serviceIntervalMsFor(node) / 1000;
                const intervalNext = !atMax
                  ? serviceIntervalMsFor({ ...node, staffCount: staffCount + 1 }) / 1000
                  : intervalNow;

                return (
                  <div
                    className="rounded-3xl border-[2.5px] p-4 shadow-[0_4px_0_#7C4A21]"
                    style={{ background: '#FFFDF5', borderColor: '#7C4A21' }}
                  >
                    <div className="flex items-center justify-between border-b-2 border-[#EADFC7] pb-2">
                      <div>
                        <p className="text-xs font-black uppercase text-[#3E2A1B]">
                          👩‍🍳 Nhân Viên Đứng Quầy ({staffCount}/{STAFF_MAX})
                        </p>
                        <p className="mt-0.5 text-xs text-[#7A6449]">
                          Bán {intervalNow.toFixed(1)}s/đơn. Thuê thêm nhân viên để phục vụ khách nhanh hơn!
                        </p>
                      </div>
                      <UserCheck size={20} className="shrink-0 text-blue-600" />
                    </div>

                    {!atMax ? (
                      <button
                        type="button"
                        data-tour="shop-hire-btn"
                        disabled={!canAffordStaff}
                        onClick={handleHireStaff}
                        className="mt-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-b-4 text-xs font-black uppercase transition-transform active:translate-y-0.5 active:border-b-2 shadow-md"
                        style={
                          canAffordStaff
                            ? {
                                background: 'linear-gradient(180deg,#3B82F6,#1D4ED8)',
                                borderColor: '#1E3A8A',
                                color: '#FFFFFF',
                              }
                            : {
                                background: '#E5E7EB',
                                borderColor: '#9CA3AF',
                                color: '#9CA3AF',
                                cursor: 'not-allowed',
                              }
                        }
                      >
                        <UserCheck size={15} className="shrink-0" />
                        <span>Thuê Nhân Viên thứ {staffCount + 1}</span>
                        <span className="flex items-center gap-1 font-black">
                          · {formatCompact(cost)} đồng (còn {intervalNext.toFixed(1)}s/đơn)
                        </span>
                      </button>
                    ) : (
                      <p className="mt-2 text-center text-xs font-black text-blue-600">
                        🎉 Đã tuyển đủ {STAFF_MAX} nhân viên – Tốc độ phục vụ tối đa ({intervalNow.toFixed(1)}s/đơn)!
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-base">👑</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#5B3D22]">
                  Cổ Đông / Quản Lý Phụ Trách
                </h3>
              </div>

              {STORE_MANAGERS.map((mgr) => {
                const isAssignedHere = assignedManager?.id === mgr.id;
                const isUnlocked = unlockedManagers.includes(mgr.id);
                const canAffordMgr = coins >= mgr.costCoins && gems >= mgr.costGems;
                const app = MANAGER_APPEARANCES[mgr.id];

                return (
                  <div
                    key={mgr.id}
                    className="flex items-center justify-between gap-3 rounded-3xl border-[2.5px] p-3.5 shadow-[0_4px_0_#7C4A21]"
                    style={{
                      background: isAssignedHere ? '#EFF6FF' : '#FFFDF5',
                      borderColor: isAssignedHere ? '#2563EB' : '#7C4A21',
                    }}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      {app && (
                        <div
                          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2"
                          style={{
                            borderColor: isAssignedHere ? '#2563EB' : '#8B5E34',
                            background: isAssignedHere ? '#DBEAFE' : '#FDF3D8',
                          }}
                        >
                          <svg width="34" height="44" viewBox="0 0 56 72" className="overflow-visible" aria-hidden>
                            <ChibiBody def={app} emotion={isAssignedHere ? 'STAR_EYES' : 'HAPPY'} />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black text-white"
                            style={{ background: mgr.hue }}
                          >
                            {mgr.rarity}
                          </span>
                          <p className="truncate text-xs font-black text-[#3E2A1B]">
                            {mgr.name}
                          </p>
                          <span className="truncate text-[11px] font-bold text-[#8A7355]">
                            · {mgr.title}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#5B3D22]">
                          <strong>{mgr.skillName}:</strong> +{Math.round(mgr.yieldMultiplier * 100)}% Doanh thu, +{mgr.happinessBonus} Hạnh phúc
                        </p>
                      </div>
                    </div>

                    {isAssignedHere ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-xl bg-blue-100 px-3 py-2 text-xs font-black text-blue-800 border-2 border-blue-300">
                        <Crown size={14} className="shrink-0" />
                        Đang góp vốn
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!isUnlocked && !canAffordMgr}
                        onClick={() => handleAssignManager(mgr.id, mgr.name)}
                        className="flex shrink-0 flex-col items-center rounded-2xl border-b-4 px-3 py-1.5 text-xs font-black transition-transform active:translate-y-0.5 active:border-b-2 shadow-xs"
                        style={
                          isUnlocked || canAffordMgr
                            ? {
                                background: 'linear-gradient(180deg,#3B82F6,#1D4ED8)',
                                borderColor: '#1E3A8A',
                                color: '#FFFFFF',
                              }
                            : {
                                background: '#E5E7EB',
                                borderColor: '#9CA3AF',
                                color: '#9CA3AF',
                                cursor: 'not-allowed',
                              }
                        }
                      >
                        <span>{isUnlocked ? 'Điều động' : 'Mời Cổ Đông'}</span>
                        {!isUnlocked && (
                          <span className="flex items-center gap-1 text-[11px]">
                            {formatCompact(mgr.costCoins)}
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
