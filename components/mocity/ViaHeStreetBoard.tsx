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
import ShophouseFacade from './ShophouseFacade';
import { SkyAtmosphere, StreetLamp, TimeOfDaySwitcher, TIME_OF_DAY_META } from './StreetAmbiance';

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
  isPlaying = false,
  onEnterGame,
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
  isPlaying?: boolean;
  onEnterGame?: () => void;
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

  // Man nham chuc da chuyen sang WelcomeScreen, board chi con phong game.
  const showSplashBanner = !isPlaying;

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
  useEffect(() => {
    if (selected && isPlaying === false) {
      onEnterGame?.();
    }
  }, [selected, isPlaying, onEnterGame]);

  return (
    <div className="relative h-full w-full overflow-hidden select-none" style={{ background: '#EDEAE2' }}>
      {/* CSS Animation cho Xe Cub, Xe Đạp & Người đi bộ trên phố */}
      <style>{`
        @keyframes viahe-scooter-ride {
          0% { transform: translateX(-180px); }
          100% { transform: translateX(2100px); }
        }
        @keyframes viahe-bike-ride {
          0% { transform: translateX(2050px) scaleX(-1); }
          100% { transform: translateX(-220px) scaleX(-1); }
        }
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

      {/* Bảng Hiệu "MOCITY" Góc Phải Trên - đã bỏ nút tắt tiếng */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEnterGame?.()}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#D5CEBF] bg-[#FAF6ED] text-[#5C4332] shadow-md transition-transform hover:scale-105"
          title="Hiện / Ẩn Bảng Hiệu Đô Thị MoCity"
        >
          <Info size={18} className="shrink-0" />
        </button>
      </div>

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

      {/* THANH LA BÀN CHUYỂN NHANH DÃY PHỐ (CHỈ HIỆN SAU KHI VÀO GAME QUẢN LÝ) */}
      {!showSplashBanner && (() => {
        const tutorialDone = buildings.length > 0 && buildings.some((b) => (b.modules ?? []).length > 0) && buildings.length >= 2;
        const tutorialStep = buildings.length === 0 ? 1 : !buildings.some((b) => (b.modules ?? []).length > 0) ? 2 : 3;
        return (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex flex-col items-center gap-1.5 px-3">
          <div
            style={{ backgroundColor: '#FFFDF7' }}
            className="pointer-events-auto flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border-2 border-[#78533D] bg-[#FFFDF7] px-4 py-2 shadow-[0_8px_24px_rgba(62,42,27,0.22)] max-w-[880px] w-full"
          >
            {!tutorialDone && (
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#D82D8B] text-xs font-black text-white shadow-sm">
                  {tutorialStep}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-black text-[#3E2A1B]">
                    {tutorialStep === 1
                      ? 'Mục tiêu 1/3: Bấm vào căn Nhà Ống đóng Cửa Sắt Kéo để Khai Trương Tiệm Đầu Tiên!'
                      : tutorialStep === 2
                        ? 'Mục tiêu 2/3: Bấm vào tiệm đang mở → chọn Quản Lý Tiệm để lắp Loa Thần Tài QR (+25% XU/s)!'
                        : 'Mục tiêu 3/3: Mở thêm tiệm liền kề (Rạp Phim MoMo, Túi Thần Tài) để kích hoạt Combo Quy Hoạch!'}
                  </p>
                </div>
              </div>
            )}

            {/* Chuyển hàng phố: mỗi hàng là một dải nhà ống riêng */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl border-2 border-[#D5CEBF] bg-[#FAF6ED] p-0.5">
              <span className="px-1 text-[10px] font-black uppercase text-[#8B7355]">Phố</span>
              {Array.from({ length: rowCount }, (_, r) => {
                const isActive = r === safeRow;
                const alert = rowsWithRequests.has(r);
                const count = buildingCountByRow[r] ?? 0;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleChangeRow(r)}
                    aria-current={isActive ? 'true' : undefined}
                    title={`Phố hàng ${r + 1}${count > 0 ? ` - ${count} tiệm` : ' - trống'}`}
                    className={`relative min-w-[26px] rounded-lg px-1.5 py-1 text-[11px] font-black transition-colors ${
                      isActive
                        ? 'bg-[#D82D8B] text-white'
                        : 'text-[#5C4332] hover:bg-[#FDF2F8] hover:text-[#D82D8B]'
                    }`}
                  >
                    {r + 1}
                    {alert && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#EB2F96] px-0.5 text-[9px] font-black text-white ring-2 ring-[#FAF6ED]">
                        !
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {buildings.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const firstEmpty = streetPlots.find((p) => !p.node && p.unlocked);
                    if (firstEmpty) {
                      onSelect(firstEmpty.col, firstEmpty.row);
                      onOpenBuildDrawer?.();
                    }
                  }}
                  className="shrink-0 rounded-xl bg-[#D82D8B] px-3.5 py-1.5 text-xs font-black text-white shadow hover:bg-[#EB2F96]"
                >
                  + Mở Tiệm Đầu Tiên
                </button>
              ) : (
                <>
                  {/*
                   * Viet tay 3 nut thay vi `.map()`: React Compiler khong chung
                   * minh ro callback trong `.map()` la event handler nen bao loi
                   * "Cannot access refs during render".
                   * Toa do lay tu `scrollLeft` nen khong hardcode nhu ban cu.
                   */}
                  <button
                    type="button"
                    onClick={() => handleScrollTo(scrollLeft[0])}
                    className="rounded-xl border-2 border-[#D5CEBF] bg-[#FAF6ED] px-2.5 py-1 text-[11px] font-black text-[#5C4332] hover:border-[#D82D8B] hover:text-[#D82D8B]"
                  >
                    {scrollLabels[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollTo(scrollLeft[1])}
                    className="rounded-xl border-2 border-[#D5CEBF] bg-[#FAF6ED] px-2.5 py-1 text-[11px] font-black text-[#5C4332] hover:border-[#D82D8B] hover:text-[#D82D8B]"
                  >
                    {scrollLabels[1]}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollTo(scrollLeft[2])}
                    className="rounded-xl border-2 border-[#D5CEBF] bg-[#FAF6ED] px-2.5 py-1 text-[11px] font-black text-[#5C4332] hover:border-[#D82D8B] hover:text-[#D82D8B]"
                  >
                    {scrollLabels[2]}
                  </button>
                </>
              )}

              {/* Nút chuyển đổi Ngày / Hoàng Hôn / Đêm Phố */}
              <TimeOfDaySwitcher />

              {/* Nút phóng to / thu nhỏ tỷ lệ Phố (100% / 115% / 128%) */}
              {onChangeScale && (
                <button
                  type="button"
                  onClick={() => {
                    const next = cityScale < 1.1 ? 1.14 : cityScale < 1.22 ? 1.26 : 1.0;
                    onChangeScale(next);
                  }}
                  className="rounded-xl border-2 border-[#C9A227] bg-[#FFF8E7] px-2.5 py-1 text-[11px] font-black text-[#6E4F3A] hover:bg-[#FDE68A]"
                  title="Đổi kích thước hiển thị khu phố"
                >
                  Phố {Math.round(cityScale * 100)}%
                </button>
              )}
            </div>
          </div>

          {/* Thanh Thông Báo Chuyện Phố / Sự Kiện Cần Thị Trưởng Phân Xử */}
          {pendingEvent && EVENT_BY_ID[pendingEvent.scriptId] && (
            <div
              onClick={() => {
                onOpenEvent?.();
              }}
              className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border-2 border-[#D82D8B] bg-gradient-to-r from-[#FFF0F5] via-white to-[#FCE7F3] px-4 py-2.5 shadow-[0_10px_25px_rgba(216,45,139,0.28)] max-w-[880px] w-full cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] animate-bounce"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D82D8B] text-white shadow-md">
                  <MessageSquareWarning size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#D82D8B] px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
                      Chuyện Phố Cần Thị Trưởng Phân Xử!
                    </span>
                    <span className="text-[11px] font-bold text-[#D82D8B] hidden sm:inline">
                      • {EVENT_BY_ID[pendingEvent.scriptId].speaker}
                    </span>
                  </div>
                  <p className="truncate text-xs sm:text-sm font-black text-[#1C171A]">
                    {EVENT_BY_ID[pendingEvent.scriptId].title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEvent?.();
                }}
                className="shrink-0 flex items-center gap-1 rounded-xl bg-[#D82D8B] px-3.5 py-1.5 text-xs font-black text-white shadow hover:bg-[#EB2F96] active:scale-95"
              >
                <span>Phân Xử Ngay</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
        );
      })()}

      {/*
       * Da bo man nhac chuc trung lap.
       *
       * Ton tai mot man nham chuc thu hai o day, hien cung luc voi
       * `WelcomeScreen` o `app/mocity/page.tsx` vi ca hai cung gate bang `!isPlaying`.
       * Man cu con ghi sai 'Dang Nhap' va '+1.000.000 XU Von' sau khi doi kinh te.
       * Cong vien chung: `WelcomeScreen` la cua duy nhat.
       */}

      {/* TOÀN CẢNH DÃY PHỐ NHÀ ỐNG MOCITY (ĐÃ PHÓNG TO RÕ RÀNG, CHIẾM TRỌN MÀN HÌNH) */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative h-full w-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing transition-colors duration-700"
        style={{ background: TIME_OF_DAY_META[timeOfDay].skyBg }}
      >
        <div
          className="relative h-full flex flex-col justify-end transition-transform duration-300"
          style={{
            transform: `scale(${cityScale})`,
            transformOrigin: 'bottom left',
            width: streetWidth,
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
                    background: timeOfDay === 'NIGHT' ? '#1E293B' : b.bg,
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
          <div className="relative z-10 flex items-end pl-6 pr-24" style={{ marginBottom: 226 }}>
            {/* GÓC NGÃ TƯ & CON HẺM "Đ. MOCITY" BÊN TRÁI */}
            <div className="relative mr-4 flex w-[210px] shrink-0 flex-col items-center justify-end">
              <div className="flex w-full items-end justify-between">
                <div className="h-[340px] w-[72px] rounded-t border-2 border-[#5A4A3F] bg-[#E8C2BA] p-2 flex flex-col justify-between">
                  <div className="h-10 w-full border border-[#5A4A3F] bg-white/80" />
                  <div className="h-10 w-full border border-[#5A4A3F] bg-white/80" />
                  <div className="h-8 w-full bg-[#E6B84F] border border-[#5A4A3F]" />
                </div>

                {/* Lòng hẻm sâu hun hút */}
                <div className="relative h-[200px] flex-1 bg-[#8C8881] border-x-2 border-[#5A4A3F] flex flex-col justify-end items-center pb-3">
                  <div className="h-24 w-9 bg-[#F5DE93] border border-[#5A4A3F] mb-auto mt-3 opacity-85" />
                  <div className="flex items-end -space-x-1.5 mb-1 scale-110">
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-[#3E2A1B] bg-[#FDE6D2] flex items-end justify-center">
                        <div className="h-1.5 w-3 bg-[#67E8F9] rounded-sm" />
                      </div>
                      <div className="h-7 w-4 rounded-t bg-[#64748B] border border-[#3E2A1B]" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-[#3E2A1B] bg-[#FDE6D2] flex items-end justify-center">
                        <div className="h-1.5 w-3 bg-[#67E8F9] rounded-sm" />
                      </div>
                      <div className="h-8 w-4 rounded-t bg-[#B45309] border border-[#3E2A1B]" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full border border-[#3E2A1B] bg-[#FDE6D2] flex items-end justify-center">
                        <div className="h-1.5 w-3 bg-[#67E8F9] rounded-sm" />
                      </div>
                      <div className="h-7 w-4 rounded-t bg-[#334155] border border-[#3E2A1B]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Biển tên đường "Đ. MoCity" & Cột Đèn Giao Thông Xanh Đỏ */}
              <div className="absolute -bottom-16 left-2 z-20 flex items-end gap-7">
                <div className="flex flex-col items-center">
                  <div className="rounded-md border-2 border-white bg-[#2563EB] px-2.5 py-1 text-xs font-black text-white shadow">
                    Đ. MoCity
                  </div>
                  <div className="h-14 w-1.5 bg-[#64748B]" />
                </div>

                {/* Cột đèn giao thông */}
                <div className="flex flex-col items-center">
                  <div className="flex flex-col gap-1 rounded-full border-2 border-[#3E2A1B] bg-[#334155] p-1.5 shadow">
                    <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
                    <span className="h-3 w-3 rounded-full bg-[#F59E0B]/40" />
                    <span className="h-3 w-3 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="h-14 w-1.5 bg-[#475569]" />
                </div>
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
                        <div className="max-w-[220px] truncate rounded-2xl border-2 border-[#5A4A3F] bg-white px-3 py-1 text-[11px] font-bold text-[#3E2A1B] shadow">
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

                    {/* VẬT PHẨM VỈA HÈ NGAY TRƯỚC CỬA NHÀ (TỦ VÉ SỐ CƯỜNG, BIỂN PHỐ CHƯA MỞ, CÂY XANH) */}
                    <div className="relative h-12 w-full flex items-end justify-center">
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
                          style={{ right: -8, bottom: -12 }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LỚP 4: VỈA HÈ LÁT GẠCH VÀNG ẤM (SIDEWALK) + DÀN NHÂN VẬT BIỂU CẢM TỰ NHIÊN ĐI LẠI */}
          <div
            className="relative z-20 h-[116px] w-full border-t-[3px] border-b-[6px] border-[#6E5D4F]"
            style={{
              backgroundColor: '#F3DFC1',
              backgroundImage: `
                linear-gradient(to right, rgba(120,83,61,0.14) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(120,83,61,0.14) 1px, transparent 1px)
              `,
              backgroundSize: '42px 28px',
            }}
          >
            {/* Thùng rác xanh & Trụ cứu hỏa đỏ trên vỉa hè */}
            <div className="absolute bottom-2.5 left-[340px] h-8 w-6 rounded-t border-2 border-[#3E2A1B] bg-[#2E7D32]" />
            <div className="absolute bottom-3.5 left-[840px] h-8 w-5 rounded-t-full border-2 border-[#3E2A1B] bg-[#DC2626]" />
            <div className="absolute bottom-2.5 left-[1320px] h-8 w-6 rounded-t border-2 border-[#3E2A1B] bg-[#2E7D32]" />

            {/* HỆ THỐNG CƯ DÂN ĐI BỘ TỰ ĐỘNG VỚI BIỂU CẢM KHUÔN MẶT SỐNG ĐỘNG */}
            <ExpressiveStreetCitizens
              onCitizenReward={(msg) => {
                setStreetToast(msg);
                setTimeout(() => setStreetToast(null), 4000);
              }}
            />

            {/* MOMO MASCOT - NPC đặc biệt đi vòng vòng show khuyến mãi */}
            <MoMoMascot
              onToast={(msg) => {
                setStreetToast(msg);
                setTimeout(() => setStreetToast(null), 5000);
              }}
            />

            {/* Thanh niên đội mũ bảo hiểm vàng chạy xe Honda Cub xanh dương dọc vỉa hè */}
            <div
              style={{ animation: 'viahe-scooter-ride 24s linear infinite' }}
              className="pointer-events-none absolute bottom-2 left-0 z-30 flex flex-col items-center scale-110"
            >
              <svg width="68" height="62" viewBox="0 0 68 62" className="overflow-visible">
                <ellipse cx="34" cy="58" rx="22" ry="3.5" fill="rgba(62,42,27,0.22)" />
                {/* Bánh sau & Bánh trước */}
                <circle cx="18" cy="50" r="8" fill="#334155" stroke="#3E2A1B" strokeWidth="2" />
                <circle cx="18" cy="50" r="4" fill="#F8FAFC" stroke="#3E2A1B" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="8" fill="#334155" stroke="#3E2A1B" strokeWidth="2" />
                <circle cx="50" cy="50" r="4" fill="#F8FAFC" stroke="#3E2A1B" strokeWidth="1.5" />
                {/* Khung xe Honda Cub xanh dương */}
                <path
                  d="M 14 48 L 28 36 L 44 46 L 52 32 L 45 32"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="16" y="34" width="16" height="6" rx="3" fill="#1E293B" stroke="#3E2A1B" strokeWidth="1.6" />
                <rect x="24" y="21" width="12" height="15" rx="4" fill="#67E8F9" stroke="#3E2A1B" strokeWidth="1.8" />
                <line x1="34" y1="25" x2="46" y2="31" stroke="#FDE6D2" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="31" cy="13" r="8.5" fill="#FDE6D2" stroke="#3E2A1B" strokeWidth="1.8" />
                <path d="M 32 12 Q 34 9.5 36 12" fill="none" stroke="#3E2A1B" strokeWidth="1.6" strokeLinecap="round" />
                <ellipse cx="35" cy="14.5" rx="1.8" ry="1" fill="#F472B6" opacity="0.65" />
                <path d="M 32 16 Q 34.5 18 36.5 16" fill="none" stroke="#3E2A1B" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 22 12 C 22 3 40 3 40 12 Z" fill="#FACC15" stroke="#3E2A1B" strokeWidth="1.8" />
                {/* Đèn pha xe máy rọi sáng vỉa hè ban đêm */}
                {(timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET') && (
                  <polygon
                    points="54,32 150,12 150,58"
                    fill="rgba(254, 240, 138, 0.45)"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* LỚP 5: LÒNG ĐƯỜNG NHỰA XÁM & VẠCH QUA ĐƯỜNG (ASPHALT STREET) */}
          <div
            className="relative z-10 h-[110px] w-full flex flex-col justify-between py-3"
            style={{ background: '#7C7974' }}
          >
            {/* Vạch kẻ qua đường Zebra Crossing ngay ngã tư Đ. Hoa Sữa */}
            <div className="absolute top-2 bottom-2 left-[125px] flex w-16 flex-col justify-between">
              {Array.from({ length: 5 }).map((_, zi) => (
                <div key={zi} className="h-2.5 w-full bg-[#ECE8DF]" />
              ))}
            </div>

            {/* Vạch đứt nét trắng giữa đường */}
            <div className="mt-auto mb-3 flex w-full justify-around px-12">
              {Array.from({ length: 16 }).map((_, di) => (
                <div key={di} className="h-2 w-14 rounded-full bg-[#ECE8DF]" />
              ))}
            </div>

            {/* Cô gái buộc tóc búi cao đạp xe đạp dưới lòng đường (Biểu cảm tươi tắn) */}
            <div
              style={{ animation: 'viahe-bike-ride 29s linear infinite' }}
              className="pointer-events-none absolute bottom-3 left-0 flex flex-col items-center"
            >
              <svg width="64" height="62" viewBox="0 0 64 62" className="overflow-visible">
                <ellipse cx="32" cy="58" rx="20" ry="3" fill="rgba(0,0,0,0.22)" />
                <circle cx="16" cy="49" r="8.5" fill="none" stroke="#3E2A1B" strokeWidth="2.2" />
                <circle cx="48" cy="49" r="8.5" fill="none" stroke="#3E2A1B" strokeWidth="2.2" />
                <path d="M 16 49 L 28 36 L 44 36 L 32 49 Z" fill="none" stroke="#34D399" strokeWidth="2.4" />
                <line x1="44" y1="36" x2="48" y2="49" stroke="#34D399" strokeWidth="2.4" />
                {/* Cô gái áo hồng phấn + búi tóc */}
                <rect x="23" y="21" width="11" height="15" rx="4" fill="#F472B6" stroke="#3E2A1B" strokeWidth="1.8" />
                <circle cx="23" cy="5" r="4" fill="#3E2723" stroke="#3E2A1B" strokeWidth="1.6" />
                <circle cx="29" cy="12" r="8" fill="#FDE6D2" stroke="#3E2A1B" strokeWidth="1.8" />
                <path d="M 21 10 C 21 3 37 3 37 10 Z" fill="#3E2723" stroke="#3E2A1B" strokeWidth="1.6" />
                <circle cx="32.5" cy="11.5" r="1.4" fill="#3E2A1B" />
                <ellipse cx="33.5" cy="13.8" rx="1.8" ry="1" fill="#F472B6" opacity="0.65" />
                <path d="M 30.5 15 Q 32.5 16.8 34.5 15" fill="none" stroke="#3E2A1B" strokeWidth="1.4" strokeLinecap="round" />
                {/* Đèn xe đạp rọi sáng ban đêm */}
                {(timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET') && (
                  <polygon
                    points="50,36 130,16 130,58"
                    fill="rgba(254, 240, 138, 0.35)"
                  />
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
