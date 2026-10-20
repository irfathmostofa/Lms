import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabaseEnv } from '@/lib/env';
import { CACHE_TAGS } from '@/lib/data';
import type { HeroSlide } from '@/lib/types';

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

const DEMO_CATEGORIES: HomeCategory[] = [
  {
    id: 'demo-development',
    name: 'Web Development',
    slug: 'web-development',
    description: 'Frontend, backend and everything in between.',
    icon: null,
    parent_id: null,
  },
  {
    id: 'demo-design',
    name: 'Design',
    slug: 'design',
    description: 'Interfaces, graphics and brand systems.',
    icon: null,
    parent_id: null,
  },
  {
    id: 'demo-business',
    name: 'Business',
    slug: 'business',
    description: 'Marketing, finance and entrepreneurship.',
    icon: null,
    parent_id: null,
  },
  {
    id: 'demo-languages',
    name: 'Languages',
    slug: 'languages',
    description: 'Practical communication for study and work.',
    icon: null,
    parent_id: null,
  },
];

const DEMO_COURSES: HomeCourse[] = [
  {
    id: 'demo-course-1',
    title: 'Complete Web Development Bootcamp',
    slug: 'complete-web-development-bootcamp',
    summary: 'Go from the fundamentals to production-ready apps with HTML, CSS, JavaScript and React.',
    thumbnail_url: null,
    category_id: 'demo-development',
    mode: 'online',
    level: 'Beginner',
    price: 6500,
    discount_price: 4500,
    duration_label: '12 weeks',
    duration_hours: 72,
    total_lessons: 84,
    is_featured: true,
    published_at: null,
  },
  {
    id: 'demo-course-2',
    title: 'UI/UX Design Essentials',
    slug: 'ui-ux-design-essentials',
    summary: 'Research, wireframe and prototype digital products people love to use.',
    thumbnail_url: null,
    category_id: 'demo-design',
    mode: 'hybrid',
    level: 'All levels',
    price: 5000,
    discount_price: 3500,
    duration_label: '8 weeks',
    duration_hours: 40,
    total_lessons: 52,
    is_featured: true,
    published_at: null,
  },
  {
    id: 'demo-course-3',
    title: 'Digital Marketing with Real Campaigns',
    slug: 'digital-marketing-with-real-campaigns',
    summary: 'Plan, launch and measure campaigns across social, search and email.',
    thumbnail_url: null,
    category_id: 'demo-business',
    mode: 'online',
    level: 'Intermediate',
    price: 4200,
    discount_price: null,
    duration_label: '6 weeks',
    duration_hours: 30,
    total_lessons: 38,
    is_featured: true,
    published_at: null,
  },
  {
    id: 'demo-course-4',
    title: 'Spoken English for Professionals',
    slug: 'spoken-english-for-professionals',
    summary: 'Build confidence for meetings, interviews and everyday workplace communication.',
    thumbnail_url: null,
    category_id: 'demo-languages',
    mode: 'offline',
    level: 'Beginner',
    price: 3000,
    discount_price: 2400,
    duration_label: '10 weeks',
    duration_hours: 30,
    total_lessons: 30,
    is_featured: false,
    published_at: null,
  },
  {
    id: 'demo-course-5',
    title: 'React and Next.js in Practice',
    slug: 'react-and-nextjs-in-practice',
    summary: 'Build fast, accessible interfaces with modern React patterns and server rendering.',
    thumbnail_url: null,
    category_id: 'demo-development',
    mode: 'online',
    level: 'Intermediate',
    price: 5500,
    discount_price: 3999,
    duration_label: '8 weeks',
    duration_hours: 48,
    total_lessons: 46,
    is_featured: false,
    published_at: null,
  },
  {
    id: 'demo-course-6',
    title: 'Brand Identity and Visual Storytelling',
    slug: 'brand-identity-and-visual-storytelling',
    summary: 'Create memorable brand systems, from logo exploration to a complete style guide.',
    thumbnail_url: null,
    category_id: 'demo-design',
    mode: 'hybrid',
    level: 'All levels',
    price: 4800,
    discount_price: null,
    duration_label: '7 weeks',
    duration_hours: 35,
    total_lessons: 34,
    is_featured: false,
    published_at: null,
  },
  {
    id: 'demo-course-7',
    title: 'Small Business Finance',
    slug: 'small-business-finance',
    summary: 'Understand cash flow, pricing and simple financial statements with confidence.',
    thumbnail_url: null,
    category_id: 'demo-business',
    mode: 'online',
    level: 'Beginner',
    price: 2500,
    discount_price: 1999,
    duration_label: '5 weeks',
    duration_hours: 20,
    total_lessons: 24,
    is_featured: false,
    published_at: null,
  },
  {
    id: 'demo-course-8',
    title: 'Practical Communication Skills',
    slug: 'practical-communication-skills',
    summary: 'Speak and write clearly in interviews, presentations and team settings.',
    thumbnail_url: null,
    category_id: 'demo-languages',
    mode: 'offline',
    level: 'All levels',
    price: 2800,
    discount_price: null,
    duration_label: '6 weeks',
    duration_hours: 24,
    total_lessons: 26,
    is_featured: false,
    published_at: null,
  },
];

