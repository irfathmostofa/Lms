import Image from 'next/image';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabaseEnv } from '@/lib/env';
import { Card, CardBody, EmptyState, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Course } from '@/lib/types';

export const revalidate = 300;

async function getCourses(): Promise<Course[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('courses')
      .select(
        'id, title, slug, summary, thumbnail_url, mode, price, discount_price, level, total_lessons, is_featured, visibility, tags, author_name',
      )
      .eq('status', 'published')
      .neq('visibility', 'private')
      .order('published_at', { ascending: false })
      .limit(24);
    return (data as Course[]) ?? [];
  } catch {
    return [];
  }
}

const modeTone: Record<string, 'blue' | 'violet' | 'amber'> = {
  online: 'blue',
  offline: 'amber',
  hybrid: 'violet',
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <Link href="/" className="text-sm text-brand-600 hover:underline">
          Back to home
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Courses</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse published courses. Sign in to enroll and access your lessons.
        </p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="No published courses yet"
          description={
            hasSupabaseEnv()
              ? 'Once an admin publishes a course it will appear here.'
              : 'Connect Supabase (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) to load courses.'
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const price = course.discount_price ?? course.price;
            return (
              <Link key={course.id} href={`/courses/${course.slug}`} className="group">
                <Card className="h-full overflow-hidden transition group-hover:shadow-md">
                  <div className="relative aspect-video bg-slate-100">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <CardBody className="p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone={modeTone[course.mode] ?? 'slate'}>{course.mode}</Badge>
                      {course.level ? <Badge>{course.level}</Badge> : null}
                      {course.visibility === 'password' ? (
                        <Badge tone="amber">Password</Badge>
                      ) : null}
                    </div>
                    <h2 className="line-clamp-2 text-sm font-semibold text-slate-900">
                      {course.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{course.summary}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-700">
                        {price > 0 ? formatCurrency(price) : 'Free'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {course.total_lessons} lessons
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
