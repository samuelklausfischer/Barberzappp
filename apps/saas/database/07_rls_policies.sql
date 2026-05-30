-- =====================================================
-- BarberZap - Row Level Security (RLS) (FASE 2.9)
-- =====================================================
-- Prioridade: CRÍTICA
-- Justificativa: Garante isolamento multi-tenant
-- Tempo estimado: 4-6 horas
--
-- Este script implementa Row Level Security para garantir que
-- cada barbearia (shop) só acesse seus próprios dados.
-- =====================================================

-- =====================================================
-- 1. HELPER FUNCTIONS
-- =====================================================

-- Função: Extrair shop_id do JWT token (auth.uid())
-- Esta função lê o shop_id das custom claims do Supabase Auth
CREATE OR REPLACE FUNCTION current_user_shop_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    public.current_setting('app.current_shop_id', true)::UUID;
$$;

-- Função: Definir shop_id no contexto da sessão
CREATE OR REPLACE FUNCTION set_app_context(shop_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT set_config('app.current_shop_id', $1::TEXT, true);
$$;

-- Função: Verificar se o usuário atual é admin
-- Admins têm acesso a todas as lojas (para suporte)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(
      public.current_setting('app.is_admin', true)::BOOLEAN,
      false
    );
$$;

-- Função: Verificar se é admin global (Superadmin)
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(
      public.current_setting('app.is_superadmin', true)::BOOLEAN,
      false
    );
$$;

-- Função: Verificar se o usuário é funcionário da loja
CREATE OR REPLACE FUNCTION is_employee(p_shop_id UUID, p_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM employees 
    WHERE id = p_employee_id 
      AND shop_id = p_shop_id 
      AND deleted_at IS NULL
      AND active = true
  );
$$;

-- Função: Obter user_id atual
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Função: Obter email do usuário atual
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT auth.jwt()->>'email';
$$;

-- Função: Verificar se o JWT é válido (não expirou)
CREATE OR REPLACE FUNCTION is_jwt_valid()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- =====================================================
-- 2. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on core tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_outbox ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. APPOINTMENTS POLICIES
-- =====================================================

-- SELECT: Ver appointments do shop ou admin
CREATE POLICY "appointments_select_shop" ON appointments
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );

-- INSERT: Só criar appointments para o próprio shop
CREATE POLICY "appointments_insert_shop" ON appointments
  FOR INSERT
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    ) AND
    shop_id IS NOT NULL
  );

-- UPDATE: Só atualizar do próprio shop e não deletado
CREATE POLICY "appointments_update_shop" ON appointments
  FOR UPDATE
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    )
  )
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    )
  );

-- DELETE: Soft delete via UPDATE, não DELETE direto
CREATE POLICY "appointments_delete_shop" ON appointments
  FOR DELETE
  USING (
    is_jwt_valid() AND
    (is_admin() OR is_superadmin())
  );

-- =====================================================
-- 4. CLIENTS POLICIES
-- =====================================================

-- SELECT: Ver clientes do shop (ativos, não deletados)
CREATE POLICY "clients_select_shop" ON clients
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );

-- INSERT: Só criar clientes para o próprio shop
CREATE POLICY "clients_insert_shop" ON clients
  FOR INSERT
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    ) AND
    shop_id IS NOT NULL
  );

-- UPDATE: Só atualizar do próprio shop
CREATE POLICY "clients_update_shop" ON clients
  FOR UPDATE
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    )
  )
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    ) AND
    shop_id = (SELECT shop_id FROM clients WHERE id = clients.id)
  );

-- DELETE: Soft delete
CREATE POLICY "clients_delete_shop" ON clients
  FOR DELETE
  USING (
    is_jwt_valid() AND
    (is_admin() OR is_superadmin())
  );

-- =====================================================
-- 5. EMPLOYEES POLICIES
-- =====================================================

-- SELECT: Ver employees do shop (ativos)
CREATE POLICY "employees_select_shop" ON employees
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );

-- INSERT: Só criar employees para o próprio shop
CREATE POLICY "employees_insert_shop" ON employees
  FOR INSERT
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    ) AND
    shop_id IS NOT NULL
  );

-- UPDATE: Só atualizar do próprio shop
CREATE POLICY "employees_update_shop" ON employees
  FOR UPDATE
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    )
  )
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    ) AND
    shop_id = (SELECT shop_id FROM employees WHERE id = employees.id)
  );

