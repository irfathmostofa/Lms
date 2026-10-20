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
import { MAX_IMAGE_BYTES } from '@/lib/image';
import { findRoomConflict, normalizeTime, type RoomBooking } from '@/lib/rooms';

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

function isUploadableImage(file: File) {
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return false;
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

async function uploadPublicImage(
  supabase: ReturnType<typeof createClient>,
  file: File,
  folder: string,
) {
  if (!isUploadableImage(file)) {
    return { error: 'image' as const, url: undefined };
  }

  const extension = (file.name.split('.').pop() ?? 'webp').toLowerCase().replace(/[^a-z0-9]/g, '') || 'webp';
  const contentType = file.type || (extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`);
  const path = `${folder}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from('thumbnails').upload(path, file, {
    contentType,
    upsert: true,
  });
  if (error) return { error: 'upload' as const, url: undefined, message: error.message };

  const { data } = supabase.storage.from('thumbnails').getPublicUrl(path);
  return { error: null, url: data.publicUrl };
}

function imageUploadError(uploaded: { error?: string | null; message?: string }) {
  if (uploaded.error === 'image') return 'Use a JPG, PNG, WebP or GIF image up to 5 MB.';
  return uploaded.message || 'The image could not be uploaded.';
}

async function uploadThumbnail(
  supabase: ReturnType<typeof createClient>,
  formData: FormData,
  courseId: string,
) {
  const file = formData.get('thumbnail_file');
  if (file instanceof File && file.size > 0) {
    return uploadPublicImage(supabase, file, `courses/${courseId}`);
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

async function roomDetails(supabase: ReturnType<typeof createClient>, roomId: string | null) {
  if (!roomId) return null;
  const { data } = await supabase
    .from('rooms')
    .select('id, name, location, is_active')
    .eq('id', roomId)
    .maybeSingle();
  return data as { id: string; name: string; location: string | null; is_active: boolean } | null;
}

function roomVenue(room: { name: string; location: string | null } | null) {
  if (!room) return null;
  return [room.name, room.location].filter(Boolean).join(' · ');
}

export async function createBatchAction(formData: FormData) {
  await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const courseId = str(formData, 'course_id');
  const name = str(formData, 'name');
  if (!courseId || !name) return;

  const roomId = optional(formData, 'room_id');
  const room = await roomDetails(supabase, roomId);

  await supabase.from('batches').insert({
    course_id: courseId,
    name,
    room_id: room?.id ?? null,
    venue: roomVenue(room) ?? optional(formData, 'venue'),
    schedule: optional(formData, 'schedule'),
    start_date: optional(formData, 'start_date'),
    end_date: optional(formData, 'end_date'),
    capacity: str(formData, 'capacity') ? num(formData, 'capacity') : null,
    instructor_id: optional(formData, 'instructor_id'),
  });

  revalidatePath('/dashboard/batches');
}

export async function createSessionAction(_prev: unknown, formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const batchId = str(formData, 'batch_id');
  const sessionDate = str(formData, 'session_date');
  if (!batchId || !sessionDate) return { error: 'Pick a batch and date.' };

  const startTime = normalizeTime(optional(formData, 'start_time'));
  const endTime = normalizeTime(optional(formData, 'end_time'));
  if ((startTime && !endTime) || (!startTime && endTime)) {
    return { error: 'Enter both start and end time.' };
  }
  if (startTime && endTime && startTime >= endTime) {
    return { error: 'End time must be after start time.' };
  }

  const roomId = optional(formData, 'room_id');
  const room = await roomDetails(supabase, roomId);
  if (roomId && !room) return { error: 'Choose a valid classroom.' };
  if (room && !room.is_active) return { error: 'That classroom is inactive.' };
  if (room && (!startTime || !endTime)) {
    return { error: 'Enter start and end time to book a classroom.' };
  }

  if (room && startTime && endTime) {
    const { data } = await supabase
      .from('class_sessions')
      .select('id, room_id, session_date, start_time, end_time, status, title')
      .eq('room_id', room.id)
      .eq('session_date', sessionDate)
      .neq('status', 'cancelled');
    const conflict = findRoomConflict(
      (data as RoomBooking[]) ?? [],
      room.id,
      sessionDate,
      startTime,
      endTime,
    );
    if (conflict) {
      const when = [normalizeTime(conflict.start_time), normalizeTime(conflict.end_time)]
        .filter(Boolean)
        .join('–');
      return {
        error: `${room.name} is already booked${when ? ` ${when}` : ''}${conflict.title ? ` (${conflict.title})` : ''}.`,
      };
    }
  }

  const { error } = await supabase.from('class_sessions').insert({
    batch_id: batchId,
    title: optional(formData, 'title'),
    session_date: sessionDate,
    start_time: startTime,
    end_time: endTime,
    room_id: room?.id ?? null,
    venue: roomVenue(room) ?? optional(formData, 'venue'),
    notes: optional(formData, 'notes'),
    status: 'scheduled',
    created_by: ctx.userId,
  });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/batches');
  revalidatePath('/dashboard/attendance');
  revalidatePath(`/dashboard/attendance/${batchId}`);
  revalidatePath('/dashboard/settings');
  return { success: 'Class session scheduled.' };
}

export async function markAttendanceAction(formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const sessionId = str(formData, 'session_id');
  const studentId = str(formData, 'student_id');
  const status = str(formData, 'status');
  if (!sessionId || !studentId || !status) return;

  const allowed = ['present', 'absent', 'late', 'excused'];
  if (!allowed.includes(status)) return { error: 'Invalid attendance status.' };

  const { error } = await supabase.from('attendance').upsert(
    {
      session_id: sessionId,
      student_id: studentId,
      status,
      remarks: optional(formData, 'remarks'),
      marked_by: ctx.userId,
    },
    { onConflict: 'session_id,student_id' },
  );
  if (error) return { error: error.message };

  revalidatePath('/dashboard/batches');
  revalidatePath('/dashboard/attendance');
  revalidatePath('/dashboard/my-attendance');
  return { success: 'Attendance saved.' };
}

export async function saveAttendanceSheetAction(_prev: unknown, formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const sessionId = str(formData, 'session_id');
  const batchId = str(formData, 'batch_id');
  if (!sessionId) return { error: 'Missing class session.' };

  const allowed = new Set(['present', 'absent', 'late', 'excused']);
  const studentIds = Array.from(
    new Set(
      formData
        .getAll('student_ids')
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
  if (studentIds.length === 0) return { error: 'No students to mark.' };

  const rows = studentIds.map((studentId) => {
    const status = str(formData, `status_${studentId}`) || 'absent';
    return {
      session_id: sessionId,
      student_id: studentId,
      status: allowed.has(status) ? status : 'absent',
      remarks: optional(formData, `remarks_${studentId}`),
      marked_by: ctx.userId,
    };
  });

  const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'session_id,student_id' });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/batches');
  revalidatePath('/dashboard/attendance');
  revalidatePath(`/dashboard/attendance/${batchId}`);
  revalidatePath(`/dashboard/attendance/${batchId}/${sessionId}`);
  revalidatePath('/dashboard/my-attendance');
  return { success: `Saved attendance for ${rows.length} student${rows.length === 1 ? '' : 's'}.` };
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
  const formError = assessmentFormError({
    title,
    config,
    courseId,
    batchId,
    dueAt,
    delivery,
    questions,
    instructions,
  });
  if (formError) return { error: formError };

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      title,
      course_id: courseId,
      batch_id: batchId,
      type: config.value,
      delivery_mode: delivery,
      instructions,
      total_marks:
        config.value === 'quiz'
          ? quizTotalMarks(questions)
          : config.value === 'homework'
            ? 0
            : num(formData, 'total_marks', 100),
      pass_marks: config.value === 'homework' ? null : str(formData, 'pass_marks') ? num(formData, 'pass_marks') : null,
      due_at: dueAt,
      time_limit_minutes:
        config.value === 'quiz' && num(formData, 'time_limit_minutes') > 0
          ? num(formData, 'time_limit_minutes')
          : null,
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

function assessmentFormError(form: {
  title: string;
  config: ReturnType<typeof assessmentTypeConfig>;
  courseId: string | null;
  batchId: string | null;
  dueAt: string | null;
  delivery: string;
  questions: ReturnType<typeof parseQuizQuestions>;
  instructions: string | null;
}) {
  if (!form.title) return 'Enter a title.';
  if (!form.courseId && !form.batchId) {
    return form.config.requireCourse ? 'Choose a course.' : 'Choose a course or a batch.';
  }
  if (form.config.requireCourse && !form.courseId) return 'This type must be assigned to a course.';
  if (form.config.requireDue && !form.dueAt) return 'Set a due date.';
  if (form.config.value === 'quiz' && form.questions.length === 0) return 'Add at least one MCQ.';
  if (
    form.delivery === 'online' &&
    form.config.studentOnlineMode !== 'mcq' &&
    form.config.studentOnlineMode !== 'none' &&
    !form.instructions
  ) {
    return 'Add instructions for students.';
  }
  return null;
}

export async function updateAssessmentAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing assessment.' };

  const title = str(formData, 'title');
  const type = str(formData, 'type') || 'homework';
  const config = assessmentTypeConfig(type);
  const courseId = optional(formData, 'course_id');
  const batchId = optional(formData, 'batch_id');
  const instructions = optional(formData, 'instructions');
  const dueAt = fromDateTimeLocal(optional(formData, 'due_at'));
  const delivery = resolveDelivery(type, str(formData, 'delivery_mode'));
  const questions = config.value === 'quiz' ? parseQuizQuestions(str(formData, 'quiz_questions')) : [];
  const formError = assessmentFormError({
    title,
    config,
    courseId,
    batchId,
    dueAt,
    delivery,
    questions,
    instructions,
  });
  if (formError) return { error: formError };

  const { error } = await supabase
    .from('assessments')
    .update({
      title,
      course_id: courseId,
      batch_id: batchId,
      type: config.value,
      delivery_mode: delivery,
      instructions,
      total_marks:
        config.value === 'quiz'
          ? quizTotalMarks(questions)
          : config.value === 'homework'
            ? 0
            : num(formData, 'total_marks', 100),
      pass_marks: config.value === 'homework' ? null : str(formData, 'pass_marks') ? num(formData, 'pass_marks') : null,
      due_at: dueAt,
      time_limit_minutes:
        config.value === 'quiz' && num(formData, 'time_limit_minutes') > 0
          ? num(formData, 'time_limit_minutes')
          : null,
      is_published: str(formData, 'is_published') === 'on',
    })
    .eq('id', id);

  if (error) return { error: error.message };

  const { error: deleteQuestionsError } = await supabase.from('quiz_questions').delete().eq('assessment_id', id);
  if (deleteQuestionsError) return { error: deleteQuestionsError.message };

  if (config.value === 'quiz') {
    const { error: questionError } = await supabase.from('quiz_questions').insert(quizQuestionRows(questions, id));
    if (questionError) return { error: questionError.message };
  }

  revalidatePath('/dashboard/assessments');
  revalidatePath(`/dashboard/assessments/${id}`);
  revalidatePath(`/dashboard/assessments/${id}/edit`);
  revalidatePath('/dashboard/my-assessments');
  return { success: `${config.label} updated.` };
}

export async function deleteAssessmentAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing assessment.' };
  const { error } = await supabase.from('assessments').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/assessments');
  revalidatePath('/dashboard/my-assessments');
  redirect('/dashboard/assessments');
}

export async function saveMarksSheetAction(_prev: unknown, formData: FormData) {
  const ctx = await requireRole(['admin', 'instructor']);
  const supabase = createClient();
  const assessmentId = str(formData, 'assessment_id');
  if (!assessmentId) return { error: 'Missing assessment.' };

  const { data: assessment, error: loadError } = await supabase
    .from('assessments')
    .select('id, type, total_marks')
    .eq('id', assessmentId)
    .maybeSingle();
  if (loadError) return { error: loadError.message };
  if (!assessment) return { error: 'Assessment not found.' };

  const studentIds = Array.from(
    new Set(
      formData
        .getAll('student_ids')
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
  if (studentIds.length === 0) return { error: 'No assigned students to mark.' };

  const type = assessment.type as string;
  const totalMarks = Number(assessment.total_marks) || 0;
  const now = new Date().toISOString();

  if (type === 'homework') {
    const rows = studentIds.map((studentId) => {
      const completion = str(formData, `completion_${studentId}`) === 'submitted' ? 'submitted' : 'missing';
      return {
        assessment_id: assessmentId,
        student_id: studentId,
        marks: null as number | null,
        feedback: optional(formData, `remarks_${studentId}`),
        status: completion,
        graded_at: now,
        graded_by: ctx.userId,
      };
    });
    const { error } = await supabase.from('submissions').upsert(rows, { onConflict: 'assessment_id,student_id' });
    if (error) return { error: error.message };
    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${assessmentId}`);
    revalidatePath('/dashboard/my-assessments');
    return { success: `Saved submission status for ${rows.length} student${rows.length === 1 ? '' : 's'}.` };
  }

  if (type === 'quiz') {
    const updates: { student_id: string; feedback: string | null }[] = [];
    for (const studentId of studentIds) {
      updates.push({
        student_id: studentId,
        feedback: optional(formData, `remarks_${studentId}`),
      });
    }
    for (const update of updates) {
      const { error } = await supabase
        .from('submissions')
        .update({
          feedback: update.feedback,
          graded_at: now,
          graded_by: ctx.userId,
        })
        .eq('assessment_id', assessmentId)
        .eq('student_id', update.student_id);
      if (error) return { error: error.message };
    }
    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${assessmentId}`);
    revalidatePath('/dashboard/my-assessments');
    return { success: 'Quiz remarks saved. Marks stay from the student attempt.' };
  }

  const rows: {
    assessment_id: string;
    student_id: string;
    marks: number;
    feedback: string | null;
    status: 'graded';
    graded_at: string;
    graded_by: string;
  }[] = [];

  for (const studentId of studentIds) {
    const raw = str(formData, `marks_${studentId}`);
    if (raw === '') continue;
    const marks = Number(raw);
    if (!Number.isFinite(marks)) return { error: 'Enter valid marks.' };
    if (marks < 0) return { error: 'Marks cannot be negative.' };
    if (totalMarks > 0 && marks > totalMarks) return { error: `Marks cannot exceed ${totalMarks}.` };
    rows.push({
      assessment_id: assessmentId,
      student_id: studentId,
      marks,
      feedback: optional(formData, `remarks_${studentId}`),
      status: 'graded',
      graded_at: now,
      graded_by: ctx.userId,
    });
  }

  if (rows.length === 0) return { error: 'Enter at least one mark.' };

  const { error } = await supabase.from('submissions').upsert(rows, { onConflict: 'assessment_id,student_id' });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/assessments');
  revalidatePath(`/dashboard/assessments/${assessmentId}`);
  revalidatePath('/dashboard/my-assessments');
  return { success: `Saved marks for ${rows.length} student${rows.length === 1 ? '' : 's'}.` };
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
function revalidateSettings() {
  revalidateTag(CACHE_TAGS.settings);
  revalidateTag(CACHE_TAGS.lookups);
  revalidatePath('/dashboard/settings');
}

function boolFromForm(formData: FormData, key: string) {
  return str(formData, key) === 'on' || str(formData, key) === 'true';
}

export async function updateSettingAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const key = str(formData, 'key');
  if (!id && !key) return { error: 'Missing setting.' };
  const valueType = str(formData, 'value_type') || 'text';
  if (!['text', 'number', 'boolean', 'json'].includes(valueType)) {
    return { error: 'Choose a valid value type.' };
  }
  const payload = {
    group_name: str(formData, 'group_name') || 'general',
    key: str(formData, 'key'),
    value: optional(formData, 'value'),
    value_type: valueType,
    is_public: boolFromForm(formData, 'is_public'),
  };
  if (!payload.key) return { error: 'Enter a key.' };
  const query = id
    ? supabase.from('settings').update(payload).eq('id', id)
    : supabase.from('settings').update(payload).eq('key', key);
  const { error } = await query;
  if (error) return { error: error.message };
  revalidateSettings();
  return { success: 'Setting saved.' };
}

export async function createSettingAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const key = str(formData, 'key');
  const groupName = str(formData, 'group_name') || 'general';
  if (!key) return { error: 'Enter a key.' };
  const valueType = str(formData, 'value_type') || 'text';
  if (!['text', 'number', 'boolean', 'json'].includes(valueType)) {
    return { error: 'Choose a valid value type.' };
  }
  const { error } = await supabase.from('settings').insert({
    group_name: groupName,
    key,
    value: optional(formData, 'value'),
    value_type: valueType,
    is_public: boolFromForm(formData, 'is_public'),
  });
  if (error) return { error: error.message };
  revalidateSettings();
  return { success: 'Setting added.' };
}

export async function deleteSettingAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing setting.' };
  const { error } = await supabase.from('settings').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateSettings();
  return { success: 'Setting deleted.' };
}

export async function createLookupAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const type = str(formData, 'type');
  const code = str(formData, 'code');
  const label = str(formData, 'label');
  if (!type || !code || !label) return { error: 'Type, code and label are required.' };
  const { error } = await supabase.from('lookups').insert({
    type,
    code,
    label,
    label_bn: optional(formData, 'label_bn'),
    sort_order: num(formData, 'sort_order'),
    is_active: boolFromForm(formData, 'is_active'),
  });
  if (error) return { error: error.message };
  revalidateSettings();
  return { success: 'Lookup added.' };
}

export async function updateLookupAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const type = str(formData, 'type');
  const code = str(formData, 'code');
  const label = str(formData, 'label');
  if (!id) return { error: 'Missing lookup.' };
  if (!type || !code || !label) return { error: 'Type, code and label are required.' };
  const { error } = await supabase
    .from('lookups')
    .update({
      type,
      code,
      label,
      label_bn: optional(formData, 'label_bn'),
      sort_order: num(formData, 'sort_order'),
      is_active: boolFromForm(formData, 'is_active'),
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidateSettings();
  return { success: 'Lookup saved.' };
}

export async function deleteLookupAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing lookup.' };
  const { error } = await supabase.from('lookups').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateSettings();
  return { success: 'Lookup deleted.' };
}

export async function createCategoryAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const name = str(formData, 'name');
  if (!name) return { error: 'Enter a category name.' };
  const slug = slugify(str(formData, 'slug') || name);
  if (!slug) return { error: 'Enter a valid slug.' };
  const { error } = await supabase.from('categories').insert({
    name,
    slug,
    parent_id: optional(formData, 'parent_id'),
    description: optional(formData, 'description'),
    sort_order: num(formData, 'sort_order'),
    is_active: boolFromForm(formData, 'is_active'),
    show_on_home: boolFromForm(formData, 'show_on_home'),
  });
  if (error) return { error: error.message };
  revalidateSettings();
  revalidateTag(CACHE_TAGS.website);
  return { success: 'Category added.' };
}

