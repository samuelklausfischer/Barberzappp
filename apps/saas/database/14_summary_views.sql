-- =====================================================
-- BarberZap - Summary Views & Materialized Views (FASE X - Item 3)
-- =====================================================
-- Prioridade: 2 (MUITO IMPORTANTE)
-- Justificativa: Queries agregadas podem ser lentas sem MVs
-- Tempo estimado: 3-4 horas
-- =====================================================
-- Este script cria materialized views para estatísticas
-- agregadas que podem ser atualizadas de forma concorrente.
-- =====================================================

-- =====================================================
-- 1. MV_CLIENT_STATS_PER_MONTH
-- =====================================================
-- Estatísticas de clientes por mês (ativos, novos, churned)
-- Atualização: REFRESH CONCURRENTLY
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_client_stats_per_month AS
SELECT
  DATE_TRUNC('month', created_at)::DATE AS month,
  shop_id,
  COUNT(*) AS total_clients,
  COUNT(DISTINCT id) AS unique_clients,
  COUNT(DISTINCT id) FILTER (WHERE tags && ARRAY['vip']) AS vip_clients,
  COUNT(DISTINCT id) FILTER (WHERE total_visits >= 10) AS loyal_clients,
  AVG(total_visits) AS avg_visits_per_client,
  AVG(total_spent) AS avg_spent_per_client,
  SUM(total_spent) AS total_revenue,
  SUM(total_visits) AS total_visits,
  COUNT(DISTINCT id) FILTER (
    WHERE last_visit_at >= NOW() - INTERVAL '90 days'
  ) AS active_clients_90d,
  COUNT(DISTINCT id) FILTER (
    WHERE last_visit_at >= NOW() - INTERVAL '180 days'
  ) AS active_clients_180d,
  COALESCE(SUM(no_show_count), 0) AS total_no_shows,
  COALESCE(SUM(cancelled_count), 0) AS total_cancellations
FROM clients
WHERE deleted_at IS NULL
GROUP BY
  DATE_TRUNC('month', created_at)::DATE,
  shop_id
ORDER BY month DESC, shop_id;

-- Índices para consultas rápidas
CREATE UNIQUE INDEX idx_mv_client_stats_month_shop ON mv_client_stats_per_month(month, shop_id);
CREATE INDEX idx_mv_client_stats_shop ON mv_client_stats_per_month(shop_id);
CREATE INDEX idx_mv_client_stats_month ON mv_client_stats_per_month(month DESC);

-- Comentário
COMMENT ON MATERIALIZED VIEW mv_client_stats_per_month IS 'Client statistics aggregated by month. Refresh concurrently.';


-- =====================================================
-- 2. MV_APPOINTMENT_STATS_PER_MONTH
-- =====================================================
-- Estatísticas de agendamentos por mês
-- Inclui completados, cancelados, no_show, revenue
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_appointment_stats_per_month AS
SELECT
  DATE_TRUNC('month', scheduled_at)::DATE AS month,
  shop_id,
  COUNT(*) AS total_appointments,
  COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
  COUNT(*) FILTER (WHERE status = 'no_show') AS no_show,
  AVG(price) FILTER (WHERE status = 'completed') AS avg_ticket_value,
  SUM(price) FILTER (WHERE status = 'completed') AS total_revenue,
  AVG(duration_minutes) AS avg_duration_minutes,
  COUNT(DISTINCT client_id) AS unique_clients,
  COUNT(DISTINCT employee_id) AS active_employees,
  COUNT(*) FILTER (WHERE reminder_24h_sent = TRUE) AS reminders_24h_sent,
  COUNT(*) FILTER (WHERE reminder_2h_sent = TRUE) AS reminders_2h_sent,
  COUNT(*) FILTER (WHERE whatsapp_sent = TRUE) AS whatsapp_messages_sent
