-- Permite que usuarios autenticados actualizem somente os campos de configuração
-- da própria conta; as policies RLS continuam limitando a linha por proprietário.
GRANT UPDATE (prompt_tone, prompt_business_rules, business_hours, booking_interval_minutes)
ON TABLE public.tenants TO authenticated;

GRANT UPDATE (ai_assistant_name, business_address)
ON TABLE public.profiles TO authenticated;