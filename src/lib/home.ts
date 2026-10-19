import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabaseEnv } from '@/lib/env';

export interface HomeCourse {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  thumbnail_url: string | null;
  category_id: string | null;
  mode: string;
  level: string | null;
  price: number;
  discount_price: number | null;
  duration_label: string | null;
  duration_hours: number | null;
  total_lessons: number;
  is_featured: boolean;
  published_at: string | null;
}

export interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
}

export interface HomeProduct {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
}

export interface HomeStats {
  courses: number;
  lessons: number;
  students: number;
  resources: number;
  categories: number;
}

export const EMPTY_HOME_STATS: HomeStats = {
  courses: 0,
  lessons: 0,
  students: 0,
  resources: 0,
  categories: 0,
};

const COURSE_FIELDS =
  'id, title, slug, summary, thumbnail_url, category_id, mode, level, price, discount_price, duration_label, duration_hours, total_lessons, is_featured, published_at';

export async function getHomeCourses(limit = 60): Promise<HomeCourse[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('courses')
      .select(COURSE_FIELDS)
      .eq('status', 'published')
      .neq('visibility', 'private')
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);
    return (data as HomeCourse[]) ?? [];
  } catch {
    return [];
  }
}

export async function getHomeCategories(): Promise<HomeCategory[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, description, icon, parent_id')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');
    return (data as HomeCategory[]) ?? [];
  } catch {
    return [];
  }
}

export async function getHomeProducts(limit = 6): Promise<HomeProduct[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, type, description, thumbnail_url, price')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data as HomeProduct[]) ?? [];
  } catch {
    return [];
  }
}

interface StatsRow {
  courses?: number | string;
  lessons?: number | string;
  students?: number | string;
  resources?: number | string;
  categories?: number | string;
}

function toCount(value: number | string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function getHomeStats(): Promise<HomeStats | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc('get_home_stats');
    if (error || !data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as StatsRow | null;
    if (!row) return null;
    return {
      courses: toCount(row.courses),
      lessons: toCount(row.lessons),
      students: toCount(row.students),
      resources: toCount(row.resources),
      categories: toCount(row.categories),
    };
  } catch {
    return null;
  }
}
