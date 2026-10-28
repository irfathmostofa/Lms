'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { signUpAction } from '@/actions/auth';
import { PasswordField } from '@/components/auth/password-field';
import { useLocale } from '@/components/i18n/locale-provider';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? t('auth.creating') : t('auth.createCta')}
    </Button>
  );
}

export function RegisterForm() {
  const { t } = useLocale();
  const [state, formAction] = useFormState(signUpAction, null);

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
      <Field label={t('auth.fullName')}>
        <Input name="full_name" placeholder={t('auth.yourName')} required />
      </Field>
      <Field label={t('auth.emailShort')}>
        <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>
      <Field label={t('auth.phone')}>
        <Input name="phone" placeholder="01XXXXXXXXX" />
      </Field>
      <PasswordField
        label={t('auth.password')}
        name="password"
        autoComplete="new-password"
        required
        hint={t('auth.passwordHint')}
      />
      <SubmitButton />
      <p className="text-xs text-slate-400">{t('auth.studentNote')}</p>
      <p className="text-center text-sm text-slate-500">
        {t('auth.alreadyRegistered')}{' '}
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </form>
  );
}
