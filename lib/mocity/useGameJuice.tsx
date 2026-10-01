'use client';

import React, { useState, useEffect, useCallback } from 'react';

type FloatingNumber = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
};

let nextId = 0;
let floatingNumbersList: FloatingNumber[] = [];
let floatingNumbersListeners: (() => void)[] = [];

const MAX_FLOATING_NUMBERS = 15;
const ANIMATION_DURATION = 700;

function notifyListeners() {
  floatingNumbersListeners.forEach(listener => listener());
}

export function useGameJuice() {
  const shake = useCallback((intensity: number = 5) => {
    const body = document.body;
    body.style.setProperty('--shake-intensity', `${intensity}px`);
    body.classList.remove('mj-shake-anim');
    void body.offsetWidth; // Trigger reflow
    body.classList.add('mj-shake-anim');
    
    setTimeout(() => {
      body.classList.remove('mj-shake-anim');
    }, 300);
  }, []);

  const floatNumber = useCallback((x: number, y: number, text: string, color: string = '#EAB308') => {
    const newNumber: FloatingNumber = {
      id: ++nextId,
      x,
      y,
      text,
      color,
    };

    floatingNumbersList.push(newNumber);
    if (floatingNumbersList.length > MAX_FLOATING_NUMBERS) {
      floatingNumbersList.shift();
    }
    notifyListeners();

    setTimeout(() => {
      floatingNumbersList = floatingNumbersList.filter(n => n.id !== newNumber.id);
      notifyListeners();
    }, ANIMATION_DURATION);
  }, []);

  return {
    shake,
    floatNumber,
    bounceClass: 'mj-bounce-anim',
  };
}

export function FloatingNumbers(): React.JSX.Element {
  const [numbers, setNumbers] = useState<FloatingNumber[]>([]);

  useEffect(() => {
    const listener = () => setNumbers([...floatingNumbersList]);
    floatingNumbersListeners.push(listener);
    return () => {
      floatingNumbersListeners = floatingNumbersListeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'visible' }}>
      {numbers.map((num) => (
        <div
          key={num.id}
          style={{
            position: 'absolute',
            left: num.x,
            top: num.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="mj-float-up-anim"
            style={{
              color: num.color,
              fontWeight: 900,
              textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.8)',
            }}
          >
            {num.text}
          </div>
        </div>
      ))}
    </div>
  );
}

export function useBouncyCounter(value: number) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setDisplayValue(value);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return {
    displayValue,
    isAnimating,
    className: isAnimating ? 'mj-bounce-anim' : '',
  };
}

export function GameJuiceStyles(): React.JSX.Element {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes mj-float-up {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-50px); opacity: 0; }
      }
      .mj-float-up-anim {
        animation: mj-float-up ${ANIMATION_DURATION}ms forwards ease-out;
      }
      
      @keyframes mj-bounce {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
      .mj-bounce-anim {
        animation: mj-bounce 200ms ease-in-out;
      }

      @keyframes mj-shake {
        0%, 100% { transform: translate3d(0, 0, 0); }
        10%, 30%, 50%, 70%, 90% { transform: translate3d(calc(-1 * var(--shake-intensity, 5px)), 0, 0); }
        20%, 40%, 60%, 80% { transform: translate3d(var(--shake-intensity, 5px), 0, 0); }
      }
      .mj-shake-anim {
        animation: mj-shake 300ms both;
      }

      @keyframes mj-pop-in {
        0% { transform: scale(0.6); }
        70% { transform: scale(1.08); }
        100% { transform: scale(1); }
      }
      .mj-pop-in-anim {
        animation: mj-pop-in 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      @keyframes mj-glow-pulse {
        0%, 100% { box-shadow: 0 0 0px rgba(234, 179, 8, 0); }
        50% { box-shadow: 0 0 8px rgba(234, 179, 8, 0.8); }
      }
      .mj-glow-pulse-anim {
        animation: mj-glow-pulse 1.5s infinite;
      }
    `}} />
  );
}
