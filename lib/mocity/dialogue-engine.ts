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

/** Script con hop le voi NPC nay va chua duoc xu ly. */
export function eligibleRequestFor(npc: NpcState): RequestScript | null {
  for (const script of REQUEST_SCRIPTS) {
    if (script.archetype !== npc.archetype) continue;
    if (script.requiresDigital !== undefined && npc.acceptsDigital !== script.requiresDigital) {
      continue;
    }
    if (script.missingService && npc.services.includes(script.missingService)) continue;
    return script;
  }
  return null;
}

/** NPC dang co chuyen muon noi voi thi truong. */
export function npcsNeedingAttention(npcs: NpcState[]): NpcState[] {
  return npcs.filter((npc) => eligibleRequestFor(npc) !== null);
}
