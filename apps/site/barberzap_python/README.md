# BarberZap 📞💇

Sistema de inteligência artificial para barbearias, convertendo fluxos de automação do n8n para Python com FastAPI e arquitetura modular.

[![Python 3.12](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

## 📚 Documentação Completa

📂 A documentação completa está disponível na pasta `docs/`:

→ **📚 Índice de Documentação**: [docs/INDEX.md](docs/INDEX.md) (comece aqui!)

| Documento | Descrição |
|-----------|-----------|
| 📖 [Documentação Principal](docs/README.md) | Visão geral e arquitetura |
| ⚙️ [Setup Guide](docs/SETUP.md) | Instalação e configuração completa |
| 🚀 [Deployment Guide](docs/DEPLOYMENT.md) | Deploy em produção (systemd, Docker, Nginx) |
| 📋 [API Reference](docs/API_REFERENCE.md) | Documentação completa de todos os endpoints |
| 🔌 [Integration Guide](docs/INTEGRATION.md) | Integração com Evolution API, Supabase, AI |
| 🐛 [Troubleshooting](docs/TROUBLESHOOTING.md) | Solução de problemas comuns |

## 🚀 Começo Rápido

```bash
# 1. Navegar ao diretório
cd /root/Barberzap\ SITE/barberzap_python/

# 2. Criar ambiente virtual
python3.12 -m venv venv
source venv/bin/activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 5. Executar
python main.py
```

🎉 API disponível em: http://localhost:8000/docs

## 🏗️ Estrutura do Projeto

```
barberzap_python/
├── 📁 integrations/        # Wrappers de integrações externas
│   ├── evolution_api.py    # WhatsApp (Evolution API)
│   ├── supabase_rest.py    # Supabase REST API
│   ├── ai_service.py       # OpenRouter/OpenAI AI
│   └── postgres_memory.py  # Chat Memory (PostgreSQL)
│
├── 📁 core/                # Lógica central do sistema
│   ├── tenant_resolver.py  # Multi-tenancy: instance_name → tenant_id
│   ├── context_builder.py  # Builder de contexto da barbearia
│   └── config.py           # Configurações
│
├── 📁 agents/              # Agentes especializados de IA
│   └── secretaria_universal.py  # Secretária universal com memória
│
├── 📁 crm/                 # CRM e Logging
│   ├── crm_manager.py      # Gestão de leads e conversas
│   └── crm_logger.py       # Logger de atividades
│
├── 📁 webhooks/            # Webhook handlers
│   └── webhook_handler.py  # Handler principal do BarberZap SaaS
│
├── 📁 tests/               # Testes unitários
├── 📁 scripts/             # Scripts utilitários e demo
├── 📁 docs/                # 📚 Documentação completa
├── 📁 logs/                # Logs da aplicação
├── 📄 requirements.txt     # Dependências Python
├── 📄 .env.example         # Exemplo de variáveis de ambiente
├── 📄 pytest.ini           # Configuração de testes
├── 📄 main.py              # FastAPI entry point
└── 📄 README.md            # Este arquivo
```

## 🔄 Fluxo de Mensagens

```
┌─────────────────────────────────────────────────────────┐
│                   WhatsApp Client                       │
│                  (envia mensagem)                        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Evolution API → POST /webhook/barberzap-saas        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. WebhookNormalizer (extract: instance, phone, msg)   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. TenantResolver.resolve_tenant(instance_name)        │
│    → tenant_id                                          │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. ContextBuilder.build_context(tenant_id)            │
│    → barbershop, services, barbers, hours              │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. SecretáriaUniversal.generate_response()             │
│    → AI response with chat memory (40 msgs)            │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 6. CRMManager.log_conversation()                       │
│    → upsert lead + log messages                        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 7. EvolutionAPI.send_message()                         │
│    → WhatsApp response to client                       │
└─────────────────────────────────────────────────────────┘
```

## 📋 Pré-requisitos

- ✅ Python 3.12 ou superior
- ✅ Conta Supabase (já configurada)
- ✅ Evolution API instance para WhatsApp
- ✅ Chave de API para IA (OpenRouter ou similar)

## 🔌 Endpoints Principais

### Webhooks
- `POST /webhook/barberzap-saas` - ⭐ **Principal**: Recebe mensagens do WhatsApp via Evolution API
- `POST /webhooks/whatsapp` - (Fallback) Recebe mensagens diretas do WhatsApp
- `POST /webhooks/calendar` - Eventos de calendário
- `POST /webhooks/ai` - Respostas da IA (async)

### API
- `GET /` - Status da API
- `GET /health` - Health check para monitoramento
- `POST /api/send-message` - Enviar mensagem pelo WhatsApp
- `GET /api/tenant/{tenant_id}` - Obter configurações de tenant
- `GET /api/schedule/available` - Horários disponíveis
- `POST /api/schedule` - Criar agendamento

> 📖 **Documentação completa da API**: [API Reference](docs/API_REFERENCE.md)

## 🧪 Testes

```bash
# Todos os testes
pytest tests/ -v

# Com coverage
pytest tests/ --cov=. --cov-report=html

# Teste específico
pytest tests/test_tenant_resolver.py -v
```

## 📝 Logs

Os logs são salvos no diretório `logs/` com o formato `barberzap_YYYYMMDD.log`.

```bash
# Ver logs em tempo real
tail -f logs/barberzap_$(date +%Y%m%d).log

# Ver erros
grep ERROR logs/barberzap_*.log
```

## 🔐 Segurança

- ✅ Arquivo `.env` versionado no `.gitignore`
- ✅ SERVICE_ROLE_KEY do Supabase apenas server-side
- ✅ Separação de tenancy por instance_name
- ✅ Validação de webhooks em desenvolvimento

> 📘 **Configuração de segurança**: Veja [Deployment Guide](docs/DEPLOYMENT.md) para produção

## 📚 Migrando do n8n → Python

Este projeto converte o fluxo do n8n para uma arquitetura Python modular:

| n8n Node (Fluxo) | Python Module | Fase | Status |
|------------------|---------------|------|--------|
| Evolution API (Receive) | `webhooks/webhook_handler.py` | 6 | ✅ |
| Evolution API (Send) | `integrations/evolution_api.py` | 2 | ✅ |
| Supabase (Tenant Resolve) | `core/tenant_resolver.py` | 3 | ✅ |
| Supabase (Context) | `core/context_builder.py` | 4 | ✅ |
| AI (Texto) | `integrations/ai_service.py` | 4 | ✅ |
| Secretária Universal | `agents/secretaria_universal.py` | 4 | ✅ |
| Chat Memory | `integrations/postgres_memory.py` | 5 | ✅ |
| CRM (Lead + Log) | `crm/crm_manager.py` | 7 | ✅ |

**Fases concluídas: 7/7** | **Documentação: Fase 8** ✅

## 👥 Suporte

Para suporte completo, consulte:

- 📖 **Primeiros passos**: [Documentação Principal](docs/README.md)
- ❓ **Problemas de setup**: [Setup Guide](docs/SETUP.md)
- 🐛 **Errors e bugs**: [Troubleshooting](docs/TROUBLESHOOTING.md)
- 🚀 **Deploy em produção**: [Deployment Guide](docs/DEPLOYMENT.md)
- 🔌 **Integrações**: [Integration Guide](docs/INTEGRATION.md)

## 📄 Licença

Propriedade da BarberZap. Todos os direitos reservados.

---

**Versão:** 1.0.0 | **Última atualização:** 2026-02-23
