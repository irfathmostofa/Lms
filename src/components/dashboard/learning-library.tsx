'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface LearningCourse {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  mode: string | null;
  status: string;
  thumbnailUrl: string | null;
  authorName: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
}

const TABS = [
  { id: 'all', label: 'All courses' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
] as const;

function PlayGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function CourseCover({ course }: { course: LearningCourse }) {
  if (course.thumbnailUrl) {
    return (
      <Image
        src={course.thumbnailUrl}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition duration-300 group-hover:scale-[1.03]"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
        <PlayGlyph />
      </span>
    </div>
  );
}

export function LearningLibrary({ courses }: { courses: LearningCourse[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (tab === 'in-progress' && !(course.progressPct > 0 && course.progressPct < 100)) return false;
      if (tab === 'completed' && course.progressPct < 100 && course.status !== 'completed') return false;
      if (!needle) return true;
      return (
        course.title.toLowerCase().includes(needle) ||
        (course.authorName ?? '').toLowerCase().includes(needle)
      );
    });
  }, [courses, query, tab]);

  return (
    <div>
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My learning</h1>
            <p className="mt-1 text-sm text-slate-500">Pick up where you left off.</p>
          </div>
          <label className="relative w-full sm:max-w-xs">
            <span className="sr-only">Search your courses</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your courses"
              className="h-10 w-full rounded-full border border-slate-300 bg-white px-4 text-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2"
            />
          </label>
        </div>

        <div role="tablist" aria-label="Course filters" className="mt-5 flex gap-6">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'relative pb-3 text-sm font-semibold transition',
                tab === item.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {item.label}
              {tab === item.id ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-slate-900" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold text-slate-900">No courses to show</p>
          <p className="mt-1 text-sm text-slate-500">
            {courses.length === 0
              ? 'Enroll in a course to start building your learning library.'
              : 'Try another filter or search term.'}
          </p>
          {courses.length === 0 ? (
            <Link
              href="/courses"
              className="mt-5 inline-flex min-h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Browse courses
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => {
            const pct = Math.min(Math.max(course.progressPct, 0), 100);
            const cta = pct >= 100 ? 'Review course' : pct > 0 ? 'Continue learning' : 'Start course';
            return (
              <Link
                key={course.id}
                href={`/dashboard/my-learning/${course.courseId}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  <CourseCover course={course} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900">
                      <PlayGlyph />
                      {cta}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="line-clamp-2 min-h-10 text-sm font-bold leading-snug text-slate-900">
                    {course.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{course.authorName ?? 'Instructor'}</p>
                  <div className="mt-auto pt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500">
                      <span>
                        {course.completedLessons} / {course.totalLessons || course.completedLessons} lectures
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={cn('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : 'bg-violet-600')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-violet-700">{cta}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
