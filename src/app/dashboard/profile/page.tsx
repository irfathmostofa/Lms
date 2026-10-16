import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { updateProfileAction } from '@/actions/student';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Textarea,
} from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { ROLE_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const ctx = await requireUser();
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', ctx.userId)
    .single();

  const role = ctx.profile?.role ?? 'student';

  return (
    <>
      <PageHeader title="Profile" description="Update your personal details." />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader title="Personal information" />
          <CardBody>
            <form action={updateProfileAction} className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input name="full_name" defaultValue={profile?.full_name ?? ''} />
              </Field>
              <Field label="Phone">
                <Input name="phone" defaultValue={profile?.phone ?? ''} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Bio">
                  <Textarea name="bio" defaultValue={profile?.bio ?? ''} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Saving...">Save changes</SubmitButton>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Account" />
          <CardBody className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email</span>
              <span>{ctx.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Role</span>
              <Badge tone="blue">{ROLE_LABEL[role]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Joined</span>
              <span>{formatDate(profile?.created_at)}</span>
            </div>
            <p className="text-xs text-slate-400">
              Only an admin can change your role. Contact support if your role is incorrect.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
