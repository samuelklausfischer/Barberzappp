# 🚀 Preenchimento Rápido - EasyPanel (Modelo Repositório GitHub)

Siga exatamente estes valores para configurar o serviço no EasyPanel!

---

## 📝 Preencha Assim:

### Passo 1: Escolha o Tipo
```
Tipo de Serviço: GitHub (ou Repository)
```

### Passo 2: Informações do Repositório

Preencha EXATAMENTE assim:

```
┌─────────────────────────────────────────────┐
│ Proprietário*:                           │
│ samuelklausfischer                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Repositório*:                            │
│ Backend-dados-ADS                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Ramo*:                                  │
│ main                                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Caminho de Build*:                       │
│ /                                       │
└─────────────────────────────────────────────┘
```

### Passo 3: Configuração do Docker

```
Dockerfile: /Dockerfile
```

### Passo 4: Portas

```
Container Port: 8000
Host Port:     8000
Protocol:      HTTP
```

### Passo 5: Variáveis de Ambiente

Adicione CADA UMA destas variáveis separadamente:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
GITHUB_CLIENT_ID=seu_github_client_id_aqui
GITHUB_CLIENT_SECRET=seu_github_client_secret_aqui
JWT_SECRET_KEY=chave_gerada_aleatoriamente_min_32_chars
ENCRYPTION_KEY=chave_gerada_aleatoriamente_min_32_chars
WEBHOOK_SECRET=chave_gerada_aleatoriamente_hex
```

---

## 🔑 Como Gerar as Chaves

Execute estes comandos no seu terminal:

```bash
# Chave 1 - JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Chave 2 - ENCRYPTION_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Chave 3 - WEBHOOK_SECRET
python -c "import secrets; print(secrets.token_hex(32))"
```

**Copie cada resultado e cole na variável correspondente!**

---

## 📋 Onde Conseguir as Outras Informações

### Supabase

1. Acesse: https://supabase.com
2. Entre no seu projeto
3. Vá em: Settings → API
4. Copie:
   - **Project URL** → cole em `SUPABASE_URL`
   - **service_role key** → cole em `SUPABASE_SERVICE_ROLE_KEY`

### GitHub OAuth

1. Acesse: GitHub Settings → Developer Settings → OAuth Apps
2. Crie novo OAuth App
3. Configure:
   - **Application name**: `Backend Integration System`
   - **Homepage URL**: `http://seu-servidor-ip:8000`
   - **Authorization callback URL**: `http://seu-servidor-ip:8000/auth/github/callback`
4. Copie:
   - **Client ID** → cole em `GITHUB_CLIENT_ID`
   - **Client Secret** → cole em `GITHUB_CLIENT_SECRET`

### Executar Schema do Supabase

1. Acesse seu projeto Supabase
2. Vá em: SQL Editor
3. Clique em: "New Query"
4. Cole o conteúdo do arquivo: `supabase_github_schema.sql`
5. Clique em: "Run"

---

## ✅ Depois de Criar o Serviço

### 1. Verificar se Funcionou

No navegador, acesse:
```
http://seu-servidor-ip:8000/health
```

Deve mostrar:
```json
{
  "status": "healthy",
  "service": "Supabase-GitHub Integration",
  "version": "1.0.0"
}
```

### 2. Verificar Logs

No EasyPanel:
- Clique no serviço criado
- Vá em "Logs"
- Deve aparecer: `Application startup complete`

### 3. Acessar Documentação

No navegador, acesse:
```
http://seu-servidor-ip:8000/docs
```

### 4. Configurar Webhook no GitHub

1. Acesse: https://github.com/samuelklausfischer/Backend-dados-ADS
2. Vá em: Settings → Webhooks
3. Clique em: "Add webhook"
4. Preencha:
   - **Payload URL**: `http://seu-servidor-ip:8000/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: (use o WEBHOOK_SECRET que você gerou)
5. Marque:
   - ✅ Push
   - ✅ Pull request
   - ✅ Deployment status
6. Clique em: "Add webhook"

---

## 🎯 Resumo Visual

```
┌─────────────────────────────────────────────┐
│ 1. Acesse EasyPanel                     │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 2. Clique em "Create Service"            │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 3. Escolha "GitHub" ou "Repository"     │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 4. Preencha:                            │
│   Proprietário:   samuelklausfischer     │
│   Repositório:    Backend-dados-ADS      │
│   Ramo:          main                   │
│   Caminho Build: /                      │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 5. Configure Dockerfile: /Dockerfile      │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 6. Configure Portas: 8000 → 8000       │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 7. Adicione as 7 variáveis de ambiente  │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 8. Clique em "Create" e depois "Start"  │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 9. Teste: http://seu-ip:8000/health   │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 10. Configure webhook no GitHub           │
└─────────────────────────────────────────────┘
```

---

## ⚠️ Erros Comuns e Soluções

### Build Falha

**Erro**: `Dockerfile not found`
**Solução**: Verifique se o caminho está `/Dockerfile`

**Erro**: `Branch not found`
**Solução**: Confirme que está usando `main` (não `master`)

### Aplicação Não Inicia

**Erro**: `Environment variable not found`
**Solução**: Verifique se TODAS as 7 variáveis foram adicionadas

**Erro**: `Port already in use`
**Solução**: Mude a "Host Port" para 8001 ou outra porta livre

### Health Check Falha

**Erro**: `Connection refused`
**Solução**: Aguarde 30-60 segundos após iniciar e teste novamente

### Webhook Não Funciona

**Erro**: `We couldn't deliver this webhook`
**Solução**: Verifique URL e se a porta 8000 está aberta no firewall

---

## 🔧 Abrir Porta no Firewall

Se o health check não funcionar, abra a porta:

```bash
# Ubuntu/Debian
sudo ufw allow 8000
sudo ufw reload

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# Verificar
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-ports  # CentOS
```

---

## 📊 Checklist

- [ ] Proprietário: samuelklausfischer
- [ ] Repositório: Backend-dados-ADS
- [ ] Ramo: main
- [ ] Caminho Build: /
- [ ] Dockerfile: /Dockerfile
- [ ] Portas: 8000 → 8000
- [ ] SUPABASE_URL configurada
- [ ] SUPABASE_SERVICE_ROLE_KEY configurada
- [ ] GITHUB_CLIENT_ID configurada
- [ ] GITHUB_CLIENT_SECRET configurada
- [ ] JWT_SECRET_KEY gerada e configurada
- [ ] ENCRYPTION_KEY gerada e configurada
- [ ] WEBHOOK_SECRET gerada e configurada
- [ ] Schema SQL executado no Supabase
- [ ] OAuth App criado no GitHub
- [ ] Serviço criado no EasyPanel
- [ ] Serviço iniciado
- [ ] Health check funcionando
- [ ] Webhook configurado no GitHub

---

## 🎉 Pronto!

Após completar o checklist, seu sistema estará:
- ✅ Rodando no EasyPanel
- ✅ Conectado ao GitHub
- ✅ Integrado com Supabase
- ✅ Recebendo webhooks
- ✅ Pronto para deploy automático

Para testar, faça um commit no repositório e veja a mágica acontecer! 🚀