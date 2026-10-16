'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { slugify } from '@/lib/utils';

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function num(formData: FormData, key: string, fallback = 0) {
  const value = Number(str(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function optional(formData: FormData, key: string) {
  const value = str(formData, key);
  return value === '' ? null : value;
}

// Users ---------------------------------------------------------------------
export async function updateUserRoleAction(formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const role = str(formData, 'role');
  if (!id || !role) return;
  await supabase.from('profiles').update({ role }).eq('id', id);
  revalidatePath('/dashboard/users');
}

export async function toggleUserActiveAction(formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const active = str(formData, 'is_active') === 'true';
  if (!id) return;
  await supabase.from('profiles').update({ is_active: !active }).eq('id', id);
  revalidatePath('/dashboard/users');
}

// Catalog -------------------------------------------------------------------
export async function createCourseAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const title = str(formData, 'title');
  if (!title) return;
  const slug = str(formData, 'slug') || slugify(title);

  await supabase.from('courses').insert({
    title,
    slug,
    summary: optional(formData, 'summary'),
    description: optional(formData, 'description'),
    category_id: optional(formData, 'category_id'),
    mode: str(formData, 'mode') || 'online',
    level: optional(formData, 'level'),
    price: num(formData, 'price'),
    discount_price: str(formData, 'discount_price') ? num(formData, 'discount_price') : null,
    duration_hours: str(formData, 'duration_hours') ? num(formData, 'duration_hours') : null,
    status: 'draft',
    created_by: ctx.userId,
  });

  revalidatePath('/dashboard/courses');
  revalidatePath('/dashboard/content');
}

export async function setCourseStatusAction(formData: FormData) {
  await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const status = str(formData, 'status');
  if (!id || !status) return;
  await supabase.from('courses').update({ status }).eq('id', id);
  revalidatePath('/dashboard/courses');
  revalidatePath('/dashboard/content');
  revalidatePath('/courses');
}

// Enrollment ----------------------------------------------------------------
export async function createEnrollmentAction(formData: FormData) {
  const ctx = await requireRole(['admin']);
  const supabase = createClient();
  const studentId = str(formData, 'student_id');
  const courseId = str(formData, 'course_id');
  if (!studentId || !courseId) return;

  const { data: enrollment } = await supabase
    .from('enrollments')
    .insert({
      student_id: studentId,
      course_id: courseId,
      batch_id: optional(formData, 'batch_id'),
      status: 'pending',
      enrolled_by: ctx.userId,
      notes: optional(formData, 'notes'),
    })
    .select('id')
    .single();

  if (enrollment) {
    await supabase.from('fee_records').insert({
      enrollment_id: enrollment.id,
      student_id: studentId,
      description: str(formData, 'description') || 'Course fee',
      total_amount: num(formData, 'total_amount'),
      discount_amount: num(formData, 'discount_amount'),
      installments: Math.max(1, num(formData, 'installments', 1)),
      due_date: optional(formData, 'due_date'),
    });
  }

  revalidatePath('/dashboard/enrollments');
}

export async function createBatchAction(formData: FormData) {
  await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const courseId = str(formData, 'course_id');
  const name = str(formData, 'name');
  if (!courseId || !name) return;

  await supabase.from('batches').insert({
    course_id: courseId,
    name,
    venue: optional(formData, 'venue'),
    schedule: optional(formData, 'schedule'),
    start_date: optional(formData, 'start_date'),
    end_date: optional(formData, 'end_date'),
    capacity: str(formData, 'capacity') ? num(formData, 'capacity') : null,
    instructor_id: optional(formData, 'instructor_id'),
  });

  revalidatePath('/dashboard/batches');
}

export async function createSessionAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const batchId = str(formData, 'batch_id');
  const sessionDate = str(formData, 'session_date');
  if (!batchId || !sessionDate) return;

  await supabase.from('class_sessions').insert({
    batch_id: batchId,
    title: optional(formData, 'title'),
    session_date: sessionDate,
    start_time: optional(formData, 'start_time'),
    end_time: optional(formData, 'end_time'),
    venue: optional(formData, 'venue'),
    notes: optional(formData, 'notes'),
    status: 'scheduled',
    created_by: ctx.userId,
  });

  revalidatePath('/dashboard/batches');
}

export async function markAttendanceAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const sessionId = str(formData, 'session_id');
  const studentId = str(formData, 'student_id');
  const status = str(formData, 'status');
  if (!sessionId || !studentId || !status) return;

  await supabase.from('attendance').upsert(
    {
      session_id: sessionId,
      student_id: studentId,
      status,
      marked_by: ctx.userId,
    },
    { onConflict: 'session_id,student_id' },
  );

  revalidatePath('/dashboard/batches');
}

// Curriculum ----------------------------------------------------------------
export async function createSectionAction(formData: FormData) {
  await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const courseId = str(formData, 'course_id');
  const title = str(formData, 'title');
  if (!courseId || !title) return;
  await supabase.from('course_sections').insert({
    course_id: courseId,
    title,
    summary: optional(formData, 'summary'),
    sort_order: num(formData, 'sort_order'),
    is_free: str(formData, 'is_free') === 'on',
  });
  revalidatePath(`/dashboard/content/${courseId}`);
}

