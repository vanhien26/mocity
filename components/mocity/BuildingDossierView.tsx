'use client';

import {
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Coffee,
  Heart,
  HelpCircle,
  Layers,
  MapPin,
  Percent,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
  Clock,
  Crown,
  ChefHat,
  ArrowRight,
} from 'lucide-react';
import {
  BUILDING_BY_ID,
  MANAGER_BY_ID,
  MENU_BY_BUILDING,
  ZONES,
  type MenuItemDef,
} from '@/lib/mocity/mock-city-data';
import { queueCapacityFor } from '@/lib/mocity/city-calculator';
import { queueHardCap, orderValueFor, serviceIntervalMsFor, STAFF_MAX } from '@/lib/mocity/transactions';
import { formatCompact, formatRate } from '@/lib/mocity/format';
import { ChibiBody } from './ChibiRenderer';
import { MANAGER_APPEARANCES } from '@/lib/mocity/character-roster';
import { appearanceFromSeed } from '@/lib/mocity/character-appearance-gen';
import type { BuildingDef, BuildingNode } from '@/lib/mocity/types';
import type { NodeYieldInfo } from '@/lib/mocity/city-calculator';

function getFoodEmoji(name: string): string {
  if (name.includes('Cà Phê')) return '☕';
  if (name.includes('Trà Sữa') || name.includes('Bạc Xỉu')) return '🧋';
  if (name.includes('Mì Gói') || name.includes('Đồ Khô')) return '🍜';
  if (name.includes('Nước Ngọt')) return '🥤';
  if (name.includes('Bánh Tráng') || name.includes('Đồ Ăn Vặt')) return '🥨';
  if (name.includes('Ốc')) return '🐚';
  if (name.includes('Nem')) return '🌯';
  if (name.includes('Lẩu')) return '🍲';
  if (name.includes('Giỏ Hàng')) return '🛒';
  if (name.includes('Vé 2D') || name.includes('Vé 3D') || name.includes('Vé VIP')) return '🎟️';
  if (name.includes('Bắp')) return '🍿';
  if (name.includes('Điện')) return '⚡';
  if (name.includes('Nước')) return '💧';
  if (name.includes('Internet')) return '🌐';
  if (name.includes('Phí Dịch Vụ')) return '📋';
  if (name.includes('Vé Tàu')) return '🚆';
  if (name.includes('Tour')) return '🏖️';
  if (name.includes('Máy Bay')) return '✈️';
  if (name.includes('Khách Sạn')) return '🏨';
  if (name.includes('Phụ Kiện')) return '💍';
  if (name.includes('Giày Dép')) return '👟';
  if (name.includes('Quần Áo')) return '👗';
  if (name.includes('Đồ Gia Dụng')) return '🍳';
  return '✨';
}

