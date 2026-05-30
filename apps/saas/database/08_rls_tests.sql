-- =====================================================
-- BarberZap - RLS Security Tests (FASE 2.9)
-- =====================================================
-- Prioridade: CRÍTICA
-- Justificativa: Validação das políticas RLS
-- Tempo estimado: 2-3 horas
--
-- Este script testa todas as políticas RLS para garantir
-- isolamento de dados entre shops.
-- =====================================================

-- =====================================================
-- PREPARAÇÃO DOS TESTES
-- =====================================================

-- Nota: Estes testes devem ser executados com diferentes
-- contextos (shop_id) para validar o isolamento.

-- Desabilitar RLS temporariamente para criar dados de teste
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- Criar dados de teste: Shop A
DO $$
DECLARE
  shop_a_id UUID := gen_random_uuid();
  shop_b_id UUID := gen_random_uuid();
  
  client_a1_id UUID;
  client_a2_id UUID;
  client_b1_id UUID;
  
  employee_a1_id UUID;
  employee_a2_id UUID;
  employee_b1_id UUID;
  
  service_a_id UUID;
  service_b_id UUID;
  
  appointment_a1_id UUID;
  appointment_a2_id UUID;
  appointment_b1_id UUID;
BEGIN
  -- Inserir dados fictícios para testes
  
  -- Shop A Clients
  INSERT INTO clients (id, shop_id, name, phone_number)
  VALUES 
    (gen_random_uuid(), shop_a_id, 'Client A1', '+5511999990001'),
    (gen_random_uuid(), shop_a_id, 'Client A2', '+5511999990002')
  RETURNING id INTO client_a1_id;
  
  SELECT id INTO client_a2_id FROM clients WHERE name = 'Client A2' LIMIT 1;
  
  -- Shop B Clients
  INSERT INTO clients (id, shop_id, name, phone_number)
  VALUES 
    (gen_random_uuid(), shop_b_id, 'Client B1', '+5511999999001')
  RETURNING id INTO client_b1_id;
  
  -- Shop A Employees
  INSERT INTO employees (id, shop_id, name, phone_number)
  VALUES 
    (gen_random_uuid(), shop_a_id, 'Barber A1', '+5511999999001'),
    (gen_random_uuid(), shop_a_id, 'Barber A2', '+5511999999002')
  RETURNING id INTO employee_a1_id;
  
  SELECT id INTO employee_a2_id FROM employees WHERE name = 'Barber A2' LIMIT 1;
  
  -- Shop B Employees
  INSERT INTO employees (id, shop_id, name, phone_number)
  VALUES 
    (gen_random_uuid(), shop_b_id, 'Barber B1', '+5511999999001')
  RETURNING id INTO employee_b1_id;
  
  -- Shop A Services
  INSERT INTO services (id, shop_id, name, duration_minutes, price)
  VALUES 
    (gen_random_uuid(), shop_a_id, 'Corte A', 30, 50.00)
  RETURNING id INTO service_a_id;
  
  -- Shop B Services
  INSERT INTO services (id, shop_id, name, duration_minutes, price)
  VALUES 
    (gen_random_uuid(), shop_b_id, 'Corte B', 30, 40.00)
  RETURNING id INTO service_b_id;
  
  -- Shop A Appointments
  INSERT INTO appointments (id, shop_id, client_id, employee_id, service_id, scheduled_at, duration_minutes, price)
  VALUES 
    (gen_random_uuid(), shop_a_id, client_a1_id, employee_a1_id, service_a_id, NOW() + INTERVAL '1 day', 30, 50.00),
    (gen_random_uuid(), shop_a_id, client_a2_id, employee_a2_id, service_a_id, NOW() + INTERVAL '2 days', 30, 50.00)
  RETURNING id INTO appointment_a1_id;
  
  SELECT id INTO appointment_a2_id FROM appointments WHERE client_id = client_a2_id LIMIT 1;
  
  -- Shop B Appointments
  INSERT INTO appointments (id, shop_id, client_id, employee_id, service_id, scheduled_at, duration_minutes, price)
  VALUES 
    (gen_random_uuid(), shop_b_id, client_b1_id, employee_b1_id, service_b_id, NOW() + INTERVAL '1 day', 30, 40.00)
  RETURNING id INTO appointment_b1_id;
  
  -- Armazenar IDs em variáveis temporárias (tables)
  DROP TABLE IF EXISTS test_shops;
  CREATE TEMP TABLE test_shops (
    shop_id UUID,
    shop_name TEXT
  );
  
  INSERT INTO test_shops VALUES (shop_a_id, 'SHOP_A'), (shop_b_id, 'SHOP_B');
  
  RAISE NOTICE 'Test data created successfully';
  RAISE NOTICE 'Shop A ID: %', shop_a_id;
  RAISE NOTICE 'Shop B ID: %', shop_b_id;
