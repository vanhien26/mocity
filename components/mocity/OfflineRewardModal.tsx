'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, Coins } from 'lucide-react';
import { formatDuration } from '@/lib/mocity/format';

function formatVND(n: number) {
  return n.toLocaleString('vi-VN');
}

/** Rain of coin emoji particles */
function CoinRain({ active }: { active: boolean }) {
  const coins = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: 4 + Math.floor(Math.random() * 92),
      delay: Math.random() * 1.4,
      dur: 1.2 + Math.random() * 1.0,
      size: 14 + Math.floor(Math.random() * 14),
    })),
  ).current;

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {coins.map((c) => (
        <span
          key={c.id}
          className="absolute animate-coin-fall select-none text-[#FBBF24]"
          style={{
            left: `${c.left}%`,
            top: '-2rem',
            fontSize: c.size,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
          }}
        >
          <Coins size={c.size} className="shrink-0" />
        </span>
      ))}
    </div>
  );
}

export default function OfflineRewardModal({
  open,
  coins,
  elapsedMs,
  capped,
  onClaim,
  onClose,
}: {
  open: boolean;
  coins: number;
  elapsedMs: number;
  capped: boolean;
  onClaim: () => void;
  onClose: () => void;
}) {
  const [displayed, setDisplayed] = useState(0);
  const [showRain, setShowRain] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const claimRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number | null>(null);

  // Count-up animation
  useEffect(() => {
    if (!open) { setDisplayed(0); setClaimed(false); return; }

    setShowRain(false);
    const duration = Math.min(2200, 800 + coins / 500);
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * coins));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(coins);
        setShowRain(true);
        setTimeout(() => setShowRain(false), 2000);
        claimRef.current?.focus();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [open, coins]);

  if (!open) return null;

  const handleClaim = () => {
    setClaimed(true);
    setTimeout(onClaim, 260);
  };

  return (
    <>
      <style>{`
        @keyframes coin-fall {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.6); opacity: 0; }
        }
        .animate-coin-fall { animation: coin-fall linear forwards; }

        @keyframes pulse-glow {
          0%, 100% { text-shadow: 0 0 24px rgba(235,47,150,0.6), 0 0 48px rgba(235,47,150,0.3); }
          50%       { text-shadow: 0 0 40px rgba(235,47,150,0.9), 0 0 80px rgba(235,47,150,0.5); }
        }
        .animate-glow { animation: pulse-glow 1.4s ease-in-out infinite; }

        @keyframes slide-up-in {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .animate-slide-up { animation: slide-up-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <CoinRain active={showRain} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[61] flex flex-col items-center justify-center"
        style={{ background: 'rgba(10,5,0,0.82)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="animate-slide-up flex w-full max-w-[400px] flex-col items-center px-6 text-center">

          {/* Icon thị trưởng ngủ → thức */}
          <div
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-full text-5xl shadow-lg"
            style={{ background: 'rgba(235,47,150,0.15)', border: '2px solid rgba(235,47,150,0.4)' }}
          >
            <Building2 size={22} className="shrink-0 text-[#EB2F96]" />
          </div>

          <p className="text-sm font-black uppercase tracking-widest text-[#EB2F96]">
            Thành phố không ngủ
          </p>
          <p className="mt-1 text-base font-bold text-white/70">
            Đã tự vận hành suốt <span className="font-black text-white">{formatDuration(elapsedMs)}</span>
          </p>

          {/* Số tiền count-up */}
          <div className="my-7">
            <p
              className="animate-glow text-[56px] font-black leading-none tabular-nums text-[#EB2F96]"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              +{formatVND(displayed)}
            </p>
            <p className="mt-2 text-sm font-bold tracking-wide text-white/50">XU THU NHẬP KHI VẮNG</p>
          </div>

          {capped && (
            <div
              className="mb-5 rounded-2xl px-4 py-2.5 text-xs font-bold text-amber-300"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}
            >
              Đã chạm trần 8 giờ - quay lại thường xuyên để không bỏ lỡ Xu
            </div>
          )}

          <button
            ref={claimRef}
            type="button"
            onClick={handleClaim}
            disabled={claimed}
            className="w-full rounded-2xl py-4 text-base font-black text-white shadow-2xl transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: claimed
                ? 'rgba(235,47,150,0.5)'
                : 'linear-gradient(135deg, #C0226E 0%, #EB2F96 60%, #F472B6 100%)',
              boxShadow: claimed ? 'none' : '0 8px 32px rgba(235,47,150,0.45)',
            }}
          >
            {claimed ? '✓ Đã nhận!' : `Thu ${formatVND(coins)} Xu về Ngân khố`}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs font-semibold text-white/35 transition-colors hover:text-white/60"
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </>
  );
}
