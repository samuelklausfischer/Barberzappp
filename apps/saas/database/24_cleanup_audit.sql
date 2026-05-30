-- =====================================================
-- BarberZap - Data Cleanup Audit (FASE 5 - Item 5.3)
-- =====================================================
-- Prioridade: 1 (CRÍTICA)
-- Justificativa: Audit trail completo para todas as operações de cleanup
-- Tempo estimado: 2-3 horas
-- =====================================================
-- Este script cria tabelas de audit para rastrear todas as
-- operações de cleanup, garantindo Compliance e debugging.
--
-- TABELAS DE AUDIT:
-- 1. cleanup_runs_log (log individual de cada execução)
-- 2. cleanup_history (aggregate por table, date)
-- 3. cleanup_stats_cache (cache de estatísticas recentes)
-- =====================================================

-- =====================================================
-- 1. CLEANUP RUNS LOG TABLE
-- =====================================================
-- Log individual de cada execução de cleanup
CREATE TABLE IF NOT EXISTS cleanup_runs_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  count_deleted BIGINT NOT NULL DEFAULT 0,

  -- Status da operação
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'dry_run')),

  -- Metadados de erro
  error_message TEXT,
  error_code VARCHAR(50),

  -- Quem executou
  performed_by VARCHAR(255),  -- email, 'system', 'cron', 'worker_id', etc
  performed_by_type VARCHAR(50) DEFAULT 'manual'
    CHECK (performed_by_type IN ('manual', 'system', 'cron', 'worker', 'api', 'cli')),

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- Parâmetros usados
  parameters JSONB DEFAULT '{}',

  -- Metadados
  shop_id UUID,
  dry_run BOOLEAN DEFAULT FALSE,
  notes TEXT,

  -- Timestamp de criação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cleanup_runs_log_job_name ON cleanup_runs_log(job_name);
CREATE INDEX idx_cleanup_runs_log_table_name ON cleanup_runs_log(table_name);
CREATE INDEX idx_cleanup_runs_log_status ON cleanup_runs_log(status);
CREATE INDEX idx_cleanup_runs_log_performed_by ON cleanup_runs_log(performed_by);
CREATE INDEX idx_cleanup_runs_log_started_at ON cleanup_runs_log(started_at DESC);
CREATE INDEX idx_cleanup_runs_log_completed_at ON cleanup_runs_log(completed_at DESC);
CREATE INDEX idx_cleanup_runs_log_shop_id ON cleanup_runs_log(shop_id);

-- Índice composto para queries comuns
CREATE INDEX idx_cleanup_runs_log_status_started ON cleanup_runs_log(status, started_at DESC)
  WHERE status IN ('in_progress', 'failed');

-- =====================================================
-- 2. CLEANUP HISTORY TABLE
-- =====================================================
-- Histórico agregado de cleanups por tabela e data
CREATE TABLE IF NOT EXISTS cleanup_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  cleanup_date DATE NOT NULL,

  -- Counters
  count_deleted BIGINT NOT NULL DEFAULT 0,
  num_runs INTEGER NOT NULL DEFAULT 1,
  duration_ms_total INTEGER DEFAULT 0,

  -- Estatísticas
  avg_duration_ms INTEGER,
  min_duration_ms INTEGER,
  max_duration_ms INTEGER,

  -- Counts por status
  num_success INTEGER DEFAULT 0,
  num_failed INTEGER DEFAULT 0,
  num_dry_run INTEGER DEFAULT 0,

  -- Timestamps
  first_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Última execução
  last_performed_by VARCHAR(255),
  last_status VARCHAR(20),

  UNIQUE (table_name, cleanup_date)
);

-- Índices
CREATE INDEX idx_cleanup_history_table ON cleanup_history(table_name);
CREATE INDEX idx_cleanup_history_date ON cleanup_history(cleanup_date DESC);
CREATE INDEX idx_cleanup_history_last_updated ON cleanup_history(last_updated_at DESC);
CREATE INDEX idx_cleanup_history_count_deleted ON cleanup_history(count_deleted DESC);

