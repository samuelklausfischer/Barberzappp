-- =====================================================
-- BarberZap - Full-Text Search Implementation (FASE 3.5)
-- =====================================================
-- Prioridade: 3.5
-- Justificativa: Busca inteligente em clientes, appointments, history
-- Tempo estimado: 4-6 horas
-- =====================================================

-- =====================================================
-- EXTENSÕES NECESSÁRIAS
-- =====================================================

-- Extensão para full-text search (já habilitada com UUID)
-- GIN indexes para busca eficiente
-- pg_trgm para fuzzy search (similaridade de strings)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- 1. TABELA DE ANALYTICS DE BUSCA
-- =====================================================

CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  user_id UUID,
  query TEXT NOT NULL,
  query_type VARCHAR(50) DEFAULT 'global' CHECK (query_type IN ('clients', 'appointments', 'history', 'global', 'suggestions')),
  results_count INTEGER DEFAULT 0,
  results_ids UUID[],  -- IDs dos resultados encontrados
  clicked_id UUID,  -- ID do resultado clicado
  click_position INTEGER,  -- Posição do resultado clicado
  duration_ms INTEGER,  -- Tempo de execução da busca
  filters JSONB,  -- Filtros aplicados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- Para analytics agregados
);

CREATE INDEX idx_search_analytics_shop ON search_analytics(shop_id);
CREATE INDEX idx_search_analytics_user ON search_analytics(user_id);
CREATE INDEX idx_search_analytics_query ON search_analytics USING GIN(to_tsvector('portuguese', query));
CREATE INDEX idx_search_analytics_query_trgm ON search_analytics USING GIN(query gin_trgm_ops);
CREATE INDEX idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX idx_search_analytics_type ON search_analytics(query_type);
CREATE INDEX idx_search_analytics_zero_results ON search_analytics(shop_id, results_count) WHERE results_count = 0;

-- =====================================================
-- 2. ÍNDICES GIN PARA CLIENTS
-- =====================================================

-- Full-text search em clientes (nome, email, telefone, tags)
CREATE INDEX IF NOT EXISTS idx_clients_search_gin ON clients
  USING GIN(to_tsvector('portuguese', 
    COALESCE(name, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(phone_number, '') || ' ' || 
    COALESCE(instagram, '') || ' ' || 
    COALESCE(notes, '') || ' ' || 
    COALESCE(array_to_string(tags, ' '), '')
  ));

-- Trigram index para fuzzy search
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients
  USING GIN(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm ON clients
  USING GIN(phone_number gin_trgm_ops);

-- =====================================================
-- 3. ÍNDICES GIN PARA APPOINTMENTS
-- =====================================================

-- Full-text search em appointments (notas)
CREATE INDEX IF NOT EXISTS idx_appointments_search_gin ON appointments
  USING GIN(to_tsvector('portuguese', 
    COALESCE(notes, '') || ' ' || 
    COALESCE(status, '')
  ));

-- =====================================================
-- 4. ÍNDICES COMPOSTOS PARA BUSCA GLOBAL
-- =====================================================

-- Para buscar appointments + clientes juntos
CREATE INDEX IF NOT EXISTS idx_appointments_shop_status ON appointments(shop_id, status, scheduled_at DESC);

-- =====================================================
-- 5. TABELA DE SEARCH HISTORY (RECENT SEARCHES)
-- =====================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  query_type VARCHAR(50) DEFAULT 'global',
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, user_id, query)
);

CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_shop_user ON search_history(shop_id, user_id, last_searched_at DESC);
CREATE INDEX idx_search_history_query ON search_history USING GIN(to_tsvector('portuguese', query));
CREATE INDEX idx_search_history_query_trgm ON search_history USING GIN(query gin_trgm_ops);

-- =====================================================
-- 6. FUNÇÕES DE BUSCA
-- =====================================================

