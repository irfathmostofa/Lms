'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { signInAction } from '@/actions/auth';
import { PasswordField } from '@/components/auth/password-field';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign in'}
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(signInAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        hint="Use the View button to show the password."
      />
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <SubmitButton />
      <p className="text-center text-sm text-slate-500">
        No account?{' '}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
