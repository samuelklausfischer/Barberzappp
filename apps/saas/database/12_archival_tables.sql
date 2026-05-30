-- =====================================================
-- BarberZap - Archival Tables (FASE X - Item 1)
-- =====================================================
-- Prioridade: 2 (MUITO IMPORTANTE)
-- Justificativa: Crescimento de dados afeta performance
-- Tempo estimado: 3-4 horas
-- =====================================================
-- Este script cria as tabelas de arquivamento para dados
-- históricos, particionadas por período e com proteção
-- contra escrita (read-only).
-- =====================================================

-- =====================================================
-- ENABLE REQUIRED EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_partman" CASCADE;  -- Para gerenciamento de partições


-- =====================================================
-- 1. CLIENTS_ARCHIVED (Particionado por ano)
-- =====================================================
-- Arquiva clientes que não têm agendamentos há muito tempo
-- Read-only: INSERT PROTECTED
-- =====================================================

CREATE TABLE IF NOT EXISTS clients_archived (
  id UUID NOT NULL,
  shop_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  instagram VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  notes TEXT,
  version INTEGER,
  total_visits INTEGER,
  last_visit_at TIMESTAMP WITH TIME ZONE,
  total_spent DECIMAL(10,2),
  no_show_count INTEGER,
  cancelled_count INTEGER,
  loyalty_points INTEGER,
  archived_from VARCHAR(50),  -- 'manual', 'auto', 'bulk'
  archive_reason VARCHAR(100)  -- 'inactive_24m', 'request', etc
) PARTITION BY RANGE (archived_at);

-- Criar partições (uma por ano, começando de 2024)
-- Partição para 2024
CREATE TABLE IF NOT EXISTS clients_archived_2024 PARTITION OF clients_archived
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Partição para 2025
CREATE TABLE IF NOT EXISTS clients_archived_2025 PARTITION OF clients_archived
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Partição para 2026
CREATE TABLE IF NOT EXISTS clients_archived_2026 PARTITION OF clients_archived
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Primary key (precisa incluir partition key)
ALTER TABLE clients_archived ADD CONSTRAINT clients_archived_pkey PRIMARY KEY (id, archived_at);

-- Índices otimizados para consulta histórica
CREATE INDEX idx_clients_archived_shop ON clients_archived(shop_id);
CREATE INDEX idx_clients_archived_phone ON clients_archived(phone_number);
CREATE INDEX idx_clients_archived_name ON clients_archived(name);
CREATE INDEX idx_clients_archived_created_at ON clients_archived(created_at DESC);
CREATE INDEX idx_clients_archived_last_visit ON clients_archived(last_visit_at DESC);
CREATE INDEX idx_clients_archived_tags ON clients_archived USING GIN(tags);

-- Índice GIN para busca full-text em notes
CREATE INDEX idx_clients_archived_notes_fts ON clients_archived USING GIN(to_tsvector('portuguese', notes));


-- =====================================================
-- 2. APPOINTMENTS_ARCHIVED (Particionado por ano/quarter)
-- =====================================================
-- Arquiva agendamentos completados/cancelados antigos
-- Read-only: INSERT PROTECTED
-- =====================================================

CREATE TABLE IF NOT EXISTS appointments_archived (
  id UUID NOT NULL,
  shop_id UUID NOT NULL,
  client_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  service_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER,
  
  -- Metadados para audit
  whatsapp_sent BOOLEAN,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_24h_sent BOOLEAN,
  reminder_24h_at TIMESTAMP WITH TIME ZONE,
  reminder_2h_sent BOOLEAN,
  reminder_2h_at TIMESTAMP WITH TIME ZONE,
  
  -- Campos de referência (FOREIGN KEAKS soft para consulta)
  client_name VARCHAR(255),  -- Denormalizado para busca rápida
  employee_name VARCHAR(255),
  service_name VARCHAR(255),
  
  archived_from VARCHAR(50),
  archive_reason VARCHAR(100)
) PARTITION BY RANGE (archived_at);

-- Criar partições por quarter (trimestre)
-- 2024 Q1
CREATE TABLE IF NOT EXISTS appointments_archived_2024_q1 PARTITION OF appointments_archived
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- 2024 Q2
CREATE TABLE IF NOT EXISTS appointments_archived_2024_q2 PARTITION OF appointments_archived
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- 2024 Q3
CREATE TABLE IF NOT EXISTS appointments_archived_2024_q3 PARTITION OF appointments_archived
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

-- 2024 Q4
CREATE TABLE IF NOT EXISTS appointments_archived_2024_q4 PARTITION OF appointments_archived
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

-- 2025 Q1
CREATE TABLE IF NOT EXISTS appointments_archived_2025_q1 PARTITION OF appointments_archived
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

-- 2025 Q2
CREATE TABLE IF NOT EXISTS appointments_archived_2025_q2 PARTITION OF appointments_archived
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

-- 2025 Q3
CREATE TABLE IF NOT EXISTS appointments_archived_2025_q3 PARTITION OF appointments_archived
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');

