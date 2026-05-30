-- =====================================================
-- BarberZap - Archival Audit Trail (FASE X - Item 4)
-- =====================================================
-- Prioridade: 2 (MUITO IMPORTANTE)
-- Justificativa: Auditoria completa de operações de arquivamento
-- Tempo estimado: 2-3 horas
-- =====================================================
-- Este script cria as tabelas de audit trail para
-- rastrear todas as operações de arquivamento.
-- =====================================================

-- =====================================================
-- 1. ARCHIVAL_OPERATIONS_LOG
-- =====================================================
-- Log de todas as operações de arquivamento
-- Quem fez o quê, quando, e quantos registros
-- =====================================================

CREATE TABLE IF NOT EXISTS archival_operations_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type VARCHAR(50) NOT NULL,  -- 'archive', 'restore', 'stats', 'cleanup'
  table_name VARCHAR(100) NOT NULL,     -- 'clients', 'appointments', 'messages', 'activity_logs'
  criteria JSONB NOT NULL,              -- {older_than_months: 24, shop_id: 'xxx'}
  records_affected INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,             -- Calculado na completão
  performed_by VARCHAR(255),            -- 'system', 'admin@barber.com', etc
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress',  -- 'in_progress', 'completed', 'failed', 'cancelled'
  error_message TEXT,
  metadata JSONB,                       -- Informações adicionais
  dry_run BOOLEAN DEFAULT FALSE
);

-- Índices para consultas de audit
CREATE INDEX idx_archival_operations_type ON archival_operations_log(operation_type);
CREATE INDEX idx_archival_operations_table ON archival_operations_log(table_name);
CREATE INDEX idx_archival_operations_status ON archival_operations_log(status);
CREATE INDEX idx_archival_operations_performed_by ON archival_operations_log(performed_by);
CREATE INDEX idx_archival_operations_started_at ON archival_operations_log(started_at DESC);
CREATE INDEX idx_archival_operations_shop ON archival_operations_log((criteria->>'shop_id'));

-- Índice GIN para busca em criteria e metadata
CREATE INDEX idx_archival_operations_criteria ON archival_operations_log USING GIN(criteria);
CREATE INDEX idx_archival_operations_metadata ON archival_operations_log USING GIN(metadata);

-- Comentário
COMMENT ON TABLE archival_operations_log IS 'Log of all archival operations with full audit trail';


-- =====================================================
-- 2. ARCHIVAL_OPERATIONS_STATS
-- =====================================================
-- Estatísticas agregadas de operações de arquivamento
-- Útil para reports de performance e tendências
-- =====================================================

CREATE TABLE IF NOT EXISTS archival_operations_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_date DATE NOT NULL,              -- Dia das estatísticas
  table_name VARCHAR(100) NOT NULL,     -- 'clients', 'appointments', etc
  total_records_archived INTEGER NOT NULL DEFAULT 0,
  total_size_freed_mb DECIMAL(10,2),    -- Espaço liberado em MB
  operations_count INTEGER NOT NULL DEFAULT 0,
  avg_duration_seconds DECIMAL(10,2),
  successful_operations INTEGER DEFAULT 0,
  failed_operations INTEGER DEFAULT 0,
  shops_processed INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint para garantir uniqueness por dia/tabela
  UNIQUE(table_name, stat_date)
);

-- Índices
CREATE INDEX idx_archival_stats_date ON archival_operations_stats(stat_date DESC);
CREATE INDEX idx_archival_stats_table ON archival_operations_stats(table_name);
CREATE INDEX idx_archival_stats_composite ON archival_operations_stats(table_name, stat_date DESC);

-- Comentário
COMMENT ON TABLE archival_operations_stats IS 'Aggregated statistics of archival operations by day and table';


-- =====================================================
-- 3. ARCHIVAL_RESTORE_LOG
-- =====================================================
-- Log de todas as operações de restauração
-- Importante para auditoria de emergências
-- =====================================================

CREATE TABLE IF NOT EXISTS archival_restore_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL,              -- ID do registro restaurado
  record_type VARCHAR(50) NOT NULL,     -- 'appointment', 'client', etc
  table_name VARCHAR(100) NOT NULL,     -- Tabela de origem (ex: appointments_archived)
  shop_id UUID NOT NULL,
  restored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  restored_by VARCHAR(255) NOT NULL,    -- Quem fez o restore
  restore_reason TEXT,                  -- Por que restaurou
  metadata JSONB,                       -- Detalhes adicionais
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

