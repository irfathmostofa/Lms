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
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      name={name}
      value={value}
    >
      {pending ? (pendingLabel ?? 'Saving...') : children}
    </Button>
  );
}
