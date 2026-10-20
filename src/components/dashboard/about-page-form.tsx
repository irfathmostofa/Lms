'use client';

import { useFormState } from 'react-dom';
import { saveAboutPageAction } from '@/actions/dashboard';
import { Field, Input, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { ImageUpload } from '@/components/dashboard/image-upload';
import type { AboutPage } from '@/lib/types';

export function AboutPageForm({ about }: { about: AboutPage | null }) {
  const [state, formAction] = useFormState(saveAboutPageAction, null);

  return (
    <form action={formAction} className="space-y-8">
      {about ? <input type="hidden" name="id" value={about.id} /> : null}
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Intro</h3>
        </div>
        <Field label="Intro title">
          <Input name="intro_title" defaultValue={about?.intro_title ?? ''} />
        </Field>
        <Field label="Intro Lottie URL (optional)">
          <Input name="intro_lottie_url" defaultValue={about?.intro_lottie_url ?? ''} placeholder="https://..." />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Intro body">
            <Textarea name="intro_body" defaultValue={about?.intro_body ?? ''} className="min-h-28" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <ImageUpload
            label="Intro image"
            fileName="intro_image_file"
            urlName="intro_image_url"
            defaultUrl={about?.intro_image_url ?? ''}
            maxWidth={1600}
            maxHeight={1200}
            previewClassName="aspect-[16/9] min-h-40"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Mission</h3>
        </div>
        <Field label="Mission title">
          <Input name="mission_title" defaultValue={about?.mission_title ?? 'Our mission'} />
        </Field>
        <Field label="Mission Lottie URL (optional)">
          <Input name="mission_lottie_url" defaultValue={about?.mission_lottie_url ?? ''} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Mission body">
            <Textarea name="mission_body" defaultValue={about?.mission_body ?? ''} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <ImageUpload
            label="Mission image"
            fileName="mission_image_file"
            urlName="mission_image_url"
            defaultUrl={about?.mission_image_url ?? ''}
            maxWidth={1200}
            maxHeight={900}
            previewClassName="aspect-[4/3] min-h-36"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Vision</h3>
        </div>
        <Field label="Vision title">
          <Input name="vision_title" defaultValue={about?.vision_title ?? 'Our vision'} />
        </Field>
        <Field label="Vision Lottie URL (optional)">
          <Input name="vision_lottie_url" defaultValue={about?.vision_lottie_url ?? ''} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Vision body">
            <Textarea name="vision_body" defaultValue={about?.vision_body ?? ''} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <ImageUpload
            label="Vision image"
            fileName="vision_image_file"
            urlName="vision_image_url"
            defaultUrl={about?.vision_image_url ?? ''}
            maxWidth={1200}
            maxHeight={900}
            previewClassName="aspect-[4/3] min-h-36"
          />
        </div>
      </div>

      <SubmitButton pendingLabel="Saving...">Save about page</SubmitButton>
    </form>
  );
}
