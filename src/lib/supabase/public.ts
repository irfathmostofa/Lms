import { cache } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Cookie-free anon client for public, cacheable reads (course list/detail).
// Do not use for anything that depends on the signed-in user.
//
// Wrapped in React `cache()` so a page and its `generateMetadata` share one
// instance within a request.
export const createPublicClient = cache(function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
});
