'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { requestPasswordResetAction } from '@/actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Sending link...' : 'Send reset link'}
    </Button>
  );
}

export function ForgotPasswordForm({ onBack }: { onBack?: () => void }) {
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
      <Field label="Email address" hint="We will send a secure reset link to this address.">
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
          Back to sign in
        </button>
      ) : (
        <Link
          href="/login"
          className="block text-center text-sm font-semibold text-slate-900 hover:underline"
        >
          Back to sign in
        </Link>
      )}
    </form>
  );
}
