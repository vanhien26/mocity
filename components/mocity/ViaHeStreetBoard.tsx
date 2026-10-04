'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareWarning,
  Zap,
} from 'lucide-react';
import { BUILDING_BY_ID } from '@/lib/mocity/mock-city-data';
import { nodeYieldBreakdown, queueCapacityFor } from '@/lib/mocity/city-calculator';
import { queueHardCap } from '@/lib/mocity/transactions';
import { claimTapReward, useCity, useCityDerived } from '@/lib/mocity/store';
import type { ShopQueue } from '@/lib/mocity/types';
import ExpressiveStreetCitizens from './ExpressiveStreetCitizens';
import MoMoMascot from './MoMoMascot';
import StreetTraffic from './StreetTraffic';
import ShophouseFacade, { EmptyLot, ShophouseRoofCap, THOAI_CUA_SO } from './ShophouseFacade';
import { SHOPHOUSE_THEMES, THEME_BY_BUILDING, THEME_FALLBACK, type ShophouseTheme } from '@/lib/mocity/facade-theme';
import { FloodWaterLayer, RainOverlay, SkyAtmosphere, StreetLamp, TIME_OF_DAY_META } from './StreetAmbiance';
import { useTrafficController } from './useTrafficController';
import TrafficLightPole from './TrafficLightPole';
import StreetPets from './StreetPets';
import StreetVendorStalls from './StreetVendorStalls';
import StreetPassersby from './StreetPassersby';
import { RETRO_BOARD_FILTER } from './RetroFilm';
import { cityMood } from '@/lib/mocity/dialogue-engine';
import { useAmbientChatter } from './SpeechBubble';

/**
 * Do rong mot lot dat tren pho. Moi lot rong 236px. Dung chung giua tinh be
 * rong container va tinh vi tri cuon.
 */
const PLOT_WIDTH = 236;
/** Khoang dem hai ben duong pho. */
const STREET_PADDING = 420;
/** Be rong ngan ngang tai ngat tu - dung chung giua JSX va tinh `streetWidth`. */
const CROSSROAD_WIDTH = 168;

/** đồng luong "di tuan" cua Thị Trưởng. Han 5 phut. */
/*
 * Thưởng đi tuần. Ba câu thoại từng ghi "+180 đồng" trong khi hằng số là 120 -
 * game nói một đằng trả một nẻo. Trong một sản phẩm dạy tài chính thì sai
 * lệch giữa con số hứa và con số nhận là lỗi nặng, không phải lỗi chính tả.
 */
const PATROL_BONUS_COINS = 120;
const PATROL_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * NGÃ TƯ NỐI SANG KHU PHỐ 2 - đường ngang CẮT QUA thật, không phải hẻm cụt
 * lùi phối cảnh (xem lịch sử ở `streetPlots` phía trên).
 *
 * Tự chứa toàn bộ chiều cao vỉa hè + lòng đường (196+128=324px) để chèn
 * thẳng vào giữa dải nhà ống (`streetPlots.map`) mà không phải đụng tới toạ
 * độ tuyệt đối của ngã tư Đ. Hoa Sữa gốc ở đầu phố - nơi `StreetTraffic` đã
 * hiệu chỉnh sẵn điểm dừng xe theo đúng vị trí đó.
 */
