# Configuração EasyPanel - Modelo Repositório GitHub

Guia específico para configurar o sistema usando o modelo de Repositório GitHub no EasyPanel.

## 📋 Informações do Repositório

Preencha o formulário do EasyPanel com estas informações:

### 🎯 Campos do Formulário

```
┌─────────────────────────────────────────────┐
│ Proprietário*                             │
│ samuelklausfischer                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Repositório*                              │
│ Backend-dados-ADS                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Ramo*                                    │
│ main                                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Caminho de Build*                         │
│ /                                         │
└─────────────────────────────────────────────┘
```

### 🔗 URL do Repositório Completa

```
https://github.com/samuelklausfischer/Backend-dados-ADS.git
```

---

## 🚀 Passo a Passo Completo

### 1. Acessar o EasyPanel

1. Acesse: `http://seu-servidor-ip:3000`
2. Faça login
3. Clique em "Create Service" ou "+" no seu projeto

### 2. Selecionar Tipo de Serviço

Escolha: **"GitHub"** ou **"Repository"**

### 3. Preencher Informações do Repositório

```
Proprietário:     samuelklausfischer
Repositório:      Backend-dados-ADS
Ramo:            main
Caminho Build:   /
```

### 4. Configurar Build

#### Se o EasyPanel pedir Dockerfile:

```
Dockerfile Path: /Dockerfile
```

#### Se o EasyPanel pedir comando de build:

```
Command: docker build -t app .
```

### 5. Configurar Portas

```
Container Port: 8000
Host Port:     8000
Protocol:      HTTP
```

### 6. Configurar Variáveis de Ambiente