export async function updateCategoryAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const name = str(formData, 'name');
  if (!id) return { error: 'Missing category.' };
  if (!name) return { error: 'Enter a category name.' };
  const slug = slugify(str(formData, 'slug') || name);
  if (!slug) return { error: 'Enter a valid slug.' };
  const parentId = optional(formData, 'parent_id');
  if (parentId === id) return { error: 'A category cannot be its own parent.' };
  const { error } = await supabase
    .from('categories')
    .update({
      name,
      slug,
      parent_id: parentId,
      description: optional(formData, 'description'),
      sort_order: num(formData, 'sort_order'),
      is_active: boolFromForm(formData, 'is_active'),
      show_on_home: boolFromForm(formData, 'show_on_home'),
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidateSettings();
  revalidateTag(CACHE_TAGS.website);
  return { success: 'Category saved.' };
}

export async function deleteCategoryAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing category.' };
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateSettings();
  revalidateTag(CACHE_TAGS.website);
  return { success: 'Category deleted.' };
}

function revalidateRooms() {
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/batches');
  revalidatePath('/dashboard/attendance');
}

export async function createRoomAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const name = str(formData, 'name');
  const code = str(formData, 'code') || slugify(name);
  if (!name) return { error: 'Enter a room name.' };
  if (!code) return { error: 'Enter a room code.' };
  const { error } = await supabase.from('rooms').insert({
    name,
    code,
    capacity: str(formData, 'capacity') ? num(formData, 'capacity') : null,
    location: optional(formData, 'location'),
    notes: optional(formData, 'notes'),
    sort_order: num(formData, 'sort_order'),
    is_active: boolFromForm(formData, 'is_active'),
  });
  if (error) return { error: error.message };
  revalidateRooms();
  return { success: 'Classroom added.' };
}