FROM appointments
WHERE scheduled_at >= CURRENT_DATE - INTERVAL '24 months'
GROUP BY
  DATE_TRUNC('month', scheduled_at)::DATE,
  shop_id
ORDER BY month DESC, shop_id;

-- Índices
CREATE UNIQUE INDEX idx_mv_appointment_stats_month_shop ON mv_appointment_stats_per_month(month, shop_id);
CREATE INDEX idx_mv_appointment_stats_shop ON mv_appointment_stats_per_month(shop_id);
CREATE INDEX idx_mv_appointment_stats_month ON mv_appointment_stats_per_month(month DESC);
CREATE INDEX idx_mv_appointment_stats_shop_month ON mv_appointment_stats_per_month(shop_id, month DESC);

-- Comentário
COMMENT ON MATERIALIZED VIEW mv_appointment_stats_per_month IS 'Appointment statistics aggregated by month. Refresh concurrently.';


-- =====================================================
-- 3. MV_REVENUE_STATS_PER_MONTH
-- =====================================================
-- Estatísticas detalhadas de receita por mês
-- Breakdown por status, serviço, dia da semana
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_revenue_stats_per_month AS
WITH daily_revenue AS (
  SELECT
    DATE_TRUNC('day', scheduled_at)::DATE AS day,
    shop_id,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0) AS daily_revenue,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
    COALESCE(SUM(price) FILTER (WHERE status = 'cancelled'), 0) AS cancelled_revenue,
    COUNT(*) FILTER (WHERE status = 'no_show') AS no_show_count,
    COALESCE(SUM(price) FILTER (WHERE status = 'no_show'), 0) AS no_show_revenue
  FROM appointments
  WHERE scheduled_at >= CURRENT_DATE - INTERVAL '24 months'
  GROUP BY
    DATE_TRUNC('day', scheduled_at)::DATE,
    shop_id
),
month_revenue AS (
  SELECT
    DATE_TRUNC('month', day)::DATE AS month,
    shop_id,
    COUNT(*) AS business_days,
    SUM(completed_count) AS total_completed,
    SUM(daily_revenue) AS gross_revenue,
    SUM(cancelled_revenue) AS potential_lost_revenue,
    SUM(no_show_revenue) AS no_show_lost_revenue,
    AVG(daily_revenue) AS avg_daily_revenue,
    MAX(daily_revenue) AS best_day_revenue,
    MIN(daily_revenue FILTER (WHERE daily_revenue > 0)) AS worst_day_revenue
  FROM daily_revenue
  GROUP BY
    DATE_TRUNC('month', day)::DATE,
    shop_id
)
SELECT
  month,
  shop_id,
  business_days,
  total_completed,
  gross_revenue,
  potential_lost_revenue,
  no_show_lost_revenue,
  gross_revenue + potential_lost_revenue + no_show_lost_revenue AS total_potential_revenue,
  avg_daily_revenue,
  best_day_revenue,
  worst_day_revenue,
  -- Percentual de aproveitamento
  CASE
    WHEN gross_revenue + potential_lost_revenue + no_show_lost_revenue > 0
    THEN ROUND((gross_revenue / (gross_revenue + potential_lost_revenue + no_show_lost_revenue))::NUMERIC, 4) * 100
    ELSE 0
  END AS revenue_capture_rate
FROM month_revenue
ORDER BY month DESC, shop_id;

-- Índices
CREATE UNIQUE INDEX idx_mv_revenue_stats_month_shop ON mv_revenue_stats_per_month(month, shop_id);
CREATE INDEX idx_mv_revenue_stats_shop ON mv_revenue_stats_per_month(shop_id);
CREATE INDEX idx_mv_revenue_stats_month ON mv_revenue_stats_per_month(month DESC);

-- Comentário
COMMENT ON MATERIALIZED VIEW mv_revenue_stats_per_month IS 'Revenue statistics with capture rate and lost revenue tracking. Refresh concurrently.';