const DEMO_PRODUCTS: HomeProduct[] = [
  {
    id: 'demo-resource-1',
    name: 'Frontend Interview Handbook',
    slug: 'frontend-interview-handbook',
    type: 'digital',
    description: 'A concise guide to the concepts, patterns and questions asked in frontend interviews.',
    thumbnail_url: null,
    price: 499,
  },
  {
    id: 'demo-resource-2',
    name: 'Design System Starter Kit',
    slug: 'design-system-starter-kit',
    type: 'digital',
    description: 'Reusable tokens, components and documentation templates for product teams.',
    thumbnail_url: null,
    price: 899,
  },
  {
    id: 'demo-resource-3',
    name: 'Study Planner and Templates',
    slug: 'study-planner-and-templates',
    type: 'digital',
    description: 'Printable planners and trackers to build a consistent study routine.',
    thumbnail_url: null,
    price: 299,
  },
  {
    id: 'demo-resource-4',
    name: 'Business Finance Workbook',
    slug: 'business-finance-workbook',
    type: 'physical',
    description: 'A hands-on workbook with exercises for budgeting, forecasting and pricing.',
    thumbnail_url: null,
    price: 1200,
  },
];

const DEMO_STATS: HomeStats = {
  courses: 24,
  lessons: 860,
  students: 1800,
  resources: 36,
  categories: 8,
};

export const getHomeHeroSlides = unstable_cache(
  async function getHomeHeroSlides(): Promise<HeroSlide[]> {
    if (!hasSupabaseEnv()) return [];
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data as HeroSlide[]) ?? [];
    } catch {
      return [];
    }
  },
  ['home:hero-slides'],
  { revalidate: 300, tags: [CACHE_TAGS.heroSlides] },
);

const COURSE_FIELDS =
  'id, title, slug, summary, thumbnail_url, category_id, mode, level, price, discount_price, duration_label, duration_hours, total_lessons, is_featured, published_at';

export async function getHomeCourses(limit = 60): Promise<HomeCourse[]> {
  if (!hasSupabaseEnv()) return DEMO_COURSES.slice(0, limit);
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
  if (!hasSupabaseEnv()) return DEMO_CATEGORIES;
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
  if (!hasSupabaseEnv()) return DEMO_PRODUCTS.slice(0, limit);
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
  if (!hasSupabaseEnv()) return DEMO_STATS;

  const supabase = createPublicClient();

  try {
    const { data, error } = await supabase.rpc('get_home_stats');
    if (!error && data) {
      const row = (Array.isArray(data) ? data[0] : data) as StatsRow | null;
      if (row) {
        return {
          courses: toCount(row.courses),
          lessons: toCount(row.lessons),
          students: toCount(row.students),
          resources: toCount(row.resources),
          categories: toCount(row.categories),
        };
      }
    }
  } catch {
    // Fall through to the public-table counters below.
  }

  try {
    const [coursesRes, categoriesRes, productsRes, lessonRowsRes] = await Promise.all([
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .neq('visibility', 'private'),
      supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('courses')
        .select('total_lessons')
        .eq('status', 'published')
        .neq('visibility', 'private'),
    ]);

    const lessons = ((lessonRowsRes.data as { total_lessons: number | null }[] | null) ?? []).reduce(
      (sum, row) => sum + toCount(row.total_lessons ?? 0),
      0,
    );

    return {
      courses: coursesRes.count ?? 0,
      lessons,
      students: 0,
      resources: productsRes.count ?? 0,
      categories: categoriesRes.count ?? 0,
    };
  } catch {
    return null;
  }
}
