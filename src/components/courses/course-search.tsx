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
}: {
  variant?: 'header' | 'hero';
  defaultValue?: string;
  className?: string;
  inputId?: string;
}) {
  const isHero = variant === 'hero';
  const fieldId = inputId ?? `course-search-${variant}`;

  return (
    <form action="/courses" method="get" role="search" className={cn('relative w-full', className)}>
      <label className="sr-only" htmlFor={fieldId}>
        Search courses
      </label>
      <SearchIcon
        className={cn(
          'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400',
          isHero ? 'h-5 w-5' : 'h-4 w-4',
        )}
      />
      <input
        id={fieldId}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={isHero ? 'Search for a course, skill or instructor' : 'Search courses'}
        autoComplete="off"
        enterKeyHint="search"
        className={cn(
          'w-full rounded-lg border bg-white text-slate-900 outline-none placeholder:text-slate-400',
          isHero
            ? 'h-12 border-slate-200 py-3 pl-11 pr-28 text-sm shadow-lg shadow-slate-900/10 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 sm:h-14 sm:text-base'
            : 'h-10 border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30',
        )}
      />
      {isHero ? (
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 sm:h-11 sm:px-5"
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
