import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabaseEnv } from '@/lib/env';
import { Badge, ButtonLink, Card, CardBody, CardHeader } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Course } from '@/lib/types';

export const revalidate = 300;

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

async function loadCourse(slug: string) {
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
}

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

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const data = await loadCourse(params.slug);
  if (!data) notFound();

  const { course, sections, outline, category } = data;
  const price = course.discount_price ?? course.price;

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
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{course.title}</h1>
          <p className="mt-3 text-base text-slate-600">{course.summary}</p>

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

          {course.description ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">About this course</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                {course.description}
              </p>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Curriculum</h2>
            {sections.length === 0 ? (
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
          </section>
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
                {course.duration_hours ? <li>{course.duration_hours} hours of content</li> : null}
                <li>Lifetime access after verification</li>
                {course.mode !== 'online' ? <li>Offline batch with attendance</li> : null}
              </ul>
              <ButtonLink href={`/login?next=/courses/${course.slug}`} size="lg" className="w-full">
                Sign in to enroll
              </ButtonLink>
              <p className="text-center text-xs text-slate-400">
                Enrollment is managed by the admin after payment.
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </main>
  );
}
