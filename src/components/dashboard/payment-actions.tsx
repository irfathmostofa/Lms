'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { rejectPaymentAction, verifyPaymentAction } from '@/actions/dashboard';
import { Button, Input } from '@/components/ui';

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="success" disabled={pending}>
      {pending ? 'Verifying...' : 'Verify'}
    </Button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="danger" disabled={pending}>
      {pending ? 'Rejecting...' : 'Reject'}
    </Button>
  );
}

export function PaymentActions({ id }: { id: string }) {
  const [verifyState, verifyAction] = useFormState(verifyPaymentAction, null);
  const [rejectState, rejectAction] = useFormState(rejectPaymentAction, null);
  const error = verifyState?.error ?? rejectState?.error;
  const success = verifyState?.success ?? rejectState?.success;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={verifyAction}>
          <input type="hidden" name="id" value={id} />
          <VerifyButton />
        </form>
        <form action={rejectAction} className="flex items-center gap-1">
          <input type="hidden" name="id" value={id} />
          <Input
            name="notes"
            placeholder="Reason"
            aria-label="Rejection reason"
            className="w-28 py-1 text-xs"
          />
          <RejectButton />
        </form>
      </div>
      {error ? (
        <p role="alert" className="max-w-56 text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {success ? <p className="max-w-56 text-xs text-emerald-600">{success}</p> : null}
    </div>
  );
}