export async function updateRoomAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const name = str(formData, 'name');
  const code = str(formData, 'code') || slugify(name);
  if (!id) return { error: 'Missing classroom.' };
  if (!name) return { error: 'Enter a room name.' };
  if (!code) return { error: 'Enter a room code.' };
  const { error } = await supabase
    .from('rooms')
    .update({
      name,
      code,
      capacity: str(formData, 'capacity') ? num(formData, 'capacity') : null,
      location: optional(formData, 'location'),
      notes: optional(formData, 'notes'),
      sort_order: num(formData, 'sort_order'),
      is_active: boolFromForm(formData, 'is_active'),
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidateRooms();
  return { success: 'Classroom saved.' };
}

export async function deleteRoomAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing classroom.' };
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateRooms();
  return { success: 'Classroom deleted.' };
}

function revalidateHero() {
  revalidateTag(CACHE_TAGS.heroSlides);
  revalidatePath('/');
  revalidatePath('/dashboard/hero');
}

export async function createHeroSlideAction(_prev: unknown, formData: FormData) {
  const ctx = await requireRole(['admin']);
  const supabase = createClient();
  const title = str(formData, 'title');
  const file = formData.get('image_file');
  if (!title) return { error: 'Enter a title.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Upload a slider image.' };

  const uploaded = await uploadPublicImage(supabase, file, 'hero');
  if (uploaded.error || !uploaded.url) {
    return { error: imageUploadError(uploaded) };
  }

  const { error } = await supabase.from('hero_slides').insert({
    title,
    eyebrow: optional(formData, 'eyebrow'),
    description: optional(formData, 'description'),
    image_url: uploaded.url,
    href: optional(formData, 'href'),
    cta_label: optional(formData, 'cta_label'),
    secondary_href: optional(formData, 'secondary_href'),
    secondary_label: optional(formData, 'secondary_label'),
    sort_order: num(formData, 'sort_order'),
    is_active: str(formData, 'is_active') === 'on',
    created_by: ctx.userId,
  });
  if (error) return { error: error.message };
  revalidateHero();
  return { success: 'Slide added.' };
}

