# BarberZap - Deployment Guide

Guia completo de deploy em produção para o BarberZap Python.

## 🎯 Visão Geral

Este guia cobre 3 métodos de deploy:
1. **Systemd Service** (Linux - Recomendado para servidores dedicados)
2. **Docker** (Multi-plataforma - Recomendado para containers)
3. **Reverse Proxy** (Nginx/Apache - Para HTTPS e domínios)

---

## 🔧 Deploy via Systemd Service (Recomendado)

### Pré-requisitos

- Ubuntu 20.04+ ou Debian 11+
- Python 3.12+ instalado
- Usuário com sudo
- Setup do BarberZap já completado (veja [SETUP.md](./SETUP.md))

### Passo 1: Preparar servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python 3.12 e ferramentas
sudo apt install -y python3.12 python3.12-venv python3-pip git

# Criar usuário para o serviço (opcional, mas recomendado)
sudo useradd -m -s /bin/bash barberzap

# Criar diretório de aplicação
sudo mkdir -p /opt/barberzap
sudo chown barberzap:barberzap /opt/barberzap
```

### Passo 2: Copiar arquivos para produção

```bash
# Acesse como usuário barberzap
sudo su - barberzap

# Copie os arquivos (ajuste o caminho de origem)
cp -r /root/Barberzap\ SITE/barberzap_python/* /opt/barberzap/

cd /opt/barberzap
```

### Passo 3: Configurar variáveis de ambiente

```bash
# Copiar e editar .env
cp .env.example .env.production
nano .env.production
```

**Configurações críticas de produção:**
```bash
# ====================
# PRODUCTION SETTINGS
# ====================
APP_ENV=production
APP_DEBUG=false
APP_HOST=127.0.0.1  # Apenas localhost (proxy reverso fará o expose)
APP_PORT=8000

# Aumentar workers para produção
# Recomendado: 2-4 workers por CPU core
UVICORN_WORKERS=4

# Logs mais restritos
LOG_LEVEL=WARNING
LOG_FORMAT=json

# CORS: Configure origins específicos
ALLOWED_ORIGINS=https://seu-dominio.com,https://app.seu-dominio.com
```

### Passo 4: Criar ambiente virtual

```bash
cd /opt/barberzap
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Passo 5: Criar diretórios necessários

```bash
mkdir -p logs
mkdir -p logs/archived
# Permissões de escrita
chmod 755 logs
```

### Passo 6: Criar arquivo de serviço systemd

```bash
sudo nano /etc/systemd/system/barberzap.service
```

**Conteúdo do arquivo:**
```ini
[Unit]
Description=BarberZap API Service
After=network.target
Wants=network.target

[Service]
Type=notify
User=barberzap
Group=barberzap
WorkingDirectory=/opt/barberzap
Environment="PATH=/opt/barberzap/venv/bin"
EnvironmentFile=/opt/barberzap/.env.production
ExecStart=/opt/barberzap/venv/bin/uvicorn main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 4 \
    --log-level warning \
    --access-log \
    --use-colors false

# Restart policy
Restart=always
RestartSec=10
StartLimitBurst=5
StartLimitIntervalSec=60

# Security
NoNewPrivileges=true
PrivateTmp=true

# Logging
StandardOutput=append:/opt/barberzap/logs/barberzap_systemd.log
StandardError=append:/opt/barberzap/logs/barberzap_systemd_error.log
SyslogIdentifier=barberzap

[Install]
WantedBy=multi-user.target
```

### Passo 7: Habilitar e iniciar serviço

```bash
# Recarregar configs do systemd
sudo systemctl daemon-reload

# Habilitar para iniciar no boot
sudo systemctl enable barberzap

# Iniciar serviço
sudo systemctl start barberzap

# Verificar status
sudo systemctl status barberzap
```

**Saída esperada:**
```
● barberzap.service - BarberZap API Service
     Loaded: loaded (/etc/systemd/system/barberzap.service; enabled; vendor preset: enabled)
     Active: active (running) since Mon 2026-02-23 17:00:00 UTC; 5s ago
   Main PID: 1234 (uvicorn)
      Tasks: 5 (limit: 1147)
     Memory: 120.5M
        CPU: 2.345s
     CGroup: /system.slice/barberzap.service
             ├─1234 /opt/barberzap/venv/bin/python3 /opt/barberzap/venv/bin/uvicorn main:app
```

### Passo 8: Verificar logs

```bash
# Logs recentes
sudo journalctl -u barberzap -f

# Logs system
tail -f /opt/barberzap/logs/barberzap_systemd.log

# Logs da aplicação
tail -f /opt/barberzap/logs/barberzap_$(date +%Y%m%d).log
```

### Passo 9: Testar endpoint

```bash
curl http://127.0.0.1:8000/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-23T17:00:00Z"
}
```

### Comandos úteis do systemd

```bash
# Status
sudo systemctl status barberzap

# Reiniciar
sudo systemctl restart barberzap

# Parar
sudo systemctl stop barberzap

# Desabilitar (não iniciar no boot)
sudo systemctl disable barberzap

# Ver logs dos últimos 100 linhas
sudo journalctl -u barberzap -n 100

# Ver logs desde o inicio do dia
sudo journalctl -u barberzap --since today
```

---

## 🐳 Deploy via Docker

### Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+

### Passo 1: Criar Dockerfile

```bash
nano Dockerfile
```

**Conteúdo:**
```dockerfile
# Multi-stage build for optimization
FROM python:3.12-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ==========================================
# Production stage
# ==========================================
FROM python:3.12-slim

# Set environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production \
    APP_DEBUG=false

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 barberzap && \
    mkdir -p /app/logs && \
    chown -R barberzap:barberzap /app

# Copy from builder
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --chown=barberzap:barberzap . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://127.0.0.1:8000/health', timeout=5)" || exit 1

# Run application with gunicorn (production WSGI server)
CMD ["gunicorn", "main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
```

### Passo 2: Criar docker-compose.yml

```bash
nano docker-compose.yml
```

**Conteúdo:**
```yaml
version: '3.8'

services:
  barberzap:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: barberzap_api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      # Variables from .env can be passed here
      - APP_ENV=production
      - APP_DEBUG=false
      - LOG_LEVEL=INFO
    env_file:
      - .env.production
    volumes:
      # Mount logs directory
      - ./logs:/app/logs
      # Mount uploads (if needed)
      - ./uploads:/app/uploads:ro
    networks:
      - barberzap_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  barberzap_network:
    driver: bridge
```

### Passo 3: Construir e executar

```bash
# Construir imagem
docker-compose build

# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f barberzap

# Testar health check
curl http://localhost:8000/health
```

### Passo 4: Comandos úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Reiniciar serviço
docker-compose restart barberzap

# Parar todos os serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Atualizar imagem
docker-compose build --no-cache barberzap
docker-compose up -d barberzap

# Executar comando dentro do container
docker-compose exec barberzap python -c "print('Test')"

# Ver logs de container específico
docker logs -f barberzap_api

# Acessar shell do container
docker-compose exec barberzap /bin/bash
```

---

## 🌐 Deploy com Reverse Proxy (Nginx)

### Pré-requisitos

- Nginx instalado e rodando
- BarberZap rodando (systemd ou docker)
- Domínio configurado apontando para o servidor

### Passo 1: Instalar Nginx

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Passo 2: Criar config do Nginx

```bash
sudo nano /etc/nginx/sites-available/barberzap
```

**Conteúdo:**
```nginx
# Upstream para BarberZap
upstream barberzap_backend {
    # Se rodando via systemd:
    server 127.0.0.1:8000 max_fails=3 fail_timeout=30s;

    # Se rodando via Docker (use container IP):
    # server barberzap_api:8000;

    # Para load balancing com múltiplos workers:
    # server 127.0.0.1:8000;
    # server 127.0.0.1:8001;
    # server 127.0.0.1:8002;
}

# Server block HTTP (redireciona para HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redireciona para HTTPS
    return 301 https://$server_name$request_uri;

    # Apenas para validação do Certbot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

# Server block HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # SSL certificates (serão gerados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/barberzap_access.log;
    error_log /var/log/nginx/barberzap_error.log;

    # Client body size limit (para uploads)
    client_max_body_size 10M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Location para API
    location / {
        proxy_pass http://barberzap_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (se necessário)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Buffering
        proxy_buffering off;
    }

    # Health check endpoint (sem auth)
    location /health {
        proxy_pass http://barberzap_backend/health;
        access_log off;
    }

    # Rate limiting para webhooks
    limit_req_zone $binary_remote_addr zone=webhook_limit:10m rate=10r/s;

    location /webhook/ {
        limit_req zone=webhook_limit burst=20 nodelay;
        proxy_pass http://barberzap_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### Passo 3: Habilitar site e testar config

```bash
# Criar symlink
sudo ln -s /etc/nginx/sites-available/barberzap /etc/nginx/sites-enabled/

# Remover default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar config
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Passo 4: Gerar certificado SSL (Let's Encrypt)

```bash
# Certbot configurará SSL automaticamente
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Seguir instruções:
# 1. Enter email para renewal notifications
# 2. Agree to terms
# 3. Choose 1 to redirect HTTP to HTTPS

# Verificar certificado
sudo certbot certificates
```

### Passo 5: Configurar autorenewal

```bash
# Certbot já configura autorenewal via systemd timer
sudo systemctl status certbot.timer

# Testar renewal
sudo certbot renew --dry-run
```

### Passo 6: Testar deploy

```bash
# Testar HTTP (deve redirecionar para HTTPS)
curl -I http://seu-dominio.com

# Testar HTTPS
curl -I https://seu-dominio.com

# Testar health check
curl https://seu-dominio.com/health

# Testar API
curl https://seu-dominio.com/
```

---

## 🔐 Configurações de Segurança em Produção

### 1. Firewall (UFW)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block port 8000 (application não deve ser exposta)
sudo ufw deny 8000/tcp

# Ver status
sudo ufw status
```

### 2. Rate Limiting

```bash
# Nginx já configurado no exemplo acima, mas pode ajustar:
# Editar /etc/nginx/nginx.conf

http {
    # Limitar conexões por IP
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    limit_conn conn_limit 10;

    # Limitar requisições
    limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
}
```

### 3. Monitoramento e Alertas

```bash
# Instalar htop para monitoramento
sudo apt install htop

# Ver uso de CPU/Memória
htop

# Ver uso de disco
df -h

# Ver uso de processos
ps aux | grep python
```

---

## 📊 Monitoramento em Produção

### 1. Logs Application

```bash
# Ver logs recentes
tail -f /opt/barberzap/logs/barberzap_$(date +%Y%m%d).log

# Ver logs de erro
grep ERROR /opt/barberzap/logs/barberzap_*.log

# Limpar logs antigos
find /opt/barberzap/logs/ -name "*.log" -mtime +30 -delete
```

### 2. Logs Nginx

```bash
# Acessos
tail -f /var/log/nginx/barberzap_access.log

# Erros
tail -f /var/log/nginx/barberzap_error.log

# Estatísticas de erro Nginx
awk '{print $9}' /var/log/nginx/barberzap_access.log | sort | uniq -c | sort -rn
```

### 3. Systemd logs

```bash
# Log do serviço
journalctl -u barberzap -f

# Log desde o início do dia
journalctl -u barberzap --since today

# Log com nível de erro
journalctl -u barberzap -p err
```

### 4. Health checks (cron job)

```bash
# Criar script de health check
sudo nano /usr/local/bin/barberzap_health.sh
```

**Conteúdo:**
```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health)

if [ $RESPONSE -ne 200 ]; then
    echo "[$(date)] BarberZap health check FAIL (HTTP $RESPONSE)" >> /var/log/barberzap_health.log
    # Opcional: reiniciar serviço
    # systemctl restart barberzap
else
    echo "[$(date)] BarberZap health OK" >> /var/log/barberzap_health.log
fi
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/barberzap_health.sh

# Adicionar ao crontab (a cada 5 minutos)
crontab -e
```

**Adicionar:**
```cron
*/5 * * * * /usr/local/bin/barberzap_health.sh
```

---

## 🔄 Atualizações em Produção

### Systemd

```bash
# 1. Pull de atualizações
cd /opt/barberzap
git pull

