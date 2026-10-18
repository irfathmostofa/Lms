import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabaseEnv } from '@/lib/env';
import { unlockCourseAction } from '@/actions/courses';
import { Badge, ButtonLink, Card, CardBody, CardHeader, Field, Input } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { LazyYouTube } from '@/components/dashboard/lazy-youtube';
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
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function PointList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm text-slate-600">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
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
  const data = await loadCourse(params.slug);
  if (!data) notFound();

  const { course, sections, outline, category } = data;
  if (course.visibility === 'private') notFound();

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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/courses" className="text-sm text-brand-600 hover:underline">
        Back to courses
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">{course.mode}</Badge>
            {category ? <Badge>{category.name}</Badge> : null}
            {course.level ? <Badge tone="violet">{course.level}</Badge> : null}
            {course.visibility === 'password' ? <Badge tone="amber">Password</Badge> : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{course.title}</h1>
          <p className="mt-3 text-base text-slate-600">{course.summary}</p>
          {course.author_name ? (
            <p className="mt-2 text-sm text-slate-500">By {course.author_name}</p>
          ) : null}
          {course.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {course.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}

          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No preview image
              </div>
            )}
          </div>

          {videoId ? (
            <div className="mt-4">
              <LazyYouTube videoId={videoId} title={`${course.title} intro video`} />
            </div>
          ) : null}

          {course.description ? (
            <InfoSection title="About this course">
              {looksLikeHtml(course.description) ? (
                <div
                  className="rich-text mt-2"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              ) : (
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {course.description}
                </p>
              )}
            </InfoSection>
          ) : null}

          {!locked && outcomes.length > 0 ? (
            <InfoSection title="What will I learn?">
              <PointList items={outcomes} />
            </InfoSection>
          ) : null}

          {!locked && course.target_audience ? (
            <InfoSection title="Target audience">
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                {course.target_audience}
              </p>
            </InfoSection>
          ) : null}

          {!locked && materials.length > 0 ? (
            <InfoSection title="Materials included">
              <PointList items={materials} />
            </InfoSection>
          ) : null}

          {!locked && requirements.length > 0 ? (
            <InfoSection title="Requirements / instructions">
              <PointList items={requirements} />
            </InfoSection>
          ) : null}

          <InfoSection title="Curriculum">
            {locked ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">This curriculum is locked</p>
                <p className="mt-1 text-xs text-slate-500">
                  Enter the course password in the sidebar to view the topics and lessons.
                </p>
              </div>
            ) : sections.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Curriculum will be published soon.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {sections.map((section) => {
                  const lessons = outline.filter((l) => l.section_id === section.id);
                  return (
                    <Card key={section.id}>
                      <CardHeader
                        title={section.title}
                        description={section.summary ?? `${lessons.length} lessons`}
                      />
                      <CardBody className="p-0">
                        <ul className="divide-y divide-slate-100">
                          {lessons.map((lesson) => (
                            <li
                              key={lesson.id}
                              className="flex items-center justify-between px-5 py-2.5 text-sm"
                            >
                              <span className="text-slate-700">{lesson.title}</span>
                              <span className="flex items-center gap-2 text-xs text-slate-400">
                                {lesson.is_preview ? <Badge tone="green">Preview</Badge> : null}
                                <span className="uppercase">{lesson.type}</span>
                                {lesson.duration_min ? <span>{lesson.duration_min}m</span> : null}
                              </span>
                            </li>
                          ))}
                          {lessons.length === 0 ? (
                            <li className="px-5 py-3 text-xs text-slate-400">
                              No lessons in this section yet.
                            </li>
                          ) : null}
                        </ul>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </InfoSection>
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {price > 0 ? formatCurrency(price) : 'Free'}
                </p>
                {course.discount_price ? (
                  <p className="text-sm text-slate-400 line-through">
                    {formatCurrency(course.price)}
                  </p>
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
                  {searchParams.locked ? (
                    <p className="text-xs text-red-600">That password is not correct.</p>
                  ) : null}
                  <SubmitButton className="w-full" pendingLabel="Checking...">
                    Unlock course
                  </SubmitButton>
                </form>
              ) : (
                <>
                  <ButtonLink
                    href={`/login?next=/courses/${course.slug}`}
                    size="lg"
                    className="w-full"
                  >
                    Sign in to enroll
                  </ButtonLink>
                  <p className="text-center text-xs text-slate-400">
                    Enrollment is managed by the admin after payment.
                  </p>
                </>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>
    </main>
  );
}
