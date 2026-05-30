-- =====================================================
-- BarberZap - Reports Audit Tables (FASE 4)
-- =====================================================
-- Prioridade: 2
-- Justificativa: Auditoria completa de execução de reports
-- Tempo estimado: 1-2 horas
-- =====================================================

-- =====================================================
-- 1. REPORT_RUNS_LOG
-- Log de todas as execuções de reports
-- =====================================================
CREATE TABLE IF NOT EXISTS report_runs_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL,
    
    -- Identificação
    report_type VARCHAR(100) NOT NULL, -- 'revenue', 'appointments', 'retention', etc
    report_name VARCHAR(255),
    
    -- Parâmetros
    from_date DATE,
    to_date DATE,
    parameters JSONB DEFAULT '{}', -- Filtros adicionais
    
    -- Execução
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER, -- Tempo de execução em milissegundos
    status VARCHAR(50) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    
    -- Resultados
    row_count INTEGER DEFAULT 0, -- Quantidade de linhas retornadas
    file_url TEXT, -- URL do arquivo gerado (se exportado)
    file_format VARCHAR(20), -- 'json', 'csv', 'excel', 'pdf'
    file_size_bytes BIGINT,
    
    -- Usuário
    user_id UUID,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    ip_address INET,
    
    -- Erros
    error_message TEXT,
    error_code VARCHAR(50),
    error_details JSONB,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_report_runs_log_shop 
    ON report_runs_log(shop_id, started_at DESC);

CREATE INDEX idx_report_runs_log_type 
    ON report_runs_log(shop_id, report_type, started_at DESC);

CREATE INDEX idx_report_runs_log_status 
    ON report_runs_log(status, started_at DESC);

CREATE INDEX idx_report_runs_log_user 
    ON report_runs_log(user_id, started_at DESC);

CREATE INDEX idx_report_runs_log_date_range 
    ON report_runs_log(shop_id, from_date, to_date);

-- Partição por mês para performance (opcional)
-- CREATE TABLE report_runs_log_y2024m01 PARTITION OF report_runs_log
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- =====================================================
-- 2. SCHEDULED_REPORTS
-- Configurações de reports agendados
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL,
    
    -- Configuração
    report_type VARCHAR(100) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Schedule
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    schedule_cron VARCHAR(100), -- Expressão cron customizada
    schedule_config JSONB DEFAULT '{}', -- Configurações adicionais do schedule
    
    -- Parâmetros do report
    parameters JSONB NOT NULL DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    
    -- Destinatários
    recipients JSONB NOT NULL, -- Array de emails: [{email, name, role}]
    subject_template TEXT, -- Template do assunto do email
    message_template TEXT, -- Template da mensagem
    
    -- Formato
    format VARCHAR(20) DEFAULT 'pdf' CHECK (format IN ('json', 'csv', 'excel', 'pdf')),
    include_charts BOOLEAN DEFAULT TRUE,
    include_summary BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    -- Metadados
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_scheduled_reports_shop 
    ON scheduled_reports(shop_id, is_active, next_run_at);

CREATE INDEX idx_scheduled_reports_type 
    ON scheduled_reports(shop_id, report_type, is_active);

CREATE INDEX idx_scheduled_reports_next_run 
    ON scheduled_reports(next_run_at) WHERE is_active = TRUE;

