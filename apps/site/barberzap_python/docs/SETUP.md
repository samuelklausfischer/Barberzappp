# BarberZap - Setup Guide

Guia completo de instalação e configuração do BarberZap Python.

## 📋 Pré-requisitos

### Sistema Operacional
- ✅ Linux (Ubuntu 20.04+, Debian 11+)
- ✅ macOS (12+)
- ✅ Windows 10/11 (WSL2 recomendado)

### Software necessário

| Componente | Versão Mínima | Como Verificar |
|------------|---------------|----------------|
| Python | 3.12 | `python3.12 --version` |
| pip | 23.0+ | `pip --version` |
| git | 2.0+ | `git --version` |
| PostgreSQL | 14+ | `psql --version` *(opcional, usando Supabase)* |

### Serviços externos

1. **Supabase** (banco de dados)
   - URL: `https://htssqiupscyhhueqwpgu.supabase.co`
   - SERVICE_ROLE_KEY necessário

2. **Evolution API** (WhatsApp)
   - URL da instância
   - API Key
   - Instance name configurado

3. **AI Provider** (OpenRouter ou similar)
   - API Key
   - Modelo escolhido (ex: `openai/gpt-4o-mini`)

---

## 🚀 Instalação

### Passo 1: Obter o código

```bash
# Navegue ao diretório do projeto
cd /root/Barberzap\ SITE/barberzap_python/
```

### Passo 2: Criar ambiente virtual (recomendado)

#### Linux/macOS
```bash
python3.12 -m venv venv
source venv/bin/activate
```

#### Windows (WSL)
```bash
python3.12 -m venv venv
source venv/bin/activate
```

#### Windows (PowerShell)
```powershell
python3.12 -m venv venv
.\venv\Scripts\Activate.ps1
```

### Passo 3: Atualizar pip e instalar dependências

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Dependências instaladas:
```
fastapi==0.115.0              # Web framework
uvicorn[standard]==0.32.0     # ASGI server
pydantic==2.9.2               # Data validation
supabase==2.7.4               # Supabase client
psycopg2-binary==2.9.9        # PostgreSQL adapter
requests==2.32.3              # HTTP client
httpx==0.27.2                 # Async HTTP client
python-dotenv==1.0.1          # Environment variables
pytest==8.3.3                 # Testing framework
```

### Passo 4: Verificar instalação

```bash
python -c "import fastapi; print(f'FastAPI {fastapi.__version__} ok')"
python -c "import supabase; print(f'Supabase {supabase.__version__} ok')"
```

---

## 🔧 Configuração de Variáveis de Ambiente

### Passo 1: Criar arquivo .env

```bash
cp .env.example .env
```

### Passo 2: Editar o arquivo .env

Use seu editor favorito:

```bash
nano .env
# ou
vim .env
# ou
code .env
```

### Passo 3: Configurar cada seção

#### 3.1 CREDENCIAIS SUPABASE

```bash
# ====================
# SUPABASE CREDENTIALS
# ====================
SUPABASE_URL=https://htssqiupscyhhueqwpgu.supabase.co

# ⚠️ IMPORTANTE: Obtenha sua SERVICE_ROLE_KEY
# Caminho: Supabase Dashboard → Project Settings → API → service_role (secret)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL de conexão direta ao PostgreSQL (opcional)
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.htssqiupscyhhueqwpgu.supabase.co:5432/postgres
```

**Obtendo o SERVICE_ROLE_KEY:**
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto `htssqiupscyhhueqwpgu`
3. Vá em: Settings → API
4. Em "Project API keys", copie a `service_role` (secret)
5. Cole no `.env`

---

#### 3.2 EVOLUTION API (WhatsApp)

```bash
# ====================
# EVOLUTION API (WhatsApp)
# ====================

# URL da sua instância Evolution API
EVOLUTION_API_URL=https://your-evolution-api-instance.com

# API Key para autenticação
# Obtenha na interface do Evolution API: Configurações → API Keys
EVOLUTION_API_KEY=your_evolution_api_key_here

# Nome da instância configurada
EVOLUTION_API_INSTANCE=barberzap_instance
```

**Configurando Evolution API:**
1. Acesse sua instância Evolution API
2. Crie uma nova instância (ex: `barberzap_instance`)
3. Gere/Configure API Key
4. Escaneie o QR Code para conectar WhatsApp
5. Copie URL, API Key e Instance Name para o `.env`

---

#### 3.3 CONFIGURAÇÃO DA IA

```bash
# ====================
# AI CONFIGURATION
# ====================

# API Key do provedor de IA (OpenRouter recomendado)
# OpenRouter: https://openrouter.ai/keys
AI_API_KEY=sk-or-v1-...

# Modelo de IA a usar
AI_MODEL=openai/gpt-4o-mini

# Outras opções:
# AI_MODEL=openai/gpt-4o
# AI_MODEL=anthropic/claude-3-sonnet
# AI_MODEL=google/gemini-pro

# Configurações de geração
AI_MAX_TOKENS=1000        # Máximo de tokens na resposta
AI_TEMPERATURE=0.7        # Criatividade (0.0 = mais preciso, 1.0 = mais criativo)
```

