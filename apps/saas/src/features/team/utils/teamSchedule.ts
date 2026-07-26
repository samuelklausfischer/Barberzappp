export type TeamSchedulePeriod = { day_of_week: number; start_time: string; end_time: string };
export type TeamMemberDraft = {
  name: string;
  specialties: string;
  bio: string;
  active: boolean;
  schedule: TeamSchedulePeriod[];
};

export const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const timeValid = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const clean = (value: string) => value.trim().replace(/\s+/g, ' ');

export const defaultTeamSchedule = (): TeamSchedulePeriod[] => [
  ...[1, 2, 3, 4, 5].flatMap((day_of_week) => [
    { day_of_week, start_time: '09:00', end_time: '12:00' },
    { day_of_week, start_time: '13:00', end_time: '18:00' },
  ]),
  { day_of_week: 6, start_time: '09:00', end_time: '13:00' },
];

export const emptyTeamMemberDraft = (): TeamMemberDraft => ({
  name: '',
  specialties: '',
  bio: '',
  active: true,
  schedule: defaultTeamSchedule(),
});

export const normalizeTeamSchedule = (schedule: TeamSchedulePeriod[]) =>
  schedule
    .filter(
      (period) =>
        Number.isInteger(period.day_of_week) &&
        period.day_of_week >= 0 &&
        period.day_of_week <= 6 &&
        timeValid(period.start_time) &&
        timeValid(period.end_time) &&
        period.start_time < period.end_time
    )
    .map((period) => ({ ...period }))
    .sort(
      (first, second) =>
        first.day_of_week - second.day_of_week || first.start_time.localeCompare(second.start_time)
    );

export const normalizeSpecialties = (value: string) => value.split(',').map(clean).filter(Boolean);

export const normalizeTeamMemberDraft = (draft: TeamMemberDraft) => ({
  name: clean(draft.name),
  specialties: normalizeSpecialties(draft.specialties),
  bio: draft.bio.trim(),
  active: draft.active,
  schedule: normalizeTeamSchedule(draft.schedule),
});

export const validateTeamMemberDraft = (draft: TeamMemberDraft): string | null => {
  const normalized = normalizeTeamMemberDraft(draft);
  if (normalized.name.length < 2 || normalized.name.length > 80)
    return 'Informe um nome entre 2 e 80 caracteres.';
  if (
    normalized.specialties.length > 12 ||
    normalized.specialties.some((item) => item.length < 2 || item.length > 60) ||
    new Set(normalized.specialties.map((item) => item.toLocaleLowerCase())).size !==
      normalized.specialties.length
  )
    return 'Revise as especialidades informadas.';
  if (normalized.bio.length > 500) return 'A bio deve ter no máximo 500 caracteres.';
  const source = draft.schedule;
  if (source.length > 21) return 'A jornada pode ter no máximo 21 períodos.';
  if (
    source.some(
      (period) =>
        !Number.isInteger(period.day_of_week) ||
        period.day_of_week < 0 ||
        period.day_of_week > 6 ||
        !timeValid(period.start_time) ||
        !timeValid(period.end_time) ||
        period.start_time >= period.end_time
    )
  )
    return 'Revise os horários da jornada.';
  for (let day = 0; day < 7; day += 1) {
    const periods = normalizeTeamSchedule(source.filter((period) => period.day_of_week === day));
    if (
      periods.some((period, index) => index > 0 && periods[index - 1].end_time > period.start_time)
    )
      return 'Há períodos sobrepostos na jornada.';
  }
  return null;
};

export const copyMondayToWeekdays = (schedule: TeamSchedulePeriod[]) => {
  const monday = normalizeTeamSchedule(schedule.filter((period) => period.day_of_week === 1));
  return normalizeTeamSchedule([
    ...schedule.filter((period) => period.day_of_week === 0 || period.day_of_week === 6),
    ...[1, 2, 3, 4, 5].flatMap((day_of_week) =>
      monday.map((period) => ({ ...period, day_of_week }))
    ),
  ]);
};

export const getTeamScheduleSummary = (schedule: TeamSchedulePeriod[]) => {
  const normalized = normalizeTeamSchedule(schedule);
  if (normalized.length === 0) return 'Jornada pendente';
  const days = Array.from(new Set(normalized.map((period) => period.day_of_week)));
  const dayList = days.map((day) => DAY_LABELS[day].slice(0, 3)).join(', ');
  return `${days.length} dia${days.length === 1 ? '' : 's'} (${dayList}) · ${normalized.length} período${normalized.length === 1 ? '' : 's'}`;
};
