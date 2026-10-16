'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui';

export function SubmitButton({
  children,
  pendingLabel,
  variant,
  size,
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending}>
      {pending ? (pendingLabel ?? 'Saving...') : children}
    </Button>
  );
}
