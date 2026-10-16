import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { ROLE_HOME, ROLE_LABEL } from '@/lib/constants';
import { updateUserRoleAction, toggleUserActiveAction } from '@/actions/dashboard';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Profile, UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

const roles: UserRole[] = ['admin', 'accountant', 'instructor', 'editor', 'student'];

export default async function UsersPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (role !== 'admin') redirect(ROLE_HOME[role]);

  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  const users = (data as Profile[]) ?? [];

  return (
    <>
      <PageHeader
        title="Users"
        description="Change roles and deactivate accounts. New sign-ups are always students."
      />

      <Card>
        <CardBody className="p-0">
          {users.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No users yet" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <Td>{user.full_name ?? '-'}</Td>
                    <Td className="text-xs text-slate-500">{user.email}</Td>
                    <Td>
                      <form action={updateUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <Select name="role" defaultValue={user.role} className="w-32 py-1 text-xs">
                          {roles.map((item) => (
                            <option key={item} value={item}>
                              {ROLE_LABEL[item]}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" size="sm" variant="secondary">
                          Save
                        </Button>
                      </form>
                    </Td>
                    <Td>
                      <Badge tone={user.is_active ? 'green' : 'red'}>
                        {user.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </Td>
                    <Td className="text-xs text-slate-500">{formatDate(user.created_at)}</Td>
                    <Td>
                      <form action={toggleUserActiveAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="is_active" value={String(user.is_active)} />
                        <Button type="submit" size="sm" variant="outline">
                          {user.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </form>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