function CrossroadGap() {
  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ width: CROSSROAD_WIDTH, height: 324, backgroundColor: '#B9B4A8' }}
    >
      {/* Mặt đường cắt ngang - phẳng, đúng màu lòng đường chính */}
      <div className="absolute inset-x-0 bottom-0 h-[128px]" style={{ backgroundColor: '#B5B0A4' }} />
      {/* Vỉa hè cắt ngang phía trên lòng đường */}
      <div className="absolute inset-x-0 top-0 bottom-[128px]" style={{ backgroundColor: '#D9BE8C' }} />

      {/* Vạch qua đường - 5 sọc zebra nằm ngang qua bề rộng ngã tư */}
      <div className="absolute inset-x-3 bottom-[20px] flex h-[88px] flex-col justify-between">
        {Array.from({ length: 5 }).map((_, zi) => (
          <div key={zi} className="h-[9px] w-full" style={{ backgroundColor: '#E8E4DC' }} />
        ))}
      </div>

      {/* Tim đường vàng dọc ngã tư */}
      <div className="absolute bottom-0 left-1/2 h-[128px] w-[3px] -translate-x-1/2" style={{ backgroundColor: '#D9B93C' }} />

      {/* Biển tên đường khu phố mới */}
      <div className="pointer-events-none absolute top-[36px] left-1/2 -translate-x-1/2">
        <div className="px-[3px] py-[2px]" style={{ backgroundColor: '#0E2F6E' }}>
          <div className="px-1.5 py-0.5" style={{ backgroundColor: '#1848A8' }}>
            <span className="whitespace-nowrap text-[9px] font-bold leading-tight tracking-wide text-white">Đ. Mai Vàng</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Giao diện "ĐẾ CHẾ VỈA HÈ — Từ gánh vé số góc ngã tư"
 * Phong cách 2D Illustrated Vietnamese Street Panorama (Dãy nhà ống mặt tiền Đ. Hoa Sữa)
 * - Nhà ống 3 tầng màu Pastel kẻ sọc chéo (Sửa Xe, Tạp Hóa, Văn Phòng Phẩm, Gạo, Trà Sữa, Rạp Phim MoMo, Túi Thần Tài...)
 * - Ô đất chưa xây dựng hiển thị dưới dạng Nhà Ống đóng Cửa Sắt Kéo Xếp Ngang cổ điển + xe máy dựng trong nhà & biển "PHỐ CHƯA MỞ"
 * - Vỉa hè lát gạch vàng ấm, xe bán "VÉ SỐ CƯỜNG - 20 tờ", Thị Trưởng mặc vest xanh vẫy tay, xe Cub xanh, xe đạp, đèn giao thông
 * - Bảng hiệu mái hiên sọc đỏ-trắng "ĐẾ CHẾ VỈA HÈ ✦ Từ gánh vé số góc ngã tư"
 */

