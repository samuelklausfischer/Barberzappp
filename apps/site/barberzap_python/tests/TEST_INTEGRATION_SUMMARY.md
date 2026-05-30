# BarberZap Integration Test - Resumo

## Arquivo
`/root/Barberzap SITE/barberzap_python/tests/test_integration.py`

## Objetivo
Teste de integração completo do fluxo BarberZap (N8N → Python) - FASE 7b.

## Fluxo Testado

### 1. Webhook Payload Recebido (Simulado)
- Payload Evolution API com mensagem do WhatsApp
- Event: `messages.upsert`
- Instance: `barbearia_001`
- Cliente: João Silva
- Mensagem: "Olá, quero agendar um corte para sexta às 14h"

### 2. Normalizer
- Extrai `instance_name`
- Extrai `phone` (sender)
- Extrai `message` content
- Extrai `client_name` (pushName)
- Valida se deve processar a mensagem

### 3. Tenant Resolution
- Mapeia `instance_name` → `user_id`
- Consulta tabela `whatsapp_instances` no Supabase
- Retorna `tenant_user_123`

### 4. Context Builder
- Busca configuração da barbearia (`agente_config`)
- Busca barbeiros ativos (`barbers`)
- Busca serviços disponíveis (`services`)
- Retorna contexto completo para IA

### 5. Secretaria Universal (IA Response)
- Gera resposta da IA usando contexto
- Recebe: `instance_name`, `phone`, `message`, `context`
- Retorna: `response`, `tokens_used`, `tenant_id`, etc.

### 6. CRM Logger
- `upsert_lead()`: Cria ou atualiza lead no CRM
- `log_message()`: Registra mensagem inbound e outbound
- Tabelas: `crm_leads` e `crm_messages`

### 7. Evolution API (send_message)
- Envia resposta para o WhatsApp
- Instance: `barbearia_001`
- Phone: `5511999999999@s.whatsapp.net`
- Message: resposta da IA

## Testes Incluídos

| # | Teste | Descrição | Status |
|---|-------|-----------|--------|
| 1 | `test_normalizer_step` | Valida normalização do webhook | ✅ PASS |
| 2 | `test_normalizer_and_tenant_resolution` | Valida resolução de tenant | ✅ PASS |
| 3 | `test_context_builder` | Valida construção de contexto | ✅ PASS |
| 4 | `test_ai_response_generation` | Valida geração de resposta IA | ✅ PASS |
| 5 | `test_crm_logging` | Valida operações CRM | ✅ PASS |
| 6 | `test_evolution_api_send_message` | Valida Evolution API wrapper | ✅ PASS |
| 7 | `test_complete_flow_new_lead` | **Fluxo completo end-to-end** | ✅ PASS |

## Validações Realizadas

- ✅ Todas as camadas conectam corretamente
- ✅ Tenant resolution funciona
- ✅ Context builder retorna dados corretos
- ✅ IA response gerada (mock)
- ✅ CRM logs salvos
- ✅ Evolution API send_message chamado (mock)

## Como Executar

```bash
# Executar todos os testes de integração
cd "/root/Barberzap SITE/barberzap_python"
python3 -m pytest tests/test_integration.py -v -m integration

# Executar apenas o fluxo completo
python3 -m pytest tests/test_integration.py::TestBarberZapIntegrationFlow::test_complete_flow_new_lead -v -s

# Executar com detalhes completos
python3 -m pytest tests/test_integration.py -v -s --tb=short
```

## Resultado Atual

```
======================== 7 passed, 10 warnings ========================
```

Todos os 7 testes passam com sucesso! 🎉
