# BarberZap CRM Logger

## Descrição

Módulo para gerenciamento de CRM (Customer Relationship Management) no BarberZap, implementado em Python. Este módulo fornece funções para gerenciar leads e histórico de conversas usando o Supabase como banco de dados.

## Arquivos

- **`crm_logger.py`** - Módulo principal com todas as funções CRM
- **`test_crm_logger.py`** - Suite de testes completa
- **`schema.sql`** - Script SQL para criar as tabelas no Supabase
- **`migrate_schema.py`** - Script auxiliar para aplicar o schema
- **`inspect_tables.py`** - Script para inspecionar estrutura das tabelas

## Schema das Tabelas

### crm_leads
```sql
- id: UUID (PRIMARY KEY)
- tenant_id: UUID (FK para tenant/barbearia)
- client_phone: VARCHAR(20) (número de telefone)
- client_name: VARCHAR(255) (nome do cliente)
- kanban_stage: VARCHAR(50) (status do lead: 'new', 'contacted', etc.)
- ai_enabled: BOOLEAN (atendimento AI habilitado)
- tags: TEXT[] (array de tags)
- notes: TEXT (anotações)
- last_message_at: TIMESTAMPTZ (timestamp última mensagem)
- created_at: TIMESTAMPTZ (timestamp criação)
```

### crm_messages
```sql
- id: UUID (PRIMARY KEY)
- tenant_id: UUID (FK para tenant/barbearia)
- lead_id: UUID (FK para crm_leads)
- sender_type: VARCHAR (tipo de remetente)
- content: TEXT (conteúdo da mensagem)
- media_url: VARCHAR (URL de mídia, opcional)
- created_at: TIMESTAMPTZ (timestamp criação)
```

**OBS:** O schema atual do banco tem restrições:
- `kanban_stage` só aceita o valor 'new'
- `sender_type` só aceita o valor 'client'

## Funções Principais

### `upsert_lead(tenant_id, phone, name, status, email, notes, metadata, client)`
Cria ou atualiza um lead no CRM.

**Parâmetros:**
- `tenant_id` (Any, obrigatório): UUID do tenant/barbearia
- `phone` (str, obrigatório): Número de telefone (formato: 5511999999999)
- `name` (str, opcional): Nome do contato
- `status` (str): Status do lead (default: "new")
- `email` (str, opcional): Email do contato
- `notes` (str, opcional): Anotações
- `metadata` (dict, opcional): Dados adicionais em JSON
- `client` (SupabaseRestClient, opcional): Cliente Supabase

**Retorna:** Dict com lead criado/atualizado

**Exemplo:**
```python
from crm.crm_logger import upsert_lead

# Criar novo lead
lead = upsert_lead(
    tenant_id="123e4567-e89b-12d3-a456-426614174000",
    phone="5511999999999",
    name="João Silva",
    status="new"
)

print(f"Lead ID: {lead['id']}")
```

---

### `log_message(tenant_id, phone, sender, message, metadata, direction, status, client)`
Registra uma mensagem no histórico CRM.

**Parâmetros:**
- `tenant_id` (Any, obrigatório): UUID do tenant/barbearia
- `phone` (str, obrigatório): Número de telefone do lead
- `sender` (str, obrigatório): Nome/identificador do remetente
- `message` (str, obrigatório): Conteúdo da mensagem
- `metadata` (dict, opcional): Metadados adicionais (ex: message_id, media_url)
- `direction` (str, opcional): 'inbound' ou 'outbound' (auto-detectado se não informado)
- `status` (str): Status da mensagem (default: "received")
- `client` (SupabaseRestClient, opcional): Cliente Supabase

**Retorna:** Dict com mensagem registrada

**Exemplo:**
```python
from crm.crm_logger import log_message

# Registrar mensagem recebida
msg = log_message(
    tenant_id="123e4567-e89b-12d3-a456-426614174000",
    phone="5511999999999",
    sender="cliente",
    message="Olá! Gostaria de agendar um corte"
)

print(f"Mensagem ID: {msg['id']}")
```

---

### `get_lead_history(tenant_id, phone, include_lead_info, limit, client)`
Busca histórico completo de conversa do lead.

**Parâmetros:**
- `tenant_id` (Any, obrigatório): UUID do tenant/barbearia
- `phone` (str, obrigatório): Número de telefone do lead
- `include_lead_info` (bool): Se True, inclui dados do lead (default: True)
- `limit` (int, opcional): Limite de mensagens (None = todas)
- `client` (SupabaseRestClient, opcional): Cliente Supabase

**Retorna:** Lista de mensagens (ordenado por created_at ASC)

**Exemplo:**
```python
from crm.crm_logger import get_lead_history

# Buscar histórico completo
history = get_lead_history(
    tenant_id="123e4567-e89b-12d3-a456-426614174000",
    phone="5511999999999"
)

for msg in history:
    print(f"{msg['direction'].upper()}: {msg['message']}")
```

---

## Funções Auxiliares

