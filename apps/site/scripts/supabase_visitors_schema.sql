-- Schema do banco de dados para sistema de tracking de visitantes
-- Tabelas para armazenar dados de visitantes e estatísticas

-- Tabela principal de visitantes
CREATE TABLE visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    is_new_visitor BOOLEAN DEFAULT FALSE,
    is_new_session BOOLEAN DEFAULT FALSE,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    session_duration INTEGER DEFAULT 0, -- em milissegundos
    page_views INTEGER DEFAULT 1,
    current_url TEXT,
    referrer TEXT,
    ip_address INET,
    country VARCHAR(100),
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    browser VARCHAR(50),
    browser_version VARCHAR(50),
    user_agent TEXT,
    device VARCHAR(50),
    operating_system VARCHAR(50),
    screen_resolution VARCHAR(20),
    language VARCHAR(10),
    timezone VARCHAR(100),
    java_enabled BOOLEAN DEFAULT FALSE,
    cookies_enabled BOOLEAN DEFAULT TRUE,
    online_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para otimização
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_session_id (session_id),
    INDEX idx_timestamp (timestamp DESC),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_country (country),
    INDEX idx_device (device),
    INDEX idx_browser (browser),
    INDEX idx_event_type (event_type)
);

-- Tabela de estatísticas agregadas
CREATE TABLE visitor_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_visitors BIGINT DEFAULT 0,
    total_sessions BIGINT DEFAULT 0,
    total_page_views BIGINT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Restrição para garantir apenas um registro
    CONSTRAINT single_row CHECK (id = 1)
);

-- Tabela de controle de sessões ativas
CREATE TABLE active_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    visitor_id VARCHAR(100) NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page_views INTEGER DEFAULT 1,
    current_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_last_activity (last_activity DESC)
);

-- Tabela de dispositivos únicos por visitante
CREATE TABLE visitor_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id VARCHAR(100) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device VARCHAR(50),
    browser VARCHAR(50),
    operating_system VARCHAR(50),
    screen_resolution VARCHAR(20),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_device_fingerprint (device_fingerprint),
    UNIQUE(visitor_id, device_fingerprint)
);

-- Tabela de localizações únicas
CREATE TABLE visitor_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id VARCHAR(100) NOT NULL,
    country VARCHAR(100),
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    ip_address INET,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_country (country),
    INDEX idx_city (city)
);

-- Tabela de eventos de página (page views detalhados)
CREATE TABLE page_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    time_on_page INTEGER DEFAULT 0, -- em segundos
    scroll_depth INTEGER DEFAULT 0, -- percentual
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_session_id (session_id),
    INDEX idx_timestamp (timestamp DESC),
    INDEX idx_page_url (page_url)
);

-- Views úteis para análises

-- View de visitantes únicos por dia
CREATE OR REPLACE VIEW daily_visitors AS
SELECT 
    DATE(created_at) as visit_date,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(*) as total_visits,
    COUNT(DISTINCT session_id) as unique_sessions
FROM visitors 
WHERE event_type = 'page_view'
GROUP BY DATE(created_at)
ORDER BY visit_date DESC;

-- View de estatísticas por país
CREATE OR REPLACE VIEW country_stats AS
SELECT 
    country,
    country_code,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(*) as total_visits,
    COUNT(DISTINCT session_id) as unique_sessions
FROM visitors 
WHERE event_type = 'page_view'
GROUP BY country, country_code
ORDER BY unique_visitors DESC;

-- View de estatísticas por dispositivo
CREATE OR REPLACE VIEW device_stats AS
SELECT 
    device,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(*) as total_visits,
    COUNT(DISTINCT session_id) as unique_sessions
FROM visitors 
WHERE event_type = 'page_view'
GROUP BY device
ORDER BY unique_visitors DESC;

-- View de estatísticas por navegador
CREATE OR REPLACE VIEW browser_stats AS
SELECT 
    browser,
    browser_version,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(*) as total_visits
FROM visitors 
WHERE event_type = 'page_view'
GROUP BY browser, browser_version
ORDER BY unique_visitors DESC;

-- View de sessões recentes
CREATE OR REPLACE VIEW recent_sessions AS
SELECT 
    session_id,
    visitor_id,
    MAX(timestamp) as last_activity,
    COUNT(*) as total_events,
    MAX(current_url) as last_url,
    MAX(country) as country,
    MAX(city) as city,
    MAX(device) as device
FROM visitors
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY session_id, visitor_id
ORDER BY last_activity DESC;

-- Função para limpar sessões antigas
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
BEGIN
    DELETE FROM active_sessions 
    WHERE last_activity < NOW() - INTERVAL '30 minutes';
    
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas
CREATE OR REPLACE FUNCTION update_visitor_stats()
RETURNS INTEGER AS $$
DECLARE
    total_visitors BIGINT;
    total_sessions BIGINT;
    total_page_views BIGINT;
BEGIN
    SELECT COUNT(DISTINCT visitor_id) INTO total_visitors FROM visitors;
    SELECT COUNT(DISTINCT session_id) INTO total_sessions FROM visitors;
    SELECT COUNT(*) INTO total_page_views FROM visitors WHERE event_type = 'page_view';
    
    INSERT INTO visitor_stats (id, total_visitors, total_sessions, total_page_views, last_updated)
    VALUES (1, total_visitors, total_sessions, total_page_views, NOW())
    ON CONFLICT (id) DO UPDATE SET
        total_visitors = EXCLUDED.total_visitors,
        total_sessions = EXCLUDED.total_sessions,
        total_page_views = EXCLUDED.total_page_views,
        last_updated = EXCLUDED.last_updated;
    
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- Dados iniciais
INSERT INTO visitor_stats (id, total_visitors, total_sessions, total_page_views, last_updated)
VALUES (1, 0, 0, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Permissões (ajuste conforme necessário)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Comentários para documentação
COMMENT ON TABLE visitors IS 'Tabela principal de registros de visitantes';
COMMENT ON TABLE visitor_stats IS 'Tabela de estatísticas agregadas de visitantes';
COMMENT ON TABLE active_sessions IS 'Tabela de controle de sessões ativas';
COMMENT ON TABLE visitor_devices IS 'Tabela de dispositivos únicos por visitante';
COMMENT ON TABLE visitor_locations IS 'Tabela de localizações únicas por visitante';
COMMENT ON TABLE page_events IS 'Tabela de eventos detalhados de página';

COMMENT ON VIEW daily_visitors IS 'View de visitantes únicos por dia';
COMMENT ON VIEW country_stats IS 'View de estatísticas por país';
COMMENT ON VIEW device_stats IS 'View de estatísticas por dispositivo';
COMMENT ON VIEW browser_stats IS 'View de estatísticas por navegador';
COMMENT ON VIEW recent_sessions IS 'View de sessões recentes';