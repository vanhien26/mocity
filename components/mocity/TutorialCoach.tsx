'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, GraduationCap, X } from 'lucide-react';

import {
  advanceTutorial,
  isTutorialStepDone,
  skipTutorial,
  useCity,
  useTutorialStep,
} from '@/lib/mocity/store';
import { TUTORIAL_STEPS } from '@/lib/mocity/tutorial';

/* ═══════════════════════════════════════════════════════════════════════════
 * THẺ HƯỚNG DẪN
 *
 * Là một thẻ nhỏ cố định, KHÔNG phải modal chặn màn hình: người chơi phải
 * thao tác được trên phố trong lúc đọc. Modal chặn thì chỉ còn cách bấm cho
 * qua, mà bấm cho qua thì không học được gì.
 *
 * Thẻ có hai trạng thái. Chưa xong: hiện việc cần làm. Vừa xong: hiện phần
 * giải thích, và chỉ lúc đó mới có nút Tiếp.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Viền sáng quanh nút cần bấm, vẽ theo vị trí thật của phần tử. */
function Spotlight({ anchor }: { anchor?: string }) {
  const [hop, setHop] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!anchor) {
      setHop(null);
      return;
    }
    /*
     * Do lai theo nhip: thanh dock co the doi kich thuoc khi so lieu thay doi
     * (vd huy hieu "570" tren nut Mo Rong), va do mot lan thi vien sang se
     * lech khoi nut.
     */
    const do_ = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`);
      setHop(el ? el.getBoundingClientRect() : null);
    };
    do_();
    const t = setInterval(do_, 500);
    window.addEventListener('resize', do_);
    return () => {
      clearInterval(t);
      window.removeEventListener('resize', do_);
    };
  }, [anchor]);

  if (!hop) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[70] rounded-xl"
      style={{
        left: hop.left - 6,
        top: hop.top - 6,
        width: hop.width + 12,
        height: hop.height + 12,
        border: '3px solid #FBBF24',
        boxShadow: '0 0 0 9999px rgba(20,15,18,0.45), 0 0 18px rgba(251,191,36,0.9)',
        animation: 'tour-pulse 1.4s ease-in-out infinite',
      }}
    />,
    document.body,
  );
}

export default function TutorialCoach({ hidden = false }: { hidden?: boolean }) {
  const step = useTutorialStep();
  const stepIndex = useCity((s) => s.tutorialStep ?? 0);
  /*
   * `isTutorialStepDone` doc state o module. Phai goi lai moi khi mot trong
   * cac nguon du lieu cua dieu kien doi, nen subscribe vao chung o day.
   */
  const buildings = useCity((s) => s.buildings);
  const flags = useCity((s) => s.tutorialFlags);
  const dailyLog = useCity((s) => s.dailyLog);

  const [daDoc, setDaDoc] = useState(false);
  /*
   * Hoi lai truoc khi bo qua. Nut X chi 17x17 nam sat mep the, bam nhuoc tay
   * la mat ca man huong dan ma khong co dau hieu gi - dung canh da gap khi
   * kiem thu. Van khoi phuc duoc qua "Xem lai huong dan" trong Toa Thi Chinh,
   * nhung mat im lang van la mat.
   */
  const [hoiBoQua, setHoiBoQua] = useState(false);

  const xong = step ? isTutorialStepDone() : false;
  void buildings;
  void flags;
  void dailyLog;

  // Sang bước mới thì xoá trạng thái đã đọc của bước trước.
  useEffect(() => {
    setDaDoc(false);
    setHoiBoQua(false);
  }, [stepIndex]);

  /*
   * An han khi co bang nao dang mo. The nay neo o `bottom-96px` nen se de len
   * ngan Xay Dung, va vien sang cua spotlight con phu mot lop toi len ca man
   * hinh - nguoi choi khong thao tac duoc trong chinh bang ma huong dan vua
   * bao ho mo. Dong bang lai la thay ngay ket qua.
   */
  if (!step || hidden) return null;

  const tongBuoc = TUTORIAL_STEPS.length;
  const cuoiCung = stepIndex === tongBuoc - 1;

  return (
    <>
      {!xong && <Spotlight anchor={step.anchor} />}

      <div
        className="fixed bottom-[96px] left-1/2 z-[75] w-[min(94vw,400px)] -translate-x-1/2 rounded-2xl border-2 p-3 shadow-2xl"
        style={{
          background: 'linear-gradient(180deg,#FFFDF7,#FFF6E2)',
          borderColor: xong ? '#16A34A' : '#C9A227',
        }}
      >
        <div className="flex items-start gap-2">
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: xong ? '#16A34A' : '#D82D8B' }}
          >
            {xong ? <Check size={15} /> : <GraduationCap size={15} />}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#8A7355]">
                Hướng dẫn · bước {stepIndex + 1}/{tongBuoc}
              </p>
              <button
                type="button"
                onClick={() => setHoiBoQua(true)}
                className="shrink-0 rounded-md p-1 text-[#8A7355] transition-colors hover:text-[#3E2A1B]"
                title="Bỏ qua hướng dẫn"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-0.5 text-sm font-black text-[#3E2A1B]">{step.title}</p>

            {hoiBoQua && (
              <div className="mt-1.5 rounded-lg px-2 py-1.5" style={{ background: '#FEF2F2' }}>
                <p className="text-[11px] font-bold text-[#991B1B]">
                  Bỏ qua hướng dẫn? Mở lại bất cứ lúc nào trong Thị Chính.
                </p>
                <div className="mt-1.5 flex gap-1.5">
                  <button
                    type="button"
                    onClick={skipTutorial}
                    className="rounded-lg px-2.5 py-1 text-[10px] font-black text-white"
                    style={{ background: '#DC2626' }}
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="button"
                    onClick={() => setHoiBoQua(false)}
                    className="rounded-lg border px-2.5 py-1 text-[10px] font-black"
                    style={{ borderColor: '#C9A22788', color: '#5B3D22' }}
                  >
                    Học tiếp
                  </button>
                </div>
              </div>
            )}

            {xong ? (
              <p className="mt-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold leading-relaxed text-[#14532D]" style={{ background: '#F0FDF4' }}>
                {step.lesson}
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-[#6E4F3A]">
                {step.how}
              </p>
            )}
          </div>
        </div>

        {/* Dãy chấm tiến độ */}
        <div className="mt-2 flex items-center gap-1">
          {TUTORIAL_STEPS.map((s, i) => (
            <span
              key={s.id}
              className="h-1 flex-1 rounded-full"
              style={{
                background: i < stepIndex ? '#16A34A' : i === stepIndex ? '#D82D8B' : '#E6D9B8',
              }}
            />
          ))}
        </div>

        {xong && (
          <button
            type="button"
            onClick={() => {
              setDaDoc(true);
              advanceTutorial();
            }}
            disabled={daDoc}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-white transition-transform active:scale-95 disabled:opacity-50"
            style={{ background: '#16A34A' }}
          >
            {cuoiCung ? 'Xong hướng dẫn' : 'Bước tiếp theo'}
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes tour-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </>
  );
}
