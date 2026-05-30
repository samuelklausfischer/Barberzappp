# BarberZap - Troubleshooting Guide

Guia de solução de problemas comuns do BarberZap Python.

## 📋 Sumário

1. [Startup Issues](#startup-issues)
2. [Database Issues](#database-issues)
3. [WhatsApp/Evolution API Issues](#whatevolution-api-issues)
4. [AI Response Issues](#ai-response-issues)
5. [Webhook Issues](#webhook-issues)
6. [Performance Issues](#performance-issues)
7. [Production Issues](#production-issues)

---

## 🚀 Startup Issues

### Problem: ModuleNotFoundError

**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
ModuleNotFoundError: No module named 'supabase'
```

**Root Cause:**
Environment virtual não está ativado ou dependências não instaladas.

**Solution:**
```bash
# 1. Verificar se venv está ativado
which python
# Deve mostrar: /path/to/venv/bin/python

# 2. Se não, ativar
source venv/bin/activate  # Linux/macOS
# ou
.\venv\Scripts\activate   # Windows

# 3. Reinstalar dependências
pip install -r requirements.txt

# 4. Verificar instalação
python -c "import fastapi; print('✅ OK')"
```

---

### Problem: Port already in use

**Error:**
```
OSError: [Errno 48] Address already in use
```

**Root Cause:**
Porta 8000 já está sendo usada por outro processo.

**Solution:**

**Option 1: Matar processo**
```bash
# Encontrar processo
lsof -i :8000

# Matar processo
kill -9 <PID>

# Reiniciar
python main.py
```

**Option 2: Usar outra porta**
```bash
# Editar .env
APP_PORT=8001

# Ou especificar ao iniciar
python main.py --port 8001
# ou
uvicorn main:app --port 8001
```

**Option 3: Múltiplos workers (systemd)**
No systemd service, workers compartilham a mesma porta:
```ini
ExecStart=/opt/barberzap/venv/bin/gunicorn main:app \
    --workers 4 \
    --bind 0.0.0.0:8000
```

---

### Problem: Environment variable not found

**Error:**
```
KeyError: 'SUPABASE_URL'
ERROR: SUPABASE_URL not found in environment
```

**Root Cause:**
Arquivo `.env` não existe ou não foi carregado.

**Solution:**
```bash
# 1. Verificar se .env existe
ls -la .env

# 2. Criar se não existir
cp .env.example .env

# 3. Editar com valores reais
nano .env

# 4. Verificar valores
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('SUPABASE_URL'))"
# Se imprimir None, valores não estão no .env

# 5. Reiniciar aplicação
```

---

### Problem: Python version mismatch

**Error:**
```
SyntaxError: invalid syntax (Python 3.10)
Expected Python 3.12+
```

**Root Cause:**
Python 3.10 instalado, mas código usa features do 3.12.

**Solution:**
```bash
# Verificar versão atual
python --version

# Instalar Python 3.12
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3.12 python3.12-venv

# macOS (Homebrew)
brew install python@3.12

# Recriar venv com Python 3.12
deactivate  # Se venv ativo
rm -rf venv
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🗄️ Database Issues

### Problem: Supabase connection failed

**Error:**
```
Error connecting to Supabase: Invalid API key
SupabaseError: invalid claim: insufficient permission
```

**Root Cause:**
API Key inválida or usando anon key em operações que precisam de service_role.

**Solution:**
```bash
# 1. Verificar URL
echo $SUPABASE_URL
# Deve ser: https://htssqiupscyhhueqwpgu.supabase.co

# 2. Verificar se está usando service_role
grep SUPABASE_SERVICE_ROLE_KEY .env

# 3. API Key começa com "eyJ..."?
grep "^SUPABASE_SERVICE_ROLE_KEY=eyJ" .env

# 4. Obter nova chave em:
# https://supabase.com/dashboard/project/htssqiupscyhhueqwpgu/settings/api

# 5. Usar correta (service_role, não anon)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...  # Esta é a correta
# SUPABASE_ANON_KEY=eyJhbGci...              # Não usar esta
```

---

### Problem: Table does not exist

**Error:**
```
DatabaseError: relation "tenants" does not exist
SupabaseError: Code 42P01
```

**Root Cause:**
Schema do banco não foi criado ou migrations não foram executadas.

**Solution:**
```bash
# 1. Executar migrations
python scripts/migrate_schema.py

# 2. Se script não existir, executar SQL manualmente
python scripts/check_db.py

# 3. Acessar Supabase Dashboard → SQL Editor
# Executar o SQL do arquivo crm/migrate_schema.sql

# 4. Verificar tabelas
python -c "
from supabase import create_client
import os
client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
response = client.table('tenants').select('*').limit(1).execute()
print('✅ tenants table exists')
"
```

---

### Problem: Tenant not found

**Error:**
```
TenantNotFoundError: No tenant found for instance 'unknown_instance'
```

**Root Cause:**
Instance name não está cadastrada na tabela `tenants`.

**Solution:**
```bash
# 1. Verificar instance name no .env
grep EVOLUTION_API_INSTANCE .env

# 2. Verificar se existe no banco
curl -X POST https://htssqiupscyhhueqwpgu.supabase.co/rest/v1/tenants \
  -H "apikey: your_service_role_key" \
  -H "Authorization: Bearer your_service_role_key" \
  -d '{"jsonrpc":"2.0","method":"select","params":["tenants"]}'
  --data-raw '{"evolution_instance":"barbearia_001"}'

# 3. Inserir se não existir (via Supabase Dashboard SQL):
INSERT INTO tenants (name, evolution_instance, status)
VALUES ('Barbearia Central', 'barbearia_001', 'active');

# 4. Verificar com script
python scripts/check_agente_config.py
```

---

### Problem: Database connection timeout

**Error:**
```
TimeoutError: Database connection timed out
OperationalError: could not connect to server
```

**Root Cause:**
Network problem or Supabase downtime.

**Solution:**
```bash
# 1. Check internet connection
ping supabase.com

# 2. Check Supabase status
curl -I https://status.supabase.com

# 3. Increase timeout in config
# Edit core/config.py (or add to .env)
DATABASE_TIMEOUT=30

# 4. Check if database is reachable
psql postgresql://postgres:password@db.htssqiupscyhhueqwpgu.supabase.co:5432/postgres -c "SELECT 1"

# 5. Check Supabase Dashboard for maintenance notices
```

---

## 📱 WhatsApp/Evolution API Issues

### Problem: Webhook not receiving messages

**Symptom:**
No messages arriving at `/webhook/barberzap-saas` even when WhatsApp messages are sent.

**Root Cause:**
Evolution API webhook not configured or pointing to wrong URL.

**Solution:**
```bash
# 1. Check webhook configuration
curl -X GET https://your-evolution-api.com/webhook/find/barbearia_001 \
  -H "apikey: your_api_key"

# 2. Verify URL is correct
# should be: https://your-domain.com/webhook/barberzap-saas

# 3. Reconfigure webhook
curl -X POST https://your-evolution-api.com/webhook/set/barbearia_001 \
  -H "Content-Type: application/json" \
  -H "apikey: your_api_key" \
  -d '{
    "url": "https://your-domain.com/webhook/barberzap-saas",
    "webhook_by_events": true,
    "events": ["MESSAGES_UPSERT"],
    "base64": false
  }'

# 4. Test locally with ngrok
ngrok http 8000
# Copy the URL (e.g., https://abc123.ngrok.io)
# Configure webhook: https://abc123.ngrok.io/webhook/barberzap-saas

# 5. Check server logs
tail -f logs/barberzap_$(date +%Y%m%d).log | grep webhook
```

---

### Problem: Evolution API instance disconnected

**Error:**
```
Evolution API state: close
Connection status: disconnected
WhatsApp QR Code expired
```

**Root Cause:**
WhatsApp session expired, or instance was disconnected.

**Solution:**
```bash
# 1. Check instance status
curl -X GET https://your-evolution-api.com/instance/connectionState/barbearia_001 \
  -H "apikey: your_api_key"

# 2. Generate new QR Code if needed
curl -X GET https://your-evolution-api.com/instance/connect/barbearia_001 \
  -H "apikey: your_api_key"

# 3. Scan QR Code within 5 minutes
# Open WhatsApp → Devices → Link a Device

# 4. Verify connected
curl -X GET https://your-evolution-api.com/instance/connectionState/barbearia_001 \
  -H "apikey: your_api_key"
# Should return: {"instance": "barbearia_001", "state": "open"}

# 5. Restart BarberZap if needed
sudo systemctl restart barberzap
```

---

### Problem: Message not sent

**Error:**
```
Evolution API send failed: 401 Unauthorized
Error sending message: Instance not found
```

**Root Cause:**
API Key invalid or Instance name incorrect.

**Solution:**
```bash
# 1. Verify API Key
grep EVOLUTION_API_KEY .env

# 2. Test API Key
curl -X POST https://your-evolution-api.com/message/sendText/barbearia_001 \
  -H "Content-Type: application/json" \
  -H "apikey: your_api_key" \
  -d '{
    "number": "5511999999999",
    "textMessage": {"text": "Teste"}
  }'

# 3. Verify instance name
grep EVOLUTION_API_INSTANCE .env

# 4. Check if instance exists
curl -X GET https://your-evolution-api.com/instance/fetchInstances \
  -H "apikey: your_api_key"

# 5. Search for instance
curl -X GET https://your-evolution-api.com/instance/fetchInstances \
  -H "apikey: your_api_key" | grep barbearia_001

# 6. Create instance if missing
curl -X POST https://your-evolution-api.com/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: your_api_key" \
  -d '{
    "instanceName": "barbearia_001",
    "qrcode": true
  }'
```

---

### Problem: Evolution API returns timeout

**Error:**
```
Timeout waiting for Evolution API response
ReadTimeout: Connection to evolution.api.com timed out
```

**Root Cause:**
Evolution API server slow or network issue.

**Solution:**
```bash
# 1. Check Evolution API status
curl -I https://your-evolution-api.com

# 2. Increase timeout in .env
WEBHOOK_TIMEOUT=60  # from default 30

# 3. Retry logic (implemented in webhook_handler)
# Check logs for retry attempts
grep "retrying attempt" logs/barberzap_*.log

# 4. Check Evolution API server resources
# If self-hosted, check CPU/RAM
htop

# 5. Consider switching to hosted Evolution API
# Or deploy on better infrastructure
```

---

## 🤖 AI Response Issues

### Problem: AI not generating responses

**Error:**
```
AI generation failed: Invalid API key
Error 401: Unauthorized
```

**Root Cause:**
AI API Key invalid or expired.

**Solution:**
```bash
# 1. Verify API Key
grep AI_API_KEY .env

# 2. Check OpenRouter dashboard
# https://openrouter.ai/keys

# 3. Generate new key if needed
# Dashboard → Keys → Create

# 4. Update .env
nano .env
# AI_API_KEY=sk-or-v1-new-key-here

# 5. Test with script
python scripts/demo_secretaria_universal.py

# 6. Restart application
python main.py
```

---

### Problem: AI response too slow

**Symptom:**
AI responses take >10 seconds.

**Root Cause:**
Model too heavy OR network latency.

**Solution:**
```bash
# 1. Check model in use
grep AI_MODEL .env

# 2. Switch to faster model
# gpt-4o is faster than gpt-4
# gpt-4o-mini is fastest
AI_MODEL=openai/gpt-4o-mini

# 3. Reduce max_tokens
AI_MAX_TOKENS=500  # from 1000

# 4. Lower temperature for faster sampling
AI_TEMPERATURE=0.5  # from 0.7

# 5. Add monitoring of latency
# Check logs for processing_time_ms
grep "processing_time_ms" logs/barberzap_*.log

# 6. Cache responses if possible
# (not implemented yet, but consider)
```

---

### Problem: AI responses not contextual

**Symptom:**
AI doesn't use barbershop information in responses.

**Root Cause:**
Context not being built or passed correctly.

**Solution:**
```bash
# 1. Test context builder
python scripts/demo_context_builder.py

# 2. Check tenant_id is resolved correctly
# Look for: tenant_id in webhook logs
grep "tenant_id" logs/barberzap_*.log

# 3. Verify barbershop data exists
python -c "
from supabase import create_client
import os
client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
response = client.table('barbearias').select('*').eq('tenant_id', '123').execute()
print(response.data)
"

# 4. Check context in logs
grep "context" logs/barberzap_*.log

# 5. Manually test AI with context
python scripts/demo_secretaria_universal.py
```

---

### Problem: AI response截断 (truncated)

**Symptom:**
Response mid-sentence and cuts off.

**Root Cause:**
`AI_MAX_TOKENS` too low.

**Solution:**
```bash
# 1. Increase max tokens
AI_MAX_TOKENS=2000  # or 3000

# 2. Reduce prompt size
# Keep system prompt concise

# 3. Use streaming (not implemented, but future)

# 4. Check logs for truncated messages
grep "\.\.\.$" logs/barberzap_*.log
```

---

## 🔗 Webhook Issues

### Problem: Webhook returns 500 error

**Error:**
```
500 Internal Server Error on /webhook/barberzap-saas
Error: 'NoneType' object has no attribute 'get'
```

**Root Cause:**
Payload invalid or missing fields.

**Solution:**
```bash
# 1. Check webhook logs
tail -f logs/barberzap_*.log

# 2. Validate payload structure
curl -X POST http://localhost:8000/webhook/barberzap-saas \
  -H "Content-Type: application/json" \
  -d @test_payload.json

# 3. Use debug logging
# In .env:
LOG_LEVEL=DEBUG

# 4. Check Normalizer steps
grep "Normalized webhook" logs/barberzap*.log

# 5. Common issues:
# - Missing "instance" object
# - Missing "data" array
# - Invalid phone format

# Example valid payload:
{
  "event": "messages.upsert",
  "instance": {
    "instanceName": "barbearia_001"
  },
  "data": [{
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Test message"
    },
    "pushName": "Test User"
  }]
}
```

---

### Problem: Webhook processing stuck

**Symptom:**
Webhook receives request but no response / timeout.

**Root Cause:**
Loop error, infinite wait, or blocking operation.

**Solution:**
```bash
# 1. Increase webhook timeout
WEBHOOK_TIMEOUT=60

# 2. Check for loops
grep "retrying" logs/barberzap*.log

# 3. Check for blocking calls
# - AI taking too long
# - Database slow
# - Evolution API unresponsive

# 4. Add timeout to AI calls
# Already implemented, verify:
grep "timeout" integrations/ai_service.py

# 5. Check system resources
htop

# 6. Restart service if stuck
sudo systemctl restart barberzap
```

---

### Problem: Duplicate responses

**Symptom:**
Same message sent multiple times.

**Root Cause:**
Evolution API sending same webhook multiple times (at-least-once delivery).

**Solution:**
```bash
# 1. Check webhook logs duplicate
grep "remoteJid.*5511999999999" logs/barberzap*.log | wc -l

# 2. Implement idempotency
# Check if message was already sent
# (not yet implemented, but needed)

# 3. Evolution API should use messageId
# Verify it's unique:
grep "message_id" logs/barberzap*.log

# 4. Quick fix: Check CRM for duplicate
# If message exists in CRM (same content, same minute), don't send
```

---

## ⚡ Performance Issues

### Problem: High memory usage

**Symptom:**
Memory grows over time, eventually OOM.

**Root Cause:**
Memory leak, objects not being garbage collected.

**Solution:**
```bash
# 1. Check memory usage
ps aux | grep python
# or
htop

# 2. Check for growing lists/sets
# - Chat history not being cleared
# - Message cache not being cleaned

# 3. Restart service periodically (cron job)
0 2 * * * systemctl restart barberzap  # At 2 AM daily

# 4. Implement rate limiting
# Limit chat history to last 40 messages
grep "limit=40" integrations/postgres_memory.py

# 5. Use memory monitoring
pip install psutil
# Add to main.py for monitoring
```

---

### Problem: Slow webhook response

**Symptom:**
Response time >3 seconds.

**Root Cause:**
One of the pipeline steps is slow.

**Solution:**
```bash
# 1. Check individual step times
grep "Step [0-9]" logs/barberzap*.log

# 2. Identify slowest step
# Normalizer, Tenant Resolution, Context, AI, CRM, Send

# 3. Optimize slow steps
# - AI: Switch model, reduce tokens
# - DB: Add indexes
# - Evolution: Check API latency

# 4. Add caching
# Cache tenant resolution
# Cache barbershop context (TTL: 1 hour)

# 5. Parallelize if possible
# Send AI and CRM logs concurrently
```

---

### Problem: High CPU usage

**Symptom:**
CPU >80% continuously.

**Root Cause:**
Too many workers, or infinite loop.

**Solution:**
```bash
# 1. Check CPU usage
top

# 2. Reduce workers
# In systemd or .env:
UVICORN_WORKERS=2  # from 4

# 3. Check for busy loops
grep while main.py

# 4. Profile the code
pip install cProfile
python -m cProfile -o profile.prof main.py

# 5. Review AI usage
# If AI being called unnecessarily
```

---

## 🏭 Production Issues

### Problem: Service not starting after reboot

**Symptom:**
Webhook not working after server reboot.

**Root Cause:**
Service not enabled, or failing to start.

**Solution:**
```bash
# 1. Check service status
sudo systemctl status barberzap

# 2. Enable service
sudo systemctl enable barberzap

# 3. Check startup failures
sudo journalctl -u barberzap --since today --boot -p err

# 4. Check dependencies
# - PostgreSQL (Supabase - external, OK)
# - Redis (if using)
# - Network (must be up)

# 5. Add dependency on network
# In barberzap.service:
After=network-online.target
Wants=network-online.target

# 6. Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart barberzap
```

---

### Problem: SSL/TLS Certificate expired

**Symptom:**
Browser/Curl shows certificate error.

**Root Cause:**
Let's Encrypt certificate not renewed.

**Solution:**
```bash
# 1. Check certificate
sudo certbot certificates

# 2. Manually renew
sudo certbot renew

# 3. Check cron job for auto-renewal
sudo systemctl status certbot.timer

# 4. Verify auto-renewal is configured
cat /etc/letsencrypt/renewal/seu-dominio.com.conf

# 5. Test renewal
sudo certbot renew --dry-run
```

---

### Problem: Nginx 502 Bad Gateway

**Error:**
```
502 Bad Gateway
nginx/1.18.0
```

**Root Cause:**
BarberZap service not running or wrong upstream.

**Solution:**
```bash
# 1. Check BarberZap is running
sudo systemctl status barberzap

# 2. If down, start
sudo systemctl start barberzap

# 3. Check Nginx upstream
sudo cat /etc/nginx/sites-available/barberzap
# Should be: proxy_pass http://barberzap_backend;

# 4. Check Nginx logs
tail -f /var/log/nginx/barberzap_error.log

# 5. Reload Nginx
sudo systemctl reload nginx
```

---

## 🛠️ Debugging Tools

### Enable Debug Logging

```bash
# In .env
LOG_LEVEL=DEBUG
LOG_FORMAT=json

# Restart
sudo systemctl restart barberzap

# View logs
journalctl -u barberzap -f
```

### Test Components Separately

```bash
# Test tenant resolution
python scripts/check_agente_config.py

# Test context builder
python scripts/demo_context_builder.py

# Test AI
python scripts/demo_secretaria_universal.py

# Test DB connection
python scripts/check_db.py
```

### Monitor with htop

```bash
sudo apt install htop
htop
```

### Check Port Usage

```bash
lsof -i :8000
# or
netstat -tlnp | grep 8000
```

### Trace Requests

```bash
# Add middleware to main.py
@app.middleware("http")
async def log_requests(request, call_next):
    print(f"→ {request.method} {request.url}")
    response = await call_next(request)
    print(f"← {response.status_code}")
    return response
```

---

## 📞 When to Contact Support

Contact support if:

1. ❌ **Unresolved after 1 hour** - Critical production issue
2. 🐛 **Bug in code** - Clear reproduction steps
3. 📝 **Documentation unclear** - Need clarification
4. 🔐 **Security concern** - Potential vulnerability
5. 💡 **Feature request** - Enhancement idea

Before contacting:

1. ✅ Check this guide
2. ✅ Check logs
3. ✅ Search existing issues
4. ✅ Gather error details (full traceback)
5. ✅ Specify environment and versions

---

## ✅ Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Module not found | `source venv/bin/activate && pip install -r requirements.txt` |
| Port in use | `lsof -i :8000; kill -9 <PID>` |
| Env variable missing | `cp .env.example .env; nano .env` |
| Supabase failed | Verify `SUPABASE_SERVICE_ROLE_KEY` in .env |
| Tenant not found | Insert tenant in Supabase `tenants` table |
| WhatsApp not connected | Re-scan QR Code at Evolution API |
| Webhook not receiving | Re-configure webhook URL in Evolution API |
| AI not responding | Verify `AI_API_KEY` in .env |
| 502 error | `sudo systemctl start barberzap` |
| Certificate expired | `sudo certbot renew` |

---

**Troubleshooting Guide v1.0.0** | Última atualização: 2026-02-23
