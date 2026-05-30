-- =====================================================
-- BarberZap - Notificação Preferences (FASE 3.4)
-- =====================================================
-- Prioridade: 3 (Importante)
-- Justificativa: Clientes precisam controlar o que recebem
-- Tempo estimado: 3-5 horas
-- =====================================================

-- =====================================================
-- TABELA: CLIENT_NOTIFICATION_PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS client_notification_preferences (
  shop_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'booking_confirmation', 
    'reminder_24h', 
    'reminder_2h', 
    'cancellation', 
    'reschedule', 
    'promotional', 
    'monthly_report'
  )),
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp' CHECK (channel IN (
    'whatsapp', 
    'email', 
    'sms', 
    'in_app', 
    'none'
  )),
  enabled BOOLEAN DEFAULT TRUE,
  timing VARCHAR(20) DEFAULT 'instant' CHECK (timing IN (
    'instant', 
    '1h_before', 
    '24h_before', 
    'morning', 
    'afternoon', 
    'evening'
  )),
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  do_not_disturb_start TIME DEFAULT NULL,
  do_not_disturb_end TIME DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (shop_id, client_id, notification_type)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índice para buscar preferências de um cliente
CREATE INDEX idx_notification_prefs_client 
  ON client_notification_preferences(shop_id, client_id);

-- Índice para buscar clientes por tipo de notificação
CREATE INDEX idx_notification_prefs_type 
  ON client_notification_preferences(notification_type);

-- Índice composto para consultas otimizadas
CREATE INDEX idx_notification_prefs_client_type 
  ON client_notification_preferences(shop_id, client_id, notification_type);

-- Índice para encontrar clientes com notificações habilitadas
CREATE INDEX idx_notification_prefs_enabled 
  ON client_notification_preferences(shop_id, notification_type, enabled) 
  WHERE enabled = TRUE;

-- Índice para busca por timezone
CREATE INDEX idx_notification_prefs_timezone 
  ON client_notification_preferences(shop_id, timezone);

-- =====================================================
-- TABELA: SHOP_NOTIFICATION_DEFAULTS
-- =====================================================
-- Configurações padrão de notificação por barbearia

CREATE TABLE IF NOT EXISTS shop_notification_defaults (
  shop_id UUID PRIMARY KEY,
  default_channel VARCHAR(20) DEFAULT 'whatsapp' CHECK (default_channel IN (
    'whatsapp', 'email', 'sms', 'in_app'
  )),
  default_timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  
  -- Habilitar/desabilitar por tipo de notificação
  booking_confirmation_enabled BOOLEAN DEFAULT TRUE,
  reminder_24h_enabled BOOLEAN DEFAULT TRUE,
  reminder_2h_enabled BOOLEAN DEFAULT TRUE,
  cancellation_enabled BOOLEAN DEFAULT TRUE,
  reschedule_enabled BOOLEAN DEFAULT TRUE,
  promotional_enabled BOOLEAN DEFAULT FALSE,
  monthly_report_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timing padrão para cada tipo
  booking_confirmation_timing VARCHAR(20) DEFAULT 'instant',
  reminder_24h_timing VARCHAR(20) DEFAULT '24h_before',
  reminder_2h_timing VARCHAR(20) DEFAULT '2h_before',
  cancellation_timing VARCHAR(20) DEFAULT 'instant',
  reschedule_timing VARCHAR(20) DEFAULT 'instant',
  promotional_timing VARCHAR(20) DEFAULT 'morning',
  monthly_report_timing VARCHAR(20) DEFAULT 'morning',
  
  -- Horário de silêncio global
  do_not_disturbo_start TIME DEFAULT '22:00:00',
  do_not_disturb_end TIME DEFAULT '08:00:00',
  do_not_disturb_enabled BOOLEAN DEFAULT FALSE,
  
  -- Configurações de rate limiting
  max_notifications_per_day INTEGER DEFAULT 10,
  max_promotional_per_week INTEGER DEFAULT 2,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscas rápidas
CREATE INDEX idx shop_defaults_shop 
  ON shop_notification_defaults(shop_id);

-- =====================================================
-- TABELA: NOTIFICATION_QUEUE
-- =====================================================
-- Fila de notificações com base nas preferências

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id),
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  
  -- Conteúdo da notificação
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Agendamento
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 
    'queued', 
    'sent', 
    'failed', 
    'skipped',
    'cancelled'
  )),
  
  -- Tentativas e erros
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  error_details JSONB,
  
  -- Referências para rastreamento
  appointment_id UUID REFERENCES appointments(id),
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para processamento da fila
CREATE INDEX idx_notification_queue_status 
  ON notification_queue(status, scheduled_at) 
  WHERE status IN ('pending', 'queued');

CREATE INDEX idx_notification_queue_client 
  ON notification_queue(client_id, status);

CREATE INDEX idx_notification_queue_type 
  ON notification_queue(notification_type, status);

CREATE INDEX idx_notification_queue_scheduled 
  ON notification_queue(scheduled_at) 
  WHERE status IN ('pending', 'queued');

-- =====================================================
-- TABELA: NOTIFICATION_TEMPLATES
-- =====================================================
-- Templates para mensagens de notificação

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  language VARCHAR(10) DEFAULT 'pt-BR',
  
  -- Templates de mensagem
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  
  -- Variáveis disponíveis (documentação)
  available_variables TEXT[],
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(shop_id, notification_type, channel, language)
);

CREATE INDEX idx_templates_shop_type 
  ON notification_templates(shop_id, notification_type);

