'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const PROMOS = [
  {
    id: 'cashback-qr',
    badge: 'HOÀN TIỀN',
    title: 'Quét QR MoMo hoàn 15%',
    desc: 'Mua sắm tại cửa hàng đối tác, hoàn tối đa 50.000đ/ngày.',
    cta: 'Quét ngay',
    color: '#EB2F96',
  },
  {
    id: 'bnpl-deal',
    badge: 'VÍ TRẢ SAU',
    title: 'Mua trước trả sau 0% lãi',
    desc: 'Chia 3 kỳ không lãi suất, không cần thẻ ngân hàng.',
    cta: 'Kích hoạt',
    color: '#7C3AED',
  },
  {
    id: 'transfer-free',
    badge: 'CHUYỂN TIỀN',
    title: 'Chuyển tiền miễn phí 100%',
    desc: 'Chuyển nội mạng MoMo không mất phí, nhanh 24/7.',
    cta: 'Chuyển ngay',
    color: '#0EA5E9',
  },
  {
    id: 'savings',
    badge: 'GỬI TIẾT KIỆM',
    title: 'Lãi suất 5.8%/năm',
    desc: 'Gửi linh hoạt, rút bất kỳ lúc nào, lãi trả hàng ngày.',
    cta: 'Gửi ngay',
    color: '#16A34A',
  },
];

/* CSS keyframes cho mascot walk - không dùng setInterval */
const MASCOT_CSS = `
.momo-walk { animation: momoWalk 0.55s ease-in-out infinite; }
.momo-leg-l { transform-origin: 21px 58px; animation: momoLegL 0.55s linear infinite; }
.momo-leg-r { transform-origin: 35px 58px; animation: momoLegR 0.55s linear infinite; }
.momo-arm-l { transform-origin: 15px 42px; animation: momoArmL 0.55s linear infinite; }
.momo-arm-r { transform-origin: 41px 40px; animation: momoArmR 0.55s linear infinite; }
.momo-idle  { animation: momoIdle 2s ease-in-out infinite; }
@keyframes momoWalk  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-3px)} }
@keyframes momoLegL  { 0%,100%{transform:rotate(-12deg)} 50%{transform:rotate(12deg)} }
@keyframes momoLegR  { 0%,100%{transform:rotate(12deg)}  50%{transform:rotate(-12deg)} }
@keyframes momoArmL  { 0%,100%{transform:rotate(10deg)}  50%{transform:rotate(-10deg)} }
@keyframes momoArmR  { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(-50deg)} }
@keyframes momoIdle  { 0%,100%{transform:rotate(-1.5deg)} 50%{transform:rotate(1.5deg)} }
`;

