import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { hasSupabaseEnv } from '@/lib/env';
import { unlockCourseAction } from '@/actions/courses';
import { Badge, Card, CardBody, Field, Input } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { LazyYouTube } from '@/components/dashboard/lazy-youtube';
import { CourseEnrollPanel } from '@/components/courses/course-enroll-panel';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { courseAccessCookieName, verifyCourseAccess } from '@/lib/course-access';
import { looksLikeHtml } from '@/lib/rich-text';
import { formatCurrency, splitList, youtubeIdFromInput } from '@/lib/utils';
import type { Course } from '@/lib/types';

export const revalidate = 300;

export async function generateStaticParams() {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('courses')
      .select('slug, visibility')
      .eq('status', 'published')
      .limit(100);
    return (data ?? [])
      .filter((row: { slug: string; visibility: string }) => row.visibility !== 'private')
      .map((row: { slug: string; visibility: string }) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

interface OutlineRow {
  id: string;
  section_id: string;
  title: string;
  type: string;
  duration_min: number | null;
  is_preview: boolean;
}

interface SectionRow {
  id: string;
  title: string;
  summary: string | null;
}

const loadCourse = cache(async function loadCourse(slug: string) {
  if (!hasSupabaseEnv()) return null;
  const supabase = createPublicClient();
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!course) return null;

  const [sectionsRes, outlineRes, categoryRes] = await Promise.all([
    supabase
      .from('course_sections')
      .select('id, title, summary')
      .eq('course_id', course.id)
      .order('sort_order'),
    supabase
      .from('public_lesson_outline')
      .select('id, section_id, title, type, duration_min, is_preview')
      .eq('course_id', course.id)
      .order('sort_order'),
    course.category_id
      ? supabase.from('categories').select('name, slug').eq('id', course.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    course: course as Course,
    sections: (sectionsRes.data as SectionRow[]) ?? [],
    outline: (outlineRes.data as OutlineRow[]) ?? [],
    category: (categoryRes.data as { name: string; slug: string } | null) ?? null,
  };
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await loadCourse(params.slug);
  if (!data) return { title: 'Course not found' };
  return {
    title: data.course.title,
    description: data.course.summary ?? undefined,
  };
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function PointList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm text-slate-700">
          <span aria-hidden="true" className="mt-0.5 text-emerald-600">
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { locked?: string };
}) {
  const [data, ctx] = await Promise.all([loadCourse(params.slug), getSessionContext()]);
  if (!data) notFound();

  const { course, sections, outline, category } = data;
  if (course.visibility === 'private') notFound();

  let enrollmentStatus: string | null = null;
  if (ctx) {
    const supabase = createClient();
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('status')
      .eq('student_id', ctx.userId)
      .eq('course_id', course.id)
      .maybeSingle();
    enrollmentStatus = (enrollment as { status: string } | null)?.status ?? null;
  }

  const token = cookies().get(courseAccessCookieName(course.id))?.value;
  const unlocked =
    course.visibility !== 'password' || verifyCourseAccess(course.id, token);
  const locked = !unlocked;

  const price = course.discount_price ?? course.price;
  const videoId = youtubeIdFromInput(course.promo_video_id);
  const outcomes = splitList(course.learning_outcomes);
  const materials = splitList(course.materials_included);
  const requirements = splitList(course.requirements);
  const duration =
    course.duration_label ??
    (course.duration_hours ? `${course.duration_hours} hours of content` : null);

  const buyBox = (
    <Card className="overflow-hidden shadow-xl">
      <div className="relative aspect-video bg-slate-900">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            sizes="360px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No preview</div>
        )}
      </div>
      <CardBody className="space-y-4">
        <div>
          <p className="text-3xl font-bold text-slate-900">{price > 0 ? formatCurrency(price) : 'Free'}</p>
          {course.discount_price ? (
            <p className="text-sm text-slate-400 line-through">{formatCurrency(course.price)}</p>
          ) : null}
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>{course.total_lessons} lessons</li>
          {duration ? <li>{duration}</li> : null}
          <li>Lifetime access after verification</li>
          {course.mode !== 'online' ? <li>Offline batch with attendance</li> : null}
        </ul>
        {locked ? (
          <form action={unlockCourseAction} className="space-y-3">
            <input type="hidden" name="slug" value={course.slug} />
            <input type="hidden" name="course_id" value={course.id} />
            <Field label="Course password">
              <Input name="password" type="password" required />
            </Field>
            {searchParams.locked ? <p className="text-xs text-red-600">That password is not correct.</p> : null}
            <SubmitButton className="w-full" pendingLabel="Checking...">
              Unlock course
            </SubmitButton>
          </form>
        ) : (
          <CourseEnrollPanel
            courseId={course.id}
            courseSlug={course.slug}
            price={price}
            isLoggedIn={Boolean(ctx)}
            role={ctx ? (ctx.profile?.role ?? 'student') : null}
            enrollmentStatus={enrollmentStatus}
          />
        )}
      </CardBody>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm text-brand-700">
              <Link href="/courses" className="hover:underline">
                All courses
              </Link>
              {category ? (
                <>
                  <span className="mx-2 text-slate-300">/</span>
                  <span className="text-slate-500">{category.name}</span>
                </>
              ) : null}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{course.title}</h1>
            {course.summary ? <p className="mt-3 text-base leading-relaxed text-slate-600">{course.summary}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
              {course.author_name ? (
                <span>
                  Created by <span className="font-semibold text-slate-800">{course.author_name}</span>
                </span>
              ) : null}
              <span>{course.total_lessons} lessons</span>
              {duration ? <span>{duration}</span> : null}
              <span className="capitalize">{course.mode}</span>
              {course.level ? <span>{course.level}</span> : null}
            </div>
            {course.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="hidden lg:block" />
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="lg:hidden">{buyBox}</div>
          {videoId ? (
            <div className="mt-6 overflow-hidden rounded-xl lg:mt-0">
              <LazyYouTube videoId={videoId} title={`${course.title} intro video`} />
            </div>
          ) : null}

          {!locked && outcomes.length > 0 ? (
            <InfoSection title="What you will learn">
              <PointList items={outcomes} />
            </InfoSection>
          ) : null}

          {course.description ? (
            <InfoSection title="Description">
              {looksLikeHtml(course.description) ? (
                <div className="rich-text mt-3" dangerouslySetInnerHTML={{ __html: course.description }} />
              ) : (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{course.description}</p>
              )}
            </InfoSection>
          ) : null}

          {!locked && course.target_audience ? (
            <InfoSection title="Who this course is for">
              <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{course.target_audience}</p>
            </InfoSection>
          ) : null}

          {!locked && materials.length > 0 ? (
            <InfoSection title="This course includes">
              <PointList items={materials} />
            </InfoSection>
          ) : null}

          {!locked && requirements.length > 0 ? (
            <InfoSection title="Requirements">
              <PointList items={requirements} />
            </InfoSection>
          ) : null}

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">Course content</h2>
            {locked ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">This curriculum is locked</p>
                <p className="mt-1 text-xs text-slate-500">Enter the course password to view the topics and lessons.</p>
              </div>
            ) : sections.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Curriculum will be published soon.</p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {sections.map((section) => {
                  const lessons = outline.filter((l) => l.section_id === section.id);
                  return (
                    <details key={section.id} className="border-b border-slate-200 last:border-b-0" open>
                      <summary className="cursor-pointer bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-900">
                        {section.title}
                        <span className="ml-2 font-normal text-slate-500">
                          {section.summary ?? `${lessons.length} lectures`}
                        </span>
                      </summary>
                      <ul className="divide-y divide-slate-100">
                        {lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                            <span className="text-slate-700">{lesson.title}</span>
                            <span className="flex items-center gap-2 text-xs text-slate-400">
                              {lesson.is_preview ? <Badge tone="green">Preview</Badge> : null}
                              <span className="uppercase">{lesson.type}</span>
                              {lesson.duration_min ? <span>{lesson.duration_min}m</span> : null}
                            </span>
                          </li>
                        ))}
                        {lessons.length === 0 ? (
                          <li className="px-5 py-3 text-xs text-slate-400">No lessons in this section yet.</li>
                        ) : null}
                      </ul>
                    </details>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">{buyBox}</aside>
      </main>
      <SiteFooter />
    </div>
  );
}
