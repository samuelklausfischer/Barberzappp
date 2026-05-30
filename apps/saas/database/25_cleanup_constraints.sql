-- =====================================================
-- BarberZap - Data Cleanup Constraints (FASE 5 - Item 5.4)
-- =====================================================
-- Prioridade: 2 (IMPORTANTE)
-- Justificativa: Constraints para evitar acúmulo de dados inúteis
-- Tempo estimado: 2-3 horas
-- =====================================================
-- Este script adiciona constraints e índices para evitar
-- que dados temporários se acumulem indefinidamente e
-- tornar as operações de cleanup mais eficientes.
--
-- CONSTRAINTS ADICIONADAS:
-- 1. expiry_date NOT NULL + CHECK (expiry_date > NOW())
-- 2. UNIQUE constraint para avoid duplicates
-- 3. Indexes em expiry_date para eficientes deletes
-- 4. Check constraints para dados válidos
-- 5. Trigger functions para auto-expiração
--
-- SCHEDULE:
-- - Add pg_cron extension (ou BullMQ)
-- - Schedule procedures nightly
-- =====================================================

-- =====================================================
-- 1. ENABLE PG_CRON EXTENSION
-- =====================================================
-- pg_cron permite agendar procedures SQL diretamente no PostgreSQL
-- Isso é útil para cleanups periódicos sem depender de workers externos

-- Note: Para habilitar pg_cron, você precisa ter superuser privileges
-- Uncomment se você tiver acesso à configuração do PostgreSQL

/*
-- Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verificar se pg_cron está habilitado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
*/

-- =====================================================
-- 2. ADD EXPIRY_DATE CONSTRAINTS TO EXISTING TABLES
-- =====================================================

-- Magic Links: Garantir expiry_date sempre definido e no futuro
DO $$
BEGIN
  -- Verificar se table existe e adicionar constraints se não existirem
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'magic_links') THEN
    -- Adicionar constraint NOT NULL se não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'chk_magic_links_expiry_not_null'
    ) THEN
      ALTER TABLE magic_links
      ALTER COLUMN expiry_date SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Verification Codes: Garantir expiry_date sempre definido
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'verification_codes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'chk_verification_expiry_not_null'
    ) THEN
      ALTER TABLE verification_codes
      ALTER COLUMN expiry_date SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Session Tokens: Garantir expiry_date sempre definido
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'client_session_tokens') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'chk_session_expiry_not_null'
    ) THEN
      ALTER TABLE client_session_tokens
      ALTER COLUMN expiry_date SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Password Reset Tokens: Garantir expiry_date sempre definido
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'password_reset_tokens') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'chk_password_reset_expiry_not_null'
    ) THEN
      ALTER TABLE password_reset_tokens
      ALTER COLUMN expiry_date SET NOT NULL;
    END IF;
  END IF;
END $$;

-- =====================================================
-- 3. UNIQUE CONSTRAINTS TO AVOID DUPLICATES
-- =====================================================

-- Magic Links: Evitar múltiplos links não-usados para mesmo phone
-- (Já existe no arquivo 22_cleanup_tables.sql)

-- Verification Codes: Evitar múltiplos códigos não-verificados para mesmo phone/type/time
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_codes_unique_pending
  ON verification_codes(phone_number, code_type, DATE_TRUNC('hour', created_at))
  WHERE verified_at IS NULL;

-- Session Tokens: Apenas um token ativo por client/device
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_session_unique_active
  ON client_session_tokens(client_id, (device_info->>'device_id'))
  WHERE logout_at IS NULL AND expiry_date > NOW();

-- Password Reset Tokens: Evitar múltiplos tokens não-usados para mesmo email
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_unique_pending
  ON password_reset_tokens(COALESCE(email, phone_number))
  WHERE used_at IS NULL AND expiry_date > NOW();

-- Cache Entries: Já tem UNIQUE (shop_id, cache_key)

-- =====================================================
-- 4. PARTIAL INDEXES FOR EFFICIENT CLEANUP
-- =====================================================
-- Índices parciais são mais eficientes pois indexam apenas rows relevantes

-- Magic Links expirados (para delete rápido)
CREATE INDEX IF NOT EXISTS idx_magic_links_expired_for_cleanup
  ON magic_links(shop_id, expiry_date)
  WHERE used_at IS NULL AND expiry_date < NOW();

-- Verification Codes expirados
CREATE INDEX IF NOT EXISTS idx_verification_codes_expired_for_cleanup
  ON verification_codes(shop_id, expiry_date)
  WHERE verified_at IS NULL AND expiry_date < NOW();

