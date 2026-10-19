'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  imageUrl: string | null;
  meta: string[];
  priceLabel?: string | null;
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d={direction === 'left' ? 'M12.5 4.5L7 10l5.5 5.5' : 'M7.5 4.5L13 10l-5.5 5.5'}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M4.5 10.5l3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DefaultVisual() {
  return (
    <div className="relative flex h-full flex-col justify-between bg-gradient-to-br from-brand-500 via-brand-700 to-slate-950 p-7">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative flex items-center justify-between">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25">
          Learn without limits
        </span>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold text-white ring-1 ring-inset ring-white/25">
          L
        </span>
      </div>
      <div className="relative space-y-3">
        {['Expert-led video lessons', 'Practice projects and feedback', 'Learn online or in batches'].map(
          (item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-200">
                <CheckIcon />
              </span>
              {item}
            </div>
          ),
        )}
      </div>
      <div className="relative flex items-center gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path
              d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold">Learn at your own pace</p>
          <p className="text-xs text-slate-500">Lifetime access to every lesson</p>
        </div>
      </div>
    </div>
  );
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const goTo = useCallback(
    (nextIndex: number) => {
      if (count === 0) return;
      setIndex(((nextIndex % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  useEffect(() => {
    if (count === 0) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [count, next, previous]);

  if (count === 0) return null;

  const slide = slides[index];
  const current = String(index + 1).padStart(2, '0');
  const total = String(count).padStart(2, '0');

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured learning highlights"
      className="relative overflow-hidden bg-slate-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-14 lg:pb-28 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div key={slide.id} className="animate-hero-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-100 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {slide.eyebrow}
            </span>
            <h1 className="mt-5 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
              {slide.description}
            </p>

            {slide.meta.length > 0 ? (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {slide.meta.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={slide.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {slide.ctaLabel}
                <ArrowIcon direction="right" />
              </Link>
              {slide.secondaryHref && slide.secondaryLabel ? (
                <Link
                  href={slide.secondaryHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {slide.secondaryLabel}
                </Link>
              ) : null}
            </div>

            {slide.priceLabel ? (
              <p className="mt-5 text-sm text-slate-400">
                Course fee <span className="font-semibold text-white">{slide.priceLabel}</span>
              </p>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mx-0">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-500/30 via-transparent to-violet-500/20 blur-2xl" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl ring-1 ring-white/10">
              {slide.imageUrl ? (
                <>
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    fill
                    sizes="(max-width: 1024px) 90vw, 45vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-200">
                      {slide.eyebrow}
                    </p>
                    <p className="mt-1 line-clamp-2 text-lg font-semibold text-white">
                      {slide.title}
                    </p>
                  </div>
                </>
              ) : (
                <DefaultVisual />
              )}
            </div>

            <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 text-slate-900 shadow-xl ring-1 ring-slate-900/5 sm:left-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckIcon />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-900">Enrollment opens access</p>
                <p className="text-[11px] text-slate-500">Track progress lesson by lesson</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous slide"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <ArrowIcon direction="right" />
            </button>
            <span className="ml-2 text-xs font-medium tabular-nums text-slate-400">
              {current} <span className="text-slate-600">/</span> {total}
            </span>
          </div>

          {count > 1 ? (
            <div className="flex items-center gap-2" role="tablist" aria-label="Choose a slide">
              {slides.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={itemIndex === index}
                  aria-label={`Go to slide ${itemIndex + 1}: ${item.title}`}
                  onClick={() => goTo(itemIndex)}
                  className={cn(
                    'h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                    itemIndex === index ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60',
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
