'use client';

import React from 'react';
import {
  Coffee,
  Clapperboard,
  Sparkles,
  Zap,
  Store,
  BookOpen,
  Wrench,
  Star,
  ShieldCheck,
  Tv,
} from 'lucide-react';
import type { TimeOfDay } from '@/lib/mocity/types';
import { formatRate } from '@/lib/mocity/format';

export type ShopType =
  | 'TIRE_SHOP'
  | 'GROCERY'
  | 'STATIONERY'
  | 'RICE_SHOP'
  | 'CINEMA'
  | 'FINTECH'
  | 'CAFE';

export interface ShophouseFacadeProps {
  shopType: ShopType;
  houseNumber: number;
  shopTitle: string;
  isBuilt: boolean;
  unlocked: boolean;
  level?: number;
  starRating?: number;
  yieldPerSec?: number;
  timeOfDay?: TimeOfDay;
  wallBg: string;
  wallHatch: string;
  signBg: string;
  /**
   * Câu đang nói của người trong nhà. `null` là im lặng.
   *
   * Điều phối ở cấp dãy phố chứ không để mỗi căn tự hẹn giờ: 10 căn cùng
   * nói một lúc thì không ai đọc kịp câu nào.
   */
  windowSpeech?: string | null;
  onOpenBuild?: () => void;
}

/* Bảng màu nhà ống theo kiểu minh họa phố Việt Nam */
const PALETTE: Record<ShopType, { wall: string; wall2: string; stripe: string; signBg: string; roofBg: string }> = {
  TIRE_SHOP:  { wall: '#F2EAD3', wall2: '#EDE0C0', stripe: '#C9A96A', signBg: '#8B6318', roofBg: '#E8D9B8' },
  GROCERY:    { wall: '#EEC830', wall2: '#E0B818', stripe: '#8B6200', signBg: '#5C3D08', roofBg: '#D4A810' },
  CAFE:       { wall: '#FAF3E4', wall2: '#F4E8D0', stripe: '#A07840', signBg: '#6B3C18', roofBg: '#EDD9B8' },
  RICE_SHOP:  { wall: '#FDEBD0', wall2: '#F5D8B4', stripe: '#9A6030', signBg: '#6B3010', roofBg: '#F0C898' },
  CINEMA:     { wall: '#F5DCF0', wall2: '#ECC8E4', stripe: '#7A2868', signBg: '#5A1048', roofBg: '#E0B0D4' },
  FINTECH:    { wall: '#D8EAF8', wall2: '#C0D8F0', stripe: '#1848A8', signBg: '#0C2878', roofBg: '#B8CFF0' },
  STATIONERY: { wall: '#ECF1F8', wall2: '#DDE7F2', stripe: '#2C60A0', signBg: '#183C80', roofBg: '#C8D8EC' },
};

