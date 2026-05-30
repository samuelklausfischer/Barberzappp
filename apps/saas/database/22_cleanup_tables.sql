-- =====================================================
-- BarberZap - Data Cleanup Tables (FASE 5 - Item 5.1)
-- =====================================================
-- Prioridade: 1 (MAIS CRÍTICA)
-- Justificativa: Evitar acúmulo de dados temporários e expirados
-- Tempo estimado: 2-3 horas
-- =====================================================
-- Este script define as tabelas temporárias e expiráveis
-- que precisam de limpeza automática para manter o sistema saudável.
--
-- TABELAS PARA CLEANUP (não arquivar, deletar):
-- 1. expired_magic_links (expirados há 24h+)
-- 2. expired_verification_codes (expirados há 1h+)
-- 3. expired_notifications (enviados há 7d+)
-- 4. old_cache_entries (sem TTL)
-- 5. duplicate_activity_logs (redundantes dentro de 1m)
-- 6. expired_client_session_tokens (expirados há 7d+)
-- 7. expired_password_reset_tokens (expirados há 1h+)
--
-- Estas tabelas contêm dados temporários que são seguros para deletar
-- após o período de expiração.
-- =====================================================

-- =====================================================
-- 1. MAGIC_LINKS TABLE
-- =====================================================
-- Links mágicos para autenticação rápida (WhatsApp/Login sem senha)
-- Expiram após 24 horas por padrão

CREATE TABLE IF NOT EXISTS magic_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: expiry_date deve ser no futuro
  CONSTRAINT chk_magic_links_expiry_positive CHECK (expiry_date > created_at),

  -- Prevent multiple unused magic links for same phone
  CONSTRAINT chk_magic_links_unique_pending UNIQUE (phone_number, used_at)
);

-- Índices
CREATE INDEX idx_magic_links_shop_id ON magic_links(shop_id);
CREATE INDEX idx_magic_links_token ON magic_links(token) WHERE used_at IS NULL;
CREATE INDEX idx_magic_links_expiry ON magic_links(expiry_date);
CREATE INDEX idx_magic_links_expired ON magic_links(shop_id, expiry_date)
  WHERE used_at IS NULL AND expiry_date < NOW();

-- =====================================================
-- 2. VERIFICATION_CODES TABLE
-- =====================================================
-- Códigos de verificação (SMS, Email, WhatsApp)
-- Expiram após 1 hora por padrão

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  code VARCHAR(10) NOT NULL,
  code_type VARCHAR(50) NOT NULL CHECK (code_type IN (
    'phone_verification',
    'email_verification',
    '2fa',
    'password_reset_request',
    'account_recovery'
  )),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: expiry_date deve ser no futuro
  CONSTRAINT chk_verification_expiry_positive CHECK (expiry_date > created_at),

  -- Constraint: pelo menos phone ou email deve estar presente
  CONSTRAINT chk_verification_recipient CHECK (
    phone_number IS NOT NULL OR email IS NOT NULL
  )
);

-- Índices
CREATE INDEX idx_verification_codes_shop_id ON verification_codes(shop_id);
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone_number, code_type);
CREATE INDEX idx_verification_codes_email ON verification_codes(email, code_type);
CREATE INDEX idx_verification_codes_code ON verification_codes(code, expiry_date)
  WHERE verified_at IS NULL AND expiry_date > NOW();
CREATE INDEX idx_verification_codes_expiry ON verification_codes(expiry_date);
CREATE INDEX idx_verification_codes_expired ON verification_codes(shop_id, expiry_date)
  WHERE verified_at IS NULL;

-- =====================================================
-- 3. CLIENT_SESSION_TOKENS TABLE
-- =====================================================
-- Sessões de clientes (para persistir login em dispositivos)
-- Expiram após 7 dias por padrão

CREATE TABLE IF NOT EXISTS client_session_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  device_info JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  logout_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: expiry_date deve ser no futuro
  CONSTRAINT chk_session_expiry_positive CHECK (expiry_date > created_at)
);

-- Índices
CREATE INDEX idx_client_session_shop_id ON client_session_tokens(shop_id);
CREATE INDEX idx_client_session_client_id ON client_session_tokens(client_id);
CREATE INDEX idx_client_session_token ON client_session_tokens(token)
  WHERE logout_at IS NULL AND expiry_date > NOW();
