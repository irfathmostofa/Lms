import { cache, type ReactNode } from 'react';
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
import { Field, Input } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { LazyYouTube } from '@/components/dashboard/lazy-youtube';
import { CourseEnrollPanel } from '@/components/courses/course-enroll-panel';
import { CourseCurriculum } from '@/components/courses/course-curriculum';
import { CourseShareButton } from '@/components/courses/course-share-button';
import { CourseShowMore } from '@/components/courses/course-show-more';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { courseAccessCookieName, verifyCourseAccess } from '@/lib/course-access';
import { looksLikeHtml } from '@/lib/rich-text';
import { formatCurrency, formatDate, splitList, youtubeIdFromInput } from '@/lib/utils';
import { getRequestDictionary } from '@/lib/locale';
import { lessonLabel, modeLabel, translate } from '@/lib/i18n';
import { getCatalogCourses, getPublishedCourseDetail, pickRelatedCourses } from '@/lib/home';
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
  const data = await getPublishedCourseDetail(slug);
  if (!data) return null;
  return {
    course: data.course as Course,
    sections: data.sections as SectionRow[],
    outline: data.outline as OutlineRow[],
    category: data.category,
  };
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await loadCourse(params.slug);
  if (!data) {
    const dict = getRequestDictionary();
    return { title: dict.detail.notFound };
  }
  return {
    title: data.course.title,
    description: data.course.summary ?? undefined,
  };
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-slate-800" fill="none">
      <path d="M3.2 8.2 6.4 11.4 12.8 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PointList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-snug text-slate-800">
          <CheckIcon />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function IncludeRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-800">
      <span className="mt-0.5 text-slate-700">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-lg" fill="none">
      <circle cx="24" cy="24" r="23" fill="white" />
      <path d="M19 15.5v17L33.5 24 19 15.5z" fill="#1c1d1f" />
    </svg>
  );
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { locked?: string };
}) {
  const [data, ctx, catalog] = await Promise.all([
    loadCourse(params.slug),
    getSessionContext(),
    getCatalogCourses() as Promise<Course[]>,
  ]);
  const dict = getRequestDictionary();
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
  const unlocked = course.visibility !== 'password' || verifyCourseAccess(course.id, token);
  const locked = !unlocked;

  const price = course.discount_price ?? course.price;
  const hasDiscount = Boolean(course.discount_price && course.price > price);
  const discountPercent = hasDiscount ? Math.round((1 - price / course.price) * 100) : 0;
  const videoId = youtubeIdFromInput(course.promo_video_id);
  const outcomes = splitList(course.learning_outcomes);
  const materials = splitList(course.materials_included);
  const requirements = splitList(course.requirements);
  const duration =
    course.duration_label ??
    (course.duration_hours ? dict.detail.hours.replace('{count}', String(course.duration_hours)) : null);
  const updatedAt = course.updated_at || course.published_at || course.created_at;
  const related = pickRelatedCourses(catalog, course.id, course.category_id, 4);
  const articleCount = outline.filter((lesson) => lesson.type === 'text' || lesson.type === 'pdf').length;
  const videoHours =
    course.duration_hours ??
    Math.round(outline.reduce((sum, lesson) => sum + (lesson.duration_min ?? 0), 0) / 60);

  const buyInner = (
    <>
      <div>
        <p className="flex items-end gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {price > 0 ? formatCurrency(price) : dict.detail.free}
          </span>
          {hasDiscount ? (
            <span className="pb-1 text-base text-slate-500 line-through">{formatCurrency(course.price)}</span>
          ) : null}
        </p>
        {hasDiscount ? (
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {translate(dict, 'course.save', { percent: discountPercent })}
          </p>
        ) : null}
      </div>
      {locked ? (
        <form action={unlockCourseAction} className="space-y-3">
          <input type="hidden" name="slug" value={course.slug} />
          <input type="hidden" name="course_id" value={course.id} />
          <Field label={dict.detail.password}>
            <Input name="password" type="password" required />
          </Field>
          {searchParams.locked ? <p className="text-xs text-red-600">{dict.detail.wrongPassword}</p> : null}
          <SubmitButton className="w-full rounded-none" pendingLabel={dict.detail.checking}>
            {dict.detail.unlock}
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
      <p className="text-center text-xs text-slate-500">{dict.detail.guarantee}</p>
      <ul className="space-y-2.5 border-t border-slate-200 pt-4">
        <li className="text-sm font-bold text-slate-900">{dict.detail.includes}</li>
        {duration || videoHours ? (
          <IncludeRow
            icon={
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 4.8v3.4l2.2 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            }
          >
            {videoHours
              ? translate(dict, 'detail.onDemandVideo', { hours: videoHours })
              : duration}
          </IncludeRow>
        ) : null}
        {articleCount > 0 ? (
          <IncludeRow
            icon={
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                <rect x="3.5" y="2.5" width="9" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            }
          >
            {translate(dict, 'detail.articles', { count: articleCount })}
          </IncludeRow>
        ) : (
          <IncludeRow
            icon={
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                <rect x="3.5" y="2.5" width="9" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M6 6h4M6 8.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            }
          >
            {lessonLabel(dict, course.total_lessons)}
          </IncludeRow>
        )}
        <IncludeRow
          icon={
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <rect x="2.5" y="3.5" width="11" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6.5 3.5v-1h3v1" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          }
        >
          {dict.detail.fullLifetime}
        </IncludeRow>
        <IncludeRow
          icon={
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <rect x="4" y="2.5" width="8" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="8" cy="11.2" r="0.7" fill="currentColor" />
            </svg>
          }
        >
          {dict.detail.mobileAccess}
        </IncludeRow>
        <IncludeRow
          icon={
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <rect x="2.5" y="3" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <path d="M5.5 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          }
        >
          {dict.detail.certificate}
        </IncludeRow>
        {course.mode !== 'online' ? (
          <IncludeRow
            icon={
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                <path d="M2.5 12.5 8 4.5l5.5 8H2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            }
          >
            {dict.detail.offlineBatch}
          </IncludeRow>
        ) : null}
      </ul>
      <div className="flex justify-center border-t border-slate-200 pt-3">
        <CourseShareButton />
      </div>
    </>
  );

  const previewMedia = videoId ? (
    <div className="overflow-hidden bg-black">
      <LazyYouTube
        videoId={videoId}
        title={dict.detail.introVideo.replace('{title}', course.title)}
        watermark={ctx?.email ?? ctx?.profile?.email ?? ''}
      />
    </div>
  ) : (
    <div className="relative aspect-video bg-slate-900">
      {course.thumbnail_url ? (
        <Image
          src={course.thumbnail_url}
          alt={course.title}
          fill
          sizes="(max-width: 1024px) 100vw, 360px"
          className="object-cover"
          priority
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">{dict.detail.noPreview}</div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25 text-white">
        <PlayIcon />
        <span className="text-sm font-bold">{dict.detail.previewCourse}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <section className="bg-[#1c1d1f] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-10">
          <div className="min-w-0 lg:pr-6">
            <nav className="flex flex-wrap items-center gap-1 text-xs font-bold text-[#cec0fc]">
              <Link href="/courses" className="hover:underline">
                {dict.detail.allCourses}
              </Link>
              {category ? (
                <>
                  <span className="text-slate-500">&gt;</span>
                  <span>{category.name}</span>
                </>
              ) : null}
            </nav>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-[2rem]">
              {course.title}
            </h1>
            {course.summary ? (
              <p className="mt-3 text-base leading-relaxed text-slate-200 sm:text-lg">{course.summary}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              {course.is_featured ? (
                <span className="bg-[#eceb98] px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-[#3d3c0a]">
                  {dict.detail.bestsellerBadge}
                </span>
              ) : null}
              <span className="font-bold text-slate-200">{modeLabel(dict, course.mode)}</span>
              {course.level ? <span className="text-slate-300">{course.level}</span> : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
              {course.author_name ? (
                <span>
                  {dict.detail.createdBy}{' '}
                  <span className="font-bold text-[#cec0fc] underline-offset-2">{course.author_name}</span>
                </span>
              ) : null}
              {updatedAt ? (
                <span>
                  {dict.detail.updated} {formatDate(updatedAt)}
                </span>
              ) : null}
              {course.language ? (
                <span>
                  {dict.detail.language}: {course.language}
                </span>
              ) : null}
            </div>
            {course.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="sr-only">{dict.detail.relatedTopics}</span>
                {course.tags.map((tag) => (
                  <span key={tag} className="border border-white/20 px-2 py-0.5 text-xs font-medium text-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="hidden lg:block" />
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-8">
        <div className="min-w-0 lg:pr-6">
          <div className="lg:hidden">
            <div className="overflow-hidden border border-slate-200 bg-white shadow-xl">
              {previewMedia}
              <div className="space-y-4 p-4">{buyInner}</div>
            </div>
          </div>

          {!locked && outcomes.length > 0 ? (
            <section className="mt-8 border border-slate-200 p-5 sm:p-6">
              <h2 className="text-2xl font-bold text-slate-900">{dict.detail.learn}</h2>
              <PointList items={outcomes.slice(0, 8)} />
            </section>
          ) : null}

          {locked ? (
            <div className="mt-8 border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-800">{dict.detail.lockedTitle}</p>
              <p className="mt-1 text-sm text-slate-500">{dict.detail.lockedBody}</p>
            </div>
          ) : sections.length === 0 ? (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-slate-900">{dict.detail.content}</h2>
              <p className="mt-3 text-sm text-slate-500">{dict.detail.comingSoon}</p>
            </section>
          ) : (
            <CourseCurriculum sections={sections} outline={outline} />
          )}

          {requirements.length > 0 && !locked ? (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-slate-900">{dict.detail.requirements}</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                {requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {course.description ? (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-slate-900">{dict.detail.description}</h2>
              <div className="mt-3">
                <CourseShowMore>
                  {looksLikeHtml(course.description) ? (
                    <div className="rich-text rich-text-udemy" dangerouslySetInnerHTML={{ __html: course.description }} />
                  ) : (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{course.description}</p>
                  )}
                </CourseShowMore>
              </div>
            </section>
          ) : null}

          {!locked && course.target_audience ? (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-slate-900">{dict.detail.audience}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">{course.target_audience}</p>
            </section>
          ) : null}

          {!locked && materials.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-slate-900">{dict.detail.includes}</h2>
              <ul className="mt-3 space-y-2">
                {materials.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-slate-800">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {course.author_name ? (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-slate-900">{dict.detail.instructor}</h2>
              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xl font-bold text-white">
                  {course.author_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-brand-700">{course.author_name}</p>
                  <p className="mt-1 text-sm text-slate-500">{lessonLabel(dict, course.total_lessons)}</p>
                  {videoHours ? (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {translate(dict, 'detail.onDemandVideo', { hours: videoHours })}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-slate-900">{dict.detail.studentsAlsoBought}</h2>
              <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
                {related.map((item) => {
                  const relatedPrice = Number(item.discount_price ?? item.price);
                  const relatedOriginal = Number(item.price);
                  const relatedDiscount = Boolean(item.discount_price && relatedOriginal > relatedPrice);
                  return (
                    <Link
                      key={item.id}
                      href={`/courses/${item.slug}`}
                      className="flex gap-4 py-4 hover:bg-slate-50"
                    >
                      <div className="relative h-16 w-28 shrink-0 overflow-hidden bg-slate-200 sm:h-20 sm:w-36">
                        {item.thumbnail_url ? (
                          <Image
                            src={item.thumbnail_url}
                            alt={item.title}
                            fill
                            sizes="144px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-slate-800 text-xs text-white">
                            {item.title.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold text-slate-900">{item.title}</p>
                        {item.author_name ? <p className="mt-0.5 text-xs text-slate-500">{item.author_name}</p> : null}
                        <p className="mt-1 text-xs text-slate-500">{lessonLabel(dict, item.total_lessons)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold text-slate-900">
                          {relatedPrice > 0 ? formatCurrency(relatedPrice) : dict.detail.free}
                        </p>
                        {relatedDiscount ? (
                          <p className="text-xs text-slate-400 line-through">{formatCurrency(relatedOriginal)}</p>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="relative hidden lg:block">
          <div className="sticky top-24 -mt-[220px]">
            <div className="overflow-hidden bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.08)]">
              {previewMedia}
              <div className="space-y-4 p-5">{buyInner}</div>
            </div>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
