'use client';

import { useId, useState } from 'react';
import { Input } from '@/components/ui';

export function PasswordField({
  label,
  name,
  hint,
  autoComplete,
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  hint?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const generatedId = useId();
  const inputId = `${name}-${generatedId}`;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-600">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="rounded text-xs font-medium text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          aria-label={visible ? 'Hide password' : 'View password'}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'View'}
        </button>
      </div>
      <Input
        id={inputId}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
      />
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </div>
  );
}
