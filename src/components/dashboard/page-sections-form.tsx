'use client';

import { useFormState } from 'react-dom';
import { savePageSectionsAction } from '@/actions/dashboard';
import { SubmitButton } from '@/components/dashboard/submit-button';
import type { PageSection } from '@/lib/types';

export function PageSectionsForm({ sections }: { sections: PageSection[] }) {
  const [state, formAction] = useFormState(savePageSectionsAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <ul className="divide-y divide-slate-100">
        {sections.map((section) => (
          <li key={section.key} className="flex items-center justify-between gap-4 py-3">
            <input type="hidden" name="section_keys" value={section.key} />
            <div>
              <p className="text-sm font-medium text-slate-900">{section.label}</p>
              <p className="text-xs capitalize text-slate-400">{section.page}</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name={`enabled_${section.key}`}
                defaultChecked={section.enabled}
                value="on"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Visible
            </label>
          </li>
        ))}
      </ul>

      <SubmitButton>Save sections</SubmitButton>
    </form>
  );
}