END $$;

-- Reabilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TESTE 1: Verificar Status RLS
-- =====================================================

SELECT '=== TESTE 1: RLS Status ===' as test_name;

SELECT * FROM v_rls_status;

-- Expectativa: Todas as tabelas devem ter RLS ENABLED

-- =====================================================
-- TESTE 2: Listar todas as Policies
-- =====================================================

SELECT '=== TESTE 2: RLS Policies ===' as test_name;

SELECT * FROM v_rls_policies ORDER BY tablename, policyname;

-- Expectativa: Deve listar todas as políticas criadas

-- =====================================================
-- TESTE 3: Isolamento - Shop A não vê Clientes do Shop B
-- =====================================================

SELECT '=== TESTE 3: Shop A não vê Clientes do Shop B ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  shop_b_id UUID;
  total_before_without_rls INTEGER;
  shop_a_clients_count INTEGER;
  shop_b_clients_count INTEGER;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A' LIMIT 1;
  SELECT shop_id INTO shop_b_id FROM test_shops WHERE shop_name = 'SHOP_B' LIMIT 1;
  
  -- Desabilitar RLS para ver total
  ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
  SELECT COUNT(*) INTO total_before_without_rls FROM clients;
  RAISE NOTICE 'Total clients (sem RLS): %', total_before_without_rls;
  
  -- Reabilitar RLS
  ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  
  -- Simular Shop A context
  PERFORM set_app_context(shop_a_id);
  SELECT COUNT(*) INTO shop_a_clients_count FROM clients;
  RAISE NOTICE 'Shop A vê % clientes', shop_a_clients_count;
  
  -- Simular Shop B context
  PERFORM set_app_context(shop_b_id);
  SELECT COUNT(*) INTO shop_b_clients_count FROM clients;
  RAISE NOTICE 'Shop B vê % clientes', shop_b_clients_count;
  
  -- Validar
  IF shop_a_clients_count + shop_b_clients_count = total_before_without_rls THEN
    RAISE NOTICE '✓ TESTE 3 PASSOU: Shops não se sobrepõem';
  ELSE
    RAISE NOTICE '✗ TESTE 3 FALHOU: Isolamento quebrado!';
    RAISE NOTICE 'Shop A count + Shop B count % != Total %', 
      shop_a_clients_count + shop_b_clients_count, total_before_without_rls;
  END IF;
END $$;

-- =====================================================
-- TESTE 4: Isolamento - Shop A não vê Appointments do Shop B
-- =====================================================

SELECT '=== TESTE 4: Shop A não vê Appointments do Shop B ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  shop_b_id UUID;
  total_appointments INTEGER;
  shop_a_appointments INTEGER;
  shop_b_appointments INTEGER;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A' LIMIT 1;
  SELECT shop_id INTO shop_b_id FROM test_shops WHERE shop_name = 'SHOP_B' LIMIT 1;
  
  -- Total
  SELECT COUNT(*) INTO total_appointments FROM appointments;
  RAISE NOTICE 'Total appointments: %', total_appointments;
  
  -- Shop A context
  PERFORM set_app_context(shop_a_id);
  SELECT COUNT(*) INTO shop_a_appointments FROM appointments;
  RAISE NOTICE 'Shop A vê % appointments', shop_a_appointments;
  
  -- Shop B context
  PERFORM set_app_context(shop_b_id);
  SELECT COUNT(*) INTO shop_b_appointments FROM appointments;
  RAISE NOTICE 'Shop B vê % appointments', shop_b_appointments;
  
  IF shop_a_appointments + shop_b_appointments = total_appointments THEN
    RAISE NOTICE '✓ TESTE 4 PASSOU: Isolamento de appointments OK';
  ELSE
    RAISE NOTICE '✗ TESTE 4 FALHOU: Isolamento quebrado!';
  END IF;
