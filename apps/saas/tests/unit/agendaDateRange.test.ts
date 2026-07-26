import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addCalendarDays,
  getAgendaDateTime,
  getAgendaDayRange,
  resolveAgendaTimeZone,
} from '../../src/features/appointments/utils/agendaDateRange.ts';
import {
  getManualAppointmentEndAt,
  getManualAppointmentTotals,
  getSafeManualAppointmentEndAt,
  getServiceDurationMinutes,
  getValidWorkingHoursForDate,
  isManualAppointmentWithinWorkingHours,
  isValidWorkingHoursInterval,
  isWorkingHoursRowActive,
  normalizeWorkingHoursTime,
  validateManualAppointmentDraft,
} from '../../src/features/appointments/utils/manualAppointment.ts';

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

test('getAgendaDateTime creates an instant from the agenda wall-clock time', () => {
  assert.equal(getAgendaDateTime('2026-07-26', '09:30'), '2026-07-26T12:30:00.000Z');
  assert.equal(
    getAgendaDateTime('2026-07-26', '09:30', 'America/Manaus'),
    '2026-07-26T13:30:00.000Z'
  );
  assert.deepEqual(getAgendaDayRange('2026-07-26', 'America/Manaus'), {
    startsAt: '2026-07-26T04:00:00.000Z',
    endsAt: '2026-07-27T04:00:00.000Z',
  });
  assert.throws(() => getAgendaDateTime('2026-07-26', '28:00'));
});

test('tenant timezone validation preserves valid zones and safely falls back', () => {
  assert.equal(resolveAgendaTimeZone('America/Manaus'), 'America/Manaus');
  assert.equal(resolveAgendaTimeZone('America/Sao_Paulo'), 'America/Sao_Paulo');
  assert.equal(resolveAgendaTimeZone('Invalid/Timezone'), 'America/Sao_Paulo');
  assert.equal(resolveAgendaTimeZone(null), 'America/Sao_Paulo');
});

test('manual appointment totals, ending time and draft validation are deterministic', () => {
  const services = [
    { id: '1', name: 'Corte', durationMinutes: 40, price: 50 },
    { id: '2', name: 'Barba', durationMinutes: 20, price: 30 },
  ];
  assert.deepEqual(getManualAppointmentTotals(services), { durationMinutes: 60, price: 80 });
  assert.equal(
    getManualAppointmentEndAt('2026-07-26', '09:30', services),
    '2026-07-26T13:30:00.000Z'
  );
  assert.equal(
    getManualAppointmentEndAt('2026-07-27', '09:30', services),
    '2026-07-27T13:30:00.000Z'
  );
  assert.equal(getSafeManualAppointmentEndAt('2026-07-26', '', services), null);
  assert.equal(
    validateManualAppointmentDraft({
      clientId: '',
      barberId: '1',
      serviceIds: ['1'],
      date: '2026-07-26',
      time: '09:30',
    }),
    'Selecione um cliente.'
  );
  assert.ok(
    validateManualAppointmentDraft({
      clientId: '1',
      barberId: '1',
      serviceIds: ['1'],
      date: '2026-07-26',
      time: '09:30',
      now: new Date('2026-07-26T12:31:00.000Z'),
    })
  );
});

test('service duration mirrors the RPC fallback rule', () => {
  assert.equal(getServiceDurationMinutes(30, 45), 30);
  assert.equal(getServiceDurationMinutes(0, 45), 45);
  assert.equal(getServiceDurationMinutes(null, 45), 45);
  assert.equal(getServiceDurationMinutes(0, null), null);
  assert.equal(getServiceDurationMinutes(-5, 45), null);
});

test('manual appointment availability uses the calendar date and requires one complete work interval', () => {
  const hours = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isActive: true },
    { dayOfWeek: 1, startTime: '13:00', endTime: '18:00', isActive: true },
    { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', isActive: true },
    { dayOfWeek: 1, startTime: 'bad', endTime: '18:00', isActive: true },
    { dayOfWeek: 1, startTime: '16:00', endTime: '16:00', isActive: true },
    { dayOfWeek: 7, startTime: '09:00', endTime: '18:00', isActive: true },
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: false },
  ];

  assert.equal(getValidWorkingHoursForDate('2026-07-27', hours).length, 2); // Monday
  assert.equal(getValidWorkingHoursForDate('2026-07-26', hours).length, 1); // Sunday
  assert.equal(
    isManualAppointmentWithinWorkingHours({
      date: '2026-07-27',
      time: '09:00',
      durationMinutes: 180,
      workingHours: hours,
    }),
    true
  );
  assert.equal(
    isManualAppointmentWithinWorkingHours({
      date: '2026-07-27',
      time: '11:30',
      durationMinutes: 60,
      workingHours: hours,
    }),
    false
  );
  assert.equal(
    isManualAppointmentWithinWorkingHours({
      date: '2026-07-27',
      time: '17:30',
      durationMinutes: 30,
      workingHours: hours,
    }),
    true
  );
  assert.equal(
    isManualAppointmentWithinWorkingHours({
      date: '2026-07-27',
      time: '17:31',
      durationMinutes: 30,
      workingHours: hours,
    }),
    false
  );
  assert.equal(
    isManualAppointmentWithinWorkingHours({
      date: '2026-07-27',
      time: '09:00',
      durationMinutes: 30,
      workingHours: [],
    }),
    false
  );
  assert.equal(
    isManualAppointmentWithinWorkingHours({
      date: '2026-07-27',
      time: '99:00',
      durationMinutes: 30,
      workingHours: hours,
    }),
    false
  );
  assert.equal(
    isManualAppointmentWithinWorkingHours({
      date: '2026-07-27',
      time: '09:00',
      durationMinutes: 0,
      workingHours: hours,
    }),
    false
  );
  assert.equal(
    isManualAppointmentWithinWorkingHours({
      date: '2026-07-27',
      time: '09:00',
      durationMinutes: Number.NaN,
      workingHours: hours,
    }),
    false
  );
  assert.equal(
    isValidWorkingHoursInterval({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:00',
      isActive: false,
    }),
    false
  );
  assert.equal(
    isValidWorkingHoursInterval({
      dayOfWeek: -1,
      startTime: '09:00',
      endTime: '18:00',
      isActive: true,
    }),
    false
  );
  assert.equal(
    isValidWorkingHoursInterval({
      dayOfWeek: 1,
      startTime: '18:00',
      endTime: '09:00',
      isActive: true,
    }),
    false
  );
  assert.equal(
    isValidWorkingHoursInterval({
      dayOfWeek: 1,
      startTime: '09:75',
      endTime: '18:00',
      isActive: true,
    }),
    false
  );
  assert.throws(() => getValidWorkingHoursForDate('2026-02-29', hours), /não é válida/);
});

test('database working-hours values normalize seconds and require explicit active true', () => {
  assert.equal(normalizeWorkingHoursTime('09:00'), '09:00');
  assert.equal(normalizeWorkingHoursTime('09:00:00'), '09:00');
  assert.equal(normalizeWorkingHoursTime('18:45:30'), '18:45');
  assert.equal(normalizeWorkingHoursTime('25:00:00'), null);
  assert.equal(isWorkingHoursRowActive(true), true);
  assert.equal(isWorkingHoursRowActive(false), false);
  assert.equal(isWorkingHoursRowActive(null), false);
});
