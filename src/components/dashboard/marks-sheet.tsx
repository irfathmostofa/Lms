'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveMarksSheetAction } from '@/actions/dashboard';
import { Badge, Button, Input, Select, Textarea } from '@/components/ui';
import type { AssessmentType } from '@/lib/types';

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

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

function statusTone(status: string | null): 'green' | 'amber' | 'slate' | 'red' {
  if (status === 'graded' || status === 'submitted') return status === 'graded' ? 'green' : 'amber';
  if (status === 'missing') return 'red';
  return 'slate';
}

export function MarksSheet({
  assessmentId,
  assessmentType,
  totalMarks,
  students,
}: {
  assessmentId: string;
  assessmentType: AssessmentType;
  totalMarks: number;
  students: MarksStudent[];
}) {
  const [state, formAction] = useFormState(saveMarksSheetAction, null);
  const isHomework = assessmentType === 'homework';
  const isQuiz = assessmentType === 'quiz';
  const takesMarks = assessmentType === 'assignment' || assessmentType === 'exam' || assessmentType === 'class_test';
  const saveLabel = isHomework ? 'Save submission status' : isQuiz ? 'Save remarks' : 'Save all marks';
  const hint = isHomework
    ? 'Mark each student submitted or not submitted. Homework does not take marks.'
    : isQuiz
      ? 'Quiz marks come from the student attempt. Add remarks only.'
      : `${students.length} assigned students. Marks stay editable after save.`;

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
              {isHomework ? <th className="px-4 py-3 font-medium">Submitted</th> : null}
              {takesMarks ? <th className="px-4 py-3 font-medium">Marks / {totalMarks}</th> : null}
              {isQuiz ? <th className="px-4 py-3 font-medium">Score / {totalMarks}</th> : null}
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
                  <Badge tone={statusTone(student.status)}>{student.status ?? 'not marked'}</Badge>
                </td>
                {isHomework ? (
                  <td className="px-4 py-3">
                    <Select
                      name={`completion_${student.studentId}`}
                      defaultValue={student.status === 'submitted' || student.status === 'graded' ? 'submitted' : 'missing'}
                      className="w-40"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="missing">Not submitted</option>
                    </Select>
                  </td>
                ) : null}
                {takesMarks ? (
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
                ) : null}
                {isQuiz ? (
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {student.marks == null ? 'Not attempted' : `${student.marks} / ${totalMarks}`}
                    </p>
                  </td>
                ) : null}
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
        <p className="text-xs text-slate-500">{hint}</p>
        <SaveButton label={saveLabel} />
      </div>
    </form>
  );
}
