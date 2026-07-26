-- Secure team management and recurring professional availability.
--
-- `public.barbers` is the canonical professional entity. `employees` remains a
-- legacy read model and is intentionally not extended by this migration.

-- Canonical names make a team member unambiguous even when inactive. Existing
-- records are preserved; new writes must satisfy the constraints below.
create unique index if not exists barbers_tenant_canonical_name_key
  on public.barbers (
    tenant_id,
    lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))
  );

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.barbers'::regclass
      and conname = 'barbers_name_valid_check'
  ) then
    alter table public.barbers add constraint barbers_name_valid_check
      check (name is not null and char_length(btrim(name)) between 2 and 80) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.barbers'::regclass
      and conname = 'barbers_bio_valid_check'
  ) then
    alter table public.barbers add constraint barbers_bio_valid_check
      check (bio is null or char_length(btrim(bio)) <= 500) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.barbers'::regclass
      and conname = 'barbers_active_status_valid_check'
  ) then
    alter table public.barbers add constraint barbers_active_status_valid_check
      check (
        active is not null
        and status is not null
        and ((active is true and status = 'active')
        or (active is false and status = 'inactive')
        )
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.working_hours'::regclass
      and conname = 'working_hours_interval_valid_check'
  ) then
    alter table public.working_hours add constraint working_hours_interval_valid_check
      check (
        barber_id is null
        or (start_time is not null and end_time is not null and end_time > start_time)
      ) not valid;
  end if;
end;
$$;

-- Existing scope triggers use tenant_id/shop_id/user_id for business scope;
-- this trigger adds the missing barber-to-tenant invariant for every schedule
-- writer, including privileged integrations.
create or replace function private.enforce_working_hours_barber_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.barber_id is not null and not exists (
    select 1
    from public.barbers as b
    where b.id = new.barber_id
      and b.tenant_id = new.tenant_id
  ) then
    raise exception using errcode = '22023', message = 'WORKING_HOURS_BARBER_TENANT_MISMATCH';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_working_hours_no_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.barber_id is null or not coalesce(new.is_active, true) then
    return new;
  end if;

  if exists (
    select 1
    from public.working_hours as h
    where h.tenant_id = new.tenant_id
      and h.barber_id = new.barber_id
      and h.day_of_week = new.day_of_week
      and h.is_active
      and h.id is distinct from new.id
      and h.start_time < new.end_time
      and new.start_time < h.end_time
  ) then
    raise exception using errcode = '23P01', message = 'WORKING_HOURS_OVERLAP';
  end if;

  return new;
end;
$$;

-- All schedule writers, including privileged integrations, share the exact
-- tenant+barber key used by create_manual_appointment. UPDATE can move a row
-- between professionals, so both keys are acquired in deterministic hash order
-- before any mutation; DELETE locks OLD because NEW does not exist.
create or replace function private.lock_working_hours_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_key bigint;
  v_new_key bigint;
begin
  if tg_op in ('UPDATE', 'DELETE') and old.barber_id is not null then
    v_old_key := pg_catalog.hashtextextended(old.tenant_id || ':' || old.barber_id::text, 0);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.barber_id is not null then
    v_new_key := pg_catalog.hashtextextended(new.tenant_id || ':' || new.barber_id::text, 0);
  end if;

  if v_old_key is not null and v_new_key is not null and v_old_key <> v_new_key then
    if v_old_key < v_new_key then
      perform pg_catalog.pg_advisory_xact_lock(v_old_key);
      perform pg_catalog.pg_advisory_xact_lock(v_new_key);
    else
      perform pg_catalog.pg_advisory_xact_lock(v_new_key);
      perform pg_catalog.pg_advisory_xact_lock(v_old_key);
    end if;
  elsif coalesce(v_old_key, v_new_key) is not null then
    perform pg_catalog.pg_advisory_xact_lock(coalesce(v_old_key, v_new_key));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_working_hours_validate_barber_tenant on public.working_hours;
create trigger trg_working_hours_validate_barber_tenant
before insert or update on public.working_hours
for each row execute function private.enforce_working_hours_barber_tenant();

drop trigger if exists trg_working_hours_a_lock_scope on public.working_hours;
create trigger trg_working_hours_a_lock_scope
before insert or update or delete on public.working_hours
for each row execute function private.lock_working_hours_scope();