-- DELETE: Soft delete
CREATE POLICY "employees_delete_shop" ON employees
  FOR DELETE
  USING (
    is_jwt_valid() AND
    (is_admin() OR is_superadmin())
  );

-- =====================================================
-- 6. WORKING_HOURS POLICIES
-- =====================================================

-- SELECT: Ver horários do shop
CREATE POLICY "working_hours_select_shop" ON working_hours
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );

-- INSERT: Só criar working_hours para o próprio shop
CREATE POLICY "working_hours_insert_shop" ON working_hours
  FOR INSERT
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    ) AND
    shop_id IS NOT NULL
  );

-- UPDATE: Só atualizar do próprio shop
CREATE POLICY "working_hours_update_shop" ON working_hours
  FOR UPDATE
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    )
  )
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    )
  );

-- DELETE: Admins podem deletar
CREATE POLICY "working_hours_delete_shop" ON working_hours
  FOR DELETE
  USING (
    is_jwt_valid() AND
    (is_admin() OR is_superadmin())
  );

-- =====================================================
-- 7. SERVICES POLICIES
-- =====================================================

-- SELECT: Ver serviços do shop (ativos)
CREATE POLICY "services_select_shop" ON services
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );

-- INSERT: Só criar serviços para o próprio shop
CREATE POLICY "services_insert_shop" ON services
  FOR INSERT
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    ) AND
    shop_id IS NOT NULL
  );

-- UPDATE: Só atualizar do próprio shop
CREATE POLICY "services_update_shop" ON services
  FOR UPDATE
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    )
  )
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    )
  );

-- DELETE: Admins podem deletar
CREATE POLICY "services_delete_shop" ON services
  FOR DELETE
  USING (
    is_jwt_valid() AND
    (is_admin() OR is_superadmin())
  );

-- =====================================================
-- 8. APPOINTMENT_REMINDERS POLICIES
-- =====================================================

-- SELECT: Ver reminders do shop (via appointment)
CREATE POLICY "appointment_reminders_select_shop" ON appointment_reminders
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      (
        SELECT shop_id 
        FROM appointments 
        WHERE appointments.id = appointment_reminders.appointment_id
      ) = current_user_shop_id()
    )
  );

-- INSERT: Só criar reminders via trigger (worker)
CREATE POLICY "appointment_reminders_insert_worker" ON appointment_reminders
  FOR INSERT
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      (
        SELECT shop_id 
        FROM appointments 
        WHERE appointments.id = appointment_reminders.appointment_id
      ) = current_user_shop_id()
    )
  );

-- UPDATE: Worker更新状态
CREATE POLICY "appointment_reminders_update_worker" ON appointment_reminders
  FOR UPDATE
  USING (is_jwt_valid())
  WITH CHECK (is_jwt_valid());

-- DELETE: Admins podem deletar
CREATE POLICY "appointment_reminders_delete_shop" ON appointment_reminders
  FOR DELETE
  USING (
    is_jwt_valid() AND
    (is_admin() OR is_superadmin())
  );

-- =====================================================
-- 9. NOTIFICATIONS POLICIES
-- =====================================================

-- SELECT: Ver notificações do shop
CREATE POLICY "notifications_select_shop" ON notifications
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );

-- INSERT: Só criar notificações para o próprio shop
CREATE POLICY "notifications_insert_shop" ON notifications
  FOR INSERT
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    ) AND
    shop_id IS NOT NULL
  );

-- UPDATE: Só atualizar do próprio shop
CREATE POLICY "notifications_update_shop" ON notifications
  FOR UPDATE
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  )
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );

-- DELETE: Admins podem deletar
CREATE POLICY "notifications_delete_shop" ON notifications
  FOR DELETE
  USING (
    is_jwt_valid() AND
    (is_admin() OR is_superadmin())
  );

-- =====================================================
-- 10. AUDIT_LOGS POLICIES
-- =====================================================

-- SELECT: Admin ve todas, shop só vê as own
CREATE POLICY "audit_logs_select_admin_or_shop" ON audit_logs
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );

-- INSERT: Trigger cria automaticamente, mas política deve permitir
CREATE POLICY "audit_logs_insert_auto" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- DELETE: Ninguém deleta audit logs
CREATE POLICY "audit_logs_delete_deny" ON audit_logs
  FOR DELETE
  USING (false);

