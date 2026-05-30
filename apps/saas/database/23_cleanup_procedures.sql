-- =====================================================
-- BarberZap - Data Cleanup Procedures (FASE 5 - Item 5.2)
-- =====================================================
-- Prioridade: 1 (CRÍTICA)
-- Justificativa: Stored procedures automáticos para limpeza segura
-- Tempo estimado: 3-4 horas
-- =====================================================
-- Este script cria stored procedures para limpeza automática
-- de dados temporários e expirados.
--
-- PROCEDURES CRIADAS:
-- 1. procedure_cleanup_expired_magic_links()
-- 2. procedure_cleanup_expired_codes()
-- 3. procedure_cleanup_old_notifications(log_days=7)
-- 4. procedure_cleanup_duplicate_activity_logs()
-- 5. procedure_cleanup_expired_tokens()
-- 6. procedure_cleanup_cache_entries()
-- 7. procedure_cleanup_all_tables()
--
-- SCHEDULE:
-- - Exec diariamente às 03:00 UTC
-- - Log de count deletado
-- - Rollback em caso de erro
-- =====================================================

-- =====================================================
-- 1. HELPER FUNCTIONS
-- =====================================================

-- Função: Log cleanup operation
CREATE OR REPLACE FUNCTION log_cleanup_operation(
  p_job_name VARCHAR,
  p_table_name VARCHAR,
  p_count_deleted BIGINT,
  p_status VARCHAR,
  p_error_message TEXT DEFAULT NULL,
  p_performed_by VARCHAR DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_cleanup_id UUID;
BEGIN
  INSERT INTO cleanup_runs_log (
    job_name,
    table_name,
    count_deleted,
    status,
    error_message,
    performed_by,
    duration_ms,
    started_at,
    completed_at
  ) VALUES (
    p_job_name,
    p_table_name,
    p_count_deleted,
    p_status,
    p_error_message,
    COALESCE(p_performed_by, 'system'),
    p_duration_ms,
    NOW(),
    CASE WHEN p_duration_ms IS NOT NULL THEN NOW() ELSE NULL END
  )
  RETURNING id INTO v_cleanup_id;

  RETURN v_cleanup_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Delete with logging
CREATE OR REPLACE FUNCTION delete_with_logging(
  p_table_name VARCHAR,
  p_delete_condition TEXT,
  p_job_name VARCHAR,
  p_performed_by VARCHAR DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE
) RETURNS BIGINT AS $$
DECLARE
  v_count_deleted BIGINT;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
  v_duration_ms INTEGER;
  v_cleanup_id UUID;
  v_status VARCHAR;
  v_error_message TEXT;
BEGIN
  v_start_time := NOW();

  -- Execute delete (or count in dry run mode)
  IF p_dry_run THEN
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE %s', p_table_name, p_delete_condition)
    INTO v_count_deleted;
    v_status := 'dry_run';
  ELSE
    BEGIN
      EXECUTE format('DELETE FROM %I WHERE %s', p_table_name, p_delete_condition);
      GET DIAGNOSTICS v_count_deleted = ROW_COUNT;
      v_status := 'completed';
    EXCEPTION
      WHEN OTHERS THEN
        v_count_deleted := 0;
        v_status := 'failed';
        v_error_message := SQLERRM;
        RAISE NOTICE 'Error deleting from %: %', p_table_name, SQLERRM;
        -- Log the error
        EXECUTE format(
          'INSERT INTO cleanup_runs_log (job_name, table_name, count_deleted, status, error_message, performed_by, started_at, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
          p_job_name, p_table_name, 0, 'failed', v_error_message, COALESCE(p_performed_by, 'system'), v_start_time
        );
        RAISE;
    END;
  END IF;

  v_end_time := NOW();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INTEGER;

  -- Log the operation
  v_cleanup_id := log_cleanup_operation(
    p_job_name,
    p_table_name,
    v_count_deleted,
    v_status,
    v_error_message,
    p_performed_by,
    v_duration_ms
  );

  -- Update history table
  INSERT INTO cleanup_history (
    table_name,
    cleanup_date,
    count_deleted,
    job_name
  ) VALUES (
    p_table_name,
    CURRENT_DATE,
    v_count_deleted,
    p_job_name
  )
  ON CONFLICT (table_name, cleanup_date)
  DO UPDATE SET
    count_deleted = cleanup_history.count_deleted + v_count_deleted,
    last_updated_at = NOW();

  RETURN v_count_deleted;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. CLEANUP PROCEDURE: EXPIRED MAGIC LINKS
-- =====================================================
-- Deleta magic links expirados há mais de 24 horas
CREATE OR REPLACE PROCEDURE procedure_cleanup_expired_magic_links(
  p_hours_ago INTEGER DEFAULT 24,
  p_performed_by VARCHAR DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE,
  OUT v_count_deleted BIGINT
) AS $$
BEGIN
  v_count_deleted := delete_with_logging(
    'magic_links',
    format('used_at IS NULL AND expiry_date < NOW() - INTERVAL ''%s hours''', p_hours_ago),
    'cleanup_magic_links',
    p_performed_by,
    p_dry_run
  );

  RAISE NOTICE 'Deleted % expired magic links (older than % hours)', v_count_deleted, p_hours_ago;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CLEANUP PROCEDURE: EXPIRED VERIFICATION CODES
-- =====================================================
-- Deleta códigos de verificação expirados há mais de 1 hora
CREATE OR REPLACE PROCEDURE procedure_cleanup_expired_codes(
  p_hours_ago INTEGER DEFAULT 1,
  p_performed_by VARCHAR DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE,
  OUT v_count_deleted BIGINT
) AS $$
BEGIN
  v_count_deleted := delete_with_logging(
    'verification_codes',
    format('verified_at IS NULL AND expiry_date < NOW() - INTERVAL ''%s hours''', p_hours_ago),
    'cleanup_verification_codes',
    p_performed_by,
    p_dry_run
  );

  RAISE NOTICE 'Deleted % expired verification codes (older than % hours)', v_count_deleted, p_hours_ago;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CLEANUP PROCEDURE: OLD NOTIFICATIONS
-- =====================================================
-- Deleta notificações lidas e antigas (default 7 dias+)
CREATE OR REPLACE PROCEDURE procedure_cleanup_old_notifications(
  p_log_days INTEGER DEFAULT 7,
  p_performed_by VARCHAR DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE,
  OUT v_count_deleted BIGINT
) AS $$
BEGIN
  v_count_deleted := delete_with_logging(
    'notifications',
    format('read_at IS NOT NULL AND read_at < NOW() - INTERVAL ''%s days''', p_log_days),
    'cleanup_notifications',
    p_performed_by,
    p_dry_run
  );

  RAISE NOTICE 'Deleted % old notifications (read %+ days ago)', v_count_deleted, p_log_days;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CLEANUP PROCEDURE: DUPLICATE ACTIVITY LOGS
-- =====================================================
-- Deleta logs de atividade duplicados (dentro de 1 minuto)
CREATE OR REPLACE PROCEDURE procedure_cleanup_duplicate_activity_logs(
  p_time_gap_minutes INTEGER DEFAULT 1,
  p_performed_by VARCHAR DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE,
  OUT v_count_deleted BIGINT
) AS $$
BEGIN
  v_count_deleted := delete_with_logging(
    'activity_logs',
    format(<<SQL>>
      id IN (
        SELECT id FROM (
          SELECT
            id,
            fingerprint,
            created_at,
            ROW_NUMBER() OVER (
              PARTITION BY fingerprint
              ORDER BY created_at
            ) as row_num,
            LAG(created_at) OVER (
              PARTITION BY fingerprint
              ORDER BY created_at
            ) as prev_created_at
          FROM activity_logs
          WHERE fingerprint IS NOT NULL
        ) ranked
        WHERE row_num > 1
          AND created_at - prev_created_at < INTERVAL '%s minutes'
      )
    SQL, p_time_gap_minutes),
    'cleanup_activity_logs',
    p_performed_by,
    p_dry_run
  );

  RAISE NOTICE 'Deleted % duplicate activity logs (within % minutes)', v_count_deleted, p_time_gap_minutes;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CLEANUP PROCEDURE: EXPIRED SESSION TOKENS
-- =====================================================
-- Deleta tokens de sessão expirados (default 7 dias+)
CREATE OR REPLACE PROCEDURE procedure_cleanup_expired_tokens(
  p_days_ago INTEGER DEFAULT 7,
  p_performed_by VARCHAR DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE,
  OUT v_count_deleted BIGINT
) AS $$
BEGIN
  -- Cleanup session tokens
  DECLARE
    v_session_count BIGINT := 0;
    v_reset_count BIGINT := 0;
  BEGIN
    v_session_count := delete_with_logging(
      'client_session_tokens',
      format('logout_at IS NULL AND expiry_date < NOW() - INTERVAL ''%s days''', p_days_ago),
      'cleanup_session_tokens',
      p_performed_by,
      p_dry_run
    );

    -- Cleanup password reset tokens (1 hour+)
    v_reset_count := delete_with_logging(
      'password_reset_tokens',
      format('used_at IS NULL AND expiry_date < NOW() - INTERVAL ''1 hour'''),
      'cleanup_password_reset_tokens',
      p_performed_by,
      p_dry_run
    );

    v_count_deleted := v_session_count + v_reset_count;

    RAISE NOTICE 'Deleted % expired session tokens and % password reset tokens',
      v_session_count, v_reset_count;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CLEANUP PROCEDURE: CACHE ENTRIES
-- =====================================================
-- Deleta cache entries stale (7d+ sem acesso) e explicitamente expirados
CREATE OR REPLACE PROCEDURE procedure_cleanup_cache_entries(
  p_stale_days INTEGER DEFAULT 7,
  p_performed_by VARCHAR DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE,
  OUT v_count_deleted BIGINT
) AS $$
BEGIN
  DECLARE
    v_stale_count BIGINT := 0;
    v_expired_count BIGINT := 0;
  BEGIN
    -- Cleanup stale cache entries (no explicit expiration, no access for X days)
    v_stale_count := delete_with_logging(
      'cache_entries',
      format('expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL ''%s days''', p_stale_days),
      'cleanup_stale_cache',
      p_performed_by,
      p_dry_run
    );

    -- Cleanup explicitly expired cache entries
    v_expired_count := delete_with_logging(
      'cache_entries',
      'expires_at IS NOT NULL AND expires_at < NOW()',
      'cleanup_expired_cache',
      p_performed_by,
      p_dry_run
    );

    v_count_deleted := v_stale_count + v_expired_count;

    RAISE NOTICE 'Deleted % stale cache entries and % expired cache entries',
      v_stale_count, v_expired_count;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. CLEANUP PROCEDURE: ALL TABLES (MASTER)
-- =====================================================
-- Executa todas as procedures de cleanup em uma transação
CREATE OR REPLACE PROCEDURE procedure_cleanup_all_tables(
  p_magic_links_hours INTEGER DEFAULT 24,
  p_verification_codes_hours INTEGER DEFAULT 1,
  p_notifications_days INTEGER DEFAULT 7,
  p_tokens_days INTEGER DEFAULT 7,
  p_cache_days INTEGER DEFAULT 7,
  p_performed_by VARCHAR DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE,
  OUT v_total_deleted BIGINT
) AS $$
DECLARE
  v_magic_links_count BIGINT;
  v_codes_count BIGINT;
  v_notifications_count BIGINT;
  v_activity_logs_count BIGINT;
  v_tokens_count BIGINT;
  v_cache_count BIGINT;
  v_job_id UUID;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
  v_duration_ms INTEGER;
BEGIN
  v_start_time := NOW();

  -- Log start of batch cleanup
  v_job_id := log_cleanup_operation(
    'cleanup_all_tables',
    'all',
    0,  -- Will be updated at end
    'in_progress',
    NULL,
    COALESCE(p_performed_by, 'system'),
    NULL
  );

  RAISE NOTICE 'Starting batch cleanup (dry_run=%) at %', p_dry_run, v_start_time;

  -- Cleanup magic links
  CALL procedure_cleanup_expired_magic_links(
    p_magic_links_hours,
    p_performed_by,
    p_dry_run,
    v_magic_links_count
  );

  -- Cleanup verification codes
  CALL procedure_cleanup_expired_codes(
    p_verification_codes_hours,
    p_performed_by,
    p_dry_run,
    v_codes_count
  );

  -- Cleanup old notifications
  CALL procedure_cleanup_old_notifications(
    p_notifications_days,
    p_performed_by,
    p_dry_run,
    v_notifications_count
  );

  -- Cleanup duplicate activity logs
  CALL procedure_cleanup_duplicate_activity_logs(
    1,  -- 1 minute gap
    p_performed_by,
    p_dry_run,
    v_activity_logs_count
  );

  -- Cleanup expired tokens
  CALL procedure_cleanup_expired_tokens(
    p_tokens_days,
    p_performed_by,
    p_dry_run,
    v_tokens_count
  );

  -- Cleanup cache entries
  CALL procedure_cleanup_cache_entries(
    p_cache_days,
    p_performed_by,
    p_dry_run,
    v_cache_count
  );

  -- Calculate total
  v_total_deleted := v_magic_links_count + v_codes_count + v_notifications_count +
                    v_activity_logs_count + v_tokens_count + v_cache_count;

  -- Update master log
  v_end_time := NOW();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INTEGER;

  UPDATE cleanup_runs_log
  SET
    status = 'completed',
    count_deleted = v_total_deleted,
    completed_at = NOW(),
    duration_ms = v_duration_ms
  WHERE id = v_job_id;

  RAISE NOTICE 'Batch cleanup completed. Total deleted: % in % ms',
    v_total_deleted, v_duration_ms;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNCTION: GET CLEANUP STATS
-- =====================================================
-- Retorna estatísticas de cleanup para uma tabela específica
CREATE OR REPLACE FUNCTION get_cleanup_stats(p_table_name VARCHAR)
RETURNS TABLE (
  table_name VARCHAR,
  pending_count BIGINT,
  avg_age INTERVAL,
  estimated_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.table_name,
    t.pending_count,
    t.avg_age,
    pg_total_relation_size(quote_ident(t.table_name))::NUMERIC / 1024 / 1024 as estimated_size_mb
  FROM (
    CASE
      WHEN p_table_name = 'magic_links' THEN
        SELECT
          'magic_links',
          COUNT(*) as pending_count,
          AVG(NOW() - expiry_date) as avg_age,
          NULL
        FROM magic_links
        WHERE used_at IS NULL AND expiry_date < NOW()
      WHEN p_table_name = 'verification_codes' THEN
        SELECT
          'verification_codes',
          COUNT(*) as pending_count,
          AVG(NOW() - expiry_date) as avg_age,
          NULL
        FROM verification_codes
        WHERE verified_at IS NULL AND expiry_date < NOW()
      WHEN p_table_name = 'notifications' THEN
        SELECT
          'notifications',
          COUNT(*) as pending_count,
          AVG(NOW() - read_at) as avg_age,
          NULL
        FROM notifications
        WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days'
      WHEN p_table_name = 'activity_logs' THEN
        SELECT
          'activity_logs',
          COUNT(*) as pending_count,
          INTERVAL '0' as avg_age,
          NULL
        FROM v_duplicate_activity_logs
      WHEN p_table_name = 'client_session_tokens' THEN
        SELECT
          'client_session_tokens',
          COUNT(*) as pending_count,
          AVG(NOW() - expiry_date) as avg_age,
          NULL
        FROM client_session_tokens
        WHERE logout_at IS NULL AND expiry_date < NOW()
      WHEN p_table_name = 'password_reset_tokens' THEN
        SELECT
          'password_reset_tokens',
          COUNT(*) as pending_count,
          AVG(NOW() - expiry_date) as avg_age,
          NULL
        FROM password_reset_tokens
        WHERE used_at IS NULL AND expiry_date < NOW()
      WHEN p_table_name = 'cache_entries' THEN
        SELECT
          'cache_entries',
          COUNT(*) as pending_count,
          AVG(NOW() - COALESCE(expires_at, last_accessed_at)) as avg_age,
          NULL
        FROM cache_entries
        WHERE (expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days')
           OR (expires_at IS NOT NULL AND expires_at < NOW())
      ELSE
        SELECT NULL, 0, INTERVAL '0', NULL
    END
  ) t(table_name, pending_count, avg_age, dummy);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. FUNCTION: GET ALL CLEANUP STATS
-- =====================================================
-- Retorna estatísticas de cleanup para todas as tabelas
CREATE OR REPLACE FUNCTION get_all_cleanup_stats()
RETURNS TABLE (
  table_name VARCHAR,
  pending_count BIGINT,
  avg_age_interval INTERVAL,
  avg_age_hours NUMERIC,
  table_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest(ARRAY['magic_links', 'verification_codes', 'notifications',
                  'activity_logs', 'client_session_tokens', 'password_reset_tokens', 'cache_entries']) as table_name,
    unnest(ARRAY[
      (SELECT COUNT(*) FROM magic_links WHERE used_at IS NULL AND expiry_date < NOW()),
      (SELECT COUNT(*) FROM verification_codes WHERE verified_at IS NULL AND expiry_date < NOW()),
      (SELECT COUNT(*) FROM notifications WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days'),
      (SELECT COUNT(*) FROM v_duplicate_activity_logs),
      (SELECT COUNT(*) FROM client_session_tokens WHERE logout_at IS NULL AND expiry_date < NOW()),
      (SELECT COUNT(*) FROM password_reset_tokens WHERE used_at IS NULL AND expiry_date < NOW()),
      (SELECT COUNT(*) FROM cache_entries WHERE (expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days') OR (expires_at IS NOT NULL AND expires_at < NOW()))
    ]) as pending_count,
    unnest(ARRAY[
      (SELECT AVG(NOW() - expiry_date) FROM magic_links WHERE used_at IS NULL AND expiry_date < NOW()),
      (SELECT AVG(NOW() - expiry_date) FROM verification_codes WHERE verified_at IS NULL AND expiry_date < NOW()),
      (SELECT AVG(NOW() - read_at) FROM notifications WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days'),
      INTERVAL '0',
      (SELECT AVG(NOW() - expiry_date) FROM client_session_tokens WHERE logout_at IS NULL AND expiry_date < NOW()),
      (SELECT AVG(NOW() - expiry_date) FROM password_reset_tokens WHERE used_at IS NULL AND expiry_date < NOW()),
      (SELECT AVG(NOW() - COALESCE(expires_at, last_accessed_at)) FROM cache_entries WHERE (expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days') OR (expires_at IS NOT NULL AND expires_at < NOW()))
    ]) as avg_age_interval,
    unnest(ARRAY[
      (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - expiry_date))/3600, 0) FROM magic_links WHERE used_at IS NULL AND expiry_date < NOW()),
      (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - expiry_date))/3600, 0) FROM verification_codes WHERE verified_at IS NULL AND expiry_date < NOW()),
      (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - read_at))/3600, 0) FROM notifications WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days'),
      0,
      (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - expiry_date))/3600, 0) FROM client_session_tokens WHERE logout_at IS NULL AND expiry_date < NOW()),
      (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - expiry_date))/3600, 0) FROM password_reset_tokens WHERE used_at IS NULL AND expiry_date < NOW()),
      (SELECT COALESCE(EXTRACT(EPOCH FROM AVG(NOW() - COALESCE(expires_at, last_accessed_at)))/3600, 0) FROM cache_entries WHERE (expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days') OR (expires_at IS NOT NULL AND expires_at < NOW()))
    ])::NUMERIC as avg_age_hours,
    unnest(ARRAY[
      (SELECT pg_total_relation_size('magic_links')::NUMERIC/1024/1024),
      (SELECT pg_total_relation_size('verification_codes')::NUMERIC/1024/1024),
      (SELECT pg_total_relation_size('notifications')::NUMERIC/1024/1024),
      (SELECT pg_total_relation_size('activity_logs')::NUMERIC/1024/1024),
      (SELECT pg_total_relation_size('client_session_tokens')::NUMERIC/1024/1024),
      (SELECT pg_total_relation_size('password_reset_tokens')::NUMERIC/1024/1024),
      (SELECT pg_total_relation_size('cache_entries')::NUMERIC/1024/1024)
    ]) as table_size_mb;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. SCHEDULED CLEANUP (pg_cron)
