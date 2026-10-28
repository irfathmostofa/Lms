import Link from 'next/link';
import { whatsappHref } from '@/lib/utils';
import { getRequestDictionary } from '@/lib/locale';

export function SiteFooter({
  siteName = 'LMS Platform',
  supportEmail,
  supportPhone,
}: {
  siteName?: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
}) {
  const dict = getRequestDictionary();
  const year = new Date().getFullYear();
  const chatHref = whatsappHref(supportPhone);

  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              {siteName.slice(0, 1).toUpperCase()}
            </span>
            {siteName}
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{dict.footer.blurb}</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-200">{dict.footer.explore}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/" className="transition hover:text-white">
                {dict.footer.home}
              </Link>
            </li>
            <li>
              <Link href="/courses" className="transition hover:text-white">
                {dict.footer.allCourses}
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition hover:text-white">
                {dict.footer.about}
              </Link>
            </li>
            <li>
              <Link href="/dashboard/my-learning" className="transition hover:text-white">
                {dict.footer.myLearning}
              </Link>
            </li>
            <li>
              <Link href="/dashboard/store" className="transition hover:text-white">
                {dict.footer.resources}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-200">{dict.footer.account}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/login" className="transition hover:text-white">
                {dict.footer.signIn}
              </Link>
            </li>
            <li>
              <Link href="/register" className="transition hover:text-white">
                {dict.footer.createAccount}
              </Link>
            </li>
            <li>
              <Link href="/forgot-password" className="transition hover:text-white">
                {dict.footer.forgotPassword}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-200">{dict.footer.contact}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {supportEmail ? (
              <li>
                <a href={`mailto:${supportEmail}`} className="transition hover:text-white">
                  {supportEmail}
                </a>
              </li>
            ) : null}
            {supportPhone ? (
              <li>
                <a href={`tel:${supportPhone}`} className="transition hover:text-white">
                  {supportPhone}
                </a>
              </li>
            ) : null}
            {chatHref ? (
              <li>
                <a href={chatHref} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
                  {dict.footer.whatsapp}
                </a>
              </li>
            ) : null}
            <li>
              <Link href="/dashboard/my-fees" className="transition hover:text-white">
                {dict.footer.paymentHelp}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteName}. {dict.footer.rights}
          </p>
          <p>{dict.footer.builtFor}</p>
        </div>
      </div>
    </footer>
  );
}