-- -----------------------------------------------------
-- Busca Clientes com Fuzzy Matching e Highlights
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION search_clients(
  p_shop_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_status VARCHAR DEFAULT NULL,
  p_min_visits INTEGER DEFAULT NULL,
  p_max_visits INTEGER DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  rank FLOAT,
  similarity FLOAT,
  highlights JSONB,
  client JSONB
) AS $$
DECLARE
  v_tsquery tsquery;
  v_trigram_threshold FLOAT := 0.3; -- Similaridade mínima para fuzzy search
BEGIN
  -- Prepara a query/tsquery
  v_tsquery := plainto_tsquery('portuguese', p_query);
  
  -- Se query vazia, retorna clientes recentes
  IF p_query IS NULL OR LENGTH(TRIM(p_query)) < 2 THEN
    RETURN QUERY
    SELECT 
      c.id::UUID,
      0.0::FLOAT,
      1.0::FLOAT,
      '{}'::JSONB,
      to_jsonb(c)
    FROM clients c
    WHERE c.shop_id = p_shop_id 
      AND c.deleted_at IS NULL
      AND (p_status IS NULL OR (
        CASE WHEN p_status = 'active' THEN c.last_visit_at > NOW() - INTERVAL '90 days'
             WHEN p_status = 'inactive' THEN c.last_visit_at IS NULL OR c.last_visit_at <= NOW() - INTERVAL '90 days'
             ELSE TRUE
        END
      ))
      AND (p_min_visits IS NULL OR c.total_visits >= p_min_visits)
      AND (p_max_visits IS NULL OR c.total_visits <= p_max_visits)
    ORDER BY c.last_visit_at DESC NULLS LAST, c.created_at DESC
    LIMIT p_limit OFFSET p_offset;
    RETURN;
  END IF;
  
  -- Busca full-text + fuzzy matching
  RETURN QUERY
  SELECT 
    c.id::UUID,
    COALESCE(ts_rank(c.tsv, v_tsquery), 0.0) +
    (COALESCE(similarity(LOWER(c.name), LOWER(p_query)), 0.0) * 0.5) +
    (CASE WHEN LOWER(c.phone_number) LIKE '%' || LOWER(p_query) || '%' THEN 0.3 ELSE 0.0 END) as rank,
    GREATEST(
      COALESCE(similarity(LOWER(c.name), LOWER(p_query)), 0.0),
      COALESCE(similarity(LOWER(c.phone_number), LOWER(p_query)), 0.0),
      COALESCE(similarity(LOWER(c.email), LOWER(p_query)), 0.0)
    ) as similarity,
    jsonb_build_object(
      'name', ts_headline('portuguese', c.name, v_tsquery, 'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=TRUE'),
      'email', CASE WHEN LOWER(c.email) LIKE '%' || LOWER(p_query) || '%' THEN 
        ts_headline('portuguese', c.email, v_tsquery, 'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=TRUE')
        ELSE c.email END,
      'phone', CASE WHEN LOWER(c.phone_number) LIKE '%' || LOWER(p_query) || '%' THEN 
        ts_headline('portuguese', c.phone_number, v_tsquery, 'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=TRUE')
        ELSE c.phone_number END
    ) as highlights,
    to_jsonb(c)
  FROM (
    SELECT 
      c.*,
      to_tsvector('portuguese', 
        COALESCE(c.name, '') || ' ' || 
        COALESCE(c.email, '') || ' ' || 
        COALESCE(c.phone_number, '') || ' ' || 
        COALESCE(c.instagram, '') || ' ' || 
        COALESCE(c.notes, '') || ' ' || 
        COALESCE(array_to_string(c.tags, ' '), '')
      ) as tsv
    FROM clients c
    WHERE c.shop_id = p_shop_id 
      AND c.deleted_at IS NULL
      AND (
        c.tsv @@ v_tsquery  -- Full-text match
        OR similarity(LOWER(c.name), LOWER(p_query)) >= v_trigram_threshold  -- Fuzzy name match
        OR LOWER(c.phone_number) LIKE '%' || LOWER(p_query) || '%'  -- Partial phone match
        OR LOWER(c.email) LIKE '%' || LOWER(p_query) || '%'  -- Partial email match
      )
      AND (p_status IS NULL OR (
        CASE WHEN p_status = 'active' THEN c.last_visit_at > NOW() - INTERVAL '90 days'
             WHEN p_status = 'inactive' THEN c.last_visit_at IS NULL OR c.last_visit_at <= NOW() - INTERVAL '90 days'
             ELSE TRUE
        END
      ))
      AND (p_min_visits IS NULL OR c.total_visits >= p_min_visits)
      AND (p_max_visits IS NULL OR c.total_visits <= p_max_visits)
  ) c
  ORDER BY 
    rank DESC,
    c.last_visit_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Busca Appointments
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION search_appointments(
  p_shop_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_employee_id UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  rank FLOAT,
  highlights JSONB,
  appointment JSONB,
  client JSONB
) AS $$
DECLARE
  v_tsquery tsquery;
