'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CourseSearch } from '@/components/courses/course-search';
import { cn } from '@/lib/utils';
import type { HeroSlideView } from '@/lib/home';

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

function DefaultVisual() {
  return (
    <div className="relative flex min-h-[18rem] flex-col justify-end bg-gradient-to-br from-brand-600 via-slate-900 to-slate-950 px-5 py-10 sm:min-h-[24rem] sm:px-8 sm:py-14 lg:min-h-[32rem] lg:px-16 lg:py-20">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Learning platform</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Build skills that open new doors.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200 sm:mt-4 sm:text-base">
          Structured lessons, practical projects and lifetime access. Upload slider images from the admin dashboard to replace this default hero.
        </p>
        <div className="mt-6 max-w-xl sm:mt-8">
          <CourseSearch variant="hero" />
        </div>
        <Link
          href="/courses"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-50 sm:min-h-12 sm:px-6"
        >
          Explore courses
        </Link>
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
              <div className="h-full bg-slate-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/45 to-slate-950/80 sm:bg-gradient-to-r sm:from-slate-950/80 sm:via-slate-950/40 sm:to-slate-950/15" />
          </div>
        ))}
      </div>

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-5 py-10 sm:px-6 sm:py-14 lg:py-20',
          hasCopy ? 'min-h-[18rem] sm:min-h-[24rem] lg:min-h-[32rem]' : 'min-h-[16rem] sm:min-h-[22rem] lg:min-h-[28rem]',
          count > 1 ? 'pb-16 sm:pb-16' : '',
        )}
      >
        {hasCopy ? (
          <div key={slide.id} className="max-w-2xl animate-hero-in">
            {slide.eyebrow ? (
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur sm:text-xs">
                {slide.eyebrow}
              </span>
            ) : null}
            {slide.title ? (
              <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
                {slide.title}
              </h1>
            ) : null}
            {slide.description ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200 sm:mt-4 sm:text-base">
                {slide.description}
              </p>
            ) : null}
            <div className="mt-5 max-w-xl sm:mt-7">
              <CourseSearch variant="hero" inputId="course-search-hero" />
            </div>
            {slide.href && slide.ctaLabel ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
        ) : (
          <span className="sr-only">{slide.title || 'Homepage slide'}</span>
        )}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4 sm:h-11 sm:w-11"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4 sm:h-11 sm:w-11"
          >
            <ArrowIcon direction="right" />
          </button>
          <div
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2"
            role="tablist"
            aria-label="Choose a slide"
          >
            {slides.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={itemIndex === index}
                aria-label={`Go to slide ${itemIndex + 1}`}
                onClick={() => goTo(itemIndex)}
                className={cn(
                  'h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  itemIndex === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
