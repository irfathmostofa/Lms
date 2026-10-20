'use client';

import { useFormState } from 'react-dom';
import { createPartnerAction, updatePartnerAction } from '@/actions/dashboard';
import { Field, Input, Select } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { ImageUpload } from '@/components/dashboard/image-upload';
import type { Partner } from '@/lib/types';

export function PartnerForm({ partner }: { partner?: Partner }) {
  const action = partner ? updatePartnerAction : createPartnerAction;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {partner ? <input type="hidden" name="id" value={partner.id} /> : null}
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
        <ImageUpload
          label="Logo"
          fileName="logo_file"
          urlName="logo_url"
          defaultUrl={partner?.logo_url ?? ''}
          maxWidth={640}
          maxHeight={320}
          previewClassName="aspect-[2/1] max-w-64 bg-white"
        />
      </div>
      <Field label="Name">
        <Input name="name" required defaultValue={partner?.name ?? ''} />
      </Field>
      <Field label="Website (optional)">
        <Input name="href" defaultValue={partner?.href ?? ''} placeholder="https://" />
      </Field>
      <Field label="Order">
        <Input name="sort_order" type="number" defaultValue={partner?.sort_order ?? 0} />
      </Field>
      <Field label="Status">
        <Select name="is_active" defaultValue={partner?.is_active === false ? 'off' : 'on'}>
          <option value="on">Published</option>
          <option value="off">Hidden</option>
        </Select>
      </Field>
      <Field label="Show on home">
        <Select name="show_on_home" defaultValue={partner?.show_on_home === false ? 'off' : 'on'}>
          <option value="on">Yes</option>
          <option value="off">No</option>
        </Select>
      </Field>
      <Field label="Show on about">
        <Select name="show_on_about" defaultValue={partner?.show_on_about === false ? 'off' : 'on'}>
          <option value="on">Yes</option>
          <option value="off">No</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel={partner ? 'Saving...' : 'Adding...'}>
          {partner ? 'Save partner' : 'Add partner'}
        </SubmitButton>
      </div>
    </form>
  );
}
