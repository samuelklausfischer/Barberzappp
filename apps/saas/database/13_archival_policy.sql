-- =====================================================
-- BarberZap - Archival Policy & Procedures (FASE X - Item 2)
-- =====================================================
-- Prioridade: 2 (MUITO IMPORTANTE)
-- Justificativa: Define critérios e processos de arquivamento
-- Tempo estimado: 4-5 horas
-- =====================================================
-- Este script cria as stored procedures e funções para
-- automatizar o processo de arquivamento de dados.
-- =====================================================

-- =====================================================
-- ARCHIVAL STATISTICS VIEW (para monitoramento)
-- =====================================================

CREATE OR REPLACE VIEW archival_statistics AS
SELECT
  'clients' as table_name,
  COUNT(*) as total_archived,
  MIN(archived_at) as first_archived,
  MAX(archived_at) as last_archived,
  COUNT(DISTINCT shop_id) as shops_affected,
  AVG(total_spent) as avg_total_spent,
  SUM(total_spent) as total_spent_all
FROM clients_archived
UNION ALL
SELECT
  'appointments' as table_name,
  COUNT(*) as total_archived,
  MIN(archived_at) as first_archived,
  MAX(archived_at) as last_archived,
  COUNT(DISTINCT shop_id) as shops_affected,
  AVG(price) as avg_price,
  SUM(price) as total_revenue_all
FROM appointments_archived
UNION ALL
SELECT
  'messages' as table_name,
  COUNT(*) as total_archived,
  MIN(archived_at) as first_archived,
  MAX(archived_at) as last_archived,
  COUNT(DISTINCT shop_id) as shops_affected,
  NULL::DECIMAL as avg_price,
  NULL as total_revenue_all
FROM messages_archived
UNION ALL
SELECT
  'activity_logs' as table_name,
  COUNT(*) as total_archived,
  MIN(archived_at) as first_archived,
  MAX(archived_at) as last_archived,
  COUNT(DISTINCT shop_id) as shops_affected,
  NULL::DECIMAL as avg_price,
  NULL as total_revenue_all
FROM activity_logs_archived;


-- =====================================================
-- TABLE SIZE MONITORING
-- =====================================================