export default function ViaHeStreetBoard({
  selected,
  onSelect,
  onOpenRequest,
  onOpenBuildDrawer,
  orderQueues = [],
  cityScale = 1.12,
  onActiveRowChange,
}: {
  selected: { col: number; row: number } | null;
  onSelect: (col: number, row: number) => void;
  onOpenRequest: (col: number, row: number) => void;
  onOpenBuildDrawer?: () => void;
  /**
   * HÀNG CHỜ THẬT từ store - nguồn của mọi con số hiển thị trên bảng hiệu.
   *
   * Trước đây badge đọc từ state cục bộ do `ExpressiveStreetCitizens` tự
   * bịa ra để vẽ. Giờ nó chỉ còn vai trò HIỂN THỊ - tiệm tự bán qua
   * `autoServeQueues` trong `tickIdle`, không còn nút bấm nào ở đây nữa.
   * Muốn bán nhanh hơn thì thuê Nhân Viên trong `StoreInspectorModal`.
   */
  orderQueues?: ShopQueue[];
  cityScale?: number;
  /** Hang pho dang xem, de parent uu tien dung o dat trong hang do. */
  onActiveRowChange?: (row: number) => void;
}) {
  const unlockedCols = useCity((s) => s.unlockedCols);
  const unlockedRows = useCity((s) => s.unlockedRows);
  const buildings = useCity((s) => s.buildings);
  const npcs = useCity((s) => s.npcs);
  const activeRequests = useCity((s) => s.activeRequests);
  const timeOfDay = useCity((s) => s.timeOfDay ?? 'DAY');
  const weather = useCity((s) => s.weather ?? 'SUNNY');
  const isFlooded = useCity((s) => s.isFlooded ?? false);
  const traffic = useTrafficController(timeOfDay);
  const derivedCity = useCityDerived();

  const [streetToast, setStreetToast] = useState<string | null>(null);
  /**
   * Hang pho dang chinh dien.
   *
   * Truoc day phong toan bo luoi mot luot roi `slice(0, 10)` nen o dat so 11-16
   * (va 17-100 o khi mo rong) bien mat khoi man hinh - nguoi choi xay 16 tiem
   * thi 6 tiem khong thay. Bay gio moi hien MOT hang pho tai mot thoi diem:
   * van du `unlockedCols` o (<= 10) nen DOM khong phong to so voi truoc, va
   * moi o dat deu tim thay duoc.
   *
   * Khong con `setActiveRow`: nut chuyen hang, chip dieu huong va 3 nut cuon
   * "Dau Pho / Giua Pho / Cuoi Pho" deu da khong con trong JSX, khong con noi
   * nao doi hang. Giu hang 0 de `onActiveRowChange` van tra mot gia tri hop le.
   */
  const activeRow = 0;

  /**
   * Số khách chờ THẬT, đọc thẳng từ store - MỘT nguồn duy nhất cho cả bảng
   * hiệu (badge), ví (click đóng đơn), và cư dân đứng xếp hàng trên phố.
   *
   * Trước đây có HAI con số: cái này (thật) và một bản `ExpressiveStreetCitizens`
   * tự mô phỏng riêng để "còn biết vẽ bao nhiêu bóng người" - hai mô phỏng
   * chạy song song, không liên quan tới nhau, nên người chơi thấy 3 người
   * đứng xếp hàng nhưng badge báo 1, hoặc ngược lại. Giờ cư dân đọc thẳng
   * `orderQueues` (truyền xuống `ExpressiveStreetCitizens` qua prop `realQueue`)
   * để biết CHÍNH XÁC ai đang chờ - không còn tự đoán.
   */
  const realQueueById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of orderQueues) map[q.shopId] = q.arrivedAt.length;
    return map;
  }, [orderQueues]);

  /*
   * Trạng thái khủng hoảng của thành phố, đổi câu thoại của bà con.
   *
   * Cùng nguồn số liệu với các cảnh báo đang hiện trên HUD và trong báo cáo P&L:
   * hạnh phúc, hệ số dòng tiền, tỷ lệ nợ xấu, hàng đợi. Nếu bà con kể chuyện
   * "khách bỏ hàng" thì người chơi phải thấy hàng đợi thật sự quá tải ở đâu đó.
   */
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
  /**
   * 2 hàng phố nối liền ngang qua ngã tư trong CÙNG MỘT dải cuộn (xem
   * `streetPlots`) - không phải xếp chồng, nên bề rộng gấp đôi + khoảng ngã
   * tư chen giữa.
   */
  const streetWidth = plotCount * PLOT_WIDTH * 2 + CROSSROAD_WIDTH + STREET_PADDING;
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

  // Chuyển danh sách các ô đất thành một Dãy Nhà Ống Mặt Tiền Phố (Số 2, Số 4, Số 6, Số 8...)
  const streetPlots = useMemo(() => {
    const bMap = new Map(buildings.map((b) => [`${b.col}:${b.row}`, b]));
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
      npcName: string | null;
      cashOnly: boolean;
    }> = [];

    /**
     * HAI HÀNG PHỐ, NỐI QUA MỘT NGÃ TƯ - không còn chỉ một hàng ẩn các hàng
     * khác sau nút chuyển đã bị gỡ.
     *
     * `unlockedRows` vốn đã là cơ chế thật trong `buyLand` (land cost tính
     * theo cả cột lẫn hàng), nhưng trước đây màn hình luôn hardcode hàng 0 -
     * nghĩa là người chơi có thể đã trả tiền mở hàng 2 mà không bao giờ thấy
     * được nó. Giờ hàng 1 (KHU PHỐ MỚI, bên kia ngã tư) luôn hiện SONG SONG
     * với hàng 0, không cần bấm chuyển gì cả - chỉ cần cuộn ngang qua khỏi
     * ngã tư ở cuối phố.
     *
     * Ô chưa mở (`unlocked: false`) tái dùng ĐÚNG visual "PHỐ CHƯA MỞ" sẵn có
     * cho cột chưa mua - không cần trạng thái mới cho hàng chưa mua.
     *
     * Thứ tự render: HÀNG 0 TRƯỚC (giữ nguyên vị trí cũ - ngã tư Đ. Hoa Sữa ở
     * đầu phố, cùng hệ thống đèn/vạch/điểm dừng xe đã hiệu chỉnh sẵn KHÔNG
     * đổi), rồi một ngã tư MỚI, rồi hàng 1 (khu phố bên kia đường).
     */
    const colCount = Math.max(4, unlockedCols);
    const coords: Array<{ col: number; row: number; unlocked: boolean }> = [];
    // Luon tease ca hang 1 (khoa neu chua mua) - dung "PHO CHUA MO" co san.
    const rowsToShow = 2;
    for (let r = 0; r < rowsToShow; r++) {
      for (let c = 0; c < colCount; c++) {
        coords.push({ col: c, row: r, unlocked: c < unlockedCols && r < unlockedRows });
      }
    }

    coords.forEach((coord, idx) => {
      const node = bMap.get(`${coord.col}:${coord.row}`);
      const def = node ? BUILDING_BY_ID[node.defId] : undefined;
      const npc = node ? npcs.find((n) => n.buildingId === node.id) : undefined;
      const yInfo = node ? nodeYieldBreakdown(node, buildings) : null;

      /*
       * MẶT TIỀN PHẢI KHỚP LOẠI CÔNG TRÌNH, không phải khớp vị trí ô đất.
       *
       * Bản cũ: `SHOPHOUSE_THEMES[idx % 7]` với `idx` là SỐ THỨ TỰ Ô ĐẤT, chỉ
       * có 4 nhánh ghi đè riêng. Hậu quả đo được: 9/19 công trình lấy mặt tiền
       * theo chỗ đứng - công viên treo biển "MENU · CÀ PHÊ MUỐI", nhà phố in
       * "PHOTOCOPY · ĐÓNG SÁCH", và cùng một công viên xây ở hai ô khác nhau
       * lại ra hai mặt tiền khác nhau.
       *
       * Giờ tra thẳng theo `def.id`. Thiếu một id nào là test bắt ngay
       * (`facade-theme.test.ts`), không im lặng rơi về theme ngẫu nhiên nữa.
       */
      const theme = def
        ? (THEME_BY_BUILDING[def.id] ?? SHOPHOUSE_THEMES[THEME_FALLBACK])
        : SHOPHOUSE_THEMES[idx % SHOPHOUSE_THEMES.length];

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
        npcName: npc ? npc.name : null,
        cashOnly: npc ? npc.role === 'MERCHANT' && !npc.acceptsDigital : false,
      });
    });

    return list;
  }, [activeRequests, buildings, npcs, unlockedCols, unlockedRows]);

  /*
   * NGƯỜI TRONG NHÀ NÓI CHUYỆN.
   *
   * Điều phối ở cấp dãy phố: mỗi lượt chỉ MỘT căn mở lời. Để từng căn tự hẹn
   * giờ thì 10 căn cùng nói một lúc, bong bóng chồng lên nhau và không ai đọc
   * kịp câu nào - đúng lỗi đã gặp với thoại cư dân ngoài phố.
   *
   * Lưu `col:row` chứ không lưu chỉ số mảng: `streetPlots` dựng lại mỗi khi
   * người chơi đổi hàng phố, chỉ số cũ sẽ trỏ sang căn khác.
   */
  const [nhaDangNoi, setNhaDangNoi] = useState<{ o: string; cau: string } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const hen = () => {
      timer = setTimeout(() => {
        const daXay = streetPlots.filter((p) => !!p.node);
        if (daXay.length === 0) {
          setNhaDangNoi(null);
          hen();
          return;
        }
        const p = daXay[Math.floor(Math.random() * daXay.length)];
        setNhaDangNoi({
          o: `${p.col}:${p.row}`,
          cau: THOAI_CUA_SO[Math.floor(Math.random() * THOAI_CUA_SO.length)],
        });
        // Bong bóng đứng 5,5 giây rồi tắt, chừa khoảng lặng trước lượt sau.
        setTimeout(() => setNhaDangNoi(null), 5_500);
        hen();
      }, 9_000 + Math.random() * 7_000);
    };
    hen();
    return () => clearTimeout(timer);
  }, [streetPlots]);

  /**
   * Điểm tụ cho cư dân xếp hàng: chỉ tiệm thương mại mới có quầu thu ngân.
   *
   * `x` phải khớp DOM thật, nên dùng đúng công thức bên dưới: hẻm chiếm 132px
   * cộng 16px margin, mỗi ô rộng 236px, cửa ở giữa ô. Số khách tối đa cũng
   * bám theo công trình: cấp cao phục vụ được nhiều người hơn, đó là lý do
   * nâng cấp tiệm nhìn thấy được ngay trên phố.
   */
  const shopAnchors = useMemo(
    () =>
      streetPlots.flatMap((plot, idx) => {
        if (!plot.node || !plot.def) return [];
        if (plot.def.zone !== 'COMMERCIAL') return [];
        /*
         * Hàng 1 (khu phố bên kia đường) nằm SAU `CrossroadGap` trong DOM -
         * mọi ô ở hàng > 0 phải cộng thêm bề rộng ngã tư mới, nếu không điểm
         * neo khách xếp hàng sẽ lệch 168px về bên trái so với mặt tiền thật.
         */
        const crossroadOffset = plot.row > 0 ? CROSSROAD_WIDTH : 0;
        return [
          {
            id: plot.node.id,
            defId: plot.def.id,
            x: 132 + 16 + idx * 236 + crossroadOffset + 118,
            label: plot.def.shortName,
            capacity: queueCapacityFor(plot.node),
          },
        ];
      }),
    [streetPlots],
  );

  const handleScrollBy = (delta: number) => {
    scrollContainerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
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

  const handleClaimPatrolBonus = useCallback(() => {
    // Han 5 phut: day la "di tuan", khong phai nut spam.
    const result = claimTapReward('patrol', PATROL_BONUS_COINS, { cooldownMs: PATROL_COOLDOWN_MS });
    if (!result.ok) {
      setStreetToast('Ông Lộc đầu hẻm: “Thị Trưởng vừa đi tuần xong, nghỉ ngơi đã Thị Trưởng ơi!”');
      setTimeout(() => setStreetToast(null), 4000);
      return;
    }
    const funnyLines = [
      'Trạm Heo Vàng MoCity: “Thị Trưởng vừa đi tuần khích lệ bà con tiểu thương! Nhận ngay +120 đồng Lộc Đô Thị!”',
      'Ông Lộc Đầu Tư: “Dòng tiền thanh toán số trên Đại lộ MoMo hôm nay tăng trưởng vượt bậc!” (+120 đồng)',
      'Cô Tư Tạp Hóa: “Cả dãy phố quét QR ting ting vui như Tết! Mời Thị Trưởng ly trà tắc!” (+120 đồng)',
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
          className="pointer-events-none absolute top-4 left-1/2 z-40 -translate-x-1/2 rounded-2xl border-2 border-[#4A3B32] bg-[#FFFDF7] px-4 py-2 text-sm font-black text-[#4A3B32] shadow-xl"
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
        style={{
          backgroundImage: TIME_OF_DAY_META[timeOfDay].skyBg,
          /*
           * Ngả màu CHỈ ở khung phố, không phủ lên HUD và modal - chữ nhỏ
           * trong bảng phải giữ độ tương phản. Xem chú thích ở `RetroFilm`
           * về việc `filter` phá `position: fixed` của con cháu.
           */
          filter: RETRO_BOARD_FILTER,
        }}
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
          {/* LỚP MƯA RÀO & GIÔNG BÃO */}
          <RainOverlay weather={weather} />

          {/*
           * LỚP 1: CHUNG CƯ CAO TẦNG MỜ XA (SKYLINE PARALLAX LỚN)
           *
           * `bottom` neo day duong chan cua chung cu voi CHAN NHA. Nha dung
           * len mat via he, nen khi via he cao hon bao nhieu thi day phoi len
           * toan nhieu bay nhieu - de nguyen 235px thi chung cu se bi liet
           * sau mat via he va phan duoi lon hon thua ra khoi khung.
           */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[281px] overflow-hidden">
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

          {/* LỚP 2 & 3: DÃY NHÀ ỐNG MẶT TIỀN 3 TẦNG CỠ LỚN (2 HÀNG PHỐ NỐI QUA NGÃ TƯ) */}
          {/*
           * Khong con marginBottom: 226. Con so do la bu tru thu cong tu hoi
           * via he va long duong bi flex co lai con 34/31px; gio hai lop da
           * shrink-0 va giu dung chieu cao nen margin chi lam day day nha
           * tran khoi dinh khung va tach khoi via he.
           */}
          <div className="relative z-25 flex items-end pl-0 pr-24">
            {/*
             * Ngã tư Đ. Hoa Sữa gốc (đèn giao thông, vạch qua đường, điểm
             * dừng xe) GIỮ NGUYÊN vị trí ở lớp vỉa hè/lòng đường bên dưới -
             * không đụng vào toạ độ đã hiệu chỉnh cho `StreetTraffic`.
             *
             * Ngã tư THỨ HAI (`CrossroadGap`) được chèn tự động bên trong
             * `streetPlots.map` ngay chỗ đổi từ hàng 0 sang hàng 1 - đường
             * cắt ngang thật, không phải ngõ cụt lùi phối cảnh như bản cũ.
             */}

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
                /*
                 * Doi hang (1 -> 0) la diem bang qua NGA TU. `streetPlots`
                 * xep hang 1 (ben kia duong) truoc, hang 0 (pho quen) sau -
                 * xem comment trong useMemo phia tren.
                 */
                const isCrossroadHere = idx > 0 && streetPlots[idx - 1].row !== plot.row;

                return (
                  <Fragment key={`${plot.col}:${plot.row}`}>
                  {isCrossroadHere && <CrossroadGap />}
                  <div
                    className="relative flex flex-col items-center shrink-0"
                    style={{ width: 236 }}
                  >
                    {/*
                     * Dây điện võng giữa các nhà ống.
                     *
                     * Neo từ CHÂN, không neo từ đỉnh. Nhà giờ cao thấp khác
                     * nhau nên đỉnh mỗi cột lệch nhau; neo `top` thì mỗi
                     * khúc dây nằm một độ cao và dây gãy bậc thang. Từ chân
                     * lên 262px rơi đúng tầng ban công - tầng mà căn nào
                     * cũng có, kể cả căn 1 lầu.
                     */}
                    <svg
                      className="pointer-events-none absolute bottom-[262px] left-0 z-20 w-full h-10 overflow-visible"
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

                    {/*
                      HÀNG CHỜ - chỉ còn vai trò HIỂN THỊ.
                      Tiệm tự bán qua `autoServeQueues` trong `tickIdle`, tốc
                      độ do số Nhân Viên quyết định (xem tab "Quản Lý Nhân
                      Viên" khi bấm vào tiệm) - không còn nút bấm nào ở đây.
                    */}
                    {(() => {
                      const hangDoi = plot.node ? realQueueById[plot.node.id] ?? 0 : 0;
                      if (hangDoi <= 0 || !plot.node) return null;
                      const node = plot.node;
                      const sucChua = queueHardCap(node);
                      const quaTai = hangDoi >= sucChua;
                      const satChan = hangDoi >= sucChua - 1;
                      const mau = quaTai
                        ? { bg: '#FECACA', bd: '#B91C1C', fg: '#7F1D1D' }
                        : satChan
                          ? { bg: '#FED7AA', bd: '#C2410C', fg: '#7C2D12' }
                          : { bg: '#FFE9A8', bd: '#78533D', fg: '#7A4A00' };
                      const canhBao = quaTai
                        ? `hàng ${hangDoi} người nhưng chỉ chờ được ${sucChua} - đã có khách bỏ đi!`
                        : satChan
                          ? `hàng ${hangDoi} người, vừa đủ ${sucChua} chỗ - thêm 1 nữa là mất khách`
                          : `${hangDoi} khách chờ, sức chứa ${sucChua}`;
                      const hasLoaMoMo = (node.modules ?? []).includes('QR_LOA_THAN_TAI');
                      const staffCount = Math.min(3, Math.max(0, node.staffCount ?? 0));
                      return (
                        <div
                          className="z-20 mb-1 flex items-center gap-1 rounded-full border-2 px-2 py-[1px] text-[10px] font-black shadow-sm"
                          style={{ background: mau.bg, borderColor: mau.bd, color: mau.fg }}
                          title={`${plot.def?.shortName ?? 'Tiệm'}: ${canhBao} - tự bán ${hasLoaMoMo ? '(Loa MoMo Ting Ting)' : '(Tiền mặt)'}${staffCount > 0 ? `, ${staffCount} Nhân Viên đang phụ bán` : ', chủ quán tự bán (chậm)'}`}
                        >
                          {hasLoaMoMo ? '📢' : quaTai ? '⚠️' : satChan ? '🔔' : '🧍'} {hangDoi} chờ
                          <span className="opacity-70">/ {sucChua}</span>
                          {staffCount > 0 && <span className="opacity-80">· 👤×{staffCount}</span>}
                        </div>
                      );
                    })()}

                    {/* Nút Chuyện Phố (!) khi có sự kiện yêu cầu */}
                    {plot.hasRequest && (
                      <div className="mb-2 flex min-h-[36px] flex-col items-center justify-end z-20">
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
                      </div>
                    )}

                    {/*
                     * Ô TRỐNG thì chỉ có bãi đất cắm cọc, KHÔNG dựng nhà.
                     *
                     * Bản cũ vẫn dựng đủ 3 tầng cho ô chưa xây rồi kéo cửa sắt
                     * xuống, nên dãy phố lúc nào cũng kín nhà và người chơi
                     * không thấy phố lớn lên khi mình mở tiệm.
                     */}
                    {!isBuilt ? (
                      <div
                        onClick={() => onSelect(plot.col, plot.row)}
                        className="relative w-[228px]"
                        style={
                          isSelected
                            ? {
                                outline: '4px solid #D82D8B',
                                outlineOffset: -2,
                                boxShadow: '0 0 0 5px rgba(216,45,139,0.3)',
                              }
                            : undefined
                        }
                      >
                        <EmptyLot
                          houseNumber={plot.houseNumber}
                          unlocked={plot.unlocked}
                          timeOfDay={timeOfDay}
                          onOpenBuild={() => {
                            onSelect(plot.col, plot.row);
                            onOpenBuildDrawer?.();
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        {/* Bồn nước / mặt dựng vòm nhô lên trên nóc, nằm ngoài viền khối nhà. */}
                        <ShophouseRoofCap
                          houseNumber={plot.houseNumber}
                          shopType={plot.theme.shopType}
                          timeOfDay={timeOfDay}
                        />

                        {/*
                         * THÂN NHÀ ỐNG - cao thấp theo dáng của từng số nhà.
                         * Không có hiệu ứng rê chuột: nhà nhấc lên khi hover làm
                         * cả dãy phố nhảy theo con trỏ mỗi lần lướt ngang.
                         */}
                        <div
                          onClick={() => {
                            onSelect(plot.col, plot.row);
                          }}
                          className="group relative w-[228px] cursor-pointer"
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
                            shopTitle={shopTitle}
                            isBuilt
                            unlocked={plot.unlocked}
                            level={plot.node?.level}
                            starRating={plot.node?.starRating}
                            yieldPerSec={plot.yieldPerSec}
                            timeOfDay={timeOfDay}
                            wallBg={plot.theme.wallBg}
                            wallHatch={plot.theme.wallHatch}
                            signBg={plot.theme.signBg}
                            windowSpeech={
                              nhaDangNoi?.o === `${plot.col}:${plot.row}` ? nhaDangNoi.cau : null
                            }
                            onOpenBuild={() => {
                              onSelect(plot.col, plot.row);
                              onOpenBuildDrawer?.();
                            }}
                          />
                        </div>
                      </>
                    )}

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
                          title="Bấm để nhận Lộc Đi Tuần MoCity (+120đ)"
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
                              +120đ
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
                  </Fragment>
                );
              })}
            </div>
          </div>

          {/*
           * LOP 4: VIA HE - cut paper, dong bo voi nhan vat.
           * Khong dung gradient/luoi ke: mat via he la MOT mang phang, cac vien
           * gach la nhung dai giay phang chong len nhau.
           * Xe co KHONG chay o lop nay, tat ca nam duoi LOP 5 long duong.
           *
           * `VIA_HE_HEIGHT` chu dung chieu cao de tro 9 hang sau (xem
           * `LANES` trong ExpressiveStreetCitizens). Doi chieu cao o day thi
           * phai doi kem `bottom-[...]` cua skyliner o LOP 1, khong thi chung
           * se liet xuong sau mat via he va mat dat thay doi ti le.
           */}
          <div
            className="relative z-20 h-[196px] w-full shrink-0"
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

            {/*
              SẠP VỈA HÈ - gánh xôi, hủ tiếu gõ, cà phê cóc. Thuần trang trí,
              không gắn thương hiệu, để chống bội thực MoMo (xem ghi chú đầu
              file StreetVendorStalls.tsx).
            */}
            <StreetVendorStalls
              streetWidth={streetWidth}
              onStallReward={(msg) => {
                setStreetToast(msg);
                setTimeout(() => setStreetToast(null), 4000);
              }}
            />

            {/*
              KHACH HANG DI DUONG - 4 nguoi qua lai vo tri, rieng mot bo gag
              (selfie / roi nguoi / nhon got / mu bay). Khong xep hang, khong
              noi chuyen, khong nhan reward - xem ghi chu dau file
              StreetPassersby.tsx. Dat TRUOC cu dan de cu dan (nhan vat chinh)
              luon nam tren cung.
            */}
            <StreetPassersby streetWidth={streetWidth} />

            {/* HỆ THỐNG CƯ DÂN ĐI BỘ */}
            <ExpressiveStreetCitizens
              streetWidth={streetWidth}
              shops={shopAnchors}
              realQueue={orderQueues}
              happinessIndex={derivedCity.happiness}
              timeOfDay={timeOfDay}
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

            {/* LỚP NƯỚC TRIỀU CƯỜNG NGẬP LỤT VỈA HÈ */}
            <FloodWaterLayer isFlooded={isFlooded} />
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

            {/* LỚP NƯỚC TRIỀU CƯỜNG NGẬP LỤT LÒNG ĐƯỜNG */}
            <FloodWaterLayer isFlooded={isFlooded} />

            <StreetTraffic
              timeOfDay={timeOfDay}
              trafficPhase={traffic.phase}
              streetLightsLit={traffic.streetLightsLit}
              roadWidth={streetWidth}
              onPoliceClick={() => {
                const result = claimTapReward('patrol', 100, { cooldownMs: 1500 });
                if (result.ok) {
                  setStreetToast('🚓 Xe Cảnh Sát MoCity: “Tình hình trật tự 10/10! Bà con yên tâm quét mã buôn bán!” (+100 đồng)');
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