-- 2025 Q4
CREATE TABLE IF NOT EXISTS appointments_archived_2025_q4 PARTITION OF appointments_archived
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Primary key
ALTER TABLE appointments_archived ADD CONSTRAINT appointments_archived_pkey PRIMARY KEY (id, archived_at);

-- Índices otimizados
CREATE INDEX idx_appointments_archived_shop ON appointments_archived(shop_id);
CREATE INDEX idx_appointments_archived_client ON appointments_archived(client_id);
CREATE INDEX idx_appointments_archived_employee ON appointments_archived(employee_id);
CREATE INDEX idx_appointments_archived_scheduled_at ON appointments_archived(scheduled_at DESC);
CREATE INDEX idx_appointments_archived_status ON appointments_archived(status);
CREATE INDEX idx_appointments_archived_created_at ON appointments_archived(created_at DESC);

-- Índice composto para consultas históricas
CREATE INDEX idx_appointments_archived_shop_date ON appointments_archived(shop_id, scheduled_at DESC);

-- Índice GIN para busca full-text em notes
CREATE INDEX idx_appointments_archived_notes_fts ON appointments_archived USING GIN(to_tsvector('portuguese', notes));


-- =====================================================
-- 3. MESSAGES_ARCHIVED (Particionado por mês)
-- =====================================================
-- Arquiva mensagens antigas do sistema
-- Inclui mensagens WhatsApp, notificações internas, etc
-- =====================================================

CREATE TABLE IF NOT EXISTS messages_archived (
  id UUID NOT NULL,
  shop_id UUID NOT NULL,
  client_id UUID,
  sender_id UUID,  -- ID de quem enviou (user/client)
  message_type VARCHAR(50) NOT NULL,  -- 'whatsapp', 'sms', 'email', 'in_app'
  direction VARCHAR(20) NOT NULL,  -- 'inbound', 'outbound'
  content TEXT NOT NULL,
  status VARCHAR(50),  -- 'sent', 'delivered', 'read', 'failed'
  created_at TIMESTAMP WITH TIME ZZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  external_id VARCHAR(255),  -- ID externo (WhatsApp message ID)
  metadata JSONB,  -- Metadados adicionais
  archived_from VARCHAR(50),
  archive_reason VARCHAR(100)
) PARTITION BY RANGE (archived_at);

-- Criar partições por mês (últimos 18 meses)
-- 2024 mensais
CREATE TABLE IF NOT EXISTS messages_archived_2024_01 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_02 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_03 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_04 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_05 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_06 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_07 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_08 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_09 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_10 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_11 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE IF NOT EXISTS messages_archived_2024_12 PARTITION OF messages_archived
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 2025 mensais
CREATE TABLE IF NOT EXISTS messages_archived_2025_01 PARTITION OF messages_archived
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS messages_archived_2025_02 PARTITION OF messages_archived
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS messages_archived_2025_03 PARTITION OF messages_archived
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS messages_archived_2025_04 PARTITION OF messages_archived
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE IF NOT EXISTS messages_archived_2025_05 PARTITION OF messages_archived
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE IF NOT EXISTS messages_archived_2025_06 PARTITION OF messages_archived
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

-- Primary key
ALTER TABLE messages_archived ADD CONSTRAINT messages_archived_pkey PRIMARY KEY (id, archived_at);

-- Índices otimizados
CREATE INDEX idx_messages_archived_shop ON messages_archived(shop_id);
CREATE INDEX idx_messages_archived_client ON messages_archived(client_id);
CREATE INDEX idx_messages_archived_created_at ON messages_archived(created_at DESC);
CREATE INDEX idx_messages_archived_type ON messages_archived(message_type);
CREATE INDEX idx_messages_archived_status ON messages_archived(status);

-- Índice GIN para busca full-text em content
CREATE INDEX idx_messages_archived_content_fts ON messages_archived USING GIN(to_tsvector('portuguese', content));

-- Índice GIN para metadata JSONB
CREATE INDEX idx_messages_archived_metadata ON messages_archived USING GIN(metadata);


-- =====================================================
-- 4. ACTIVITY_LOGS_ARCHIVED (Particionado por mês)
-- =====================================================
-- Arquiva logs de atividade antigos (audit_logs, webhook_logs, etc)
-- Read-only: INSERT PROTECTED
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_logs_archived (
  id UUID NOT NULL,
  shop_id UUID NOT NULL,
  log_type VARCHAR(50) NOT NULL,  -- 'audit', 'webhook', 'system', 'error'
  table_name VARCHAR(100),
  record_id UUID,
  action VARCHAR(50),
  source VARCHAR(100),  -- Fonte do log
  event_type VARCHAR(100),
  old_data JSONB,
  new_data JSONB,
  payload JSONB,
  status_code INTEGER,
  response TEXT,
  error_message TEXT,
  changed_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_ms INTEGER,
  archived_from VARCHAR(50),
  archive_reason VARCHAR(100)
) PARTITION BY RANGE (archived_at);

