'use client';

import { useRef, useState } from 'react';
import { Share2, Download, X, Building2 } from 'lucide-react';

interface ShareCityCardProps {
  mayorName: string;
  cityName: string;
  /**
   * DOANH THU van hai cua thanh pho (san luong + phi ha tang + lai).
   * KHONG dung `totalCoinsEarned` - con do gop ca thuong nhiem vu va thuong
   * bac thanh pho (2,9 trieu Xu) vao chung, va gan nhan "doanh thu" cho tien
   * thuong. Về kế toán đó là von gop von chu so huu, khong phai doanh thu.
   */
  totalRevenue: number;
  /** Tổng đã vào ngân khố: doanh thu + thưởng + tiền chạm. */
  totalCoinsEarned: number;
  coinsPerSec: number;
  buildingCount: number;
  mayorLevel: number;
  onClose: () => void;
}

function formatVND(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} triệu`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('vi-VN');
}

/** Card được render vào DOM ẩn rồi chụp bằng html2canvas */
function CardTemplate({
  mayorName,
  cityName,
  totalRevenue,
  totalCoinsEarned,
  coinsPerSec,
  buildingCount,
  mayorLevel,
}: Omit<ShareCityCardProps, 'onClose'>) {
  return (
    <div
      style={{
        width: 480,
        background: 'linear-gradient(145deg, #0B0A12 0%, #1A0A2E 50%, #0D0520 100%)',
        borderRadius: 24,
        padding: 32,
        fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow background */}
      <div style={{
        position: 'absolute', top: -60, left: -60, width: 220, height: 220,
        borderRadius: '50%', background: 'rgba(216,45,139,0.18)', filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, right: -40, width: 180, height: 180,
        borderRadius: '50%', background: 'rgba(124,58,237,0.15)', filter: 'blur(50px)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(216,45,139,0.2)',
          border: '1.5px solid rgba(216,45,139,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}><Building2 size={24} className="shrink-0 text-[#EB2F96]" /></div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>{cityName}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            Thị Trưởng {mayorName} · Cấp {mayorLevel}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
          MoCity
        </div>
      </div>

      {/* Main stat */}
      <div style={{
        background: 'rgba(216,45,139,0.08)',
        border: '1px solid rgba(216,45,139,0.25)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#EB2F96', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
          Doanh Thu Vận Hành
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#EB2F96', letterSpacing: -1, lineHeight: 1 }}>
          {formatVND(totalRevenue)}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>XU</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6, lineHeight: 1.5 }}>
          Chưa gồm thưởng nhiệm vụ & rank thành phố
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Thu / giây', value: `${formatVND(coinsPerSec)} xu` },
          { label: 'Tổng đã vào ngân khố', value: `${formatVND(totalCoinsEarned)} xu` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '12px 16px',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 20, paddingTop: 16,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
          momo.vn/mocity
        </div>
        <div style={{ fontSize: 11, color: 'rgba(235,47,150,0.6)', fontWeight: 800 }}>
          #MoCity #PhốVỉaHè
        </div>
      </div>
    </div>
  );
}

export default function ShareCityCard(props: ShareCityCardProps) {
  const { onClose } = props;
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const capture = async (action: 'share' | 'download') => {
    if (!cardRef.current || loading) return;
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      if (action === 'download') {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `mocity-${props.cityName.replace(/\s/g, '-')}.png`;
        a.click();
      } else {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'mocity.png', { type: 'image/png' });
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${props.cityName} - MoCity`,
              text: `Phố của tôi đã thu ${formatVND(props.totalCoinsEarned)} Xu! Chơi MoCity tại momo.vn`,
              files: [file],
            });
          } else {
            // Fallback: download
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `mocity-${props.cityName.replace(/\s/g, '-')}.png`;
            a.click();
          }
        }, 'image/png');
      }
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Card preview */}
        <div ref={cardRef} style={{ borderRadius: 24, overflow: 'hidden' }}>
          <CardTemplate {...props} />
        </div>

        {/* Actions */}
        <div className="flex w-full max-w-[480px] gap-3">
          <button
            type="button"
            onClick={() => capture('share')}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #C0226E, #EB2F96)' }}
          >
            <Share2 size={16} className="shrink-0" />
            {done ? 'Đã chia sẻ!' : loading ? 'Đang xử lý...' : 'Chia sẻ phố của tôi'}
          </button>
          <button
            type="button"
            onClick={() => capture('download')}
            disabled={loading}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/15 disabled:opacity-60"
          >
            <Download size={18} className="shrink-0" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/15"
          >
            <X size={18} className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
