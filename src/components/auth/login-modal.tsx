'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { signInModalAction } from '@/actions/auth';
import { PasswordField } from '@/components/auth/password-field';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import type { UserRole } from '@/lib/types';

export interface LoginModalResult {
  role: UserRole;
  next: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign in and continue'}
    </Button>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LoginModal({
  next,
  onClose,
  onSuccess,
}: {
  next?: string;
  onClose: () => void;
  onSuccess: (result: LoginModalResult) => void;
}) {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [state, formAction] = useFormState(signInModalAction, null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      onSuccess({ role: state.role, next: state.next });
    }
  }, [state, onSuccess]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="login-modal-title" className="text-lg font-semibold text-slate-900">
              {view === 'login' ? 'Sign in to enroll' : 'Reset your password'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {view === 'login'
                ? 'Use your student account to enroll in this course.'
                : 'Enter your account email and we will send a reset link.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close sign in dialog"
          >
            <CloseIcon />
          </button>
        </div>

        {view === 'login' ? (
          <form action={formAction} className="space-y-4">
            {state?.error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
            ) : null}
            <input type="hidden" name="next" value={next ?? ''} />
            <Field label="Email">
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                placeholder="you@example.com"
              />
            </Field>
            <PasswordField
              label="Password"
              name="password"
              autoComplete="current-password"
              required
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setView('forgot')}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <SubmitButton />
            <p className="text-center text-sm text-slate-500">
              No account?{' '}
              <Link href="/register" className="font-medium text-brand-600 hover:underline">
                Create one
              </Link>
            </p>
          </form>
        ) : (
          <ForgotPasswordForm onBack={() => setView('login')} />
        )}
      </div>
    </div>
  );
}