drop trigger if exists trg_working_hours_no_overlap on public.working_hours;
create trigger trg_working_hours_no_overlap
before insert or update on public.working_hours
for each row execute function private.enforce_working_hours_no_overlap();

-- Browser sessions retain tenant-scoped reads through RLS. All writes become
-- owner-only RPC operations so that business invariants cannot be bypassed.
revoke insert, update, delete, truncate on table public.barbers from public, anon, authenticated;
revoke insert, update, delete, truncate on table public.working_hours from public, anon, authenticated;
revoke select on table public.barbers from anon;
revoke select on table public.working_hours from anon;
grant select on table public.barbers to authenticated;
grant select on table public.working_hours to authenticated;

create or replace function private.assert_active_tenant_owner(p_tenant_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if nullif(pg_catalog.btrim(p_tenant_id), '') is null
    or not public.can_access_tenant(p_tenant_id) then
    raise exception using errcode = '42501', message = 'TENANT_FORBIDDEN';
  end if;

  if not exists (
    select 1
    from public.tenant_memberships as membership
    where membership.tenant_id = p_tenant_id
      and membership.user_id = auth.uid()
      and membership.role = 'owner'
      and membership.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'TEAM_OWNER_REQUIRED';
  end if;
end;
$$;

create or replace function private.validate_team_schedule(p_schedule jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_day smallint;
  v_start time;
  v_end time;
begin
  if p_schedule is null or jsonb_typeof(p_schedule) <> 'array' then
    raise exception using errcode = '22023', message = 'SCHEDULE_INVALID';
  end if;
  if jsonb_array_length(p_schedule) > 21 then
    raise exception using errcode = '22023', message = 'SCHEDULE_INVALID';
  end if;

  for v_item in select value from jsonb_array_elements(p_schedule)
  loop
    if jsonb_typeof(v_item) <> 'object'
      or not (v_item ? 'day_of_week' and v_item ? 'start_time' and v_item ? 'end_time')
      or jsonb_typeof(v_item -> 'day_of_week') <> 'number'
      or (v_item ->> 'day_of_week') !~ '^[0-6]$'
      or jsonb_typeof(v_item -> 'start_time') <> 'string'
      or jsonb_typeof(v_item -> 'end_time') <> 'string'
      or (v_item ->> 'start_time') !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$'
      or (v_item ->> 'end_time') !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$' then
      raise exception using errcode = '22023', message = 'SCHEDULE_INVALID';
    end if;

    begin
      v_day := (v_item ->> 'day_of_week')::smallint;
      v_start := (v_item ->> 'start_time')::time;
      v_end := (v_item ->> 'end_time')::time;
    exception when others then
      raise exception using errcode = '22023', message = 'SCHEDULE_INVALID';
    end;

    if v_day not between 0 and 6 or v_start >= v_end then
      raise exception using errcode = '22023', message = 'SCHEDULE_INVALID';
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(p_schedule) with ordinality as left_slot(value, ordinal)
    join jsonb_array_elements(p_schedule) with ordinality as right_slot(value, ordinal)
      on left_slot.ordinal < right_slot.ordinal
     and (left_slot.value ->> 'day_of_week')::smallint = (right_slot.value ->> 'day_of_week')::smallint
     and (left_slot.value ->> 'start_time')::time < (right_slot.value ->> 'end_time')::time
     and (right_slot.value ->> 'start_time')::time < (left_slot.value ->> 'end_time')::time
  ) then
    raise exception using errcode = '23P01', message = 'WORKING_HOURS_OVERLAP';
  end if;
end;
$$;

create or replace function private.normalize_team_specialties(p_specialties text[])
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raw text;
  v_specialty text;
  v_normalized text[] := array[]::text[];
begin
  if coalesce(cardinality(p_specialties), 0) > 12 then
    raise exception using errcode = '22023', message = 'TEAM_MEMBER_SPECIALTIES_INVALID';
  end if;

  foreach v_raw in array coalesce(p_specialties, array[]::text[])
  loop
    v_specialty := nullif(pg_catalog.regexp_replace(pg_catalog.btrim(v_raw), '[[:space:]]+', ' ', 'g'), '');
    if v_specialty is null or char_length(v_specialty) not between 2 and 60 then
      raise exception using errcode = '22023', message = 'TEAM_MEMBER_SPECIALTIES_INVALID';
    end if;
    if exists (
      select 1 from unnest(v_normalized) as saved(value)
      where pg_catalog.lower(saved.value) = pg_catalog.lower(v_specialty)
    ) then
      raise exception using errcode = '22023', message = 'TEAM_MEMBER_SPECIALTIES_DUPLICATE';
    end if;
    v_normalized := array_append(v_normalized, v_specialty);
  end loop;

  return v_normalized;
end;
$$;

create or replace function private.team_member_payload(p_tenant_id text, p_barber_id bigint)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'specialties', coalesce(to_jsonb(b.specialties), '[]'::jsonb),
    'bio', b.bio,
    'photo_url', b.photo_url,
    'active', b.active,
    'status', b.status,
    'created_at', b.created_at,
    'updated_at', b.updated_at,
    'working_hours', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', h.id,
        'day_of_week', h.day_of_week,
        'start_time', h.start_time,
        'end_time', h.end_time,
        'timezone', h.timezone
      ) order by h.day_of_week, h.start_time, h.end_time)
      from public.working_hours as h
      where h.tenant_id = p_tenant_id
        and h.barber_id = p_barber_id
        and h.is_active
    ), '[]'::jsonb)
  )
  from public.barbers as b
  where b.tenant_id = p_tenant_id and b.id = p_barber_id;
