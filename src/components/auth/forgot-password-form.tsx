'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { requestPasswordResetAction } from '@/actions/auth';
import { useLocale } from '@/components/i18n/locale-provider';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? t('auth.sendingLink') : t('auth.sendReset')}
    </Button>
  );
}

export function ForgotPasswordForm({ onBack }: { onBack?: () => void }) {
  const { t } = useLocale();
  const [state, formAction] = useFormState(requestPasswordResetAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <Field label={t('auth.email')} hint={t('auth.emailHint')}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </Field>
      <SubmitButton />
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="block w-full text-center text-sm font-semibold text-slate-900 hover:underline"
        >
          {t('auth.backToSignIn')}
        </button>
      ) : (
        <Link
          href="/login"
          className="block text-center text-sm font-semibold text-slate-900 hover:underline"
        >
          {t('auth.backToSignIn')}
        </Link>
      )}
    </form>
  );
}
