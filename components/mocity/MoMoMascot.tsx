'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

// --- Danh sách khuyến mãi MoMo luân phiên ---
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
  {
    id: 'insurance',
    badge: 'BẢO HIỂM',
    title: 'BH xe máy từ 79.000đ/năm',
    desc: 'Mua bảo hiểm bắt buộc xe máy trực tiếp trên MoMo.',
    cta: 'Xem gói',
    color: '#EA580C',
  },
];

// --- SVG Mascot MoMo Chibi ---
function MascotSvg({
  walkCycle,
  isWalking,
  jumpOffset,
  holdingSign,
}: {
  walkCycle: number;
  isWalking: boolean;
  jumpOffset: number;
  holdingSign: boolean;
}) {
  const bodyBob = isWalking ? Math.abs(Math.sin(walkCycle)) * 3 : Math.sin(walkCycle) * 1;
  const legL = isWalking ? Math.sin(walkCycle) * 10 : 0;
  const legR = isWalking ? -Math.sin(walkCycle) * 10 : 0;
  const armSwing = isWalking ? Math.sin(walkCycle) * 12 : 0;

  return (
    <svg
      width="56"
      height="84"
      viewBox="0 0 56 84"
      style={{ transform: `translateY(${-bodyBob - jumpOffset}px)`, overflow: 'visible' }}
    >
      {/* Shadow */}
      <ellipse cx="28" cy="82" rx="13" ry="3" fill="rgba(62,42,27,0.15)" />

      {/* === CHÂN === */}
      {/* Chân trái */}
      <g transform={`rotate(${legL}, 21, 58)`}>
        <rect x="17" y="58" width="8" height="14" rx="4" fill="#FDE8F3" stroke="#C0226E" strokeWidth="1.2" />
        <rect x="15" y="70" width="12" height="6" rx="3" fill="#FDE8F3" stroke="#C0226E" strokeWidth="1.2" />
      </g>
      {/* Chân phải */}
      <g transform={`rotate(${legR}, 35, 58)`}>
        <rect x="31" y="58" width="8" height="14" rx="4" fill="#FDE8F3" stroke="#C0226E" strokeWidth="1.2" />
        <rect x="29" y="70" width="12" height="6" rx="3" fill="#FDE8F3" stroke="#C0226E" strokeWidth="1.2" />
      </g>

      {/* === THÂN === bodysuit trắng hồng nhạt */}
      <rect x="15" y="38" width="26" height="22" rx="8" fill="#FDE8F3" stroke="#C0226E" strokeWidth="1.4" />
      {/* Logo "m" hình vuông bo góc */}
      <rect x="21" y="44" width="14" height="10" rx="3" fill="#EB2F96" opacity="0.18" />
      <text x="28" y="52.5" textAnchor="middle" fontSize="9" fontWeight="900" fill="#C0226E" fontFamily="sans-serif">m</text>

      {/* === TAY TRÁI (giữ biển / swing) === */}
      {holdingSign ? (
        <g transform={`rotate(-35, 15, 42)`}>
          <rect x="8" y="36" width="7" height="16" rx="3.5" fill="#FDE8F3" stroke="#C0226E" strokeWidth="1.2" />
          <rect x="-14" y="18" width="30" height="18" rx="4" fill="#FFFDF7" stroke="#EB2F96" strokeWidth="1.4" />
          <text x="1" y="26" textAnchor="middle" fontSize="5" fontWeight="900" fill="#EB2F96" fontFamily="sans-serif">KHUYẾN</text>
          <text x="1" y="32" textAnchor="middle" fontSize="5" fontWeight="900" fill="#EB2F96" fontFamily="sans-serif">MÃI HOT</text>
        </g>
      ) : (
        /* Tay trái swing xuống */
        <rect
          x="8" y="40" width="7" height="14" rx="3.5" fill="#FDE8F3" stroke="#C0226E" strokeWidth="1.2"
          transform={`rotate(${-armSwing - 15}, 11, 40)`}
        />
      )}

      {/* === TAY PHẢI (vẫy tay) === */}
      <g transform={`rotate(${armSwing + 35}, 45, 40)`}>
        <rect x="41" y="34" width="7" height="14" rx="3.5" fill="#FDE8F3" stroke="#C0226E" strokeWidth="1.2" />
        {/* Bàn tay vẫy */}
        <ellipse cx="44.5" cy="33" rx="5" ry="4" fill="#FDE8F3" stroke="#C0226E" strokeWidth="1.2" />
      </g>

      {/* === ĐẦU === */}
      {/* Mũ/tóc hồng phủ phần trên - đặt trước mặt */}
      <ellipse cx="28" cy="16" rx="18" ry="17" fill="#EB2F96" />
      {/* Hai bên mũ rủ xuống che tai */}
      <ellipse cx="11" cy="22" rx="6" ry="11" fill="#EB2F96" />
      <ellipse cx="45" cy="22" rx="6" ry="11" fill="#EB2F96" />
      {/* Sừng nhỏ bên trái */}
      <ellipse cx="18" cy="3" rx="3.5" ry="5" fill="#EB2F96" stroke="#C0226E" strokeWidth="1" transform="rotate(-15, 18, 3)" />
      {/* Sừng nhỏ bên phải */}
      <ellipse cx="38" cy="3" rx="3.5" ry="5" fill="#EB2F96" stroke="#C0226E" strokeWidth="1" transform="rotate(15, 38, 3)" />

      {/* Mặt trắng ngà */}
      <ellipse cx="28" cy="22" rx="14" ry="15" fill="#FFF0F5" />

      {/* Lông mày nâu đậm */}
      <path d="M18 14 Q21 12 24 14" stroke="#C0226E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M32 14 Q35 12 38 14" stroke="#C0226E" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Mắt tròn to - tròng ngoài trắng */}
      <circle cx="21.5" cy="21" r="5" fill="white" />
      <circle cx="34.5" cy="21" r="5" fill="white" />
      {/* Tròng mắt hồng đậm */}
      <circle cx="21.5" cy="22" r="3.2" fill="#C0226E" />
      <circle cx="34.5" cy="22" r="3.2" fill="#C0226E" />
      {/* Điểm sáng mắt */}
      <circle cx="23" cy="20.5" r="1.2" fill="white" />
      <circle cx="36" cy="20.5" r="1.2" fill="white" />

      {/* Má hồng */}
      <ellipse cx="14" cy="26" rx="4.5" ry="2.5" fill="#FFB7D5" opacity="0.7" />
      <ellipse cx="42" cy="26" rx="4.5" ry="2.5" fill="#FFB7D5" opacity="0.7" />

      {/* Miệng cười răng trắng */}
      <path d="M21 29 Q28 35 35 29" fill="#C0226E" />
      <path d="M22 29 Q28 33.5 34 29" fill="white" />
    </svg>
  );
}

