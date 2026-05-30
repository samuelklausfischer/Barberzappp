# Integração Supabase-GitHub para Deploy Automatizado

## Visão Geral

Sistema completo de integração entre Supabase e GitHub que permite deploy automatizado de repositórios backend com suporte para múltiplos frameworks (Python, Node.js, Go, Rust), autenticação OAuth, monitoramento em tempo real e reversão automática.

## Arquitetura do Sistema

### Componentes Principais

1. **Backend API** (`supabase_github_integration.py`)
   - FastAPI com endpoints de autenticação e deploy
   - Integração OAuth com GitHub
   - Gerenciamento de deployments
   - Webhook processing
   - Encriptação de tokens sensíveis

2. **Banco de Dados** (`supabase_github_schema.sql`)
   - Tabelas para usuários, deployments, builds e logs
   - Views analíticas para monitoramento
   - Triggers para atualização automática

3. **Pipeline CI/CD** (`github_actions_workflow.yml`)
   - Detecção automática de framework
   - Build e push de containers Docker
   - Deploy para Supabase Functions
   - Notificações e monitoramento

## Configuração Inicial

### 1. Configurar Aplicação GitHub

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Crie uma nova OAuth App:
   - **Application name**: Supabase Deploy Integration
   - **Homepage URL**: `https://seu-dominio.com`
   - **Authorization callback URL**: `https://api.seu-dominio.com/auth/github/callback`
3. Copie o **Client ID** e **Client Secret**

### 2. Configurar Supabase

1. Crie um novo projeto no Supabase
2. Execute o schema SQL:
   ```bash
   psql -h seu-projeto.supabase.co -U postgres -d postgres -f supabase_github_schema.sql
   ```
3. Configure RLS (Row Level Security) conforme necessário

### 3. Variáveis de Ambiente

Configure as seguintes variáveis no seu `.env`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=seu-client-id
GITHUB_CLIENT_SECRET=seu-client-secret

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE=sua-service-role-key

# Segurança
JWT_SECRET=seu-jwt-secret-minimo-32-caracteres
ENCRYPTION_KEY=sua-chave-de-criptografia-32-bytes
WEBHOOK_SECRET=seu-webhook-secret

# URLs
FRONTEND_URL=https://seu-dominio.com
API_BASE_URL=https://api.seu-dominio.com
```

### 4. Configurar GitHub Actions

1. No seu repositório, vá para Settings > Secrets and variables > Actions
2. Adicione os secrets necessários:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_ID`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
   - `WEBHOOK_SECRET`

## Fluxo de Autenticação OAuth

```
1. Usuário clica em "Conectar GitHub"
2. Redirecionado para GitHub OAuth
3. Autoriza a aplicação
4. Retorna com código de autorização
5. Backend troca código por token
6. Token é criptografado e armazenado
7. JWT é gerado para sessão do usuário
```

## Endpoints da API

### Autenticação
- `GET /auth/github` - Inicia fluxo OAuth
- `POST /auth/github/callback` - Callback do OAuth

### Repositórios
- `GET /github/repos` - Lista repositórios do usuário

### Deploy
- `POST /deploy` - Cria novo deployment
- `GET /deployments` - Lista deployments
- `GET /deployments/{id}` - Detalhes do deployment
- `POST /deployments/{id}/rollback` - Executa rollback

### Webhook
- `POST /webhook/github` - Recebe webhooks do GitHub

### Monitoramento
- `GET /health` - Health check do sistema

## Deploy de Diferentes Frameworks

### Python (FastAPI)
```python
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
supabase==2.0.0
pydantic==2.4.2

# main.py
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}
```

### Node.js (Express)
```javascript
// package.json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "scripts": {
    "start": "node server.js"
  }
}

// server.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(3000);
```

### Go (Gin)
```go
// go.mod
module myapp

go 1.21

require github.com/gin-gonic/gin v1.9.1

// main.go
package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()
    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Hello World"})
    })
    r.Run(":8080")
}
```