export async function updateHeroSlideAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const title = str(formData, 'title');
  if (!id) return { error: 'Missing slide.' };
  if (!title) return { error: 'Enter a title.' };

  const patch: Record<string, unknown> = {
    title,
    eyebrow: optional(formData, 'eyebrow'),
    description: optional(formData, 'description'),
    href: optional(formData, 'href'),
    cta_label: optional(formData, 'cta_label'),
    secondary_href: optional(formData, 'secondary_href'),
    secondary_label: optional(formData, 'secondary_label'),
    sort_order: num(formData, 'sort_order'),
    is_active: str(formData, 'is_active') === 'on',
  };

  const file = formData.get('image_file');
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadPublicImage(supabase, file, 'hero');
    if (uploaded.error || !uploaded.url) {
      return { error: imageUploadError(uploaded) };
    }
    patch.image_url = uploaded.url;
  }

  const { error } = await supabase.from('hero_slides').update(patch).eq('id', id);
  if (error) return { error: error.message };
  revalidateHero();
  return { success: 'Slide saved.' };
}

export async function deleteHeroSlideAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing slide.' };
  const { error } = await supabase.from('hero_slides').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateHero();
  return { success: 'Slide deleted.' };
}

function revalidateWebsite() {
  revalidateTag(CACHE_TAGS.website);
  revalidatePath('/');
  revalidatePath('/about');
  revalidatePath('/courses');
  revalidatePath('/dashboard/notices');
  revalidatePath('/dashboard/about');
  revalidatePath('/dashboard/website');
}

