'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface Slide {
  bg: string;
  scene: string;
  speaker?: string;
  speakerEmoji?: string;
  dialogue?: string;
  narration: string;
}

const SLIDES: Slide[] = [
  {
    bg: '#FDF6E3',
    scene: '🌾',
    narration: 'Ba tháng trước, bạn vẫn còn ở quê. Ruộng không đủ ăn, bố mẹ già, em út đang tuổi học.',
  },
  {
    bg: '#FDF2EC',
    scene: '📄',
    speaker: 'Ông Chín - Chủ nợ',
    speakerEmoji: '👴',
    dialogue: '"200 triệu. Lãi 5 triệu mỗi tháng. Không trả đúng hạn, tao lấy đất."',
    narration: 'Bạn ký vào tờ giấy. Mực chưa khô, tay đã run. Đó là toàn bộ hy vọng của cả gia đình.',
  },
  {
    bg: '#F9F3FD',
    scene: '🏙️',
    speaker: 'Anh Tư - Hàng xóm cũ',
    speakerEmoji: '👨',
    dialogue: '"Lên thành phố đi. Dưới đó nhiều cơ hội lắm. Tao bắt đầu từ hai bàn tay trắng, giờ có hai mặt bằng rồi."',
    narration: 'Bạn nhét 50 triệu tiền vay mượn vào túi, leo lên xe đò đêm. Không dám nhìn lại.',
  },
  {
    bg: '#F3F9ED',
    scene: '🔑',
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

          {/* Scene emoji */}
          <div className="flex justify-center py-6">
            <span className="text-7xl select-none">{slide.scene}</span>
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
