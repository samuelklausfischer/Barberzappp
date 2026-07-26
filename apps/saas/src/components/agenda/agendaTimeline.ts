import type { AgendaAppointment } from '../../features/appointments/types';

export type TimelineItem = {
  appointment: AgendaAppointment;
  startMinutes: number;
  endMinutes: number;
  lane: number;
  laneCount: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const getTimeFormatter = (timeZone: string) => {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
};

export const getMinutesInAgendaDay = (
  timestamp: string,
  timeZone: string
) => {
  const parts = Object.fromEntries(
    getTimeFormatter(timeZone)
      .formatToParts(new Date(timestamp))
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)])
  ) as Record<string, number>;

  return parts.hour * 60 + parts.minute;
};

/**
 * Assigns non-overlapping visual lanes within each overlapping time cluster.
 * Appointments that meet exactly at a boundary can reuse the same lane.
 */
export const getTimelineItems = (
  appointments: AgendaAppointment[],
  timeZone: string
): TimelineItem[] => {
  const sorted = appointments
    .map((appointment) => {
      const startMinutes = getMinutesInAgendaDay(appointment.startsAt, timeZone);
      const visualDuration = Math.max(appointment.durationMinutes ?? 30, 30);
      return {
        appointment,
        startMinutes,
        endMinutes: startMinutes + visualDuration,
        lane: 0,
        laneCount: 1,
      };
    })
    .sort(
      (first, second) =>
        first.startMinutes - second.startMinutes || first.endMinutes - second.endMinutes
    );

  let cluster: TimelineItem[] = [];
  let active: TimelineItem[] = [];
  let clusterEnd = -1;
  const finalizeCluster = () => {
    const laneCount = Math.max(1, ...cluster.map((item) => item.lane + 1));
    cluster.forEach((item) => {
      item.laneCount = laneCount;
    });
  };

  sorted.forEach((item) => {
    if (cluster.length > 0 && item.startMinutes >= clusterEnd) {
      finalizeCluster();
      cluster = [];
      active = [];
      clusterEnd = -1;
    }

    active = active.filter((activeItem) => activeItem.endMinutes > item.startMinutes);
    const usedLanes = new Set(active.map((activeItem) => activeItem.lane));
    while (usedLanes.has(item.lane)) item.lane += 1;

    active.push(item);
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMinutes);
  });
  if (cluster.length > 0) finalizeCluster();

  return sorted;
};