-- =====================================================
-- 11. WEBLOG_LOGS POLICIES
-- =====================================================

-- SELECT: Admin ve todas, shop só vê as own
CREATE POLICY "webhook_logs_select_admin_or_shop" ON webhook_logs
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );

-- INSERT: Trigger ou worker cria
CREATE POLICY "webhook_logs_insert_auto" ON webhook_logs
  FOR INSERT
  WITH CHECK (true);

-- DELETE: Ninguém deleta (logs são imutáveis)
CREATE POLICY "webhook_logs_delete_deny" ON webhook_logs
  FOR DELETE
  USING (false);

-- =====================================================
-- 12. APPOINTMENT_OUTBOX POLICIES (Worker-only)
-- =====================================================

-- SELECT: Worker precisa ver todos para processamento
CREATE POLICY "appointment_outbox_select_worker" ON appointment_outbox
  FOR SELECT
  USING (is_jwt_valid());

-- INSERT: Trigger cria automaticamente
CREATE POLICY "appointment_outbox_insert_auto" ON appointment_outbox
  FOR INSERT
  WITH CHECK (
    shop_id = current_user_shop_id() OR is_admin() OR is_superadmin()
  );

-- UPDATE: Worker更新 status
CREATE POLICY "appointment_outbox_update_worker" ON appointment_outbox
  FOR UPDATE
  USING (is_jwt_valid())
  WITH CHECK (is_jwt_valid());

-- DELETE: Não deletar, apenas marcar como failed/max_retries
CREATE POLICY "appointment_outbox_delete_deny" ON appointment_outbox
  FOR DELETE
  USING (false);

-- =====================================================
-- 13. MESSAGE_OUTBOX POLICIES (Worker-only)
-- =====================================================

-- SELECT: Worker precisa ver todos
CREATE POLICY "message_outbox_select_worker" ON message_outbox
  FOR SELECT
  USING (is_jwt_valid());

-- INSERT: Application cria messages
CREATE POLICY "message_outbox_insert_shop" ON message_outbox
  FOR INSERT
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    ) AND
    shop_id IS NOT NULL
  );

-- UPDATE: Worker更新 status
CREATE POLICY "message_outbox_update_worker" ON message_outbox
  FOR UPDATE
  USING (is_jwt_valid())
  WITH CHECK (is_jwt_valid());

-- DELETE: Não deletar
CREATE POLICY "message_outbox_delete_deny" ON message_outbox
  FOR DELETE
  USING (false);

-- =====================================================
-- 14. FORCE LOGIN VERIFICATION
-- =====================================================

-- Impedir access não autenticado a todas as tabelas
-- Isso garante que todas as operações exijam JWT válido

-- Drop default policies se existirem
DROP POLICY IF EXISTS "Enable all for users" ON appointments;
DROP POLICY IF EXISTS "Enable read for users" ON appointments;
DROP POLICY IF EXISTS "Enable insert for users" ON appointments;

-- =====================================================
-- 15. SOFT DELETE FUNCTIONS
-- =====================================================

