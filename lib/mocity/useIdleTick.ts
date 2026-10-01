'use client';

import { useEffect } from 'react';
import { tickIdle } from './store';

const TICK_MS = 1000;

/**
 * Vong lap AFK. Board isometric khong duoc re-render theo nhip dong ho -
 * chi HUD subscribe vao congs.
 */
export function useIdleTick(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(tickIdle, TICK_MS);
    return () => clearInterval(timer);
  }, [enabled]);
}