-- =====================================================
-- 4. MV_TOP_SERVICES_PER_QUARTER
-- =====================================================
-- Top serviços por trimestre (por revenue e contagem)
-- Ranking top 10 serviços por shop
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_services_per_quarter AS
WITH quarterly_services AS (
  SELECT
    DATE_TRUNC('quarter', a.scheduled_at)::DATE AS quarter,
    a.shop_id,
    a.service_id,
    s.name AS service_name,
    s.duration_minutes,
    s.price AS base_price,
    COUNT(*) FILTER (WHERE a.status = 'completed') AS completed_count,
    COALESCE(SUM(a.price) FILTER (WHERE a.status = 'completed'), 0) AS revenue,
    COUNT(DISTINCT a.client_id) AS unique_clients,
    AVG(a.price) FILTER (WHERE a.status = 'completed') AS avg_price
  FROM appointments a
  JOIN services s ON s.id = a.service_id
  WHERE
    a.scheduled_at >= CURRENT_DATE - INTERVAL '24 months'
    AND a.status = 'completed'
  GROUP BY
    DATE_TRUNC('quarter', a.scheduled_at)::DATE,
    a.shop_id,
    a.service_id,
    s.name,
    s.duration_minutes,
    s.price
),
ranked_services AS (
  SELECT
    quarter,
    shop_id,
    service_id,
    service_name,
    duration_minutes,
    base_price,
    completed_count,
    revenue,
    unique_clients,
    avg_price,
    ROW_NUMBER() OVER (PARTITION BY quarter, shop_id ORDER BY revenue DESC) AS revenue_rank,
    ROW_NUMBER() OVER (PARTITION BY quarter, shop_id ORDER BY completed_count DESC) AS count_rank
  FROM quarterly_services
)
SELECT
  quarter,
  shop_id,
  service_id,
  service_name,
  duration_minutes,
  base_price,
  completed_count,
  revenue,
  unique_clients,
  avg_price,
  revenue_rank,
  count_rank
FROM ranked_services
WHERE revenue_rank <= 10 OR count_rank <= 10
ORDER BY quarter DESC, shop_id, revenue_rank;

-- Índices
CREATE INDEX idx_mv_top_services_quarter_shop ON mv_top_services_per_quarter(quarter, shop_id);
CREATE INDEX idx_mv_top_services_revenue ON mv_top_services_per_quarter(quarter, shop_id, revenue_rank);
CREATE INDEX idx_mv_top_services_name ON mv_top_services_per_quarter(service_name);

-- Comentário
COMMENT ON MATERIALIZED VIEW mv_top_services_per_quarter IS 'Top 10 services per quarter by revenue and count. Refresh concurrently.';


