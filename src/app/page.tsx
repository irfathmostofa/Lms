import { ButtonLink } from '@/components/ui';
import { SiteHeader } from '@/components/site-header';
import { getSessionContext } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/constants';

const features = [
  {
    title: 'Courses and curriculum',
    body: 'Course > Section > Lesson with text, image, PDF and YouTube content, gated by enrollment.',
  },
  {
    title: 'Online and offline',
    body: 'Batches with venue and schedule, class sessions and per-student attendance tracking.',
  },
  {
    title: 'Enrollment and fees',
    body: 'Student enrollment with fee records, discounts, installments, paid and due amounts.',
  },
  {
    title: 'Payments',
    body: 'SSLCommerz plus manual bKash, Nagad, Rocket and Upay with admin verification.',
  },
  {
    title: 'Teaching and assessment',
    body: 'Homework, class tests, assignments and exams with marks and feedback per student.',
  },
  {
    title: 'Finance and store',
    body: 'Income, expenses, monthly profit/loss, per-course profitability and a resource store.',
  },
];

export default async function HomePage() {
  const ctx = await getSessionContext();
  const dashboardHref = ctx
    ? ROLE_HOME[ctx.profile?.role ?? 'student'] ?? '/dashboard'
    : null;

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Learning management, done right
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          One platform for your coaching center, online and offline.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600">
          Admin, Instructor, Editor and Student portals backed by Supabase Row Level Security.
          Courses, batches, attendance, assessments, payments and finance in a single place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {dashboardHref ? (
            <ButtonLink href={dashboardHref} size="lg">
              Go to dashboard
            </ButtonLink>
          ) : (
            <ButtonLink href="/register" size="lg">
              Create an account
            </ButtonLink>
          )}
          <ButtonLink href="/courses" variant="outline" size="lg">
            Browse courses
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-5"
          >
            <h2 className="text-sm font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{feature.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-100 py-6">
        <p className="text-center text-xs text-slate-400">
          LMS Platform - Next.js, Supabase, Tailwind CSS
        </p>
      </footer>
    </main>
  );
}