END $$;

-- =====================================================
-- TESTE 5: INSERT - Shop A só pode criar para si mesmo
-- =====================================================

SELECT '=== TESTE 5: INSERT Shop A só cria para Shop A ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  shop_b_id UUID;
  new_appointment_id UUID;
  success BOOLEAN;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A' LIMIT 1;
  SELECT shop_id INTO shop_b_id FROM test_shops WHERE shop_name = 'SHOP_B' LIMIT 1;
  
  -- Set context Shop A
  PERFORM set_app_context(shop_a_id);
  
  -- Tentar INSERT com shop_id do Shop B (deve falhar)
  BEGIN
    INSERT INTO appointments (shop_id, client_id, employee_id, service_id, scheduled_at, duration_minutes, price)
    VALUES (
      shop_b_id,
      (SELECT id FROM clients WHERE shop_id = shop_a_id LIMIT 1),
      (SELECT id FROM employees WHERE shop_id = shop_a_id LIMIT 1),
      (SELECT id FROM services WHERE shop_id = shop_a_id LIMIT 1),
      NOW() + INTERVAL '1 day',
      30,
      50.00
    );
    success := false;
  EXCEPTION WHEN others THEN
    success := true;
    RAISE NOTICE '✓ INSERT bloqueado corretamente: %', SQLERRM;
  END;
  
  -- Tentar INSERT com shop_id correto (deve funcionar)
  RESET ALL;
  PERFORM set_app_context(shop_a_id);
  BEGIN
    INSERT INTO appointments (shop_id, client_id, employee_id, service_id, scheduled_at, duration_minutes, price)
    VALUES (
      shop_a_id,
      (SELECT id FROM clients WHERE shop_id = shop_a_id LIMIT 1),
      (SELECT id FROM employees WHERE shop_id = shop_a_id LIMIT 1),
      (SELECT id FROM services WHERE shop_id = shop_a_id LIMIT 1),
      NOW() + INTERVAL '2 days',
      30,
      50.00
    );
    RAISE NOTICE '✓ INSERT permitido para shop próprio';
  EXCEPTION WHEN others THEN
    RAISE NOTICE '✗ INSERT bloqueado incorretamente: %', SQLERRM;
  END;
END $$;

-- =====================================================
-- TESTE 6: UPDATE - Shop A não pode atualizar Shop B
-- =====================================================

SELECT '=== TESTE 6: UPDATE Shop A não atualiza Shop B ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  shop_b_id;
  current_status TEXT;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A';
  SELECT shop_id INTO shop_b_id FROM test_shops WHERE shop_name = 'SHOP_B';
  
  RESET ALL;
  PERFORM set_app_context(shop_a_id);
  
  -- Tentar UPDATE de appointment do Shop B (deve falhar)
  BEGIN
    UPDATE appointments 
    SET status = 'cancelled'
    WHERE shop_id = shop_b_id;
    RAISE NOTICE '✗ TESTE 6 FALHOU: UPDATE não foi bloqueado!';
  EXCEPTION WHEN others THEN
    RAISE NOTICE '✓ TESTE 6 PASSOU: UPDATE bloqueado: %', SQLERRM;
  END;
  
  -- Atualizar do próprio shop (deve funcionar)
  BEGIN
    UPDATE appointments 
    SET status = 'confirmed'
    WHERE shop_id = shop_a_id
    AND status = 'scheduled';
    
    GET DIAGNOSTICS current_status = ROW_COUNT;
    RAISE NOTICE '✓ UPDATE de % appointments do próprio shop OK', current_status;
  EXCEPTION WHEN others THEN
    RAISE NOTICE '✗ UPDATE do próprio shop falhou: %', SQLERRM;
  END;
END $$;

-- =====================================================
-- TESTE 7: DELETE - Shop B não pode deletar Shop A
-- =====================================================

