import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { PageSectionsForm } from '@/components/dashboard/page-sections-form';
import { HomeCategoriesForm } from '@/components/dashboard/home-categories-form';
import { PartnerForm } from '@/components/dashboard/partner-form';
import { TestimonialForm } from '@/components/dashboard/testimonial-form';
import { ConfirmDeleteButton } from '@/components/dashboard/confirm-delete-button';
import { FormModal } from '@/components/dashboard/form-modal';
import { deletePartnerAction, deleteTestimonialAction } from '@/actions/dashboard';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import type { Category, PageSection, Partner, Testimonial } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function WebsiteCmsPage() {
  const ctx = await getSessionContext();
  if (ctx?.profile?.role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const [
    { data: sectionData, error: sectionError },
    { data: categoryData },
    { data: partnerData, error: partnerError },
    { data: testimonialData, error: testimonialError },
  ] = await Promise.all([
    supabase.from('page_sections').select('*').order('page').order('sort_order'),
    supabase.from('categories').select('id, parent_id, name, slug, description, icon, sort_order, is_active, show_on_home').eq('is_active', true).order('sort_order').order('name'),
    supabase.from('partners').select('*').order('sort_order'),
    supabase.from('testimonials').select('*').order('sort_order'),
  ]);

  const sections = (sectionData as PageSection[]) ?? [];
  const categories = (categoryData as Category[]) ?? [];
  const partners = (partnerData as Partner[]) ?? [];
  const testimonials = (testimonialData as Testimonial[]) ?? [];

  return (
    <>
      <PageHeader
        title="Home and about"
        description="Choose which sections appear on the public site, pick home category rows, and manage partners and reviews."
        action={
          <div className="flex flex-wrap gap-2">
            <FormModal title="Add partner" description="Logos appear in a 3-up carousel on Home and About." triggerLabel="Add partner">
              <PartnerForm />
            </FormModal>
            <FormModal title="Add review" description="Student testimonials appear in a 3-up carousel." triggerLabel="Add review" triggerVariant="secondary">
              <TestimonialForm />
            </FormModal>
          </div>
        }
      />

      {sectionError || partnerError || testimonialError ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Website content could not be loaded. Run supabase/migrations/20261020_website_cms.sql if tables are missing.
        </p>
      ) : null}

      <Card className="mb-6">
        <CardHeader
          title="Section visibility"
          description="Turn Home and About blocks on or off."
          action={
            <FormModal title="Edit section visibility" triggerLabel="Edit sections" triggerVariant="outline" triggerSize="sm">
              <PageSectionsForm sections={sections} />
            </FormModal>
          }
        />
        <CardBody>
          {sections.length === 0 ? (
            <p className="text-sm text-slate-500">No page sections yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sections.map((section) => (
                <li key={section.key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{section.label}</p>
                    <p className="text-xs capitalize text-slate-400">{section.page}</p>
                  </div>
                  <Badge tone={section.enabled ? 'green' : 'amber'}>
                    {section.enabled ? 'visible' : 'hidden'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className="mb-8">
        <CardHeader
          title="Home category sections"
          description="Only checked categories get their own course row on the homepage."
          action={
            <FormModal title="Edit home categories" triggerLabel="Edit categories" triggerVariant="outline" triggerSize="sm">
              <HomeCategoriesForm categories={categories} />
            </FormModal>
          }
        />
        <CardBody>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500">No categories yet. Create course categories first.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{category.name}</p>
                    <p className="text-xs text-slate-400">{category.slug}</p>
                  </div>
                  <Badge tone={category.show_on_home !== false ? 'green' : 'amber'}>
                    {category.show_on_home !== false ? 'on home' : 'hidden'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {partners.length === 0 ? (
        <EmptyState title="No partners yet" description="Add partner logos." />
      ) : (
        <div className="mb-8 space-y-4">
          {partners.map((partner) => (
            <Card key={partner.id}>
              <CardHeader
                title={partner.name}
                description={[partner.show_on_home ? 'Home' : null, partner.show_on_about ? 'About' : null]
                  .filter(Boolean)
                  .join(' · ') || 'Hidden from pages'}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={partner.is_active ? 'green' : 'amber'}>
                      {partner.is_active ? 'published' : 'hidden'}
                    </Badge>
                    <FormModal title="Edit partner" triggerLabel="Edit" triggerVariant="outline" triggerSize="sm">
                      <PartnerForm partner={partner} />
                    </FormModal>
                    <ConfirmDeleteButton
                      action={deletePartnerAction}
                      id={partner.id}
                      confirm="Delete this partner?"
                    />
                  </div>
                }
              />
              <CardBody>
                <div className="relative aspect-[2/1] max-w-[160px] overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
                  {partner.logo_url ? (
                    <Image src={partner.logo_url} alt={partner.name} fill className="object-contain p-3" sizes="160px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">No logo</div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {testimonials.length === 0 ? (
        <EmptyState title="No reviews yet" description="Add student reviews." />
      ) : (
        <div className="space-y-4">
          {testimonials.map((item) => (
            <Card key={item.id}>
              <CardHeader
                title={item.name}
                description={item.role_title ?? `${item.rating}/5`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={item.is_active ? 'green' : 'amber'}>
                      {item.is_active ? 'published' : 'hidden'}
                    </Badge>
                    <FormModal title="Edit review" triggerLabel="Edit" triggerVariant="outline" triggerSize="sm">
                      <TestimonialForm testimonial={item} />
                    </FormModal>
                    <ConfirmDeleteButton
                      action={deleteTestimonialAction}
                      id={item.id}
                      confirm="Delete this review?"
                    />
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
