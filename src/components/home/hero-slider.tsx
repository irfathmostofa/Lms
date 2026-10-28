'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CourseSearch } from '@/components/courses/course-search';
import { ParticleField } from '@/components/home/particle-field';
import { cn, formatCurrency } from '@/lib/utils';
import { useLocale } from '@/components/i18n/locale-provider';
import { lessonLabel, modeLabel } from '@/lib/i18n';
import type { HeroSlideView, HomeCourse } from '@/lib/home';
import type { HeroLayout } from '@/lib/hero';
import type { ParticleStyle } from '@/lib/particles';

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

function SearchHints({ dark = false }: { dark?: boolean }) {
  const { t } = useLocale();
  const hints = [
    { label: t('search.hintWeb'), q: 'web development' },
    { label: t('search.hintEnglish'), q: 'english' },
    { label: t('search.hintAccounting'), q: 'accounting' },
    { label: t('search.hintDesign'), q: 'design' },
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className={cn('text-xs font-medium', dark ? 'text-white/60' : 'text-slate-500')}>{t('search.popular')}:</span>
      {hints.map((hint) => (
        <Link
          key={hint.q}
          href={`/courses?q=${encodeURIComponent(hint.q)}`}
          className={cn(
            'inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-medium backdrop-blur transition',
            dark
              ? 'border-white/15 bg-white/10 text-white/90 hover:bg-white/20'
              : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
          )}
        >
          {hint.label}
        </Link>
      ))}
    </div>
  );
}

function DefaultVisual({ particleStyle }: { particleStyle: ParticleStyle }) {
  const { t } = useLocale();
  return (
    <div className="relative overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
      <ParticleField style={particleStyle} />

      <div className="relative mx-auto grid min-h-[28rem] w-full max-w-6xl items-center gap-10 px-4 py-16 sm:min-h-[32rem] sm:px-6 lg:min-h-[36rem] lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-100 backdrop-blur">
            {t('hero.featuredLearning')}
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            {t('hero.defaultTitle')}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">
            {t('hero.defaultBody')}
          </p>
          <div className="mt-8">
            <CourseSearch variant="hero" inputId="course-search-hero-default" />
            <SearchHints dark />
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              {t('hero.exploreCourses')}
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t('hero.createAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function useHeroCarousel(count: number) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

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

  return { index, paused, setPaused, goTo, next, previous };
}

function CarouselControls({
  count,
  index,
  slides,
  onPrevious,
  onNext,
  onGoTo,
  light = false,
}: {
  count: number;
  index: number;
  slides: HeroSlideView[];
  onPrevious: () => void;
  onNext: () => void;
  onGoTo: (nextIndex: number) => void;
  light?: boolean;
}) {
  const { t } = useLocale();
  if (count < 2) return null;

  const buttonClass = light
    ? 'border-slate-200 bg-white/90 text-slate-700 hover:bg-white'
    : 'border-white/15 bg-black/35 text-white hover:bg-black/55';

  return (
    <>
      <button
        type="button"
        onClick={onPrevious}
        aria-label={t('hero.previous')}
        className={cn(
          'absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:flex',
          buttonClass,
        )}
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label={t('hero.next')}
        className={cn(
          'absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:flex',
          buttonClass,
        )}
      >
        <ArrowIcon direction="right" />
      </button>
      <div className="absolute inset-x-0 bottom-5 z-10 flex items-center justify-center gap-3 px-4">
        <button
          type="button"
          onClick={onPrevious}
          aria-label={t('hero.previous')}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full backdrop-blur sm:hidden',
            light ? 'bg-white/90 text-slate-700' : 'bg-black/45 text-white',
          )}
        >
          <ArrowIcon direction="left" />
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label={t('hero.chooseSlide')}>
          {slides.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-label={`Go to ${item.title}`}
              onClick={() => onGoTo(itemIndex)}
              className={cn(
                'h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                itemIndex === index
                  ? light
                    ? 'w-8 bg-brand-600'
                    : 'w-8 bg-white'
                  : light
                    ? 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    : 'w-2.5 bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onNext}
          aria-label={t('hero.next')}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full backdrop-blur sm:hidden',
            light ? 'bg-white/90 text-slate-700' : 'bg-black/45 text-white',
          )}
        >
          <ArrowIcon direction="right" />
        </button>
      </div>
    </>
  );
}

function ImagesHero({ slides, particleStyle }: { slides: HeroSlideView[]; particleStyle: ParticleStyle }) {
  const { t } = useLocale();
  const count = slides.length;
  const { index, setPaused, goTo, next, previous } = useHeroCarousel(count);
  const slide = slides[index];
  const activeParticle = slide.particleStyle || particleStyle;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('hero.featuredImages')}
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
                alt={item.title || t('hero.featuredCourse')}
                fill
                priority={itemIndex === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-brand-700 via-slate-900 to-slate-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-slate-950/20" />
          </div>
        ))}
      </div>

      <ParticleField style={activeParticle} />

      <div className={cn('relative z-10 mx-auto flex min-h-[28rem] w-full max-w-6xl flex-col justify-end px-4 py-16 sm:min-h-[34rem] sm:px-6 lg:min-h-[38rem]', count > 1 ? 'pb-24' : '')}>
        <div key={slide.id} className="max-w-2xl animate-hero-in">
          {slide.eyebrow ? (
            <span className="inline-flex rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              {slide.eyebrow}
            </span>
          ) : null}
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{slide.title}</h1>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={slide.href}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              {slide.ctaLabel}
            </Link>
            {slide.secondaryHref && slide.secondaryLabel ? (
              <Link
                href={slide.secondaryHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-black/20 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                {slide.secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <CarouselControls
        count={count}
        index={index}
        slides={slides}
        onPrevious={previous}
        onNext={next}
        onGoTo={goTo}
      />
    </section>
  );
}

function TextHero({ slides, particleStyle }: { slides: HeroSlideView[]; particleStyle: ParticleStyle }) {
  const { t, dict } = useLocale();
  const count = slides.length;
  const { index, setPaused, goTo, next, previous } = useHeroCarousel(count);
  const slide = slides[index];
  const course = slide.course;
  const price = course ? Number(course.discountPrice ?? course.price ?? 0) : 0;
  const original = course ? Number(course.price ?? 0) : 0;
  const hasDiscount = Boolean(course?.discountPrice && original > Number(course.discountPrice));
  const activeParticle = slide.particleStyle || particleStyle;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('hero.featuredCourses')}
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
                alt={item.title || t('hero.featuredCourse')}
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
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 capitalize">{modeLabel(dict, course.mode)}</span>
                {course.durationLabel ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">{course.durationLabel}</span>
                ) : null}
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                  {lessonLabel(dict, course.totalLessons)}
                </span>
              </div>
            ) : null}

            <div className="mt-8 max-w-xl">
              <CourseSearch variant="hero" inputId="course-search-hero" />
              <SearchHints dark />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={slide.href}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-500"
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
                    {price > 0 ? formatCurrency(price) : t('course.free')}
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
                <Image src={slide.imageUrl} alt="" fill sizes="42vw" className="object-cover" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-sm font-semibold text-white">{slide.title}</p>
                <p className="mt-1 text-xs text-white/70">{t('hero.selectedByAdmin')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CarouselControls
        count={count}
        index={index}
        slides={slides}
        onPrevious={previous}
        onNext={next}
        onGoTo={goTo}
      />
    </section>
  );
}

