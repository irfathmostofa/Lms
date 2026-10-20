import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { MediaVisual } from '@/components/site/media-visual';
import { LogoCarousel } from '@/components/home/logo-carousel';
import { TestimonialCarousel } from '@/components/home/testimonial-carousel';
import { getPublicSettings } from '@/lib/data';
import { getAboutPage, getPageSections, getPartners, getTeamMembers, getTestimonials, isSectionEnabled } from '@/lib/website';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about our mission, instructors and the people behind the courses.',
};

export default async function AboutPage() {
  const [about, team, partners, testimonials, sections, settings] = await Promise.all([
    getAboutPage(),
    getTeamMembers(),
    getPartners(),
    getTestimonials(),
    getPageSections(),
    getPublicSettings(['site_name', 'support_email', 'support_phone']),
  ]);

  const siteName = settings.site_name ?? 'LMS Platform';
  const aboutPartners = partners.filter((item) => item.show_on_about);
  const aboutReviews = testimonials.filter((item) => item.show_on_about);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {isSectionEnabled(sections, 'about_intro') ? (
        <section className="bg-slate-950 py-16 text-white sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">About us</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {about?.intro_title ?? 'Learn with people who care about your progress.'}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
                {about?.intro_body ??
                  'We help students and professionals build practical skills through structured courses, expert instructors and a learning experience that works online and in person.'}
              </p>
            </div>
            <MediaVisual
              imageUrl={about?.intro_image_url}
              lottieUrl={about?.intro_lottie_url}
              alt={about?.intro_title ?? 'About us'}
              className="aspect-[16/10] min-h-56"
            />
          </div>
        </section>
      ) : null}

      {isSectionEnabled(sections, 'about_mission') ? (
        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <MediaVisual
                imageUrl={about?.mission_image_url}
                lottieUrl={about?.mission_lottie_url}
                alt={about?.mission_title ?? 'Our mission'}
                className="mb-6 aspect-[16/10]"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Mission</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{about?.mission_title ?? 'Our mission'}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {about?.mission_body ?? 'Make high-quality teaching accessible, whether you learn from home or in a classroom.'}
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <MediaVisual
                imageUrl={about?.vision_image_url}
                lottieUrl={about?.vision_lottie_url}
                alt={about?.vision_title ?? 'Our vision'}
                className="mb-6 aspect-[16/10]"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Vision</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{about?.vision_title ?? 'Our vision'}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {about?.vision_body ?? 'A trusted place where every learner can grow from first lesson to finished skill.'}
              </p>
            </article>
          </div>
        </section>
      ) : null}

      {isSectionEnabled(sections, 'about_team') && team.length > 0 ? (
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Team</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Instructors and people behind the work</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <article key={member.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <MediaVisual imageUrl={member.image_url} alt={member.name} className="aspect-[4/3] rounded-none" />
                  <div className="p-5">
                    <h3 className="text-base font-semibold text-slate-900">{member.name}</h3>
                    {member.role_title ? <p className="mt-1 text-sm text-brand-700">{member.role_title}</p> : null}
                    {member.bio ? <p className="mt-2 text-sm leading-relaxed text-slate-500">{member.bio}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isSectionEnabled(sections, 'about_partners') ? (
        <LogoCarousel partners={aboutPartners} title="Organizations we work with" />
      ) : null}
      {isSectionEnabled(sections, 'about_testimonials') ? (
        <TestimonialCarousel testimonials={aboutReviews} title="Stories from our learners" />
      ) : null}

      <SiteFooter
        siteName={siteName}
        supportEmail={settings.support_email}
        supportPhone={settings.support_phone}
      />
    </main>
  );
}
