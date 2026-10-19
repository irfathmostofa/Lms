'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROLE_HOME } from '@/lib/constants';
import type { UserRole } from '@/lib/types';

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

function safeNext(value: unknown) {
  const next = String(value ?? '').trim();
  return next.startsWith('/') && !next.startsWith('//') ? next : null;
}

async function resolveRole(
  supabase: ReturnType<typeof createClient>,
  userId: string | undefined,
): Promise<UserRole> {
  if (!userId) return 'student';
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return (profile?.role as UserRole) ?? 'student';
}

export async function signInAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await resolveRole(supabase, user?.id);

  revalidatePath('/', 'layout');
  redirect(next ?? ROLE_HOME[role] ?? '/dashboard');
}

export async function signInModalAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await resolveRole(supabase, user?.id);

  revalidatePath('/', 'layout');
  return { success: true as const, role, next: next ?? ROLE_HOME[role] ?? '/dashboard' };
}

export async function requestPasswordResetAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return { error: 'Enter the email address for your account.' };
  }

  const supabase = createClient();
  const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent('/reset-password')}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return { error: error.message };
  }

  return {
    success: 'If an account exists for that email, a password reset link is on its way.',
  };
}

export async function updatePasswordAction(_prev: unknown, formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirm_password') ?? '');

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }
  if (password !== confirmPassword) {
    return { error: 'The two passwords do not match.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Your reset link has expired. Request a new password reset link.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  const role = await resolveRole(supabase, user.id);
  revalidatePath('/', 'layout');
  redirect(ROLE_HOME[role] ?? '/dashboard');
}

export async function signUpAction(_prev: unknown, formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Account created. Check your email to confirm, then sign in.' };
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
