-- Secure support edits for the admin console.
create or replace function public.admin_update_user_support(
  p_user_id uuid,
  p_full_name text,
  p_barbershop_name text,
  p_phone text,
  p_business_address text,
  p_business_hours text,
  p_ai_assistant_name text,
  p_greeting text,
  p_instructions text
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_tenant_id text;
  v_old_profile public.profiles%rowtype;
  v_new_profile public.profiles%rowtype;
  v_old_config jsonb;
  v_new_config jsonb;
  v_changed_by text := auth.uid()::text;
begin
  if not private.is_admin() then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;
  if p_user_id is null then raise exception using errcode = '22023', message = 'USER_REQUIRED'; end if;

  if p_full_name is not null and char_length(pg_catalog.btrim(p_full_name)) > 120
    or p_barbershop_name is not null and char_length(pg_catalog.btrim(p_barbershop_name)) > 120
    or p_phone is not null and char_length(pg_catalog.btrim(p_phone)) > 32
    or p_business_address is not null and char_length(pg_catalog.btrim(p_business_address)) > 240
    or p_business_hours is not null and char_length(pg_catalog.btrim(p_business_hours)) > 2000
    or p_ai_assistant_name is not null and char_length(pg_catalog.btrim(p_ai_assistant_name)) > 80
    or p_greeting is not null and char_length(pg_catalog.btrim(p_greeting)) > 500
    or p_instructions is not null and char_length(pg_catalog.btrim(p_instructions)) > 4000 then
    raise exception using errcode = '22023', message = 'SUPPORT_FIELD_TOO_LONG';
  end if;

  select t.id into v_tenant_id from public.tenants t
  where t.owner_user_id = p_user_id order by t.created_at desc limit 1;

  select * into v_old_profile from public.profiles p where p.id = p_user_id for update;
  if not found then raise exception using errcode = '22023', message = 'PROFILE_NOT_FOUND'; end if;

  select to_jsonb(c) - 'metadata' - 'instance_name' into v_old_config
  from public.agente_config c where c.tenant_id = v_tenant_id order by c.updated_at desc limit 1;

  update public.profiles
  set full_name = coalesce(nullif(pg_catalog.btrim(p_full_name), ''), full_name),
      barbershop_name = coalesce(nullif(pg_catalog.btrim(p_barbershop_name), ''), barbershop_name),
      phone = case when p_phone is null then phone else nullif(pg_catalog.btrim(p_phone), '') end,
      business_address = case when p_business_address is null then business_address else nullif(pg_catalog.btrim(p_business_address), '') end,
      business_hours = case when p_business_hours is null then business_hours else nullif(pg_catalog.btrim(p_business_hours), '') end,
      ai_assistant_name = case when p_ai_assistant_name is null then ai_assistant_name else nullif(pg_catalog.btrim(p_ai_assistant_name), '') end,
      updated_at = clock_timestamp()
  where id = p_user_id returning * into v_new_profile;

  if v_tenant_id is not null then
    update public.tenants
    set company_name = coalesce(nullif(pg_catalog.btrim(p_barbershop_name), ''), company_name),
        owner_phone = case when p_phone is null then owner_phone else nullif(pg_catalog.btrim(p_phone), '') end,
        updated_at = clock_timestamp()
    where id = v_tenant_id;

    if exists (select 1 from public.agente_config c where c.tenant_id = v_tenant_id) then
      update public.agente_config
      set nome_ia = coalesce(nullif(pg_catalog.btrim(p_ai_assistant_name), ''), nome_ia),
          ai_name = case when p_ai_assistant_name is null then ai_name else nullif(pg_catalog.btrim(p_ai_assistant_name), '') end,
          saudacao = case when p_greeting is null then saudacao else nullif(pg_catalog.btrim(p_greeting), '') end,
          greeting = case when p_greeting is null then greeting else nullif(pg_catalog.btrim(p_greeting), '') end,
          instructions = case when p_instructions is null then instructions else nullif(pg_catalog.btrim(p_instructions), '') end,
          updated_at = clock_timestamp()
      where tenant_id = v_tenant_id;
    end if;
  end if;

  select to_jsonb(c) - 'metadata' - 'instance_name' into v_new_config
  from public.agente_config c where c.tenant_id = v_tenant_id order by c.updated_at desc limit 1;

  if v_tenant_id is not null then
    insert into public.audit_logs (
      tenant_id, shop_id, user_id, table_name, record_id, action,
      old_data, new_data, changed_by, changed_at, created_at, updated_at
    ) values (
      v_tenant_id, v_tenant_id, v_tenant_id, 'admin_support', p_user_id::text,
      'UPDATE_SUPPORT_FIELDS',
      jsonb_build_object('profile', to_jsonb(v_old_profile), 'configuration', v_old_config),
      jsonb_build_object('profile', to_jsonb(v_new_profile), 'configuration', v_new_config),
      v_changed_by, clock_timestamp(), clock_timestamp(), clock_timestamp()
    );
  end if;

  return jsonb_build_object('success', true, 'user_id', p_user_id, 'tenant_id', v_tenant_id, 'profile', to_jsonb(v_new_profile), 'configuration', v_new_config);
end;
$$;
revoke all on function public.admin_update_user_support(uuid, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.admin_update_user_support(uuid, text, text, text, text, text, text, text, text) to authenticated;