$$;

create or replace function public.save_team_member(
  p_tenant_id text,
  p_barber_id bigint,
  p_name text,
  p_specialties text[],
  p_bio text,
  p_active boolean,
  p_schedule jsonb,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.barbers%rowtype;
  v_timezone text;
  v_name text := nullif(pg_catalog.regexp_replace(pg_catalog.btrim(p_name), '[[:space:]]+', ' ', 'g'), '');
  v_bio text := nullif(pg_catalog.btrim(p_bio), '');
  v_specialties text[];
  v_slot jsonb;
  v_constraint text;
begin
  perform private.assert_active_tenant_owner(p_tenant_id);
  perform private.validate_team_schedule(p_schedule);
  v_specialties := private.normalize_team_specialties(p_specialties);

  if v_name is null or char_length(v_name) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'TEAM_MEMBER_NAME_INVALID';
  end if;
  if v_bio is not null and char_length(v_bio) > 500 then
    raise exception using errcode = '22023', message = 'TEAM_MEMBER_BIO_INVALID';
  end if;
  if p_active is null then
    raise exception using errcode = '22023', message = 'TEAM_MEMBER_ACTIVE_REQUIRED';
  end if;

  select coalesce(nullif(pg_catalog.btrim(t.timezone), ''), 'America/Sao_Paulo')
  into v_timezone
  from public.tenants as t where t.id = p_tenant_id;
  if v_timezone is null or not exists (
    select 1 from pg_catalog.pg_timezone_names as zone where zone.name = v_timezone
  ) then
    raise exception using errcode = '22023', message = 'TENANT_TIMEZONE_INVALID';
  end if;

  if p_barber_id is null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_tenant_id || ':team', 0));
    if exists (
      select 1 from public.barbers as b
      where b.tenant_id = p_tenant_id
        and lower(pg_catalog.regexp_replace(pg_catalog.btrim(b.name), '[[:space:]]+', ' ', 'g')) = lower(v_name)
    ) then
      raise exception using errcode = '23505', message = 'TEAM_MEMBER_ALREADY_EXISTS';
    end if;

    begin
      insert into public.barbers (tenant_id, shop_id, user_id, name, specialties, bio, active, status)
      values (p_tenant_id, p_tenant_id, p_tenant_id, v_name, v_specialties, v_bio, p_active,
        case when p_active then 'active' else 'inactive' end)
      returning * into v_member;
    exception when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'barbers_tenant_canonical_name_key' then
        raise exception using errcode = '23505', message = 'TEAM_MEMBER_ALREADY_EXISTS';
      end if;
      raise;
    end;
  else
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(p_tenant_id || ':' || p_barber_id::text, 0)
    );
    select * into v_member
    from public.barbers as b
    where b.id = p_barber_id and b.tenant_id = p_tenant_id
    for update;
    if not found then
      raise exception using errcode = '22023', message = 'TEAM_MEMBER_NOT_FOUND';
    end if;
    if p_expected_updated_at is not null and v_member.updated_at is distinct from p_expected_updated_at then
      raise exception using errcode = '40001', message = 'TEAM_MEMBER_CONFLICT';
    end if;
    if exists (
      select 1 from public.barbers as b
      where b.tenant_id = p_tenant_id and b.id <> p_barber_id
        and lower(pg_catalog.regexp_replace(pg_catalog.btrim(b.name), '[[:space:]]+', ' ', 'g')) = lower(v_name)
    ) then
      raise exception using errcode = '23505', message = 'TEAM_MEMBER_ALREADY_EXISTS';
    end if;

    -- This is the same tenant+barber lock acquired by appointment creation.
    -- It prevents a schedule edit from racing a new reservation into an
    -- unavailable interval or inactivating a professional with future work.
    if not p_active and exists (
      select 1 from public.appointments as a
      where a.tenant_id = p_tenant_id
        and a.barber_id = p_barber_id
        and a.status in ('scheduled', 'confirmed', 'pending')
        and a.end_time > clock_timestamp()
    ) then
      raise exception using errcode = '23503', message = 'TEAM_MEMBER_HAS_UPCOMING_APPOINTMENTS';
    end if;
    if p_active and exists (
      select 1
      from public.appointments as a
      where a.tenant_id = p_tenant_id
        and a.barber_id = p_barber_id
        and a.status in ('scheduled', 'confirmed', 'pending')
        and a.end_time > clock_timestamp()
        and not exists (
          select 1
          from jsonb_array_elements(p_schedule) as slot(value)
          where (a.scheduled_at at time zone v_timezone)::date = (a.end_time at time zone v_timezone)::date
            and (slot.value ->> 'day_of_week')::smallint = extract(dow from (a.scheduled_at at time zone v_timezone))::smallint
            and (slot.value ->> 'start_time')::time <= (a.scheduled_at at time zone v_timezone)::time
            and (slot.value ->> 'end_time')::time >= (a.end_time at time zone v_timezone)::time
        )
    ) then
      raise exception using errcode = '23503', message = 'TEAM_MEMBER_SCHEDULE_CONFLICTS_APPOINTMENTS';
    end if;

    begin
      update public.barbers
      set name = v_name,
          specialties = v_specialties,
          bio = v_bio,
          active = p_active,
          status = case when p_active then 'active' else 'inactive' end
      where id = p_barber_id and tenant_id = p_tenant_id
      returning * into v_member;
    exception when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'barbers_tenant_canonical_name_key' then
        raise exception using errcode = '23505', message = 'TEAM_MEMBER_ALREADY_EXISTS';
      end if;
      raise;
    end;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_tenant_id || ':' || v_member.id::text, 0)
  );
  delete from public.working_hours
  where tenant_id = p_tenant_id and barber_id = v_member.id;

  for v_slot in select value from jsonb_array_elements(p_schedule)
  loop
    insert into public.working_hours (
      tenant_id, shop_id, user_id, barber_id, day_of_week, start_time, end_time, is_active, timezone
    ) values (
      p_tenant_id, p_tenant_id, p_tenant_id, v_member.id,
      (v_slot ->> 'day_of_week')::smallint,
      (v_slot ->> 'start_time')::time,
      (v_slot ->> 'end_time')::time,
      true, v_timezone
    );
  end loop;

  select * into v_member from public.barbers where id = v_member.id;
  return jsonb_build_object(
    'success', true,
    'member', private.team_member_payload(p_tenant_id, v_member.id)
  );
