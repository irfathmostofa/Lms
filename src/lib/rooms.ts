export interface RoomBooking {
  id: string;
  room_id: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  title?: string | null;
  batch_name?: string | null;
}

export function normalizeTime(value: string | null | undefined) {
  if (!value) return null;
  const parts = value.split(':');
  if (parts.length < 2) return null;
  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1].padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatClock(value: string | null | undefined) {
  const time = normalizeTime(value);
  return time ?? '-';
}

export function timesOverlap(
  startA: string | null,
  endA: string | null,
  startB: string | null,
  endB: string | null,
) {
  if (!startA || !endA || !startB || !endB) return true;
  return startA < endB && startB < endA;
}

export function findRoomConflict(
  bookings: RoomBooking[],
  roomId: string,
  sessionDate: string,
  startTime: string | null,
  endTime: string | null,
  ignoreId?: string,
) {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  return (
    bookings.find((booking) => {
      if (booking.room_id !== roomId) return false;
      if (booking.session_date !== sessionDate) return false;
      if (booking.status === 'cancelled') return false;
      if (ignoreId && booking.id === ignoreId) return false;
      return timesOverlap(start, end, normalizeTime(booking.start_time), normalizeTime(booking.end_time));
    }) ?? null
  );
}
