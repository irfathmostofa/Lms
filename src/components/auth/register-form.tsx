'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { signUpAction } from '@/actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating account...' : 'Create account'}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState(signUpAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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
      <Field label="Password" hint="At least 6 characters.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton />
      <p className="text-xs text-slate-400">
        New accounts are always created as students. An admin can change your role later.
      </p>
      <p className="text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
