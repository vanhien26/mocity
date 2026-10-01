'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { CircleDollarSign } from 'lucide-react';
import { claimTapReward } from '@/lib/mocity/store';
import { formatCompact } from '@/lib/mocity/format';
import { particles } from './ParticleEngine';
import { useGameJuice } from '@/lib/mocity/useGameJuice';

const FIRST_SPAWN_MS = 4000;
const SPAWN_INTERVAL_MIN = 9000;
const SPAWN_INTERVAL_MAX = 16000;
const LIFETIME_MS = 5200;

interface Bubble {
  id: number;
  x: number;
  y: number;
  amount: number;
  drift: number;
}

/**
 Bong bong Xu bay len tren man hinh. Vi tri lay tu boundingClientRect cua mot o
 * de browser tu tinh phep chieu camera - khong can tu tinh ma tran iso.
 */
export default function CoinBubble({ hostRef }: { hostRef: RefObject<HTMLElement | null> }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const nextId = useRef(1);
  const { floatNumber } = useGameJuice();

  const spawn = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;

    const tiles = host.querySelectorAll<HTMLElement>('[data-tile]');
    if (tiles.length === 0) return;

    const tile = tiles[Math.floor(Math.random() * tiles.length)];
    const rect = tile.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    if (rect.width === 0) return;

    const size = 44;
    const x = rect.left - hostRect.left + rect.width / 2 - size / 2;
    const y = rect.top - hostRect.top + rect.height / 2 - size / 2;

    if (x < 8 || x > hostRect.width - size - 8) return;

    const amount = 5 + Math.floor(Math.random() * 26);
    const id = nextId.current++;

    setBubbles((prev) => [...prev, { id, x, y, amount, drift: (Math.random() - 0.5) * 30 }]);

    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    }, LIFETIME_MS);
  }, [hostRef]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        spawn();
        schedule();
      }, SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN));
    };

    const first = setTimeout(spawn, FIRST_SPAWN_MS);
    schedule();

    return () => {
      clearTimeout(first);
      clearTimeout(timer);
    };
  }, [spawn]);

  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-0 z-30">
      {bubbles.map((bubble) => (
        <button
          key={bubble.id}
          type="button"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const hostRect = hostRef.current?.getBoundingClientRect();
            const px = hostRect ? rect.left - hostRect.left + rect.width / 2 : bubble.x + 22;
            const py = hostRect ? rect.top - hostRect.top + rect.height / 2 : bubble.y + 22;

            const result = claimTapReward('bubble', bubble.amount, { cooldownMs: 500 });
            if (!result.ok) return;
            particles.coinShower(px, py, 14);
            floatNumber(px, py, `+${formatCompact(bubble.amount)} Xu`, '#FACC15');
          }}
          className="mc-bubble pointer-events-auto absolute flex h-11 w-11 flex-col items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-300 to-amber-500 font-black text-white shadow-lg active:scale-90 transition-transform hover:scale-110"
          style={{
            left: bubble.x,
            top: bubble.y,
            animation: 'mc-bubble 5.2s ease-out forwards',
            // drift ngang de khong bia mat chuyen dong
            ['--mc-drift' as string]: `${bubble.drift}px`,
          }}
          aria-label={`Thu hoạch ${bubble.amount} Xu`}
        >
          <CircleDollarSign size={14} className="shrink-0" />
          <span className="text-[9px] leading-none">{formatCompact(bubble.amount)}</span>
        </button>
      ))}

      <style>{`
        @keyframes mc-bubble {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          12%  { transform: translateY(-10px) scale(1); opacity: 1; }
          50%  { transform: translate(calc(var(--mc-drift) * 0.5), -90px) scale(1); opacity: 1; }
          100% { transform: translate(var(--mc-drift), -190px) scale(0.75); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mc-bubble { animation-duration: 0.01ms; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
