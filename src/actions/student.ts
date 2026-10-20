'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { assessmentTypeConfig } from '@/lib/assessments';

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function num(formData: FormData, key: string, fallback = 0) {
  const value = Number(str(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

export async function submitManualPaymentAction(_prev: unknown, formData: FormData) {
  const ctx = await requireUser();
  const supabase = createClient();

  const amount = num(formData, 'amount');
  const method = str(formData, 'method');
  const trxId = str(formData, 'trx_id');

  if (amount <= 0) return { error: 'Enter the amount you paid.' };
  if (!method) return { error: 'Select a payment method.' };
  if (!trxId) return { error: 'Transaction ID is required.' };

  const enrollmentId = str(formData, 'enrollment_id') || null;
  const orderId = str(formData, 'order_id') || null;

  const { error } = await supabase.from('payments').insert({
    student_id: ctx.userId,
    enrollment_id: enrollmentId,
    order_id: orderId,
    purpose: enrollmentId ? 'course' : orderId ? 'store' : 'other',
    gateway: 'manual',
    method,
    amount,
    trx_id: trxId,
    sender_number: str(formData, 'sender_number') || null,
    screenshot_url: str(formData, 'screenshot_url') || null,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'This transaction ID has already been submitted.' };
    }
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-fees');
  revalidatePath('/dashboard/store');
  return { success: 'Payment submitted. It will appear once an admin verifies it.' };
}

export async function submitAssessmentAction(_prev: unknown, formData: FormData) {
  const ctx = await requireUser();
  const supabase = createClient();
  const assessmentId = str(formData, 'assessment_id');
  if (!assessmentId) return { error: 'Missing assessment.' };

  const { data: assessment, error: loadError } = await supabase
    .from('assessments')
    .select('id, type, is_published')
    .eq('id', assessmentId)
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!assessment?.is_published) return { error: 'This assessment is not available.' };

  const config = assessmentTypeConfig(assessment.type);
  if (config.studentMode === 'in_person') {
    return { error: `${config.label} is taken in person. You cannot submit online.` };
  }

  const content = str(formData, 'content') || null;
  const fileUrl = str(formData, 'file_url') || null;
  if (config.studentMode === 'quiz' && !content) return { error: 'Enter your answers.' };
  if (config.studentMode === 'text_file' && !content) return { error: 'Enter your answer.' };
  if (config.studentMode === 'file' && !fileUrl) return { error: 'Add a file URL for this assignment.' };

  const { error } = await supabase.from('submissions').upsert(
    {
      assessment_id: assessmentId,
      student_id: ctx.userId,
      content,
      file_url: fileUrl,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'assessment_id,student_id' },
  );

  if (error) return { error: error.message };
  revalidatePath('/dashboard/my-assessments');
  return { success: 'Submission saved.' };
}

export async function toggleLessonProgressAction(formData: FormData) {
  const ctx = await requireUser();
  const supabase = createClient();
  const lessonId = str(formData, 'lesson_id');
  const courseId = str(formData, 'course_id');
  const completed = str(formData, 'completed') === 'true';
  if (!lessonId || !courseId) return;

  await supabase.from('lesson_progress').upsert(
    {
      lesson_id: lessonId,
      student_id: ctx.userId,
      course_id: courseId,
      is_completed: !completed,
      completed_at: !completed ? new Date().toISOString() : null,
    },
    { onConflict: 'lesson_id,student_id' },
  );

  revalidatePath(`/dashboard/my-learning/${courseId}`);
}

export async function placeOrderAction(_prev: unknown, formData: FormData) {
  await requireUser();
  const supabase = createClient();

  const productIds = formData.getAll('product_id').map(String).filter(Boolean);
  const items = productIds.map((productId) => ({ product_id: productId, quantity: 1 }));

  if (items.length === 0) return { error: 'Your cart is empty.' };

  const { error } = await supabase.rpc('place_order', { p_items: items });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/store');
  return { success: 'Order placed. Complete payment to unlock your items.' };
}

export async function updateProfileAction(formData: FormData) {
  const ctx = await requireUser();
  const supabase = createClient();
  await supabase
    .from('profiles')
    .update({
      full_name: str(formData, 'full_name') || null,
      phone: str(formData, 'phone') || null,
      bio: str(formData, 'bio') || null,
    })
    .eq('id', ctx.userId);
  revalidatePath('/dashboard/profile');
}