Adicione estas variáveis no EasyPanel:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GITHUB_CLIENT_ID=Iv1li3b4c5d6e7f8g9h0
GITHUB_CLIENT_SECRET=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET_KEY=sua_chave_jwt_min_32_caracteres_aleatoria
ENCRYPTION_KEY=sua_chave_de_criptografia_aleatoria
WEBHOOK_SECRET=seu_webhook_secret_aleatorio
```

**Importante:** Cada variável deve ser adicionada separadamente!

### 7. Configurar Health Check (Opcional)

```
Test Command: curl -f http://localhost:8000/health
Interval:      30s
Timeout:       10s
Retries:       3
```

### 8. Configurar Domínio (Opcional)

Se quiser usar domínio personalizado:

```
Domain: integration.seu-dominio.com
SSL:    Ativar (Let's Encrypt)
```

### 9. Criar e Iniciar Serviço

Clique em:
- "Create" ou "Deploy"
- Aguarde o build
- Clique em "Start"

---

## 🔧 Configuração Adicional

### Gerar Chaves Seguras

Antes de configurar as variáveis, gere as chaves:

```bash
# Gerar JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Gerar ENCRYPTION_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Gerar WEBHOOK_SECRET
python -c "import secrets; print(secrets.token_hex(32))"
```

**Resultado esperado:**
```
JWT_SECRET_KEY:    abc123xyz456def789ghi012jkl345mno
ENCRYPTION_KEY:    pqr678stu901vwx234yzA567BCD890EFG
WEBHOOK_SECRET:     a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

### Configurar GitHub Webhook

Depois que o serviço estiver rodando:

1. Acesse o repositório: `https://github.com/samuelklausfischer/Backend-dados-ADS`
2. Vá para: Settings → Webhooks
3. Clique em: "Add webhook"

**Configure:**
```
Payload URL:    http://seu-servidor-ip:8000/webhook/github
Content type:  application/json
Secret:        (use o WEBHOOK_SECRET que você gerou)
```

**Selecione eventos:**
- ✅ Push
- ✅ Pull request
- ✅ Deployment status

4. Clique em "Add webhook"

### Configurar GitHub OAuth App

1. Acesse: GitHub Settings → Developer Settings → OAuth Apps
2. Crie novo OAuth App ou use existente
3. Configure:

```
Application name:        Backend Integration System
Homepage URL:           http://seu-servidor-ip:8000
Authorization callback: http://seu-servidor-ip:8000/auth/github/callback
```

4. Copie Client ID e Client Secret
5. Adicione às variáveis de ambiente no EasyPanel

---

## ✅ Verificação de Funcionamento

### 1. Verificar Logs

No EasyPanel:
- Clique no serviço
- Vá para "Logs"
- Deve mostrar: `Application startup complete`

### 2. Testar Health Check

Abra no navegador:
```
http://seu-servidor-ip:8000/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "service": "Supabase-GitHub Integration",
  "version": "1.0.0"
}
```

### 3. Testar API Documentation

Acesse:
```
http://seu-servidor-ip:8000/docs
```

Você deve ver a documentação interativa da API.

### 4. Testar Webhook

Faça um commit no repositório GitHub e verifique se:
- Webhook é enviado
- Logs mostram processamento
- Deployment é iniciado automaticamente

---

## 🔄 Como Atualizar o Serviço

### Atualização Automática

O EasyPanel pode ser configurado para atualizar automaticamente quando há push no GitHub:

1. No serviço, vá para "Update"
2. Configure:
   ```
   Auto Update:     Enabled
   Check Interval:  5 minutes
   ```

### Atualização Manual

1. No serviço, clique em "Update"
2. Clique em "Pull latest"
3. Clique em "Rebuild"
4. Clique em "Restart"

---

## 🐛 Troubleshooting

### Build Falha

**Causas comuns:**
- Branch não existe
- Dockerfile não encontrado
- Erro no Dockerfile

**Soluções:**
- Verifique se o branch "main" existe
- Confirme que Dockerfile está na raiz
- Cheque logs do build

### Aplicação Não Inicia

**Causas comuns:**
- Variáveis de ambiente faltando
- Porta já em uso
- Erro de configuração

**Soluções:**
- Verifique todas as variáveis de ambiente
- Mude a porta host se necessário
- Cheque logs de inicialização

### Webhook Não Funciona

**Causas comuns:**
- URL incorreta
- Secret não configurado
- Firewall bloqueando

**Soluções:**
- Verifique URL do webhook
- Confirme WEBHOOK_SECRET está correto
- Abra porta 8000 no firewall

### Erro de Conexão Supabase

**Causas comuns:**
- URL incorreta
- Key errada
- Schema não executado

**Soluções:**
- Verifique SUPABASE_URL
- Confirme SERVICE_ROLE_KEY
- Execute SQL schema novamente

---

## 📊 Monitoramento

### Verificar Logs em Tempo Real

No EasyPanel:
- Clique no serviço
- Vá para "Logs"
- Ative "Live Logs"

### Verificar Métricas

- CPU Usage
- Memory Usage
- Network I/O
- Disk Usage

### Verificar Status

O status deve mostrar:
- 🟢 Running (em execução)
- 🟡 Building (construindo)
- 🔴 Stopped (parado)
- ⚠️ Error (erro)

---

## 🔒 Segurança

### Configurar Firewall

```bash
# Permitir porta 8000
sudo ufw allow 8000

# Verificar status
sudo ufw status
```

### Usar HTTPS (Recomendado)

1. Configure domínio no EasyPanel
2. Ative SSL com Let's Encrypt
3. Atualize URLs no GitHub:
   - OAuth callback URL
   - Webhook URL

### Proteger Variáveis de Ambiente

- Nunca commitar .env
- Usar chaves diferentes para cada ambiente
- Rotacionar chaves periodicamente

---

## 🌐 Configuração de Domínio

### Adicionar Domínio

1. No EasyPanel, clique no serviço
2. Vá para "Domains"
3. Clique em "Add Domain"

```
Domain:   integration.seu-dominio.com
Protocol: HTTPS
SSL:      Ativar (Let's Encrypt)
```

### Atualizar GitHub Callback URL

```
https://integration.seu-dominio.com/auth/github/callback
```

### Atualizar Webhook URL

```
https://integration.seu-dominio.com/webhook/github
```

---

## 📝 Resumo de Configuração

| Campo | Valor |
|-------|-------|
| Proprietário | samuelklausfischer |
| Repositório | Backend-dados-ADS |
| Ramo | main |
| Caminho Build | / |
| Container Port | 8000 |
| Host Port | 8000 |
| Protocol | HTTP |

### Variáveis de Ambiente Obrigatórias

| Variável | Descrição |
|----------|-----------|
| SUPABASE_URL | URL do projeto Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Chave service role |
| GITHUB_CLIENT_ID | Client ID OAuth |
| GITHUB_CLIENT_SECRET | Client Secret OAuth |
| JWT_SECRET_KEY | Chave JWT (32+ caracteres) |
| ENCRYPTION_KEY | Chave de criptografia |
| WEBHOOK_SECRET | Segredo do webhook |

---

## 🎯 Checklist de Configuração

- [ ] Repositório configurado no EasyPanel
- [ ] Branch correto (main)
- [ ] Dockerfile detectado
- [ ] Portas configuradas (8000)
- [ ] Variáveis de ambiente adicionadas
- [ ] Chaves seguras geradas
- [ ] Supabase configurado e schema executado
- [ ] GitHub OAuth App criado
- [ ] Webhook configurado no GitHub
- [ ] Health check funcionando
- [ ] API documentation acessível
- [ ] Domínio configurado (opcional)
- [ ] HTTPS ativado (recomendado)
- [ ] Firewall configurado
- [ ] Logs sendo monitorados

---

## 📚 Links Úteis

- Repositório GitHub: https://github.com/samuelklausfischer/Backend-dados-ADS
- Documentação API: http://seu-servidor-ip:8000/docs
- EasyPanel Docs: https://easypanel.io/docs
- Supabase Docs: https://supabase.com/docs

---

## 💡 Dicas

1. **Primeiro Deploy Local**: Teste localmente antes de fazer deploy
2. **Logs em Tempo Real**: Use live logs para debug
3. **Auto Update**: Configure auto update para facilitar
4. **Backup**: Configure backup automático do Supabase
5. **Monitoramento**: Configure alertas de erros
6. **HTTPS**: Sempre use HTTPS em produção
7. **Chaves Únicas**: Use chaves diferentes para cada serviço

---

## 🚀 Pronto para Usar!

Após completar todos os passos, seu sistema estará:
- ✅ Rodando no EasyPanel
- ✅ Conectado ao GitHub
- ✅ Integrado com Supabase
- ✅ Recebendo webhooks
- ✅ Fazendo deploy automático
- ✅ Monitorando em tempo real

Para testar, faça um commit no repositório e observe o deploy automático acontecer!