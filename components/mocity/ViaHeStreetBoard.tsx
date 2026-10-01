'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Info,
  Layers,
  MessageSquareWarning,
  Plus,
  Star,
  Store,
  X,
} from 'lucide-react';
import { BUILDING_BY_ID } from '@/lib/mocity/mock-city-data';
import { nodeYieldBreakdown } from '@/lib/mocity/city-calculator';
import { formatRate } from '@/lib/mocity/format';
import { claimTapReward, useCity } from '@/lib/mocity/store';
import { EVENT_BY_ID } from '@/lib/mocity/dialogue-data';
import { particles } from './ParticleEngine';
import { useAmbientChatter } from './SpeechBubble';
import ExpressiveStreetCitizens from './ExpressiveStreetCitizens';
import MoMoMascot from './MoMoMascot';
import StreetTraffic from './StreetTraffic';
import ShophouseFacade from './ShophouseFacade';
import { SkyAtmosphere, StreetLamp, TimeOfDaySwitcher, TIME_OF_DAY_META } from './StreetAmbiance';
import { useTrafficController } from './useTrafficController';
import TrafficLightPole from './TrafficLightPole';
import StreetPets from './StreetPets';

/**
 * Do rong mot lot dat tren pho. Moi lot rong 236px. Dung chung giua tinh be
 * rong container va tinh vi tri cuon.
 */
const PLOT_WIDTH = 236;
/** Khoang dem hai ben duong pho. */
const STREET_PADDING = 420;

/** Xu luong "di tuan" cua Thị Trưởng. Han 5 phut. */
const PATROL_BONUS_COINS = 120;
const PATROL_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Giao diện "ĐẾ CHẾ VỈA HÈ — Từ gánh vé số góc ngã tư"
 * Phong cách 2D Illustrated Vietnamese Street Panorama (Dãy nhà ống mặt tiền Đ. Hoa Sữa)
 * - Nhà ống 3 tầng màu Pastel kẻ sọc chéo (Sửa Xe, Tạp Hóa, Văn Phòng Phẩm, Gạo, Trà Sữa, Rạp Phim MoMo, Túi Thần Tài...)
 * - Ô đất chưa xây dựng hiển thị dưới dạng Nhà Ống đóng Cửa Sắt Kéo Xếp Ngang cổ điển + xe máy dựng trong nhà & biển "PHỐ CHƯA MỞ"
 * - Vỉa hè lát gạch vàng ấm, xe bán "VÉ SỐ CƯỜNG - 20 tờ", Thị Trưởng mặc vest xanh vẫy tay, xe Cub xanh, xe đạp, đèn giao thông
 * - Bảng hiệu mái hiên sọc đỏ-trắng "ĐẾ CHẾ VỈA HÈ ✦ Từ gánh vé số góc ngã tư"
 */

interface ShophouseTheme {
  wallBg: string;
  wallHatch: string;
  signBg: string;
  signText: string;
  defaultLabel: string;
  shopType: 'TIRE_SHOP' | 'GROCERY' | 'STATIONERY' | 'RICE_SHOP' | 'CINEMA' | 'FINTECH' | 'CAFE';
}

const SHOPHOUSE_THEMES: ShophouseTheme[] = [
  {
    wallBg: '#EFE8D5',
    wallHatch: '#E2D9C0',
    signBg: '#E6B84F',
    signText: '#FFFFFF',
    defaultLabel: 'SỬA XE',
    shopType: 'TIRE_SHOP',
  },
  {
    wallBg: '#C8D9EC',
    wallHatch: '#B5CBE3',
    signBg: '#D9534F',
    signText: '#FFFFFF',
    defaultLabel: 'TẠP HOÁ',
    shopType: 'GROCERY',
  },
  {
    wallBg: '#EEC7C2',
    wallHatch: '#E2B4AE',
    signBg: '#669977',
    signText: '#FFFFFF',
    defaultLabel: 'VĂN PHÒNG PHẨM',
    shopType: 'STATIONERY',
  },
  {
    wallBg: '#DFC6E8',
    wallHatch: '#D0B2DC',
    signBg: '#D82D8B',
    signText: '#FFFFFF',
    defaultLabel: 'TRÀ SỮA MOMO',
    shopType: 'CAFE',
  },
  {
    wallBg: '#F6E299',
    wallHatch: '#EBD37E',
    signBg: '#7C4DFF',
    signText: '#FFFFFF',
    defaultLabel: 'MOMO CINEMA',
    shopType: 'CINEMA',
  },
  {
    wallBg: '#EFE8D5',
    wallHatch: '#E2D9C0',
    signBg: '#A46A3E',
    signText: '#FFFFFF',
    defaultLabel: 'GẠO TÁM THƠM',
    shopType: 'RICE_SHOP',
  },
  {
    wallBg: '#C9E8D9',
    wallHatch: '#B4DEC9',
    signBg: '#0EA5E9',
    signText: '#FFFFFF',
    defaultLabel: 'TÚI THẦN TÀI',
    shopType: 'FINTECH',
  },
];

