-- Secure service catalog writes for the SaaS. Browser clients read services
-- directly, but create/update/delete operations must go through guarded RPCs.

-- The production catalog is empty at the time of this migration. These checks
-- make the values consumed by the Agenda explicit for every future write.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.services'::regclass
      and conname = 'services_name_valid_check'
  ) then
    alter table public.services
      add constraint services_name_valid_check
      check (char_length(btrim(name)) between 2 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.services'::regclass
      and conname = 'services_description_valid_check'
  ) then
    alter table public.services
      add constraint services_description_valid_check
      check (description is null or char_length(btrim(description)) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.services'::regclass
      and conname = 'services_price_valid_check'
  ) then
    alter table public.services
      add constraint services_price_valid_check
      check (
        price is not null
        and price between 0 and 1000000
        and price = round(price, 2)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.services'::regclass
      and conname = 'services_duration_valid_check'
  ) then
    alter table public.services
      add constraint services_duration_valid_check
      check (
        duration is not null
        and duration_minutes is not null
        and duration = duration_minutes
        and duration_minutes between 1 and 1440
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.services'::regclass
      and conname = 'services_active_status_valid_check'
  ) then
    alter table public.services
      add constraint services_active_status_valid_check
      check (
        (active is true and status = 'active')
        or (active is false and status = 'inactive')
      );
  end if;
end;
$$;

-- The canonical name is tenant-wide, including services assigned to a barber.
-- It trims edges and collapses internal whitespace before case folding.
-- This prevents ambiguous service selection in the manual appointment flow.
create unique index if not exists services_tenant_canonical_name_key
  on public.services (
    tenant_id,
    lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))
  );

-- A single-column FK cannot prove that a barber belongs to the same tenant.
-- Keep the existing ON DELETE SET NULL behavior: null barber_id remains valid.
create or replace function private.enforce_service_barber_tenant()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.barber_id is not null
    and not exists (
      select 1
      from public.barbers as b
      where b.id = new.barber_id
        and b.tenant_id = new.tenant_id
    ) then
    raise exception using
      errcode = '22023',
      message = 'BARBER_NOT_FOUND';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_service_barber_tenant() from public;
revoke all on function private.enforce_service_barber_tenant() from anon;
revoke all on function private.enforce_service_barber_tenant() from authenticated;

drop trigger if exists trg_services_validate_barber_tenant on public.services;
create trigger trg_services_validate_barber_tenant
  before insert or update of tenant_id, barber_id on public.services
  for each row
  execute function private.enforce_service_barber_tenant();

create or replace function public.create_service(
  p_tenant_id text,
  p_name text,
  p_description text,
  p_duration_minutes integer,
  p_price numeric,
  p_barber_id bigint default null,
  p_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := regexp_replace(btrim(p_name), '[[:space:]]+', ' ', 'g');
  v_description text := nullif(btrim(p_description), '');
  v_active boolean := coalesce(p_active, true);
  v_service record;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '28000',
      message = 'AUTHENTICATION_REQUIRED';
  end if;

  if p_tenant_id is null or btrim(p_tenant_id) = ''
    or not coalesce(public.can_access_tenant(p_tenant_id), false) then
    raise exception using
      errcode = '42501',
      message = 'TENANT_ACCESS_DENIED';
  end if;

  if v_name is null or char_length(v_name) not between 2 and 80 then
    raise exception using
      errcode = '22023',
      message = 'SERVICE_NAME_INVALID';
  end if;

  if v_description is not null and char_length(v_description) > 500 then
    raise exception using
      errcode = '22023',
      message = 'SERVICE_DESCRIPTION_INVALID';
  end if;

  if p_duration_minutes is null or p_duration_minutes not between 1 and 1440 then
    raise exception using
      errcode = '22023',
      message = 'SERVICE_DURATION_INVALID';
  end if;

  if p_price is null
    or p_price < 0
    or p_price > 1000000
    or p_price <> round(p_price, 2) then
    raise exception using
      errcode = '22023',
      message = 'SERVICE_PRICE_INVALID';
  end if;

  if p_barber_id is not null
    and not exists (
      select 1
      from public.barbers as b
      where b.id = p_barber_id
        and b.tenant_id = p_tenant_id
        and coalesce(b.active, true)
        and coalesce(b.status, 'active') = 'active'
    ) then
    raise exception using
      errcode = '22023',
      message = 'BARBER_NOT_FOUND';
  end if;

  begin
    insert into public.services (
      tenant_id,
      shop_id,
      user_id,
      barber_id,
      name,
      description,
      duration,
      duration_minutes,
      price,
      active,
      status
    ) values (
      p_tenant_id,
      p_tenant_id,
      p_tenant_id,
      p_barber_id,
      v_name,
      v_description,
      p_duration_minutes,
      p_duration_minutes,
      p_price,
      v_active,
      case when v_active then 'active' else 'inactive' end
    )
    returning
      id,
      name,
      description,
      price,
      duration_minutes,
      active,
      status,
      barber_id
    into v_service;
  exception
    when unique_violation then
      raise exception using
        errcode = '23505',
        message = 'SERVICE_ALREADY_EXISTS';
  end;

  return jsonb_build_object(
    'success', true,
    'service', jsonb_build_object(
      'id', v_service.id,
      'name', v_service.name,
      'description', v_service.description,
      'price', v_service.price,
      'duration_minutes', v_service.duration_minutes,
      'active', v_service.active,
      'status', v_service.status,
      'barber_id', v_service.barber_id
    )
  );
end;
$$;

-- No browser-facing table writes: this RPC is the only creation path.
revoke insert, update, delete, truncate, references, trigger
  on table public.services from public, anon, authenticated;
revoke select on table public.services from public, anon;
grant select on table public.services to authenticated;

revoke all on function public.create_service(text, text, text, integer, numeric, bigint, boolean) from public;
revoke all on function public.create_service(text, text, text, integer, numeric, bigint, boolean) from anon;
revoke all on function public.create_service(text, text, text, integer, numeric, bigint, boolean) from authenticated;
grant execute on function public.create_service(text, text, text, integer, numeric, bigint, boolean) to authenticated;

comment on function public.create_service(text, text, text, integer, numeric, bigint, boolean) is
  'Cria um servico tenant-scoped com nome canonico, preco monetario e validacao de catalogo; uso exclusivo por membros autenticados autorizados.';