-- Criar partições por mês (últimos 6 meses + históricos)
-- 2024 mensais
CREATE TABLE IF NOT EXISTS activity_logs_archived_2024_07 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2024_08 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2024_09 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2024_10 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2024_11 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2024_12 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 2025 mensais
CREATE TABLE IF NOT EXISTS activity_logs_archived_2025_01 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2025_02 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2025_03 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2025_04 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2025_05 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE IF NOT EXISTS activity_logs_archived_2025_06 PARTITION OF activity_logs_archived
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

-- Primary key
ALTER TABLE activity_logs_archived ADD CONSTRAINT activity_logs_archived_pkey PRIMARY KEY (id, archived_at);

-- Índices otimizados
CREATE INDEX idx_activity_logs_archived_shop ON activity_logs_archived(shop_id);
CREATE INDEX idx_activity_logs_archived_type ON activity_logs_archived(log_type);
CREATE INDEX idx_activity_logs_archived_table ON activity_logs_archived(table_name);
CREATE INDEX idx_activity_logs_archived_record ON activity_logs_archived(record_id);
CREATE INDEX idx_activity_logs_archived_created_at ON activity_logs_archived(created_at DESC);
CREATE INDEX idx_activity_logs_archived_action ON activity_logs_archived(action);

-- Índice GIN para busca em JSONB
CREATE INDEX idx_activity_logs_archived_data_gin ON activity_logs_archived USING GIN(old_data);
CREATE INDEX idx_activity_logs_archived_new_data_gin ON activity_logs_archived USING GIN(new_data);
CREATE INDEX idx_activity_logs_archived_payload_gin ON activity_logs_archived USING GIN(payload);


-- =====================================================
-- ROW LEVEL SECURITY (RLS) - SUPERADMIN ONLY
-- =====================================================

-- Ativar RLS em todas as tabelas arquivadas
ALTER TABLE clients_archived ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_archived ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_archived ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs_archived ENABLE ROW LEVEL SECURITY;

-- Política: Apenas superadmin pode ler tabelas arquivadas
CREATE POLICY "Only superadmin can read archived data"
  ON clients_archived FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

CREATE POLICY "Only superadmin can read archived appointments"
  ON appointments_archived FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

CREATE POLICY "Only superadmin can read archived messages"
  ON messages_archived FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

CREATE POLICY "Only superadmin can read archived logs"
  ON activity_logs_archived FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

-- Política: PROIBIR INSERT, UPDATE, DELETE (read-only)
CREATE POLICY "Deny all inserts on archived tables"
  ON clients_archived FOR INSERT
  WITH CHECK (FALSE);

CREATE POLICY "Deny all updates on archived tables"
  ON clients_archived FOR UPDATE
  USING (FALSE);

CREATE POLICY "Deny all deletes on archived tables"
  ON clients_archived FOR DELETE
  USING (FALSE);

-- Repetir para as outras tabelas
CREATE POLICY "Deny all inserts on appointments_archived"
  ON appointments_archived FOR INSERT
  WITH CHECK (FALSE);

CREATE POLICY "Deny all updates on appointments_archived"
  ON appointments_archived FOR UPDATE
  USING (FALSE);

CREATE POLICY "Deny all deletes on appointments_archived"
  ON appointments_archived FOR DELETE
  USING (FALSE);

CREATE POLICY "Deny all inserts on messages_archived"
  ON messages_archived FOR INSERT
  WITH CHECK (FALSE);

CREATE POLICY "Deny all updates on messages_archived"
  ON messages_archived FOR UPDATE
  USING (FALSE);

CREATE POLICY "Deny all deletes on messages_archived"
  ON messages_archived FOR DELETE
  USING (FALSE);

CREATE POLICY "Deny all inserts on activity_logs_archived"
  ON activity_logs_archived FOR INSERT
  WITH CHECK (FALSE);

CREATE POLICY "Deny all updates on activity_logs_archived"
  ON activity_logs_archived FOR UPDATE
  USING (FALSE);

CREATE POLICY "Deny all deletes on activity_logs_archived"
  ON activity_logs_archived FOR DELETE
  USING (FALSE);


-- =====================================================
-- COMENTÁRIOS
-- =====================================================
--
-- Este script cria as 4 tabelas de arquivamento particionadas:
-- 1. clients_archived - particionado por ano (clientes inativos)
-- 2. appointments_archived - particionado por quarter (agendamentos antigos)
-- 3. messages_archived - particionado por mês (mensagens antigas)
-- 4. activity_logs_archived - particionado por mês (logs de atividade)
--
-- Features implementadas:
-- - Particionamento por período (ano/quarter/mês)
-- - Row Level Security (RLS) - apenas superadmin pode acessar
-- - Proteção contra escrita (INSERT/UPDATE/DELETE blocked)
-- - Índices otimizados para consulta histórica
-- - Full-text search em campos text
-- - Metadados de arquivamento (archived_from, archive_reason)
--
-- Próximos passos:
-- 13_archival_policy.sql - stored procedures para arquivamento
-- 14_summary_views.sql - materialized views para stats agregados
-- 15_archival_audit.sql - audit trail completo
--
--