-- =====================================================
-- 5. MV_ARCHIVAL_STATUS
-- =====================================================
-- Status atual de arquivamento por tabelas
-- Mostra quanto foi arquivado vs ativo
-- Atualização manual ou via trigger
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_archival_status AS
WITH active_counts AS (
  SELECT
    'clients' AS table_name,
    COUNT(*) AS active_count,
    pg_size_pretty(pg_total_relation_size('clients')) AS active_size,
    COUNT(DISTINCT shop_id) AS shop_count
  FROM clients
  WHERE deleted_at IS NULL
  UNION ALL
  SELECT
    'appointments' AS table_name,
    COUNT(*) AS active_count,
    pg_size_pretty(pg_total_relation_size('appointments')) AS active_size,
    COUNT(DISTINCT shop_id) AS shop_count
  FROM appointments
  WHERE scheduled_at >= CURRENT_DATE - INTERVAL '12 months'
  UNION ALL
  SELECT
    'messages' AS table_name,
    COUNT(*) AS active_count,
    pg_size_pretty(pg_total_relation_size('messages')) AS active_size,
    COUNT(DISTINCT shop_id) AS shop_count
  FROM messages
  WHERE created_at >= CURRENT_DATE - INTERVAL '18 months'
  UNION ALL
  SELECT
    'activity_logs' AS table_name,
    (SELECT COUNT(*) FROM audit_logs WHERE changed_at >= CURRENT_DATE - INTERVAL '6 months') +
    (SELECT COUNT(*) FROM webhook_logs WHERE created_at >= CURRENT_DATE - INTERVAL '6 months')
      AS active_count,
    pg_size_pretty(pg_total_relation_size('audit_logs') + pg_total_relation_size('webhook_logs')) AS active_size,
    COUNT(DISTINCT shop_id) AS shop_count
  FROM audit_logs
  WHERE changed_at >= CURRENT_DATE - INTERVAL '6 months'
),
archived_counts AS (
  SELECT
    'clients' AS table_name,
    COUNT(*) AS archived_count,
    pg_size_pretty(pg_total_relation_size('clients_archived')) AS archived_size
  FROM clients_archived
  UNION ALL
  SELECT
    'appointments' AS table_name,
    COUNT(*) AS archived_count,
    pg_size_pretty(pg_total_relation_size('appointments_archived')) AS archived_size
  FROM appointments_archived
  UNION ALL
  SELECT
    'messages' AS table_name,
    COUNT(*) AS archived_count,
    pg_size_pretty(pg_total_relation_size('messages_archived')) AS archived_size
  FROM messages_archived
  UNION ALL
  SELECT
    'activity_logs' AS table_name,
    COUNT(*) AS archived_count,
    pg_size_pretty(pg_total_relation_size('activity_logs_archived')) AS archived_size
  FROM activity_logs_archived
)
SELECT
  a.table_name,
  a.active_count,
  a.active_size,
  COALESCE(arc.archived_count, 0) AS archived_count,
  COALESCE(arc.archived_size, '0 bytes'::TEXT) AS archived_size,
  a.active_count + COALESCE(arc.archived_count, 0) AS total_count,
  a.shop_count,
  -- Cálculo de percentual arquivado
  CASE
    WHEN a.active_count + COALESCE(arc.archived_count, 0) > 0
    THEN ROUND((COALESCE(arc.archived_count, 0)::NUMERIC / (a.active_count + COALESCE(arc.archived_count, 0))::NUMERIC) * 100, 2)
    ELSE 0
  END AS archived_percentage,
  -- Data da última atualização
  NOW() AS last_updated
FROM active_counts a
LEFT JOIN archived_counts arc ON arc.table_name = a.table_name
ORDER BY a.table_name;

-- Índice
CREATE UNIQUE INDEX idx_mv_archival_status_table ON mv_archival_status(table_name);

-- Comentário
COMMENT ON MATERIALIZED VIEW mv_archival_status IS 'Current archival status showing active vs archived counts. Manual refresh needed.';


-- =====================================================
-- 6. MV_EMPLOYEE_PERFORMANCE_PER_MONTH
-- =====================================================
-- Performance de funcionários por mês
-- Agendamentos completados, receita, ticket médio
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_employee_performance_per_month AS
SELECT
  DATE_TRUNC('month', a.scheduled_at)::DATE AS month,
  a.shop_id,
  a.employee_id,
  e.name AS employee_name,
  COUNT(*) FILTER (WHERE a.status = 'completed') AS completed_appointments,
  COUNT(*) FILTER (WHERE a.status = 'cancelled') AS cancelled_appointments,
  COUNT(*) FILTER (WHERE a.status = 'no_show') AS no_show_appointments,
  COUNT(*) AS total_appointments,
  COALESCE(SUM(a.price) FILTER (WHERE a.status = 'completed'), 0) AS revenue,
  COALESCE(AVG(a.price) FILTER (WHERE a.status = 'completed'), 0) AS avg_ticket_value,
  COALESCE(SUM(a.duration_minutes) FILTER (WHERE a.status = 'completed'), 0) AS total_minutes_worked,
  COUNT(DISTINCT a.client_id) AS unique_clients_served,
  -- Taxa de conclusão
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE a.status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    ELSE 0
  END AS completion_rate,
  -- Taxa de no-show
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE a.status = 'no_show')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    ELSE 0
  END AS no_show_rate
