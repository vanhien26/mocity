'use client';

import { useState } from 'react';
import { Award, CheckCircle2, HelpCircle, Sparkles, X, XCircle } from 'lucide-react';
import { answerMicroQuiz } from '@/lib/mocity/store';
import { playError, playSuccess } from '@/lib/mocity/sound-engine';
import { particles } from './ParticleEngine';
import { formatVND } from '@/lib/mocity/currency';

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    topic: 'Quản Lý Chi Tiêu',
    question: 'Quy tắc quản lý tài chính cá nhân 50/30/20 khuyên bạn dành 50% thu nhập cho mục nào?',
    options: [
      'Nhu cầu thiết yếu (Ăn uống, thuê nhà, điện nước)',
      'Tiết kiệm & Đầu tư sinh lời',
      'Mua sắm xa xỉ & Hưởng thụ',
      'Cho bạn bè vay mượn',
    ],
    correctIndex: 0,
    explanation: '50% dành cho chi tiêu thiết yếu, 30% cho sở thích linh hoạt, và 20% cho tiết kiệm/đầu tư dự phòng!',
  },
  {
    id: 'q2',
    topic: 'Lãi Kép & Tiết Kiệm',
    question: 'Điều gì tạo nên sức mạnh kỳ diệu nhất của "Lãi kép" (Compound Interest)?',
    options: [
      'Rút hết tiền tiêu ngay sau tuần đầu tiên',
      'Tái đầu tư cả tiền gốc lẫn tiền lãi liên tục theo thời gian',
      'Chỉ gửi tiết kiệm kỳ hạn ngắn dưới 1 ngày',
      'Đổi tiền sang ngoại tệ cất dưới gối',
    ],
    correctIndex: 1,
    explanation: 'Albert Einstein từng gọi Lãi kép là kỳ quan thứ 8: Lãi mẹ đẻ lãi con, bùng nổ theo hàm số mũ khi kiên trì!',
  },
  {
    id: 'q3',
    topic: 'Quản Trị Dòng Tiền & Uy Tín Đô Thị',
    question: 'Hành động nào dưới đây giúp tăng Điểm Tin Cậy & Tín Nhiệm Đô Thị tốt nhất?',
    options: [
      'Chi tiêu hoang phí không kiểm soát chi phí vận hành',
      'Để tiệm ế ẩm và khách bỏ đi vì phục vụ chậm',
      'Quản lý thu chi minh bạch, tối ưu giá vốn và chi phí vận hành',
      'Tắt ứng dụng không thèm chăm sóc phố',
    ],
    correctIndex: 2,
    explanation: 'Quản lý tài chính minh bạch, tối ưu chi phí và duy trì dòng tiền dương giúp đô thị của bạn luôn phát triển bền vững!',
  },
  {
    id: 'q4',
    topic: 'Quỹ Dự Phòng Khẩn Cấp',
    question: 'Quy mô hợp lý nhất cho một Quỹ Khẩn Cấp (Emergency Fund) là bao nhiêu?',
    options: [
      'Đủ tiêu trong 1-2 ngày cuối tuần',
      'Tương đương 3 đến 6 tháng chi phí sinh hoạt thiết yếu',
      'Toàn bộ tài sản tích lũy cả đời',
      'Không cần vì có thể vay nóng bất cứ lúc nào',
    ],
    correctIndex: 1,
    explanation: 'Quỹ 3-6 tháng giúp bạn đứng vững trước các biến cố bất ngờ (mất việc, ốm đau, sửa chữa lớn) mà không phải bán rẻ tài sản!',
  },
  {
    id: 'q5',
    topic: 'Bảo Hiểm & Quản Trị Rủi Ro',
    question: 'Mục đích cốt lõi của việc tham gia Bảo Hiểm là gì?',
    options: [
      'Để kiếm lời nhanh gấp 10 lần số tiền bỏ ra',
      'Phòng vệ tài chính, chuyển giao rủi ro tổn thất lớn cho công ty bảo hiểm',
      'Một hình thức đánh bạc hợp pháp',
      'Bắt buộc phải mua để khoe với bạn bè',
    ],
    correctIndex: 1,
    explanation: 'Bảo hiểm không phải để đầu cơ kiếm lời, mà là tấm khiên bảo vệ thành quả tài chính khỏi nguy cơ phá sản khi sự cố ập đến!',
  },
];