async function uploadOptionalImage(formData: FormData, field: string, folder: string) {
  const supabase = createClient();
  const file = formData.get(field);
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadPublicImage(supabase, file, folder);
    if (uploaded.error || !uploaded.url) {
      return { error: imageUploadError(uploaded), url: null };
    }
    return { error: null, url: uploaded.url };
  }
  return { error: null, url: optional(formData, field.replace('_file', '_url')) };
}

export async function createNoticeAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const message = str(formData, 'message');
  if (!message) return { error: 'Enter a notice message.' };
  const { error } = await supabase.from('site_notices').insert({
    message,
    href: optional(formData, 'href'),
    starts_at: fromDateTimeLocal(optional(formData, 'starts_at')),
    ends_at: fromDateTimeLocal(optional(formData, 'ends_at')),
    is_active: str(formData, 'is_active') === 'on',
    sort_order: num(formData, 'sort_order'),
  });
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Notice saved.' };
}

export async function updateNoticeAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const message = str(formData, 'message');
  if (!id) return { error: 'Missing notice.' };
  if (!message) return { error: 'Enter a notice message.' };
  const { error } = await supabase
    .from('site_notices')
    .update({
      message,
      href: optional(formData, 'href'),
      starts_at: fromDateTimeLocal(optional(formData, 'starts_at')),
      ends_at: fromDateTimeLocal(optional(formData, 'ends_at')),
      is_active: str(formData, 'is_active') === 'on',
      sort_order: num(formData, 'sort_order'),
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Notice updated.' };
}

export async function deleteNoticeAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing notice.' };
  const { error } = await supabase.from('site_notices').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Notice deleted.' };
}

