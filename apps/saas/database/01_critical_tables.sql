-- =====================================================
-- BarberZap - Tabelas Críticas (FASE 1 - Item 1.1)
-- =====================================================
-- Prioridade: 1 (MAIS CRÍTICA)
-- Justificativa: Sem estas tabelas, nenhum fluxo funciona
-- Tempo estimado: 2-4 horas
-- =====================================================

-- Habilitar UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CLIENTS (CRM essencial)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,  -- Multi-tenant
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  instagram VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,  -- Soft delete
  tags TEXT[],  -- Tags para segmentação
  notes TEXT,
  version INTEGER DEFAULT 1,  -- Optimistic locking

  -- Client Stats (calculados por triggers)
  total_visits INTEGER DEFAULT 0,
  last_visit_at TIMESTAMP WITH TIME ZONE,
  total_spent DECIMAL(10,2) DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  cancelled_count INTEGER DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0
);

CREATE INDEX idx_clients_shop_id ON clients(shop_id);
CREATE INDEX idx_clients_phone ON clients(phone_number);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

-- =====================================================
-- 2. SERVICES (Catálogo de serviços)
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_services_shop_id ON services(shop_id);
CREATE INDEX idx_services_active ON services(active);

-- =====================================================
-- 3. EMPLOYEES (Gestão de barbeiros)
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'barber',  -- barber, manager, owner
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_employees_shop_id ON employees(shop_id);
CREATE INDEX idx_employees_active ON employees(active);

-- =====================================================
-- 4. WORKING_HOURS (Escalas de horário)
-- =====================================================
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  employee_id UUID NOT NULL,  -- NULL para horário da barbearia geral
  day_of_week INTEGER NOT NULL CHECK (day_of_week IN (0,1,2,3,4,5,6)),  -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_working_hours_shop ON working_hours(shop_id);
CREATE INDEX idx_working_hours_employee ON working_hours(employee_id);
CREATE INDEX idx_working_hours_day ON working_hours(day_of_week);

-- =====================================================
-- 5. APPOINTMENTS (MOST CRITICAL - Agendamentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  service_id UUID NOT NULL REFERENCES services(id),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,  -- Optimistic locking

  -- Metadados para sync/automação
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_24h_at TIMESTAMP WITH TIME ZONE,
  reminder_2h_sent BOOLEAN DEFAULT FALSE,
  reminder_2h_at TIMESTAMP WITH TIME ZONE
);

-- Índices compostos críticos para performance
CREATE INDEX idx_appointments_shop ON appointments(shop_id);
CREATE INDEX idx_appointments_composite ON appointments(scheduled_at, employee_id, status);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at DESC);

-- =====================================================
-- 6. APPOINTMENT_REMINDERS (Automação de lembretes)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('confirmation', '24h', '2h')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX idx_reminders_status ON appointment_reminders(status);
CREATE INDEX idx_reminders_scheduled ON appointment_reminders(scheduled_at);
CREATE INDEX idx_reminders_pending ON appointment_reminders(status, scheduled_at) WHERE status = 'pending';

-- =====================================================
-- 7. NOTIFICATIONS (Alertas do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  user_id UUID NOT NULL,  -- Usuário que recebe
  type VARCHAR(50) NOT NULL CHECK (type IN ('booking', 'reminder', 'cancellation', 'system', 'alert')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_shop ON notifications(shop_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- =====================================================
-- 8. AUDIT_LOGS (Rastreabilidade completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_shop ON audit_logs(shop_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(changed_at DESC);

-- =====================================================
-- 9. WEBHOOK_LOGS (Debugging e rastreamento)
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  source VARCHAR(100) NOT NULL,  -- 'whatsapp', 'stripe', 'supabase', etc
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_shop ON webhook_logs(shop_id);
CREATE INDEX idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- =====================================================
-- COMENTÁRIOS E NOTAS
-- =====================================================
--
-- Este script cria as 9 tabelas críticas necessárias para o BarberZap funcionar
--
-- PRÓXIMOS PASSOS (FASE 1):
-- 1.2: Implementar Supabase Realtime para sync instantâneo
-- 1.3: Configurar Redis Cache Layer
-- 1.4: Implementar BullMQ Background Jobs
-- 1.5: Configurar Optimistic Locking para resolução de conflitos
--
-- INTEGRAÇÕES NECESSÁRIAS:
-- - Supabase Client: src/realtime/SupabaseRealtimeManager.ts
-- - Redis Manager: backend/cache/cache_manager.py
-- - BullMQ Jobs: workers/jobs/
-- - Conflict Resolution: backend/utils/conflict_resolution.py
--
