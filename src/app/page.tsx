import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { HeroSlider } from '@/components/home/hero-slider';
import { HomeStats, type StatItem } from '@/components/home/home-stats';
import { HomeCourseCard } from '@/components/home/home-course-card';
import { CategoryCourses, type CategoryGroup } from '@/components/home/category-courses';
import { HomeResources } from '@/components/home/home-resources';
import { HomeCta } from '@/components/home/home-cta';
import {
  getHomeCategories,
  getHomeCourses,
  getHeroLayout,
  getHeroParticleStyle,
  getHomeHeroSlides,
  getHomeProducts,
  getHomeStats,
  toHeroSlideView,
  type HomeCategory,
  type HomeCourse,
} from '@/lib/home';
import { getPublicSettings } from '@/lib/data';
import { LogoCarousel } from '@/components/home/logo-carousel';
import { TestimonialCarousel } from '@/components/home/testimonial-carousel';
import { getPageSections, getPartners, getTestimonials, isSectionEnabled } from '@/lib/website';
import { getRequestDictionary } from '@/lib/locale';

export const revalidate = 300;

function buildCategoryGroups(categories: HomeCategory[], courses: HomeCourse[]): CategoryGroup[] {
  if (categories.length === 0 || courses.length === 0) return [];

  const byId = new Map(categories.map((category) => [category.id, category]));

  const rootOf = (categoryId: string | null) => {
    let current = categoryId ? byId.get(categoryId) : undefined;
    const seen = new Set<string>();
    while (current?.parent_id && !seen.has(current.id)) {
      seen.add(current.id);
      const parent = byId.get(current.parent_id);
      if (!parent) break;
      current = parent;
    }
    return current;
  };

  const groups = new Map<string, CategoryGroup>();

  courses.forEach((course) => {
    const root = rootOf(course.category_id);
    if (!root) return;
    const existing = groups.get(root.id);
    if (existing) {
      existing.courses.push(course);
    } else {
      groups.set(root.id, {
        id: root.id,
        name: root.name,
        description: root.description,
        courses: [course],
      });
    }
  });

  return Array.from(groups.values());
}

export default async function HomePage() {
  const [courses, categories, products, stats, settings, heroSlides, particleStyle, heroLayout, sections, partners, testimonials] =
    await Promise.all([
      getHomeCourses(),
      getHomeCategories(),
      getHomeProducts(4),
      getHomeStats(),
      getPublicSettings(['site_name', 'support_email', 'support_phone']),
      getHomeHeroSlides(),
      getHeroParticleStyle(),
      getHeroLayout(),
      getPageSections(),
      getPartners(),
      getTestimonials(),
    ]);

  const slides = (Array.isArray(heroSlides) ? heroSlides : [])
    .map(toHeroSlideView)
    .filter((slide): slide is NonNullable<typeof slide> => Boolean(slide));
  const courseList = Array.isArray(courses) ? courses : [];
  const categoryList = Array.isArray(categories) ? categories : [];
  const partnerList = Array.isArray(partners) ? partners : [];
  const reviewList = Array.isArray(testimonials) ? testimonials : [];

  const dict = getRequestDictionary();
  const siteName = settings.site_name ?? 'LMS Platform';
  const featuredCourses = courseList.filter((course) => course.is_featured).slice(0, 6);
  const featuredFallback = featuredCourses.length > 0 ? featuredCourses : courseList.slice(0, 6);
  const homeCategories = categoryList.filter((category) => category.show_on_home !== false);
  const categoryGroups = buildCategoryGroups(homeCategories, courseList);
  const homePartners = partnerList.filter((item) => item.show_on_home);
  const homeReviews = reviewList.filter((item) => item.show_on_home);

  const statItems: StatItem[] = stats
    ? [
        {
          label: dict.home.statCourses,
          value: stats.courses,
          suffix: '+',
          hint: dict.home.statCoursesHint,
        },
        {
          label: dict.home.statLessons,
          value: stats.lessons,
          suffix: '+',
          hint: dict.home.statLessonsHint,
        },
        {
          label: dict.home.statStudents,
          value: stats.students,
          suffix: '+',
          hint: dict.home.statStudentsHint,
        },
        {
          label: dict.home.statResources,
          value: stats.resources,
          suffix: '+',
          hint: dict.home.statResourcesHint,
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <HeroSlider slides={slides} particleStyle={particleStyle} layout={heroLayout} courses={featuredFallback} />
      {isSectionEnabled(sections, 'home_stats') ? <HomeStats items={statItems} /> : null}

      {isSectionEnabled(sections, 'home_featured') && featuredFallback.length > 0 ? (
        <section id="courses" className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">
                  {dict.home.popularNow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {dict.home.featuredTitle}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
                  {dict.home.featuredBody}
                </p>
              </div>
              <Link
                href="/courses"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {dict.home.exploreAll}
              </Link>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredFallback.map((course) => (
                <HomeCourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isSectionEnabled(sections, 'home_categories') ? (
        <CategoryCourses categories={categoryGroups} courses={courseList} />
      ) : null}
      {isSectionEnabled(sections, 'home_partners') ? (
        <LogoCarousel partners={homePartners} title={dict.home.partnersTitle} eyebrow={dict.home.partnersEyebrow} />
      ) : null}
      {isSectionEnabled(sections, 'home_testimonials') ? (
        <TestimonialCarousel testimonials={homeReviews} title={dict.home.reviewsTitle} eyebrow={dict.home.reviewsEyebrow} />
      ) : null}
      {isSectionEnabled(sections, 'home_resources') ? <HomeResources products={products} /> : null}
      {isSectionEnabled(sections, 'home_cta') ? (
        <HomeCta
          siteName={siteName}
          supportEmail={settings.support_email}
          supportPhone={settings.support_phone}
        />
      ) : null}

      <SiteFooter
        siteName={siteName}
        supportEmail={settings.support_email}
        supportPhone={settings.support_phone}
      />
    </main>
  );
}