export async function saveAboutPageAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const intro = await uploadOptionalImage(formData, 'intro_image_file', 'about');
  if (intro.error) return { error: intro.error };
  const mission = await uploadOptionalImage(formData, 'mission_image_file', 'about');
  if (mission.error) return { error: mission.error };
  const vision = await uploadOptionalImage(formData, 'vision_image_file', 'about');
  if (vision.error) return { error: vision.error };

  const payload = {
    intro_title: optional(formData, 'intro_title'),
    intro_body: optional(formData, 'intro_body'),
    intro_image_url: intro.url,
    intro_lottie_url: optional(formData, 'intro_lottie_url'),
    mission_title: str(formData, 'mission_title') || 'Our mission',
    mission_body: optional(formData, 'mission_body'),
    mission_image_url: mission.url,
    mission_lottie_url: optional(formData, 'mission_lottie_url'),
    vision_title: str(formData, 'vision_title') || 'Our vision',
    vision_body: optional(formData, 'vision_body'),
    vision_image_url: vision.url,
    vision_lottie_url: optional(formData, 'vision_lottie_url'),
  };

  const id = str(formData, 'id');
  const query = id
    ? supabase.from('about_page').update(payload).eq('id', id)
    : supabase.from('about_page').insert(payload);
  const { error } = await query;
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'About page saved.' };
}

