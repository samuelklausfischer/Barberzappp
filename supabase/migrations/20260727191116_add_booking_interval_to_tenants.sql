-- Persiste o intervalo-base usado para gerar e validar slots de agendamento.
-- O campo fica no tenant porque a regra vale para toda a barbearia;
-- horarios individuais continuam em public.working_hours.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS booking_interval_minutes integer NOT NULL DEFAULT 30;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_booking_interval_minutes_check'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_booking_interval_minutes_check
      CHECK (booking_interval_minutes BETWEEN 5 AND 120);
  END IF;
END $$;

COMMENT ON COLUMN public.tenants.booking_interval_minutes IS
  'Intervalo-base, em minutos, entre horarios oferecidos pela IA para novos agendamentos.';
