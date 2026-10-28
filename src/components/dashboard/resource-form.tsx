'use client';

import { useFormState } from 'react-dom';
import { createProductAction, updateProductAction } from '@/actions/dashboard';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { ImageUpload } from '@/components/dashboard/image-upload';
import type { Product } from '@/lib/types';

export function ResourceForm({
  product,
  fileUrl = '',
}: {
  product?: Product;
  fileUrl?: string;
}) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
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
          label="Cover image"
          fileName="thumbnail_file"
          urlName="thumbnail_url"
          defaultUrl={product?.thumbnail_url ?? ''}
          maxWidth={1280}
          maxHeight={720}
        />
      </div>
      <Field label="Name">
        <Input name="name" required defaultValue={product?.name ?? ''} placeholder="IELTS writing workbook" />
      </Field>
      <Field label="Slug" hint="Leave blank to generate from the name.">
        <Input name="slug" defaultValue={product?.slug ?? ''} placeholder="ielts-writing-workbook" />
      </Field>
      <Field label="Type">
        <Select name="type" defaultValue={product?.type ?? 'digital'}>
          <option value="digital">Digital PDF</option>
          <option value="physical">Printed book / tool</option>
        </Select>
      </Field>
      <Field label="Price (BDT)">
        <Input name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? 0} />
      </Field>
      <Field label="Stock" hint="Used for printed books.">
        <Input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} />
      </Field>
      <Field label="Status">
        <Select name="is_active" defaultValue={product?.is_active === false ? 'off' : 'on'}>
          <option value="on">Published</option>
          <option value="off">Hidden</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description">
          <Textarea
            name="description"
            defaultValue={product?.description ?? ''}
            placeholder="What this resource includes and who it is for."
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Download URL" hint="Optional. For digital PDFs after verified payment.">
          <Input name="file_url" defaultValue={fileUrl} placeholder="https://" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel={product ? 'Saving...' : 'Adding...'}>
          {product ? 'Save resource' : 'Add resource'}
        </SubmitButton>
      </div>
    </form>
  );
}
