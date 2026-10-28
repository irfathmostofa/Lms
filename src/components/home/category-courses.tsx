'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { HomeCourse } from '@/lib/home';
import { HomeCourseCard } from '@/components/home/home-course-card';
import { cn } from '@/lib/utils';

export interface CategoryGroup {
  id: string;
  name: string;
  description: string | null;
  courses: HomeCourse[];
}

export function CategoryCourses({
  categories,
  courses,
}: {
  categories: CategoryGroup[];
  courses: HomeCourse[];
}) {
  const [active, setActive] = useState('all');
  const visibleGroups = useMemo(
    () => categories.filter((group) => group.courses.length > 0),
    [categories],
  );

  if (visibleGroups.length === 0 || courses.length === 0) return null;

  const activeGroup = visibleGroups.find((group) => group.id === active) ?? null;
  const shown = (activeGroup ? activeGroup.courses : courses).slice(0, 6);

  return (
    <section id="categories" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">
              Browse by category
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Find the right path for your goals
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
              Every category combines structured lessons, practical work and support from
              experienced instructors.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
          >
            View all courses
          </Link>
        </div>

        <div
          role="tablist"
          aria-label="Course categories"
          className="scrollbar-thin mt-8 flex gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={active === 'all'}
            onClick={() => setActive('all')}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
              active === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
            )}
          >
            All courses
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                active === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
              )}
            >
              {courses.length}
            </span>
          </button>

          {visibleGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={active === group.id}
              onClick={() => setActive(group.id)}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                active === group.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
              )}
            >
              {group.name}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                  active === group.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                )}
              >
                {group.courses.length}
              </span>
            </button>
          ))}
        </div>

        {activeGroup?.description ? (
          <p className="mt-5 max-w-2xl text-sm text-slate-500">{activeGroup.description}</p>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((course) => (
            <HomeCourseCard key={course.id} course={course} />
          ))}
        </div>

        {activeGroup && activeGroup.courses.length > shown.length ? (
          <div className="mt-8 text-center">
            <Link
              href="/courses"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              See all {activeGroup.name} courses
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
