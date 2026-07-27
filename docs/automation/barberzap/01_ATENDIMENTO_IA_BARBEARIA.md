# Automação 1 — Atendimento IA por barbearia

## Objetivo

Cada mensagem recebida no WhatsApp deve ser respondida usando somente o contexto da barbearia associada àquela instância: nome, endereço, horários, serviços, preços, barbeiros, regras da IA e agenda disponível.

## Fluxo-alvo

1. Evolution API recebe a mensagem e envia o webhook.
2. O backend identifica a instância e resolve o tenant correto.
3. O contexto é montado com agente_config, profiles/tenants, services, barbers e horários.
4. A IA classifica a intenção: dúvida, serviço, disponibilidade, novo agendamento, confirmação, cancelamento ou transferência para humano.
5. Para agendamento, o backend valida conflito, grava appointment e gera confirmação.
6. A resposta é enviada pelo mesmo número conectado àquela barbearia.
7. Mensagem inbound, resposta outbound, decisão e erro ficam no CRM/auditoria.

## Já disponível

- Secretária universal: apps/site/barberzap_python/agents/secretaria_universal.py.
- Resolução de contexto: apps/site/barberzap_python/core/context_builder.py.
- Webhook e pipeline: apps/site/barberzap_python/webhooks/webhook_handler.py.
- Wrapper de WhatsApp: apps/site/barberzap_python/integrations/evolution_api.py.
- Memória e histórico: apps/site/barberzap_python/integrations/postgres_memory.py e apps/site/barberzap_python/crm/crm_logger.py.
- Estruturas de agenda: apps/saas/database/01_critical_tables.sql e apps/saas/database/02_optimistic_locking.sql.
- Configuração visual da IA e WhatsApp no dashboard SaaS.

## Precisa ser validado antes de chamar de pronto

- ai_service.py ainda está documentado como placeholder.
- A instância do WhatsApp precisa estar vinculada a um único tenant e protegida por RLS.
- O fluxo real de disponibilidade precisa usar a mesma fonte de verdade do dashboard.
- A IA não pode inventar preço, horário, serviço ou confirmação de agendamento.
- Deve existir fallback humano, idempotência de webhook, limite de reprocessamento e observabilidade.
- Testar ponta a ponta com uma barbearia de teste antes de habilitar clientes reais.

## Contrato mínimo de entrada

tenant_id, instance_id, telefone do cliente, mensagem, message_id do provedor, timestamp e payload original sanitizado.

## Contrato mínimo de saída

resposta textual, ação pretendida, appointment_id quando houver agendamento, estado da conversa, mensagem de erro segura e referência de auditoria.

## Fora do escopo desta organização

Não foi escolhida uma API de modelo, não foram configuradas credenciais e não foi ativado nenhum número de WhatsApp.
