'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { deleteHeroSlideAction } from '@/actions/dashboard';
import { Button } from '@/components/ui';

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="danger" disabled={pending}>
      {pending ? 'Deleting...' : 'Delete'}
    </Button>
  );
}

export function DeleteHeroSlideButton({ id }: { id: string }) {
  const [state, formAction] = useFormState(deleteHeroSlideAction, null);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm('Delete this slider image?')) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {state?.error ? <p className="mb-1 text-xs text-red-600">{state.error}</p> : null}
      <DeleteButton />
    </form>
  );
}
