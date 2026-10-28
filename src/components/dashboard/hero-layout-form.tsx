'use client';

import { useFormState } from 'react-dom';
import { saveHeroLayoutAction } from '@/actions/dashboard';
import { Field, Select } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { HERO_LAYOUTS } from '@/lib/hero';

export function HeroLayoutForm({ value }: { value: string }) {
  const [state, formAction] = useFormState(saveHeroLayoutAction, null);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:col-span-2">
          {state.success}
        </p>
      ) : null}
      <Field
        label="Hero layout"
        hint="Choose how the homepage hero looks: photos only, text with images, or a course row."
      >
        <Select name="hero_layout" defaultValue={value}>
          {HERO_LAYOUTS.map((layout) => (
            <option key={layout.value} value={layout.value}>
              {layout.label} — {layout.hint}
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton>Save layout</SubmitButton>
    </form>
  );
}
