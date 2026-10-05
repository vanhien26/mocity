'use client';

import React from 'react';
import {
  Coffee,
  Clapperboard,
  BookOpen,
  Wrench,
  Star,
  ShieldCheck,
  Tv,
  ShoppingBag,
  Home,
  Clock,
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
  | 'CAFE'
  | 'PARK'
  | 'HOME'
  | 'LANDMARK';

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
  PARK:       { wall: '#E4EFD8', wall2: '#D2E4C0', stripe: '#5E8C42', signBg: '#2F4A22', roofBg: '#C4DCA8' },
  HOME:       { wall: '#F0E8DA', wall2: '#E4D8C4', stripe: '#9A8468', signBg: '#5A4632', roofBg: '#D8C8AC' },
  LANDMARK:   { wall: '#FBF0D8', wall2: '#F4E2BC', stripe: '#B8862A', signBg: '#7A4F14', roofBg: '#EFD9A8' },
};

/** Đậm/nhạt một màu hex theo hệ số */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.min(255, Math.round(v * k));
  return `#${((1 << 24) | (c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1)}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 1. DÁNG NHÀ, CHIỀU RỘNG & CHIỀU CAO ĐA DẠNG CỦA TỪNG CỬA HIỆU
 * ═══════════════════════════════════════════════════════════════════════════ */

export type KieuMai = 'PHANG' | 'NGOI' | 'CAO' | 'TOWER';
export type KieuBanCong = 'FLOWER_POTS' | 'LAUNDRY_LINE' | 'WATERING_PLANTS' | 'CLASSIC_IRON';

export interface DangNha {
  /** Số lầu phía trên tầng trệt: 1 lầu, 2 lầu hoặc 3 lầu */
  soLau: 1 | 2;
  /** Kiểu mái kiến trúc */
  mai: KieuMai;
  /** Bề rộng mặt tiền cửa hiệu (212px - 264px) */
  widthPx: number;
  /** Chiều cao tầng trệt (78px - 88px) */
  groundHeight: number;
  /** Chiều cao tầng lầu 1 */
  floor1Height: number;
  /** Chiều cao tầng lầu 2 (nếu có) */
  floor2Height: number;
  /** Kiểu sinh hoạt trên ban công */
  banCong: KieuBanCong;
}

export function dangNhaFor(houseNumber: number, shopType?: ShopType): DangNha {
  const i = Math.max(0, Math.floor(houseNumber / 2) - 1);
  
  // Tùy theo loại hình cửa tiệm, kích thước bề ngang & bề cao sẽ có nét đặc thù
  let baseWidth = 228;
  if (shopType === 'CAFE' || shopType === 'STATIONERY') baseWidth = 216 + (i % 3) * 6; // Tiệm nhỏ nhắn ấm cúng
  else if (shopType === 'CINEMA' || shopType === 'LANDMARK') baseWidth = 252 + (i % 2) * 12; // Rạp phim & kỳ quan rộng rãi
  else if (shopType === 'FINTECH' || shopType === 'GROCERY') baseWidth = 236 + (i % 3) * 8; // Nhà ống bề thế
  else baseWidth = 224 + (i % 4) * 8;

  const soLau: 1 | 2 = (shopType === 'CINEMA' || shopType === 'FINTECH' || (i % 2 === 0)) ? 2 : 1;
  const maiList: KieuMai[] = ['NGOI', 'PHANG', 'CAO', 'NGOI', 'PHANG', 'CAO', 'NGOI'];
  const mai = maiList[i % maiList.length];

  const banCongList: KieuBanCong[] = ['WATERING_PLANTS', 'LAUNDRY_LINE', 'FLOWER_POTS', 'CLASSIC_IRON'];
  const banCong = banCongList[(i + (shopType ? shopType.length : 0)) % banCongList.length];

  return {
    soLau,
    mai,
    widthPx: baseWidth,
    groundHeight: 82 + (i % 3) * 3,
    floor1Height: 76 + (i % 2) * 4,
    floor2Height: soLau === 2 ? 72 + (i % 3) * 3 : 0,
    banCong,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 2. THỜI GIAN MỞ CỬA & TÌNH TRẠNG ĐÓNG / MỞ CỬA THỰC TẾ
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface ShopOperatingStatus {
  isOpen: boolean;
  scheduleText: string;
  noteTitle: string;
  noteBody: string;
  openNextText: string;
}

export function getShopOperatingStatus(
  shopType: ShopType,
  timeOfDay: TimeOfDay = 'DAY',
  houseNumber: number
): ShopOperatingStatus {
  // Công viên, nhà ở và kỳ quan luôn mở
  if (shopType === 'PARK' || shopType === 'HOME' || shopType === 'LANDMARK') {
    return {
      isOpen: true,
      scheduleText: 'Mở cửa tự do',
      noteTitle: 'Mở cửa',
      noteBody: '',
      openNextText: 'Mở 24/7',
    };
  }

  // Tùy theo ngành nghề & khung giờ trong ngày:
  // DAY: 06:00 - 17:00 (Sáng & Trưa)
  // SUNSET: 17:00 - 19:30 (Chiều Tối)
  // NIGHT: 19:30 - 06:00 (Đêm)

  switch (shopType) {
    case 'CAFE': {
      // Cà phê mở từ sáng sớm (DAY) đến hết chiều tối (SUNSET) và đầu đêm. Đêm khuya nghỉ.
      const isOpen = timeOfDay !== 'NIGHT' || (houseNumber % 4 === 0);
      return {
        isOpen,
        scheduleText: '06:00 - 22:30',
        noteTitle: 'TẠM NGHỈ ĐÊM',
        noteBody: 'Quán nghỉ rang mẻ cà phê mới. Sáng 06:00 mở cửa phục vụ cafe phin thơm lừng nghen!',
        openNextText: 'Mở lại lúc 06:00',
      };
    }
    case 'RICE_SHOP': {
      // Cơm tấm mở sáng/trưa và chiều tối, đêm đóng cửa
      const isOpen = timeOfDay === 'DAY' || timeOfDay === 'SUNSET';
      return {
        isOpen,
        scheduleText: '06:30 - 14:00 & 17:00 - 21:30',
        noteTitle: 'HẾT SƯỜN NƯỚNG RỒI',
        noteBody: 'Bà con thông cảm! Sáng mai 06:30 cơm sườn bì chả nước mắm kẹo mở bán tiếp nha!',
        openNextText: 'Mở lại lúc 06:30',
      };
    }
    case 'TIRE_SHOP': {
      // Sửa xe mở ban ngày, chiều tối và đêm nghỉ
      const isOpen = timeOfDay === 'DAY';
      return {
        isOpen,
        scheduleText: '07:00 - 18:00',
        noteTitle: 'THỢ NGHỈ TAY',
        noteBody: 'Hết giờ vá xe. Bơm xe khẩn cấp xin ghé đầu hẻm, sáng 07:00 thợ mở tiệm!',
        openNextText: 'Mở lại lúc 07:00',
      };
    }
    case 'FINTECH':
    case 'STATIONERY': {
      // Ngân hàng & văn phòng phẩm mở giờ hành chính
      const isOpen = timeOfDay === 'DAY';
      return {
        isOpen,
        scheduleText: '08:00 - 17:30',
        noteTitle: 'HẾT GIỜ GIAO DỊCH',
        noteBody: 'Cửa hàng nghỉ đêm. Quý khách vui lòng giao dịch online qua ứng dụng MoMo 24/7!',
        openNextText: 'Mở lại lúc 08:00',
      };
    }
    case 'CINEMA': {
      // Rạp chiếu phim mở chiều tối và đêm
      const isOpen = timeOfDay === 'SUNSET' || timeOfDay === 'NIGHT';
      return {
        isOpen,
        scheduleText: '11:00 - 23:30',
        noteTitle: 'CHUẨN BỊ SUẤT CHIẾU',
        noteBody: 'Rạp đang vệ sinh phòng chiếu. Suất chiếu bom tấn kế tiếp bắt đầu lúc 11:30!',
        openNextText: 'Mở lại lúc 11:30',
      };
    }
    case 'GROCERY':
    default: {
      // Tạp hóa mở hầu như suốt ngày, chỉ đêm muộn đóng
      const isOpen = timeOfDay !== 'NIGHT' || (houseNumber % 2 === 0);
      return {
        isOpen,
        scheduleText: '06:00 - 23:00',
        noteTitle: 'TẠM ĐÓNG CỬA',
        noteBody: 'Cô Bảy đi chợ đầu mối lấy rau tươi bánh kẹo. 06:00 sáng mai mở bán đầy đủ!',
        openNextText: 'Mở lại lúc 06:00',
      };
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 3. BỘ THOẠI SINH HOẠT ĐỜI THƯỜNG & HÀI HƯỚC CỦA CƯ DÂN TRONG NHÀ
 * ═══════════════════════════════════════════════════════════════════════════ */

export const THOAI_CUA_SO = [
  // Sinh hoạt hài hước & đời sống thực tế
  'Đang tưới cây trên ban công nên cẩn thận ướt đầu nghen bà con!',
  'Trời ơi gió to quá bay mất cái áo ngực đang phơi rồi!',
  'Hai vợ chồng đang sinh hoạt tâm sự kín đáo, xíu quay lại nha!',
  'Cơm sườn hôm nay cháy xém chút nhưng nước mắm bao kẹo kẹo!',
  'Nước sôi nước sôi, ai đi ngang né né ra dùm tui một cái!',
  'Chủ tiệm đang ngủ trưa, ai mua tự giác bỏ tiền vô rổ nghen!',
  'Ê con Mực, không được sủa khách quen nghen mày!',
  'Ai bật loa kéo hát karaoke Đắp Mộ Cuộc Tình giờ này vậy trời?!',
  'Mới trúng hoàn tiền 50k MoMo, mua trà sữa sướng rơn người!',
  'Trời chuyển mưa rồi, mau gom đồ phơi lẹ lẹ kẻo ướt nhem!',
  'Tháng này đóng tiền điện nước qua MoMo tự động, đỡ lo bị cắt!',
  'Nồi canh chua cá lóc thơm phức, ai đói ghé ăn chung cho vui!',
  'Bà Tám ơi, coi chừng con mèo mướp nó lẻn sang quầy cá viên kìa!',
  'Hôm nay tiệm bán đắt hàng quá, quét mã ting ting nghe đã tai ghê!',
  'Hẻm mình nay sạch sẽ phong quang, Thị Trưởng quản lý đỉnh thiệt!',
  'Cà phê vợt đậm đặc, uống một ly tỉnh táo cày phim tới sáng!',
  'Mẹ ơi, con Mực nó lại tha mất chiếc dép tổ ong của ba rồi!',
  'Chiều nay triều cường lên nhớ kê đồ điện tử lên cao nghen bà con!',
  'Ai mượn cái thang tre chưa trả thì mang qua gửi lại nha!',
  'Tập thể dục nhịp điệu trên ban công cho eo thon dáng đẹp nào!',
];

/** Tông da và áo của cư dân */
const DA_CU_DAN = ['#EFC49C', '#E0A87E', '#C98F68'];
const AO_CU_DAN = ['#8C3B2E', '#4A6B5A', '#3E4C63', '#A8701F', '#73164A', '#6E8C72', '#BE185D', '#0284C7'];

/**
 * CSS Keyframes hoạt cảnh nhân vật sinh hoạt trên ban công & cửa sổ
 */
const SHOPHOUSE_LIFE_CSS = `
@keyframes shWaterCan {
  0%, 100% { transform: rotate(0deg); }
  35% { transform: rotate(-35deg); }
  65% { transform: rotate(-30deg); }
}
@keyframes shWaterDrop {
  0% { opacity: 0; transform: translateY(0px) scale(0.6); }
  50% { opacity: 1; transform: translateY(12px) scale(1); }
  100% { opacity: 0; transform: translateY(22px) scale(0.8); }
}
@keyframes shLaundryFlutter {
  0%, 100% { transform: rotate(-2deg) skewX(-2deg); }
  50% { transform: rotate(5deg) skewX(4deg); }
}
@keyframes shWaveArm {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-28deg); }
  75% { transform: rotate(20deg); }
}
@keyframes shBopHead {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}
@keyframes shCatTail {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(18deg); }
}
`;

/**
 * HOẠT CẢNH BAN CÔNG SINH HOẠT (Tưới cây, phơi đồ, mèo nằm, ngắm phố)
 */
function BalconyLifeScene({
  styleType,
  seed,
  isNight,
}: {
  styleType: KieuBanCong;
  seed: number;
  isNight: boolean;
}) {
  const da = DA_CU_DAN[seed % DA_CU_DAN.length];
  const ao = AO_CU_DAN[(seed * 3) % AO_CU_DAN.length];
  const toc = seed % 3 === 0 ? '#1E1B18' : seed % 3 === 1 ? '#4A3B30' : '#2B2420';

  if (styleType === 'WATERING_PLANTS') {
    // Nhân vật đang cầm bình tưới cây cảnh
    return (
      <div className="relative flex items-end justify-between px-2" style={{ height: 32 }}>
        {/* Người cầm bình tưới */}
        <div className="relative flex flex-col items-center" style={{ width: 26 }}>
          {/* Đầu & Tóc */}
          <div className="relative h-4 w-4 rounded-full" style={{ backgroundColor: da }}>
            <div className="absolute inset-x-0 top-0 h-2 rounded-t-full" style={{ backgroundColor: toc }} />
            <div className="absolute right-1 top-2 h-1 w-1 rounded-full bg-[#1E1B18]" />
          </div>
          {/* Thân áo */}
          <div className="h-4 w-5 rounded-t-md" style={{ backgroundColor: ao }} />
          {/* Tay cầm bình tưới nghiêng */}
          <div
            className="absolute -right-2.5 top-3 z-10 origin-top-left"
            style={{ animation: 'shWaterCan 4s ease-in-out infinite' }}
          >
            <div className="h-2.5 w-3.5 rounded-sm bg-[#0284C7] relative">
              <span className="absolute -left-1 top-0.5 h-1.5 w-1 rounded-l-full border border-[#0284C7]" />
              <span className="absolute -right-2 top-0 h-1 w-2.5 origin-left rotate-45 bg-[#38BDF8]" />
            </div>
            {/* Giọt nước rơi */}
            <span
              className="absolute -right-2 top-3 h-1.5 w-1 rounded-full bg-[#38BDF8]"
              style={{ animation: 'shWaterDrop 1.8s ease-in infinite' }}
            />
          </div>
        </div>

        {/* Chậu hoa cảnh xum xuê bên cạnh */}
        <div className="flex flex-col items-center">
          <div className="flex -space-x-1">
            <span className="h-3 w-3 rounded-full bg-[#16A34A]" />
            <span className="h-4 w-4 rounded-full bg-[#22C55E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#F43F5E]" />
          </div>
          <div className="h-3 w-4 rounded-b-sm border-t border-[#78350F] bg-[#B45309]" />
        </div>
      </div>
    );
  }

  if (styleType === 'LAUNDRY_LINE') {
    // Dây phơi quần áo (có áo thun, quần jean, áo ngực, khăn mặt)
    return (
      <div className="relative flex items-end justify-between px-1" style={{ height: 32 }}>
        {/* Dây phơi căng ngang */}
        <div className="absolute inset-x-1 top-2.5 h-[1.5px] bg-[#94A3B8]" />
        
        {/* Áo thun phơi */}
        <div
          className="relative top-2.5 origin-top"
          style={{ animation: 'shLaundryFlutter 3.2s ease-in-out infinite' }}
        >
          <div className="h-4 w-4 rounded-b bg-[#38BDF8] border-t-2 border-[#0284C7]" />
        </div>

        {/* Áo ngực phơi (Hài hước đặc trưng phố xá) */}
        <div
          className="relative top-2.5 origin-top"
          style={{ animation: 'shLaundryFlutter 2.8s ease-in-out infinite 0.4s' }}
        >
          <div className="flex items-center gap-0.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F43F5E] shadow-xs" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#F43F5E] shadow-xs" />
          </div>
        </div>

        {/* Quần đùi / Khăn mặt */}
        <div
          className="relative top-2.5 origin-top"
          style={{ animation: 'shLaundryFlutter 3.5s ease-in-out infinite 0.8s' }}
        >
          <div className="h-4 w-3.5 rounded-b bg-[#FBBF24] border-t-2 border-[#D97706]" />
        </div>

        {/* Mèo lười nằm ngủ cạnh dây phơi */}
        <div className="flex items-end">
          <div className="relative h-3 w-4 rounded-full bg-[#F97316]">
            <span className="absolute -top-1 right-0.5 h-1.5 w-1.5 rounded-full bg-[#EA580C]" />
            <span
              className="absolute -left-1.5 top-0.5 h-1 w-2 origin-right bg-[#EA580C] rounded-full"
              style={{ animation: 'shCatTail 2.5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Mặc định: Chậu hoa & Cư dân ngắm phố
  return (
    <div className="relative flex items-end justify-between px-2" style={{ height: 32 }}>
      <div className="flex flex-col items-center">
        <div className="h-3 w-4 rounded-full bg-[#EC4899]" />
        <div className="h-2.5 w-3.5 rounded-b-sm bg-[#A16207]" />
      </div>

      {/* Cư dân ngắm phố vẫy tay */}
      <div className="relative flex flex-col items-center">
        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: da }}>
          <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-full" style={{ backgroundColor: toc }} />
          <div className="absolute right-1 top-1.5 h-1 w-1 rounded-full bg-[#1E1B18]" />
        </div>
        <div className="h-4 w-5 rounded-t-md" style={{ backgroundColor: ao }} />
        <div
          className="absolute -right-1.5 top-1 origin-bottom-left"
          style={{ animation: 'shWaveArm 2.2s ease-in-out infinite' }}
        >
          <span className="block h-2.5 w-1 rounded-full" style={{ backgroundColor: da }} />
        </div>
      </div>
    </div>
  );
}

/**
 * MẶT DỰNG CỬA CUỐN KHI ĐÓNG CỬA (Rolling Shutter Door with Padlock & Notice Paper)
 */
function RollingShutterDoor({
  shopType,
  houseNumber,
  status,
  isNight,
}: {
  shopType: ShopType;
  houseNumber: number;
  status: ShopOperatingStatus;
  isNight: boolean;
}) {
  const shutterBg = isNight ? '#26282B' : '#64748B';
  const shutterLine = isNight ? '#181A1D' : '#475569';

  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden p-1.5 select-none"
      style={{
        backgroundColor: shutterBg,
        backgroundImage: `repeating-linear-gradient(180deg, ${shutterBg} 0px, ${shutterBg} 5px, ${shutterLine} 5px, ${shutterLine} 7px)`,
        borderBottom: '4px solid #334155',
      }}
    >
      {/* Khung viền kim loại 2 bên */}
      <div className="absolute inset-y-0 left-0 w-1 bg-[#334155]" />
      <div className="absolute inset-y-0 right-0 w-1 bg-[#334155]" />

      {/* TỜ GIẤY A4 DÁN TRƯỚC CỬA CUỐN (Handwritten Notice Paper) */}
      <div className="relative z-10 mx-auto mt-1 flex max-w-[175px] -rotate-1 items-start gap-1.5 rounded-sm border border-[#CA8A04] bg-[#FFFBEB] p-1.5 shadow-md">
        {/* Miếng băng keo dán trên đầu */}
        <span className="absolute -top-1.5 left-1/2 h-2.5 w-7 -translate-x-1/2 -rotate-3 bg-amber-200/90 border-x border-amber-300 shadow-xs" />
        
        <Clock size={13} className="shrink-0 text-[#B45309] mt-0.5" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center justify-between gap-1 border-b border-amber-200 pb-0.5">
            <span className="truncate text-[8.5px] font-black uppercase tracking-wide text-[#78350F]">
              {status.noteTitle}
            </span>
            <span className="shrink-0 rounded-xs bg-[#FDE68A] px-1 text-[7.5px] font-black text-[#92400E]">
              {status.openNextText}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[8px] font-bold italic leading-tight text-[#92400E]">
            &ldquo;{status.noteBody}&rdquo;
          </p>
        </div>
      </div>

      {/* Ổ khóa sàn & Chốt cửa cuốn */}
      <div className="relative z-10 flex items-center justify-between px-3 pb-0.5">
        <span className="h-2 w-3 rounded-t-xs bg-[#475569] border border-[#1E293B]" />
        {/* Ổ khóa đồng chữ U */}
        <div className="flex flex-col items-center">
          <span className="h-1.5 w-2 rounded-t-full border border-[#D97706] bg-transparent" />
          <span className="h-2 w-3 rounded-xs bg-[#F59E0B] border border-[#B45309]" />
        </div>
        <span className="h-2 w-3 rounded-t-xs bg-[#475569] border border-[#1E293B]" />
      </div>
    </div>
  );
}

/**
 * SHUTTER ROOF CAP (Phần mái vòm hoặc bồn nước inox trên nóc)
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
  const { mai, widthPx } = dangNhaFor(houseNumber, shopType);
  if (mai === 'NGOI') return null;

  const isNight = timeOfDay === 'NIGHT';

  if (mai === 'PHANG') {
    // Bồn nước inox trên chân sắt
    const inox = isNight ? '#6E7378' : '#B8BCC0';
    return (
      <div aria-hidden className="pointer-events-none relative h-[16px]" style={{ width: widthPx }}>
        <div className="absolute bottom-0 right-6 flex flex-col items-center">
          <div className="relative" style={{ width: 28, height: 11, backgroundColor: inox, borderRadius: '6px 6px 2px 2px' }}>
            <div className="absolute inset-x-0 top-[5px] h-[2px]" style={{ backgroundColor: shade('#B8BCC0', 0.78) }} />
            <div className="absolute inset-x-0 top-[10px] h-[2px]" style={{ backgroundColor: shade('#B8BCC0', 0.78) }} />
          </div>
          <div className="flex w-[26px] justify-between">
            <span className="h-[5px] w-[3px]" style={{ backgroundColor: '#5A5048' }} />
            <span className="h-[5px] w-[3px]" style={{ backgroundColor: '#5A5048' }} />
          </div>
        </div>
      </div>
    );
  }

  // CAO: mặt dựng vòm kiểu Pháp cổ
  const pal = PALETTE[shopType];
  const nen = isNight ? shade(pal.roofBg, 0.55) : pal.roofBg;
  const nam = 1954 + ((houseNumber * 7) % 40);
  return (
    <div aria-hidden className="pointer-events-none flex h-[18px] items-end justify-center" style={{ width: widthPx }}>
      <div
        className="relative flex items-end justify-center shadow-xs"
        style={{ width: 104, height: 18, backgroundColor: nen, borderRadius: '52px 52px 0 0' }}
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

/**
 * COMPONENT CHÍNH: SHOPHOUSE FACADE
 */
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
  wallBg,
  wallHatch,
  signBg,
  windowSpeech = null,
  onOpenBuild,
}: ShophouseFacadeProps) {
  const isNight = timeOfDay === 'NIGHT';
  const pal = PALETTE[shopType] || PALETTE.GROCERY;
  const dangNha = dangNhaFor(houseNumber, shopType);
  const operatingStatus = getShopOperatingStatus(shopType, timeOfDay, houseNumber);

  if (!isBuilt) {
    return (
      <div style={{ width: dangNha.widthPx }} className="shrink-0">
        <EmptyLot
          houseNumber={houseNumber}
          unlocked={unlocked}
          timeOfDay={timeOfDay}
          onOpenBuild={onOpenBuild}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col justify-end shrink-0 transition-transform duration-200 select-none"
      style={{ width: dangNha.widthPx }}
    >
      <style>{SHOPHOUSE_LIFE_CSS}</style>

      {/* ── BONG BÓNG THOẠI CỦA NGƯỜI TRONG NHÀ ── */}
      {windowSpeech && (
        <div className="absolute -top-12 left-1/2 z-40 -translate-x-1/2 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="relative max-w-[210px] rounded-2xl border-2 border-[#78350F] bg-white px-3 py-1.5 shadow-xl">
            <p className="text-[11px] font-black leading-snug text-[#3E2A1B]">
              💬 {windowSpeech}
            </p>
            {/* Mũi tên bong bóng */}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-0 w-0 border-x-4 border-x-transparent border-t-8 border-t-[#78350F]" />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-0 w-0 border-x-[3px] border-x-transparent border-t-[6px] border-t-white" />
          </div>
        </div>
      )}

      {/* Nóc mái vòm / Bồn nước */}
      <ShophouseRoofCap
        houseNumber={houseNumber}
        shopType={shopType}
        timeOfDay={timeOfDay}
      />

      {/* Khối nhà chính */}
      <div
        className="relative overflow-hidden rounded-t-xl border-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
        style={{
          backgroundColor: isNight ? shade(wallBg, 0.6) : wallBg,
          borderColor: isNight ? shade(pal.stripe, 0.7) : pal.stripe,
        }}
      >
        {/* Mái ngói dốc nếu là kiểu NGOI */}
        {dangNha.mai === 'NGOI' && (
          <div
            className="h-5 w-full border-b-2 border-[#9A3412]"
            style={{
              backgroundColor: isNight ? '#7C2D12' : '#EA580C',
              backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 8px, rgba(0,0,0,0.15) 8px, rgba(0,0,0,0.15) 10px)',
            }}
          />
        )}

        {/* ═══ TẦNG LẦU 2 (NẾU CÓ) ═══ */}
        {dangNha.soLau === 2 && (
          <div
            className="relative border-b-2 border-dashed border-[#78350F]/25 px-3 pt-2 pb-1"
            style={{ height: dangNha.floor2Height }}
          >
            <div className="flex items-center justify-around h-full">
              {/* Cửa sổ lầu 2 */}
              <div className="h-10 w-9 rounded-t-md border-2 border-[#5A4033] bg-[#C8DCEA] flex items-center justify-center relative overflow-hidden">
                <div className="h-full w-[1.5px] bg-[#5A4033]" />
                <div className="absolute inset-x-0 h-[1.5px] bg-[#5A4033]" />
              </div>
              <div className="h-10 w-9 rounded-t-md border-2 border-[#5A4033] bg-[#C8DCEA] flex items-center justify-center relative overflow-hidden">
                <div className="h-full w-[1.5px] bg-[#5A4033]" />
                <div className="absolute inset-x-0 h-[1.5px] bg-[#5A4033]" />
              </div>
            </div>
          </div>
        )}

        {/* ═══ TẦNG LẦU 1 & BAN CÔNG SINH HOẠT ═══ */}
        <div
          className="relative border-b-2 border-[#78350F]/35 px-3 pt-1"
          style={{ height: dangNha.floor1Height }}
        >
          {/* Hoạt cảnh ban công sinh hoạt */}
          <BalconyLifeScene
            styleType={dangNha.banCong}
            seed={houseNumber}
            isNight={isNight}
          />
          {/* Lan can ban công hoa sắt */}
          <div
            className="h-2.5 w-full border-t-2 border-b-2 border-[#4A3525] bg-[#78533D]/20"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #4A3525 0px, #4A3525 2px, transparent 2px, transparent 8px)',
            }}
          />
        </div>

        {/* ═══ BIỂN HIỆU CỬA HÀNG ═══ */}
        <div
          className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 shadow-inner"
          style={{
            backgroundColor: isNight ? shade(signBg, 0.65) : signBg,
            borderTop: `2px solid ${shade(signBg, 1.25)}`,
            borderBottom: `2px solid ${shade(signBg, 0.65)}`,
          }}
        >
          {/* Biển số nhà */}
          <span className="rounded-xs bg-[#1D4ED8] px-1.5 py-0.5 text-[9px] font-black leading-none text-white shadow-xs">
            {houseNumber}
          </span>

          {/* Tên tiệm */}
          <span className="min-w-0 flex-1 truncate text-center text-[11px] font-black tracking-wider text-white uppercase drop-shadow-xs">
            {shopTitle}
          </span>

          {/* Cấp độ & Sao */}
          <span
            className="flex shrink-0 items-center rounded-xs px-1.5 py-0.5 text-[9px] font-black leading-none text-amber-200"
            style={{ backgroundColor: shade(signBg, 0.5) }}
          >
            C.{level}
            {Array.from({ length: Math.min(starRating, 3) }).map((_, i) => (
              <Star key={i} size={8} className="ml-0.5 fill-amber-300 text-amber-300" />
            ))}
          </span>
        </div>

        {/* ═══ TẦNG TRỆT: ĐANG MỞ HOẶC ĐÓNG CỬA CUỐN ═══ */}
        <div
          className="relative overflow-hidden"
          style={{ height: dangNha.groundHeight }}
        >
          {/* NẾU ĐANG ĐÓNG CỬA: Hạ cửa cuốn & Tờ giấy dán thông báo */}
          {!operatingStatus.isOpen ? (
            <RollingShutterDoor
              shopType={shopType}
              houseNumber={houseNumber}
              status={operatingStatus}
              isNight={isNight}
            />
          ) : (
            /* NẾU ĐANG MỞ CỬA: Gian hàng kinh doanh tấp nập */
            <div className="relative h-full w-full">
              {/* QUÁN CÀ PHÊ */}
              {shopType === 'CAFE' && (
                <div
                  className="flex h-full w-full flex-col justify-between p-2"
                  style={{ backgroundColor: isNight ? '#1E1208' : '#FEF7EE' }}
                >
                  <div className="flex items-center justify-between border-b border-[#78533D]/30 pb-1">
                    <span className="rounded bg-[#1C1917] px-1.5 py-0.5 text-[7px] font-black text-amber-200">
                      ☕ CÀ PHÊ SỮA ĐÁ
                    </span>
                    <span className="text-[8px] font-black text-[#D82D8B]">MoMo Pay ✓</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Ly cafe phin */}
                      <div className="h-8 w-5 rounded-b border-2 border-[#5A4A3F] bg-amber-200 p-0.5 flex flex-col justify-between items-center">
                        <span className="h-1 w-full bg-[#D82D8B]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3E2A1B]" />
                      </div>
                      {/* Nhân viên / Chủ tiệm */}
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                        <div className="h-5 w-5 rounded-t bg-[#78350F]" />
                      </div>
                    </div>
                    <span className="rounded bg-emerald-100 border border-emerald-500 px-1 py-0.5 text-[8px] font-black text-emerald-800">
                      +{formatRate(yieldPerSec)}
                    </span>
                  </div>
                </div>
              )}

              {/* QUÁN CƠM TẤM */}
              {shopType === 'RICE_SHOP' && (
                <div
                  className="flex h-full w-full flex-col justify-between p-2"
                  style={{ backgroundColor: isNight ? '#241408' : '#FFFDF7' }}
                >
                  <div className="flex items-center justify-between border-b border-amber-300 pb-1">
                    <span className="rounded bg-[#B91C1C] px-1.5 py-0.5 text-[7px] font-black text-white">
                      🍖 SƯỜN BÌ CHẢ
                    </span>
                    <span className="text-[8px] font-black text-[#B45309]">Bốc khói nghi ngút</span>
                  </div>
                  <div className="flex items-end justify-between">
                    {/* Bếp nướng than & Dĩa cơm */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-7 w-7 rounded-sm border border-[#7F1D1D] bg-[#EF4444] p-0.5 flex flex-col items-center justify-center">
                        <span className="h-2 w-5 rounded-xs bg-[#7F1D1D]" />
                        <span className="mt-0.5 text-[6px] font-bold text-amber-200">NƯỚNG</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                        <div className="h-5 w-5 rounded-t bg-[#DC2626]" />
                      </div>
                    </div>
                    <span className="rounded bg-emerald-100 border border-emerald-500 px-1 py-0.5 text-[8px] font-black text-emerald-800">
                      +{formatRate(yieldPerSec)}
                    </span>
                  </div>
                </div>
              )}

              {/* TIỆM TẠP HÓA */}
              {shopType === 'GROCERY' && (
                <div className="flex h-full w-full flex-col justify-between p-1.5">
                  <div
                    className="h-2.5 w-full rounded-b-xs"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, #DC2626 0, #DC2626 8px, #FFF 8px, #FFF 16px)',
                      borderBottom: '1px solid #78533D',
                    }}
                  />
                  {/* Kệ bánh kẹo */}
                  <div className="grid grid-cols-6 gap-1">
                    {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'].map((c, i) => (
                      <div key={i} className="h-3.5 rounded-xs" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-1">
                      <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                      <span className="text-[7.5px] font-black text-[#78350F]">Cô Bảy</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-xs border border-[#D82D8B] bg-[#FDF2F8] px-1 py-0.5 text-[7.5px] font-black text-[#D82D8B]">
                      <span>Loa QR</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                  </div>
                </div>
              )}

              {/* NHÀ PHỐ DÂN CƯ (HOME) */}
              {shopType === 'HOME' && (
                <div
                  className="relative flex h-full w-full items-end justify-between px-2 pb-1 overflow-hidden"
                  style={{
                    backgroundColor: isNight ? '#2A2421' : '#FFF9F0',
                    backgroundImage: isNight
                      ? 'linear-gradient(180deg, #1C1816 0%, #2A2421 100%)'
                      : 'linear-gradient(180deg, #FBF6EE 0%, #F5EDE0 100%)',
                  }}
                >
                  {/* Đèn tường hiên nhà tỏa ánh sáng vàng ấm */}
                  <div className="absolute top-1 left-2.5 flex items-center gap-1">
                    <div className="relative">
                      <span className="block h-1.5 w-2 rounded-t-xs bg-[#78350F] border border-[#451A03]" />
                      <span
                        className="block h-2.5 w-2.5 rounded-b-full"
                        style={{
                          backgroundColor: isNight ? '#FBBF24' : '#FDE68A',
                          boxShadow: isNight ? '0 0 10px #F59E0B' : 'none',
                        }}
                      />
                    </div>
                    <span className="text-[7.5px] font-black italic text-[#854D0E]">
                      {isNight ? 'Bình yên' : 'Tổ ấm'}
                    </span>
                  </div>

                  {/* Cửa gỗ 2 cánh ấm cúng */}
                  <div className="flex items-end gap-1.5 pl-0.5">
                    {/* Khung cửa gỗ */}
                    <div
                      className="relative h-13 w-11 rounded-t border-2 border-[#5A3825] flex justify-between p-0.5 shadow-sm"
                      style={{ backgroundColor: '#784323' }}
                    >
                      {/* Cánh trái */}
                      <div className="h-full w-[18px] rounded-t-xs border border-[#451A03] bg-[#8B4D2B] p-0.5 flex flex-col justify-between">
                        <div className="h-3.5 w-full rounded-xs bg-[#C28256] border border-[#5A3825]/40 flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full border border-[#784323]/50" />
                        </div>
                        <div className="h-4 w-full rounded-xs bg-[#6E3B1F] border border-[#451A03]/60 flex items-center justify-end pr-0.5">
                          <span className="h-2 w-0.5 rounded-full bg-[#F59E0B]" />
                        </div>
                      </div>
                      {/* Cánh phải */}
                      <div className="h-full w-[18px] rounded-t-xs border border-[#451A03] bg-[#9A5630] p-0.5 flex flex-col justify-between">
                        <div className="h-3.5 w-full rounded-xs bg-[#C28256] border border-[#5A3825]/40 flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full border border-[#784323]/50" />
                        </div>
                        <div className="h-4 w-full rounded-xs bg-[#6E3B1F] border border-[#451A03]/60 flex items-center justify-start pl-0.5">
                          <span className="h-2 w-0.5 rounded-full bg-[#F59E0B]" />
                        </div>
                      </div>
                    </div>

                    {/* Chậu hoa cúc / Cây cảnh trước cửa */}
                    <div className="flex flex-col items-center">
                      <div className="flex -space-x-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                        <span className="h-3 w-3 rounded-full bg-[#16A34A]" />
                        <span className="h-2 w-2 rounded-full bg-[#EAB308]" />
                      </div>
                      <div className="h-3 w-3.5 rounded-b border-t border-[#78350F] bg-[#B45309]" />
                    </div>
                  </div>

                  {/* Xe máy Super Cub đậu trước nhà & Thú cưng */}
                  <div className="flex flex-col items-end gap-0.5 pr-1">
                    {yieldPerSec > 0 && (
                      <span className="rounded bg-emerald-100 border border-emerald-500 px-1 py-0.2 text-[7.5px] font-black text-emerald-800">
                        +{formatRate(yieldPerSec)}
                      </span>
                    )}
                    {/* Chiếc xe máy dựng chân chống */}
                    <div className="relative flex items-end">
                      <div className="relative flex flex-col items-center">
                        <div className="h-1.5 w-2.5 rounded-t-xs bg-[#E11D48] border border-[#9F1239] flex items-center justify-center">
                          <span className="h-0.5 w-0.5 rounded-full bg-[#FEF08A]" />
                        </div>
                        <div className="h-3 w-4.5 bg-white border border-[#94A3B8] rounded-tl-sm flex items-center justify-center">
                          <span className="h-1 w-2.5 rounded-xs bg-[#E11D48]" />
                        </div>
                      </div>
                      <div className="flex items-center -ml-1">
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-[#1E293B] bg-[#475569] flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#94A3B8]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ĐIỂM TÀI CHÍNH / FINTECH (MOMO STATION) */}
              {shopType === 'FINTECH' && (
                <div
                  className="flex h-full w-full flex-col justify-between p-1.5 overflow-hidden"
                  style={{ backgroundColor: isNight ? '#1E1028' : '#FDF2F8' }}
                >
                  <div className="flex items-center justify-between border-b border-[#D82D8B]/30 pb-0.5">
                    <span className="rounded bg-[#D82D8B] px-1.5 py-0.2 text-[7px] font-black text-white">
                      MOMO STATION
                    </span>
                    <span className="text-[7.5px] font-bold text-[#A21CAF]">Sinh Lời 24/7</span>
                  </div>
                  <div className="flex items-end justify-between">
                    {/* Cây ATM MoMo */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-10 w-6 rounded-t-sm border border-[#D82D8B] bg-[#F472B6] p-0.5 flex flex-col items-center justify-between shadow-xs">
                        <div className="h-3 w-full rounded-xs bg-[#831843] border border-[#BE185D] flex items-center justify-center">
                          <span className="text-[5.5px] font-black text-emerald-300">ATM</span>
                        </div>
                        <div className="h-1.5 w-4 rounded-xs bg-[#500724]" />
                        <span className="h-1 w-2 bg-emerald-400 animate-pulse" />
                      </div>
                      {/* Nhân viên tư vấn MoMo */}
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                        <div className="h-5 w-5 rounded-t bg-[#D82D8B]" />
                      </div>
                    </div>
                    {yieldPerSec > 0 && (
                      <span className="rounded bg-emerald-100 border border-emerald-500 px-1 py-0.5 text-[8px] font-black text-emerald-800">
                        +{formatRate(yieldPerSec)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* RẠP CHIẾU PHIM (CINEMA) */}
              {shopType === 'CINEMA' && (
                <div
                  className="flex h-full w-full flex-col justify-between p-1.5 overflow-hidden"
                  style={{ backgroundColor: isNight ? '#180B20' : '#2A1238' }}
                >
                  <div className="flex items-center justify-between border-b border-[#BE185D] pb-0.5">
                    <span className="rounded bg-[#BE185D] px-1.5 py-0.2 text-[7px] font-black text-amber-200">
                      🎬 TÂN THỜI CINEMA
                    </span>
                    <span className="text-[7px] font-black text-amber-300">ĐANG CHIẾU</span>
                  </div>
                  <div className="flex items-end justify-between">
                    {/* Máy bắp rang bơ & Ly nước */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-9 w-6 rounded-t border border-[#F59E0B] bg-[#FEF3C7] p-0.5 flex flex-col items-center justify-between">
                        <span className="text-[6px] font-black text-[#B45309]">POPCORN</span>
                        <div className="flex flex-wrap gap-0.5 px-0.5 justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF24]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
                        </div>
                        <div className="h-1.5 w-full bg-[#DC2626] rounded-xs" />
                      </div>
                      {/* Nhân viên soát vé */}
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                        <div className="h-5 w-5 rounded-t bg-[#BE185D]" />
                      </div>
                    </div>
                    {yieldPerSec > 0 && (
                      <span className="rounded bg-emerald-100 border border-emerald-500 px-1 py-0.5 text-[8px] font-black text-emerald-800">
                        +{formatRate(yieldPerSec)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* HIỆU SÁCH & VĂN PHÒNG PHẨM (STATIONERY) */}
              {shopType === 'STATIONERY' && (
                <div
                  className="flex h-full w-full flex-col justify-between p-1.5 overflow-hidden"
                  style={{ backgroundColor: isNight ? '#0F2418' : '#F0FDF4' }}
                >
                  <div className="flex items-center justify-between border-b border-[#16A34A]/30 pb-0.5">
                    <span className="rounded bg-[#16A34A] px-1.5 py-0.2 text-[7px] font-black text-white">
                      📚 SÁCH VỞ - BÚT MÀU
                    </span>
                    <span className="text-[7.5px] font-bold text-[#15803D]">Truyện Tranh</span>
                  </div>
                  <div className="flex items-end justify-between">
                    {/* Kệ sách & chồng truyện */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-9 w-7 rounded-xs border border-[#15803D] bg-[#BBF7D0] p-0.5 flex flex-col justify-between">
                        <div className="flex gap-0.5 h-3">
                          <span className="h-full w-1 rounded-xs bg-[#EF4444]" />
                          <span className="h-full w-1 rounded-xs bg-[#3B82F6]" />
                          <span className="h-full w-1 rounded-xs bg-[#F59E0B]" />
                          <span className="h-full w-1 rounded-xs bg-[#8B5CF6]" />
                        </div>
                        <div className="h-2 w-full bg-[#86EFAC] rounded-xs flex items-center justify-center">
                          <span className="text-[5.5px] font-bold text-[#14532D]">COMIC</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                        <div className="h-5 w-5 rounded-t bg-[#15803D]" />
                      </div>
                    </div>
                    {yieldPerSec > 0 && (
                      <span className="rounded bg-emerald-100 border border-emerald-500 px-1 py-0.5 text-[8px] font-black text-emerald-800">
                        +{formatRate(yieldPerSec)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* TIỆM SỬA XE & VÁ VỎ (TIRE_SHOP) */}
              {shopType === 'TIRE_SHOP' && (
                <div
                  className="flex h-full w-full flex-col justify-between p-1.5 overflow-hidden"
                  style={{ backgroundColor: isNight ? '#20180F' : '#FFFBEB' }}
                >
                  <div className="flex items-center justify-between border-b border-[#D97706]/30 pb-0.5">
                    <span className="rounded bg-[#D97706] px-1.5 py-0.2 text-[7px] font-black text-white">
                      🔧 VÁ VỎ - BƠM XE
                    </span>
                    <span className="text-[7.5px] font-bold text-[#B45309]">Thay Nhớt</span>
                  </div>
                  <div className="flex items-end justify-between">
                    {/* Chồng lốp xe & Bình nén khí */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col gap-0.5 items-center">
                        <div className="h-2.5 w-6 rounded-full border-2 border-[#1E293B] bg-[#334155]" />
                        <div className="h-2.5 w-6 rounded-full border-2 border-[#1E293B] bg-[#334155]" />
                        <div className="h-2.5 w-6 rounded-full border-2 border-[#1E293B] bg-[#334155]" />
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-[#FDE6D2]" />
                        <div className="h-5 w-5 rounded-t bg-[#D97706]" />
                      </div>
                    </div>
                    {yieldPerSec > 0 && (
                      <span className="rounded bg-emerald-100 border border-emerald-500 px-1 py-0.5 text-[8px] font-black text-emerald-800">
                        +{formatRate(yieldPerSec)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* CÔNG VIÊN CÂY XANH (PARK) */}
              {shopType === 'PARK' && (
                <div
                  className="flex h-full w-full flex-col justify-between p-1.5 overflow-hidden"
                  style={{ backgroundColor: isNight ? '#0C1C13' : '#ECFDF5' }}
                >
                  <div className="flex items-center justify-between border-b border-[#059669]/30 pb-0.5">
                    <span className="rounded bg-[#059669] px-1.5 py-0.2 text-[7px] font-black text-white">
                      🌳 GÓC CÔNG VIÊN
                    </span>
                    <span className="text-[7.5px] font-bold text-[#047857]">Không Khí Sạch</span>
                  </div>
                  <div className="flex items-end justify-between">
                    {/* Ghế đá & Cây rợp bóng */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <div className="flex -space-x-1">
                          <span className="h-4 w-4 rounded-full bg-[#10B981]" />
                          <span className="h-5 w-5 rounded-full bg-[#059669]" />
                        </div>
                        <div className="h-3 w-1.5 bg-[#78350F]" />
                      </div>
                      {/* Ghế đá */}
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-7 rounded-t-xs bg-[#CBD5E1] border border-[#64748B]" />
                        <div className="flex justify-between w-6">
                          <span className="h-2 w-1 bg-[#475569]" />
                          <span className="h-2 w-1 bg-[#475569]" />
                        </div>
                      </div>
                    </div>
                    {yieldPerSec > 0 && (
                      <span className="rounded bg-emerald-100 border border-emerald-500 px-1 py-0.5 text-[8px] font-black text-emerald-800">
                        +{formatRate(yieldPerSec)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* KỲ QUAN & TÒA NHÀ DI SẢN (LANDMARK) */}
              {shopType === 'LANDMARK' && (
                <div
                  className="flex h-full w-full flex-col justify-between p-1.5 overflow-hidden"
                  style={{ backgroundColor: isNight ? '#22190A' : '#FEFCE8' }}
                >
                  <div className="flex items-center justify-between border-b border-[#CA8A04]/30 pb-0.5">
                    <span className="rounded bg-[#B45309] px-1.5 py-0.2 text-[7px] font-black text-amber-100">
                      🏛️ TÒA DI SẢN
                    </span>
                    <span className="text-[7.5px] font-black text-amber-600">★ KỲ QUAN</span>
                  </div>
                  <div className="flex items-end justify-between">
                    {/* Cột trụ cẩm thạch */}
                    <div className="flex items-end gap-1">
                      <div className="h-9 w-2 rounded-t-xs bg-[#E2E8F0] border-x border-[#94A3B8]" />
                      <div className="h-9 w-2 rounded-t-xs bg-[#E2E8F0] border-x border-[#94A3B8]" />
                      <div className="h-9 w-2 rounded-t-xs bg-[#E2E8F0] border-x border-[#94A3B8]" />
                      <div className="flex flex-col items-center ml-1">
                        <Star size={14} className="fill-amber-400 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
                      </div>
                    </div>
                    {yieldPerSec > 0 && (
                      <span className="rounded bg-emerald-100 border border-emerald-500 px-1 py-0.5 text-[8px] font-black text-emerald-800">
                        +{formatRate(yieldPerSec)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Ô ĐẤT TRỐNG / CHƯA MỞ (Empty Lot with Corrugated Tin Fence)
 */
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
      className="relative w-full cursor-pointer transition-transform hover:scale-[1.01]"
      style={{ height: 150 }}
    >
      {/* Đất & Cỏ dại nhú lên */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: 92,
          height: 14,
          backgroundColor: dat,
          backgroundImage: `repeating-linear-gradient(32deg, ${shade(dat, 0.8)} 0 2px, transparent 2px 11px)`,
        }}
      >
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

      {/* Hàng rào tôn cũ */}
      <div
        className="absolute inset-x-0 overflow-hidden rounded-t-sm shadow-md"
        style={{
          bottom: 0,
          height: 92,
          backgroundColor: ton,
          backgroundImage: `repeating-linear-gradient(90deg, ${tonDam} 0 2px, ${ton} 2px 7px, ${shade(ton, 1.08)} 7px 9px, ${ton} 9px 14px)`,
          borderTop: `3px solid ${shade(ton, 1.12)}`,
          borderBottom: `4px solid ${tonDam}`,
        }}
      >
        {/* Vết gỉ sét loang */}
        <span
          className="absolute opacity-50"
          style={{ left: `${8 + (houseNumber * 7) % 60}%`, top: 0, width: 13, height: 34, backgroundColor: gi }}
        />
        <span
          className="absolute opacity-35"
          style={{ left: `${30 + (houseNumber * 11) % 50}%`, bottom: 0, width: 9, height: 26, backgroundColor: gi }}
        />

        {/* Cọc gỗ nhô lên */}
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

      {/* Biển treo trên hàng rào */}
      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: 36 }}>
        <span
          className="whitespace-nowrap rounded-xl border-2 px-3 py-1.5 text-[11px] font-black shadow-lg"
          style={
            unlocked
              ? { backgroundColor: isNight ? '#3B2238' : '#FFFBEB', borderColor: '#D82D8B', color: '#D82D8B' }
              : { backgroundColor: isNight ? '#2E2A22' : '#E3D6B4', borderColor: '#5C4228', color: '#5C4228' }
          }
        >
          {unlocked ? `+ Thuê Khai Trương · Số ${houseNumber}` : `○ Chưa Mở Phố · Số ${houseNumber}`}
        </span>
      </div>
    </div>
  );
}
