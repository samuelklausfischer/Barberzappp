# Automação 3 — Disparo e conversão para o trial

## Objetivo

Usar um telefone próprio e autorizado para abordar leads de barbearias, acompanhar a conversa e conduzir interessados ao teste de 7 dias sem transformar o painel em um disparador manual sem controles.

## Estados recomendados

new → ready_for_contact → queued → sent → delivered → replied → interested → trial_started → converted

Estados de saída: failed, unresponsive, not_interested, opted_out e blocked.

## Fluxo-alvo

1. Admin escolhe cidade/lote e revisa os leads.
2. O sistema verifica telefone, origem, opt-out, janela de contato e limite diário.
3. Um worker coloca a mensagem em fila idempotente.
4. Evolution API envia pelo número de prospecção.
5. Webhook atualiza entregue, falha, resposta e interesse.
6. A IA de vendas classifica a resposta e seleciona próximo passo.
7. Interessado recebe o link do trial e uma tarefa de acompanhamento.
8. O admin acompanha o funil; o worker executa novos follow-ups conforme cadência.

## Já disponível

- Envio básico via apps/site/barberzap_python/integrations/evolution_api.py.
- Endpoints de conexão e mensagem de teste em apps/site/barberzap_python/api/routers/whatsapp.py.
- Registro inbound/outbound no CRM.
- Campos de funil, contadores e follow-up em extend_prospection_schema.sql.
- Templates de primeiro contato, follow-ups, objeções, CTA de demo, trial e opt-out em SCRIPTS_TEMPLATES.md.
- Estratégia comercial consolidada em ESTRATEGIA_VENDAS_BARBEIROS.md.

## Ainda não é uma automação de produção

- Não há um workflow n8n exportado neste repositório para o disparo.
- Não há fila de campanha específica com retry, idempotência e limite por número.
- Não há confirmação de entrega/resposta ligada a um campaign_id único.
- O provider de IA ainda é placeholder.
- Opt-out, janela de contato e consentimento precisam ser bloqueios técnicos, não apenas texto de template.
- O envio deve ser segregado do atendimento de clientes das barbearias.

## Métricas do painel admin

total de leads, prontos, em fila, enviados, entregues, falhos, respostas, interessados, trials iniciados, conversões, opt-outs, taxa de resposta e taxa de conversão por cidade/lote.

## Regra operacional

O painel admin controla aprovação e leitura. O worker/fila controla execução. Nenhuma ação de “buscar novas barbearias” deve disparar mensagens automaticamente.