# 2. Atualizar dependências
source venv/bin/activate
pip install -r requirements.txt

# 3. Aplicar migrations se necessário
# python scripts/migrate.py

# 4. Reiniciar serviço
sudo systemctl restart barberzap

# 5. Verificar status
sudo systemctl status barberzap
```

### Docker

```bash
# 1. Pull de atualizações
git pull

# 2. Reconstruir e reiniciar
docker-compose build --no-cache barberzap
docker-compose up -d barberzap

# 3. Verificar
docker-compose ps
docker-compose logs -f barberzap
```

---

## ✅ Checklist de Produção

Antes de considerar o deploy completo:

- [ ] Aplicação rodando em modo produção (APP_ENV=production)
- [ ] Debug mode desativado (APP_DEBUG=false)
- [ ] HTTPS configurado e funcionando
- [ ] Firewall configurado
- [ ] Rate limiting configurado
- [ ] Logs configurados e rotativos
- [ ] Health checks configurados
- [ ] Backups do banco de dados agendados
- [ ] Monitoramento configurado
- [ ] Alertas de erro configurados
- [ ] Documentos de rotina de emergência criados

---

## 📞 Suporte

- 🐛 Problemas comuns: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 📋 Referência da API: [API_REFERENCE.md](./API_REFERENCE.md)
- 🔌 Integrações: [INTEGRATION.md](./INTEGRATION.md)

---

**Deployment Guide v1.0.0** | Última atualização: 2026-02-23
