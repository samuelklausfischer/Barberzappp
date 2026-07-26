export type ServiceDraft = {
  name: string;
  description: string;
  durationMinutes: number;
  price: string;
  barberId: string;
  active: boolean;
};
export type ServicePreset = { id: string; name: string; durationMinutes: number; price: string };

export const SERVICE_DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120] as const;
export const SERVICE_PRESETS: ServicePreset[] = [
  { id: 'corte-masculino', name: 'Corte masculino', durationMinutes: 45, price: '45' },
  { id: 'barba-completa', name: 'Barba completa', durationMinutes: 30, price: '35' },
  { id: 'corte-barba', name: 'Corte + barba', durationMinutes: 75, price: '70' },
  { id: 'sobrancelha', name: 'Sobrancelha', durationMinutes: 15, price: '20' },
  { id: 'pezinho', name: 'Pezinho/acabamento', durationMinutes: 15, price: '15' },
  { id: 'corte-infantil', name: 'Corte infantil', durationMinutes: 30, price: '35' },
];

export const emptyServiceDraft = (): ServiceDraft => ({
  name: '',
  description: '',
  durationMinutes: 45,
  price: '',
  barberId: '',
  active: true,
});
export const applyServicePreset = (preset: ServicePreset): ServiceDraft => ({
  ...emptyServiceDraft(),
  name: preset.name,
  durationMinutes: preset.durationMinutes,
  price: preset.price,
});
export const normalizeServiceDraft = (draft: ServiceDraft) => ({
  name: draft.name.trim().replace(/\s+/g, ' '),
  description: draft.description.trim(),
  durationMinutes: Number(draft.durationMinutes),
  price: Number(draft.price),
  barberId: draft.barberId || null,
  active: draft.active,
});
export const validateServiceDraft = (draft: ServiceDraft): string | null => {
  const normalized = normalizeServiceDraft(draft);
  if (normalized.name.length < 2 || normalized.name.length > 80)
    return 'Informe um nome entre 2 e 80 caracteres.';
  if (normalized.description.length > 500) return 'A descrição pode ter no máximo 500 caracteres.';
  if (
    !Number.isInteger(normalized.durationMinutes) ||
    normalized.durationMinutes < 1 ||
    normalized.durationMinutes > 1440
  )
    return 'Informe uma duração entre 1 e 1440 minutos.';
  if (
    !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(draft.price.trim()) ||
    !Number.isFinite(normalized.price) ||
    normalized.price < 0 ||
    normalized.price > 1_000_000
  )
    return 'Informe um preço entre R$ 0,00 e R$ 1.000.000,00.';
  return null;
};