export async function createTeamMemberAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const name = str(formData, 'name');
  if (!name) return { error: 'Enter a name.' };
  const image = await uploadOptionalImage(formData, 'image_file', 'team');
  if (image.error) return { error: image.error };
  const { error } = await supabase.from('team_members').insert({
    name,
    role_title: optional(formData, 'role_title'),
    bio: optional(formData, 'bio'),
    image_url: image.url,
    sort_order: num(formData, 'sort_order'),
    is_active: str(formData, 'is_active') === 'on',
  });
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Team member added.' };
}

export async function updateTeamMemberAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const name = str(formData, 'name');
  if (!id) return { error: 'Missing member.' };
  if (!name) return { error: 'Enter a name.' };
  const image = await uploadOptionalImage(formData, 'image_file', 'team');
  if (image.error) return { error: image.error };
  const { error } = await supabase
    .from('team_members')
    .update({
      name,
      role_title: optional(formData, 'role_title'),
      bio: optional(formData, 'bio'),
      image_url: image.url ?? optional(formData, 'image_url'),
      sort_order: num(formData, 'sort_order'),
      is_active: str(formData, 'is_active') === 'on',
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Team member saved.' };
}

export async function deleteTeamMemberAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing member.' };
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Team member deleted.' };
}

export async function createPartnerAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const name = str(formData, 'name');
  if (!name) return { error: 'Enter a partner name.' };
  const logo = await uploadOptionalImage(formData, 'logo_file', 'partners');
  if (logo.error) return { error: logo.error };
  const { error } = await supabase.from('partners').insert({
    name,
    logo_url: logo.url,
    href: optional(formData, 'href'),
    sort_order: num(formData, 'sort_order'),
    is_active: str(formData, 'is_active') === 'on',
    show_on_home: str(formData, 'show_on_home') === 'on',
    show_on_about: str(formData, 'show_on_about') === 'on',
  });
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Partner added.' };
}

