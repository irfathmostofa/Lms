import { hasSupabaseEnv } from '@/lib/env';
import { EmptyState } from '@/components/ui';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CourseCatalog } from '@/components/courses/course-catalog';
import { getPublicSettings } from '@/lib/data';
import { getCatalogCategories, getCatalogCourses } from '@/lib/home';
import type { Category, Course } from '@/lib/types';

export const revalidate = 300;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const [courses, categories, settings] = await Promise.all([
    getCatalogCourses() as Promise<Course[]>,
    getCatalogCategories() as Promise<Category[]>,
    getPublicSettings(['site_name', 'support_email', 'support_phone']),
  ]);
  const initialQuery = (searchParams.q ?? '').trim();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      {courses.length === 0 ? (
        <main className="mx-auto max-w-6xl px-6 py-16">
          <EmptyState
            title="No published courses yet"
            description={
              hasSupabaseEnv()
                ? 'Once an admin publishes a course it will appear here.'
                : 'Connect Supabase (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) to load courses.'
            }
          />
        </main>
      ) : (
        <CourseCatalog
          key={initialQuery}
          courses={courses}
          categories={categories}
          initialQuery={initialQuery}
        />
      )}
      <SiteFooter
        siteName={settings.site_name ?? 'LMS Platform'}
        supportEmail={settings.support_email}
        supportPhone={settings.support_phone}
      />
    </div>
  );
}
