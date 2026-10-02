-- 1688 source-verification gate for the public hat catalog.
-- A listing can only be active when an administrator has confirmed a
-- corresponding 1688 source listing. Products that have not been checked are
-- retained for review but are hidden from the storefront.

alter table public.products
  add column if not exists source_1688_status text not null default 'PENDING';

alter table public.products
  add column if not exists source_1688_url text;

alter table public.products
  add column if not exists source_1688_title text;

alter table public.products
  add column if not exists source_1688_image_url text;

alter table public.products
  add column if not exists source_1688_score numeric(5,2);

alter table public.products
  add column if not exists source_1688_checked_at timestamptz;

alter table public.products
  add column if not exists source_1688_checked_by uuid references auth.users(id) on delete set null;

alter table public.products
  add column if not exists source_1688_note text;

alter table public.products drop constraint if exists products_source_1688_status_check;
alter table public.products
  add constraint products_source_1688_status_check
  check (source_1688_status in ('PENDING', 'MATCHED', 'NOT_FOUND', 'REVIEW'));

alter table public.products drop constraint if exists products_source_1688_score_check;
alter table public.products
  add constraint products_source_1688_score_check
  check (source_1688_score is null or (source_1688_score >= 0 and source_1688_score <= 100));

alter table public.products drop constraint if exists products_source_1688_match_url_check;
alter table public.products
  add constraint products_source_1688_match_url_check
  check (source_1688_status <> 'MATCHED' or nullif(trim(source_1688_url), '') is not null);

create index if not exists products_source_1688_status_idx
  on public.products(source_1688_status, is_active);

-- Existing rows are intentionally put into the review queue. This is a
-- one-time safe backfill: the product rows and their variants remain intact.
update public.products
set is_active = false
where source_1688_status <> 'MATCHED' or source_1688_status is null;

create or replace function public.enforce_1688_source_gate()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.source_1688_status, 'PENDING') <> 'MATCHED' then
    new.is_active := false;
  end if;
  return new;
end;
$$;

drop trigger if exists products_enforce_1688_source_gate on public.products;
create trigger products_enforce_1688_source_gate
before insert or update of source_1688_status, is_active on public.products
for each row execute function public.enforce_1688_source_gate();

drop policy if exists "Anyone can read active products" on public.products;
drop policy if exists "Anyone can read verified active products" on public.products;
create policy "Anyone can read verified active products" on public.products
for select using (is_active = true and source_1688_status = 'MATCHED');