FROM appointments a
JOIN employees e ON e.id = a.employee_id
WHERE
  a.scheduled_at >= CURRENT_DATE - INTERVAL '24 months'
  AND e.deleted_at IS NULL
GROUP BY
  DATE_TRUNC('month', a.scheduled_at)::DATE,
  a.shop_id,
  a.employee_id,
  e.name
ORDER BY month DESC, shop_id, revenue DESC;

-- Índices
CREATE UNIQUE INDEX idx_mv_employee_perf_month_shop_emp ON mv_employee_performance_per_month(month, shop_id, employee_id);
CREATE INDEX idx_mv_employee_perf_shop ON mv_employee_performance_per_month(shop_id);
CREATE INDEX idx_mv_employee_perf_employee ON mv_employee_performance_per_month(employee_id);

-- Comentário
COMMENT ON MATERIALIZED VIEW mv_employee_performance_per_month IS 'Employee performance metrics per month. Refresh concurrently.';


-- =====================================================
-- 7. MV_DAILY_TRAFFIC_HEATMAP
-- =====================================================
-- Heatmap de tráfego por dia da semana e hora
-- Útil para identificar horários de pico
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_traffic_heatmap AS
SELECT
  EXTRACT(DOW FROM scheduled_at)::INTEGER AS day_of_week,  -- 0=Sunday, 6=Saturday
  EXTRACT(HOUR FROM scheduled_at)::INTEGER AS hour_of_day,
  a.shop_id,
  COUNT(*) AS appointment_count,
  COUNT(*) FILTER (WHERE a.status = 'completed') AS completed_count,
  COUNT(*) FILTER (WHERE a.status = 'no_show') AS no_show_count,
  COALESCE(SUM(a.price) FILTER (WHERE a.status = 'completed'), 0) AS revenue,
  COUNT(DISTINCT a.client_id) AS unique_clients
FROM appointments a
WHERE
  a.scheduled_at >= CURRENT_DATE - INTERVAL '12 months'
  AND a.status IN ('scheduled', 'confirmed', 'completed')
GROUP BY
  EXTRACT(DOW FROM scheduled_at)::INTEGER,
  EXTRACT(HOUR FROM scheduled_at)::INTEGER,
  a.shop_id
ORDER BY shop_id, day_of_week, hour_of_day;

-- Índices
CREATE UNIQUE INDEX idx_mv_traffic_heatmap_day_hour_shop ON mv_daily_traffic_heatmap(day_of_week, hour_of_day, shop_id);
CREATE INDEX idx_mv_traffic_heatmap_shop ON mv_daily_traffic_heatmap(shop_id);

-- Comentário
COMMENT ON MATERIALIZED VIEW mv_daily_traffic_heatmap IS 'Traffic heatmap by day of week and hour. Useful for scheduling. Refresh concurrently.';


-- =====================================================
-- FUNCTIONS TO REFRESH MATERIALIZED VIEWS
-- =====================================================

