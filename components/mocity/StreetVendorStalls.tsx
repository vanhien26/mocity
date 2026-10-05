'use client';

import React, { useState } from 'react';
import { claimTapReward, useCity } from '@/lib/mocity/store';
import { fillTen } from '@/lib/mocity/dialogue-name';
import { ChibiBody } from './ChibiRenderer';
import { appearanceFromSeed } from '@/lib/mocity/character-appearance-gen';
import type { CharacterAppearance } from '@/lib/mocity/character-appearance';

/**
 * SẠP VỈA HÈ (STREET VENDOR STALLS)
 *
 * Trước đây 19/19 công trình đều gắn `momoServiceTag`, 4 cái còn có chữ
 * "MoMo" ngay trong tên hiển thị - mở phố lên là thấy toàn biển quảng cáo,
 * không có kết cấu đời thường nào xen vào. Ba sạp này KHÔNG gắn một dòng
 * thương hiệu nào, không phải công trình xây được, không sinh đồng qua giao
 * dịch - thuần là TRANG TRÍ VỈA HÈ cho phố có hơi thở Sài Gòn thật: gánh
 * xôi, xe hủ tiếu gõ, cà phê cóc. Bấm vào vẫn có thưởng nhỏ + câu thoại,
 * giống hệt cách `StreetPets.tsx` làm với thú cưng - khác duy nhất là
 * đứng YÊN, không đi lại (gánh hàng rong ĐI BỘ đã có vai riêng là NPC
 * "Chị Hàng Rong" trong `ExpressiveStreetCitizens.tsx`).
 */

const STALL_CSS = `
@keyframes stallSteamRise {
  0%   { opacity: 0; transform: translate(0,0) scale(0.6); }
  30%  { opacity: 0.85; transform: translate(-2px,-8px) scale(0.9); }
  70%  { opacity: 0.55; transform: translate(2px,-16px) scale(1.1); }
  100% { opacity: 0; transform: translate(-1px,-26px) scale(1.3); }
}
@keyframes stallAwningSway {
  0%, 100% { transform: rotate(-1deg); }
  50%      { transform: rotate(1deg); }
}
@keyframes stallBubblePop {
  0%   { opacity: 0; transform: translateY(6px) scale(0.8); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.stall-steam { animation: stallSteamRise 2.4s ease-in-out infinite; }
.stall-awning { animation: stallAwningSway 3.6s ease-in-out infinite; transform-origin: top center; }
`;

/**
 * NGƯỜI BÁN đứng/ngồi cạnh sạp - dùng chung `ChibiBody` với cả phố.
 *
 * Trước đây 3 sạp này hoàn toàn không có người: chỉ có đồ vật (thúng, xe
 * đẩy, bàn ghế) tự đứng đó như sạp bỏ hoang. `appearanceFromSeed` khoá diện
 * mạo người bán theo đúng tên sạp - "Gánh Xôi Cô Ba" luôn ra cùng một cô.
 */
function StallVendor({
  seed,
  pose = 'STAND',
  size = 40,
}: {
  seed: string;
  pose?: 'STAND' | 'SIT';
  size?: number;
}) {
  const appearance: CharacterAppearance = { ...appearanceFromSeed(seed), pose };
  return (
    <svg width={size} height={(size * 72) / 56} viewBox="0 0 56 72" className="overflow-visible select-none">
      <ChibiBody def={appearance} emotion="HAPPY" />
    </svg>
  );
}

