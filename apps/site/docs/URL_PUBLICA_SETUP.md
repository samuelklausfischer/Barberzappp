# BarberZap - URL Pública Configuração Manual

## Status: Frontend Vite rodando no IP da VPS

### IP Público da VPS
```
147.93.66.117
```

### Porta Vite
```
5173
```

---

## MÉTODO 1: EasyPanel Proxy (Recomendado)

### No Interface EasyPanel (http://SUA-IP-EASYPANEL:3000)

1. Logar no EasyPanel
2. Crio → **Create New App**
3. **App Type:** Nginx Proxy
4. **Name:** barberzap-frontend
5. **Proxy To:** `http://localhost:5173`
6. **Domain:** Seu domínio (ex: demo.barberzap.com)
7. **SSL:** EasyPanel gera certificado automático via Let's Encrypt

### URL Resultante
```
https://demo.barberzap.com/admin/dashboard
https://demo.barberzap.com/ (redirecionar para dashboard)
```

---

## MÉTODO 2: Nginx Manual na VPS

### Configurar Nginx

```bash
# Editar Nginx config
sudo nano /etc/nginx/sites-available/barberzap

# Criar proxy pass
server {
    listen 80;
    server_name demo.barberzap.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Habilitar site
sudo ln -s /etc/nginx/sites-available/barberzap /etc/nginx/sites-enabled/
sudo nginx -t  # Testar config
sudo systemctl restart nginx
```

### Generate SSL (Certbot)

```bash
sudo certbot --nginx -d demo.barberzap.com
```

### URL Resultante
```
https://demo.barberzap.com/
```

---

## MÉTODO 3: CloudFlare Proxy DNS (Simplest)

### 1. Adicionar domínio no CloudFlare

- Acessar https://dash.cloudflare.com
- Adicionar domínio (ex: demo.barberzap.com)
- Configurar DNS:

```
Type: A
Name: demo (ou www)
IP: 147.93.66.117
Proxy Status: Proxied (Cloud orange)
TTL: Auto
```

### 2. Gerar certificado SSL

- CloudFlare gera Automatic
- Full (strict) mode

### 3. Acessar URL

```
https://demo.barberzap.com/
```

---

## TEMPORÁRIO - Já disponível agora

### IP Direto VPS (HTTP only)
```
http://147.93.66.117:5173/
```

### IP na porta 80 (via proxy Nginx quick setup)

```bash
# Criar proxy quick
sudo nginx -s reload && sudo cp barberzap.conf /etc/nginx/sites-available/
```

URL: `http://147.93.66.117/admin/dashboard`

---

## RECOMENDAÇÃO: Para testar AGORA

Se você não quer configurar domínio, use:

```
http://147.93.66.117:5173/
```

Se você quer HTTPS estável, configure EasyPanel com seu domínio real.

---

[END]
