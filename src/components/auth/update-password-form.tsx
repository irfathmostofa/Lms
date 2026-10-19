'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';
import { updatePasswordAction } from '@/actions/auth';
import { PasswordField } from '@/components/auth/password-field';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Updating password...' : 'Update password'}
    </Button>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useFormState(updatePasswordAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        required
        hint="At least 6 characters."
      />
      <PasswordField
        label="Confirm new password"
        name="confirm_password"
        autoComplete="new-password"
        required
      />
      <SubmitButton />
    </form>
  );
}
