-- BarberZap canonical schema rebuild
-- Source of truth for the reset database.
-- Business scope keys are stored as text so the Python backend can use
-- tenant ids such as "prospection" while the SaaS keeps using tenant_id.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function sync_business_scope()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.tenant_id := coalesce(nullif(new.tenant_id, ''), nullif(new.shop_id, ''), nullif(new.user_id, ''));
  new.shop_id := new.tenant_id;
  new.user_id := new.tenant_id;

  if new.tenant_id is not null then
    insert into tenants (id, company_name, is_active)
    values (new.tenant_id, initcap(replace(new.tenant_id, '_', ' ')), true)
    on conflict (id) do nothing;
  end if;

  if to_jsonb(new) ? 'created_at' then
    new.created_at := coalesce(new.created_at, now());
  end if;

  if to_jsonb(new) ? 'updated_at' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

create or replace function can_access_tenant(p_tenant_id text)
returns boolean
language sql
stable
security invoker
as $$
  select
    p_tenant_id is not null
    and (
      exists (
        select 1
        from tenants t
        where t.id = p_tenant_id
          and t.owner_user_id = auth.uid()
      )
      or exists (
        select 1
        from tenant_memberships tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
          and tm.status = 'active'
      )
    );
$$;

-- ------------------------------------------------------------
-- Core identity and tenancy
-- ------------------------------------------------------------

