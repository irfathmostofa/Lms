'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { signInAction } from '@/actions/auth';
import { PasswordField } from '@/components/auth/password-field';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign in'}
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(signInAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="Email address">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </Field>
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        placeholder="Enter your password"
      />
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            name="remember"
            className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Keep me signed in
        </label>
        <Link href="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton />
      <p className="text-center text-sm text-slate-500">
        New here?{' '}
        <Link href="/register" className="font-semibold text-slate-900 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
