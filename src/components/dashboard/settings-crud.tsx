'use client';

import { useMemo, useState } from 'react';
import { useFormState } from 'react-dom';
import {
  createCategoryAction,
  createLookupAction,
  createRoomAction,
  createSettingAction,
  deleteCategoryAction,
  deleteLookupAction,
  deleteRoomAction,
  deleteSettingAction,
  updateCategoryAction,
  updateLookupAction,
  updateRoomAction,
  updateSettingAction,
} from '@/actions/dashboard';
import { Badge, Button, Field, Input, Select, Table, Td, Th, Textarea } from '@/components/ui';
import { Modal } from '@/components/dashboard/modal';
import { RowActionButton, RowActions } from '@/components/dashboard/row-actions';
import { SubmitButton } from '@/components/dashboard/submit-button';
import type { Category, Room } from '@/lib/types';

type ActionResult = { error?: string; success?: string } | null;

function FormStatus({ state }: { state: ActionResult }) {
  if (state?.error) {
    return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  }
  if (state?.success) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {state.success}
      </p>
    );
  }
  return null;
}

export interface SettingRow {
  id: string;
  group_name: string;
  key: string;
  value: string | null;
  value_type: string;
  is_public: boolean;
}

export interface LookupRow {
  id: string;
  type: string;
  code: string;
  label: string;
  label_bn: string | null;
  sort_order: number;
  is_active: boolean;
}

function SettingFields({ setting, groups }: { setting?: SettingRow; groups: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {setting ? <input type="hidden" name="id" value={setting.id} /> : null}
      <Field label="Group">
        <Input name="group_name" required defaultValue={setting?.group_name ?? ''} list="setting-groups" />
        <datalist id="setting-groups">
          {groups.map((group) => (
            <option key={group} value={group} />
          ))}
        </datalist>
      </Field>
      <Field label="Key">
        <Input name="key" required defaultValue={setting?.key ?? ''} placeholder="e.g. attendance_pass_percent" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Value">
          <Textarea name="value" defaultValue={setting?.value ?? ''} className="min-h-[72px]" />
        </Field>
      </div>
      <Field label="Type">
        <Select name="value_type" defaultValue={setting?.value_type ?? 'text'}>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="json">JSON</option>
        </Select>
      </Field>
      <Field label="Public">
        <Select name="is_public" defaultValue={setting?.is_public ? 'on' : 'off'}>
          <option value="off">Staff only</option>
          <option value="on">Public</option>
        </Select>
      </Field>
    </div>
  );
}