create table if not exists tenants (
  id text primary key,
  company_name text not null,
  email text,
  owner_email text,
  owner_phone text,
  owner_user_id uuid references auth.users(id) on delete set null,
  subscription_status text default 'trial',
  subscription_id text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  is_active boolean not null default true,
  prompt_tone text,
  prompt_business_rules text,
  business_hours jsonb,
  whatsapp_status text default 'disconnected',
  timezone text default 'America/Sao_Paulo',
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  barbershop_name text,
  full_name text,
  email text,
  phone text,
  updated_at timestamptz not null default now(),
  ai_assistant_name text,
  business_address text,
  business_hours text,
  subscription_status text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table tenants add column if not exists trial_started_at timestamptz;
alter table tenants add column if not exists trial_ends_at timestamptz;
alter table profiles add column if not exists trial_started_at timestamptz;
alter table profiles add column if not exists trial_ends_at timestamptz;

create table if not exists tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_tenant_memberships_user_id on tenant_memberships(user_id);
create index if not exists idx_tenant_memberships_tenant_id on tenant_memberships(tenant_id);
create index if not exists idx_tenant_memberships_status on tenant_memberships(status);

create or replace function create_trial_workspace(
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

  insert into tenant_memberships (
    tenant_id,
    user_id,
    role,
    status
  )
  values (
    v_tenant_id,
    v_user_id,
    'owner',
    'active'
  );

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

revoke all on function create_trial_workspace(text, text, text) from public;
grant execute on function create_trial_workspace(text, text, text) to authenticated;

-- ------------------------------------------------------------
-- Operational configuration
-- ------------------------------------------------------------

create table if not exists agente_config (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null unique references tenants(id) on delete cascade,
  barber_name text not null,
  nome_barbearia text,
  name text,
  endereco text,
  address text,
  horarios text,
  horario_funcionamento text,
  hours text,
  nome_ia text not null default 'Ana',
  ai_name text,
  saudacao text,
  greeting text,
  instructions text,
  phone text,
  whatsapp text,
  email text,
  status text not null default 'active',
  instance_name text,
  logo_url text,
  ai_enabled boolean not null default true,
  language text default 'pt-BR',
  timezone text default 'America/Sao_Paulo',
  model text default 'gpt-4o-mini',
  temperature numeric(3,2) default 0.70,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists whatsapp_instances (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  instance_name text not null unique,
  display_name text,
  phone_number text,
  status text not null default 'pending',
  api_key text,
  webhook_url text,
  qrcode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_instances_tenant_id on whatsapp_instances(tenant_id);
create index if not exists idx_whatsapp_instances_user_id on whatsapp_instances(user_id);
create index if not exists idx_whatsapp_instances_status on whatsapp_instances(status);

create table if not exists barbers (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  name text not null,
  specialties text[],
  bio text,
  photo_url text,
  active boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_barbers_tenant_id on barbers(tenant_id);
create index if not exists idx_barbers_user_id on barbers(user_id);
create index if not exists idx_barbers_status on barbers(status);

create table if not exists services (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  barber_id bigint references barbers(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2),
  duration integer,
  duration_minutes integer,
  image_url text,
  active boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_tenant_id on services(tenant_id);
create index if not exists idx_services_user_id on services(user_id);
create index if not exists idx_services_barber_id on services(barber_id);
create index if not exists idx_services_status on services(status);

create table if not exists clients (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  barber_id bigint references barbers(id) on delete set null,
  name text,
  phone text,
  phone_number text,
  email text,
  avatar_url text,
  notes text,
  status text not null default 'active',
  total_visits integer not null default 0,
  last_visit_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_tenant_phone on clients(tenant_id, phone_number);
create index if not exists idx_clients_tenant_created_at on clients(tenant_id, created_at desc);
create index if not exists idx_clients_barber_id on clients(barber_id);

create table if not exists working_hours (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  barber_id bigint references barbers(id) on delete set null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  is_active boolean not null default true,
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_working_hours_tenant on working_hours(tenant_id);
create index if not exists idx_working_hours_barber on working_hours(barber_id);

create table if not exists employees (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  specialties text[],
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employees_tenant_id on employees(tenant_id);
create index if not exists idx_employees_user_id on employees(user_id);

create table if not exists appointments (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  client_id bigint references clients(id) on delete set null,
  barber_id bigint references barbers(id) on delete set null,
  service_id bigint references services(id) on delete set null,
  employee_id bigint references employees(id) on delete set null,
  remote_jid text,
  client_name text,
  service_type text,
  date date,
  start_time timestamptz,
  scheduled_at timestamptz,
  end_time timestamptz,
  status text not null default 'scheduled',
  price numeric(10,2),
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_appointments_tenant_status on appointments(tenant_id, status, scheduled_at desc);
create index if not exists idx_appointments_client on appointments(client_id);
create index if not exists idx_appointments_barber on appointments(barber_id);
create index if not exists idx_appointments_service on appointments(service_id);

-- ------------------------------------------------------------
-- CRM and chat memory
-- ------------------------------------------------------------

create table if not exists crm_leads (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  phone text,
  client_phone text not null,
  name text,
  client_name text,
  email text,
  status text not null default 'new',
  kanban_stage text not null default 'new',
  lead_source text not null default 'whatsapp',
  source text,
  funnel_stage text not null default 'new',
  plan text,
  is_ai_muted boolean not null default false,
  ai_enabled boolean not null default true,
  tags jsonb not null default '[]'::jsonb,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  messages_sent integer not null default 0,
  messages_received integer not null default 0,
  response_rate numeric(5,2) not null default 0,
  interest_score integer not null default 0,
  assigned_to text,
  loss_reason text,
  next_followup_at timestamptz,
  followup_count integer not null default 0,
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  last_message_at timestamptz,
  last_status_change timestamptz,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_crm_leads_tenant_phone on crm_leads(tenant_id, client_phone);
create index if not exists idx_crm_leads_tenant_stage on crm_leads(tenant_id, kanban_stage);
create index if not exists idx_crm_leads_tenant_source on crm_leads(tenant_id, lead_source);
create index if not exists idx_crm_leads_next_followup on crm_leads(next_followup_at) where next_followup_at is not null;
create index if not exists idx_crm_leads_last_message on crm_leads(last_message_at desc);

create table if not exists crm_messages (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  lead_id bigint references crm_leads(id) on delete set null,
  phone text,
  client_phone text,
  sender text,
  sender_type text not null default 'user',
  role text,
  direction text not null default 'inbound',
  content text,
  message text,
  response text,
  media_url text,
  status text not null default 'received',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_messages_tenant_lead on crm_messages(tenant_id, lead_id);
create index if not exists idx_crm_messages_tenant_phone on crm_messages(tenant_id, client_phone);
create index if not exists idx_crm_messages_created_at on crm_messages(created_at desc);
create index if not exists idx_crm_messages_direction on crm_messages(direction);

create table if not exists chat_memory (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  session_key text not null,
  remote_jid text,
  phone text not null,
  role text not null,
  message_role text,
  message text not null,
  message_content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chat_memory_session_key on chat_memory(session_key);
create index if not exists idx_chat_memory_tenant_phone on chat_memory(tenant_id, phone);
create index if not exists idx_chat_memory_created_at on chat_memory(created_at desc);

create table if not exists plans (
  id bigint generated by default as identity primary key,
  tenant_id text,
  shop_id text,
  user_id text,
  name text not null unique,
  price numeric not null,
  currency text not null default 'BRL',
  features jsonb,
  description text,
  checkout_url text,
  cakto_link_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversation_reviews (
  id bigint generated by default as identity primary key,
  tenant_id text,
  shop_id text,
  user_id text,
  lead_id bigint references crm_leads(id) on delete set null,
  rating integer check (rating between 1 and 5),
  feedback text,
  issues jsonb,
  reviewed_at timestamptz not null default now(),
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversation_reviews_lead_id on conversation_reviews(lead_id);

-- ------------------------------------------------------------
-- Operational support tables
-- ------------------------------------------------------------

create table if not exists notifications (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notifications_tenant_id on notifications(tenant_id);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_unread on notifications(user_id) where read_at is null;

create table if not exists audit_logs (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  table_name text not null,
  record_id text,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by text,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_tenant_id on audit_logs(tenant_id);
create index if not exists idx_audit_logs_changed_at on audit_logs(changed_at desc);

create table if not exists webhook_logs (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  source text not null,
  event_type text,
  payload jsonb not null default '{}'::jsonb,
  response jsonb,
  status_code integer,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_webhook_logs_tenant_id on webhook_logs(tenant_id);
create index if not exists idx_webhook_logs_created_at on webhook_logs(created_at desc);

create table if not exists appointment_reminders (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  appointment_id bigint references appointments(id) on delete cascade,
  channel text not null default 'whatsapp',
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending',
  attempts integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_appointment_reminders_tenant_id on appointment_reminders(tenant_id);
create index if not exists idx_appointment_reminders_scheduled_at on appointment_reminders(scheduled_at);

create table if not exists appointment_outbox (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  appointment_id bigint references appointments(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  scheduled_for timestamptz,
  sent_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_appointment_outbox_tenant_id on appointment_outbox(tenant_id);
create index if not exists idx_appointment_outbox_status on appointment_outbox(status, created_at desc);

create table if not exists message_outbox (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  lead_id bigint references crm_leads(id) on delete set null,
  instance_name text,
  to_phone text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  scheduled_for timestamptz,
  sent_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_message_outbox_tenant_id on message_outbox(tenant_id);
create index if not exists idx_message_outbox_status on message_outbox(status, created_at desc);

create table if not exists client_notification_preferences (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  client_id bigint references clients(id) on delete cascade,
  appointment_reminders boolean not null default true,
  promotional_messages boolean not null default true,
  channel_preference text default 'whatsapp',
  quiet_hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shop_notification_defaults (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  default_channel text default 'whatsapp',
  reminders_enabled boolean not null default true,
  promo_enabled boolean not null default true,
  reminder_minutes_before integer not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_queue (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  target_type text not null,
  target_id text,
  channel text not null default 'whatsapp',
  template_name text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  scheduled_for timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_templates (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  name text not null,
  channel text not null default 'whatsapp',
  subject text,
  body text not null,
  variables jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_notification_templates_tenant_name on notification_templates(tenant_id, name);

create table if not exists notification_logs (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  queue_id bigint references notification_queue(id) on delete set null,
  status text not null,
  channel text not null default 'whatsapp',
  provider_message_id text,
  payload jsonb,
  response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists client_calendars (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  client_id bigint references clients(id) on delete cascade,
  provider text not null default 'google',
  external_calendar_id text,
  sync_enabled boolean not null default true,
  sync_token text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists calendar_sync_events (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  client_calendar_id bigint references client_calendars(id) on delete cascade,
  event_type text not null,
  external_event_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists calendar_webhooks (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  provider text not null default 'google',
  webhook_url text not null,
  secret text,
  status text not null default 'active',
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shop_themes (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  theme_name text not null,
  primary_color text,
  secondary_color text,
  accent_color text,
  logo_url text,
  custom_css text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists theme_presets (
  id bigint generated by default as identity primary key,
  tenant_id text,
  shop_id text,
  user_id text,
  name text not null unique,
  description text,
  preset jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists api_versions (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  service_name text not null,
  version text not null,
  status text not null default 'active',
  schema_version text,
  deployed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists search_analytics (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  query text not null,
  query_type text,
  results_count integer not null default 0,
  clicked_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists search_history (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  query text not null,
  query_type text,
  search_count integer not null default 1,
  last_searched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, query)
);

create table if not exists magic_links (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verification_codes (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  contact text not null,
  code text not null,
  purpose text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists client_session_tokens (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  client_id bigint references clients(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cache_entries (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  cache_key text not null unique,
  cache_value jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id bigint generated by default as identity primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  shop_id text not null,
  user_id text not null references tenants(id) on delete cascade,
  actor text,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare
  tbl text;
  support_tables text[] := array[
    'plans',
    'conversation_reviews',
    'notifications',
    'audit_logs',
    'webhook_logs',
    'appointment_reminders',
    'appointment_outbox',
    'message_outbox',
    'client_notification_preferences',
    'shop_notification_defaults',
    'notification_queue',
    'notification_templates',
    'notification_logs',
    'client_calendars',
    'calendar_sync_events',
    'calendar_webhooks',
    'shop_themes',
    'theme_presets',
    'api_versions',
    'search_analytics',
    'search_history',
    'magic_links',
    'verification_codes',
    'client_session_tokens',
    'password_reset_tokens',
    'cache_entries',
    'activity_logs'
  ];
begin
  foreach tbl in array support_tables loop
    execute format('drop trigger if exists %I on %I', 'trg_' || tbl || '_scope', tbl);
    execute format('create trigger %I before insert or update on %I for each row execute function sync_business_scope()', 'trg_' || tbl || '_scope', tbl);
    execute format('drop trigger if exists %I on %I', 'trg_' || tbl || '_touch', tbl);
    execute format('create trigger %I before update on %I for each row execute function set_updated_at()', 'trg_' || tbl || '_touch', tbl);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Compatibility views
-- ------------------------------------------------------------

create or replace view agents_config with (security_invoker = true) as
select
  id,
  tenant_id,
  shop_id,
  user_id,
  barber_name as nome_barbearia,
  barber_name,
  coalesce(name, barber_name) as name,
  endereco,
  address,
  coalesce(horarios, horario_funcionamento, hours) as horarios,
  horario_funcionamento,
  hours,
  nome_ia,
  coalesce(ai_name, nome_ia) as ai_name,
  saudacao,
  coalesce(greeting, saudacao) as greeting,
  instructions,
  phone,
  whatsapp,
  email,
  status,
  instance_name,
  logo_url,
  ai_enabled,
  language,
  timezone,
  model,
  temperature,
  metadata,
  created_at,
  updated_at
from agente_config;

create or replace view whatsapp_connections with (security_invoker = true) as
select
  id,
  tenant_id,
  instance_name,
  coalesce(display_name, instance_name) as display_name,
  phone_number,
  status,
  created_at,
  updated_at
from whatsapp_instances;

create or replace view leads with (security_invoker = true) as
select
  id,
  tenant_id,
  shop_id,
  user_id,
  coalesce(client_phone, phone) as phone,
  coalesce(client_name, name) as name,
  email,
  coalesce(kanban_stage, status) as status,
  plan,
  is_ai_muted,
  created_at,
  updated_at
from crm_leads;

create or replace view messages with (security_invoker = true) as
select
  id,
  tenant_id,
  shop_id,
  user_id,
  lead_id,
  coalesce(client_phone, phone) as phone,
  coalesce(sender_type, sender) as sender_type,
  coalesce(role, sender_type, sender) as role,
  coalesce(content, message, response) as content,
  direction,
  media_url,
  metadata,
  created_at
from crm_messages;

create or replace view chat_memoria_v4 with (security_invoker = true) as
select
  id,
  session_key,
  tenant_id,
  phone,
  coalesce(message_role, role) as role,
  coalesce(message_content, message) as message,
  metadata,
  created_at
from chat_memory;

create or replace view crm_leads_with_last_message with (security_invoker = true) as
select
  l.id,
  l.tenant_id,
  l.shop_id,
  l.user_id,
  l.client_phone,
  l.client_name,
  l.email,
  l.status,
  l.kanban_stage,
  l.notes,
  l.created_at,
  l.updated_at,
  m.content as last_message,
  m.created_at as last_message_at,
  m.direction as last_message_direction,
  count(msg.id) as message_count
from crm_leads l
left join lateral (
  select id, content, created_at, direction
  from crm_messages
  where lead_id = l.id
  order by created_at desc
  limit 1
) m on true
left join crm_messages msg on msg.lead_id = l.id
group by
  l.id, l.tenant_id, l.shop_id, l.user_id, l.client_phone, l.client_name, l.email,
  l.status, l.kanban_stage, l.notes, l.created_at, l.updated_at,
  m.content, m.created_at, m.direction
order by l.updated_at desc;

create or replace view crm_prospection_summary with (security_invoker = true) as
with scope as (
  select nullif(current_setting('app.current_tenant_id', true), '') as tenant_id
),
base as (
  select *
  from crm_leads
  where (
    (select tenant_id from scope) is null
    or tenant_id = (select tenant_id from scope)
  )
)
select
  count(*) as total_count,
  count(*) filter (where lead_source = 'prospection_csv') as csv_count,
  count(*) filter (where lead_source = 'whatsapp') as whatsapp_count,
  count(*) filter (where lead_source = 'landing_page') as lp_count,
  count(*) filter (where funnel_stage = 'new') as needs_first_contact,
  count(*) filter (
    where funnel_stage = 'considering'
      and next_followup_at is not null
      and next_followup_at <= now()
  ) as needs_followup,
  count(*) filter (where funnel_stage = 'demo_requested') as needs_demo_scheduling,
  count(*) filter (where funnel_stage = 'unresponsive') as unresponsive
from base;

create or replace view crm_prospection_funnel with (security_invoker = true) as
with scope as (
  select nullif(current_setting('app.current_tenant_id', true), '') as tenant_id
),
base as (
  select *
  from crm_leads
  where (
    (select tenant_id from scope) is null
    or tenant_id = (select tenant_id from scope)
  )
)
select
  funnel_stage,
  count(*) as lead_count,
  round(count(*) * 100.0 / nullif((select count(*) from base), 0), 1) as percentage_of_total,
  avg(messages_sent) as avg_messages_sent,
  avg(messages_received) as avg_messages_received,
  avg(response_rate) as avg_response_rate,
  round(avg(extract(epoch from (last_status_change - created_at)) / 86400), 1) as avg_days_in_stage,
  min(created_at) as earliest_created,
  max(created_at) as latest_created
from base
group by funnel_stage
order by
  case funnel_stage
    when 'new' then 1
    when 'contacted' then 2
    when 'responded' then 3
    when 'interested' then 4
    when 'demo_requested' then 5
    when 'demo_scheduled' then 6
    when 'considering' then 7
    when 'customer' then 8
    when 'active' then 8
    when 'not_interested' then 9
    when 'unresponsive' then 10
    when 'failed' then 11
    when 'lost' then 12
    else 99
  end;

create or replace view crm_leads_needs_followup with (security_invoker = true) as
select
  l.id as lead_id,
  l.tenant_id,
  l.shop_id,
  l.user_id,
  l.client_name as name,
  l.client_phone as phone,
  l.city,
  l.funnel_stage,
  l.messages_sent,
  l.messages_received,
  l.response_rate,
  l.next_followup_at,
  l.last_contact_at,
  l.followup_count,
  case
    when l.funnel_stage = 'new' then 'send_first_contact'
    when l.funnel_stage = 'contacted' and l.messages_sent >= 3 and l.messages_received = 0 then 'mark_unresponsive'
    when l.funnel_stage = 'considering' and l.next_followup_at is not null and l.next_followup_at <= now() then 'send_followup'
    when l.funnel_stage = 'demo_requested' then 'schedule_demo'
    when l.funnel_stage = 'interested' and (now() - coalesce(l.last_contact_at, l.created_at)) > interval '3 days' then 're_engage'
    else null
  end as suggested_action,
  case
    when l.next_followup_at is not null and l.next_followup_at <= now() then 'urgent'
    when l.next_followup_at is not null and l.next_followup_at <= now() + interval '1 day' then 'today'
    when l.funnel_stage = 'new' and l.messages_sent = 0 then 'high'
    when l.funnel_stage in ('interested', 'demo_requested') then 'high'
    when l.funnel_stage = 'considering' then 'medium'
    when l.funnel_stage = 'unresponsive' then 'low'
    else 'normal'
  end as priority,
  extract(day from (now() - coalesce(l.last_contact_at, l.created_at))) as days_since_contact
from crm_leads l
where (
  coalesce(current_setting('app.current_tenant_id', true), '') = ''
  or l.tenant_id = current_setting('app.current_tenant_id', true)
)
and (
  l.funnel_stage = 'new'
  or (
    l.funnel_stage = 'considering'
    and l.next_followup_at is not null
    and l.next_followup_at <= now() + interval '2 days'
  )
  or l.funnel_stage = 'demo_requested'
  or (
    l.funnel_stage = 'interested'
    and (now() - coalesce(l.last_contact_at, l.created_at)) > interval '3 days'
  )
);

-- ------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------

drop trigger if exists trg_tenants_updated_at on tenants;
create trigger trg_tenants_updated_at
before update on tenants
for each row execute function set_updated_at();

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists trg_tenant_memberships_updated_at on tenant_memberships;
create trigger trg_tenant_memberships_updated_at
before update on tenant_memberships
for each row execute function set_updated_at();

drop trigger if exists trg_agente_config_sync on agente_config;
create trigger trg_agente_config_sync
before insert or update on agente_config
for each row execute function sync_business_scope();

create or replace function normalize_agente_config()
returns trigger
language plpgsql
as $$
begin
  new.barber_name := coalesce(new.barber_name, new.nome_barbearia, new.name);
  new.nome_barbearia := coalesce(new.nome_barbearia, new.barber_name, new.name);
  new.name := coalesce(new.name, new.barber_name, new.nome_barbearia);

  new.endereco := coalesce(new.endereco, new.address);
  new.address := coalesce(new.address, new.endereco);

  new.horarios := coalesce(new.horarios, new.horario_funcionamento, new.hours);
  new.horario_funcionamento := coalesce(new.horario_funcionamento, new.horarios, new.hours);
  new.hours := coalesce(new.hours, new.horarios, new.horario_funcionamento);

  new.nome_ia := coalesce(new.nome_ia, new.ai_name, 'Ana');
  new.ai_name := coalesce(new.ai_name, new.nome_ia, 'Ana');

  new.saudacao := coalesce(new.saudacao, new.greeting);
  new.greeting := coalesce(new.greeting, new.saudacao);

  new.status := coalesce(new.status, 'active');
  new.ai_enabled := coalesce(new.ai_enabled, true);
  new.language := coalesce(new.language, 'pt-BR');
  new.timezone := coalesce(new.timezone, 'America/Sao_Paulo');
  new.model := coalesce(new.model, 'gpt-4o-mini');
  new.temperature := coalesce(new.temperature, 0.70);
  new.metadata := coalesce(new.metadata, '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists trg_agente_config_normalize on agente_config;
create trigger trg_agente_config_normalize
before insert or update on agente_config
for each row execute function normalize_agente_config();

drop trigger if exists trg_agente_config_touch on agente_config;
create trigger trg_agente_config_touch
before update on agente_config
for each row execute function set_updated_at();

create or replace function normalize_whatsapp_instances()
returns trigger
language plpgsql
as $$
begin
  new.display_name := coalesce(new.display_name, new.instance_name);
  new.status := coalesce(new.status, 'pending');
  return new;
end;
$$;

drop trigger if exists trg_whatsapp_instances_scope on whatsapp_instances;
create trigger trg_whatsapp_instances_scope
before insert or update on whatsapp_instances
for each row execute function sync_business_scope();

drop trigger if exists trg_whatsapp_instances_normalize on whatsapp_instances;
create trigger trg_whatsapp_instances_normalize
before insert or update on whatsapp_instances
for each row execute function normalize_whatsapp_instances();

drop trigger if exists trg_whatsapp_instances_touch on whatsapp_instances;
create trigger trg_whatsapp_instances_touch
before update on whatsapp_instances
for each row execute function set_updated_at();

create or replace function normalize_barbers()
returns trigger
language plpgsql
as $$
begin
  new.active := coalesce(new.active, new.status = 'active', true);
  new.status := case when coalesce(new.active, true) then coalesce(new.status, 'active') else coalesce(new.status, 'inactive') end;
  return new;
end;
$$;

drop trigger if exists trg_barbers_scope on barbers;
create trigger trg_barbers_scope
before insert or update on barbers
for each row execute function sync_business_scope();

drop trigger if exists trg_barbers_normalize on barbers;
create trigger trg_barbers_normalize
before insert or update on barbers
for each row execute function normalize_barbers();

drop trigger if exists trg_barbers_touch on barbers;
create trigger trg_barbers_touch
before update on barbers
for each row execute function set_updated_at();

create or replace function normalize_services()
returns trigger
language plpgsql
as $$
begin
  new.duration_minutes := coalesce(new.duration_minutes, new.duration);
  new.duration := coalesce(new.duration, new.duration_minutes);
  new.active := coalesce(new.active, new.status = 'active', true);
  new.status := case when coalesce(new.active, true) then coalesce(new.status, 'active') else coalesce(new.status, 'inactive') end;
  return new;
end;
$$;

drop trigger if exists trg_services_scope on services;
create trigger trg_services_scope
before insert or update on services
for each row execute function sync_business_scope();

drop trigger if exists trg_services_normalize on services;
create trigger trg_services_normalize
before insert or update on services
for each row execute function normalize_services();

drop trigger if exists trg_services_touch on services;
create trigger trg_services_touch
before update on services
for each row execute function set_updated_at();

create or replace function normalize_clients()
returns trigger
language plpgsql
as $$
begin
  new.phone_number := coalesce(new.phone_number, new.phone);
  new.phone := coalesce(new.phone, new.phone_number);
  new.status := coalesce(new.status, 'active');
  return new;
end;
$$;

drop trigger if exists trg_clients_scope on clients;
create trigger trg_clients_scope
before insert or update on clients
for each row execute function sync_business_scope();

drop trigger if exists trg_clients_normalize on clients;
create trigger trg_clients_normalize
before insert or update on clients
for each row execute function normalize_clients();

drop trigger if exists trg_clients_touch on clients;
create trigger trg_clients_touch
before update on clients
for each row execute function set_updated_at();

create or replace function normalize_working_hours()
returns trigger
language plpgsql
as $$
begin
  new.is_active := coalesce(new.is_active, true);
  return new;
end;
$$;

drop trigger if exists trg_working_hours_scope on working_hours;
create trigger trg_working_hours_scope
before insert or update on working_hours
for each row execute function sync_business_scope();

drop trigger if exists trg_working_hours_normalize on working_hours;
create trigger trg_working_hours_normalize
before insert or update on working_hours
for each row execute function normalize_working_hours();

drop trigger if exists trg_working_hours_touch on working_hours;
create trigger trg_working_hours_touch
before update on working_hours
for each row execute function set_updated_at();

create or replace function normalize_employees()
returns trigger
language plpgsql
as $$
begin
  new.active := coalesce(new.active, true);
  return new;
end;
$$;

drop trigger if exists trg_employees_scope on employees;
create trigger trg_employees_scope
before insert or update on employees
for each row execute function sync_business_scope();

drop trigger if exists trg_employees_normalize on employees;
create trigger trg_employees_normalize
before insert or update on employees
for each row execute function normalize_employees();

drop trigger if exists trg_employees_touch on employees;
create trigger trg_employees_touch
before update on employees
for each row execute function set_updated_at();

create or replace function normalize_appointments()
returns trigger
language plpgsql
as $$
begin
  new.scheduled_at := coalesce(new.scheduled_at, new.start_time);
  new.start_time := coalesce(new.start_time, new.scheduled_at);
  if new.date is null and coalesce(new.scheduled_at, new.start_time) is not null then
    new.date := coalesce(new.scheduled_at, new.start_time)::date;
  end if;
  new.status := coalesce(new.status, 'scheduled');
  return new;
end;
$$;

drop trigger if exists trg_appointments_scope on appointments;
create trigger trg_appointments_scope
before insert or update on appointments
for each row execute function sync_business_scope();

drop trigger if exists trg_appointments_normalize on appointments;
create trigger trg_appointments_normalize
before insert or update on appointments
for each row execute function normalize_appointments();

drop trigger if exists trg_appointments_touch on appointments;
create trigger trg_appointments_touch
before update on appointments
for each row execute function set_updated_at();

create or replace function normalize_crm_leads()
returns trigger
language plpgsql
as $$
begin
  new.client_phone := coalesce(new.client_phone, new.phone);
  new.phone := coalesce(new.phone, new.client_phone);
  new.client_name := coalesce(new.client_name, new.name);
  new.name := coalesce(new.name, new.client_name);
  new.kanban_stage := coalesce(new.kanban_stage, new.status, 'new');
  new.status := coalesce(new.status, new.kanban_stage, 'new');
  new.lead_source := coalesce(new.lead_source, new.source, 'whatsapp');
  new.source := coalesce(new.source, new.lead_source);
  new.funnel_stage := coalesce(new.funnel_stage, new.kanban_stage, new.status, 'new');
  new.is_ai_muted := coalesce(new.is_ai_muted, not coalesce(new.ai_enabled, true));
  new.ai_enabled := coalesce(new.ai_enabled, not coalesce(new.is_ai_muted, false));
  new.tags := coalesce(new.tags, '[]'::jsonb);
  new.metadata := coalesce(new.metadata, '{}'::jsonb);
  new.messages_sent := coalesce(new.messages_sent, 0);
  new.messages_received := coalesce(new.messages_received, 0);
  new.response_rate := coalesce(new.response_rate, 0);
  new.interest_score := coalesce(new.interest_score, 0);
  new.followup_count := coalesce(new.followup_count, 0);
  new.status := coalesce(new.status, 'new');
  new.kanban_stage := coalesce(new.kanban_stage, new.status);
  new.lead_source := coalesce(new.lead_source, 'whatsapp');
  if new.last_status_change is null then
    new.last_status_change := coalesce(new.updated_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_crm_leads_scope on crm_leads;
create trigger trg_crm_leads_scope
before insert or update on crm_leads
for each row execute function sync_business_scope();

drop trigger if exists trg_crm_leads_normalize on crm_leads;
create trigger trg_crm_leads_normalize
before insert or update on crm_leads
for each row execute function normalize_crm_leads();

drop trigger if exists trg_crm_leads_touch on crm_leads;
create trigger trg_crm_leads_touch
before update on crm_leads
for each row execute function set_updated_at();

create or replace function normalize_crm_messages()
returns trigger
language plpgsql
as $$
begin
  new.client_phone := coalesce(new.client_phone, new.phone);
  new.phone := coalesce(new.phone, new.client_phone);
  new.sender_type := coalesce(new.sender_type, new.sender, new.role, 'user');
  new.sender := coalesce(new.sender, new.sender_type);
  new.role := coalesce(new.role, new.sender_type);
  new.content := coalesce(new.content, new.message, new.response);
  new.message := coalesce(new.message, new.content);
  new.direction := coalesce(new.direction, case when new.sender_type in ('assistant', 'system') then 'outbound' else 'inbound' end);
  new.status := coalesce(new.status, 'received');
  new.metadata := coalesce(new.metadata, '{}'::jsonb);
  new.remote_jid := coalesce(new.remote_jid, new.phone);
  return new;
end;
$$;

alter table if exists crm_messages add column if not exists remote_jid text;

drop trigger if exists trg_crm_messages_scope on crm_messages;
create trigger trg_crm_messages_scope
before insert or update on crm_messages
for each row execute function sync_business_scope();

drop trigger if exists trg_crm_messages_normalize on crm_messages;
create trigger trg_crm_messages_normalize
before insert or update on crm_messages
for each row execute function normalize_crm_messages();

drop trigger if exists trg_crm_messages_touch on crm_messages;
create trigger trg_crm_messages_touch
before update on crm_messages
for each row execute function set_updated_at();

create or replace function normalize_chat_memory()
returns trigger
language plpgsql
as $$
begin
  new.message_role := coalesce(new.message_role, new.role);
  new.role := coalesce(new.role, new.message_role);
  new.message_content := coalesce(new.message_content, new.message);
  new.message := coalesce(new.message, new.message_content);
  new.remote_jid := coalesce(new.remote_jid, new.phone);
  return new;
end;
$$;

drop trigger if exists trg_chat_memory_scope on chat_memory;
create trigger trg_chat_memory_scope
before insert or update on chat_memory
for each row execute function sync_business_scope();

drop trigger if exists trg_chat_memory_normalize on chat_memory;
create trigger trg_chat_memory_normalize
before insert or update on chat_memory
for each row execute function normalize_chat_memory();

drop trigger if exists trg_chat_memory_touch on chat_memory;
create trigger trg_chat_memory_touch
before update on chat_memory
for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- RLS and grants for the core runtime tables
-- ------------------------------------------------------------

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table tenant_memberships enable row level security;
alter table agente_config enable row level security;
alter table whatsapp_instances enable row level security;
alter table barbers enable row level security;
alter table services enable row level security;
alter table clients enable row level security;
alter table working_hours enable row level security;
alter table employees enable row level security;
alter table appointments enable row level security;
alter table crm_leads enable row level security;
alter table crm_messages enable row level security;
alter table chat_memory enable row level security;
alter table notifications enable row level security;

drop policy if exists tenants_select on tenants;
create policy tenants_select on tenants
for select to authenticated
using (owner_user_id = auth.uid() or can_access_tenant(id));

drop policy if exists tenants_insert on tenants;
create policy tenants_insert on tenants
for insert to authenticated
with check (owner_user_id = auth.uid() or owner_user_id is null);

drop policy if exists tenants_update on tenants;
create policy tenants_update on tenants
for update to authenticated
using (owner_user_id = auth.uid() or can_access_tenant(id))
with check (owner_user_id = auth.uid() or can_access_tenant(id));

drop policy if exists tenants_delete on tenants;
create policy tenants_delete on tenants
for delete to authenticated
using (owner_user_id = auth.uid() or can_access_tenant(id));

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists tenant_memberships_select on tenant_memberships;
create policy tenant_memberships_select on tenant_memberships
for select to authenticated
using (user_id = auth.uid() or can_access_tenant(tenant_id));

drop policy if exists tenant_memberships_insert on tenant_memberships;
create policy tenant_memberships_insert on tenant_memberships
for insert to authenticated
with check (can_access_tenant(tenant_id));

drop policy if exists tenant_memberships_update on tenant_memberships;
create policy tenant_memberships_update on tenant_memberships
for update to authenticated
using (user_id = auth.uid() or can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists tenant_memberships_delete on tenant_memberships;
create policy tenant_memberships_delete on tenant_memberships
for delete to authenticated
using (can_access_tenant(tenant_id));

drop policy if exists agente_config_select on agente_config;
create policy agente_config_select on agente_config
for select to authenticated
using (can_access_tenant(tenant_id));

drop policy if exists agente_config_write on agente_config;
create policy agente_config_write on agente_config
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists whatsapp_instances_select on whatsapp_instances;
create policy whatsapp_instances_select on whatsapp_instances
for select to authenticated
using (can_access_tenant(tenant_id));

drop policy if exists whatsapp_instances_write on whatsapp_instances;
create policy whatsapp_instances_write on whatsapp_instances
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists barbers_access on barbers;
create policy barbers_access on barbers
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists services_access on services;
create policy services_access on services
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists clients_access on clients;
create policy clients_access on clients
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists working_hours_access on working_hours;
create policy working_hours_access on working_hours
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists employees_access on employees;
create policy employees_access on employees
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists appointments_access on appointments;
create policy appointments_access on appointments
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists crm_leads_access on crm_leads;
create policy crm_leads_access on crm_leads
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists crm_messages_access on crm_messages;
create policy crm_messages_access on crm_messages
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists chat_memory_access on chat_memory;
create policy chat_memory_access on chat_memory
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

drop policy if exists notifications_access on notifications;
create policy notifications_access on notifications
for all to authenticated
using (can_access_tenant(tenant_id))
with check (can_access_tenant(tenant_id));

grant select, insert, update, delete on
  tenants,
  profiles,
  tenant_memberships,
  agente_config,
  whatsapp_instances,
  barbers,
  services,
  clients,
  working_hours,
  employees,
  appointments,
  crm_leads,
  crm_messages,
  chat_memory,
  notifications
to authenticated;

grant select on
  plans,
  theme_presets
to anon, authenticated;

grant select on
  leads,
  messages,
  agents_config,
  whatsapp_connections,
  chat_memoria_v4,
  crm_leads_with_last_message,
  crm_prospection_summary,
  crm_prospection_funnel,
  crm_leads_needs_followup
to authenticated;

comment on table crm_leads is 'Canonical CRM lead table with legacy aliases for the Python backend and site docs.';
comment on table crm_messages is 'Canonical CRM message table with legacy aliases for the Python backend and site docs.';
comment on table agente_config is 'Canonical barber/AI configuration table.';
comment on table whatsapp_instances is 'Evolution API instance registry used by the Python tenant resolver.';
comment on view leads is 'Legacy alias for crm_leads.';
comment on view messages is 'Legacy alias for crm_messages.';
comment on view agents_config is 'Legacy alias for agente_config.';
comment on view chat_memoria_v4 is 'Legacy alias for chat_memory.';
comment on view whatsapp_connections is 'SaaS-facing view over whatsapp_instances.';
