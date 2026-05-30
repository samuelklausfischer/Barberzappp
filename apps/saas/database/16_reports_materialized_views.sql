-- =====================================================
-- BarberZap - Advanced Reports Materialized Views (FASE 4)
-- =====================================================
-- Prioridade: 2
-- Justificativa: Views materializadas para performance de reports complexos
-- Tempo estimado: 3-4 horas
-- =====================================================

-- Habilitar extensão pg_cron se não existir
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA public;

-- =====================================================
-- 1. MV_DAILY_REVENUE
-- Visão materializada para receita diária
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_revenue AS
SELECT 
    DATE(a.scheduled_at) AS report_date,
    COUNT(a.id) AS appointments_count,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
    COALESCE(SUM(a.price), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS completed_revenue,
    a.shop_id,
    EXTRACT(YEAR FROM DATE(a.scheduled_at)) AS year,
    EXTRACT(MONTH FROM DATE(a.scheduled_at)) AS month,
    EXTRACT(DAY FROM DATE(a.scheduled_at)) AS day
FROM appointments a
WHERE a.deleted_at IS NULL
  AND a.scheduled_at IS NOT NULL
GROUP BY 
    DATE(a.scheduled_at),
    a.shop_id,
    EXTRACT(YEAR FROM DATE(a.scheduled_at)),
    EXTRACT(MONTH FROM DATE(a.scheduled_at)),
    EXTRACT(DAY FROM DATE(a.scheduled_at));

CREATE UNIQUE INDEX idx_mv_daily_revenue_unique 
    ON mv_daily_revenue(report_date, shop_id);

CREATE INDEX idx_mv_daily_revenue_shop_date 
    ON mv_daily_revenue(shop_id, report_date DESC);

CREATE INDEX idx_mv_daily_revenue_year_month 
    ON mv_daily_revenue(year, month);

-- =====================================================
-- 2. MV_MONTHLY_REVENUE
-- Visão materializada para receita mensal
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_revenue AS
SELECT 
    EXTRACT(YEAR FROM DATE(a.scheduled_at))::INTEGER AS year,
    EXTRACT(MONTH FROM DATE(a.scheduled_at))::INTEGER AS month,
    COUNT(a.id) AS appointments_count,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
    COALESCE(SUM(a.price), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS completed_revenue,
    COALESCE(AVG(a.price), 0) AS avg_ticket_value,
    COALESCE(AVG(CASE WHEN a.status = 'completed' THEN a.price ELSE NULL END), 0) AS avg_completed_ticket,
    a.shop_id
FROM appointments a
WHERE a.deleted_at IS NULL
  AND a.scheduled_at IS NOT NULL
GROUP BY 
    EXTRACT(YEAR FROM DATE(a.scheduled_at)),
    EXTRACT(MONTH FROM DATE(a.scheduled_at)),
    a.shop_id;

CREATE UNIQUE INDEX idx_mv_monthly_revenue_unique 
    ON mv_monthly_revenue(year, month, shop_id);

CREATE INDEX idx_mv_monthly_revenue_shop_year 
    ON mv_monthly_revenue(shop_id, year DESC, month DESC);

-- =====================================================
-- 3. MV_CLIENT_RETENTION
-- Visão materializada para retenção de clientes
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_client_retention AS
WITH client_months AS (
    SELECT DISTINCT
        DATE_TRUNC('month', a.scheduled_at) AS month,
        EXTRACT(YEAR FROM DATE(a.scheduled_at))::INTEGER AS year,
        EXTRACT(MONTH FROM DATE(a.scheduled_at))::INTEGER AS month_num,
        a.client_id,
        a.shop_id,
        MIN(a.created_at) OVER (PARTITION BY a.client_id, a.shop_id) = a.created_at AS is_new_client
    FROM appointments a
    WHERE a.deleted_at IS NULL
      AND a.scheduled_at IS NOT NULL
      AND a.status IN ('completed', 'confirmed')
),
monthly_stats AS (
    SELECT 
        year,
        month_num,
        shop_id,
        COUNT(DISTINCT client_id) AS total_clients,
        COUNT(DISTINCT CASE WHEN is_new_client THEN client_id END) AS new_clients,
        COUNT(DISTINCT CASE WHEN NOT is_new_client THEN client_id END) AS returning_clients,
        ROUND(
            (COUNT(DISTINCT CASE WHEN NOT is_new_client THEN client_id END)::NUMERIC / 
             NULLIF(COUNT(DISTINCT client_id), 0)) * 100, 
            2
        ) AS retention_rate
    FROM client_months
    GROUP BY year, month_num, shop_id
)
SELECT 
    year,
    month_num AS month,
    shop_id,
    total_clients,
    new_clients,
    returning_clients,
    retention_rate,
    LAG(total_clients) OVER (PARTITION BY shop_id ORDER BY year, month_num) AS prev_month_clients,
    ROUND(
        ((total_clients - prev_month_clients)::NUMERIC / 
         NULLIF(prev_month_clients, 0)) * 100,
        2
    ) AS client_growth_rate
FROM monthly_stats;

CREATE UNIQUE INDEX idx_mv_client_retention_unique 
    ON mv_client_retention(year, month, shop_id);

CREATE INDEX idx_mv_client_retention_shop 
    ON mv_client_retention(shop_id, year DESC, month DESC);

-- =====================================================
-- 4. MV_SERVICE_POPULARITY
-- Visão materializada para popularidade de serviços
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_service_popularity AS
SELECT 
    s.id AS service_id,
    s.name AS service_name,
    s.price AS service_price,
    s.duration_minutes,
    COUNT(a.id) AS appointment_count,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
    COALESCE(SUM(a.price), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS completed_revenue,
    COALESCE(AVG(a.price), 0) AS avg_price,
    ROUND(
        (COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(a.id), 0)) * 100,
        2
    ) AS completion_rate,
    s.shop_id,
    EXTRACT(YEAR FROM DATE(a.scheduled_at))::INTEGER AS year,
    EXTRACT(MONTH FROM DATE(a.scheduled_at))::INTEGER AS month
FROM services s
LEFT JOIN appointments a ON a.service_id = s.id 
    AND a.deleted_at IS NULL 
    AND a.scheduled_at IS NOT NULL
GROUP BY 
    s.id, s.name, s.price, s.duration_minutes, s.shop_id,
    EXTRACT(YEAR FROM DATE(a.scheduled_at)),
    EXTRACT(MONTH FROM DATE(a.scheduled_at));

CREATE INDEX idx_mv_service_popularity_service 
    ON mv_service_popularity(service_id);

CREATE INDEX idx_mv_service_popularity_shop 
    ON mv_service_popularity(shop_id, year DESC, month DESC);

CREATE INDEX idx_mv_service_popularity_revenue 
    ON mv_service_popularity(shop_id, total_revenue DESC);

-- =====================================================
-- 5. MV_EMPLOYEE_PERFORMANCE
-- Visão materializada para performance de funcionários
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_employee_performance AS
SELECT 
    e.id AS employee_id,
    e.name AS employee_name,
    e.role,
    COUNT(a.id) AS total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
    COALESCE(SUM(a.price), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS completed_revenue,
    COALESCE(SUM(a.duration_minutes), 0) AS total_minutes,
    ROUND(
        (COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(a.id), 0)) * 100,
        2
    ) AS completion_rate,
    ROUND(
        (COUNT(CASE WHEN a.status = 'no_show' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(a.id), 0)) * 100,
        2
    ) AS no_show_rate,
    COALESCE(AVG(a.price), 0) AS avg_ticket_value,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END) / NULLIF(SUM(a.duration_minutes), 0), 0) * 60 AS revenue_per_hour,
    e.shop_id,
    EXTRACT(YEAR FROM DATE(a.scheduled_at))::INTEGER AS year,
    EXTRACT(MONTH FROM DATE(a.scheduled_at))::INTEGER AS month