-- Função: Soft delete para clients
CREATE OR REPLACE FUNCTION soft_delete_client(client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE clients 
  SET 
    deleted_at = NOW(),
    updated_at = NOW(),
    version = version + 1
  WHERE id = client_id
    AND shop_id = current_user_shop_id()
    AND deleted_at IS NULL;
    
  RETURN FOUND;
END;
$$;

-- Função: Soft delete para employees
CREATE OR REPLACE FUNCTION soft_delete_employee(employee_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE employees 
  SET 
    deleted_at = NOW(),
    updated_at = NOW(),
    version = version + 1
  WHERE id = employee_id
    AND shop_id = current_user_shop_id()
    AND deleted_at IS NULL;
    
  RETURN FOUND;
END;
$$;

-- Função: Restore soft deleted
CREATE OR REPLACE FUNCTION restore_client(client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE clients 
  SET 
    deleted_at = NULL,
    updated_at = NOW(),
    version = version + 1
  WHERE id = client_id
    AND shop_id = current_user_shop_id();
    
  RETURN FOUND;
END;
$$;

-- =====================================================
-- 16. VIEWS COM FILTROS RLS AUTOMÁTICOS
-- =====================================================

-- View: Appointments ativos do shop atual
CREATE OR REPLACE VIEW v_shop_appointments AS
SELECT 
  a.*,
  c.name as client_name,
  c.phone_number as client_phone,
  e.name as employee_name,
  s.name as service_name
FROM appointments a
JOIN clients c ON c.id = a.client_id
JOIN employees e ON e.id = a.employee_id
JOIN services s ON s.id = a.service_id
WHERE a.shop_id = current_user_shop_id()
  AND c.deleted_at IS NULL
  AND e.deleted_at IS NULL
ORDER BY a.scheduled_at DESC;

-- View: Clients ativos do shop atual
CREATE OR REPLACE VIEW v_shop_clients AS
SELECT 
  c.*
FROM clients c
WHERE c.shop_id = current_user_shop_id()
  AND c.deleted_at IS NULL
ORDER BY c.created_at DESC;

-- View: Employees ativos do shop atual
CREATE OR REPLACE VIEW v_shop_employees AS
SELECT 
  e.*
FROM employees e
WHERE e.shop_id = current_user_shop_id()
  AND e.deleted_at IS NULL
  AND e.active = true
ORDER BY e.name ASC;

-- View: Services ativos do shop atual
CREATE OR REPLACE VIEW v_shop_services AS
SELECT 
  s.*
FROM services s
WHERE s.shop_id = current_user_shop_id()
  AND s.active = true
ORDER BY s.name ASC;

-- =====================================================
-- 17. SECURITY MONITORING VIEWS
-- =====================================================

-- View: Verificar se RLS está ativo
CREATE OR REPLACE VIEW v_rls_status AS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'ENABLED'::text
    ELSE 'DISABLED'::text
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'appointments', 'clients', 'employees', 'working_hours',
    'services', 'appointment_reminders', 'notifications',
    'audit_logs', 'webhook_logs', 'appointment_outbox', 'message_outbox'
  )
ORDER BY tablename;

-- View: Listar todas as policies
CREATE OR REPLACE VIEW v_rls_policies AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 18. GRANT PERMISSIONS
-- =====================================================

-- Permissões para supabase_auth
-- Permitir que authenticated acessem as funções helper
GRANT EXECUTE ON FUNCTION current_user_shop_id() TO authenticated;
GRANT EXECUTE ON FUNCTION set_app_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_employee(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION is_jwt_valid() TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_employee(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_client(UUID) TO authenticated;

-- Grant select nas views
GRANT SELECT ON v_shop_appointments TO authenticated;
GRANT SELECT ON v_shop_clients TO authenticated;
GRANT SELECT ON v_shop_employees TO authenticated;
GRANT SELECT ON v_shop_services TO authenticated;
GRANT SELECT ON v_rls_status TO authenticated;
GRANT SELECT ON v_rls_policies TO authenticated;

-- =====================================================
-- 19. CLEANUP FUNCTIONS (OPTIONAL)
-- =====================================================

-- Função: Limpar audit logs antigos (> 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE changed_at < NOW() - (days || ' days')::INTERVAL
    AND shop_id = current_user_shop_id();
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Função: Limpar webhook logs antigos (> 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs(days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_logs
  WHERE created_at < NOW() - (days || ' days')::INTERVAL
    AND shop_id = current_user_shop_id();
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- COMENTÁRIOS E INSTRUÇÕES
-- =====================================================
--
-- SETUP INICIAL NO SUPABASE:
--
-- 1. Adicionar shop_id como custom claim no JWT:
--    - Acessar Dashboard > Authentication > JWT Settings
--    - Adicionar field: "shop_id" (UUID)
--
-- 2. Backend deve chamar set_app_context() após login:
--    SELECT set_app_context('shop-uuid-here');
--
-- 3. Frontend deve incluir shop_id em cada request:
--    - Via header: X-Shop-Id: shop-uuid
--    - O middleware backend extrai e chama set_app_context()
--
-- 4. Para testar as policies:
--    - Ver 08_rls_tests.sql
--
-- SEGURANÇA:
-- - Todas as tabelas têm RLS habilitado
-- - Shop_id é obrigatório em INSERT
-- - Soft delete é preferido (não DELETE direto)
-- - Audit logs são read-only após creation
-- - Workers têm acesso especial via is_jwt_valid()
--
-- PRÓXIMOS PASSOS:
-- - Executar 08_rls_tests.sql para validação
-- - Configurar middleware para set_app_context()
-- - Implementar custom JWT claims no Supabase
--
-- =====================================================
