'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TimeOfDay } from '@/lib/mocity/types';

export type TrafficPhase = 'GREEN' | 'YELLOW' | 'RED';

export interface TrafficState {
  phase: TrafficPhase;
  countdown: number;
  streetLightsLit: boolean;
  switchPhase: () => void;
  toggleStreetLights: () => boolean;
}

const GREEN_DURATION = 12;
const YELLOW_DURATION = 3;
const RED_DURATION = 9;

export function useTrafficController(timeOfDay: TimeOfDay): TrafficState {
  const isNightOrSunset = timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET';

  const [phase, setPhase] = useState<TrafficPhase>('GREEN');
  const [countdown, setCountdown] = useState<number>(GREEN_DURATION);
  // Đèn đường mặc định sáng khi trời tối, nhưng người chơi có thể bật tắt tự do
  const [streetLightsManual, setStreetLightsManual] = useState<boolean | null>(null);

  const streetLightsLit = streetLightsManual !== null ? streetLightsManual : (isNightOrSunset || true);

  // Vòng lặp đếm ngược đèn giao thông
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Chuyển pha
          setPhase((curPhase) => {
            if (curPhase === 'GREEN') {
              return 'YELLOW';
            } else if (curPhase === 'YELLOW') {
              return 'RED';
            } else {
              return 'GREEN';
            }
          });

          // Reset đếm ngược cho pha tiếp theo
          return 1; // Sẽ được cập nhật ở effect phase
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Cập nhật thời gian đếm ngược khi pha thay đổi
  useEffect(() => {
    if (phase === 'GREEN') setCountdown(GREEN_DURATION);
    else if (phase === 'YELLOW') setCountdown(YELLOW_DURATION);
    else if (phase === 'RED') setCountdown(RED_DURATION);
  }, [phase]);

  // Đổi đèn thủ công khi người chơi click vào cột đèn
  const switchPhase = useCallback(() => {
    setPhase((cur) => {
      if (cur === 'GREEN') return 'YELLOW';
      if (cur === 'YELLOW') return 'RED';
      return 'GREEN';
    });
  }, []);

  // Bật/tắt đèn đường thủ công
  const toggleStreetLights = useCallback((): boolean => {
    let nextVal = false;
    setStreetLightsManual((prev) => {
      nextVal = prev === null ? !isNightOrSunset : !prev;
      return nextVal;
    });
    return nextVal;
  }, [isNightOrSunset]);

  return {
    phase,
    countdown,
    streetLightsLit,
    switchPhase,
    toggleStreetLights,
  };
}
