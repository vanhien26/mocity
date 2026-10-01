'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'circle' | 'square' | 'ring' | 'star' | 'dust' | 'spark';
  gravity: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  targetX?: number;
  targetY?: number;
}

let activeParticles: Particle[] = [];
const MAX_PARTICLES = 200;

function addParticle(p: Partial<Particle>) {
  if (activeParticles.length >= MAX_PARTICLES) return;
  
  activeParticles.push({
    x: p.x || 0,
    y: p.y || 0,
    vx: p.vx || 0,
    vy: p.vy || 0,
    life: p.life || 60,
    maxLife: p.life || 60,
    size: p.size || 5,
    color: p.color || '#fff',
    type: p.type || 'circle',
    gravity: p.gravity || 0,
    opacity: p.opacity !== undefined ? p.opacity : 1,
    rotation: p.rotation || 0,
    rotationSpeed: p.rotationSpeed || 0,
    targetX: p.targetX,
    targetY: p.targetY,
  });
}

export const particles = {
  coinShower(x: number, y: number, amount?: number): void {
    const count = amount ? amount : 12 + Math.floor(Math.random() * 9); // 12-20
    for (let i = 0; i < count; i++) {
      addParticle({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 8 - 2,
        life: 40 + Math.random() * 20,
        size: 3 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#FFD700' : '#DAA520',
        type: 'circle',
        gravity: 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  },
  buildCelebration(x: number, y: number): void {
    // 8-12 dust puffs
    const dustCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < dustCount; i++) {
      addParticle({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 24, // ~400ms at 60fps
        size: 4,
        color: 'rgba(150, 130, 110, 0.5)',
        type: 'dust',
        gravity: 0
      });
    }
    // 15-25 confetti
    const confettiCount = 15 + Math.floor(Math.random() * 11);
    for (let i = 0; i < confettiCount; i++) {
      addParticle({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6 - 2,
        life: 40 + Math.random() * 20,
        size: 3,
        color: '#D82D8B',
        type: 'square',
        gravity: 0.15,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
    // white flash
    addParticle({
      x, y,
      vx: 0, vy: 0,
      life: 9, // ~150ms at 60fps
      size: 0,
      color: '#ffffff',
      type: 'ring',
      gravity: 0
    });
  },
  levelUpRing(x: number, y: number): void {
    addParticle({
      x, y, vx: 0, vy: 0, life: 30, size: 0, color: '#FACC15', type: 'ring', gravity: 0
    });
    const starCount = 5 + Math.floor(Math.random() * 4);
    for(let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2;
      addParticle({
        x, y,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        life: 40,
        size: 4,
        color: '#FACC15',
        type: 'star',
        gravity: 0,
        rotation: angle,
        rotationSpeed: 0.1
      });
    }
  },
  comboSpark(x1: number, y1: number, x2: number, y2: number): void {
    const sparkCount = 6 + Math.floor(Math.random() * 5);
    for(let i = 0; i < sparkCount; i++) {
      addParticle({
        x: x1, y: y1,
        vx: (x2 - x1) * 0.05 + (Math.random() - 0.5) * 2,
        vy: (y2 - y1) * 0.05 + (Math.random() - 0.5) * 2,
        targetX: x2, targetY: y2,
        life: 30 + Math.random() * 10,
        size: 3,
        color: '#D82D8B',
        type: 'spark',
        gravity: 0
      });
    }
  },
  confetti(x: number, y: number): void {
    const colors = ['#D82D8B', '#FACC15', '#38BDF8', '#34D399', '#A855F7'];
    const count = 30 + Math.floor(Math.random() * 21);
    for(let i = 0; i < count; i++) {
      addParticle({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 8 - 4,
        life: 60 + Math.random() * 30,
        size: 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'square',
        gravity: 0.1,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }
};

export default function ParticleEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, rotation: number) => {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot + rotation) * outerRadius;
        y = cy + Math.sin(rot + rotation) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot + rotation) * innerRadius;
        y = cy + Math.sin(rot + rotation) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.life--;
        if (p.life <= 0) {
          activeParticles.splice(i, 1);
          continue;
        }

        if (p.type === 'spark' && p.targetX !== undefined && p.targetY !== undefined) {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          p.vx = dx * 0.1 + (Math.random() - 0.5) * 2;
          p.vy = dy * 0.1 + (Math.random() - 0.5) * 2;
        }

        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity = p.life / p.maxLife;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.type === 'ring') {
          const ringSize = p.color === '#ffffff' ? 40 * (1 - p.opacity) : 60 * (1 - p.opacity);
          ctx.beginPath();
          ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (p.type === 'dust') {
          const dustSize = 4 + 8 * (1 - p.opacity);
          ctx.beginPath();
          ctx.arc(0, 0, dustSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'star') {
          drawStar(0, 0, 5, p.size, p.size / 2, 0);
        } else if (p.type === 'spark') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-50"
    />
  );
}
