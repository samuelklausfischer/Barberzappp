import { DEFAULT_AGENDA_TIME_ZONE } from '../../../config/timeZone.ts';

export { DEFAULT_AGENDA_TIME_ZONE, resolveAgendaTimeZone } from '../../../config/timeZone.ts';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string) => {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
};

const parseCalendarDate = (date: string) => {
  const match = DATE_PATTERN.exec(date);
  if (!match) throw new Error('A data da agenda deve usar o formato YYYY-MM-DD.');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error('A data da agenda não é válida.');
  }

  return { year, month, day };
};

const getDateParts = (instant: Date, timeZone: string): DateParts => {
  const parts = getFormatter(timeZone).formatToParts(instant);
  const values = Object.fromEntries(
    parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, Number(value)])
  ) as Record<string, number>;

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
};

const getOffsetMilliseconds = (instant: Date, timeZone: string) => {
  const parts = getDateParts(instant, timeZone);
  const displayedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return displayedAsUtc - instant.getTime();
};

const calendarDateAtMidnightInTimeZone = (date: string, timeZone: string) => {
  const { year, month, day } = parseCalendarDate(date);
  const intendedUtc = Date.UTC(year, month - 1, day);
  let instant = new Date(intendedUtc - getOffsetMilliseconds(new Date(intendedUtc), timeZone));

  // Recalculate once after applying the offset to correctly handle daylight-saving boundaries.
  const correctedOffset = getOffsetMilliseconds(instant, timeZone);
  instant = new Date(intendedUtc - correctedOffset);
  return instant;
};

export const addCalendarDays = (date: string, days: number) => {
  const { year, month, day } = parseCalendarDate(date);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
};

export const getAgendaDayRange = (date: string, timeZone = DEFAULT_AGENDA_TIME_ZONE) => {
  const startsAt = calendarDateAtMidnightInTimeZone(date, timeZone);
  const endsAt = calendarDateAtMidnightInTimeZone(addCalendarDays(date, 1), timeZone);

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
};

/** Converts a calendar date and wall-clock time in the agenda timezone to an ISO instant. */
export const getAgendaDateTime = (
  date: string,
  time: string,
  timeZone = DEFAULT_AGENDA_TIME_ZONE
) => {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('O hor\u00e1rio da agenda deve usar o formato HH:MM.');
  }

  const [hour, minute] = time.split(':').map(Number);
  if (hour > 23 || minute > 59)
    throw new Error('O hor\u00e1rio da agenda n\u00e3o \u00e9 v\u00e1lido.');

  const startOfDay = new Date(getAgendaDayRange(date, timeZone).startsAt);
  return new Date(startOfDay.getTime() + (hour * 60 + minute) * 60_000).toISOString();
};