/** Gánh Xôi - đòn gánh tre, hai thúng, lá chuối lót, khăn rằn vắt vai. */
function GanhXoi() {
  return (
    <div className="relative flex items-end">
      <div className="mr-[-10px] mb-1">
        <StallVendor seed="Gánh Xôi Cô Ba" pose="STAND" size={38} />
      </div>
      <svg width="64" height="70" viewBox="0 0 64 70" className="overflow-visible">
      {/* Đòn gánh tre cong */}
      <path d="M8 24 Q32 8 56 24" fill="none" stroke="#A16207" strokeWidth="2.5" strokeLinecap="round" />
      {/* Dây treo thúng */}
      <line x1="10" y1="25" x2="10" y2="38" stroke="#78350F" strokeWidth="1.3" />
      <line x1="54" y1="25" x2="54" y2="38" stroke="#78350F" strokeWidth="1.3" />
      {/* Thúng trái */}
      <ellipse cx="10" cy="46" rx="13" ry="9" fill="#D6A15C" stroke="#8A5A2B" strokeWidth="1.5" />
      <ellipse cx="10" cy="41" rx="12" ry="4" fill="#4D7C0F" opacity="0.85" />
      <ellipse cx="10" cy="40" rx="9" ry="2.5" fill="#FDE68A" />
      {/* Thúng phải */}
      <ellipse cx="54" cy="46" rx="13" ry="9" fill="#D6A15C" stroke="#8A5A2B" strokeWidth="1.5" />
      <ellipse cx="54" cy="41" rx="12" ry="4" fill="#4D7C0F" opacity="0.85" />
      <ellipse cx="54" cy="40" rx="9" ry="2.5" fill="#FDE68A" />
      {/* Ghế gỗ thấp đỡ đòn gánh khi dừng bán */}
      <rect x="22" y="56" width="20" height="3" rx="1" fill="#78350F" />
      <rect x="24" y="59" width="2.5" height="8" fill="#5C3A1E" />
      <rect x="37.5" y="59" width="2.5" height="8" fill="#5C3A1E" />
      {/* Hơi nóng bốc lên từ thúng xôi */}
      <circle className="stall-steam" cx="10" cy="36" r="1.6" fill="#FFF" opacity="0.7" />
      <circle className="stall-steam" cx="54" cy="36" r="1.6" fill="#FFF" opacity="0.7" style={{ animationDelay: '0.8s' }} />
      </svg>
    </div>
  );
}

/** Hủ Tiếu Gõ - xe đẩy nhỏ, nồi nước lèo bốc khói, tô + đũa treo, ghế nhựa. */
function HuTieuGo() {
  return (
    <div className="relative flex items-end">
      <svg width="72" height="76" viewBox="0 0 72 76" className="overflow-visible">
      {/* Khung xe đẩy */}
      <rect x="8" y="40" width="56" height="22" rx="2" fill="#F4E4C8" stroke="#8A5A2B" strokeWidth="1.5" />
      <rect x="8" y="40" width="56" height="5" fill="#D6A15C" />
      {/* Bánh xe */}
      <circle cx="18" cy="66" r="5" fill="#3E2A1B" />
      <circle cx="18" cy="66" r="1.8" fill="#A8A29E" />
      <circle cx="54" cy="66" r="5" fill="#3E2A1B" />
      <circle cx="54" cy="66" r="1.8" fill="#A8A29E" />
      {/* Nồi nước lèo lớn */}
      <ellipse cx="36" cy="38" rx="14" ry="5" fill="#9CA3AF" />
      <rect x="22" y="22" width="28" height="16" rx="2" fill="#B8BCC2" stroke="#6B7280" strokeWidth="1.3" />
      <ellipse cx="36" cy="22" rx="14" ry="3.5" fill="#D1D5DB" />
      {/* Mái che bạt nhỏ */}
      <path d="M14 14 L58 14 L52 6 L20 6 Z" fill="#DC2626" className="stall-awning" />
      <path d="M14 14 L58 14" stroke="#991B1B" strokeWidth="1.2" />
      {[20, 28, 36, 44, 52].map((x) => (
        <rect key={x} x={x - 2} y="14" width="4" height="4" fill="#FFFFFF" opacity="0.9" />
      ))}
      {/* Tô và đũa treo bên hông */}
      <circle cx="12" cy="30" r="4" fill="#FFFFFF" stroke="#78350F" strokeWidth="1" />
      <path d="M12 30 Q13 27 15 26" stroke="#8A5A2B" strokeWidth="1" fill="none" />
      {/* Ghế nhựa thấp cạnh xe */}
      <rect x="60" y="58" width="9" height="2.5" rx="1" fill="#2563EB" />
      <rect x="61.5" y="60.5" width="1.5" height="6" fill="#1D4ED8" />
      <rect x="66" y="60.5" width="1.5" height="6" fill="#1D4ED8" />
      {/* Khói bốc lên từ nồi */}
      <circle className="stall-steam" cx="30" cy="20" r="2" fill="#FFF" opacity="0.75" />
      <circle className="stall-steam" cx="40" cy="20" r="1.8" fill="#FFF" opacity="0.7" style={{ animationDelay: '0.6s' }} />
      <circle className="stall-steam" cx="36" cy="18" r="2.2" fill="#FFF" opacity="0.8" style={{ animationDelay: '1.2s' }} />
      </svg>
      {/* Chú bán ngồi ghế nhựa cạnh xe, chờ khách kế tiếp */}
      <div className="ml-[-6px] mb-1.5">
        <StallVendor seed="Chú Hủ Tiếu Gõ" pose="STAND" size={34} />
      </div>
    </div>
  );
}

