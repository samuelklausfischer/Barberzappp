-- Admin control plane for BarberZap.
create table if not exists private.admin_email_allowlist (
  email text primary key,
  role text not null default 'admin',
  created_at timestamptz not null default clock_timestamp(),
  constraint admin_email_allowlist_email_check check (email = lower(btrim(email)))
);
alter table private.admin_email_allowlist enable row level security;
revoke all on table private.admin_email_allowlist from public, anon, authenticated;
insert into private.admin_email_allowlist (email, role)
values ('samuelklausfischer@admin.com', 'admin')
on conflict (email) do update set role = excluded.role;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = pg_catalog, auth
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false); $$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.assign_admin_claim()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_role text;
begin
  select a.role into v_role from private.admin_email_allowlist a
  where a.email = pg_catalog.lower(pg_catalog.btrim(new.email));
  if v_role is not null then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role),
        updated_at = clock_timestamp()
    where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function private.assign_admin_claim() from public, anon, authenticated;
drop trigger if exists trg_assign_admin_claim on auth.users;
create trigger trg_assign_admin_claim after insert on auth.users
for each row execute function private.assign_admin_claim();

update auth.users as u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', a.role),
    updated_at = clock_timestamp()
from private.admin_email_allowlist a
where pg_catalog.lower(u.email) = a.email;

create or replace function public.admin_get_overview(p_search text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_search text := nullif(pg_catalog.btrim(p_search), '');
begin
  if not private.is_admin() then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;
  return jsonb_build_object(
    'users', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id,
        'name', coalesce(nullif(pg_catalog.btrim(p.full_name), ''), nullif(pg_catalog.btrim(p.barbershop_name), ''), 'Usuário'),
        'email', u.email,
        'created_at', u.created_at,
        'trial_status', case
          when t.subscription_status = 'trialing' and t.trial_ends_at is not null and t.trial_ends_at > clock_timestamp() then 'active'
          when t.trial_ends_at is not null then 'expired' else 'none' end,
        'trial_ends_at', t.trial_ends_at,
        'subscription_status', case when t.subscription_status in ('active', 'paid') then 'active' when t.subscription_status = 'past_due' then 'past_due' else 'inactive' end,
        'subscription_started_at', null,
        'whatsapp_connected',
          coalesce(lower(t.whatsapp_status) in ('connected', 'online', 'ready', 'open'), false)
          or exists (select 1 from public.whatsapp_instances wi where wi.tenant_id = t.id and lower(wi.status) in ('connected', 'online', 'ready', 'open'))
          or exists (select 1 from public.whatsapp_connections wc where wc.tenant_id = t.id and lower(wc.status) in ('connected', 'online', 'ready', 'open')),
        'tenant_id', t.id,
        'barbershop_name', coalesce(t.company_name, p.barbershop_name),
        'configuration', jsonb_build_object(
          'full_name', p.full_name, 'barbershop_name', p.barbershop_name, 'phone', p.phone,
          'business_address', p.business_address, 'business_hours', p.business_hours,
          'ai_assistant_name', p.ai_assistant_name,
          'services_count', (select count(*) from public.services s where s.tenant_id = t.id),
          'barbers_count', (select count(*) from public.barbers b where b.tenant_id = t.id)
        )
      ) order by u.created_at desc)
      from auth.users u
      left join public.profiles p on p.id = u.id
      left join lateral (select t.* from public.tenants t where t.owner_user_id = u.id order by t.created_at desc limit 1) t on true
      where v_search is null or u.email ilike '%' || v_search || '%' or p.full_name ilike '%' || v_search || '%' or p.barbershop_name ilike '%' || v_search || '%'
    ), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id::text,
        'barber_shop_name', coalesce(l.name, l.client_name, 'Barbearia sem nome'),
        'city', coalesce(l.city, 'Cidade não informada'),
        'status', case
          when exists (select 1 from public.message_outbox mo where mo.lead_id = l.id and lower(mo.status) = 'failed') then 'failed'
          when l.interest_score > 0 then 'interested'
          when l.messages_received > 0 then 'replied'
          when l.messages_sent > 0 then 'sent'
          else 'pending' end,
        'dispatched_at', l.last_contact_at
      ) order by l.updated_at desc)
      from public.crm_leads l
    ), '[]'::jsonb),
    'metrics', jsonb_build_object(
      'total_users', (select count(*) from auth.users),
      'active_trials', (select count(*) from public.tenants where subscription_status = 'trialing' and trial_ends_at > clock_timestamp()),
      'subscribers', (select count(*) from public.tenants where subscription_status in ('active', 'paid')),
      'connected_whatsapp', (select count(*) from public.tenants t where lower(t.whatsapp_status) in ('connected', 'online', 'ready', 'open') or exists (select 1 from public.whatsapp_instances wi where wi.tenant_id = t.id and lower(wi.status) in ('connected', 'online', 'ready', 'open'))),
      'pending_campaigns', (select count(*) from public.crm_leads where messages_sent = 0),
      'interested_leads', (select count(*) from public.crm_leads where interest_score > 0)
    )
  );
end;
$$;
revoke all on function public.admin_get_overview(text) from public, anon, authenticated;
grant execute on function public.admin_get_overview(text) to authenticated;

create or replace function public.admin_get_user_details(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_tenant_id text;
begin
  if not private.is_admin() then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;
  select t.id into v_tenant_id from public.tenants t where t.owner_user_id = p_user_id order by t.created_at desc limit 1;
  return jsonb_build_object(
    'user', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at) from auth.users u where u.id = p_user_id),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = p_user_id),
    'tenant', (select to_jsonb(t) from public.tenants t where t.id = v_tenant_id),
    'configuration', (select to_jsonb(c) - 'metadata' - 'instance_name' from public.agente_config c where c.tenant_id = v_tenant_id order by c.updated_at desc limit 1),
    'services', coalesce((select jsonb_agg(to_jsonb(s) order by s.name) from public.services s where s.tenant_id = v_tenant_id), '[]'::jsonb),
    'barbers', coalesce((select jsonb_agg(to_jsonb(b) order by b.name) from public.barbers b where b.tenant_id = v_tenant_id), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_get_user_details(uuid) from public, anon, authenticated;
grant execute on function public.admin_get_user_details(uuid) to authenticated;