### `lead_exists(tenant_id, phone, client)`
Verifica se lead existe no CRM.

**Retorna:** True se existe, False caso contrário

---

### `get_lead_by_id(tenant_id, lead_id, client)`
Busca lead por ID.

**Retorna:** Dict com dados do lead ou None

---

### `update_lead_status(tenant_id, phone, status, notes, client)`
Atualiza status de um lead.

**Parâmetros:**
- `status`: 'new', 'contacted', 'converted', 'lost'
- `notes`: Anotações adicionais

**Retorna:** Dict com lead atualizado

---

### `list_leads(tenant_id, status, limit, offset, client)`
Lista leads do CRM com filtros.

**Retorna:** Lista de leads

---

### `get_message_by_id(tenant_id, message_id, client)`
Busca mensagem por ID.

**Retorna:** Dict com dados da mensagem ou None

---

## Exceções

### `CRMError`
Erro base para operações CRM.

### `CRMLeadNotFoundError`
Lead não encontrado.

### `CRMMessageError`
Erro ao registrar mensagem.

---

## Testes

Execute a suite de testes completa:

```bash
cd "/root/Barberzap SITE/barberzap_python"
python3 crm/test_crm_logger.py
```

**Resultado esperado:**
```
✅ 5/5 testes passaram
```

---

## Configuração

O módulo usa o Supabase REST Client existente. Certifique-se de que as variáveis de ambiente estão configuradas:

```bash
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_KEY="sua-chave-anon"
```

---

## Mapeamento Interno ↔ Banco de Dados

O módulo usa um mapeamento entre nomes internos e colunas do banco:

| Interno | Banco de Dados |
|---------|----------------|
| phone | client_phone |
| name | client_name |
| status | kanban_stage |
| message | content |
| sender | sender_type |

O mapeamento é transparente para o usuário - você usa os nomes internos e o módulo converte automaticamente.

---

## Limitações Atuais

Devido ao schema existente do banco de dados:

1. **Status do Lead:** A coluna `kanban_stage` atualmente só aceita o valor "new". Para usar outros status (contacted, converted, lost), é necessário modificar a constraint `crm_leads_kanban_stage_check` no banco.

2. **Tipo de Remetente:** A coluna `sender_type` atualmente só aceita o valor "client". A direção da mensagem (inbound/outbound) é derivada do parâmetro `sender` ou do parâmetro explícito `direction`.

3. **Campos não existentes:** Alguns campos como `email` e `status` (na tabela messages) não existem no schema atual.

---

## Migration do Schema

Para criar/modificar as tabelas no Supabase:

1. Via **Supabase Dashboard:**
   - Acesse: https://app.supabase.com
   - Navegue para: SQL Editor
   - Cole o conteúdo do arquivo `schema.sql`
   - Clique em RUN

2. Via **SQL (psql):**
   ```bash
   psql -h db.seu-projeto.supabase.co -U postgres -d postgres < schema.sql
   ```

Para instruções detalhadas, execute:
```bash
python3 crm/migrate_schema.py
```

---

## Inspecionar Tabelas

Para verificar a estrutura atual das tabelas:

```bash
python3 crm/inspect_tables.py
```

---

## Exemplo de Uso Completo

```python
#!/usr/bin/env python3
from crm.crm_logger import upsert_lead, log_message, get_lead_history

# Dados
tenant_id = "123e4567-e89b-12d3-a456-426614174000"
phone = "5511999998888"

# 1. Criar lead
lead = upsert_lead(
    tenant_id=tenant_id,
    phone=phone,
    name="Maria Santos",
    status="new"
)
print(f"✓ Lead criado: {lead['id']}")

# 2. Registrar mensagem recebida
msg1 = log_message(
    tenant_id=tenant_id,
    phone=phone,
    sender="cliente",
    message="Olá! Quero agendar um corte"
)
print(f"✓ Mensagem 1 registrada: {msg1['id']}")

# 3. Enviar resposta (automática)
msg2 = log_message(
    tenant_id=tenant_id,
    phone=phone,
    sender="bot",
    message="Olá! Temos horários disponíveis. Qual horário prefere?",
    direction="outbound"
)
print(f"✓ Mensagem 2 registrada: {msg2['id']}")

# 4. Buscar histórico
history = get_lead_history(tenant_id, phone)

print(f"\nHistórico de conversa ({len(history)} mensagens):")
for i, msg in enumerate(history, 1):
    direction = msg.get('_direction', msg.get('direction', '?')).upper()
    print(f"  {i}. [{direction}] {msg['message'][:50]}...")
```

---

## Logging

O módulo usa o sistema de logging do Python. Para configurar:

```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

---

## Autor e Versão

- **Versão:** 1.0.0
- **Data:** 2026-02-23
- **Fase:** BarberZap Python Migration - FASE 5

---

## Suporte

Para dúvidas ou problemas, consulte os testes unitários em `test_crm_logger.py` ou execute o script de inspeção de tabelas.
