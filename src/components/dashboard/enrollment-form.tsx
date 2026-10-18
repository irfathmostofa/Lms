'use client';

import { useState } from 'react';
import { createEnrollmentAction } from '@/actions/dashboard';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';

export interface EnrollmentStudentOption {
  id: string;
  label: string;
}

export interface EnrollmentCourseOption {
  id: string;
  title: string;
  price: number;
  discount_price: number | null;
}

export interface EnrollmentBatchOption {
  id: string;
  name: string;
  course_id: string;
}

export function EnrollmentForm({
  students,
  courses,
  batches,
}: {
  students: EnrollmentStudentOption[];
  courses: EnrollmentCourseOption[];
  batches: EnrollmentBatchOption[];
}) {
  const [courseId, setCourseId] = useState('');
  const [total, setTotal] = useState('0');

  const courseBatches = batches.filter((batch) => batch.course_id === courseId);

  function onCourseChange(value: string) {
    setCourseId(value);
    const course = courses.find((item) => item.id === value);
    const defaultFee = course ? Number(course.discount_price ?? course.price) : 0;
    setTotal(String(defaultFee));
  }

  return (
    <form action={createEnrollmentAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Student">
        <Select name="student_id" required defaultValue="">
          <option value="">Select student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Course">
        <Select
          name="course_id"
          required
          value={courseId}
          onChange={(event) => onCourseChange(event.target.value)}
        >
          <option value="">Select course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Batch (optional)"
        hint={courseId ? undefined : 'Choose a course first to see its batches.'}
      >
        <Select name="batch_id" defaultValue="" disabled={!courseId}>
          <option value="">No batch</option>
          {courseBatches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Total fee (BDT)" hint="Pre-filled from the course price.">
        <Input
          name="total_amount"
          type="number"
          min="0"
          step="0.01"
          required
          value={total}
          onChange={(event) => setTotal(event.target.value)}
        />
      </Field>

      <Field label="Discount (BDT)">
        <Input name="discount_amount" type="number" min="0" step="0.01" defaultValue="0" />
      </Field>

      <Field label="Installments">
        <Input name="installments" type="number" min="1" defaultValue="1" />
      </Field>

      <Field label="Due date">
        <Input name="due_date" type="date" />
      </Field>

      <Field label="Fee description">
        <Input name="description" placeholder="Course fee" />
      </Field>

      <div className="sm:col-span-2 lg:col-span-1">
        <Field label="Notes">
          <Textarea name="notes" className="min-h-[42px]" />
        </Field>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <SubmitButton pendingLabel="Enrolling...">Enroll student</SubmitButton>
      </div>
    </form>
  );
}