-- Índices
CREATE INDEX idx_archival_restore_record ON archival_restore_log(record_id);
CREATE INDEX idx_archival_restore_shop ON archival_restore_log(shop_id);
CREATE INDEX idx_archival_restore_type ON archival_restore_log(record_type);
CREATE INDEX idx_archival_restore_date ON archival_restore_log(restored_at DESC);
CREATE INDEX idx_archival_restore_by ON archival_restore_log(restored_by);

-- Comentário
COMMENT ON TABLE archival_restore_log IS 'Log of all restoration operations from archived tables';


-- =====================================================
-- 4. ARCHIVAL_SIZE_TRACKING
-- =====================================================
-- Rastreamento de tamanho de tabelas ao longo do tempo
-- Para calcular espaço liberado e crescimento
-- =====================================================

CREATE TABLE IF NOT EXISTS archival_size_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  table_name VARCHAR(100) NOT NULL,
  is_archived BOOLEAN NOT NULL,         -- TRUE para *_archived, FALSE para origem
  row_count BIGINT,
  total_size_mb DECIMAL(10,2),
  index_size_mb DECIMAL(10,2),
  table_size_mb DECIMAL(10,2),
  shop_id UUID,                         -- NULL se for agregado global
  metadata JSONB
);

-- Índices
CREATE INDEX idx_archival_size_table ON archival_size_tracking(table_name);
CREATE INDEX idx_archival_size_tracked_at ON archival_size_tracking(tracked_at DESC);
CREATE INDEX idx_archival_size_composite ON archival_size_tracking(table_name, is_archived, tracked_at DESC);
CREATE INDEX idx_archival_size_shop ON archival_size_tracking(shop_id);

-- Comentário
COMMENT ON TABLE archival_size_tracking IS 'Historical tracking of table sizes for archival analysis';


-- =====================================================
-- 5. ARCHIVAL_ACCESS_LOG
-- =====================================================
-- Log de acessos às tabelas arquivadas
-- Para controle de acesso e compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS archival_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,                         -- Quem acessou
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  table_name VARCHAR(100) NOT NULL,     -- clients_archived, appointments_archived, etc
  access_type VARCHAR(50) NOT NULL,     -- 'select', 'export', 'search'
  query_summary TEXT,                   -- Resumo da query (primeiros 500 chars)
  records_returned INTEGER,
  duration_ms INTEGER,
  shop_id UUID,                         -- Shop acessado (se aplicável)
  ip_address VARCHAR(45),
  metadata JSONB
);

-- Índices
CREATE INDEX idx_archival_access_user ON archival_access_log(user_id);
CREATE INDEX idx_archival_access_table ON archival_access_log(table_name);
CREATE INDEX idx_archival_access_date ON archival_access_log(accessed_at DESC);
CREATE INDEX idx_archival_access_type ON archival_access_log(access_type);
CREATE INDEX idx_archival_access_shop ON archival_access_log(shop_id);

-- Índice para expurgo automático de logs antigos
CREATE INDEX idx_archival_access_date_purge ON archival_access_log(accessed_at);

-- Comentário
COMMENT ON TABLE archival_access_log IS 'Log of all accesses to archived tables for compliance and audit';


-- =====================================================
-- TRIGGERS FOR AUTOMATIC AUDITING
-- =====================================================

