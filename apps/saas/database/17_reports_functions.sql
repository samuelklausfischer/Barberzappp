-- =====================================================
-- BarberZap - Advanced Reports SQL Functions (FASE 4)
-- =====================================================
-- Prioridade: 2
-- Justificativa: Funções SQL complexas para agregação de dados de reports
-- Tempo estimado: 2-3 horas
-- =====================================================

-- =====================================================
-- 1. GET_REVENUE_REPORT
-- Report de receita com comparação de período anterior
-- =====================================================
CREATE OR REPLACE FUNCTION get_revenue_report(
    p_shop_id UUID,
    p_from_date DATE,
    p_to_date DATE,
    p_compare_to_previous BOOLEAN DEFAULT FALSE,
    p_group_by TEXT DEFAULT 'day' -- 'day', 'week', 'month'
)
RETURNS TABLE (
    period DATE,
    group_label TEXT,
    appointments_count BIGINT,
    completed_count BIGINT,
    cancelled_count BIGINT,
    no_show_count BIGINT,
    total_revenue NUMERIC,
    completed_revenue NUMERIC,
    avg_ticket_value NUMERIC,
    completion_rate NUMERIC,
    no_show_rate NUMERIC,
    previous_period_revenue NUMERIC,
    previous_period_appointments BIGINT,
    revenue_growth_rate NUMERIC,
    appointments_growth_rate NUMERIC
) AS $$
DECLARE
    v_days_diff INTEGER;
    v_previous_from_date DATE;
    v_previous_to_date DATE;
