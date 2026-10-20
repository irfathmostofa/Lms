'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge, EmptyState } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Category, Course } from '@/lib/types';

const modeTone: Record<string, 'blue' | 'violet' | 'amber'> = {
  online: 'blue',
  offline: 'amber',
  hybrid: 'violet',
};

export function CourseCatalog({ courses, categories }: { courses: Course[]; categories: Category[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState('all');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState('newest');

  const levels = useMemo(
    () => Array.from(new Set(courses.map((course) => course.level).filter(Boolean))) as string[],
    [courses],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = courses.filter((course) => {
      if (category !== 'all' && course.category_id !== category) return false;
      if (mode !== 'all' && course.mode !== mode) return false;
      if (level !== 'all' && course.level !== level) return false;
      if (!needle) return true;
      return (
        course.title.toLowerCase().includes(needle) ||
        (course.summary ?? '').toLowerCase().includes(needle) ||
        (course.author_name ?? '').toLowerCase().includes(needle)
      );
    });

    next.sort((a, b) => {
      if (sort === 'price-asc') return Number(a.discount_price ?? a.price) - Number(b.discount_price ?? b.price);
      if (sort === 'price-desc') return Number(b.discount_price ?? b.price) - Number(a.discount_price ?? a.price);
      if (sort === 'popular') return Number(b.is_featured) - Number(a.is_featured) || b.total_lessons - a.total_lessons;
      return 0;
    });
    return next;
  }, [category, courses, level, mode, query, sort]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">Catalog</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">All courses</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            {filtered.length} course{filtered.length === 1 ? '' : 's'} to help you learn a skill, change a role, or grow at work.
          </p>
        </div>
        <label className="relative w-full max-w-md">
          <span className="sr-only">Search courses</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for anything"
            className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-400/40"
          />
        </label>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 lg:sticky lg:top-24 lg:h-fit">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Mode</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="all">All modes</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          {levels.length > 0 ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Level</span>
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="all">All levels</option>
                {levels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most popular</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </aside>

        {filtered.length === 0 ? (
          <EmptyState title="No courses match" description="Try another search or clear the filters." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => {
              const price = Number(course.discount_price ?? course.price);
              const original = Number(course.price);
              const hasDiscount = Boolean(course.discount_price && original > price);
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-video bg-slate-100">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-800 text-xs text-slate-400">
                        {course.title.slice(0, 1)}
                      </div>
                    )}
                    {course.is_featured ? (
                      <span className="absolute left-3 top-3 rounded bg-amber-400 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-900">
                        Bestseller
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 group-hover:text-brand-700">
                      {course.title}
                    </h2>
                    {course.author_name ? (
                      <p className="mt-1 text-xs text-slate-500">{course.author_name}</p>
                    ) : null}
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{course.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone={modeTone[course.mode] ?? 'slate'}>{course.mode}</Badge>
                      {course.level ? <Badge>{course.level}</Badge> : null}
                      <span className="text-xs text-slate-400">{course.total_lessons} lessons</span>
                    </div>
                    <div className="mt-auto flex items-end gap-2 pt-4">
                      <span className="text-base font-bold text-slate-900">
                        {price > 0 ? formatCurrency(price) : 'Free'}
                      </span>
                      {hasDiscount ? (
                        <span className="text-xs text-slate-400 line-through">{formatCurrency(original)}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