-- =====================================================
-- 3. CLEANUP STATS CACHE TABLE
-- =====================================================
-- Cache de estatísticas recentes (para dashboard)
CREATE TABLE IF NOT EXISTS cleanup_stats_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL UNIQUE,

  -- Stats atuais
  pending_count BIGINT DEFAULT 0,
  avg_age_hours NUMERIC DEFAULT 0,
  table_size_mb NUMERIC DEFAULT 0,

  -- Stats históricas
  total_deleted_24h BIGINT DEFAULT 0,
  total_deleted_7d BIGINT DEFAULT 0,
  total_deleted_30d BIGINT DEFAULT 0,
  avg_daily_deleted NUMERIC DEFAULT 0,

  -- Health metrics
  last_cleanup_at TIMESTAMP WITH TIME ZONE,
  cleanup_health_score INTEGER DEFAULT 0,  -- 0-100
  cleanup_errors_24h INTEGER DEFAULT 0,
  data_growth_rate_mb_per_day NUMERIC DEFAULT 0,

  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cleanup_stats_cache_table ON cleanup_stats_cache(table_name);
CREATE INDEX idx_cleanup_stats_cache_updated ON cleanup_stats_cache(updated_at DESC);
CREATE INDEX idx_cleanup_stats_cache_pending_count ON cleanup_stats_cache(pending_count DESC);
CREATE INDEX idx_cleanup_stats_cache_health_score ON cleanup_stats_cache(cleanup_health_score);

-- =====================================================
-- 4. CLEANUP SAFETY LOG TABLE
-- =====================================================
-- Log de operações de segurança (validações, confirmações, force deletes)
CREATE TABLE IF NOT EXISTS cleanup_safety_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type VARCHAR(50) NOT NULL
    CHECK (operation_type IN (
      'validate_delete',
      'confirm_deletion',
      'backup_before_delete',
      'force_delete',
      'dry_run_preview',
      'safety_check_failed',
      'safety_check_passed'
    )),

  table_name VARCHAR(100),
  pending_count BIGINT,
  threshold_count BIGINT,
  threshold_mb NUMERIC,

  -- Resultado da validação/confirmação
  result VARCHAR(20) NOT NULL CHECK (result IN ('passed', 'failed', 'skipped')),
  reason TEXT,

  -- Backup info
  backup_created BOOLEAN DEFAULT FALSE,
  backup_path VARCHAR(500),
  backup_size_bytes BIGINT,

  -- Quem iniciou
  performed_by VARCHAR(255),
  performed_by_type VARCHAR(50) DEFAULT 'manual'
    CHECK (performed_by_type IN ('manual', 'system', 'cron', 'worker', 'api', 'cli')),

  -- Metadata
  shop_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  parameters JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cleanup_safety_log_type ON cleanup_safety_log(operation_type);
CREATE INDEX idx_cleanup_safety_log_table ON cleanup_safety_log(table_name);
CREATE INDEX idx_cleanup_safety_log_result ON cleanup_safety_log(result);
CREATE INDEX idx_cleanup_safety_log_performed_by ON cleanup_safety_log(performed_by);
CREATE INDEX idx_cleanup_safety_log_created_at ON cleanup_safety_log(created_at DESC);

-- =====================================================
-- 5. CLEANUP ALERT LOG TABLE
-- =====================================================
-- Log de alertas gerados pelo sistema de cleanup
CREATE TABLE IF NOT EXISTS cleanup_alert_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Alert info
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'cleanup_failed',
    'cleanup_stuck',
    'table_too_large',
    'cleanup_too_slow',
    'data_accumulating',
    'no_cleanup_recent',
    'quota_exceeded',
    'backup_failed',
    'safety_violation'
  )),

  severity VARCHAR(20) NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),

  -- Context
  table_name VARCHAR(100),
  job_name VARCHAR(100),
  metric_name VARCHAR(100),
  metric_value NUMERIC,
  threshold_value NUMERIC,

  -- Message
  alert_message TEXT NOT NULL,
  details JSONB DEFAULT '{}',

  -- Resolução
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,

  -- Timestamps
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cleanup_alert_log_type ON cleanup_alert_log(alert_type);
CREATE INDEX idx_cleanup_alert_log_severity ON cleanup_alert_log(severity);
CREATE INDEX idx_cleanup_alert_log_table ON cleanup_alert_log(table_name);
CREATE INDEX idx_cleanup_alert_log_acknowledged ON cleanup_alert_log(acknowledged, triggered_at DESC)
  WHERE acknowledged = FALSE;