function HeroCourseTile({
  title,
  href,
  imageUrl,
  level,
  mode,
  price,
  discountPrice,
  durationLabel,
}: {
  title: string;
  href: string;
  imageUrl: string | null;
  level?: string | null;
  mode?: string;
  price?: number;
  discountPrice?: number | null;
  durationLabel?: string | null;
}) {
  const { t, dict } = useLocale();
  const amount = Number(discountPrice ?? price ?? 0);
  const original = Number(price ?? 0);
  const hasDiscount = Boolean(discountPrice && original > Number(discountPrice));

  return (
    <Link
      href={href}
      className="group flex w-[16.5rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg sm:w-[18rem]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill sizes="288px" className="object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="h-full bg-gradient-to-br from-brand-500 to-slate-900" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          {mode ? <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium capitalize text-brand-700">{modeLabel(dict, mode)}</span> : null}
          {level ? <span>{level}</span> : null}
          {durationLabel ? <span>{durationLabel}</span> : null}
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
          {title}
        </h3>
        <p className="mt-3 text-sm font-bold text-slate-900">
          {amount > 0 ? formatCurrency(amount) : t('course.free')}
          {hasDiscount ? (
            <span className="ml-2 text-xs font-medium text-slate-400 line-through">{formatCurrency(original)}</span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}

function CoursesHero({
  slides,
  courses,
}: {
  slides: HeroSlideView[];
  courses: HomeCourse[];
}) {
  const fromSlides = slides.map((slide) => ({
    id: slide.id,
    title: slide.title,
    href: slide.href,
    imageUrl: slide.imageUrl,
    level: slide.course?.level,
    mode: slide.course?.mode,
    price: slide.course?.price,
    discountPrice: slide.course?.discountPrice,
    durationLabel: slide.course?.durationLabel,
  }));

  const usedHrefs = new Set(fromSlides.map((item) => item.href));
  const extras = courses
    .filter((course) => !usedHrefs.has(`/courses/${course.slug}`))
    .map((course) => ({
      id: course.id,
      title: course.title,
      href: `/courses/${course.slug}`,
      imageUrl: course.thumbnail_url,
      level: course.level,
      mode: course.mode,
      price: course.price,
      discountPrice: course.discount_price,
      durationLabel: course.duration_label,
    }));

  const { t } = useLocale();
  const items = [...fromSlides, ...extras].slice(0, 8);

  return (
    <section aria-label={t('hero.featuredCourses')} className="relative overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-brand-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">{t('hero.startLearning')}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {t('hero.rowTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {t('hero.rowBody')}
          </p>
          <div className="mt-6 max-w-xl">
            <CourseSearch variant="hero" inputId="course-search-hero-row" />
            <SearchHints />
          </div>
        </div>

        {items.length > 0 ? (
          <div className="mt-8 flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
            {items.map((item) => (
              <HeroCourseTile key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-sm text-slate-500">{t('hero.emptyRow')}</p>
            <Link href="/courses" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
              {t('hero.exploreCourses')}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function HeroSlider({
  slides,
  particleStyle,
  layout = 'text',
  courses = [],
}: {
  slides: HeroSlideView[];
  particleStyle: ParticleStyle;
  layout?: HeroLayout;
  courses?: HomeCourse[];
}) {
  const { t } = useLocale();
  if (layout === 'courses') {
    return <CoursesHero slides={slides} courses={courses} />;
  }

  if (slides.length === 0) {
    return (
      <section aria-label={t('hero.homepageHero')} className="relative overflow-hidden bg-slate-950">
        <DefaultVisual particleStyle={particleStyle} />
      </section>
    );
  }

  if (layout === 'images') {
    return <ImagesHero slides={slides} particleStyle={particleStyle} />;
  }

  return <TextHero slides={slides} particleStyle={particleStyle} />;
}
