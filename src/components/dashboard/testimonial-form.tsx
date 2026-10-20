'use client';

import { useFormState } from 'react-dom';
import { createTestimonialAction, updateTestimonialAction } from '@/actions/dashboard';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { ImageUpload } from '@/components/dashboard/image-upload';
import type { Testimonial } from '@/lib/types';

export function TestimonialForm({ testimonial }: { testimonial?: Testimonial }) {
  const action = testimonial ? updateTestimonialAction : createTestimonialAction;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {testimonial ? <input type="hidden" name="id" value={testimonial.id} /> : null}
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
          label="Photo (optional)"
          fileName="avatar_file"
          urlName="avatar_url"
          defaultUrl={testimonial?.avatar_url ?? ''}
          maxWidth={400}
          maxHeight={400}
          previewClassName="aspect-square max-w-32"
        />
      </div>
      <Field label="Name">
        <Input name="name" required defaultValue={testimonial?.name ?? ''} />
      </Field>
      <Field label="Role / course">
        <Input name="role_title" defaultValue={testimonial?.role_title ?? ''} placeholder="Student, Web Development" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Review">
          <Textarea name="quote" required defaultValue={testimonial?.quote ?? ''} />
        </Field>
      </div>
      <Field label="Rating">
        <Select name="rating" defaultValue={String(testimonial?.rating ?? 5)}>
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </Select>
      </Field>
      <Field label="Order">
        <Input name="sort_order" type="number" defaultValue={testimonial?.sort_order ?? 0} />
      </Field>
      <Field label="Status">
        <Select name="is_active" defaultValue={testimonial?.is_active === false ? 'off' : 'on'}>
          <option value="on">Published</option>
          <option value="off">Hidden</option>
        </Select>
      </Field>
      <Field label="Show on home">
        <Select name="show_on_home" defaultValue={testimonial?.show_on_home === false ? 'off' : 'on'}>
          <option value="on">Yes</option>
          <option value="off">No</option>
        </Select>
      </Field>
      <Field label="Show on about">
        <Select name="show_on_about" defaultValue={testimonial?.show_on_about === false ? 'off' : 'on'}>
          <option value="on">Yes</option>
          <option value="off">No</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel={testimonial ? 'Saving...' : 'Adding...'}>
          {testimonial ? 'Save review' : 'Add review'}
        </SubmitButton>
      </div>
    </form>
  );
}
