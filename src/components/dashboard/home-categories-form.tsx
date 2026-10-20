'use client';

import { useFormState } from 'react-dom';
import { saveHomeCategoriesAction } from '@/actions/dashboard';
import { SubmitButton } from '@/components/dashboard/submit-button';
import type { Category } from '@/lib/types';

export function HomeCategoriesForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useFormState(saveHomeCategoriesAction, null);

  if (categories.length === 0) {
    return <p className="text-sm text-slate-500">No categories yet. Create courses categories first.</p>;
  }

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
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between gap-4 py-3">
            <input type="hidden" name="category_ids" value={category.id} />
            <div>
              <p className="text-sm font-medium text-slate-900">{category.name}</p>
              <p className="text-xs text-slate-400">{category.slug}</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name={`show_${category.id}`}
                defaultChecked={category.show_on_home !== false}
                value="on"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Show on home
            </label>
          </li>
        ))}
      </ul>

      <SubmitButton>Save category sections</SubmitButton>
    </form>
  );
}
