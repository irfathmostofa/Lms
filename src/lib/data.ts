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
  heroSlides: 'hero-slides',
  website: 'website',
  catalog: 'catalog',
  stats: 'home-stats',
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

const DEMO_PUBLIC_SETTINGS: Record<string, string | null> = {
  site_name: 'LMS Platform',
  support_phone: '+8801700000000',
  support_whatsapp: '+8801700000000',
  support_email: 'support@example.com',
};

const getAllPublicSettings = unstable_cache(
  async function getAllPublicSettings(): Promise<Record<string, string | null>> {
    if (!hasSupabaseEnv()) return DEMO_PUBLIC_SETTINGS;
    try {
      const supabase = createPublicClient();
      const { data } = await supabase.from('settings').select('key, value').eq('is_public', true);
      const rows = (data as { key: string; value: string | null }[]) ?? [];
      return Object.fromEntries(rows.map((row) => [row.key, row.value]));
    } catch {
      return DEMO_PUBLIC_SETTINGS;
    }
  },
  ['settings:public-all'],
  { revalidate: 3600, tags: [CACHE_TAGS.settings] },
);

/**
 * Public settings (never exposes non-public rows) for the given keys.
 * One cached read is shared across the homepage, header, courses and about pages.
 */
export async function getPublicSettings(keys: string[]): Promise<Record<string, string | null>> {
  const all = await getAllPublicSettings();
  if (keys.length === 0) return all;
  return Object.fromEntries(keys.map((key) => [key, all[key] ?? null]));
}