/** Cà Phê Vỉa Hè - ghế nhựa thấp, bàn con, phin cà phê đang nhỏ giọt. */
function CaPheViaHe() {
  return (
    <div className="relative flex items-end">
      <div className="mr-[-4px] mb-1">
        <StallVendor seed="Khách Cà Phê Cóc" pose="STAND" size={32} />
      </div>
      <svg width="52" height="60" viewBox="0 0 52 60" className="overflow-visible">
      {/* Ghế nhựa đỏ (cái ghế nhựa quốc dân) */}
      <rect x="4" y="38" width="16" height="3" rx="1" fill="#DC2626" />
      <rect x="5.5" y="41" width="2" height="10" fill="#991B1B" />
      <rect x="16.5" y="41" width="2" height="10" fill="#991B1B" />
      {/* Bàn nhựa xanh con */}
      <rect x="22" y="30" width="20" height="3" rx="1" fill="#0EA5E9" />
      <rect x="24" y="33" width="2" height="18" fill="#0369A1" />
      <rect x="38" y="33" width="2" height="18" fill="#0369A1" />
      {/* Phin cà phê trên ly */}
      <rect x="27" y="16" width="10" height="3" rx="1" fill="#D1D5DB" />
      <path d="M28 19 L36 19 L34.5 27 L29.5 27 Z" fill="#9CA3AF" stroke="#6B7280" strokeWidth="0.8" />
      <ellipse cx="32" cy="29" rx="5" ry="2" fill="#78350F" />
      <rect x="29" y="28" width="6" height="4" fill="#FEF3C7" stroke="#78350F" strokeWidth="0.8" />
      {/* Giọt cà phê nhỏ xuống */}
      <circle className="stall-steam" cx="32" cy="26" r="1" fill="#3E2A1B" opacity="0.8" style={{ animationDuration: '1.4s' }} />
      {/* Hơi nóng tỏa từ ly */}
      <circle className="stall-steam" cx="30" cy="24" r="1.3" fill="#FFF" opacity="0.65" style={{ animationDelay: '0.4s' }} />
      <circle className="stall-steam" cx="34" cy="24" r="1.3" fill="#FFF" opacity="0.65" style={{ animationDelay: '1s' }} />
      {/* Dép lào để cạnh ghế */}
      <ellipse cx="9" cy="54" rx="5" ry="1.8" fill="#16A34A" />
      <ellipse cx="17" cy="54" rx="5" ry="1.8" fill="#16A34A" />
      </svg>
    </div>
  );
}

interface StallDef {
  id: string;
  name: string;
  El: React.ComponentType;
  x: number;
  rewardCoins: number;
  emoji: string;
  quotes: string[];
}

/**
 * Thoại THUẦN ĐỜI THƯỜNG - không một chữ nào nhắc sản phẩm hay thương hiệu.
 * Đây chính là điểm khác biệt có chủ đích với mọi NPC/công trình khác.
 */
