'use client';

import { useEffect, useRef } from 'react';
import type { ParticleStyle } from '@/lib/particles';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  life: number;
  spin: number;
};

function countFor(width: number, height: number, density: number) {
  const area = (width * height) / 14000;
  return Math.max(18, Math.min(120, Math.round(area * density)));
}

function paint(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number,
  style: ParticleStyle,
  tick: number,
) {
  ctx.clearRect(0, 0, width, height);

  if (style === 'mesh') {
    const gap = 42;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let y = 20; y < height; y += gap) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const wave = Math.sin((x + tick * 1.4) / 70 + y / 90) * 8;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
    return;
  }

  if (style === 'aurora') {
    for (let i = 0; i < 4; i += 1) {
      const y = height * (0.18 + i * 0.16);
      const gradient = ctx.createLinearGradient(0, y - 50, width, y + 50);
      gradient.addColorStop(0, 'rgba(49,130,255,0)');
      gradient.addColorStop(0.35, `hsla(${190 + i * 18}, 90%, 65%, 0.18)`);
      gradient.addColorStop(0.65, `hsla(${280 + i * 12}, 80%, 70%, 0.16)`);
      gradient.addColorStop(1, 'rgba(49,130,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= width; x += 12) {
        const wave = Math.sin(x / 180 + tick / 80 + i) * 36 + Math.cos(x / 90 + tick / 50) * 12;
        ctx.lineTo(x, y + wave);
      }
      ctx.lineTo(width, y + 90);
      ctx.lineTo(0, y + 90);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (style === 'constellation') {
    ctx.lineWidth = 0.8;
    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110) {
          ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 110) * 0.22})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  particles.forEach((particle) => {
    if (style === 'bubbles') {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,255,255,${particle.alpha * 0.7})`;
      ctx.fillStyle = `rgba(186,230,253,${particle.alpha * 0.12})`;
      ctx.lineWidth = 1.2;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${particle.alpha * 0.45})`;
      ctx.arc(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (style === 'confetti') {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.spin + tick / 40);
      ctx.fillStyle = `hsla(${particle.hue}, 85%, 65%, ${particle.alpha})`;
      ctx.fillRect(-particle.size, -particle.size * 0.4, particle.size * 2, particle.size * 0.8);
      ctx.restore();
      return;
    }

    if (style === 'stars') {
      const twinkle = 0.45 + Math.sin(tick / 18 + particle.spin) * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${particle.alpha * twinkle})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 4);
    if (style === 'sparks') {
      glow.addColorStop(0, `hsla(${28 + particle.hue * 0.08}, 95%, 68%, ${particle.alpha})`);
      glow.addColorStop(1, 'rgba(255,140,0,0)');
    } else if (style === 'snow') {
      glow.addColorStop(0, `rgba(255,255,255,${particle.alpha})`);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
    } else {
      glow.addColorStop(0, `hsla(${195 + particle.hue * 0.2}, 90%, 72%, ${particle.alpha})`);
      glow.addColorStop(1, 'rgba(49,130,255,0)');
    }
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function step(particles: Particle[], width: number, height: number, style: ParticleStyle, tick: number) {
  particles.forEach((particle) => {
    if (style === 'waves') {
      particle.x += particle.vx;
      particle.y += Math.sin((particle.x + tick) / 50) * 0.7;
    } else if (style === 'snow') {
      particle.y += particle.vy;
      particle.x += Math.sin(tick / 40 + particle.spin) * 0.4;
    } else if (style === 'sparks' || style === 'bubbles') {
      particle.y += particle.vy;
      particle.x += particle.vx + Math.sin(tick / 30 + particle.spin) * 0.2;
    } else if (style === 'confetti') {
      particle.y += particle.vy;
      particle.x += particle.vx;
      particle.spin += 0.04;
    } else {
      particle.x += particle.vx;
      particle.y += particle.vy;
    }

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;
  });
}

function seed(width: number, height: number, style: ParticleStyle): Particle[] {
  const density =
    style === 'stars' ? 1.4 : style === 'constellation' ? 0.7 : style === 'confetti' ? 1.1 : 0.9;
  const total = countFor(width, height, density);
  return Array.from({ length: total }, () => {
    const rising = style === 'sparks' || style === 'bubbles';
    const falling = style === 'snow' || style === 'confetti';
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (style === 'orbs' ? 0.35 : 0.55),
      vy: rising ? -(0.25 + Math.random() * 0.55) : falling ? 0.35 + Math.random() * 0.7 : (Math.random() - 0.5) * 0.4,
      size:
        style === 'bubbles'
          ? 4 + Math.random() * 10
          : style === 'stars'
            ? 0.6 + Math.random() * 1.6
            : 1.2 + Math.random() * 2.4,
      alpha: 0.25 + Math.random() * 0.55,
      hue: Math.random() * 360,
      life: Math.random(),
      spin: Math.random() * Math.PI * 2,
    };
  });
}

export function ParticleField({ style }: { style: ParticleStyle }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let tick = 0;
    let particles: Particle[] = [];
    let running = true;

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? 520;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = seed(width, height, style);
    };

    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      if (!running) return;
      frame = window.requestAnimationFrame(loop);
      tick += 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      step(particles, width, height, style, tick);
      paint(ctx, particles, width, height, style, tick);
    };

    loop();

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [style]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
