'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui';
import { Modal } from '@/components/dashboard/modal';

export function FormModal({
  title,
  description,
  triggerLabel,
  triggerVariant = 'primary',
  triggerSize = 'md',
  size = 'lg',
  children,
}: {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerVariant?: 'primary' | 'secondary' | 'outline';
  triggerSize?: 'sm' | 'md' | 'lg';
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <Modal open={open} title={title} description={description} onClose={() => setOpen(false)} size={size}>
        {children}
      </Modal>
    </>
  );
}