-- =====================================================
-- Note: pg_cron deve estar habilitado primeiro
-- Uncomment após habilitar pg_cron

/*
-- Schedule daily cleanup at 3 AM UTC
SELECT cron.schedule(
  'daily-cleanup-all',
  '0 3 * * *',
  $$CALL procedure_cleanup_all_tables();$$
);

-- Schedule cleanup every 6 hours (for high-traffic systems)
SELECT cron.schedule(
  'hourly-cleanup-codes',
  '0 */6 * * *',
  $$CALL procedure_cleanup_expired_codes();$$
);

-- Schedule stale cache cleanup every 4 hours
SELECT cron.schedule(
  'hourly-cleanup-cache',
  '0 */4 * * *',
  $$CALL procedure_cleanup_cache_entries();$$
);
*/

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
--
-- 1. Executar cleanup manual de uma tabela:
--    CALL procedure_cleanup_magic_links(24, 'admin@barber.com');
--
-- 2. ExecutarCleanup todas as tabelas:
--    CALL procedure_cleanup_all_tables(24, 1, 7, 7, 7, 'admin@barber.com');
--
-- 3. Executar em modo dry-run (sem deletar):
--    CALL procedure_cleanup_all_tables(24, 1, 7, 7, 7, NULL, TRUE);
--
-- 4. Obter estatísticas de cleanup:
--    SELECT * FROM get_all_cleanup_stats();
--
-- 5. Obter estatísticas de uma tabela específica:
--    SELECT * FROM get_cleanup_stats('magic_links');
--
-- 6. Ver histórico de cleanups:
--    SELECT * FROM cleanup_runs_log ORDER BY started_at DESC LIMIT 10;
--
-- 7. Ver resumo por tabela e data:
--    SELECT * FROM cleanup_history ORDER BY cleanup_date DESC, table_name;
--
-- 8. Configurar agendamento com pg_cron:
--    - Uncomment os SELECT cron.schedule() acima
--    - Ou use BullMQ para mais controle
--
-- =====================================================
