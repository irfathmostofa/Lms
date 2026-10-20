import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabaseEnv } from '@/lib/env';
import { CACHE_TAGS } from '@/lib/data';
import type { AboutPage, Partner, SiteNotice, TeamMember, Testimonial } from '@/lib/types';

export function isSectionEnabled(sections: Record<string, boolean>, key: string) {
  return sections[key] !== false;
}

export const getPageSections = unstable_cache(
  async function getPageSections(): Promise<Record<string, boolean>> {
    if (!hasSupabaseEnv()) return {};
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase.from('page_sections').select('key, enabled');
      if (error) return {};
      return Object.fromEntries(((data as { key: string; enabled: boolean }[]) ?? []).map((row) => [row.key, row.enabled]));
    } catch {
      return {};
    }
  },
  ['website:page-sections'],
  { revalidate: 300, tags: [CACHE_TAGS.website] },
);

export const getActiveNotices = unstable_cache(
  async function getActiveNotices(): Promise<SiteNotice[]> {
    if (!hasSupabaseEnv()) return [];
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('site_notices')
        .select('id, message, href, starts_at, ends_at, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order');
      if (error) return [];
      const now = Date.now();
      return ((data as SiteNotice[]) ?? []).filter((notice) => {
        if (notice.starts_at && new Date(notice.starts_at).getTime() > now) return false;
        if (notice.ends_at && new Date(notice.ends_at).getTime() < now) return false;
        return true;
      });
    } catch {
      return [];
    }
  },
  ['website:notices'],
  { revalidate: 60, tags: [CACHE_TAGS.website] },
);

export const getAboutPage = unstable_cache(
  async function getAboutPage(): Promise<AboutPage | null> {
    if (!hasSupabaseEnv()) return null;
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase.from('about_page').select('*').limit(1).maybeSingle();
      if (error) return null;
      return (data as AboutPage) ?? null;
    } catch {
      return null;
    }
  },
  ['website:about'],
  { revalidate: 300, tags: [CACHE_TAGS.website] },
);

export const getTeamMembers = unstable_cache(
  async function getTeamMembers(): Promise<TeamMember[]> {
    if (!hasSupabaseEnv()) return [];
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) return [];
      return (data as TeamMember[]) ?? [];
    } catch {
      return [];
    }
  },
  ['website:team'],
  { revalidate: 300, tags: [CACHE_TAGS.website] },
);

export const getPartners = unstable_cache(
  async function getPartners(): Promise<Partner[]> {
    if (!hasSupabaseEnv()) return [];
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase.from('partners').select('*').eq('is_active', true).order('sort_order');
      if (error) return [];
      return (data as Partner[]) ?? [];
    } catch {
      return [];
    }
  },
  ['website:partners'],
  { revalidate: 300, tags: [CACHE_TAGS.website] },
);

export const getTestimonials = unstable_cache(
  async function getTestimonials(): Promise<Testimonial[]> {
    if (!hasSupabaseEnv()) return [];
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) return [];
      return (data as Testimonial[]) ?? [];
    } catch {
      return [];
    }
  },
  ['website:testimonials'],
  { revalidate: 300, tags: [CACHE_TAGS.website] },
);