function MascotSvg({ isWalking, holdingSign }: { isWalking: boolean; holdingSign: boolean }) {
  const bodyClass = isWalking ? 'momo-walk' : 'momo-idle';
  const legClass = isWalking ? '' : 'hidden';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MASCOT_CSS }} />
      <svg width="60" height="80" viewBox="0 0 56 84" style={{ overflow: 'visible' }}>
        {/* Shadow */}
        <ellipse cx="28" cy="82" rx="12" ry="2.5" fill="rgba(62,42,27,0.18)" />

        <g className={bodyClass}>
          {/* === CHÂN === */}
          {isWalking ? (
            <>
              <g className="momo-leg-l">
                <rect x="17" y="58" width="8" height="13" rx="4" fill="#F2C2DB" />
                <ellipse cx="21" cy="72" rx="6" ry="3" fill="#B81F68" />
              </g>
              <g className="momo-leg-r">
                <rect x="31" y="58" width="8" height="13" rx="4" fill="#F2C2DB" />
                <ellipse cx="35" cy="72" rx="6" ry="3" fill="#B81F68" />
              </g>
            </>
          ) : (
            <>
              <rect x="17" y="58" width="8" height="13" rx="4" fill="#F2C2DB" />
              <ellipse cx="21" cy="72" rx="6" ry="3" fill="#B81F68" />
              <rect x="31" y="58" width="8" height="13" rx="4" fill="#F2C2DB" />
              <ellipse cx="35" cy="72" rx="6" ry="3" fill="#B81F68" />
            </>
          )}

          {/* === THÂN === */}
          {/* Tay trái */}
          {holdingSign ? (
            <g style={{ transformOrigin: '15px 42px', transform: 'rotate(-35deg)' }}>
              <rect x="8" y="36" width="7" height="16" rx="3.5" fill="#F2C2DB" />
              <rect x="-15" y="17" width="32" height="20" rx="5" fill="#EB2F96" />
              <rect x="-13" y="19" width="28" height="16" rx="3" fill="#FFFDF7" />
              <text x="1" y="26" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#EB2F96" fontFamily="sans-serif">KHUYẾN</text>
              <text x="1" y="33" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#EB2F96" fontFamily="sans-serif">MÃI HOT</text>
            </g>
          ) : (
            <g className={isWalking ? 'momo-arm-l' : ''}>
              <rect x="8" y="40" width="7" height="14" rx="3.5" fill="#F2C2DB" />
            </g>
          )}

          {/* Body */}
          <rect x="15" y="38" width="26" height="22" rx="9" fill="#FDE8F3" />
          <path d="M15.4 52.5 Q28 57.5 40.6 52.5 L40.2 55.4 Q28 60 15.8 55.4 Z" fill="#EDC0D8" />
          {/* Lô gô m */}
          <circle cx="28" cy="49" r="6" fill="#EB2F96" opacity="0.15" />
          <text x="28" y="52.5" textAnchor="middle" fontSize="9" fontWeight="900" fill="#C0226E" fontFamily="sans-serif">m</text>

          {/* Tay phải - vẫy */}
          <g className={isWalking ? 'momo-arm-r' : ''}>
            <rect x="41" y="34" width="7" height="14" rx="3.5" fill="#F2C2DB" />
            <ellipse cx="44.5" cy="32" rx="5" ry="4" fill="#F2C2DB" />
            {/* Ngón tay */}
            <ellipse cx="42" cy="29" rx="2" ry="1.5" fill="#F2C2DB" />
            <ellipse cx="45.5" cy="28.5" rx="2" ry="1.5" fill="#F2C2DB" />
            <ellipse cx="49" cy="30" rx="2" ry="1.5" fill="#F2C2DB" />
          </g>

          {/* === ĐẦU === */}
          {/* Tai bên */}
          <ellipse cx="10" cy="22" rx="5.5" ry="10" fill="#EB2F96" />
          <ellipse cx="46" cy="22" rx="5.5" ry="10" fill="#EB2F96" />
          {/* Tai trong */}
          <ellipse cx="10" cy="22" rx="2.5" ry="6" fill="#F472B6" />
          <ellipse cx="46" cy="22" rx="2.5" ry="6" fill="#F472B6" />
          {/* Sừng */}
          <ellipse cx="18" cy="3.5" rx="3.5" ry="5.5" fill="#EB2F96" style={{ transform: 'rotate(-15deg)', transformOrigin: '18px 3.5px' }} />
          <ellipse cx="38" cy="3.5" rx="3.5" ry="5.5" fill="#EB2F96" style={{ transform: 'rotate(15deg)', transformOrigin: '38px 3.5px' }} />
          {/* Đầu chính */}
          <ellipse cx="28" cy="17" rx="18" ry="17" fill="#EB2F96" />
          {/* Highlight đầu */}
          <path d="M14.6 12.4 Q20 4.6 29.4 3.4 L29.8 6.2 Q21.6 7.6 17.4 13.8 Z" fill="#F265AC" />
          {/* Mặt */}
          <ellipse cx="28" cy="22" rx="13.5" ry="14" fill="#FFF0F5" />

          {/* Lông mày */}
          <path d="M18.2 15.1 Q21.5 12.1 24.8 15.1 L24.1 16.4 Q21.5 13.8 18.9 16.4 Z" fill="#C0226E" />
          <path d="M31.2 15.1 Q34.5 12.1 37.8 15.1 L37.1 16.4 Q34.5 13.8 31.9 16.4 Z" fill="#C0226E" />

          {/* Mắt */}
          <circle cx="21.5" cy="21" r="5" fill="white" />
          <circle cx="34.5" cy="21" r="5" fill="white" />
          <circle cx="21.5" cy="22" r="3.2" fill="#C0226E" />
          <circle cx="34.5" cy="22" r="3.2" fill="#C0226E" />
          {/* Pupil nhỏ */}
          <circle cx="22.5" cy="21" r="1.2" fill="white" />
          <circle cx="35.5" cy="21" r="1.2" fill="white" />

          {/* Má hồng */}
          <ellipse cx="14" cy="26.5" rx="4" ry="2.5" fill="#FFA8CC" />
          <ellipse cx="42" cy="26.5" rx="4" ry="2.5" fill="#FFA8CC" />

          {/* Miệng cười */}
          <path d="M21 29 Q28 35.5 35 29" fill="#EB2F96" />
          <path d="M22 29 Q28 34 34 29" fill="white" />
        </g>
      </svg>
    </>
  );
}

