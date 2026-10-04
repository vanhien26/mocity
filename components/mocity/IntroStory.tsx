'use client';

import { useState } from 'react';
import type { ReactElement } from 'react';
import { ArrowRight } from 'lucide-react';

// Pixel-art style SVG icons
function IconVillage() {
  return (
    <svg viewBox="0 0 48 48" width="72" height="72" style={{ imageRendering: 'pixelated' }}>
      {/* Sky */}
      <rect x="0" y="0" width="48" height="28" fill="#87CEEB" />
      {/* Sun */}
      <rect x="36" y="4" width="6" height="6" fill="#FFD700" />
      {/* Ground */}
      <rect x="0" y="28" width="48" height="20" fill="#8B6914" />
      <rect x="0" y="28" width="48" height="4" fill="#5A8A00" />
      {/* House left */}
      <rect x="4" y="18" width="14" height="14" fill="#D4A44C" />
      <rect x="4" y="12" width="14" height="8" fill="#C0392B" />
      <polygon points="4,18 11,8 18,18" fill="#E74C3C" />
      <rect x="8" y="22" width="4" height="6" fill="#5D4037" />
      {/* House right */}
      <rect x="30" y="20" width="14" height="12" fill="#D4A44C" />
      <polygon points="30,20 37,12 44,20" fill="#E74C3C" />
      <rect x="34" y="23" width="4" height="6" fill="#5D4037" />
      {/* Rice field */}
      <rect x="18" y="30" width="12" height="4" fill="#4CAF50" />
      <rect x="19" y="29" width="2" height="3" fill="#66BB6A" />
      <rect x="22" y="29" width="2" height="3" fill="#66BB6A" />
      <rect x="25" y="29" width="2" height="3" fill="#66BB6A" />
    </svg>
  );
}

function IconDebt() {
  return (
    <svg viewBox="0 0 48 48" width="72" height="72" style={{ imageRendering: 'pixelated' }}>
      {/* Paper */}
      <rect x="10" y="6" width="28" height="36" fill="#FFF9C4" />
      <rect x="10" y="6" width="28" height="4" fill="#F9A825" />
      {/* Lines of text */}
      <rect x="14" y="14" width="20" height="2" fill="#795548" />
      <rect x="14" y="18" width="16" height="2" fill="#795548" />
      <rect x="14" y="22" width="18" height="2" fill="#795548" />
      {/* Red amount */}
      <rect x="14" y="28" width="20" height="4" fill="#E53935" />
      <rect x="15" y="29" width="18" height="2" fill="#FFCDD2" />
      {/* Seal / stamp */}
      <rect x="28" y="34" width="8" height="6" fill="#E53935" rx="1" />
      <rect x="29" y="35" width="6" height="4" fill="#C62828" />
      {/* Pen */}
      <rect x="6" y="28" width="2" height="14" fill="#795548" transform="rotate(-30 6 28)" />
      <rect x="6" y="38" width="2" height="4" fill="#FFC107" transform="rotate(-30 6 28)" />
    </svg>
  );
}

