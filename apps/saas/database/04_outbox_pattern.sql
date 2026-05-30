-- =====================================================
-- BarberZap - Outbox Pattern (FASE 2 - Item 2.2)
-- =====================================================
-- Prioridade: 7 (IMPORTANTE)
-- Justificativa: Garante que notificações não são perdidas em falhas
-- Tempo estimado: 3-4 horas
-- =====================================================
-- O Outbox Pattern é essencial para garantir a confiabilidade
-- de envio de mensagens e eventos críticos.
--
-- Como funciona:
-- 1. Quando um evento ocorre (e.g., appointment criado),
--    um registro é inserido na tabela appointment_outbox
-- 2. Um worker processa o outbox periodicamente
-- 3. Para cada mensagem no outbox:
--    - Tenta enviar o evento (WhatsApp, etc)
--    - Se sucesso: marca como sent
--    - Se falha: marca como failed + increment retry_count
-- 4. Worker usa exponential backoff para retentativas
-- =====================================================

-- =====================================================
-- 1. APPOINTMENT_OUTBOX TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created',          -- Novo agendamento
    'confirmed',        -- Cliente confirmou
    'cancelled',        -- Cancelado
    'completed',        -- Concluído
    'no_show',          -- Cliente não compareceu
    'reminded_24h',     -- Lembrete 24h antes
    'reminded_2h'       -- Lembrete 2h antes
  )),
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'sent',
    'failed',
    'max_retries_exceeded'
  )),

  -- Retry configuration
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  source_system VARCHAR(50) DEFAULT 'webhook',  -- webhook, api, manual
  correlation_id UUID,

  -- Timestamps
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para worker高效扫描
CREATE INDEX idx_outbox_priority
  ON appointment_outbox(status, scheduled_at, created_at)
  WHERE status IN ('pending', 'failed') AND retry_count < max_retries;

CREATE INDEX idx_outbox_appointment
  ON appointment_outbox(appointment_id, event_type);

CREATE INDEX idx_outbox_shop
  ON appointment_outbox(shop_id, created_at DESC);

-- =====================================================
-- 2. MESSAGE_OUTBOX TABLE (Para WhatsApp messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,

  -- Destinatário
  phone_number VARCHAR(20) NOT NULL,

  -- Message content
  message_text TEXT NOT NULL,
  template_name VARCHAR(100),  -- Se usar approved WhatsApp templates

  -- Tipo de mensagem
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN (
    'booking_confirmation',
    'booking_reminder_24h',
    'booking_reminder_2h',
    'cancellation_notification',
    'reschedule_notification',
    'promotional',
    'support',
    'custom'
  )),

  -- Link ao appointment se aplicável
  appointment_id UUID REFERENCES appointments(id),

  -- Payload JSONB (para templates dinâmicos)
  payload JSONB,

  -- Status e retry
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'sent',
    'failed',
    'max_retries_exceeded',
    'cancelled'
  )),

  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMP WITH TIME ZONE,

  -- WhatsApp API response
  whatsapp_message_id VARCHAR(255),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Error tracking
  error_code VARCHAR(50),
  error_message TEXT,
  provider_response JSONB,

  -- Metadata
  correlation_id UUID,
  source_system VARCHAR(50) DEFAULT 'automation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para worker de mensagens
CREATE INDEX idx_message_outbox_pending
  ON message_outbox(status, created_at)
  WHERE status IN ('pending', 'failed') AND retry_count < max_retries;

CREATE INDEX idx_message_outbox_phone
  ON message_outbox(phone_number, created_at DESC);

CREATE INDEX idx_message_outbox_appointment
  ON message_outbox(appointment_id, message_type);

CREATE INDEX idx_message_outbox_shop
  ON message_outbox(shop_id, created_at DESC);

-- Índice para mensagens não entregues (alertas)
CREATE INDEX idx_message_outbox_failed
  ON message_outbox(shop_id, status, error_code, created_at DESC)
  WHERE status = 'failed';

-- =====================================================
-- 3. TRIGGERS PARA AUTOMATIC OUTBOX CREATION
-- =====================================================

