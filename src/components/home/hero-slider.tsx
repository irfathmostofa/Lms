'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CourseSearch } from '@/components/courses/course-search';
import { cn } from '@/lib/utils';
import type { HeroSlideView } from '@/lib/home';

const SEARCH_HINTS = [
  { label: 'Web development', q: 'web development' },
  { label: 'English', q: 'english' },
  { label: 'Accounting', q: 'accounting' },
  { label: 'Design', q: 'design' },
];

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
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

function SearchHints({ light }: { light?: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className={cn('text-xs font-medium', light ? 'text-white/70' : 'text-slate-500')}>
        Popular:
      </span>
      {SEARCH_HINTS.map((hint) => (
        <Link
          key={hint.q}
          href={`/courses?q=${encodeURIComponent(hint.q)}`}
          className={cn(
            'inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-medium transition',
            light
              ? 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700',
          )}
        >
          {hint.label}
        </Link>
      ))}
    </div>
  );
}

function DefaultVisual() {
  return (
    <div className="relative overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative mx-auto grid min-h-[30rem] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:min-h-[34rem] sm:px-6 sm:py-16 lg:min-h-[38rem] lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:py-20">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-100 backdrop-blur">
            Learning platform
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-tight">
            Build skills that open new doors.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
            Structured lessons, practical projects and lifetime access. Find a course and start
            learning in minutes.
          </p>
          <div className="mt-6 sm:mt-8">
            <CourseSearch variant="hero" inputId="course-search-hero-default" />
            <SearchHints light />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-50 sm:min-h-12 sm:px-6"
            >
              Explore courses
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:min-h-12 sm:px-6"
            >
              Create a free account
            </Link>
          </div>
        </div>

        <div className="relative hidden h-full min-h-[18rem] lg:block">
          <div className="absolute left-6 top-6 w-64 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-200">Featured path</p>
            <p className="mt-2 text-lg font-semibold text-white">Career-ready courses</p>
            <p className="mt-1 text-sm text-slate-300">Learn with live batches or at your own pace.</p>
          </div>
          <div className="absolute bottom-10 right-4 w-56 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-md">
            <p className="text-sm font-semibold text-white">Lifetime access</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Revisit lessons, track progress and pick up where you left off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSlider({ slides }: { slides: HeroSlideView[] }) {
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
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [count, next, previous]);

  if (count === 0) {
    return (
      <section aria-label="Homepage hero" className="relative overflow-hidden bg-slate-950">
        <DefaultVisual />
      </section>
    );
  }

  const slide = slides[index];
  const hasCopy = Boolean(slide.eyebrow || slide.title || slide.description || slide.ctaLabel);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Homepage slider"
      className="relative overflow-hidden bg-slate-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="absolute inset-0">
        {slides.map((item, itemIndex) => (
          <div
            key={item.id}
            aria-hidden={itemIndex !== index}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              itemIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title || 'Homepage slide'}
                fill
                priority={itemIndex === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-brand-700 via-slate-900 to-slate-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/55 to-slate-950/85 sm:bg-gradient-to-r sm:from-slate-950/85 sm:via-slate-950/50 sm:to-slate-950/25" />
          </div>
        ))}
      </div>

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20',
          'min-h-[30rem] sm:min-h-[34rem] lg:min-h-[38rem]',
          count > 1 ? 'pb-20 sm:pb-16' : '',
        )}
      >
        <div key={slide.id} className="max-w-2xl animate-hero-in">
          {hasCopy ? (
            <>
              {slide.eyebrow ? (
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur sm:text-xs">
                  {slide.eyebrow}
                </span>
              ) : null}
              {slide.title ? (
                <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {slide.title}
                </h1>
              ) : null}
              {slide.description ? (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
                  {slide.description}
                </p>
              ) : null}
            </>
          ) : (
            <span className="sr-only">{slide.title || 'Homepage slide'}</span>
          )}

          <div className={cn('max-w-xl', hasCopy ? 'mt-6 sm:mt-8' : '')}>
            <CourseSearch variant="hero" inputId="course-search-hero" />
            <SearchHints light />
          </div>

          {slide.href && slide.ctaLabel ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={slide.href}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-50 sm:min-h-12 sm:px-6"
              >
                {slide.ctaLabel}
              </Link>
              {slide.secondaryHref && slide.secondaryLabel ? (
                <Link
                  href={slide.secondaryHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:min-h-12 sm:px-6"
                >
                  {slide.secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
          >
            <ArrowIcon direction="right" />
          </button>
          <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3 px-4 sm:bottom-5">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous slide"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur sm:hidden"
            >
              <ArrowIcon direction="left" />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Choose a slide">
              {slides.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={itemIndex === index}
                  aria-label={`Go to slide ${itemIndex + 1}`}
                  onClick={() => goTo(itemIndex)}
                  className={cn(
                    'h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                    itemIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70',
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur sm:hidden"
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