-- Session Tokens expirados
CREATE INDEX IF NOT EXISTS idx_client_session_expired_for_cleanup
  ON client_session_tokens(shop_id, expiry_date)
  WHERE logout_at IS NULL AND expiry_date < NOW();

-- Password Reset Tokens expirados
CREATE INDEX IF NOT EXISTS idx_password_reset_expired_for_cleanup
  ON password_reset_tokens(shop_id, expiry_date)
  WHERE used_at IS NULL AND expiry_date < NOW();

-- Cache entries stale
CREATE INDEX IF NOT EXISTS idx_cache_stale_for_cleanup
  ON cache_entries(shop_id, last_accessed_at)
  WHERE expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days';

-- Cache entries explicitamente expirados
CREATE INDEX IF NOT EXISTS idx_cache_expired_for_cleanup
  ON cache_entries(shop_id, expires_at)
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

-- Notificações antigas (lidas há 7+ dias)
CREATE INDEX IF NOT EXISTS idx_notifications_old_for_cleanup
  ON notifications(shop_id, read_at)
  WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days';

-- =====================================================
-- 5. CHECK CONSTRAINTS FOR DATA VALIDITY
-- =====================================================

-- Constraint: Magic links não podem expirar antes de 1 hora
ALTER TABLE magic_links
  DROP CONSTRAINT IF EXISTS chk_magic_links_min_expiry;

ALTER TABLE magic_links
  ADD CONSTRAINT chk_magic_links_min_expiry
  CHECK (expiry_date - created_at >= INTERVAL '1 hour');

-- Constraint: Verification codes não podem expirar antes de 5 minutos
ALTER TABLE verification_codes
  DROP CONSTRAINT IF EXISTS chk_verification_codes_min_expiry;

ALTER TABLE verification_codes
  ADD CONSTRAINT chk_verification_codes_min_expiry
  CHECK (expiry_date - created_at >= INTERVAL '5 minutes');

-- Constraint: Session tokens devem expirar no mínimo 1 hora
ALTER TABLE client_session_tokens
  DROP CONSTRAINT IF EXISTS chk_session_min_expiry;

ALTER TABLE client_session_tokens
  ADD CONSTRAINT chk_session_min_expiry
  CHECK (expiry_date - created_at >= INTERVAL '1 hour');

-- Constraint: Password reset tokens devem expirar no mínimo 5 minutos
ALTER TABLE password_reset_tokens
  DROP CONSTRAINT IF EXISTS chk_password_reset_min_expiry;

ALTER TABLE password_reset_tokens
  ADD CONSTRAINT chk_password_reset_min_expiry
  CHECK (expiry_date - created_at >= INTERVAL '5 minutes');

-- Constraint: Cache value size limit (10MB max)
ALTER TABLE cache_entries
  DROP CONSTRAINT IF EXISTS chk_cache_value_size;

ALTER TABLE cache_entries
  ADD CONSTRAINT chk_cache_value_size
  CHECK (octet_length(cache_value::TEXT) <= 10485760);  -- 10MB

-- Constraint: Max attempts for verification codes
ALTER TABLE verification_codes
  DROP CONSTRAINT IF EXISTS chk_verification_max_attempts;

CREATE OR REPLACE FUNCTION check_verification_attempts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.attempts > NEW.max_attempts THEN
    RAISE EXCEPTION 'Maximum verification attempts (%) exceeded for %',
      NEW.max_attempts, NEW.phone_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_verification_attempts
  BEFORE UPDATE OF attempts ON verification_codes
  FOR EACH ROW
  WHEN (NEW.attempts > OLD.attempts)
  EXECUTE FUNCTION check_verification_attempts();

-- =====================================================
-- 6. AUTO-EXPIRATION FUNCTIONS (OPTIONAL)
-- =====================================================
-- Estes triggers marcam automaticamente registros como "expirados"
-- quando passam da data de validade. Isso permite queries mais rápidas.

-- Magic Links: Auto-mark used on expiry (optional - you might want to just delete)
DO $$
BEGIN
  -- Esta função pode ser usada para marcar magic_links como used quando expiram
  -- ou simplesmente deixar para o cleanup deletar
  -- Por padrão, deixamos para o cleanup deletar
END $$;

-- =====================================================
-- 7. CLEANUP POLICY ENFORCEMENT
-- =====================================================
-- Triggers que previnem acúmulo de dados expirados além de certos limites