-- Trigger: Quando appointment é criado, criar outbox entry
CREATE OR REPLACE FUNCTION appointment_created_outbox_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO appointment_outbox (
    shop_id,
    appointment_id,
    event_type,
    payload,
    scheduled_at,
    correlation_id
  ) VALUES (
    NEW.shop_id,
    NEW.id,
    'created',
    jsonb_build_object(
      'client_name', (SELECT name FROM clients WHERE id = NEW.client_id),
      'client_phone', (SELECT phone_number FROM clients WHERE id = NEW.client_id),
      'employee_name', (SELECT name FROM employees WHERE id = NEW.employee_id),
      'service_name', (SELECT name FROM services WHERE id = NEW.service_id),
      'scheduled_at', NEW.scheduled_at,
      'duration', NEW.duration_minutes,
      'price', NEW.price
    ),
    NOW(),
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointment_created_outbox
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION appointment_created_outbox_trigger();

-- Trigger: Quando appointment é cancelado, criar outbox entry
CREATE OR REPLACE FUNCTION appointment_cancelled_outbox_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    INSERT INTO appointment_outbox (
      shop_id,
      appointment_id,
      event_type,
      payload,
      scheduled_at,
      correlation_id
    ) VALUES (
      NEW.shop_id,
      NEW.id,
      'cancelled',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'cancelled_at', NEW.updated_at
      ),
      NOW(),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointment_cancelled_outbox
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE FUNCTION appointment_cancelled_outbox_trigger();

-- Trigger: Quando appointment é completado
CREATE OR REPLACE FUNCTION appointment_completed_outbox_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO appointment_outbox (
      shop_id,
      appointment_id,
      event_type,
      payload,
      scheduled_at,
      correlation_id
    ) VALUES (
      NEW.shop_id,
      NEW.id,
      'completed',
      jsonb_build_object(
        'completed_at', NEW.updated_at,
        'price_paid', NEW.price
      ),
      NOW(),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointment_completed_outbox
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION appointment_completed_outbox_trigger();

-- =====================================================
-- 4. TRIGGER UPDATE PARA message_outbox
-- =====================================================
-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION outbox_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointment_outbox_updated_at
  BEFORE UPDATE ON appointment_outbox
  FOR EACH ROW
  EXECUTE FUNCTION outbox_updated_at_trigger();

CREATE TRIGGER trigger_message_outbox_updated_at
  BEFORE UPDATE ON message_outbox
  FOR EACH ROW
  EXECUTE FUNCTION outbox_updated_at_trigger();

-- =====================================================
-- 5. VIEW: Outbox Processing Queue
-- =====================================================
-- Esta view facilita o worker a buscar mensagens para processar
CREATE OR REPLACE VIEW v_outbox_processing_queue AS
SELECT
  'appointment' as outbox_type,
  ao.id,
  ao.shop_id,
  ao.appointment_id,
  ao.event_type as message_type,
  ao.payload,
  ao.status,
  ao.retry_count,
  ao.max_retries,
  ao.scheduled_at,
  ao.created_at
FROM appointment_outbox ao
WHERE ao.status IN ('pending', 'failed')
  AND ao.retry_count < ao.max_retries

UNION ALL

SELECT
  'message' as outbox_type,
  mo.id,
  mo.shop_id,
  NULL as appointment_id,
  mo.message_type,
  jsonb_build_object(
    'phone', mo.phone_number,
    'text', mo.message_text,
    'template', mo.template_name,
    'payload', mo.payload
  ) as payload,
  mo.status,
  mo.retry_count,
  mo.max_retries,
  mo.scheduled_at,
  mo.created_at
FROM message_outbox mo
WHERE mo.status IN ('pending', 'failed')
  AND mo.retry_count < mo.max_retries

ORDER BY scheduled_at ASC, created_at ASC;

-- =====================================================
-- 6. FUNÇÕES HELPER
-- =====================================================

-- Função: Marcar outbox entry como em processamento
CREATE OR REPLACE FUNCTION mark_outbox_processing(outbox_id UUID, outbox_type VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  IF outbox_type = 'appointment' THEN
    UPDATE appointment_outbox
    SET status = 'processing',
        last_retry_at = NOW(),
        retry_count = retry_count + 1
    WHERE id = outbox_id AND status IN ('pending', 'failed');
  ELSIF outbox_type = 'message' THEN
    UPDATE message_outbox
    SET status = 'processing',
        last_retry_at = NOW(),
        retry_count = retry_count + 1
    WHERE id = outbox_id AND status IN ('pending', 'failed');
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função: Marcar outbox entry como enviado com sucesso
CREATE OR REPLACE FUNCTION mark_outbox_sent(outbox_id UUID, outbox_type VARCHAR, whatsapp_message_id VARCHAR DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF outbox_type = 'appointment' THEN
    UPDATE appointment_outbox
    SET status = 'sent',
        sent_at = NOW()
    WHERE id = outbox_id;
  ELSIF outbox_type = 'message' THEN
    UPDATE message_outbox
    SET status = 'sent',
        sent_at = NOW(),
        whatsapp_message_id = COALESCE(whatsapp_message_id, message_outbox.whatsapp_message_id),
        delivered_at = NOW()  -- Assume instant delivery on success
    WHERE id = outbox_id;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função: Marcar outbox entry como falhado
CREATE OR REPLACE FUNCTION mark_outbox_failed(outbox_id UUID, outbox_type VARCHAR, error_code VARCHAR, error_message TEXT, provider_response JSONB DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF outbox_type = 'appointment' THEN
    UPDATE appointment_outbox
    SET status = CASE
      WHEN retry_count >= max_retries THEN 'max_retries_exceeded'
      ELSE 'failed'
    END,
        error_code = error_code,
        error_message = error_message
    WHERE id = outbox_id;
  ELSIF outbox_type = 'message' THEN
    UPDATE message_outbox
    SET status = CASE
      WHEN retry_count >= max_retries THEN 'max_retries_exceeded'
      ELSE 'failed'
    END,
        error_code = error_code,
        error_message = error_message,
        provider_response = provider_response
    WHERE id = outbox_id;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. MONITORAMENTO E MÉTRICAS
-- =====================================================

-- View para monitorar health do outbox
CREATE OR REPLACE VIEW v_outbox_health_metrics AS
SELECT
  'appointment' as outbox_type,
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'max_retries_exceeded') as permanently_failed,
  COALESCE(AVG(CASE WHEN sent_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sent_at - created_at))
  END), 0) as avg_delivery_seconds,
  COALESCE(AVG(retry_count), 0) as avg_retry_count
FROM appointment_outbox
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'message' as outbox_type,
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'max_retries_exceeded') as permanently_failed,
  COALESCE(AVG(CASE WHEN sent_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sent_at - created_at))
  END), 0) as avg_delivery_seconds,
  COALESCE(AVG(retry_count), 0) as avg_retry_count
FROM message_outbox
WHERE created_at > NOW() - INTERVAL '24 hours';

-- =====================================================
-- INSTRUÇÕES PARA O WORKER
-- =====================================================
--
-- Worker deve usar a seguinte lógica:
--
-- 1. Query a cada 10-30 segundos:
--    SELECT * FROM v_outbox_processing_queue
--    WHERE scheduled_at <= NOW()
--    LIMIT 50
--    FOR UPDATE SKIP LOCKED;
--
-- 2. Para cada mensagem:
--    a. Mark como processing: mark_outbox_processing()
--    b. Enviar (WhatsApp API)
--    c. Se sucesso: mark_outbox_sent()
--    d. Se falha: mark_outbox_failed()
--       - Wait longer between retries (exponential backoff)
--
-- 3. Monitorar:
--    SELECT * FROM v_outbox_health_metrics;
--
-- 4. Alertar se:
--    - pending_count > 100
--    - permanently_failed_count > 5
--    - avg_delivery_seconds > 60
--
-- =====================================================
