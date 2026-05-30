-- =====================================================
-- BarberZap - Calendar Integrations (FASE 3.7)
-- =====================================================
-- Prioridade: 7 (Feature Enhancement)
-- Justificativa: Integração com calendários externos (Google, Outlook, Apple)
-- Tempo estimado: 4-6 horas
-- =====================================================

-- =====================================================
-- 1. CLIENT_CALENDARS (Calendários conectados do cliente)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL,
  calendar_type VARCHAR(20) NOT NULL CHECK (calendar_type IN ('google', 'outlook', 'apple', 'other')),
  calendar_id VARCHAR(255),
  calendar_name VARCHAR(255),
  calendar_color VARCHAR(7),  -- Hex color code
  access_token TEXT,
  refresh_token TEXT,
  sync_token VARCHAR(255),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_sync_status VARCHAR(20) DEFAULT 'success' CHECK (last_sync_status IN ('success', 'failed', 'in_progress')),
  last_sync_error TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  
  -- Sync settings
  sync_direction VARCHAR(20) DEFAULT 'to_external' CHECK (sync_direction IN ('to_external', 'from_external', 'bidirectional')),
  auto_sync BOOLEAN DEFAULT TRUE,
  sync_on_book BOOLEAN DEFAULT TRUE,
  sync_on_update BOOLEAN DEFAULT TRUE,
  sync_on_cancel BOOLEAN DEFAULT TRUE,
  
  -- Conflict resolution preference
  conflict_resolution VARCHAR(20) DEFAULT 'barber_priority' CHECK (conflict_resolution IN ('barber_priority', 'calendar_priority', 'ask_user')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_client_calendars_client ON client_calendars(client_id);
CREATE INDEX idx_client_calendars_shop ON client_calendars(shop_id);
CREATE INDEX idx_client_calendars_type ON client_calendars(calendar_type);
CREATE INDEX idx_client_calendars_enabled ON client_calendars(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_client_calendars_last_sync ON client_calendars(last_synced_at DESC);

-- =====================================================
-- 2. CALENDAR_SYNC_EVENTS (Histórico de sync de eventos)
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_sync_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_calendar_id UUID NOT NULL REFERENCES client_calendars(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  external_event_id VARCHAR(255),
  external_calendar_id VARCHAR(255),
  sync_direction VARCHAR(20) NOT NULL CHECK (sync_direction IN ('to_external', 'from_external')),
  sync_type VARCHAR(20) DEFAULT 'create' CHECK (sync_type IN ('create', 'update', 'delete')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed', 'skipped')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  retry_after TIMESTAMP WITH TIME ZONE,
  
  -- Event data snapshot
  appointment_data JSONB,
  external_event_data JSONB,
  
  -- Metadata
  conflict_detected BOOLEAN DEFAULT FALSE,
  conflict_resolution VARCHAR(20),
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calendar_sync_events_calendar ON calendar_sync_events(client_calendar_id);
CREATE INDEX idx_calendar_sync_events_appointment ON calendar_sync_events(appointment_id);
CREATE INDEX idx_calendar_sync_events_external ON calendar_sync_events(external_event_id);
CREATE INDEX idx_calendar_sync_events_status ON calendar_sync_events(status);
CREATE INDEX idx_calendar_sync_events_retry ON calendar_sync_events(status, retry_after) 
  WHERE status = 'failed' AND retry_count < max_retries;
CREATE INDEX idx_calendar_sync_events_created ON calendar_sync_events(created_at DESC);

-- =====================================================
-- 3. CALENDAR_WEBHOOKS (Webhooks para calendários externos)
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_calendar_id UUID NOT NULL REFERENCES client_calendars(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  webhook_url VARCHAR(500) NOT NULL,
  webhook_id VARCHAR(255),  -- Provider's webhook ID
  webhook_secret VARCHAR(255),
  events JSONB DEFAULT '[]',  -- List of subscribed events
  active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_delivery_status VARCHAR(20),
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calendar_webhooks_calendar ON calendar_webhooks(client_calendar_id);
CREATE INDEX idx_calendar_webhooks_provider ON calendar_webhooks(provider);
CREATE INDEX idx_calendar_webhooks_active ON calendar_webhooks(active) WHERE active = TRUE;

-- =====================================================
-- 4. TRIGGERS E FUNÇÕES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_client_calendars_updated_at
  BEFORE UPDATE ON client_calendars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_sync_events_updated_at
  BEFORE UPDATE ON calendar_sync_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_webhooks_updated_at
  BEFORE UPDATE ON calendar_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create sync event on appointment change
CREATE OR REPLACE FUNCTION trigger_sync_event_on_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for completed appointments (scheduled -> confirmed)
  IF (TG_OP = 'INSERT' AND NEW.status = 'scheduled') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    
    -- Find all enabled client calendars for this client and shop
    INSERT INTO calendar_sync_events (
      client_calendar_id,
      appointment_id,
      sync_direction,
      sync_type,
      status,
      appointment_data
    )
    SELECT 
      cc.id,
      NEW.id,
      CASE 
        WHEN cc.sync_direction = 'from_external' THEN 'from_external'
        ELSE 'to_external'
      END,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'create'
        ELSE 'update'
      END,
      'pending',
      jsonb_build_object(
        'id', NEW.id,
        'client_id', NEW.client_id,
        'employee_id', NEW.employee_id,
        'service_id', NEW.service_id,
        'scheduled_at', NEW.scheduled_at,
        'duration_minutes', NEW.duration_minutes,
        'price', NEW.price,
        'status', NEW.status,
        'notes', NEW.notes
      )::jsonb
    FROM client_calendars cc
    WHERE cc.client_id = NEW.client_id
      AND cc.shop_id = NEW.shop_id
      AND cc.enabled = TRUE
      AND cc.auto_sync = TRUE
      AND CASE 
          WHEN TG_OP = 'INSERT' THEN cc.sync_on_book
          WHEN TG_OP = 'UPDATE' THEN cc.sync_on_update
          ELSE TRUE
        END = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to appointments
CREATE TRIGGER trigger_appointment_calendar_sync
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION trigger_sync_event_on_appointment();

-- =====================================================
-- 5. VIEWS ÚTEIS
-- =====================================================

-- View: Calendar sync summary per client
CREATE OR REPLACE VIEW client_calendar_sync_summary AS
SELECT 
  cc.id,
  cc.client_id,
  cc.shop_id,
  cc.calendar_type,
  cc.calendar_name,
  cc.enabled,
  cc.sync_direction,
  COUNT(cse.id) FILTER (WHERE cse.status IN ('pending', 'synced')) AS pending_syncs,
  COUNT(cse.id) FILTER (WHERE cse.status = 'failed') AS failed_syncs,
  cse.created_at AS last_sync_attempt,
  CASE 
    WHEN cc.last_sync_status = 'failed' THEN 'error'
    WHEN COUNT(cse.id) FILTER (WHERE cse.status = 'pending') > 0 THEN 'syncing'
    WHEN NOT cc.enabled THEN 'disabled'
    ELSE 'synced'
  END AS sync_status
FROM client_calendars cc
LEFT JOIN calendar_sync_events cse 
  ON cse.client_calendar_id = cc.id 
  AND cse.created_at = (
    SELECT MAX(created_at) 
    FROM calendar_sync_events 
    WHERE client_calendar_id = cc.id
  )
GROUP BY cc.id, cse.created_at;

-- View: Active webhooks with health status
CREATE OR REPLACE VIEW webhook_health_summary AS
SELECT 
  cw.id,
  cw.client_calendar_id,
  cw.provider,
  cw.active,
  cw.failure_count,
  cw.last_triggered_at,
  cw.last_delivery_status,
  CASE 
    WHEN NOT cw.active THEN 'disabled'
    WHEN cw.failure_count >= 5 THEN 'unhealthy'
    WHEN cw.last_triggered_at IS NULL THEN 'never_triggered'
    WHEN cw.last_triggered_at < NOW() - INTERVAL '1 hour' THEN 'stale'
    WHEN cw.last_delivery_status = 'success' THEN 'healthy'
    ELSE 'unknown'
  END AS health_status
FROM calendar_webhooks cw;

-- =====================================================
-- 6. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Enable RLS
ALTER TABLE client_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can only see their own calendars
CREATE POLICY "Clients can view own calendars"
  ON client_calendars FOR SELECT
  USING (client_id = current_setting('app.current_user_id')::UUID);

-- Policy: Clients can insert own calendars
CREATE POLICY "Clients can insert own calendars"
  ON client_calendars FOR INSERT
  WITH CHECK (client_id = current_setting('app.current_user_id')::UUID);

-- Policy: Clients can update own calendars
CREATE POLICY "Clients can update own calendars"
  ON client_calendars FOR UPDATE
  USING (client_id = current_setting('app.current_user_id')::UUID);

-- Policy: Clients can delete own calendars
CREATE POLICY "Clients can delete own calendars"
  ON client_calendars FOR DELETE
  USING (client_id = current_setting('app.current_user_id')::UUID);

-- Policy: Sync events are read-only for clients
CREATE POLICY "Clients can view sync events for own calendars"
  ON calendar_sync_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_calendars cc
      WHERE cc.id = client_calendar_id
      AND cc.client_id = current_setting('app.current_user_id')::UUID
    )
  );

-- =====================================================
-- COMENTÁRIOS E NOTAS
-- =====================================================
-- 
-- Este script cria toda a infraestrutura de integração de calendários:
--
-- TABELAS:
-- - client_calendars: Armazena credenciais e configuração de calendários conectados
-- - calendar_sync_events: Rastreia每一次 sincronização de eventos
-- - calendar_webhooks: Gerencia webhooks para receber notificações de calendários externos
--
-- FEATURES:
-- - Suporte a Google, Outlook, Apple e outros
-- - Sincronização bidirecional opcional
-- - Detecção e resolução de conflitos
-- - Webhooks para sync em tempo real
-- - Views para dashboard de status
--
-- PRÓXIMOS PASSOS:
-- - Implementar google_calendar.py
-- - Implementar ics_exporter.py
-- - Implementar sync_job.py
-- - Criar componentes React UI
--
-- INTEGRAÇÕES NECESSÁRIAS:
-- - Google Calendar API (OAuth 2.0)
-- - Microsoft Graph API (Outlook)
-- - ICS Export (padrão RFC 5545)
--
