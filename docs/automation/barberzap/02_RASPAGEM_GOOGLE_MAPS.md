# Automação 2 — Raspagem de barbearias

## Objetivo

Receber uma cidade, localizar barbearias no Google Maps pelo workflow n8n existente, normalizar os dados e entregar uma lista deduplicada para revisão e posterior campanha.

## Pipeline organizado

1. Entrada: cidade, estado, termo de busca e limite de resultados.
2. Coleta: nome, telefone, e-mail quando disponível, endereço, cidade, estado, URL do Maps, avaliação e origem.
3. Normalização: telefone em formato único, cidade/UF padronizados e nome limpo.
4. Deduplicação: telefone como chave principal; nome + endereço como fallback.
5. Validação: marcar telefone ausente, inválido, duplicado ou sem evidência de origem.
6. Revisão: separar pronto para contato, precisa revisar e descartado.
7. Importação: criar/atualizar lead sem apagar histórico.
8. Auditoria: guardar cidade, consulta, data, origem e identificador do lote.

## O que já existe

- Dados exportados: apps/site/data/Prospecção de Leads - sheet1.csv, lista_prospeccao_limpa.csv e lista_meta_ads.csv.
- Organização de listas: apps/site/scripts/organizar_lista_meta.py.
- Importação no CRM: apps/site/scripts/import_prospection_leads.py.
- Campos de funil e métricas: apps/site/barberzap_python/crm/extend_prospection_schema.sql.
- Módulo de prospecção: apps/site/barberzap_python/crm/crm_prospection.py.
- Templates de abordagem: apps/site/barberzap_python/prospection/SCRIPTS_TEMPLATES.md.

## O que não foi localizado

Não foi localizado um export JSON do n8n, um scraper Google Maps versionado ou um contrato de planilha dentro do repositório. Os documentos CONTEXTO_JARVIS.md, STATUS_O_QUE_FALTA.md e INTEGRATIONS_BARBERZAP.md citam workflows, mas seus estados são históricos e precisam ser confirmados no n8n real.

## Registro mínimo do lead

nome_barbearia, telefone, email, cidade, estado, endereço, maps_url, origem, consulta, lote_id, coletado_em, status_validacao, consentimento_status, opt_out_at e funnel_stage.

## Regras de segurança

- Não importar automaticamente um lead para disparo sem revisão de origem e telefone.
- Respeitar termos do provedor, legislação aplicável e pedido de opt-out.
- Separar dados brutos da lista pronta para contato.
- Não guardar credenciais do n8n ou do Google em CSV, documentação ou commits.
