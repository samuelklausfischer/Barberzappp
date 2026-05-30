-- =====================================================
-- BarberZap - Optimistic Locking (FASE 1.5 - Item 1.5)
-- =====================================================
-- Prioridade: 3 (CRÍTICO)
-- Justificativa: Race conditions causam double-booking e perda de receita
-- Tempo estimado: 3-4 horas
-- =====================================================
-- Este script implementa optimistic locking para prevenir
-- conflitos de concorrência em agendamentos simultâneos.
--
-- Problemas resolvidos:
-- - Double-booking: 2 clientes marcam mesmo slot simultaneamente
-- - Simultaneous updates: 2 usuários editam mesmo appointment
-- - Race conditions em cancelamentos
--
-- Como funciona:
-- 1. Cada tabela com version incrementa automaticamente em UPDATE
-- 2. Operações atômicas checam antes de modificar
-- 3. Conflitos são logados em audit_logs para análise
-- 4. Funções retornam códigos específicos para retry
-- =====================================================

-- =====================================================
-- 1. ENUMS E CONSTANTES
-- =====================================================

-- Tipos de conflito para logging
CREATE TYPE conflict_type AS ENUM (
  'version_mismatch',
  'double_booking',
  'slot_conflict',
  'concurrent_update',
  'concurrent_cancellation',
  'stale_data'
);

-- Códigos de resultado para operações atômicas
CREATE TYPE atomic_result_code AS ENUM (
  'success',
  'version_mismatch',
  'slot_not_available',
  'payment_pending',
  'service_unavailable',
  'employee_unavailable',
  'not_found',
  'permission_denied',
  'invalid_data',
  'unknown_error'
);

-- =====================================================
-- 2. FUNÇÕES ATÔMICAS: APPOINTMENTS
-- =====================================================

