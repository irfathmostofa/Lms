'use client';

import { useFormState } from 'react-dom';
import { createHeroSlideAction, updateHeroSlideAction } from '@/actions/dashboard';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { ImageUpload } from '@/components/dashboard/image-upload';
import type { HeroSlide } from '@/lib/types';

export function HeroSlideForm({ slide }: { slide?: HeroSlide }) {
  const action = slide ? updateHeroSlideAction : createHeroSlideAction;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {slide ? <input type="hidden" name="id" value={slide.id} /> : null}
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
          label="Slider image"
          hint="Upload a wide image. It is compressed to 75% quality before save."
          fileName="image_file"
          defaultUrl={slide?.image_url ?? ''}
          required={!slide}
          maxWidth={1920}
          maxHeight={1080}
          previewClassName="aspect-[16/7] min-h-40"
        />
      </div>

      <Field label="Eyebrow (optional)">
        <Input name="eyebrow" defaultValue={slide?.eyebrow ?? ''} placeholder="New batch" />
      </Field>
      <Field label="Title">
        <Input name="title" required defaultValue={slide?.title ?? ''} placeholder="Build skills that open new doors." />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description (optional)">
          <Textarea name="description" defaultValue={slide?.description ?? ''} placeholder="Short supporting copy over the image." />
        </Field>
      </div>
      <Field label="Button link (optional)">
        <Input name="href" defaultValue={slide?.href ?? '/courses'} placeholder="/courses" />
      </Field>
      <Field label="Button label (optional)">
        <Input name="cta_label" defaultValue={slide?.cta_label ?? 'Explore courses'} />
      </Field>
      <Field label="Second link (optional)">
        <Input name="secondary_href" defaultValue={slide?.secondary_href ?? ''} placeholder="/register" />
      </Field>
      <Field label="Second label (optional)">
        <Input name="secondary_label" defaultValue={slide?.secondary_label ?? ''} />
      </Field>
      <Field label="Order">
        <Input name="sort_order" type="number" defaultValue={slide?.sort_order ?? 0} />
      </Field>
      <Field label="Status">
        <Select name="is_active" defaultValue={slide?.is_active === false ? 'off' : 'on'}>
          <option value="on">Published</option>
          <option value="off">Hidden</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel={slide ? 'Saving...' : 'Adding...'}>
          {slide ? 'Save slide' : 'Add slide'}
        </SubmitButton>
      </div>
    </form>
  );
}
