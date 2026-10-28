'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { signInModalAction } from '@/actions/auth';
import { PasswordField } from '@/components/auth/password-field';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { LoginGreeting } from '@/components/auth/login-greeting';
import { useLocale } from '@/components/i18n/locale-provider';
import type { UserRole } from '@/lib/types';

export interface LoginModalResult {
  role: UserRole;
  next: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? t('auth.signingIn') : t('auth.signInContinueCta')}
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
  const { t } = useLocale();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
      >
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                LMS Platform
              </p>
              {view === 'login' ? (
                <LoginGreeting compact />
              ) : (
                <>
                  <h2 id="login-modal-title" className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    {t('auth.recoveryTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t('auth.recoveryBody')}
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={t('auth.closeSignIn')}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="p-6">
          {view === 'login' ? (
            <form action={formAction} className="space-y-4">
              {state?.error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {state.error}
                </p>
              ) : null}
              <input type="hidden" name="next" value={next ?? ''} />
              <Field label={t('auth.email')}>
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
                label={t('auth.password')}
                name="password"
                autoComplete="current-password"
                required
                placeholder={t('auth.enterPassword')}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  {t('auth.forgot')}
                </button>
              </div>
              <SubmitButton />
              <p className="text-center text-sm text-slate-500">
                {t('auth.noAccount')}{' '}
                <Link href="/register" className="font-semibold text-slate-900 hover:underline">
                  {t('auth.createOne')}
                </Link>
              </p>
            </form>
          ) : (
            <ForgotPasswordForm onBack={() => setView('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