CREATE OR REPLACE FUNCTION get_table_size_stats()
RETURNS TABLE(
  table_name TEXT,
  total_rows BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename as table_name,
    n_live_tup as total_rows,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
  FROM pg_stat_user_tables
  WHERE tablename IN (
    'clients', 'clients_archived',
    'appointments', 'appointments_archived',
    'messages', 'messages_archived',
    'audit_logs', 'webhook_logs', 'activity_logs_archived'
  )
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 1. ARCHIVE CLIENTS PROCEDURE
-- =====================================================
-- Critério: Clientes sem agendamento há 24+ meses
-- Deleta da tabela principal e insere na arquivada
-- =====================================================

CREATE OR REPLACE FUNCTION procedure_archive_clients(
  p_older_than_months INTEGER DEFAULT 24,
  p_shop_id UUID DEFAULT NULL,
  p_batch_size INTEGER DEFAULT 1000,
  p_dry_run BOOLEAN DEFAULT FALSE DEFAULT 'auto',
  p_performed_by TEXT DEFAULT 'system'
)
RETURNS JSONB AS $$
DECLARE
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
  v_total_to_archive BIGINT;
  v_total_archived BIGINT;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
  v_total_spent DECIMAL(10,2);
  v_total_visits INTEGER;
  v_error_message TEXT;
BEGIN
  v_start_time := NOW();
  v_cutoff_date := NOW() - (p_older_than_months || ' months')::INTERVAL;
  v_total_archived := 0;
  v_total_spent := 0;
  v_total_visits := 0;

  -- Contar total elegível
  SELECT COUNT(*), COALESCE(SUM(total_spent), 0), COALESCE(SUM(total_visits), 0)
  INTO v_total_to_archive, v_total_spent, v_total_visits
  FROM clients c
  WHERE
    (p_shop_id IS NULL OR c.shop_id = p_shop_id)
    AND c.deleted_at IS NULL
    AND (
      c.last_visit_at IS NULL
      OR c.last_visit_at < v_cutoff_date
    )
    AND NOT EXISTS (
      SELECT 1
      FROM appointments a
      WHERE a.client_id = c.id
      AND a.scheduled_at >= v_cutoff_date
      AND a.status NOT IN ('cancelled', 'no_show')
    );

  -- Se dry run ou sem registros, retornar stats
  IF p_dry_run OR v_total_to_archive = 0 THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'dry_run', p_dry_run,
      'total_to_archive', v_total_to_archive,
      'total_archived', 0,
      'total_spent_preserved', v_total_spent,
      'total_visits_preserved', v_total_visits,
      'cutoff_date', v_cutoff_date,
      'message', 'Dry run completed - no changes made'
    );
  END IF;

  -- Processar em batches
  WHILE EXISTS (
    SELECT 1
    FROM clients c
    WHERE
      (p_shop_id IS NULL OR c.shop_id = p_shop_id)
      AND c.deleted_at IS NULL
      AND (
        c.last_visit_at IS NULL
        OR c.last_visit_at < v_cutoff_date
      )
      AND NOT EXISTS (
        SELECT 1
        FROM appointments a
        WHERE a.client_id = c.id
        AND a.scheduled_at >= v_cutoff_date
        AND a.status NOT IN ('cancelled', 'no_show')
      )
    LIMIT 1
  ) LOOP
    BEGIN
      -- Mover dados para tabela arquivada (com CTE ATOMIC)
      WITH archived AS (
        DELETE FROM clients c
        WHERE c.id IN (
          SELECT c.id
          FROM clients c
          WHERE
            (p_shop_id IS NULL OR c.shop_id = p_shop_id)
            AND c.deleted_at IS NULL
            AND (
              c.last_visit_at IS NULL
              OR c.last_visit_at < v_cutoff_date
            )
            AND NOT EXISTS (
              SELECT 1
              FROM appointments a
              WHERE a.client_id = c.id
              AND a.scheduled_at >= v_cutoff_date
              AND a.status NOT IN ('cancelled', 'no_show')
            )
          ORDER BY c.last_visit_at NULLS FIRST
          LIMIT p_batch_size
          FOR UPDATE SKIP LOCKED
        )
        RETURNING
          c.id, c.shop_id, c.name, c.phone_number, c.email, c.instagram,
          c.created_at, c.updated_at, c.deleted_at, c.tags, c.notes, c.version,
          c.total_visits, c.last_visit_at, c.total_spent, c.no_show_count,
          c.cancelled_count, c.loyalty_points
      )
      INSERT INTO clients_archived (
        id, shop_id, name, phone_number, email, instagram,
        created_at, updated_at, deleted_at, tags, notes, version,
        total_visits, last_visit_at, total_spent, no_show_count,
        cancelled_count, loyalty_points, archived_from, archive_reason
      )
      SELECT
        a.id, a.shop_id, a.name, a.phone_number, a.email, a.instagram,
        a.created_at, a.updated_at, a.deleted_at, a.tags, a.notes, a.version,
        a.total_visits, a.last_visit_at, a.total_spent, a.no_show_count,
        a.cancelled_count, a.loyalty_points, p_performed_by, 'inactive_' || p_older_than_months || 'm'
      FROM archived a;

      GET DIAGNOSTICS v_total_archived = ROW_COUNT;

      -- Commit a cada batch para evitar long transactions
      COMMIT;
      -- Mas precisamos de BEGIN antes de voltar ao loop
      BEGIN;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_message := SQLERRM;
        ROLLBACK;
        RAISE WARNING 'Error archiving clients batch: %', v_error_message;
        -- Continuar para o próximo batch
    END;
  END LOOP;

  v_end_time := NOW();

  -- Registrar operação na tabela de audit
  INSERT INTO archival_operations_log (
    operation_type, table_name, criteria, records_affected,
    started_at, completed_at, performed_by, status,
    metadata
  )
  VALUES (
    'archive', 'clients',
    jsonb_build_object('older_than_months', p_older_than_months, 'shop_id', p_shop_id),
    v_total_archived,
    v_start_time, v_end_time, p_performed_by, 'completed',
    jsonb_build_object(
      'total_spent_preserved', v_total_spent,
      'total_visits_preserved', v_total_visits,
      'batch_size', p_batch_size
    )
  );

  -- Atualizar statistics
  ANALYZE clients;
  ANALYZE clients_archived;

  RETURN jsonb_build_object(
    'success', TRUE,
    'dry_run', FALSE,
    'total_to_archive', v_total_to_archive,
    'total_archived', v_total_archived,
    'total_spent_preserved', v_total_spent,
    'total_visits_preserved', v_total_visits,
    'cutoff_date', v_cutoff_date,
    'duration_seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time)),
    'message', 'Clients archived successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 2. ARCHIVE APPOINTMENTS PROCEDURE
-- =====================================================
-- Critério: Agendamentos completados/cancelados há 12+ meses
-- =====================================================

CREATE OR REPLACE FUNCTION procedure_archive_appointments(
  p_older_than_months INTEGER DEFAULT 12,
  p_shop_id UUID DEFAULT NULL,
  p_batch_size INTEGER DEFAULT 1000,
  p_dry_run BOOLEAN DEFAULT FALSE,
  p_performed_by TEXT DEFAULT 'system'
)
RETURNS JSONB AS $$
DECLARE
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
  v_total_to_archive BIGINT;
  v_total_archived BIGINT;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
  v_revenue_preserved DECIMAL(10,2);
  v_error_message TEXT;
BEGIN
  v_start_time := NOW();
  v_cutoff_date := NOW() - (p_older_than_months || ' months')::INTERVAL;
  v_total_archived := 0;
  v_revenue_preserved := 0;

  -- Contar total elegível
  SELECT COUNT(*), COALESCE(SUM(price), 0)
  INTO v_total_to_archive, v_revenue_preserved
  FROM appointments a
  WHERE
    (p_shop_id IS NULL OR a.shop_id = p_shop_id)
    AND a.scheduled_at < v_cutoff_date
    AND a.status IN ('completed', 'cancelled', 'no_show');

  -- Se dry run ou sem registros, retornar stats
  IF p_dry_run OR v_total_to_archive = 0 THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'dry_run', p_dry_run,
      'total_to_archive', v_total_to_archive,
      'total_archived', 0,
      'revenue_preserved', v_revenue_preserved,
      'cutoff_date', v_cutoff_date,
      'message', 'Dry run completed - no changes made'
    );
  END IF;

  -- Processar em batches
  WHILE EXISTS (
    SELECT 1
    FROM appointments a
    WHERE
      (p_shop_id IS NULL OR a.shop_id = p_shop_id)
      AND a.scheduled_at < v_cutoff_date
      AND a.status IN ('completed', 'cancelled', 'no_show')
    LIMIT 1
  ) LOOP
    BEGIN
      -- Mover dados com denormalização para busca rápida
      WITH archived AS (
        DELETE FROM appointments a
        WHERE a.id IN (
          SELECT a.id
          FROM appointments a
          WHERE
            (p_shop_id IS NULL OR a.shop_id = p_shop_id)
            AND a.scheduled_at < v_cutoff_date
            AND a.status IN ('completed', 'cancelled', 'no_show')
          ORDER BY a.scheduled_at
          LIMIT p_batch_size
          FOR UPDATE SKIP LOCKED
        )
        RETURNING a.*
      )
      INSERT INTO appointments_archived (
        id, shop_id, client_id, employee_id, service_id,
        scheduled_at, duration_minutes, price, status, notes,
        created_at, updated_at, version,
        whatsapp_sent, whatsapp_sent_at,
        reminder_24h_sent, reminder_24h_at,
        reminder_2h_sent, reminder_2h_at,
        client_name, employee_name, service_name,
        archived_from, archive_reason
      )
      SELECT
        a.id, a.shop_id, a.client_id, a.employee_id, a.service_id,
        a.scheduled_at, a.duration_minutes, a.price, a.status, a.notes,
        a.created_at, a.updated_at, a.version,
        a.whatsapp_sent, a.whatsapp_sent_at,
        a.reminder_24h_sent, a.reminder_24h_at,
        a.reminder_2h_sent, a.reminder_2h_at,
        c.name, e.name, s.name,
        p_performed_by, 'completed_cancelled_' || p_older_than_months || 'm'
      FROM archived a
      LEFT JOIN clients c ON c.id = a.client_id
      LEFT JOIN employees e ON e.id = a.employee_id
      LEFT JOIN services s ON s.id = a.service_id;

      GET DIAGNOSTICS v_total_archived = ROW_COUNT;

      COMMIT;
      BEGIN;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_message := SQLERRM;
        ROLLBACK;
        RAISE WARNING 'Error archiving appointments batch: %', v_error_message;
    END;
  END LOOP;

  v_end_time := NOW();

  -- Registrar operação
  INSERT INTO archival_operations_log (
    operation_type, table_name, criteria, records_affected,
    started_at, completed_at, performed_by, status,
    metadata
  )
  VALUES (
    'archive', 'appointments',
    jsonb_build_object('older_than_months', p_older_than_months, 'shop_id', p_shop_id),
    v_total_archived,
    v_start_time, v_end_time, p_performed_by, 'completed',
    jsonb_build_object(
      'revenue_preserved', v_revenue_preserved,
      'batch_size', p_batch_size
    )
  );

  -- Atualizar statistics
  ANALYZE appointments;
  ANALYZE appointments_archived;

  RETURN jsonb_build_object(
    'success', TRUE,
    'dry_run', FALSE,
    'total_to_archive', v_total_to_archive,
    'total_archived', v_total_archived,
    'revenue_preserved', v_revenue_preserved,
    'cutoff_date', v_cutoff_date,
    'duration_seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time)),
    'message', 'Appointments archived successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 3. ARCHIVE MESSAGES PROCEDURE
-- =====================================================
-- Critério: Mensagens com mais de 18+ meses
-- =====================================================

CREATE OR REPLACE FUNCTION procedure_archive_messages(
  p_older_than_months INTEGER DEFAULT 18,
  p_shop_id UUID DEFAULT NULL,
  p_batch_size INTEGER DEFAULT 1000,
  p_dry_run BOOLEAN DEFAULT FALSE,
  p_performed_by TEXT DEFAULT 'system'
)
RETURNS JSONB AS $$
DECLARE
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
  v_total_to_archive BIGINT;
  v_total_archived BIGINT;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
  v_error_message TEXT;
BEGIN
  v_start_time := NOW();
  v_cutoff_date := NOW() - (p_older_than_months || ' months')::INTERVAL;
  v_total_archived := 0;

  -- Contar total elegível
  SELECT COUNT(*)
  INTO v_total_to_archive
  FROM messages m
  WHERE
    (p_shop_id IS NULL OR m.shop_id = p_shop_id)
    AND m.created_at < v_cutoff_date;

  IF p_dry_run OR v_total_to_archive = 0 THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'dry_run', p_dry_run,
      'total_to_archive', v_total_to_archive,
      'total_archived', 0,
      'cutoff_date', v_cutoff_date,
      'message', 'Dry run completed - no changes made'
    );
  END IF;

  -- Processar em batches
  WHILE EXISTS (
    SELECT 1
    FROM messages m
    WHERE
      (p_shop_id IS NULL OR m.shop_id = p_shop_id)
      AND m.created_at < v_cutoff_date
    LIMIT 1
  ) LOOP
    BEGIN
      WITH archived AS (
        DELETE FROM messages m
        WHERE m.id IN (
          SELECT m.id
          FROM messages m
          WHERE
            (p_shop_id IS NULL OR m.shop_id = p_shop_id)
            AND m.created_at < v_cutoff_date
          ORDER BY m.created_at
          LIMIT p_batch_size
          FOR UPDATE SKIP LOCKED
        )
        RETURNING m.*
      )
      INSERT INTO messages_archived (
        id, shop_id, client_id, sender_id,
        message_type, direction, content, status,
        created_at, external_id, metadata,
        archived_from, archive_reason
      )
      SELECT
        a.id, a.shop_id, a.client_id, a.sender_id,
        a.message_type, a.direction, a.content, a.status,
        a.created_at, a.external_id, a.metadata,
        p_performed_by, 'older_than_' || p_older_than_months || 'm'
      FROM archived a;

      GET DIAGNOSTICS v_total_archived = ROW_COUNT;
      COMMIT;
      BEGIN;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_message := SQLERRM;
        ROLLBACK;
        RAISE WARNING 'Error archiving messages batch: %', v_error_message;
    END;
  END LOOP;

  v_end_time := NOW();

  INSERT INTO archival_operations_log (
    operation_type, table_name, criteria, records_affected,
    started_at, completed_at, performed_by, status,
    metadata
  )
  VALUES (
    'archive', 'messages',
    jsonb_build_object('older_than_months', p_older_than_months, 'shop_id', p_shop_id),
    v_total_archived,
    v_start_time, v_end_time, p_performed_by, 'completed',
    jsonb_build_object('batch_size', p_batch_size)
  );

  ANALYZE messages;
  ANALYZE messages_archived;

  RETURN jsonb_build_object(
    'success', TRUE,
    'dry_run', FALSE,
    'total_to_archive', v_total_to_archive,
    'total_archived', v_total_archived,
    'cutoff_date', v_cutoff_date,
    'duration_seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time)),
    'message', 'Messages archived successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 4. ARCHIVE ACTIVITY LOGS PROCEDURE
-- =====================================================
-- Critério: Logs de atividade com mais de 6+ meses
-- Consolidando audit_logs e webhook_logs
-- =====================================================

CREATE OR REPLACE FUNCTION procedure_archive_activity_logs(
  p_older_than_months INTEGER DEFAULT 6,
  p_shop_id UUID DEFAULT NULL,
  p_batch_size INTEGER DEFAULT 5000,
  p_dry_run BOOLEAN DEFAULT FALSE,
  p_performed_by TEXT DEFAULT 'system'
)
RETURNS JSONB AS $$
DECLARE
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
  v_audit_count BIGINT;
  v_webhook_count BIGINT;
  v_total_archived BIGINT;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
  v_error_message TEXT;
BEGIN
  v_start_time := NOW();
  v_cutoff_date := NOW() - (p_older_than_months || ' months')::INTERVAL;
  v_total_archived := 0;

  -- Contar audit_logs elegíveis
  SELECT COUNT(*)
  INTO v_audit_count
  FROM audit_logs a
  WHERE
    (p_shop_id IS NULL OR a.shop_id = p_shop_id)
    AND a.changed_at < v_cutoff_date;

  -- Contar webhook_logs elegíveis
  SELECT COUNT(*)
  INTO v_webhook_count
  FROM webhook_logs w
  WHERE
    (p_shop_id IS NULL OR w.shop_id = p_shop_id)
    AND w.created_at < v_cutoff_date;

  IF p_dry_run OR (v_audit_count = 0 AND v_webhook_count = 0) THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'dry_run', p_dry_run,
      'audit_logs_to_archive', v_audit_count,
      'webhook_logs_to_archive', v_webhook_count,
      'total_archived', 0,
      'cutoff_date', v_cutoff_date,
      'message', 'Dry run completed - no changes made'
    );
  END IF;

  -- Archivar audit_logs
  WHILE EXISTS (
    SELECT 1
    FROM audit_logs a
    WHERE
      (p_shop_id IS NULL OR a.shop_id = p_shop_id)
      AND a.changed_at < v_cutoff_date
    LIMIT 1
  ) LOOP
    BEGIN
      WITH archived AS (
        DELETE FROM audit_logs a
        WHERE a.id IN (
          SELECT a.id
          FROM audit_logs a
          WHERE
            (p_shop_id IS NULL OR a.shop_id = p_shop_id)
            AND a.changed_at < v_cutoff_date
          ORDER BY a.changed_at
          LIMIT p_batch_size
          FOR UPDATE SKIP LOCKED
        )
        RETURNING a.*
      )
      INSERT INTO activity_logs_archived (
        id, shop_id, log_type, table_name, record_id,
        action, old_data, new_data, changed_by,
        created_at, archived_from, archive_reason
      )
      SELECT
        a.id, a.shop_id, 'audit'::VARCHAR, a.table_name, a.record_id,
        a.action, a.old_data, a.new_data, a.changed_by,
        a.changed_at, p_performed_by, 'older_than_' || p_older_than_months || 'm'
      FROM archived a;

      GET DIAGNOSTICS v_total_archived = ROW_COUNT;
      COMMIT;
      BEGIN;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_message := SQLERRM;
        ROLLBACK;
        RAISE WARNING 'Error archiving audit_logs batch: %', v_error_message;
    END;
  END LOOP;

  -- Archivar webhook_logs
  WHILE EXISTS (
    SELECT 1
    FROM webhook_logs w
    WHERE
      (p_shop_id IS NULL OR w.shop_id = p_shop_id)
      AND w.created_at < v_cutoff_date
    LIMIT 1
  ) LOOP
    BEGIN
      WITH archived AS (
        DELETE FROM webhook_logs w
        WHERE w.id IN (
          SELECT w.id
          FROM webhook_logs w
          WHERE
            (p_shop_id IS NULL OR w.shop_id = p_shop_id)
            AND w.created_at < v_cutoff_date
          ORDER BY w.created_at
          LIMIT p_batch_size
          FOR UPDATE SKIP LOCKED
        )
        RETURNING w.*
      )
      INSERT INTO activity_logs_archived (
        id, shop_id, log_type, source, event_type,
        payload, status_code, response, error_message,
        created_at, duration_ms, archived_from, archive_reason
      )
      SELECT
        w.id, w.shop_id, 'webhook'::VARCHAR, w.source, w.event_type,
        w.payload::JSONB, w.status_code, w.response, w.error_message,
        w.created_at, w.duration_ms, p_performed_by, 'older_than_' || p_older_than_months || 'm'
      FROM archived w;

      GET DIAGNOSTICS v_total_archived = v_total_archived + ROW_COUNT;
      COMMIT;
      BEGIN;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_message := SQLERRM;
        ROLLBACK;
        RAISE WARNING 'Error archiving webhook_logs batch: %', v_error_message;
    END;
  END LOOP;

  v_end_time := NOW();

  INSERT INTO archival_operations_log (
    operation_type, table_name, criteria, records_affected,
    started_at, completed_at, performed_by, status,
    metadata
  )
  VALUES (
    'archive', 'activity_logs',
    jsonb_build_object('older_than_months', p_older_than_months, 'shop_id', p_shop_id),
    v_total_archived,
    v_start_time, v_end_time, p_performed_by, 'completed',
    jsonb_build_object(
      'audit_logs', v_audit_count,
      'webhook_logs', v_webhook_count,
      'batch_size', p_batch_size
    )
  );

  ANALYZE audit_logs;
  ANALYZE webhook_logs;
  ANALYZE activity_logs_archived;

  RETURN jsonb_build_object(
    'success', TRUE,
    'dry_run', FALSE,
    'audit_logs_to_archive', v_audit_count,
    'webhook_logs_to_archive', v_webhook_count,
    'total_archived', v_total_archived,
    'cutoff_date', v_cutoff_date,
    'duration_seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time)),
    'message', 'Activity logs archived successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 5. UNIVERSAL ARCHIVE FUNCTION (by type)
-- =====================================================
-- Função unificada para arquivar qualquer tipo de tabela
-- =====================================================

CREATE OR REPLACE FUNCTION procedure_archive_by_type(
  p_table_type VARCHAR DEFAULT NULL,  -- 'clients', 'appointments', 'messages', 'activity_logs'
  p_older_than_months INTEGER DEFAULT 12,
  p_shop_id UUID DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE,
  p_performed_by TEXT DEFAULT 'system'
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validar table_type
  IF p_table_type IS NULL THEN
    RAISE EXCEPTION 'table_type is required';
  END IF;

  CASE p_table_type
    WHEN 'clients' THEN
      v_result := procedure_archive_clients(
        p_older_than_months := 24,
        p_shop_id := p_shop_id,
        p_dry_run := p_dry_run,
        p_performed_by := p_performed_by
      );
    WHEN 'appointments' THEN
      v_result := procedure_archive_appointments(
        p_older_than_months := p_older_than_months,
        p_shop_id := p_shop_id,
        p_dry_run := p_dry_run,
        p_performed_by := p_performed_by
      );
    WHEN 'messages' THEN
      v_result := procedure_archive_messages(
        p_older_than_months := 18,
        p_shop_id := p_shop_id,
        p_dry_run := p_dry_run,
        p_performed_by := p_performed_by
      );
    WHEN 'activity_logs' THEN
      v_result := procedure_archive_activity_logs(
        p_older_than_months := 6,
        p_shop_id := p_shop_id,
        p_dry_run := p_dry_run,
        p_performed_by := p_performed_by
      );
    WHEN 'all' THEN
      -- Executar todas as procedures
      v_result := jsonb_build_object(
        'clients', procedure_archive_clients(24, p_shop_id, FALSE, p_dry_run, p_performed_by),
        'appointments', procedure_archive_appointments(p_older_than_months, p_shop_id, FALSE, p_dry_run, p_performed_by),
        'messages', procedure_archive_messages(18, p_shop_id, FALSE, p_dry_run, p_performed_by),
        'activity_logs', procedure_archive_activity_logs(6, p_shop_id, FALSE, p_dry_run, p_performed_by)
      );
    ELSE
      RAISE EXCEPTION 'Invalid table_type: %. Must be one of: clients, appointments, messages, activity_logs, all', p_table_type;
  END CASE;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 6. RESTORE APPOINTMENT PROCEDURE (EMERGENCY)
-- =====================================================
-- Restaura um agendamento da tabela arquivada
-- Uso: emergência, não para rotina
-- =====================================================

CREATE OR REPLACE FUNCTION procedure_restore_appointment(
  p_appointment_id UUID,
  p_performed_by TEXT DEFAULT 'system'
)
RETURNS JSONB AS $$
DECLARE
  v_shop_id UUID;
  v_restored BOOLEAN;
BEGIN
  v_restored := FALSE;

  -- Buscar o agendamento arquivado
  SELECT shop_id INTO v_shop_id
  FROM appointments_archived
  WHERE id = p_appointment_id;

  IF v_shop_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Appointment not found in archived table'
    );
  END IF;

  -- Inserir de volta na tabela principal (se não existir)
  INSERT INTO appointments (
    id, shop_id, client_id, employee_id, service_id,
    scheduled_at, duration_minutes, price, status, notes,
    created_at, updated_at, version,
    whatsapp_sent, whatsapp_sent_at,
    reminder_24h_sent, reminder_24h_at,
    reminder_2h_sent, reminder_2h_at
  )
  SELECT
    id, shop_id, client_id, employee_id, service_id,
    scheduled_at, duration_minutes, price, status, notes,
    created_at, updated_at, version,
    whatsapp_sent, whatsapp_sent_at,
    reminder_24h_sent, reminder_24h_at,
    reminder_2h_sent, reminder_2h_at
  FROM appointments_archived
  WHERE id = p_appointment_id
  ON CONFLICT (id) DO NOTHING;

  IF FOUND THEN
    v_restored := TRUE;

    -- Log da operação de restore
    INSERT INTO archival_restore_log (
      appointment_id, shop_id, restored_at,
      performed_by, metadata
    )
    VALUES (
      p_appointment_id, v_shop_id, NOW(),
      p_performed_by, jsonb_build_object('source', 'appointments_archived')
    );
  END IF;

  RETURN jsonb_build_object(
    'success', v_restored,
    'appointment_id', p_appointment_id,
    'shop_id', v_shop_id,
    'message', CASE WHEN v_restored THEN 'Appointment restored successfully' ELSE 'Appointment already exists in main table' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- COMENTÁRIOS
-- =====================================================
--
-- Este script cria as stored procedures para arquivamento:
-- 1. procedure_archive_clients() - clientes inativos há 24+ meses
-- 2. procedure_archive_appointments() - agendamentos antigos há 12+ meses
-- 3. procedure_archive_messages() - mensagens antigas há 18+ meses
-- 4. procedure_archive_activity_logs() - logs de atividade há 6+ meses
-- 5. procedure_archive_by_type() - função unificada
-- 6. procedure_restore_appointment() - restauração de emergência
--
-- Features:
-- - Suporte a dry run (simulação sem alterações)
-- - Processamento em batches para evitar transações longas
-- - SKIP LOCKED para não bloquear operações concorrentes
-- - Registro completo em audit trails
-- - Atualização automática de statistics
-- - Suporte a shop_id específico ou todas as shops
--
-- Próximo:
-- 14_summary_views.sql - materialized views para stats agregados
-- 15_archival_audit.sql - tabelas de audit trail
--