-- -----------------------------------------------------
-- book_appointment_atomic()
-- Cria agendamento com verificação de disponibilidade
-- e previne double-booking
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION book_appointment_atomic(
  p_shop_id UUID,
  p_client_id UUID,
  p_employee_id UUID,
  p_service_id UUID,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_version INTEGER DEFAULT 1,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_service_duration INTEGER;
  v_service_price DECIMAL(10,2);
  v_existing_appointment_count INTEGER;
  v_appointment_id UUID;
  v_time_slot_start TIMESTAMP WITH TIME ZONE;
  v_time_slot_end TIMESTAMP WITH TIME ZONE;
  v_employee_active BOOLEAN;
  v_client_active BOOLEAN;
  v_employee_name VARCHAR(255);
  v_client_name VARCHAR(255);
  v_service_name VARCHAR(255);
BEGIN
  -- Inicializar resultado
  v_result := jsonb_build_object(
    'success', false,
    'code', 'unknown_error',
    'message', 'Unknown error occurred',
    'data', NULL::JSONB
  );

  -- Validar dados de entrada
  IF p_shop_id IS NULL OR p_client_id IS NULL OR 
     p_employee_id IS NULL OR p_service_id IS NULL OR 
     p_scheduled_at IS NULL THEN
    v_result := jsonb_set(v_result, '{code}', '"invalid_data"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Missing required parameters: shop_id, client_id, employee_id, service_id, or scheduled_at'::jsonb);
    
    -- Log do erro
    INSERT INTO audit_logs (shop_id, table_name, record_id, action, new_data)
    VALUES (p_shop_id, 'appointments', NULL, 'INSERT', v_result);
    
    RETURN v_result;
  END IF;

  -- Buscar informações do serviço
  SELECT duration_minutes, price, name, active
  INTO v_service_duration, v_service_price, v_service_name, v_employee_active
  FROM services
  WHERE id = p_service_id AND shop_id = p_shop_id;

  IF NOT FOUND THEN
    v_result := jsonb_set(v_result, '{code}', '"service_unavailable"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Service not found or inactive'::jsonb);
    RETURN v_result;
  END IF;

  -- Checar se o serviço está ativo
  IF v_employee_active = FALSE THEN
    v_result := jsonb_set(v_result, '{code}', '"service_unavailable"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Service is currently unavailable'::jsonb);
    RETURN v_result;
  END IF;

  -- Buscar informações do funcionário
  SELECT e.name, e.active
  INTO v_employee_name, v_employee_active
  FROM employees e
  WHERE e.id = p_employee_id AND e.shop_id = p_shop_id;

  IF NOT FOUND THEN
    v_result := jsonb_set(v_result, '{code}', '"employee_unavailable"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Employee not found'::jsonb);
    RETURN v_result;
  END IF;

  IF v_employee_active = FALSE THEN
    v_result := jsonb_set(v_result, '{code}', '"employee_unavailable"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Employee is currently unavailable'::jsonb);
    RETURN v_result;
  END IF;

  -- Buscar informações do cliente
  SELECT c.name, c.deleted_at IS NOT NULL
  INTO v_client_name, v_client_active
  FROM clients c
  WHERE c.id = p_client_id AND c.shop_id = p_shop_id;

  IF NOT FOUND THEN
    v_result := jsonb_set(v_result, '{code}', '"invalid_data"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Client not found'::jsonb);
    RETURN v_result;
  END IF;

  IF v_client_active = TRUE THEN
    v_result := jsonb_set(v_result, '{code}', '"invalid_data"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Client account is deleted'::jsonb);
    RETURN v_result;
  END IF;

  -- Calcular time slot
  v_time_slot_start := p_scheduled_at;
  v_time_slot_end := p_scheduled_at + (v_service_duration || ' minutes')::INTERVAL;

  -- Verificar disponibilidade do slot (CRÍTICO: prevenir double-booking)
  SELECT COUNT(*)
  INTO v_existing_appointment_count
  FROM appointments a
  WHERE a.shop_id = p_shop_id
    AND a.employee_id = p_employee_id
    AND a.status NOT IN ('cancelled', 'no_show')
    AND (
      -- Overlap detection: (StartA < EndB) and (EndA > StartB)
      a.scheduled_at < v_time_slot_end
      AND (a.scheduled_at + (a.duration_minutes || ' minutes')::INTERVAL) > v_time_slot_start
    );

  -- Se slot ocupado, retornar erro
  IF v_existing_appointment_count > 0 THEN
    v_result := jsonb_set(v_result, '{code}', '"slot_not_available"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Time slot is already booked by another customer'::jsonb);
    v_result := jsonb_set(v_result, '{data}', jsonb_build_object(
      'conflicting_appointments', v_existing_appointment_count,
      'time_slot_start', v_time_slot_start,
      'time_slot_end', v_time_slot_end,
      'employee_id', p_employee_id,
      'employee_name', v_employee_name
    ));
    
    -- Log do conflito de double-booking
    INSERT INTO audit_logs (
      shop_id,
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      changed_by
    ) VALUES (
      p_shop_id,
      'appointments',
      NULL,
      'INSERT',
      jsonb_build_object(
        'conflict_type', 'double_booking',
        'client_id', p_client_id,
        'client_name', v_client_name,
        'employee_id', p_employee_id,
        'employee_name', v_employee_name,
        'service_id', p_service_id,
        'service_name', v_service_name,
        'time_slot_start', v_time_slot_start,
        'time_slot_end', v_time_slot_end,
        'existing_appointments', v_existing_appointment_count
      ),
      v_result,
      'system'
    );
    
    RETURN v_result;
  END IF;

  -- Criar o agendamento
  INSERT INTO appointments (
    shop_id,
    client_id,
    employee_id,
    service_id,
    scheduled_at,
    duration_minutes,
    price,
    status,
    notes,
    version
  ) VALUES (
    p_shop_id,
    p_client_id,
    p_employee_id,
    p_service_id,
    p_scheduled_at,
    v_service_duration,
    v_service_price,
    'scheduled',
    p_notes,
    p_version
  )
  RETURNING id INTO v_appointment_id;

  -- Sucesso!
  v_result := jsonb_build_object(
    'success', true,
    'code', 'success',
    'message', 'Appointment booked successfully',
    'data', jsonb_build_object(
      'appointment_id', v_appointment_id,
      'shop_id', p_shop_id,
      'client_id', p_client_id,
      'client_name', v_client_name,
      'employee_id', p_employee_id,
      'employee_name', v_employee_name,
      'service_id', p_service_id,
      'service_name', v_service_name,
      'scheduled_at', v_time_slot_start,
      'scheduled_end', v_time_slot_end,
      'duration_minutes', v_service_duration,
      'price', v_service_price,
      'version', p_version
    )
  );

  -- Log do sucesso
  INSERT INTO audit_logs (shop_id, table_name, record_id, action, new_data)
  VALUES (p_shop_id, 'appointments', v_appointment_id, 'INSERT', v_result);

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro inesperado
    v_result := jsonb_build_object(
      'success', false,
      'code', 'unknown_error',
      'message', SQLERRM,
      'data', jsonb_build_object('error_code', SQLSTATE)
    );
    
    INSERT INTO audit_logs (shop_id, table_name, record_id, action, new_data)
    VALUES (p_shop_id, 'appointments', NULL, 'INSERT', v_result);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- update_appointment_atomic()
-- Atualiza agendamento com verificação de version
-- para prevenir lost updates
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_appointment_atomic(
  p_appointment_id UUID,
  p_shop_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_old_data JSONB;
  v_new_data JSONB;
  v_current_version INTEGER;
  v_current_status VARCHAR(50);
  v_client_id UUID;
  v_employee_id UUID;
  v_service_id UUID;
  v_old_scheduled_at TIMESTAMP WITH TIME ZONE;
  v_new_scheduled_at TIMESTAMP WITH TIME ZONE;
  v_old_employee_id UUID;
  v_new_employee_id UUID;
BEGIN
  -- Inicializar resultado
  v_result := jsonb_build_object(
    'success', false,
    'code', 'unknown_error',
    'message', 'Unknown error occurred',
    'data', NULL::JSONB
  );

  -- Validar parâmetros
  IF p_appointment_id IS NULL OR p_expected_version IS NULL THEN
    v_result := jsonb_set(v_result, '{code}', '"invalid_data"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Missing required parameters: appointment_id or expected_version'::jsonb);
    RETURN v_result;
  END IF;

  -- Buscar agendamento atual
  SELECT 
    jsonb_build_object(
      'id', id,
      'shop_id', shop_id,
      'client_id', client_id,
      'employee_id', employee_id,
      'service_id', service_id,
      'scheduled_at', scheduled_at,
      'duration_minutes', duration_minutes,
      'price', price,
      'status', status,
      'notes', notes,
      'version', version
    ),
    version,
    status,
    client_id,
    employee_id,
    service_id,
    scheduled_at
  INTO v_old_data, v_current_version, v_current_status, 
      v_client_id, v_employee_id, v_service_id, v_old_scheduled_at
  FROM appointments
  WHERE id = p_appointment_id;

  -- Se não encontrado
  IF NOT FOUND THEN
    v_result := jsonb_set(v_result, '{code}', '"not_found"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Appointment not found'::jsonb);
    RETURN v_result;
  END IF;

  -- Verificar se shop_id bate
  IF p_shop_id IS NOT NULL AND (v_old_data->>'shop_id')::UUID != p_shop_id THEN
    v_result := jsonb_set(v_result, '{code}', '"permission_denied"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Appointment does not belong to this shop'::jsonb);
    RETURN v_result;
  END IF;

  -- Verificar version (OPTIMISTIC LOCKING CORE)
  IF v_current_version != p_expected_version THEN
    v_result := jsonb_set(v_result, '{code}', '"version_mismatch"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Appointment was modified by another user. Please refresh and try again.'::jsonb);
    v_result := jsonb_set(v_result, '{data}', jsonb_build_object(
      'expected_version', p_expected_version,
      'current_version', v_current_version,
      'old_data', v_old_data
    ));
    
    -- Log do conflito
    INSERT INTO audit_logs (
      shop_id,
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      changed_by
    ) VALUES (
      (v_old_data->>'shop_id')::UUID,
      'appointments',
      p_appointment_id,
      'UPDATE',
      jsonb_build_object(
        'conflict_type', 'version_mismatch',
        'expected_version', p_expected_version,
        'current_version', v_current_version,
        'attempted_updates', p_updates
      ),
      v_result,
      'system'
    );
    
    RETURN v_result;
  END IF;

  -- Preparar novos dados
  v_new_data := v_old_data;

  -- Processar updates permitidos
  IF p_updates ? 'scheduled_at' THEN
    v_new_scheduled_at := (p_updates->>'scheduled_at')::TIMESTAMP WITH TIME ZONE;
    v_new_data := jsonb_set(v_new_data, '{scheduled_at}', to_jsonb(v_new_scheduled_at));
  ELSE
    v_new_scheduled_at := v_old_scheduled_at;
  END IF;

  IF p_updates ? 'employee_id' THEN
    v_new_employee_id := (p_updates->>'employee_id')::UUID;
    v_new_data := jsonb_set(v_new_data, '{employee_id}', to_jsonb(v_new_employee_id));
  ELSE
    v_new_employee_id := v_old_employee_id;
  END IF;

  -- Não permitir alterar shop_id, client_id, service_id, price, duration
  -- (esses campos não devem mudar após criação)

  IF p_updates ? 'status' THEN
    v_new_data := jsonb_set(v_new_data, '{status}', p_updates->'status');
  END IF;

  IF p_updates ? 'notes' THEN
    v_new_data := jsonb_set(v_new_data, '{notes}', p_updates->'notes');
  END IF;

  -- Se mudou scheduled_at ou employee_id, verificar disponibilidade
  IF (p_updates ? 'scheduled_at' OR p_updates ? 'employee_id') THEN
    DECLARE
      v_duration INTEGER;
      v_time_slot_start TIMESTAMP WITH TIME ZONE;
      v_time_slot_end TIMESTAMP WITH TIME ZONE;
      v_conflict_count INTEGER;
    BEGIN
      v_duration := (v_old_data->>'duration_minutes')::INTEGER;
      v_time_slot_start := v_new_scheduled_at;
      v_time_slot_end := v_new_scheduled_at + (v_duration || ' minutes')::INTERVAL;

      -- Verificar conflitos (ignorando este appointment)
      SELECT COUNT(*)
      INTO v_conflict_count
      FROM appointments a
      WHERE a.shop_id = (v_old_data->>'shop_id')::UUID
        AND a.employee_id = v_new_employee_id
        AND a.status NOT IN ('cancelled', 'no_show')
        AND a.id != p_appointment_id
        AND (
          a.scheduled_at < v_time_slot_end
          AND (a.scheduled_at + (a.duration_minutes || ' minutes')::INTERVAL) > v_time_slot_start
        );

      IF v_conflict_count > 0 THEN
        v_result := jsonb_set(v_result, '{code}', '"slot_not_available"'::jsonb);
        v_result := jsonb_set(v_result, '{message}', 
          'Time slot conflict: slot is already booked'::jsonb);
        v_result := jsonb_set(v_result, '{data}', jsonb_build_object(
          'conflicting_appointments', v_conflict_count,
          'time_slot_start', v_time_slot_start,
          'time_slot_end', v_time_slot_end
        ));
        
        -- Log do conflito
        INSERT INTO audit_logs (
          shop_id,
          table_name,
          record_id,
          action,
          old_data,
          new_data,
          changed_by
        ) VALUES (
          (v_old_data->>'shop_id')::UUID,
          'appointments',
          p_appointment_id,
          'UPDATE',
          jsonb_build_object(
            'conflict_type', 'slot_conflict',
            'expected_version', p_expected_version,
            'current_version', v_current_version,
            'attempted_updates', p_updates
          ),
          v_result,
          'system'
        );
        
        RETURN v_result;
      END IF;
    END;
  END IF;

  -- Atualizar appointment (com version increment)
  UPDATE appointments
  SET
    scheduled_at = COALESCE((p_updates->>'scheduled_at')::TIMESTAMP WITH TIME ZONE, scheduled_at),
    employee_id = COALESCE((p_updates->>'employee_id')::UUID, employee_id),
    service_id = COALESCE((p_updates->>'service_id')::UUID, service_id),
    status = COALESCE(p_updates->>'status', status),
    notes = COALESCE(p_updates->>'notes', notes),
    updated_at = NOW(),
    version = version + 1
  WHERE id = p_appointment_id
    AND version = p_expected_version;

  -- Verificar se atualizou (poderia ter sido atualizado por outro processo)
  IF NOT FOUND THEN
    v_result := jsonb_set(v_result, '{code}', '"version_mismatch"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Appointment was modified by another user. Please refresh and try again.'::jsonb);
    RETURN v_result;
  END IF;

  -- Atualizar new_data com novo version
  v_new_data := jsonb_set(v_new_data, '{version}', to_jsonb(v_current_version + 1));
  v_new_data := jsonb_set(v_new_data, '{updated_at}', to_jsonb(NOW()));

  -- Sucesso!
  v_result := jsonb_build_object(
    'success', true,
    'code', 'success',
    'message', 'Appointment updated successfully',
    'data', v_new_data
  );

  -- Log do sucesso
  INSERT INTO audit_logs (
    shop_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    (v_old_data->>'shop_id')::UUID,
    'appointments',
    p_appointment_id,
    'UPDATE',
    v_old_data,
    v_result,
    'system'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'code', 'unknown_error',
      'message', SQLERRM,
      'data', jsonb_build_object('error_code', SQLSTATE)
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- cancel_appointment_atomic()
-- Cancela agendamento com verificação de version
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_appointment_atomic(
  p_appointment_id UUID,
  p_shop_id UUID,
  p_expected_version INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_old_data JSONB;
  v_current_version INTEGER;
  v_current_status VARCHAR(50);
  v_client_id UUID;
BEGIN
  -- Inicializar resultado
  v_result := jsonb_build_object(
    'success', false,
    'code', 'unknown_error',
    'message', 'Unknown error occurred',
    'data', NULL::JSONB
  );

  -- Validar parâmetros
  IF p_appointment_id IS NULL OR p_expected_version IS NULL THEN
    v_result := jsonb_set(v_result, '{code}', '"invalid_data"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Missing required parameters: appointment_id or expected_version'::jsonb);
    RETURN v_result;
  END IF;

  -- Buscar agendamento atual
  SELECT 
    jsonb_build_object(
      'id', id,
      'shop_id', shop_id,
      'client_id', client_id,
      'employee_id', employee_id,
      'service_id', service_id,
      'scheduled_at', scheduled_at,
      'status', status,
      'version', version
    ),
    version,
    status,
    client_id
  INTO v_old_data, v_current_version, v_current_status, v_client_id
  FROM appointments
  WHERE id = p_appointment_id;

  -- Se não encontrado
  IF NOT FOUND THEN
    v_result := jsonb_set(v_result, '{code}', '"not_found"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Appointment not found'::jsonb);
    RETURN v_result;
  END IF;

  -- Verificar se shop_id bate
  IF p_shop_id IS NOT NULL AND (v_old_data->>'shop_id')::UUID != p_shop_id THEN
    v_result := jsonb_set(v_result, '{code}', '"permission_denied"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Appointment does not belong to this shop'::jsonb);
    RETURN v_result;
  END IF;

  -- Verificar se já está cancelado
  IF v_current_status IN ('cancelled', 'no_show', 'completed') THEN
    v_result := jsonb_set(v_result, '{code}', '"invalid_data"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Cannot cancel ' || v_current_status || ' appointment'::jsonb);
    RETURN v_result;
  END IF;

  -- Verificar version (OPTIMISTIC LOCKING CORE)
  IF v_current_version != p_expected_version THEN
    v_result := jsonb_set(v_result, '{code}', '"version_mismatch"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Appointment was modified by another user. Please refresh and try again.'::jsonb);
    v_result := jsonb_set(v_result, '{data}', jsonb_build_object(
      'expected_version', p_expected_version,
      'current_version', v_current_version,
      'old_data', v_old_data
    ));
    
    -- Log do conflito
    INSERT INTO audit_logs (
      shop_id,
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      changed_by
    ) VALUES (
      (v_old_data->>'shop_id')::UUID,
      'appointments',
      p_appointment_id,
      'UPDATE',
      jsonb_build_object(
        'conflict_type', 'concurrent_cancellation',
        'expected_version', p_expected_version,
        'current_version', v_current_status
      ),
      v_result,
      'system'
    );
    
    RETURN v_result;
  END IF;

  -- Cancelar appointment
  UPDATE appointments
  SET
    status = 'cancelled',
    notes = COALESCE('Cancellation reason: ' || p_reason, 'Cancelled'),
    updated_at = NOW(),
    version = version + 1
  WHERE id = p_appointment_id
    AND version = p_expected_version;

  -- Verificar se atualizou
  IF NOT FOUND THEN
    v_result := jsonb_set(v_result, '{code}', '"version_mismatch"'::jsonb);
    v_result := jsonb_set(v_result, '{message}', 
      'Appointment was modified by another user. Please refresh and try again.'::jsonb);
    RETURN v_result;
  END IF;

  -- Sucesso!
  v_result := jsonb_build_object(
    'success', true,
    'code', 'success',
    'message', 'Appointment cancelled successfully',
    'data', jsonb_build_object(
      'appointment_id', p_appointment_id,
      'shop_id', (v_old_data->>'shop_id')::UUID,
      'client_id', v_client_id,
      'status', 'cancelled',
      'version', v_current_version + 1,
      'cancellation_reason', p_reason
    )
  );

  -- Log do cancelamento
  INSERT INTO audit_logs (
    shop_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    (v_old_data->>'shop_id')::UUID,
    'appointments',
    p_appointment_id,
    'UPDATE',
    v_old_data,
    v_result,
    'system'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'code', 'unknown_error',
      'message', SQLERRM,
      'data', jsonb_build_object('error_code', SQLSTATE)
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TRIGGERS: AUTO-INCREMENT VERSION
-- =====================================================

-- Trigger para appointments
CREATE OR REPLACE FUNCTION increment_appointment_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para clients
CREATE OR REPLACE FUNCTION increment_client_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para services
CREATE OR REPLACE FUNCTION increment_service_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para employees
CREATE OR REPLACE FUNCTION increment_employee_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar os triggers
DROP TRIGGER IF EXISTS trigger_appointments_version ON appointments;
CREATE TRIGGER trigger_appointments_version
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION increment_appointment_version();

DROP TRIGGER IF EXISTS trigger_clients_version ON clients;
CREATE TRIGGER trigger_clients_version
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION increment_client_version();

DROP TRIGGER IF EXISTS trigger_services_version ON services;
CREATE TRIGGER trigger_services_version
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION increment_service_version();

DROP TRIGGER IF EXISTS trigger_employees_version ON employees;
CREATE TRIGGER trigger_employees_version
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION increment_employee_version();

-- =====================================================
-- 4. LOG DE CONFLITOS ESPECIALIZADA
-- =====================================================

-- Função para log de conflitos
CREATE OR REPLACE FUNCTION log_conflict(
  p_shop_id UUID,
  p_conflict_type conflict_type,
  p_table_name VARCHAR,
  p_record_id UUID,
  p_details JSONB,
  p_changed_by VARCHAR DEFAULT 'system'
) RETURNS UUID AS $$
DECLARE
  v_audit_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    shop_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    p_shop_id,
    p_table_name,
    p_record_id,
    'CONFLICT',
    jsonb_build_object(
      'conflict_type', p_conflict_type,
      'details', p_details
    ),
    NULL,
    p_changed_by
  )
  RETURNING id INTO v_audit_log_id;

  RETURN v_audit_log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ESTATÍSTICAS DE CONFLITOS
-- =====================================================

-- View para estatísticas de conflitos por loja
CREATE OR REPLACE VIEW v_conflict_statistics AS
SELECT 
  shop_id,
  table_name,
  COUNT(*) FILTER (WHERE (old_data->>'conflict_type')::text = 'version_mismatch') as version_mismatches,
  COUNT(*) FILTER (WHERE (old_data->>'conflict_type')::text = 'double_booking') as double_bookings,
  COUNT(*) FILTER (WHERE (old_data->>'conflict_type')::text = 'slot_conflict') as slot_conflicts,
  COUNT(*) FILTER (WHERE (old_data->>'conflict_type')::text = 'concurrent_update') as concurrent_updates,
  COUNT(*) FILTER (WHERE (old_data->>'conflict_type')::text = 'concurrent_cancellation') as concurrent_cancellations,
  COUNT(*) as total_conflicts,
  MIN(changed_at) as first_conflict,
  MAX(changed_at) as last_conflict,
  EXTRACT(EPOCH FROM (MAX(changed_at) - MIN(changed_at)))::INTEGER / 3600 as hours_span
FROM audit_logs
WHERE action = 'CONFLICT'
  AND changed_at > NOW() - INTERVAL '30 days'
GROUP BY shop_id, table_name
ORDER BY shop_id, total_conflicts DESC;

-- View para conflitos recentes
CREATE OR REPLACE VIEW v_recent_conflicts AS
SELECT 
  al.id,
  al.shop_id,
  al.table_name,
  al.record_id,
  (al.old_data->>'conflict_type')::conflict_type as conflict_type,
  al.old_data as conflict_details,
  al.changed_at,
  al.changed_by,
  EXTRACT(EPOCH FROM (NOW() - al.changed_at))::INTEGER / 60 as minutes_ago
FROM audit_logs al
WHERE al.action = 'CONFLICT'
  AND al.changed_at > NOW() - INTERVAL '24 hours'
ORDER BY al.changed_at DESC;

-- =====================================================
-- 6. FUNÇÕES DE ADMINISTRAÇÃO
-- =====================================================

-- Função para resetar version (usar com cuidado)
CREATE OR REPLACE FUNCTION reset_version(
  p_table_name VARCHAR,
  p_record_id UUID,
  p_new_version INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET version = $1 WHERE id = $2',
    p_table_name
  ) USING p_new_version, p_record_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para recalcular conflicts stats
CREATE OR REPLACE FUNCTION get_conflict_stats(p_shop_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_shop_id IS NULL THEN
    SELECT jsonb_agg(t)
    INTO v_result
    FROM (
      SELECT 
        shop_id,
        table_name,
        COUNT(*) as conflicts,
        jsonb_object_agg(
          (old_data->>'conflict_type')::text,
          COUNT(*)
        ) as by_type
      FROM audit_logs
      WHERE action = 'CONFLICT'
        AND changed_at > NOW() - INTERVAL '30 days'
      GROUP BY shop_id, table_name
    ) t;
  ELSE
    SELECT jsonb_agg(t)
    INTO v_result
    FROM (
      SELECT 
        table_name,
        COUNT(*) as conflicts,
        jsonb_object_agg(
          (old_data->>'conflict_type')::text,
          COUNT(*)
        ) as by_type
      FROM audit_logs
      WHERE shop_id = p_shop_id
        AND action = 'CONFLICT'
        AND changed_at > NOW() - INTERVAL '30 days'
      GROUP BY table_name
    ) t;
  END IF;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca rápida de conflitos
CREATE INDEX IF NOT EXISTS idx_audit_logs_conflicts 
  ON audit_logs(shop_id, action, changed_at DESC) 
  WHERE action = 'CONFLICT';

-- Índice para busca por conflict_type
CREATE INDEX IF NOT EXISTS idx_audit_logs_conflict_type 
  ON audit_logs USING GIN(old_data) 
  WHERE action = 'CONFLICT';

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
--
-- 1. BOOKAR AGENDAMENTO (atomic, com verificação de double-booking):
--    SELECT book_appointment_atomic(
--      shop_id := 'uuid-da-loja',
--      client_id := 'uuid-do-cliente',
--      employee_id := 'uuid-do-funcionario',
--      service_id := 'uuid-do-servico',
--      scheduled_at := '2026-03-04 14:00:00+00',
--      version := 1,
--      notes := 'Cliente novo'
--    );
--    Retorna JSONB com {success, code, message, data}
--
-- 2. ATUALIZAR AGENDAMENTO (com optimistic locking):
--    SELECT update_appointment_atomic(
--      p_appointment_id := 'uuid-do-agendamento',
--      p_shop_id := 'uuid-da-loja',
--      p_expected_version := 2,  -- Versão que você tem
--      p_updates := '{"scheduled_at": "2026-03-04 15:00:00+00"}'::jsonb
--    );
--    Retorna JSONB com {success, code, message, data}
--
-- 3. CANCELAR AGENDAMENTO (com optimistic locking):
--    SELECT cancel_appointment_atomic(
--      p_appointment_id := 'uuid-do-agendamento',
--      p_shop_id := 'uuid-da-loja',
--      p_expected_version := 3,  -- Versão que você tem
--      p_reason := 'Cliente cancelou'
--    );
--    Retorna JSONB com {success, code, message, data}
--
-- 4. VER ESTATÍSTICAS DE CONFLITOS:
--    SELECT * FROM v_conflict_statistics WHERE shop_id = 'uuid-da-loja';
--    SELECT * FROM v_recent_conflicts ORDER BY changed_at DESC LIMIT 10;
--    SELECT get_conflict_stats('uuid-da-loja');
--
-- 5. LOG MANUAL DE CONFLITO:
--    SELECT log_conflict(
--      p_shop_id := 'uuid-da-loja',
--      p_conflict_type := 'version_mismatch'::conflict_type,
--      p_table_name := 'appointments',
--      p_record_id := 'uuid-do-agendamento',
--      p_details := '{"details": "..."}'::jsonb,
--      p_changed_by := 'user-id'
--    );
--
-- =====================================================
-- FLUXO DE RESOLUÇÃO DE CONFLITOS
-- =====================================================
--
-- Frontend:
-- ├── 1. Ler dados com version
-- ├── 2. Mostrar formulário
-- └── 3. Ao submeter, enviar version esperado
--
-- Backend:
-- ├── 1. Receber versão esperada
-- ├── 2. Executar função atômica
-- ├── 3. Se version_mismatch:
-- │   ├── Retornar erro para frontend
-- │   ├── Log conflito em audit_logs
-- │   └