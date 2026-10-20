'use client';

import { useFormState } from 'react-dom';
import { createNoticeAction, updateNoticeAction } from '@/actions/dashboard';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { toDateTimeLocal } from '@/lib/utils';
import type { SiteNotice } from '@/lib/types';

export function NoticeForm({ notice }: { notice?: SiteNotice }) {
  const action = notice ? updateNoticeAction : createNoticeAction;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {notice ? <input type="hidden" name="id" value={notice.id} /> : null}
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

      <div className="sm:col-span-2">
        <Field label="Message">
          <Textarea name="message" required defaultValue={notice?.message ?? ''} placeholder="Admission is open until 30 October." />
        </Field>
      </div>
      <Field label="Link (optional)">
        <Input name="href" defaultValue={notice?.href ?? ''} placeholder="/courses" />
      </Field>
      <Field label="Order">
        <Input name="sort_order" type="number" defaultValue={notice?.sort_order ?? 0} />
      </Field>
      <Field label="Starts">
        <Input name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(notice?.starts_at)} />
      </Field>
      <Field label="Ends">
        <Input name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(notice?.ends_at)} />
      </Field>
      <Field label="Status">
        <Select name="is_active" defaultValue={notice?.is_active === false ? 'off' : 'on'}>
          <option value="on">Published</option>
          <option value="off">Hidden</option>
        </Select>
      </Field>
      <div className="flex items-end">
        <SubmitButton pendingLabel={notice ? 'Saving...' : 'Adding...'}>
          {notice ? 'Save notice' : 'Add notice'}
        </SubmitButton>
      </div>
    </form>
  );
}
