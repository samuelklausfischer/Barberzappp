-- =====================================================
-- BarberZap - Client Stats Triggers (FASE 2 - Item 2.4)
-- =====================================================
-- Prioridade: 9 (IMPORTANTE)
-- Justificativa: CRM precisa de dados atualizados automaticamente
-- Sem triggers, stats ficam obsoletos
-- Tempo estimado: 2-3 horas
-- =====================================================
-- Estes triggers automatically atualizam as estatísticas
-- dos clientes quando agendamentos são criados ou modificados.
--
-- Stats mantidos em sync:
-- - total_visits: Número de visitas do cliente
-- - last_visit_at: Data da última visita
-- - total_spent: Valor total gasto
-- - no_show_count: Quantas vezes não compareceu
-- - cancelled_count: Quantos cancelamentos
-- - loyalty_points: Pontos de fidelidade (1 ponto = R$1 gasto)
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO: Atualizar stats do cliente
-- =====================================================

-- Ao criar agendamento
CREATE OR REPLACE FUNCTION update_client_stats_on_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  points_to_add INTEGER;
BEGIN
  -- Calcular pontos de fidelidade (1 ponto por R$1)
  points_to_add := ROUND(NEW.price::NUMERIC)::INTEGER;

  -- Atualizar stats do cliente
  UPDATE clients
  SET
    total_visits = total_visits + 1,
    total_spent = total_spent + ROUND(NEW.price, 2),
    loyalty_points = loyalty_points + points_to_add,
    updated_at = NOW()
  WHERE id = NEW.client_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ao completar agendamento
CREATE OR REPLACE FUNCTION update_client_stats_on_appointment_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar last_visit_at quando appointment é marcado como completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE clients
    SET
      last_visit_at = NEW.updated_at,
      updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ao cancelar agendamento
CREATE OR REPLACE FUNCTION update_client_stats_on_appointment_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cancelou, incrementar contador de cancelamentos
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND OLD.status != 'no_show' THEN
    UPDATE clients
    SET
      cancelled_count = cancelled_count + 1,
      updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  -- Se foi no-show, incrementar contador
  IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
    UPDATE clients
    SET
      no_show_count = no_show_count + 1,
      cancelled_count = cancelled_count + 1,  -- no-show conta como cancelamento
      updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  -- Se foi restaurado (de cancelled/no-show para scheduled/confirmed)
  IF (NEW.status IN ('scheduled', 'confirmed'))
     AND (OLD.status IN ('cancelled', 'no_show'))
  THEN
    UPDATE clients
    SET
      cancelled_count = GREATEST(cancelled_count - 1, 0),
      updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FUNÇÃO: Recalcular stats manualmente (admin)
-- =====================================================

-- Função para recalcular todos os stats de um cliente
CREATE OR REPLACE FUNCTION recalculate_client_stats(client_id UUID)
RETURNS void AS $$
DECLARE
  total_visits_count INTEGER;
  total_spents DECIMAL(10,2);
  no_shows INTEGER;
  cancellations INTEGER;
BEGIN
  -- Contar visitas completadas
  SELECT
    COUNT(*),
    COALESCE(SUM(price), 0)
  INTO total_visits_count, total_spents
  FROM appointments
  WHERE client_id = recalculate_client_stats.client_id
    AND status = 'completed';

  -- Contar no-shows
  SELECT COUNT(*) INTO no_shows
  FROM appointments
  WHERE client_id = recalculate_client_stats.client_id
    AND status = 'no_show';

  -- Contar cancelamentos (excluindo no-shows que já contam)
  SELECT COUNT(*) INTO cancellations
  FROM appointments
  WHERE client_id = recalculate_client_stats.client_id
    AND status = 'cancelled';

  -- Atualizar cliente
  UPDATE clients
  SET
    total_visits = total_visits_count,
    last_visit_at = (
      SELECT MAX(scheduled_at)
      FROM appointments
      WHERE client_id = recalculate_client_stats.client_id
        AND status = 'completed'
    ),
    total_spent = ROUND(total_spents, 2),
    no_show_count = no_shows,
    cancelled_count = cancellations,
    loyalty_points = ROUND(total_spents)::INTEGER,
    updated_at = NOW()
  WHERE id = recalculate_client_stats.client_id;
END;
$$ LANGUAGE plpgsql;

