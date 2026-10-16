import Link from 'next/link';
import { ButtonLink } from '@/components/ui';

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
    body: 'Admin-managed enrollment with fee records, discounts, installments, paid and due amounts.',
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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          LMS Platform
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/courses" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Courses
          </Link>
          <ButtonLink href="/login" variant="outline" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/register" size="sm">
            Get started
          </ButtonLink>
        </nav>
      </header>

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
          <ButtonLink href="/register" size="lg">
            Create an account
          </ButtonLink>
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