CREATE INDEX idx_client_session_expiry ON client_session_tokens(expiry_date);
CREATE INDEX idx_client_session_expired ON client_session_tokens(shop_id, expiry_date)
  WHERE logout_at IS NULL AND expiry_date < NOW();

-- =====================================================
-- 4. PASSWORD_RESET_TOKENS TABLE
-- =====================================================
-- Tokens para reset de senha
-- Expiram após 1 hora por padrão

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  token VARCHAR(255) NOT NULL UNIQUE,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: expiry_date deve ser no futuro
  CONSTRAINT chk_password_reset_expiry_positive CHECK (expiry_date > created_at)
);

-- Índices
CREATE INDEX idx_password_reset_shop_id ON password_reset_tokens(shop_id);
CREATE INDEX idx_password_reset_client_id ON password_reset_tokens(client_id);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token)
  WHERE used_at IS NULL AND expiry_date > NOW();
CREATE INDEX idx_password_reset_expiry ON password_reset_tokens(expiry_date);
CREATE INDEX idx_password_reset_expired ON password_reset_tokens(shop_id, expiry_date)
  WHERE used_at IS NULL;

-- =====================================================
-- 5. TEMPORARY_CACHE_ENTRIES TABLE
-- =====================================================
-- Cache temporário sem TTL explícito (usado para cache custom)
-- Deve ser limpo se não acessado há mais de 7 dias

CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  cache_key VARCHAR(500) NOT NULL,
  cache_value JSONB NOT NULL,
  cache_type VARCHAR(50) NOT NULL,
  size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,

  UNIQUE (shop_id, cache_key)
);

-- Índices
CREATE INDEX idx_cache_shop_id ON cache_entries(shop_id);
CREATE INDEX idx_cache_key ON cache_entries(cache_key);
CREATE INDEX idx_cache_type ON cache_entries(cache_type);
CREATE INDEX idx_cache_last_accessed ON cache_entries(last_accessed_at);
CREATE INDEX idx_cache_expires_at ON cache_entries(expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX idx_cache_stale ON cache_entries(shop_id, last_accessed_at)
  WHERE expires_at IS NULL AND last_accessed_at < NOW() - INTERVAL '7 days';

-- =====================================================
-- 6. ACTIVITY_LOGS TABLE (para deduplicação)
-- =====================================================
-- Logs de atividade do sistema (adicionando campos para deduplicação)
-- Deve deduplicar logs redundantes dentro de 1 minuto

-- Adicionar colunas à tabela existente se não existirem
DO $$
BEGIN
  -- Verificar se a tabela audit_logs tem os campos necessários para deduplicação
  -- Se não, adicionar aqui (já existe audit_logs no 01_critical_tables.sql)
  
  -- Criar tabela específica para activity_logs se não existir
  CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Para deduplicação
    fingerprint VARCHAR(255),  -- hash composto para identificar logs duplicados
    is_duplicate BOOLEAN DEFAULT FALSE
  );

  -- Verificar se as colunas já existem antes de adicionar
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_activity_logs_fingerprint'
  ) THEN
    ALTER TABLE activity_logs
    ADD CONSTRAINT chk_activity_logs_fingerprint CHECK (
      fingerprint IS NULL OR
      (fingerprint IS NOT NULL AND length(fingerprint) <= 255)
    );
  END IF;
  
END $$;

-- Índices para activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_shop_id ON activity_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_fingerprint ON activity_logs(fingerprint, created_at)
  WHERE fingerprint IS NOT NULL;

-- =====================================================
-- 7. CLEANUP VIEW: EXPIRED MAGIC LINKS
-- =====================================================
-- View para identificar magicLinks expirados (24h+)
CREATE OR REPLACE VIEW v_expired_magic_links AS
SELECT
  id,
  shop_id,
  client_id,
  phone_number,
  expiry_date,
  created_at,
  expiry_date AS expired_at,
  NOW() - expiry_date AS expired_for
FROM magic_links
WHERE used_at IS NULL
  AND expiry_date < NOW() - INTERVAL '24 hours';

-- =====================================================
-- 8. CLEANUP VIEW: EXPIRED VERIFICATION CODES
-- =====================================================
-- View para identificar códigos de verificação expirados (1h+)
CREATE OR REPLACE VIEW v_expired_verification_codes AS
SELECT
  id,
  shop_id,
  client_id,
  phone_number,
  email,
  code_type,
  expiry_date,
  created_at,
  expiry_date AS expired_at,
  NOW() - expiry_date AS expired_for
