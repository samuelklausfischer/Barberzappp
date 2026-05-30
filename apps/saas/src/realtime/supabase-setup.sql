-- ============================================================================
-- SUPABASE REALTIME SETUP SQL
-- ============================================================================
-- 
-- Execute estes comandos no SQL Editor do Supabase para habilitar
-- o Realtime nas tabelas do BarberZap.
--
-- Acesso: https://supabase.com/dashboard/project/_/sql
--
-- ============================================================================

-- ============================================================================
-- 1. HABILITAR REALTIME NAS TABELAS
-- ============================================================================

-- Tabela de Appointments
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Tabela de Clients
ALTER PUBLICATION supabase_realtime ADD TABLE clients;

-- Tabela de Messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Tabela de Notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================================
-- 2. VERIFICAR TABELAS COM REALTIME HABILITADO
-- ============================================================================

SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- ============================================================================
-- 3. CRIAR TABELAS (CASO NÃO EXISTAM)
-- ============================================================================

-- Tabela appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  client_name TEXT NOT NULL,
  client_avatar TEXT,
  service TEXT NOT NULL,
  time TIME NOT NULL,
  date DATE NOT NULL,
  duration TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'canceled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  conversation_id TEXT,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'audio', 'system')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_shop_id ON appointments(shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_shop_id ON clients(shop_id);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_shop_id ON messages(shop_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_shop_id ON notifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================================================
-- 5. CRIAR TRIGGERS PARA updated_at
-- ============================================================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para appointments
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - OPICIONAL
-- ============================================================================

-- Habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política para appointments: usuários só veem do seu shop
CREATE POLICY "Users can view appointments from their shop"
  ON appointments FOR SELECT
  USING (shop_id = (SELECT id FROM user_shops WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can insert appointments in their shop"
  ON appointments FOR INSERT
  WITH CHECK (shop_id = (SELECT id FROM user_shops WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can update appointments in their shop"
  ON appointments FOR UPDATE
  USING (shop_id = (SELECT id FROM user_shops WHERE user_id = auth.uid() LIMIT 1));

-- (Repetir políticas similares para outras tabelas...)

-- ============================================================================
-- 7. INSERIR DADOS DE TESTE
-- ============================================================================

-- Dados de teste para appointments
INSERT INTO appointments (shop_id, client_name, service, time, date, duration, price, status)
VALUES 
  ('shop-123', 'João Silva', 'Corte de Cabelo', '10:00:00', CURRENT_DATE + INTERVAL '1 day', '30min', 35.00, 'confirmed'),
  ('shop-123', 'Maria Santos', 'Barba', '11:30:00', CURRENT_DATE + INTERVAL '1 day', '15min', 25.00, 'pending'),
  ('shop-123', 'Pedro Costa', 'Corte + Barba', '14:00:00', CURRENT_DATE, '45min', 50.00, 'completed')
ON CONFLICT DO NOTHING;

-- Dados de teste para clients
INSERT INTO clients (shop_id, name, email, phone)
VALUES 
  ('shop-123', 'João Silva', 'joao@email.com', '11999998888'),
  ('shop-123', 'Maria Santos', 'maria@email.com', '11999997777'),
  ('shop-123', 'Pedro Costa', 'pedro@email.com', '11999996666')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8 VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar tabelas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('appointments', 'clients', 'messages', 'notifications')
ORDER BY table_name;

-- Verificar publicações Realtime
SELECT pubname, schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================================================
-- CONCLUSÃO
-- ============================================================================
--
-- Execute este script completo no SQL Editor do Supabase.
--
-- Após executar, o Realtime estará configurado nas tabelas:
-- ✓ appointments
-- ✓ clients
-- ✓ messages
-- ✓ notifications
--
-- Agora você pode usar os hooks do /root/barber/src/realtime hooks.ts
--
-- ============================================================================
