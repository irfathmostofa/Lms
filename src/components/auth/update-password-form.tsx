'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';
import { updatePasswordAction } from '@/actions/auth';
import { PasswordField } from '@/components/auth/password-field';
import { useLocale } from '@/components/i18n/locale-provider';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? t('auth.updatingPassword') : t('auth.updatePassword')}
    </Button>
  );
}

export function UpdatePasswordForm() {
  const { t } = useLocale();
  const [state, formAction] = useFormState(updatePasswordAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      <PasswordField
        label={t('auth.newPassword')}
        name="password"
        autoComplete="new-password"
        required
        hint={t('auth.passwordHint')}
      />
      <PasswordField
        label={t('auth.confirmPassword')}
        name="confirm_password"
        autoComplete="new-password"
        required
      />
      <SubmitButton />
    </form>
  );
}
