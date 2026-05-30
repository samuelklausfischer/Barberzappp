# BarberZap Quick Reference

Referência rápida de comandos e configurações do BarberZap.

## 🚀 Comandos Essenciais

### Desenvolvimento
```bash
# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar desenvolvimento (com reload)
python main.py
# ou
uvicorn main:app --reload --port 8000

# Rodar testes
pytest tests/ -v
```

### Produção (Systemd)
```bash
# Iniciar serviço
sudo systemctl start barberzap

# Parar serviço
sudo systemctl stop barberzap

# Reiniciar
sudo systemctl restart barberzap

# Ver status
sudo systemctl status barberzap

# Ver logs
sudo journalctl -u barberzap -f

# Ver logs da aplicação
tail -f /opt/barberzap/logs/barberzap_$(date +%Y%m%d).log
```

### Docker
```bash
# Construir imagem
docker-compose build

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f barberzap

# Parar
docker-compose down

# Reiniciar
docker-compose restart barberzap
```

---

## 📝 Variáveis de Essenciais

### Supabase
```bash
SUPABASE_URL=https://htssqiupscyhhueqwpgu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Evolution API
```bash
EVOLUTION_API_URL=https://your-evolution-api-instance.com
EVOLUTION_API_KEY=your_api_key_here
EVOLUTION_API_INSTANCE=barbearia_001
```

### AI
```bash
AI_API_KEY=sk-or-v1-your-key-here
AI_MODEL=openai/gpt-4o-mini
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
```

---

## 🔌 Principais Endpoints

### Webhooks
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/webhook/barberzap-saas` | POST | ⭐ Principal: Recebe Evolution API webhooks |

### API
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Status da API |
| `/health` | GET | Health check |
| `/api/send-message` | POST | Enviar mensagem |
| `/api/tenant/{id}` | GET | Obter tenant |
| `/api/schedule/available` | GET | Horários disponíveis |
| `/api/schedule` | POST | Criar agendamento |

---

## 🐛 Troubleshooting Rápido

### ModuleNotFoundError
```bash
source venv/bin/activate && pip install -r requirements.txt
```

### Port already in use
```bash
lsof -i :8000
kill -9 <PID>
```

### Database failed
```bash
# Verificar SERVICE_ROLE_KEY
grep SUPABASE_SERVICE_ROLE_KEY .env
```

### WhatsApp not connected
```bash
# Re-escanear QR Code
curl -X GET https://your-evolution-api.com/instance/connect/barbearia_001 \
  -H "apikey: your_api_key"
```

---

## 📊 Logs

```bash
# Acessos recentes
tail -f logs/barberzap_$(date +%Y%m%d).log

# Erros
grep ERROR logs/barberzap_*.log

# Webhook processing
grep "Webhook received" logs/barberzap_*.log

# AI generation
grep "AI response generated" logs/barberzap_*.log
```

---

## 🧪 Testes Componentes

```bash
# Testar DB
python scripts/check_db.py

# Testar Tenant Resolver
python scripts/check_agente_config.py

# Testar Context Builder
python scripts/demo_context_builder.py

# Testar IA
python scripts/demo_secretaria_universal.py
```

---

## 🌐 URLs Úteis

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health**: http://localhost:8000/health
- **Supabase Dashboard**: https://supabase.com/dashboard/project/htssqiupscyhhueqwpgu
- **OpenRouter**: https://openrouter.ai/
- **Evolution API Docs**: https://doc.evolution-api.com/

---

## 📚 Documentação

- 📖 [Documentação Completa](./INDEX.md)
- ⚙️ [Setup](./SETUP.md)
- 🚀 [Deployment](./DEPLOYMENT.md)
- 📋 [API Reference](./API_REFERENCE.md)
- 🔌 [Integrations](./INTEGRATION.md)
- 🐛 [Troubleshooting](./TROUBLESHOOTING.md)

---

**Quick Reference** v1.0.0 | 2026-02-23
