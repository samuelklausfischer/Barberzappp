-- ============================================
-- BarberZap - Performance Metrics Tables
-- ============================================
-- 
-- Tabelas para armazenamento de métricas de performance
-- para monitoramento, análise e otimização.
--
-- Features:
-- - Request metrics por endpoint
-- - Query metrics com tempo de execução
-- - Cache metrics para análise de hit rate
-- - Component render metrics para React
-- - Retenção de 30 dias
-- - Agregação após 7 dias
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgstattuple;

-- ============================================
-- 1. Request Metrics
-- ============================================

CREATE TABLE IF NOT EXISTS performance_request_metrics (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identifiers
    request_id UUID NOT NULL,
    shop_id UUID REFERENCES shops(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    
    -- Timing metrics
    duration_ms FLOAT NOT NULL,
    status_code INTEGER NOT NULL,
    
    -- Size metrics
    request_size_bytes BIGINT,
    response_size_bytes BIGINT,
    
    -- Performance indicators
    is_slow BOOLEAN DEFAULT FALSE,
    slow_reason VARCHAR(100),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT performance_request_metrics_check CHECK (duration_ms >= 0)
);

-- Indexes for efficient queries
CREATE INDEX idx_request_metrics_endpoint ON performance_request_metrics(endpoint);
CREATE INDEX idx_request_metrics_shop_id ON performance_request_metrics(shop_id) WHERE shop_id IS NOT NULL;
CREATE INDEX idx_request_metrics_timestamp ON performance_request_metrics(timestamp DESC);
CREATE INDEX idx_request_metrics_duration ON performance_request_metrics(duration_ms DESC);
CREATE INDEX idx_request_metrics_slow ON performance_request_metrics(is_slow) WHERE is_slow = TRUE;
CREATE INDEX idx_request_metrics_endpoint_time ON performance_request_metrics(endpoint, timestamp DESC);

-- Composite index for percentiles calculation
CREATE INDEX idx_request_metrics_endpoint_duration ON performance_request_metrics(endpoint, duration_ms);

-- ============================================
-- 2. Query Metrics
-- ============================================

CREATE TABLE IF NOT EXISTS performance_query_metrics (
    id BIGSERIAL PRIMARY KEY,
    
    -- Query identifiers
    query_hash VARCHAR(64) NOT NULL,
    query_preview TEXT NOT NULL,
    query_normalized TEXT NOT NULL,
    query_type VARCHAR(20) NOT NULL,  -- SELECT, INSERT, UPDATE, DELETE
    
    -- Metrics
    duration_ms FLOAT NOT NULL,
    rows_affected INTEGER,
    rows_scanned INTEGER,
    
    -- Performance analysis
    is_slow BOOLEAN DEFAULT FALSE,
    is_sequential_scan BOOLEAN DEFAULT FALSE,
    
    -- Execution plan (compressed JSONB)
    execution_plan JSONB,
    
    -- Index recommendations
    suggested_indexes TEXT[],
    
    -- N+1 detection
    n_plus_one_group_id VARCHAR(64),
    is_n_plus_one_query BOOLEAN DEFAULT FALSE,
    
    -- Context
    endpoint VARCHAR(255),
    request_id UUID,
    shop_id UUID REFERENCES shops(id),
    
    -- Timestamp
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT performance_query_metrics_check CHECK (duration_ms >= 0),
    CONSTRAINT performance_query_metrics_check_type CHECK (query_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'OTHER'))
);

-- Indexes
CREATE INDEX idx_query_metrics_hash ON performance_query_metrics(query_hash);
CREATE INDEX idx_query_metrics_duration ON performance_query_metrics(duration_ms DESC);
CREATE INDEX idx_query_metrics_timestamp ON performance_query_metrics(timestamp DESC);
CREATE INDEX idx_query_metrics_slow ON performance_query_metrics(is_slow) WHERE is_slow = TRUE;
CREATE INDEX idx_query_metrics_endpoint ON performance_query_metrics(endpoint) WHERE endpoint IS NOT NULL;
CREATE INDEX idx_query_metrics_type ON performance_query_metrics(query_type);
CREATE INDEX idx_query_metrics_n_plus_one ON performance_query_metrics(n_plus_one_group_id) WHERE n_plus_one_group_id IS NOT NULL;

