-- Keep generic tenant creation compatible with the guarded trial lifecycle.
-- A trial is created only by register_trial_workspace, which supplies both dates.

alter table public.tenants
  alter column subscription_status set default 'incomplete';

create or replace function public.sync_business_scope()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  new.tenant_id := coalesce(
    nullif(new.tenant_id, ''),
    nullif(new.shop_id, ''),
    nullif(new.user_id, '')
  );
  new.shop_id := new.tenant_id;
  new.user_id := new.tenant_id;

  if new.tenant_id is not null
    and not exists (
      select 1
      from public.tenants t
      where t.id = new.tenant_id
    ) then
    insert into public.tenants (
      id,
      company_name,
      subscription_status,
      is_active
    ) values (
      new.tenant_id,
      initcap(replace(new.tenant_id, '_', ' ')),
      'incomplete',
      false
    )
    on conflict (id) do nothing;
  end if;

  if to_jsonb(new) ? 'created_at' then
    new.created_at := coalesce(new.created_at, clock_timestamp());
  end if;

  if to_jsonb(new) ? 'updated_at' then
    new.updated_at := clock_timestamp();
  end if;

  return new;
end;
$$;
