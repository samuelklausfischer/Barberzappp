export const DEFAULT_AGENDA_TIME_ZONE = 'America/Sao_Paulo';

export const resolveAgendaTimeZone = (value: string | null | undefined) => {
  if (!value) return DEFAULT_AGENDA_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return value;
  } catch {
    return DEFAULT_AGENDA_TIME_ZONE;
  }
};
