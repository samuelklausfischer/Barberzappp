-- Trial workspace creation for SaaS self-service signup.

alter table public.tenants add column if not exists trial_started_at timestamptz;
alter table public.tenants add column if not exists trial_ends_at timestamptz;
alter table public.profiles add column if not exists trial_started_at timestamptz;
alter table public.profiles add column if not exists trial_ends_at timestamptz;

create or replace function public.create_trial_workspace(
  p_company_name text,
  p_full_name text,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_company_name text := nullif(trim(p_company_name), '');
  v_full_name text := nullif(trim(p_full_name), '');
  v_phone text := nullif(trim(p_phone), '');
  v_base_slug text;
  v_tenant_id text;
  v_trial_started_at timestamptz := now();
  v_trial_ends_at timestamptz := now() + interval '7 days';
begin
  if v_user_id is null then
    raise exception 'Usuario autenticado e obrigatorio para criar trial';
  end if;

  if v_company_name is null then
    raise exception 'Nome da barbearia e obrigatorio';
  end if;

  if v_full_name is null then
    raise exception 'Nome do responsavel e obrigatorio';
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id;

  if exists (
    select 1
    from tenant_memberships
    where user_id = v_user_id
      and status = 'active'
  ) then
    raise exception 'Usuario ja possui uma conta ativa';
  end if;

  v_base_slug := regexp_replace(lower(v_company_name), '[^a-z0-9]+', '-', 'g');
  v_base_slug := trim(both '-' from coalesce(nullif(v_base_slug, ''), 'barberzap'));
  v_tenant_id := concat(left(v_base_slug, 36), '-', left(replace(v_user_id::text, '-', ''), 16));

  insert into tenants (
    id,
    company_name,
    email,
    owner_email,
    owner_phone,
    owner_user_id,
    subscription_status,
    trial_started_at,
    trial_ends_at,
    is_active,
    whatsapp_status
  )
  values (
    v_tenant_id,
    v_company_name,
    v_email,
    v_email,
    v_phone,
    v_user_id,
    'trial',
    v_trial_started_at,
    v_trial_ends_at,
    true,
    'disconnected'
  );

  insert into profiles (
    id,
    barbershop_name,
    full_name,
    email,
    phone,
    subscription_status,
    trial_started_at,
    trial_ends_at,
    ai_assistant_name
  )
  values (
    v_user_id,
    v_company_name,
    v_full_name,
    v_email,
    v_phone,
    'trial',
    v_trial_started_at,
    v_trial_ends_at,
    'Ana'
  );

  insert into tenant_memberships (tenant_id, user_id, role, status)
  values (v_tenant_id, v_user_id, 'owner', 'active');

  insert into agente_config (
    tenant_id,
    shop_id,
    user_id,
    barber_name,
    nome_barbearia,
    name,
    phone,
    whatsapp,
    email,
    nome_ia,
    ai_name,
    status,
    ai_enabled,
    timezone
  )
  values (
    v_tenant_id,
    v_tenant_id,
    v_tenant_id,
    v_full_name,
    v_company_name,
    v_company_name,
    v_phone,
    v_phone,
    v_email,
    'Ana',
    'Ana',
    'active',
    true,
    'America/Sao_Paulo'
  );

  return jsonb_build_object(
    'tenant_id', v_tenant_id,
    'subscription_status', 'trial',
    'trial_started_at', v_trial_started_at,
    'trial_ends_at', v_trial_ends_at
  );
end;
$$;

revoke all on function public.create_trial_workspace(text, text, text) from public;
grant execute on function public.create_trial_workspace(text, text, text) to authenticated;
