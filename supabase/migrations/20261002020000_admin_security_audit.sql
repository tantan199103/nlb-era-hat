-- Admin/RLS hardening and tamper-resistant audit trail.
--
-- This migration is additive.  It closes two privilege-escalation paths that
-- are easy to miss in a browser-only Supabase app (self-promoting a profile
-- to admin and creating a customer order that already claims to be paid),
-- then moves audit writes behind a SECURITY DEFINER trigger.  The service
-- role remains available to trusted import/search workers; browser clients
-- cannot forge actor_id or audit snapshots.

-- Profiles are customer-editable for display preferences, but role, loyalty
-- tier, points and joined year are administrator-owned fields.  The trigger
-- also protects INSERT, because an RLS WITH CHECK on id alone does not stop a
-- user from inserting their own row with role = 'admin'.
alter table public.profiles
  alter column tier set default 'Rookie Collector';

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Service-role jobs are trusted server-side workers and may provision or
  -- reconcile profiles.  Browser JWTs must go through the checks below.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if public.is_store_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'customer';
    new.tier := 'Rookie Collector';
    new.points := 0;
    new.joined_year := extract(year from now())::integer;
  else
    new.role := old.role;
    new.tier := old.tier;
    new.points := old.points;
    new.joined_year := old.joined_year;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_privileged_fields() from public;
drop trigger if exists profiles_protect_privileged_fields on public.profiles;
create trigger profiles_protect_privileged_fields
before insert or update of role, tier, points, joined_year on public.profiles
for each row execute function public.protect_profile_privileged_fields();

-- A browser may create a checkout placeholder, but it cannot claim that the
-- order has already been paid/shipped or attach a tracking number.  Payment
-- and fulfilment transitions belong to the trusted payment/admin path.
drop policy if exists "Guests and users can create orders" on public.orders;
create policy "Guests and users can create orders"
on public.orders
for insert
with check (
  (user_id is null or auth.uid() = user_id)
  and status = 'pending'
  and tracking_number is null
);

drop policy if exists "Guests and users can create order items" on public.order_items;
create policy "Guests and users can create order items"
on public.order_items
for insert
with check (exists (
  select 1
  from public.orders o
  where o.id = order_items.order_id
    and o.status = 'pending'
    and (o.user_id is null or o.user_id = auth.uid())
));

-- Stamp the authenticated admin who verifies a 1688 match.  The API already
-- supplies checked_at; this trigger supplies the actor consistently even if a
-- future admin screen forgets to send checked_by.
create or replace function public.stamp_1688_verification_actor()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed boolean := false;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    changed := true;
  else
    changed := new.source_1688_status is distinct from old.source_1688_status
      or new.source_1688_url is distinct from old.source_1688_url
      or new.source_1688_title is distinct from old.source_1688_title
      or new.source_1688_image_url is distinct from old.source_1688_image_url
      or new.source_1688_score is distinct from old.source_1688_score
      or new.source_1688_note is distinct from old.source_1688_note;
  end if;

  if changed and auth.uid() is not null and public.is_store_admin() then
    new.source_1688_checked_by := auth.uid();
    new.source_1688_checked_at := coalesce(new.source_1688_checked_at, now());
  end if;
  return new;
end;
$$;

revoke all on function public.stamp_1688_verification_actor() from public;
drop trigger if exists products_stamp_1688_verification_actor on public.products;
create trigger products_stamp_1688_verification_actor
before insert or update of source_1688_status, source_1688_url,
  source_1688_title, source_1688_image_url, source_1688_score, source_1688_note
on public.products
for each row execute function public.stamp_1688_verification_actor();

-- Audit events are written only for authenticated store-admin mutations.  A
-- full old/new snapshot makes order fulfilment and 1688 decisions reviewable;
-- the table remains admin-readable under RLS.  Service-role imports are not
-- attributed to a browser user and remain represented by their own queue
-- records, so bulk syncs do not flood this audit table.
create or replace function public.capture_admin_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid;
  old_snapshot jsonb;
  new_snapshot jsonb;
  entity_id text;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  actor := auth.uid();
  if actor is null or not public.is_store_admin() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    old_snapshot := to_jsonb(old);
    new_snapshot := null;
    entity_id := coalesce(old_snapshot ->> 'id', '');
  elsif tg_op = 'INSERT' then
    old_snapshot := null;
    new_snapshot := to_jsonb(new);
    entity_id := coalesce(new_snapshot ->> 'id', '');
  else
    old_snapshot := to_jsonb(old);
    new_snapshot := to_jsonb(new);
    entity_id := coalesce(new_snapshot ->> 'id', old_snapshot ->> 'id', '');
  end if;

  insert into public.admin_audit_log (actor_id, entity_type, entity_id, action, snapshot)
  values (
    actor,
    upper(tg_table_name),
    entity_id,
    'ADMIN_' || tg_op,
    jsonb_build_object('old', old_snapshot, 'new', new_snapshot)
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.capture_admin_audit_event() from public;

drop trigger if exists products_capture_admin_audit on public.products;
create trigger products_capture_admin_audit
after insert or update or delete on public.products
for each row execute function public.capture_admin_audit_event();

drop trigger if exists product_variants_capture_admin_audit on public.product_variants;
create trigger product_variants_capture_admin_audit
after insert or update or delete on public.product_variants
for each row execute function public.capture_admin_audit_event();

drop trigger if exists orders_capture_admin_audit on public.orders;
create trigger orders_capture_admin_audit
after insert or update or delete on public.orders
for each row execute function public.capture_admin_audit_event();

drop trigger if exists profiles_capture_admin_audit on public.profiles;
create trigger profiles_capture_admin_audit
after insert or update or delete on public.profiles
for each row execute function public.capture_admin_audit_event();

drop trigger if exists source_1688_runs_capture_admin_audit on public.source_1688_search_runs;
create trigger source_1688_runs_capture_admin_audit
after insert or update or delete on public.source_1688_search_runs
for each row execute function public.capture_admin_audit_event();

drop trigger if exists store_menus_capture_admin_audit on public.store_menus;
create trigger store_menus_capture_admin_audit
after insert or update or delete on public.store_menus
for each row execute function public.capture_admin_audit_event();

drop trigger if exists store_menu_items_capture_admin_audit on public.store_menu_items;
create trigger store_menu_items_capture_admin_audit
after insert or update or delete on public.store_menu_items
for each row execute function public.capture_admin_audit_event();

drop trigger if exists store_collections_capture_admin_audit on public.store_collections;
create trigger store_collections_capture_admin_audit
after insert or update or delete on public.store_collections
for each row execute function public.capture_admin_audit_event();

drop trigger if exists store_collection_products_capture_admin_audit on public.store_collection_products;
create trigger store_collection_products_capture_admin_audit
after insert or update or delete on public.store_collection_products
for each row execute function public.capture_admin_audit_event();

drop trigger if exists store_settings_capture_admin_audit on public.store_settings;
create trigger store_settings_capture_admin_audit
after insert or update or delete on public.store_settings
for each row execute function public.capture_admin_audit_event();

-- The trigger function is the only browser write path.  Do not let a client
-- spoof actor_id, entity_id, action or snapshots through direct INSERTs.
revoke insert, update, delete on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;
