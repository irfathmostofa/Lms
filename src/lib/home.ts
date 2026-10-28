import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabaseEnv } from '@/lib/env';
import { CACHE_TAGS } from '@/lib/data';
import type { HeroSlide } from '@/lib/types';
import { resolveParticleStyle, type ParticleStyle } from '@/lib/particles';
import { resolveHeroLayout, type HeroLayout } from '@/lib/hero';

export interface HeroSlideView {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  imageUrl: string | null;
  particleStyle: ParticleStyle;
  course?: {
    slug: string;
    level: string | null;
    mode: string;
    price: number;
    discountPrice: number | null;
    durationLabel: string | null;
    totalLessons: number;
  };
}

const HERO_COURSE_SELECT =
  'id, title, slug, summary, thumbnail_url, level, mode, price, discount_price, duration_label, total_lessons';

export function toHeroSlideView(slide: HeroSlide): HeroSlideView | null {
  const course = slide.course ?? null;
  const imageUrl = course?.thumbnail_url || slide.image_url;
  if (!imageUrl) return null;

  const title = course?.title || slide.title;
  const description = course?.summary || slide.description || '';
  const href = course ? `/courses/${course.slug}` : slide.href || '/courses';

  return {
    id: slide.id,
    eyebrow: slide.eyebrow ?? (course ? 'Featured course' : ''),
    title,
    description,
    href,
    ctaLabel: slide.cta_label ?? (course ? 'View course' : 'Explore courses'),
    secondaryHref: slide.secondary_href ?? '/courses',
    secondaryLabel: slide.secondary_label ?? (course ? 'Browse all courses' : undefined),
    imageUrl,
    particleStyle: resolveParticleStyle(slide.particle_style),
    course: course
      ? {
          slug: course.slug,
          level: course.level,
          mode: course.mode,
          price: course.price,
          discountPrice: course.discount_price,
          durationLabel: course.duration_label,
          totalLessons: course.total_lessons,
        }
      : undefined,
  };
}

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
  show_on_home?: boolean;
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

export const getHeroLayout = unstable_cache(
  async function getHeroLayout(): Promise<HeroLayout> {
    if (!hasSupabaseEnv()) return 'text';
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('is_public', true)
        .eq('key', 'hero_layout')
        .maybeSingle();
      if (error) return 'text';
      return resolveHeroLayout(data?.value);
    } catch {
      return 'text';
    }
  },
  ['home:hero-layout'],
  { revalidate: 300, tags: [CACHE_TAGS.heroSlides, CACHE_TAGS.settings] },
);

export const getHeroParticleStyle = unstable_cache(
  async function getHeroParticleStyle(): Promise<ParticleStyle> {
    if (!hasSupabaseEnv()) return 'orbs';
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('is_public', true)
        .eq('key', 'hero_particle_style')
        .maybeSingle();
      if (error) return 'orbs';
      return resolveParticleStyle(data?.value);
    } catch {
      return 'orbs';
    }
  },
  ['home:hero-particle-style'],
  { revalidate: 300, tags: [CACHE_TAGS.heroSlides, CACHE_TAGS.settings] },
);

const DEMO_HERO_SLIDES: HeroSlide[] = DEMO_COURSES.filter((course) => course.is_featured).map(
  (course, index) => ({
    id: `demo-hero-${course.id}`,
    course_id: course.id,
    eyebrow: 'Featured course',
    title: course.title,
    description: course.summary,
    image_url: course.thumbnail_url,
    href: `/courses/${course.slug}`,
    cta_label: 'View course',
    secondary_href: '/courses',
    secondary_label: 'Browse all courses',
    particle_style: index % 2 === 0 ? 'orbs' : 'constellation',
    sort_order: index,
    is_active: true,
    created_at: '',
    updated_at: '',
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      summary: course.summary,
      thumbnail_url: course.thumbnail_url,
      level: course.level,
      mode: course.mode,
      price: course.price,
      discount_price: course.discount_price,
      duration_label: course.duration_label,
      total_lessons: course.total_lessons,
    },
  }),
);

export const getHomeHeroSlides = unstable_cache(
  async function getHomeHeroSlides(): Promise<HeroSlide[]> {
    if (!hasSupabaseEnv()) return DEMO_HERO_SLIDES;
    try {
      const supabase = createPublicClient();
      const query = supabase
        .from('hero_slides')
        .select(`*, course:courses(${HERO_COURSE_SELECT})`)
        .eq('is_active', true)
        .order('sort_order')
        .order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) {
        const fallback = await supabase
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
          .order('created_at', { ascending: false });
        if (fallback.error) return [];
        return ((fallback.data as HeroSlide[]) ?? []).filter((slide) => Boolean(slide.image_url));
      }
      return ((data as HeroSlide[]) ?? []).filter((slide) => {
        const image = slide.course?.thumbnail_url || slide.image_url;
        return Boolean(image);
      });
    } catch {
      return [];
    }
  },
  ['home:hero-slides'],
  { revalidate: 300, tags: [CACHE_TAGS.heroSlides] },
);

