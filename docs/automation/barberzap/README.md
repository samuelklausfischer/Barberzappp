# Automações BarberZap

Este é o diretório canônico para organizar as três automações que formam a operação comercial e de atendimento do BarberZap. Nesta etapa foram organizados mapa, contratos, referências e lacunas. Nenhum disparo foi ativado e nenhum dado real foi alterado.

## As três automações

| Automação | Objetivo | Situação encontrada |
|---|---|---|
| Atendimento IA por barbearia | Responder clientes no WhatsApp, consultar a configuração daquela barbearia e criar/confirmar agendamentos | Parcial: há secretária IA, Evolution API, CRM e modelos de agenda; o provedor de IA ainda está marcado como placeholder e o fluxo de produção precisa ser validado |
| Raspagem de barbearias | Receber cidade, consultar Google Maps, normalizar nome, telefone, e-mail e localização e preparar leads | Parcial: há CSVs, scripts de importação, schema de prospecção e documentação; não há export do workflow n8n versionado neste repositório |
| Disparo de conversão | Usar um telefone próprio para abordar leads, controlar cadência, respostas, interesse, opt-out e convite para o trial de 7 dias | Parcial: há Evolution API, templates e CRM; falta um orquestrador de campanha seguro, com fila, limites, consentimento e auditoria |

## Estrutura

- 01_ATENDIMENTO_IA_BARBEARIA.md — contrato do atendimento por tenant.
- 02_RASPAGEM_GOOGLE_MAPS.md — pipeline de coleta e normalização de leads.
- 03_DISPARO_CONVERSAO.md — campanha outbound e seus estados.
- 04_PLANO_DE_EXECUCAO.md — sequência recomendada para transformar o que existe em operação.
- n8n/README.md — convenção para guardar exports sanitizados dos workflows.

## O que já existe no repositório

### Atendimento e agendamento

- apps/site/barberzap_python/agents/secretaria_universal.py
- apps/site/barberzap_python/core/context_builder.py
- apps/site/barberzap_python/webhooks/webhook_handler.py
- apps/site/barberzap_python/integrations/evolution_api.py
- apps/site/barberzap_python/integrations/ai_service.py
- apps/site/barberzap_python/integrations/postgres_memory.py
- apps/site/barberzap_python/crm/crm_logger.py
- apps/saas/database/01_critical_tables.sql
- apps/saas/database/02_optimistic_locking.sql
- apps/site/WHATSAPP_IMPLEMENTATION.md
- apps/site/BACKEND_BARBERZAP.md

### Prospecção e leads

- apps/site/data/Prospecção de Leads - sheet1.csv
- apps/site/data/lista_prospeccao_limpa.csv
- apps/site/data/lista_meta_ads.csv
- apps/site/scripts/organizar_lista_meta.py
- apps/site/scripts/import_prospection_leads.py
- apps/site/barberzap_python/crm/extend_prospection_schema.sql
- apps/site/barberzap_python/crm/crm_prospection.py
- apps/site/barberzap_python/prospection/SCRIPTS_TEMPLATES.md
- apps/site/docs/strategy/ESTRATEGIA_VENDAS_BARBEIROS.md
- apps/site/docs/reports/IMPLEMENTATION_GUIDE_PROSPECCAO.md

## Lacunas importantes

1. Os workflows n8n não estão versionados aqui; documentos antigos afirmam estados diferentes, então o ambiente n8n real precisa ser inventariado antes de reativar qualquer fluxo.
2. O arquivo ai_service.py declara provider placeholder; não deve ser tratado como IA de produção.
3. A presença do wrapper Evolution API não significa que há fila, limite, opt-out ou autorização para disparo em massa.
4. CSVs de leads contêm dados pessoais e não devem receber novos dados reais sem política de acesso, retenção e consentimento.
5. O painel admin deve consumir estados auditáveis, mas não deve virar o lugar que envia mensagens diretamente.

## Regra de organização

- n8n é orquestração externa e seus exports sanitizados ficam documentados em n8n/.
- Python/FastAPI concentra contratos transacionais, validação, contexto por barbearia e integração com o banco.
- Supabase é a fonte de verdade para tenant, configuração da IA, serviços, barbeiros, agenda, leads, mensagens e auditoria.
- O admin acompanha e autoriza operações; o worker/fila executa.
