'use client';

import { useEffect, useRef } from 'react';
import { X, CircleDollarSign, Gem, Zap, Lock } from 'lucide-react';
import { BUILDINGS, ZONES, CITY_TIERS, cityTierFor } from '@/lib/mocity/mock-city-data';
import { populationFor } from '@/lib/mocity/city-calculator';
import { BUILDING_ICON } from './building-icons';
import { useCity } from '@/lib/mocity/store';
import { formatRate, formatCompact } from '@/lib/mocity/format';
import type { BuildingDef } from '@/lib/mocity/types';

export default function BuildDrawer({
  open,
  activeTab,
  onTabChange,
  onClose,
  onPick,
  canAfford,
}: {
  open: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  onPick: (def: BuildingDef) => void;
  canAfford: (def: BuildingDef) => boolean;
}) {
  const buildings = useCity((s) => s.buildings);
  // Bac do thi hien tai la TRUC mo khoa cong trinh (xem CityTierDef.unlocks).
  const tierRank = cityTierFor(populationFor(buildings), buildings.length).rank;
  const tierNameByRank = (rank: number) => CITY_TIERS.find((t) => t.rank === rank)?.name ?? `Bậc ${rank}`;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
  }, [open]);

  const tabs = [
    { type: 'ALL', label: 'Tất cả' },
    { type: 'COMMERCIAL', label: ZONES.COMMERCIAL.shortLabel },
    { type: 'FINTECH', label: ZONES.FINTECH.shortLabel },
    { type: 'RESIDENTIAL', label: ZONES.RESIDENTIAL.shortLabel },
    { type: 'LANDMARK', label: ZONES.LANDMARK.shortLabel },
  ];

  // Cong trinh mo khoa duoc len dau, phan con lai xep theo moc cap de thay lo trinh.
  const visible = BUILDINGS.filter(
    (b) => activeTab === 'ALL' || b.zone === activeTab,
  ).sort((a, b) => {
    const aLocked = tierRank < a.unlockAtTier ? 1 : 0;
    const bLocked = tierRank < b.unlockAtTier ? 1 : 0;
    if (aLocked !== bLocked) return aLocked - bLocked;
    return a.costCoins - b.costCoins;
  });

  return (
    <>
      {/* Lop chan: dong + an diem, dung display/visibility de khong loi text */}
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Danh mục xây dựng"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg rounded-t-3xl border-t-2 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #F3E7C9 0%, #E7D5A8 100%)',
          borderColor: '#C9A227',
        }}
      >
        <div className="flex items-center justify-between border-b-2 px-4 py-3" style={{ borderColor: '#C9A22755' }}>
          <h2 className="text-sm font-black uppercase tracking-wide" style={{ color: '#4A3018' }}>
            Xây dựng công trình
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
            style={{ color: '#8A6A43', background: 'rgba(0,0,0,0.06)' }}
            aria-label="Đóng danh mục"
          >
            <X size={16} className="shrink-0" />
          </button>
        </div>

        {/* Chon phan khu */}
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => {
                onTabChange(tab.type);
              }}
              className="flex-none whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-black uppercase tracking-wide transition-colors"
              style={
                activeTab === tab.type
                  ? { background: 'linear-gradient(180deg,#D9A441,#C9A227)', color: '#3E2A1B', borderColor: '#8A6A43' }
                  : { background: 'rgba(0,0,0,0.05)', color: '#7A6449', borderColor: '#C9A22733' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="no-scrollbar max-h-[52vh] space-y-2 overflow-y-auto px-4 pb-5">
          {visible.map((def) => {
            const zone = ZONES[def.zone];
            const locked = tierRank < def.unlockAtTier;
            const affordable = canAfford(def);
            const Icon = BUILDING_ICON[def.icon];

            return (
              <button
                key={def.id}
                type="button"
                disabled={locked}
                onClick={() => onPick(def)}
                className="flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.99]"
                style={
                  locked
                    ? { cursor: 'not-allowed', borderColor: '#C9A22733', background: 'rgba(0,0,0,0.04)', opacity: 0.7 }
                    : affordable
                      ? { borderColor: '#C9A227', background: '#FBF3DE', boxShadow: '0 2px 6px rgba(74,48,24,0.12)' }
                      : { borderColor: '#C9A22755', background: '#FBF3DE' }
                }
              >
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2"
                  style={{
                    background: locked ? 'rgba(0,0,0,0.06)' : zone.tint,
                    borderColor: locked ? '#C9A22733' : '#C9A227',
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={2.2}
                    className="shrink-0"
                    style={{ color: locked ? '#A0916F' : def.hue }}
                  />
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold" style={{ color: '#3E2A1B' }}>{def.name}</span>
                    {locked && (
                      <span
                        className="flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold"
                        style={{ background: 'rgba(0,0,0,0.08)', color: '#7A6449' }}
                      >
                        <Lock size={9} className="shrink-0" />
                        {tierNameByRank(def.unlockAtTier)}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px]" style={{ color: '#8A7355' }}>
                    {def.description}
                  </span>
                  <span className="mt-1 flex items-center gap-2.5 text-[13px]" style={{ color: '#7A6449' }}>
                    <span className="flex items-center gap-1 font-bold" style={{ color: '#5B3D22' }}>
                      <CircleDollarSign size={11} className="shrink-0" style={{ color: '#C9A227' }} />
                      {formatRate(def.baseYieldPerSec)}
                    </span>
                    {def.costGems > 0 && (
                      <span className="flex items-center gap-1 font-bold" style={{ color: '#5B3D22' }}>
                        <Gem size={11} className="shrink-0 text-[#2563EB]" />
                        {def.costGems}
                      </span>
                    )}
                    {def.population > 0 && (
                      <span className="flex items-center gap-1">
                        <Zap size={11} className="shrink-0 text-amber-600" />
                        {def.population} dân
                      </span>
                    )}
                  </span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className="flex items-center gap-1 text-xs font-black"
                    style={{ color: affordable ? '#A67C1E' : '#A0916F' }}
                  >
                    <CircleDollarSign size={13} className="shrink-0" />
                    {formatCompact(def.costCoins)}
                  </span>
                  {!locked && (
                    <span className="text-[12px]" style={{ color: '#8A7355' }}>
                      {affordable ? 'Xây ngay' : 'Thiếu Xu'}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
