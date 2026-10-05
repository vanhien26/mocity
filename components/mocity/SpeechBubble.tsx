'use client';

import { useEffect, useState } from 'react';
import { npcsNeedingAttention, streetLineFor, type CityMood } from '@/lib/mocity/dialogue-engine';
import { toneForCity, type PlayerTone } from '@/lib/mocity/player-tones';
import { fillTen } from '@/lib/mocity/dialogue-name';
import { currentCityTier, useCity } from '@/lib/mocity/store';
import type { NpcState } from '@/lib/mocity/types';

/** Toi da 2 bong bong cung luc - nhieu hon thanh nhieu loan, khong ai doc. */
const MAX_VISIBLE = 2;
const CYCLE_MS = 5200;

export interface ChatterLine {
  npcId: string;
  text: string;
}

/**
 * Xoay vong thoai ambient giua cac NPC. State ephemeral, khong persist:
 * thoai la hieu ung khong khi, khong phai du lieu game.
 *
 * @param mood Trang thai thành phố. Khi thành phố gặp khủng hoảng thì bà con
 *             bình luận về chuyện đó thay vì kể chuyện thời tiết trên mạng.
 */
export function useAmbientChatter(npcs: NpcState[], mood: CityMood | null = null): ChatterLine[] {
  const [tick, setTick] = useState(0);
  // Tên người chơi để bà con xưng hô thay cho "Thị Trưởng" (xem dialogue-name.ts).
  const mayorName = useCity((s) => s.mayorName);
  /**
   * Giọng điệu theo bối cảnh: hôm nay bạn vừa mở tiệm / nâng cấp / có việc
   * chờ xử lý / phố đã lên bậc. Đọc từ state thật nên cả phố cùng phản ánh
   * một chuyện, không phải mỗi ô một giọng.
   */
  const builtToday = useCity((s) => s.dailyLog?.built ?? 0);
  const upgradedToday = useCity((s) => s.dailyLog?.upgraded ?? 0);
  const starEvolvedToday = useCity((s) => s.dailyLog?.starEvolved ?? 0);
  const cityRank = useCity((s) => currentCityTier(s).rank);
  const tone: PlayerTone = toneForCity({
    builtToday,
    upgradedToday,
    starEvolvedToday,
    pendingRequests: npcsNeedingAttention(npcs).length,
    cityTier: cityRank,
  });

  useEffect(() => {
    if (npcs.length === 0) return;
    const timer = setInterval(() => setTick((t) => t + 1), CYCLE_MS);
    return () => clearInterval(timer);
  }, [npcs.length]);

  if (npcs.length === 0) return [];

  const lines: ChatterLine[] = [];
  const count = Math.min(MAX_VISIBLE, npcs.length);
  for (let i = 0; i < count; i += 1) {
    // Cua so truot doc danh sach NPC, moi vong lai sang nhom khac
    const npc = npcs[(tick * MAX_VISIBLE + i) % npcs.length];
    /**
     * `rotation` phai tang MỖI nhịp, không phải mỗi vòng duyệt hết NPC.
     *
     * Truoc day la `Math.floor(tick / npcs.length) + i`: voi 13 NPC thi
     * `tick` phai tang 13 lan moi `rotation` moi tang 1 - tuc la 13 x 5.2s
     * = 67 giay, mot NPC noi lai mot cau nguyen ban nhau suot 67 giay.
     * Voi chi 1-2 cau moi pool thi thay khe lai thay do.
     */
    const raw = streetLineFor(npc, tick + i, mood, tone);
    const text = raw ? fillTen(raw, mayorName) : null;
    if (text) lines.push({ npcId: npc.id, text });
  }
  return lines;
}
