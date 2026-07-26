# Deploy do SaaS na Vercel

Este frontend Vite é publicado pela Vercel a partir de `apps/saas`. A configuração versionada em `apps/saas/vercel.json` executa `npm ci`, valida as variáveis públicas, roda o typecheck e gera `dist/`. O rewrite SPA encaminha rotas profundas para `index.html`.

## Configuração do projeto na Vercel

No dashboard da Vercel, importe o repositório e configure:

| Campo | Valor |
| --- | --- |
| Root Directory | `apps/saas` |
| Framework Preset | `Vite` |
| Install Command | `npm ci` |
| Build Command | `npm run build:vercel` |
| Output Directory | `dist` |
| Node.js | `24.x` |

Não configure um Root Directory diferente: o `package-lock.json`, o `vercel.json` e o código do SaaS ficam nesse diretório.

## Variáveis de ambiente

Cadastre no dashboard da Vercel, nos escopos **Production**, **Preview** e **Development**:

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Sim | URL HTTP(S) do projeto Supabase. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim, preferida | Chave pública atual do Supabase para o navegador. |
| `VITE_SUPABASE_ANON_KEY` | Apenas compatibilidade | Use somente se a chave publishable ainda não estiver disponível. |

As chaves `publishable` e `anon` são públicas por design e entram no bundle do navegador. A segurança dos dados depende de RLS e de políticas corretas para os papéis `anon` e `authenticated`.

Nunca cadastre no frontend, inclusive com prefixo `VITE_`: `VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_SECRET_KEY`, service role, secret key, chaves Gemini ou qualquer outro segredo. Essas credenciais pertencem exclusivamente a serviços de backend protegidos.

`VITE_API_BASE_URL` é condicional: enquanto calendário e preferências de notificação não fizerem parte da entrega, deixe-a ausente. Quando essas funcionalidades forem ativadas, ela se torna obrigatória e deve apontar para um backend HTTPS público com CORS e contrato de API definidos. Sem isso, o código legado usa `http://localhost:8000`, que não funciona para usuários da aplicação publicada.

O `RegionProvider` experimental também referencia grupos de variáveis para `LATAM`, `USEAST`, `USWEST`, `EU` e `AP`: `VITE_API_URL_<REGIAO>`, `VITE_WS_URL_<REGIAO>`, `VITE_REALTIME_URL_<REGIAO>`, `VITE_SUPABASE_URL_<REGIAO>` e `VITE_SUPABASE_REGION_<REGIAO>`. Ele não está montado no bootstrap oficial; não cadastre essas variáveis na Vercel antes de existir uma arquitetura multirregional aprovada.

## Supabase Auth

Em **Supabase Dashboard > Authentication > URL Configuration**:

1. Defina **Site URL** com a URL canônica de produção do SaaS (`https://seu-dominio`).
2. Inclua a URL local usada no desenvolvimento, por exemplo `http://localhost:5173/**`.
3. Para previews da Vercel, use um padrão restrito ao time, por exemplo `https://*-<team-or-account-slug>.vercel.app/**`.
4. Quando o domínio final estiver definido, adicione a URL exata de produção e mantenha a lista de redirects mínima.

## Validação e publicação

Antes de publicar, execute localmente sem registrar valores em arquivos ou logs:

```bash
npm run typecheck:app
npm run build:vercel
```

Após o deploy, valide: a página inicial, uma rota profunda acessada diretamente, login/logout e o console do navegador. Verifique também que uma tentativa de usar service role ou secret key não foi configurada no projeto Vercel.

Se a publicação falhar por ambiente ausente, o validador lista apenas os nomes das variáveis. Corrija-as no dashboard e gere um novo deploy; não as grave no repositório.

## Rollback

Na Vercel, abra **Deployments**, selecione o último deploy saudável e use **Promote to Production**. Em seguida, valide a rota inicial, uma rota profunda e o fluxo de autenticação. Não altere chaves do Supabase durante um rollback de frontend sem um plano de rotação separado.

## Referências oficiais

- https://vercel.com/docs/deployments/configure-a-build#root-directory
- https://vercel.com/docs/project-configuration/vercel-json
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/auth/redirect-urls
