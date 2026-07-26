import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SERVICE_PRESETS,
  applyServicePreset,
  emptyServiceDraft,
  normalizeServiceDraft,
  validateServiceDraft,
} from '../../src/features/services/utils/serviceDraft.ts';

test('all presets create valid editable drafts', () => {
  for (const preset of SERVICE_PRESETS)
    assert.equal(validateServiceDraft(applyServicePreset(preset)), null, preset.id);
});
test('normalization preserves safe values', () => {
  const normalized = normalizeServiceDraft({
    ...emptyServiceDraft(),
    name: '  Corte   premium ',
    description: '  detalhe ',
    durationMinutes: 45,
    price: '0',
    barberId: '',
    active: false,
  });
  assert.deepEqual(normalized, {
    name: 'Corte premium',
    description: 'detalhe',
    durationMinutes: 45,
    price: 0,
    barberId: null,
    active: false,
  });
});
test('validates text and duration boundaries', () => {
  const valid = { ...emptyServiceDraft(), name: 'Corte', price: '1' };
  assert.ok(validateServiceDraft({ ...valid, name: '  ' }));
  assert.ok(validateServiceDraft({ ...valid, description: 'a'.repeat(501) }));
  for (const durationMinutes of [0, 1.5, 1441])
    assert.ok(validateServiceDraft({ ...valid, durationMinutes }));
});
test('validates price syntax and limits', () => {
  const valid = { ...emptyServiceDraft(), name: 'Corte' };
  for (const price of ['0', '0.01', '1000000'])
    assert.equal(validateServiceDraft({ ...valid, price }), null, price);
  for (const price of ['', '-1', 'NaN', 'Infinity', '1.234', '1000000.01', '1e2'])
    assert.ok(validateServiceDraft({ ...valid, price }), price);
});
