'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input } from '@/components/ui';
import { submitManualPaymentAction } from '@/actions/student';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit payment'}
    </Button>
  );
}

export function ManualPaymentForm({
  enrollmentId,
  orderId,
  methods,
  suggestedAmount,
}: {
  enrollmentId?: string;
  orderId?: string;
  methods: { code: string; label: string }[];
  suggestedAmount?: number;
}) {
  const [state, formAction] = useFormState(submitManualPaymentAction, null);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      {enrollmentId ? <input type="hidden" name="enrollment_id" value={enrollmentId} /> : null}
      {orderId ? <input type="hidden" name="order_id" value={orderId} /> : null}

      <Field label="Payment method">
        <select
          name="method"
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Select method</option>
          {methods.map((method) => (
            <option key={method.code} value={method.code}>
              {method.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Amount paid">
        <Input
          name="amount"
          type="number"
          min="1"
          step="0.01"
          required
          defaultValue={suggestedAmount && suggestedAmount > 0 ? suggestedAmount : undefined}
        />
      </Field>

      <Field label="Transaction ID" hint="The TrxID from your bKash/Nagad SMS or app.">
        <Input name="trx_id" required placeholder="e.g. 8N7A2K9LQP" />
      </Field>

      <Field label="Sender number">
        <Input name="sender_number" placeholder="01XXXXXXXXX" />
      </Field>

      <Field label="Screenshot URL" hint="Optional link to a payment screenshot.">
        <Input name="screenshot_url" placeholder="https://..." />
      </Field>

      <Submit />
    </form>
  );
}
