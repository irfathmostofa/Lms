import Link from 'next/link';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/site/language-switcher';
import { getRequestDictionary, getRequestLocale } from '@/lib/locale';

export function AuthShell({
  eyebrow,
  title,
  description,
  header,
  children,
  footer,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const dict = getRequestDictionary();
  const locale = getRequestLocale();
  const highlights = [dict.auth.highlight1, dict.auth.highlight2, dict.auth.highlight3];
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 text-white lg:flex">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand-600/40 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]" />
          </div>
          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-12 xl:px-16">
            <Link href="/" className="flex items-center gap-3 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold">
                L
              </span>
              <span className="text-lg font-semibold tracking-tight">LMS Platform</span>
            </Link>

            <div className="max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
                {dict.auth.portalEyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
                {dict.auth.portalTitle}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                {dict.auth.portalBody}
              </p>
              <ul className="mt-8 space-y-3 text-sm text-slate-200">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-slate-400">{dict.footer.builtFor}</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                  L
                </span>
                LMS Platform
              </Link>
              <div className="flex items-center gap-3">
                <LanguageSwitcher locale={locale} compact />
                <Link href="/courses" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                  {dict.nav.courses}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
              {header ?? (
                <>
                  {eyebrow ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                      {eyebrow}
                    </p>
                  ) : null}
                  {title ? (
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
                  ) : null}
                  {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
                </>
              )}
              <div className="mt-6">{children}</div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              {footer ?? dict.auth.policy}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