BEGIN
  -- Prepara a query/tsquery
  v_tsquery := plainto_tsquery('portuguese', p_query);
  
  -- Se query vazia, retorna appointments recentes
  IF p_query IS NULL OR LENGTH(TRIM(p_query)) < 2 THEN
    RETURN QUERY
    SELECT 
      a.id::UUID,
      0.0::FLOAT,
      '{}'::JSONB,
      to_jsonb(a),
      to_jsonb(c)
    FROM appointments a
    INNER JOIN clients c ON a.client_id = c.id
    WHERE a.shop_id = p_shop_id
      AND (p_status IS NULL OR a.status = p_status)
      AND (p_date_from IS NULL OR a.scheduled_at >= p_date_from)
      AND (p_date_to IS NULL OR a.scheduled_at <= p_date_to)
      AND (p_employee_id IS NULL OR a.employee_id = p_employee_id)
    ORDER BY a.scheduled_at DESC
    LIMIT p_limit OFFSET p_offset;
    RETURN;
  END IF;
  
  -- Busca full-text em appointments +相关信息 nos clientes
  RETURN QUERY
  SELECT 
    a.id::UUID,
    COALESCE(ts_rank(a.tsv, v_tsquery), 0.0) +
    (CASE WHEN similarity(LOWER(c.name), LOWER(p_query)) > 0.3 THEN 0.5 ELSE 0.0 END) as rank,
    jsonb_build_object(
      'notes', ts_headline('portuguese', a.notes, v_tsquery, 'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=TRUE'),
      'status', CASE WHEN a.status = p_query THEN 
        ts_headline('portuguese', a.status, v_tsquery, 'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=TRUE')
        ELSE a.status END
    ) as highlights,
    to_jsonb(a),
    to_jsonb(c)
  FROM (
    SELECT 
      a.*,
      to_tsvector('portuguese', 
        COALESCE(a.notes, '') || ' ' || 
        COALESCE(a.status, '') || ' ' || 
        TO_CHAR(a.scheduled_at, 'DD/MM/YYYY HH24:MI')
      ) as tsv
    FROM appointments a
    WHERE a.shop_id = p_shop_id
      AND (p_status IS NULL OR a.status = p_status)
      AND (p_date_from IS NULL OR a.scheduled_at >= p_date_from)
      AND (p_date_to IS NULL OR a.scheduled_at <= p_date_to)
      AND (p_employee_id IS NULL OR a.employee_id = p_employee_id)
  ) a
  INNER JOIN clients c ON a.client_id = c.id
  WHERE a.tsv @@ v_tsquery
     OR similarity(LOWER(c.name), LOWER(p_query)) > 0.3
     OR LOWER(c.phone_number) LIKE '%' || LOWER(p_query) || '%'
  ORDER BY 
    rank DESC,
    a.scheduled_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Busca Global (multiple tables)
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION search_global(
  p_shop_id UUID,
  p_query TEXT,
  p_limit_per_type INTEGER DEFAULT 5
) RETURNS TABLE (
  result_type VARCHAR,
  id UUID,
  rank FLOAT,
  result JSONB
) AS $$
DECLARE
  v_tsquery tsquery;
