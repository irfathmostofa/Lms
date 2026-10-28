'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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

function ListGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const completedCount = completed.size;
  const pct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const activeIndex = activeLesson ? lessons.findIndex((lesson) => lesson.id === activeLesson.id) : -1;
  const previous = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const next = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  const grouped = sections.map((section) => ({
    section,
    lessons: lessons.filter((lesson) => lesson.section_id === section.id),
  }));

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeLesson?.id]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSidebarOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sidebarOpen]);

  const toggleSection = (id: string) => {
    setOpenSections((current) => {
      const nextOpen = new Set(current);
      if (nextOpen.has(id)) nextOpen.delete(id);
      else nextOpen.add(id);
      return nextOpen;
    });
  };

  const curriculum = (
    <div className="flex h-full min-h-0 flex-col bg-[#1c1d1f] text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-bold">Course content</p>
          <p className="mt-0.5 text-[11px] text-white/55">
            {completedCount} / {lessons.length} lectures · {pct}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close course content"
        >
          <CloseGlyph />
        </button>
      </div>
      <div className="px-4 py-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {grouped.map(({ section, lessons: sectionLessons }) => {
          const open = openSections.has(section.id);
          const done = sectionLessons.filter((lesson) => completed.has(lesson.id)).length;
          return (
            <div key={section.id} className="border-b border-white/10">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-white/5"
                aria-expanded={open}
              >
                <span>
                  <span className="block text-sm font-semibold">{section.title}</span>
                  <span className="mt-0.5 block text-[11px] text-white/50">
                    {done} / {sectionLessons.length} lectures
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
                            isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                              isDone
                                ? 'border-emerald-400 bg-emerald-500 text-white'
                                : isActive
                                  ? 'border-violet-400 text-violet-300'
                                  : 'border-white/25 text-white/50',
                            )}
                          >
                            {isDone ? <CheckGlyph /> : <PlayGlyph className="h-3 w-3" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block leading-snug">{lesson.title}</span>
                            <span className="mt-0.5 block text-[11px] text-white/45">{lessonMeta(lesson)}</span>
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
    </div>
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black text-white">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#1c1d1f] px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/my-learning"
            className="shrink-0 text-xs font-medium text-white/70 hover:text-white"
          >
            Exit
          </Link>
          <span className="hidden text-white/25 sm:inline">/</span>
          <h1 className="truncate text-sm font-semibold">{course.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="hidden text-xs text-white/60 sm:block">
            {completedCount} of {lessons.length} · {pct}%
          </p>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-white/80 hover:bg-white/10 lg:hidden"
          >
            <ListGlyph />
            Content
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="flex min-h-0 min-w-0 flex-col bg-black">
          <div className="relative min-h-0 flex-1 bg-black">
            {activeLesson ? (
              activeLesson.type === 'youtube' && activeLesson.youtube_id ? (
                <div className="absolute inset-0">
                  <SecureYouTubePlayer
                    key={activeLesson.id}
                    videoId={activeLesson.youtube_id}
                    title={activeLesson.title}
                    watermark={watermark}
                    fill
                  />
                </div>
              ) : activeLesson.type === 'image' && activeLesson.media_url ? (
                <div
                  className="absolute inset-0 select-none"
                  onContextMenu={(event) => event.preventDefault()}
                  onDragStart={(event) => event.preventDefault()}
                >
                  <Image
                    src={activeLesson.media_url}
                    alt={activeLesson.title}
                    fill
                    sizes="100vw"
                    draggable={false}
                    className="pointer-events-none object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <div>
                    <p className="text-lg font-semibold">{activeLesson.title}</p>
                    <p className="mt-2 text-sm text-white/60">
                      {activeLesson.type === 'pdf'
                        ? 'Open the PDF from the lecture bar to continue.'
                        : 'This lecture is text-based. Open notes below to read it.'}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/70">
                This course has no lectures yet.
              </div>
            )}
          </div>

          {activeLesson ? (
            <div className="shrink-0 border-t border-white/10 bg-[#1c1d1f]">
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                    Lecture {activeIndex + 1} of {lessons.length}
                  </p>
                  <h2 className="truncate text-sm font-semibold sm:text-base">{activeLesson.title}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {previous ? (
                    <Link
                      href={`/dashboard/my-learning/${course.id}?lesson=${previous.id}`}
                      className="inline-flex min-h-9 items-center rounded-md border border-white/15 px-3 text-xs font-medium text-white/85 hover:bg-white/10"
                    >
                      Previous
                    </Link>
                  ) : null}
                  {next ? (
                    <Link
                      href={`/dashboard/my-learning/${course.id}?lesson=${next.id}`}
                      className="inline-flex min-h-9 items-center rounded-md bg-white px-3 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                    >
                      Next
                    </Link>
                  ) : null}
                  {activeLesson.type === 'pdf' && activeLesson.media_url ? (
                    <a
                      href={activeLesson.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 items-center rounded-md border border-white/15 px-3 text-xs font-medium text-white/85 hover:bg-white/10"
                    >
                      Open PDF
                    </a>
                  ) : null}
                  <form action={completeAction}>
                    <input type="hidden" name="lesson_id" value={activeLesson.id} />
                    <input type="hidden" name="course_id" value={course.id} />
                    <input type="hidden" name="completed" value={String(completed.has(activeLesson.id))} />
                    <Button
                      type="submit"
                      variant={completed.has(activeLesson.id) ? 'outline' : 'success'}
                      size="sm"
                    >
                      {completed.has(activeLesson.id) ? 'Completed' : 'Complete'}
                    </Button>
                  </form>
                  {activeLesson.content ? (
                    <button
                      type="button"
                      onClick={() => setNotesOpen((current) => !current)}
                      className="inline-flex min-h-9 items-center rounded-md px-3 text-xs font-medium text-white/75 hover:bg-white/10"
                      aria-expanded={notesOpen}
                    >
                      {notesOpen ? 'Hide notes' : 'Notes'}
                    </button>
                  ) : null}
                </div>
              </div>
              {notesOpen && activeLesson.content ? (
                <div className="max-h-[32vh] overflow-y-auto border-t border-white/10 bg-[#111] px-4 py-4 sm:px-6">
                  {looksLikeHtml(activeLesson.content) ? (
                    <div className="rich-text prose-invert" dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                  ) : (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">
                      {activeLesson.content}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="hidden min-h-0 lg:block">{curriculum}</aside>
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 w-[min(92vw,24rem)] shadow-2xl">{curriculum}</div>
        </div>
      ) : null}
    </div>
  );
}
