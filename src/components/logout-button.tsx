'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';
import { signOutAction } from '@/actions/auth';

function Inner() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" className="min-h-9 px-3" disabled={pending}>
      {pending ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Inner />
    </form>
  );
}
