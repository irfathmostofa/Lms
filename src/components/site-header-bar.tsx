'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { CourseSearch } from '@/components/courses/course-search';
import { LanguageSwitcher } from '@/components/site/language-switcher';
import { useLocale } from '@/components/i18n/locale-provider';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12.5 12.5 16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeaderBar({
  siteName,
  isAuthenticated,
  name,
  avatarUrl,
  dashboardHref,
  initials,
  locale,
}: {
  siteName: string;
  isAuthenticated: boolean;
  name: string;
  avatarUrl: string | null;
  dashboardHref: string;
  initials: string;
  locale: Locale;
}) {
  const { t } = useLocale();
  const pathname = usePathname();
  const navLinks = [
    { href: '/courses', label: t('nav.courses') },
    { href: '/about', label: t('nav.about') },
  ];
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchPanelId = useId();
  const menuPanelId = useId();
  const headerRef = useRef<HTMLDivElement>(null);
  const mark = siteName.trim().slice(0, 1).toUpperCase() || 'L';

  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen && !menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && headerRef.current?.contains(target)) return;
      setSearchOpen(false);
      setMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen((open) => !open);
  };

  const openMenu = () => {
    setSearchOpen(false);
    setMenuOpen((open) => !open);
  };

  const accountLink = (
    <Link
      href={dashboardHref}
      aria-label={`${name} dashboard`}
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {initials}
        </span>
      )}
      <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:inline">{name}</span>
    </Link>
  );

  return (
    <div ref={headerRef}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-brand-600 text-sm font-bold text-white shadow-md shadow-brand-600/25">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
            <span className="relative">{mark}</span>
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-[15px] font-semibold tracking-tight text-slate-900">{siteName}</span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-brand-600">{t('nav.tagline')}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-medium transition',
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <CourseSearch
          variant="header"
          inputId="course-search-header"
          className="hidden max-w-md flex-1 md:block"
        />

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <LanguageSwitcher locale={locale} />
          {isAuthenticated ? (
            accountLink
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-10 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                {t('nav.getStarted')}
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:hidden">
          <button
            type="button"
            onClick={openSearch}
            aria-label={searchOpen ? t('nav.closeSearch') : t('nav.searchCourses')}
            aria-expanded={searchOpen}
            aria-controls={searchPanelId}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              searchOpen
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={openMenu}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls={menuPanelId}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              menuOpen
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div id={searchPanelId} className="animate-search-in border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <CourseSearch inputId="course-search-header-mobile" autoFocus className="mx-auto max-w-6xl" />
        </div>
      ) : null}

      {menuOpen ? (
        <div id={menuPanelId} className="md:hidden">
          <div className="animate-fade-in border-t border-slate-100 bg-white px-4 py-4">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 border-t border-slate-100 pt-3">
              {isAuthenticated ? (
                <Link href={dashboardHref} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      {initials}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{name}</span>
                    <span className="text-xs text-slate-500">{t('nav.dashboard')}</span>
                  </span>
                </Link>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 text-sm font-medium text-slate-700"
                    >
                      {t('nav.signIn')}
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white"
                    >
                      {t('nav.getStarted')}
                    </Link>
                  </div>
                  <div className="mt-3">
                    <LanguageSwitcher locale={locale} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
