'use client';

import { useEffect, useRef, useState } from 'react';

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
}

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    let frame = 0;
    const duration = 1400;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
}

function StatValue({ value, suffix, active }: { value: number; suffix?: string; active: boolean }) {
  const current = useCountUp(value, active);
  return (
    <span className="tabular-nums">
      {current.toLocaleString('en-US')}
      {suffix ? <span className="text-brand-500">{suffix}</span> : null}
    </span>
  );
}

export function HomeStats({ items }: { items: StatItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <section aria-label="Learning in numbers" className="relative z-10 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div
          ref={containerRef}
          className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-xl shadow-slate-900/5 sm:grid-cols-2 lg:-mt-12 lg:grid-cols-4"
        >
          {items.map((item) => (
            <div key={item.label} className="bg-white px-6 py-7">
              <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                <StatValue value={item.value} suffix={item.suffix} active={active} />
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
