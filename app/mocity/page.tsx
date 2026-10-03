'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowUpCircle,
  CircleDollarSign,
  Crown,
  Flame,
  Gift,
  Hammer,
  MapPin,
  MessageSquareHeart,
  MessageSquareWarning,
  Package,
  Plus,
  Share2,
  SlidersHorizontal,
  Star,
  Store,
  Users,
  X,
} from 'lucide-react';
import ViaHeStreetBoard from '@/components/mocity/ViaHeStreetBoard';
import BuildDrawer from '@/components/mocity/BuildDrawer';
import CoinBubble from '@/components/mocity/CoinBubble';
import ParticleEngine, { particles } from '@/components/mocity/ParticleEngine';
import { FloatingNumbers, GameJuiceStyles, useBouncyCounter, useGameJuice } from '@/lib/mocity/useGameJuice';
import { TimeOfDaySwitcher } from '@/components/mocity/StreetAmbiance';
import OfflineRewardModal from '@/components/mocity/OfflineRewardModal';
import ShareCityCard from '@/components/mocity/ShareCityCard';
import DialogueModal, { type DialogueView } from '@/components/mocity/DialogueModal';
import WelcomeScreen from '@/components/mocity/WelcomeScreen';
import StoreInspectorModal from '@/components/mocity/StoreInspectorModal';
import MayorCenterModal from '@/components/mocity/MayorCenterModal';
import TutorialCoach from '@/components/mocity/TutorialCoach';
import RetroFilm from '@/components/mocity/RetroFilm';
import InventoryModal from '@/components/mocity/InventoryModal';
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
  OFFLINE_CAP_MS,
  placeBuilding,
  resolveEvent,
  resolveRequest,
  triggerFeverMode,
  triggerNextEvent,
  claimCityTierRewards,
  IDLE_XP_DAILY_CAP,
  claimStreakMilestones,
  upgradeBuilding,
  getCityState,
  useCity,
  useCityDerived,
  useCityHydrated,
  MAX_MAYOR_LEVEL,
  FEVER_COST_GEMS,
  FEVER_PER_DAY,
  type PlaceResult,
  type UpgradeResult,
} from '@/lib/mocity/store';
import { useIdleTick } from '@/lib/mocity/useIdleTick';
import {
  MAYOR_QUESTS,
  BUILDING_BY_ID,
  MANAGER_BY_ID,
  ZONES,
  upgradeCostCoins,
  xpForLevel,
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
const LOGIN_BONUS_COINS = 50_000;

const ERROR_MESSAGE: Record<PlaceResult, string> = {
  ok: '',
  locked: 'Ô đất này chưa được quy hoạch. Mở rộng đất trước đã.',
  occupied: 'Ô này đã có công trình.',
  level: 'Cấp Thị Trưởng chưa đủ để xây công trình này.',
  funds: 'Chưa đủ Xu. Đợi thu thêm hoặc thu bong bóng Xu nhé.',
};

const UPGRADE_MESSAGE: Record<UpgradeResult, string> = {
  ok: '',
  missing: 'Ô này chưa có công trình để nâng cấp.',
  max: 'Công trình đã đạt cấp tối đa.',
  funds: 'Chưa đủ Xu để nâng cấp công trình này.',
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
  const [cityScale, setCityScale] = useState(1.0);
  const [selected, setSelected] = useState<{ col: number; row: number } | null>(null);
  /** Hang pho dang xem tren board. */
  const [activeRow, setActiveRow] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [mayorModalOpen, setMayorModalOpen] = useState(false);
  const [mayorModalTab, setMayorModalTab] = useState<'PROFILE' | 'QUESTS' | 'CITIZENS'>('PROFILE');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<'ITEMS' | 'RELICS' | 'CHARACTERS'>('ITEMS');
  /*
   * Guong `ref` cua cac modal. Effect tu mo Chuyen Pho doc qua day thay vi qua
   * deps: dua truc tiep vao deps se huy va dat lai hen gio moi lan nguoi choi
   * mo/dong mot bang bat ky, nen vong 5-8 phut gan nhu khong bao gio chay het.
   */
  const modalDangMoRef = useRef(false);

  const [tab, setTab] = useState('ALL');
  const [toast, setToast] = useState<string | null>(null);
  const [newBuildKey, setNewBuildKey] = useState<string | null>(null);

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
  const buildAnimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const coins = useCity((s) => s.coins);
  const totalCoinsEarned = useCity((s) => s.totalCoinsEarned);
  const totalRevenue = useCity((s) => s.totalRevenue ?? 0);
  /** So ngay choi lien tiep - chi doc, `registerStreak` lo phan ghi. */
  const streakDays = useCity((s) => s.streak?.days ?? 0);
  const streakBest = useCity((s) => s.streak?.best ?? 0);
  const gems = useCity((s) => s.gems);
  const level = useCity((s) => s.mayorLevel);
  const mayorXp = useCity((s) => s.mayorXp);
  const cityName = useCity((s) => s.cityName);
  const mayorName = useCity((s) => s.mayorName);
  const hasNamedCity = useCity((s) => s.hasNamedCity);
  const buildings = useCity((s) => s.buildings);
  /*
   * XP nhan roi da nhan hom nay. Doc qua selector de HUD canh bao ngay khi
   * cham tran, thay vi de nguoi choi tu hoi sao cot XP dung yen.
   */
  const idleXpToday = useCity((s) => s.dailyLog?.idleXp ?? 0);
  const offline = useCity((s) => s.pendingOffline);
  const npcs = useCity((s) => s.npcs);
  const activeRequests = useCity((s) => s.activeRequests);
  const pendingEvent = useCity((s) => s.pendingEvent);
  const claimedQuests = useCity((s) => s.claimedQuests ?? []);
  const unlockedCols = useCity((s) => s.unlockedCols);
  const unlockedRows = useCity((s) => s.unlockedRows);
  const inventory = useCity((s) => s.inventory);

  /**
   * So Xu nguoi choi SE nhan duoc khi bam "Nhan Qua & Vao Pho".
   * Phai khop chinh xac voi `completeMayorLogin`: thuong 50.000 Xu chi tra
   * lan dau (`hasNamedCity`), cac lan sau chi nhan thuong AFK. Truoc day UI
   * in cung `+50K XU` va `Vốn sẵn có 1.000.000 Xu` cho ca nguoi choi quay
   * lai - con số ma thuc te la 0.
   */
  /**
 * Thanh tien do cap Thị Truong.
 *
 * TRUOC day toan bo he XP vô hình: grep toan repo khong co UI nao doc
 * `mayorXp`, nen nguoi choi thay "Cấp 7" ma khong biet can bao nhieu de len
 * 8. Con so `xpForLevel` bay gio la nguon su that cho HUD, nen phai dung
 * chung ham tinh mau cot.
 */
const isMaxLevel = level >= MAX_MAYOR_LEVEL;
const idleXpCapped = idleXpToday >= IDLE_XP_DAILY_CAP;
const xpNeeded = xpForLevel(level);

const xpPct = isMaxLevel ? 100 : Math.min(100, Math.round((mayorXp / xpNeeded) * 100));

const firstTimeBonus = hasNamedCity ? 0 : LOGIN_BONUS_COINS;
  const offlineBonus = offline?.coins ?? 0;
  const loginBonus = firstTimeBonus + offlineBonus;
  const treasuryAfterLogin = coins + loginBonus;
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
  const { isAnimating: isCoinBouncing } = useBouncyCounter(coins);

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
    setMayorInput((prev) => prev || mayorName);
    if (cityName) setCityInput(cityName);
  }, [hasNamedCity, mayorName, cityName]);


  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (buildAnimTimer.current) clearTimeout(buildAnimTimer.current);
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
        `Chào mừng ${cleanMayor}! Đã nhận +${formatNumber(bonus)} Xu (Ngân khố: ${formatNumber(coins + bonus)} Xu).`,
      );
    } else {
      showToast(`Chào mừng trở lại ${cleanMayor}! Ngân khố hiện có ${formatNumber(coins)} Xu.`);
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
  const selectedDef = selectedBuilding ? BUILDING_BY_ID[selectedBuilding.defId] : undefined;
  const SelectedIcon = selectedDef ? BUILDING_ICON[selectedDef.icon] : null;
  const selectedYield = useMemo(
    () => (selectedBuilding ? nodeYieldBreakdown(selectedBuilding, buildings) : null),
    [selectedBuilding, buildings],
  );
  const assignedManager = selectedBuilding?.managerId
    ? MANAGER_BY_ID[selectedBuilding.managerId]
    : undefined;

  const atMaxLevel =
    !!selectedDef && !!selectedBuilding && selectedBuilding.level >= selectedDef.maxLevel;
  const upgradeCost =
    selectedDef && selectedBuilding ? upgradeCostCoins(selectedDef, selectedBuilding.level) : 0;
  const canAffordUpgrade = coins >= upgradeCost;

  const handleSelect = useCallback((col: number, row: number) => {
    setSelected((prev) => (prev?.col === col && prev?.row === row ? null : { col, row }));
  }, []);

  modalDangMoRef.current = drawerOpen || inspectorOpen || mayorModalOpen || inventoryOpen;

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
   * `speakerTag` chua duoc render nen bo trong ma de khong nham la dang dung.
   */
  const liveView = useMemo<DialogueView | null>(() => {
    if (pendingEvent) {
      const script = EVENT_BY_ID[pendingEvent.scriptId];
      if (script) {
        return {
          title: script.title,
          subtitle: script.subtitle,
          speaker: script.speaker,
          body: script.body,
          hue: '#C9A227',
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
          body: script.body,
          hue: ARCHETYPES[npc.archetype].hue,
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
        showToast('Chưa đủ Xu cho phương án này.');
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
    showToast(`${cao.title} · +${formatCompact(cao.rewardCoins)} Xu +${cao.rewardGems} KC`);
  }, [streakDays, isPlaying, showToast, shake, floatNumber]);

  const hasPendingEventOrRequest = Boolean(pendingEvent || activeRequests.length > 0);
  const pendingEventScript = pendingEvent ? EVENT_BY_ID[pendingEvent.scriptId] : null;

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
        const key = `${target.col}:${target.row}`;
        setNewBuildKey(key);
        if (buildAnimTimer.current) clearTimeout(buildAnimTimer.current);
        buildAnimTimer.current = setTimeout(() => setNewBuildKey(null), 900);
        showToast(`Đã khai trương ${def.name}! Bắt đầu thu ${formatRate(def.baseYieldPerSec)}.`);
      } else {
        showToast(ERROR_MESSAGE[result]);
      }
    },
    [buildings, floatNumber, selected, showToast, unlockedCols, unlockedRows],
  );

  const handleUpgrade = useCallback(() => {
    if (!selected) return;
    const result = upgradeBuilding(selected.col, selected.row, 1);
    if (result === 'ok') {
      particles.levelUpRing(window.innerWidth / 2, window.innerHeight * 0.5);
      floatNumber(window.innerWidth / 2, window.innerHeight * 0.5, '+45% Doanh Thu! 📈', '#10B981');
      showToast('Nâng cấp tiệm thành công! Doanh thu Xu mỗi giây tăng 45%.');
    } else {
      showToast(UPGRADE_MESSAGE[result]);
    }
  }, [floatNumber, selected, showToast]);

  const handleBuyLand = useCallback(() => {
    if (buyLand()) {
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.6);
      floatNumber(window.innerWidth / 2, window.innerHeight * 0.6, '+1 Mặt Tiền Đất! 🏗️', '#A8701F');
      showToast('Đã mở rộng thêm lô đất mặt tiền mới trên Đại lộ MoCity!');
    } else {
      showToast('Chưa đủ Xu để mở rộng thêm mặt tiền mới.');
    }
  }, [floatNumber, showToast]);

  const handleTriggerFever = useCallback(() => {
    if (derived.isFever) {
      showToast('Giờ Vàng x2 Doanh Thu đang hoạt động!');
      return;
    }
    if (derived.feverLeftToday <= 0) {
      showToast(`Hôm nay đã dùng hết ${FEVER_PER_DAY} lượt Giờ Vàng. Mai sẽ có thêm.`);
      return;
    }
    if (triggerFeverMode()) {
      shake(8);
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.3);
      floatNumber(window.innerWidth / 2, window.innerHeight * 0.3, 'GIỜ VÀNG x2 XU! 🔥', '#B33A2B');
      showToast(
        `Đã kích hoạt Giờ Vàng MoCity! Còn ${derived.feverLeftToday - 1} lượt hôm nay.`,
      );
    } else {
      showToast(`Cần ${FEVER_COST_GEMS} Kim Cương để kích hoạt Giờ Vàng x2 Xu.`);
    }
  }, [derived.isFever, derived.feverLeftToday, floatNumber, shake, showToast]);

  const handleClaimOffline = useCallback(() => {
    particles.coinShower(window.innerWidth / 2, window.innerHeight * 0.5, 25);
    claimOffline();
  }, []);

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
          buildingCount={buildings.length}
          npcCount={npcs.length}
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
        <div className="flex items-center gap-2 min-w-0">
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
                ? `Rank ${cityTier.rank}/${CITY_TIERS.length} - ${cityTier.name}. Lên ${cityTierNext.name} cần ${cityTierNext.minPopulation.toLocaleString('vi-VN')} cư dân và ${cityTierNext.minBuildings} công trình.`
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
                <span className="text-[10px] opacity-70">/{CITY_TIERS.length}</span>
              </span>
            </span>
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-black uppercase text-amber-200">
                  {cityName || 'Đô Thị MoCity'}
                </span>
                <span className="rounded bg-emerald-800/80 px-1 py-0.5 text-[9px] font-black text-emerald-300">
                  {buildings.length}/{derived.capacity}
                </span>
              </div>
              {/*
               * "60%" tran trui khong noi duoc la phan tram cua cai gi. Them
               * chu "Hài lòng" de khong phai doan.
               */}
              <p className="truncate text-[10px] font-bold text-amber-400/80">
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
          {/* Xu */}
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
              <div className="flex items-baseline gap-1">
                <span className="font-pixel text-base leading-none text-amber-200">{formatNumber(coins)}</span>
                <span className="text-[10px] font-black text-amber-500">XU</span>
              </div>
              <p className="text-[10.5px] font-black text-emerald-400 leading-none">+{formatRate(derived.rate)}</p>
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

          {/* Chuỗi ngày chơi liên tiếp */}
          {/*
           * Chi hien khi chuoi >= 2. Ngay 1 la chua phai chuoi - hien "1 ngày"
           * chi nham gam o chuc nang. Khi chuoi bi ngat, so ngay da vong van
           * hien (do la ly do người choi quay lai).
           */}
          {streakDays >= 2 && (
            <div
              className="flex shrink-0 items-center gap-1 rounded-xl border px-2 py-1.5"
              style={{
                background: 'linear-gradient(135deg, #3B0A05, #7C2D12)',
                borderColor: '#FB923C',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
              }}
              title={`Chuỗi ${streakDays} ngày liên tiếp · Kỷ lục ${streakBest} ngày`}
            >
              <Flame size={14} className="shrink-0 fill-orange-400 text-orange-400" />
              <span className="text-xs font-black text-orange-100">{streakDays}</span>
              <span className="hidden text-[10px] font-black uppercase text-orange-300/80 lg:inline">
                ngày
              </span>
            </div>
          )}

          {/* Thanh cấp Thị Trưởng */}
          {/*
           * Ba dong deu `whitespace-nowrap`: ban cu rong 112px nen "THỊ TRƯỞNG"
           * xuong hai dong, dong "% XP nữa" cung xuong dong, the cao len 69px va
           * day cao ca thanh HUD. Chot 150px la du cho muc XP 6 chu so.
           */}
          <div
            className="flex w-[155px] shrink-0 flex-col justify-center gap-[3px] rounded-xl border px-2.5 py-1"
            style={{
              background: 'linear-gradient(135deg, #1A0B2E, #3B1E5F)',
              borderColor: '#8C7FA8',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }}
            title={
              isMaxLevel
                ? 'Đã đạt cấp Thị Trưởng tối đa'
                : `${formatNumber(mayorXp)} / ${formatNumber(xpNeeded)} XP để lên cấp ${level + 1}\n` +
                  `XP nhàn rỗi hôm nay: ${formatNumber(Math.round(idleXpToday))} / ${formatNumber(IDLE_XP_DAILY_CAP)}` +
                  (idleXpCapped
                    ? '\nĐã chạm trần ngày. Xây, nâng cấp và làm nhiệm vụ để tiếp tục lên cấp.'
                    : '')
            }
          >
            <div className="flex items-baseline justify-between gap-1.5">
              <span className="whitespace-nowrap text-[10px] font-black uppercase leading-none tracking-wide text-violet-300">
                Thị Trưởng
              </span>
              <span className="whitespace-nowrap font-pixel text-sm leading-none text-violet-100">
                Lv.{level}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#2A1A45' }}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,#8C7FA8,#B8307A)' }}
              />
            </div>
            <p className="whitespace-nowrap text-[10px] font-black leading-none text-violet-300/80 tabular-nums">
              {isMaxLevel
                ? 'Cấp tối đa'
                : idleXpCapped
                  ? `${xpPct}% · hết XP nhàn rỗi`
                  : `${xpPct}% · còn ${formatCompact(xpNeeded - mayorXp)} XP`}
            </p>
          </div>
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
            <span className="hidden md:inline text-[10px]">Chuyện Phố</span>
            {hasPendingEventOrRequest && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#A8246B] text-[8px] font-black text-white">!</span>
            )}
          </button>

          {/* Kho Đồ */}
          <button
            type="button"
            onClick={() => { setInventoryTab('ITEMS'); setInventoryOpen(true); }}
            className="relative flex h-9 items-center gap-1 rounded-lg border border-[#6B4423] bg-[#2A1305]/60 px-2.5 text-amber-300/70 transition-colors hover:border-amber-500 hover:text-amber-200"
            title="Kho Đồ"
          >
            <Package size={14} className="shrink-0" />
            {totalInventoryCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#A8246B] px-0.5 text-[8px] font-black text-white">{totalInventoryCount}</span>
            )}
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#6B4423] bg-[#2A1305]/60 text-amber-300/70 transition-colors hover:border-amber-500 hover:text-amber-200"
            title="Chia sẻ phố"
          >
            <Share2 size={14} />
          </button>

          {/* Time of Day */}
          <TimeOfDaySwitcher />

          {/* Fever x2 */}
          <button
            type="button"
            onClick={handleTriggerFever}
            className={cn(
              'flex h-9 items-center gap-1 rounded-lg border px-2 text-[10px] font-black transition-transform active:scale-95',
              derived.isFever
                ? 'border-amber-500 bg-amber-600/50 text-amber-200 animate-pulse'
                : 'border-[#A8246B]/60 bg-[#A8246B]/10 text-[#A8246B] hover:bg-[#A8246B]/30',
            )}
          >
            <span>{derived.isFever ? '⚡x2' : 'x2'}</span>
          </button>

          {/* Mayor profile */}
          <button
            type="button"
            onClick={() => {
              if (hasNamedCity) { setMayorModalTab('PROFILE'); setMayorModalOpen(true); }
              else { setIsPlaying(false); }
            }}
            className="flex h-9 items-center gap-1 rounded-lg border border-[#8B5E1A] bg-[#2A1305]/80 px-2 text-[10px] font-black text-amber-300 hover:border-[#C9A227]"
            title={hasNamedCity ? 'Hồ Sơ Thị Trưởng' : 'Đăng Nhập'}
          >
            <Crown size={13} className="shrink-0 text-[#C9A227]" />
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
          onOpenEvent={handleOpenDialogue}
          onOpenBuildDrawer={() => setDrawerOpen(true)}
          onOpenInspector={() => setInspectorOpen(true)}
          cityScale={cityScale}
          onChangeScale={setCityScale}
          onActiveRowChange={setActiveRow}
        />
        <ParticleEngine />

        {isPlaying && <CoinBubble hostRef={boardHostRef} />}

        {/* 4. THẺ ĐIỀU KHIỂN TIỆM ĐANG CHỌN */}
        {isPlaying && selected && (
          <div
            style={{ backgroundColor: '#FFFDF7' }}
            className="absolute inset-x-3 bottom-20 z-30 mx-auto max-w-2xl rounded-2xl border-2 border-[#78533D] bg-[#FFFDF7] p-3.5 sm:p-4 shadow-[0_16px_40px_rgba(20,12,8,0.45)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  aria-hidden
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#78533D]"
                  style={{
                    backgroundColor: selectedDef ? ZONES[selectedDef.zone].tint : '#FAF6ED',
                  }}
                >
                  {SelectedIcon ? (
                    <SelectedIcon
                      size={22}
                      strokeWidth={2.2}
                      className="shrink-0"
                      style={{ color: selectedDef?.hue }}
                    />
                  ) : (
                    <MapPin size={20} className="shrink-0 text-[#A8246B]" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm sm:text-base font-black text-[#1C171A] break-words">
                      {selectedDef
                        ? selectedDef.name
                        : `Lô mặt tiền trống (${selected.col + 1}-${selected.row + 1})`}
                    </p>
                    {selectedBuilding && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-950">
                        Cấp {selectedBuilding.level} · {selectedBuilding.starRating || 1}★
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs font-bold text-[#4A3525] break-words leading-snug">
                    {selectedDef && selectedBuilding && selectedYield ? (
                      <>
                        Doanh thu:{' '}
                        <span className="font-black text-emerald-700">
                          +{formatRate(selectedYield.totalPerSec)}
                        </span>
                        {assignedManager && (
                          <span className="ml-1.5 text-blue-700">
                            · Quản lý: {assignedManager.name}
                          </span>
                        )}
                        {selectedYield.synergyBonus > 0 && (
                          <span className="ml-1.5 text-[#A8246B]">
                            · Combo +{Math.round(selectedYield.synergyBonus * 100)}%
                          </span>
                        )}
                      </>
                    ) : (
                      'Lô đất đã quy hoạch sẵn sàng. Bấm Khai Trương Tiệm ngay!'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedDef && selectedBuilding ? (
                  <>
                    {!atMaxLevel && (
                      <button
                        type="button"
                        onClick={handleUpgrade}
                        disabled={!canAffordUpgrade}
                        className={cn(
                          'flex h-10 items-center gap-1.5 rounded-xl border-2 px-3 text-xs font-black transition-all active:scale-95',
                          canAffordUpgrade
                            ? 'border-[#78533D] bg-[#D9A441] text-[#1C171A] hover:bg-[#FDE047]'
                            : 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400',
                        )}
                      >
                        <ArrowUpCircle size={15} className="shrink-0" />
                        <span>+1 Cấp ({formatCompact(upgradeCost)} Xu)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectorOpen(true)}
                      className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[#73164A] bg-[#A8246B] px-3.5 text-xs font-black text-white shadow hover:bg-[#B8307A]"
                    >
                      <SlidersHorizontal size={14} className="shrink-0" />
                      <span>Loa QR & Quản Lý ({selectedBuilding.modules?.length ?? 0}/3)</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[#73164A] bg-[#A8246B] px-4 text-xs font-black text-white shadow hover:bg-[#B8307A]"
                  >
                    <Hammer size={15} className="shrink-0" />
                    <span>+ Khai Trương Tiệm Tại Đây</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#D5CEBF] bg-[#FAF6ED] text-[#3E2A1B] hover:bg-[#F1ECE1]"
                  aria-label="Đóng"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. THANH DOCK QUẢN LÝ THÀNH PHỐ NỔI Ở ĐÁY MÀN HÌNH */}
        {isPlaying && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3">
            <div
              style={{ backgroundColor: '#FFFDF7' }}
              className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border-2 border-[#78533D] bg-[#FFFDF7] p-1.5 shadow-[0_14px_34px_rgba(20,12,8,0.4)]"
            >
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
                }}
                className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#A8246B] hover:bg-white"
                title="Quản Lý Tiệm & Loa QR"
              >
                <SlidersHorizontal size={15} className="shrink-0 text-[#A8246B]" />
                <span className="text-[9px] font-black leading-none">Quản Lý</span>
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
                title={canExpand ? `Mở Rộng Phố - ${formatCompact(derived.landCost)} Xu` : 'Mở Rộng Phố (chưa đủ Xu)'}
              >
                <Plus size={15} className={cn('shrink-0', canExpand ? 'text-[#A8701F]' : 'text-gray-400')} />
                <span className="text-[9px] font-black leading-none">Mở Rộng</span>
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
                <span className="text-[9px] font-black leading-none">Nhiệm Vụ</span>
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
                title="Kho Đồ & Bảo Vật"
              >
                <Package size={15} className="shrink-0 text-[#A8246B]" />
                <span className="text-[9px] font-black leading-none">Kho Đồ</span>
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
                <span className="text-[9px] font-black leading-none">Nhân Vật</span>
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
                <span className="text-[9px] font-black leading-none">Thị Chính</span>
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
        <TutorialCoach hidden={drawerOpen || inspectorOpen || mayorModalOpen || inventoryOpen || Boolean(dialogueView)} />
      )}

      <BuildDrawer
        open={drawerOpen}
        activeTab={tab}
        onTabChange={setTab}
        onClose={() => setDrawerOpen(false)}
        onPick={handlePick}
        canAfford={canAfford}
      />

      <StoreInspectorModal
        open={inspectorOpen}
        node={selectedBuilding}
        onClose={() => setInspectorOpen(false)}
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
        capped={(offline?.elapsedMs ?? 0) > OFFLINE_CAP_MS}
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
          buildingCount={buildings.length}
          mayorLevel={level}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
