import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMinutesInAgendaDay,
  getTimelineItems,
} from '../../src/components/agenda/agendaTimeline.ts';

const appointment = (id: string, startsAt: string, durationMinutes: number | null) => ({
  id,
  startsAt,
  durationMinutes,
});

test('overlapping appointments receive separate lanes and the same lane count', () => {
  const items = getTimelineItems(
    [
      appointment('first', '2026-07-26T12:00:00.000Z', 60),
      appointment('second', '2026-07-26T12:30:00.000Z', 30),
    ],
    'America/Sao_Paulo'
  );

  assert.deepEqual(
    items.map(({ appointment: itemAppointment, lane, laneCount }) => ({
      id: itemAppointment.id,
      lane,
      laneCount,
    })),
    [
      { id: 'first', lane: 0, laneCount: 2 },
      { id: 'second', lane: 1, laneCount: 2 },
    ]
  );
});

test('appointments touching at their boundaries reuse a lane', () => {
  const items = getTimelineItems(
    [
      appointment('first', '2026-07-26T12:00:00.000Z', 30),
      appointment('second', '2026-07-26T12:30:00.000Z', 30),
    ],
    'America/Sao_Paulo'
  );

  assert.deepEqual(
    items.map(({ lane, laneCount }) => ({ lane, laneCount })),
    [
      { lane: 0, laneCount: 1 },
      { lane: 0, laneCount: 1 },
    ]
  );
});

test('missing duration gets the 30-minute visual fallback', () => {
  const [item] = getTimelineItems(
    [appointment('fallback', '2026-07-26T12:00:00.000Z', null)],
    'America/Sao_Paulo'
  );

  assert.equal(item.endMinutes - item.startMinutes, 30);
});

test('timeline converts the same instant with the tenant timezone', () => {
  const timestamp = '2026-07-26T13:00:00.000Z';
  assert.equal(getMinutesInAgendaDay(timestamp, 'America/Manaus'), 9 * 60);
  assert.equal(getMinutesInAgendaDay(timestamp, 'America/Sao_Paulo'), 10 * 60);
});
