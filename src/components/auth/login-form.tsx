'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { signInAction } from '@/actions/auth';
import { PasswordField } from '@/components/auth/password-field';
import { useLocale } from '@/components/i18n/locale-provider';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? t('auth.signingIn') : t('auth.signIn')}
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const { t } = useLocale();
  const [state, formAction] = useFormState(signInAction, null);

  return (
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
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            name="remember"
            className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          {t('auth.keepSignedIn')}
        </label>
        <Link href="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          {t('auth.forgot')}
        </Link>
      </div>
      <SubmitButton />
      <p className="text-center text-sm text-slate-500">
        {t('auth.newHere')}{' '}
        <Link href="/register" className="font-semibold text-slate-900 hover:underline">
          {t('auth.createAccount')}
        </Link>
      </p>
    </form>
  );
}
