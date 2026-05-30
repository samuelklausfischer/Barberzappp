-- =====================================================
-- BarberZap - Test Scripts para Notification Preferences
-- =====================================================
-- Executar estes scripts para testar o sistema de preferências
-- =====================================================

-- =====================================================
-- 1. TESTE: Criar dados de teste
-- =====================================================

-- Criar shops de teste
INSERT INTO shops (id, name, phone, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Barbearia Teste 1', '(11) 99999-1111', 'teste1@barber.com'),
  ('22222222-2222-2222-2222-222222222222', 'Barbearia Teste 2', '(11) 99999-2222', 'teste2@barber.com')
ON CONFLICT (id) DO NOTHING;

-- Criar clientes de teste
INSERT INTO clients (id, shop_id, name, phone_number, email, instagram) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'João Silva', '(11) 99999-9999', 'joao@email.com', '@joao'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Maria Santos', '(11) 98888-8888', 'maria@email.com', '@maria'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Pedro Costa', '(11) 97777-7777', 'pedro@email.com', '@pedro')
ON CONFLICT DO NOTHING;

-- Criar funcionários de teste
INSERT INTO employees (id, shop_id, name, phone_number, email, role) VALUES
  ('emp1-id-1111-1111-1111-1111111111', '11111111-1111-1111-1111-111111111111', 'Carlos Barbearia', '(11) 96666-6666', 'carlos@barber.com', 'barber'),
  ('emp1-id-2222-2222-2222-2222222222', '22222222-2222-2222-2222-222222222222', 'Ana Cabeleireira', '(11) 95555-5555', 'ana@barber.com', 'barber')
ON CONFLICT DO NOTHING;

-- Criar serviços de teste
INSERT INTO services (id, shop_id, name, description, duration_minutes, price) VALUES
  ('srv1-id-1111-1111-1111-1111111111', '11111111-1111-1111-1111-111111111111', 'Corte de Cabelo', 'Corte masculino completo', 30, 35.00),
  ('srv1-id-2222-2222-2222-2222222222', '11111111-1111-1111-1111-111111111111', 'Barba', 'Aparar e modelar barba', 15, 20.00),
  ('srv2-id-1111-1111-1111-1111111111', '22222222-2222-2222-2222-222222222222', 'Corte Completo', 'Corte + Barba', 45, 50.00)
ON CONFLICT DO NOTHING;