export default function MicroQuizModal({
  isOpen,
  onClose,
  initialQuestion,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: QuizQuestion;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentQ, setCurrentQ] = useState<QuizQuestion>(
    () => initialQuestion || QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)],
  );

  if (!isOpen) return null;

  const handleSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIdx(idx);
    setIsSubmitted(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      playSuccess();
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.4);
      answerMicroQuiz(true, 50_000, 20); // +50K VNĐ & +20 MP
    } else {
      playError();
      answerMicroQuiz(false, 0, 0);
    }
  };

  const handleNext = () => {
    setSelectedIdx(null);
    setIsSubmitted(false);
    const others = QUIZ_QUESTIONS.filter((q) => q.id !== currentQ.id);
    setCurrentQ(others[Math.floor(Math.random() * others.length)]);
  };

  const isCorrect = selectedIdx === currentQ.correctIndex;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-4 border-[#8B5E1A] bg-[#FFFDF7] shadow-2xl">
        {/* Mái hiên Chibi rực rỡ */}
        <div
          className="relative px-5 py-4 text-white"
          style={{
            background: 'linear-gradient(135deg, #A8246B 0%, #D81B60 100%)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-lg shadow-inner">
                💡
              </span>
              <div>
                <h3 className="font-pixel text-base font-black text-amber-200">
                  THỬ THÁCH THỊ TRƯỞNG
                </h3>
                <p className="text-[11px] font-bold text-pink-100">
                  {currentQ.topic} · Thưởng +50.000đ & +20 MP
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/20 text-white/80 transition-colors hover:bg-black/40 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nội dung câu hỏi */}
        <div className="p-5">
          <div className="mb-4 rounded-2xl border-2 border-[#EADFCB] bg-[#FAF5EB] p-4 text-[#3E2A1B]">
            <p className="text-sm font-black leading-relaxed">
              {currentQ.question}
            </p>
          </div>

          {/* Danh sách đáp án */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              let btnStyle = 'border-[#EADFCB] bg-white text-[#3E2A1B] hover:border-[#A8246B] hover:bg-pink-50/50';
              if (isSubmitted) {
                if (idx === currentQ.correctIndex) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-400';
                } else if (idx === selectedIdx) {
                  btnStyle = 'border-rose-400 bg-rose-50 text-rose-800 line-through';
                } else {
                  btnStyle = 'border-gray-200 bg-gray-50 text-gray-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => handleSelect(idx)}
                  className={`relative flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left text-xs font-bold transition-all active:scale-[0.98] ${btnStyle}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border border-current text-[11px] font-black">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isSubmitted && idx === currentQ.correctIndex && (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  )}
                  {isSubmitted && idx === selectedIdx && idx !== currentQ.correctIndex && (
                    <XCircle size={18} className="shrink-0 text-rose-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Giải thích sau khi trả lời */}
          {isSubmitted && (
            <div
              className={`mt-4 rounded-2xl border-2 p-3.5 text-xs animate-in zoom-in-95 duration-200 ${
                isCorrect
                  ? 'border-emerald-300 bg-emerald-50/90 text-emerald-900'
                  : 'border-amber-300 bg-amber-50/90 text-amber-900'
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5 font-black">
                {isCorrect ? (
                  <>
                    <Sparkles size={16} className="text-emerald-600" />
                    <span>CHÍNH XÁC! +50.000đ VNĐ & +20 MP 🌟</span>
                  </>
                ) : (
                  <>
                    <HelpCircle size={16} className="text-amber-600" />
                    <span>CHƯA ĐÚNG RỒI! Hãy ghi nhớ nhé:</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed opacity-90">{currentQ.explanation}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-5 flex items-center justify-end gap-2">
            {isSubmitted ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-xl border-2 border-[#73164A] bg-[#A8246B] px-5 py-2.5 text-xs font-black text-white shadow transition-transform hover:bg-[#B8307A] active:scale-95"
              >
                <span>Câu Tiếp Theo</span>
                <span>➔</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-4 py-2 text-xs font-bold text-[#3E2A1B] hover:bg-white"
              >
                Để sau
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
