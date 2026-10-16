'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input, Textarea } from '@/components/ui';
import { submitAssessmentAction } from '@/actions/student';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving...' : 'Submit'}
    </Button>
  );
}

export function SubmissionForm({
  assessmentId,
  existingContent,
  existingFileUrl,
  readOnly,
}: {
  assessmentId: string;
  existingContent?: string | null;
  existingFileUrl?: string | null;
  readOnly?: boolean;
}) {
  const [state, formAction] = useFormState(submitAssessmentAction, null);

  if (readOnly) {
    return (
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        <p className="whitespace-pre-line">{existingContent ?? 'Submitted.'}</p>
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

  return (
    <form action={formAction} className="space-y-2">
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-xs text-emerald-600">{state.success}</p> : null}
      <input type="hidden" name="assessment_id" value={assessmentId} />
      <Field label="Your answer">
        <Textarea name="content" defaultValue={existingContent ?? ''} className="min-h-[60px]" />
      </Field>
      <Field label="Attachment URL">
        <Input name="file_url" defaultValue={existingFileUrl ?? ''} placeholder="https://..." />
      </Field>
      <Submit />
    </form>
  );
}
