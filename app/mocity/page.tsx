'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowUpCircle,
  CircleDollarSign,
  Crown,
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
  upgradeBuilding,
  getCityState,
  useCity,
  useCityDerived,
  useCityHydrated,
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

export default function MoCityPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cityScale, setCityScale] = useState(1.14);
  const [selected, setSelected] = useState<{ col: number; row: number } | null>(null);
  /** Hang pho dang xem tren board. */
  const [activeRow, setActiveRow] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [mayorModalOpen, setMayorModalOpen] = useState(false);
  const [mayorModalTab, setMayorModalTab] = useState<'PROFILE' | 'QUESTS' | 'CITIZENS'>('PROFILE');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<'ITEMS' | 'RELICS' | 'CHARACTERS'>('ITEMS');
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
  const gems = useCity((s) => s.gems);
  const level = useCity((s) => s.mayorLevel);
  const cityName = useCity((s) => s.cityName);
  const mayorName = useCity((s) => s.mayorName);
  const hasNamedCity = useCity((s) => s.hasNamedCity);
  const buildings = useCity((s) => s.buildings);
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
  const firstTimeBonus = hasNamedCity ? 0 : LOGIN_BONUS_COINS;
  const offlineBonus = offline?.coins ?? 0;
  const loginBonus = firstTimeBonus + offlineBonus;
  const treasuryAfterLogin = coins + loginBonus;
  const totalInventoryCount = useMemo(
    () => Object.values(inventory ?? {}).reduce((acc, qty) => acc + (qty || 0), 0),
    [inventory],
  );
  const derived = useCityDerived();

  const { shake, floatNumber } = useGameJuice();
  const { isAnimating: isCoinBouncing } = useBouncyCounter(coins);

  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [heldView, setHeldView] = useState<DialogueView | null>(null);
  const [dialogueDismissed, setDialogueDismissed] = useState(false);

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
    setDialogueDismissed(false);
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

  const handleOpenRequest = useCallback(
    (col: number, row: number) => {
      const node = buildingAt(buildings, col, row);
      if (!node) return;
      const request = activeRequests.find((r) => r.npcId === node.id);
      if (request) setOpenRequestId(request.id);
    },
    [activeRequests, buildings],
  );

  const liveView = useMemo<DialogueView | null>(() => {
    if (pendingEvent) {
      const script = EVENT_BY_ID[pendingEvent.scriptId];
      if (script) {
        return {
          title: script.title,
          speaker: script.speaker,
          speakerTag: script.title,
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
          speaker: npc.name,
          speakerTag: `${ARCHETYPES[npc.archetype].label} · ${script.title}`,
          body: script.body,
          hue: ARCHETYPES[npc.archetype].hue,
          choices: script.choices,
        };
      }
    }
    return null;
  }, [activeRequests, npcs, openRequestId, pendingEvent]);

  // Reset dismissed khi có event/request mới
  const liveViewKey = liveView?.title ?? '';
  useEffect(() => { setDialogueDismissed(false); }, [liveViewKey]);

  const dialogueView = dialogueDismissed ? null : (heldView ?? liveView);

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
    setDialogueDismissed(true);
    dismissEvent();
  }, []);

  const handleOpenDialogue = useCallback(() => {
    setDialogueDismissed(false);
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
        floatNumber(window.innerWidth / 2, window.innerHeight * 0.45, `+${def.name}! 🎉`, '#D82D8B');
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
      floatNumber(window.innerWidth / 2, window.innerHeight * 0.6, '+1 Mặt Tiền Đất! 🏗️', '#D97706');
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
    if (triggerFeverMode()) {
      shake(8);
      particles.confetti(window.innerWidth / 2, window.innerHeight * 0.3);
      floatNumber(window.innerWidth / 2, window.innerHeight * 0.3, 'GIỜ VÀNG x2 XU! 🔥', '#EF4444');
      showToast('Đã kích hoạt Giờ Vàng MoCity! Nhân đôi doanh thu toàn phố trong 60 giây.');
    } else {
      showToast('Cần 2 Kim Cương để kích hoạt Giờ Vàng x2 Xu.');
    }
  }, [derived.isFever, floatNumber, shake, showToast]);

  const handleClaimOffline = useCallback(() => {
    particles.coinShower(window.innerWidth / 2, window.innerHeight * 0.5, 25);
    claimOffline();
  }, []);

  const canExpand = derived.capacity < 100;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#EDEAE2] text-[#1C171A]">
      <GameJuiceStyles />
      <FloatingNumbers />

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
      {sessionStatus !== 'loading' && cityHydrated && !isPlaying && (
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
          mayorInput={effectiveMayorName}
          cityInput={cityInput}
          onMayorInputChange={setMayorInput}
          onCityInputChange={setCityInput}
          onStart={handleCompleteLogin}
        />
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
            className="flex items-center gap-2 rounded-xl border border-[#8B5E1A] bg-[#2A1305]/60 px-2.5 py-1 text-left transition-colors hover:border-[#C9A227]"
            title="Bấm để mở Tòa Thị Chính & Đổi tên Khu Phố"
          >
            {/* Level badge */}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white shadow-inner"
              style={{ background: 'linear-gradient(135deg, #D82D8B, #9D174D)' }}
            >
              C.{level}
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
              <p className="truncate text-[10px] font-bold text-amber-400/80">
                {mayorName || 'Thị Trưởng'} · {Math.round(derived.happiness)}%
                {derived.happiness < HAPPINESS_WARNING_AT && (
                  <span className="text-red-400"> ⚠</span>
                )}
              </p>
            </div>
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
            <CircleDollarSign size={16} className="shrink-0 text-amber-400" />
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-amber-200">{formatNumber(coins)}</span>
                <span className="text-[9px] font-black text-amber-500">XU</span>
              </div>
              <p className="text-[9px] font-black text-emerald-400 leading-none">+{formatRate(derived.rate)}</p>
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
            <Star size={13} className="shrink-0 fill-sky-400 text-sky-400" />
            <span className="text-xs font-black text-sky-200">{gems}</span>
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
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D82D8B] text-[8px] font-black text-white">!</span>
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
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#D82D8B] px-0.5 text-[8px] font-black text-white">{totalInventoryCount}</span>
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
                : 'border-[#D82D8B]/60 bg-[#D82D8B]/10 text-[#D82D8B] hover:bg-[#D82D8B]/30',
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
          isPlaying={isPlaying}
          onEnterGame={() => {
            setIsPlaying(true);
            setDialogueDismissed(false);
          }}
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
                    <MapPin size={20} className="shrink-0 text-[#D82D8B]" />
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
                          <span className="ml-1.5 text-[#D82D8B]">
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
                            ? 'border-[#78533D] bg-[#FACC15] text-[#1C171A] hover:bg-[#FDE047]'
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
                      className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[#9D174D] bg-[#D82D8B] px-3.5 text-xs font-black text-white shadow hover:bg-[#EB2F96]"
                    >
                      <SlidersHorizontal size={14} className="shrink-0" />
                      <span>Loa QR & Quản Lý ({selectedBuilding.modules?.length ?? 0}/3)</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[#9D174D] bg-[#D82D8B] px-4 text-xs font-black text-white shadow hover:bg-[#EB2F96]"
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
                onClick={() => setDrawerOpen(true)}
                className="flex h-11 items-center gap-1.5 rounded-xl border-2 border-[#9D174D] bg-[#D82D8B] px-4 text-xs font-black text-white shadow transition-transform hover:bg-[#EB2F96] active:scale-95"
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
                className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#D82D8B] hover:bg-white"
                title="Quản Lý Tiệm & Loa QR"
              >
                <SlidersHorizontal size={15} className="shrink-0 text-[#D82D8B]" />
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
                <Plus size={15} className={cn('shrink-0', canExpand ? 'text-[#D97706]' : 'text-gray-400')} />
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
                className="relative flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#D82D8B] hover:bg-white"
                title="Nhiệm Vụ"
              >
                <Star size={15} className="shrink-0 fill-amber-400 text-amber-600" />
                <span className="text-[9px] font-black leading-none">Nhiệm Vụ</span>
                {claimableQuestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#D82D8B] px-1 text-[8px] font-black text-white">
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
                className="relative flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#D82D8B] hover:bg-white"
                title="Kho Đồ & Bảo Vật"
              >
                <Package size={15} className="shrink-0 text-[#D82D8B]" />
                <span className="text-[9px] font-black leading-none">Kho Đồ</span>
                {totalInventoryCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#D82D8B] px-1 text-[8px] font-black text-white">
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
                className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#D82D8B] hover:bg-white"
                title="Nhân Vật & Thoại"
              >
                <MessageSquareHeart size={15} className="shrink-0 text-[#059669]" />
                <span className="text-[9px] font-black leading-none">Nhân Vật</span>
              </button>

              {/* Tòa Thị Chính */}
              <button
                type="button"
                onClick={() => {
                  setMayorModalTab('CITIZENS');
                  setMayorModalOpen(true);
                }}
                className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#78533D] bg-[#FAF6ED] px-3 text-[#3E2A1B] transition-colors hover:border-[#D82D8B] hover:bg-white"
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
