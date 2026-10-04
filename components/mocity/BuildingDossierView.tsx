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
} from 'lucide-react';
import {
  BUILDING_BY_ID,
  MANAGER_BY_ID,
  MENU_BY_BUILDING,
  ZONES,
  type MenuItemDef,
} from '@/lib/mocity/mock-city-data';
import { queueCapacityFor } from '@/lib/mocity/city-calculator';
import { queueHardCap, orderValueFor, serviceIntervalMsFor } from '@/lib/mocity/transactions';
import { formatCompact, formatRate } from '@/lib/mocity/format';
import type { BuildingDef, BuildingNode } from '@/lib/mocity/types';
import type { NodeYieldInfo } from '@/lib/mocity/city-calculator';

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

  // Tỷ lệ kế toán P&L của tiệm
  const cogsPct = Math.round((def.cogsRate ?? 0.45) * 100);
  const opexPct = Math.round((def.opexRate ?? 0.3) * 100);
  const pretaxPct = Math.max(0, 100 - cogsPct - opexPct);
  const taxPct = Math.round(pretaxPct * 0.2);
  const netMarginPct = pretaxPct - taxPct;

  // Danh sách công trình synergy
  const synergyTargetIds = def.synergyWith ?? [];
  const activeNeighborShortNames = new Set(yieldInfo.synergyNeighbors);

  return (
    <div className="space-y-3.5 pb-2 text-[#3E2A1B]">
      {/* ── KHỐI 1: CÂU CHUYỆN & ĐẶC TÍNH CỬA HÀNG ── */}
      <div
        className="rounded-2xl border-2 p-3.5 shadow-sm"
        style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black uppercase">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5"
                style={{ background: zone?.color || def.accent || '#C9A227', color: '#FFFFFF' }}
              >
                <Building2 size={11} className="shrink-0" />
                {zone?.shortLabel || def.zone}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5"
                style={{ borderColor: '#C9A22755', color: '#7A6449', background: '#FAF6ED' }}
              >
                <MapPin size={11} className="shrink-0 text-amber-600" />
                Số {houseNumber} Phố MoCity
              </span>
            </div>
            <h3 className="mt-1.5 text-base font-black uppercase text-[#3E2A1B]">
              {def.name}
            </h3>
          </div>
        </div>

        {/* Lời tự sự / Mô tả cửa hàng */}
        <p className="mt-2 text-[13px] leading-relaxed text-[#5A4533] italic">
          “{def.description}”
        </p>

        {def.momoServiceTag && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-[#FAF3DE] px-3 py-1.5 text-xs font-bold text-[#8A5A1A]">
            <Sparkles size={14} className="shrink-0 text-amber-600" />
            <span>Dịch vụ liên kết: <strong className="text-[#3E2A1B]">{def.momoServiceTag}</strong></span>
          </div>
        )}
      </div>

      {/* ── KHỐI 2: CƠ CẤU TÀI CHÍNH & P&L CỬA HÀNG ── */}
      <div
        className="rounded-2xl border-2 p-3.5 shadow-sm"
        style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}
      >
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: '#C9A22733' }}>
          <div className="flex items-center gap-1.5">
            <Receipt size={15} className="text-[#C9A227]" />
            <h4 className="text-xs font-black uppercase text-[#3E2A1B]">Cơ Cấu Tài Chính &amp; Dòng Tiền</h4>
          </div>
          <span className="text-[11px] font-black text-emerald-700">
            Biên Ròng: ~{netMarginPct}%
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[12px]">
          <div className="rounded-xl border p-2" style={{ background: '#FAF8F0', borderColor: '#C9A22733' }}>
            <p className="text-[11px] font-bold text-[#7A6449]">Doanh Thu Hiện Tại</p>
            <p className="mt-0.5 text-sm font-black tabular-nums text-amber-800">
              {formatRate(yieldInfo.totalPerSec)}
            </p>
          </div>
          <div className="rounded-xl border p-2" style={{ background: '#FAF8F0', borderColor: '#C9A22733' }}>
            <p className="text-[11px] font-bold text-[#7A6449]">Ước Tính Mỗi Đơn</p>
            <p className="mt-0.5 text-sm font-black tabular-nums text-emerald-800">
              {baseOrderVal > 0 ? `~${formatCompact(baseOrderVal)}` : 'Thu nhập thụ động'}
            </p>
          </div>
        </div>

        {/* Thanh tỷ trọng kế toán 4 dòng P&L */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-bold text-[#7A6449]">
            <span>Cơ cấu 1 đơn:</span>
            <span>Giá vốn {cogsPct}% · Vận hành {opexPct}% · Ròng {netMarginPct}%</span>
          </div>
          <div className="mt-1 flex h-2.5 w-full overflow-hidden rounded-full border border-amber-950/20 bg-amber-100">
            <div
              style={{ width: `${cogsPct}%`, background: '#F87171' }}
              title={`Giá vốn NCC (COGS): ${cogsPct}%`}
            />
            <div
              style={{ width: `${opexPct}%`, background: '#FBBF24' }}
              title={`Chi phí vận hành mặt bằng (OPEX): ${opexPct}%`}
            />
            <div
              style={{ width: `${taxPct}%`, background: '#9CA3AF' }}
              title={`Thuế TNDN: ${taxPct}%`}
            />
            <div
              style={{ width: `${netMarginPct}%`, background: '#34D399' }}
              title={`Lợi nhuận ròng vào ví: ${netMarginPct}%`}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[10px] font-bold text-[#7A6449]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Giá vốn ({cogsPct}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Mặt bằng ({opexPct}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Lãi ròng ({netMarginPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* ── KHỐI 3: MENU SẢN PHẨM / ĐẶC TÍNH PHÂN KHU ── */}
      {def.zone === 'COMMERCIAL' && menu.length > 0 ? (
        <div
          className="rounded-2xl border-2 p-3.5 shadow-sm"
          style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}
        >
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: '#C9A22733' }}>
            <div className="flex items-center gap-1.5">
              <ShoppingBag size={15} className="text-[#C9A227]" />
              <h4 className="text-xs font-black uppercase text-[#3E2A1B]">
                Menu Sản Phẩm &amp; Giá Bán Niêm Yết
              </h4>
            </div>
            <span className="text-[11px] font-bold text-[#7A6449]">
              {menu.length} món đặc trưng
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {menu.map((item: MenuItemDef) => {
              const estimatedItemPrice = baseOrderVal * item.priceRatio;
              return (
                <div
                  key={item.name}
                  className="flex flex-col justify-between rounded-xl border p-2.5 transition-colors"
                  style={{ background: '#FAF6ED', borderColor: '#C9A22744' }}
                >
                  <p className="truncate text-xs font-black text-[#3E2A1B]">{item.name}</p>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-[10px] font-bold text-[#8A7355]">
                      x{item.priceRatio.toFixed(2)}
                    </span>
                    <span className="text-xs font-black tabular-nums text-amber-900">
                      {formatCompact(estimatedItemPrice)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl border-2 p-3.5 shadow-sm"
          style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}
        >
          <div className="flex items-center gap-1.5 border-b pb-2" style={{ borderColor: '#C9A22733' }}>
            <Sparkles size={15} className="text-[#C9A227]" />
            <h4 className="text-xs font-black uppercase text-[#3E2A1B]">Đặc Tính Khu Vực</h4>
          </div>

          <div className="mt-3 space-y-2 text-xs leading-relaxed text-[#5A4533]">
            {def.zone === 'RESIDENTIAL' && (
              <p>
                🏠 Khu dân cư cung cấp <strong className="text-[#15803D]">+{def.population} cư dân</strong> cho đô thị. Dân số dồi dào là nguồn khách hàng chính chi tiêu mua sắm tại toàn bộ các cửa hàng vỉa hè.
              </p>
            )}
            {def.zone === 'FINTECH' && (
              <p>
                💳 Trụ cột tài chính số giúp tăng phí thu hộ <strong className="text-[#1D4ED8]">+{((def.takeRateBonus ?? 0) * 100).toFixed(1)}% Take Rate</strong> cho Thị Trưởng và tối ưu hóa chu chuyển dòng tiền của người dân.
              </p>
            )}
            {def.zone === 'LANDMARK' && (
              <p>
                🌟 Công trình biểu tượng văn hóa mang lại điểm Hạnh Phúc cực đại <strong className="text-[#B45309]">+{def.baseHappiness} điểm</strong>, kích hoạt hệ số nhân doanh thu toàn diện cho phố xá.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── KHỐI 4: BẢN ĐỒ TƯƠNG HỖ QUY HOẠCH ── */}
      <div
        className="rounded-2xl border-2 p-3.5 shadow-sm"
        style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}
      >
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: '#C9A22733' }}>
          <div className="flex items-center gap-1.5">
            <Layers size={15} className="text-[#C9A227]" />
            <h4 className="text-xs font-black uppercase text-[#3E2A1B]">
              Liên Kết Quy Hoạch (Synergy)
            </h4>
          </div>
          <span className="text-[11px] font-black" style={{ color: yieldInfo.synergyBonus > 0 ? '#15803D' : '#7A6449' }}>
            {yieldInfo.synergyBonus > 0 ? `+${Math.round(yieldInfo.synergyBonus * 100)}% doanh thu` : 'Chưa kích hoạt'}
          </span>
        </div>

        <p className="mt-2 text-xs font-bold text-[#7A6449]">
          {def.synergyLabel || 'Đặt cạnh các công trình tương hỗ để kích hoạt Combo +25% đồng'}
        </p>

        {synergyTargetIds.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            <p className="text-[11px] font-bold text-[#8A7355]">Công trình combo khuyến nghị kề cạnh:</p>
            <div className="flex flex-wrap gap-1.5">
              {synergyTargetIds.map((targetId) => {
                const targetDef = BUILDING_BY_ID[targetId];
                if (!targetDef) return null;
                const isActive = activeNeighborShortNames.has(targetDef.shortName);
                return (
                  <span
                    key={targetId}
                    className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold"
                    style={
                      isActive
                        ? { background: '#F0FDF4', borderColor: '#22C55E88', color: '#15803D' }
                        : { background: '#FAF6ED', borderColor: '#C9A22744', color: '#7A6449' }
                    }
                  >
                    {isActive ? <CheckCircle2 size={11} className="text-emerald-600" /> : <HelpCircle size={11} />}
                    {targetDef.name} ({isActive ? 'Đã kề cạnh' : 'Chưa có'})
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── KHỐI 5: NĂNG LỰC VẬN HÀNH & ĐỘI NGŨ ── */}
      <div
        className="rounded-2xl border-2 p-3.5 shadow-sm"
        style={{ background: '#FFFDF7', borderColor: '#C9A22766' }}
      >
        <div className="flex items-center gap-1.5 border-b pb-2" style={{ borderColor: '#C9A22733' }}>
          <UserCheck size={15} className="text-[#C9A227]" />
          <h4 className="text-xs font-black uppercase text-[#3E2A1B]">
            Vận Hành &amp; Đội Ngũ Nhân Sự
          </h4>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl border p-2" style={{ background: '#FAF8F0', borderColor: '#C9A22733' }}>
            <p className="text-[11px] font-bold text-[#7A6449]">Nhân Viên</p>
            <p className="mt-0.5 text-xs font-black text-[#3E2A1B]">
              {node.staffCount ?? 0} / 3 người
            </p>
            <p className="text-[10px] text-[#8A7355]">{serviceInterval.toFixed(1)}s / đơn</p>
          </div>
          <div className="rounded-xl border p-2" style={{ background: '#FAF8F0', borderColor: '#C9A22733' }}>
            <p className="text-[11px] font-bold text-[#7A6449]">Hàng Chờ Tối Đa</p>
            <p className="mt-0.5 text-xs font-black text-[#3E2A1B]">
              {queueHardCap(node)} khách
            </p>
            <p className="text-[10px] text-[#8A7355]">{queueCapacityFor(node)} quầy</p>
          </div>
          <div className="rounded-xl border p-2" style={{ background: '#FAF8F0', borderColor: '#C9A22733' }}>
            <p className="text-[11px] font-bold text-[#7A6449]">Quản Lý</p>
            <p className="mt-0.5 truncate text-xs font-black text-blue-700">
              {manager ? manager.name : 'Chưa có'}
            </p>
            <p className="text-[10px] text-blue-600">
              {manager ? `+${Math.round(manager.yieldMultiplier * 100)}%` : 'Trống'}
            </p>
          </div>
        </div>
      </div>

      {/* ── NÚT CHUYỂN NHANH SANG NÂNG CẤP ── */}
      <button
        type="button"
        onClick={onSwitchToUpgrade}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-b-[3px] font-black uppercase text-white shadow-md transition-transform active:scale-98"
        style={{
          background: 'linear-gradient(180deg, #D9A441, #B8892E)',
          borderColor: '#8A6A43',
        }}
      >
        <Zap size={16} />
        <span>Nâng Cấp Cấp Độ &amp; Tăng Sao Ngay</span>
      </button>
    </div>
  );
}