CREATE INDEX idx_cleanup_alert_log_resolved ON cleanup_alert_log(resolved, resolved_at DESC)
  WHERE resolved = FALSE;
CREATE INDEX idx_cleanup_alert_log_triggered_at ON cleanup_alert_log(triggered_at DESC);

-- =====================================================
-- 6. TRIGGER: Update cleanup_history on insert
-- =====================================================
-- Atualiza cleanup_history quando um cleanup é logado
CREATE OR REPLACE FUNCTION update_cleanup_history_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cleanup_history (
    table_name,
    cleanup_date,
    count_deleted,
    num_runs,
    duration_ms_total,
    avg_duration_ms,
    min_duration_ms,
    max_duration_ms,
    num_success,
    num_failed,
    num_dry_run,
    first_run_at,
    last_run_at,
    last_updated_at,
    last_performed_by,
    last_status
  )
  VALUES (
    NEW.table_name,
    NEW.started_at::DATE,
    NEW.count_deleted,
    1,
    NEW.duration_ms,
    NEW.duration_ms,
    NEW.duration_ms,
    NEW.duration_ms,
    CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.dry_run = TRUE THEN 1 ELSE 0 END,
    NEW.started_at,
    NEW.started_at,
    NOW(),
    NEW.performed_by,
    NEW.status
  )
  ON CONFLICT (table_name, cleanup_date)
  DO UPDATE SET
    count_deleted = cleanup_history.count_deleted + NEW.count_deleted,
    num_runs = cleanup_history.num_runs + 1,
    duration_ms_total = cleanup_history.duration_ms_total + COALESCE(NEW.duration_ms, 0),
    avg_duration_ms = (cleanup_history.duration_ms_total + COALESCE(NEW.duration_ms, 0)) /
                     (cleanup_history.num_runs + 1),
    min_duration_ms = LEAST(cleanup_history.min_duration_ms, COALESCE(NEW.duration_ms, 999999999)),
    max_duration_ms = GREATEST(cleanup_history.max_duration_ms, COALESCE(NEW.duration_ms, 0)),
    num_success = cleanup_history.num_success + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    num_failed = cleanup_history.num_failed + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    num_dry_run = cleanup_history.num_dry_run + CASE WHEN NEW.dry_run = TRUE THEN 1 ELSE 0 END,
    last_run_at = NEW.started_at,
    last_updated_at = NOW(),
    last_performed_by = NEW.performed_by,
    last_status = NEW.status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cleanup_history
  AFTER INSERT ON cleanup_runs_log
  FOR EACH ROW
  EXECUTE FUNCTION update_cleanup_history_trigger();

