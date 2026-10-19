import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { HeroSlider, type HeroSlide } from '@/components/home/hero-slider';
import { getHomeCourses, type HomeCourse } from '@/lib/home';
import { getPublicSettings } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';

export const revalidate = 300;

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'default-skills',
    eyebrow: 'Learning that fits your life',
    title: 'Build skills that open new doors.',
    description:
      'Learn from experienced instructors with structured lessons, practical projects and lifetime access to every course you enroll in.',
    href: '/courses',
    ctaLabel: 'Explore courses',
    secondaryHref: '/register',
    secondaryLabel: 'Create free account',
    imageUrl: null,
    meta: ['Online and offline', 'Expert instructors', 'Lifetime access'],
  },
  {
    id: 'default-batches',
    eyebrow: 'Study your way',
    title: 'Online lessons or in-person batches.',
    description:
      'Choose the format that works for you. Follow self-paced online content or join scheduled batches with attendance and instructor support.',
    href: '/courses',
    ctaLabel: 'Browse all courses',
    secondaryHref: '/login',
    secondaryLabel: 'Sign in',
    imageUrl: null,
    meta: ['Self-paced', 'Scheduled batches', 'Progress tracking'],
  },
  {
    id: 'default-progress',
    eyebrow: 'From first lesson to finished',
    title: 'A clear path to your next certificate.',
    description:
      'Track completed lessons, submit assessments and see your progress in one place. Everything you need to keep moving forward.',
    href: '/register',
    ctaLabel: 'Start learning',
    secondaryHref: '/courses',
    secondaryLabel: 'See curriculum',
    imageUrl: null,
    meta: ['Lesson progress', 'Assessments', 'Student dashboard'],
  },
];

function buildCourseSlide(course: HomeCourse, featured: boolean): HeroSlide {
  const price = Number(course.discount_price ?? course.price ?? 0);
  const duration =
    course.duration_label ??
    (course.duration_hours ? `${course.duration_hours} hours of content` : null);

  return {
    id: course.id,
    eyebrow: featured ? `Featured ${course.mode} course` : `New ${course.mode} course`,
    title: course.title,
    description:
      course.summary ??
      'Structured lessons, practical exercises and lifetime access so you can learn at your own pace.',
    href: `/courses/${course.slug}`,
    ctaLabel: 'View course',
    secondaryHref: '/courses',
    secondaryLabel: 'Browse all courses',
    imageUrl: course.thumbnail_url,
    meta: [
      course.level ? course.level : 'All levels',
      `${course.total_lessons} lesson${course.total_lessons === 1 ? '' : 's'}`,
      ...(duration ? [duration] : []),
    ],
    priceLabel: price > 0 ? formatCurrency(price) : 'Free',
  };
}

export default async function HomePage() {
  const [courses, settings] = await Promise.all([
    getHomeCourses(),
    getPublicSettings(['site_name', 'support_email', 'support_phone']),
  ]);

  const featured = courses.filter((course) => course.is_featured).slice(0, 5);
  const highlighted = featured.length > 0 ? featured : courses.slice(0, 3);
  const slides =
    highlighted.length > 0
      ? highlighted.map((course) => buildCourseSlide(course, course.is_featured))
      : DEFAULT_SLIDES;

  const siteName = settings.site_name ?? 'LMS Platform';

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <HeroSlider slides={slides} />
      <SiteFooter
        siteName={siteName}
        supportEmail={settings.support_email}
        supportPhone={settings.support_phone}
      />
    </main>
  );
}
