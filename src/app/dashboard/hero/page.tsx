import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { HeroSlideForm } from '@/components/dashboard/hero-slide-form';
import { DeleteHeroSlideButton } from '@/components/dashboard/delete-hero-slide-button';
import { FormModal } from '@/components/dashboard/form-modal';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import type { HeroSlide } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HeroSlidesPage() {
  const ctx = await getSessionContext();
  if (ctx?.profile?.role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false });

  const slides = (data as HeroSlide[]) ?? [];

  return (
    <>
      <PageHeader
        title="Hero slider"
        description="Upload homepage slider images into the public thumbnails bucket. Files are compressed to 75% quality before they are saved."
        action={
          <FormModal
            title="Add slide"
            description="Wide images (about 1920x1080) work best."
            triggerLabel="Add slide"
            size="lg"
          >
            <HeroSlideForm />
          </FormModal>
        }
      />

      {error ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Slides could not be loaded: {error.message}. Run supabase/migrations/20261020_hero_slides.sql in Supabase if the table is missing.
        </p>
      ) : null}

      {slides.length === 0 ? (
        <EmptyState title="No slider images yet" description="Add a slide. Until then the homepage uses the default hero." />
      ) : (
        <div className="space-y-4">
          {slides.map((slide) => (
            <Card key={slide.id}>
              <CardHeader
                title={slide.title}
                description={slide.eyebrow || 'Homepage slide'}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={slide.is_active ? 'green' : 'amber'}>
                      {slide.is_active ? 'published' : 'hidden'}
                    </Badge>
                    <FormModal title="Edit slide" triggerLabel="Edit" triggerVariant="outline" triggerSize="sm">
                      <HeroSlideForm slide={slide} />
                    </FormModal>
                    <DeleteHeroSlideButton id={slide.id} />
                  </div>
                }
              />
              <CardBody>
                <div className="relative aspect-video max-w-sm overflow-hidden rounded-lg bg-slate-100">
                  <Image src={slide.image_url} alt={slide.title} fill className="object-cover" sizes="220px" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