FROM employees e
LEFT JOIN appointments a ON a.employee_id = e.id 
    AND a.deleted_at IS NULL 
    AND a.scheduled_at IS NOT NULL
WHERE e.deleted_at IS NULL
GROUP BY 
    e.id, e.name, e.role, e.shop_id,
    EXTRACT(YEAR FROM DATE(a.scheduled_at)),
    EXTRACT(MONTH FROM DATE(a.scheduled_at));

CREATE INDEX idx_mv_employee_performance_employee 
    ON mv_employee_performance(employee_id);

CREATE INDEX idx_mv_employee_performance_shop 
    ON mv_employee_performance(shop_id, year DESC, month DESC);

CREATE INDEX idx_mv_employee_performance_revenue 
    ON mv_employee_performance(shop_id, completed_revenue DESC);

-- =====================================================
-- 6. MV_REVENUE_BY_HOUR
-- Visão materializada para receita por hora do dia
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_revenue_by_hour AS
SELECT 
    EXTRACT(HOUR FROM a.scheduled_at)::INTEGER AS hour,
    COUNT(a.id) AS appointment_count,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
    COALESCE(SUM(a.price), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS completed_revenue,
    COALESCE(AVG(a.price), 0) AS avg_ticket_value,
    COALESCE(AVG(CASE WHEN a.status = 'completed' THEN a.price ELSE NULL END), 0) AS avg_completed_ticket,
    a.shop_id,
    DATE(a.scheduled_at) AS report_date,
    EXTRACT(YEAR FROM DATE(a.scheduled_at))::INTEGER AS year,
    EXTRACT(MONTH FROM DATE(a.scheduled_at))::INTEGER AS month,
    EXTRACT(DAY FROM DATE(a.scheduled_at))::INTEGER AS day
FROM appointments a
WHERE a.deleted_at IS NULL
  AND a.scheduled_at IS NOT NULL
GROUP BY 
    EXTRACT(HOUR FROM a.scheduled_at),
    a.shop_id,
    DATE(a.scheduled_at),
    EXTRACT(YEAR FROM DATE(a.scheduled_at)),
    EXTRACT(MONTH FROM DATE(a.scheduled_at)),
    EXTRACT(DAY FROM DATE(a.scheduled_at));

CREATE INDEX idx_mv_revenue_by_hour_shop 
    ON mv_revenue_by_hour(shop_id, hour, report_date DESC);

CREATE INDEX idx_mv_revenue_by_hour_date 
    ON mv_revenue_by_hour(report_date, hour);

-- =====================================================
-- 7. MV_NO_SHOW_RATE
-- Visão materializada para taxa de no-show por dia
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_no_show_rate AS
SELECT 
    DATE(a.scheduled_at) AS report_date,
    COUNT(a.id) AS total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
    ROUND(
        (COUNT(CASE WHEN a.status = 'no_show' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(a.id), 0)) * 100,
        2
    ) AS no_show_rate,
    ROUND(
        (COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(a.id), 0)) * 100,
        2
    ) AS cancellation_rate,
    a.shop_id