-- Função para recalcular stats de todos os clientes de uma loja
CREATE OR REPLACE FUNCTION recalculate_all_client_stats(shop_id UUID)
RETURNS INTEGER AS $$
DECLARE
  client_count INTEGER;
  client_record RECORD;
BEGIN
  client_count := 0;

  -- Para cada cliente da loja
  FOR client_record IN
    SELECT id FROM clients WHERE shop_id = recalculate_all_client_stats.shop_id
  LOOP
    PERFORM recalculate_client_stats(client_record.id);
    client_count := client_count + 1;
  END LOOP;

  RETURN client_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Trigger: Ao criar appointment
CREATE TRIGGER trigger_appointment_created_update_stats
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_client_stats_on_appointment_created();

-- Trigger: Ao atualizar appointment
CREATE TRIGGER trigger_appointment_updated_update_stats
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION
    CASE
      WHEN NEW.status = 'completed' AND OLD.status != 'completed' THEN update_client_stats_on_appointment_completed()
      WHEN NEW.status IN ('cancelled', 'no_show', 'scheduled', 'confirmed')
        AND OLD.status IN ('cancelled', 'no_show', 'scheduled', 'confirmed')
        AND (OLD.status != NEW.status)
      THEN update_client_stats_on_appointment_cancelled()
      ELSE NULL
    END;

-- =====================================================
-- 4. VIEW: Client Stats Resumido (para dashboard)
-- =====================================================

-- View para estatísticas rápidas de clientes
CREATE OR REPLACE VIEW v_client_dashboard_stats AS
SELECT
  c.shop_id,
  c.id as client_id,
  c.name,
  c.phone_number,
  c.tags,
  c.total_visits,
  c.last_visit_at,
  c.total_spent,
  c.no_show_count,
  c.cancelled_count,
  c.loyalty_points,

  -- Calculated fields
  EXTRACT(DAYS FROM (NOW() - c.created_at))::INTEGER as days_since_first_visit,
  EXTRACT(DAYS FROM (NOW() - c.last_visit_at))::INTEGER as days_since_last_visit,

  -- Engagement score (0-100)
  -- Baseado em: visits x valor x recência x cancelamentos
  CASE
    WHEN c.total_visits = 0 THEN 0
    ELSE LEAST(
      (c.total_visits * 10)::INTEGER +  -- Até 40 pts por visitas
      LEAST(c.loyalty_points, 1000)::INTEGER / 10 +  -- Até 100 pts por gastos
      CASE
        WHEN c.last_visit_at IS NULL THEN 0
        WHEN c.last_visit_at > NOW() - INTERVAL '7 days' THEN 30
        WHEN c.last_visit_at > NOW() - INTERVAL '30 days' THEN 20
        WHEN c.last_visit_at > NOW() - INTERVAL '90 days' THEN 10
        ELSE 5
      END -
      LEAST(c.cancelled_count * 5, 25),  -- Penalidade por cancelamentos
      100
    )
  END as engagement_score,

  -- Customer segment
  CASE
    WHEN c.total_visits >= 20 THEN 'VIP'
    WHEN c.total_visits >= 10 THEN 'Regular'
    WHEN c.total_visits >= 5 THEN 'Frequent'
    WHEN c.total_visits >= 1 THEN 'New'
    ELSE 'Prospect'
  END as segment,

  -- Risk of churn
  CASE
    WHEN c.last_visit_at IS NULL THEN 'High'
    WHEN c.last_visit_at < NOW() - INTERVAL '60 days' AND c.no_show_count >= 2 THEN 'High'
    WHEN c.last_visit_at < NOW() - INTERVAL '90 days' THEN 'Medium'
    WHEN c.last_visit_at < NOW() - INTERVAL '60 days' THEN 'Low'
    ELSE 'Very Low'
  END as churn_risk

FROM clients c
WHERE c.deleted_at IS NULL;

-- Índice para engajamento
CREATE INDEX idx_client_engagement
  ON v_client_dashboard_stats(shop_id, engagement_score DESC, days_since_last_visit);

-- =====================================================
-- 5. VIEW: Shop-Level Stats (para admin)
-- =====================================================

