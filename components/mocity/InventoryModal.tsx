'use client';

import { useState } from 'react';
import {
  Award,
  Backpack,
  CheckCircle2,
  CircleDollarSign,
  Coffee,
  Crown,
  Flame,
  Gem,
  Gift,
  Megaphone,
  MessageCircleHeart,
  ScrollText,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import { INVENTORY_ITEMS } from '@/lib/mocity/mock-city-data';
import { CITY_ADVISORS } from '@/lib/mocity/npc-data';
import {
  buyInventoryItem,
  claimTapReward,
  useCity,
  useInventoryItem,
} from '@/lib/mocity/store';
import { formatCompact, formatNumber } from '@/lib/mocity/format';
import type { InventoryItemDef } from '@/lib/mocity/types';
import { cn } from '@/lib/cn';

/** Xu moi luoi chuyen voi 1 co van. Han 60s nen khong farm duoc. */
const ADVISOR_TAP_COINS = 300;
const ADVISOR_TAP_COOLDOWN_MS = 60_000;

const STREET_HERO_DIALOGUES: Record<string, string[]> = {
  'advisor-ong-loc': [
    '“Sáng nay ông mới nằm mơ thấy con Heo Vàng nhảy múa trước cổng Tòa Thị Chính, chiều nay phố mình chắc chắn đại phát!”',
    '“Nhờ Thị Trưởng gắn cái Loa Thần Tài cạnh bàn cờ tướng, ông vừa chiếu tướng cụ Tâm vừa nghe tiền vé số ting ting đã cái lỗ tai!”',
    '“Nè, cầm lấy tờ vé số lấy hên đi Thị Trưởng, chiều trúng giải nhớ mở thêm công viên cho mấy ông già tập dưỡng sinh nghen!”',
  ],
  'advisor-co-ba': [
    '“Hồi xưa bán ổ bánh mì 15 ngàn thối tiền lẻ muốn trẹo khớp tay, giờ tụi nhỏ quét QR cái rẹt, lò bánh mì cô chạy hết công suất!”',
    '“Thị Trưởng uống miếng trà tắc mật ong cho mát ruột đi! Tiệm cô mới đạt 5 Sao nhờ có Quản lý xịn đó!”',
    '“Tối nay Chợ Đêm lên đèn, cô chuẩn bị 300 ổ bánh mì heo quay giòn rụm đãi khách phương xa rồi!”',
  ],
  'advisor-bao-ngoc': [
    '“Góc phố MoCity 3D lên hình đẹp mê ly Thị Trưởng ơi! Em vừa đăng clip review Rạp Phim MoMo đã lên xu hướng 1 triệu tim!”',
    '“Mấy bạn Gen Z ở Ký Túc Xá mê combo Trà Sữa + Xem Phim lắm, Thị Trưởng nhớ nâng cấp 2 tiệm đó liền kề nha!”',
    '“Khi nào Thị Trưởng phát Loa Phường Vàng hay bật Giờ Vàng là tụi em kéo nguyên đoàn KOC xuống phố livestream liền!”',
  ],
  'advisor-khoa-shipper': [
    '“Đường phố MoCity quy hoạch vuông vức, anh em Shipper tụi tui giao 10 tô bún bò qua 4 ngã tư mà không sánh một giọt nước lèo!”',
    '“Khách đặt đơn qua MoMo thanh toán trước hết trơn, tụi tui chỉ việc nhận hàng rồi phóng vèo tới cửa!”',
    '“Có Ví Trả Sau dự phòng, lỡ xe có mòn lốp giữa tháng cũng ghé tiệm sửa liền không lo đứt bữa chạy đơn!”',
  ],
  'advisor-giao-su-khai': [
    '“Dòng tiền trong Đô Thị MoCity đang luân chuyển cực kỳ khỏe! Mỗi đồng Xu nhàn rỗi trong Túi Thần Tài đều đang sinh lãi kép mỗi giây.”',
    '“Bí quyết của các Siêu Đô Thị là trang bị đủ 3 Bảo Vật Thị Trưởng trong Kho Đồ — hiệu suất thu ngân sẽ tăng vọt tới +95%!”',
    '“Khi Sàn Chứng Khoán đặt cạnh Tháp Tài Chính MoMo, hiệu ứng cộng hưởng tài chính sẽ đạt đỉnh cao!”',
  ],
  'advisor-mai': [
    '“Thị Trưởng nhớ giữ chỉ số Hạnh Phúc trên 85% nhé! Khi cư dân vui vẻ, toàn bộ cửa hàng được cộng thêm tới +25% thuế thương mại!”',
    '“Một thành phố kiểu mẫu luôn có Công Viên Sinh Thái nằm giữa Khu Dân Cư và Khu Thương Mại.”',
  ],
  'advisor-hung': [
    '“Đừng để Xu nằm im! Hãy dùng Bản Vẽ Quy Hoạch Cấp Tốc trong Kho Đồ để đồng loạt nâng tầng các cửa tiệm chủ lực.”',
    '“Mỗi khi tiệm đạt mốc Cấp 5 và Cấp 10, sản lượng Xu mỗi giây sẽ được nhân đột phá!”',
  ],
  'advisor-heo-vang': [
    '“Ủn ỉn! Bấm mở Bao Lì Xì Lộc Phát 68 trong Kho Đồ để rước ngay 18 Kim Cương lộc lá nào Thị Trưởng ơi!”',
    '“Heo Vàng luôn đồng hành cùng Thị Trưởng xây dựng Đô Thị Số phồn vinh và nhân ái nhất!”',
  ],
};

function ItemIcon({ item, size = 20 }: { item: InventoryItemDef; size?: number }) {
  if (item.id.includes('loa')) return <Megaphone size={size} className="shrink-0" style={{ color: item.hue }} />;
  if (item.id.includes('gio-vang')) return <Flame size={size} className="shrink-0" style={{ color: item.hue }} />;
  if (item.id.includes('li-xi')) return <Gift size={size} className="shrink-0" style={{ color: item.hue }} />;
  if (item.id.includes('ban-ve')) return <ScrollText size={size} className="shrink-0" style={{ color: item.hue }} />;
  if (item.id.includes('tra-sua')) return <Coffee size={size} className="shrink-0" style={{ color: item.hue }} />;
  if (item.id.includes('hop-qua')) return <ShoppingBag size={size} className="shrink-0" style={{ color: item.hue }} />;
  if (item.category === 'RELIC') return <Award size={size} className="shrink-0" style={{ color: item.hue }} />;
  return <Sparkles size={size} className="shrink-0" style={{ color: item.hue }} />;
}

export default function InventoryModal({
  open,
  initialTab = 'ITEMS',
  onClose,
  onToast,
}: {
  open: boolean;
  initialTab?: 'ITEMS' | 'RELICS' | 'CHARACTERS';
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const state = useCity((s) => s);
  const [tab, setTab] = useState<'ITEMS' | 'RELICS' | 'CHARACTERS'>(initialTab);
  const [activeHeroSpeech, setActiveHeroSpeech] = useState<Record<string, string>>({});

  if (!open) return null;

  const inventory = state.inventory ?? {};
  const equippedRelics = state.equippedRelics ?? [];

  const consumablesAndGifts = INVENTORY_ITEMS.filter(
    (item) => item.category === 'CONSUMABLE' || item.category === 'GIFT',
  );
  const relics = INVENTORY_ITEMS.filter((item) => item.category === 'RELIC');

  const totalRelicYieldBonus = equippedRelics.reduce((sum, id) => {
    const found = relics.find((r) => r.id === id);
    return sum + (found?.passiveYieldBonus ?? 0);
  }, 0);

  const handleUse = (item: InventoryItemDef) => {
    const res = useInventoryItem(item.id);
    onToast(res.message);
  };

  const handleBuy = (item: InventoryItemDef) => {
    const res = buyInventoryItem(item.id);
    onToast(res.message);
  };

  const handleChatWithHero = (advisorId: string, advisorName: string) => {
    const pool = STREET_HERO_DIALOGUES[advisorId] ?? [
      '“Chúc Thị Trưởng một ngày điều hành Đô Thị MoCity bội thu ngân khố!”',
    ];
    const nextLine = pool[Math.floor(Math.random() * pool.length)];
    setActiveHeroSpeech((prev) => ({ ...prev, [advisorId]: nextLine }));

    // Han 60s: 8 co van x 2.500 Xu + 35% ro do la 20.000 Xu/phut vo han.
    const result = claimTapReward('advisor', ADVISOR_TAP_COINS, {
      cooldownMs: ADVISOR_TAP_COOLDOWN_MS,
      itemChance: 0.1,
      itemId: 'gift-tra-sua',
    });
    if (!result.ok) {
      onToast(`${advisorName}: “Ông còn đang bận họp Tòa Thị Chính, quay lại sau nhé!”`);
      return;
    }

    if (result.itemId) {
      onToast(
        `${advisorName} vừa trò chuyện, tặng Thị Trưởng +${formatCompact(ADVISOR_TAP_COINS)} Xu & 1 Ly Trà Sữa vào Kho Đồ!`,
      );
    } else {
      onToast(`${advisorName}: Đã trò chuyện & nhận +${formatCompact(ADVISOR_TAP_COINS)} Xu Lộc Phố Phường!`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kho Đồ & Nhân Vật Đô Thị MoCity"
      style={{ backgroundColor: 'rgba(20, 14, 18, 0.72)' }}
      className="fixed inset-0 z-50 flex items-end justify-center p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{ backgroundColor: '#FAF6ED', borderColor: '#C9A227' }}
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border-[3px] shadow-[0_24px_64px_rgba(0,0,0,0.65)] sm:rounded-3xl"
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(180deg, #4A3018 0%, #3E2A1B 100%)',
            borderColor: '#C9A227',
          }}
          className="flex items-center justify-between gap-3 border-b-2 px-4 py-3.5 sm:px-5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              style={{ backgroundColor: 'rgba(216, 45, 139, 0.25)', borderColor: '#F0C25E' }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2"
            >
              <Backpack size={20} className="shrink-0 text-[#F0C25E]" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm sm:text-base font-black uppercase text-[#FFFDF7]">
                Kho Đồ Thị Trưởng & Nhân Vật Phố Thị
              </h2>
              <p className="truncate text-xs font-bold text-[#E6D5B8]">
                Ngân khố: {formatNumber(state.coins)} Xu · {state.gems} Kim Cương · Đang trang bị{' '}
                {equippedRelics.length}/3 Bảo Vật (+{Math.round(totalRelicYieldBonus * 100)}% Xu/s)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#FFFDF7] transition-colors hover:bg-white/20"
            aria-label="Đóng Kho Đồ"
          >
            <X size={16} className="shrink-0" />
          </button>
        </div>

        {/* 3 Tabs Navigation */}
        <div
          style={{ backgroundColor: '#F1E8D4', borderColor: '#D5C5A3' }}
          className="grid grid-cols-3 gap-1.5 border-b-2 p-2.5"
        >
          <button
            type="button"
            onClick={() => setTab('ITEMS')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-black transition-all',
              tab === 'ITEMS'
                ? 'bg-[#D82D8B] text-white shadow-md'
                : 'bg-[#FFFDF7] text-[#4A3525] hover:bg-white',
            )}
          >
            <Backpack size={15} className="shrink-0" />
            <span>Vật Phẩm & Quà ({consumablesAndGifts.reduce((s, i) => s + (inventory[i.id] ?? 0), 0)})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('RELICS')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-black transition-all',
              tab === 'RELICS'
                ? 'bg-[#D82D8B] text-white shadow-md'
                : 'bg-[#FFFDF7] text-[#4A3525] hover:bg-white',
            )}
          >
            <Award size={15} className="shrink-0" />
            <span>Bảo Vật ({equippedRelics.length}/3)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('CHARACTERS')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-black transition-all',
              tab === 'CHARACTERS'
                ? 'bg-[#D82D8B] text-white shadow-md'
                : 'bg-[#FFFDF7] text-[#4A3525] hover:bg-white',
            )}
          >
            <Users size={15} className="shrink-0" />
            <span>Nhân Vật & Thoại ({CITY_ADVISORS.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* TAB 1: VẬT PHẨM KÍCH HOẠT & QUÀ TẶNG CƯ DÂN */}
          {tab === 'ITEMS' && (
            <>
              <div
                style={{ backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#78350F]">
                    Túi Vật Phẩm Điều Hành & Quà Tặng Dân Phố
                  </p>
                  <p className="text-[11px] font-bold text-[#92400E] break-words">
                    Bấm “Sử Dụng Ngay” để phát Loa Phường, mở Bao Lì Xì 68, nâng cấp tiệm hoặc mời Cư dân uống Trà Sữa!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {consumablesAndGifts.map((item) => {
                  const count = inventory[item.id] ?? 0;
                  const canBuy = state.coins >= item.costCoins && state.gems >= item.costGems;
                  return (
                    <div
                      key={item.id}
                      style={{ backgroundColor: '#FFFDF7' }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-[#D5C5A3] bg-[#FFFDF7] p-3.5 shadow-sm"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2"
                          style={{
                            borderColor: item.hue,
                            backgroundColor: `${item.hue}15`,
                          }}
                        >
                          <ItemIcon item={item} size={22} />
                          <span
                            className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white shadow"
                            style={{ backgroundColor: count > 0 ? '#D82D8B' : '#6B7280' }}
                          >
                            x{count}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-black text-[#1C171A] break-words">
                              {item.name}
                            </p>
                            <span
                              className="rounded-md px-1.5 py-0.5 text-[10px] font-black text-white"
                              style={{
                                backgroundColor:
                                  item.rarity === 'SSR'
                                    ? '#D97706'
                                    : item.rarity === 'SR'
                                      ? '#7C3AED'
                                      : '#2563EB',
                              }}
                            >
                              {item.rarity}
                            </span>
                            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
                              {item.category === 'GIFT' ? 'Quà Tặng NPC' : 'Vật Phẩm Dùng Ngay'}
                            </span>
                          </div>

                          <p className="mt-1 text-xs font-semibold text-[#4A3525] break-words leading-snug">
                            {item.description}
                          </p>
                          <p className="mt-1 text-xs font-black text-emerald-700 break-words">
                            ✦ Hiệu quả: {item.effectSummary}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUse(item)}
                          disabled={count <= 0}
                          className={cn(
                            'flex h-9 w-full sm:w-36 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-xs font-black transition-transform active:scale-95',
                            count > 0
                              ? 'border-[#9D174D] bg-[#D82D8B] text-white shadow hover:bg-[#EB2F96]'
                              : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400',
                          )}
                        >
                          <Sparkles size={13} className="shrink-0" />
                          <span>{count > 0 ? `Sử Dụng (còn ${count})` : 'Đã hết'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBuy(item)}
                          disabled={!canBuy}
                          className={cn(
                            'flex h-8 w-full sm:w-36 items-center justify-center gap-1 rounded-xl border px-2.5 text-[11px] font-black transition-colors',
                            canBuy
                              ? 'border-[#C9A227] bg-[#FFFBEB] text-[#78350F] hover:bg-[#FEF3C7]'
                              : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400',
                          )}
                        >
                          <CircleDollarSign size={12} className="shrink-0 text-[#D97706]" />
                          <span>
                            Mua thêm ({formatCompact(item.costCoins)} Xu
                            {item.costGems > 0 ? ` + ${item.costGems} KC` : ''})
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: BẢO VẬT THỊ TRƯỞNG (EQUIPABLE RELICS) */}
          {tab === 'RELICS' && (
            <>
              <div
                style={{ backgroundColor: '#FFFBEB', borderColor: '#C9A227' }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 p-4"
              >
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-[#3E2A1B]">
                    Bàn Trưng Bày Bảo Vật Tòa Thị Chính ({equippedRelics.length}/3 Ô Trang Bị)
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-[#6E4F3A]">
                    Tổng hiệu ứng cộng dồn hiện tại:{' '}
                    <span className="font-black text-emerald-700">
                      +{Math.round(totalRelicYieldBonus * 100)}% Doanh Thu Xu/giây toàn thành phố
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((slotIdx) => {
                    const rId = equippedRelics[slotIdx];
                    const rDef = relics.find((r) => r.id === rId);
                    return (
                      <div
                        key={slotIdx}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border-2 bg-white shadow-inner"
                        style={{ borderColor: rDef ? rDef.hue : '#D5C5A3' }}
                        title={rDef ? rDef.name : 'Ô Bảo Vật Trống'}
                      >
                        {rDef ? (
                          <ItemIcon item={rDef} size={20} />
                        ) : (
                          <span className="text-[10px] font-black text-gray-400">Trống</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {relics.map((item) => {
                  const owned = (inventory[item.id] ?? 0) > 0;
                  const isEquipped = equippedRelics.includes(item.id);
                  const canBuy = state.coins >= item.costCoins && state.gems >= item.costGems;

                  return (
                    <div
                      key={item.id}
                      style={{ backgroundColor: '#FFFDF7' }}
                      className={cn(
                        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 p-4 shadow-sm',
                        isEquipped ? 'border-emerald-600' : 'border-[#D5C5A3]',
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2"
                          style={{
                            borderColor: item.hue,
                            backgroundColor: `${item.hue}18`,
                          }}
                        >
                          <ItemIcon item={item} size={22} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-black text-[#1C171A] break-words">
                              {item.name}
                            </p>
                            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                              {item.rarity}
                            </span>
                            {isEquipped && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                                <CheckCircle2 size={11} className="shrink-0" />
                                Đang Trang Bị
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs font-semibold text-[#4A3525] break-words">
                            {item.description}
                          </p>
                          <p className="mt-1 text-xs font-black text-emerald-700">
                            ✦ {item.effectSummary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0">
                        {owned ? (
                          <button
                            type="button"
                            onClick={() => handleUse(item)}
                            className={cn(
                              'flex h-10 w-full sm:w-36 items-center justify-center gap-1.5 rounded-xl border-2 px-3.5 text-xs font-black transition-transform active:scale-95',
                              isEquipped
                                ? 'border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'border-[#9D174D] bg-[#D82D8B] text-white hover:bg-[#EB2F96]',
                            )}
                          >
                            <Crown size={14} className="shrink-0" />
                            <span>{isEquipped ? 'Tháo Trang Bị' : 'Trang Bị Ngay'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuy(item)}
                            disabled={!canBuy}
                            className={cn(
                              'flex h-10 w-full sm:w-40 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-xs font-black transition-transform active:scale-95',
                              canBuy
                                ? 'border-[#C9A227] bg-[#FACC15] text-[#1C171A] hover:bg-[#FDE047]'
                                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400',
                            )}
                          >
                            <Gem size={13} className="shrink-0 text-[#D82D8B]" />
                            <span>
                              Thỉnh ({formatCompact(item.costCoins)} Xu + {item.costGems} KC)
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 3: DANH BẠ NHÂN VẬT & TRÒ CHUYỆN VỈA HÈ */}
          {tab === 'CHARACTERS' && (
            <>
              <div
                style={{ backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }}
                className="rounded-2xl border-2 px-4 py-3"
              >
                <p className="text-xs font-black text-[#78350F]">
                  8 Nhân Vật Tiêu Biểu & Cố Vấn Khu Phố MoCity
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-[#92400E] break-words">
                  Bấm “Trò Chuyện & Nhận Lộc” để nghe chuyện đời thường vui nhộn quanh phố, nhận ngay +{formatCompact(ADVISOR_TAP_COINS)} Xu và cơ hội rơi Vật Phẩm vào Kho Đồ (mỗi Cố vấn nghỉ 60 giây giữa hai lượt)!
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {CITY_ADVISORS.map((adv) => {
                  const currentLine = activeHeroSpeech[adv.id] ?? `“${adv.tip}”`;
                  return (
                    <div
                      key={adv.id}
                      style={{ backgroundColor: '#FFFDF7' }}
                      className="flex flex-col gap-2.5 rounded-2xl border-2 border-[#D5C5A3] bg-[#FFFDF7] p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 text-sm font-black text-white shadow-sm"
                            style={{ backgroundColor: adv.hue, borderColor: '#3E2A1B' }}
                          >
                            {adv.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[#1C171A] break-words">
                              {adv.name}
                            </p>
                            <p className="text-xs font-bold text-[#6E4F3A] break-words">
                              {adv.roleTitle} · Chuyên môn: {adv.specialty}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleChatWithHero(adv.id, adv.name)}
                          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border-2 border-[#9D174D] bg-[#D82D8B] px-3.5 text-xs font-black text-white shadow hover:bg-[#EB2F96] active:scale-95"
                        >
                          <MessageCircleHeart size={14} className="shrink-0" />
                          <span>Trò Chuyện (+{formatCompact(ADVISOR_TAP_COINS)} Xu)</span>
                        </button>
                      </div>

                      <div
                        style={{ backgroundColor: '#F7F1E3', borderColor: adv.hue }}
                        className="rounded-xl border-l-4 px-3.5 py-2.5 text-xs font-bold text-[#3E2A1B] break-words leading-relaxed"
                      >
                        {currentLine}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
