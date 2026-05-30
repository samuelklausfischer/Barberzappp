# BarberZap Documentation

Bem-vindo à documentação completa do **BarberZap Python** - Sistema de inteligência artificial para barbearias, migrado do n8n para Python com FastAPI e arquitetura modular.

## 📚 Índice da Documentação

| Documento | Descrição |
|-----------|-----------|
| [README.md](../README.md) | Visão geral do projeto e começo rápido |
| [SETUP.md](./SETUP.md) | Guia completo de instalação e configuração |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guia de deploy em produção (systemd, Docker) |
| [API_REFERENCE.md](./API_REFERENCE.md) | Referência completa da API |
| [INTEGRATION.md](./INTEGRATION.md) | Integração com Evolution API |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Solução de problemas comuns |

---

## 🚀 Começo Rápido

```bash
# Clone e entre no diretório
cd /root/Barberzap\ SITE/barberzap_python/

# Crie ambiente virtual
python3.12 -m venv venv
source venv/bin/activate

# Instale dependências
pip install -r requirements.txt

# Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Execute
python main.py
```

🎉 A API estará disponível em: http://localhost:8000/docs

---

## 🏗️ Arquitetura do Projeto

```
barberzap_python/
│
├── Integrations/          Camada de Integrações
│   ├── evolution_api.py  ← WhatsApp (Evolution API)
│   ├── supabase_rest.py  ← Supabase REST API
│   ├── ai_service.py     ← OpenRouter/OpenAI
│   └── postgres_memory.py ← Histórico de chat
│
├── Core/                 Camada Central
│   ├── tenant_resolver.py    ← Resolver multi-tenancy
│   ├── context_builder.py    ← Builder de contexto
│   └── config.py             ← Configurações
│
├── Agents/               Camada de Agentes IA
│   └── secretaria_universal.py ← Secretária universal
│
├── CRM/                  Camada de CRM
│   ├── crm_manager.py        ← Gestão de leads
│   └── crm_logger.py         ← Logger de atividades
│
├── Webhooks/             Camada de Webhooks
│   └── webhook_handler.py    ← Handler principal
│
├── Tests/                Testes
├── Scripts/              Scripts utilitários
├── Logs/                 Logs da aplicação
└── Docs/                 Documentação (você está aqui)
```

---

## 🔄 Fluxo de Mensagens

```
┌─────────────────────────────────────────────────────────┐
│                    WhatsApp Client                       │
│                  (envia mensagem)                        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              1. Evolution API Webhook                    │
│              (POST /webhook/barberzap-saas)              │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              2. WebhookNormalizer                        │
│         (extrai: instance_name, sender, message)         │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           3. TenantResolver.resolve_tenant()             │
│              (busca tenant_id na Supabase)               │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           4. ContextBuilder.build_context()              │
│        (carrega: barbearia, serviços, horários)          │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      5. SecretariaUniversal.generate_response()          │
│              (IA gera resposta com contexto)             │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│            6. CRMManager.log_conversation()              │
│       (salva lead, mensagens no Supabase)                │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│       7. EvolutionAPI.send_message()                     │
│              (envia resposta ao cliente)                 │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   WhatsApp Client                        │
│                  (recebe resposta)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🗃️ Estrutura de Dados

### Supabase (banco de dados principal)

#### Tabelas principais:
- **tenants** - Configurações multi-tenancy
- **barbearias** - Dados das barbearias
- **leads** - Clientes/prospects
- **messages** - Histórico de mensagens
- **chat_memoria_v4** - Memória de chat para IA

#### Relacionamentos:
```
tenants (1) → (N) barbearias
tenants (1) → (N) leads
leads (1) → (N) messages
leads (1) → (N) chat_memoria_v4
```

---

## 🔐 Segurança

### Boas práticas implementadas:
- ✅ Variáveis sensíveis no `.env` (versionado no `.gitignore`)
- ✅ Validação de webhooks (em desenvolvimento)
- ✅ Separação de tenancy por instance_name
- ✅ Uso de SERVICE_ROLE_KEY only server-side

### Recomendações de produção:
- 🔒 Implementar rate limiting
- 🔒 Configurar CORS whitelist
- 🔒 Usar HTTPS obrigatório
- 🔒 Rotacionar chaves periodicamente
- 🔒 Logs com sensibilidade (não logar credenciais)

---

## 📊 Monitoramento e Logging

### Níveis de log:
- **DEBUG** - Informação detalhada para desenvolvimento
- **INFO** - Mensagens informativas (padrão)
- **WARNING** - Situações incomuns mas recuperáveis
- **ERROR** - Erros que não impedem execução
- **CRITICAL** - Erros críticos

### Localização dos logs:
```
logs/
├── barberzap_20260223.log  ← Log diário rotativo
└── .gitignore              ← Logs não versionados
```

### Métricas importantes:
- Tempo de processamento de webhook
- Taxa de sucesso de envio de mensagens
- Erros de resolução de tenant
- Tempo de resposta da IA

---

## 🧪 Testing

### Executar testes:
```bash
# Todos os testes
pytest tests/ -v