export function SettingsTable({ settings }: { settings: SettingRow[] }) {
  const [mode, setMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [current, setCurrent] = useState<SettingRow | null>(null);
  const [createState, createAction] = useFormState(createSettingAction, null);
  const [updateState, updateAction] = useFormState(updateSettingAction, null);
  const [deleteState, deleteAction] = useFormState(deleteSettingAction, null);
  const groups = useMemo(
    () => Array.from(new Set(settings.map((item) => item.group_name))).sort(),
    [settings],
  );
  const grouped = useMemo(() => {
    return settings.reduce<Record<string, SettingRow[]>>((acc, setting) => {
      acc[setting.group_name] = acc[setting.group_name] ?? [];
      acc[setting.group_name].push(setting);
      return acc;
    }, {});
  }, [settings]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end px-5 pt-4">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCurrent(null);
            setMode('create');
          }}
        >
          Add setting
        </Button>
      </div>
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          <div className="border-b border-slate-100 px-5 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group} · {items.length}
            </p>
          </div>
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
                  <Td className="max-w-xs truncate text-xs text-slate-600">{setting.value ?? '-'}</Td>
                  <Td>
                    <Badge>{setting.value_type}</Badge>
                  </Td>
                  <Td>{setting.is_public ? 'Yes' : 'No'}</Td>
                  <Td>
                    <RowActions>
                      <RowActionButton
                        onClick={() => {
                          setCurrent(setting);
                          setMode('edit');
                        }}
                      >
                        Edit
                      </RowActionButton>
                      <RowActionButton
                        tone="danger"
                        onClick={() => {
                          setCurrent(setting);
                          setMode('delete');
                        }}
                      >
                        Delete
                      </RowActionButton>
                    </RowActions>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ))}

      <Modal
        open={mode === 'create'}
        title="Add setting"
        description="Keys must be unique. Public settings can appear on the website."
        onClose={() => setMode(null)}
      >
        <form action={createAction} className="space-y-4">
          <FormStatus state={createState} />
          <SettingFields groups={groups} />
          <SubmitButton pendingLabel="Adding...">Add setting</SubmitButton>
        </form>
      </Modal>

      <Modal
        open={mode === 'edit' && Boolean(current)}
        title="Edit setting"
        description={current?.key}
        onClose={() => setMode(null)}
      >
        {current ? (
          <form action={updateAction} className="space-y-4">
            <FormStatus state={updateState} />
            <SettingFields setting={current} groups={groups} />
            <SubmitButton pendingLabel="Saving...">Save setting</SubmitButton>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={mode === 'delete' && Boolean(current)}
        title="Delete setting"
        description="This cannot be undone."
        onClose={() => setMode(null)}
      >
        {current ? (
          <form action={deleteAction} className="space-y-4">
            <input type="hidden" name="id" value={current.id} />
            <FormStatus state={deleteState} />
            <p className="text-sm text-slate-600">
              Delete <span className="font-mono text-xs">{current.key}</span>?
            </p>
            <SubmitButton variant="danger" pendingLabel="Deleting...">
              Delete
            </SubmitButton>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function LookupFields({ lookup }: { lookup?: LookupRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lookup ? <input type="hidden" name="id" value={lookup.id} /> : null}
      <Field label="Type">
        <Input name="type" required defaultValue={lookup?.type ?? ''} placeholder="e.g. payment_method" />
      </Field>
      <Field label="Code">
        <Input name="code" required defaultValue={lookup?.code ?? ''} placeholder="e.g. bkash" />
      </Field>
      <Field label="Label">
        <Input name="label" required defaultValue={lookup?.label ?? ''} />
      </Field>
      <Field label="Label (BN)">
        <Input name="label_bn" defaultValue={lookup?.label_bn ?? ''} />
      </Field>
      <Field label="Order">
        <Input name="sort_order" type="number" defaultValue={lookup?.sort_order ?? 0} />
      </Field>
      <Field label="Active">
        <Select name="is_active" defaultValue={lookup?.is_active === false ? 'off' : 'on'}>
          <option value="on">Active</option>
          <option value="off">Inactive</option>
        </Select>
      </Field>
    </div>
  );
}

export function LookupsTable({ lookups }: { lookups: LookupRow[] }) {
  const [mode, setMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [current, setCurrent] = useState<LookupRow | null>(null);
  const [createState, createAction] = useFormState(createLookupAction, null);
  const [updateState, updateAction] = useFormState(updateLookupAction, null);
  const [deleteState, deleteAction] = useFormState(deleteLookupAction, null);

  return (
    <div>
      <div className="flex justify-end px-5 py-4">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCurrent(null);
            setMode('create');
          }}
        >
          Add lookup
        </Button>
      </div>
      <Table>
        <thead className="bg-slate-50">
          <tr>
            <Th>Type</Th>
            <Th>Code</Th>
            <Th>Label</Th>
            <Th>Label (BN)</Th>
            <Th>Active</Th>
            <Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lookups.map((lookup) => (
            <tr key={lookup.id}>
              <Td className="text-xs text-slate-500">{lookup.type}</Td>
              <Td className="font-mono text-xs">{lookup.code}</Td>
              <Td>{lookup.label}</Td>
              <Td>{lookup.label_bn ?? '-'}</Td>
              <Td>
                <Badge tone={lookup.is_active ? 'green' : 'slate'}>{lookup.is_active ? 'Yes' : 'No'}</Badge>
              </Td>
              <Td>
                <RowActions>
                  <RowActionButton
                    onClick={() => {
                      setCurrent(lookup);
                      setMode('edit');
                    }}
                  >
                    Edit
                  </RowActionButton>
                  <RowActionButton
                    tone="danger"
                    onClick={() => {
                      setCurrent(lookup);
                      setMode('delete');
                    }}
                  >
                    Delete
                  </RowActionButton>
                </RowActions>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal open={mode === 'create'} title="Add lookup" onClose={() => setMode(null)}>
        <form action={createAction} className="space-y-4">
          <FormStatus state={createState} />
          <LookupFields />
          <SubmitButton pendingLabel="Adding...">Add lookup</SubmitButton>
        </form>
      </Modal>
      <Modal open={mode === 'edit' && Boolean(current)} title="Edit lookup" onClose={() => setMode(null)}>
        {current ? (
          <form action={updateAction} className="space-y-4">
            <FormStatus state={updateState} />
            <LookupFields lookup={current} />
            <SubmitButton pendingLabel="Saving...">Save lookup</SubmitButton>
          </form>
        ) : null}
      </Modal>
      <Modal open={mode === 'delete' && Boolean(current)} title="Delete lookup" onClose={() => setMode(null)}>
        {current ? (
          <form action={deleteAction} className="space-y-4">
            <input type="hidden" name="id" value={current.id} />
            <FormStatus state={deleteState} />
            <p className="text-sm text-slate-600">
              Delete {current.type}/{current.code}?
            </p>
            <SubmitButton variant="danger" pendingLabel="Deleting...">
              Delete
            </SubmitButton>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function CategoryFields({ category, categories }: { category?: Category; categories: Category[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <Field label="Name">
        <Input name="name" required defaultValue={category?.name ?? ''} />
      </Field>
      <Field label="Slug">
        <Input name="slug" defaultValue={category?.slug ?? ''} placeholder="auto from name" />
      </Field>
      <Field label="Parent">
        <Select name="parent_id" defaultValue={category?.parent_id ?? ''}>
          <option value="">None</option>
          {categories
            .filter((item) => item.id !== category?.id)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </Select>
      </Field>
      <Field label="Order">
        <Input name="sort_order" type="number" defaultValue={category?.sort_order ?? 0} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description">
          <Textarea name="description" defaultValue={category?.description ?? ''} className="min-h-[72px]" />
        </Field>
      </div>
      <Field label="Active">
        <Select name="is_active" defaultValue={category?.is_active === false ? 'off' : 'on'}>
          <option value="on">Active</option>
          <option value="off">Inactive</option>
        </Select>
      </Field>
      <Field label="Show on home">
        <Select name="show_on_home" defaultValue={category?.show_on_home === false ? 'off' : 'on'}>
          <option value="on">Yes</option>
          <option value="off">No</option>
        </Select>
      </Field>
    </div>
  );
}

export function CategoriesTable({ categories }: { categories: Category[] }) {
  const [mode, setMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [current, setCurrent] = useState<Category | null>(null);
  const [createState, createAction] = useFormState(createCategoryAction, null);
  const [updateState, updateAction] = useFormState(updateCategoryAction, null);
  const [deleteState, deleteAction] = useFormState(deleteCategoryAction, null);

  return (
    <div>
      <div className="flex justify-end px-5 py-4">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCurrent(null);
            setMode('create');
          }}
        >
          Add category
        </Button>
      </div>
      <Table>
        <thead className="bg-slate-50">
          <tr>
            <Th>Name</Th>
            <Th>Slug</Th>
            <Th>Parent</Th>
            <Th>Active</Th>
            <Th>Home</Th>
            <Th />
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
              <Td>{category.show_on_home === false ? 'No' : 'Yes'}</Td>
              <Td>
                <RowActions>
                  <RowActionButton
                    onClick={() => {
                      setCurrent(category);
                      setMode('edit');
                    }}
                  >
                    Edit
                  </RowActionButton>
                  <RowActionButton
                    tone="danger"
                    onClick={() => {
                      setCurrent(category);
                      setMode('delete');
                    }}
                  >
                    Delete
                  </RowActionButton>
                </RowActions>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal open={mode === 'create'} title="Add category" onClose={() => setMode(null)}>
        <form action={createAction} className="space-y-4">
          <FormStatus state={createState} />
          <CategoryFields categories={categories} />
          <SubmitButton pendingLabel="Adding...">Add category</SubmitButton>
        </form>
      </Modal>
      <Modal open={mode === 'edit' && Boolean(current)} title="Edit category" onClose={() => setMode(null)}>
        {current ? (
          <form action={updateAction} className="space-y-4">
            <FormStatus state={updateState} />
            <CategoryFields category={current} categories={categories} />
            <SubmitButton pendingLabel="Saving...">Save category</SubmitButton>
          </form>
        ) : null}
      </Modal>
      <Modal open={mode === 'delete' && Boolean(current)} title="Delete category" onClose={() => setMode(null)}>
        {current ? (
          <form action={deleteAction} className="space-y-4">
            <input type="hidden" name="id" value={current.id} />
            <FormStatus state={deleteState} />
            <p className="text-sm text-slate-600">Delete {current.name}? Child categories keep their parent cleared.</p>
            <SubmitButton variant="danger" pendingLabel="Deleting...">
              Delete
            </SubmitButton>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function RoomFields({ room }: { room?: Room }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {room ? <input type="hidden" name="id" value={room.id} /> : null}
      <Field label="Name">
        <Input name="name" required defaultValue={room?.name ?? ''} placeholder="e.g. Room 101" />
      </Field>
      <Field label="Code">
        <Input name="code" defaultValue={room?.code ?? ''} placeholder="auto from name" />
      </Field>
      <Field label="Capacity">
        <Input name="capacity" type="number" min="0" defaultValue={room?.capacity ?? ''} />
      </Field>
      <Field label="Location">
        <Input name="location" defaultValue={room?.location ?? ''} placeholder="e.g. 2nd floor" />
      </Field>
      <Field label="Order">
        <Input name="sort_order" type="number" defaultValue={room?.sort_order ?? 0} />
      </Field>
      <Field label="Active">
        <Select name="is_active" defaultValue={room?.is_active === false ? 'off' : 'on'}>
          <option value="on">Active</option>
          <option value="off">Inactive</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes">
          <Textarea name="notes" defaultValue={room?.notes ?? ''} className="min-h-[72px]" />
        </Field>
      </div>
    </div>
  );
}

export function RoomsTable({ rooms }: { rooms: Room[] }) {
  const [mode, setMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [current, setCurrent] = useState<Room | null>(null);
  const [createState, createAction] = useFormState(createRoomAction, null);
  const [updateState, updateAction] = useFormState(updateRoomAction, null);
  const [deleteState, deleteAction] = useFormState(deleteRoomAction, null);

  return (
    <div>
      <div className="flex justify-end px-5 py-4">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCurrent(null);
            setMode('create');
          }}
        >
          Add classroom
        </Button>
      </div>
      <Table>
        <thead className="bg-slate-50">
          <tr>
            <Th>Room</Th>
            <Th>Code</Th>
            <Th>Location</Th>
            <Th>Capacity</Th>
            <Th>Active</Th>
            <Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rooms.map((room) => (
            <tr key={room.id}>
              <Td className="font-medium text-slate-900">{room.name}</Td>
              <Td className="font-mono text-xs">{room.code}</Td>
              <Td className="text-xs text-slate-500">{room.location ?? '-'}</Td>
              <Td>{room.capacity ?? '-'}</Td>
              <Td>{room.is_active ? 'Yes' : 'No'}</Td>
              <Td>
                <RowActions>
                  <RowActionButton
                    onClick={() => {
                      setCurrent(room);
                      setMode('edit');
                    }}
                  >
                    Edit
                  </RowActionButton>
                  <RowActionButton
                    tone="danger"
                    onClick={() => {
                      setCurrent(room);
                      setMode('delete');
                    }}
                  >
                    Delete
                  </RowActionButton>
                </RowActions>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal open={mode === 'create'} title="Add classroom" onClose={() => setMode(null)}>
        <form action={createAction} className="space-y-4">
          <FormStatus state={createState} />
          <RoomFields />
          <SubmitButton pendingLabel="Adding...">Add classroom</SubmitButton>
        </form>
      </Modal>
      <Modal open={mode === 'edit' && Boolean(current)} title="Edit classroom" onClose={() => setMode(null)}>
        {current ? (
          <form action={updateAction} className="space-y-4">
            <FormStatus state={updateState} />
            <RoomFields room={current} />
            <SubmitButton pendingLabel="Saving...">Save classroom</SubmitButton>
          </form>
        ) : null}
      </Modal>
      <Modal open={mode === 'delete' && Boolean(current)} title="Delete classroom" onClose={() => setMode(null)}>
        {current ? (
          <form action={deleteAction} className="space-y-4">
            <input type="hidden" name="id" value={current.id} />
            <FormStatus state={deleteState} />
            <p className="text-sm text-slate-600">
              Delete {current.name}? Scheduled classes keep their date but lose this room assignment.
            </p>
            <SubmitButton variant="danger" pendingLabel="Deleting...">
              Delete
            </SubmitButton>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