-- =====================================================
-- 7. FUNCTION: REFRESH CLEANUP STATS CACHE
-- =====================================================
-- Atualiza o cache de estatísticas
CREATE OR REPLACE FUNCTION refresh_cleanup_stats_cache()
RETURNS VOID AS $$
BEGIN
  -- Limpar cache existente
  TRUNCATE TABLE cleanup_stats_cache;

  -- Recalcular stats para cada tabela
  INSERT INTO cleanup_stats_cache (
    table_name,
    pending_count,
    avg_age_hours,
    table_size_mb,
    total_deleted_24h,
    total_deleted_7d,
    total_deleted_30d,
    avg_daily_deleted,
    last_cleanup_at,
    data_growth_rate_mb_per_day,
    cleanup_health_score,
    cleanup_errors_24h,
    calculated_at
  )
  SELECT
    stats.table_name,
    stats.pending_count,
    stats.avg_age_hours,
    stats.table_size_mb,
    COALESCE(del_24h.total_deleted, 0) as total_deleted_24h,
    COALESCE(del_7d.total_deleted, 0) as total_deleted_7d,
    COALESCE(del_30d.total_deleted, 0) as total_deleted_30d,
    COALESCE(del_30d.total_deleted, 0)::NUMERIC / 30 as avg_daily_deleted,
    del.last_cleanup_at,
    COALESCE(growth.growth_rate_mb_per_day, 0) as data_growth_rate_mb_per_day,
    -- Calculate health score (0-100)
    CASE
      WHEN stats.table_size_mb > 10000 THEN 10  -- Table too large
      WHEN stats.avg_age_hours > 48 THEN 30  -- Data too old
      WHEN COALESCE(del_24h.total_deleted, 0) = 0 AND stats.pending_count > 1000 THEN 50 -- Not cleaning up
      WHEN COALESCE(del_24h.total_deleted, 0) > 0 THEN 100 -- Cleaning regularly
      ELSE 70
    END as cleanup_health_score,
    COALESCE(err_24h.error_count, 0) as cleanup_errors_24h,
    NOW() as calculated_at
  FROM (
    -- Current stats
    SELECT unnest(ARRAY['magic_links', 'verification_codes', 'notifications',
                          'activity_logs', 'client_session_tokens', 'password_reset_tokens', 'cache_entries']) as table_name
  ) all_tables
  LEFT JOIN LATERAL (
    -- Get pending count and table size
    SELECT
      CASE t.table_name
        WHEN 'magic_links' THEN (SELECT COUNT(*) FROM magic_links WHERE used_at IS NULL AND expiry_date < NOW())
        WHEN 'verification_codes' THEN (SELECT COUNT(*) FROM verification_codes WHERE verified_at IS NULL AND expiry_date < NOW())
        WHEN 'notifications' THEN (SELECT COUNT(*) FROM notifications WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days')
        WHEN 'activity_logs' THEN (SELECT COUNT(*) FROM v_duplicate_activity_logs)
        WHEN 'client_session_tokens' THEN (SELECT COUNT(*) FROM client_session_tokens WHERE logout_at IS NULL AND expiry_date < NOW())
        WHEN 'password_reset_tokens' THEN (SELECT COUNT(*) FROM password_reset_tokens WHERE used_at IS NULL AND expiry_date < NOW())
        WHEN 'cache_entries' THEN (SELECT COUNT(*) FROM cache_entries WHERE (expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days') OR (expires_at IS NOT NULL AND expires_at < NOW()))
      END as pending_count,
      CASE t.table_name
        WHEN 'magic_links' THEN (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - expiry_date))/3600, 0) FROM magic_links WHERE used_at IS NULL AND expiry_date < NOW())
        WHEN 'verification_codes' THEN (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - expiry_date))/3600, 0) FROM verification_codes WHERE verified_at IS NULL AND expiry_date < NOW())
        WHEN 'notifications' THEN (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - read_at))/3600, 0) FROM notifications WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days')
        WHEN 'activity_logs' THEN 0
        WHEN 'client_session_tokens' THEN (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - expiry_date))/3600, 0) FROM client_session_tokens WHERE logout_at IS NULL AND expiry_date < NOW())
        WHEN 'password_reset_tokens' THEN (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - expiry_date))/3600, 0) FROM password_reset_tokens WHERE used_at IS NULL AND expiry_date < NOW())
        WHEN 'cache_entries' THEN (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - COALESCE(expires_at, last_accessed_at)))/3600, 0) FROM cache_entries WHERE (expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days') OR (expires_at IS NOT NULL AND expires_at < NOW()))
      END as avg_age_hours,
      pg_total_relation_size(quote_ident(t.table_name))::NUMERIC / 1024 / 1024 as table_size_mb
    FROM unnest(ARRAY['magic_links', 'verification_codes', 'notifications',
                     'activity_logs', 'client_session_tokens', 'password_reset_tokens', 'cache_entries']) AS t(table_name)
  ) stats ON true
  LEFT JOIN LATERAL (
    -- Last cleanup time
    SELECT MAX(started_at) as last_cleanup_at
    FROM cleanup_runs_log
    WHERE table_name = all_tables.table_name
      AND status = 'completed'
  ) del ON true
  LEFT JOIN LATERAL (
    -- Deleted in last 24h
    SELECT SUM(count_deleted) as total_deleted
    FROM cleanup_runs_log
    WHERE table_name = all_tables.table_name
      AND started_at > NOW() - INTERVAL '24 hours'
      AND status = 'completed'
  ) del_24h ON true
  LEFT JOIN LATERAL (
    -- Deleted in last 7d
    SELECT SUM(count_deleted) as total_deleted
    FROM cleanup_runs_log
    WHERE table_name = all_tables.table_name
      AND started_at > NOW() - INTERVAL '7 days'
      AND status = 'completed'
  ) del_7d ON true
  LEFT JOIN LATERAL (
    -- Deleted in last 30d
    SELECT SUM(count_deleted) as total_deleted
    FROM cleanup_runs_log
    WHERE table_name = all_tables.table_name
      AND started_at > NOW() - INTERVAL '30 days'
      AND status = 'completed'
  ) del_30d ON true
  LEFT JOIN LATERAL (
    -- Error count in last 24h
    SELECT COUNT(*) as error_count
    FROM cleanup_runs_log
    WHERE table_name = all_tables.table_name
      AND status = 'failed'
      AND started_at > NOW() - INTERVAL '24 hours'
  ) err_24h ON true
  LEFT JOIN LATERAL (
    -- Data growth rate (compare current size vs 7 days ago)
    WITH history_stats AS (
      SELECT table_name, SUM(count_deleted) as deleted_count
      FROM cleanup_history
      WHERE cleanup_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY table_name
    ),
    avg_row_size AS (
      SELECT
        CASE all_tables.table_name
          WHEN 'magic_links' THEN (SELECT AVG(pg_column_size(*)) FROM magic_links LIMIT 100)
          WHEN 'verification_codes' THEN (SELECT AVG(pg_column_size(*)) FROM verification_codes LIMIT 100)
          WHEN 'notifications' THEN (SELECT AVG(pg_column_size(*)) FROM notifications LIMIT 100)
          WHEN 'activity_logs' THEN (SELECT AVG(pg_column_size(*)) FROM activity_logs LIMIT 100)
          WHEN 'client_session_tokens' THEN (SELECT AVG(pg_column_size(*)) FROM client_session_tokens LIMIT 100)
          WHEN 'password_reset_tokens' THEN (SELECT AVG(pg_column_size(*)) FROM password_reset_tokens LIMIT 100)
          WHEN 'cache_entries' THEN (SELECT AVG(pg_column_size(*)) FROM cache_entries LIMIT 100)
        END * COALESCE(hs.deleted_count, 0) / 1024 / 1024 as estimated_deleted_mb
      FROM all_tables
      LEFT JOIN history_stats hs ON hs.table_name = all_tables.table_name
    )
    SELECT (stats.table_size_mb - COALESCE(ars.estimated_deleted_mb, 0)) / 7 as growth_rate_mb_per_day
    FROM avg_row_size ars
  ) growth ON true;

  RAISE NOTICE 'Cleanup stats cache refreshed';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCTION: LOG SAFETY CHECK
