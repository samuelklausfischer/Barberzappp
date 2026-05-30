-- Schema do banco de dados para integração Supabase-GitHub
-- Tabelas para gerenciar autenticação, deployments e monitoramento

-- Tabela de usuários
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    github_id VARCHAR(50) UNIQUE NOT NULL,
    github_username VARCHAR(100) NOT NULL,
    github_email VARCHAR(255),
    github_token TEXT, -- Token criptografado
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_github_id (github_id),
    INDEX idx_github_username (github_username)
);

-- Tabela de deployments
CREATE TABLE deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deployment_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository VARCHAR(255) NOT NULL,
    branch VARCHAR(100) DEFAULT 'main',
    framework VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    environment_variables JSONB DEFAULT '{}',
    supabase_project_id VARCHAR(100),
    github_webhook_id VARCHAR(100),
    enable_automatic_deployments BOOLEAN DEFAULT TRUE,
    build_command TEXT,
    start_command TEXT,
    dockerfile_content TEXT,
    deployed_at TIMESTAMP WITH TIME ZONE,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_user_id (user_id),
    INDEX idx_repository (repository),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at DESC)
);

-- Tabela de logs de deployment
CREATE TABLE deployment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deployment_id VARCHAR(100) NOT NULL REFERENCES deployments(deployment_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    level VARCHAR(20) DEFAULT 'info',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_deployment_id (deployment_id),
    INDEX idx_timestamp (timestamp DESC)
);

-- Tabela de OAuth states (para validação CSRF)
CREATE TABLE oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_state (state),
    INDEX idx_created_at (created_at)
);

-- Tabela de webhooks recebidos
CREATE TABLE webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    repository VARCHAR(255) NOT NULL,
    branch VARCHAR(100),
    commit_sha VARCHAR(100),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_event_type (event_type),
    INDEX idx_repository (repository),
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at DESC)
);

-- Tabela de builds
CREATE TABLE builds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deployment_id VARCHAR(100) NOT NULL REFERENCES deployments(deployment_id) ON DELETE CASCADE,
    build_number INTEGER NOT NULL,
    commit_sha VARCHAR(100),
    commit_message TEXT,
    commit_author VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    error_message TEXT,
    build_logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_deployment_id (deployment_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at DESC)
);

-- Tabela de variáveis de ambiente criptografadas
CREATE TABLE encrypted_env_vars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deployment_id VARCHAR(100) NOT NULL REFERENCES deployments(deployment_id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_deployment_id (deployment_id),
    INDEX idx_key_name (key_name),
    UNIQUE(deployment_id, key_name)
);

-- Tabela de métricas de deployment
CREATE TABLE deployment_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deployment_id VARCHAR(100) NOT NULL REFERENCES deployments(deployment_id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_deployment_id (deployment_id),
    INDEX idx_metric_name (metric_name),
    INDEX idx_timestamp (timestamp DESC)
);

-- Views úteis para análises

-- View de deployments ativos
CREATE OR REPLACE VIEW active_deployments AS
SELECT 
    d.*,
    u.github_username,
    u.github_email,
    COUNT(DISTINCT b.id) as total_builds,
    MAX(b.completed_at) as last_build_completed
FROM deployments d
JOIN users u ON d.user_id = u.id
LEFT JOIN builds b ON d.deployment_id = b.deployment_id
WHERE d.status IN ('running', 'building', 'deploying')
GROUP BY d.id, u.github_username, u.github_email;

-- View de estatísticas por framework
CREATE OR REPLACE VIEW framework_stats AS
SELECT 
    framework,
    COUNT(*) as total_deployments,
    COUNT(CASE WHEN status = 'running' THEN 1 END) as running_deployments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_deployments,
    AVG(CASE WHEN duration_seconds > 0 THEN duration_seconds END) as avg_build_time,
    MAX(created_at) as last_deployment
FROM deployments
LEFT JOIN builds ON deployments.deployment_id = builds.deployment_id
GROUP BY framework
ORDER BY total_deployments DESC;

-- View de atividade recente
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'deployment' as activity_type,
    d.deployment_id as activity_id,
    d.repository,
    d.framework,
    d.status,
    u.github_username,
    d.created_at as timestamp,
    'New deployment created' as description
FROM deployments d
JOIN users u ON d.user_id = u.id
WHERE d.created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'build' as activity_type,
    b.id::text as activity_id,
    d.repository,
    d.framework,
    b.status,
    u.github_username,
    b.created_at as timestamp,
    CONCAT('Build #', b.build_number, ' ', b.status) as description
FROM builds b
JOIN deployments d ON b.deployment_id = d.deployment_id
JOIN users u ON d.user_id = u.id
WHERE b.created_at >= NOW() - INTERVAL '7 days'

ORDER BY timestamp DESC;

-- Funções auxiliares

-- Função para limpar estados OAuth antigos
CREATE OR REPLACE FUNCTION cleanup_old_oauth_states()
RETURNS INTEGER AS $$
BEGIN
    DELETE FROM oauth_states 
    WHERE created_at < NOW() - INTERVAL '10 minutes';
    
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular métricas de deployment
CREATE OR REPLACE FUNCTION calculate_deployment_metrics(p_deployment_id VARCHAR)
RETURNS TABLE(metric_name VARCHAR, metric_value DECIMAL, metric_unit VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'build_time'::VARCHAR as metric_name,
        AVG(duration_seconds)::DECIMAL as metric_value,
        'seconds'::VARCHAR as metric_unit
    FROM builds 
    WHERE deployment_id = p_deployment_id AND duration_seconds > 0
    
    UNION ALL
    
    SELECT 
        'deployment_count'::VARCHAR,
        COUNT(*)::DECIMAL,
        'count'::VARCHAR
    FROM deployments 
    WHERE deployment_id = p_deployment_id;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encrypted_env_vars_updated_at BEFORE UPDATE ON encrypted_env_vars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais
INSERT INTO deployments (deployment_id, user_id, repository, branch, framework, status, created_at, updated_at)
VALUES ('system-init', '00000000-0000-0000-0000-000000000000', 'system/initialization', 'main', 'system', 'running', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Permissões (ajuste conforme necessário)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT SELECT ON views TO anon;

-- Comentários para documentação
COMMENT ON TABLE users IS 'Tabela de usuários autenticados via GitHub';
COMMENT ON TABLE deployments IS 'Tabela de deployments gerenciados pelo sistema';
COMMENT ON TABLE deployment_logs IS 'Logs de atividades dos deployments';
COMMENT ON TABLE oauth_states IS 'Estados OAuth para proteção CSRF';
COMMENT ON TABLE webhook_events IS 'Eventos de webhook recebidos do GitHub';
COMMENT ON TABLE builds IS 'Informações de builds individuais';
COMMENT ON TABLE encrypted_env_vars IS 'Variáveis de ambiente criptografadas';
COMMENT ON TABLE deployment_metrics IS 'Métricas de performance dos deployments';

COMMENT ON VIEW active_deployments IS 'Deployments ativos no momento';
COMMENT ON VIEW framework_stats IS 'Estatísticas agregadas por framework';
COMMENT ON VIEW recent_activity IS 'Atividade recente do sistema';