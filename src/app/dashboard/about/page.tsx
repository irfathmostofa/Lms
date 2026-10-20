import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { AboutPageForm } from '@/components/dashboard/about-page-form';
import { TeamMemberForm } from '@/components/dashboard/team-member-form';
import { ConfirmDeleteButton } from '@/components/dashboard/confirm-delete-button';
import { FormModal } from '@/components/dashboard/form-modal';
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
        action={
          <div className="flex flex-wrap gap-2">
            <FormModal title="Intro, mission and vision" description="Use an image, a Lottie URL, or both." triggerLabel="Edit about" size="xl">
              <AboutPageForm about={about} />
            </FormModal>
            <FormModal title="Add team member" description="Instructors and staff shown on the About page." triggerLabel="Add team member" triggerVariant="secondary">
              <TeamMemberForm />
            </FormModal>
          </div>
        }
      />

      {aboutError || teamError ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          About content could not be loaded. Run supabase/migrations/20261020_website_cms.sql if tables are missing.
        </p>
      ) : null}

      {members.length === 0 ? (
        <EmptyState title="No team members yet" description="Add instructors and staff." />
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
                    <FormModal title="Edit team member" triggerLabel="Edit" triggerVariant="outline" triggerSize="sm">
                      <TeamMemberForm member={member} />
                    </FormModal>
                    <ConfirmDeleteButton
                      action={deleteTeamMemberAction}
                      id={member.id}
                      confirm="Delete this team member?"
                    />
                  </div>
                }
              />
              <CardBody>
                <div className="relative aspect-square max-w-[160px] overflow-hidden rounded-lg bg-slate-100">
                  {member.image_url ? (
                    <Image src={member.image_url} alt={member.name} fill className="object-cover" sizes="160px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