-- Trigger para atualizar operations_log quando completar operação
CREATE OR REPLACE FUNCTION trigger_update_archival_operation_completion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE archival_operations_log
  SET
    completed_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    status = NEW.status,
    error_message = NEW.error_message
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar tamanho de tabelas após operações
CREATE OR REPLACE FUNCTION trigger_log_table_size()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO archival_size_tracking (
      table_name, is_archived,
      row_count, total_size_mb, index_size_mb, table_size_mb,
      metadata
    )
    WITH size_info AS (
      SELECT
        schemaname::TEXT || '.' || tablename::TEXT AS table_name
      FROM pg_stat_user_tables
      WHERE tablename LIKE '%' || NEW.table_name || '%'
      LIMIT 2
    )
    SELECT
      si.table_name,
      si.table_name LIKE '%_archived',
      n_live_tup,
      pg_total_relation_size(si.table_name)::DECIMAL / (1024 * 1024),
      pg_indexes_size(si.table_name)::DECIMAL / (1024 * 1024),
      pg_relation_size(si.table_name)::DECIMAL / (1024 * 1024),
      jsonb_build_object('operation_id', NEW.id)
    FROM size_info si
    CROSS JOIN pg_stat_user_tables psut
    WHERE psut.schemaname || '.' || psut.tablename = si.table_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER tr_archival_operation_completion
  AFTER UPDATE ON archival_operations_log
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed', 'cancelled') AND OLD.status = 'in_progress')
  EXECUTE FUNCTION trigger_update_archival_operation_completion();

CREATE TRIGGER tr_archival_log_size
  AFTER INSERT OR UPDATE ON archival_operations_log
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS NULL)
  EXECUTE FUNCTION trigger_log_table_size();


-- =====================================================
-- STORED PROCEDURES FOR AUDIT FUNCTIONS
-- =====================================================