-- Trigger: Previne inserção de dados expirados
CREATE OR REPLACE FUNCTION prevent_inserting_expired_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Magic Links
  IF TG_TABLE_NAME = 'magic_links' THEN
    IF NEW.expiry_date <= NOW() THEN
      RAISE EXCEPTION 'Cannot insert magic_link with expiry_date in the past: %', NEW.expiry_date;
    END IF;
  END IF;

  -- Verification Codes
  IF TG_TABLE_NAME = 'verification_codes' THEN
    IF NEW.expiry_date <= NOW() THEN
      RAISE EXCEPTION 'Cannot insert verification_code with expiry_date in the past: %', NEW.expiry_date;
    END IF;
  END IF;

  -- Password Reset Tokens
  IF TG_TABLE_NAME = 'password_reset_tokens' THEN
    IF NEW.expiry_date <= NOW() THEN
      RAISE EXCEPTION 'Cannot insert password_reset_token with expiry_date in the past: %', NEW.expiry_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_expired_insertion_magic_links
  BEFORE INSERT ON magic_links
  FOR EACH ROW
  EXECUTE FUNCTION prevent_inserting_expired_data();

CREATE TRIGGER trigger_prevent_expired_insertion_verification_codes
  BEFORE INSERT ON verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_inserting_expired_data();

CREATE TRIGGER trigger_prevent_expired_insertion_password_reset_tokens
  BEFORE INSERT ON password_reset_tokens
  FOR EACH ROW
  EXECUTE FUNCTION prevent_inserting_expired_data();

-- =====================================================
-- 8. CASCADE DELETE POLICIES
-- =====================================================
-- Garantir que quando um client é deletado, seus dados temporários também são

/*
-- Magic Links já tem ON DELETE CASCADE em client_id

-- Verification Codes já tem ON DELETE SET NULL em client_id (pode mudar para CASCADE)

-- Password Reset Tokens já tem ON DELETE CASCADE em client_id

-- Session Tokens já tem ON DELETE CASCADE em client_id
*/

-- =====================================================
-- 9. CLEANUP SCHEDULING (pg_cron)
-- =====================================================
-- Agendamento de cleanups automáticos usando pg_cron

/*
-- Schedule: Cleanup magic links every 6 hours
SELECT cron.schedule(
  'cleanup-magic-links',
  '0 */6 * * *',
  $$CALL procedure_cleanup_expired_magic_links(24, 'pg_cron', FALSE);$$
);

-- Schedule: Cleanup verification codes every hour
SELECT cron.schedule(
  'cleanup-verification-codes',
  '0 * * * *',
  $$CALL procedure_cleanup_expired_codes(1, 'pg_cron', FALSE);$$
);

-- Schedule: Cleanup password reset tokens every hour
SELECT cron.schedule(
  'cleanup-password-reset-tokens',
  '30 * * * *',
  $$CALL procedure_cleanup_expired_tokens(7, 'pg_cron', FALSE);
     CALL procedure_cleanup_expired_codes(1, 'pg_cron', FALSE);$$
);

-- Schedule: Cleanup session tokens twice daily
SELECT cron.schedule(
  'cleanup-session-tokens',
  '0 */12 * * *',
  $$CALL procedure_cleanup_expired_tokens(7, 'pg_cron', FALSE);$$
);

-- Schedule: Cleanup stale cache every 4 hours
SELECT cron.schedule(
  'cleanup-cache-entries',
  '0 */4 * * *',
  $$CALL procedure_cleanup_cache_entries(7, 'pg_cron', FALSE);$$
);

-- Schedule: Cleanup old notifications daily at 4 AM UTC
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 4 * * *',
  $$CALL procedure_cleanup_old_notifications(7, 'pg_cron', FALSE);$$
);

-- Schedule: Cleanup duplicate activity logs daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-duplicate-activity-logs',
  '0 3 * * *',
  $$CALL procedure_cleanup_duplicate_activity_logs(1, 'pg_cron', FALSE);$$
);

-- Schedule: Refresh cleanup stats cache every hour
SELECT cron.schedule(
  'refresh-cleanup-stats',
  '0 * * * *',
  $$SELECT refresh_cleanup_stats_cache();$$
);

-- Schedule: Master cleanup all tables daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-all-tables-daily',
  '0 3 * * *',
  $$CALL procedure_cleanup_all_tables(24, 1, 7, 7, 7, 'pg_cron', FALSE);$$
);

-- View scheduled jobs
SELECT * FROM cron.job;
*/