BEGIN
  IF p_query IS NULL OR LENGTH(TRIM(p_query)) < 2 THEN
    RETURN;
  END IF;
  
  v_tsquery := plainto_tsquery('portuguese', p_query);
  
  -- Clientes
  RETURN QUERY
  SELECT 
    'client'::VARCHAR as result_type,
    c.id::UUID,
    COALESCE(ts_rank(c.tsv, v_tsquery), 0.0) +
    COALESCE(similarity(LOWER(c.name), LOWER(p_query)), 0.0) * 0.5 as rank,
    jsonb_build_object(
      'client', to_jsonb(c)
    )
  FROM (
    SELECT 
      c.*,
      to_tsvector('portuguese', 
        COALESCE(c.name, '') || ' ' || 
        COALESCE(c.email, '') || ' ' || 
        COALESCE(c.phone_number, '')
      ) as tsv
    FROM clients c
    WHERE c.shop_id = p_shop_id 
      AND c.deleted_at IS NULL
      AND (
        c.tsv @@ v_tsquery
        OR similarity(LOWER(c.name), LOWER(p_query)) >= 0.3
        OR LOWER(c.phone_number) LIKE '%' || LOWER(p_query) || '%'
      )
    ORDER BY 
      COALESCE(ts_rank(c.tsv, v_tsquery), 0.0) DESC,
      c.last_visit_at DESC NULLS LAST
    LIMIT p_limit_per_type
  ) c
  
  UNION ALL
  
  -- Appointments
  SELECT 
    'appointment'::VARCHAR as result_type,
    a.id::UUID,
    COALESCE(ts_rank(a.tsv, v_tsquery), 0.0) as rank,
    jsonb_build_object(
      'appointment', to_jsonb(a),
      'client_name', c.name
    )
  FROM (
    SELECT 
      a.*,
      to_tsvector('portuguese', 
        COALESCE(a.notes, '') || ' ' || 
        COALESCE(a.status, '')
      ) as tsv
    FROM appointments a
    WHERE a.shop_id = p_shop_id
      AND a.scheduled_at >= NOW() - INTERVAL '365 days'
      AND a.tsv @@ v_tsquery
    ORDER BY ts_rank(a.tsv, v_tsquery) DESC, a.scheduled_at DESC
    LIMIT p_limit_per_type
  ) a
  INNER JOIN clients c ON a.client_id = c.id
  
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Search Suggestions (autocomplete)
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION search_suggestions(
  p_shop_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
  suggestion TEXT,
  result_type VARCHAR,
  count INTEGER
) AS $$
DECLARE
  v_trigram_threshold FLOAT := 0.3;
BEGIN
  IF p_query IS NULL OR LENGTH(TRIM(p_query)) < 2 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT DISTINCT ON (suggestion)
    c.name as suggestion,
    'client'::VARCHAR as result_type,
    COUNT(*) OVER (PARTITION BY LOWER(c.name)) as count
  FROM clients c
  WHERE c.shop_id = p_shop_id 
    AND c.deleted_at IS NULL
    AND similarity(LOWER(c.name), LOWER(p_query)) >= v_trigram_threshold
  ORDER BY similarity(LOWER(c.name), LOWER(p_query)) DESC, c.name
  LIMIT p_limit
  
  UNION ALL
  
  SELECT DISTINCT
    SUBSTRING(a.notes, 1, 50) as suggestion,
    'appointment_note'::VARCHAR as result_type,
    COUNT(*) OVER (PARTITION BY LOWER(SUBSTRING(a.notes, 1, 50))) as count
  FROM appointments a
  WHERE a.shop_id = p_shop_id
    AND a.notes ILIKE '%' || p_query || '%'
    AND LENGTH(a.notes) > 5
  ORDER BY similarity(LOWER(SUBSTRING(a.notes, 1, 50)), LOWER(p_query)) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNÇÕES DE ANALYTICS