export async function updatePartnerAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const name = str(formData, 'name');
  if (!id) return { error: 'Missing partner.' };
  if (!name) return { error: 'Enter a partner name.' };
  const logo = await uploadOptionalImage(formData, 'logo_file', 'partners');
  if (logo.error) return { error: logo.error };
  const { error } = await supabase
    .from('partners')
    .update({
      name,
      logo_url: logo.url ?? optional(formData, 'logo_url'),
      href: optional(formData, 'href'),
      sort_order: num(formData, 'sort_order'),
      is_active: str(formData, 'is_active') === 'on',
      show_on_home: str(formData, 'show_on_home') === 'on',
      show_on_about: str(formData, 'show_on_about') === 'on',
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Partner saved.' };
}

export async function deletePartnerAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing partner.' };
  const { error } = await supabase.from('partners').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Partner deleted.' };
}

export async function createTestimonialAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const name = str(formData, 'name');
  const quote = str(formData, 'quote');
  if (!name) return { error: 'Enter a name.' };
  if (!quote) return { error: 'Enter a review.' };
  const avatar = await uploadOptionalImage(formData, 'avatar_file', 'testimonials');
  if (avatar.error) return { error: avatar.error };
  const { error } = await supabase.from('testimonials').insert({
    name,
    role_title: optional(formData, 'role_title'),
    quote,
    avatar_url: avatar.url,
    rating: Math.min(5, Math.max(1, num(formData, 'rating', 5))),
    sort_order: num(formData, 'sort_order'),
    is_active: str(formData, 'is_active') === 'on',
    show_on_home: str(formData, 'show_on_home') === 'on',
    show_on_about: str(formData, 'show_on_about') === 'on',
  });
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Review added.' };
}

export async function updateTestimonialAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  const name = str(formData, 'name');
  const quote = str(formData, 'quote');
  if (!id) return { error: 'Missing review.' };
  if (!name) return { error: 'Enter a name.' };
  if (!quote) return { error: 'Enter a review.' };
  const avatar = await uploadOptionalImage(formData, 'avatar_file', 'testimonials');
  if (avatar.error) return { error: avatar.error };
  const { error } = await supabase
    .from('testimonials')
    .update({
      name,
      role_title: optional(formData, 'role_title'),
      quote,
      avatar_url: avatar.url ?? optional(formData, 'avatar_url'),
      rating: Math.min(5, Math.max(1, num(formData, 'rating', 5))),
      sort_order: num(formData, 'sort_order'),
      is_active: str(formData, 'is_active') === 'on',
      show_on_home: str(formData, 'show_on_home') === 'on',
      show_on_about: str(formData, 'show_on_about') === 'on',
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Review saved.' };
}

export async function deleteTestimonialAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const id = str(formData, 'id');
  if (!id) return { error: 'Missing review.' };
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Review deleted.' };
}

export async function savePageSectionsAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const keys = formData.getAll('section_keys').map((value) => (typeof value === 'string' ? value : '')).filter(Boolean);
  if (keys.length === 0) return { error: 'No sections to save.' };
  const rows = keys.map((key) => ({ key, enabled: str(formData, `enabled_${key}`) === 'on' }));
  const { error } = await supabase.from('page_sections').upsert(rows, { onConflict: 'key' });
  if (error) return { error: error.message };
  revalidateWebsite();
  return { success: 'Section visibility saved.' };
}

export async function saveHomeCategoriesAction(_prev: unknown, formData: FormData) {
  await requireRole(['admin']);
  const supabase = createClient();
  const ids = formData.getAll('category_ids').map((value) => (typeof value === 'string' ? value : '')).filter(Boolean);
  for (const id of ids) {
    const { error } = await supabase
      .from('categories')
      .update({ show_on_home: str(formData, `show_${id}`) === 'on' })
      .eq('id', id);
    if (error) return { error: error.message };
  }
  revalidateWebsite();
  revalidatePath('/');
  return { success: 'Home category sections saved.' };
}
