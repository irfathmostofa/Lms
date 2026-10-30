'use client';

import { useMemo, useState } from 'react';
import { useLocale } from '@/components/i18n/locale-provider';
import { translate } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface CurriculumLesson {
  id: string;
  section_id: string;
  title: string;
  type: string;
  duration_min: number | null;
  is_preview: boolean;
}

export interface CurriculumSection {
  id: string;
  title: string;
  summary: string | null;
}

function formatMinutes(min: number) {
  if (min <= 0) return '';
  if (min < 60) return `${min}min`;
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return minutes ? `${hours}hr ${minutes}min` : `${hours}hr`;
}

function LessonIcon({ type }: { type: string }) {
  if (type === 'youtube') {
    return (
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-slate-500" fill="currentColor">
        <path d="M4 3.2v9.6L13.2 8 4 3.2z" />
      </svg>
    );
  }
  if (type === 'pdf' || type === 'text') {
    return (
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-slate-500" fill="none">
        <rect x="3.5" y="2.5" width="9" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-slate-500" fill="none">
      <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5.5v3l2 1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={cn('h-3.5 w-3.5 shrink-0 text-slate-500 transition', open && 'rotate-180')}
      fill="none"
    >
      <path d="M3.5 6.2 8 10.5l4.5-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CourseCurriculum({
  sections,
  outline,
}: {
  sections: CurriculumSection[];
  outline: CurriculumLesson[];
}) {
  const { t, dict } = useLocale();
  const [openIds, setOpenIds] = useState<string[]>(() => sections.slice(0, 1).map((section) => section.id));

  const totalMin = useMemo(
    () => outline.reduce((sum, lesson) => sum + (lesson.duration_min ?? 0), 0),
    [outline],
  );
  const allOpen = sections.length > 0 && sections.every((section) => openIds.includes(section.id));

  const toggleAll = () => {
    setOpenIds(allOpen ? [] : sections.map((section) => section.id));
  };

  const toggle = (id: string) => {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold text-slate-900">{t('detail.content')}</h2>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <p>
          {translate(dict, 'detail.sectionsCount', { count: sections.length })}
          <span className="mx-1.5 text-slate-300">·</span>
          {translate(dict, 'detail.lecturesCount', { count: outline.length })}
          {totalMin > 0 ? (
            <>
              <span className="mx-1.5 text-slate-300">·</span>
              {translate(dict, 'detail.totalLength', { duration: formatMinutes(totalMin) })}
            </>
          ) : null}
        </p>
        {sections.length > 1 ? (
          <button
            type="button"
            onClick={toggleAll}
            className="font-bold text-brand-700 hover:underline"
          >
            {allOpen ? t('detail.collapseAll') : t('detail.expandAll')}
          </button>
        ) : null}
      </div>

      <div className="course-accordion mt-3 overflow-hidden border border-slate-200 bg-white">
        {sections.map((section) => {
          const lessons = outline.filter((lesson) => lesson.section_id === section.id);
          const sectionMin = lessons.reduce((sum, lesson) => sum + (lesson.duration_min ?? 0), 0);
          const open = openIds.includes(section.id);
          return (
            <div key={section.id} className="border-b border-slate-200 last:border-b-0">
              <button
                type="button"
                onClick={() => toggle(section.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 bg-slate-50 px-4 py-3.5 text-left hover:bg-slate-100 sm:px-5"
              >
                <Chevron open={open} />
                <span className="min-w-0 flex-1 font-bold text-slate-900">{section.title}</span>
                <span className="hidden shrink-0 text-sm text-slate-500 sm:inline">
                  {section.summary ??
                    `${translate(dict, 'detail.lectures', { count: lessons.length })}${
                      sectionMin ? ` · ${formatMinutes(sectionMin)}` : ''
                    }`}
                </span>
              </button>
              {open ? (
                <ul className="divide-y divide-slate-100 bg-white">
                  {lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 text-sm sm:px-5 sm:pl-12">
                      <LessonIcon type={lesson.type} />
                      <span className="min-w-0 flex-1 text-slate-700">{lesson.title}</span>
                      <span className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                        {lesson.is_preview ? (
                          <span className="font-semibold text-brand-700">{t('detail.preview')}</span>
                        ) : null}
                        {lesson.duration_min ? <span>{formatMinutes(lesson.duration_min)}</span> : null}
                      </span>
                    </li>
                  ))}
                  {lessons.length === 0 ? (
                    <li className="px-5 py-3 text-xs text-slate-400">{t('detail.noLessons')}</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
