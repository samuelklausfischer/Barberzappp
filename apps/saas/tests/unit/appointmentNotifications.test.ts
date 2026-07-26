import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatNotificationDateTime,
  getUnreadNotificationLabel,
  normalizeAppointmentNotification,
} from '../../src/features/notifications/notificationUtils.ts';

test('normalizes an appointment notification with its related appointment', () => {
  assert.deepEqual(
    normalizeAppointmentNotification({
      id: 14,
      appointment_id: 83,
      read_at: null,
      created_at: '2026-07-26T15:00:00.000Z',
      appointments: {
        id: 83,
        client_name: 'Ana Souza',
        service_type: 'Corte + barba',
        scheduled_at: '2026-07-27T13:30:00.000Z',
      },
    }),
    {
      id: '14',
      appointmentId: '83',
      readAt: null,
      createdAt: '2026-07-26T15:00:00.000Z',
      clientName: 'Ana Souza',
      serviceName: 'Corte + barba',
      scheduledAt: '2026-07-27T13:30:00.000Z',
    }
  );
});

test('accepts PostgREST array relations and rejects incomplete rows', () => {
  const normalized = normalizeAppointmentNotification({
    id: '15',
    appointment_id: 84,
    created_at: '2026-07-26T15:00:00.000Z',
    read_at: '2026-07-26T15:01:00.000Z',
    appointments: [{ id: 84, client_name: 'Bruno', service_type: null, start_time: '2026-07-27T14:00:00.000Z' }],
  });

  assert.equal(normalized?.clientName, 'Bruno');
  assert.equal(normalized?.scheduledAt, '2026-07-27T14:00:00.000Z');
  assert.equal(normalizeAppointmentNotification({ id: 1 }), null);
});

test('formats badge and scheduling labels without exposing extra customer data', () => {
  assert.equal(getUnreadNotificationLabel(0), 'Nenhuma notificação nova');
  assert.equal(getUnreadNotificationLabel(1), '1 notificação nova');
  assert.equal(getUnreadNotificationLabel(4), '4 notificações novas');
  assert.match(formatNotificationDateTime('2026-07-27T13:30:00.000Z', 'America/Sao_Paulo'), /27 de jul\.|10:30/);
  assert.equal(formatNotificationDateTime(null, 'America/Sao_Paulo'), 'Horário a confirmar');
});
