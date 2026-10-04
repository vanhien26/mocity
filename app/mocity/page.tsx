'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowUpCircle,
  CircleDollarSign,
  Crown,
  Hammer,
  MapPin,
  MessageSquareHeart,
  MessageSquareWarning,
  Package,
  Plus,
  Share2,
  SlidersHorizontal,
  Star,
  Users,
  X,
  Zap,
  PiggyBank,
  ShieldAlert,
} from 'lucide-react';
import ViaHeStreetBoard from '@/components/mocity/ViaHeStreetBoard';
import BuildDrawer from '@/components/mocity/BuildDrawer';
import CoinBubble from '@/components/mocity/CoinBubble';
import ParticleEngine, { particles } from '@/components/mocity/ParticleEngine';
import { FloatingNumbers, GameJuiceStyles, useGameJuice } from '@/lib/mocity/useGameJuice';
import { useAutoTimeOfDay, useAutoWeather } from '@/components/mocity/StreetAmbiance';
import OfflineRewardModal from '@/components/mocity/OfflineRewardModal';
import ShareCityCard from '@/components/mocity/ShareCityCard';
import DialogueModal, { type DialogueView } from '@/components/mocity/DialogueModal';
import WelcomeScreen from '@/components/mocity/WelcomeScreen';
import StoreInspectorModal from '@/components/mocity/StoreInspectorModal';
import MayorCenterModal from '@/components/mocity/MayorCenterModal';
import TutorialCoach from '@/components/mocity/TutorialCoach';
import RetroFilm from '@/components/mocity/RetroFilm';
import InventoryModal from '@/components/mocity/InventoryModal';
import MoMoFinanceModal, { type FinanceTab } from '@/components/mocity/MoMoFinanceModal';
import MicroQuizModal from '@/components/mocity/MicroQuizModal';
import {
  playTing,
  playJackpot,
  playError,
  playSuccess,
  playAlert,
  playPop,
} from '@/lib/mocity/sound-engine';
import { EVENT_BY_ID, REQUEST_BY_ID } from '@/lib/mocity/dialogue-data';
import { HAPPINESS_WARNING_AT } from '@/lib/mocity/city-calculator';
import { ARCHETYPES } from '@/lib/mocity/npc-data';
import {
  buyLand,
  claimOffline,
  completeMayorLogin,
  dismissEvent,
  hydrateCity,
  isQuestCompleted,
  placeBuilding,
  resolveEvent,
  resolveRequest,
  triggerNextEvent,
  claimCityTierRewards,
  claimStreakMilestones,
  upgradeBuilding,
  effectiveMaxLevel,
  getCityState,
  useCity,
  useCityDerived,
  useCityHydrated,
  harvestManual,
  resolveIncident,
  spawnRandomIncident,
  markTutorialFlag,
  type PlaceResult,
  type UpgradeResult,
} from '@/lib/mocity/store';
import { totalBacklog } from '@/lib/mocity/transactions';
import { useIdleTick } from '@/lib/mocity/useIdleTick';
import {
  MAYOR_QUESTS,
  BUILDING_BY_ID,
  MANAGER_BY_ID,
  ZONES,
  upgradeCostCoins,
  nextCityTier,
  cityTierFor,
  CITY_TIERS,
} from '@/lib/mocity/mock-city-data';
import { BUILDING_ICON } from '@/components/mocity/building-icons';
import { buildingAt, nodeYieldBreakdown } from '@/lib/mocity/city-calculator';
import { formatCompact, formatNumber, formatRate } from '@/lib/mocity/format';
import type { BuildingDef } from '@/lib/mocity/types';
import { cn } from '@/lib/cn';

/**
 * Thuong nhanm chuc lan dau. `completeMayorLogin` chi tra so nay mot lan
 * (gate `hasNamedCity`), nen UI phai dung chung hang so nay de hien thi
 * khop voi thuc te.
 */
/*
 * Thưởng nhậm chức. Bản cũ là 50.000 đồng, trong khi TỔNG giá mua hết cả 19
 * công trình chỉ 33.090 đồng - thưởng xong là mua được tất cả và hết mục tiêu.
 * 1.000 đồng mua được 5 công trình rẻ nhất, đủ để bắt đầu mà vẫn phải chờ tiền
 * về mới đi tiếp.
 */
const LOGIN_BONUS_COINS = 10_000_000;

const ERROR_MESSAGE: Record<PlaceResult, string> = {
  ok: '',
  locked: 'Ô đất này chưa được quy hoạch. Mở rộng đất trước đã.',
  occupied: 'Ô này đã có công trình.',
  level: 'Cấp Thị Trưởng chưa đủ để xây công trình này.',
  funds: 'Chưa đủ đồng. Đợi thu thêm hoặc thu bong bóng đồng nhé.',
};

const UPGRADE_MESSAGE: Record<UpgradeResult, string> = {
  ok: '',
  missing: 'Ô này chưa có công trình để nâng cấp.',
  max: 'Công trình đã đạt cấp tối đa.',
  funds: 'Chưa đủ đồng để nâng cấp công trình này.',
  mayor: 'Lên cấp Thị Trưởng để mở khóa nâng cấp cao hơn.',
};

/**
 * Khoang cach giua hai luot Chuyen Pho tu dong: 5-8 phut.
 * Moc cu 2-3 phut qua day, nguoi choi vua dong hop thoai xong da co hop khac.
 */
const AUTO_EVENT_MIN_MS = 300_000;
const AUTO_EVENT_MAX_MS = 480_000;

