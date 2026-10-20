'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input, Textarea } from '@/components/ui';
import { submitAssessmentAction } from '@/actions/student';
import { assessmentTypeConfig } from '@/lib/assessments';
import type { AssessmentType } from '@/lib/types';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

export function SubmissionForm({
  assessmentId,
  type,
  existingContent,
  existingFileUrl,
  readOnly,
}: {
  assessmentId: string;
  type: AssessmentType;
  existingContent?: string | null;
  existingFileUrl?: string | null;
  readOnly?: boolean;
}) {
  const [state, formAction] = useFormState(submitAssessmentAction, null);
  const config = assessmentTypeConfig(type);

  if (config.studentMode === 'in_person') {
    return (
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        This {config.label.toLowerCase()} is taken in person. You do not submit online. Marks will
        appear here after your instructor grades it.
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        {existingContent ? <p className="whitespace-pre-line">{existingContent}</p> : <p>Submitted.</p>}
        {existingFileUrl ? (
          <a
            href={existingFileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-brand-600 hover:underline"
          >
            Attachment
          </a>
        ) : null}
        <p className="mt-2 text-slate-400">This assessment is graded and can no longer be edited.</p>
      </div>
    );
  }

  const submitLabel =
    config.studentMode === 'quiz'
      ? 'Submit answers'
      : config.studentMode === 'file'
        ? 'Submit assignment'
        : 'Submit homework';

  return (
    <form action={formAction} className="space-y-3">
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-xs text-emerald-600">{state.success}</p> : null}
      <input type="hidden" name="assessment_id" value={assessmentId} />

      {config.studentMode === 'quiz' ? (
        <Field label="Your answers" hint="Number your answers to match the questions.">
          <Textarea
            name="content"
            required
            defaultValue={existingContent ?? ''}
            className="min-h-[120px]"
            placeholder={'1. ...\n2. ...'}
          />
        </Field>
      ) : null}

      {config.studentMode === 'text_file' ? (
        <Field label="Your answer">
          <Textarea
            name="content"
            required
            defaultValue={existingContent ?? ''}
            className="min-h-[80px]"
          />
        </Field>
      ) : null}

      {config.studentMode === 'file' ? (
        <Field label="Notes (optional)">
          <Textarea name="content" defaultValue={existingContent ?? ''} className="min-h-[60px]" />
        </Field>
      ) : null}

      {config.studentMode === 'file' || config.studentMode === 'text_file' ? (
        <Field
          label={config.studentMode === 'file' ? 'Work file URL' : 'Attachment URL (optional)'}
        >
          <Input
            name="file_url"
            type="url"
            required={config.studentMode === 'file'}
            defaultValue={existingFileUrl ?? ''}
            placeholder="https://..."
          />
        </Field>
      ) : null}

      <Submit label={submitLabel} />
    </form>
  );
}