-- =====================================================

-- Log Search
CREATE OR REPLACE FUNCTION log_search(
  p_shop_id UUID,
  p_query TEXT,
  p_query_type VARCHAR DEFAULT 'global',
  p_results_count INTEGER DEFAULT 0,
  p_results_ids UUID[] DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_filters JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_search_id UUID;
BEGIN
  INSERT INTO search_analytics (
    shop_id, user_id, query, query_type,
    results_count, results_ids, duration_ms,
    filters, created_at, indexed_at
  ) VALUES (
    p_shop_id, p_user_id, p_query, p_query_type,
    p_results_count, p_results_ids, p_duration_ms,
    p_filters, NOW(), NOW()
  ) RETURNING id INTO v_search_id;
  
  RETURN v_search_id;
END;
$$ LANGUAGE plpgsql;

-- Log Click
CREATE OR REPLACE FUNCTION log_search_click(
  p_search_id UUID,
  p_clicked_id UUID,
  p_click_position INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE search_analytics
  SET clicked_id = p_clicked_id,
      click_position = p_click_position
  WHERE id = p_search_id;
END;
$$ LANGUAGE plpgsql;

-- Popular Queries
CREATE OR REPLACE FUNCTION get_popular_queries(
  p_shop_id UUID,
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
  query TEXT,
  count BIGINT,
  avg_results FLOAT,
  ctr FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query,
    COUNT(*) as count,
    AVG(results_count)::FLOAT as avg_results,
    (COUNT(*) FILTER (WHERE clicked_id IS NOT NULL)::FLOAT / NULLIF(COUNT(*), 0))::FLOAT as ctr
  FROM search_analytics
  WHERE shop_id = p_shop_id
    AND created_at >= NOW() - INTERVAL '1 day' * p_days
    AND LENGTH(TRIM(query)) >= 2
  GROUP BY query
  ORDER BY count DESC, ctr DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Queries with No Results
CREATE OR REPLACE FUNCTION get_empty_queries(
  p_shop_id UUID,
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
  query TEXT,
  count BIGINT,
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query,
    COUNT(*) as count,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen
  FROM search_analytics
  WHERE shop_id = p_shop_id
    AND created_at >= NOW() - INTERVAL '1 day' * p_days
    AND results_count = 0
    AND LENGTH(TRIM(query)) >= 2
  GROUP BY query
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Search Metrics Summary
CREATE OR REPLACE FUNCTION get_search_metrics(
  p_shop_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_total_searches BIGINT;
  v_total_clicks BIGINT;
  v_no_results BIGINT;
  v_avg_results FLOAT;
  v_avg_duration_ms FLOAT;
  v_unique_queries BIGINT;
BEGIN
  SELECT 
    COUNT(*) INTO v_total_searches
  FROM search_analytics
  WHERE shop_id = p_shop_id
    AND created_at >= NOW() - INTERVAL '1 day' * p_days;
  
  SELECT 
    COUNT(*) FILTER (WHERE clicked_id IS NOT NULL) INTO v_total_clicks,
    COUNT(*) FILTER (WHERE results_count = 0) INTO v_no_results,
    AVG(results_count) INTO v_avg_results,
    AVG(duration_ms) INTO v_avg_duration_ms,
    COUNT(DISTINCT query) INTO v_unique_queries
  FROM search_analytics
  WHERE shop_id = p_shop_id
    AND created_at >= NOW() - INTERVAL '1 day' * p_days;
  
  RETURN jsonb_build_object(
    'total_searches', v_total_searches,
    'total_clicks', COALESCE(v_total_clicks, 0),
    'ctr', CASE WHEN v_total_searches > 0 THEN 
      (COALESCE(v_total_clicks, 0)::FLOAT / v_total_searches)::NUMERIC(10,4)
      ELSE 0.0 END,
    'no_results_rate', CASE WHEN v_total_searches > 0 THEN 
      (v_no_results::FLOAT / v_total_searches)::NUMERIC(10,4)
      ELSE 0.0 END,
    'avg_results', ROUND(COALESCE(v_avg_results, 0), 2),
    'avg_duration_ms', ROUND(COALESCE(v_avg_duration_ms, 0), 2),
    'unique_queries', COALESCE(v_unique_queries, 0),
    'period_days', p_days
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. SEARCH HISTORY FUNCTIONS
-- =====================================================

-- Save to search history
CREATE OR REPLACE FUNCTION save_search_history(
  p_shop_id UUID,
  p_user_id UUID,
  p_query TEXT,
  p_query_type VARCHAR DEFAULT 'global'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO search_history (shop_id, user_id, query, query_type, search_count, last_searched_at, created_at)
  VALUES (p_shop_id, p_user_id, p_query, p_query_type, 1, NOW(), NOW())
  ON CONFLICT (shop_id, user_id, query)
  DO UPDATE SET
    search_count = search_history.search_count + 1,
    last_searched_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Get recent searches
CREATE OR REPLACE FUNCTION get_recent_searches(
  p_shop_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  query TEXT,
  query_type VARCHAR,
  search_count INTEGER,
  last_searched_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query,
    query_type,
    search_count,
    last_searched_at
  FROM search_history
  WHERE shop_id = p_shop_id
    AND user_id = p_user_id
  ORDER BY last_searched_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para atualizar indexed_at em search_analytics (para analytics)
CREATE OR REPLACE FUNCTION update_search_indexed_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.indexed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_search_analytics_indexed_at
  BEFORE INSERT ON search_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_search_indexed_at();

-- =====================================================
-- 10. VIEWS ÚTEIS
-- =====================================================

-- View: Recent search activity
CREATE OR REPLACE VIEW v_recent_search_activity AS
SELECT 
  sa.*,
  u.email as user_email,
  EXTRACT(EPOCH FROM (NOW() - sa.created_at)) / 60 as minutes_ago
FROM search_analytics sa
LEFT JOIN auth.users u ON sa.user_id = u.id
ORDER BY sa.created_at DESC
LIMIT 100;

-- View: Search performance trends
CREATE OR REPLACE VIEW v_search_performance_trends AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_searches,
  COUNT(*) FILTER (WHERE clicked_id IS NOT NULL) as total_clicks,
  AVG(results_count) as avg_results,
  AVG(duration_ms) as avg_duration_ms,
  COUNT(*) FILTER (WHERE results_count = 0) as no_results_count
FROM search_analytics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- =====================================================
-- TESTE DE FUNCIONALIDADE
-- =====================================================

-- Teste básico (descomente para testar)
/*
-- Testar busca de clientes
SELECT * FROM search_clients(
  p_shop_id := 'your-shop-id-here',
  p_query := 'joão',
  p_limit := 10
);

-- Testar busca global
SELECT * FROM search_global(
  p_shop_id := 'your-shop-id-here',
  p_query := 'corte',
  p_limit_per_type := 5
);

-- Testar analytics
SELECT * FROM get_popular_queries(
  p_shop_id := 'your-shop-id-here',
  p_days := 30,
  p_limit := 20
);
*/

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Full-Text Search implementation completed!';
  RAISE NOTICE 'Created indexes, functions, and tables for:';
  RAISE NOTICE '  - Clients search (fuzzy + full-text)';
  RAISE NOTICE '  - Appointments search';
  RAISE NOTICE '  - Global search';
  RAISE NOTICE '  - Search suggestions';
  RAISE NOTICE '  - Search analytics';
  RAISE NOTICE '  - Search history';
END $$;
