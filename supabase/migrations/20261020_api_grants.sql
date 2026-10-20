-- Catch-up grants for tables created before Supabase stopped auto-granting
-- Data API access on new public-schema tables (30 Oct 2026).
-- Safe to re-run: GRANT is idempotent for already-granted privileges.

grant select on public.hero_slides to anon;
grant select, insert, update, delete on public.hero_slides to authenticated;
grant select, insert, update, delete on public.hero_slides to service_role;

grant select on public.site_notices, public.about_page, public.team_members, public.partners, public.testimonials, public.page_sections to anon;
grant select, insert, update, delete on public.site_notices, public.about_page, public.team_members, public.partners, public.testimonials, public.page_sections to authenticated;
grant select, insert, update, delete on public.site_notices, public.about_page, public.team_members, public.partners, public.testimonials, public.page_sections to service_role;

grant select, insert, update, delete on public.quiz_questions to authenticated;
grant select, insert, update, delete on public.quiz_questions to service_role;

grant select, insert, update, delete on public.course_access to authenticated;
grant select, insert, update, delete on public.course_access to service_role;

grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update, delete on public.rooms to service_role;