BEGIN
    -- Calcula o período anterior para comparação
    IF p_compare_to_previous THEN
        v_days_diff := (p_to_date - p_from_date) + 1;
        v_previous_from_date := p_from_date - v_days_diff;
        v_previous_to_date := p_to_date - v_days_diff;
    END IF;

    -- Retorna os dados agrupados conforme especificado
    RETURN QUERY
    WITH grouped_data AS (
        SELECT 
            CASE p_group_by
                WHEN 'day' THEN DATE(a.scheduled_at)
                WHEN 'week' THEN DATE_TRUNC('week', a.scheduled_at)::DATE
                WHEN 'month' THEN DATE_TRUNC('month', a.scheduled_at)::DATE
                ELSE DATE(a.scheduled_at)
            END AS period,
            COUNT(a.id) AS appointments_count,
            COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
            COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
            COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
            COALESCE(SUM(a.price), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS completed_revenue
        FROM appointments a
        WHERE a.shop_id = p_shop_id
            AND a.deleted_at IS NULL
            AND a.scheduled_at IS NOT NULL
            AND DATE(a.scheduled_at) >= p_from_date
            AND DATE(a.scheduled_at) <= p_to_date
        GROUP BY 
            CASE p_group_by
                WHEN 'day' THEN DATE(a.scheduled_at)
                WHEN 'week' THEN DATE_TRUNC('week', a.scheduled_at)::DATE
                WHEN 'month' THEN DATE_TRUNC('month', a.scheduled_at)::DATE
                ELSE DATE(a.scheduled_at)
            END
        ORDER BY period ASC
    ),
    previous_data AS (
        SELECT 
            SUM(CASE WHEN a.status IN ('completed', 'confirmed') THEN a.price ELSE 0 END) AS total_revenue,
            COUNT(a.id) AS appointments_count
        FROM appointments a
        WHERE a.shop_id = p_shop_id
            AND a.deleted_at IS NULL
            AND a.scheduled_at IS NOT NULL
            AND p_compare_to_previous = TRUE
            AND DATE(a.scheduled_at) >= v_previous_from_date
            AND DATE(a.scheduled_at) <= v_previous_to_date
    )
    SELECT 
        gp.period,
        CASE p_group_by
            WHEN 'week' THEN 'Week ' || EXTRACT(WEEK FROM gp.period)
            WHEN 'month' THEN TO_CHAR(gp.period, 'Mon YYYY')
            ELSE TO_CHAR(gp.period, 'DD/MM/YYYY')
        END AS group_label,
        gp.appointments_count,
        gp.completed_count,
        gp.cancelled_count,
        gp.no_show_count,
        gp.total_revenue,
        gp.completed_revenue,
        CASE WHEN gp.appointments_count > 0 
            THEN ROUND(gp.total_revenue / gp.appointments_count, 2)
            ELSE 0
        END AS avg_ticket_value,
        CASE WHEN gp.appointments_count > 0 
            THEN ROUND((gp.completed_count::NUMERIC / gp.appointments_count) * 100, 2)
            ELSE 0
        END AS completion_rate,
        CASE WHEN gp.appointments_count > 0 
            THEN ROUND((gp.no_show_count::NUMERIC / gp.appointments_count) * 100, 2)
            ELSE 0
        END AS no_show_rate,
        pd.total_revenue AS previous_period_revenue,
        pd.appointments_count AS previous_period_appointments,
        CASE WHEN pd.total_revenue > 0 
            THEN ROUND(((gp.completed_revenue - pd.total_revenue) / pd.total_revenue) * 100, 2)
            ELSE NULL
        END AS revenue_growth_rate,
        CASE WHEN pd.appointments_count > 0 
            THEN ROUND(((gp.appointments_count - pd.appointments_count)::NUMERIC / pd.appointments_count) * 100, 2)
            ELSE NULL
        END AS appointments_growth_rate
    FROM grouped_data gp
    LEFT JOIN previous_data pd ON TRUE
    ORDER BY gp.period;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. GET_APPOINTMENTS_REPORT
-- Report detalhado de agendamentos
-- =====================================================
CREATE OR REPLACE FUNCTION get_appointments_report(
    p_shop_id UUID,
    p_from_date DATE,
    p_to_date DATE,
    p_employee_id UUID DEFAULT NULL,
    p_service_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    appointment_id UUID,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    client_name TEXT,
    client_phone TEXT,
    employee_name TEXT,
    service_name TEXT,
    duration_minutes INTEGER,
    price DECIMAL,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    whatsapp_sent BOOLEAN,
    reminder_24h_sent BOOLEAN,
    reminder_2h_sent BOOLEAN,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS appointment_id,
        a.scheduled_at,
        c.name AS client_name,
        c.phone_number AS client_phone,
        e.name AS employee_name,
        s.name AS service_name,
        s.duration_minutes,
        a.price,
        a.status,
        a.created_at,
        a.whatsapp_sent,
        a.reminder_24h_sent,
        a.reminder_2h_sent,
        a.notes
    FROM appointments a
    INNER JOIN clients c ON a.client_id = c.id
    INNER JOIN employees e ON a.employee_id = e.id
    INNER JOIN services s ON a.service_id = s.id
    WHERE a.shop_id = p_shop_id
        AND a.deleted_at IS NULL
        AND DATE(a.scheduled_at) >= p_from_date
        AND DATE(a.scheduled_at) <= p_to_date
        AND (p_employee_id IS NULL OR a.employee_id = p_employee_id)
        AND (p_service_id IS NULL OR a.service_id = p_service_id)
        AND (p_status IS NULL OR a.status = p_status::VARCHAR)
    ORDER BY a.scheduled_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. GET_CLIENT_RETENTION_REPORT
-- Report de retenção de clientes
-- =====================================================
CREATE OR REPLACE FUNCTION get_client_retention_report(
    p_shop_id UUID,
    p_year INTEGER,
    p_month INTEGER DEFAULT NULL
)
RETURNS TABLE (
    year INTEGER,
    month INTEGER,
    period_label TEXT,
    total_clients BIGINT,
    new_clients BIGINT,
    returning_clients BIGINT,
    retention_rate NUMERIC,
    churn_rate NUMERIC,
    client_growth_rate NUMERIC,
    avg_days_between_visits NUMERIC,
    repeat_client_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH client_activity AS (
        SELECT 
            a.client_id,
            a.scheduled_at,
            FIRST_VALUE(a.created_at) OVER (PARTITION BY a.client_id ORDER BY a.created_at) AS first_appointment,
            ROW_NUMBER() OVER (PARTITION BY a.client_id ORDER BY a.created_at) AS visit_number
        FROM appointments a
        WHERE a.shop_id = p_shop_id
            AND a.deleted_at IS NULL
            AND a.scheduled_at IS NOT NULL
            AND a.status IN ('completed', 'confirmed')
    ),
    monthly_stats AS (
        SELECT 
            EXTRACT(YEAR FROM DATE(ca.scheduled_at))::INTEGER AS year,
            EXTRACT(MONTH FROM DATE(ca.scheduled_at))::INTEGER AS month,
            COUNT(DISTINCT ca.client_id) AS total_clients,
            COUNT(DISTINCT CASE WHEN ca.visit_number = 1 THEN ca.client_id END) AS new_clients,
            COUNT(DISTINCT CASE WHEN ca.visit_number > 1 THEN ca.client_id END) AS returning_clients,
            ARRAY_AGG(DISTINCT ca.client_id) AS active_clients
        FROM client_activity ca
        WHERE EXTRACT(YEAR FROM DATE(ca.scheduled_at)) = p_year
            AND (p_month IS NULL OR EXTRACT(MONTH FROM DATE(ca.scheduled_at)) = p_month)
        GROUP BY 
            EXTRACT(YEAR FROM DATE(ca.scheduled_at)),
            EXTRACT(MONTH FROM DATE(ca.scheduled_at))
    ),
    previous_month AS (
        SELECT 
            active_clients
        FROM monthly_stats
        WHERE (year, month) = (
            CASE 
                WHEN p_month = 1 THEN (p_year - 1, 12)
                ELSE (p_year, p_month - 1)
            END
        )
        LIMIT 1
    ),
    days_between_visits AS (
        SELECT 
            ca1.client_id,
            AVG(DATE_PART('day', ca2.scheduled_at - ca1.scheduled_at)) AS avg_days
        FROM client_activity ca1
        INNER JOIN client_activity ca2 ON 
            ca1.client_id = ca2.client_id 
            AND ca2.visit_number = ca1.visit_number + 1
        WHERE ca1.visit_number > 1
            AND EXTRACT(YEAR FROM DATE(ca1.scheduled_at)) = p_year
            AND (p_month IS NULL OR EXTRACT(MONTH FROM DATE(ca1.scheduled_at)) = p_month)
        GROUP BY ca1.client_id
    )
    SELECT 
        ms.year,
        ms.month,
        TO_CHAR(MAKE_DATE(ms.year, ms.month, 1), 'Mon YYYY') AS period_label,
        ms.total_clients,
        ms.new_clients,
        ms.returning_clients,
        ROUND(
            (ms.returning_clients::NUMERIC / NULLIF(ms.total_clients, 0)) * 100, 
            2
        ) AS retention_rate,
        ROUND(
            (ms.new_clients::NUMERIC / NULLIF(ms.total_clients, 0)) * 100, 
            2
        ) AS churn_rate,
        ROUND(
            CASE 
                WHEN pm.active_clients IS NOT NULL THEN
                    ((ms.total_clients - array_length(pm.active_clients, 1))::NUMERIC / NULLIF(array_length(pm.active_clients, 1), 0)) * 100
                ELSE NULL
            END, 
            2
        ) AS client_growth_rate,
        ROUND(AVG(dbv.avg_days), 2) AS avg_days_between_visits,
        ROUND(
            (COUNT(DISTINCT CASE WHEN dbv.avg_days <= 30 THEN dbv.client_id END)::NUMERIC / 
             NULLIF(COUNT(DISTINCT dbv.client_id), 0)) * 100,
            2
        ) AS repeat_client_rate
    FROM monthly_stats ms
    LEFT JOIN previous_month pm ON TRUE
    LEFT JOIN days_between_visits dbv ON TRUE
    ORDER BY ms.year, ms.month;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. GET_SERVICE_POPULARITY_REPORT
-- Report de popularidade de serviços
-- =====================================================
CREATE OR REPLACE FUNCTION get_service_popularity_report(
    p_shop_id UUID,
    p_from_date DATE,
    p_to_date DATE,
    p_sort_by TEXT DEFAULT 'revenue' -- 'revenue', 'count', 'completion_rate'
)
RETURNS TABLE (
    service_id UUID,
    service_name TEXT,
    duration_minutes INTEGER,
    base_price DECIMAL,
    appointment_count BIGINT,
    completed_count BIGINT,
    cancelled_count BIGINT,
    no_show_count BIGINT,
    total_revenue DECIMAL,
    completed_revenue DECIMAL,
    avg_price DECIMAL,
    completion_rate NUMERIC,
    no_show_rate NUMERIC,
    revenue_per_hour DECIMAL,
    percentile_revenue INTEGER,
    percentile_count INTEGER
) AS $$
DECLARE
    v_total_services BIGINT;
    v_total_revenue DECIMAL;
    v_total_appointments BIGINT;
BEGIN
    RETURN QUERY
    WITH service_stats AS (
        SELECT 
            s.id AS service_id,
            s.name AS service_name,
            s.duration_minutes,
            s.price AS base_price,
            COUNT(a.id) AS appointment_count,
            COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
            COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
            COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
            COALESCE(SUM(a.price), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS completed_revenue,
            AVG(a.price) AS avg_price
        FROM services s
        LEFT JOIN appointments a ON a.service_id = s.id
            AND a.shop_id = p_shop_id
            AND a.deleted_at IS NULL
            AND DATE(a.scheduled_at) >= p_from_date
            AND DATE(a.scheduled_at) <= p_to_date
        WHERE s.shop_id = p_shop_id
        GROUP BY s.id, s.name, s.duration_minutes, s.price
    ),
    totals AS (
        SELECT 
            COUNT(DISTINCT service_id) AS total_services,
            SUM(total_revenue) AS total_revenue,
            SUM(appointment_count) AS total_appointments
        FROM service_stats
    ),
    with_percentiles AS (
        SELECT 
            ss.*,
            PERCENT_RANK() OVER (ORDER BY ss.total_revenue) AS percentile_revenue,
            PERCENT_RANK() OVER (ORDER BY ss.appointment_count) AS percentile_count
        FROM service_stats ss
    )
    SELECT 
        ws.service_id,
        ws.service_name,
        ws.duration_minutes,
        ws.base_price,
        ws.appointment_count,
        ws.completed_count,
        ws.cancelled_count,
        ws.no_show_count,
        ws.total_revenue,
        ws.completed_revenue,
        ROUND(ws.avg_price, 2) AS avg_price,
        ROUND(
            (ws.completed_count::NUMERIC / NULLIF(ws.appointment_count, 0)) * 100,
            2
        ) AS completion_rate,
        ROUND(
            (ws.no_show_count::NUMERIC / NULLIF(ws.appointment_count, 0)) * 100,
            2
        ) AS no_show_rate,
        ROUND(
            (ws.completed_revenue / NULLIF(s.duration_minutes, 0)) * 60,
            2
        ) AS revenue_per_hour,
        ROUND(wp.percentile_revenue * 100) AS percentile_revenue,
        ROUND(wp.percentile_count * 100) AS percentile_count
    FROM with_percentiles wp
    JOIN WITH_totals t ON TRUE
    JOIN services s ON s.id = ws.service_id
    ORDER BY 
        CASE p_sort_by
            WHEN 'revenue' THEN ws.total_revenue
            WHEN 'count' THEN ws.appointment_count
            WHEN 'completion_rate' THEN ws.completed_count::NUMERIC / NULLIF(ws.appointment_count, 0)
            ELSE ws.total_revenue
        END DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. GET_EMPLOYEE_PERFORMANCE_REPORT
-- Report de performance de funcionários
-- =====================================================
CREATE OR REPLACE FUNCTION get_employee_performance_report(
    p_shop_id UUID,
    p_from_date DATE,
    p_to_date DATE,
    p_include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    employee_id UUID,
    employee_name TEXT,
    employee_role TEXT,
    is_active BOOLEAN,
    total_appointments BIGINT,
    completed_count BIGINT,
    cancelled_count BIGINT,
    no_show_count BIGINT,
    total_revenue DECIMAL,
    completed_revenue DECIMAL,
    avg_ticket_value DECIMAL,
    avg_price DECIMAL,
    completion_rate NUMERIC,
    no_show_rate NUMERIC,
    avg_appointments_per_day DECIMAL,
    revenue_per_hour DECIMAL,
    total_hours_worked DECIMAL,
    rank_by_revenue INTEGER,
    rank_by_appointments INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH employee_stats AS (
        SELECT 
            e.id AS employee_id,
            e.name AS employee_name,
            e.role AS employee_role,
            e.active AS is_active,
            COUNT(a.id) AS total_appointments,
            COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
            COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
            COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
            COALESCE(SUM(a.price), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS completed_revenue,
            AVG(a.price) AS avg_price,
            COALESCE(SUM(a.duration_minutes), 0) AS total_minutes
        FROM employees e
        LEFT JOIN appointments a ON a.employee_id = e.id
            AND a.shop_id = p_shop_id
            AND a.deleted_at IS NULL
            AND DATE(a.scheduled_at) >= p_from_date
            AND DATE(a.scheduled_at) <= p_to_date
        WHERE e.shop_id = p_shop_id
            AND (p_include_inactive OR e.active = TRUE)
            AND e.deleted_at IS NULL
        GROUP BY e.id, e.name, e.role, e.active
    ),
    with_ranks AS (
        SELECT 
            es.*,
            ROW_NUMBER() OVER (ORDER BY es.completed_revenue DESC) AS rank_by_revenue,
            ROW_NUMBER() OVER (ORDER BY es.completed_count DESC) AS rank_by_appointments
        FROM employee_stats es
    )
    SELECT 
        wr.employee_id,
        wr.employee_name,
        wr.employee_role,
        wr.is_active,
        wr.total_appointments,
        wr.completed_count,
        wr.cancelled_count,
        wr.no_show_count,
        wr.total_revenue,
        wr.completed_revenue,
        ROUND(
            CASE WHEN wr.completed_count > 0 
                THEN wr.completed_revenue / wr.completed_count 
                ELSE 0 
            END, 
            2
        ) AS avg_ticket_value,
        ROUND(wr.avg_price, 2) AS avg_price,
        ROUND(
            (wr.completed_count::NUMERIC / NULLIF(wr.total_appointments, 0)) * 100,
            2
        ) AS completion_rate,
        ROUND(
            (wr.no_show_count::NUMERIC / NULLIF(wr.total_appointments, 0)) * 100,
            2
        ) AS no_show_rate,
        ROUND(
            wr.total_appointments::NUMERIC / 
            NULLIF((p_to_date - p_from_date) + 1, 0),
            2
        ) AS avg_appointments_per_day,
        ROUND(
            (wr.completed_revenue / NULLIF(wr.total_minutes / 60, 0)),
            2
        ) AS revenue_per_hour,
        ROUND(wr.total_minutes::NUMERIC / 60, 2) AS total_hours_worked,
        wr.rank_by_revenue,
        wr.rank_by_appointments
    FROM with_ranks wr
    ORDER BY wr.completed_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. GET_NO_SHOW_REPORT
-- Report detalhado de no-show
-- =====================================================
CREATE OR REPLACE FUNCTION get_no_show_report(
    p_shop_id UUID,
    p_from_date DATE,
    p_to_date DATE,
    p_group_by TEXT DEFAULT 'day' -- 'day', 'week', 'employee', 'service'
)
RETURNS TABLE (
    group_value TEXT,
    group_label TEXT,
    date_value DATE,
    employee_name TEXT,
    service_name TEXT,
    total_appointments BIGINT,
    no_show_count BIGINT,
    no_show_rate NUMERIC,
    lost_revenue DECIMAL,
    client_count BIGINT,
    top_no_show_clients TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH no_show_data AS (
        SELECT 
            CASE p_group_by
                WHEN 'day' THEN DATE(a.scheduled_at)
                WHEN 'week' THEN DATE_TRUNC('week', a.scheduled_at)::DATE
                WHEN 'employee' THEN e.name
                WHEN 'service' THEN s.name
                ELSE DATE(a.scheduled_at)
            END AS group_value,
            DATE(a.scheduled_at) AS date_value,
            e.name AS employee_name,
            s.name AS service_name,
            COUNT(a.id) AS total_appointments,
            COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
            SUM(CASE WHEN a.status = 'no_show' THEN a.price ELSE 0 END) AS lost_revenue,
            COUNT(DISTINCT CASE WHEN a.status = 'no_show' THEN a.client_id END) AS client_count
        FROM appointments a
        INNER JOIN employees e ON a.employee_id = e.id
        INNER JOIN services s ON a.service_id = s.id
        WHERE a.shop_id = p_shop_id
            AND a.deleted_at IS NULL
            AND DATE(a.scheduled_at) >= p_from_date
            AND DATE(a.scheduled_at) <= p_to_date
        GROUP BY 
            CASE p_group_by
                WHEN 'day' THEN DATE(a.scheduled_at)
                WHEN 'week' THEN DATE_TRUNC('week', a.scheduled_at)::DATE
                WHEN 'employee' THEN e.name
                WHEN 'service' THEN s.name
                ELSE DATE(a.scheduled_at)
            END,
            DATE(a.scheduled_at),
            e.name,
            s.name
    ),
    with_clients AS (
        SELECT 
            nsd.*,
            ARRAY(
                SELECT DISTINCT c.name
                FROM appointments a2
                INNER JOIN clients c ON a2.client_id = c.id
                WHERE a2.shop_id = p_shop_id
                    AND a2.status = 'no_show'
                    AND (
                        (p_group_by = 'day' AND DATE(a2.scheduled_at) = nsd.date_value)
                        OR (p_group_by = 'week' AND DATE_TRUNC('week', a2.scheduled_at)::DATE = nsd.group_value)
                        OR (p_group_by = 'employee' AND EXISTS (
                            SELECT 1 FROM employees e2 
                            WHERE e2.name = nsd.employee_name 
                            AND a2.employee_id = e2.id
                        ))
                        OR (p_group_name = 'service' AND EXISTS (
                            SELECT 1 FROM services s2 
                            WHERE s2.name = nsd.service_name 
                            AND a2.service_id = s2.id
                        ))
                    )
                ORDER BY COUNT(*) DESC
                LIMIT 5
            ) AS top_no_show_clients
        FROM no_show_data nsd
    )
    SELECT 
        wc.group_value,
        CASE p_group_by
            WHEN 'week' THEN 'Week ' || EXTRACT(WEEK FROM wc.group_value)
            WHEN 'employee' THEN wc.group_value
            WHEN 'service' THEN wc.group_value
            ELSE TO_CHAR(wc.group_value, 'DD/MM/YYYY')
        END AS group_label,
        wc.date_value,
        wc.employee_name,
        wc.service_name,
        wc.total_appointments,
        wc.no_show_count,
        ROUND(
            (wc.no_show_count::NUMERIC / NULLIF(wc.total_appointments, 0)) * 100,
            2
        ) AS no_show_rate,
        wc.lost_revenue,
        wc.client_count,
        wc.top_no_show_clients
    FROM with_clients wc
    ORDER BY 
        CASE p_group_by
            WHEN 'day' THEN wc.date_value
            WHEN 'week' THEN wc.group_value
            WHEN 'employee' THEN wc.no_show_count
            WHEN 'service' THEN wc.no_show_count
            ELSE wc.no_show_count
        END DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. GET_PEAK_HOURS_REPORT
-- Report de horários de pico
-- =====================================================
CREATE OR REPLACE FUNCTION get_peak_hours_report(
    p_shop_id UUID,
    p_from_date DATE,
    p_to_date DATE
)
RETURNS TABLE (
    day_of_week INTEGER,
    day_name TEXT,
    hour INTEGER,
    hour_label TEXT,
    appointment_count BIGINT,
    completed_count BIGINT,
    revenue DECIMAL,
    avg_ticket_value DECIMAL,
    capacity_utilization NUMERIC,
    is_peak_time BOOLEAN,
    is_off_peak BOOLEAN
) AS $$
DECLARE
    v_max_appointments BIGINT;
    v_min_appointments BIGINT;
BEGIN
    -- Encontra o máximo e mínimo de agendamentos
    SELECT MAX(appointment_count), MIN(appointment_count)
    INTO v_max_appointments, v_min_appointments
    FROM mv_peak_times
    WHERE shop_id = p_shop_id;

    RETURN QUERY
    WITH hourly_data AS (
        SELECT 
            EXTRACT(DOW FROM a.scheduled_at)::INTEGER AS day_of_week,
            EXTRACT(HOUR FROM a.scheduled_at)::INTEGER AS hour,
            COUNT(a.id) AS appointment_count,
            COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
            SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END) AS revenue,
            AVG(a.price) AS avg_ticket_value
        FROM appointments a
        WHERE a.shop_id = p_shop_id
            AND a.deleted_at IS NULL
            AND DATE(a.scheduled_at) >= p_from_date
            AND DATE(a.scheduled_at) <= p_to_date
        GROUP BY 
            EXTRACT(DOW FROM a.scheduled_at),
            EXTRACT(HOUR FROM a.scheduled_at)
    )
    SELECT 
        hd.day_of_week,
        CASE hd.day_of_week
            WHEN 0 THEN 'Sunday'
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            WHEN 6 THEN 'Saturday'
        END AS day_name,
        hd.hour,
        LPAD(hd.hour::TEXT, 2, '0') || ':00 - ' || LPAD((hd.hour + 1)::TEXT, 2, '0') || ':00' AS hour_label,
        hd.appointment_count,
        hd.completed_count,
        hd.revenue,
        ROUND(hd.avg_ticket_value, 2) AS avg_ticket_value,
        ROUND(
            (hd.appointment_count::NUMERIC / NULLIF(v_max_appointments, 0)) * 100,
            2
        ) AS capacity_utilization,
        hd.appointment_count >= (v_max_appointments * 0.7) AS is_peak_time,
        hd.appointment_count <= (v_min_appointments * 1.5) AS is_off_peak
    FROM hourly_data hd
    ORDER BY hd.day_of_week, hd.hour;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. GET_CUSTOM_REPORT_METRICS
-- Função genérica para métricas customizadas
-- =====================================================
CREATE OR REPLACE FUNCTION get_custom_report_metrics(
    p_shop_id UUID,
    p_from_date DATE,
    p_to_date DATE,
    p_metrics TEXT[], -- Array de métricas solicitadas
    p_filters JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_label TEXT,
    metric_type TEXT,
    formatted_value TEXT
) AS $$
DECLARE
    v_metric TEXT;
    v_value NUMERIC;
    v_label TEXT;
    v_type TEXT;
    v_formatted TEXT;
BEGIN
    FOREACH v_metric IN ARRAY p_metrics
    LOOP
        v_value := 0;
        v_label := v_metric;
        v_type := 'number';
        v_formatted := '0';

        CASE v_metric
            WHEN 'total_revenue' THEN
                SELECT COALESCE(SUM(a.price), 0)
                INTO v_value
                FROM appointments a
                WHERE a.shop_id = p_shop_id
                    AND a.deleted_at IS NULL
                    AND DATE(a.scheduled_at) >= p_from_date
                    AND DATE(a.scheduled_at) <= p_to_date
                    AND a.status = 'completed';
                
                v_label := 'Total Revenue';
                v_type := 'currency';
                v_formatted := 'R$ ' || TO_CHAR(v_value, 'FM999,999,990.00');

            WHEN 'total_appointments' THEN
                SELECT COUNT(a.id)
                INTO v_value
                FROM appointments a
                WHERE a.shop_id = p_shop_id
                    AND a.deleted_at IS NULL
                    AND DATE(a.scheduled_at) >= p_from_date
                    AND DATE(a.scheduled_at) <= p_to_date;
                
                v_label := 'Total Appointments';
                v_type := 'count';
                v_formatted := TO_CHAR(v_value, 'FM999,999,999');

            WHEN 'avg_ticket_value' THEN
                SELECT AVG(a.price)
                INTO v_value
                FROM appointments a
                WHERE a.shop_id = p_shop_id
                    AND a.deleted_at IS NULL
                    AND DATE(a.scheduled_at) >= p_from_date
                    AND DATE(a.scheduled_at) <= p_to_date
                    AND a.status = 'completed';
                
                v_value := COALESCE(v_value, 0);
                v_label := 'Avg Ticket Value';
                v_type := 'currency';
                v_formatted := 'R$ ' || TO_CHAR(v_value, 'FM999,999,990.00');

            WHEN 'no_show_rate' THEN
                SELECT 
                    (COUNT(CASE WHEN a.status = 'no_show' THEN 1 END)::NUMERIC / 
                     NULLIF(COUNT(a.id), 0)) * 100
                INTO v_value
                FROM appointments a
                WHERE a.shop_id = p_shop_id
                    AND a.deleted_at IS NULL
                    AND DATE(a.scheduled_at) >= p_from_date
                    AND DATE(a.scheduled_at) <= p_to_date;
                
                v_value := COALESCE(v_value, 0);
                v_label := 'No-Show Rate';
                v_type := 'percentage';
                v_formatted := TO_CHAR(v_value, 'FM999.00') || '%';

            WHEN 'completion_rate' THEN
                SELECT 
                    (COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::NUMERIC / 
                     NULLIF(COUNT(a.id), 0)) * 100
                INTO v_value
                FROM appointments a
                WHERE a.shop_id = p_shop_id
                    AND a.deleted_at IS NULL
                    AND DATE(a.scheduled_at) >= p_from_date
                    AND DATE(a.scheduled_at) <= p_to_date;
                
                v_value := COALESCE(v_value, 0);
                v_label := 'Completion Rate';
                v_type := 'percentage';
                v_formatted := TO_CHAR(v_value, 'FM999.00') || '%';

            WHEN 'total_clients' THEN
                SELECT COUNT(DISTINCT a.client_id)
                INTO v_value
                FROM appointments a
                WHERE a.shop_id = p_shop_id
                    AND a.deleted_at IS NULL
                    AND DATE(a.scheduled_at) >= p_from_date
                    AND DATE(a.scheduled_at) <= p_to_date;
                
                v_label := 'Total Clients';
                v_type := 'count';
                v_formatted := TO_CHAR(v_value, 'FM999,999,999');

            WHEN 'new_clients' THEN
                SELECT COUNT(DISTINCT a.client_id)
                INTO v_value
                FROM appointments a
                WHERE a.shop_id = p_shop_id
                    AND a.deleted_at IS NULL
                    AND DATE(a.scheduled_at) >= p_from_date
                    AND DATE(a.scheduled_at) <= p_to_date
                    ANDNOT EXISTS (
                        SELECT 1 FROM appointments a2
                        WHERE a2.client_id = a.client_id
                            AND a2.created_at < a.created_at
                    );
                
                v_label := 'New Clients';
                v_type := 'count';
                v_formatted := TO_CHAR(v_value, 'FM999,999,999');

            ELSE
                v_label := 'Unknown Metric';
        END CASE;

        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES HELPER
-- =====================================================

-- Função para calcular growth rate
CREATE OR REPLACE FUNCTION calculate_growth_rate(
    p_current NUMERIC,
    p_previous NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    IF p_previous = 0 OR p_previous IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN ROUND(((p_current - p_previous) / p_previous) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Função para calcular percentil
CREATE OR REPLACE FUNCTION calculate_percentile(
    p_value NUMERIC,
    p_values NUMERIC[]
)
RETURNS NUMERIC AS $$
DECLARE
    v_count INTEGER;
    v_below_count INTEGER;
BEGIN
    v_count := array_length(p_values, 1);
    v_below_count := 0;

    IF v_count IS NULL OR v_count = 0 THEN
        RETURN 0;
    END IF;

    FOR i IN 1..v_count LOOP
        IF p_values[i] < p_value THEN
            v_below_count := v_below_count + 1;
        END IF;
    END LOOP;

    RETURN ROUND((v_below_count::NUMERIC / v_count) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Função para formatar valor baseado no tipo
CREATE OR REPLACE FUNCTION format_metric_value(
    p_value NUMERIC,
    p_metric_type TEXT
)
RETURNS TEXT AS $$
BEGIN
    CASE p_metric_type
        WHEN 'currency' THEN
            RETURN 'R$ ' || TO_CHAR(p_value, 'FM999,999,990.00');
        WHEN 'percentage' THEN
            RETURN TO_CHAR(p_value, 'FM999.00') || '%';
        WHEN 'count' THEN
            RETURN TO_CHAR(p_value, 'FM999,999,999');
        ELSE
            RETURN TO_CHAR(p_value, 'FM999,999,999.00');
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TESTE E VALIDAÇÃO
-- =====================================================

-- Testes podem ser executados assim:
-- SELECT * FROM get_revenue_report(
--     '<shop_uuid>'::UUID,
--     '2024-01-01'::DATE,
--     '2024-01-31'::DATE,
--     TRUE,
--     'day'
-- );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION get_revenue_report IS 'Report de receita com comparação de período anterior';
COMMENT ON FUNCTION get_appointments_report IS 'Report detalhado de agendamentos com filtros';
COMMENT ON FUNCTION get_client_retention_report IS 'Report de retenção de clientes por período';
COMMENT ON FUNCTION get_service_popularity_report IS 'Report de popularidade de serviços ordenável';
COMMENT ON FUNCTION get_employee_performance_report IS 'Report de performance de funcionários com ranking';
COMMENT ON FUNCTION get_no_show_report IS 'Report detalhado de no-show com múltiplos agrupamentos';
COMMENT ON FUNCTION get_peak_hours_report IS 'Report de horários de pico com identificação de rush hours';
COMMENT ON FUNCTION get_custom_report_metrics IS 'Função genérica para métricas customizadas';
