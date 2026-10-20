'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveAttendanceSheetAction } from '@/actions/dashboard';
import { Button, Select, Textarea } from '@/components/ui';

export interface AttendanceStudent {
  studentId: string;
  name: string;
  email: string | null;
  status: string | null;
  remarks: string | null;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving attendance...' : 'Save attendance'}
    </Button>
  );
}

export function AttendanceSheet({
  sessionId,
  batchId,
  students,
}: {
  sessionId: string;
  batchId: string;
  students: AttendanceStudent[];
}) {
  const [state, formAction] = useFormState(saveAttendanceSheetAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="batch_id" value={batchId} />
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
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr key={student.studentId}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{student.name}</p>
                  {student.email ? <p className="text-xs text-slate-500">{student.email}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <Select name={`status_${student.studentId}`} defaultValue={student.status ?? 'absent'} className="w-36">
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                    <option value="absent">Absent</option>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Textarea
                    name={`remarks_${student.studentId}`}
                    className="min-h-[48px] min-w-[12rem]"
                    defaultValue={student.remarks ?? ''}
                    placeholder="Optional note"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-4">
        <p className="text-xs text-slate-500">{students.length} enrolled students. Unmarked students default to absent.</p>
        <SaveButton />
      </div>
    </form>
  );
}
