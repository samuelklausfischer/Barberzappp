-- Secure, one-time seven-day trial registration. This migration is intentionally
-- local only; review it before applying it to a Supabase project.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;

create table if not exists private.trial_identity_claims (
  id uuid primary key default extensions.gen_random_uuid(),
  cpf_fingerprint text not null unique,
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz not null default clock_timestamp(),
  tenant_id text references public.tenants(id) on delete set null,
  constraint trial_identity_claims_fingerprint_format_check
    check (cpf_fingerprint ~ '^[0-9a-f]{64}$')
);

alter table private.trial_identity_claims enable row level security;

revoke all on table private.trial_identity_claims from public;
revoke all on table private.trial_identity_claims from anon;
revoke all on table private.trial_identity_claims from authenticated;

-- The value is generated in Postgres and remains encrypted in Supabase Vault.
do $$
begin
  if not exists (
    select 1
    from vault.secrets
    where name = 'barberzap_trial_cpf_pepper'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'barberzap_trial_cpf_pepper',
      'Pepper used only to fingerprint BarberZap trial CPFs'
    );
  end if;
end;
$$;

create or replace function private.is_valid_cpf(p_cpf text)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');
  v_sum integer := 0;
  v_digit integer;
  v_index integer;
begin
  if length(v_cpf) <> 11 or v_cpf ~ '^(.)\1{10}$' then
    return false;
  end if;

  for v_index in 1..9 loop
    v_sum := v_sum + (substr(v_cpf, v_index, 1)::integer * (11 - v_index));
  end loop;
  v_digit := (v_sum * 10) % 11;
  if v_digit = 10 then
    v_digit := 0;
  end if;
  if v_digit <> substr(v_cpf, 10, 1)::integer then
    return false;
  end if;

  v_sum := 0;
  for v_index in 1..10 loop
    v_sum := v_sum + (substr(v_cpf, v_index, 1)::integer * (12 - v_index));
  end loop;
  v_digit := (v_sum * 10) % 11;
  if v_digit = 10 then
    v_digit := 0;
  end if;

  return v_digit = substr(v_cpf, 11, 1)::integer;
end;
$$;

revoke all on function private.is_valid_cpf(text) from public;
revoke all on function private.is_valid_cpf(text) from anon;
revoke all on function private.is_valid_cpf(text) from authenticated;

create or replace function private.is_tenant_member(p_tenant_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    (select auth.uid()) is not null
    and (
      exists (
        select 1
        from public.tenant_memberships tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = (select auth.uid())
          and tm.status = 'active'
      )
      or exists (
        select 1
        from public.tenants t
        where t.id = p_tenant_id
          and t.owner_user_id = (select auth.uid())
      )
    );
$$;

revoke all on function private.is_tenant_member(text) from public;
revoke all on function private.is_tenant_member(text) from anon;
grant usage on schema private to authenticated;
grant execute on function private.is_tenant_member(text) to authenticated;

-- Keep legacy trials with no expiry active. A trialing status is never valid
-- without timestamps, so it cannot accidentally grant permanent access.
update public.tenants
set subscription_status = 'trialing',
    is_active = true,
    trial_started_at = coalesce(
      trial_started_at,
      trial_ends_at - interval '7 days'
    ),
    updated_at = clock_timestamp()
where subscription_status = 'trial'
  and trial_ends_at is not null;

update public.tenants
set subscription_status = 'active',
    is_active = true,
    updated_at = clock_timestamp()
where subscription_status = 'trial'
  and trial_ends_at is null;

update public.profiles p
set subscription_status = t.subscription_status,
    trial_started_at = case when t.subscription_status = 'trialing' then t.trial_started_at else null end,
    trial_ends_at = case when t.subscription_status = 'trialing' then t.trial_ends_at else null end,
    updated_at = clock_timestamp()
from public.tenants t
where t.owner_user_id = p.id
  and t.subscription_status in ('trialing', 'active');

alter table public.tenants
  alter column subscription_status set default 'trialing';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tenants'::regclass
      and conname = 'tenants_subscription_status_check'
  ) then
    alter table public.tenants
      add constraint tenants_subscription_status_check
      check (subscription_status is null or subscription_status in (
        'active', 'paid', 'trialing', 'paused', 'past_due', 'canceled', 'incomplete'
      )) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tenants'::regclass
      and conname = 'tenants_trialing_dates_check'
  ) then
    alter table public.tenants
      add constraint tenants_trialing_dates_check
      check (
        subscription_status <> 'trialing'
        or (
          trial_started_at is not null
          and trial_ends_at is not null
          and trial_ends_at > trial_started_at
        )
      ) not valid;
  end if;
