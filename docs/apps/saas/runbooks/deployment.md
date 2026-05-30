# 🚀 RUNBOOK: Deployment

## 📋 Visão Geral

Este runbook cobre o processo de deployment do BarberZap Pro, incluindo build, deploy e monitoramento.

---

## 🎯 Ambientes

| Ambiente | URL | Propósito |
|----------|-----|-----------|
| **Local** | http://localhost:3000 | Desenvolvimento |
| **Staging** | [URL] | Testes de integração |
| **Production** | [URL] | Produção |

---

## 🏗️ Build

### Pré-build Checklist

Antes de buildar para produção:

- [ ] Testes passando (quando implementados)
- [ ] Lint sem erros (quando configurado)
- [ ] Typecheck sem erros
- [ ] Environment variables configuradas
- [ ] Assets otimizados
- [ ] Versão atualizada em package.json

### Comando de Build

```bash
# Build para produção
npm run build

# Preview do build local
npm run preview
```

### Output do Build

O build gera:

```
dist/
├── assets/
│   ├── index-[hash].css
│   ├── index-[hash].js
│   └── index-[hash].js.map
└── index.html
```

---

## 🚀 Deploy para Vercel (Recomendado)

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login no Vercel

```bash
vercel login
```

### 3. Inicializar Projeto

```bash
vercel
```

Responder às perguntas:
- Link to existing project? → No
- What's your project's name? → barberzap-pro
- In which directory is your code located? → ./
- Want to override the settings? → No

### 4. Deploy para Production

```bash
vercel --prod
```

### 5. Configurar Environment Variables no Vercel

```bash
vercel env add GEMINI_API_KEY production
# Colar a API key quando solicitado
```

### 6. Verificar Deploy

```bash
vercel ls
```

---

## 🚀 Deploy para Netlify (Alternativa)

### 1. Instalar Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Login no Netlify

```bash
netlify login
```

### 3. Inicializar Projeto

```bash
netlify init
```

### 4. Deploy

```bash
netlify deploy --prod
```

### 5. Configurar Environment Variables

No dashboard do Netlify:
- Site Settings → Environment Variables
- Adicionar `GEMINI_API_KEY`

---

## 🚀 Deploy Manual (Outros Hosts)

### Build

```bash
npm run build
```

### Upload

1. Comprimir pasta `dist/`
2. Upload para host (FTP, S3, etc.)
3. Configurar server para servir arquivos estáticos

### Configuração do Server

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 🔧 CI/CD (GitHub Actions)

### Workflow de CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Lint
        run: npm run lint
        continue-on-error: true

      - name: Typecheck
        run: npm run typecheck
        continue-on-error: true
```

### Workflow de CD (Deploy para Vercel)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🔐 Environment Variables

### Variáveis Necessárias

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | API Key do Google Gemini | ✅ Sim |
| `VITE_API_URL` | URL da API backend (futuro) | 🔲 Não |

### Configurar em Diferentes Ambientes

#### Local (.env.local)
```bash
GEMINI_API_KEY=your_local_key
VITE_API_URL=http://localhost:4000
```

#### Production (Vercel/Netlify)
```bash
GEMINI_API_KEY=your_prod_key
VITE_API_URL=https://api.barberzap.com
```

---

## 📊 Monitoramento

### Logs

#### Vercel Logs

```bash
vercel logs
```

#### Netlify Logs

```bash
netlify logs
```

### Performance

Usar [Lighthouse](https://developers.google.com/web/tools/lighthouse) para medir performance:

```bash
npm install -g lighthouse
lighthouse https://seu-site.com --view
```

### Uptime

Configurar monitoramento em:
- UptimeRobot
- Pingdom
- StatusCake

---

## 🚨 Troubleshooting

### Erro 1: Build falha

**Sintoma**: `npm run build` retorna erro

**Debugar**:
```bash
# Verificar erro específico
npm run build 2>&1 | tee build.log

# Verificar se há erros de tipo
npm run typecheck
```

**Possíveis causas**:
- Type errors
- Missing dependencies
- Environment variables

**Solução**:
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar se há type errors
npm run typecheck

# Verificar environment variables
echo $GEMINI_API_KEY
```

---

### Erro 2: Deploy falha

**Sintoma**: Deployment falha na plataforma

**Debugar**:
- Verificar logs da plataforma
- Verificar se há erros no build
- Verificar environment variables

**Possíveis causas**:
- Build error
- Environment variables missing
- Deploy limit exceeded

**Solução**:
- Verificar logs detalhados
- Reconfigurar environment variables
- Verificar plano/limites da plataforma

---

### Erro 3: Site não carrega em produção

**Sintoma**: Site deployed mas não acessível

**Debugar**:
- Verificar se deploy foi bem-sucedido
- Verificar URL
- Verificar console do browser

**Possíveis causas**:
- Deploy incompleto
- URL errada
- Environment variables não configuradas
- Routing problem

**Solução**:
- Verificar status do deploy
- Verificar se domain está configurado
- Verificar se API key está configurada
- Verificar se routing está correto (SPA)

---

### Erro 4: Features não funcionam em produção

**Sintoma**: Feature funciona local mas não em produção

**Debugar**:
- Verificar console do browser
- Verificar Network tab
- Verificar environment variables
- Verificar se há HTTPS required

**Possíveis causas**:
- Environment variables não configuradas
- API key não setada
- CORS issues
- Mixed content (HTTP/HTTPS)

**Solução**:
- Verificar environment variables
- Verificar se API key está configurada
- Verificar CORS na API
- Verificar se tudo está em HTTPS

---

## 🔄 Rollback

### Vercel

```bash
# Listar deploys
vercel ls

# Rollback para deploy anterior
vercel rollback
```

### Netlify

```bash
# Listar deploys
netlify deploy:list

# Rollback
netlify deploy:rollback
```

---

## 📚 Checklist de Deploy

Antes de deployar para produção:

- [ ] Testes passando
- [ ] Build local bem-sucedido
- [ ] Lint sem erros
- [ ] Typecheck sem erros
- [ ] Environment variables configuradas
- [ ] Revisão de código feita
- [ ] Changelog atualizado
- [ ] Versão atualizada
- [ ] Backup feito (se necessário)
- [ ] Notificação da equipe

Após deploy:

- [ ] Verificar se site está acessível
- [ ] Verificar console do browser
- [ ] Verificar features críticas
- [ ] Verificar integrações (IA, etc.)
- [ ] Verificar performance
- [ ] Monitorar logs nas próximas 24h

---

**Última atualização**: 2026-03-03
**Responsável**: Dev Sênior
