import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabaseEnv } from '@/lib/env';

/**
 * Cache tags for cross-request data caching.
 * Invalidate with `revalidateTag(CACHE_TAGS.x)` after the matching mutation.
 */
export const CACHE_TAGS = {
  lookups: 'lookups',
  settings: 'settings',
} as const;

export interface LookupOption {
  code: string;
  label: string;
}

/**
 * Active payment methods from the public `lookups` table.
 * Public read (`using (true)` in RLS), so safe to cache globally.
 */
export const getPaymentMethods = unstable_cache(
  async function getPaymentMethods(): Promise<LookupOption[]> {
    if (!hasSupabaseEnv()) return [];
    try {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from('lookups')
        .select('code, label')
        .eq('type', 'payment_method')
        .eq('is_active', true)
        .order('sort_order');
      return (data as LookupOption[]) ?? [];
    } catch {
      return [];
    }
  },
  ['lookups:payment-methods'],
  { revalidate: 3600, tags: [CACHE_TAGS.lookups] },
);

/**
 * Public settings (never exposes non-public rows) for the given keys.
 * Cached and invalidated through the `settings` tag.
 */
export const getPublicSettings = unstable_cache(
  async function getPublicSettings(keys: string[]): Promise<Record<string, string | null>> {
    if (!hasSupabaseEnv() || keys.length === 0) return {};
    try {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .eq('is_public', true)
        .in('key', keys);
      return Object.fromEntries(
        ((data as { key: string; value: string | null }[]) ?? []).map((row) => [row.key, row.value]),
      );
    } catch {
      return {};
    }
  },
  ['settings:public'],
  { revalidate: 3600, tags: [CACHE_TAGS.settings] },
);
