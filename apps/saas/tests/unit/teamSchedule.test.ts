import assert from 'node:assert/strict';
import test from 'node:test';
import {
  copyMondayToWeekdays,
  defaultTeamSchedule,
  emptyTeamMemberDraft,
  getTeamScheduleSummary,
  normalizeTeamSchedule,
  normalizeSpecialties,
  normalizeTeamMemberDraft,
  validateTeamMemberDraft,
} from '../../src/features/team/utils/teamSchedule.ts';
test('default schedule covers weekday split and saturday', () =>
  assert.equal(defaultTeamSchedule().length, 11));
test('normalizes name specialties and bio', () =>
  assert.deepEqual(
    normalizeTeamMemberDraft({
      ...emptyTeamMemberDraft(),
      name: '  Ana   Silva ',
      specialties: ' Corte, barba, Corte ',
      bio: ' oi ',
    }).specialties,
    ['Corte', 'barba', 'Corte']
  ));
test('validates boundaries and overlap but accepts touching intervals', () => {
  const base = { ...emptyTeamMemberDraft(), name: 'Ana' };
  assert.equal(
    validateTeamMemberDraft({
      ...base,
      schedule: [
        { day_of_week: 1, start_time: '09:00', end_time: '12:00' },
        { day_of_week: 1, start_time: '12:00', end_time: '18:00' },
      ],
    }),
    null
  );
  assert.ok(
    validateTeamMemberDraft({
      ...base,
      schedule: [
        { day_of_week: 1, start_time: '09:00', end_time: '12:00' },
        { day_of_week: 1, start_time: '11:59', end_time: '18:00' },
      ],
    })
  );
  assert.ok(validateTeamMemberDraft({ ...base, name: 'A' }));
  assert.ok(validateTeamMemberDraft({ ...base, bio: 'a'.repeat(501) }));
});
test('copies monday and accepts empty schedule', () => {
  const copied = copyMondayToWeekdays([{ day_of_week: 1, start_time: '10:00', end_time: '16:00' }]);
  assert.equal(copied.length, 5);
  assert.equal(
    validateTeamMemberDraft({ ...emptyTeamMemberDraft(), name: 'Ana', schedule: [] }),
    null
  );
  assert.deepEqual(normalizeSpecialties(' corte, Corte, barba '), ['corte', 'Corte', 'barba']);
});

test('rejects invalid days, invalid times and specialty limits', () => {
  const base = { ...emptyTeamMemberDraft(), name: 'Ana' };
  assert.ok(
    validateTeamMemberDraft({
      ...base,
      schedule: [{ day_of_week: 7, start_time: '09:00', end_time: '10:00' }],
    })
  );
  assert.ok(
    validateTeamMemberDraft({
      ...base,
      schedule: [{ day_of_week: 1, start_time: '24:00', end_time: '10:00' }],
    })
  );
  assert.ok(
    validateTeamMemberDraft({
      ...base,
      specialties: Array.from({ length: 13 }, (_, index) => `Especialidade ${index}`).join(','),
    })
  );
  assert.ok(validateTeamMemberDraft({ ...base, specialties: 'a' }));
  assert.ok(validateTeamMemberDraft({ ...base, name: ' '.repeat(81) }));
});

test('normalizes and summarizes sorted schedules', () => {
  const schedule = normalizeTeamSchedule([
    { day_of_week: 6, start_time: '10:00', end_time: '12:00' },
    { day_of_week: 1, start_time: '09:00', end_time: '10:00' },
    { day_of_week: 1, start_time: '13:00', end_time: '14:00' },
  ]);
  assert.deepEqual(
    schedule.map((period) => period.day_of_week),
    [1, 1, 6]
  );
  assert.equal(getTeamScheduleSummary(schedule), '2 dias (Seg, Sáb) · 3 períodos');
  assert.equal(getTeamScheduleSummary([]), 'Jornada pendente');
});

test('does not silently truncate or deduplicate specialties and limits periods', () => {
  const base = { ...emptyTeamMemberDraft(), name: 'Ana' };
  assert.deepEqual(normalizeSpecialties(`${'a'.repeat(61)}, Corte, corte`), [
    `${'a'.repeat(61)}`,
    'Corte',
    'corte',
  ]);
  assert.ok(validateTeamMemberDraft({ ...base, specialties: `${'a'.repeat(61)}, Barba` }));
  assert.ok(validateTeamMemberDraft({ ...base, specialties: 'Corte, corte' }));
  assert.ok(
    validateTeamMemberDraft({
      ...base,
      specialties: Array.from({ length: 13 }, (_, index) => `Especialidade ${index}`).join(', '),
    })
  );
  assert.ok(
    validateTeamMemberDraft({
      ...base,
      schedule: Array.from({ length: 22 }, () => ({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:00',
      })),
    })
  );
});