export default function MoCityPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  /**
   * Mac dinh 1.0 chu khong phai 1.14: toan bo noi dung pho cao ~823px trong
   * khung ~843px, nhan 1.14 se thanh ~938px va day day nha ong tran khoi
   * dinh khung (overflow-y bi hidden nen khong cuon lai duoc).
   */
  /**
   * Ty le phong to ban do pho. Khong con `setCityScale` - nut dieu khien
   * zoom da khong con, ty le co dinh 1.0.
   */
  const [cityScale] = useState(1.0);
  const [selected, setSelected] = useState<{ col: number; row: number } | null>(null);
  /** Hang pho dang xem tren board. */
  const [activeRow, setActiveRow] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [mayorModalOpen, setMayorModalOpen] = useState(false);
  const [mayorModalTab, setMayorModalTab] = useState<'PROFILE' | 'QUESTS' | 'CITIZENS'>('PROFILE');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<'ITEMS' | 'CHARACTERS'>('ITEMS');
  /*
   * Guong `ref` cua cac modal. Effect tu mo Chuyen Pho doc qua day thay vi qua
   * deps: dua truc tiep vao deps se huy va dat lai hen gio moi lan nguoi choi
   * mo/dong mot bang bat ky, nen vong 5-8 phut gan nhu khong bao gio chay het.
   */
  const modalDangMoRef = useRef(false);

  const [tab, setTab] = useState('ALL');
  const [toast, setToast] = useState<string | null>(null);

  // Giu "" de "ban co sua khong" va suy ten mac dinh luc render tu tai khoan.
  const [mayorInput, setMayorInput] = useState('');
  const [cityInput, setCityInput] = useState('Đô Thị MoCity');

  /**
   * `/mocity` bat buoc dang nhap (middleware chan nguoi chua dang nhap).
   * `SessionProvider` da boc o `components/Providers.tsx` nen hook nay an toan.
   * Session van con `status === 'loading'` luc SSR -> may WelcomeScreen hien
   * trong khi do, trong do chi tho.
   */
  const { data: session, status: sessionStatus } = useSession();
  const playerId = session?.user?.email ?? session?.user?.name ?? null;
  const cityHydrated = useCityHydrated();

  /** Ten hien thi cua tai khoan, dung lam ten Tho mac dinh. */
  const accountName = (session?.user?.name ?? '').trim();
  /** Ten Tho se commit: nhap cua nguoi > ten tai khoan > ten mac dinh. */
  const effectiveMayorName = mayorInput.trim() || accountName || 'Thị Trưởng MoMo';

  const [shareOpen, setShareOpen] = useState(false);

  const boardHostRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFloodTriggered = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  useAutoTimeOfDay();
  useAutoWeather(handleFloodTriggered);

  const coins = useCity((s) => s.coins);
  const totalCoinsEarned = useCity((s) => s.totalCoinsEarned);
  const totalRevenue = useCity((s) => s.totalRevenue ?? 0);
  /** So ngay choi lien tiep - chi doc, `registerStreak` lo phan ghi. */
  const streakDays = useCity((s) => s.streak?.days ?? 0);
  const gems = useCity((s) => s.gems);
  const level = useCity((s) => s.mayorLevel);
  const cityName = useCity((s) => s.cityName);
  const mayorName = useCity((s) => s.mayorName);
  const hasNamedCity = useCity((s) => s.hasNamedCity);
  const buildings = useCity((s) => s.buildings);
  const offline = useCity((s) => s.pendingOffline);
  const npcs = useCity((s) => s.npcs);
  const activeRequests = useCity((s) => s.activeRequests);
  /**
   * HÀNG CHỜ KHÁCH - nguồn sinh tiền duy nhất của thành phố.
   *
   * Mảng này rỗng thì ví không tăng đồng nào. Mọi con số trên HUD, mọi dòng
   * trong P&L đều bắt đầu từ đây.
   */
  const orderQueues = useCity((s) => s.shopQueues ?? []);
  const backlog = useMemo(() => totalBacklog(orderQueues), [orderQueues]);
  const pendingEvent = useCity((s) => s.pendingEvent);
  const claimedQuests = useCity((s) => s.claimedQuests ?? []);
  const unlockedCols = useCity((s) => s.unlockedCols);
  const unlockedRows = useCity((s) => s.unlockedRows);
  const inventory = useCity((s) => s.inventory);

  /**
   * So đồng nguoi choi SE nhan duoc khi bam "Nhan Qua & Vao Pho".
   * Phai khop chinh xac voi `completeMayorLogin`: thuong 50.000 đồng chi tra
   * lan dau (`hasNamedCity`), cac lan sau chi nhan thuong AFK. Truoc day UI
   * in cung `+50K đồng` va `Vốn sẵn có 1.000.000 đồng` cho ca nguoi choi quay
   * lai - con số ma thuc te la 0.
   */
  const offlineBonus = offline?.coins ?? 0;
  const totalInventoryCount = useMemo(
    () => Object.values(inventory ?? {}).reduce((acc, qty) => acc + (qty || 0), 0),
    [inventory],
  );
  const derived = useCityDerived();

  /*
   * Bac thanh pho tren HUD. Truoc day chi hien trong Toa Thi Chinh, nen muc
   * tieu trung han duy nhat cua game lai la thu nguoi choi khong nhin thay.
   *
   * Suy tu `derived.population` chu KHONG goi `currentCityTier()`: ham do doc
   * state o module nen khong kich hoat render lai, bac se dung yen cho toi khi
   * co thu khac lam HUD ve lai.
   */
  const cityTier = cityTierFor(derived.population, buildings.length);
  const cityTierNext = nextCityTier(cityTier.rank);
  const cityTierPct = cityTierNext
    ? Math.min(
        100,
        Math.round(
          Math.min(
            derived.population / cityTierNext.minPopulation,
            buildings.length / cityTierNext.minBuildings,
          ) * 100,
        ),
      )
    : 100;

  const { shake, floatNumber } = useGameJuice();
  /** Cấp đã mừng lần gần nhất. `null` = chưa mừng lần nào, xem effect lên cấp. */
  const levelDaQuanLy = useRef<number | null>(null);

  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [heldView, setHeldView] = useState<DialogueView | null>(null);
  /*
   * Hop thoai Chuyen Pho MO hay DONG, khong phai "da bi dong hay chua".
   *
   * Ban cu dung `dialogueDismissed` mac dinh `false`, cong voi mot effect tu
   * dat lai `false` moi khi `liveView` doi tieu de. Nghia la bat cu su kien nao
   * vua sinh ra la hop thoai tu bat len. Ma `maybeSpawnEvent` trong store sinh
   * su kien moi 35 giay, nen hop thoai cu 35 giay lai chen ngang mot lan, de
   * len ca Toa Thi Chinh dang mo - khong lien quan gi toi nhip 5-8 phut dat o
   * `AUTO_EVENT_MIN_MS`. Dao lai thanh "mac dinh dong, chi mo khi co y dinh ro
   * rang" lam cho nhip hien hop thoai co dung MOT nguon.
   */
  const [dialogueOpen, setDialogueOpen] = useState(false);

  // Thị Trưởng MoMo: Chỉ số tài chính & Vòng lặp Dopamine
  const ap = useCity((s) => s.ap ?? 50);
  const mayorPoints = useCity((s) => s.mayorPoints ?? 100);
  const creditScore = useCity((s) => s.trustScore ?? 650);
  const savingsBalance = useCity((s) => s.savingsBalance ?? 0);
  const investedAmount = useCity((s) => s.investedAmount ?? 0);
  const debt = useCity((s) => s.debt ?? 0);
  const activeIncidents = useCity((s) => s.activeIncidents ?? []);
  const hasInsurance = useCity((s) => Boolean(s.hasInsurance && (s.insuranceActiveUntilMs ?? 0) > Date.now()));

  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [financeTab, setFinanceTab] = useState<FinanceTab>('SAVINGS');
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  useIdleTick(isPlaying);

  useEffect(() => {
    // Hydrate khi session da resolve (ca authenticated lan unauthenticated).
    // sessionStatus === 'loading' nghia la dang cho fetch /api/auth/session,
    // khong muon hydrate truoc do vi playerId co the thay doi sau khi resolve.
    if (sessionStatus !== 'loading') {
      hydrateCity(playerId);
    }
  }, [sessionStatus, playerId]);

  /**
   * Da bo Web Audio API. AudioContext duoc tao o cu chi dau tien va khong bao
   * gio close, giu tai nguyen audio he thong suot phien choi. Tren mobile con
   * cham gioi han so AudioContext dong thoi. 31 call site playSound da xoa
   * cung hai nut mute (mot nut trong board chi doi icon chu khong tat duoc tieng).
   */

  /**
   * Noi ten da luu trong save vao o nhap.
   *
   * Chi khi `hasNamedCity` - tuc la nguoi choi da nham chuc truoc do. `mayorName`
   * mac dinh la "Thi Truong MoMo", nen neu noi luon se de no luon va ghi de
   * ten tai khoan ma moi dang cho. Va `mayorInput` con rong thi khong ghi de
   * y dinh cua nguoi choi.
   */
  useEffect(() => {
    if (!hasNamedCity) return;
    const id = requestAnimationFrame(() => {
      setMayorInput((prev) => prev || mayorName);
      if (cityName) setCityInput(cityName);
    });
    return () => cancelAnimationFrame(id);
  }, [hasNamedCity, mayorName, cityName]);


  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const handleCompleteLogin = useCallback(() => {
    const cleanMayor = effectiveMayorName;
    const cleanCity = cityInput.trim() || 'Đô Thị MoCity';
    const bonus = completeMayorLogin(cleanMayor, cleanCity, LOGIN_BONUS_COINS);
    setIsPlaying(true);
    if (bonus > 0) {
      showToast(
        `Chào mừng ${cleanMayor}! Đã nhận +${formatNumber(bonus)} đồng (Ngân khố: ${formatNumber(coins + bonus)} đồng).`,
      );
    } else {
      showToast(`Chào mừng trở lại ${cleanMayor}! Ngân khố hiện có ${formatNumber(coins)} đồng.`);
    }
  }, [cityInput, coins, effectiveMayorName, showToast]);

  const claimableQuestsCount = useMemo(() => {
    return MAYOR_QUESTS.filter(
      (q) => !claimedQuests.includes(q.id) && isQuestCompleted(q.id, getCityState()),
    ).length;
  }, [claimedQuests, buildings]);

  const selectedBuilding = selected
    ? buildingAt(buildings, selected.col, selected.row)
    : undefined;
  const handleSelect = useCallback(
    (col: number, row: number) => {
      const node = buildingAt(buildings, col, row);
      setSelected({ col, row });
      if (node) {
        setInspectorOpen(true);
        markTutorialFlag('inspector');
      } else {
        setDrawerOpen(true);
      }
    },
    [buildings],
  );

  useEffect(() => {
    modalDangMoRef.current = drawerOpen || inspectorOpen || mayorModalOpen || inventoryOpen;
  }, [drawerOpen, inspectorOpen, mayorModalOpen, inventoryOpen]);

  const handleOpenRequest = useCallback(
    (col: number, row: number) => {
      const node = buildingAt(buildings, col, row);
      if (!node) return;
      const request = activeRequests.find((r) => r.npcId === node.id);
      if (request) {
        setOpenRequestId(request.id);
        setDialogueOpen(true);
      }
    },
    [activeRequests, buildings],
  );

  /**
   * Doi thoai hien len man hinh.
   *
   * `subtitle` PHẢI truyền vào: `DialogueModal` hien `view.subtitle ??
   * 'Chuyện này chỉ mình bạn biết...'`. Truoc day 70/70 script deu viet tay
   * `subtitle` nhung duong nay bo qua, nen nguoi choi LUON thay fallback thay
   * vi cau viet cua tac gia - mat sach 70 doan narrative dang nam trong code.
   *
   * `speakerTag` = badge tren `CharacterPanel` luc mo hop thoai, de nguoi choi
   * biet ai dang noi. Khop badge vai tro o pannel cu dan ben duoi duong.
   *
   * Request: dung `ARCHETYPES[].label` - nhan nay da duoc viet ro cho chuc
   * nang nay ("Dân văn phòng", "Tiểu thương chợ") nhung lau nay khong ai goi.
   * Event: khong co NPC nao ke, day la su kien thanh pho.
   */
  const liveView = useMemo<DialogueView | null>(() => {
    if (pendingEvent) {
      const script = EVENT_BY_ID[pendingEvent.scriptId];
      if (script) {
        return {
          title: script.title,
          subtitle: script.subtitle,
          speaker: script.speaker,
          speakerTag: 'Sự Kiện',
          body: script.body,
          choices: script.choices,
        };
      }
    }
    if (openRequestId) {
      const request = activeRequests.find((r) => r.id === openRequestId);
      const script = request ? REQUEST_BY_ID[request.scriptId] : undefined;
      const npc = request ? npcs.find((n) => n.id === request.npcId) : undefined;
      if (script && npc) {
        return {
          title: script.title,
          subtitle: script.subtitle,
          speaker: npc.name,
          speakerTag: ARCHETYPES[npc.archetype].label,
          body: script.body,
          choices: script.choices,
        };
      }
    }
    return null;
  }, [activeRequests, npcs, openRequestId, pendingEvent]);

  const dialogueView = dialogueOpen ? (heldView ?? liveView) : null;

  const handleChooseDialogue = useCallback(
    (choiceId: string) => {
      const result = pendingEvent
        ? resolveEvent(choiceId)
        : openRequestId
          ? resolveRequest(openRequestId, choiceId)
          : 'missing';

      if (result === 'funds') {
        showToast('Chưa đủ đồng cho phương án này.');
        return false;
      }
      if (result !== 'ok') return false;

      setHeldView(liveView);
      return true;
    },
    [liveView, openRequestId, pendingEvent, showToast],
  );

  const handleCloseDialogue = useCallback(() => {
    setHeldView(null);
    setOpenRequestId(null);
    setDialogueOpen(false);
    dismissEvent();
  }, []);

  const handleOpenDialogue = useCallback(() => {
    setDialogueOpen(true);
    if (pendingEvent || activeRequests.length > 0) return;

    const result = triggerNextEvent();
    if (result === 'ok') {
      showToast('Đang lắng nghe chuyện mới trên vỉa hè MoCity...');
      return;
    }
    if (result === 'dailyLimit') {
      showToast('Hôm nay Thị Trưởng đã xử lý đủ chuyện rồi. Mai khối phố sẽ có chuyện mới để phân xử!');
      return;
    }
    showToast('Bà con còn đang bàn luận chuyện vừa rồi. Chuyện mới sẽ tới ngay khi phố rảnh người!');
  }, [activeRequests.length, pendingEvent, showToast]);

  /**
   * Nguon DUY NHAT tu dong mo Chuyen Pho: cu 5-8 phut mot lan.
   *
   * Doc state qua getCityState() thay vi dua pendingEvent/activeRequests vao
   * deps: neu them chung vao deps thi moi lan phoi thay doi se huy va dat lai
   * hen gio, khien no gan nhu khong bao gio chay het mot vong.
   *
   * `dangMoModal` chan viec chen ngang khi nguoi choi dang lam viec khac. Thieu
   * no thi hop thoai de len Toa Thi Chinh / Kho Do dang mo va an mat thao tac
   * do - dung canh da gap khi kiem thu.
   */
  useEffect(() => {
    if (!isPlaying) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const s = getCityState();
        const dangBan = s.activeRequests.length > 0;
        const dangMoModal = modalDangMoRef.current;
        if (!dangBan && !dangMoModal) {
          // Da co san mot su kien treo thi mo luon, chua co thi goi them.
          if (s.pendingEvent || triggerNextEvent() === 'ok') setDialogueOpen(true);
        }
        schedule();
      }, AUTO_EVENT_MIN_MS + Math.random() * (AUTO_EVENT_MAX_MS - AUTO_EVENT_MIN_MS));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [isPlaying]);

  /**
   * Tu trao thuong khi thanh pho len bac moi. Chay theo `buildings` vi bac chi
   * phu thuoc dan so va so cong trinh, ma ca hai deu suy tu mang nay.
   */
  useEffect(() => {
    if (!isPlaying) return;
    const id = requestAnimationFrame(() => {
      const moi = claimCityTierRewards();
      if (moi.length === 0) return;
      const cao = moi[moi.length - 1];
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.35);
      /*
       * Lên bậc thành phố nay đã gấp hiệu ứng chuỗi ngày.
       *
       * Trước đây chuỗi ngày có 3 lớp (confetti + vòng sáng + rung màn hình +
       * số bay) còn lên bậc chỉ có 1 lớp. Người chơi chơi 40 ngày liên tiếp
       * không thấy gì, xây tiệm lên bậc mới thấy náy - đảo ngược thứ tự ưu tiên
       * của khoảnh khắc này.
       */
      particles.levelUpRing(window.innerWidth / 2, window.innerHeight * 0.42);
      shake(5);
      floatNumber(
        window.innerWidth / 2,
        window.innerHeight * 0.32,
        `🏙️ Rank ${cao.rank}/8 · ${cao.name}`,
        '#A8246B',
      );
      showToast(`Thành phố lên Rank ${cao.rank}: ${cao.name}! ${cao.tagline}`);
    });
    return () => cancelAnimationFrame(id);
  }, [buildings, isPlaying, showToast, shake, floatNumber]);

  /*
   * Phản hồi lên cấp Thị Trưởng.
   *
   * Trước đây `mayorLevel` tăng mà không có gì xảy ra: không hình, không
   * số, không rung. Người chơi lên 50 cấp mà phải tự đi đếm mới biết mình
   * lên cấp - cấp độ là biến quan trọng nhất trong game mà lại im lặng nhất.
   */
  useEffect(() => {
    if (!isPlaying) return;
    /*
     * CHỈ mừng khi cấp TĂNG thật, không mừng lần chạy đầu.
     *
     * `isPlaying` chuyển từ false sang true ngay khi người chơi đặt tên xong,
     * nên effect chạy một lần với `level = 1`. Không có ref này thì mọi người
     * chơi mới đều thấy "Cấp 1!" ngay khi vừa vào phố - mừng một thứ họ
     * chưa làm gì để có, và làm hỏng cả ý nghĩa của hiệu ứng.
     */
    const daDanh = levelDaQuanLy.current;
    if (daDanh === null) {
      levelDaQuanLy.current = level;
      return;
    }
    if (level <= daDanh) {
      levelDaQuanLy.current = level;
      return;
    }
    levelDaQuanLy.current = level;

    particles.levelUpRing(window.innerWidth / 2, window.innerHeight * 0.45);
    shake(3);
    floatNumber(window.innerWidth / 2, window.innerHeight * 0.34, `⬆️ Cấp ${level}`, '#D9A441');
    showToast(`Lên cấp ${level}! Càng cấp cao thì càng mở được công trình lớn.`);
  }, [level, isPlaying, shake, floatNumber, showToast]);

  /**
   * Trao thuong moc chuoi ngay choi lien tiep.
   *
   * Chay khi `streak.days` doi: `claimStreakMilestones` tu bo qua moc da nhan
   * nen goi lai nhieu lan khong cong them.
   */
  useEffect(() => {
    if (!isPlaying) return;
    const id = requestAnimationFrame(() => {
      const earned = claimStreakMilestones();
      if (earned.length === 0) return;
      const cao = earned[earned.length - 1];
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.3);
      particles.levelUpRing(window.innerWidth / 2, window.innerHeight * 0.42);
      shake(5);
      floatNumber(
        window.innerWidth / 2,
        window.innerHeight * 0.3,
        `🔥 ${earned.length} chuỗi ngày vừa mở khoá!`,
        '#B33A2B',
      );
      showToast(`${cao.title} · +${formatCompact(cao.rewardCoins)} đồng +${cao.rewardGems} KC`);
    });
    return () => cancelAnimationFrame(id);
  }, [streakDays, isPlaying, showToast, shake, floatNumber]);

  const hasPendingEventOrRequest = Boolean(pendingEvent || activeRequests.length > 0);

  const canAfford = useCallback(
    (def: BuildingDef) => coins >= def.costCoins && gems >= def.costGems,
    [coins, gems],
  );

  const handlePick = useCallback(
    (def: BuildingDef) => {
      let target = selected;
      if (!target) {
        /*
         * Uu tien o trong hang dang xem truoc. Board chi hien MOT hang pho nen
         * quet theo hang thi se chon duoc o ma nguoi choi khong nhin thay.
         */
        const bSet = new Set(buildings.map((b) => `${b.col}:${b.row}`));
        const rows = [activeRow, ...Array.from({ length: unlockedRows }, (_, r) => r).filter((r) => r !== activeRow)];
        outer: for (const r of rows) {
          if (r >= unlockedRows) continue;
          for (let c = 0; c < unlockedCols; c++) {
            if (!bSet.has(`${c}:${r}`)) {
              target = { col: c, row: r };
              setSelected(target);
              break outer;
            }
          }
        }
      }
      if (!target) {
        setDrawerOpen(false);
        showToast('Tất cả lô đất đã có tiệm! Hãy bấm Mở Rộng Phố để thêm mặt tiền mới.');
        return;
      }
      const result = placeBuilding(target.col, target.row, def.id);
      if (result === 'ok') {
        setDrawerOpen(false);
        particles.buildCelebration(window.innerWidth / 2, window.innerHeight * 0.45);
        floatNumber(window.innerWidth / 2, window.innerHeight * 0.45, `+${def.name}! 🎉`, '#A8246B');
        showToast(`Đã khai trương ${def.name}! Bắt đầu thu ${formatRate(def.baseYieldPerSec)}.`);
      } else {
        showToast(ERROR_MESSAGE[result]);
      }
    },
    [buildings, floatNumber, selected, showToast, unlockedCols, unlockedRows],
  );



  const handleBuyLand = useCallback(() => {
    if (buyLand()) {
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.6);
      floatNumber(window.innerWidth / 2, window.innerHeight * 0.6, '+1 Mặt Tiền Đất! 🏗️', '#A8701F');
      showToast('Đã mở rộng thêm lô đất mặt tiền mới trên Đại lộ MoCity!');
    } else {
        showToast('Chưa đủ đồng để mở rộng thêm mặt tiền mới.');
    }
  }, [floatNumber, showToast]);

  const handleClaimOffline = useCallback(() => {
    particles.coinShower(window.innerWidth / 2, window.innerHeight * 0.5, 25);
    claimOffline();
  }, []);

  const handleManualHarvest = useCallback(() => {
    const res = harvestManual();
    if (!res.ok) {
      playError();
      showToast(res.message);
      return;
    }

    if (res.isJackpot) {
      playJackpot();
      shake(8);
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.45);
      floatNumber(
        window.innerWidth / 2,
        window.innerHeight * 0.45,
        `💥 SIÊU LỢI NHUẬN x10! +${formatCompact(res.earned)}đ!`,
        '#F59E0B',
      );
    } else {
      playTing(1.1);
      shake(2);
      particles.coinShower(window.innerWidth / 2, window.innerHeight * 0.5, 20);
      floatNumber(
        window.innerWidth / 2,
        window.innerHeight * 0.5,
        `⚡ +${formatCompact(res.earned)}đ (+10%)`,
        '#10B981',
      );
    }
    showToast(res.message);
  }, [shake, floatNumber, showToast]);

  const handleResolveIncident = useCallback(
    (id: string) => {
      const res = resolveIncident(id);
      if (res.ok) {
        if (res.coveredByInsurance) {
          playSuccess();
          particles.confetti(window.innerWidth / 2, window.innerHeight * 0.3);
        } else {
          playTing();
        }
        showToast(res.message);
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      const inc = spawnRandomIncident();
      if (inc) {
        playAlert();
        shake(4);
      }
    }, 90_000);
    return () => clearInterval(timer);
  }, [isPlaying, shake]);

  /*
   * ĐÓNG ĐƠN KHÔNG CÒN LÀ HÀNH ĐỘNG CỦA NGƯỜI CHƠI.
   *
   * Trước đây 2 handler ở đây (`handleCloseOrder`/`handleClearQueue`) là
   * toàn bộ vòng tiền - bấm tay mới ra tiền. Giờ `tickIdle` tự đóng đơn qua
   * `autoServeQueues` (xem `lib/mocity/store.ts`), tốc độ do số Nhân Viên
   * quyết định, không có nút nào ở đây nữa. Khách tăng tốc phục vụ qua tab
   * "Quản Lý Nhân Viên" trong `StoreInspectorModal`, không phải qua HUD.
   */

  const canExpand = derived.capacity < 100;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#EDEAE2] text-[#1C171A]">
      <GameJuiceStyles />
      <FloatingNumbers />
      <RetroFilm />

      {/* 0. CỔNG CHỜ SESSION + THANH PHỐ - tránh nháy thành phố mặc định 1 nhịp */}
      {(sessionStatus === 'loading' || !cityHydrated) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#140F12]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#C9A227] border-t-transparent" />
            <p className="text-xs font-black uppercase tracking-wide text-[#F5E6C8]">
              Đang mở Đô Thị MoCity…
            </p>
          </div>
        </div>
      )}

      {/* 1. MÀN HÌNH CHÀO MỪNG - cổng vào trước khi chơi (!isPlaying) */}
      {/* z-[55] > header z-50, < loading gate z-[60] — tránh header click xuyên modal */}
      {sessionStatus !== 'loading' && cityHydrated && !isPlaying && (
        <div className="fixed inset-0 z-[55]">
        <WelcomeScreen
          displayName={session?.user?.name ?? null}
          hasNamedCity={hasNamedCity}
          mayorName={mayorName}
          cityName={cityName}
          coins={coins}
          npcCount={npcs.length}
          buildingCount={buildings.length}
          mayorLevel={level}
          offlineBonus={offlineBonus}
          mayorInput={mayorInput}
          cityInput={cityInput}
          onMayorInputChange={setMayorInput}
          onCityInputChange={setCityInput}
          onStart={handleCompleteLogin}
        />
        </div>
      )}

      {/* 2. THANH HUD GAME TRÊN CÙNG */}
      <header
        className="relative z-50 flex shrink-0 items-center justify-between gap-2 border-b-2 border-[#8B5E1A] px-2 py-1.5 sm:px-3"
        style={{
          background: 'linear-gradient(180deg, #3D1F06 0%, #5C2D0E 50%, #3D1F06 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,50,0.15)',
        }}
      >
        {/* LEFT: nav + city badge */}
        {/*
         * Khối tên thành phố giữ CHỖ TỐI THIỂU.
         *
         * Be Vietnam Pro rộng hơn Oswald nên "Đô Thị MoCity" cần 109px trong
         * khi chỗ còn lại chỉ 73px - tên bị cắt thành "Đô Thị ...". Cho nó
         * `shrink-0` và một bề ngang tối thiểu, để phần co lại là nhóm nút
         * bên phải vốn đều có icon tự giải thích.
         */}
        <div className="flex shrink-0 items-center gap-2 lg:min-w-[260px]">
          <Link
            href="/"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#8B5E1A] bg-[#2A1305] text-[#C9A227] transition-colors hover:border-[#C9A227] hover:text-amber-300"
            title="Về Trang chủ"
          >
            <ArrowLeft size={15} />
          </Link>

          <button
            type="button"
            onClick={() => {
              setMayorModalTab('PROFILE');
              setMayorModalOpen(true);
            }}
            className="relative flex items-center gap-2 overflow-hidden rounded-xl border border-[#8B5E1A] bg-[#2A1305]/60 px-2.5 py-1 pb-1.5 text-left transition-colors hover:border-[#C9A227]"
            title={
              cityTierNext
                ? `Rank ${cityTier.rank}/${CITY_TIERS.length} - ${cityTier.name}. Lên ${cityTierNext.name} cần ${cityTierNext.minPopulation.toLocaleString('vi-VN')} cư dân và ${cityTierNext.minBuildings} công trình.${cityTierNext.unlocks ? ` Mở khóa: ${cityTierNext.unlocks.headline}.` : ''}`
                : `Rank ${cityTier.rank}/${CITY_TIERS.length} - ${cityTier.name} (rank cao nhất).`
            }
          >
            {/*
             * Huy hieu BAC THANH PHO, khong phai cap Thi Truong.
             *
             * Dung chu "RANK" chu KHONG dung "LEVEL": `Lv.` da la cap Thi
             * Truong o chip ben canh, hai tien trinh khac nhau ma cung goi
             * Level thi lai nhap lam mot nhu ban cu.
             *
             * O day truoc hien `C.{level}` - dung con so ma chip "THỊ TRƯỞNG
             * Lv.{level}" o giua da hien, nen thanh HUD noi cung mot thu hai
             * lan o hai cho khac nhau. Bac thanh pho thi chua co cho nao noi,
             * nen doi cho no hop ly hon.
             */}
            <span
              className="flex h-8 w-9 shrink-0 flex-col items-center justify-center rounded-lg leading-none text-white shadow-inner"
              style={{ background: 'linear-gradient(135deg, #34D399, #0F766E)' }}
            >
              <span className="text-[7px] font-black uppercase tracking-wider opacity-80">Rank</span>
              <span className="font-pixel text-[13px] leading-none">
                {cityTier.rank}
                <span className="text-[12px] opacity-70">/{CITY_TIERS.length}</span>
              </span>
            </span>
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-black uppercase text-amber-200">
                  {cityName || 'Đô Thị MoCity'}
                </span>
                <span className="rounded bg-emerald-800/80 px-1 py-0.5 text-[11px] font-black text-emerald-300">
                  {buildings.length}/{derived.capacity}
                </span>
              </div>
              {/*
               * "60%" tran trui khong noi duoc la phan tram cua cai gi. Them
               * chu "Hài lòng" de khong phai doan.
               */}
              <p className="truncate text-[12px] font-bold text-amber-400/80">
                {cityTier.name} · Hài lòng {Math.round(derived.happiness)}%
                {derived.happiness < HAPPINESS_WARNING_AT && (
                  <span className="text-red-400"> ⚠</span>
                )}
              </p>
            </div>

            {/*
             * Tien do len bac sau, ve nhu VIEN DAY cua nut: `absolute` nen
             * khong cong them dong nao vao chieu cao thanh HUD.
             */}
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-xl"
              style={{ background: '#2A1305' }}
            >
              <span
                className="block h-full transition-[width] duration-500"
                style={{ width: `${cityTierPct}%`, background: 'linear-gradient(90deg,#34D399,#FBBF24)' }}
              />
            </span>
          </button>
        </div>

        {/* CENTER: resource chips */}
        <div className="flex items-center gap-1.5">
          {/* đồng */}
          <div
            className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1 shadow-inner"
            style={{
              background: 'linear-gradient(135deg, #1C0D00, #3B1E00)',
              borderColor: '#C9A227',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            <CircleDollarSign size={17} className="shrink-0 text-amber-400" />
            <div>
                <span className="font-pixel text-base leading-none text-amber-200" title={formatNumber(coins)}>
                  {formatCompact(coins)}
                </span>
              {/*
                KHÔNG còn "+đồng/s" dưới ví nữa - dòng tiền tự sinh đã bị gỡ.
                Khi có đơn chờ thì việc cần làm là bấm; khi chưa có thì con số
                còn lại là TIỀM NĂNG, không phải tiền đang vào tài khoản.
              */}
              <p
                className={`text-[10.5px] font-black leading-none ${
                  backlog > 0 ? 'text-emerald-400' : 'text-amber-500/70'
                }`}
                title={
                  backlog > 0
                    ? 'Khách đang chờ. Bấm badge trên bảng hiệu để bán từng đơn.'
                    : 'Sản lượng tối đa nếu bạn liên tục bán hết khách.'
                }
              >
                {backlog > 0 ? `${backlog} đơn chờ · bấm để bán` : `tiềm năng ${formatRate(derived.rate)}`}
              </p>
            </div>
          </div>

          {/* KC Gems */}
          <div
            className="flex items-center gap-1 rounded-xl border px-2 py-1.5"
            style={{
              background: 'linear-gradient(135deg, #0C1A2E, #1E3A5F)',
              borderColor: '#38BDF8',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            <Star size={14} className="shrink-0 fill-sky-400 text-sky-400" />
            <span className="font-pixel text-sm leading-none text-sky-200">{gems}</span>
          </div>

          {/* Năng Lượng AP */}
          <div
            className="flex items-center gap-1 rounded-xl border px-2 py-1.5 shadow-inner"
            style={{
              background: 'linear-gradient(135deg, #2D1405, #4A2308)',
              borderColor: '#F59E0B',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }}
            title={`Năng Lượng Hành Động: ${ap}/50. Hồi 1 AP mỗi 5 phút. Dùng 1 AP để Thu Hoạch Tức Thì (+10% Bonus VNĐ & 5% cơ hội nổ Siêu Lợi Nhuận x10)!`}
          >
            <Zap size={14} className="shrink-0 fill-amber-400 text-amber-400" />
            <span className="font-pixel text-sm leading-none text-amber-200">
              {ap}<span className="text-[10px] opacity-70">/50</span>
            </span>
          </div>

          {/*
           * Chuỗi ngày chơi + thanh cấp Thị Trưởng ĐÃ CHUYỂN ra khỏi header.
           *
           * Header gốc nhồi 5 ô viền-màu-riêng (rank xanh lá, xu đen-vàng, kim
           * cương xanh dương, chuỗi cam, XP tím) sát nhau không theo hệ thống
           * nào - rối mắt. Giữ lại đúng thứ cần quyết định NGAY (Xu, Kim
           * Cương) trên header; Cấp Thị Trưởng + Chuỗi ngày xem trong Hồ Sơ
           * Thị Trưởng (nút Crown bên phải) - đã có đủ cả 2 (tab PROFILE và
           * tab Chuỗi), không mất thông tin, chỉ bớt nhồi nhét.
           */}
        </div>

        {/* RIGHT: action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Chuyện Phố */}
          <button
            type="button"
            onClick={handleOpenDialogue}
            className={cn(
              'relative flex h-9 items-center gap-1 rounded-lg border px-2.5 text-xs font-black transition-all',
              hasPendingEventOrRequest
                ? 'border-pink-500 bg-pink-900/60 text-pink-300 animate-pulse'
                : 'border-[#6B4423] bg-[#2A1305]/60 text-amber-300/70 hover:border-amber-500 hover:text-amber-200',
            )}
            title="Chuyện Phố"
          >
            <MessageSquareWarning size={14} className="shrink-0" />
            <span className="hidden md:inline text-[12px]">Chuyện Phố</span>
            {hasPendingEventOrRequest && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#A8246B] text-[8px] font-black text-white">!</span>
            )}
          </button>

          {/*
           * Kho Đồ ĐÃ BỎ khỏi thanh trên - nó trùng y hệt nút Kho Đồ trên
           * thanh dưới. Hai lối vào cho cùng một bảng vừa thừa vừa chiếm chỗ
           * của tên thành phố, vốn đang bị cắt mất chữ.
           */}

          {/* Share */}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#6B4423] bg-[#2A1305]/60 text-amber-300/70 transition-colors hover:border-amber-500 hover:text-amber-200"
            title="Chia sẻ phố"
          >
            <Share2 size={14} />
          </button>


          {/* Mayor profile - "Lv.X" nhỏ thay cho thanh XP tím đã bỏ khỏi header */}
          <button
            type="button"
            onClick={() => {
              if (hasNamedCity) { setMayorModalTab('PROFILE'); setMayorModalOpen(true); }
              else { setIsPlaying(false); }
            }}
            className="flex h-9 items-center gap-1 rounded-lg border border-[#8B5E1A] bg-[#2A1305]/80 px-2 text-[12px] font-black text-amber-300 hover:border-[#C9A227]"
            title={hasNamedCity ? `Hồ Sơ Thị Trưởng · Cấp ${level}` : 'Đăng Nhập'}
          >
            <Crown size={13} className="shrink-0 text-[#C9A227]" />
            {hasNamedCity && <span className="text-violet-300">Lv.{level}</span>}
            <span className="hidden lg:inline">{hasNamedCity ? mayorName : 'Login'}</span>
          </button>
        </div>
      </header>

      {/* 3. BẢN ĐỒ PHỐ THỊ MOCITY 2D (CHIẾM TRỌN KHÔNG GIAN MÀN HÌNH) */}
      <div ref={boardHostRef} className="relative min-h-0 flex-1 w-full">
        <ViaHeStreetBoard
          selected={selected}
          onSelect={handleSelect}
          onOpenRequest={handleOpenRequest}
          onOpenBuildDrawer={() => setDrawerOpen(true)}
          orderQueues={orderQueues}
          cityScale={cityScale}
          onActiveRowChange={setActiveRow}
        />
        <ParticleEngine />

        {isPlaying && <CoinBubble hostRef={boardHostRef} />}



        {/* SỰ CỐ ĐÔ THỊ ĐANG DIỄN RA */}
        {isPlaying && activeIncidents.length > 0 && (
          <div className="pointer-events-auto absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border-2 border-rose-500 bg-rose-600/95 px-4 py-2 text-white shadow-xl animate-bounce">
            <ShieldAlert size={18} className="text-amber-300 animate-pulse shrink-0" />
            <span className="text-xs font-black">
              {activeIncidents[0].description}
            </span>
            <button
              type="button"
              onClick={() => handleResolveIncident(activeIncidents[0].id)}
              className="ml-2 whitespace-nowrap rounded-xl bg-white px-2.5 py-1 text-xs font-black text-rose-700 shadow hover:bg-amber-100 active:scale-95"
            >
              {hasInsurance ? 'Bảo Hiểm Đền (0đ)' : 'Khắc Phục (500Kđ)'}
            </button>
          </div>
        )}

        {/* 5. THANH DOCK QUẢN LÝ THÀNH PHỐ NỔI Ở ĐÁY MÀN HÌNH */}
        {isPlaying && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3">
            <div
              style={{ backgroundColor: '#FFFDF7' }}
              className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border-2 border-[#78533D] bg-[#FFFDF7] p-1.5 shadow-[0_14px_34px_rgba(20,12,8,0.4)]"
            >
              {/* Thu Hoạch Tức Thì (AP) */}
              <button
                type="button"
                onClick={handleManualHarvest}
                disabled={ap < 1}
                className="flex h-11 items-center gap-1.5 rounded-xl border-2 border-[#D97706] bg-gradient-to-r from-amber-500 to-amber-600 px-3 text-xs font-black text-white shadow transition-transform hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                title="Thu hoạch tức thì: Tốn 1 AP, nhận +10% Bonus VNĐ & 5% cơ hội nổ Siêu Lợi Nhuận x10!"
              >
                <Zap size={15} className="shrink-0 fill-white text-white animate-bounce" />
                <div className="flex flex-col items-start leading-none">
                  <span>Thu Hoạch</span>
                  <span className="text-[9px] text-amber-100 font-bold">+10% · 1 AP</span>
                </div>
              </button>

              <div className="h-9 w-px shrink-0 bg-[#D5CEBF]" />

              {/* Primary CTA */}
              <button
                type="button"
                data-tour="build"
                onClick={() => setDrawerOpen(true)}
                className="flex h-11 items-center gap-1.5 rounded-xl border-2 border-[#73164A] bg-[#A8246B] px-4 text-xs font-black text-white shadow transition-transform hover:bg-[#B8307A] active:scale-95"
              >
                <Hammer size={15} className="shrink-0" />
                <span>Mở Tiệm Mới</span>
              </button>

              <div className="h-9 w-px shrink-0 bg-[#D5CEBF]" />

              {/* Quản Lý Tiệm */}
              <button
                type="button"
                data-tour="manage"
                onClick={() => {
                  if (!selectedBuilding && buildings.length > 0) {
                    setSelected({ col: buildings[0].col, row: buildings[0].row });
                  }
                  if (buildings.length === 0) {
                    showToast('Hãy mở tiệm đầu tiên trước khi gắn Loa Thần Tài QR & thuê Quản lý!');
                    setDrawerOpen(true);
                    return;
                  }
                  setInspectorOpen(true);
                  markTutorialFlag('inspector');
                }}
                className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#A8246B] hover:bg-white"
                title="Quản Lý Tiệm & Loa QR"
              >
                <SlidersHorizontal size={15} className="shrink-0 text-[#A8246B]" />
                <span className="text-[11px] font-black leading-none">Quản Lý</span>
              </button>

              {/* Mở Rộng Phố */}
              <button
                type="button"
                disabled={!canExpand}
                onClick={handleBuyLand}
                className={cn(
                  'relative flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-3 transition-colors',
                  canExpand
                    ? 'border-[#C9A227] bg-[#FFFBEB] text-[#3E2A1B] hover:bg-[#FEF3C7]'
                    : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400',
                )}
                title={canExpand ? `Mở Rộng Phố - ${formatCompact(derived.landCost)}` : 'Mở Rộng Phố (chưa đủ tiền)'}
              >
                <Plus size={15} className={cn('shrink-0', canExpand ? 'text-[#A8701F]' : 'text-gray-400')} />
                <span className="text-[11px] font-black leading-none">Mở Rộng</span>
                {canExpand && (
                  <span className="absolute -top-1.5 -right-1 rounded bg-amber-400 px-1 text-[8px] font-black text-[#92400E] leading-tight">
                    {formatCompact(derived.landCost)}
                  </span>
                )}
              </button>

              {/* Nhiệm Vụ */}
              <button
                type="button"
                onClick={() => {
                  setMayorModalTab('QUESTS');
                  setMayorModalOpen(true);
                }}
                className="relative flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#A8246B] hover:bg-white"
                title="Nhiệm Vụ"
              >
                <Star size={15} className="shrink-0 fill-amber-400 text-amber-600" />
                <span className="text-[11px] font-black leading-none">Nhiệm Vụ</span>
                {claimableQuestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#A8246B] px-1 text-[8px] font-black text-white">
                    {claimableQuestsCount}
                  </span>
                )}
              </button>

              {/* Kho Đồ */}
              <button
                type="button"
                onClick={() => {
                  setInventoryTab('ITEMS');
                  setInventoryOpen(true);
                }}
                className="relative flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#A8246B] hover:bg-white"
                title="Kho Đồ & Quà Tặng"
              >
                <Package size={15} className="shrink-0 text-[#A8246B]" />
                <span className="text-[11px] font-black leading-none">Kho Đồ</span>
                {totalInventoryCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#A8246B] px-1 text-[8px] font-black text-white">
                    {totalInventoryCount}
                  </span>
                )}
              </button>

              {/* Nhân Vật */}
              <button
                type="button"
                onClick={() => {
                  setInventoryTab('CHARACTERS');
                  setInventoryOpen(true);
                }}
                className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#A8246B] hover:bg-white"
                title="Nhân Vật & Thoại"
              >
                <MessageSquareHeart size={15} className="shrink-0 text-[#059669]" />
                <span className="text-[11px] font-black leading-none">Nhân Vật</span>
              </button>

              {/* Quản Lý Ngân Khố Thành Phố */}
              <button
                type="button"
                onClick={() => setFinanceModalOpen(true)}
                className="relative flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#A8246B] hover:bg-white"
                title="Quản Lý Ngân Khố: Heo Đất Tiết Kiệm, Quỹ Đầu Tư, Vốn Vay & Bảo Hiểm"
              >
                <PiggyBank size={15} className="shrink-0 text-[#A8246B]" />
                <span className="text-[11px] font-black leading-none">Ngân Khố</span>
                {(savingsBalance > 0 || investedAmount > 0 || debt > 0) && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  </span>
                )}
              </button>

              {/* Tòa Thị Chính */}
              <button
                type="button"
                data-tour="cityhall"
                onClick={() => {
                  setMayorModalTab('CITIZENS');
                  setMayorModalOpen(true);
                }}
                className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#A8246B] hover:bg-white"
                title="Tòa Thị Chính & Cư Dân"
              >
                <Users size={15} className="shrink-0 text-[#2563EB]" />
                <span className="text-[11px] font-black leading-none">Thị Chính</span>
              </button>
            </div>
          </div>
        )}

        {toast && (
          <div
            role="status"
            className="pointer-events-none absolute inset-x-3 top-16 z-40 flex justify-center"
          >
            <p className="max-w-full rounded-2xl border-2 border-white bg-[#1C171A]/95 px-4 py-2 text-xs font-black text-white shadow-xl">
              {toast}
            </p>
          </div>
        )}
      </div>

      {isPlaying && (
        <TutorialCoach hidden={drawerOpen || mayorModalOpen || inventoryOpen || Boolean(dialogueView)} />
      )}

      <BuildDrawer
        open={drawerOpen}
        activeTab={tab}
        onTabChange={setTab}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
        onPick={handlePick}
        canAfford={canAfford}
      />

      <StoreInspectorModal
        open={inspectorOpen}
        node={selectedBuilding}
        onClose={() => {
          setInspectorOpen(false);
          setSelected(null);
        }}
        onToast={showToast}
      />

      <MayorCenterModal
        open={mayorModalOpen}
        initialTab={mayorModalTab}
        onClose={() => setMayorModalOpen(false)}
        onToast={showToast}
        onOpenDialogue={handleOpenDialogue}
      />

      <InventoryModal
        open={inventoryOpen}
        initialTab={inventoryTab}
        onClose={() => setInventoryOpen(false)}
        onToast={showToast}
      />

      <DialogueModal
        view={isPlaying ? dialogueView : null}
        coins={coins}
        onChoose={handleChooseDialogue}
        onClose={handleCloseDialogue}
      />

      <OfflineRewardModal
        open={isPlaying && offline !== null}
        coins={offline?.coins ?? 0}
        elapsedMs={offline?.elapsedMs ?? 0}
        orders={offline?.orders ?? 0}
        capped={offline?.capped ?? false}
        onClaim={handleClaimOffline}
        onClose={handleClaimOffline}
      />

      {shareOpen && (
        <ShareCityCard
          mayorName={mayorName || 'Thị Trưởng MoMo'}
          cityName={cityName || 'Đô Thị MoCity'}
          totalRevenue={totalRevenue ?? 0}
          totalCoinsEarned={totalCoinsEarned ?? coins}
          coinsPerSec={derived.rate}
          mayorLevel={level}
          onClose={() => setShareOpen(false)}
        />
      )}

      <MoMoFinanceModal
        isOpen={financeModalOpen}
        initialTab={financeTab}
        onClose={() => setFinanceModalOpen(false)}
      />

      <MicroQuizModal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
      />
    </div>
  );
}