end;
$$;

create or replace function public.set_team_member_active(
  p_tenant_id text,
  p_barber_id bigint,
  p_active boolean,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.barbers%rowtype;
begin
  perform private.assert_active_tenant_owner(p_tenant_id);
  if p_barber_id is null or p_active is null then
    raise exception using errcode = '22023', message = 'TEAM_MEMBER_ARGUMENTS_INVALID';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_tenant_id || ':' || p_barber_id::text, 0)
  );
  select * into v_member from public.barbers as b
  where b.id = p_barber_id and b.tenant_id = p_tenant_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'TEAM_MEMBER_NOT_FOUND';
  end if;
  if p_expected_updated_at is not null and v_member.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'TEAM_MEMBER_CONFLICT';
  end if;
  if not p_active and exists (
    select 1 from public.appointments as a
    where a.tenant_id = p_tenant_id
      and a.barber_id = p_barber_id
      and a.status in ('scheduled', 'confirmed', 'pending')
      and a.end_time > clock_timestamp()
  ) then
    raise exception using errcode = '23503', message = 'TEAM_MEMBER_HAS_UPCOMING_APPOINTMENTS';
  end if;

  update public.barbers
  set active = p_active, status = case when p_active then 'active' else 'inactive' end
  where id = p_barber_id and tenant_id = p_tenant_id
  returning * into v_member;

  return jsonb_build_object('success', true, 'member', private.team_member_payload(p_tenant_id, v_member.id));
