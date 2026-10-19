'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { SecureYouTubePlayer } from '@/components/dashboard/secure-youtube-player';
import { looksLikeHtml } from '@/lib/rich-text';
import { cn } from '@/lib/utils';
import type { Course, CourseSection, Lesson } from '@/lib/types';

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className ?? 'h-4 w-4'} fill="currentColor">
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronGlyph({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn('h-4 w-4 transition', open ? 'rotate-180' : '')}
      fill="none"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function lessonMeta(lesson: Lesson) {
  if (lesson.type === 'youtube') return lesson.duration_min ? `${lesson.duration_min} min` : 'Video';
  if (lesson.type === 'pdf') return 'PDF';
  if (lesson.type === 'image') return 'Image';
  return 'Lecture';
}

export function CourseClassroom({
  course,
  sections,
  lessons,
  activeLesson,
  completedIds,
  watermark,
  completeAction,
}: {
  course: Course;
  sections: CourseSection[];
  lessons: Lesson[];
  activeLesson: Lesson | null;
  completedIds: string[];
  watermark: string;
  completeAction: (formData: FormData) => void;
}) {
  const completed = useMemo(() => new Set(completedIds), [completedIds]);
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const first = activeLesson?.section_id ?? sections[0]?.id;
    if (first) initial.add(first);
    return initial;
  });

  const completedCount = completed.size;
  const pct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const activeIndex = activeLesson ? lessons.findIndex((lesson) => lesson.id === activeLesson.id) : -1;
  const previous = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const next = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  const grouped = sections.map((section) => ({
    section,
    lessons: lessons.filter((lesson) => lesson.section_id === section.id),
  }));

  const toggleSection = (id: string) => {
    setOpenSections((current) => {
      const nextOpen = new Set(current);
      if (nextOpen.has(id)) nextOpen.delete(id);
      else nextOpen.add(id);
      return nextOpen;
    });
  };

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-4rem)] bg-white sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8">
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-800 bg-[#1c1d1f] px-4 py-2 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/my-learning"
            className="shrink-0 text-xs font-medium text-white/70 hover:text-white"
          >
            My learning
          </Link>
          <span className="hidden text-white/30 sm:inline">/</span>
          <h1 className="truncate text-sm font-semibold">{course.title}</h1>
        </div>
        <p className="hidden shrink-0 text-xs text-white/70 sm:block">
          {completedCount} of {lessons.length} complete · {pct}%
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="min-w-0 bg-black">
          {activeLesson ? (
            <>
              {activeLesson.type === 'youtube' && activeLesson.youtube_id ? (
                <div className="aspect-video w-full">
                  <SecureYouTubePlayer
                    key={activeLesson.id}
                    videoId={activeLesson.youtube_id}
                    title={activeLesson.title}
                    watermark={watermark}
                    fill
                  />
                </div>
              ) : activeLesson.type === 'image' && activeLesson.media_url ? (
                <div className="relative aspect-video w-full bg-black">
                  <Image
                    src={activeLesson.media_url}
                    alt={activeLesson.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-slate-950 px-6 text-center">
                  <div>
                    <p className="text-lg font-semibold text-white">{activeLesson.title}</p>
                    <p className="mt-2 text-sm text-white/60">
                      {activeLesson.type === 'pdf' ? 'Open the PDF below to continue this lecture.' : 'This lecture is text-based. Scroll down to read it.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-slate-950 text-sm text-white/70">
              This course has no lectures yet.
            </div>
          )}
        </section>

        <aside className="flex max-h-[70vh] flex-col border-t border-slate-200 bg-white lg:max-h-[calc(100vh-4rem)] lg:border-l lg:border-t-0">
          <div className="border-b border-slate-200 px-4 py-4">
            <p className="text-sm font-bold text-slate-900">Course content</p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span>
                  {completedCount} / {lessons.length} lectures
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-violet-600" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {grouped.map(({ section, lessons: sectionLessons }) => {
              const open = openSections.has(section.id);
              const done = sectionLessons.filter((lesson) => completed.has(lesson.id)).length;
              return (
                <div key={section.id} className="border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-start justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
                    aria-expanded={open}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{section.title}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {done} / {sectionLessons.length} · {sectionLessons.length} lectures
                      </span>
                    </span>
                    <ChevronGlyph open={open} />
                  </button>
                  {open ? (
                    <ul>
                      {sectionLessons.map((lesson) => {
                        const isActive = activeLesson?.id === lesson.id;
                        const isDone = completed.has(lesson.id);
                        return (
                          <li key={lesson.id}>
                            <Link
                              href={`/dashboard/my-learning/${course.id}?lesson=${lesson.id}`}
                              className={cn(
                                'flex items-start gap-3 px-4 py-2.5 text-sm',
                                isActive ? 'bg-violet-50 text-violet-900' : 'text-slate-700 hover:bg-slate-50',
                              )}
                            >
                              <span
                                className={cn(
                                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                                  isDone
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : isActive
                                      ? 'border-violet-500 text-violet-600'
                                      : 'border-slate-300 text-slate-400',
                                )}
                              >
                                {isDone ? <CheckGlyph /> : <PlayGlyph className="h-3 w-3" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block leading-snug">{lesson.title}</span>
                                <span className="mt-0.5 block text-[11px] text-slate-500">{lessonMeta(lesson)}</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {activeLesson ? (
        <div className="border-t border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Lecture {activeIndex + 1} of {lessons.length}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{activeLesson.title}</h2>
              </div>
              <form action={completeAction}>
                <input type="hidden" name="lesson_id" value={activeLesson.id} />
                <input type="hidden" name="course_id" value={course.id} />
                <input type="hidden" name="completed" value={String(completed.has(activeLesson.id))} />
                <Button type="submit" variant={completed.has(activeLesson.id) ? 'outline' : 'success'} size="sm">
                  {completed.has(activeLesson.id) ? 'Mark as incomplete' : 'Mark as complete'}
                </Button>
              </form>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {previous ? (
                <Link
                  href={`/dashboard/my-learning/${course.id}?lesson=${previous.id}`}
                  className="inline-flex min-h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Previous lecture
                </Link>
              ) : null}
              {next ? (
                <Link
                  href={`/dashboard/my-learning/${course.id}?lesson=${next.id}`}
                  className="inline-flex min-h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Next lecture
                </Link>
              ) : null}
              {activeLesson.type === 'pdf' && activeLesson.media_url ? (
                <a
                  href={activeLesson.media_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Open PDF
                </a>
              ) : null}
            </div>

            {activeLesson.content ? (
              looksLikeHtml(activeLesson.content) ? (
                <div className="rich-text mt-6" dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
              ) : (
                <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {activeLesson.content}
                </p>
              )
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
