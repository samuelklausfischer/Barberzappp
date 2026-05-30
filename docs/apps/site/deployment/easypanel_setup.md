# Guia de Configuração - EasyPanel

Este guia explica como configurar e rodar o sistema de integração Supabase-GitHub usando o EasyPanel.

## 📋 Pré-requisitos

- EasyPanel instalado no seu servidor
- Acesso ao painel do EasyPanel
- Repositório GitHub configurado: `https://github.com/samuelklausfischer/Backend-dados-ADS`

## 🚀 Passo a Passo de Instalação

### 1. Acessar o EasyPanel

1. Acesse seu painel EasyPanel (geralmente em `http://seu-servidor-ip:3000`)
2. Faça login com suas credenciais
3. Clique em "Create Project" ou em um projeto existente

### 2. Criar Aplicação Docker

#### Opção A: Usando Dockerfile (Recomendado)

1. Clique em "Create Service"
2. Escolha "Dockerfile" como tipo de serviço
3. Configure:

**Configurações Básicas:**
```
Name: supabase-github-integration
Image: (deixe em branco, será construído)
Dockerfile: Dockerfile
Context: /
```

**Portas:**
```
Host Port: 8000
Container Port: 8000
Protocol: HTTP
```

**Variáveis de Ambiente:**
```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
GITHUB_CLIENT_ID=seu_github_client_id
GITHUB_CLIENT_SECRET=seu_github_client_secret
JWT_SECRET_KEY=sua_chave_jwt_min_32_caracteres
ENCRYPTION_KEY=sua_chave_de_criptografia
WEBHOOK_SECRET=seu_webhook_secret
```

#### Opção B: Usando docker-compose.yml

1. Clique em "Create Service"
2. Escolha "Compose" como tipo de serviço
3. Configure:

```
Name: supabase-github-integration
Compose File: docker-compose.yml
```

4. Adicione as mesmas variáveis de ambiente acima

### 3. Gerar Chaves Seguras

Para gerar as chaves necessárias, execute no seu terminal:

```bash
# Gerar JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Gerar ENCRYPTION_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Gerar WEBHOOK_SECRET
python -c "import secrets; print(secrets.token_hex(32))"
```

**Importante:** Use chaves diferentes para cada uma!

### 4. Configurar GitHub Webhook

1. Vá para o repositório `Backend-dados-ADS` no GitHub
2. Clique em Settings → Webhooks
3. Clique em "Add webhook"
4. Configure:

```
Payload URL: http://seu-servidor-ip:8000/webhook/github
Content type: application/json
Secret: (use o WEBHOOK_SECRET que você gerou)
```

5. Selecione os eventos:
   - ✅ Push
   - ✅ Pull request
   - ✅ Deployment status

6. Clique em "Add webhook"

### 5. Configurar GitHub OAuth Callback URL

1. Vá para seu OAuth App no GitHub
2. Atualize o "Authorization callback URL" para:
   ```
   http://seu-servidor-ip:8000/auth/github/callback
   ```

## 🔧 Verificação de Funcionamento

### 1. Verificar Status da Aplicação

No EasyPanel:
- A aplicação deve mostrar status "Running"
- Os logs devem mostrar: `Application startup complete`

### 2. Testar Health Check

Acesse no navegador:
```
http://seu-servidor-ip:8000/health
```

Deve retornar:
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

Você deve ver a documentação interativa da API (Swagger UI).

## 🌐 Configuração de Domínio (Opcional)

### 1. Adicionar Domínio

1. No EasyPanel, clique na aplicação
2. Vá para "Domains"
3. Clique em "Add Domain"
4. Configure:

```
Domain: integration.seu-dominio.com
SSL: Ativar (Let's Encrypt)
```

### 2. Atualizar GitHub Callback URL

Atualize o OAuth callback para usar o domínio:
```
https://integration.seu-dominio.com/auth/github/callback
```

### 3. Atualizar Webhook URL

Atualize o webhook no GitHub:
```
https://integration.seu-dominio.com/webhook/github
```

## 📊 Monitoramento

### 1. Verificar Logs

No EasyPanel:
- Clique na aplicação
- Vá para "Logs"
- Monitora erros ou avisos

### 2. Métricas de Recursos

Verifique uso de:
- CPU
- Memória
- Rede

## 🔒 Segurança

### 1. Firewall

Certifique-se de que a porta 8000 está aberta:

```bash
# Se estiver usando ufw
sudo ufw allow 8000

# Se estiver usando firewalld
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

### 2. HTTPS (Recomendado)

Para produção, sempre use HTTPS:
- Configure domínio no EasyPanel
- Ative SSL com Let's Encrypt
- Atualize todas as URLs no GitHub

## 🔄 Atualizações

### Atualizar para Nova Versão

1. No EasyPanel, clique na aplicação
2. Vá para "Update"
3. Clique em "Pull latest image" (se estiver usando imagem)
4. Ou clique em "Rebuild" (se estiver usando Dockerfile)
5. A aplicação será reiniciada automaticamente

## 🐛 Troubleshooting

### Aplicação não inicia

**Verifique:**
- Logs no EasyPanel
- Variáveis de ambiente estão corretas
- Porta 8000 não está em uso
- Dependências do Docker estão instaladas

### Webhook não funciona

**Verifique:**
- URL do webhook está correta
- Firewall permite conexões externas
- Webhook secret está configurado
- Logs mostram erros de webhook

### Erro de conexão com Supabase

**Verifique:**
- SUPABASE_URL está correta
- SUPABASE_SERVICE_ROLE_KEY está correta
- Projeto Supabase está ativo
- SQL schema foi executado

### Erro de autenticação GitHub

**Verifique:**
- GITHUB_CLIENT_ID está correto
- GITHUB_CLIENT_SECRET está correto
- Callback URL está configurada
- OAuth App está ativo

## 📝 Resumo de Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| SUPABASE_URL | URL do projeto Supabase | Sim |
| SUPABASE_SERVICE_ROLE_KEY | Chave service role do Supabase | Sim |
| GITHUB_CLIENT_ID | Client ID do OAuth App | Sim |
| GITHUB_CLIENT_SECRET | Client Secret do OAuth App | Sim |
| JWT_SECRET_KEY | Chave para JWT (mínimo 32 caracteres) | Sim |
| ENCRYPTION_KEY | Chave para criptografia | Sim |
| WEBHOOK_SECRET | Segredo para validação de webhook | Sim |

## 🎯 Próximos Passos

Após configurar o EasyPanel:

1. ✅ Teste o health check
2. ✅ Configure o webhook no GitHub
3. ✅ Teste o fluxo OAuth
4. ✅ Faça um commit de teste no repositório
5. ✅ Verifique se o deploy automático funciona

## 📚 Links Úteis

- Documentação EasyPanel: `https://easypanel.io/docs`
- Documentação Supabase: `https://supabase.com/docs`
- Documentação GitHub API: `https://docs.github.com/en/rest`

## 💡 Dicas

- Use domínios com HTTPS em produção
- Mantenha as chaves seguras e nunca as compartilhe
- Monitore os logs regularmente
- Configure backups automáticos do Supabase
- Teste em ambiente de desenvolvimento antes da produção