'use client';

import { useFormState } from 'react-dom';
import { saveHeroParticleStyleAction } from '@/actions/dashboard';
import { Field, Select } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { PARTICLE_STYLES } from '@/lib/particles';

export function HeroParticleForm({ value }: { value: string }) {
  const [state, formAction] = useFormState(saveHeroParticleStyleAction, null);

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
      <Field label="Default particle design" hint="Used on the default hero and as a fallback for slides.">
        <Select name="hero_particle_style" defaultValue={value}>
          {PARTICLE_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label} — {style.hint}
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton>Save particles</SubmitButton>
    </form>
  );
}