function IconBus() {
  return (
    <svg viewBox="0 0 48 48" width="72" height="72" style={{ imageRendering: 'pixelated' }}>
      {/* Night sky */}
      <rect x="0" y="0" width="48" height="48" fill="#1A237E" />
      {/* Stars */}
      <rect x="6" y="4" width="2" height="2" fill="#FFF9C4" />
      <rect x="20" y="8" width="2" height="2" fill="#FFF9C4" />
      <rect x="38" y="5" width="2" height="2" fill="#FFF9C4" />
      <rect x="32" y="12" width="2" height="2" fill="#FFF9C4" />
      {/* Road */}
      <rect x="0" y="36" width="48" height="12" fill="#424242" />
      <rect x="0" y="40" width="48" height="2" fill="#616161" />
      <rect x="6" y="42" width="8" height="2" fill="#FFD700" />
      <rect x="20" y="42" width="8" height="2" fill="#FFD700" />
      <rect x="34" y="42" width="8" height="2" fill="#FFD700" />
      {/* Bus body */}
      <rect x="4" y="20" width="40" height="18" fill="#1565C0" />
      <rect x="4" y="20" width="40" height="4" fill="#0D47A1" />
      {/* Windows */}
      <rect x="8" y="22" width="6" height="4" fill="#B3E5FC" />
      <rect x="16" y="22" width="6" height="4" fill="#B3E5FC" />
      <rect x="24" y="22" width="6" height="4" fill="#FFF9C4" />
      <rect x="32" y="22" width="6" height="4" fill="#B3E5FC" />
      {/* Door */}
      <rect x="36" y="28" width="6" height="10" fill="#0D47A1" />
      {/* Wheels */}
      <rect x="8" y="36" width="8" height="6" fill="#212121" rx="3" />
      <rect x="32" y="36" width="8" height="6" fill="#212121" rx="3" />
      <rect x="11" y="37" width="2" height="2" fill="#616161" />
      <rect x="35" y="37" width="2" height="2" fill="#616161" />
      {/* Headlight */}
      <rect x="42" y="28" width="4" height="4" fill="#FFD700" />
    </svg>
  );
}

function IconCity() {
  return (
    <svg viewBox="0 0 48 48" width="72" height="72" style={{ imageRendering: 'pixelated' }}>
      {/* Sky dawn */}
      <rect x="0" y="0" width="48" height="32" fill="#FF8F00" />
      <rect x="0" y="0" width="48" height="16" fill="#E65100" />
      {/* Sun rising */}
      <rect x="20" y="22" width="8" height="4" fill="#FFD600" />
      {/* Ground */}
      <rect x="0" y="32" width="48" height="16" fill="#37474F" />
      {/* Building tall center */}
      <rect x="18" y="8" width="12" height="28" fill="#546E7A" />
      <rect x="20" y="10" width="3" height="3" fill="#FFF176" />
      <rect x="25" y="10" width="3" height="3" fill="#90CAF9" />
      <rect x="20" y="16" width="3" height="3" fill="#90CAF9" />
      <rect x="25" y="16" width="3" height="3" fill="#FFF176" />
      <rect x="20" y="22" width="3" height="3" fill="#FFF176" />
      <rect x="25" y="22" width="3" height="3" fill="#90CAF9" />
      {/* Antenna */}
      <rect x="23" y="4" width="2" height="6" fill="#B0BEC5" />
      <rect x="22" y="5" width="4" height="1" fill="#EF5350" />
      {/* Building left */}
      <rect x="4" y="18" width="12" height="18" fill="#455A64" />
      <rect x="6" y="20" width="3" height="3" fill="#FFF176" />
      <rect x="11" y="20" width="3" height="3" fill="#90CAF9" />
      <rect x="6" y="26" width="3" height="3" fill="#90CAF9" />
      {/* Building right */}
      <rect x="32" y="14" width="12" height="22" fill="#455A64" />
      <rect x="34" y="16" width="3" height="3" fill="#FFF176" />
      <rect x="39" y="16" width="3" height="3" fill="#FFF176" />
      <rect x="34" y="22" width="3" height="3" fill="#90CAF9" />
      <rect x="39" y="22" width="3" height="3" fill="#90CAF9" />
      {/* Road */}
      <rect x="0" y="40" width="48" height="4" fill="#263238" />
      <rect x="6" y="41" width="6" height="2" fill="#FFD600" />
      <rect x="22" y="41" width="6" height="2" fill="#FFD600" />
      <rect x="36" y="41" width="6" height="2" fill="#FFD600" />
    </svg>
  );
}

interface Slide {
  bg: string;
  SceneIcon: () => ReactElement;
  speaker?: string;
  speakerEmoji?: string;
  dialogue?: string;
  narration: string;
}

