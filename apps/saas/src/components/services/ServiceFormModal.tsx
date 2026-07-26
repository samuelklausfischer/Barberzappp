import React, { useEffect, useId, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { ActiveBarber } from '@/features/services/types';
import {
  SERVICE_DURATION_OPTIONS,
  SERVICE_PRESETS,
  applyServicePreset,
  emptyServiceDraft,
  validateServiceDraft,
  type ServiceDraft,
} from '@/features/services/utils/serviceDraft';

type Props = {
  isOpen: boolean;
  barbers: ActiveBarber[];
  barbersLoading: boolean;
  barbersError: string | null;
  creating: boolean;
  error: string | null;
  onClose: () => void;
  onCreated: () => void;
  onRetryBarbers: () => void;
  onSubmit: (draft: ServiceDraft) => Promise<boolean>;
};
const fieldClass =
  'mt-2 w-full rounded-xl border border-[#D1D5DB] bg-white px-3.5 py-3 text-sm text-[#1A1A1F] placeholder:text-[#9CA3AF] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60';

export const ServiceFormModal: React.FC<Props> = ({
  isOpen,
  barbers,
  barbersLoading,
  barbersError,
  creating,
  error,
  onClose,
  onCreated,
  onRetryBarbers,
  onSubmit,
}) => {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [presetId, setPresetId] = useState(SERVICE_PRESETS[0].id);
  const [draft, setDraft] = useState<ServiceDraft>(() => applyServicePreset(SERVICE_PRESETS[0]));
  const [formError, setFormError] = useState<string | null>(null);
  const descriptionId = useId();
  useEffect(() => {
    if (isOpen) {
      setMode('preset');
      setPresetId(SERVICE_PRESETS[0].id);
      setDraft(applyServicePreset(SERVICE_PRESETS[0]));
      setFormError(null);
    }
  }, [isOpen]);
  const update = <K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormError(null);
  };
  const choosePreset = (id: string) => {
    const preset = SERVICE_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setPresetId(id);
    setDraft((current) => ({
      ...applyServicePreset(preset),
      barberId: current.barberId,
      active: current.active,
    }));
    setFormError(null);
  };
  const selectMode = (nextMode: 'preset' | 'custom') => {
    setMode(nextMode);
    if (nextMode === 'custom') setDraft(emptyServiceDraft());
    else choosePreset(presetId);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateServiceDraft(draft);
    if (validation) {
      setFormError(validation);
      return;
    }
    try {
      const created = await onSubmit(draft);
      if (created) {
        onCreated();
        onClose();
      }
    } catch {
      /* The hook supplies a safe error and preserves the draft. */
    }
  };
  const close = () => {
    if (!creating) onClose();
  };
  const customDuration = !SERVICE_DURATION_OPTIONS.includes(
    draft.durationMinutes as (typeof SERVICE_DURATION_OPTIONS)[number]
  );
  if (!isOpen) return null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Adicionar serviço"
      eyebrow="Catálogo da barbearia"
      size="lg"
    >
      <form className="space-y-5" onSubmit={(event) => void submit(event)} aria-busy={creating}>
        <p className="text-sm leading-6 text-[#6B7280]">
          Escolha uma sugestão comum ou crie seu serviço do zero. Todos os valores podem ser
          ajustados antes de salvar.
        </p>
        {formError || error ? (
          <div
            role="alert"
            className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-4 text-sm text-[#B42318]"
          >
            {formError ?? error}
          </div>
        ) : null}
        <fieldset disabled={creating} className="space-y-3">
          <legend className="bz-kicker">Como deseja começar?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#E5E7EB] p-3 has-[:checked]:border-[#D4AF37] has-[:checked]:bg-[#FFFAE9]">
              <input
                type="radio"
                name="service-mode"
                checked={mode === 'preset'}
                onChange={() => selectMode('preset')}
                className="h-4 w-4 accent-[#B38D1C]"
              />
              Usar modelo
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#E5E7EB] p-3 has-[:checked]:border-[#D4AF37] has-[:checked]:bg-[#FFFAE9]">
              <input
                type="radio"
                name="service-mode"
                checked={mode === 'custom'}
                onChange={() => selectMode('custom')}
                className="h-4 w-4 accent-[#B38D1C]"
              />
              Criar do zero
            </label>
          </div>
        </fieldset>
        {mode === 'preset' ? (
          <fieldset disabled={creating}>
            <legend className="bz-kicker mb-2">
              Modelos sugeridos{' '}
              <span className="normal-case tracking-normal text-[#6B7280]">(editáveis)</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SERVICE_PRESETS.map((preset) => (
                <label
                  key={preset.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#E5E7EB] p-3 text-sm has-[:checked]:border-[#D4AF37] has-[:checked]:bg-[#FFFAE9]"
                >
                  <input
                    type="radio"
                    name="service-preset"
                    value={preset.id}
                    checked={presetId === preset.id}
                    onChange={() => choosePreset(preset.id)}
                    className="h-4 w-4 accent-[#B38D1C]"
                  />
                  <span>
                    <strong className="block">{preset.name}</strong>
                    <span className="text-xs text-[#6B7280]">
                      {preset.durationMinutes} min · R${' '}
                      {Number(preset.price).toFixed(2).replace('.', ',')}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {barbersError ? (
          <div
            role="alert"
            className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-3 text-sm text-[#B42318]"
          >
            {barbersError}{' '}
            <button
              type="button"
              disabled={creating || barbersLoading}
              onClick={onRetryBarbers}
              className="font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}
        <fieldset disabled={creating} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="service-name" className="bz-kicker">
              Nome *
            </label>
            <input
              id="service-name"
              value={draft.name}
              onChange={(event) => update('name', event.target.value)}
              minLength={2}
              maxLength={80}
              required
              className={fieldClass}
              placeholder="Ex.: Corte social"
            />
            <p className="mt-1 text-right text-xs text-[#6B7280]">{draft.name.length}/80</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="service-description" className="bz-kicker">
              Descrição{' '}
              <span className="normal-case tracking-normal text-[#6B7280]">(opcional)</span>
            </label>
            <textarea
              id="service-description"
              aria-describedby={descriptionId}
              value={draft.description}
              onChange={(event) => update('description', event.target.value)}
              maxLength={500}
              rows={3}
              className={fieldClass}
              placeholder="Detalhes que ajudam a equipe e o cliente"
            />
            <p id={descriptionId} className="mt-1 text-right text-xs text-[#6B7280]">
              {draft.description.length}/500
            </p>
          </div>
          <div>
            <label htmlFor="service-duration" className="bz-kicker">
              Duração *
            </label>
            <select
              id="service-duration"
              value={customDuration ? 'custom' : String(draft.durationMinutes)}
              onChange={(event) =>
                update(
                  'durationMinutes',
                  event.target.value === 'custom' ? 0 : Number(event.target.value)
                )
              }
              className={fieldClass}
            >
              {SERVICE_DURATION_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} minutos
                </option>
              ))}
              <option value="custom">Outra duração</option>
            </select>
            {customDuration || draft.durationMinutes === 0 ? (
              <input
                aria-label="Duração personalizada em minutos"
                type="number"
                min="1"
                max="1440"
                value={draft.durationMinutes || ''}
                onChange={(event) => update('durationMinutes', Number(event.target.value))}
                className={fieldClass}
                placeholder="Minutos (1 a 1440)"
              />
            ) : null}
          </div>
          <div>
            <label htmlFor="service-price" className="bz-kicker">
              Preço *
            </label>
            <input
              id="service-price"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              inputMode="decimal"
              value={draft.price}
              onChange={(event) => update('price', event.target.value)}
              required
              className={fieldClass}
              placeholder="0,00"
            />
            <p className="mt-1 text-xs text-[#6B7280]">Use R$ 0,00 para cortesia.</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="service-barber" className="bz-kicker">
              Barbeiro responsável{' '}
              <span className="normal-case tracking-normal text-[#6B7280]">(opcional)</span>
            </label>
            <select
              id="service-barber"
              disabled={barbersLoading}
              value={draft.barberId}
              onChange={(event) => update('barberId', event.target.value)}
              className={fieldClass}
            >
              <option value="">
                {barbersLoading ? 'Carregando barbeiros…' : 'Todos os barbeiros ativos'}
              </option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[#6B7280]">
              A Agenda mostrará o serviço para todos ou apenas para o profissional escolhido.
            </p>
          </div>
        </fieldset>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-[#E5E7EB] p-3">
          <input
            type="checkbox"
            disabled={creating}
            checked={draft.active}
            onChange={(event) => update('active', event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#B38D1C]"
          />
          <span>
            <strong className="block text-sm">Serviço ativo</strong>
            <span className="text-xs text-[#6B7280]">
              Serviços ativos ficam disponíveis para novos agendamentos na Agenda.
            </span>
          </span>
        </label>
        <div className="flex flex-col-reverse gap-3 border-t border-[#E5E7EB] pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            disabled={creating}
            className="min-h-11 rounded-full border border-[#D1D5DB] px-5 py-3 text-sm font-semibold text-[#4B5563] hover:bg-[#F7F8FA] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={creating}
            className="min-h-11 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#1A1A1F] hover:bg-[#B99220] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
          >
            {creating ? 'Salvando…' : 'Salvar serviço'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
