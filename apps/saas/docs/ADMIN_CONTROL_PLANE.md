# Central administrativa BarberZap

## Objetivo

A conta administrativa não usa o fluxo de uma barbearia. Usuários com a claim protegida app_metadata.role = admin entram em /admin, onde a aplicação consulta somente as RPCs administrativas.

## Provisionamento da conta

1. No Supabase Dashboard do projeto **Barbearia Saas**, abra **Authentication → Users**.
2. Crie o usuário com o e-mail administrativo definido pelo responsável e uma senha temporária forte.
3. Marque o e-mail como confirmado.
4. Saia e entre novamente no SaaS para que o novo JWT carregue a claim administrativa.

A migration mantém o e-mail autorizado em private.admin_email_allowlist e um trigger atribui role: admin em raw_app_meta_data no momento da criação. A senha não é armazenada no repositório, em migrations ou no frontend.

## Escopo atual

- visão de usuários, trial, assinatura e WhatsApp;
- visão de leads/campanhas baseada no CRM existente;
- consulta de configurações seguras para suporte;
- rota e RPCs protegidas por private.is_admin() e RLS.

A edição assistida e os disparos externos permanecem bloqueados nesta primeira etapa. Antes de liberar envios, é necessário definir o provedor WhatsApp, opt-in/consentimento, limites, templates e auditoria de cada envio.
