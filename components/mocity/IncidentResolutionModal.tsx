'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  MessageSquareWarning,
  PackageX,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  X,
  Wrench,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import type { CityIncident, IncidentSolution } from '@/lib/mocity/types';
import { CoinIcon, MayorStarIcon, InsuranceShieldIcon } from './GameIcons';
import { formatVND } from '@/lib/mocity/format';

interface IncidentResolutionModalProps {
  incident: CityIncident;
  coins: number;
  hasInsurance: boolean;
  onResolve: (
    incidentId: string,
    options: {
      solutionId: string;
      cost: number;
      mayorPoints: number;
      fixPermanent: boolean;
    }
  ) => void;
  onClose: () => void;
}

export default function IncidentResolutionModal({
  incident,
  coins,
  hasInsurance,
  onResolve,
  onClose,
}: IncidentResolutionModalProps) {
  const defaultSolutions: IncidentSolution[] = incident.solutions && incident.solutions.length > 0
    ? incident.solutions
    : [
        {
          id: 'sol_standard_fix',
          title: 'Khắc Phục Toàn Diện & Chuẩn Hóa Vận Hành',
          desc: 'Nâng cấp quy trình và đào tạo lại nhân sự để loại bỏ triệt để nguyên nhân phát sinh sự cố.',
          cost: 450_000,
          mayorPoints: 35,
          fixPermanent: true,
          bonusEffectText: 'Fix tận gốc, không bao giờ tái diễn (+35 MP)',
        },
        {
          id: 'sol_quick_fix',
          title: 'Khắc Phục Tạm Thời',
          desc: 'Sửa chữa tình huống để tiếp tục vận hành nhanh trong ngày.',
          cost: 200_000,
          mayorPoints: 10,
          fixPermanent: false,
          bonusEffectText: 'Xử lý tình thế nhanh (+10 MP)',
        },
      ];

  const [selectedSolutionId, setSelectedSolutionId] = useState<string>(defaultSolutions[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedSuccess, setResolvedSuccess] = useState(false);

  const selectedSolution =
    defaultSolutions.find((s) => s.id === selectedSolutionId) || defaultSolutions[0];
  const actualCost = hasInsurance ? 0 : selectedSolution.cost;
  const canAfford = hasInsurance || coins >= actualCost;

  const handleApplySolution = () => {
    if (!canAfford || isSubmitting) return;
    setIsSubmitting(true);
    setResolvedSuccess(true);

    setTimeout(() => {
      onResolve(incident.id, {
        solutionId: selectedSolution.id,
        cost: selectedSolution.cost,
        mayorPoints: selectedSolution.mayorPoints,
        fixPermanent: selectedSolution.fixPermanent,
      });
    }, 700);
  };

  const getIncidentIcon = () => {
    switch (incident.type) {
      case 'FIRE':
        return <Flame className="h-6 w-6 text-amber-300 animate-pulse" />;
      case 'THEFT':
        return <ShieldAlert className="h-6 w-6 text-rose-300 animate-pulse" />;
      case 'STOCKOUT':
        return <PackageX className="h-6 w-6 text-amber-300 animate-pulse" />;
      case 'COMPLAINT':
      default:
        return <MessageSquareWarning className="h-6 w-6 text-amber-300 animate-pulse" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border-3 border-[#78350F] bg-[#FFFDF7] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col max-h-[92vh]"
        style={{
          boxShadow: '0 0 0 2px rgba(251,191,36,0.35), 0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        {/* HEADER CẢNH BÁO SỰ CỐ */}
        <div className="relative flex items-center justify-between border-b-2 border-[#991B1B] bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#B91C1C] px-4 py-3 text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 border border-white/30 shadow-inner">
              {getIncidentIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-[#78350F] uppercase tracking-wider">
                  SỰ CỐ VẬN HÀNH
                </span>
                <span className="text-[11px] font-bold text-amber-100 opacity-90">
                  {incident.buildingName}
                </span>
              </div>
              <h2 className="text-sm font-black tracking-wide text-white drop-shadow-xs">
                {incident.title || incident.description}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white/80 transition hover:bg-black/40 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* NỘI DUNG ĐIỀU TRA & CHỌN PHƯƠNG ÁN */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* 1. LỜI NHÂN CHỨNG / KHÁCH HÀNG */}
          {incident.witnessQuote && (
            <div className="relative rounded-2xl border border-amber-300 bg-amber-50/80 p-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">🗣️</span>
                <div className="space-y-0.5">
                  <p className="text-[10.5px] font-black uppercase tracking-wider text-[#92400E]">
                    Ý Kiến Phản Ánh Trực Tiếp:
                  </p>
                  <p className="text-xs font-semibold italic text-[#78350F] leading-relaxed">
                    {incident.witnessQuote}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PHÂN TÍCH NGUYÊN NHÂN CỐT LÕI (ROOT CAUSE ANALYSIS) */}
          <div className="rounded-2xl border-2 border-[#E2E8F0] bg-white p-3.5 shadow-sm space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#B91C1C]">
              <AlertTriangle size={15} />
              <span className="text-xs font-black uppercase tracking-wide">
                Nguyên Nhân Gốc Rễ
              </span>
            </div>
            <p className="text-xs font-medium text-[#334155] leading-relaxed">
              {incident.rootCause ||
                'Vấn đề phát sinh do lỗ hổng trong quy trình vận hành hoặc thiếu thiết bị tự động hóa kiểm soát rủi ro.'}
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] font-bold text-[#DC2626]">
              <span>⚠️ Tác động:</span>
              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-800">
                -30% Dòng tiền tiệm & Giảm uy tín phố
              </span>
            </div>
          </div>

          {/* 3. TRẠNG THÁI BẢO HIỂM NẾU CÓ */}
          {hasInsurance && (
            <div className="flex items-center gap-2 rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-3.5 py-2 text-emerald-900 shadow-xs">
              <InsuranceShieldIcon size={26} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-xs font-black text-emerald-800">
                  Gói Bảo Hiểm Rủi Ro MoMo Đang Hoạt Động
                </p>
                <p className="text-[10.5px] font-semibold text-emerald-700">
                  Toàn bộ chi phí khắc phục sự cố được MoMo chi trả 100% (0đ chi phí cá nhân)!
                </p>
              </div>
            </div>
          )}

          {/* 4. CÁC PHƯƠNG ÁN KHẮC PHỤC (SOLUTIONS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wide text-[#475569]">
                Chọn Phương Án Xử Lý:
              </span>
              <span className="text-[11px] font-bold text-[#64748B]">
                {defaultSolutions.length} phương án khả thi
              </span>
            </div>

            <div className="space-y-2.5">
              {defaultSolutions.map((sol) => {
                const isSelected = sol.id === selectedSolutionId;
                const solActualCost = hasInsurance ? 0 : sol.cost;
                const solAffordable = hasInsurance || coins >= solActualCost;

                return (
                  <div
                    key={sol.id}
                    onClick={() => setSelectedSolutionId(sol.id)}
                    className={`relative cursor-pointer rounded-2xl border-2 p-3 transition-all ${
                      isSelected
                        ? 'border-[#D97706] bg-amber-50/90 shadow-md ring-2 ring-amber-400/40'
                        : 'border-[#CBD5E1] bg-white hover:border-amber-300 hover:bg-[#FFFDF7]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-black text-[#1E293B]">
                            {sol.title}
                          </span>
                          {sol.fixPermanent ? (
                            <span className="rounded-full bg-emerald-500 px-2 py-0.2 text-[9.5px] font-black text-white shadow-2xs">
                              ✓ FIX TRIỆT ĐỂ (Không tái diễn)
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-200 px-2 py-0.2 text-[9.5px] font-bold text-slate-700">
                              Tạm thời
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-[#475569] leading-relaxed">
                          {sol.desc}
                        </p>
                        {sol.bonusEffectText && (
                          <p className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1 pt-0.5">
                            <Sparkles size={12} />
                            {sol.bonusEffectText}
                          </p>
                        )}
                      </div>

                      {/* Chi phí & Thưởng */}
                      <div className="flex flex-col items-end shrink-0 pl-1">
                        <div className="flex items-center gap-1">
                          {hasInsurance ? (
                            <span className="text-xs font-black text-emerald-600 line-through opacity-70">
                              {formatVND(sol.cost)}
                            </span>
                          ) : (
                            <span className="text-xs font-black text-[#B45309]">
                              {formatVND(sol.cost)}
                            </span>
                          )}
                          <CoinIcon size={14} />
                        </div>
                        {hasInsurance && (
                          <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                            0đ (Bảo Hiểm)
                          </span>
                        )}
                        <div className="mt-1 flex items-center gap-1 text-[10.5px] font-black text-amber-700">
                          <span>+{sol.mayorPoints} MP</span>
                          <MayorStarIcon size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="border-t-2 border-[#E2E8F0] bg-white px-4 py-3 flex items-center justify-between gap-3 shadow-inner">
          <div className="text-left leading-tight">
            <span className="text-[10px] font-bold text-[#64748B] block">
              Tổng Chi Phí Thanh Toán:
            </span>
            <div className="flex items-center gap-1">
              <span className={`text-base font-black ${canAfford ? 'text-[#78350F]' : 'text-rose-600'}`}>
                {hasInsurance ? '0đ (Bảo Hiểm Chi Trả)' : formatVND(actualCost)}
              </span>
              {!hasInsurance && <CoinIcon size={16} />}
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplySolution}
            disabled={!canAfford || isSubmitting}
            className="flex items-center gap-2 rounded-2xl border-2 border-[#D97706] bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-5 py-2.5 text-xs font-black text-white shadow-[0_3px_0_#78350F] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-[0_1px_0_#78350F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resolvedSuccess ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-200 animate-bounce" />
                <span>Đang Triển Khai Xử Lý...</span>
              </>
            ) : (
              <>
                <Wrench size={16} />
                <span>Triển Khai Khắc Phục Vấn Đề</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