// --- Promotion Modal ---
function PromoModal({
  promo,
  onClose,
}: {
  promo: typeof PROMOS[0];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xs overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header gradient */}
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

          {/* Mascot nhỏ trong modal */}
          <div className="mx-auto mb-1 flex h-16 w-16 items-center justify-center">
            <svg width="48" height="60" viewBox="0 0 56 84">
              <ellipse cx="28" cy="16" rx="18" ry="17" fill="#EB2F96" />
              <ellipse cx="11" cy="22" rx="6" ry="11" fill="#EB2F96" />
              <ellipse cx="45" cy="22" rx="6" ry="11" fill="#EB2F96" />
              <ellipse cx="18" cy="3" rx="3.5" ry="5" fill="#EB2F96" stroke="#C0226E" strokeWidth="1" transform="rotate(-15, 18, 3)" />
              <ellipse cx="38" cy="3" rx="3.5" ry="5" fill="#EB2F96" stroke="#C0226E" strokeWidth="1" transform="rotate(15, 38, 3)" />
              <ellipse cx="28" cy="22" rx="14" ry="15" fill="#FFF0F5" />
              <circle cx="21.5" cy="21" r="5" fill="white" />
              <circle cx="34.5" cy="21" r="5" fill="white" />
              <circle cx="21.5" cy="22" r="3.2" fill="#C0226E" />
              <circle cx="34.5" cy="22" r="3.2" fill="#C0226E" />
              <circle cx="23" cy="20.5" r="1.2" fill="white" />
              <circle cx="36" cy="20.5" r="1.2" fill="white" />
              <ellipse cx="14" cy="26" rx="4.5" ry="2.5" fill="#FFB7D5" opacity="0.7" />
              <ellipse cx="42" cy="26" rx="4.5" ry="2.5" fill="#FFB7D5" opacity="0.7" />
              <path d="M21 29 Q28 35 35 29" fill="#C0226E" />
              <path d="M22 29 Q28 33.5 34 29" fill="white" />
            </svg>
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

// --- Main MoMo Mascot Component ---
export default function MoMoMascot({
  onToast,
}: {
  onToast?: (msg: string) => void;
}) {
  const [x, setX] = useState(900);
  const [dir, setDir] = useState<1 | -1>(1);
  const [walkCycle, setWalkCycle] = useState(0);
  const [behavior, setBehavior] = useState<'WALKING' | 'POSING'>('WALKING');
  const [behaviorTimer, setBehaviorTimer] = useState(120);
  const [jumpOffset, setJumpOffset] = useState(0);
  const [promoIdx, setPromoIdx] = useState(0);
  const [showPromo, setShowPromo] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>('Chào bà con! Có deal hấp dẫn nè!');
  const rafRef = useRef<number>(0);

  const SPEED = 0.95;
  const laneY = 36; // lane cao hơn để nổi bật hơn dân thường

  useEffect(() => {
    const timer = setInterval(() => {
      setWalkCycle((wc) => wc + 0.55);
      setJumpOffset((j) => Math.max(0, j - 6));
      setX((px) => {
        if (behavior !== 'WALKING') return px;
        const next = px + dir * 18;
        if (next > 1860) return 1860;
        if (next < 220) return 220;
        return next;
      });
    }, 120);
    return () => clearInterval(timer);
  }, [behavior, dir]);

  useEffect(() => {
    if (x >= 1860 && dir === 1) setDir(-1);
    else if (x <= 220 && dir === -1) setDir(1);
  }, [x, dir]);

  useEffect(() => {
    const behaviorInterval = setInterval(() => {
      setBehavior((prev) => {
        const next = prev === 'WALKING' ? 'POSING' : 'WALKING';
        if (next === 'POSING') {
          setPromoIdx((idx) => {
            const nextIdx = (idx + 1) % PROMOS.length;
            setBubbleText(`Khuyến mãi: ${PROMOS[nextIdx].title}`);
            return nextIdx;
          });
        } else {
          setBubbleText('Chào bà con! Tôi là MoMo!');
        }
        return next;
      });
    }, 5500);
    return () => clearInterval(behaviorInterval);
  }, []);

  const handleClick = useCallback(() => {
    setJumpOffset(22);
    setBubbleText(PROMOS[promoIdx].title);
    setShowPromo(true);
    onToast?.(`MoMo Mascot: "${PROMOS[promoIdx].title}"`);
  }, [promoIdx, onToast]);

  const isWalking = behavior === 'WALKING';

  return (
    <>
      {/* Mascot trên vỉa hè */}
      <div
        className="pointer-events-none absolute inset-0 z-30 overflow-visible"
      >
        <div
          style={{
            transform: `translate3d(${Math.round(x)}px, ${-Math.round(laneY + (isWalking ? Math.abs(Math.sin(walkCycle)) * 3 : 1))}px, 0)`,
            zIndex: 55,
          }}
          className="absolute bottom-2 left-0 flex flex-col items-center"
        >
          {/* Speech bubble đặc biệt - màu hồng MoMo */}
          {bubbleText && (
            <div
              className="mb-1 max-w-[200px] truncate rounded-2xl border-2 px-2.5 py-1 text-[10px] font-black shadow-md"
              style={{
                borderColor: '#EB2F96',
                background: '#FFF0F7',
                color: '#C0226E',
              }}
            >
              {bubbleText}
            </div>
          )}

          {/* Hào quang rung - chỉ khi POSING */}
          {behavior === 'POSING' && (
            <div
              className="absolute -inset-3 -z-10 rounded-full opacity-40 animate-ping"
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
            <MascotSvg
              walkCycle={walkCycle}
              isWalking={isWalking}
              jumpOffset={jumpOffset}
              holdingSign={behavior === 'POSING'}
            />
            <span className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#EB2F96] px-2 py-0.5 text-[8px] font-black text-white opacity-0 transition-opacity group-hover:opacity-100">
              MoMo Mascot ✦
            </span>
          </button>
        </div>
      </div>

      {/* Promotion Modal */}
      {showPromo && (
        <PromoModal
          promo={PROMOS[promoIdx]}
          onClose={() => setShowPromo(false)}
        />
      )}
    </>
  );
}