### Rust (Actix-web)
```toml
# Cargo.toml
[dependencies]
actix-web = "4.4"
tokio = { version = "1.0", features = ["full"] }

// src/main.rs
use actix_web::{web, App, HttpServer, Responder};

async fn index() -> impl Responder {
    "Hello World!"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new().service(web::resource("/").to(index))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

## Monitoramento e Logs

### Logs de Deployment
Os logs são armazenados na tabela `deployment_logs` e podem ser acessados via:
```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
     https://api.seu-dominio.com/deployments/{deployment_id}
```

### Métricas de Performance
```sql
-- Tempo médio de build por framework
SELECT framework, AVG(duration_seconds) as avg_build_time
FROM builds
WHERE status = 'success'
GROUP BY framework;

-- Taxa de sucesso por framework
SELECT framework, 
       COUNT(*) as total,
       COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
       ROUND(COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM builds
JOIN deployments ON builds.deployment_id = deployments.deployment_id
GROUP BY framework;
```

### Health Check
```bash
curl https://api.seu-dominio.com/health
```

## Segurança

### Criptografia de Tokens
- Tokens do GitHub são criptografados usando Fernet (AES 128)
- Chave de criptografia deve ter 32 bytes
- Tokens nunca são armazenados em texto plano

### Validação de Webhooks
- Assinatura HMAC-SHA256 é verificada
- Secret compartilhado entre GitHub e API
- Rejeita payloads com assinatura inválida

### JWT Authentication
- Tokens expiram em 30 dias
- Contêm ID do usuário e token criptografado
- Validados em cada requisição autenticada

## Troubleshooting

### Problemas Comuns

1. **"Invalid client credentials"**
   - Verifique se GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET estão corretos
   - Confirme que as URLs de callback correspondem

2. **"Webhook signature invalid"**
   - Verifique se WEBHOOK_SECRET está configurado
   - Confirme que o secret no GitHub corresponde

3. **"Deployment failed"**
   - Verifique logs no endpoint `/deployments/{id}`
   - Confirme que o framework foi detectado corretamente
   - Verifique variáveis de ambiente necessárias

4. **"Database connection error"**
   - Verifique SUPABASE_URL e SUPABASE_KEY
   - Confirme que o schema foi aplicado
   - Verifique permissões do service role key

### Logs e Debugging

Ativar debug mode:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Verificar webhooks recebidos:
```sql
SELECT * FROM webhook_events 
WHERE processed = FALSE 
ORDER BY created_at DESC 
LIMIT 10;
```

## Melhores Práticas

### 1. Segurança
- Use HTTPS em produção
- Mantenha secrets seguros e rotacione regularmente
- Implemente rate limiting
- Valide todos os inputs

### 2. Performance
- Use índices apropriados no banco de dados
- Implemente cache para dados frequentes
- Use CDN para assets estáticos
- Monitore métricas de performance

### 3. Manutenção
- Mantenha dependências atualizadas
- Configure alertas para falhas
- Faça backup regular do banco
- Documente mudanças no schema

### 4. Escalabilidade
- Use connection pooling
- Implemente filas para processamento assíncrono
- Configure auto-scaling se necessário
- Monitore uso de recursos

## Suporte e Contribuição

Para reportar bugs ou solicitar features:
1. Verifique os logs de deployment
2. Teste o health check endpoint
3. Confirme configurações de ambiente
4. Documente o problema com exemplos

## Exemplo de Uso Completo

```javascript
// Frontend - Conectar GitHub
async function connectGitHub() {
  window.location.href = 'https://api.seu-dominio.com/auth/github';
}

// Criar deployment
async function createDeployment(repo, framework) {
  const response = await fetch('https://api.seu-dominio.com/deploy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      repository: repo,
      framework: framework,
      branch: 'main',
      environment_variables: {
        'NODE_ENV': 'production',
        'API_KEY': 'sua-api-key'
      }
    })
  });
  
  const data = await response.json();
  console.log('Deployment criado:', data.deployment_id);
}

// Monitorar deployment
async function monitorDeployment(deploymentId) {
  const response = await fetch(`https://api.seu-dominio.com/deployments/${deploymentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log('Status:', data.deployment.status);
  console.log('Logs:', data.logs);
}
```

Este sistema fornece uma solução completa e segura para deploy automatizado de aplicações backend com integração total entre Supabase e GitHub.