-- =====================================================
-- Log de checks de segurança
CREATE OR REPLACE FUNCTION log_safety_check(
  p_operation_type VARCHAR,
  p_table_name VARCHAR,
  p_pending_count BIGINT,
  p_threshold_count BIGINT,
  p_result VARCHAR,
  p_reason TEXT DEFAULT NULL,
  p_performed_by VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_safety_id UUID;
BEGIN
  INSERT INTO cleanup_safety_log (
    operation_type,
    table_name,
    pending_count,
    threshold_count,
    result,
    reason,
    performed_by
  ) VALUES (
    p_operation_type,
    p_table_name,
    p_pending_count,
    p_threshold_count,
    p_result,
    p_reason,
    p_performed_by
  )
  RETURNING id INTO v_safety_id;

  RETURN v_safety_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNCTION: CREATE ALERT
-- =====================================================
-- Cria um alerta de cleanup
CREATE OR REPLACE FUNCTION create_cleanup_alert(
  p_alert_type VARCHAR,
  p_severity VARCHAR,
  p_table_name VARCHAR,
  p_job_name VARCHAR,
  p_alert_message TEXT,
  p_details JSONB DEFAULT NULL,
  p_metric_value NUMERIC DEFAULT NULL,
  p_threshold_value NUMERIC DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO cleanup_alert_log (
    alert_type,
    severity,
    table_name,
    job_name,
    alert_message,
    details,
    metric_value,
    threshold_value
  ) VALUES (
    p_alert_type,
    p_severity,
    p_table_name,
    p_job_name,
    p_alert_message,
    COALESCE(p_details, '{}'::JSONB),
    p_metric_value,
    p_threshold_value
  )
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. VIEW: CLEANUP DASHBOARD SUMMARY
-- =====================================================
-- View consolidada para o dashboard
CREATE OR REPLACE VIEW v_cleanup_dashboard AS
SELECT
  sc.table_name,
  sc.pending_count,
  sc.avg_age_hours,
  sc.table_size_mb,
  sc.total_deleted_24h,
  sc.total_deleted_7d,
  sc.total_deleted_30d,
  sc.avg_daily_deleted,
  sc.last_cleanup_at,
  sc.data_growth_rate_mb_per_day,
  sc.cleanup_health_score,
  sc.cleanup_errors_24h,
  sc.updated_at,

  -- Latest log entry
  (SELECT started_at FROM cleanup_runs_log l WHERE l.table_name = sc.table_name ORDER BY started_at DESC LIMIT 1) as last_run_at,
  (SELECT status FROM cleanup_runs_log l WHERE l.table_name = sc.table_name ORDER BY started_at DESC LIMIT 1) as last_run_status,
  (SELECT count_deleted FROM cleanup_runs_log l WHERE l.table_name = sc.table_name ORDER BY started_at DESC LIMIT 1) as last_run_count,

  -- Active alerts
  (SELECT COUNT(*) FROM cleanup_alert_log a WHERE a.table_name = sc.table_name AND a.acknowledged = FALSE) as active_alerts
FROM cleanup_stats_cache sc;

-- =====================================================
-- INSTRUÇÕES
-- =====================================================
--
-- Após criar as tabelas de audit:
--
-- 1. Verificar logs recentes:
--    SELECT * FROM cleanup_runs_log ORDER BY started_at DESC LIMIT 20;
--
-- 2. Verificar histórico por tabela:
--    SELECT * FROM cleanup_history WHERE table_name = 'magic_links' ORDER BY cleanup_date DESC LIMIT 30;
--
-- 3. Verificar estatísticas cache:
--    SELECT * FROM cleanup_stats_cache ORDER BY pending_count DESC;
--
-- 4. Atualizar stats cache manualmente:
--    SELECT refresh_cleanup_stats_cache();
--
-- 5. Verificar resumo do dashboard:
--    SELECT * FROM v_cleanup_dashboard;
--
-- 6. Criar alerta manual:
--    SELECT create_cleanup_alert('cleanup_failed', 'error', 'magic_links', 'cleanup_magic_links', 'Cleanup failed for magic links');
--
-- 7. Verificar log de segurança:
--    SELECT * FROM cleanup_safety_log ORDER BY created_at DESC LIMIT 20;
--
-- 8. Verificar alertas ativos:
--    SELECT * FROM cleanup_alert_log WHERE acknowledged = FALSE ORDER BY severity DESC, triggered_at DESC;
--
-- =====================================================