const STALLS: StallDef[] = [
  {
    id: 'stall-ganh-xoi',
    name: 'Gánh Xôi Cô Ba',
    El: GanhXoi,
    x: 300,
    rewardCoins: 8,
    emoji: '🍚',
    quotes: [
      'Xôi còn nóng hổi nè, nếp dẻo thơm mới đồ hồi sáng sớm đó!',
      'Xôi gấc đỏ au, xôi đậu xanh bùi bùi, Thị Trưởng ăn gói nào?',
      'Ngồi xuống ăn cho nóng, để nguội mất ngon à nghen!',
    ],
  },
  {
    id: 'stall-hu-tieu-go',
    name: 'Xe Hủ Tiếu Gõ',
    El: HuTieuGo,
    x: 1060,
    rewardCoins: 10,
    emoji: '🍜',
    quotes: [
      'Cóc cóc cóc! Hủ tiếu gõ đây, ai ăn hông ra chú múc cho!',
      'Nước lèo ninh xương cả buổi, ngọt thanh chứ không bột ngọt đâu nha!',
      'Khuya rồi mà bụng đói thì ghé đây, chú còn bán tới khuya!',
    ],
  },
  {
    id: 'stall-ca-phe-via-he',
    name: 'Cà Phê Cóc Đầu Hẻm',
    El: CaPheViaHe,
    x: 1740,
    rewardCoins: 9,
    emoji: '☕',
    quotes: [
      'Cà phê phin nhỏ giọt từ từ, ngồi ghế nhựa tám chuyện mới đúng điệu!',
      'Đen đá hay nâu đá đây? Ngồi lâu cũng hổng ai đuổi à nghen!',
      'Sáng sớm làm ly cà phê cái đã, rồi tính chuyện làm ăn sau!',
    ],
  },
];

export default function StreetVendorStalls({
  streetWidth = 2400,
  onStallReward,
}: {
  streetWidth?: number;
  onStallReward?: (toast: string) => void;
}) {
  const [activeSpeech, setActiveSpeech] = useState<{ stallId: string; text: string } | null>(null);
  /** Tên người chơi để người bán hàng xưng hô thay cho "Thị Trưởng". */
  const mayorName = useCity((s) => s.mayorName);
  const [effects, setEffects] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleTap = (stall: StallDef, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = claimTapReward('stall', stall.rewardCoins, { cooldownMs: 2200 });
    const quote = fillTen(stall.quotes[Math.floor(Math.random() * stall.quotes.length)], mayorName);
    setActiveSpeech({ stallId: stall.id, text: quote });
    setTimeout(() => setActiveSpeech((cur) => (cur?.stallId === stall.id ? null : cur)), 3800);

    setEffects((p) => [...p, { id: Date.now() + Math.random(), x: stall.x + 24, y: 40 }]);
    setTimeout(() => setEffects((p) => p.slice(1)), 1200);

    if (result.ok) {
      onStallReward?.(`${stall.emoji} ${stall.name}: "${quote}" (+${stall.rewardCoins}đ)`);
    } else {
      onStallReward?.(`${stall.emoji} ${stall.name}: "${quote}"`);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STALL_CSS }} />
      {STALLS.filter((s) => s.x < streetWidth - 80).map((stall) => {
        const StallEl = stall.El;
        const isSpeaking = activeSpeech?.stallId === stall.id;
        return (
          <div
            key={stall.id}
            className="absolute z-20 cursor-pointer select-none pointer-events-auto transition-transform hover:scale-105 active:scale-95"
            style={{ left: stall.x, bottom: 6 }}
            onClick={(e) => handleTap(stall, e)}
            title={`${stall.emoji} ${stall.name} (Bấm để ghé qua)`}
          >
            {isSpeaking && (
              <div
                className="pointer-events-none absolute -top-10 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center"
                style={{ animation: 'stallBubblePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
              >
                <div className="whitespace-nowrap rounded-xl border border-[#78533D] bg-[#FFFDF7] px-3 py-1.5 text-xs font-bold text-[#3E2A1B] shadow-md">
                  {activeSpeech!.text}
                </div>
                <div className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-[#78533D]" />
              </div>
            )}
            <StallEl />
          </div>
        );
      })}
      {effects.map((eff) => (
        <div
          key={eff.id}
          className="pointer-events-none absolute z-30 select-none text-base"
          style={{ left: eff.x, top: eff.y, animation: 'stallSteamRise 1.1s cubic-bezier(0.2,0.8,0.2,1) forwards' }}
        >
          💰
        </div>
      ))}
    </>
  );
}
