import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabaseEnv } from '@/lib/env';
import { EmptyState } from '@/components/ui';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CourseCatalog } from '@/components/courses/course-catalog';
import { getPublicSettings } from '@/lib/data';
import type { Category, Course } from '@/lib/types';

export const revalidate = 300;

async function getCourses(): Promise<Course[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('courses')
      .select(
        'id, title, slug, summary, thumbnail_url, mode, price, discount_price, level, total_lessons, is_featured, visibility, tags, author_name, category_id, published_at',
      )
      .eq('status', 'published')
      .neq('visibility', 'private')
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(60);
    return (data as Course[]) ?? [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('categories')
      .select('id, parent_id, name, slug, description, icon, sort_order, is_active, show_on_home')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');
    return (data as Category[]) ?? [];
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const [courses, categories, settings] = await Promise.all([
    getCourses(),
    getCategories(),
    getPublicSettings(['site_name', 'support_email', 'support_phone']),
  ]);

  return (
    <div className="min-h-screen bg-slate-950">
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
        <CourseCatalog courses={courses} categories={categories} />
      )}
      <SiteFooter
        siteName={settings.site_name ?? 'LMS Platform'}
        supportEmail={settings.support_email}
        supportPhone={settings.support_phone}
      />
    </div>
  );
}
