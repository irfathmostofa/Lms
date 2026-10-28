import Link from 'next/link';
import { getRequestDictionary } from '@/lib/locale';
import { translate } from '@/lib/i18n';

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M4 10h12M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeCta({
  siteName,
  supportEmail,
  supportPhone,
}: {
  siteName: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
}) {
  const dict = getRequestDictionary();
  return (
    <section className="bg-white px-6 pb-16 pt-4 sm:pb-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 text-white sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-100 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {dict.cta.eyebrow}
            </span>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {dict.cta.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {translate(dict, 'cta.body', { siteName })}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {dict.cta.createAccount}
                <ArrowIcon />
              </Link>
              <Link
                href="/courses"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {dict.cta.browseCourses}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-white">{dict.cta.helpTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{dict.cta.helpBody}</p>
            <div className="mt-5 space-y-3 text-sm">
              {supportEmail ? (
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-slate-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20 text-brand-200">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M4 6.5h16v11H4v-11zM4 7l8 6 8-6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="break-all">{supportEmail}</span>
                </a>
              ) : null}
              {supportPhone ? (
                <a
                  href={`tel:${supportPhone}`}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-slate-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-200">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M5.5 4.5h3l1.5 4-2 1.5a12 12 0 006 6l1.5-2 4 1.5v3a1.5 1.5 0 01-1.5 1.5A16 16 0 014 6a1.5 1.5 0 011.5-1.5z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>{supportPhone}</span>
                </a>
              ) : null}
              <Link
                href="/dashboard/my-fees"
                className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-slate-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                    <path
                      d="M4 7h16v10H4V7zM4 10h16M7 14h4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>{dict.cta.paymentHelp}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