FROM verification_codes
WHERE verified_at IS NULL
  AND expiry_date < NOW() - INTERVAL '1 hour';

-- =====================================================
-- 9. CLEANUP VIEW: EXPIRED SESSION TOKENS
-- =====================================================
-- View para identificar sessões expiradas (7d+)
CREATE OR REPLACE VIEW v_expired_session_tokens AS
SELECT
  id,
  shop_id,
  client_id,
  device_info,
  ip_address,
  last_active_at,
  expiry_date,
  created_at,
  logout_at,
  expiry_date AS expired_at,
  NOW() - expiry_date AS expired_for
FROM client_session_tokens
WHERE logout_at IS NULL
  AND expiry_date < NOW() - INTERVAL '7 days';

-- =====================================================
-- 10. CLEANUP VIEW: EXPIRED PASSWORD RESET TOKENS
-- =====================================================
-- View para identificar tokens de reset expirados (1h+)
CREATE OR REPLACE VIEW v_expired_password_reset_tokens AS
SELECT
  id,
  shop_id,
  client_id,
  email,
  phone_number,
  expiry_date,
  created_at,
  used_at,
  expiry_date AS expired_at,
  NOW() - expiry_date AS expired_for
FROM password_reset_tokens
WHERE used_at IS NULL
  AND expiry_date < NOW() - INTERVAL '1 hour';

-- =====================================================
-- 11. CLEANUP VIEW: STALE CACHE ENTRIES
-- =====================================================
-- View para identificar cache entries stale (7d+ sem acesso)
CREATE OR REPLACE VIEW v_stale_cache_entries AS
SELECT
  id,
  shop_id,
  cache_key,
  cache_type,
  size_bytes,
  last_accessed_at,
  created_at,
  expires_at,
  NOW() - last_accessed_at AS stale_for
FROM cache_entries
WHERE expires_at IS NULL
  AND last_accessed_at < NOW() - INTERVAL '7 days';

-- =====================================================
-- 12. CLEANUP VIEW: EXPIRED CACHE ENTRIES
-- =====================================================
-- View para identificar cache entries explicitamente expirados
CREATE OR REPLACE VIEW v_expired_cache_entries AS
SELECT
  id,
  shop_id,
  cache_key,
  cache_type,
  size_bytes,
  last_accessed_at,
  created_at,
  expires_at,
  NOW() - expires_at AS expired_for
FROM cache_entries
WHERE expires_at IS NOT NULL
  AND expires_at < NOW();

-- =====================================================
-- 13. CLEANUP VIEW: OLD NOTIFICATIONS
-- =====================================================
-- View para identificar notificações antigas (7d+, lidas)
CREATE OR REPLACE VIEW v_old_notifications AS
SELECT
  id,
  shop_id,
  user_id,
  type,
  title,
  created_at,
  read_at,
  NOW() - Coalesce(read_at, created_at) AS age
FROM notifications
WHERE read_at IS NOT NULL
  AND read_at < NOW() - INTERVAL '7 days';

