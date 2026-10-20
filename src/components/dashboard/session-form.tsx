'use client';

import { useMemo, useState } from 'react';
import { useFormState } from 'react-dom';
import { createSessionAction } from '@/actions/dashboard';
import { Field, Input, Select } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { findRoomConflict, formatClock, type RoomBooking } from '@/lib/rooms';
import type { Room } from '@/lib/types';

function FormStatus({ state }: { state: { error?: string; success?: string } | null }) {
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

export function SessionForm({
  batches,
  rooms,
  bookings,
  batchId,
  defaultRoomId,
}: {
  batches?: { id: string; name: string; room_id?: string | null }[];
  rooms: Room[];
  bookings: RoomBooking[];
  batchId?: string;
  defaultRoomId?: string | null;
}) {
  const [state, formAction] = useFormState(createSessionAction, null);
  const [selectedBatchId, setSelectedBatchId] = useState(batchId ?? '');
  const [sessionDate, setSessionDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomId, setRoomId] = useState(defaultRoomId ?? '');

  const availability = useMemo(() => {
    return rooms.map((room) => {
      if (!room.is_active) {
        return { room, available: false, reason: 'Inactive' };
      }
      if (!sessionDate || !startTime || !endTime) {
        return { room, available: true, reason: 'Pick date and time' };
      }
      const conflict = findRoomConflict(bookings, room.id, sessionDate, startTime, endTime);
      if (!conflict) {
        return { room, available: true, reason: 'Available' };
      }
      const when = [formatClock(conflict.start_time), formatClock(conflict.end_time)].join('–');
      return {
        room,
        available: false,
        reason: `Booked ${when}${conflict.batch_name ? ` · ${conflict.batch_name}` : ''}`,
      };
    });
  }, [bookings, endTime, rooms, sessionDate, startTime]);

  const selected = availability.find((item) => item.room.id === roomId);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {batchId ? <input type="hidden" name="batch_id" value={batchId} /> : null}
      <div className="sm:col-span-2">
        <FormStatus state={state} />
      </div>
      {batches ? (
        <Field label="Batch">
          <Select
            name="batch_id"
            required
            value={selectedBatchId}
            onChange={(event) => {
              const nextId = event.target.value;
              setSelectedBatchId(nextId);
              const nextBatch = batches.find((batch) => batch.id === nextId);
              setRoomId(nextBatch?.room_id ?? '');
            }}
          >
            <option value="">Select batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label="Title">
        <Input name="title" placeholder="e.g. Chapter 3 - Organic Chemistry" />
      </Field>
      <Field label="Date">
        <Input name="session_date" type="date" required value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} />
      </Field>
      <Field label="Classroom">
        <Select name="room_id" value={roomId} onChange={(event) => setRoomId(event.target.value)}>
          <option value="">No room</option>
          {availability.map(({ room, available, reason }) => (
            <option key={room.id} value={room.id} disabled={!available && room.id !== roomId}>
              {room.name}
              {room.location ? ` · ${room.location}` : ''}
              {` (${available ? 'available' : reason})`}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Start time">
        <Input name="start_time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
      </Field>
      <Field label="End time">
        <Input name="end_time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
      </Field>
      {selected ? (
        <p className={`sm:col-span-2 text-sm ${selected.available ? 'text-emerald-700' : 'text-red-600'}`}>
          {selected.room.name}: {selected.reason}
        </p>
      ) : (
        <p className="sm:col-span-2 text-sm text-slate-500">Pick a date and time to see which classrooms are free.</p>
      )}
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Scheduling...">Add session</SubmitButton>
      </div>
    </form>
  );
}
