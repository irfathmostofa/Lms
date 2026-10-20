'use client';

import { useFormState } from 'react-dom';
import { createTeamMemberAction, updateTeamMemberAction } from '@/actions/dashboard';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { ImageUpload } from '@/components/dashboard/image-upload';
import type { TeamMember } from '@/lib/types';

export function TeamMemberForm({ member }: { member?: TeamMember }) {
  const action = member ? updateTeamMemberAction : createTeamMemberAction;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {member ? <input type="hidden" name="id" value={member.id} /> : null}
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
          label="Photo"
          fileName="image_file"
          urlName="image_url"
          defaultUrl={member?.image_url ?? ''}
          maxWidth={800}
          maxHeight={800}
          previewClassName="aspect-square max-w-48"
        />
      </div>
      <Field label="Name">
        <Input name="name" required defaultValue={member?.name ?? ''} />
      </Field>
      <Field label="Role">
        <Input name="role_title" defaultValue={member?.role_title ?? ''} placeholder="Lead instructor" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Bio (optional)">
          <Textarea name="bio" defaultValue={member?.bio ?? ''} />
        </Field>
      </div>
      <Field label="Order">
        <Input name="sort_order" type="number" defaultValue={member?.sort_order ?? 0} />
      </Field>
      <Field label="Status">
        <Select name="is_active" defaultValue={member?.is_active === false ? 'off' : 'on'}>
          <option value="on">Published</option>
          <option value="off">Hidden</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel={member ? 'Saving...' : 'Adding...'}>
          {member ? 'Save member' : 'Add member'}
        </SubmitButton>
      </div>
    </form>
  );
}
