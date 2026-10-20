import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { Card, CardBody, EmptyState, PageHeader } from '@/components/ui';
import {
  CategoriesTable,
  LookupsTable,
  RoomsTable,
  SettingsTable,
  type LookupRow,
  type SettingRow,
} from '@/components/dashboard/settings-crud';
import { SettingsTabs } from '@/components/dashboard/settings-tabs';
import type { Category, Room } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const [settingsRes, lookupsRes, categoriesRes, roomsRes] = await Promise.all([
    supabase.from('settings').select('*').order('group_name').order('key'),
    supabase.from('lookups').select('id, type, code, label, label_bn, sort_order, is_active').order('type').order('sort_order'),
    supabase.from('categories').select('id, parent_id, name, slug, description, icon, sort_order, is_active, show_on_home').order('sort_order'),
    supabase.from('rooms').select('*').order('sort_order').order('name'),
  ]);

  const settings = (settingsRes.data as SettingRow[]) ?? [];
  const lookups = (lookupsRes.data as LookupRow[]) ?? [];
  const categories = (categoriesRes.data as Category[]) ?? [];
  const rooms = (roomsRes.data as Room[]) ?? [];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage grouped config, option lists, course categories and classrooms. Use the row menu to edit or delete."
      />

      <SettingsTabs
        settings={
          <Card>
            <CardBody className="p-0">
              {settings.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No settings rows" description="Add a setting to get started." />
                </div>
              ) : null}
              <SettingsTable settings={settings} />
            </CardBody>
          </Card>
        }
        lookups={
          <Card>
            <CardBody className="p-0">
              {lookups.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No lookups" description="Add statuses, payment methods and other option lists." />
                </div>
              ) : null}
              <LookupsTable lookups={lookups} />
            </CardBody>
          </Card>
        }
        categories={
          <Card>
            <CardBody className="p-0">
              {categories.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No categories" description="Add a parent or child category." />
                </div>
              ) : null}
              <CategoriesTable categories={categories} />
            </CardBody>
          </Card>
        }
        rooms={
          <Card>
            <CardBody className="p-0">
              {rooms.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No classrooms" description="Add rooms so scheduled classes can show available or booked." />
                </div>
              ) : null}
              <RoomsTable rooms={rooms} />
            </CardBody>
          </Card>
        }
      />
    </>
  );
}
