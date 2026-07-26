import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addCalendarDays,
  getAgendaDateTime,
  getAgendaDayRange,
} from '../../src/features/appointments/utils/agendaDateRange.ts';
import { getManualAppointmentEndAt, getManualAppointmentTotals, getSafeManualAppointmentEndAt, getServiceDurationMinutes, validateManualAppointmentDraft } from '../../src/features/appointments/utils/manualAppointment.ts';

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
  assert.throws(() => getAgendaDateTime('2026-07-26', '28:00'));
});

test('manual appointment totals, ending time and draft validation are deterministic', () => {
  const services = [
    { id: '1', name: 'Corte', durationMinutes: 40, price: 50 },
    { id: '2', name: 'Barba', durationMinutes: 20, price: 30 },
  ];
  assert.deepEqual(getManualAppointmentTotals(services), { durationMinutes: 60, price: 80 });
  assert.equal(getManualAppointmentEndAt('2026-07-26', '09:30', services), '2026-07-26T13:30:00.000Z');
  assert.equal(getManualAppointmentEndAt('2026-07-27', '09:30', services), '2026-07-27T13:30:00.000Z');
  assert.equal(getSafeManualAppointmentEndAt('2026-07-26', '', services), null);
  assert.equal(validateManualAppointmentDraft({ clientId: '', barberId: '1', serviceIds: ['1'], date: '2026-07-26', time: '09:30' }), 'Selecione um cliente.');
  assert.ok(validateManualAppointmentDraft({ clientId: '1', barberId: '1', serviceIds: ['1'], date: '2026-07-26', time: '09:30', now: new Date('2026-07-26T12:31:00.000Z') }));
});

test('service duration mirrors the RPC fallback rule', () => {
  assert.equal(getServiceDurationMinutes(30, 45), 30);
  assert.equal(getServiceDurationMinutes(0, 45), 45);
  assert.equal(getServiceDurationMinutes(null, 45), 45);
  assert.equal(getServiceDurationMinutes(0, null), null);
  assert.equal(getServiceDurationMinutes(-5, 45), null);
});
