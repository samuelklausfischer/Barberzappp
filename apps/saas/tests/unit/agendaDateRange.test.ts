import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addCalendarDays,
  getAgendaDayRange,
} from '../../src/features/appointments/utils/agendaDateRange.ts';

test('getAgendaDayRange creates an inclusive-exclusive day range for Sao Paulo', () => {
  assert.deepEqual(getAgendaDayRange('2026-07-26', 'America/Sao_Paulo'), {
    startsAt: '2026-07-26T03:00:00.000Z',
    endsAt: '2026-07-27T03:00:00.000Z',
  });
});

test('getAgendaDayRange keeps calendar boundaries across leap day and year changes', () => {
  assert.deepEqual(getAgendaDayRange('2024-02-29', 'America/Sao_Paulo'), {
    startsAt: '2024-02-29T03:00:00.000Z',
    endsAt: '2024-03-01T03:00:00.000Z',
  });
  assert.deepEqual(getAgendaDayRange('2025-12-31', 'America/Sao_Paulo'), {
    startsAt: '2025-12-31T03:00:00.000Z',
    endsAt: '2026-01-01T03:00:00.000Z',
  });
});

test('getAgendaDayRange rejects invalid calendar dates', () => {
  assert.throws(() => getAgendaDayRange('2026-02-29'), /não é válida/);
  assert.throws(() => getAgendaDayRange('26-07-2026'), /YYYY-MM-DD/);
});

test('addCalendarDays crosses month, year and leap-day boundaries', () => {
  assert.equal(addCalendarDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addCalendarDays('2024-02-29', 1), '2024-03-01');
  assert.equal(addCalendarDays('2025-01-01', -1), '2024-12-31');
});