/** Dam/nhat mot mau hex theo he so - tao lop giay phia sau thay cho vien. */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.min(255, Math.round(v * k));
  return `#${((1 << 24) | (c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1)}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * DÁNG NHÀ - MỖI CĂN MỘT CHIỀU CAO
 *
 * Trước đây mọi căn đều 1 trệt 2 lầu, nóc sân thượng phẳng, cao đúng 386px:
 * cả dãy phố là một đường kẻ ngang. Phố thật thì nhà cao thấp so le - căn
 * 1 lầu mái ngói nằm cạnh căn 2 lầu có mặt dựng vòm.
 *
 * Dáng chọn theo SỐ NHÀ chứ không ngẫu nhiên, để mỗi ô đất luôn ra cùng một
 * dáng qua mọi lần render và mọi lần mở game. Dãy 7 dáng xếp sao cho hai căn
 * kề nhau luôn chênh rõ. Số nhà = cột*2 + hàng*20 + 2, nên chỉ số dáng là
 * cột + hàng*10; 10 chia 7 dư 3 nên mỗi hàng phố bắt đầu ở một dáng khác.
 *
 * Giới hạn: căn cao nhất chỉ nhỉnh hơn bản cũ một chút. Phía trên nóc chỉ còn
 * khoảng 64px trời trước khi bị cắt, nên khác biệt đến từ việc HẠ THẤP các
 * căn 1 lầu chứ không đẩy căn nào cao vọt lên.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type KieuMai = 'PHANG' | 'NGOI' | 'CAO';

export interface DangNha {
  /** Số lầu phía trên tầng trệt. */
  soLau: 1 | 2;
  /** PHANG: sân thượng có bồn nước. NGOI: mái ngói đỏ. CAO: mặt dựng vòm phố cũ. */
  mai: KieuMai;
}

const DANG_NHA: DangNha[] = [
  { soLau: 2, mai: 'PHANG' },
  { soLau: 1, mai: 'NGOI' },
  { soLau: 2, mai: 'CAO' },
  { soLau: 1, mai: 'PHANG' },
  { soLau: 2, mai: 'NGOI' },
  { soLau: 1, mai: 'CAO' },
  { soLau: 1, mai: 'NGOI' },
];

export function dangNhaFor(houseNumber: number): DangNha {
  const i = Math.max(0, Math.floor(houseNumber / 2) - 1);
  return DANG_NHA[i % DANG_NHA.length];
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CƯ DÂN TRONG NHÀ - NGƯỜI Ở CỬA SỔ
 *
 * Trước đây cửa sổ chỉ là mảng kính phẳng, nên nhà xây xong trông như mô
 * hình rỗng. Người chơi nhìn thấy cư dân đi dưới vỉa hè nhưng không thấy ai
 * SỐNG trong những căn mình vừa dựng.
 *
 * Chỉ nhà ĐÃ XÂY mới có người. Ai đứng ở cửa sổ nào là cố định theo số nhà -
 * cùng một căn thì luôn cùng một người, qua mọi lần render và mọi lần mở
 * game. Ngẫu nhiên mỗi frame sẽ làm người trong nhà nhấp nháy đổi mặt.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Thoại của người TRONG NHÀ, khác hẳn thoại ngoài phố.
 *
 * Người đi bộ bình luận chuyện buôn bán và khuyến mãi. Người ở cửa sổ thì
 * nói chuyện trong nhà: cơm nước, phơi đồ, tiếng ồn dưới phố, hóa đơn. Dùng
 * chung một bộ câu cho cả hai thì bong bóng trên cửa sổ đọc như quảng cáo.
 */
export const THOAI_CUA_SO = [
  'Cơm chín rồi, xuống ăn đi mấy đứa ơi!',
  'Phơi đồ xong rồi mà trời lại kéo mây, sốt ruột ghê.',
  'Dưới phố hôm nay đông quá, bán được hàng là mừng rồi.',
  'Hoá đơn điện tháng này đóng qua app rồi nghen ba.',
  'Ai hát karaoke sớm vậy trời, mới 7 giờ sáng mà.',
  'Thị Trưởng ơi, hẻm mình xin thêm cái đèn đường nha!',
  'Nay nhà làm bún riêu, ai rảnh qua ăn nghen.',
  'Mưa là y như rằng dột chỗ cũ, sửa hoài không hết.',
  'Con học bài chưa đó? Đừng có coi phim nữa nha!',
  'Nghe nói sắp mở thêm tiệm mới, phố mình vui rồi.',
  'Tiền chợ sáng nay quét mã cái rẹt, khỏi thối lẻ.',
  'Phố xá sạch đẹp vầy ở mới thấy đáng tiền thuê.',
];

/** Tông da và áo, lấy từ dải màu thời kỳ cho khớp với cư dân chibi ngoài phố. */
const DA_CU_DAN = ['#EFC49C', '#E0A87E', '#C98F68'];
const AO_CU_DAN = ['#8C3B2E', '#4A6B5A', '#3E4C63', '#A8701F', '#73164A', '#6E8C72'];

/**
 * Một người ngồi trong khung cửa sổ, nhìn ra phố.
 *
 * Vẽ bằng khối bo tròn giống cư dân chibi: đầu to, vai nhỏ, mặt tối giản.
 * Không có chân vì bị bệ cửa sổ che - đó cũng là lý do cỡ này đọc được ở
 * khung kính chỉ 50x40px.
 */
function NguoiCuaSo({ seed, isNight }: { seed: number; isNight: boolean }) {
  const da = DA_CU_DAN[seed % DA_CU_DAN.length];
  const ao = AO_CU_DAN[(seed * 3) % AO_CU_DAN.length];
  const toc = seed % 3 === 0 ? '#2B2420' : seed % 3 === 1 ? '#4A3B30' : '#6B4A2F';
  const muc = '#2B2420';
  /* Ban đêm người trong nhà thành bóng đổ ngược sáng trên nền đèn vàng. */
  const mo = isNight ? 0.55 : 1;

  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center" style={{ opacity: mo }}>
      <svg width="30" height="30" viewBox="0 0 30 30" className="overflow-visible">
        {/* Vai */}
        <path d="M5 30 Q5 21 15 21 Q25 21 25 30 Z" fill={ao} />
        {/* Đầu */}
        <circle cx="15" cy="13" r="8" fill={da} />
        {/* Tóc phủ đỉnh đầu */}
        <path d="M7 12 Q7 4 15 4 Q23 4 23 12 Q19 8 15 8 Q11 8 7 12 Z" fill={toc} />
        {/* Mắt và miệng, tối giản cho cỡ nhỏ */}
        <circle cx="12" cy="13" r="1.3" fill={muc} />
        <circle cx="18" cy="13" r="1.3" fill={muc} />
        <path d="M13 17 Q15 19 17 17" fill="none" stroke={muc} strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/**
 * Phần nhô lên TRÊN NÓC: bồn nước inox hoặc mặt dựng vòm.
 *
 * Vẽ riêng, đặt PHÍA TRÊN khối nhà chứ không nằm trong nó. Khối nhà có viền
 * hình chữ nhật bao quanh; thứ gì hẹp hơn bề ngang mà nằm bên trong thì hai
 * bên nó sẽ lộ màu tường thay vì màu trời, nhìn như một cái hộp.
 */
export function ShophouseRoofCap({
  houseNumber,
  shopType,
  timeOfDay = 'DAY',
}: {
  houseNumber: number;
  shopType: ShopType;
  timeOfDay?: TimeOfDay;
}) {
  const { mai } = dangNhaFor(houseNumber);
  if (mai === 'NGOI') return null;

  const isNight = timeOfDay === 'NIGHT';

  if (mai === 'PHANG') {
    // Bồn nước inox trên chân sắt - thứ có mặt trên nóc gần như mọi nhà phố.
    const inox = isNight ? '#6E7378' : '#B8BCC0';
    return (
      <div aria-hidden className="pointer-events-none relative h-[24px] w-[228px]">
        <div className="absolute bottom-0 right-6 flex flex-col items-center">
          <div className="relative" style={{ width: 32, height: 16, backgroundColor: inox, borderRadius: '7px 7px 2px 2px' }}>
            <div className="absolute inset-x-0 top-[5px] h-[2px]" style={{ backgroundColor: shade('#B8BCC0', 0.78) }} />
            <div className="absolute inset-x-0 top-[10px] h-[2px]" style={{ backgroundColor: shade('#B8BCC0', 0.78) }} />
          </div>
          <div className="flex w-[26px] justify-between">
            <span className="h-[8px] w-[3px]" style={{ backgroundColor: '#5A5048' }} />
            <span className="h-[8px] w-[3px]" style={{ backgroundColor: '#5A5048' }} />
          </div>
        </div>
      </div>
    );
  }

  // CAO: mặt dựng vòm kiểu phố cũ, khắc năm xây.
  const pal = PALETTE[shopType];
  const nen = isNight ? shade(pal.roofBg, 0.55) : pal.roofBg;
  const nam = 1954 + ((houseNumber * 7) % 40);
  return (
    <div aria-hidden className="pointer-events-none flex h-[28px] w-[228px] items-end justify-center">
      <div
        className="relative flex items-end justify-center"
        style={{ width: 104, height: 28, backgroundColor: nen, borderRadius: '52px 52px 0 0' }}
      >
        <div
          className="absolute inset-x-[10px] top-[5px] bottom-0"
          style={{ borderRadius: '42px 42px 0 0', border: `2px solid ${pal.stripe}`, borderBottom: 'none' }}
        />
        <span
          className="relative mb-[3px] px-1.5 text-[9px] font-black leading-none tracking-wider"
          style={{ color: pal.signBg }}
        >
          {nam}
        </span>
      </div>
    </div>
  );
}

export default function ShophouseFacade({
  shopType,
  houseNumber,
  shopTitle,
  isBuilt,
  unlocked,
  level = 1,
  starRating = 1,
  yieldPerSec = 0,
  timeOfDay = 'DAY',
  windowSpeech = null,
  onOpenBuild,
}: ShophouseFacadeProps) {
  const isNight = timeOfDay === 'NIGHT';
  const isSunset = timeOfDay === 'SUNSET';
  const pal = PALETTE[shopType];
  const dang = dangNhaFor(houseNumber);

  /*
   * AI Ở CỬA SỔ NÀO.
   *
   * Chỉ nhà ĐÃ XÂY mới có người - lô mới dựng xong chưa ai dọn vào thì cửa
   * sổ để trống. Bốn vị trí cửa sổ đánh số 0-3; số nhà quyết định ô nào có
   * người, nên cùng một căn thì luôn cùng người đứng đó.
   *
   * Không cho đủ cả 4 ô: nhà nào cũng kín người ở mọi cửa sổ thì thành ký
   * túc xá chứ không phải nhà phố.
   */
  const oCoNguoi = (viTri: number): number | null => {
    if (!isBuilt) return null;
    const h = houseNumber * 7 + viTri * 31;
    return h % 3 === 0 ? h : null;
  };

  /* Màu kính cửa sổ theo giờ */
  const winFill = isNight
    ? '#FEF08A'
    : isSunset
      ? '#FDBA74'
      : '#BDD8E8';

  const winShadow = isNight
    ? '0 0 10px rgba(254,240,138,0.8), inset 0 0 12px rgba(253,224,71,0.9)'
    : isSunset
      ? 'inset 0 0 8px rgba(249,115,22,0.35)'
      : 'none';

  /* Màu tường ban đêm tối hơn một chút */
  const wallColor = isNight
    ? `color-mix(in srgb, ${pal.wall} 60%, #1C1A14)`
    : pal.wall;
  const wall2Color = isNight
    ? `color-mix(in srgb, ${pal.wall2} 55%, #1C1A14)`
    : pal.wall2;

  /* Component cửa sổ tái sử dụng */
  /**
   * Cua so cut paper: khong vien nau. Khung la mot mang giay dam hon mau
   * tuong, kinh la mang phang dat long vao trong.
   */
  const frame = shade(pal.wall, 0.52);
  const Win = ({
    wide = false,
    /** Ghế ngồi của một cư dân. `null` là cửa sổ bỏ trống. */
    nguoi = null,
    children,
  }: {
    wide?: boolean;
    nguoi?: number | null;
    children?: React.ReactNode;
  }) => (
    <div
      className="relative shrink-0"
      style={{ width: wide ? 76 : 58, height: wide ? 58 : 48, backgroundColor: frame }}
    >
      <div
        className="absolute overflow-hidden"
        style={{ inset: 4, backgroundColor: winFill, boxShadow: winShadow }}
      >
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2" style={{ backgroundColor: frame }} />
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2" style={{ backgroundColor: frame }} />
        {/*
         * Người vẽ SAU hai thanh nẹp kính nên nẹp nằm phía sau lưng, đúng
         * như nhìn từ ngoài đường vào. Vẽ trước thì nẹp cắt ngang mặt.
         */}
        {nguoi !== null && <NguoiCuaSo seed={nguoi} isNight={isNight} />}
        {children}
      </div>
    </div>
  );

  return (
    <div className="relative w-full flex flex-col" style={{ backgroundColor: wallColor }}>

      {/* ═══ 1a. MÁI NGÓI ĐỎ ══════════════════════════════════════════════ */}
      {/*
       * Nhìn từ mặt phố, mái dốc có nóc chạy song song với đường hiện ra là
       * một dải ngói chữ nhật, nên không cần cắt hình thang - và nhờ vậy
       * khối nhà vẫn giữ được viền chữ nhật mà không lộ góc tường.
       */}
      {dang.mai === 'NGOI' && (
        <div
          className="relative w-full overflow-visible"
          style={{
            height: 34,
            backgroundColor: isNight ? '#5E2A1E' : '#9C3B27',
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(43,36,32,0.24) 0 2px, transparent 2px 11px), repeating-linear-gradient(180deg, transparent 0 7px, rgba(43,36,32,0.2) 7px 9px)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[5px]" style={{ backgroundColor: '#6B241C' }} />
          {/* Diềm mái nhô ra hai bên */}
          <div className="absolute -left-1 -right-1 -bottom-[3px] h-[6px]" style={{ backgroundColor: '#5E2216' }} />
        </div>
      )}

      {/* ═══ 1b. SÂN THƯỢNG / PARAPET ═══════════════════════════════════ */}
      {dang.mai !== 'NGOI' && (
      <div
        className="relative w-full flex items-end justify-between px-2 overflow-visible"
        style={{ height: 44, backgroundColor: pal.roofBg, borderBottom: `3px solid ${shade(pal.roofBg, 0.68)}` }}
      >
        {/* Viền gờ cornice trên cùng */}
        <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: pal.stripe }} />

        {/* Chi tiết sân thượng theo shop type */}
        {shopType === 'CAFE' && (
          <div className="absolute inset-x-2 top-3 flex justify-around items-center">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="h-3 w-3 "
                style={{ backgroundColor: isNight ? '#FDE047' : i%2===0 ? '#EC4899' : '#F59E0B',
                  boxShadow: isNight ? '0 0 6px #FDE047' : 'none' }} />
            ))}
          </div>
        )}
        {shopType === 'CINEMA' && (
          <div className="absolute inset-x-4 top-2 flex justify-center">
            <div className="flex items-center gap-1.5 rounded px-3 py-0.5"
              style={{ backgroundColor: isNight ? '#1E1B4B' : '#831843',
                boxShadow: isNight ? '0 0 12px rgba(236,72,153,0.9)' : 'none' }}>
              <Clapperboard size={10} className="text-pink-300 shrink-0" />
              <span className="text-[8px] font-black text-white tracking-widest">CINEMA</span>
            </div>
          </div>
        )}
        {shopType === 'FINTECH' && (
          <>
            <div className="flex flex-col items-center ml-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              <div className="h-5 w-0.5 bg-slate-500" />
            </div>
            <div className="h-4 w-12 rounded-full border border-slate-500 bg-gradient-to-b from-slate-200 to-slate-400 flex items-center justify-center mr-2">
              <span className="text-[6px] font-black text-blue-900">TÂN Á</span>
            </div>
          </>
        )}
        {shopType === 'RICE_SHOP' && (
          <div className="absolute top-2 inset-x-1 h-3 "
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #B91C1C 0px, #B91C1C 4px, #DC2626 4px, #DC2626 8px)' }} />
        )}
        {shopType === 'GROCERY' && (
          <div className="absolute top-2 inset-x-1 h-2.5 "
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #0D9488 0,#0D9488 4px,#0F766E 4px,#0F766E 8px)' }} />
        )}
        {shopType === 'TIRE_SHOP' && (
          <div className="absolute top-3 right-2 h-5 w-16 border-2 border-slate-500 bg-transparent"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg,#475569 0,#475569 1px,transparent 1px,transparent 6px)' }} />
        )}
        {shopType === 'STATIONERY' && (
          <div className="absolute top-2 right-3 rounded bg-blue-700 px-1 py-0.5 text-[7px] font-black text-white shadow">
            IN MÀU
          </div>
        )}

        {/* Gờ parapet dưới */}
        <div className="absolute bottom-0 inset-x-0 h-3"
          style={{ backgroundColor: pal.stripe }} />
      </div>
      )}

      {/* ═══ 2. TẦNG 3 — CỬA SỔ (chỉ nhà 2 lầu) ════════════════════════ */}
      {dang.soLau >= 2 && (
      <div
        className="relative flex items-center justify-around px-5 py-3"
        style={{ backgroundColor: wallColor, borderBottom: `2px solid ${shade(pal.wall, 0.8)}` }}
      >
        <Win nguoi={oCoNguoi(0)}>
          {shopType === 'CAFE' && isNight && (
            <div className="absolute inset-0 flex items-center justify-center opacity-60">
              <Coffee size={10} className="text-amber-900" />
            </div>
          )}
        </Win>
        <Win nguoi={oCoNguoi(1)}>
          {shopType === 'STATIONERY' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              <BookOpen size={9} className="text-blue-900" />
            </div>
          )}
        </Win>
        {/* Điều hòa cục nóng góc phải */}
        <div className="absolute right-2 bottom-2 h-4 w-7 rounded-[2px] bg-white flex items-center justify-center shadow-sm">
          <div className="h-3 w-3 rounded-full bg-slate-200 flex items-center justify-center animate-spin"
            style={{ animationDuration: '4s' }}>
            <div className="h-px w-2 bg-slate-500" />
          </div>
        </div>
      </div>
      )}

      {/* ═══ 3. TẦNG 2 — BAN CÔNG ═══════════════════════════════════════ */}
      <div
        className="relative flex items-end justify-around gap-2 px-4 pt-2"
        style={{ backgroundColor: wall2Color }}
      >
        {/*
         * Bong bóng của người trong nhà, neo ở ban công và tràn ra NGOÀI
         * khối nhà. `overflow-visible` ở lớp cha cho phép nó vượt mép tường;
         * nếu kẹp bên trong thì câu dài bị cắt mất nửa.
         */}
        {windowSpeech && (
          <div
            className="pointer-events-none absolute left-1/2 z-40 w-max max-w-[210px] -translate-x-1/2 whitespace-normal break-words border-2 px-2.5 py-1.5 text-center leading-snug shadow-md"
            style={{
              bottom: 'calc(100% + 6px)',
              backgroundColor: '#FFFDF7',
              borderColor: '#5A4A3F',
              color: '#3E2A1B',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {windowSpeech}
            <span
              aria-hidden
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: '100%',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '7px solid #5A4A3F',
              }}
            />
          </div>
        )}
        {/* Cửa sổ rộng tầng 2 */}
        <Win wide nguoi={oCoNguoi(2)}>
          {shopType === 'CINEMA' && (
            <div className="absolute inset-1 flex items-center justify-center rounded bg-pink-900/80">
              <span className="text-[7px] font-black text-pink-200 rotate-0">POSTER</span>
            </div>
          )}
          {shopType === 'FINTECH' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Tv size={14} className="text-cyan-800" />
            </div>
          )}
        </Win>
        <Win nguoi={oCoNguoi(3)}>
          {/* Rèm cửa nhẹ */}
          <div className="absolute bottom-0 inset-x-0 h-1/3 "
            style={{ backgroundColor: 'rgba(255,255,255,0.35)' }} />
        </Win>

        {/* Chậu hoa ban công */}
        <div className="absolute left-3 bottom-1 h-4 w-4 rounded-full bg-[#5A8A3C] flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-[#EC4899]" />
        </div>
        <div className="absolute right-2 bottom-1 h-4 w-4 rounded-full bg-[#5A8A3C]" />
      </div>

      {/* Bản lan can ban công — sàn bê tông + thanh ngang */}
      <div style={{ backgroundColor: wall2Color, paddingBottom: 2 }}>
        {/* Sàn slab bê tông */}
        <div className="w-full" style={{ height: 10, backgroundColor: '#D5C9A8', borderBottom: '3px solid #A89878' }} />
        {/* Thanh lan can ngang */}
        <div className="relative mx-1" style={{ height: 22, borderTop: '3px solid #B0A182', borderBottom: '3px solid #B0A182' }}>
          {/* Các thanh dọc */}
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute inset-y-0 w-px"
              style={{ left: `${10 + i * 9}%`, width: 2, backgroundColor: '#B0A182' }} />
          ))}
          {/* Dây phơi quần áo */}
          {(shopType === 'RICE_SHOP' || shopType === 'TIRE_SHOP') && (
            <div className="absolute inset-x-2 top-1 flex gap-1.5 pointer-events-none">
              <div className="h-3 w-2 rounded-b-sm bg-rose-500" />
              <div className="h-3.5 w-2.5 rounded-b-sm bg-blue-500" />
              <div className="h-2.5 w-2 rounded-b-sm bg-yellow-400" />
            </div>
          )}
        </div>
      </div>

      {/* ═══ 4. BẢNG HIỆU ════════════════════════════════════════════════ */}
      {/*
       * So nha truoc day la `absolute -bottom-4` nen no thong xuong tang tret
       * va de len badge MENU cua tiem. Gio no la mot flex item nam han trong
       * bang hieu, khong con cho de cham nhau.
       */}
      <div
        className="relative mx-0 flex h-[40px] items-center gap-1.5 px-2"
        style={{
          backgroundColor: isBuilt ? pal.signBg : '#5A5048',
          borderBottom: `3px solid ${shade(isBuilt ? pal.signBg : '#5A5048', 0.6)}`,
          textShadow: isNight ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
        }}
      >
        <span
          className="shrink-0 px-1.5 py-0.5 text-[9px] font-black leading-none text-white"
          style={{ backgroundColor: '#1D4ED8' }}
        >
          {houseNumber}
        </span>

        <span className="min-w-0 flex-1 truncate text-center text-[11px] font-black tracking-widest text-white uppercase">
          {isBuilt ? shopTitle : 'MẶT TIỀN TRỐNG'}
        </span>

        {isBuilt && (
          <span className="shrink-0 flex items-center px-1.5 py-0.5 text-[9px] font-black leading-none text-yellow-300"
            style={{ backgroundColor: shade(pal.signBg, 0.64) }}>
            C.{level}
            {Array.from({ length: Math.min(starRating, 3) }).map((_, i) => (
              <Star key={i} size={8} className="ml-0.5 fill-yellow-300 text-yellow-300" />
            ))}
          </span>
        )}
      </div>

      {/* ═══ 5. MẶT TIỀN TẦNG TRỆT (GROUND FLOOR) ══════════════════════ */}
      <div
        className="relative mx-0 mb-0 overflow-hidden"
        style={{
          height: 120,
          borderLeft: `3px solid ${shade(pal.wall, 0.62)}`,
          borderRight: `3px solid ${shade(pal.wall, 0.62)}`,
          borderBottom: `4px solid ${shade(pal.wall, 0.5)}`,
          backgroundColor: isBuilt
            ? (isNight ? '#2C2218' : '#FAF6EE')
            : (isNight ? '#2A2018' : '#E8E0CC'),
        }}
      >
        {isBuilt ? (
          <>
            {/* TIỆM SỬA XE MÁY */}
            {shopType === 'TIRE_SHOP' && (
              <div className="flex h-full w-full items-end justify-between px-3 pb-2" style={{ backgroundColor: isNight ? '#222018' : '#EDEBE0' }}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-end gap-2">
                    {/* Bình bơm */}
                    <div className="h-9 w-5 rounded-t bg-red-600 flex flex-col items-center justify-between py-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                      <span className="text-[5px] font-bold text-white">AIR</span>
                    </div>
                    {/* 3 lốp xe */}
                    <div className="flex flex-col gap-0.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="h-4 w-8 rounded-full border-[3px] border-[#1C1C1C] bg-[#3A3A3A]" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wrench size={9} className="text-slate-600" />
                    <span className="text-[7px] font-bold" style={{ color: isNight ? '#AAA' : '#444' }}>VÁ KHÔNG RUỘT</span>
                  </div>
                </div>
                {/* Thợ */}
                <div className="flex flex-col items-center mb-1 mr-1">
                  <div className="h-5 w-5 rounded-full bg-[#FDE6D2]" />
                  <div className="h-8 w-6 rounded-t bg-[#4D8B46] flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold">HẢI</span>
                  </div>
                </div>
              </div>
            )}

            {/* TẠP HÓA CÔ TƯ */}
            {shopType === 'GROCERY' && (
              <div className="flex h-full w-full flex-col justify-between px-2 pb-1 pt-1">
                {/* Mái hiên sọc đỏ trắng */}
                <div className="h-3 w-full rounded-b"
                  style={{ backgroundImage: 'repeating-linear-gradient(90deg,#DC2626 0,#DC2626 8px,#FFF 8px,#FFF 16px)', borderBottom: '1px solid #78533D' }} />
                {/* Kệ hàng */}
                <div className="grid grid-cols-6 gap-1 pb-1" style={{ borderBottom: '2px solid #78533D' }}>
                  {['#EF4444','#F59E0B','#10B981','#3B82F6','#EC4899','#8B5CF6'].map((c, i) => (
                    <div key={i} className="h-4 rounded-[1px]" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                    <div className="h-6 w-5 rounded-t bg-[#EC4899]" />
                  </div>
                  <div className="flex items-center gap-1 rounded border border-[#D82D8B] bg-[#FDF2F8] px-1.5 py-0.5 text-[8px] font-black text-[#D82D8B]">
                    <span>Loa QR</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* CÀ PHÊ MOMO */}
            {shopType === 'CAFE' && (
              <div className="flex h-full w-full flex-col justify-between p-2" style={{ backgroundColor: isNight ? '#1E1208' : '#FEF7EE' }}>
                <div className="flex items-center justify-between pb-1.5" style={{ borderBottom: '1px solid rgba(120,83,61,0.3)' }}>
                  <div className="rounded px-2 py-0.5 text-[7px] font-black text-amber-200" style={{ backgroundColor: '#1C1917' }}>
                    MENU · CÀ PHÊ MUỐI
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-black text-[#D82D8B]">
                    <Coffee size={11} /><span>MoMo Cafe</span>
                  </div>
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-6 rounded-b-md border-2 border-[#5A4A3F] bg-amber-100 flex flex-col justify-between items-center p-0.5">
                      <div className="h-1 w-full bg-[#D82D8B]" />
                      <div className="flex gap-0.5">
                        <span className="h-1 w-1 rounded-full bg-[#1C171A]" />
                        <span className="h-1 w-1 rounded-full bg-[#1C171A]" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t bg-[#78350F]" />
                    </div>
                  </div>
                  <div className="rounded border border-emerald-500 bg-emerald-100 px-1.5 py-0.5 text-[8px] font-black text-emerald-800">
                    +{formatRate(yieldPerSec)}
                  </div>
                </div>
              </div>
            )}

            {/* RẠP PHIM CINEMA */}
            {shopType === 'CINEMA' && (
              <div className="flex h-full w-full flex-col justify-between p-2 text-white" style={{ backgroundColor: '#2D1537' }}>
                <div className="flex justify-around items-center pb-1" style={{ borderBottom: '1px solid rgba(236,72,153,0.4)' }}>
                  <span className="text-[8px] font-black text-pink-300">BẮP RANG BƠ VÀNG</span>
                  <span className="text-[8px] font-black text-yellow-300">PHÒNG VIP</span>
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-6 border border-white/60 flex items-center justify-center font-black text-[7px]"
                      style={{ backgroundImage: 'repeating-linear-gradient(90deg,#DC2626 0,#DC2626 3px,#FFF 3px,#FFF 6px)' }}>
                      <span className="bg-black/60 px-0.5 rounded text-white">CORN</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-white bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t border border-white bg-[#D82D8B]" />
                    </div>
                  </div>
                  <div className="rounded bg-[#EB2F96] px-2 py-1 text-[8px] font-black text-white shadow">VÉ 2D/3D</div>
                </div>
              </div>
            )}

            {/* FINTECH / TÚI THẦN TÀI */}
            {shopType === 'FINTECH' && (
              <div className="flex h-full w-full flex-col justify-between p-2 text-white" style={{ backgroundColor: '#0C4A6E' }}>
                <div className="flex items-center justify-between pb-1 px-1 rounded" style={{ borderBottom: '1px solid rgba(56,189,248,0.4)', backgroundColor: 'rgba(12,26,48,0.6)' }}>
                  <span className="text-[7px] font-black text-yellow-300">PHÍ THU HỘ 2,5%</span>
                  <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-6 rounded border-2 border-sky-300 bg-sky-900 flex flex-col items-center justify-between p-0.5">
                      <div className="h-2 w-4 rounded-[1px] flex items-center justify-center text-[5px] font-black text-white" style={{ backgroundColor: '#D82D8B' }}>MoMo</div>
                      <div className="h-1.5 w-4 bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-white bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t border border-white bg-[#1D4ED8]" />
                    </div>
                  </div>
                  <div className="rounded bg-sky-500 px-1.5 py-0.5 text-[8px] font-black text-white">TÚI THẦN TÀI</div>
                </div>
              </div>
            )}

            {/* TIỆM GẠO */}
            {shopType === 'RICE_SHOP' && (
              <div className="flex h-full w-full flex-col justify-between p-2" style={{ backgroundColor: isNight ? '#1C140A' : '#FEF9EE' }}>
                <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid rgba(120,83,61,0.3)' }}>
                  <span className="text-[7px] font-black text-amber-900">GẠO SẠCH ST25</span>
                  <span className="text-[7px] font-bold text-emerald-700">ĐÃ KIỂM ĐỊNH</span>
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-end gap-1.5">
                    <div className="h-7 w-6 rounded-t-sm border border-amber-800 bg-[#D4A373] flex items-center justify-center">
                      <span className="text-[6px] font-black text-white">ST25</span>
                    </div>
                    <div className="h-6 w-5 rounded-t-sm border border-amber-800 bg-[#CCD5AE] flex items-center justify-center">
                      <span className="text-[6px] font-black text-amber-900">NẾP</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t bg-[#9A3412]" />
                    </div>
                  </div>
                  <span className="text-[7px] font-bold text-amber-950">GIAO TẬN NƠI</span>
                </div>
              </div>
            )}

            {/* VĂN PHÒNG PHẨM */}
            {shopType === 'STATIONERY' && (
              <div className="flex h-full w-full flex-col justify-between p-2" style={{ backgroundColor: isNight ? '#101820' : '#F0FDF4' }}>
                <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid rgba(4,120,87,0.3)' }}>
                  <span className="text-[7px] font-black text-emerald-900">PHOTOCOPY · ĐÓNG SÁCH</span>
                  <span className="text-[7px] font-bold text-blue-700">A4/A3</span>
                </div>
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-7 rounded-sm border-2 border-slate-500 bg-slate-300 flex flex-col justify-between p-0.5">
                      <div className="h-1 w-full bg-slate-500" />
                      <div className="h-2 w-3 bg-white border border-slate-400 ml-auto" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                      <div className="h-6 w-5 rounded-t bg-[#059669]" />
                    </div>
                  </div>
                  <div className="rounded bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black text-white">IN NHANH</div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* CỬA SẮT KÉO XẾP — ô đất trống */
          <div
            onClick={e => { e.stopPropagation(); onOpenBuild?.(); }}
            className="relative flex h-full w-full flex-col items-center justify-center cursor-pointer group"
            style={{
              backgroundColor: isNight ? '#28221A' : '#D8CEBC',
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0,rgba(0,0,0,0.08) 12px,transparent 12px,transparent 24px), repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 14px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.05) 0,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 14px)',
            }}
          >
            {/* Xe máy đỏ lờ mờ sau cửa */}
            <div className="mb-2 h-3 w-10 rounded-full border border-black/30 bg-red-600/50" />
            <span
              className="z-10 rounded-lg border px-3 py-1.5 text-[10px] font-black shadow transition-colors"
              style={{
                backgroundColor: 'rgba(0,0,0,0.65)',
                borderColor: '#D4A030',
                color: '#D4A030',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLSpanElement).style.background = '#D82D8B';
                (e.currentTarget as HTMLSpanElement).style.borderColor = '#FFF';
                (e.currentTarget as HTMLSpanElement).style.color = '#FFF';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLSpanElement).style.background = 'rgba(0,0,0,0.65)';
                (e.currentTarget as HTMLSpanElement).style.borderColor = '#D4A030';
                (e.currentTarget as HTMLSpanElement).style.color = '#D4A030';
              }}
            >
              {unlocked ? '+ Khai Trương Tiệm' : '○ Đất Chưa Mở'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
 * Ô ĐẤT TRỐNG - HÀNG RÀO TÔN QUÂY, CỌC GỖ, ĐẤT TRỐNG
 *
 * Trước đây ô chưa xây vẫn dựng nguyên căn nhà 3 tầng, chỉ đổi biển hiệu
 * thành "MẶT TIỀN TRỐNG" và kéo cửa sắt xuống. Nhìn thì cả dãy phố lúc nào
 * cũng kín nhà, nên người chơi không thấy phố LỚN LÊN khi mình xây - thứ
 * đáng ra là phần thưởng rõ nhất của việc mở tiệm.
 *
 * Bản vẽ đầu dùng đất màu #B9A882 nên dính luôn vào vỉa hè #D9BE8C ở dưới,
 * hai dải thành một mảng nâu liền và cọc thì chìm mất. Giờ dùng hàng rào tôn
 * quây - thứ thực sự đứng ở mọi lô đất bỏ không tại Việt Nam - nên có một
 * mảng đứng, màu khác hẳn mặt đường, đọc ngay ra là "chỗ này chưa có nhà".
 * ═══════════════════════════════════════════════════════════════════════════ */
export function EmptyLot({
  houseNumber,
  unlocked,
  timeOfDay = 'DAY',
  onOpenBuild,
}: {
  houseNumber: number;
  unlocked: boolean;
  timeOfDay?: TimeOfDay;
  onOpenBuild?: () => void;
}) {
  const isNight = timeOfDay === 'NIGHT';

  /* Tôn cũ: xanh rêu bạc màu, loang gỉ. Khác hẳn tông vàng của vỉa hè. */
  const ton = unlocked
    ? (isNight ? '#2E4038' : '#6E8C72')
    : (isNight ? '#38332B' : '#8A8578');
  const tonDam = shade(ton, 0.72);
  const gi = isNight ? '#5A3A22' : '#A8701F';
  const dat = isNight ? '#2E2820' : '#7E6C4E';
  const go = isNight ? '#3A2E24' : '#5C4228';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onOpenBuild?.();
      }}
      className="relative w-full cursor-pointer"
      style={{ height: 150 }}
    >
      {/* ── Dải đất lộ ra phía trên hàng rào ── */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: 92,
          height: 14,
          backgroundColor: dat,
          backgroundImage: `repeating-linear-gradient(32deg, ${shade(dat, 0.8)} 0 2px, transparent 2px 11px)`,
        }}
      >
        {/* Cỏ dại nhú lên khỏi mép đất */}
        {[12, 29, 48, 67, 86].map((x, i) => (
          <span
            key={i}
            className="absolute bottom-full"
            style={{
              left: `${x}%`,
              width: 3,
              height: 5 + ((houseNumber + i * 3) % 6),
              backgroundColor: isNight ? '#2F4A3C' : '#5F7A4A',
            }}
          />
        ))}
      </div>

      {/* ── HÀNG RÀO TÔN ── */}
      <div
        className="absolute inset-x-0 overflow-hidden"
        style={{
          bottom: 0,
          height: 92,
          backgroundColor: ton,
          /* Sóng tôn: dải sáng tối xen kẽ chạy dọc. */
          backgroundImage: `repeating-linear-gradient(90deg, ${tonDam} 0 2px, ${ton} 2px 7px, ${shade(ton, 1.08)} 7px 9px, ${ton} 9px 14px)`,
          borderTop: `3px solid ${shade(ton, 1.12)}`,
          borderBottom: `4px solid ${tonDam}`,
        }}
      >
        {/* Vệt gỉ sét loang xuống, vị trí theo số nhà nên mỗi lô một kiểu */}
        <span
          className="absolute opacity-50"
          style={{ left: `${8 + (houseNumber * 7) % 60}%`, top: 0, width: 13, height: 34, backgroundColor: gi }}
        />
        <span
          className="absolute opacity-35"
          style={{ left: `${30 + (houseNumber * 11) % 50}%`, bottom: 0, width: 9, height: 26, backgroundColor: gi }}
        />

        {/* Cọc gỗ chống phía sau tôn, nhô lên khỏi mép trên */}
        {[14, 46, 78].map((x, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${x + ((houseNumber + i) % 4)}%`,
              top: -8,
              width: 7,
              height: 100,
              backgroundColor: go,
              opacity: 0.92,
              clipPath: 'polygon(0 100%, 0 6%, 50% 0, 100% 6%, 100% 100%)',
            }}
          />
        ))}
      </div>

      {/* ── Biển treo trên hàng rào ── */}
      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: 36 }}>
        <span
          className="whitespace-nowrap border-2 px-2.5 py-1 text-[10px] font-black shadow-sm"
          style={
            unlocked
              ? { backgroundColor: isNight ? '#3B2238' : '#F6E3B8', borderColor: '#A8246B', color: '#A8246B' }
              : { backgroundColor: isNight ? '#2E2A22' : '#E3D6B4', borderColor: '#5C4228', color: '#5C4228' }
          }
        >
          {unlocked ? `+ Khai Trương · Số ${houseNumber}` : `○ Chưa Mở · Số ${houseNumber}`}
        </span>
      </div>
    </div>
  );
}
