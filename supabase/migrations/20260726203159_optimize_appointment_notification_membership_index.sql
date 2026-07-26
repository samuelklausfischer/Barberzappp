-- Cover the composite membership foreign key used by notification cleanup.
drop index if exists public.appointment_notifications_tenant_idx;

create index if not exists appointment_notifications_membership_idx
  on public.appointment_notifications (tenant_id, recipient_user_id);