const SLIDES: Slide[] = [
  {
    bg: '#FDF6E3',
    SceneIcon: IconVillage,
    narration: 'Ba tháng trước, bạn vẫn còn ở quê. Ruộng không đủ ăn, bố mẹ già, em út đang tuổi học.',
  },
  {
    bg: '#FDF2EC',
    SceneIcon: IconDebt,
    speaker: 'Ông Chín - Chủ nợ',
    speakerEmoji: '👴',
    dialogue: '"200 triệu. Lãi 5 triệu mỗi tháng. Không trả đúng hạn, tao lấy đất."',
    narration: 'Bạn ký vào tờ giấy. Mực chưa khô, tay đã run. Đó là toàn bộ hy vọng của cả gia đình.',
  },
  {
    bg: '#EEF2FD',
    SceneIcon: IconBus,
    speaker: 'Anh Tư - Hàng xóm cũ',
    speakerEmoji: '👨',
    dialogue: '"Lên thành phố đi. Dưới đó nhiều cơ hội lắm. Tao bắt đầu từ hai bàn tay trắng, giờ có hai mặt bằng rồi."',
    narration: 'Bạn nhét 50 triệu tiền vay mượn vào túi, leo lên xe đò đêm. Không dám nhìn lại.',
  },
  {
    bg: '#F3F9ED',
    SceneIcon: IconCity,
    narration: 'Thành phố MoCity. Đây là nơi bạn sẽ xây dựng — hoặc sụp đổ.',
    speaker: 'Thị Trưởng',
    speakerEmoji: '🏛️',
    dialogue: '"Tôi có 3 lô đất trống ở hẻm chính. Cho thuê 6 tháng. Bạn muốn làm gì với nó — là chuyện của bạn."',
  },
];

interface IntroStoryProps {
  onFinish: () => void;
}

export default function IntroStory({ onFinish }: IntroStoryProps) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const { SceneIcon } = slide;
  const isLast = step === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-[#140F12]/75 p-4 backdrop-blur-md"
      onClick={() => {
        if (!isLast) setStep(s => s + 1);
      }}
    >
      <div className="relative my-10 w-full max-w-[480px]">
        <div
          className="overflow-hidden rounded-3xl border-[3px] border-[#C9A227] shadow-[0_24px_64px_rgba(0,0,0,0.65)] transition-colors duration-500"
          style={{ backgroundColor: slide.bg }}
        >
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-5 pb-2">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 24 : 8,
                  backgroundColor: i <= step ? '#D82D8B' : '#D5CEBF',
                }}
              />
            ))}
          </div>

          {/* Scene icon */}
          <div className="flex justify-center py-6">
            <SceneIcon />
          </div>

          {/* Narration */}
          <div className="px-6 pb-4">
            <p className="text-[15px] leading-relaxed text-[#3E2A1B] font-medium text-center">
              {slide.narration}
            </p>
          </div>

          {/* Dialogue card */}
          {slide.speaker && slide.dialogue && (
            <div className="mx-5 mb-5 rounded-2xl border-2 border-[#D5CEBF] bg-white/80 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{slide.speakerEmoji}</span>
                <span className="text-[12px] font-black uppercase tracking-wide text-[#8B7355]">
                  {slide.speaker}
                </span>
              </div>
              <p className="text-[14px] leading-relaxed text-[#3E2A1B] italic">
                {slide.dialogue}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="px-5 pb-6 pt-1">
            {isLast ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onFinish(); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-[#D82D8B] px-6 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.01] hover:bg-[#EB2F96] active:scale-95"
              >
                <span>Bắt đầu hành trình</span>
                <ArrowRight size={17} className="shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setStep(s => s + 1); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#D5CEBF] bg-white/70 px-6 py-3 text-sm font-bold text-[#6E4F3A] transition-all hover:border-[#D82D8B] hover:text-[#D82D8B] active:scale-95"
              >
                <span>Tiếp theo</span>
                <ArrowRight size={15} className="shrink-0" />
              </button>
            )}
            <p className="mt-2 text-center text-[11px] text-[#8B7355]">
              {isLast ? 'Bạn có 50 triệu · Nợ 200 triệu · 360 ngày' : 'Chạm để tiếp tục'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
