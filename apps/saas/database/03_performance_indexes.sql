-- =====================================================
-- BarberZap - Índices de Performance (FASE 2 - Item 2.1)
-- =====================================================
-- Prioridade: 6 (IMPORTANTE)
-- Justificativa: Queries lentas sem índices críticos
-- Queries a otimizar: messages (1500+ registros), appointments
-- Tempo estimado: 1-2 horas
-- =====================================================

-- =====================================================
-- MESSAGES TABLE - Índices Críticos
-- =====================================================
-- WhatsApp messages podem crescer para milhares de registros

-- Índice para buscar mensagens recebidas (webhooks)
CREATE INDEX IF NOT EXISTS idx_messages_from_number
  ON messages(from_number);

-- Índice para buscar mensagens enviadas
CREATE INDEX IF NOT EXISTS idx_messages_to_number
  ON messages(to_number);

-- Índice para ordem cronológica (timeline)
CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages(created_at DESC);

-- Índice para associar mensagens a leads/clientes
CREATE INDEX IF NOT EXISTS idx_messages_lead_id
  ON messages(lead_id);

-- Índice composto para dashboard de mensagens recebidas
CREATE INDEX IF NOT EXISTS idx_messages_from_created
  ON messages(from_number, created_at DESC);

-- Índice para buscar conversas ativas (últimas 7 dias)
CREATE INDEX IF NOT EXISTS idx_messages_recent_conversations
  ON messages(from_number, to_number, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '7 days';

-- Índice para buscar mensagens não processadas (webhooks)
CREATE INDEX IF NOT EXISTS idx_messages_unprocessed
  ON messages(created_at)
  WHERE_processed_at IS NULL;

-- =====================================================
-- APPOINTMENTS TABLE - Índices Críticos
-- =====================================================
-- Índice composto principal para busca de agendamentos
-- Este é o índice mais usado: buscar slot disponível
CREATE INDEX IF NOT EXISTS idx_appointments_composite_availability
  ON appointments(employee_id, scheduled_at, status)
  WHERE status != 'cancelled' AND status != 'no_show';

-- Índice para calendário de um cliente
CREATE INDEX IF NOT EXISTS idx_appointments_client_calendar
  ON appointments(client_id, scheduled_at DESC);

-- Índice para dashboard de agendamentos do dia
CREATE INDEX IF NOT EXISTS idx_appointments_shop_day
  ON appointments(shop_id, DATE(scheduled_at), status)
  WHERE scheduled_at >= CURRENT_DATE AND scheduled_at < CURRENT_DATE + INTERVAL '1 day';

-- Índice para lista de agendamentos futuro
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming
  ON appointments(scheduled_at, status)
  WHERE scheduled_at > NOW() AND status IN ('scheduled', 'confirmed');

-- Índice para histórico de agendamentos passados
CREATE INDEX IF NOT EXISTS idx_appointments_history
  ON appointments(scheduled_at DESC, status)
  WHERE scheduled_at < NOW();

-- =====================================================
-- CLIENTS TABLE - Índices Críticos
-- =====================================================
-- Índice para busca por telefone (busca de cliente existente)
CREATE INDEX IF NOT EXISTS idx_clients_phone_search
  ON clients(shop_id, phone_number, deleted_at)
  WHERE deleted_at IS NULL;

-- Índice para GIN search em tags (segmentação)
CREATE INDEX IF NOT EXISTS idx_clients_search_tags
  ON clients USING GIN(tags)
  WHERE deleted_at IS NULL;

-- Índice para clientes recentes (dashboard)
CREATE INDEX IF NOT EXISTS idx_clients_recent
  ON clients(shop_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Índice para clientes por visit count (top customers)
CREATE INDEX IF NOT EXISTS idx_clients_top_visitors
  ON clients(shop_id, total_visits DESC)
  WHERE total_visits > 0;

-- Índice para clientes ativos (visitou nos últimos 90 dias)
CREATE INDEX IF NOT EXISTS idx_clients_active_90d
  ON clients(shop_id, last_visit_at DESC)
  WHERE last_visit_at > NOW() - INTERVAL '90 days';

-- =====================================================
-- SERVICES TABLE - Índices
-- =====================================================
-- Índice para serviços ativos por loja
CREATE INDEX IF NOT EXISTS idx_services_shop_active
  ON services(shop_id, active)
  WHERE active = TRUE;

-- Índice para busca text em nome/serviço
CREATE INDEX IF NOT EXISTS idx_services_name_search
  ON services USING GIN(to_tsvector('english', name));

-- =====================================================
-- EMPLOYEES TABLE - Índices
-- =====================================================
-- Índice para funcionários ativos
CREATE INDEX IF NOT EXISTS idx_employees_shop_active
  ON employees(shop_id, active)
  WHERE active = TRUE AND deleted_at IS NULL;

-- =====================================================
-- WORKING_HOURS TABLE - Índices
-- =====================================================
-- Índice para horário disponível por funcionário/dia
CREATE INDEX IF NOT EXISTS idx_working_hours_employee_day
  ON working_hours(employee_id, day_of_week, is_available)
  WHERE is_available = TRUE;

-- =====================================================
-- APPOINTMENT_REMINDERS TABLE - Índices Críticos
-- =====================================================
-- Índice para buscar reminders pendentes (cron job)
CREATE INDEX IF NOT EXISTS idx_reminders_pending
  ON appointment_reminders(scheduled_at, status)
  WHERE status = 'pending';

-- Índice para reminders de um appointment
CREATE INDEX IF NOT EXISTS idx_reminders_appointment
  ON appointment_reminders(appointment_id, scheduled_at DESC);

-- =====================================================
-- NOTIFICATIONS TABLE - Índices
-- =====================================================
-- Índice para notificações não lidas
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Índice para notificações recentes por loja
CREATE INDEX IF NOT EXISTS idx_notifications_shop_recent
  ON notifications(shop_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '30 days';

-- =====================================================
-- AUDIT_LOGS TABLE - Índices
-- =====================================================
-- Índice para trilhas por tabela/registro
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record
  ON audit_logs(table_name, record_id, changed_at DESC);

-- Índice para auditoria por loja
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop
  ON audit_logs(shop_id, changed_at DESC)
  WHERE changed_at > NOW() - INTERVAL '30 days';

-- =====================================================
-- WEBHOOK_LOGS TABLE - Índices
-- =====================================================
-- Índice para buscar webhooks por status
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source_status
  ON webhook_logs(source, created_at DESC);

-- Índice para webhooks com erro
CREATE INDEX IF NOT EXISTS idx_webhook_logs_errors
  ON webhook_logs(source, error_message, created_at DESC)
  WHERE error_message IS NOT NULL;

-- Índice para webhooks recentes por loja
CREATE INDEX IF NOT EXISTS idx_webhook_logs_shop_recent
  ON webhook_logs(shop_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '7 days';

-- =====================================================
-- ÍNDICES DE TEXT SEARCH (Full-Text Search)
-- =====================================================
-- Search em clientes (nome, email)
CREATE INDEX IF NOT EXISTS idx_clients_search
  ON clients USING GIN(
    to_tsvector('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(email, '') || ' ' ||
      COALESCE(phone_number, '')
    )
  );

-- Search em serviços (nome, descrição)
CREATE INDEX IF NOT EXISTS idx_services_search
  ON services USING GIN(
    to_tsvector('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(description, '')
    )
  );

-- =====================================================
-- ÍNDICES PARCIAIS (Partial Indexes - Otimização)
-- =====================================================
-- Apenas agendamentos futuros (maioria das queries)
CREATE INDEX IF NOT EXISTS idx_appointments_future_only
  ON appointments(shop_id, scheduled_at)
  WHERE scheduled_at >= NOW();

-- Apenas clientes ativos
CREATE INDEX IF NOT EXISTS idx_clients_active_only
  ON clients(shop_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Apenas notas do cliente
CREATE INDEX IF NOT EXISTS idx_clients_with_notes
  ON clients(shop_id, created_at DESC)
  WHERE notes IS NOT NULL AND notes != '';

-- =====================================================
-- INSTRUÇÕES PARA ANALIZAR E OTIMIZAR
-- =====================================================
--
-- Para analisar quais índices estão sendo usados:
-- SELECT schemaname, tablename, indexname, idx_scan
--   FROM pg_stat_user_indexes
--   WHERE schemaname = 'public'
--   ORDER BY idx_scan DESC;
--
-- Para ver índices não utilizados (perde performance):
-- SELECT schemaname, tablename, indexname
--   FROM pg_stat_user_indexes
--   WHERE idx_scan = 0
--   ORDER BY schemaname, tablename;
--
-- Para ver tamanho das tabelas e índices:
-- SELECT
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
--
-- Para criar índice CONCURRENTLY (não bloqueia prod):
-- CREATE INDEX CONCURRENTLY idx_name ON table(columns);
--
-- =====================================================
