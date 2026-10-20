'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { gradeSubmissionAction } from '@/actions/dashboard';
import { Button, Input, Textarea } from '@/components/ui';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </Button>
  );
}

export function GradeForm({
  id,
  assessmentId,
  marks,
  feedback,
}: {
  id: string;
  assessmentId: string;
  marks: number | null;
  feedback: string | null;
}) {
  const [state, formAction] = useFormState(gradeSubmissionAction, null);

  return (
    <form action={formAction} className="w-48 space-y-2">
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-xs text-emerald-600">{state.success}</p> : null}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="assessment_id" value={assessmentId} />
      <Input
        name="marks"
        type="number"
        min="0"
        step="0.01"
        defaultValue={marks ?? ''}
        placeholder="Marks"
        required
      />
      <Textarea
        name="feedback"
        className="min-h-[40px]"
        defaultValue={feedback ?? ''}
        placeholder="Feedback"
      />
      <SaveButton />
    </form>
  );
}
