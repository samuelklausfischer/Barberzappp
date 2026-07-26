# Trial seguro de 7 dias

## Artefatos

- Migration: `migrations/20260720194330_secure_trial_registration.sql`
- Correcao do gatilho legado: `migrations/20260722154923_fix_trial_registration_business_scope.sql`
- Edge Function publica: `functions/register-trial`

## Deploy

O cadastro e publico. Por isso, o deploy da funcao deve ser intencionalmente
feito sem verificacao automatica de JWT:

```sh
supabase functions deploy register-trial --no-verify-jwt
```

A propria funcao valida metodo, origem, tamanho e formato do payload, honeypot
e CPF antes de criar o cadastro.

Em desenvolvimento, as origens permitidas por padrao sao:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

Antes de producao, configure `TRIAL_ALLOWED_ORIGINS` na Edge Function com a
origem HTTPS exata do aplicativo, sem curingas:

```sh
supabase secrets set TRIAL_ALLOWED_ORIGINS=https://app.exemplo.com
```

## Seguranca e assinatura

- Nunca armazene CPF bruto. O banco guarda somente o fingerprint HMAC em
  `private.trial_identity_claims`, com pepper protegido pelo Supabase Vault.
- Nunca exponha a chave `service_role` em cliente, logs ou documentacao.
- A reativacao apos pagamento deve vir somente de webhook ou backend confiavel,
  atualizando `subscription_status = 'active'` e `is_active = true`.
  O cliente nunca pode reativar uma assinatura.

## Validacao recomendada

```sh
deno check supabase/functions/register-trial/index.ts
supabase migration list
supabase functions serve register-trial --no-verify-jwt
```

Teste tambem: CPF valido e duplicado, expiracao do trial, origem recusada,
aceite dos termos e compensacao do usuario quando o registro do workspace falhar.