const COURSE_FIELDS =
  'id, title, slug, summary, thumbnail_url, category_id, mode, level, price, discount_price, duration_label, duration_hours, total_lessons, is_featured, published_at';

const getCachedHomeCourses = unstable_cache(
  async function getCachedHomeCourses(): Promise<HomeCourse[]> {
    if (!hasSupabaseEnv()) return DEMO_COURSES;
    try {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from('courses')
        .select(COURSE_FIELDS)
        .eq('status', 'published')
        .neq('visibility', 'private')
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(60);
      return (data as HomeCourse[]) ?? [];
    } catch {
      return [];
    }
  },
  ['home:courses'],
  { revalidate: 300, tags: [CACHE_TAGS.catalog] },
);

export async function getHomeCourses(limit = 60): Promise<HomeCourse[]> {
  const courses = await getCachedHomeCourses();
  return courses.slice(0, limit);
}

export const getHomeCategories = unstable_cache(
  async function getHomeCategories(): Promise<HomeCategory[]> {
    if (!hasSupabaseEnv()) return DEMO_CATEGORIES;
    try {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, description, icon, parent_id, show_on_home')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');
      return (data as HomeCategory[]) ?? [];
    } catch {
      return [];
    }
  },
  ['home:categories'],
  { revalidate: 300, tags: [CACHE_TAGS.catalog, CACHE_TAGS.website] },
);

const getCachedHomeProducts = unstable_cache(
  async function getCachedHomeProducts(): Promise<HomeProduct[]> {
    if (!hasSupabaseEnv()) return DEMO_PRODUCTS;
    try {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, type, description, thumbnail_url, price')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12);
      return (data as HomeProduct[]) ?? [];
    } catch {
      return [];
    }
  },
  ['home:products'],
  { revalidate: 300, tags: [CACHE_TAGS.catalog] },
);

export async function getHomeProducts(limit = 6): Promise<HomeProduct[]> {
  const products = await getCachedHomeProducts();
  return products.slice(0, limit);
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

export interface PublishedCourseDetail {
  course: {
    id: string;
    category_id: string | null;
    title: string;
    slug: string;
    summary: string | null;
    description: string | null;
    thumbnail_url: string | null;
    promo_video_id: string | null;
    mode: string;
    status: string;
    visibility: string;
    author_name: string | null;
    tags: string[] | null;
    level: string | null;
    language: string | null;
    price: number;
    discount_price: number | null;
    duration_hours: number | null;
    duration_label: string | null;
    learning_outcomes: string | null;
    target_audience: string | null;
    materials_included: string | null;
    requirements: string | null;
    total_lessons: number;
    is_featured: boolean;
    published_at: string | null;
  };
  sections: { id: string; title: string; summary: string | null }[];
  outline: {
    id: string;
    section_id: string;
    title: string;
    type: string;
    duration_min: number | null;
    is_preview: boolean;
  }[];
  category: { name: string; slug: string } | null;
}

export const getPublishedCourseDetail = unstable_cache(
  async function getPublishedCourseDetail(slug: string): Promise<PublishedCourseDetail | null> {
    if (!hasSupabaseEnv()) return null;
    try {
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
        course,
        sections: sectionsRes.data ?? [],
        outline: outlineRes.data ?? [],
        category: categoryRes.data ?? null,
      };
    } catch {
      return null;
    }
  },
  ['catalog:course-detail'],
  { revalidate: 300, tags: [CACHE_TAGS.catalog] },
);

export const getCatalogCourses = unstable_cache(
  async function getCatalogCourses() {
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
      return data ?? [];
    } catch {
      return [];
    }
  },
  ['catalog:courses'],
  { revalidate: 300, tags: [CACHE_TAGS.catalog] },
);

export const getCatalogCategories = unstable_cache(
  async function getCatalogCategories() {
    if (!hasSupabaseEnv()) return [];
    try {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from('categories')
        .select('id, parent_id, name, slug, description, icon, sort_order, is_active, show_on_home')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');
      return data ?? [];
    } catch {
      return [];
    }
  },
  ['catalog:categories'],
  { revalidate: 300, tags: [CACHE_TAGS.catalog, CACHE_TAGS.website] },
);

export const getHomeStats = unstable_cache(
  async function getHomeStats(): Promise<HomeStats | null> {
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
  },
  ['home:stats'],
  { revalidate: 300, tags: [CACHE_TAGS.stats, CACHE_TAGS.catalog] },
);