end;
$$;

create or replace function public.register_trial_workspace(
  p_user_id uuid,
  p_company_name text,
  p_full_name text,
  p_phone text,
  p_cpf text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_email text;
  v_company_name text := nullif(btrim(p_company_name), '');
  v_full_name text := nullif(btrim(p_full_name), '');
  v_phone text := nullif(btrim(p_phone), '');
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');
  v_pepper text;
  v_fingerprint text;
  v_tenant_id text := extensions.gen_random_uuid()::text;
  v_now timestamptz := clock_timestamp();
  v_trial_ends_at timestamptz;
begin
  if p_user_id is null then
    raise exception using errcode = '22023', message = 'trial_user_required';
  end if;

  select u.email
  into v_email
  from auth.users u
  where u.id = p_user_id;

  if v_email is null then
    raise exception using errcode = '22023', message = 'trial_user_not_found';
  end if;

  if v_company_name is null or char_length(v_company_name) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'trial_company_invalid';
  end if;

  if v_full_name is null or char_length(v_full_name) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'trial_name_invalid';
  end if;

  if v_phone is not null and char_length(v_phone) > 32 then
    raise exception using errcode = '22023', message = 'trial_phone_invalid';
  end if;

  if not private.is_valid_cpf(v_cpf) then
    raise exception using errcode = '22023', message = 'trial_cpf_invalid';
  end if;

  if exists (select 1 from public.profiles where id = p_user_id)
    or exists (select 1 from public.tenant_memberships where user_id = p_user_id)
    or exists (select 1 from public.tenants where owner_user_id = p_user_id)
    or exists (select 1 from private.trial_identity_claims where claimed_by_user_id = p_user_id) then
    raise exception using errcode = '23505', message = 'trial_user_already_claimed';
  end if;

  select ds.decrypted_secret
  into v_pepper
  from vault.decrypted_secrets ds
  where ds.name = 'barberzap_trial_cpf_pepper';

  if v_pepper is null then
    raise exception using errcode = '55000', message = 'trial_pepper_unavailable';
  end if;

  v_fingerprint := encode(
    extensions.hmac(v_cpf::bytea, v_pepper::bytea, 'sha256'),
    'hex'
  );
  v_trial_ends_at := v_now + interval '7 days';


  insert into public.tenants (
    id,
    slug,
    company_name,
    email,
    owner_email,
    owner_phone,
    owner_user_id,
    subscription_status,
    is_active,
    trial_started_at,
    trial_ends_at,
    whatsapp_status,
    timezone
  ) values (
    v_tenant_id,
    v_tenant_id,
    v_company_name,
    v_email,
    v_email,
    v_phone,
    p_user_id,
    'trialing',
    true,
    v_now,
    v_trial_ends_at,
    'disconnected',
    'America/Sao_Paulo'
  );

  insert into public.profiles (
    id,
    barbershop_name,
    full_name,
    email,
    phone,
    subscription_status,
    trial_started_at,
    trial_ends_at,
    ai_assistant_name
  ) values (
    p_user_id,
    v_company_name,
    v_full_name,
    v_email,
    v_phone,
    'trialing',
    v_now,
    v_trial_ends_at,
    'Ana'
  );

  insert into public.tenant_memberships (tenant_id, user_id, role, status)
  values (v_tenant_id, p_user_id, 'owner', 'active');

  insert into public.agente_config (
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
  ) values (
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

  begin
    insert into private.trial_identity_claims (
      cpf_fingerprint,
      claimed_by_user_id,
      tenant_id
    ) values (
      v_fingerprint,
      p_user_id,
      v_tenant_id
    );
  exception
    when unique_violation then
      raise exception using errcode = '23505', message = 'trial_cpf_already_used';
  end;
  return jsonb_build_object(
    'tenant_id', v_tenant_id,
    'subscription_status', 'trialing',
    'trial_started_at', v_now,
    'trial_ends_at', v_trial_ends_at
  );
end;
$$;

revoke all on function public.register_trial_workspace(uuid, text, text, text, text) from public;
revoke all on function public.register_trial_workspace(uuid, text, text, text, text) from anon;
revoke all on function public.register_trial_workspace(uuid, text, text, text, text) from authenticated;
grant execute on function public.register_trial_workspace(uuid, text, text, text, text) to service_role;

drop function if exists public.create_trial_workspace(text, text, text);

create or replace function public.can_access_tenant(p_tenant_id text)
returns boolean
language sql
volatile
security definer
set search_path = pg_catalog
as $$
  select
    (select auth.uid()) is not null
    and private.is_tenant_member(p_tenant_id)
    and exists (
      select 1
      from public.tenants t
      where t.id = p_tenant_id
        and t.is_active = true
        and (
          t.subscription_status in ('active', 'paid')
          or (
            t.subscription_status = 'trialing'
            and t.trial_started_at is not null
            and t.trial_ends_at is not null
            and clock_timestamp() < t.trial_ends_at
          )
        )
    );
$$;

revoke all on function public.can_access_tenant(text) from public;
revoke all on function public.can_access_tenant(text) from anon;
grant execute on function public.can_access_tenant(text) to authenticated;

create or replace function public.refresh_my_trial_state()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
  v_paused_count integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;

  with expired_tenants as (
    update public.tenants t
    set subscription_status = 'paused',
        is_active = false,
        updated_at = clock_timestamp()
    where t.subscription_status = 'trialing'
      and t.trial_ends_at is not null
      and t.trial_ends_at <= clock_timestamp()
      and (
        t.owner_user_id = v_user_id
        or exists (
          select 1
          from public.tenant_memberships tm
          where tm.tenant_id = t.id
            and tm.user_id = v_user_id
            and tm.status = 'active'
        )
      )
    returning t.id, t.owner_user_id
  ), updated_profiles as (
    update public.profiles p
    set subscription_status = 'paused',
        updated_at = clock_timestamp()
    from expired_tenants et
    where p.id = et.owner_user_id
    returning p.id
  )
  select count(*) into v_paused_count from expired_tenants;


  return jsonb_build_object('paused_tenants', v_paused_count);
end;
$$;

revoke all on function public.refresh_my_trial_state() from public;
revoke all on function public.refresh_my_trial_state() from anon;
grant execute on function public.refresh_my_trial_state() to authenticated;

-- Browser clients can read their context, but cannot manufacture a tenant,
-- elevate membership, or edit trial and subscription attributes.
revoke all privileges on table public.tenants from anon;
revoke all privileges on table public.tenants from authenticated;
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.profiles from authenticated;
revoke all privileges on table public.tenant_memberships from anon;
revoke all privileges on table public.tenant_memberships from authenticated;

grant select on table public.tenants to authenticated;
grant update (
  company_name,
  email,
  owner_email,
  owner_phone,
  prompt_tone,
  prompt_business_rules,
  business_hours,
  whatsapp_status,
  timezone,
  slug
) on table public.tenants to authenticated;
grant select on table public.profiles to authenticated;
grant update (
  barbershop_name,
  full_name,
  phone,
  ai_assistant_name,
  business_address,
  business_hours,
  avatar_url
) on table public.profiles to authenticated;
grant select on table public.tenant_memberships to authenticated;

drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists tenant_memberships_insert on public.tenant_memberships;
drop policy if exists tenant_memberships_select on public.tenant_memberships;
drop policy if exists tenant_memberships_update on public.tenant_memberships;
drop policy if exists tenant_memberships_delete on public.tenant_memberships;
drop policy if exists tenants_insert on public.tenants;
drop policy if exists tenants_select on public.tenants;
drop policy if exists tenants_update on public.tenants;
drop policy if exists tenants_delete on public.tenants;

create policy profiles_select_self
on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_self_safe
on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy tenants_select_member_context
on public.tenants
for select to authenticated
using (
  owner_user_id = (select auth.uid())
  or private.is_tenant_member(id)
);

create policy tenants_update_owner_safe
on public.tenants
for update to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy tenant_memberships_select_context
on public.tenant_memberships
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.tenants t
    where t.id = tenant_memberships.tenant_id
      and t.owner_user_id = (select auth.uid())
  )
);
