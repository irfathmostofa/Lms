import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { toggleLessonProgressAction } from '@/actions/student';
import { Badge, Button, Card, CardBody, CardHeader } from '@/components/ui';
import { LazyYouTube } from '@/components/dashboard/lazy-youtube';
import type { Course, CourseSection, Lesson } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { lesson?: string };
}) {
  const ctx = await requireUser();
  const supabase = createClient();

  const [courseRes, enrollmentRes] = await Promise.all([
    supabase.from('courses').select('*').eq('id', params.courseId).maybeSingle(),
    supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', ctx.userId)
      .eq('course_id', params.courseId)
      .maybeSingle(),
  ]);

  const course = courseRes.data as Course | null;
  const enrollment = enrollmentRes.data as { id: string; status: string } | null;
  if (!course || !enrollment) notFound();

  const [sectionsRes, lessonsRes, progressRes] = await Promise.all([
    supabase.from('course_sections').select('*').eq('course_id', course.id).order('sort_order'),
    supabase.from('lessons').select('*').eq('course_id', course.id).order('sort_order'),
    supabase
      .from('lesson_progress')
      .select('lesson_id, is_completed')
      .eq('student_id', ctx.userId)
      .eq('course_id', course.id),
  ]);

  const sections = (sectionsRes.data as CourseSection[]) ?? [];
  const lessons = (lessonsRes.data as Lesson[]) ?? [];
  const progress = (progressRes.data as { lesson_id: string; is_completed: boolean }[]) ?? [];
  const completed = new Set(progress.filter((row) => row.is_completed).map((row) => row.lesson_id));

  const activeLesson =
    lessons.find((lesson) => lesson.id === searchParams.lesson) ?? lessons[0] ?? null;

  const completedCount = completed.size;
  const pct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/my-learning" className="text-sm text-brand-600 hover:underline">
          Back to my learning
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{course.title}</h1>
          <Badge tone={enrollment.status === 'active' ? 'green' : 'amber'}>
            {enrollment.status}
          </Badge>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>
              {completedCount} of {lessons.length} lessons complete
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          {activeLesson ? (
            <Card>
              <CardHeader
                title={activeLesson.title}
                description={activeLesson.type.toUpperCase()}
                action={
                  completed.has(activeLesson.id) ? (
                    <Badge tone="green">Completed</Badge>
                  ) : (
                    <Badge tone="amber">In progress</Badge>
                  )
                }
              />
              <CardBody className="space-y-4">
                {activeLesson.type === 'youtube' && activeLesson.youtube_id ? (
                  <LazyYouTube videoId={activeLesson.youtube_id} title={activeLesson.title} />
                ) : null}

                {activeLesson.type === 'image' && activeLesson.media_url ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={activeLesson.media_url}
                      alt={activeLesson.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-contain"
                    />
                  </div>
                ) : null}

                {activeLesson.type === 'pdf' && activeLesson.media_url ? (
                  <a
                    href={activeLesson.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-medium text-brand-600 hover:underline"
                  >
                    Open PDF
                  </a>
                ) : null}

                {activeLesson.content ? (
                  <p className="whitespace-pre-line text-sm text-slate-700">{activeLesson.content}</p>
                ) : null}

                <form action={toggleLessonProgressAction}>
                  <input type="hidden" name="lesson_id" value={activeLesson.id} />
                  <input type="hidden" name="course_id" value={course.id} />
                  <input
                    type="hidden"
                    name="completed"
                    value={String(completed.has(activeLesson.id))}
                  />
                  <Button type="submit" variant={completed.has(activeLesson.id) ? 'outline' : 'success'}>
                    {completed.has(activeLesson.id) ? 'Mark as incomplete' : 'Mark as complete'}
                  </Button>
                </form>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <p className="text-sm text-slate-500">This course has no lessons yet.</p>
              </CardBody>
            </Card>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <CardHeader title="Curriculum" />
            <CardBody className="space-y-4 p-4">
              {sections.map((section) => {
                const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id);
                return (
                  <div key={section.id}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {section.title}
                    </p>
                    <ul className="space-y-1">
                      {sectionLessons.map((lesson) => {
                        const isActive = activeLesson?.id === lesson.id;
                        return (
                          <li key={lesson.id}>
                            <Link
                              href={`/dashboard/my-learning/${course.id}?lesson=${lesson.id}`}
                              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm ${
                                isActive
                                  ? 'bg-brand-50 text-brand-700'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate">{lesson.title}</span>
                              {completed.has(lesson.id) ? (
                                <span className="text-emerald-600">done</span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                      {sectionLessons.length === 0 ? (
                        <li className="px-2.5 py-1 text-xs text-slate-400">No lessons</li>
                      ) : null}
                    </ul>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