**Obtendo API Key do OpenRouter:**
1. Acesse [OpenRouter](https://openrouter.ai/)
2. Crie账号/Login
3. Vá em: Account → Keys
4. Crie uma nova API Key
5. Copie para o `.env`

---

#### 3.4 CONFIGURAÇÕES DA APLICAÇÃO

```bash
# ====================
# APPLICATION SETTINGS
# ====================

# Ambiente: development, staging, production
APP_ENV=development

# Debug mode (use false em produção)
APP_DEBUG=true

# Host de escuta
APP_HOST=0.0.0.0

# Porta
APP_PORT=8000

# Nome da aplicação
APP_NAME=BarberZap
```

---

#### 3.5 LOGGING

```bash
# ====================
# LOGGING
# ====================

# Nível de log: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_LEVEL=INFO

# Formato: json ou text
LOG_FORMAT=json
```

---

#### 3.6 WEBHOOK CONFIG

```bash
# ====================
# WEBHOOK CONFIG
# ====================

# Segredo para validar webhooks
# Gere uma string aleatória segura
WEBHOOK_SECRET=your_extremely_secure_random_secret_here

# Timeout em segundos
WEBHOOK_TIMEOUT=30
```

**Gerando WEBHOOK_SECRET:**
```bash
# Linux/macOS
openssl rand -hex 32

# PowerShell
powershell -Command "-join ( (47..57) + (65..90) + (97..122) | Get-Random -Count 50 | % { [char]$_ } )"
```

---

#### 3.7 TENANT DEFAULTS

```bash
# ====================
# TENANT DEFAULTS
# ====================

# Idioma padrão
DEFAULT_LANGUAGE=pt-BR

# Timezone padrão
DEFAULT_TIMEZONE=America/Sao_Paulo
```

---

### Passo 4: Validar configuração

```bash
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print('✅ SUPABASE_URL:', os.getenv('SUPABASE_URL')); print('✅ APP_ENV:', os.getenv('APP_ENV'))"
```

---

## 🗄️ Configuração do Banco de Dados (Supabase)

### Verificar conexão

```bash
# Execute o script de verificação
python scripts/check_db.py
```

Caso a conexão falhe, verifique:
1. ✅ URL do Supabase está correta
2. ✅ SERVICE_ROLE_KEY está válida
3. ✅ Internet está acessível

### Schema esperado (já criado em Supabase)

```sql
-- Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barbearias
CREATE TABLE barbearias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    hours TEXT,
    -- ... outros campos
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- ... outros campos
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    direction VARCHAR(10), -- 'inbound' ou 'outbound'
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- ... outros campos
);

-- Chat Memory (para IA)
CREATE TABLE chat_memoria_v4 (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(10), -- 'user' ou 'assistant'
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🧪 Testar Instalação

### Passo 1: Executar testes

```bash
# Todos os testes
pytest tests/ -v

# Apenas testes específicos
pytest tests/test_tenant_resolver.py -v
```

### Passo 2: Verificar componentes individualmente

```bash
# Verificar Tenant Resolver
python scripts/check_agente_config.py

# Verificar Context Builder
python scripts/demo_context_builder.py

# Verificar IA (Secretária)
python scripts/demo_secretaria_universal.py
```

### Passo 3: Iniciar aplicação

```bash
# Modo desenvolvimento (com reload)
python main.py

# ou usando uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Passo 4: Acessar documentação da API

Abra no navegador:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## 🔍 Solução de Problemas de Setup

### Problema: ModuleNotFoundError

**Erro:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solução:**
```bash
# Garanta que o ambiente virtual está ativado
source venv/bin/activate  # Linux/macOS

# Reinstale dependências
pip install -r requirements.txt
```

---

### Problema: Conexão Supabase falha

**Erro:**
```
Error connecting to Supabase: Invalid API key
```

**Solução:**
1. Verifique se está usando `service_role` (não `anon`)
2. Verifique se a API Key está correta no `.env`
3. Certifique-se de que a URL do projeto Supabase está correta
4. Verifique sua conexão com a internet

---

### Problema: Evolution API não responde

**Erro:**
```
Connection refused to Evolution API
```

**Solução:**
1. Verifique se a instância Evolution API está rodando
2. Verifique se a URL no `.env` está correta
3. Confirme se a API Key está válida
4. Teste com curl: `curl http://your-evolution-api-url`

---

### Problema: IA não gera respostas

**Erro:**
```
AI generation failed: Invalid API key
```

**Solução:**
1. Verifique se a API Key do provedor está correta
2. Verifique se o modelo especificado existe
3. Confira créditos disponíveis (OpenRouter, etc.)
4. Teste via webhook manual

---

### Problema: Porta 8000 já em uso

**Erro:**
```
OSError: [Errno 48] Address already in use
```

**Solução:**

#### Opção 1: Matar processo usando a porta
```bash
# Encontrar processo
lsof -i :8000

# Matar processo
kill -9 <PID>
```

#### Opção 2: Usar outra porta
```bash
uvicorn main:app --port 8001
```

---

## ✅ Checklist de Setup Completo

Antes de prosseguir para produção, confirme:

- [ ] Python 3.12 instalado
- [ ] Ambiente virtual criado e ativado
- [ ] Dependências instaladas via `requirements.txt`
- [ ] Arquivo `.env` criado e configurado
- [ ] SUPABASE_URL e SERVICE_ROLE_KEY válidos
- [ ] Evolution API URL, Key e Instance configurados
- [ ] AI API Key e modelo configurados
- [ ] Conexão com Supabase testada
- [ ] Testes unitários passando
- [ ] Aplicação iniciando sem erros
- [ ] Documentação da API acessível (http://localhost:8000/docs)

---

## 📚 Próximos Passos

Após completar o setup:

1. 📖 Leitura: [API_REFERENCE.md](./API_REFERENCE.md)
2. 🚀 Deploy: [DEPLOYMENT.md](./DEPLOYMENT.md)
3. 🔌 Integração: [INTEGRATION.md](./INTEGRATION.md)
4. 🐛 Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Setup Guide v1.0.0** | Última atualização: 2026-02-23