CREATE INDEX idx_scheduled_reports_deleted 
    ON scheduled_reports(shop_id, deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 3. SCHEDULED_REPORTS_HISTORY
-- Histórico de execuções de reports agendados
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_reports_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(id),
    shop_id UUID NOT NULL,
    
    -- Execução
    run_id UUID UNIQUE, -- ID único desta execução
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Quando estava agendado
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Status
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    
    -- Resultados
    row_count INTEGER,
    file_url TEXT,
    file_format VARCHAR(20),
    file_size_bytes BIGINT,
    
    -- Envio
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_to JSONB, -- Array de emails enviados
    sent_status VARCHAR(50), -- 'sent', 'partial', 'failed'
    send_error TEXT,
    
    -- Snapshot dos parâmetros usados
    parameters_snapshot JSONB,
    report_snapshot JSONB, -- Resumo dos dados do report
    
    -- Erros
    error_message TEXT,
    error_code VARCHAR(50),
    error_details JSONB,
    
    -- Retentativas
    retry_count INTEGER DEFAULT 0,
    retry_at TIMESTAMP WITH TIME ZONE,
    max_retries INTEGER DEFAULT 3,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_scheduled_reports_history_scheduled 
    ON scheduled_reports_history(scheduled_report_id, scheduled_at DESC);

CREATE INDEX idx_scheduled_reports_history_shop 
    ON scheduled_reports_history(shop_id, scheduled_at DESC);

CREATE INDEX idx_scheduled_reports_history_status 
    ON scheduled_reports_history(status, scheduled_at);

CREATE INDEX idx_scheduled_reports_history_run_id 
    ON scheduled_reports_history(run_id);

-- =====================================================
-- 4. REPORT_TEMPLATES
-- Templates de reports customizados
-- =====================================================
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID, -- NULL = template global
    
    -- Identificação
    template_name VARCHAR(255) NOT NULL,
    template_code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Configuração
    base_query TEXT, -- Query SQL base (opcional)
    parameters_schema JSONB, -- Schema dos parâmetros aceitos
    default_parameters JSONB DEFAULT '{}',
    
    -- Layout
    columns JSONB, -- Definição das colunas [{key, label, type, width, format}]
    group_by JSONB, -- Configurações de agrupamento
    sort_by JSONB, -- Configurações de ordenação
    
    -- Visualização
    charts JSONB, -- Configurações de gráficos [{type, dataField, title, color}]
    summary_metrics JSONB, -- Métricas de resumo para exibir no topo
    
    -- Template de email (para scheduled reports)
    email_subject_template TEXT,
    email_body_template TEXT,
    
    -- Status
    is_public BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    category VARCHAR(100), -- 'revenue', 'appointments', 'clients', 'employees', etc
    
    -- Metadados
    created_by UUID,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_report_templates_shop 
    ON report_templates(shop_id, is_active);

CREATE INDEX idx_report_templates_code 
    ON report_templates(template_code);

CREATE INDEX idx_report_templates_category 
    ON report_templates(shop_id, category, is_active);

-- =====================================================
-- 5. REPORT_EXPORTS
-- Registro de exports de reports
-- =====================================================
CREATE TABLE IF NOT EXISTS report_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL,
    
    -- Referência
    report_run_id UUID REFERENCES report_runs_log(id),
    scheduled_report_history_id UUID REFERENCES scheduled_reports_history(id),
    
    -- Configuração do export
    export_type VARCHAR(20) NOT NULL CHECK (export_type IN ('json', 'csv', 'excel', 'pdf', 'png', 'svg')),
    file_name TEXT,
    file_path TEXT,
    file_url TEXT,
    file_size_bytes BIGINT,
    
    -- Parâmetros do export
    export_options JSONB DEFAULT '{}', -- {format, includeHeaders, fontSize, etc}
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Download
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Data de expiração do link
    
    -- Erros
    error_message TEXT,
    error_details JSONB,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_report_exports_shop 
    ON report_exports(shop_id, created_at DESC);

CREATE INDEX idx_report_exports_run 
    ON report_exports(report_run_id);

CREATE INDEX idx_report_exports_scheduled 
    ON report_exports(scheduled_report_history_id);

CREATE INDEX idx_report_exports_status 
    ON report_exports(status, created_at);

CREATE INDEX idx_report_exports_expires 
    ON report_exports(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- 6. REPORT_ACCESS_LOG
-- Log de acesso/dowload de reports
-- =====================================================
CREATE TABLE IF NOT EXISTS report_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL,
    
    -- Referência
    report_run_id UUID REFERENCES report_runs_log(id),
    report_export_id UUID REFERENCES report_exports(id),
    scheduled_report_id UUID REFERENCES scheduled_reports(id),
    
    -- Ação
    action VARCHAR(50) NOT NULL, -- 'view', 'download', 'export', 'share', 'email'
    resource_type VARCHAR(50), -- 'report_run', 'export', 'scheduled_report'
    resource_id UUID,
    
    -- Usuário
    user_id UUID,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Detalhes
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_report_access_log_shop 
    ON report_access_log(shop_id, created_at DESC);

CREATE INDEX idx_report_access_log_user 
    ON report_access_log(user_id, created_at DESC);

CREATE INDEX idx_report_access_log_resource 
    ON report_access_log(resource_type, resource_id, created_at DESC);

CREATE INDEX idx_report_access_log_action 
    ON report_access_log(action, created_at DESC);

-- =====================================================
-- 7. REPORT_METRICS_CACHE
-- Cache de métricas calculadas para performance
-- =====================================================
CREATE TABLE IF NOT EXISTS report_metrics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL,
    
    -- Chave do cache
    cache_key TEXT NOT NULL UNIQUE, -- Composto por shop_id, metric_type, date_range, etc
    
    -- Dados cacheados
    metric_type VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_data JSONB, -- Dados estruturados para reports complexos
    
    -- Parâmetros que geraram o cache
    from_date DATE,
    to_date DATE,
    parameters_hash TEXT, -- Hash dos parâmetros para validação
    
    -- Controle de expiração
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_report_metrics_cache_key 
    ON report_metrics_cache(cache_key);

CREATE INDEX idx_report_metrics_cache_shop 
    ON report_metrics_cache(shop_id, metric_type, is_valid);

CREATE INDEX idx_report_metrics_cache_expires 
    ON report_metrics_cache(expires_at) WHERE is_valid = TRUE;

-- Índice GIN para busca no JSONB
CREATE INDEX idx_report_metrics_cache_data 
    ON report_metrics_cache USING GIN(metric_data);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at em scheduled_reports
CREATE OR REPLACE FUNCTION update_scheduled_reports_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scheduled_reports_updated_at
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_reports_updated_at();

-- Update version em report_templates
CREATE OR REPLACE FUNCTION update_report_templates_version()
RETURNS trigger AS $$
BEGIN
    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
        NEW.updated_at = NOW();
        NEW.version := OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_report_templates_version
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_report_templates_version();

-- Calcular duração em report_runs_log
CREATE OR REPLACE FUNCTION calculate_report_runs_duration()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL THEN
        NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
        NEW.duration_ms := ROUND(NEW.duration_ms);
    ELSIF NEW.status = 'failed' AND NEW.completed_at IS NOT NULL THEN
        NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
        NEW.duration_ms := ROUND(NEW.duration_ms);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_report_runs_duration
    BEFORE UPDATE ON report_runs_log
    FOR EACH ROW
    EXECUTE FUNCTION calculate_report_runs_duration();

-- Calcular duração em scheduled_reports_history
CREATE OR REPLACE FUNCTION calculate_scheduled_history_duration()
RETURNS trigger AS $$
BEGIN
    IF NEW.status IN ('completed', 'failed') AND NEW.completed_at IS NOT NULL THEN
        NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
        NEW.duration_ms := ROUND(NEW.duration_ms);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scheduled_history_duration
    BEFORE UPDATE ON scheduled_reports_history
    FOR EACH ROW
    EXECUTE FUNCTION calculate_scheduled_history_duration();

-- =====================================================
-- FUNÇÕES HELPER PARA AUDITORIA
-- =====================================================

-- Função para log de execução de report
CREATE OR REPLACE FUNCTION log_report_run(
    p_shop_id UUID,
    p_report_type VARCHAR,
    p_report_name VARCHAR DEFAULT NULL,
    p_from_date DATE DEFAULT NULL,
    p_to_date DATE DEFAULT NULL,
    p_parameters JSONB DEFAULT '{}',
    p_user_id UUID DEFAULT NULL,
    p_user_name VARCHAR DEFAULT NULL,
    p_user_email VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_run_id UUID;
BEGIN
    INSERT INTO report_runs_log (
        shop_id,
        report_type,
        report_name,
        from_date,
        to_date,
        parameters,
        user_id,
        user_name,
        user_email,
        status
    ) VALUES (
        p_shop_id,
        p_report_type,
        p_report_name,
        p_from_date,
        p_to_date,
        p_parameters,
        p_user_id,
        p_user_name,
        p_user_email,
        'running'
    ) RETURNING id INTO v_run_id;

    RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;

-- Função para finalizar log de execução (success)
CREATE OR REPLACE FUNCTION complete_report_run(
    p_run_id UUID,
    p_row_count INTEGER DEFAULT 0,
    p_file_url TEXT DEFAULT NULL,
    p_file_format VARCHAR DEFAULT NULL,
    p_file_size_bytes BIGINT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE report_runs_log
    SET 
        completed_at = NOW(),
        status = 'completed',
        row_count = p_row_count,
        file_url = p_file_url,
        file_format = p_file_format,
        file_size_bytes = p_file_size_bytes
    WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- Função para finalizar log de execução (error)
CREATE OR REPLACE FUNCTION fail_report_run(
    p_run_id UUID,
    p_error_message TEXT,
    p_error_code VARCHAR DEFAULT NULL,
    p_error_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE report_runs_log
    SET 
        completed_at = NOW(),
        status = 'failed',
        error_message = p_error_message,
        error_code = p_error_code,
        error_details = p_error_details
    WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar acesso
CREATE OR REPLACE FUNCTION log_report_access(
    p_shop_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_user_name VARCHAR DEFAULT NULL,
    p_user_email VARCHAR DEFAULT NULL,
    p_user_role VARCHAR DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO report_access_log (
        shop_id,
        action,
        resource_type,
        resource_id,
        user_id,
        user_name,
        user_email,
        user_role,
        ip_address,
        user_agent
    ) VALUES (
        p_shop_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_user_id,
        p_user_name,
        p_user_email,
        p_user_role,
        p_ip_address,
        p_user_agent
    );
END;
$$ LANGUAGE plpgsql;

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_metrics_cache()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM report_metrics_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para invalidar cache
CREATE OR REPLACE FUNCTION invalidate_metrics_cache(
    p_shop_id UUID,
    p_metric_type VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM report_metrics_cache
    WHERE shop_id = p_shop_id
        AND is_valid = TRUE
        AND (p_metric_type IS NULL OR metric_type = p_metric_type);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- JOBS DE MANUTENÇÃO (via pg_cron)
-- =====================================================

-- Limpar exports expirados diariamente às 04:00
SELECT cron.schedule(
    'clean-expired-report-exports',
    '0 4 * * *',
    $$
    DELETE FROM report_exports
    WHERE expires_at < NOW();
    $$
) WHERE cron.job_name = 'clean-expired-report-exports'::name IS NULL;

-- Limpar cache expirado a cada 6 horas
SELECT cron.schedule(
    'clean-expired-metrics-cache',
    '0 */6 * * *',
    $$
    SELECT clean_expired_metrics_cache();
    $$
) WHERE cron.job_name = 'clean-expired-metrics-cache'::name IS NULL;

-- Arquivar logs antigos (manter 90 dias) semanalmente
SELECT cron.schedule(
    'archive-old-report-logs',
    '0 3 * * 0',
    $$
    DELETE FROM report_runs_log
    WHERE created_at < NOW() - INTERVAL '90 days'
      AND status != 'running';
    
    DELETE FROM report_access_log
    WHERE created_at < NOW() - INTERVAL '90 days';
    $$
) WHERE cron.job_name = 'archive-old-report-logs'::name IS NULL;

-- =====================================================
-- VIEWS PARA CONSULTAS DE AUDITORIA
-- =====================================================

-- View para resumo de uso de reports
CREATE OR REPLACE VIEW v_report_usage_summary AS
SELECT 
    shop_id,
    report_type,
    DATE(created_at) AS report_date,
    COUNT(*) AS total_runs,
    COUNT(DISTINCT user_id) AS unique_users,
    AVG(duration_ms) AS avg_duration_ms,
    SUM(row_count) AS total_rows,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS successful_runs,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_runs,
    ROUND(
        (COUNT(CASE WHEN status = 'completed' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(*), 0)) * 100,
        2
    ) AS success_rate,
    COUNT(DISTINCT file_url) FILTER (WHERE file_url IS NOT NULL) AS exports_generated
FROM report_runs_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY shop_id, report_type, DATE(created_at)
ORDER BY shop_id, report_date DESC;

-- View para status de scheduled reports
CREATE OR REPLACE VIEW v_scheduled_reports_status AS
SELECT 
    sr.id,
    sr.shop_id,
    sr.report_type,
    sr.report_name,
    sr.schedule_type,
    sr.is_active,
    sr.next_run_at,
    sr.last_run_at,
    sr.run_count,
    sr.success_count,
    sr.failure_count,
    ROUND(
        (sr.success_count::NUMERIC / NULLIF(sr.run_count, 0)) * 100,
        2
    ) AS success_rate,
    COUNT(CASE WHEN srh.status = 'pending' THEN 1 END) AS pending_runs,
    COUNT(CASE WHEN srh.status = 'running' THEN 1 END) AS running_runs,
    COUNT(CASE WHEN srh.status = 'failed' THEN 1 END) AS recent_failures
FROM scheduled_reports sr
LEFT JOIN scheduled_reports_history srh ON sr.id = srh.scheduled_report_id 
    AND srh.scheduled_at >= NOW() - INTERVAL '7 days'
GROUP BY sr.id
ORDER BY sr.shop_id, sr.next_run_at;

-- =====================================================
-- COMENTÁRIOS NA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE report_runs_log IS 'Log de todas as execuções manuais de reports';
COMMENT ON TABLE scheduled_reports IS 'Configurações de reports agendados automaticamente';
COMMENT ON TABLE scheduled_reports_history IS 'Histórico de execuções dos reports agendados';
COMMENT ON TABLE report_templates IS 'Templates customizados de reports';
COMMENT ON TABLE report_exports IS 'Registro de exports/downloads de reports';
COMMENT ON TABLE report_access_log IS 'Log completo de acessos e downloads de reports';
COMMENT ON TABLE report_metrics_cache IS 'Cache de métricas calculadas para performance';

COMMENT ON FUNCTION log_report_run IS 'Inicia um novo log de execução de report';
COMMENT ON FUNCTION complete_report_run ISMarca execução como concluída com sucesso';
COMMENT ON FUNCTION fail_report_run IS 'Marcar execução como falha com detalhes do erro';
COMMENT ON FUNCTION log_report_access IS 'Registrar acesso/download de report';
COMMENT ON FUNCTION clean_expired_metrics_cache IS 'Limpar entradas de cache expiradas';
COMMENT ON FUNCTION invalidate_metrics_cache IS 'Invalidar cache de métricas por shop ou tipo';
