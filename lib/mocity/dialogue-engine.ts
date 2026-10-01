import { AMBIENT, REQUEST_SCRIPTS } from './dialogue-data';
import { ARCHETYPES } from './npc-data';
import type { NpcState, RequestScript } from './types';

/**
 * Chon cau thoai ambient hop trang thai hien tai cua NPC.
 * `rotation` la so nguyen tang dan - dung thay random de cung mot NPC khong
 * lap lai cau vua noi, va de test duoc.
 */
export function ambientLineFor(npc: NpcState, rotation: number): string | null {
  const pool = AMBIENT[npc.archetype];
  if (!pool) return null;

  const lines =
    npc.role === 'MERCHANT'
      ? npc.acceptsDigital
        ? pool.digital
        : pool.cash
      : npc.services.length > ARCHETYPES[npc.archetype].startServices.length
        ? pool.served
        : pool.plain;

  if (!lines || lines.length === 0) return null;
  return lines[rotation % lines.length];
}

/** Danh sach cac script hop le voi NPC nay. */
export function eligibleRequestsFor(npc: NpcState): RequestScript[] {
  return REQUEST_SCRIPTS.filter((script) => {
    if (script.archetype !== npc.archetype) return false;
    if (script.requiresDigital !== undefined && npc.acceptsDigital !== script.requiresDigital) {
      return false;
    }
    if (script.missingService && npc.services.includes(script.missingService)) return false;
    return true;
  });
}

/** Script con hop le voi NPC nay va chua duoc xu ly. */
export function eligibleRequestFor(npc: NpcState, seed?: number): RequestScript | null {
  const matches = eligibleRequestsFor(npc);
  if (matches.length === 0) return null;
  const idx = typeof seed === 'number' ? Math.abs(seed) % matches.length : Math.floor(Math.random() * matches.length);
  return matches[idx];
}

/** NPC dang co chuyen muon noi voi thi truong. */
export function npcsNeedingAttention(npcs: NpcState[]): NpcState[] {
  return npcs.filter((npc) => eligibleRequestFor(npc) !== null);
}

