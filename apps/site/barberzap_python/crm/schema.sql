-- BarberZap CRM Schema
-- Tabelas necessárias para o sistema de CRM

-- Tabela de Leads (contatos/clientes)
CREATE TABLE IF NOT EXISTS crm_leads (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS crm_messages (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    lead_id BIGINT REFERENCES crm_leads(id) ON DELETE SET NULL,
    phone VARCHAR(20) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    direction VARCHAR(20) NOT NULL, -- 'inbound' ou 'outbound'
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant_phone ON crm_leads(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant_status ON crm_leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_messages_tenant_lead ON crm_messages(tenant_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_tenant_phone ON crm_messages(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_crm_messages_created_at ON crm_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_messages_direction ON crm_messages(direction);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_crm_leads_updated_at ON crm_leads;
CREATE TRIGGER update_crm_leads_updated_at
    BEFORE UPDATE ON crm_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments para documentação
COMMENT ON TABLE crm_leads IS 'Leads/contatos do sistema CRM BarberZap';
COMMENT ON TABLE crm_messages IS 'Histórico de mensagens do CRM BarberZap';

COMMENT ON COLUMN crm_leads.tenant_id IS 'ID do tenant/barbearia (multitenant)';
COMMENT ON COLUMN crm_leads.phone IS 'Número de telefone normalizado (apenas números)';
COMMENT ON COLUMN crm_leads.status IS 'Status do lead: new, contacted, converted, lost';
COMMENT ON COLUMN crm_leads.metadata IS 'Dados adicionais em formato JSON';

COMMENT ON COLUMN crm_messages.tenant_id IS 'ID do tenant/barbearia (multitenant)';
COMMENT ON COLUMN crm_messages.lead_id IS 'Referência ao lead na tabela crm_leads';
COMMENT ON COLUMN crm_messages.direction IS 'Direção da mensagem: inbound (recebida) ou outbound (enviada)';
COMMENT ON COLUMN crm_messages.status IS 'Status da mensagem: received, queued, sent, delivered, read, failed';

-- Row Level Security (RLS) para multi-tenancy
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_messages ENABLE ROW LEVEL SECURITY;

-- Política RLS para crm_leads
CREATE POLICY "Users can view their own tenant's leads"
    ON crm_leads FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id')::BIGINT);

CREATE POLICY "Users can insert leads for their own tenant"
    ON crm_leads FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::BIGINT);

CREATE POLICY "Users can update their own tenant's leads"
    ON crm_leads FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant_id')::BIGINT);

CREATE POLICY "Users can delete their own tenant's leads"
    ON crm_leads FOR DELETE
    USING (tenant_id = current_setting('app.current_tenant_id')::BIGINT);

-- Política RLS para crm_messages
CREATE POLICY "Users can view their own tenant's messages"
    ON crm_messages FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id')::BIGINT);

CREATE POLICY "Users can insert messages for their own tenant"
    ON crm_messages FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::BIGINT);

CREATE POLICY "Users can update their own tenant's messages"
    ON crm_messages FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant_id')::BIGINT);

CREATE POLICY "Users can delete their own tenant's messages"
    ON crm_messages FOR DELETE
    USING (tenant_id = current_setting('app.current_tenant_id')::BIGINT);

-- View útil para lead com últimas informações
CREATE OR REPLACE VIEW crm_leads_with_last_message AS
SELECT 
    l.id,
    l.tenant_id,
    l.phone,
    l.name,
    l.email,
    l.status,
    l.notes,
    l.created_at,
    l.updated_at,
    m.message AS last_message,
    m.created_at AS last_message_at,
    m.direction AS last_message_direction,
    COUNT(msg.id) AS message_count
FROM crm_leads l
LEFT JOIN LATERAL (
    SELECT id, message, created_at, direction
    FROM crm_messages
    WHERE lead_id = l.id
    ORDER BY created_at DESC
    LIMIT 1
) m ON true
LEFT JOIN crm_messages msg ON msg.lead_id = l.id
GROUP BY l.id, m.message, m.created_at, m.direction
ORDER BY l.updated_at DESC;

COMMENT ON VIEW crm_leads_with_last_message IS 'View com leads contando com última mensagem e contador de mensagens';
