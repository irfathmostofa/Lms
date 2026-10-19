'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { signUpAction } from '@/actions/auth';
import { PasswordField } from '@/components/auth/password-field';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Creating account...' : 'Create account'}
    </Button>
  );
}

export function RegisterForm() {
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
      <Field label="Full name">
        <Input name="full_name" placeholder="Your name" required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>
      <Field label="Phone">
        <Input name="phone" placeholder="01XXXXXXXXX" />
      </Field>
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        required
        hint="At least 6 characters."
      />
      <SubmitButton />
      <p className="text-xs text-slate-400">
        New accounts are always created as students. An admin can change your role later.
      </p>
      <p className="text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
