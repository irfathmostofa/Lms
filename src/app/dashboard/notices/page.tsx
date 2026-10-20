import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { NoticeForm } from '@/components/dashboard/notice-form';
import { ConfirmDeleteButton } from '@/components/dashboard/confirm-delete-button';
import { deleteNoticeAction } from '@/actions/dashboard';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { SiteNotice } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function NoticesPage() {
  const ctx = await getSessionContext();
  if (ctx?.profile?.role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_notices')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false });

  const notices = (data as SiteNotice[]) ?? [];

  return (
    <>
      <PageHeader
        title="Notices"
        description="Timed banner messages shown at the top of public pages. A notice only appears between its start and end times."
      />

      {error ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Notices could not be loaded: {error.message}. Run supabase/migrations/20261020_website_cms.sql if the table is missing.
        </p>
      ) : null}

      <Card className="mb-6">
        <CardHeader title="Add notice" description="Leave start/end empty to show immediately until you hide it." />
        <CardBody>
          <NoticeForm />
        </CardBody>
      </Card>

      {notices.length === 0 ? (
        <EmptyState title="No notices yet" description="Add a notice above. It will appear as a marquee on public pages while it is active." />
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader
                title={notice.message}
                description={`${notice.starts_at ? formatDateTime(notice.starts_at) : 'Always'} to ${notice.ends_at ? formatDateTime(notice.ends_at) : 'no end'}`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={notice.is_active ? 'green' : 'amber'}>
                      {notice.is_active ? 'published' : 'hidden'}
                    </Badge>
                    <ConfirmDeleteButton
                      action={deleteNoticeAction}
                      id={notice.id}
                      confirm="Delete this notice?"
                    />
                  </div>
                }
              />
              <CardBody>
                <NoticeForm notice={notice} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