end;
$$;

create or replace function public.delete_team_member(
  p_tenant_id text,
  p_barber_id bigint,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.barbers%rowtype;
begin
  perform private.assert_active_tenant_owner(p_tenant_id);
  if p_barber_id is null then
    raise exception using errcode = '22023', message = 'TEAM_MEMBER_ARGUMENTS_INVALID';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_tenant_id || ':' || p_barber_id::text, 0)
  );
  select * into v_member from public.barbers as b
  where b.id = p_barber_id and b.tenant_id = p_tenant_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'TEAM_MEMBER_NOT_FOUND';
  end if;
  if p_expected_updated_at is not null and v_member.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'TEAM_MEMBER_CONFLICT';
  end if;

  -- `barbers.user_id` is a legacy business-scope mirror that references
  -- tenants(id), not auth.users. A future login-link must have its own proven
  -- foreign key before it can become a deletion blocker.
  if exists (select 1 from public.appointments where tenant_id = p_tenant_id and barber_id = p_barber_id) then
    raise exception using errcode = '23503', message = 'TEAM_MEMBER_HAS_APPOINTMENTS';
  end if;
  if exists (select 1 from public.services where tenant_id = p_tenant_id and barber_id = p_barber_id) then
    raise exception using errcode = '23503', message = 'TEAM_MEMBER_HAS_SERVICES';
  end if;
  if exists (select 1 from public.clients where tenant_id = p_tenant_id and barber_id = p_barber_id) then
    raise exception using errcode = '23503', message = 'TEAM_MEMBER_HAS_CLIENTS';
  end if;

  delete from public.working_hours where tenant_id = p_tenant_id and barber_id = p_barber_id;
  delete from public.barbers where tenant_id = p_tenant_id and id = p_barber_id;
  return jsonb_build_object('success', true);
end;
$$;