-- Criar agendamentos de teste
INSERT INTO appointments (id, shop_id, client_id, employee_id, service_id, scheduled_at, duration_minutes, price, status) VALUES
  ('apt1-id-1111-1111-1111-1111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'emp1-id-1111-1111-1111-1111111111', 'srv1-id-1111-1111-1111-1111111111', NOW() + INTERVAL '24 hours', 30, 35.00, 'scheduled'),
  ('apt1-id-2222-2222-2222-2222222222', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'emp1-id-1111-1111-1111-1111111111', 'srv1-id-1111-1111-1111-1111111111', NOW() + INTERVAL '2 hours', 30, 35.00, 'confirmed')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. TESTE: Criar preferências de teste
-- =====================================================

-- Cliente João: Todas as notificações habilitadas via WhatsApp
INSERT INTO client_notification_preferences (shop_id, client_id, notification_type, channel, enabled, timing, timezone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'booking_confirmation', 'whatsapp', TRUE, 'instant', 'America/Sao_Paulo'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'reminder_24h', 'whatsapp', TRUE, '24h_before', 'America/Sao_Paulo'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'reminder_2h', 'whatsapp', TRUE, '2h_before', 'America/Sao_Paulo'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cancellation', 'whatsapp', TRUE, 'instant', 'America/Sao_Paulo'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'reschedule', 'whatsapp', TRUE, 'instant', 'America/Sao_Paulo'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'promotional', 'whatsapp', FALSE, 'morning', 'America/Sao_Paulo'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'monthly_report', 'email', TRUE, 'morning', 'America/Sao_Paulo')
ON CONFLICT (shop_id, client_id, notification_type) DO UPDATE SET
  channel = EXCLUDED.channel,
  enabled = EXCLUDED.enabled,
  timing = EXCLUDED.timing,
  timezone = EXCLUDED.timezone,
  updated_at = NOW();

-- Cliente Maria: Prefere email e tem período de silêncio
INSERT INTO client_notification_preferences (shop_id, client_id, notification_type, channel, enabled, timing, timezone, do_not_disturb_start, do_not_disturb_end) VALUES
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'booking_confirmation', 'email', TRUE, 'instant', 'America/Sao_Paulo', '22:00', '08:00'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'reminder_24h', 'email', TRUE, '24h_before', 'America/Sao_Paulo', '22:00', '08:00'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'reminder_2h', 'email', TRUE, '2h_before', 'America/Sao_Paulo', '22:00', '08:00'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cancellation', 'email', TRUE, 'instant', 'America/Sao_Paulo', '22:00', '08:00'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'reschedule', 'email', TRUE, 'instant', 'America/Sao_Paulo', '22:00', '08:00'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'promotional', 'none', FALSE, 'morning', 'America/Sao_Paulo', '22:00', '08:00'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'monthly_report', 'email', FALSE, 'morning', 'America/Sao_Paulo', '22:00', '08:00')
ON CONFLICT (shop_id, client_id, notification_type) DO UPDATE SET
  channel = EXCLUDED.channel,
  enabled = EXCLUDED.enabled,
  timing = EXCLUDED.timing,
  timezone = EXCLUDED.timezone,
  do_not_disturb_start = EXCLUDED.do_not_disturb_start,
  do_not_disturb_end = EXCLUDED.do_not_disturb_end,
  updated_at = NOW();

-- Cliente Pedro: Mix de canais (WhatsApp para importantes, Email para relatórios)
INSERT INTO client_notification_preferences (shop_id, client_id, notification_type, channel, enabled, timing, timezone) VALUES
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'booking_confirmation', 'whatsapp', TRUE, 'instant', 'America/Sao_Paulo'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'reminder_24h', 'whatsapp', TRUE, '24h_before', 'America/Sao_Paulo'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'reminder_2h', 'sms', TRUE, '2h_before', 'America/Sao_Paulo'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cancellation', 'whatsapp', TRUE, 'instant', 'America/Sao_Paulo'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'reschedule', 'whatsapp', TRUE, 'instant', 'America/Sao_Paulo'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'promotional', 'email', TRUE, 'afternoon', 'America/Sao_Paulo'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'monthly_report', 'email', TRUE, 'evening', 'America/Sao_Paulo')
ON CONFLICT (shop_id, client_id, notification_type) DO UPDATE SET
  channel = EXCLUDED.channel,
  enabled = EXCLUDED.enabled,
  timing = EXCLUDED.timing,
  timezone = EXCLUDED.timezone,
  updated_at = NOW();

-- =====================================================
-- 3. TESTE: Criar defaults de shop
-- =====================================================

INSERT INTO shop_notification_defaults (
  shop_id,
  default_channel,
  default_timezone,
  booking_confirmation_enabled,
  reminder_24h_enabled,
  reminder_2h_enabled,
  cancellation_enabled,
  reschedule_enabled,
  promotional_enabled,
  monthly_report_enabled,
  booking_confirmation_timing,
  reminder_24h_timing,
  reminder_2h_timing,
  cancellation_timing,
  reschedule_timing,
  promotional_timing,
  monthly_report_timing,
  do_not_disturbo_start,
  do_not_disturb_end,
  do_not_disturb_enabled,
  max_notifications_per_day,
  max_promotional_per_week
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'whatsapp',
  'America/Sao_Paulo',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  FALSE,
  FALSE,
  'instant',
  '24h_before',
  '2h_before',
  'instant',
  'instant',
  'morning',
  'morning',
  '22:00',
  '08:00',
  TRUE,
  10,
  2
) ON CONFLICT (shop_id) DO UPDATE SET
  default_channel = EXCLUDED.default_channel,
  default_timezone = EXCLUDED.default_timezone,
  booking_confirmation_enabled = EXCLUDED.booking_confirmation_enabled,
  reminder_24h_enabled = EXCLUDED.reminder_24h_enabled,
  reminder_2h_enabled = EXCLUDED.reminder_2h_enabled,
  cancellation_enabled = EXCLUDED.cancellation_enabled,
  reschedule_enabled = EXCLUDED.reschedule_enabled,
  promotional_enabled = EXCLUDED.promotional_enabled,
  monthly_report_enabled = EXCLUDED.monthly_report_enabled,
  booking_confirmation_timing = EXCLUDED.booking_confirmation_timing,
  reminder_24h_timing = EXCLUDED.reminder_24h_timing,
  reminder_2h_timing = EXCLUDED.reminder_2h_timing,
  cancellation_timing = EXCLUDED.cancellation_timing,
  reschedule_timing = EXCLUDED.reschedule_timing,
  promotional_timing = EXCLUDED.promotional_timing,
  monthly_report_timing = EXCLUDED.monthly_report_timing,
  do_not_disturbo_start = EXCLUDED.do_not_disturbo_start,
  do_not_disturb_end = EXCLUDED.do_not_disturb_end,
  do_not_disturb_enabled = EXCLUDED.do_not_disturb_enabled,
  max_notifications_per_day = EXCLUDED.max_notifications_per_day,
  max_promotional_per_week = EXCLUDED.max_promotional_per_week,
  updated_at = NOW();

INSERT INTO shop_notification_defaults (
  shop_id,
  default_channel,
  default_timezone,
  booking_confirmation_enabled,
  reminder_24h_enabled,
  reminder_2h_enabled,
  cancellation_enabled,
  reschedule_enabled,
  promotional_enabled,
  monthly_report_enabled,
  booking_confirmation_timing,
  reminder_24h_timing,
  reminder_2h_timing,
  cancellation_timing,
  reschedule_timing,
  promotional_timing,
  monthly_report_timing,
  do_not_disturbo_start,
  do_not_disturb_end,
  do_not_disturb_enabled,
  max_notifications_per_day,
  max_promotional_per_week
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'whatsapp',
  'America/Sao_Paulo',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  'instant',
  '24h_before',
  '2h_before',
  'instant',
  'instant',
  'afternoon',
  'morning',
  '21:00',
  '09:00',
  TRUE,
  15,
  3
) ON CONFLICT (shop_id) DO UPDATE SET
  default_channel = EXCLUDED.default_channel,
  default_timezone = EXCLUDED.default_timezone,
  booking_confirmation_enabled = EXCLUDED.booking_confirmation_enabled,
  reminder_24h_enabled = EXCLUDED.reminder_24h_enabled,
  reminder_2h_enabled = EXCLUDED.reminder_2h_enabled,
  cancellation_enabled = EXCLUDED.cancellation_enabled,
  reschedule_enabled = EXCLUDED.reschedule_enabled,
  promotional_enabled = EXCLUDED.promotional_enabled,
  monthly_report_enabled = EXCLUDED.monthly_report_enabled,
  booking_confirmation_timing = EXCLUDED.booking_confirmation_timing,
  reminder_24h_timing = EXCLUDED.reminder_24h_timing,
  reminder_2h_timing = EXCLUDED.reminder_2h_timing,
  cancellation_timing = EXCLUDED.cancellation_timing,
  reschedule_timing = EXCLUDED.reschedule_timing,
  promotional_timing = EXCLUDED.promotional_timing,
  monthly_report_timing = EXCLUDED.monthly_report_timing,
  do_not_disturbo_start = EXCLUDED.do_not_disturbo_start,
  do_not_disturb_end = EXCLUDED.do_not_disturb_end,
  do_not_disturb_enabled = EXCLUDED.do_not_disturb_enabled,
  max_notifications_per_day = EXCLUDED.max_notifications_per_day,
  max_promotional_per_week = EXCLUDED.max_promotional_per_week,
  updated_at = NOW();

-- =====================================================
-- 4. TESTE: Criar templates de notificação
-- =====================================================

INSERT INTO notification_templates (
  shop_id,
  notification_type,
  channel,
  language,
  title_template,
  message_template,
  available_variables,
  active
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'booking_confirmation', 'whatsapp', 'pt-BR', 
   '✅ Agendamento Confirmado', 
   'Olá {client_name}! 🎉\n\nSeu agendamento foi confirmado:\n📅 {date} às {time}\n💈 {barber_name}\n✂️ {service}\n\nTe esperamos! 👋',
   ARRAY['client_name', 'date', 'time', 'barber_name', 'service'],
   TRUE),
  ('11111111-1111-1111-1111-111111111111', 'reminder_24h', 'whatsapp', 'pt-BR',
   '📅 Lembrete: Agendamento Amanhã',
   'Olá {client_name}! 👋\n\nLembrete do seu agendamento amanhã:\n📅 {date}\n⏰ {time}\n💈 {barber_name}\n✂️ {service}\n\nNão esqueça! 😊',
   ARRAY['client_name', 'date', 'time', 'barber_name', 'service'],
   TRUE),
  ('11111111-1111-1111-1111-111111111111', 'reminder_2h', 'whatsapp', 'pt-BR',
   '⏰ Seu agendamento começa em 2 horas',
   'Olá {client_name}! ⏰\n\nSeu horário está chegando!\n📅 {date}\n⏰ {time}\n💈 {barber_name}\n✂️ {service}\n\nChegue com 15 minutos de antecedência! 🚶',
   ARRAY['client_name', 'date', 'time', 'barber_name', 'service'],
   TRUE)
ON CONFLICT (shop_id, notification_type, channel, language) DO UPDATE SET
  title_template = EXCLUDED.title_template,
  message_template = EXCLUDED.message_template,
  available_variables = EXCLUDED.available_variables,
  active = EXCLUDED.active,
  updated_at = NOW();

-- =====================================================
-- 5. QUERIES DE TESTE
-- =====================================================

-- TESTE 1: Buscar todas as preferências de um cliente
SELECT 
  client_id,
  notification_type,
  channel,
  enabled,
  timing,
  timezone,
  do_not_disturb_start,
  do_not_disturb_end
FROM client_notification_preferences
WHERE shop_id = '11111111-1111-1111-1111-111111111111'
  AND client_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY notification_type;

-- TESTE 2: Ver clientes com notificações habilitadas por tipo
SELECT 
  c.name,
  c.phone_number,
  COUNT(*) FILTER (WHERE cnp.enabled = TRUE) as enabled_notifications_count,
  STRING_AGG(cnp.notification_type, ', ' ORDER BY cnp.notification_type) as enabled_types
FROM client_notification_preferences cnp
JOIN clients c ON cnp.client_id = c.id
WHERE cnp.shop_id = '11111111-1111-1111-1111-111111111111'
GROUP BY c.id, c.name, c.phone_number
ORDER BY enabled_notifications_count DESC;

-- TESTE 3: Ver preferências por canal
SELECT 
  channel,
  COUNT(*) as total_preferences,
  COUNT(*) FILTER (WHERE enabled = TRUE) as enabled_count,
  ROUND(AVG(CASE WHEN enabled THEN 1 ELSE 0 END) * 100, 2) as enabled_percentage
FROM client_notification_preferences
WHERE shop_id = '11111111-1111-1111-1111-111111111111'
GROUP BY channel
ORDER BY enabled_count DESC;

-- TESTE 4: Testar função de período de silêncio
SELECT 
  client_id,
  notification_type,
  do_not_disturb_start,
  do_not_disturb_end,
  timezone,
  is_silent_period(
    do_not_disturb_start,
    do_not_disturb_end,
    NOW(),
    timezone
  ) as currently_in_silent_period
FROM client_notification_preferences
WHERE shop_id = '11111111-1111-1111-1111-111111111111'
  AND do_not_disturb_start IS NOT NULL;

-- TESTE 5: Ver defaults de shop
SELECT * FROM shop_notification_defaults
WHERE shop_id = '11111111-1111-1111-1111-111111111111';

-- TESTE 6: Testar get_effective_preferences function
SELECT * FROM get_effective_preferences(
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'booking_confirmation'
);

-- =====================================================
-- 6. LIMPEZA (OPCIONAL)
-- =====================================================

-- Descomentar para limpar dados de teste
/*
-- Remover logs
DELETE FROM notification_logs WHERE shop_id LIKE '111%';
DELETE FROM notification_logs WHERE shop_id LIKE '222%';

-- Remover fila
DELETE FROM notification_queue WHERE shop_id LIKE '111%';
DELETE FROM notification_queue WHERE shop_id LIKE '222%';

-- Remover templates
DELETE FROM notification_templates WHERE shop_id LIKE '111%';
DELETE FROM notification_templates WHERE shop_id LIKE '222%';

-- Remover preferências de cliente
DELETE FROM client_notification_preferences WHERE shop_id LIKE '111%';
DELETE FROM client_notification_preferences WHERE shop_id LIKE '222%';

-- Remover defaults de shop
DELETE FROM shop_notification_defaults WHERE shop_id LIKE '111%';
DELETE FROM shop_notification_defaults WHERE shop_id LIKE '222%';

-- Remover agendamentos
DELETE FROM appointments WHERE shop_id LIKE '111%';
DELETE FROM appointments WHERE shop_id LIKE '222%';

-- Remover serviços
DELETE FROM services WHERE shop_id LIKE '111%';
DELETE FROM services WHERE shop_id LIKE '222%';

-- Remover funcionários
DELETE FROM employees WHERE shop_id LIKE '111%';
DELETE FROM employees WHERE shop_id LIKE '222%';

-- Remover clientes
DELETE FROM clients WHERE shop_id LIKE '111%';
DELETE FROM clients WHERE shop_id LIKE '222%';

-- Remover shops
DELETE FROM shops WHERE id LIKE '111%';
DELETE FROM shops WHERE id LIKE '222%';
*/

-- =====================================================
-- FIM DOS TESTES
-- =====================================================