-- Função para refresh concorrente de uma MV específica
CREATE OR REPLACE FUNCTION refresh_materialized_view_concurrently(
  p_view_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_sql TEXT;
  v_status TEXT;
BEGIN
  -- Validar view name
  IF p_view_name NOT IN (
    'mv_client_stats_per_month',
    'mv_appointment_stats_per_month',
    'mv_revenue_stats_per_month',
    'mv_top_services_per_quarter',
    'mv_archival_status',
    'mv_employee_performance_per_month',
    'mv_daily_traffic_heatmap'
  ) THEN
    RAISE EXCEPTION 'Invalid view name: %', p_view_name;
  END IF;

  -- Build SQL for concurrent refresh
  v_sql := 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || p_view_name;

  -- Execute
  BEGIN
    EXECUTE v_sql;
    v_status := 'success';
  EXCEPTION WHEN OTHERS THEN
    v_status := SQLERRM;
    RAISE WARNING 'Failed to refresh %: %', p_view_name, v_status;
  END;

  RETURN jsonb_build_object(
    'view_name', p_view_name,
    'status', v_status,
    'refreshed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para refresh de todas as views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS JSONB AS $$
DECLARE
  v_results JSONB;
BEGIN
  v_results := jsonb_build_object(
    'mv_client_stats_per_month',
      (SELECT * FROM refresh_materialized_view_concurrently('mv_client_stats_per_month')),
    'mv_appointment_stats_per_month',
      (SELECT * FROM refresh_materialized_view_concurrently('mv_appointment_stats_per_month')),
    'mv_revenue_stats_per_month',
      (SELECT * FROM refresh_materialized_view_concurrently('mv_revenue_stats_per_month')),
    'mv_top_services_per_quarter',
      (SELECT * FROM refresh_materialized_view_concurrently('mv_top_services_per_quarter')),
    'mv_archival_status',
      (SELECT * FROM refresh_materialized_view_concurrently('mv_archival_status')),
    'mv_employee_performance_per_month',
      (SELECT * FROM refresh_materialized_view_concurrently('mv_employee_performance_per_month')),
    'mv_daily_traffic_heatmap',
      (SELECT * FROM refresh_materialized_view_concurrently('mv_daily_traffic_heatmap')),
    'refreshed_at', NOW()
  );

  RETURN v_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- SCHEDULED REFRESH FUNCTION (para pg_cron ou similar)
-- =====================================================

CREATE OR REPLACE FUNCTION scheduled_refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
  PERFORM refresh_materialized_view_concurrently('mv_client_stats_per_month');
  PERFORM refresh_materialized_view_concurrently('mv_appointment_stats_per_month');
  PERFORM refresh_materialized_view_concurrently('mv_revenue_stats_per_month');
  PERFORM refresh_materialized_view_concurrently('mv_top_services_per_quarter');
  PERFORM refresh_materialized_view_concurrently('mv_employee_performance_per_month');
  PERFORM refresh_materialized_view_concurrently('mv_daily_traffic_heatmap');
  -- mv_archival_status é refresh manual (trigger-based)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- COMENTÁRIOS
-- =====================================================
--
-- Este script cria 7 materialized views para estatísticas:
-- 1. mv_client_stats_per_month - stats de clientes/mês
-- 2. mv_appointment_stats_per_month - stats de agendamentos/mês
-- 3. mv_revenue_stats_per_month - stats de receita/mês
-- 4. mv_top_services_per_quarter - top serviços/trimestre
-- 5. mv_archival_status - status de arquivamento
-- 6. mv_employee_performance_per_month - performance funcionários/mês
-- 7. mv_daily_traffic_heatmap - heatmap de tráfego horário
--
-- Features:
-- - REFRESH CONCURRENTLY para não bloquear leituras
-- - Índices otimizados para quick access
-- - Funções helper para refresh manual ou agendado
-- - Suporte para pg_cron ou similar
--
-- Cron schedule recomendado:
-- - mv_client_stats_per_month: 0 2 * * * (2h da manhã)
-- - mv_appointment_stats_per_month: 0 2 * * *
-- - mv_revenue_stats_per_month: 0 2 * * *
-- - mv_top_services_per_quarter: 0 3 * * 1 (domingo às 3h)
-- - mv_archival_status: após operação de arquivamento
-- - mv_employee_performance_per_month: 0 2 * * *
-- - mv_daily_traffic_heatmap: 30 * * * * (a cada 30 min)
--
-- Próximo:
-- 15_archival_audit.sql - audit trail completo
--
