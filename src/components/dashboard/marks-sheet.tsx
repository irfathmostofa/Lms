'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveMarksSheetAction } from '@/actions/dashboard';
import { Badge, Button, Input, Textarea } from '@/components/ui';

export interface MarksStudent {
  studentId: string;
  name: string;
  email: string | null;
  content: string | null;
  fileUrl: string | null;
  submittedAt: string | null;
  status: string | null;
  marks: number | null;
  feedback: string | null;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving marks...' : 'Save all marks'}
    </Button>
  );
}

export function MarksSheet({
  assessmentId,
  totalMarks,
  students,
}: {
  assessmentId: string;
  totalMarks: number;
  students: MarksStudent[];
}) {
  const [state, formAction] = useFormState(saveMarksSheetAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="assessment_id" value={assessmentId} />
      {students.map((student) => (
        <input key={student.studentId} type="hidden" name="student_ids" value={student.studentId} />
      ))}

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Work</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Marks / {totalMarks}</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr key={student.studentId} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{student.name}</p>
                  {student.email ? <p className="text-xs text-slate-500">{student.email}</p> : null}
                </td>
                <td className="max-w-xs px-4 py-3">
                  <p className="line-clamp-3 text-xs text-slate-600">{student.content ?? '-'}</p>
                  {student.fileUrl ? (
                    <a
                      href={student.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Attachment
                    </a>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      student.status === 'graded' ? 'green' : student.status === 'submitted' ? 'amber' : 'slate'
                    }
                  >
                    {student.status ?? 'not marked'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Input
                    name={`marks_${student.studentId}`}
                    type="number"
                    min="0"
                    max={totalMarks}
                    step="0.01"
                    defaultValue={student.marks ?? ''}
                    placeholder="Marks"
                    className="w-28"
                  />
                </td>
                <td className="px-4 py-3">
                  <Textarea
                    name={`remarks_${student.studentId}`}
                    className="min-h-[48px] min-w-[12rem]"
                    defaultValue={student.feedback ?? ''}
                    placeholder="Remarks"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-4">
        <p className="text-xs text-slate-500">{students.length} assigned students. Marks stay editable after save.</p>
        <SaveButton />
      </div>
    </form>
  );
}