FROM appointments a
WHERE a.deleted_at IS NULL
  AND a.scheduled_at IS NOT NULL
GROUP BY 
    DATE(a.scheduled_at),
    a.shop_id;

CREATE UNIQUE INDEX idx_mv_no_show_rate_unique 
    ON mv_no_show_rate(report_date, shop_id);

CREATE INDEX idx_mv_no_show_rate_shop 
    ON mv_no_show_rate(shop_id, report_date DESC);

-- =====================================================
-- 8. MV_PEAK_TIMES
-- Visão materializada para horários de pico
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_peak_times AS
SELECT 
    EXTRACT(DOW FROM a.scheduled_at)::INTEGER AS day_of_week, -- 0=Sunday, 6=Saturday
    EXTRACT(HOUR FROM a.scheduled_at)::INTEGER AS hour,
    COUNT(a.id) AS appointment_count,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS revenue,
    COALESCE(AVG(a.price), 0) AS avg_ticket_value,
    a.shop_id
FROM appointments a
WHERE a.deleted_at IS NULL
  AND a.scheduled_at IS NOT NULL
GROUP BY 
    EXTRACT(DOW FROM a.scheduled_at),
    EXTRACT(HOUR FROM a.scheduled_at),
    a.shop_id;

CREATE INDEX idx_mv_peak_times_shop 
    ON mv_peak_times(shop_id, day_of_week, hour);

CREATE INDEX idx_mv_peak_times_appointments 
    ON mv_peak_times(shop_id, appointment_count DESC);

-- =====================================================
-- REFRESH FUNCTIONS
-- Funções para refresh das views materializadas
-- =====================================================

