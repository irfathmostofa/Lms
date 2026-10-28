'use client';

import { useFormState } from 'react-dom';
import { createHeroSlideAction, updateHeroSlideAction } from '@/actions/dashboard';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { ImageUpload } from '@/components/dashboard/image-upload';
import { PARTICLE_STYLES } from '@/lib/particles';
import type { HeroSlide } from '@/lib/types';

export type HeroCourseOption = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  summary: string | null;
};

export function HeroSlideForm({
  slide,
  courses,
}: {
  slide?: HeroSlide;
  courses: HeroCourseOption[];
}) {
  const action = slide ? updateHeroSlideAction : createHeroSlideAction;
  const [state, formAction] = useFormState(action, null);
  const previewUrl = slide?.course?.thumbnail_url || slide?.image_url || '';

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
        <Field
          label="Featured course"
          hint="The homepage slider shows this course image. Only courses with a thumbnail appear."
        >
          <Select name="course_id" defaultValue={slide?.course_id ?? ''} required={courses.length > 0}>
            <option value="">{courses.length > 0 ? 'Select a course' : 'No published courses yet'}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
                {course.thumbnail_url ? '' : ' (no image)'}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Particle animation" hint="Background motion over the course image.">
          <Select name="particle_style" defaultValue={slide?.particle_style ?? 'orbs'}>
            {PARTICLE_STYLES.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="sm:col-span-2">
        <ImageUpload
          label="Override image (optional)"
          hint="Leave empty to use the course thumbnail. Upload only if you want a different hero crop."
          fileName="image_file"
          defaultUrl={previewUrl}
          required={false}
          maxWidth={1920}
          maxHeight={1080}
          previewClassName="aspect-[16/7] min-h-40"
        />
      </div>

      <Field label="Eyebrow (optional)">
        <Input name="eyebrow" defaultValue={slide?.eyebrow ?? ''} placeholder="Featured course" />
      </Field>
      <Field label="Title override (optional)">
        <Input name="title" defaultValue={slide?.title ?? ''} placeholder="Uses the course title if empty" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description override (optional)">
          <Textarea
            name="description"
            defaultValue={slide?.description ?? ''}
            placeholder="Uses the course summary if empty."
          />
        </Field>
      </div>
      <Field label="Button link (optional)">
        <Input name="href" defaultValue={slide?.href ?? ''} placeholder="Uses the course page if empty" />
      </Field>
      <Field label="Button label (optional)">
        <Input name="cta_label" defaultValue={slide?.cta_label ?? 'View course'} />
      </Field>
      <Field label="Second link (optional)">
        <Input name="secondary_href" defaultValue={slide?.secondary_href ?? '/courses'} placeholder="/courses" />
      </Field>
      <Field label="Second label (optional)">
        <Input name="secondary_label" defaultValue={slide?.secondary_label ?? 'Browse all courses'} />
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
          {slide ? 'Save featured course' : 'Add featured course'}
        </SubmitButton>
      </div>
    </form>
  );
}
