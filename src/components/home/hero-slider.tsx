'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CourseSearch } from '@/components/courses/course-search';
import { ParticleField } from '@/components/home/particle-field';
import { cn, formatCurrency } from '@/lib/utils';
import type { HeroSlideView } from '@/lib/home';
import type { ParticleStyle } from '@/lib/particles';

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

function SearchHints() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-white/60">Popular:</span>
      {SEARCH_HINTS.map((hint) => (
        <Link
          key={hint.q}
          href={`/courses?q=${encodeURIComponent(hint.q)}`}
          className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-white/20"
        >
          {hint.label}
        </Link>
      ))}
    </div>
  );
}

function DefaultVisual({ particleStyle }: { particleStyle: ParticleStyle }) {
  return (
    <div className="relative overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
      <ParticleField style={particleStyle} />

      <div className="relative mx-auto grid min-h-[32rem] w-full max-w-6xl items-center gap-10 px-4 py-16 sm:min-h-[36rem] sm:px-6 lg:min-h-[40rem] lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-100 backdrop-blur">
            Featured learning
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            Courses that move your career forward.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">
            Admin-picked programs with real projects, expert instructors and lifetime access.
            Browse the catalog and start in minutes.
          </p>
          <div className="mt-8">
            <CourseSearch variant="hero" inputId="course-search-hero-default" />
            <SearchHints />
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-brand-50"
            >
              Explore courses
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Create a free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSlider({
  slides,
  particleStyle,
}: {
  slides: HeroSlideView[];
  particleStyle: ParticleStyle;
}) {
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
        <DefaultVisual particleStyle={particleStyle} />
      </section>
    );
  }

  const slide = slides[index];
  const course = slide.course;
  const price = course ? Number(course.discountPrice ?? course.price ?? 0) : 0;
  const original = course ? Number(course.price ?? 0) : 0;
  const hasDiscount = Boolean(course?.discountPrice && original > Number(course.discountPrice));
  const activeParticle = slide.particleStyle || particleStyle;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured courses"
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
                alt={item.title || 'Featured course'}
                fill
                priority={itemIndex === 0}
                sizes="100vw"
                className="object-cover object-center scale-105"
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-brand-700 via-slate-900 to-slate-950" />
            )}
            <div className="absolute inset-0 bg-slate-950/55" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/30" />
          </div>
        ))}
      </div>

      <ParticleField style={activeParticle} />

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:py-24',
          'min-h-[32rem] sm:min-h-[36rem] lg:min-h-[40rem]',
          count > 1 ? 'pb-24' : '',
        )}
      >
        <div key={slide.id} className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl animate-hero-in">
            {slide.eyebrow ? (
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                {slide.eyebrow}
              </span>
            ) : null}
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              {slide.title}
            </h1>
            {slide.description ? (
              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-200">{slide.description}</p>
            ) : null}

            {course ? (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/80">
                {course.level ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">{course.level}</span>
                ) : null}
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 capitalize">{course.mode}</span>
                {course.durationLabel ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">{course.durationLabel}</span>
                ) : null}
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                  {course.totalLessons} lesson{course.totalLessons === 1 ? '' : 's'}
                </span>
              </div>
            ) : null}

            <div className="mt-8 max-w-xl">
              <CourseSearch variant="hero" inputId="course-search-hero" />
              <SearchHints />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={slide.href}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-brand-50"
              >
                {slide.ctaLabel}
              </Link>
              {slide.secondaryHref && slide.secondaryLabel ? (
                <Link
                  href={slide.secondaryHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {slide.secondaryLabel}
                </Link>
              ) : null}
              {course ? (
                <div className="sm:ml-2">
                  <p className="text-lg font-semibold text-white">
                    {price > 0 ? formatCurrency(price) : 'Free'}
                  </p>
                  {hasDiscount ? (
                    <p className="text-xs text-white/50 line-through">{formatCurrency(original)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 shadow-2xl shadow-slate-950/40 ring-1 ring-white/10">
              {slide.imageUrl ? (
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  sizes="42vw"
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-sm font-semibold text-white">{slide.title}</p>
                <p className="mt-1 text-xs text-white/70">Selected by admin for the homepage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Previous course"
            className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next course"
            className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
          >
            <ArrowIcon direction="right" />
          </button>
          <div className="absolute inset-x-0 bottom-5 z-10 flex items-center justify-center gap-3 px-4">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous course"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur sm:hidden"
            >
              <ArrowIcon direction="left" />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Choose a featured course">
              {slides.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={itemIndex === index}
                  aria-label={`Go to ${item.title}`}
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
              aria-label="Next course"
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
