# Plano de execução das automações

Este plano organiza os próximos passos sem antecipar implementação ou reativação de workflow.

## Fase 0 — Inventário real

- Exportar os workflows n8n atuais sem credenciais.
- Identificar qual workflow faz raspagem, qual faz organização da planilha, qual faz disparo e quais estão ativos.
- Confirmar URL, versão, credenciais, número de WhatsApp e ambiente de execução.
- Escolher uma fonte de verdade: n8n para orquestração externa; Supabase para estados e auditoria.

Saída: inventário versionado em docs/automation/barberzap/n8n/.

## Fase 1 — Contratos e segurança

- Definir tabelas/objetos para batches, leads, campaigns, campaign_messages, opt_outs e audit_events.
- Definir estados e transições permitidas.
- Separar tenant de clientes do SaaS e workspace de prospecção do BarberZap.
- Criar RLS, service boundary, rate limit, idempotency key e política de retenção.
- Validar LGPD, termos do provedor e opt-out antes de qualquer volume.

Saída: contrato de dados aprovado e checklist de segurança.

## Fase 2 — Atendimento IA da barbearia

- Validar tenant resolver e vínculo instância → barbearia.
- Trocar placeholder de IA por provider configurado em ambiente seguro.
- Testar leitura de serviços, barbeiros, horários e criação de appointment.
- Testar duplicidade de webhook, conflito de agenda, fallback humano e auditoria.
- Liberar primeiro para uma barbearia piloto.

Saída: atendimento ponta a ponta com uma conta piloto.

## Fase 3 — Raspagem controlada

- Confirmar workflow Google Maps e seu formato de saída.
- Criar contrato de planilha/CSV com colunas obrigatórias.
- Rodar uma cidade pequena, deduplicar, revisar e importar apenas leads aprovados.
- Medir cobertura, telefones inválidos e duplicidades.

Saída: lote revisado com origem e status de validação.

## Fase 4 — Disparo de conversão

- Configurar número próprio separado do atendimento das barbearias.
- Implementar fila, cadência, limites, retries e pausa global.
- Registrar cada tentativa e resposta com campaign_id.
- Habilitar templates aprovados, opt-out e classificação de interesse.
- Fazer piloto manual supervisionado antes de qualquer escala.

Saída: campanha pequena auditável com possibilidade de pausa.

## Fase 5 — Painel admin

- Ligar cidades e lotes ao buscador.
- Mostrar lead, telefone, origem, lote, estado, última mensagem, próxima ação e opt-out.
- Adicionar aprovação antes da fila e pausa global.
- Permitir suporte à conta sem misturar dados do workspace de prospecção.

Saída: controle operacional sem disparo acidental.

## Critério para considerar pronto

Só considerar uma automação pronta quando houver teste ponta a ponta, logs, retry seguro, idempotência, opt-out funcional, RLS/restrição de acesso, métrica operacional e procedimento de pausa.