-- =====================================================
-- TABELA: NOTIFICATION_LOGS
-- =====================================================
-- Histórico completo de notificações enviadas

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  client_id UUID NOT NULL,
  queue_id UUID REFERENCES notification_queue(id),
  
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  
  -- Status final
  status VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Conteúdo enviado
  title_sent VARCHAR(255),
  message_sent TEXT,
  
  -- Métricas
  delivery_attempts INTEGER DEFAULT 1,
  error_message TEXT,
  
  -- Metadados
  appointment_id UUID,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para relatórios
CREATE INDEX idx_notification_logs_client 
  ON notification_logs(client_id, created_at DESC);

CREATE INDEX idx_notification_logs_shop 
  ON notification_logs(shop_id, created_at DESC);

CREATE INDEX idx_notification_logs_type 
  ON notification_logs(notification_type, created_at DESC);

CREATE INDEX idx_notification_logs_status 
  ON notification_logs(status, created_at DESC);

-- =====================================================
-- FUNÇÕES HELPER
-- =====================================================

-- Função para verificar se está no período de silêncio
CREATE OR REPLACE FUNCTION is_silent_period(
  p_do_not_disturb_start TIME,
  p_do_not_disturb_end TIME,
  p_check_time TIMESTAMP WITH TIME ZONE,
  p_timezone VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_check_time_local TIME;
BEGIN
  -- Converter horário para o timezone do cliente
  v_check_time_local := (p_check_time AT TIME ZONE p_timezone)::TIME;
  
  -- Se não tem período configurado, não está em silêncio
  IF p_do_not_disturb_start IS NULL OR p_do_not_disturb_end IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se está no período de silêncio
  RETURN v_check_time_local >= p_do_not_disturb_start 
         AND v_check_time_local <= p_do_not_disturb_end;
END;
$$ LANGUAGE plpgsql;

-- Função para obter preferências com fallback para defaults da shop
CREATE OR REPLACE FUNCTION get_notification_preferences(
  p_shop_id UUID,
  p_client_id UUID,
  p_notification_type VARCHAR
) RETURNS TABLE (
  channel VARCHAR,
  enabled BOOLEAN,
  timing VARCHAR,
  timezone VARCHAR,
  do_not_disturb_start TIME,
  do_not_disturb_end TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(cnp.channel, snd.default_channel, 'whatsapp')::VARCHAR AS channel,
    COALESCE(cnp.enabled, TRUE) AS enabled,
    COALESCE(cnp.timing, get_default_timing(snd, p_notification_type), 'instant')::VARCHAR AS timing,
    COALESCE(cnp.timezone, snd.default_timezone, 'America/Sao_Paulo')::VARCHAR AS timezone,
    COALESCE(cnp.do_not_disturb_start, snd.do_not_disturbo_start) AS do_not_disturb_start,
    COALESCE(cnp.do_not_disturb_end, snd.do_not_disturb_end) AS do_not_disturb_end
  FROM client_notification_preferences cnp
  RIGHT JOIN shop_notification_defaults snd ON cnp.shop_id = snd.shop_id
  WHERE 
    cnp.shop_id = p_shop_id
    AND (cnp.client_id = p_client_id OR cnp.client_id IS NULL)
    AND (cnp.notification_type = p_notification_type OR cnp.notification_type IS NULL)
    AND cnp.notification_type = p_notification_type
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para obter timing padrão
CREATE OR REPLACE FUNCTION get_default_timing(
  snd shop_notification_defaults,
  p_type VARCHAR
) RETURNS VARCHAR AS $$
BEGIN
  CASE p_type
    WHEN 'booking_confirmation' THEN RETURN snd.booking_confirmation_timing;
    WHEN 'reminder_24h' THEN RETURN snd.reminder_24h_timing;
    WHEN 'reminder_2h' THEN RETURN snd.reminder_2h_timing;
    WHEN 'cancellation' THEN RETURN snd.cancellation_timing;
    WHEN 'reschedule' THEN RETURN snd.reschedule_timing;
    WHEN 'promotional' THEN RETURN snd.promotional_timing;
    WHEN 'monthly_report' THEN RETURN snd.monthly_report_timing;
    ELSE RETURN 'instant';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at em preferences
CREATE TRIGGER trg_notification_prefs_updated_at
  BEFORE UPDATE ON client_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();

-- Trigger para atualizar updated_at em shop defaults
CREATE TRIGGER trg_shop_defaults_updated_at
  BEFORE UPDATE ON shop_notification_defaults
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();

-- =====================================================
-- DADOS INICIAIS (OPTIONAL)
-- =====================================================

-- Inserir defaults para shops existentes (exemplo)
-- INSERT INTO shop_notification_defaults (shop_id)
-- SELECT DISTINCT shop_id FROM clients;

-- =====================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE client_notification_preferences IS 
'Preferências de notificação por cliente. Permite controle granular sobre o que e como cada cliente recebe notificações.';

COMMENT ON TABLE shop_notification_defaults IS 
'Configurações padrão de notificação por barbearia. Aplicadas quando um cliente não tem preferências específicas definidas.';

COMMENT ON TABLE notification_queue IS 
'Fila de notificações agendadas. Processada por workers que respeitam as preferências de cada cliente.';

COMMENT ON TABLE notification_templates IS 
'Templates de mensagem para cada tipo de notificação e canal. Permite personalização por barbearia.';

COMMENT ON TABLE notification_logs IS 
'Histórico completo de todas as notificações enviadas. Usado para relatórios e debugging.';

COMMENT ON FUNCTION is_silent_period IS 
'Verifica se um horário específico está dentro do período de não perturbar do cliente.';

COMMENT ON FUNCTION get_notification_preferences IS 
'Obtém as preferências de notificação de um cliente com fallback para os padrões da barbearia.';