export default function ViaHeStreetBoard({
  selected,
  onSelect,
  onOpenRequest,
  onOpenEvent,
  onOpenBuildDrawer,
  onOpenInspector,
  cityScale = 1.12,
  onChangeScale,
  onActiveRowChange,
}: {
  selected: { col: number; row: number } | null;
  onSelect: (col: number, row: number) => void;
  onOpenRequest: (col: number, row: number) => void;
  onOpenEvent?: () => void;
  onOpenBuildDrawer?: () => void;
  onOpenInspector?: () => void;
  cityScale?: number;
  onChangeScale?: (next: number) => void;
  /** Hang pho dang xem, de parent uu tien dung o dat trong hang do. */
  onActiveRowChange?: (row: number) => void;
}) {
  const unlockedCols = useCity((s) => s.unlockedCols);
  const unlockedRows = useCity((s) => s.unlockedRows);
  const buildings = useCity((s) => s.buildings);
  const npcs = useCity((s) => s.npcs);
  const activeRequests = useCity((s) => s.activeRequests);
  const pendingEvent = useCity((s) => s.pendingEvent);
  const timeOfDay = useCity((s) => s.timeOfDay ?? 'DAY');
  const traffic = useTrafficController(timeOfDay);

  const chatter = useAmbientChatter(npcs);

  const [streetToast, setStreetToast] = useState<string | null>(null);
  /**
   * Hang pho dang chinh dien.
   *
   * Truoc day phong toan bo luoi mot luot roi `slice(0, 10)` nen o dat so 11-16
   * (va 17-100 o khi mo rong) bien mat khoi man hinh - nguoi choi xay 16 tiem
   * thi 6 tiem khong thay. Bay gio moi hien MOT hang pho tai mot thoi diem:
   * van du `unlockedCols` o (<= 10) nen DOM khong phong to so voi truoc, va
   * moi o dat deu tim thay duoc.
   */
  const [activeRow, setActiveRow] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);

  /**
   * So o cua mot hang pho (toi da 10) va do rong that cua noi dung.
   * Container cu lay theo gia tri nay thay vi `min-w-[2750px]` cung: khi chi mo
   * 4 cot thi con 1.800px trong voichua - tho khong an gi.
   */
  const plotCount = Math.max(4, unlockedCols);
  const streetWidth = plotCount * PLOT_WIDTH + STREET_PADDING;
  const rowCount = Math.max(1, unlockedRows);

  /**
   * Hang dang xem, da clamp vao [0, rowCount-1].
   *
   * Khong `useEffect` de gan lai state: moi noi dung deu doc `safeRow`, nen khi
   * `activeRow` vuot bien sau khi reset pho thi chi can hien thi hang hop le.
   * Effect o day chi tao them mot vong render khong can thiet.
   */
  const safeRow = Math.min(activeRow, rowCount - 1);

  useEffect(() => {
    onActiveRowChange?.(safeRow);
  }, [safeRow, onActiveRowChange]);

  /**
   * Toa do cuon cua 3 nut: chia deu be rong pho that.
   * Ban cu hardcode 0 / 720 / 1440 cho layout 10 o, nen chi mo 4 cot thi nut
   * "Cuoi Pho" cuon vao khoang trong khong noi gi.
   */
  const [scrollLeft, scrollLabels] = useMemo(() => {
    const seg = plotCount * PLOT_WIDTH;
    return [
      [0, Math.round(seg * 0.4), seg],
      ['Đầu Phố', 'Giữa Phố', 'Cuối Phố'],
    ] as const;
  }, [plotCount]);

  /**
   * Hang nao dang co nguoi dan len giong noi (`!`).
   * Chi tiet chay theo hang trong khi moi hien MOT hang, nen phai danh dau
   * de nguoi choi biet con "Chuyen pho!" o kia duong.
   */
  const rowsWithRequests = useMemo(() => {
    const npcById = new Map(npcs.map((n) => [n.id, n]));
    const buildingById = new Map(buildings.map((b) => [b.id, b]));
    const rows = new Set<number>();
    for (const req of activeRequests) {
      const npc = npcById.get(req.npcId);
      const building = npc ? buildingById.get(npc.buildingId) : undefined;
      if (building) rows.add(building.row);
    }
    return rows;
  }, [activeRequests, npcs, buildings]);

  /** So tiem da xay tren tung hang, hien tren chip dieu huong. */
  const buildingCountByRow = useMemo(() => {
    const counts = new Array<number>(rowCount).fill(0);
    for (const b of buildings) {
      if (b.row >= 0 && b.row < rowCount) counts[b.row] += 1;
    }
    return counts;
  }, [buildings, rowCount]);

  // Chuyển danh sách các ô đất thành một Dãy Nhà Ống Mặt Tiền Phố (Số 2, Số 4, Số 6, Số 8...)
  const streetPlots = useMemo(() => {
    const bMap = new Map(buildings.map((b) => [`${b.col}:${b.row}`, b]));
    const chatterByNpc = new Map(chatter.map((c) => [c.npcId, c.text]));
    const requested = new Set(activeRequests.map((r) => r.npcId));

    const list: Array<{
      index: number;
      houseNumber: number;
      col: number;
      row: number;
      unlocked: boolean;
      node: (typeof buildings)[number] | undefined;
      def: (typeof BUILDING_BY_ID)[string] | undefined;
      theme: ShophouseTheme;
      yieldPerSec: number;
      synergyBonus: number;
      hasRequest: boolean;
      chatterText: string | null;
      npcName: string | null;
      cashOnly: boolean;
    }> = [];

    /**
     * Chi lay MOT hang pho.
     *
     * Khong sap xep lai theo `hasBuilding` nua: truoc day pho duoc xep "tkiem da
     * xay len dau" nen ngay ca 10 o hien thi cung khong dung thu tu khong gian -
     * nha o phai nam dung cho so nha cua o dat. Gio giu nguyen thu tu cot de
     * so nha chay dung chieu ngang.
     *
     * `colCount` toi da 10 nen DOM khong phong to so voi ban cu: 10 o x 178 node.
     */
    const colCount = Math.max(4, unlockedCols);
    const coords: Array<{ col: number; row: number; unlocked: boolean }> = [];
    for (let c = 0; c < colCount; c++) {
      coords.push({ col: c, row: safeRow, unlocked: c < unlockedCols });
    }

    coords.forEach((coord, idx) => {
      const node = bMap.get(`${coord.col}:${coord.row}`);
      const def = node ? BUILDING_BY_ID[node.defId] : undefined;
      const npc = node ? npcs.find((n) => n.buildingId === node.id) : undefined;
      const yInfo = node ? nodeYieldBreakdown(node, buildings) : null;

      let theme = SHOPHOUSE_THEMES[idx % SHOPHOUSE_THEMES.length];
      if (def) {
        if (def.id.includes('rap-phim')) theme = SHOPHOUSE_THEMES[4];
        else if (def.zone === 'FINTECH') theme = SHOPHOUSE_THEMES[6];
        else if (def.id.includes('ca-phe') || def.id.includes('tra-sua')) theme = SHOPHOUSE_THEMES[3];
        else if (def.id.includes('sieu-thi') || def.id.includes('tap-hoa')) theme = SHOPHOUSE_THEMES[1];
      }

      list.push({
        index: idx,
        /**
         * So nha gan voi O DAT, khong phai vi tri hien thi.
         *
         * Truoc day la `(idx + 1) * 2` nen xay them mot tiem o dau danh sach la
         * moi cua hang chuyen dau, so nha cua cac tiem cu bi lech. Danh sach
         * duoc sap `hasBuilding` truoc nen dung vay. Gio gan theo toa do nen
         * so nha cua mot o dat khong bao gio doi.
         */
        houseNumber: coord.col * 2 + coord.row * 20 + 2,
        col: coord.col,
        row: coord.row,
        unlocked: coord.unlocked,
        node,
        def,
        theme,
        yieldPerSec: yInfo?.totalPerSec ?? 0,
        synergyBonus: yInfo?.synergyBonus ?? 0,
        hasRequest: npc ? requested.has(npc.id) : false,
        chatterText: npc ? (chatterByNpc.get(npc.id) ?? null) : null,
        npcName: npc ? npc.name : null,
        cashOnly: npc ? npc.role === 'MERCHANT' && !npc.acceptsDigital : false,
      });
    });

    return list;
  }, [activeRequests, safeRow, buildings, chatter, npcs, unlockedCols]);

  const handleScrollBy = (delta: number) => {
    scrollContainerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleScrollTo = (left: number) => {
    scrollContainerRef.current?.scrollTo({ left, behavior: 'smooth' });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    scrollStartLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    scrollContainerRef.current.scrollLeft = scrollStartLeftRef.current - dx;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  /**
   * Chuyen sang hang pho khac.
   *
   * Tach ra `useCallback` de khong phai truy cap ref ben trong callback inline
   * cua `.map()` - lint React Compiler bao loi do.
   */
  const handleChangeRow = useCallback(
    (row: number) => {
      setActiveRow(row);
      scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
      /*
       * O dang chon thuoc hang khac se khong con nhin thay, nhung `page.tsx` van
       * dung `selected` de dat cong trinh - se dan den xay nham tren o dat khong
       * ai thay. Chon lai o dau tien cua hang moi cho khop man hinh.
       */
      if (selected && selected.row !== row) onSelect(0, row);
    },
    [selected, onSelect],
  );

  const handleClaimPatrolBonus = useCallback(() => {
    // Han 5 phut: day la "di tuan", khong phai nut spam.
    const result = claimTapReward('patrol', PATROL_BONUS_COINS, { cooldownMs: PATROL_COOLDOWN_MS });
    if (!result.ok) {
      setStreetToast('Ông Lộc đầu hẻm: “Thị Trưởng vừa đi tuần xong, nghỉ ngơi đã Thị Trưởng ơi!”');
      setTimeout(() => setStreetToast(null), 4000);
      return;
    }
    const funnyLines = [
      'Trạm Heo Vàng MoCity: “Thị Trưởng vừa đi tuần khích lệ bà con tiểu thương! Nhận ngay +180 XU Lộc Đô Thị!”',
      'Ông Lộc Đầu Tư: “Dòng tiền thanh toán số trên Đại lộ MoMo hôm nay tăng trưởng vượt bậc!” (+180 XU)',
      'Cô Tư Tạp Hóa: “Cả dãy phố quét QR ting ting vui như Tết! Mời Thị Trưởng ly trà tắc!” (+180 XU)',
    ];
    const msg = funnyLines[Math.floor(Math.random() * funnyLines.length)];
    setStreetToast(msg);
    setTimeout(() => setStreetToast(null), 4000);
  }, []);

  // Tự động ẩn bảng hiệu lớn sau khi người chơi bấm vào bất kỳ căn nhà nào
  return (
    <div className="relative h-full w-full overflow-hidden select-none" style={{ backgroundColor: '#EDEAE2' }}>
      {/* CSS Animation cho banner & bang hieu. Phuong tien tu lo keyframes rieng trong StreetTraffic. */}
      <style>{`
        @keyframes viahe-float-banner {
          0%, 100% { transform: translate(-50%, 0px) rotate(-1.2deg); }
          50% { transform: translate(-50%, -5px) rotate(-0.6deg); }
        }
        @keyframes viahe-sag-wobble {
          0%   { transform: translateY(0px) rotate(-4deg); }
          18%  { transform: translateY(5px) rotate(-2.5deg); }
          42%  { transform: translateY(2px) rotate(-5.5deg); }
          65%  { transform: translateY(7px) rotate(-3deg); }
          83%  { transform: translateY(2px) rotate(-4.5deg); }
          100% { transform: translateY(0px) rotate(-4deg); }
        }
        @keyframes viahe-sag-droop {
          0%   { transform: rotate(3deg) translateY(0px); }
          40%  { transform: rotate(5deg) translateY(3px); }
          70%  { transform: rotate(2.5deg) translateY(1px); }
          100% { transform: rotate(3deg) translateY(0px); }
        }
        @keyframes viahe-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      {/* Góc phải trên - đã bỏ nút info */}

      {/* Nút Cuộn Trái / Phải Dọc Theo Đại Lộ MoCity */}
      <button
        type="button"
        onClick={() => handleScrollBy(-360)}
        style={{ backgroundColor: '#FFFDF7' }}
        className="absolute top-1/2 left-2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#4A3B32] bg-[#FFFDF7] text-[#4A3B32] shadow-lg transition-transform hover:scale-110"
        title="Dạo phố sang trái"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => handleScrollBy(360)}
        style={{ backgroundColor: '#FFFDF7' }}
        className="absolute top-1/2 right-2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#4A3B32] bg-[#FFFDF7] text-[#4A3B32] shadow-lg transition-transform hover:scale-110"
        title="Dạo phố sang phải"
      >
        <ChevronRight size={20} />
      </button>

      {/* Thông báo Hài hước khi tương tác với cư dân trên phố */}
      {streetToast && (
        <div
          style={{ backgroundColor: '#FFFDF7' }}
          className="pointer-events-none absolute top-4 left-1/2 z-40 -translate-x-1/2 rounded-2xl border-2 border-[#4A3B32] bg-[#FFFDF7] px-4 py-2 text-xs font-black text-[#4A3B32] shadow-xl"
        >
          {streetToast}
        </div>
      )}

      {/* Nav bar đã xóa */}

      {/* Man nham chuc: WelcomeScreen trong page.tsx la cua duy nhat, board nay chi la phong game. */}

      {/* TOÀN CẢNH DÃY PHỐ NHÀ ỐNG MOCITY (ĐÃ PHÓNG TO RÕ RÀNG, CHIẾM TRỌN MÀN HÌNH) */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative h-full w-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing transition-colors duration-700"
        style={{ backgroundImage: TIME_OF_DAY_META[timeOfDay].skyBg }}
      >
        <div
          className="relative h-full flex flex-col justify-end transition-transform duration-300"
          style={{
            transform: `scale(${cityScale})`,
            transformOrigin: 'bottom left',
            /*
             * `minWidth: 100%` chan khoang trong ben phai. `streetWidth` tinh
             * theo so cot dat da mo, nen luc moi choi (4 cot ~ 1.364px) no hep
             * hon man hinh va phan con lai lo ra nen troi, trong nhu loi render.
             * Via he va long duong deu `w-full` nen chi can noi rong khung la
             * mat dat keo dai het man hinh.
             */
            width: streetWidth,
            minWidth: '100%',
            /*
             * Phuong tien trong StreetTraffic chay bang keyframes toi +-2.240px,
             * vuot ra ngoai `streetWidth` va tu tao them vung cuon rong tenh chi
             * co nen troi - nhin nhu loi render. `clip` cat ngang tai mep pho
             * ma van cho bong thoai cua cu dan tran len tren (khac `hidden`,
             * vi `hidden` se ep truc con lai thanh `auto`).
             */
            overflowX: 'clip',
            overflowY: 'visible',
          }}
        >
          {/* LỚP BẦU TRỜI & KHÍ QUYỂN (MÂY TRỜI BAN NGÀY / TRĂNG SAO BAN ĐÊM) */}
          <SkyAtmosphere timeOfDay={timeOfDay} />

          {/* LỚP 1: CHUNG CƯ CAO TẦNG MỜ XA (SKYLINE PARALLAX LỚN) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[235px] overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 px-8 opacity-80">
              {[
                { w: 96, h: 360, bg: '#CED8E2' },
                { w: 84, h: 295, bg: '#D8E1E9' },
                { w: 112, h: 410, bg: '#C5D1DD' },
                { w: 90, h: 330, bg: '#DCE4EC' },
                { w: 120, h: 390, bg: '#CBD6E2' },
                { w: 88, h: 315, bg: '#D7E0E8' },
                { w: 108, h: 400, bg: '#C6D2DF' },
                { w: 96, h: 345, bg: '#D4DEE7' },
                { w: 116, h: 415, bg: '#C9D5E1' },
                { w: 92, h: 310, bg: '#D9E2EA' },
                { w: 110, h: 380, bg: '#CDD8E3' },
                { w: 100, h: 350, bg: '#D5DFE8' },
              ].map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    width: b.w,
                    height: b.h,
                    backgroundColor: timeOfDay === 'NIGHT' ? '#1E293B' : b.bg,
                  }}
                  className="shrink-0 rounded-t-md border border-slate-400/50 p-2.5 grid grid-cols-3 gap-2 content-start transition-colors duration-500"
                >
                  {Array.from({ length: 21 }).map((_, wi) => {
                    const isLit =
                      timeOfDay === 'NIGHT' &&
                      ((wi + idx * 3) % 4 === 0 || (wi + idx * 7) % 5 === 0);
                    return (
                      <div
                        key={wi}
                        className={`h-3.5 rounded-[1px] transition-colors ${
                          isLit
                            ? (wi + idx) % 2 === 0
                              ? 'bg-amber-300 shadow-[0_0_6px_#FDE047]'
                              : 'bg-sky-300 shadow-[0_0_6px_#38BDF8]'
                            : timeOfDay === 'NIGHT'
                              ? 'bg-slate-700/60'
                              : 'bg-white/70'
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* LỚP 2 & 3: CON HẺM "ĐẠI LỘ MOCITY" BÊN TRÁI + DÃY NHÀ ỐNG MẶT TIỀN 3 TẦNG CỠ LỚN */}
          {/*
           * Khong con marginBottom: 226. Con so do la bu tru thu cong tu hoi
           * via he va long duong bi flex co lai con 34/31px; gio hai lop da
           * shrink-0 va giu dung chieu cao nen margin chi lam day day nha
           * tran khoi dinh khung va tach khoi via he.
           */}
          <div className="relative z-10 flex items-end pl-0 pr-24">
            {/*
             * NGA TU "D. HOA SUA" BEN TRAI.
             *
             * Truoc day khoi nay la "goc nga tu & con hem" - gop hai thu khac
             * nhau. Hem thi ke duoc giua hai nha, con nga tu phai la KHOANG HO
             * de duong nhanh chay lui vao. Ket qua la nha dung chan ngang 108/132px
             * mat cat duong nhanh, trong khi duoi chan van ke vach sang duong va
             * dung den giao thong kieu nga tu.
             *
             * Gio khoang ho rong dung 132px va bat dau tu x=0, trung khit voi
             * dai duong nhanh o lop via he va long duong. Nha lui sang phai
             * thanh nha goc dung canh duong nhanh.
             */}
            <div className="relative mr-4 flex shrink-0 items-end">
              {/* Duong nhanh lui dan vao trong - cac khung long nhau */}
              <div className="relative h-[232px] w-[132px] shrink-0 overflow-hidden" style={{ backgroundColor: '#B9B4A8' }}>
                <div className="absolute inset-x-[9%] bottom-0 top-[16%]" style={{ backgroundColor: '#A49F93' }} />
                <div className="absolute inset-x-[20%] bottom-0 top-[30%]" style={{ backgroundColor: '#8D887D' }} />
                <div className="absolute inset-x-[31%] bottom-0 top-[42%]" style={{ backgroundColor: '#767168' }} />
                <div className="absolute inset-x-[41%] bottom-0 top-[53%]" style={{ backgroundColor: '#605C54' }} />

                {/* Tuong hoi hai ben duong nhanh */}
                <div className="absolute left-0 top-0 h-full w-[9%]" style={{ backgroundColor: '#C9B9A6' }} />
                <div className="absolute right-0 top-0 h-full w-[9%]" style={{ backgroundColor: '#B8A794' }} />

                {/* Tim duong nhanh chay lui */}
                <div className="absolute bottom-2 left-1/2 h-[46%] w-[3px] -translate-x-1/2" style={{ backgroundColor: '#D9B93C' }} />

                {/* Vai nguoi deo khau trang dung dau duong nhanh */}
                <div className="absolute inset-x-0 bottom-2 flex items-end justify-center -space-x-[3px]">
                  {[
                    { body: '#64748B', h: 26 },
                    { body: '#B45309', h: 31 },
                    { body: '#334155', h: 26 },
                  ].map((pr, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="relative h-[14px] w-[14px] rounded-full" style={{ backgroundColor: '#FDE6D2' }}>
                        <div
                          className="absolute inset-x-[12%] bottom-[14%] h-[6px] rounded-[2px]"
                          style={{ backgroundColor: '#7FD4E8' }}
                        />
                      </div>
                      <div className="rounded-t" style={{ height: pr.h, width: 14, backgroundColor: pr.body }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Nha goc dung sat duong nhanh */}
              <div
                className="relative h-[340px] w-[72px] shrink-0 rounded-t p-2 flex flex-col justify-between"
                style={{ backgroundColor: '#E8C2BA' }}
              >
                <div className="absolute inset-y-0 left-0 w-[9px]" style={{ backgroundColor: '#CFA29A' }} />
                <div className="relative h-10 w-full" style={{ backgroundColor: '#FBF5F2' }} />
                <div className="relative h-10 w-full" style={{ backgroundColor: '#FBF5F2' }} />
                <div className="relative h-8 w-full" style={{ backgroundColor: '#E6B84F' }} />
              </div>
            </div>

            {/* DÃY NHÀ ỐNG MẶT TIỀN CỠ LỚN (SỐ 2, SỐ 4, SỐ 6, SỐ 8, SỐ 10...) */}
            <div className="flex items-end">
              {streetPlots.map((plot, idx) => {
                const isSelected =
                  selected?.col === plot.col && selected?.row === plot.row;
                const isBuilt = !!plot.node && !!plot.def;
                const shopTitle = plot.def
                  ? plot.def.shortName.toUpperCase()
                  : plot.unlocked
                    ? 'ĐANG CHO THUÊ'
                    : 'CHƯA MỞ PHỐ';

                return (
                  <div
                    key={`${plot.col}:${plot.row}`}
                    className="relative flex flex-col items-center shrink-0"
                    style={{ width: 236 }}
                  >
                    {/* Dây điện võng giữa các nhà ống */}
                    <svg
                      className="pointer-events-none absolute top-[135px] left-0 z-20 w-full h-10 overflow-visible"
                      viewBox="0 0 236 36"
                    >
                      <path
                        d="M 0 4 Q 118 26 236 4"
                        fill="none"
                        stroke="#3E352F"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M 0 12 Q 118 32 236 12"
                        fill="none"
                        stroke="#3E352F"
                        strokeWidth="1.4"
                      />
                      {/* Chim bồ câu đậu trên dây điện */}
                      {idx % 3 === 0 && (
                        <g transform="translate(140, 10)">
                          <ellipse cx="6" cy="4" rx="4" ry="3" fill="#94A3B8" />
                          <circle cx="9" cy="2.5" r="2" fill="#CBD5E1" />
                          <polygon points="10,2.5 12,3 10,3.5" fill="#F59E0B" />
                        </g>
                      )}
                      {idx % 4 === 1 && (
                        <g transform="translate(70, 7)">
                          <ellipse cx="6" cy="4" rx="4" ry="3" fill="#64748B" />
                          <circle cx="9" cy="2.5" r="2" fill="#94A3B8" />
                          <polygon points="10,2.5 12,3 10,3.5" fill="#F59E0B" />
                        </g>
                      )}
                    </svg>

                    {/* Bong bóng Chuyện Phố (!) hoặc Thoại Tám Chuyện Vỉa Hè trên nóc tiệm */}
                    <div className="mb-2 flex min-h-[36px] flex-col items-center justify-end z-20">
                      {plot.hasRequest ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRequest(plot.col, plot.row);
                          }}
                          className="flex animate-bounce items-center gap-1.5 rounded-full border-2 border-white bg-[#EB2F96] px-3.5 py-1 text-xs font-black text-white shadow-lg"
                        >
                          <MessageSquareWarning size={14} className="shrink-0" />
                          <span>Chuyện phố!</span>
                        </button>
                      ) : plot.chatterText ? (
                        <div className="w-max max-w-[250px] whitespace-normal break-words text-center leading-snug rounded-2xl border-2 border-[#5A4A3F] bg-white px-3 py-1 text-[11px] font-bold text-[#3E2A1B] shadow">
                          “{plot.chatterText}”
                        </div>
                      ) : null}
                    </div>

                    {/* THÂN NHÀ ỐNG 3 TẦNG CỠ LỚN (228PX RỘNG × ~345PX CAO) */}
                    <div
                      onClick={() => {
                        onSelect(plot.col, plot.row);
                      }}
                      className="group relative w-[228px] cursor-pointer transition-all duration-200 hover:-translate-y-2 hover:shadow-[0_12px_24px_rgba(62,42,27,0.22)] active:scale-[0.98]"
                      style={{
                        border: isSelected ? '4px solid #D82D8B' : '2.5px solid #5A4A3F',
                        backgroundColor: plot.theme.wallBg,
                        backgroundImage: `repeating-linear-gradient(-35deg, ${plot.theme.wallHatch} 0px, ${plot.theme.wallHatch} 2px, transparent 2px, transparent 8px)`,
                        boxShadow: isSelected
                          ? '0 0 0 5px rgba(216,45,139,0.35), 0 12px 24px rgba(216,45,139,0.2)'
                          : '0 8px 0 rgba(74,59,50,0.14)',
                      }}
                    >
                      <ShophouseFacade
                        shopType={plot.theme.shopType}
                        houseNumber={plot.houseNumber}
                        shopTitle={isBuilt ? shopTitle : plot.theme.defaultLabel}
                        isBuilt={isBuilt}
                        unlocked={plot.unlocked}
                        level={plot.node?.level}
                        starRating={plot.node?.starRating}
                        yieldPerSec={plot.yieldPerSec}
                        timeOfDay={timeOfDay}
                        wallBg={plot.theme.wallBg}
                        wallHatch={plot.theme.wallHatch}
                        signBg={plot.theme.signBg}
                        onOpenBuild={() => {
                          onSelect(plot.col, plot.row);
                          onOpenBuildDrawer?.();
                        }}
                      />
                    </div>

                    {/*
                     * VAT PHAM VIA HE NGAY TRUOC CUA NHA.
                     * Dai nay truoc day trong suot nen dan cao oc parallax o xa
                     * lot qua, nhin nhu co nha chot giua chan tiem va via he.
                     * No thuc chat la phan via he sat cua tiem nen phai to cung
                     * mau mat via he, cong mot dai dam lam bac them.
                     */}
                    <div
                      className="relative h-12 w-full flex items-end justify-center"
                      style={{ backgroundColor: '#D9BE8C' }}
                    >
                      <div className="absolute inset-x-0 top-0 h-[5px]" style={{ backgroundColor: '#B2924F' }} />
                      {/* Trước tiệm Số 2: Quầy "TRẠM LỘC MOMO" & Thị Trưởng vẫy tay */}
                      {idx === 0 && (
                        <button
                          type="button"
                          onClick={handleClaimPatrolBonus}
                          className="absolute -bottom-6 left-2 z-20 flex items-end gap-1.5 group"
                          title="Bấm để nhận Lộc Đi Tuần MoCity (+180 XU)"
                        >
                          {/* Nhân vật Thị Trưởng mặc vest xanh vẫy tay */}
                          <div
                            style={{ animation: 'viahe-bob 2.2s ease-in-out infinite' }}
                            className="flex flex-col items-center"
                          >
                            <div className="h-5 w-5 rounded-full border-2 border-[#3E2A1B] bg-[#FDE6D2]" />
                            <div className="h-7 w-5 rounded-t border-2 border-[#3E2A1B] bg-[#2B4368] flex justify-center">
                              <div className="h-3.5 w-1 bg-[#D82D8B]" />
                            </div>
                          </div>

                          {/* Quầy "TRẠM LỘC MOMO" */}
                          <div className="flex flex-col items-center">
                            <span className="mb-0.5 rounded bg-white/90 px-1 text-[8px] font-black text-[#D82D8B] shadow">
                              +180 XU
                            </span>
                            <div className="h-4 w-12 border-2 border-[#3E2A1B] bg-[#FDF2F8] flex justify-around items-center px-0.5">
                              <span className="h-2.5 w-2 bg-[#D82D8B]" />
                              <span className="h-2.5 w-2 bg-[#F59E0B]" />
                              <span className="h-2.5 w-2 bg-[#3B82F6]" />
                            </div>
                            <div className="h-6 w-12 border-2 border-t-0 border-[#3E2A1B] bg-[#D82D8B] flex items-center justify-center group-hover:bg-[#EB2F96]">
                              <span className="text-[7px] font-black text-white tracking-tighter">
                                LỘC MOMO
                              </span>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Nếu ô đất chưa xây: Đặt biển vàng "PHỐ CHƯA MỞ" & Rào chắn sọc đỏ trắng */}
                      {!isBuilt && idx === 3 && (
                        <div className="absolute -bottom-7 left-3 z-20 flex items-end gap-1">
                          <div className="rotate-[-6deg] rounded border-2 border-[#5A4A3F] bg-[#FACC15] px-2 py-0.5 text-[8px] font-black text-[#3E2A1B] shadow">
                            PHỐ CHƯA MỞ
                          </div>
                        </div>
                      )}

                      {/* Cây vỉa hè tán tròn xanh mát giữa các nhà ống */}
                      {idx % 2 === 1 && (
                        <div className="pointer-events-none absolute -right-5 -bottom-3 z-20 flex flex-col items-center">
                          <div
                            className="h-14 w-14 rounded-full border-2 border-[#3E2A1B] shadow"
                            style={{
                              backgroundColor: '#689F4D',
                              backgroundImage:
                                'repeating-linear-gradient(-35deg, #55873D 0px, #55873D 2px, transparent 2px, transparent 6px)',
                            }}
                          />
                          <div className="h-12 w-2.5 border-x border-[#3E2A1B] bg-[#78533D]" />
                          <div className="h-2 w-7 border border-[#3E2A1B] bg-[#D6CEBF]" />
                        </div>
                      )}

                      {/* Cột đèn đường cổ điển vỉa hè phát sáng rực rỡ vào hoàng hôn & ban đêm */}
                      {idx % 2 === 0 && (
                        <StreetLamp
                          timeOfDay={timeOfDay}
                          lit={traffic.streetLightsLit}
                          style={{ right: -8, bottom: -12 }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/*
           * LOP 4: VIA HE - cut paper, dong bo voi nhan vat.
           * Khong dung gradient/luoi ke: mat via he la MOT mang phang, cac vien
           * gach la nhung dai giay phang chong len nhau.
           * Xe co KHONG chay o lop nay, tat ca nam duoi LOP 5 long duong.
           */}
          <div
            className="relative z-20 h-[150px] w-full shrink-0"
            style={{
              backgroundColor: '#D9BE8C',
              backgroundImage: `
                repeating-linear-gradient(90deg, #C6A871 0 2px, transparent 2px 46px),
                repeating-linear-gradient(0deg, #C6A871 0 2px, transparent 2px 46px)
              `,
            }}
          >
            {/* Vien giap nha - hai dai giay chong */}
            <div className="absolute inset-x-0 top-0 h-[9px]" style={{ backgroundColor: '#B2924F' }} />
            <div className="absolute inset-x-0 top-[9px] h-[3px]" style={{ backgroundColor: '#E6D2A8' }} />

            {/* Dai hoa van retro giua via he - hinh thoi gach bong */}
            <div className="absolute inset-x-0 top-[22px] h-[18px] overflow-hidden" style={{ backgroundColor: '#CDAE77' }}>
              <div className="flex h-full items-center gap-[26px] pl-3">
                {Array.from({ length: 90 }).map((_, i) => (
                  <span key={i} className="h-[11px] w-[11px] shrink-0 rotate-45" style={{ backgroundColor: i % 2 ? '#A8864A' : '#E6D2A8' }} />
                ))}
              </div>
            </div>
            <div className="absolute inset-x-0 top-[40px] h-[3px]" style={{ backgroundColor: '#B2924F' }} />

            {/* Bo via - ba lop giay, lop duoi dam nhat lam chan via */}
            <div className="absolute inset-x-0 bottom-[11px] h-[11px]" style={{ backgroundColor: '#E6D2A8' }} />
            <div className="absolute inset-x-0 bottom-[6px] h-[6px]" style={{ backgroundColor: '#C09A58' }} />
            <div className="absolute inset-x-0 bottom-0 h-[6px]" style={{ backgroundColor: '#90703A' }} />

            {/* Nga tu: mang nhua phang cat ngang via he */}
            <div className="absolute inset-y-0 left-0 w-[132px]" style={{ backgroundColor: '#BFBAAC' }} />
            <div className="absolute inset-y-0 left-[132px] w-[4px]" style={{ backgroundColor: '#9C8F74' }} />

            {/* Cột đèn giao thông ngã tư tương tác: đếm ngược LED, 3 mắt đèn rực rỡ, tín hiệu người đi bộ */}
            <TrafficLightPole
              phase={traffic.phase}
              countdown={traffic.countdown}
              onClick={() => {
                traffic.switchPhase();
                setStreetToast('🚦 Thị Trưởng đã đổi tín hiệu đèn ngã tư!');
                setTimeout(() => setStreetToast(null), 3000);
              }}
              style={{ left: 104, bottom: 6 }}
            />

            {/* Bien ten duong - hai lop giay thay cho vien */}
            <div className="pointer-events-none absolute bottom-[86px] left-[140px]">
              <div className="px-[3px] py-[2px]" style={{ backgroundColor: '#0E2F6E' }}>
                <div className="px-1.5 py-0.5" style={{ backgroundColor: '#1848A8' }}>
                  <span className="text-[9px] font-bold leading-tight tracking-wide text-white">Đ. Hoa Sữa</span>
                </div>
              </div>
            </div>

            {/* Cot dien ben phai - mang phang, day dien la dai manh */}
            <div className="pointer-events-none absolute bottom-[6px] right-[60px] z-10">
              <svg width="28" height="115" viewBox="0 0 28 115" overflow="visible">
                <path d="M3 20 Q-60 30 -140 45" fill="none" stroke="#4A4038" strokeWidth="1.5" />
                <path d="M25 20 Q-40 28 -140 38" fill="none" stroke="#4A4038" strokeWidth="1.5" />
                <path d="M6 41.5 Q-50 50 -140 62" fill="none" stroke="#4A4038" strokeWidth="1.2" />
                <path d="M22 41.5 Q-30 48 -140 55" fill="none" stroke="#4A4038" strokeWidth="1.2" />
                <rect x="11" y="0" width="6" height="112" fill="#6B523A" />
                <rect x="11" y="0" width="2.4" height="112" fill="#8A6B4C" />
                <rect x="0" y="18" width="28" height="4" fill="#5A4830" />
                <rect x="4" y="40" width="20" height="3" fill="#5A4830" />
                <ellipse cx="3" cy="20" rx="3" ry="4" fill="#E8E0D0" />
                <ellipse cx="25" cy="20" rx="3" ry="4" fill="#E8E0D0" />
                <ellipse cx="6" cy="41.5" rx="2.5" ry="3.5" fill="#E8E0D0" />
                <ellipse cx="22" cy="41.5" rx="2.5" ry="3.5" fill="#E8E0D0" />
                {(timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET') && (
                  <circle cx="14" cy="8" r="6" fill="#FEF08A" />
                )}
              </svg>
            </div>

            {/* Thung rac - mang phang, nap la dai giay dam */}
            <div className="pointer-events-none absolute bottom-[14px] left-[340px]">
              <div className="h-[9px] w-[26px]" style={{ backgroundColor: '#1F5E23' }} />
              <div className="h-[26px] w-[24px] translate-x-[1px]" style={{ backgroundColor: '#2E7D32' }} />
            </div>
            {/* Tru cuu hoa */}
            <div className="pointer-events-none absolute bottom-[14px] left-[840px]">
              <div className="mx-auto h-[7px] w-[18px] rounded-t-full" style={{ backgroundColor: '#991B1B' }} />
              <div className="h-[24px] w-[18px]" style={{ backgroundColor: '#DC2626' }} />
              <div className="h-[5px] w-[24px] -translate-x-[3px]" style={{ backgroundColor: '#991B1B' }} />
            </div>
            <div className="pointer-events-none absolute bottom-[14px] left-[1320px]">
              <div className="h-[9px] w-[26px]" style={{ backgroundColor: '#1F5E23' }} />
              <div className="h-[26px] w-[24px] translate-x-[1px]" style={{ backgroundColor: '#2E7D32' }} />
            </div>

            {/* HỆ THỐNG CỘT ĐÈN ĐƯỜNG CỔ ĐIỂN DỌC VỈA HÈ (Chiếu sáng ấm áp xuống vỉa hè & mặt đường) */}
            {[260, 680, 1100, 1520, 1940, 2360]
              .filter((x) => x < streetWidth - 60)
              .map((lampX, li) => (
                <StreetLamp
                  key={`curb-lamp-${li}`}
                  timeOfDay={timeOfDay}
                  lit={traffic.streetLightsLit}
                  onToggle={() => {
                    const next = traffic.toggleStreetLights();
                    setStreetToast(
                      next
                        ? '💡 Đã bật đèn đường vàng ấm áp cho toàn khu phố!'
                        : '🌙 Đã tắt đèn đường để tiết kiệm điện!',
                    );
                    setTimeout(() => setStreetToast(null), 3000);
                  }}
                  style={{ left: lampX, bottom: 8 }}
                />
              ))}

            {/* HỆ THỐNG THÚ CƯNG VỈA HÈ (PETS OF MOCITY) */}
            <StreetPets
              timeOfDay={timeOfDay}
              streetWidth={streetWidth}
              onPetReward={(msg) => {
                setStreetToast(msg);
                setTimeout(() => setStreetToast(null), 4000);
              }}
            />

            {/* HỆ THỐNG CƯ DÂN ĐI BỘ */}
            <ExpressiveStreetCitizens
              streetWidth={streetWidth}
              onCitizenReward={(msg) => {
                setStreetToast(msg);
                setTimeout(() => setStreetToast(null), 4000);
              }}
            />

            {/* MOMO MASCOT */}
            <MoMoMascot
              streetWidth={streetWidth}
              onToast={(msg) => {
                setStreetToast(msg);
                setTimeout(() => setStreetToast(null), 5000);
              }}
            />

          </div>

          {/*
           * LOP 5: LONG DUONG - cut paper. Mat duong la mot mang phang, vach ke
           * la nhung dai giay phang. Moi phuong tien deu chay o lop nay.
           */}
          <div className="relative z-10 h-[128px] w-full shrink-0" style={{ backgroundColor: '#B5B0A4' }}>
            {/* Dai giay dam sat chan bo via - bong do cua via he xuong duong */}
            <div className="absolute inset-x-0 top-0 h-[6px]" style={{ backgroundColor: '#97927F' }} />

            {/* Nga tu ben trai */}
            <div className="absolute inset-y-0 left-0 w-[132px]" style={{ backgroundColor: '#A5A094' }} />
            <div className="absolute inset-y-0 left-[132px] w-[4px]" style={{ backgroundColor: '#8A8574' }} />

            {/* Vach qua duong tai nga tu */}
            <div className="absolute top-[10px] bottom-[10px] left-[16px] flex w-[100px] flex-col justify-between">
              {Array.from({ length: 5 }).map((_, zi) => (
                <div key={zi} className="h-[9px] w-full" style={{ backgroundColor: '#E8E4DC' }} />
              ))}
            </div>

            {/* Tim duong vang - dai giay dut quang */}
            <div className="absolute top-[63px] left-[150px] right-0 flex h-[4px] gap-[26px] overflow-hidden">
              {Array.from({ length: 24 }).map((_, di) => (
                <div key={di} className="h-full w-[48px] shrink-0" style={{ backgroundColor: '#D9B93C' }} />
              ))}
            </div>

            <StreetTraffic
              timeOfDay={timeOfDay}
              trafficPhase={traffic.phase}
              streetLightsLit={traffic.streetLightsLit}
              roadWidth={streetWidth}
              onPoliceClick={() => {
                const result = claimTapReward('patrol', 100, { cooldownMs: 1500 });
                if (result.ok) {
                  setStreetToast('🚓 Xe Cảnh Sát MoCity: “Tình hình trật tự 10/10! Bà con yên tâm quét mã buôn bán!” (+100 Xu)');
                } else {
                  setStreetToast('🚓 Xe Cảnh Sát MoCity: “Xe đang tuần tra ngã tư trung tâm, chúc Thị Trưởng một ngày bình an!”');
                }
                setTimeout(() => setStreetToast(null), 4000);
              }}
            />
          </div>

          {/*
           * Dai nhua tron duoi cung. Dock hanh dong la overlay `absolute bottom-3`
           * nen no che mat ~70px day man hinh; neu khong co dai nay thi vach qua
           * duong, tim duong va ca hai xe deu nam khuat sau dock.
           */}
          <div className="h-[70px] w-full shrink-0" style={{ backgroundColor: '#A8A396' }} />
        </div>
      </div>
    </div>
  );
}