export default function BuildingDossierView({
  node,
  def,
  yieldInfo,
  buildings,
  houseNumber,
  onSwitchToUpgrade,
}: {
  node: BuildingNode;
  def: BuildingDef;
  yieldInfo: NodeYieldInfo;
  buildings: BuildingNode[];
  houseNumber: number;
  onSwitchToUpgrade: () => void;
}) {
  const zone = ZONES[def.zone];
  const menu = MENU_BY_BUILDING[def.id] ?? [];
  const baseOrderVal = def.zone === 'COMMERCIAL' ? orderValueFor(node, buildings) : 0;
  const manager = node.managerId ? MANAGER_BY_ID[node.managerId] : undefined;
  const serviceInterval = serviceIntervalMsFor(node) / 1000;
  const staffCount = Math.min(STAFF_MAX, Math.max(0, node.staffCount ?? 0));

  // Tỷ lệ kế toán P&L của tiệm
  const cogsPct = Math.round((def.cogsRate ?? 0.45) * 100);
  const opexPct = Math.round((def.opexRate ?? 0.3) * 100);
  const pretaxPct = Math.max(0, 100 - cogsPct - opexPct);
  const taxPct = Math.round(pretaxPct * 0.2);
  const netMarginPct = pretaxPct - taxPct;

  // Danh sách công trình synergy
  const synergyTargetIds = def.synergyWith ?? [];
  const activeNeighborShortNames = new Set(yieldInfo.synergyNeighbors);

  // Avatar người bán / chủ quán chibi
  const shopkeeperApp = manager
    ? MANAGER_APPEARANCES[manager.id]
    : appearanceFromSeed(def.id + '-keeper');

  return (
    <div className="space-y-3.5 pb-2 text-[#3E2A1B]">
      {/* ── KHỐI 1: CÂU CHUYỆN & CHỦ QUÁN CHIBI ── */}
      <div
        className="relative overflow-hidden rounded-3xl border-[2.5px] p-3.5 shadow-[0_4px_0_#7C4A21]"
        style={{ background: '#FFFDF5', borderColor: '#7C4A21' }}
      >
        {/* Dải bạt trang trí shophouse retro */}
        <div
          className="absolute -top-1 left-0 right-0 h-2.5 opacity-80"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #D97706 0px, #D97706 12px, #FFF 12px, #FFF 24px)',
          }}
        />

        <div className="mt-1 flex items-start gap-2.5">
          {/* Avatar chibi chủ tiệm / quản lý */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-[2.5px] shadow-[0_3px_0_#6E4420]"
              style={{ borderColor: '#6E4420', background: '#FDF3D8' }}
            >
              <svg width="42" height="54" viewBox="0 0 56 72" className="overflow-visible" aria-hidden>
                <ChibiBody def={shopkeeperApp} emotion={manager ? 'STAR_EYES' : 'HAPPY'} />
              </svg>
            </div>
            <span
              className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs"
              style={{ background: zone?.color || '#D97706' }}
            >
              {manager ? 'Quản lý' : 'Chủ tiệm'}
            </span>
          </div>

          {/* Lời tự sự trong bong bóng đối thoại truyện tranh */}
          <div className="relative min-w-0 flex-1 rounded-2xl border-2 border-[#8B5E34] bg-white p-2.5 shadow-sm">
            {/* Mũi nhọn speech bubble */}
            <div className="absolute -left-2 top-4 h-3 w-3 rotate-45 border-b-2 border-l-2 border-[#8B5E34] bg-white" />

            <div className="flex items-center justify-between gap-1 border-b border-[#F2E8D5] pb-1">
              <span className="truncate text-xs font-black uppercase text-[#3E2A1B]">
                {def.name}
              </span>
              <span className="shrink-0 rounded-md bg-[#FAF0D7] px-1.5 py-0.5 text-[10px] font-black text-[#8A5A1A]">
                Số {houseNumber} Phố
              </span>
            </div>

            <p className="mt-1 text-[12px] font-medium italic leading-relaxed text-[#5A4533]">
              “{def.description}”
            </p>
          </div>
        </div>

        {/* Tag dịch vụ MoMo */}
        {/* Điểm nhấn / Dịch vụ của tiệm */}
        {def.momoServiceTag && (
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-[#D5CEBF] bg-[#FAF7F0] px-3 py-1.5 text-xs font-bold text-[#6E4F3A]">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="shrink-0 text-amber-500" />
              <span>Dịch vụ nổi bật: <strong className="text-[#3E2A1B]">{def.momoServiceTag}</strong></span>
            </div>
            <span className="rounded-md border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
              ĐANG MỞ CỬA
            </span>
          </div>
        )}
      </div>

      {/* ── KHỐI 2: THỰC ĐƠN MÓN ĂN & SẢN PHẨM CHIBI ── */}
      {def.zone === 'COMMERCIAL' && menu.length > 0 ? (
        <div
          className="rounded-3xl border-[2.5px] p-3.5 shadow-[0_4px_0_#7C4A21]"
          style={{ background: '#FFFDF5', borderColor: '#7C4A21' }}
        >
          <div className="flex items-center justify-between border-b-2 border-[#EADFC7] pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🍽️</span>
              <h4 className="text-xs font-black uppercase tracking-wide text-[#3E2A1B]">
                Thực Đơn Niêm Yết Của Quán
              </h4>
            </div>
            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-black text-[#92400E]">
              {menu.length} món ngon
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {menu.map((item: MenuItemDef) => {
              const estimatedItemPrice = baseOrderVal * item.priceRatio;
              const emoji = getFoodEmoji(item.name);
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-2 rounded-2xl border-2 border-[#E6D9BE] bg-white p-2 shadow-xs transition-transform active:scale-95"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF6E0] text-lg shadow-inner">
                    {emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-[#3E2A1B]">{item.name}</p>
                    <p className="mt-0.5 text-xs font-black tabular-nums text-[#B45309]">
                      ~{formatCompact(estimatedItemPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="rounded-3xl border-[2.5px] p-3.5 shadow-[0_4px_0_#7C4A21]"
          style={{ background: '#FFFDF5', borderColor: '#7C4A21' }}
        >
          <div className="flex items-center gap-1.5 border-b-2 border-[#EADFC7] pb-2">
            <span className="text-base">✨</span>
            <h4 className="text-xs font-black uppercase tracking-wide text-[#3E2A1B]">
              Đặc Tính Phân Khu
            </h4>
          </div>

          <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#5A4533]">
            {def.zone === 'RESIDENTIAL' && (
              <div className="flex items-center gap-2.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 p-2.5">
                <span className="text-2xl">🏡</span>
                <div>
                  <p className="font-black text-emerald-900">Khu Dân Cư Sinh Sống</p>
                  <p className="text-[11px] font-medium text-emerald-800">
                    Cung cấp <strong className="text-emerald-900">+{def.population} cư dân</strong> cho toàn phố. Càng đông dân, luồng khách vào các tiệm vỉa hè càng dày!
                  </p>
                </div>
              </div>
            )}
            {def.zone === 'FINTECH' && (
              <div className="flex items-center gap-2.5 rounded-2xl border-2 border-blue-200 bg-blue-50/70 p-2.5">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="font-black text-blue-900">Trụ Cột Tài Chính Số</p>
                  <p className="text-[11px] font-medium text-blue-800">
                    Kích hoạt <strong className="text-blue-900">+{((def.takeRateBonus ?? 0) * 100).toFixed(1)}% Take Rate</strong> cho bạn và sinh lãi suất dòng tiền.
                  </p>
                </div>
              </div>
            )}
            {def.zone === 'LANDMARK' && (
              <div className="flex items-center gap-2.5 rounded-2xl border-2 border-amber-200 bg-amber-50/70 p-2.5">
                <span className="text-2xl">🏛️</span>
                <div>
                  <p className="font-black text-amber-900">Biểu Tượng Đô Thị</p>
                  <p className="text-[11px] font-medium text-amber-800">
                    Mang lại <strong className="text-amber-900">+{def.baseHappiness} điểm Hạnh Phúc</strong>, bùng nổ danh tiếng toàn đô thị!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KHỐI 3: SỔ THU CHI & HEO ĐẤT P&L ── */}
      <div
        className="rounded-3xl border-[2.5px] p-3.5 shadow-[0_4px_0_#7C4A21]"
        style={{ background: '#FFFDF5', borderColor: '#7C4A21' }}
      >
        <div className="flex items-center justify-between border-b-2 border-[#EADFC7] pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🐷</span>
            <h4 className="text-xs font-black uppercase tracking-wide text-[#3E2A1B]">
              Sổ Thu Chi &amp; Heo Đất
            </h4>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800">
            Lãi ròng: ~{netMarginPct}%
          </span>
        </div>

        {/* 2 Khối chỉ số dạng thẻ đồ chơi */}
        <div className="mt-2.5 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl border-2 border-[#FCD34D] bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7] p-2.5 shadow-xs">
            <p className="text-[11px] font-bold text-[#8A5A1A]">🪙 Sản lượng / giây</p>
            <p className="mt-0.5 text-base font-black tabular-nums text-[#B45309]">
              {formatRate(yieldInfo.totalPerSec)}
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[#6EE7B7] bg-gradient-to-b from-[#ECFDF5] to-[#D1FAE5] p-2.5 shadow-xs">
            <p className="text-[11px] font-bold text-[#065F46]">🧾 Trung bình 1 đơn</p>
            <p className="mt-0.5 text-base font-black tabular-nums text-[#047857]">
              {baseOrderVal > 0 ? `~${formatCompact(baseOrderVal)}` : 'Thụ động'}
            </p>
          </div>
        </div>

        {/* Thanh kẹo chia tỷ lệ chi phí */}
        <div className="mt-3 rounded-2xl border border-[#E6D9BE] bg-white p-2.5">
          <div className="flex justify-between text-[11px] font-bold text-[#7A6449]">
            <span>Cơ cấu dòng tiền:</span>
            <span className="text-emerald-700">Đút heo ~{netMarginPct}%</span>
          </div>
          <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full border-2 border-[#7C4A21] bg-amber-100 shadow-inner">
            <div style={{ width: `${cogsPct}%`, background: '#F87171' }} title={`Giá vốn: ${cogsPct}%`} />
            <div style={{ width: `${opexPct}%`, background: '#FBBF24' }} title={`Vận hành: ${opexPct}%`} />
            <div style={{ width: `${taxPct}%`, background: '#9CA3AF' }} title={`Thuế: ${taxPct}%`} />
            <div style={{ width: `${netMarginPct}%`, background: '#34D399' }} title={`Lãi ròng: ${netMarginPct}%`} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Giá vốn {cogsPct}%
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Mặt bằng {opexPct}%
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Đút heo {netMarginPct}%
            </span>
          </div>
        </div>
      </div>

      {/* ── KHỐI 4: CẶP ĐÔI HÀNG XÓM (SYNERGY) ── */}
      <div
        className="rounded-3xl border-[2.5px] p-3.5 shadow-[0_4px_0_#7C4A21]"
        style={{ background: '#FFFDF5', borderColor: '#7C4A21' }}
      >
        <div className="flex items-center justify-between border-b-2 border-[#EADFC7] pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🏘️</span>
            <h4 className="text-xs font-black uppercase tracking-wide text-[#3E2A1B]">
              Cặp Đôi Hàng Xóm (Combo)
            </h4>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-black"
            style={
              yieldInfo.synergyBonus > 0
                ? { background: '#DCFCE7', color: '#15803D' }
                : { background: '#F3F4F6', color: '#6B7280' }
            }
          >
            {yieldInfo.synergyBonus > 0 ? `🎉 +${Math.round(yieldInfo.synergyBonus * 100)}% Doanh thu` : 'Chưa kích hoạt'}
          </span>
        </div>

        <p className="mt-2 text-xs font-bold text-[#6E4F3A]">
          {def.synergyLabel || 'Đặt cạnh các công trình tương hỗ để nhận thưởng +25% sản lượng!'}
        </p>

        {synergyTargetIds.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            <p className="text-[11px] font-bold text-[#8A5A1A]">Hàng xóm combo khuyến nghị:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {synergyTargetIds.map((targetId) => {
                const targetDef = BUILDING_BY_ID[targetId];
                if (!targetDef) return null;
                const isActive = activeNeighborShortNames.has(targetDef.shortName);
                return (
                  <div
                    key={targetId}
                    className="flex items-center justify-between rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold"
                    style={
                      isActive
                        ? { background: '#ECFDF5', borderColor: '#34D399', color: '#065F46' }
                        : { background: '#FFF', borderColor: '#E6D9BE', color: '#8A7355' }
                    }
                  >
                    <span className="truncate">{targetDef.name}</span>
                    <span
                      className="ml-1 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black"
                      style={
                        isActive
                          ? { background: '#10B981', color: '#FFF' }
                          : { background: '#E5E7EB', color: '#4B5563' }
                      }
                    >
                      {isActive ? '💖 Đã kề bên' : 'Chưa có'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── KHỐI 5: QUẦY BÁN & ĐỘI NGŨ NHÂN SỰ CHIBI ── */}
      <div
        className="rounded-3xl border-[2.5px] p-3.5 shadow-[0_4px_0_#7C4A21]"
        style={{ background: '#FFFDF5', borderColor: '#7C4A21' }}
      >
        <div className="flex items-center justify-between border-b-2 border-[#EADFC7] pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">👩‍🍳</span>
            <h4 className="text-xs font-black uppercase tracking-wide text-[#3E2A1B]">
              Quầy Bán &amp; Đội Ngũ Nhân Lực
            </h4>
          </div>
          <span className="text-[11px] font-bold text-[#8A5A1A]">
            Tốc độ: <strong>{serviceInterval.toFixed(1)}s / đơn</strong>
          </span>
        </div>

        {/* 3 Slot nhân viên đứng quầy chibi */}
        <div className="mt-2.5">
          <p className="text-[11px] font-bold text-[#8A5A1A]">Nhân viên phụ quán ({staffCount}/{STAFF_MAX}):</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {Array.from({ length: STAFF_MAX }).map((_, slotIdx) => {
              const isHired = slotIdx < staffCount;
              const staffApp = appearanceFromSeed(`staff-${def.id}-${slotIdx}`);
              return (
                <div
                  key={slotIdx}
                  className="flex flex-col items-center rounded-2xl border-2 p-2 text-center"
                  style={
                    isHired
                      ? { background: '#EFF6FF', borderColor: '#60A5FA' }
                      : { background: '#FAF6ED', borderColor: '#E6D9BE', borderStyle: 'dashed' }
                  }
                >
                  <div
                    className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border"
                    style={{
                      borderColor: isHired ? '#2563EB' : '#C9A22744',
                      background: isHired ? '#DBEAFE' : '#F5EBD7',
                    }}
                  >
                    {isHired ? (
                      <svg width="30" height="38" viewBox="0 0 56 72" className="overflow-visible" aria-hidden>
                        <ChibiBody def={staffApp} emotion="HAPPY" />
                      </svg>
                    ) : (
                      <ChefHat size={18} className="text-[#A89275]" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] font-black text-[#3E2A1B]">
                    {isHired ? `Phụ quán #${slotIdx + 1}` : 'Vị trí trống'}
                  </p>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: isHired ? '#2563EB' : '#9CA3AF' }}
                  >
                    {isHired ? 'Đang bán' : 'Cần thuê'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quản lý / Cổ đông */}
        <div className="mt-3 rounded-2xl border-2 border-[#E6D9BE] bg-white p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#8A5A1A]">Cổ đông phụ trách tiệm:</p>
            {manager && (
              <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-800">
                +{Math.round(manager.yieldMultiplier * 100)}% Doanh thu
              </span>
            )}
          </div>

          {manager ? (
            <div className="mt-1.5 flex items-center gap-2.5">
              {MANAGER_APPEARANCES[manager.id] && (
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-blue-400 bg-blue-50 shadow-xs">
                  <svg width="32" height="42" viewBox="0 0 56 72" className="overflow-visible" aria-hidden>
                    <ChibiBody def={MANAGER_APPEARANCES[manager.id]} emotion="STAR_EYES" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded px-1.5 py-0.2 text-[10px] font-black text-white"
                    style={{ background: manager.hue }}
                  >
                    {manager.rarity}
                  </span>
                  <p className="truncate text-xs font-black text-blue-900">{manager.name}</p>
                </div>
                <p className="text-[11px] text-[#5A4533]">{manager.title}</p>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 flex items-center justify-between rounded-xl bg-[#FFFBF0] px-3 py-2 text-xs font-semibold text-[#8A7355]">
              <span>Chưa bổ nhiệm Cổ Đông</span>
              <span className="font-bold text-blue-700">Mở tab Nhân Lực ➔</span>
            </div>
          )}
        </div>

        {/* Sức chứa hàng đợi */}
        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-[#E6D9BE] bg-[#FAF8F0] px-3 py-2 text-xs font-bold text-[#6E4F3A]">
          <span>🚶 Sức chứa hàng chờ:</span>
          <span className="font-black text-[#3E2A1B]">
            {queueHardCap(node)} khách ({queueCapacityFor(node)} quầy phục vụ)
          </span>
        </div>
      </div>

      {/* ── NÚT CHUYỂN NHANH SANG NÂNG CẤP (3D ARCADE BUTTON) ── */}
      <button
        type="button"
        onClick={onSwitchToUpgrade}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-[#92400E] bg-gradient-to-b from-[#FBBF24] via-[#F59E0B] to-[#D97706] text-sm font-black uppercase text-white shadow-lg transition-transform active:translate-y-1 active:border-b-0 hover:brightness-105"
      >
        <Sparkles size={17} className="text-yellow-100" />
        <span>Nâng Cấp Cấp Độ &amp; Tăng Sao Ngay</span>
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-black">
          Cấp {node.level} ➔ {node.level + 1}
        </span>
      </button>
    </div>
  );
}
