'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';

function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="danger" disabled={pending}>
      {pending ? 'Deleting...' : label}
    </Button>
  );
}

export function ConfirmDeleteButton({
  action,
  id,
  confirm = 'Delete this item?',
  label = 'Delete',
}: {
  action: (
    prev: unknown,
    formData: FormData,
  ) => Promise<{ error?: string; success?: string } | null>;
  id: string;
  confirm?: string;
  label?: string;
}) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirm)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {state?.error ? <p className="mb-1 text-xs text-red-600">{state.error}</p> : null}
      <DeleteButton label={label} />
    </form>
  );
}