# Com coverage
pytest tests/ --cov=. --cov-report=html

# Apenas um arquivo
pytest tests/test_tenant_resolver.py -v
```

### Estrutura de testes:
```
tests/
├── test_tenant_resolver.py    ← Testes de resolução de tenant
├── test_context_builder.py    ← Testes de contexto
└── __init__.py
```

---

## 🔄 Migração do n8n → Python

### Correspondência de componentes:

| n8n Node | Python Module | Status |
|----------|---------------|--------|
| Evolution API (Receive) | `webhooks.webhook_handler` | ✅ Fase 6 |
| Evolution API (Send) | `integrations.evolution_api` | ✅ Fase 2 |
| Supabase (Tenant Resolve) | `core.tenant_resolver` | ✅ Fase 3 |
| Supabase (Context) | `core.context_builder` | ✅ Fase 4 |
| AI (Text) | `integrations.ai_service` | ✅ Fase 4 |
| Secretária Universal | `agents.secretaria_universal` | ✅ Fase 4 |
| CRM (Lead + Log) | `crm.crm_manager` | ✅ Fase 7 |
| Chat Memory | `integrations.postgres_memory` | ✅ Fase 5 |

### Vantagens da migração:
- 🚀 Performance superior
- 🔧 Manutenibilidade aumentada
- 📦 Deploy simplificado
- 🧪 Testes automatizados
- 📊 Monitoring nativo
- 💰 Custo reduzido

---

## 📞 Suporte

### Documentação específica:
- ❓ Problemas de setup → [SETUP.md](./SETUP.md)
- 🐛 Errors e bugs → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 🚀 Deploy em produção → [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🔌 Integração Evolution API → [INTEGRATION.md](./INTEGRATION.md)
- 📋 Referência da API → [API_REFERENCE.md](./API_REFERENCE.md)

### Logs de desenvolvimento:
Verifique os logs em `/logs/barberzap_YYYYMMDD.log` para debugging.

---

## 📄 Licença

Propriedade da BarberZap. Todos os direitos reservados.

---

## 🗺️ Roadmap

### ✅ Concluído (Fases 1-7):
- [x] Estrutura do projeto
- [x] Integração Evolution API (placeholder)
- [x] Tenant Resolver
- [x] Context Builder
- [x] Secretaria Universal (IA)
- [x] Webhook Handler completo
- [x] CRM Manager

### 🔄 Em andamento (Fase 8):
- [x] Documentação completa
- [ ] Testes end-to-end
- [ ] Dockerfile oficial

### 📋 Planejado:
- [ ] Dashboard admin
- [ ] Analytics avançados
- [ ] Multi-modelo AI
- [ ] WhatsApp Templates API
- [ ] Integração Calendar
- [ ] Sistema de notificações

---

**Documentação v1.0.0** | Última atualização: 2026-02-23
