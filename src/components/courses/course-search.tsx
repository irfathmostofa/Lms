import { cn } from '@/lib/utils';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12.5 12.5 16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function CourseSearch({
  variant = 'header',
  defaultValue = '',
  className,
  inputId,
  autoFocus = false,
}: {
  variant?: 'header' | 'hero' | 'header-dark';
  defaultValue?: string;
  className?: string;
  inputId?: string;
  autoFocus?: boolean;
}) {
  const isHero = variant === 'hero';
  const isDark = variant === 'header-dark';
  const fieldId = inputId ?? `course-search-${variant}`;

  return (
    <form action="/courses" method="get" role="search" className={cn('relative w-full', className)}>
      <label className="sr-only" htmlFor={fieldId}>
        Search courses
      </label>
      <SearchIcon
        className={cn(
          'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2',
          isHero ? 'h-5 w-5 text-slate-400 sm:left-4' : 'h-4 w-4',
          isDark ? 'text-white/50' : 'text-slate-400',
        )}
      />
      <input
        id={fieldId}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={isHero ? 'Search a course, skill or topic' : 'Search courses'}
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
        className={cn(
          'w-full border outline-none',
          isHero
            ? 'h-12 rounded-2xl border-slate-200 bg-white py-3 pl-11 pr-24 text-sm text-slate-900 shadow-xl shadow-slate-950/15 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 sm:h-14 sm:pl-12 sm:pr-32 sm:text-base'
            : isDark
              ? 'h-11 rounded-full border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-brand-400 focus:bg-white/15 focus:ring-2 focus:ring-brand-400/30'
              : 'h-11 rounded-xl border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30',
        )}
      />
      {isHero ? (
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 items-center justify-center rounded-xl bg-brand-600 px-3.5 text-sm font-semibold text-white transition hover:bg-brand-700 sm:right-2 sm:h-11 sm:px-5"
        >
          Search
        </button>
      ) : (
        <button type="submit" className="sr-only">
          Search
        </button>
      )}
    </form>
  );
}