-- Função para refresh concorrente de todas as views
CREATE OR REPLACE FUNCTION refresh_all_reports_mv()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_retention;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_popularity;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_employee_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_by_hour;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_no_show_rate;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_peak_times;
END;
$$ LANGUAGE plpgsql;

-- Função para refresh de view específica
CREATE OR REPLACE FUNCTION refresh_report_mv(view_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', view_name);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to refresh %:%', view_name, SQLERRM;
        REFRESH MATERIALIZED VIEW view_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEDULED REFRESH JOBS
-- Jobs para refresh automático das views
-- =====================================================

-- Refresh diário às 02:00 (horário de baixa atividade)
SELECT cron.schedule(
    'daily-reports-refresh',
    '0 2 * * *',
    'SELECT refresh_all_reports_mv();'
) WHERE cron.job_name = 'daily-reports-refresh'::name IS NULL;

-- Refresh parcial (somente daily) a cada hora
SELECT cron.schedule(
    'hourly-daily-reports-refresh',
    '0 * * * *',
    'SELECT refresh_report_mv(''mv_daily_revenue'');'
) WHERE cron.job_name = 'hourly-daily-reports-refresh'::name IS NULL;

-- Refresh semanal (domingo às 03:00) para stats mais pesadas
SELECT cron.schedule(
    'weekly-reports-refresh',
    '0 3 * * 0',
    'SELECT refresh_all_reports_mv(); SELECT VACUUM ANALYZE mv_daily_revenue, mv_monthly_revenue, mv_client_retention;'
) WHERE cron.job_name = 'weekly-reports-refresh'::name IS NULL;

-- =====================================================
-- MANUAL REFRESH TRIGGERS
-- Triggers para refresh parcial em operações críticas
-- =====================================================

-- Função para marcar que um refresh é necessário
CREATE OR REPLACE FUNCTION mark_reports_refresh_needed()
RETURNS trigger AS $$
BEGIN
    -- Podemos usar uma tabela de controle para refresh inteligente
    -- Por enquanto, o refresh é baseado em agendamento
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger em appointments (opcional - usar com cautela)
-- CREATE TRIGGER trigger_appointments_reports_refresh
--     AFTER INSERT OR UPDATE ON appointments
--     FOR EACH ROW
--     EXECUTE FUNCTION mark_reports_refresh_needed();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON MATERIALIZED VIEW mv_daily_revenue IS 'Visão materializada para receita diária atualizada a cada hora';
COMMENT ON MATERIALIZED VIEW mv_monthly_revenue IS 'Visão materializada para receita mensal atualizada diariamente';
COMMENT ON MATERIALIZED VIEW mv_client_retention IS 'Visão materializada para métricas de retenção de clientes';
COMMENT ON MATERIALIZED VIEW mv_service_popularity IS 'Visão materializada para análise de popularidade de serviços';
COMMENT ON MATERIALIZED VIEW mv_employee_performance IS 'Visão materializada para performance de funcionários';
COMMENT ON MATERIALIZED VIEW mv_revenue_by_hour IS 'Visão materializada para análise de receita por hora';
COMMENT ON MATERIALIZED VIEW mv_no_show_rate IS 'Visão materializada para taxa de no-show por dia';
COMMENT ON MATERIALIZED VIEW mv_peak_times IS 'Visão materializada para horários de pico';

COMMENT ON FUNCTION refresh_all_reports_mv() IS 'Refresh todas as views materializadas de reports de forma concorrente';
COMMENT ON FUNCTION refresh_report_mv(text) IS 'Refresh uma view materializada específica';

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- Listar todos os schedules
-- SELECT * FROM cron.job;

-- Remover um schedule
-- SELECT cron.unschedule('daily-reports-refresh');

-- Verificar tamanho das views materializadas
-- SELECT 
--     schemaname,
--     matviewname,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
-- FROM pg_matviews
-- WHERE matviewname LIKE 'mv_%';

-- Ver última atualização das views materializadas
-- SELECT 
--     relname AS view_name,
--     pg_size_pretty(pg_total_relation_size(relid)) AS size
-- FROM pg_catalog.pg_stat_user_tables
-- WHERE relname LIKE 'mv_%reports%';
