import Image from 'next/image';
import Link from 'next/link';
import type { HomeCourse } from '@/lib/home';
import { formatCurrency } from '@/lib/utils';

const gradients = [
  'from-brand-500 via-brand-700 to-slate-950',
  'from-violet-500 via-violet-700 to-slate-950',
  'from-emerald-500 via-emerald-700 to-slate-950',
  'from-amber-500 via-orange-600 to-slate-950',
  'from-sky-500 via-cyan-700 to-slate-950',
  'from-rose-500 via-pink-700 to-slate-950',
];

function gradientFor(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash + value.charCodeAt(index)) % gradients.length;
  }
  return gradients[hash];
}

const modeTone: Record<string, string> = {
  online: 'bg-brand-50 text-brand-700 ring-brand-100',
  offline: 'bg-amber-50 text-amber-700 ring-amber-100',
  hybrid: 'bg-violet-50 text-violet-700 ring-violet-100',
};

function BookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none">
      <path
        d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15zM4 20.5V21h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 7h8M8 11h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function HomeCourseCard({ course }: { course: HomeCourse }) {
  const price = Number(course.discount_price ?? course.price ?? 0);
  const original = Number(course.price ?? 0);
  const hasDiscount = Boolean(course.discount_price && original > Number(course.discount_price));
  const duration =
    course.duration_label ??
    (course.duration_hours ? `${course.duration_hours} hours` : null);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(
              course.id,
            )}`}
          >
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px]" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/25 backdrop-blur">
              <BookIcon />
            </span>
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${
              modeTone[course.mode] ?? 'bg-white text-slate-700 ring-slate-200'
            }`}
          >
            {course.mode}
          </span>
          {course.is_featured ? (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-inset ring-slate-200">
              Featured
            </span>
          ) : null}
        </div>
        {hasDiscount ? (
          <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
            Save {Math.round(((original - Number(course.discount_price)) / original) * 100)}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {course.level ? <span>{course.level}</span> : null}
          {course.level && duration ? <span aria-hidden="true">-</span> : null}
          {duration ? <span>{duration}</span> : null}
        </div>
        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {course.summary ?? 'Structured lessons and practical projects with lifetime access.'}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-lg font-bold text-slate-900">
              {price > 0 ? formatCurrency(price) : 'Free'}
            </p>
            {hasDiscount ? (
              <p className="text-xs text-slate-400 line-through">{formatCurrency(original)}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {course.total_lessons} lesson{course.total_lessons === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </Link>
  );
}
