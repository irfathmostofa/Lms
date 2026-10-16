import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/env';
import type { Profile, UserRole } from '@/lib/types';

export interface SessionContext {
  userId: string;
  email: string | null;
  profile: Profile | null;
}

/**
 * Resolve the signed-in user and their profile once per request.
 *
 * React `cache()` de-duplicates the auth lookup and the profile query across
 * the dashboard layout, the page and nested components, so a single navigation
 * performs one `auth.getUser()` round-trip instead of one per caller.
 */
export const getSessionContext = cache(async function getSessionContext(): Promise<SessionContext | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { userId: user.id, email: user.email ?? null, profile: (profile as Profile) ?? null };
});

export async function requireUser(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');
  return ctx;
}

export async function requireRole(roles: UserRole[]): Promise<SessionContext> {
  const ctx = await requireUser();
  const role = ctx.profile?.role ?? 'student';
  if (!roles.includes(role)) redirect('/dashboard');
  return ctx;
}