-- Função para registrar início de operação de arquivamento
CREATE OR REPLACE FUNCTION log_archival_operation_start(
  p_operation_type VARCHAR,
  p_table_name VARCHAR,
  p_criteria JSONB,
  p_performed_by VARCHAR DEFAULT 'system',
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_operation_id UUID;
BEGIN
  INSERT INTO archival_operations_log (
    operation_type, table_name, criteria,
    performed_by, dry_run, status, started_at
  )
  VALUES (
    p_operation_type, p_table_name, p_criteria,
    p_performed_by, p_dry_run, 'in_progress', NOW()
  )
  RETURNING id INTO v_operation_id;

  RETURN v_operation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para completar operação de arquivamento
CREATE OR REPLACE FUNCTION log_archival_operation_complete(
  p_operation_id UUID,
  p_status VARCHAR,
  p_records_affected INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE archival_operations_log
  SET
    status = p_status,
    completed_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    records_affected = p_records_affected,
    error_message = p_error_message,
    metadata = COALESCE(p_metadata, metadata)
  WHERE id = p_operation_id;

  -- Atualizar estatísticas diárias
  IF p_status = 'completed' THEN
    INSERT INTO archival_operations_stats (
      stat_date, table_name, total_records_archived,
      operations_count, successful_operations
    )
    SELECT
      CURRENT_DATE,
      table_name,
      p_records_affected,
      1,
      CASE WHEN p_status = 'completed' THEN 1 ELSE 0 END
    FROM archival_operations_log
    WHERE id = p_operation_id
    ON CONFLICT (table_name, stat_date)
    DO UPDATE SET
      total_records_archived = archival_operations_stats.total_records_archived + EXCLUDED.total_records_archived,
      operations_count = archival_operations_stats.operations_count + 1,
      successful_operations = archival_operations_stats.successful_operations + EXCLUDED.successful_operations;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar acesso a tabelas arquivadas
CREATE OR REPLACE FUNCTION log_archival_access(
  p_table_name VARCHAR,
  p_user_id UUID,
  p_user_role VARCHAR,
  p_access_type VARCHAR,
  p_query_summary TEXT DEFAULT NULL,
  p_records_returned INTEGER DEFAULT 0,
  p_duration_ms INTEGER DEFAULT 0,
  p_shop_id UUID DEFAULT NULL,
  p_ip_address VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO archival_access_log (
    table_name, user_id, user_role, access_type,
    query_summary, records_returned, duration_ms,
    shop_id, ip_address
  )
  VALUES (
    p_table_name, p_user_id, p_user_role, p_access_type,
    p_query_summary, p_records_returned, p_duration_ms,
    p_shop_id, p_ip_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular estatísticas de arquivamento por período
CREATE OR REPLACE FUNCTION get_archival_statistics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_table_name VARCHAR DEFAULT NULL
)
RETURNS TABLE(
  table_name VARCHAR,
  total_operations BIGINT,
  total_records_archived BIGINT,
  successful_operations BIGINT,
  failed_operations BIGINT,
  avg_duration_seconds DECIMAL,
  total_duration_seconds BIGINT,
  avg_records_per_operation DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aol.table_name,
    COUNT(*)::BIGINT AS total_operations,
    SUM(aol.records_affected)::BIGINT AS total_records_archived,
    COUNT(*) FILTER (WHERE aol.status = 'completed')::BIGINT AS successful_operations,
    COUNT(*) FILTER (WHERE aol.status = 'failed')::BIGINT AS failed_operations,
    AVG(aol.duration_seconds) AS avg_duration_seconds,
    SUM(aol.duration_seconds)::BIGINT AS total_duration_seconds,
    AVG(aol.records_affected) AS avg_records_per_operation
  FROM archival_operations_log aol
  WHERE
    (p_start_date IS NULL OR DATE(aol.started_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(aol.started_at) <= p_end_date)
    AND (p_table_name IS NULL OR aol.table_name = p_table_name)
  GROUP BY aol.table_name
  ORDER BY total_records_archived DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar logs antigos (retention)
CREATE OR REPLACE FUNCTION cleanup_archival_logs(
  p_retention_days INTEGER DEFAULT 90,
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_operations_deleted BIGINT;
  v_access_deleted BIGINT;
BEGIN
  IF p_dry_run THEN
    SELECT COUNT(*)
    INTO v_operations_deleted
    FROM archival_operations_log
    WHERE started_at < NOW() - (p_retention_days || ' days')::INTERVAL;

    SELECT COUNT(*)
    INTO v_access_deleted
    FROM archival_access_log
    WHERE accessed_at < NOW() - (p_retention_days || ' days')::INTERVAL;

    RETURN jsonb_build_object(
      'dry_run', TRUE,
      'operations_to_delete', v_operations_deleted,
      'access_logs_to_delete', v_access_deleted,
      'message', 'Dry run - no changes made'
    );
  END IF;

  -- Deletar operations antigos
  DELETE FROM archival_operations_log
  WHERE started_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_operations_deleted = ROW_COUNT;

  -- Deletar access logs antigos
  DELETE FROM archival_access_log
  WHERE accessed_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_access_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'dry_run', FALSE,
    'operations_deleted', v_operations_deleted,
    'access_logs_deleted', v_access_deleted,
    'message', 'Archive logs cleaned up successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- ROW LEVEL SECURITY (RLS) FOR AUDIT TABLES
-- =====================================================

-- Ativar RLS
ALTER TABLE archival_operations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE archival_operations_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE archival_restore_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE archival_size_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE archival_access_log ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas superadmin pode ver logs
CREATE POLICY "Only superadmin can view archival logs"
  ON archival_operations_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

CREATE POLICY "Only superadmin can view archival stats"
  ON archival_operations_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

CREATE POLICY "Only superadmin can view restore logs"
  ON archival_restore_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

CREATE POLICY "Only superadmin can view size tracking"
  ON archival_size_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

CREATE POLICY "Only superadmin can view access logs"
  ON archival_access_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

-- Superadmin pode inserir logs (via stored procedures)
CREATE POLICY "Superadmin can insert archival logs"
  ON archival_operations_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

-- Stored procedures têm SECURITY DEFINER, então podem inserir


-- =====================================================
-- COMENTÁRIOS
-- =====================================================
--
-- Este script cria 5 tabelas de audit trail para arquivamento:
-- 1. archival_operations_log - log de operações de arquivamento
-- 2. archival_operations_stats - estatísticas agregadas por dia
-- 3. archival_restore_log - log de restaurações
-- 4. archival_size_tracking - tracking de tamanho de tabelas
-- 5. archival_access_log - log de acessos a dados arquivados
--
-- Features implementadas:
-- - Triggers para atualização automática de status
-- - Stored procedures para facilitar logging
-- - Funções para cálculo de estatísticas
-- - Função de cleanup para logs antigos
-- - Row Level Security (RLS) - apenas superadmin
-- - Índices otimizados para consultas de audit
--
-- Uso recomendado:
-- - Acessar via stored procedures (log_archival_operation_start, etc)
-- - Limpar logs antigos com cleanup_archival_logs (90 dias)
-- - Consultar estatísticas com get_archival_statistics
--
-- Próximo:
-- archival_job.py - BullMQ jobs para arquivamento assíncrono
--