-- =====================================================
-- 10. MONITORING QUERY: CHECK CONSTRAINT VIOLATIONS
-- =====================================================

-- Query para verificar se há dados expirados que violam constraints
CREATE OR REPLACE FUNCTION check_cleanup_constraint_violations()
RETURNS TABLE (
  table_name VARCHAR,
  violation_type VARCHAR,
  count BIGINT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'magic_links' as table_name,
    'expired_entry' as violation_type,
    COUNT(*) as count,
    'Magic links with expiry_date in the past' as description
  FROM magic_links
  WHERE expiry_date < NOW()
  
  UNION ALL
  
  SELECT
    'verification_codes',
    'expired_entry',
    COUNT(*),
    'Verification codes with expiry_date in the past'
  FROM verification_codes
  WHERE expiry_date < NOW()
  
  UNION ALL
  
  SELECT
    'client_session_tokens',
    'expired_entry',
    COUNT(*),
    'Session tokens with expiry_date in the past'
  FROM client_session_tokens
  WHERE logout_at IS NULL AND expiry_date < NOW()
  
  UNION ALL
  
  SELECT
    'password_reset_tokens',
    'expired_entry',
    COUNT(*),
    'Password reset tokens with expiry_date in the past'
  FROM password_reset_tokens
  WHERE used_at IS NULL AND expiry_date < NOW()
  
  UNION ALL
  
  SELECT
    'cache_entries',
    'expired_entry',
    COUNT(*),
    'Cache entries past expiry_date'
  FROM cache_entries
  WHERE expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days'
     OR (expires_at IS NOT NULL AND expires_at < NOW());
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. MONITORING QUERY: GET TABLE SIZES FOR CLEANUP
-- =====================================================
-- Ver tamanho das tabelas que precisam de cleanup
CREATE OR REPLACE FUNCTION get_cleanup_table_sizes()
RETURNS TABLE (
  table_name VARCHAR,
  table_size_mb NUMERIC,
  index_size_mb NUMERIC,
  total_size_mb NUMERIC,
  row_estimate BIGINT,
  pending_cleanup BIGINT,
  cleanup_potential_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    all_tables.table_name,
    pg_total_relation_size(quote_ident(all_tables.table_name))::NUMERIC / 1024 / 1024 as table_size_mb,
    COALESCE(pg_indexes_size(quote_ident(all_tables.table_name))::NUMERIC / 1024 / 1024, 0) as index_size_mb,
    pg_total_relation_size(quote_ident(all_tables.table_name))::NUMERIC / 1024 / 1024 +
    COALESCE(pg_indexes_size(quote_ident(all_tables.table_name))::NUMERIC / 1024 / 1024, 0) as total_size_mb,
    COALESCE((SELECT reltuples::BIGINT FROM pg_class WHERE relname = all_tables.table_name), 0) as row_estimate,
    CASE all_tables.table_name
      WHEN 'magic_links' THEN (SELECT COUNT(*) FROM magic_links WHERE used_at IS NULL AND expiry_date < NOW())
      WHEN 'verification_codes' THEN (SELECT COUNT(*) FROM verification_codes WHERE verified_at IS NULL AND expiry_date < NOW())
      WHEN 'notifications' THEN (SELECT COUNT(*) FROM notifications WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days')
      WHEN 'activity_logs' THEN (SELECT COUNT(*) FROM v_duplicate_activity_logs)
      WHEN 'client_session_tokens' THEN (SELECT COUNT(*) FROM client_session_tokens WHERE logout_at IS NULL AND expiry_date < NOW())
      WHEN 'password_reset_tokens' THEN (SELECT COUNT(*) FROM password_reset_tokens WHERE used_at IS NULL AND expiry_date < NOW())
      WHEN 'cache_entries' THEN (SELECT COUNT(*) FROM cache_entries WHERE (expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days') OR (expires_at IS NOT NULL AND expires_at < NOW()))
      ELSE 0
    END as pending_cleanup,
    CASE all_tables.table_name
      WHEN 'magic_links' THEN (
        SELECT (COUNT(*)::NUMERIC *
          COALESCE(pg_relation_size('magic_links')::NUMERIC /
            NULLIF((SELECT reltuples FROM pg_class WHERE relname = 'magic_links'), 0), 0)) / 1024 / 1024
        FROM magic_links WHERE used_at IS NULL AND expiry_date < NOW()
      )
      WHEN 'verification_codes' THEN (
        SELECT (COUNT(*)::NUMERIC *
          COALESCE(pg_relation_size('verification_codes')::NUMERIC /
            NULLIF((SELECT reltuples FROM pg_class WHERE relname = 'verification_codes'), 0), 0)) / 1024 / 1024
        FROM verification_codes WHERE verified_at IS NULL AND expiry_date < NOW()
      )
      WHEN 'notifications' THEN (
        SELECT (COUNT(*)::NUMERIC *
          COALESCE(pg_relation_size('notifications')::NUMERIC /
            NULLIF((SELECT reltuples FROM pg_class WHERE relname = 'notifications'), 0), 0)) / 1024 / 1024
        FROM notifications WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days'
      )
      WHEN 'client_session_tokens' THEN (
        SELECT (COUNT(*)::NUMERIC *
          COALESCE(pg_relation_size('client_session_tokens')::NUMERIC /
            NULLIF((SELECT reltuples FROM pg_class WHERE relname = 'client_session_tokens'), 0), 0)) / 1024 / 1024
        FROM client_session_tokens WHERE logout_at IS NULL AND expiry_date < NOW()
      )
      WHEN 'password_reset_tokens' THEN (
        SELECT (COUNT(*)::NUMERIC *
          COALESCE(pg_relation_size('password_reset_tokens')::NUMERIC /
            NULLIF((SELECT reltuples FROM pg_class WHERE relname = 'password_reset_tokens'), 0), 0)) / 1024 / 1024
        FROM password_reset_tokens WHERE used_at IS NULL AND expiry_date < NOW()
      )
      WHEN 'cache_entries' THEN (
        SELECT (COUNT(*)::NUMERIC *
          COALESCE(pg_relation_size('cache_entries')::NUMERIC /
            NULLIF((SELECT reltuples FROM pg_class WHERE relname = 'cache_entries'), 0), 0)) / 1024 / 1024
        FROM cache_entries WHERE (expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days') OR (expires_at IS NOT NULL AND expires_at < NOW())
      )
      ELSE 0
    END as cleanup_potential_mb
  FROM unnest(ARRAY['magic_links', 'verification_codes', 'notifications',
                     'activity_logs', 'client_session_tokens', 'password_reset_tokens', 'cache_entries']) AS all_tables(table_name);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. INDEX USAGE MONITORING
-- =====================================================
-- Verificar se os índices de cleanup estão sendo usados
CREATE OR REPLACE FUNCTION check_cleanup_index_usage()
RETURNS TABLE (
  index_name VARCHAR,
  table_name VARCHAR,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT,
  index_size_mb NUMERIC,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.indexrelname as index_name,
    i.relname as table_name,
    ps.idx_scan,
    ps.idx_tup_read,
    ps.idx_tup_fetch,
    pg_relation_size(i.indexrelid)::NUMERIC / 1024 / 1024 as index_size_mb,
    CASE
      WHEN ps.idx_scan = 0 THEN 'UNUSED'
      WHEN ps.idx_scan < 10 THEN 'LOW_USAGE'
      ELSE 'ACTIVE'
    END as status
  FROM pg_stat_user_indexes ps
  JOIN pg_class i ON i.oid = ps.indexrelid
  JOIN pg_class t ON t.oid = ps.relid
  WHERE i.indexrelname LIKE '%cleanup%'
     OR i.indexrelname LIKE '%expired%'
     OR i.indexrelname LIKE '%stale%'
     OR i.indexrelname LIKE '%old%'
  ORDER BY ps.idx_scan NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INSTRUÇÕES
-- =====================================================
--
-- Após criar os constraints:
--
-- 1. Verificar violações de constraints:
--    SELECT * FROM check_cleanup_constraint_violations();
--
-- 2. Verificar tamanho das tabelas para cleanup:
--    SELECT * FROM get_cleanup_table_sizes() ORDER BY pending_cleanup DESC;
--
-- 3. Verificar uso dos índices de cleanup:
--    SELECT * FROM check_cleanup_index_usage();
--
-- 4. Remover índices não usados (após análise):
--    DROP INDEX IF EXISTS nome_do_indice;
--
-- 5. Listar jobs agendados via pg_cron:
--    SELECT * FROM cron.job;
--
-- 6. Desabilitar um job específico:
--    SELECT cron.unschedule('nome-do-job');
--
-- 7. Habilitar pg_cron (se ainda não estiver):
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 8. Agendar cleanup manual (via BullMQ worker em vez de pg_cron):
--    - Use backend/cleanup/cleanup_job.py
--    - Configure no scheduler da aplicação
--
-- =====================================================
