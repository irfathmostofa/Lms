import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { AboutPageForm } from '@/components/dashboard/about-page-form';
import { TeamMemberForm } from '@/components/dashboard/team-member-form';
import { ConfirmDeleteButton } from '@/components/dashboard/confirm-delete-button';
import { deleteTeamMemberAction } from '@/actions/dashboard';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import type { AboutPage, TeamMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AboutCmsPage() {
  const ctx = await getSessionContext();
  if (ctx?.profile?.role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const [{ data: aboutData, error: aboutError }, { data: teamData, error: teamError }] = await Promise.all([
    supabase.from('about_page').select('*').limit(1).maybeSingle(),
    supabase.from('team_members').select('*').order('sort_order'),
  ]);

  const about = (aboutData as AboutPage | null) ?? null;
  const members = (teamData as TeamMember[]) ?? [];

  return (
    <>
      <PageHeader
        title="About page"
        description="Intro, mission, vision and the people who teach. Images are compressed to 75% quality before upload."
      />

      {aboutError || teamError ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          About content could not be loaded. Run supabase/migrations/20261020_website_cms.sql if tables are missing.
        </p>
      ) : null}

      <Card className="mb-8">
        <CardHeader title="Intro, mission and vision" description="Use an image, a Lottie URL, or both." />
        <CardBody>
          <AboutPageForm about={about} />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Add team member" description="Instructors and staff shown on the About page." />
        <CardBody>
          <TeamMemberForm />
        </CardBody>
      </Card>

      {members.length === 0 ? (
        <EmptyState title="No team members yet" description="Add instructors and staff above." />
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader
                title={member.name}
                description={member.role_title ?? 'Team'}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={member.is_active ? 'green' : 'amber'}>
                      {member.is_active ? 'published' : 'hidden'}
                    </Badge>
                    <ConfirmDeleteButton
                      action={deleteTeamMemberAction}
                      id={member.id}
                      confirm="Delete this team member?"
                    />
                  </div>
                }
              />
              <CardBody className="grid gap-6 lg:grid-cols-[160px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                  {member.image_url ? (
                    <Image src={member.image_url} alt={member.name} fill className="object-cover" sizes="160px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                  )}
                </div>
                <TeamMemberForm member={member} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