-- ============================================
-- 3. Cache Metrics
-- ============================================

CREATE TABLE IF NOT EXISTS performance_cache_metrics (
    id BIGSERIAL PRIMARY KEY,
    
    -- Cache key pattern
    key_pattern VARCHAR(255) NOT NULL,
    
    -- Metrics
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    hit_rate FLOAT GENERATED ALWAYS AS (
        CASE 
            WHEN hit_count + miss_count = 0 THEN 0
            ELSE hit_count::FLOAT / (hit_count + miss_count)
        END
    ) STORED,
    
    -- Size
    total_key_size_bytes BIGINT DEFAULT 0,
    total_value_size_bytes BIGINT DEFAULT 0,
    
    -- Evictions
    eviction_count INTEGER DEFAULT 0,
    
    -- Context
    cache_name VARCHAR(100) DEFAULT 'default',
    shop_id UUID REFERENCES shops(id),
    
    -- Time window
    time_window_start TIMESTAMPTZ,
    time_window_end TIMESTAMPTZ,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cache_metrics_pattern ON performance_cache_metrics(key_pattern);
CREATE INDEX idx_cache_metrics_cache_name ON performance_cache_metrics(cache_name);
CREATE INDEX idx_cache_metrics_time_window ON performance_cache_metrics(time_window_start, time_window_end);
CREATE INDEX idx_cache_metrics_shop_id ON performance_cache_metrics(shop_id) WHERE shop_id IS NOT NULL;

-- ============================================
-- 4. Component Render Metrics
-- ============================================

CREATE TABLE IF NOT EXISTS performance_component_metrics (
    id BIGSERIAL PRIMARY KEY,
    
    -- Component identifiers
    component_name VARCHAR(255) NOT NULL,
    component_id VARCHAR(255) NOT NULL,
    render_id UUID NOT NULL,
    
    -- Render metrics
    render_type VARCHAR(20) NOT NULL,  -- mount, update
    actual_duration_ms FLOAT NOT NULL,
    base_duration_ms FLOAT,
    
    -- Counters
    mount_count INTEGER DEFAULT 0,
    update_count INTEGER DEFAULT 0,
    
    -- Performance indicators
    is_slow_render BOOLEAN DEFAULT FALSE,
    
    -- Frame metrics
    exceeded_frame_budget BOOLEAN DEFAULT FALSE,
    wasted_ms FLOAT GENERATED ALWAYS AS (
        GREATEST(0, actual_duration_ms - 16.67)  -- 16.67ms = 60fps
    ) STORED,
    
    -- Context
    endpoint VARCHAR(255),
    user_id UUID,
    shop_id UUID REFERENCES shops(id),
    
    -- Timestamp
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT performance_component_metrics_check CHECK (actual_duration_ms >= 0),
    CONSTRAINT performance_component_metrics_check_type CHECK (render_type IN ('mount', 'update'))
);

-- Indexes
CREATE INDEX idx_component_metrics_name ON performance_component_metrics(component_name);
CREATE INDEX idx_component_metrics_duration ON performance_component_metrics(actual_duration_ms DESC);
CREATE INDEX idx_component_metrics_timestamp ON performance_component_metrics(timestamp DESC);
CREATE INDEX idx_component_metrics_slow ON performance_component_metrics(is_slow_render) WHERE is_slow_render = TRUE;
CREATE INDEX idx_component_metrics_shop_id ON performance_component_metrics(shop_id) WHERE shop_id IS NOT NULL;

-- ============================================
-- 5. Performance Alerts
-- ============================================

CREATE TABLE IF NOT EXISTS performance_alerts (
    id BIGSERIAL PRIMARY KEY,
    
    -- Alert identifiers
    alert_id UUID NOT NULL DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    
    -- Thresholds
    threshold_name VARCHAR(100),
    current_value FLOAT,
    threshold_value FLOAT,
    
    -- Alert content
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    
    -- Context
    endpoint VARCHAR(255),
    shop_id UUID REFERENCES shops(id),
    request_id UUID,
    
    -- Status
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(100),
    resolution_notes TEXT,
    
    -- Notifications
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels TEXT[] DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT performance_alerts_check_severity CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Indexes
CREATE INDEX idx_alerts_type ON performance_alerts(alert_type);
CREATE INDEX idx_alerts_severity ON performance_alerts(severity);
CREATE INDEX idx_alerts_created_at ON performance_alerts(created_at DESC);
CREATE INDEX idx_alerts_shop_id ON performance_alerts(shop_id) WHERE shop_id IS NOT NULL;
CREATE INDEX idx_alerts_resolved ON performance_alerts(is_resolved) WHERE is_resolved = FALSE;

-- ============================================
-- 6. Flame Graph Data
-- ============================================

CREATE TABLE IF NOT EXISTS performance_flamegraph_data (
    id BIGSERIAL PRIMARY KEY,
    
    -- Capture identifiers
    capture_id UUID NOT NULL DEFAULT gen_random_uuid(),
    
    -- Stack data (compressed JSONB)
    stack_frames JSONB NOT NULL,
    
    -- Metrics
    total_duration_ms FLOAT NOT NULL,
    sample_count INTEGER NOT NULL,
    capture_duration_seconds FLOAT,
    
    -- Context
    endpoint VARCHAR(255),
    shop_id UUID REFERENCES shops(id),
    pid INTEGER,
    
    -- Timestamp
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Retention (flame graphs use more space, keep shorter)
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- Indexes
CREATE INDEX idx_flamegraph_capture ON performance_flamegraph_data(capture_id);
CREATE INDEX idx_flamegraph_captured_at ON performance_flamegraph_data(captured_at DESC);
CREATE INDEX idx_flamegraph_expires ON performance_flamegraph_data(expires_at);

-- ============================================
-- Materialized Views for Aggregated Metrics
-- ============================================

-- Daily request metrics by endpoint
CREATE MATERIALIZED VIEW performance_daily_endpoint_metrics AS
SELECT
    DATE(timestamp) as date,
    endpoint,
    COUNT(*) as request_count,
    AVG(duration_ms) as avg_duration_ms,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms) as p50_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration_ms,
    MIN(duration_ms) as min_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    SUM(CASE WHEN is_slow THEN 1 ELSE 0 END) as slow_count,
    AVG(status_code) as avg_status_code,
    AVG(request_size_bytes) as avg_request_size_bytes,
    AVG(response_size_bytes) as avg_response_size_bytes
FROM performance_request_metrics
GROUP BY DATE(timestamp), endpoint
WITH DATA;

CREATE UNIQUE INDEX idx_daily_endpoint_metrics_unique 
    ON performance_daily_endpoint_metrics(date, endpoint);

-- Daily query metrics
CREATE MATERIALIZED VIEW performance_daily_query_metrics AS
SELECT
    DATE(timestamp) as date,
    query_hash,
    query_preview,
    query_type,
    COUNT(*) as execution_count,
    AVG(duration_ms) as avg_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    SUM(CASE WHEN is_slow THEN 1 ELSE 0 END) as slow_count,
    SUM(rows_affected) as total_rows_affected,
    SUM(rows_scanned) as total_rows_scanned
FROM performance_query_metrics
GROUP BY DATE(timestamp), query_hash, query_preview, query_type
WITH DATA;

CREATE UNIQUE INDEX idx_daily_query_metrics_unique 
    ON performance_daily_query_metrics(date, query_hash);

-- Hourly cache metrics (for hit rate tracking over time)
CREATE MATERIALIZED VIEW performance_hourly_cache_metrics AS
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    key_pattern,
    cache_name,
    SUM(hit_count) as total_hits,
    SUM(miss_count) as total_misses,
    SUM(hit_count)::FLOAT / NULLIF(SUM(hit_count + miss_count), 0) as hit_rate,
    COUNT(*) as samples
FROM performance_cache_metrics
GROUP BY DATE_TRUNC('hour', created_at), key_pattern, cache_name
WITH DATA;

CREATE UNIQUE INDEX idx_hourly_cache_metrics_unique 
    ON performance_hourly_cache_metrics(hour, key_pattern, cache_name);

-- ============================================
-- Functions for Percentile Calculation
-- ============================================

-- Get percentile values for an endpoint over a time period
CREATE OR REPLACE FUNCTION get_endpoint_percentiles(
    p_endpoint VARCHAR,
    p_percentile FLOAT,
    p_start TIMESTAMPTZ,
    p_end TIMESTAMPTZ
) RETURNS FLOAT AS $$
DECLARE
    v_result FLOAT;
BEGIN
    SELECT PERCENTILE_CONT(p_percentile) WITHIN GROUP (ORDER BY duration_ms)
    INTO v_result
    FROM performance_request_metrics
    WHERE endpoint = p_endpoint
      AND timestamp BETWEEN p_start AND p_end;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Get top N slowest endpoints
CREATE OR REPLACE FUNCTION get_slow_endpoints(
    p_limit INTEGER DEFAULT 10,
    p_hours INTEGER DEFAULT 24
) RETURNS TABLE (
    endpoint VARCHAR,
    request_count BIGINT,
    avg_duration_ms FLOAT,
    max_duration_ms FLOAT,
    p95_duration_ms FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        endpoint,
        COUNT(*) as request_count,
        AVG(duration_ms) as avg_duration_ms,
        MAX(duration_ms) as max_duration_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms
    FROM performance_request_metrics
    WHERE timestamp > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY endpoint
    ORDER BY avg_duration_ms DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get top N slowest queries
CREATE OR REPLACE FUNCTION get_slow_queries(
    p_limit INTEGER DEFAULT 20,
    p_hours INTEGER DEFAULT 24
) RETURNS TABLE (
    query_hash VARCHAR,
    query_preview TEXT,
    query_type VARCHAR,
    execution_count BIGINT,
    avg_duration_ms FLOAT,
    max_duration_ms FLOAT,
    total_duration_ms FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        query_hash,
        query_preview,
        query_type,
        COUNT(*) as execution_count,
        AVG(duration_ms) as avg_duration_ms,
        MAX(duration_ms) as max_duration_ms,
        SUM(duration_ms) as total_duration_ms
    FROM performance_query_metrics
    WHERE timestamp > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY query_hash, query_preview, query_type
    ORDER BY avg_duration_ms DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Maintenance Functions
-- ============================================

-- Refresh materialized views
CREATE OR REPLACE FUNCTION refresh_performance_metrics() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY performance_daily_endpoint_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY performance_daily_query_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY performance_hourly_cache_metrics;
END;
$$ LANGUAGE plpgsql;

-- Archive old data (older than retention period)
CREATE OR REPLACE FUNCTION archive_old_performance_data(p_retention_days INTEGER DEFAULT 30) RETURNS BIGINT AS $$
DECLARE
    v_archived_count BIGINT := 0;
BEGIN
    -- Archive request metrics
    WITH archived AS (
        DELETE FROM performance_request_metrics
        WHERE timestamp < NOW() - (p_retention_days || ' days')::INTERVAL
        RETURNING *
    )
    INSERT INTO performance_request_metrics_archive
    SELECT * FROM archived;
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    
    -- Archive query metrics
    WITH archived AS (
        DELETE FROM performance_query_metrics
        WHERE timestamp < NOW() - (p_retention_days || ' days')::INTERVAL
        RETURNING *
    )
    INSERT INTO performance_query_metrics_archive
    SELECT * FROM archived;
    
    -- Clean up expired flame graph data
    DELETE FROM performance_flamegraph_data
    WHERE expires_at < NOW();
    
    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Archive Tables (for historical data)
-- ============================================

-- Request metrics archive
CREATE TABLE IF NOT EXISTS performance_request_metrics_archive (
    LIKE performance_request_metrics INCLUDING ALL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_request_metrics_archive_timestamp 
    ON performance_request_metrics_archive(timestamp DESC);
CREATE INDEX idx_request_metrics_archive_archived_at 
    ON performance_request_metrics_archive(archived_at DESC);

-- Query metrics archive
CREATE TABLE IF NOT EXISTS performance_query_metrics_archive (
    LIKE performance_query_metrics INCLUDING ALL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_query_metrics_archive_timestamp 
    ON performance_query_metrics_archive(timestamp DESC);
CREATE INDEX idx_query_metrics_archive_archived_at 
    ON performance_query_metrics_archive(archived_at DESC);

-- ============================================
-- Triggers for Auto-Updating
-- ============================================

-- Update updated_at on cache metrics
CREATE OR REPLACE FUNCTION update_cache_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cache_metrics_updated_at
    BEFORE UPDATE ON performance_cache_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_cache_metrics_updated_at();

-- ============================================
-- Schedules for Maintenance
-- ============================================

-- Configure pg_cron for automated maintenance (if available)
-- Uncomment if pg_cron is installed
-- SELECT cron.schedule('refresh_performance_metrics', '*/15 * * * *', 'SELECT refresh_performance_metrics()');
-- SELECT cron.schedule('archive_performance_data', '0 2 * * *', 'SELECT archive_old_performance_data(30)');

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant access for application user (adjust user name as needed)
-- GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO barber_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO barber_user;

-- ============================================
-- Initial Data / Configuration
-- ============================================

-- Config table for profiler settings
CREATE TABLE IF NOT EXISTS performance_profiler_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default config values
INSERT INTO performance_profiler_config (key, value, description) VALUES
    ('profiler_enabled', 'true', 'Enable/disable performance profiler'),
    ('sampling_rate', '0.1', 'Sampling rate for request profiling (0.0 - 1.0)'),
    ('slow_request_threshold_ms', '500', 'Threshold for marking requests as slow'),
    ('slow_query_threshold_ms', '100', 'Threshold for marking queries as slow'),
    ('cache_hit_rate_warning_threshold', '0.7', 'Cache hit rate threshold for warnings'),
    ('retention_days', '30', 'Number of days to retain detailed metrics'),
    ('alert_slack_enabled', 'false', 'Enable Slack notifications for alerts'),
    ('alert_email_enabled', 'false', 'Enable email notifications for alerts')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Final Notes
-- ============================================
--
-- Migration steps:
-- 1. Run this script to create all tables and indexes
-- 2. Configure pg_cron for automated maintenance (optional)
-- 3. Ensure pg_stat_statements is enabled in postgresql.conf:
--    shared_preload_libraries = 'pg_stat_statements'
-- 4. Update application to write to these tables
-- 5. Set up backup for archive tables
--
-- Performance considerations:
-- - Materialized views are refreshed every 15 minutes by default
-- - Old data is archived after retention_days (default 30 days)
-- - Flame graph data expires after 7 days
-- - Use CONCURRENTLY for refreshes to avoid blocking
--
-- For monitoring:
-- - Query performance_daily_endpoint_metrics for endpoint health
-- - Query performance_daily_query_metrics for query performance
-- - Query performance_hourly_cache_metrics for cache health
-- - Query performance_alerts for active issues
-- ============================================