export async function createLessonAction(formData: FormData) {
  await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const sectionId = str(formData, 'section_id');
  const courseId = str(formData, 'course_id');
  const title = str(formData, 'title');
  if (!sectionId || !courseId || !title) return;
  await supabase.from('lessons').insert({
    section_id: sectionId,
    course_id: courseId,
    title,
    type: str(formData, 'type') || 'text',
    content: optional(formData, 'content'),
    media_url: optional(formData, 'media_url'),
    youtube_id: optional(formData, 'youtube_id'),
    duration_min: str(formData, 'duration_min') ? num(formData, 'duration_min') : null,
    sort_order: num(formData, 'sort_order'),
    is_preview: str(formData, 'is_preview') === 'on',
  });
  revalidatePath(`/dashboard/content/${courseId}`);
}

export async function deleteLessonAction(formData: FormData) {
  await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const courseId = str(formData, 'course_id');
  if (!id) return;
  await supabase.from('lessons').delete().eq('id', id);
  revalidatePath(`/dashboard/content/${courseId}`);
}

// Assessments ---------------------------------------------------------------
export async function createAssessmentAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const title = str(formData, 'title');
  const courseId = optional(formData, 'course_id');
  const batchId = optional(formData, 'batch_id');
  if (!title || (!courseId && !batchId)) return;

  await supabase.from('assessments').insert({
    title,
    course_id: courseId,
    batch_id: batchId,
    type: str(formData, 'type') || 'homework',
    instructions: optional(formData, 'instructions'),
    total_marks: num(formData, 'total_marks', 100),
    pass_marks: str(formData, 'pass_marks') ? num(formData, 'pass_marks') : null,
    due_at: optional(formData, 'due_at'),
    is_published: str(formData, 'is_published') === 'on',
    created_by: ctx.userId,
  });

  revalidatePath('/dashboard/assessments');
}

export async function gradeSubmissionAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return;
  await supabase
    .from('submissions')
    .update({
      marks: num(formData, 'marks'),
      feedback: optional(formData, 'feedback'),
      status: 'graded',
      graded_at: new Date().toISOString(),
      graded_by: ctx.userId,
    })
    .eq('id', id);
  revalidatePath('/dashboard/assessments');
}

// Payments ------------------------------------------------------------------
export async function verifyPaymentAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'accountant']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return;
  await supabase
    .from('payments')
    .update({
      status: 'verified',
      verified_by: ctx.userId,
      verified_at: new Date().toISOString(),
    })
    .eq('id', id);
  revalidatePath('/dashboard/payments');
  revalidatePath('/dashboard/finance');
}

export async function rejectPaymentAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'accountant']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return;
  await supabase
    .from('payments')
    .update({
      status: 'rejected',
      verified_by: ctx.userId,
      verified_at: new Date().toISOString(),
      notes: optional(formData, 'notes'),
    })
    .eq('id', id);
  revalidatePath('/dashboard/payments');
}

// Finance -------------------------------------------------------------------
export async function createExpenseAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'accountant']);
  const supabase = createClient();
  const title = str(formData, 'title');
  if (!title) return;
  await supabase.from('expenses').insert({
    title,
    amount: num(formData, 'amount'),
    category_id: optional(formData, 'category_id'),
    course_id: optional(formData, 'course_id'),
    expense_date: str(formData, 'expense_date') || new Date().toISOString().slice(0, 10),
    paid_to: optional(formData, 'paid_to'),
    method: optional(formData, 'method'),
    notes: optional(formData, 'notes'),
    created_by: ctx.userId,
  });
  revalidatePath('/dashboard/finance');
}

export async function createManualIncomeAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'accountant']);
  const supabase = createClient();
  const title = str(formData, 'title');
  if (!title) return;
  await supabase.from('manual_incomes').insert({
    title,
    amount: num(formData, 'amount'),
    category_id: optional(formData, 'category_id'),
    course_id: optional(formData, 'course_id'),
    income_date: str(formData, 'income_date') || new Date().toISOString().slice(0, 10),
    source: optional(formData, 'source'),
    notes: optional(formData, 'notes'),
    created_by: ctx.userId,
  });
  revalidatePath('/dashboard/finance');
}

// Store ---------------------------------------------------------------------
export async function createProductAction(formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const name = str(formData, 'name');
  if (!name) return;
  await supabase.from('products').insert({
    name,
    slug: str(formData, 'slug') || slugify(name),
    type: str(formData, 'type') || 'digital',
    description: optional(formData, 'description'),
    price: num(formData, 'price'),
    stock: num(formData, 'stock'),
    is_active: true,
  });
  revalidatePath('/dashboard/store');
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const status = str(formData, 'status');
  if (!id || !status) return;
  await supabase.from('orders').update({ status }).eq('id', id);
  revalidatePath('/dashboard/orders');
}

// Settings ------------------------------------------------------------------
export async function updateSettingAction(formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const key = str(formData, 'key');
  if (!key) return;
  await supabase.from('settings').update({ value: str(formData, 'value') }).eq('key', key);
  revalidatePath('/dashboard/settings');
}