-- Replaces the existing guarded function without changing its public signature.
-- A reservation must fit entirely within one active recurring interval in the
-- tenant timezone; no schedule means unavailable.
create or replace function public.create_manual_appointment(
  p_tenant_id text,
  p_client_id bigint,
  p_barber_id bigint,
  p_scheduled_at timestamptz,
  p_service_ids bigint[],
  p_observation text default null,
  p_status text default 'confirmed'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client_name text;
  v_service_count integer;
  v_total_duration_minutes integer;
  v_total_price numeric;
  v_service_type text;
  v_end_time timestamptz;
  v_timezone text;
  v_local_start timestamp;
  v_local_end timestamp;
  v_observation text := nullif(pg_catalog.btrim(p_observation), '');
  v_status text := coalesce(pg_catalog.lower(pg_catalog.btrim(p_status)), '');
  v_appointment public.appointments%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if nullif(pg_catalog.btrim(p_tenant_id), '') is null or not public.can_access_tenant(p_tenant_id) then
    raise exception using errcode = '42501', message = 'TENANT_FORBIDDEN';
  end if;

  select coalesce(nullif(pg_catalog.btrim(t.timezone), ''), 'America/Sao_Paulo')
  into v_timezone from public.tenants as t where t.id = p_tenant_id;
  if v_timezone is null or not exists (select 1 from pg_catalog.pg_timezone_names as zone where zone.name = v_timezone) then
    raise exception using errcode = '22023', message = 'TENANT_TIMEZONE_INVALID';
  end if;
  if p_client_id is null or p_barber_id is null then
    raise exception using errcode = '22023', message = 'CLIENT_AND_BARBER_REQUIRED';
  end if;
  if p_scheduled_at is null or p_scheduled_at <= clock_timestamp() then
    raise exception using errcode = '22023', message = 'PAST_APPOINTMENT';
  end if;
  if v_status not in ('scheduled', 'confirmed') then
    raise exception using errcode = '22023', message = 'STATUS_INVALID';
  end if;
  if p_service_ids is null or cardinality(p_service_ids) not between 1 and 10 then
    raise exception using errcode = '22023', message = 'SERVICES_COUNT_INVALID';
  end if;
  if exists (select 1 from unnest(p_service_ids) as requested(service_id) group by requested.service_id having count(*) > 1) then
    raise exception using errcode = '22023', message = 'SERVICES_MUST_BE_DISTINCT';
  end if;
  if v_observation is not null and char_length(v_observation) > 1000 then
    raise exception using errcode = '22023', message = 'OBSERVATION_TOO_LONG';
  end if;

  select nullif(pg_catalog.btrim(c.name), '') into v_client_name
  from public.clients as c
  where c.id = p_client_id and c.tenant_id = p_tenant_id and c.deleted_at is null
    and coalesce(c.status, 'active') = 'active';
  if v_client_name is null then
    raise exception using errcode = '22023', message = 'CLIENT_NOT_FOUND';
  end if;
  if not exists (
    select 1 from public.barbers as b
    where b.id = p_barber_id and b.tenant_id = p_tenant_id
      and coalesce(b.active, true) and coalesce(b.status, 'active') = 'active'
  ) then
    raise exception using errcode = '22023', message = 'BARBER_NOT_FOUND';
  end if;

  select count(*)::integer,
         coalesce(sum(coalesce(nullif(s.duration_minutes, 0), nullif(s.duration, 0))), 0)::integer,
         coalesce(sum(coalesce(s.price, 0)), 0),
         string_agg(s.name, ' + ' order by requested.position)
  into v_service_count, v_total_duration_minutes, v_total_price, v_service_type
  from unnest(p_service_ids) with ordinality as requested(service_id, position)
  join public.services as s on s.id = requested.service_id and s.tenant_id = p_tenant_id
    and coalesce(s.active, true) and coalesce(s.status, 'active') = 'active'
    and (s.barber_id is null or s.barber_id = p_barber_id)
    and coalesce(nullif(s.duration_minutes, 0), nullif(s.duration, 0)) > 0;
  if v_service_count <> cardinality(p_service_ids) or v_service_type is null then
    raise exception using errcode = '22023', message = 'SERVICES_INVALID';
  end if;
  if v_total_duration_minutes not between 1 and 1440 or v_total_price < 0 or v_total_price > 1000000 then
    raise exception using errcode = '22023', message = 'SERVICES_TOTAL_INVALID';
  end if;

  v_end_time := p_scheduled_at + pg_catalog.make_interval(mins => v_total_duration_minutes);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_tenant_id || ':' || p_barber_id::text, 0));

  -- Authoritative availability check: save_team_member and set_team_member_active
  -- acquire this same key, so an inactivation cannot commit between this check
  -- and the schedule/conflict validation or appointment insert.
  if not exists (
    select 1 from public.barbers as b
    where b.id = p_barber_id and b.tenant_id = p_tenant_id
      and coalesce(b.active, true) and coalesce(b.status, 'active') = 'active'
  ) then
    raise exception using errcode = '22023', message = 'BARBER_NOT_FOUND';
  end if;

  v_local_start := p_scheduled_at at time zone v_timezone;
  v_local_end := v_end_time at time zone v_timezone;
  if v_local_start::date <> v_local_end::date or not exists (
    select 1 from public.working_hours as h
    where h.tenant_id = p_tenant_id and h.barber_id = p_barber_id and h.is_active
      and h.day_of_week = extract(dow from v_local_start)::smallint
      and h.start_time <= v_local_start::time and h.end_time >= v_local_end::time
  ) then
    raise exception using errcode = '22023', message = 'BARBER_OUTSIDE_WORKING_HOURS';
  end if;
  if exists (
    select 1 from public.appointments as a
    where a.tenant_id = p_tenant_id and a.barber_id = p_barber_id
      and a.status in ('scheduled', 'confirmed', 'pending')
      and a.scheduled_at < v_end_time and a.end_time > p_scheduled_at
  ) then
    raise exception using errcode = '23P01', message = 'APPOINTMENT_CONFLICT';
  end if;

  begin
    insert into public.appointments (
      tenant_id, shop_id, user_id, client_id, barber_id, service_id, client_name,
      service_type, date, start_time, scheduled_at, end_time, status, price, observation
    ) values (
      p_tenant_id, p_tenant_id, p_tenant_id, p_client_id, p_barber_id, p_service_ids[1],
      v_client_name, v_service_type, v_local_start::date, p_scheduled_at, p_scheduled_at,
      v_end_time, v_status, v_total_price, v_observation
    ) returning * into v_appointment;
  exception when exclusion_violation then
    raise exception using errcode = '23P01', message = 'APPOINTMENT_CONFLICT';
  end;

  insert into public.appointment_services (
    tenant_id, appointment_id, service_id, position, service_name, duration_minutes, unit_price
  )
  select p_tenant_id, v_appointment.id, requested.service_id, requested.position::integer,
         s.name, coalesce(nullif(s.duration_minutes, 0), nullif(s.duration, 0)), coalesce(s.price, 0)
  from unnest(p_service_ids) with ordinality as requested(service_id, position)
  join public.services as s on s.id = requested.service_id and s.tenant_id = p_tenant_id;

  return jsonb_build_object(
    'success', true,
    'appointment', jsonb_build_object(
      'id', v_appointment.id, 'scheduled_at', v_appointment.scheduled_at,
      'end_time', v_appointment.end_time, 'status', v_appointment.status,
      'price', v_appointment.price, 'duration_minutes', v_total_duration_minutes
    ),
    'services', (
      select coalesce(jsonb_agg(to_jsonb(items) order by items.position), '[]'::jsonb)
      from public.appointment_services as items
      where items.appointment_id = v_appointment.id and items.tenant_id = p_tenant_id
    )
  );
