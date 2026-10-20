'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { CACHE_TAGS } from '@/lib/data';
import { sanitizeRichText } from '@/lib/rich-text';
import { fromDateTimeLocal, slugify, youtubeIdFromInput } from '@/lib/utils';
import { assessmentTypeConfig, resolveDelivery } from '@/lib/assessments';
import { parseQuizQuestions, quizQuestionRows, quizTotalMarks } from '@/lib/quiz';

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

function list(formData: FormData, key: string) {
  return Array.from(
    new Set(
      str(formData, key)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

async function resolveAuthorName(
  supabase: ReturnType<typeof createClient>,
  authorId: string | null,
) {
  if (!authorId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', authorId)
    .maybeSingle();
  return data?.full_name ?? data?.email ?? null;
}

async function uploadThumbnail(
  supabase: ReturnType<typeof createClient>,
  formData: FormData,
  courseId: string,
) {
  const file = formData.get('thumbnail_file');
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith('image/') || file.size > MAX_THUMBNAIL_BYTES) {
      return { error: 'image' as const, url: undefined };
    }

    const extension = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${courseId}/${Date.now()}.${extension || 'jpg'}`;
    const { error } = await supabase.storage.from('thumbnails').upload(path, file, {
      contentType: file.type,
      upsert: true,
    });
    if (error) return { error: 'upload' as const, url: undefined };

    const { data } = supabase.storage.from('thumbnails').getPublicUrl(path);
    return { error: null, url: data.publicUrl };
  }

  return { error: null, url: optional(formData, 'thumbnail_url') };
}

async function saveCoursePassword(
  supabase: ReturnType<typeof createClient>,
  formData: FormData,
  courseId: string,
) {
  const visibility = str(formData, 'visibility') || 'public';
  const password = str(formData, 'access_password');

  if (visibility === 'password') {
    if (password) {
      const { error } = await supabase.rpc('set_course_password', {
        p_course: courseId,
        p_password: password,
      });
      return error ? 'password' : null;
    }
    return null;
  }

  await supabase.rpc('set_course_password', { p_course: courseId, p_password: '' });
  return null;
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
function courseBasics(formData: FormData) {
  const visibility = str(formData, 'visibility') || 'public';
  const pricing = str(formData, 'pricing') || 'free';
  const price = pricing === 'free' ? 0 : num(formData, 'price');
  const discountPrice =
    pricing === 'paid' && str(formData, 'discount_price')
      ? num(formData, 'discount_price')
      : null;

  return {
    title: str(formData, 'title'),
    summary: optional(formData, 'summary'),
    description: optional(formData, 'description')
      ? sanitizeRichText(str(formData, 'description'))
      : null,
    category_id: optional(formData, 'category_id'),
    mode: str(formData, 'mode') || 'online',
    visibility,
    scheduled_at: optional(formData, 'scheduled_at'),
    author_id: optional(formData, 'author_id'),
    tags: list(formData, 'tags'),
    promo_video_id: optional(formData, 'promo_video_id'),
    price,
    discount_price: discountPrice,
  };
}

export async function createCourseAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const basics = courseBasics(formData);
  if (!basics.title) redirect('/dashboard/courses/new?error=title');

  const slug = str(formData, 'slug') || slugify(basics.title);
  const authorId = basics.author_id ?? ctx.userId;
  const visibility = basics.visibility;
  const password = str(formData, 'access_password');
  if (visibility === 'password' && !password) {
    redirect('/dashboard/courses/new?error=password');
  }

  const { data: course, error } = await supabase
    .from('courses')
    .insert({
      ...basics,
      slug,
      author_id: authorId,
      author_name: await resolveAuthorName(supabase, authorId),
      status: 'draft',
      created_by: ctx.userId,
    })
    .select('id')
    .single();

  if (error || !course) {
    redirect(`/dashboard/courses/new?error=${error?.code === '23505' ? 'slug' : 'save'}`);
  }

  const thumbnail = await uploadThumbnail(supabase, formData, course.id);
  if (thumbnail.url !== undefined) {
    await supabase.from('courses').update({ thumbnail_url: thumbnail.url }).eq('id', course.id);
  }

  const passwordError = await saveCoursePassword(supabase, formData, course.id);
  revalidatePath('/dashboard/courses');
  revalidatePath('/dashboard/content');

  if (thumbnail.error || passwordError) {
    redirect(
      `/dashboard/courses/${course.id}/setup?step=basic&error=${thumbnail.error ?? passwordError}`,
    );
  }

  const next = str(formData, 'next') === 'additional' ? 'additional' : 'curriculum';
  redirect(`/dashboard/courses/${course.id}/setup?step=${next}`);
}

export async function updateCourseBasicAction(formData: FormData) {
  await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return;

  const basics = courseBasics(formData);
  if (!basics.title) redirect(`/dashboard/courses/${id}/setup?step=basic&error=title`);

  const authorId = basics.author_id ?? null;
  const password = str(formData, 'access_password');
  const { data: existingAccess } = await supabase
    .from('course_access')
    .select('course_id')
    .eq('course_id', id)
    .maybeSingle();
  if (basics.visibility === 'password' && !password && !existingAccess) {
    redirect(`/dashboard/courses/${id}/setup?step=basic&error=password`);
  }

  const { error } = await supabase
    .from('courses')
    .update({
      ...basics,
      slug: str(formData, 'slug') || slugify(basics.title),
      author_id: authorId,
      author_name: await resolveAuthorName(supabase, authorId),
    })
    .eq('id', id);

  if (error) {
    redirect(
      `/dashboard/courses/${id}/setup?step=basic&error=${error.code === '23505' ? 'slug' : 'save'}`,
    );
  }

  const thumbnail = await uploadThumbnail(supabase, formData, id);
  if (thumbnail.url !== undefined) {
    await supabase.from('courses').update({ thumbnail_url: thumbnail.url }).eq('id', id);
  }

  const passwordError = await saveCoursePassword(supabase, formData, id);
  revalidatePath('/dashboard/courses');
  revalidatePath(`/dashboard/courses/${id}/setup`);
  revalidatePath('/courses', 'layout');

  if (thumbnail.error || passwordError) {
    redirect(
      `/dashboard/courses/${id}/setup?step=basic&error=${thumbnail.error ?? passwordError}`,
    );
  }

  const next = str(formData, 'next') === 'additional' ? 'additional' : 'curriculum';
  redirect(`/dashboard/courses/${id}/setup?step=${next}&saved=1`);
}

export async function updateCourseAdditionalAction(formData: FormData) {
  await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return;

  await supabase
    .from('courses')
    .update({
      learning_outcomes: optional(formData, 'learning_outcomes'),
      target_audience: optional(formData, 'target_audience'),
      duration_label: optional(formData, 'duration_label'),
      materials_included: optional(formData, 'materials_included'),
      requirements: optional(formData, 'requirements'),
    })
    .eq('id', id);

  revalidatePath(`/dashboard/courses/${id}/setup`);
  revalidatePath('/courses', 'layout');
  redirect(`/dashboard/courses/${id}/setup?step=additional&saved=1`);
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
  // 'layout' scope also refreshes the pre-rendered /courses/[slug] detail pages.
  revalidatePath('/courses', 'layout');
}

// Enrollment ----------------------------------------------------------------
function feeStatus(netAmount: number, paidAmount: number) {
  if (netAmount <= paidAmount) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'unpaid';
}

export async function createEnrollmentAction(formData: FormData) {
  const ctx = await requireRole(['admin']);
  const supabase = createClient();
  const studentId = str(formData, 'student_id');
  const courseId = str(formData, 'course_id');
  const batchId = optional(formData, 'batch_id');
  if (!studentId || !courseId) {
    redirect('/dashboard/enrollments?error=missing');
  }

  const { data: student } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', studentId)
    .maybeSingle();
  if (!student || student.role !== 'student') {
    redirect('/dashboard/enrollments?error=student');
  }

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, price, discount_price')
    .eq('id', courseId)
    .maybeSingle();
  if (!course) redirect('/dashboard/enrollments?error=course');

  if (batchId) {
    const { data: batch } = await supabase
      .from('batches')
      .select('id, course_id')
      .eq('id', batchId)
      .maybeSingle();
    if (!batch || batch.course_id !== courseId) {
      redirect('/dashboard/enrollments?error=batch');
    }
  }

  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing && !['cancelled', 'expired'].includes(existing.status)) {
    redirect('/dashboard/enrollments?error=duplicate');
  }

  const notes = optional(formData, 'notes');
  let enrollmentId: string | null = null;

  if (existing) {
    const { error } = await supabase
      .from('enrollments')
      .update({
        batch_id: batchId,
        status: 'pending',
        enrolled_by: ctx.userId,
        enrolled_at: new Date().toISOString(),
        completed_at: null,
        notes,
      })
      .eq('id', existing.id);
    if (error) redirect('/dashboard/enrollments?error=save');
    enrollmentId = existing.id;
  } else {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        batch_id: batchId,
        status: 'pending',
        enrolled_by: ctx.userId,
        notes,
      })
      .select('id')
      .single();
    if (error || !enrollment) redirect('/dashboard/enrollments?error=save');
    enrollmentId = enrollment.id;
  }

  const totalAmount = num(formData, 'total_amount', Number(course.discount_price ?? course.price));
  const discountAmount = num(formData, 'discount_amount');
  const feeFields = {
    description: str(formData, 'description') || `${course.title} fee`,
    total_amount: Math.max(0, totalAmount),
    discount_amount: Math.min(Math.max(0, discountAmount), Math.max(0, totalAmount)),
    installments: Math.max(1, num(formData, 'installments', 1)),
    due_date: optional(formData, 'due_date'),
  };

  const { data: existingFee } = await supabase
    .from('fee_records')
    .select('id, paid_amount')
    .eq('enrollment_id', enrollmentId)
    .maybeSingle();

  if (existingFee) {
    const net = feeFields.total_amount - feeFields.discount_amount;
    await supabase
      .from('fee_records')
      .update({
        ...feeFields,
        status: feeStatus(net, Number(existingFee.paid_amount)),
      })
      .eq('id', existingFee.id);
  } else {
    await supabase.from('fee_records').insert({
      enrollment_id: enrollmentId,
      student_id: studentId,
      ...feeFields,
      status: feeStatus(feeFields.total_amount - feeFields.discount_amount, 0),
    });
  }

  revalidatePath('/dashboard/enrollments');
  revalidatePath('/dashboard/my-learning');
  redirect('/dashboard/enrollments?created=1');
}

export async function updateEnrollmentStatusAction(formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const status = str(formData, 'status');
  const allowed = ['pending', 'active', 'completed', 'cancelled', 'expired'];
  if (!id || !allowed.includes(status)) return;

  await supabase
    .from('enrollments')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', id);

  revalidatePath('/dashboard/enrollments');
  revalidatePath('/dashboard/my-learning');
  revalidatePath('/dashboard');
}

export async function updateEnrollmentFeeAction(formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const feeId = str(formData, 'fee_id');
  if (!feeId) return;

  const { data: fee } = await supabase
    .from('fee_records')
    .select('id, paid_amount')
    .eq('id', feeId)
    .maybeSingle();
  if (!fee) return;

  const totalAmount = Math.max(0, num(formData, 'total_amount'));
  const discountAmount = Math.min(Math.max(0, num(formData, 'discount_amount')), totalAmount);

  await supabase
    .from('fee_records')
    .update({
      description: optional(formData, 'description'),
      total_amount: totalAmount,
      discount_amount: discountAmount,
      installments: Math.max(1, num(formData, 'installments', 1)),
      due_date: optional(formData, 'due_date'),
      status: feeStatus(totalAmount - discountAmount, Number(fee.paid_amount)),
    })
    .eq('id', feeId);

  revalidatePath('/dashboard/enrollments');
  revalidatePath('/dashboard/my-fees');
}

export async function updateEnrollmentBatchAction(formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return;
  await supabase.from('enrollments').update({ batch_id: optional(formData, 'batch_id') }).eq('id', id);
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
  revalidatePath(`/dashboard/courses/${courseId}/setup`);
}

export async function deleteSectionAction(formData: FormData) {
  await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const courseId = str(formData, 'course_id');
  if (!id) return;
  await supabase.from('course_sections').delete().eq('id', id);
  revalidatePath(`/dashboard/content/${courseId}`);
  revalidatePath(`/dashboard/courses/${courseId}/setup`);
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
    youtube_id: youtubeIdFromInput(optional(formData, 'youtube_id')) || null,
    duration_min: str(formData, 'duration_min') ? num(formData, 'duration_min') : null,
    sort_order: num(formData, 'sort_order'),
    is_preview: str(formData, 'is_preview') === 'on',
  });
  revalidatePath(`/dashboard/content/${courseId}`);
  revalidatePath(`/dashboard/courses/${courseId}/setup`);
}

export async function createCurriculumItemAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const courseId = str(formData, 'course_id');
  const sectionId = str(formData, 'section_id');
  const title = str(formData, 'title');
  const itemType = str(formData, 'item_type') || 'lesson';
  if (!courseId || !sectionId || !title) return;

  if (itemType === 'lesson') {
    const format = str(formData, 'lesson_type') || 'text';
    await supabase.from('lessons').insert({
      section_id: sectionId,
      course_id: courseId,
      title,
      type: format,
      content: optional(formData, 'content'),
      media_url: optional(formData, 'media_url'),
      youtube_id:
        format === 'youtube'
          ? youtubeIdFromInput(optional(formData, 'youtube_id')) || null
          : null,
      duration_min: str(formData, 'duration_min') ? num(formData, 'duration_min') : null,
      sort_order: num(formData, 'sort_order'),
      is_preview: str(formData, 'is_preview') === 'on',
    });
  } else if (itemType === 'quiz' || itemType === 'assignment') {
    const delivery = resolveDelivery(itemType, str(formData, 'delivery_mode'));
    const questions = itemType === 'quiz' ? parseQuizQuestions(str(formData, 'quiz_questions')) : [];
    if (itemType === 'quiz' && questions.length === 0) return;
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        course_id: courseId,
        section_id: sectionId,
        title,
        type: itemType,
        delivery_mode: delivery,
        instructions: optional(formData, 'instructions'),
        total_marks: itemType === 'quiz' ? quizTotalMarks(questions) : num(formData, 'total_marks', 100),
        pass_marks: str(formData, 'pass_marks') ? num(formData, 'pass_marks') : null,
        due_at: fromDateTimeLocal(optional(formData, 'due_at')),
        sort_order: num(formData, 'sort_order'),
        is_published: str(formData, 'is_published') === 'on',
        created_by: ctx.userId,
      })
      .select('id')
      .single();
    if (error || !data) return;
    if (itemType === 'quiz') {
      await supabase.from('quiz_questions').insert(quizQuestionRows(questions, data.id));
    }
  }

  revalidatePath(`/dashboard/content/${courseId}`);
  revalidatePath(`/dashboard/courses/${courseId}/setup`);
}

export async function deleteCurriculumItemAction(formData: FormData) {
  await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const courseId = str(formData, 'course_id');
  const kind = str(formData, 'kind');
  if (!id) return;
  if (kind === 'assessment') {
    await supabase.from('assessments').delete().eq('id', id);
  } else {
    await supabase.from('lessons').delete().eq('id', id);
  }
  revalidatePath(`/dashboard/content/${courseId}`);
  revalidatePath(`/dashboard/courses/${courseId}/setup`);
}

export async function deleteLessonAction(formData: FormData) {
  await requireRole(['admin', 'editor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const courseId = str(formData, 'course_id');
  if (!id) return;
  await supabase.from('lessons').delete().eq('id', id);
  revalidatePath(`/dashboard/content/${courseId}`);
  revalidatePath(`/dashboard/courses/${courseId}/setup`);
}

// Assessments ---------------------------------------------------------------
export async function createAssessmentAction(_prev: unknown, formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const title = str(formData, 'title');
  const type = str(formData, 'type') || 'homework';
  const config = assessmentTypeConfig(type);
  const courseId = optional(formData, 'course_id');
  const batchId = optional(formData, 'batch_id');
  const instructions = optional(formData, 'instructions');
  const dueAt = fromDateTimeLocal(optional(formData, 'due_at'));
  const delivery = resolveDelivery(type, str(formData, 'delivery_mode'));
  const questions = config.value === 'quiz' ? parseQuizQuestions(str(formData, 'quiz_questions')) : [];

  if (!title) return { error: 'Enter a title.' };
  if (!courseId && !batchId) {
    return { error: config.requireCourse ? 'Choose a course.' : 'Choose a course or a batch.' };
  }
  if (config.requireCourse && !courseId) return { error: 'This type must be assigned to a course.' };
  if (config.requireDue && !dueAt) return { error: 'Set a due date.' };
  if (config.value === 'quiz' && questions.length === 0) return { error: 'Add at least one MCQ.' };
  if (delivery === 'online' && config.studentOnlineMode !== 'mcq' && config.studentOnlineMode !== 'none' && !instructions) {
    return { error: 'Add instructions for students.' };
  }

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      title,
      course_id: courseId,
      batch_id: batchId,
      type: config.value,
      delivery_mode: delivery,
      instructions,
      total_marks: config.value === 'quiz' ? quizTotalMarks(questions) : num(formData, 'total_marks', 100),
      pass_marks: str(formData, 'pass_marks') ? num(formData, 'pass_marks') : null,
      due_at: dueAt,
      is_published: str(formData, 'is_published') === 'on',
      created_by: ctx.userId,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  if (config.value === 'quiz' && data?.id) {
    const { error: questionError } = await supabase
      .from('quiz_questions')
      .insert(quizQuestionRows(questions, data.id));
    if (questionError) return { error: questionError.message };
  }
  revalidatePath('/dashboard/assessments');
  revalidatePath('/dashboard/my-assessments');
  return { success: `${config.label} created as ${delivery}.` };
}

export async function gradeSubmissionAction(_prev: unknown, formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing submission.' };
  const { error } = await supabase
    .from('submissions')
    .update({
      marks: num(formData, 'marks'),
      feedback: optional(formData, 'feedback'),
      status: 'graded',
      graded_at: new Date().toISOString(),
      graded_by: ctx.userId,
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/assessments');
  revalidatePath(`/dashboard/assessments/${str(formData, 'assessment_id')}`);
  revalidatePath('/dashboard/my-assessments');
  return { success: 'Grade saved.' };
}

// Payments ------------------------------------------------------------------
export async function verifyPaymentAction(_prev: unknown, formData: FormData) {
  const ctx = await requireRole(['admin', 'accountant']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing payment reference.' };

  const { error } = await supabase
    .from('payments')
    .update({
      status: 'verified',
      verified_by: ctx.userId,
      verified_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/payments');
  revalidatePath('/dashboard/finance');
  revalidatePath('/dashboard');
  return { success: 'Payment verified.' };
}

export async function rejectPaymentAction(_prev: unknown, formData: FormData) {
  const ctx = await requireRole(['admin', 'accountant']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing payment reference.' };

  const { error } = await supabase
    .from('payments')
    .update({
      status: 'rejected',
      verified_by: ctx.userId,
      verified_at: new Date().toISOString(),
      notes: optional(formData, 'notes'),
    })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/payments');
  revalidatePath('/dashboard/finance');
  revalidatePath('/dashboard');
  return { success: 'Payment rejected.' };
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
  revalidateTag(CACHE_TAGS.settings);
  revalidatePath('/dashboard/settings');
}
