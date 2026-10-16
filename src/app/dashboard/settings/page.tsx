import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { updateSettingAction } from '@/actions/dashboard';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface SettingRow {
  id: string;
  group_name: string;
  key: string;
  value: string | null;
  value_type: string;
  is_public: boolean;
}

export default async function SettingsPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const [settingsRes, lookupsRes, categoriesRes] = await Promise.all([
    supabase.from('settings').select('*').order('group_name').order('key'),
    supabase.from('lookups').select('type, code, label, label_bn').order('type').order('sort_order'),
    supabase.from('categories').select('id, parent_id, name, slug, is_active').order('sort_order'),
  ]);

  const settings = (settingsRes.data as SettingRow[]) ?? [];
  const lookups = (lookupsRes.data as { type: string; code: string; label: string; label_bn: string | null }[]) ?? [];
  const categories = (categoriesRes.data as Category[]) ?? [];

  const grouped = settings.reduce<Record<string, SettingRow[]>>((acc, setting) => {
    acc[setting.group_name] = acc[setting.group_name] ?? [];
    acc[setting.group_name].push(setting);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Settings"
        description="Grouped settings for rules and public config, plus the lookups table."
      />

      <div className="space-y-6">
        {Object.entries(grouped).map(([group, items]) => (
          <Card key={group}>
            <CardHeader title={group} description={`${items.length} settings`} />
            <CardBody className="p-0">
              <Table>
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Key</Th>
                    <Th>Value</Th>
                    <Th>Type</Th>
                    <Th>Public</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((setting) => (
                    <tr key={setting.id}>
                      <Td className="font-mono text-xs">{setting.key}</Td>
                      <Td>
                        <form action={updateSettingAction} className="flex items-center gap-2">
                          <input type="hidden" name="key" value={setting.key} />
                          <Input name="value" defaultValue={setting.value ?? ''} className="w-56 py-1" />
                          <SubmitButton size="sm" variant="secondary" pendingLabel="...">
                            Save
                          </SubmitButton>
                        </form>
                      </Td>
                      <Td>
                        <Badge>{setting.value_type}</Badge>
                      </Td>
                      <Td>{setting.is_public ? 'Yes' : 'No'}</Td>
                      <Td />
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        ))}
        {settings.length === 0 ? <EmptyState title="No settings rows" /> : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Lookups" description="Statuses, option lists and payment-method config." />
          <CardBody className="p-0">
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Type</Th>
                  <Th>Code</Th>
                  <Th>Label</Th>
                  <Th>Label (BN)</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lookups.map((lookup) => (
                  <tr key={`${lookup.type}-${lookup.code}`}>
                    <Td className="text-xs text-slate-500">{lookup.type}</Td>
                    <Td className="font-mono text-xs">{lookup.code}</Td>
                    <Td>{lookup.label}</Td>
                    <Td>{lookup.label_bn ?? '-'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Categories" description="Parent/child tree up to 4 levels." />
          <CardBody className="p-0">
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Name</Th>
                  <Th>Slug</Th>
                  <Th>Parent</Th>
                  <Th>Active</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <Td>{category.name}</Td>
                    <Td className="font-mono text-xs">{category.slug}</Td>
                    <Td className="text-xs text-slate-500">
                      {categories.find((item) => item.id === category.parent_id)?.name ?? '-'}
                    </Td>
                    <Td>{category.is_active ? 'Yes' : 'No'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
