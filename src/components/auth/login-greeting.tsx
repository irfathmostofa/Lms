'use client';

import { useEffect, useState } from 'react';
import { hasVisitedBefore, markVisited } from '@/lib/returning-visitor';

export function useReturningVisitor() {
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const seen = hasVisitedBefore();
    setReturning(seen);
    if (!seen) markVisited();
  }, []);

  return returning;
}

export function LoginGreeting({
  compact = false,
}: {
  compact?: boolean;
}) {
  const returning = useReturningVisitor();
  const title = returning ? 'Welcome again' : 'Welcome';
  const description = returning
    ? 'Sign in to continue where you left off.'
    : 'Sign in to your account to get started.';

  if (compact) {
    return (
      <>
        <h2 id="login-modal-title" className="mt-1 text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </>
    );
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
        {returning ? 'Returning learner' : 'Get started'}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </>
  );
}