function PromoModal({ promo, onClose }: { promo: typeof PROMOS[0]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xs overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div
          className="relative px-5 py-5 text-white text-center"
          style={{ background: `linear-gradient(135deg, ${promo.color}, ${promo.color}CC)` }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/15"
          >
            <X size={14} className="shrink-0" />
          </button>
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center">
            <MascotSvg isWalking={false} holdingSign={false} />
          </div>
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider mb-1"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            {promo.badge}
          </span>
          <p className="text-sm font-black leading-snug">{promo.title}</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">{promo.desc}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-2xl py-2.5 text-sm font-black text-white shadow-lg transition-transform active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${promo.color}, ${promo.color}BB)` }}
          >
            {promo.cta} trên MoMo
          </button>
          <p className="mt-2 text-[10px] text-gray-400">Áp dụng trong game · T&C áp dụng</p>
        </div>
      </div>
    </div>
  );
}

export default function MoMoMascot({
  onToast,
  streetWidth = 2400,
}: {
  onToast?: (msg: string) => void;
  /** Be rong that cua pho: mascot phai quay dau truoc khi ra khoi via he. */
  streetWidth?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boundRef = useRef(Math.max(420, streetWidth - 180));
  boundRef.current = Math.max(420, streetWidth - 180);
  // Animation state in refs - không trigger re-render
  const simRef = useRef({
    x: Math.min(900, Math.max(420, streetWidth - 180)),
    dir: 1 as 1 | -1,
    behavior: 'WALKING' as 'WALKING' | 'POSING',
    behaviorTimer: 0,
    jumpOffset: 0,
    lastTs: 0,
  });
  const rafRef = useRef<number>(0);
  const LANE_Y = 36;
  const SPEED = 1.4; // px/frame at 60fps

  // React state chỉ cho UI changes (bubble text, promo modal)
  const [promoIdx, setPromoIdx] = useState(0);
  const [showPromo, setShowPromo] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>('Chào bà con! Có deal hấp dẫn nè!');
  const [isWalking, setIsWalking] = useState(true);
  const [holdingSign, setHoldingSign] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);

  useEffect(() => {
    const sim = simRef.current;

    function tick(ts: number) {
      const dt = Math.min(ts - (sim.lastTs || ts), 50);
      sim.lastTs = ts;

      // Behavior timer
      sim.behaviorTimer += dt;
      if (sim.behaviorTimer > 5500) {
        sim.behaviorTimer = 0;
        const next = sim.behavior === 'WALKING' ? 'POSING' : 'WALKING';
        sim.behavior = next;
        if (next === 'POSING') {
          setPromoIdx((idx) => {
            const ni = (idx + 1) % PROMOS.length;
            setBubbleText(`Khuyến mãi: ${PROMOS[ni].title}`);
            setHoldingSign(true);
            setIsWalking(false);
            return ni;
          });
        } else {
          setBubbleText('Chào bà con! Tôi là MoMo!');
          setHoldingSign(false);
          setIsWalking(true);
        }
      }

      // Jump decay
      sim.jumpOffset = Math.max(0, sim.jumpOffset - dt * 0.18);

      // Position
      if (sim.behavior === 'WALKING') {
        sim.x += sim.dir * SPEED * (dt / 16.67);
        if (sim.x > boundRef.current) { sim.x = boundRef.current; if (sim.dir === 1) { sim.dir = -1; setDir(-1); } }
        if (sim.x < 220)  { sim.x = 220;  if (sim.dir === -1) { sim.dir = 1; setDir(1); } }
      }

      // DOM update (no React re-render)
      if (containerRef.current) {
        const y = LANE_Y + sim.jumpOffset;
        containerRef.current.style.transform = `translate3d(${Math.round(sim.x)}px,${-Math.round(y)}px,0)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = useCallback(() => {
    simRef.current.jumpOffset = 22;
    setShowPromo(true);
    setPromoIdx((idx) => {
      onToast?.(`MoMo Mascot: "${PROMOS[idx].title}"`);
      return idx;
    });
  }, [onToast]);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
        <div
          ref={containerRef}
          className="absolute bottom-2 left-0 flex flex-col items-center"
          style={{ willChange: 'transform' }}
        >
          {bubbleText && (
            <div
              className="mb-1 w-max max-w-[240px] whitespace-normal break-words text-center leading-snug rounded-2xl border-2 px-2.5 py-1 text-[10px] font-black shadow-md"
              style={{ borderColor: '#EB2F96', background: '#FFF0F7', color: '#C0226E' }}
            >
              {bubbleText}
            </div>
          )}

          {holdingSign && (
            <div
              className="absolute -inset-3 -z-10 rounded-full opacity-30 animate-ping"
              style={{ background: 'radial-gradient(circle, #EB2F96 0%, transparent 70%)' }}
            />
          )}

          <button
            type="button"
            onClick={handleClick}
            title="Bấm để xem khuyến mãi từ MoMo Mascot!"
            className="pointer-events-auto group cursor-pointer focus:outline-none"
            style={{ transform: `scaleX(${dir})` }}
          >
            <MascotSvg isWalking={isWalking} holdingSign={holdingSign} />
            <span className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#EB2F96] px-2 py-0.5 text-[8px] font-black text-white opacity-0 transition-opacity group-hover:opacity-100">
              MoMo Mascot ✦
            </span>
          </button>
        </div>
      </div>

      {showPromo && (
        <PromoModal promo={PROMOS[promoIdx]} onClose={() => setShowPromo(false)} />
      )}
    </>
  );
}