-- =====================================================
-- 14. CLEANUP VIEW: DUPLICATE ACTIVITY LOGS
-- =====================================================
-- View para identificar logs de atividade duplicados (dentro de 1m)
CREATE OR REPLACE VIEW v_duplicate_activity_logs AS
WITH duplicates AS (
  SELECT
    id,
    shop_id,
    action,
    entity_type,
    entity_id,
    user_id,
    created_at,
    fingerprint,
    COUNT(*) OVER (
      PARTITION BY fingerprint
      ORDER BY created_at
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as duplicate_number,
    LAG(created_at) OVER (
      PARTITION BY fingerprint
      ORDER BY created_at
    ) as previous_created_at
  FROM activity_logs
  WHERE fingerprint IS NOT NULL
)
SELECT
  id,
  shop_id,
  action,
  entity_type,
  entity_id,
  user_id,
  created_at,
  previous_created_at,
  created_at - previous_created_at AS time_gap
FROM duplicates
WHERE duplicate_number > 1
  AND created_at - previous_created_at < INTERVAL '1 minute';

-- =====================================================
-- 15. CLEANUP VIEW: ALL ELIGIBLE FOR CLEANUP (SUMMARY)
-- =====================================================
-- View consolidada de todas as entries elegíveis para cleanup
CREATE OR REPLACE VIEW v_cleanup_eligible AS
SELECT
  'magic_links' as table_name,
  COUNT(*) as count,
  SUM(EXTRACT(EPOCH FROM (NOW() - expiry_date))) / 60 as avg_expired_minutes
FROM v_expired_magic_links

UNION ALL

SELECT
  'verification_codes' as table_name,
  COUNT(*) as count,
  SUM(EXTRACT(EPOCH FROM (NOW() - expiry_date))) / 60 as avg_expired_minutes
FROM v_expired_verification_codes

UNION ALL

SELECT
  'session_tokens' as table_name,
  COUNT(*) as count,
  SUM(EXTRACT(EPOCH FROM (NOW() - expiry_date))) / 60 as avg_expired_minutes
FROM v_expired_session_tokens

UNION ALL

SELECT
  'password_reset_tokens' as table_name,
  COUNT(*) as count,
  SUM(EXTRACT(EPOCH FROM (NOW() - expiry_date))) / 60 as avg_expired_minutes
FROM v_expired_password_reset_tokens

UNION ALL

SELECT
  'stale_cache' as table_name,
  COUNT(*) as count,
  SUM(EXTRACT(EPOCH FROM (NOW() - last_accessed_at))) / 60 as avg_stale_minutes
FROM v_stale_cache_entries

UNION ALL

SELECT
  'expired_cache' as table_name,
  COUNT(*) as count,
  SUM(EXTRACT(EPOCH FROM (NOW() - expires_at))) / 60 as avg_expired_minutes
FROM v_expired_cache_entries

UNION ALL

SELECT
  'old_notifications' as table_name,
  COUNT(*) as count,
  SUM(EXTRACT(EPOCH FROM (NOW() - read_at))) / 3600 as avg_age_hours
FROM v_old_notifications

UNION ALL

SELECT
  'duplicate_activity_logs' as table_name,
  COUNT(*) as count,
  SUM(EXTRACT(EPOCH FROM time_gap)) / 60 as avg_gap_seconds
FROM v_duplicate_activity_logs;

-- =====================================================
-- 16. FUNCTION: GENERATE FINGERPRINT FOR DEDUPLICATION
-- =====================================================
-- Função para gerar fingerprint de activity_logs
CREATE OR REPLACE FUNCTION generate_activity_fingerprint()
RETURNS TRIGGER AS $$
BEGIN
  -- Gerar hash composto para identificação de duplicatas
  -- Combina: shop_id + user_id + action + entity_type + entity_id + data relevantes
  NEW.fingerprint := md5(
    COALESCE(NEW.shop_id::TEXT, '') ||
    COALESCE(NEW.user_id::TEXT, '') ||
    NEW.action ||
    COALESCE(NEW.entity_type, '') ||
    COALESCE(NEW.entity_id::TEXT, '') ||
    COALESCE(NEW.details::TEXT, '') ||
    DATE_TRUNC('minute', NEW.created_at)::TEXT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-gerar fingerprint
CREATE TRIGGER trigger_activity_fingerprint
  BEFORE INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION generate_activity_fingerprint();

-- =====================================================
-- 17. FUNCTION: UPDATE LAST ACCESSED FOR CACHE
-- =====================================================
-- Trigger para auto-atualizar last_accessed_on
CREATE OR REPLACE FUNCTION update_cache_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-atualizar em UPDATE
CREATE TRIGGER trigger_cache_last_accessed
  BEFORE UPDATE ON cache_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_last_accessed();

-- =====================================================
-- INSTRUÇÕES
-- =====================================================
--
-- Após criar as tabelas:
--
-- 1. Verificar se há dados expirados:
--    SELECT * FROM v_cleanup_eligible;
--
-- 2. Verificar detalhes por tabela:
--    SELECT * FROM v_expired_magic_links LIMIT 10;
--    SELECT * FROM v_expired_verification_codes LIMIT 10;
--    SELECT * FROM v_expired_session_tokens LIMIT 10;
--
-- 3. O script 23_cleanup_procedures.sql criará stored procedures
--    para limpar automaticamente estes dados.
--
-- 4. O script 24_cleanup_audit.sql criará tabelas de audit
--    para rastrear todas as operações de cleanup.
--
-- 5. O script 25_cleanup_constraints.sql adicionará constraints
--    para evitar acúmulo futuro.
--
-- =====================================================
