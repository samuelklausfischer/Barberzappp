# Exports n8n do BarberZap

Os workflows n8n não estão versionados neste checkout. Este diretório é o lugar reservado para exports sanitizados quando forem disponibilizados.

## Convenção

- 01_scraping_google_maps.json
- 02_normalizacao_planilha.json
- 03_importacao_crm.json
- 04_disparo_conversao.json
- 05_followup_respostas.json

## Regras

- Remover tokens, cookies, senhas, URLs privadas e dados pessoais reais antes do commit.
- Manter um README por workflow com objetivo, gatilho, entradas, saídas, dependências e último teste.
- Registrar se o workflow está ativo no n8n real, mas não assumir que documentação antiga representa o estado atual.
- Não colocar credenciais no repositório; usar variáveis e secrets do ambiente.