end;
$$;

revoke all on function private.assert_active_tenant_owner(text) from public, anon, authenticated;
revoke all on function private.validate_team_schedule(jsonb) from public, anon, authenticated;
revoke all on function private.normalize_team_specialties(text[]) from public, anon, authenticated;
revoke all on function private.team_member_payload(text, bigint) from public, anon, authenticated;
revoke all on function private.enforce_working_hours_barber_tenant() from public, anon, authenticated;
revoke all on function private.enforce_working_hours_no_overlap() from public, anon, authenticated;
revoke all on function private.lock_working_hours_scope() from public, anon, authenticated;

revoke all on function public.save_team_member(text, bigint, text, text[], text, boolean, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.set_team_member_active(text, bigint, boolean, timestamptz) from public, anon, authenticated;
revoke all on function public.delete_team_member(text, bigint, timestamptz) from public, anon, authenticated;
grant execute on function public.save_team_member(text, bigint, text, text[], text, boolean, jsonb, timestamptz) to authenticated;
grant execute on function public.set_team_member_active(text, bigint, boolean, timestamptz) to authenticated;
grant execute on function public.delete_team_member(text, bigint, timestamptz) to authenticated;

comment on function public.save_team_member(text, bigint, text, text[], text, boolean, jsonb, timestamptz) is
  'Cria ou atualiza um profissional e substitui sua jornada semanal de forma atomica; exige owner ativo do tenant.';
comment on function public.set_team_member_active(text, bigint, boolean, timestamptz) is
  'Ativa ou inativa um profissional sem remover historico; exige owner ativo do tenant.';
comment on function public.delete_team_member(text, bigint, timestamptz) is
  'Exclui profissional somente sem referencias historicas, removendo antes sua jornada semanal; exige owner ativo do tenant.';

revoke all on function public.create_manual_appointment(text, bigint, bigint, timestamptz, bigint[], text, text) from public, anon, authenticated;
grant execute on function public.create_manual_appointment(text, bigint, bigint, timestamptz, bigint[], text, text) to authenticated;

comment on function public.create_manual_appointment(text, bigint, bigint, timestamptz, bigint[], text, text) is
  'Cria agendamento manual atomico, valida conflitos e exige que todo o intervalo caiba em uma jornada ativa do profissional.';