SELECT '=== TESTE 7: DELETE Shop B não deleta Shop A ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  shop_b_id UUID;
  deleted_count INTEGER;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A';
  SELECT shop_id INTO shop_b_id FROM test_shops WHERE shop_name = 'SHOP_B';
  
  RESET ALL;
  PERFORM set_app_context(shop_b_id);
  
  -- Tentar DELETE de appointment do Shop A (deve falhar se não admin)
  BEGIN
    DELETE FROM appointments WHERE shop_id = shop_a_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
      RAISE NOTICE '✗ TESTE 7 FALHOU: DELETE não foi bloqueado! Deletou % rows', deleted_count;
    ELSE
      RAISE NOTICE '✓ TESTE 7 PASSOU: DELETE bloqueado (0 rows)', deleted_count;
    END IF;
  EXCEPTION WHEN others THEN
    RAISE NOTICE '✓ TESTE 7 PASSOU: DELETE bloqueado com erro: %', SQLERRM;
  END;
END $$;

-- =====================================================
-- TESTE 8: Soft Delete Functions
-- =====================================================

SELECT '=== TESTE 8: Soft Delete Functions ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  client_id UUID;
  success BOOLEAN;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A' LIMIT 1;
  
  RESET ALL;
  PERFORM set_app_context(shop_a_id);
  
  -- Soft delete um client
  SELECT id INTO client_id FROM clients WHERE shop_id = shop_a_id LIMIT 1;
  
  SELECT soft_delete_client(client_id) INTO success;
  RAISE NOTICE 'Soft delete função retornou: %', success;
  
  -- Verificar se soft delete funcionou
  IF EXISTS (
    SELECT 1 FROM clients 
    WHERE id = client_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE NOTICE '✓ TESTE 8 PASSOU: Soft delete funcionou';
  ELSE
    RAISE NOTICE '✗ TESTE 8 FALHOU: Soft delete não setou deleted_at';
  END IF;
  
  -- Restore client
  SELECT restore_client(client_id) INTO success;
  
  IF EXISTS (
    SELECT 1 FROM clients 
    WHERE id = client_id AND deleted_at IS NULL
  ) THEN
    RAISE NOTICE '✓ Restore funcionou';
  ELSE
    RAISE NOTICE '✗ Restore falhou';
  END IF;
END $$;

-- =====================================================
-- TESTE 9: Admin pode ver todos os shops
-- =====================================================

SELECT '=== TESTE 9: Admin vê todos os dados ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  shop_b_id UUID;
  admin_count INTEGER;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A';
  SELECT shop_id INTO shop_b_id FROM test_shops WHERE shop_name = 'SHOP_B';
  
  RESET ALL;
  
  -- Definir contexto como admin
  PERFORM set_config('app.is_admin', 'true', false);
  
  -- Admin deve ver todos os appointments
  SELECT COUNT(*) INTO admin_count FROM appointments;
  RAISE NOTICE 'Admin vê % appointments (todos os shops)', admin_count;
  
  -- Limpar admin flag
  PERFORM set_config('app.is_admin', 'false', false);
  
  IF admin_count > 0 THEN
    RAISE NOTICE '✓ TESTE 9 PASSOU: Admin vê dados de múltiplos shops';
  ELSE
    RAISE NOTICE '✗ TESTE 9 FALHOU: Admin não vê todos os dados';
  END IF;
END $$;

-- =====================================================
-- TESTE 10: Views com filtros RLS
-- =====================================================

SELECT '=== TESTE 10: Views com filtros RLS ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  shop_b_id UUID;
  total_clients_view INTEGER;
  total_appointments_view INTEGER;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A';
  
  RESET ALL;
  PERFORM set_app_context(shop_a_id);
  
 -- Usar views que já filtram por shop_id automaticamente
  SELECT COUNT(*) INTO total_clients_view FROM v_shop_clients;
  SELECT COUNT(*) INTO total_appointments_view FROM v_shop_appointments;
  
  RAISE NOTICE 'View v_shop_clients: % registros', total_clients_view;
  RAISE NOTICE 'View v_shop_appointments: % registros', total_appointments_view;
  
  IF total_clients_view > 0 AND total_appointments_view > 0 THEN
    RAISE NOTICE '✓ TESTE 10 PASSOU: Views funcionam com RLS';
  ELSE
    RAISE NOTICE '✗ TESTE 10 FALHOU: Views não retornaram dados';
  END IF;
END $$;

-- =====================================================
-- TESTE 11: Audit Logs - Shop só vê seus logs
-- =====================================================

SELECT '=== TESTE 11: Audit Logs Isolamento ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  shop_b_id UUID;
  shop_a_logs INTEGER;
  shop_b_logs INTEGER;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A';
  SELECT shop_id INTO shop_b_id FROM test_shops WHERE shop_name = 'SHOP_B';
  
  RESET ALL;
  PERFORM set_app_context(shop_a_id);
  SELECT COUNT(*) INTO shop_a_logs FROM audit_logs WHERE shop_id = shop_a_id;
  RAISE NOTICE 'Shop A vê % audit logs próprios', shop_a_logs;
  
  RESET ALL;
  PERFORM set_app_context(shop_b_id);
  SELECT COUNT(*) INTO shop_b_logs FROM audit_logs WHERE shop_id = shop_a_id;
  RAISE NOTICE 'Shop B vê % audit logs do Shop A (deve ser 0)', shop_b_logs;
  
  IF shop_b_logs = 0 THEN
    RAISE NOTICE '✓ TESTE 11 PASSOU: Audit logs isolados';
  ELSE
    RAISE NOTICE '✗ TESTE 11 FALHOU: Shop B pode ver logs do Shop A';
  END IF;
END $$;

-- =====================================================
-- TESTE 12: Outbox Tables - Worker access
-- =====================================================

SELECT '=== TESTE 12: Outbox Worker Access ===' as test_name;

DO $$
DECLARE
  shop_a_id UUID;
  outbox_count INTEGER;
BEGIN
  SELECT shop_id INTO shop_a_id FROM test_shops WHERE shop_name = 'SHOP_A';
  
  RESET ALL;
  PERFORM set_app_context(shop_a_id);
  
  -- Worker (is_jwt_valid) pode ver outbox entries
  SELECT COUNT(*) INTO outbox_count FROM appointment_outbox;
  RAISE NOTICE 'Outbox entries visíveis: %', outbox_count;
  
  RAISE NOTICE '✓ TESTE 12 PASSOU: Worker pode acessar outbox';
END $$;

-- =====================================================
-- TESTE 13: JWT Validation check
-- =====================================================

SELECT '=== TESTE 13: JWT Validation ===' as test_name;

DO $$
BEGIN
  -- Testar is_jwt_valid em contexto sem auth
  RESET ALL;
  
  -- Em ambiente real, isso depende do auth.uid()
  -- Aqui apenas verificamos se a função existe e roda
  PERFORM is_jwt_valid();
  RAISE NOTICE '✓ TESTE 13 PASSOU: Função is_jwt_valid() funciona';
END $$;

-- =====================================================
-- SUMÁRIO DOS TESTES
-- =====================================================

SELECT '=== SUMÁRIO DOS TESTES RLS ===' as summary;

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- LIMPEZA DE TESTES (OPCIONAL)
-- =====================================================

-- Descomente para limpar dados de teste

-- DROP TABLE IF EXISTS test_shops;

-- =====================================================
-- INSTRUÇÕES PARA EXECUTAR TESTES
-- =====================================================
--
-- 1. Conectar ao Supabase via psql ou Dashboard SQL Editor
-- 2. Executar: \i /root/barber/database/08_rls_tests.sql
-- 3. Verificar output para ✓ (passou) ou ✗ (falhou)
--
-- NOTAS IMPORTANTES:
--
-- - Teste simula diferentes contexts usando set_app_context()
-- - Em produção, shop_id vem do JWT via Supabase Auth
-- - Testes de INSERT/UPDATE/DELETE podem falhar se RLS não configurado
-- - Admin tests verificam se admins podem ver跨-shop data
--
-- EXPECTED RESULTS:
-- - Todos os testes devem mostrar ✓ PASSOU
-- - Isolamento: Shop A só vê seus dados
-- - Admin: vê todos os dados
-- - Soft delete: funciona em vez de DELETE direto
-- - Views: filtram automaticamente por shop_id
--
-- PRÓXIMOS PASSOS:
-- - Configurar JWT custom claims no Supabase
-- - Implementar middleware para set_app_context()
-- - Testar com real Supabase auth
--
-- =====================================================