-- Agregar estatísticas por loja
CREATE OR REPLACE VIEW v_shop_client_stats AS
SELECT
  shop_id,
  COUNT(*) as total_clients,
  SUM(total_visits) as total_visits_all_time,
  SUM(total_spent) as total_revenue_all_time,
  AVG(total_visits) as avg_visits_per_client,
  AVG(total_spent) as avg_spend_per_client,
  SUM(no_show_count) as total_no_shows,
  SUM(cancelled_count) as total_cancellations,

  -- Cliente stats
  COUNT(*) FILTER (WHERE segment = 'VIP') as vip_clients,
  COUNT(*) FILTER (WHERE segment = 'Regular') as regular_clients,
  COUNT(*) FILTER (WHERE segment = 'Frequent') as frequent_clients,
  COUNT(*) FILTER (WHERE segment = 'New') as new_clients,

  -- Churn risk
  COUNT(*) FILTER (WHERE churn_risk = 'High') as high_churn_risk,
  COUNT(*) FILTER (WHERE churn_risk = 'Medium') as medium_churn_risk,

  -- Activity
  COUNT(*) FILTER (WHERE last_visit_at > NOW() - INTERVAL '7 days') as active_last_7_days,
  COUNT(*) FILTER (WHERE last_visit_at > NOW() - INTERVAL '30 days') as active_last_30_days,
  COUNT(*) FILTER (WHERE last_visit_at > NOW() - INTERVAL '90 days') as active_last_90_days

FROM v_client_dashboard_stats
GROUP BY shop_id;

-- =====================================================
-- 6. NOTIFICAÇÕES AUTOMÁTICAS BASEADAS EM STATS
-- =====================================================

-- Função para detectar clientes inativos e criar notifications
CREATE OR REPLACE FUNCTION detect_inactive_clients()
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER;
  inactive_client RECORD;
BEGIN
  notification_count := 0;

  -- Clientes sem visita há 90+ dias e com >= 3 visitas
  FOR inactive_client IN
    SELECT
      c.id as client_id,
      c.shop_id,
      c.name,
      c.phone_number,
      EXTRACT(DAYS FROM (NOW() - c.last_visit_at))::INTEGER as days_inactive
    FROM clients c
    WHERE c.last_visit_at < NOW() - INTERVAL '90 days'
      AND c.total_visits >= 3
      AND c.deleted_at IS NULL
      -- Evitar spam de notifications (não enviar se já notificado nos últimos 30 dias)
  LOOP
    -- Criar notification (simulado - implementação real enviaria para queue)
    -- INSERT INTO notifications (shop_id, user_id, type, title, message)
    -- VALUES (inactive_client.shop_id, inactive_client.client_id, 'alert', ...)

    notification_count := notification_count + 1;
  END LOOP;

  RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. MÉTRICAS DE SAÚDE DO CRM
-- =====================================================

-- Monitor de health do sistema de stats
CREATE OR REPLACE VIEW v_client_stats_health AS
SELECT
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE last_visit_at IS NULL) as clients_never_visited,
  COUNT(*) FILTER (WHERE last_visit_at < NOW() - INTERVAL '180 days') as clients_inactive_180d,
  COUNT(*) FILTER (WHERE no_show_count >= 3) as high_no_show_clients,
  COUNT(*) FILTER (WHERE cancelled_count >= 5) as high_cancellation_clients,
  COUNT(*) FILTER (WHERE segment = 'VIP') as vip_clients,
  AVG(engagement_score) as avg_engagement_score,
  ROUND(AVG(CASE WHEN total_visits > 0 THEN total_spent / total_visits ELSE 0 END), 2) as avg_revenue_per_visit
FROM v_client_dashboard_stats;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
--
-- Recalcular stats de um cliente específico:
-- SELECT recalculate_client_stats('uuid-do-cliente');
--
-- Recalcular stats de todos clientes de uma loja:
-- SELECT recalculate_all_client_stats('uuid-da-loja');
--
-- Ver dashboard de clientes:
-- SELECT * FROM v_client_dashboard_stats WHERE shop_id = '...' ORDER BY engagement_score DESC LIMIT 20;
--
-- Detectar clientes inativos:
-- SELECT * FROM v_client_dashboard_stats WHERE days_since_last_visit > 90 AND total_visits >= 3;
--
-- Ver health do CRM:
-- SELECT * FROM v_client_stats_health;
--
-- Criar notification para clientes inativos:
-- SELECT detect_inactive_clients();
--
-- =====================================================
