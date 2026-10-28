import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { HeroSlideForm, type HeroCourseOption } from '@/components/dashboard/hero-slide-form';
import { HeroParticleForm } from '@/components/dashboard/hero-particle-form';
import { HeroLayoutForm } from '@/components/dashboard/hero-layout-form';
import { DeleteHeroSlideButton } from '@/components/dashboard/delete-hero-slide-button';
import { FormModal } from '@/components/dashboard/form-modal';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { particleStyleLabel, resolveParticleStyle } from '@/lib/particles';
import { resolveHeroLayout } from '@/lib/hero';
import type { HeroSlide } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HeroSlidesPage() {
  const ctx = await getSessionContext();
  if (ctx?.profile?.role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const [{ data, error }, { data: courseData }, { data: settingRows }] = await Promise.all([
    supabase
      .from('hero_slides')
      .select('*, course:courses(id, title, slug, summary, thumbnail_url, level, mode, price, discount_price, duration_label, total_lessons)')
      .order('sort_order')
      .order('created_at', { ascending: false }),
    supabase
      .from('courses')
      .select('id, title, slug, thumbnail_url, summary')
      .eq('status', 'published')
      .order('title'),
    supabase.from('settings').select('key, value').in('key', ['hero_particle_style', 'hero_layout']),
  ]);

  const slides = (data as HeroSlide[]) ?? [];
  const courses = ((courseData as HeroCourseOption[]) ?? []).filter((course) => Boolean(course.thumbnail_url));
  const settings = Object.fromEntries(((settingRows as { key: string; value: string | null }[]) ?? []).map((row) => [row.key, row.value]));
  const defaultParticle = resolveParticleStyle(settings.hero_particle_style ?? 'orbs');
  const heroLayout = resolveHeroLayout(settings.hero_layout);

  return (
    <>
      <PageHeader
        title="Hero slider"
        description="Pick a layout, then choose which course images appear on the homepage hero."
        action={
          <FormModal
            title="Add featured course"
            description="Pick a published course with a thumbnail. That image becomes the hero slide."
            triggerLabel="Add course"
            size="lg"
          >
            <HeroSlideForm courses={courses} />
          </FormModal>
        }
      />

      <Card className="mb-6">
        <CardHeader
          title="Hero layout"
          description="Images only, text with images, or a horizontal row of featured courses."
        />
        <CardBody>
          <HeroLayoutForm value={heroLayout} />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Particle animation"
          description="Background motion over the hero. You can also set a style on each slide."
        />
        <CardBody>
          <HeroParticleForm value={defaultParticle} />
        </CardBody>
      </Card>

      {error ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Slides could not be loaded: {error.message}. Run supabase/migrations/20261028_hero_courses.sql in Supabase if columns are missing.
        </p>
      ) : null}

      {slides.length === 0 ? (
        <EmptyState
          title="No featured courses yet"
          description="Add a published course with a thumbnail. Until then the homepage uses the default hero."
        />
      ) : (
        <div className="space-y-4">
          {slides.map((slide) => {
            const image = slide.course?.thumbnail_url || slide.image_url;
            return (
              <Card key={slide.id}>
                <CardHeader
                  title={slide.course?.title || slide.title}
                  description={slide.course ? 'Course image slide' : slide.eyebrow || 'Homepage slide'}
                  action={
                    <div className="flex items-center gap-2">
                      <Badge tone="blue">{particleStyleLabel(slide.particle_style)}</Badge>
                      <Badge tone={slide.is_active ? 'green' : 'amber'}>
                        {slide.is_active ? 'published' : 'hidden'}
                      </Badge>
                      <FormModal title="Edit featured course" triggerLabel="Edit" triggerVariant="outline" triggerSize="sm">
                        <HeroSlideForm slide={slide} courses={courses} />
                      </FormModal>
                      <DeleteHeroSlideButton id={slide.id} />
                    </div>
                  }
                />
                <CardBody>
                  {image ? (
                    <div className="relative aspect-video max-w-sm overflow-hidden rounded-lg bg-slate-100">
                      <Image src={image} alt={slide.title} fill className="object-cover" sizes="220px" />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">This course has no thumbnail yet.</p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
